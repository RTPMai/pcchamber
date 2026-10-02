/* ==========================================================================
   MEMBER SIGN IN

   A member signs in with their email address and a password of their own.

   WHAT EMAIL IS STILL FOR

   Setting the first password, and resetting a forgotten one. There is no
   way round this: a password system that cannot email you is one where a
   forgotten password means ringing the chamber. So the chamber never sets
   and never sees anybody's password. The member gets a link and chooses it.

   WHERE PASSWORDS ARE KEPT

   Hashed, in the key-value store, not in the repository. See
   api/_lib/store.js for why that distinction matters.

   WHAT YOU MUST SET IN VERCEL

     MEMBER_SECRET      32 or more characters of random text. Signs the
                        sessions and the setup links. Changing it signs
                        everybody out, which is how you revoke everything
                        at once in an emergency.
     KV_REST_API_URL    both set for you when you add Upstash Redis
     KV_REST_API_TOKEN  from the Vercel marketplace
     RESEND_API_KEY     from resend.com, for setup and reset emails
     MEMBER_EMAIL_FROM  the address those come from

   Until they are set, the endpoint names the ones that are missing.

   WHO CAN SIGN IN

   Each member in content/members.json can carry an "access" list of email
   addresses. Anybody on that list can hold a password for that business.
   Deliberately separate from the public contact address, because a business
   has several people in it and the address on a directory page is usually a
   shared inbox nobody reads.

   With no access list, the public contact address is accepted, so this
   works before anything has been filled in.

   THE OWNER, AND ADDING PEOPLE

   The first address on the list is the owner. The owner can add and remove
   the others from their account page, without asking the chamber. Everybody
   else on the list can see who has access but cannot change it. The admin
   can still edit the list directly, and reordering it changes the owner.

   Each change is a commit to content/members.json with the business name
   on it, the same audit trail as listing edits. The new person gets an
   invite link that lasts seven days rather than thirty minutes, because an
   invite sits in an inbox until somebody gets round to it.

   One address belongs to one business. Adding an address that already
   signs in somewhere else is refused, because sign in has to know which
   business an address means.

   Removing somebody deletes their password, so they cannot sign in again,
   and ends any session they have open within a few minutes of the site
   rebuilding.

   THE TEST SIGN IN

   Setting DEMO_MEMBER lets one made-up sign in work without Upstash, without
   Resend, and without anybody having set a password. It is for trying the
   member area before the real services are connected.

       DEMO_MEMBER = arcadia:somethinglongenough

   The part before the colon is a member slug from the directory. The part
   after is the password that will work.

   THREE THINGS STOP THIS BECOMING A BACKDOOR

   It only works on preview and development deployments. On production it is
   ignored, unless DEMO_MEMBER_ALLOW_PRODUCTION is also set to yes, which
   nobody does by accident.

   While it is on, the member area shows a red banner saying so, and /setup/
   reports it as a problem. It cannot be quietly left running.

   And it is one hard-coded pair, not a skip. A wrong password still fails.

   Delete DEMO_MEMBER when you are done. That is the whole cleanup.

   LOCKOUT

   Five wrong passwords for one address and it stops accepting them for
   fifteen minutes. The count expires on its own, so nobody has to unlock
   anything by hand. This is only possible because there is somewhere to
   keep the count; it could not be done with signed cookies alone.
   ========================================================================== */

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { kvGet, kvSet, kvDel, kvBump, storeReady, storeMissing } from './_lib/store.js';
import { hash, matches, checkStrength, wasteTime, MIN_LENGTH } from './_lib/passwords.js';
import { readContent, updateContent, ghMissing } from './_lib/github.js';
import { sendMail, mailMissing } from './_lib/mail.js';
import { BENEFITS, TIER_NAMES, summarize, describe, thisYear, yearOf } from '../data/benefits.js';
import { statsFor } from './_lib/stats.js';

const COOKIE = 'pcc_member';
const DEMO_DAYS = 1;
const SESSION_DAYS = 30;
const LINK_MINUTES = 30;
const MAX_TRIES = 5;
const LOCK_MINUTES = 15;
const INVITE_DAYS = 7;
const MAX_PEOPLE = 10;          // per business, owner included
const INVITES_PER_DAY = 20;     // per business, so the form cannot be used to spam
/* A session for an address the deployed roster does not know yet is
   allowed this long. Covers the minute or two between somebody being
   invited and the site rebuilding with them on it. */
const GRACE_MINUTES = 15;

/* ---------- the roster ---------------------------------------------------- */

let roster = null;
function members() {
  if (roster) return roster;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), 'content', 'members.json'),
    path.join(here, '..', 'content', 'members.json'),
    path.join(here, '_data', 'members.json')
  ];
  const tried = [];
  for (const file of candidates) {
    try {
      roster = JSON.parse(readFileSync(file, 'utf8')).members;
      return roster;
    } catch (err) { tried.push(`${file} (${err.code || err.message})`); }
  }
  throw new Error('Could not read the member roster. Tried:\n' + tried.join('\n'));
}

const tidy = e => String(e || '').trim().toLowerCase();

function addressesFor(m) {
  const list = Array.isArray(m.access) && m.access.length
    ? m.access
    : [m.contact && m.contact.email].filter(Boolean);
  return list.map(tidy);
}

const findByEmail = email => {
  const wanted = tidy(email);
  return wanted ? (members().find(m => addressesFor(m).includes(wanted)) || null) : null;
};

/* One password per address rather than per business, so two people at the
   same business do not share one and cannot lock each other out. */
const pwKey = email => `pw:${tidy(email)}`;
const tryKey = email => `try:${tidy(email)}`;

/* ---------- the test sign in ---------------------------------------------- */

/* Off unless DEMO_MEMBER is set, and off on production even then unless
   somebody has also said so explicitly. VERCEL_ENV is set by the platform
   and is not something a request can influence. */
function demoConfig() {
  const raw = (process.env.DEMO_MEMBER || '').trim();
  if (!raw) return null;

  const onProduction = (process.env.VERCEL_ENV || '').trim() === 'production';
  const allowed = (process.env.DEMO_MEMBER_ALLOW_PRODUCTION || '').trim().toLowerCase() === 'yes';
  if (onProduction && !allowed) return null;

  const at = raw.indexOf(':');
  if (at < 1 || at === raw.length - 1) return null;

  return { slug: raw.slice(0, at).trim(), password: raw.slice(at + 1) };
}

export const demoOn = () => Boolean(demoConfig());

/* ---------- signing ------------------------------------------------------- */

const b64 = s => Buffer.from(s).toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url').toString('utf8');

function sign(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${createHmac('sha256', process.env.MEMBER_SECRET).update(body).digest('base64url')}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = createHmac('sha256', process.env.MEMBER_SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac || ''), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(unb64(body)); } catch { return null; }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function currentMember(req) {
  return (currentSession(req) || {}).member || null;
}

/* The member and the address that signed in. A session whose address has
   been taken off the business stops working once the site has rebuilt
   without it, rather than running on for the rest of its 30 days. */
function currentSession(req) {
  const payload = verify(readCookie(req, COOKIE));
  if (!payload || payload.kind !== 'session') return null;
  const member = members().find(m => m.slug === payload.slug);
  if (!member) return null;

  if (!payload.demo) {
    const issued = payload.iat || (payload.exp - SESSION_DAYS * 24 * 60 * 60 * 1000);
    const fresh = Date.now() - issued < GRACE_MINUTES * 60 * 1000;
    if (!fresh && !addressesFor(member).includes(tidy(payload.email))) return null;
  }
  return { member, email: tidy(payload.email), demo: Boolean(payload.demo) };
}

function setSession(res, member, email) {
  const token = sign({
    kind: 'session',
    slug: member.slug,
    email: tidy(email),
    iat: Date.now(),
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  });
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`);
}

/* ---------- email --------------------------------------------------------- */

async function sendSetupLink(email, link, memberName, isReset) {
  const text = [
    isReset
      ? 'Somebody asked to reset the password for your Polk City Area Chamber sign in.'
      : 'Here is the link to choose a password for your Polk City Area Chamber sign in.',
    '',
    link,
    '',
    `It works for the next ${LINK_MINUTES} minutes and sets the password for ${memberName}.`,
    '',
    isReset
      ? 'If you did not ask for this, ignore it. Your current password still works and nobody can change it without this link.'
      : 'Nobody at the chamber can see your password, now or later.',
    '',
    'Polk City Area Chamber of Commerce'
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(process.env.RESEND_API_KEY || '').trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: (process.env.MEMBER_EMAIL_FROM || '').trim(),
      to: [email],
      subject: isReset ? 'Reset your chamber password' : 'Choose your chamber password',
      text
    })
  });

  if (!res.ok) {
    throw Object.assign(new Error('The email could not be sent.'), { status: 502, detail: await res.text() });
  }
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

/* ---------- the team ------------------------------------------------------ */

const looksLikeEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;

/* The live roster, straight from GitHub, so a change shows up the moment it
   is saved rather than after the rebuild. Falls back to the deployed copy
   when GitHub is not connected. */
async function liveMembers() {
  if (ghMissing().length) return members();
  const { data } = await readContent('members.json');
  return data.members || [];
}

async function stillHasAccess(slug, email) {
  const wanted = tidy(email);
  const deployed = members().find(m => m.slug === slug);
  if (deployed && addressesFor(deployed).includes(wanted)) return true;
  if (ghMissing().length) return false;
  const live = (await liveMembers()).find(m => m.slug === slug);
  return Boolean(live && addressesFor(live).includes(wanted));
}

function inviteLink(req, member, email) {
  return `${origin(req)}/api/member?token=${encodeURIComponent(sign({
    kind: 'setup',
    slug: member.slug,
    email: tidy(email),
    exp: Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000,
    n: randomBytes(6).toString('hex')
  }))}`;
}

async function sendInvite(req, member, email, from) {
  const used = await kvBump(`invites:${member.slug}`, 24 * 60 * 60);
  if (used > INVITES_PER_DAY) {
    throw Object.assign(new Error('That is a lot of invites for one day. Try again tomorrow.'), { status: 429 });
  }
  await sendMail({
    to: email,
    subject: `You have been added to ${member.name} on the Polk City Area Chamber site`,
    text: [
      `${from} added you to the chamber member account for ${member.name}.`,
      '',
      'Use this link to choose a password:',
      '',
      inviteLink(req, member, email),
      '',
      `It works for the next ${INVITE_DAYS} days. After that, go to the member sign in page and ask for a new link with this address.`,
      '',
      'Once you are in you can edit the business listing, post deals, see member benefits, and use the Business Policy Center.',
      '',
      'Nobody at the chamber can see your password, now or later.',
      '',
      'Polk City Area Chamber of Commerce'
    ].join('\n')
  });
}

/* list can be passed in right after a save, because GitHub can hand back
   the previous version of the file for a few seconds afterwards. */
async function teamFor(member, me, list) {
  if (!list) {
    const live = (await liveMembers()).find(m => m.slug === member.slug) || member;
    list = addressesFor(live);
  }
  const owner = list[0] || null;
  const people = await Promise.all(list.map(async email => ({
    email,
    owner: email === owner,
    you: email === me,
    active: Boolean(await kvGet(pwKey(email)))
  })));
  return { owner, canManage: Boolean(me && me === owner), people, max: MAX_PEOPLE };
}

/* Only the owner, checked against the live file, so an owner change made
   in the admin takes effect straight away. */
async function requireOwner(session) {
  const live = (await liveMembers()).find(m => m.slug === session.member.slug);
  if (!live) throw Object.assign(new Error('That listing is no longer in the directory.'), { status: 404 });
  if (addressesFor(live)[0] !== session.email) {
    throw Object.assign(new Error('Only the account owner can change who has access.'), { status: 403 });
  }
  return live;
}

/* ---------- handler ------------------------------------------------------- */

export default async function handler(req, res) {
  try {
    const secret = process.env.MEMBER_SECRET;
    if (!secret || secret.length < 32) {
      res.status(503).json({
        error: 'not_configured',
        message: secret
          ? 'MEMBER_SECRET is too short. It needs at least 32 characters of random text.'
          : 'Member sign in is not set up. MEMBER_SECRET is missing from the Vercel project settings.'
      });
      return;
    }

    const demo = demoConfig();

    /* Checked before the store, because the point of the test sign in is
       to work before any of that has been set up. */
    if (!storeReady() && !demo) {
      res.status(503).json({
        error: 'not_configured',
        message: `Passwords have nowhere to live yet. Add Upstash Redis from the Vercel marketplace, which sets ${storeMissing().join(' and ')}.`
      });
      return;
    }

    /* Clicking a setup or reset link. Hands the token to the page that
       asks for the new password. */
    if (req.method === 'GET') {
      const token = (req.query && req.query.token) || '';
      const payload = verify(token);
      if (!payload || payload.kind !== 'setup') {
        res.writeHead(302, { Location: '/members/?problem=expired' });
        res.end();
        return;
      }
      res.writeHead(302, { Location: `/members/password/?token=${encodeURIComponent(token)}` });
      res.end();
      return;
    }

    const body = await readBody(req);

    switch (body.action) {

      case 'whoami': {
        const m = currentMember(req);
        res.status(200).json({
          ...(m ? { signedIn: true, slug: m.slug, name: m.name } : { signedIn: false }),
          /* So the page can show a banner. If this is ever true on the
             live site, something has been left switched on. */
          demo: Boolean(demo)
        });
        return;
      }

      case 'signout': {
        res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
        res.status(200).json({ ok: true });
        return;
      }

      case 'signin': {
        const email = tidy(body.email);
        const password = String(body.password || '');

        /* The test sign in. One pair, checked in constant time, no store
           and no email. A wrong password still fails. */
        if (demo) {
          const member = members().find(m => m.slug === demo.slug);
          if (!member) {
            res.status(500).json({
              error: 'bad_demo',
              message: `DEMO_MEMBER names "${demo.slug}", which is not a slug in the member directory.`
            });
            return;
          }

          const a = Buffer.from(password);
          const b = Buffer.from(demo.password);
          const ok = a.length === b.length && timingSafeEqual(a, b);

          if (!ok) {
            await wasteTime();
            res.status(401).json({ error: 'no', message: 'That is not the test password.' });
            return;
          }

          const token = sign({
            kind: 'session', slug: member.slug, email: email || 'demo', demo: true,
            exp: Date.now() + DEMO_DAYS * 24 * 60 * 60 * 1000
          });
          res.setHeader('Set-Cookie',
            `${COOKIE}=${token}; Path=/; Max-Age=${DEMO_DAYS * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`);
          res.status(200).json({ ok: true, name: member.name, slug: member.slug, demo: true });
          return;
        }

        const tries = Number(await kvGet(tryKey(email))) || 0;
        if (tries >= MAX_TRIES) {
          res.status(429).json({
            error: 'locked_out',
            message: `Too many wrong passwords for that address. Try again in ${LOCK_MINUTES} minutes, or reset your password below.`
          });
          return;
        }

        const member = findByEmail(email);
        const stored = member ? await kvGet(pwKey(email)) : null;

        /* The same work happens whether or not the address exists, so the
           response time does not reveal which addresses are on the roster. */
        if (!member || !stored) {
          await wasteTime();
          await kvBump(tryKey(email), LOCK_MINUTES * 60);
          res.status(401).json({
            error: 'no',
            message: 'That email and password do not match. If you have not set a password yet, use the link below.'
          });
          return;
        }

        if (!(await matches(password, stored))) {
          const n = await kvBump(tryKey(email), LOCK_MINUTES * 60);
          res.status(401).json({
            error: 'no',
            message: n >= MAX_TRIES
              ? `That is not right, and that was the last attempt. Try again in ${LOCK_MINUTES} minutes, or reset your password.`
              : 'That email and password do not match.'
          });
          return;
        }

        await kvDel(tryKey(email));
        setSession(res, member, email);
        res.status(200).json({ ok: true, name: member.name, slug: member.slug });
        return;
      }

      case 'setup': {
        if (!process.env.RESEND_API_KEY || !process.env.MEMBER_EMAIL_FROM) {
          const missing = [
            !process.env.RESEND_API_KEY && 'RESEND_API_KEY',
            !process.env.MEMBER_EMAIL_FROM && 'MEMBER_EMAIL_FROM'
          ].filter(Boolean);
          res.status(503).json({
            error: 'not_configured',
            message: `Setup emails cannot be sent yet. Missing in the Vercel project settings: ${missing.join(', ')}.`
          });
          return;
        }

        const email = tidy(body.email);
        const member = findByEmail(email);

        /* An identical answer either way, so this cannot be used to work
           out who is a chamber member and who is not. */
        const reply = () => res.status(200).json({
          ok: true,
          message: 'If that address is on the member roster, a link is on its way. It will arrive within a minute or two and works for 30 minutes.'
        });

        await new Promise(r => setTimeout(r, 400));
        if (!member) { reply(); return; }

        const existing = await kvGet(pwKey(email));
        const link = `${origin(req)}/api/member?token=${encodeURIComponent(sign({
          kind: 'setup',
          slug: member.slug,
          email,
          exp: Date.now() + LINK_MINUTES * 60 * 1000,
          n: randomBytes(6).toString('hex')
        }))}`;

        await sendSetupLink(email, link, member.name, Boolean(existing));
        reply();
        return;
      }

      case 'setpassword': {
        const payload = verify(body.token);
        if (!payload || payload.kind !== 'setup') {
          res.status(401).json({
            error: 'expired',
            message: 'That link has expired. Links last 30 minutes. Ask for a new one.'
          });
          return;
        }

        const member = members().find(m => m.slug === payload.slug);
        if (!member) {
          res.status(400).json({ error: 'gone', message: 'That membership is no longer on the roster.' });
          return;
        }

        /* An invite can be up to a week old, so check the address is still
           on the business. The deployed roster first; if it is not there,
           the live file, because somebody invited a minute ago is not in
           the deployed copy yet. */
        if (!(await stillHasAccess(member.slug, payload.email))) {
          res.status(403).json({
            error: 'removed',
            message: 'That address no longer has access to this business. Ask whoever manages your chamber sign in.'
          });
          return;
        }

        const problem = checkStrength(body.password, member.name);
        if (problem) {
          res.status(400).json({ error: 'weak', message: problem });
          return;
        }

        await kvSet(pwKey(payload.email), await hash(body.password));
        await kvDel(tryKey(payload.email));

        setSession(res, member, payload.email);
        res.status(200).json({ ok: true, name: member.name, slug: member.slug });
        return;
      }

      /* What their level includes and what they have used this year.
         Read live from GitHub rather than from the deployed copy, so an
         entry the chamber logs shows up straight away, not after the next
         rebuild. Only ever their own entries. */
      case 'benefits': {
        const m = currentMember(req);
        if (!m) {
          res.status(401).json({ error: 'signed_out', message: 'Please sign in again.' });
          return;
        }
        const missing = ghMissing();
        if (missing.length) {
          res.status(503).json({
            error: 'not_configured',
            message: `The benefits tracker is not connected yet. Missing in the Vercel project settings: ${missing.join(', ')}.`
          });
          return;
        }

        const { data } = await readContent('benefits.json');
        const mine = (data.uses || []).filter(u => u.member === m.slug);
        const year = Number(body.year) || thisYear();
        const label = id => (BENEFITS.find(b => b.id === id) || {}).label || id;

        const rows = summarize(m.tier, mine, year).map(r => ({ ...r, says: describe(r) }));

        /* Listing stats are a nicety. If the store is down, the benefits
           still show. */
        let stats = null;
        try { stats = (await statsFor([m.slug], year))[m.slug].year; } catch (err) { console.error('stats', err); }
        const years = [...new Set(mine.map(u => yearOf(u.date)).concat(thisYear()))].sort((a, b) => b - a);

        res.status(200).json({
          tier: m.tier,
          tierName: TIER_NAMES[m.tier] || m.tier,
          year,
          years,
          rows,
          stats,
          log: mine
            .filter(u => yearOf(u.date) === year)
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(u => ({
              date: u.date,
              benefit: label(u.benefit),
              qty: u.qty || null,
              amount: u.amount || null,
              note: u.note || ''
            }))
        });
        return;
      }

      /* Who can sign in for this business. Everybody on it can see the
         list; only the owner can change it. */
      case 'team':
      case 'invite':
      case 'resend':
      case 'remove': {
        const session = currentSession(req);
        if (!session) {
          res.status(401).json({ error: 'signed_out', message: 'Please sign in again.' });
          return;
        }
        if (session.demo && body.action !== 'team') {
          res.status(403).json({ error: 'demo', message: 'The test sign in cannot change who has access.' });
          return;
        }

        if (body.action === 'team') {
          res.status(200).json(await teamFor(session.member, session.email));
          return;
        }

        const missing = [...ghMissing(), ...mailMissing()];
        if (missing.length) {
          res.status(503).json({
            error: 'not_configured',
            message: `Adding people is not set up yet. Missing in the Vercel project settings: ${missing.join(', ')}.`
          });
          return;
        }

        const target = tidy(body.email);
        if (!looksLikeEmail(target)) {
          res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
          return;
        }

        const live = await requireOwner(session);
        const name = live.name || session.member.name;

        if (body.action === 'resend') {
          if (!addressesFor(live).includes(target)) {
            res.status(404).json({ error: 'not_on_team', message: 'That address is not on this business.' });
            return;
          }
          if (await kvGet(pwKey(target))) {
            res.status(400).json({ error: 'active', message: 'They have already set a password. If they forgot it, they can reset it from the sign in page.' });
            return;
          }
          await sendInvite(req, live, target, session.email);
          res.status(200).json({ ok: true, message: `Invite sent again to ${target}.`, ...(await teamFor(live, session.email)) });
          return;
        }

        let saved = null;

        if (body.action === 'invite') {
          const out = await updateContent('members.json', data => {
            const list = data.members || [];
            const i = list.findIndex(m => m.slug === live.slug);
            if (i === -1) throw Object.assign(new Error('That listing is no longer in the directory.'), { status: 404 });

            const current = addressesFor(list[i]);
            if (current[0] !== session.email) {
              throw Object.assign(new Error('Only the account owner can change who has access.'), { status: 403 });
            }
            if (current.includes(target)) {
              throw Object.assign(new Error('That address already has access.'), { status: 400 });
            }
            if (list.some((m, j) => j !== i && addressesFor(m).includes(target))) {
              throw Object.assign(new Error('That address already signs in for another business, and one address can only belong to one. Use a different address, or ask the chamber.'), { status: 409 });
            }
            if (current.length >= MAX_PEOPLE) {
              throw Object.assign(new Error(`A business can have up to ${MAX_PEOPLE} people. Remove somebody first.`), { status: 400 });
            }
            /* With no list yet, the contact address has been the sign in.
               Writing it down first keeps it there, as the owner. */
            list[i].access = saved = [...current, target];
          }, `${name}: ${session.email} gave ${target} sign in access`, `${name} via member sign in`);

          try {
            await sendInvite(req, live, target, session.email);
          } catch (err) {
            /* The access is saved either way. Say so, so they can resend
               rather than adding them twice. */
            res.status(err.status || 502).json({
              error: 'invite_failed',
              message: `${target} was added, but the invite email did not send. ${err.message} Use Resend invite to try again.`,
              ...(await teamFor(live, session.email, saved))
            });
            return;
          }

          res.status(200).json({
            ok: true,
            commit: out.commit,
            message: `Added ${target} and sent them an invite. It works for ${INVITE_DAYS} days.`,
            ...(await teamFor(live, session.email, saved))
          });
          return;
        }

        /* remove */
        if (target === session.email) {
          res.status(400).json({ error: 'owner', message: 'The owner cannot remove themselves. Ask the chamber to make somebody else the owner first.' });
          return;
        }
        const out = await updateContent('members.json', data => {
          const list = data.members || [];
          const i = list.findIndex(m => m.slug === live.slug);
          if (i === -1) throw Object.assign(new Error('That listing is no longer in the directory.'), { status: 404 });
          const current = addressesFor(list[i]);
          if (current[0] !== session.email) {
            throw Object.assign(new Error('Only the account owner can change who has access.'), { status: 403 });
          }
          if (!current.includes(target)) {
            throw Object.assign(new Error('That address is not on this business.'), { status: 404 });
          }
          list[i].access = saved = current.filter(e => e !== target);
        }, `${name}: ${session.email} removed sign in access for ${target}`, `${name} via member sign in`);

        await kvDel(pwKey(target));
        await kvDel(tryKey(target));

        res.status(200).json({
          ok: true,
          commit: out.commit,
          message: `Removed ${target}. They cannot sign in any more.`,
          ...(await teamFor(live, session.email, saved))
        });
        return;
      }

      case 'rules': {
        res.status(200).json({ minLength: MIN_LENGTH });
        return;
      }

      default:
        res.status(400).json({ error: 'unknown_action', message: 'That is not something this can do.' });
    }
  } catch (err) {
    console.error('member sign in failed:', err, err.detail || '');
    res.status(err.status || 500).json({
      error: 'server_error',
      message: err.message || 'Something went wrong signing in.'
    });
  }
}
