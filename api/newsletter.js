/* ==========================================================================
   /api/newsletter

   A mailing list the chamber owns, and a newsletter that mostly writes
   itself.

   SIGNING UP

   Anyone can sign up from the footer or /newsletter/. They get an email
   with a link to confirm, and are only on the list once they click it.
   That keeps typos and other people's addresses off the list, and keeps
   the chamber's sending domain out of spam folders.

   Every newsletter carries a one-click unsubscribe link that works
   without signing in to anything, which email law and Gmail both require.

   THE NEWSLETTER ITSELF

   In the admin, the Newsletter screen builds a draft from what is already
   on the site: upcoming events, news posts and new member deals since the
   last one went out. The person sending writes a subject and a short
   opening, previews it, sends a test to themselves, and sends.

   WHERE THE LIST LIVES

   The store: nl:subs, one entry per address. The admin can download it
   as a spreadsheet, and should now and then.

   Resend's free plan sends 100 emails a day. Past that, the paid plan, or
   the screen tells you to split it over two days.
   ========================================================================== */

import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { kv, kvBump, storeReady, storeMissing, hashToObject } from './_lib/store.js';
import { isAdmin, readBody, visitorKey, fail } from './_lib/adminauth.js';
import { sendMail, sendMany, mailMissing } from './_lib/mail.js';
import { renderEmail } from './_lib/emailhtml.js';
import { SITE } from '../data/site.js';

const read = f => JSON.parse(readFileSync(new URL(`../content/${f}`, import.meta.url), 'utf8'));
const okEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const DAILY_LIMIT = 100;

const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host || new URL(SITE.url).host}`;

async function subscribers() {
  const raw = hashToObject(await kv('HGETALL', 'nl:subs'));
  return Object.entries(raw).map(([email, v]) => ({ email, ...JSON.parse(v) }));
}

/* ---------- the draft -------------------------------------------------------- */

const shortDate = iso => new Date(iso + 'T12:00:00Z')
  .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

function draft(base, since, intro) {
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10);
  const from = since || new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
  const members = read('members.json').members || [];
  const nameOf = slug => (members.find(m => m.slug === slug) || {}).name || '';

  const events = (read('events.json').calendar || [])
    .filter(e => e.date >= today && e.date <= soon).sort((a, b) => a.date.localeCompare(b.date));
  const posts = (read('news.json').posts || [])
    .filter(p => p.date > from && p.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const deals = (read('deals.json').deals || [])
    .filter(d => (d.added || '') > from && (!d.expires || d.expires >= today) && nameOf(d.member));

  const blocks = [
    ...(intro ? String(intro).split(/\n\s*\n/).map(p => ({ p: p.trim() })).filter(b => b.p) : []),
    ...(events.length ? [{ h: 'Coming up' }, { items: events.map(e => ({
      title: e.title, meta: `${shortDate(e.date)} \u00b7 ${e.where}${e.cost ? ' \u00b7 ' + e.cost : ''}`,
      text: e.summary, href: `${base}/events/#${e.id}` })) }] : []),
    ...(posts.length ? [{ h: 'News' }, { items: posts.map(p => ({
      title: p.title, text: p.summary, href: `${base}/news/${p.slug}/` })) }] : []),
    ...(deals.length ? [{ h: 'New member deals' }, { items: deals.map(d => ({
      title: d.title, meta: `${nameOf(d.member)} \u00b7 ${d.for === 'members' ? 'for chamber members' : 'for everyone'}`,
      text: d.detail || '', href: `${base}/deals/` })) }] : []),
    { button: { label: 'Everything on the chamber website', href: base + '/' } }
  ];
  return { blocks, counts: { events: events.length, posts: posts.length, deals: deals.length } };
}

function render(blocks, unsubHref) {
  return renderEmail({
    site: SITE,
    preheader: 'What is on at the Polk City Area Chamber',
    blocks,
    footer: [{ note: `You signed up for chamber news at ${SITE.url.replace(/^https?:\/\//, '')}. Unsubscribe: ${unsubHref}` }]
  });
}

/* ---------- public ------------------------------------------------------------ */

async function subscribe(req, res, body) {
  const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
  if (!okEmail(email)) {
    res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
    return;
  }
  if (await kvBump(`rl:nl:${visitorKey(req)}`, 3600) > 8) {
    res.status(429).json({ error: 'slow_down', message: 'Too many sign ups from here. Try again later.' });
    return;
  }
  if (await kv('HEXISTS', 'nl:subs', email) === 1) {
    res.status(200).json({ ok: true, message: 'You are already on the list.' });
    return;
  }
  if (mailMissing().length) {
    res.status(503).json({ error: 'not_configured', message: 'The newsletter is not set up yet. Email the chamber instead.' });
    return;
  }
  const token = randomBytes(16).toString('hex');
  await kv('SET', `nl:pending:${token}`, email, 'EX', String(7 * 86400));
  const link = `${origin(req)}/api/newsletter?confirm=${token}`;
  await sendMail({
    to: email,
    subject: 'Confirm your chamber newsletter sign up',
    text: [
      'Click to confirm and you are on the list:', '', link, '',
      'If you did not sign up, ignore this and nothing happens.', '',
      SITE.name
    ].join('\n')
  });
  res.status(200).json({ ok: true, message: `Almost done. Check ${email} for a link to confirm.` });
}

async function confirm(req, res) {
  const token = String(req.query.confirm || '');
  const email = /^[0-9a-f]{32}$/.test(token) ? await kv('GET', `nl:pending:${token}`) : null;
  if (!email) { res.redirect(302, '/newsletter/?status=expired'); return; }
  await kv('HSET', 'nl:subs', email, JSON.stringify({ at: new Date().toISOString(), u: randomBytes(12).toString('hex') }));
  await kv('DEL', `nl:pending:${token}`);
  res.redirect(302, '/newsletter/?status=confirmed');
}

async function unsubscribe(req, res) {
  const email = String(req.query.e || '').toLowerCase();
  const u = String(req.query.unsub || '');
  const raw = email ? await kv('HGET', 'nl:subs', email) : null;
  if (raw && JSON.parse(raw).u === u) await kv('HDEL', 'nl:subs', email);
  /* Mail clients doing one-click unsubscribe POST here and want a plain 200. */
  if (req.method === 'POST') { res.status(200).json({ ok: true }); return; }
  res.redirect(302, '/newsletter/?status=unsubscribed');
}

/* ---------- admin ---------------------------------------------------------------- */

async function admin(req, res, body) {
  const base = SITE.url.includes(req.headers.host || '~') ? SITE.url : origin(req);
  const lastRaw = await kv('GET', 'nl:last');
  const last = lastRaw ? JSON.parse(lastRaw) : null;

  if (body.action === 'status') {
    const subs = await subscribers();
    const d = draft(base, last && last.at.slice(0, 10), '');
    res.status(200).json({ subscribers: subs.length, last, counts: d.counts, dailyLimit: DAILY_LIMIT, missing: mailMissing() });
    return;
  }

  if (body.action === 'export') {
    res.status(200).json({ subscribers: await subscribers() });
    return;
  }

  if (body.action === 'remove') {
    await kv('HDEL', 'nl:subs', String(body.email || '').toLowerCase());
    res.status(200).json({ ok: true });
    return;
  }

  const subject = String(body.subject || '').trim().slice(0, 150);
  const { blocks, counts } = draft(base, last && last.at.slice(0, 10), body.intro);

  if (body.action === 'preview') {
    res.status(200).json({ ...render(blocks, base + '/newsletter/'), counts });
    return;
  }

  if (mailMissing().length) {
    res.status(503).json({ error: 'not_configured', message: `Email is not set up. Missing in Vercel: ${mailMissing().join(', ')}.` });
    return;
  }
  if (!subject) {
    res.status(400).json({ error: 'no_subject', message: 'Give it a subject line first.' });
    return;
  }

  if (body.action === 'test') {
    const to = String(body.to || '').trim();
    if (!okEmail(to)) { res.status(400).json({ error: 'bad_email', message: 'Put in the address to send the test to.' }); return; }
    const { html, text } = render(blocks, base + '/newsletter/');
    await sendMail({ to, subject: '[Test] ' + subject, html, text });
    res.status(200).json({ ok: true, message: `Test sent to ${to}.` });
    return;
  }

  if (body.action === 'send') {
    const subs = await subscribers();
    if (Number(body.expect) !== subs.length) {
      res.status(409).json({ error: 'changed', message: 'The list changed while you were writing. Reload the screen and check the number before sending.' });
      return;
    }
    const messages = subs.map(s => {
      const link = `${base}/api/newsletter?unsub=${s.u}&e=${encodeURIComponent(s.email)}`;
      return {
        to: s.email, subject, ...render(blocks, link),
        headers: {
          'List-Unsubscribe': `<${link}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Reply-To': SITE.email
        }
      };
    });
    const sent = await sendMany(messages);
    const record = { at: new Date().toISOString(), subject, sent, by: String(body.who || '').slice(0, 80) };
    await kv('SET', 'nl:last', JSON.stringify(record));
    res.status(200).json({ ok: true, ...record, message: `Sent to ${sent} subscriber${sent === 1 ? '' : 's'}.` });
    return;
  }

  res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
}

export default async function handler(req, res) {
  try {
    if (!storeReady()) {
      res.status(503).json({ error: 'not_configured', message: `The newsletter is not set up yet. Missing: ${storeMissing().join(', ')}.` });
      return;
    }
    if (req.query?.confirm) return await confirm(req, res);
    if (req.query?.unsub) return await unsubscribe(req, res);

    const body = await readBody(req);
    if (body.action === 'subscribe') return await subscribe(req, res, body);
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'locked', message: 'Please sign in to the admin again.' });
      return;
    }
    return await admin(req, res, body);
  } catch (err) {
    fail(res, err, 'newsletter failed:');
  }
}
