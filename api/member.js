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

const COOKIE = 'pcc_member';
const SESSION_DAYS = 30;
const LINK_MINUTES = 30;
const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

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
  const payload = verify(readCookie(req, COOKIE));
  if (!payload || payload.kind !== 'session') return null;
  return members().find(m => m.slug === payload.slug) || null;
}

function setSession(res, member, email) {
  const token = sign({
    kind: 'session',
    slug: member.slug,
    email: tidy(email),
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

    if (!storeReady()) {
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
        res.status(200).json(m ? { signedIn: true, slug: m.slug, name: m.name } : { signedIn: false });
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
