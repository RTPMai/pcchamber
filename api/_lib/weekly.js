/* ==========================================================================
   THE MONDAY DIGEST

   Every Monday morning, one short email: the next luncheon, what else is
   on in the next two weeks, and the member deals that are up. Nobody
   writes it. It is built from the events calendar and the deals members
   post themselves, so the only way to make it better is to keep those
   two things current, which is worth doing anyway.

   WHO GETS IT

   Newsletter subscribers, and (unless the admin turns it off) every
   member address that has not opted out of member email. Somebody on
   both lists gets one copy. Every copy carries its own one-click link
   that stops the Monday digest and nothing else: the newsletter, member
   messages, password emails and invoices carry on.

   WHEN

   vercel.json calls /api/digest?job=daily every morning. On a Monday,
   with automatic sending switched on in the admin, it builds that week's
   digest and puts everybody in a queue. Every day, Monday included, it
   sends as much of the queue as fits in what is left of the day's email
   allowance (Resend's free plan: 100 a day, MAIL_DAILY_LIMIT to change),
   so a list bigger than the allowance finishes on Tuesday instead of
   failing on Monday. Anything still queued a week later is dropped.

   A week with no events in the next 14 days and no live deals is skipped
   rather than sending an empty email.

   WHAT IS STORED

     wk:settings         { auto, members }  set from the admin
     wk:current          the Monday date of the issue being sent
     wk:issue:<monday>   subject, the email blocks, counts
     wk:q:<monday>       the queue, one recipient per entry
     wk:optout           addresses that stopped the Monday digest
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { kv, hashToObject } from './store.js';
import { sendMany, sentToday, dailyLimit } from './mail.js';
import { renderEmail } from './emailhtml.js';
import { subscribers, memberAddrs, optedOut, roster } from './lists.js';
import { SITE } from '../../data/site.js';

const read = f => JSON.parse(readFileSync(new URL(`../../content/${f}`, import.meta.url), 'utf8'));
const TZ = 'America/Chicago';

/* ---------- dates, in Polk City time ------------------------------------------ */

export const localDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const localDay = (d = new Date()) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
const addDays = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);

/* The Monday that starts this week. */
export function thisMonday(d = new Date()) {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return addDays(localDate(d), -order.indexOf(localDay(d)));
}
export const isMonday = (d = new Date()) => localDay(d) === 'Mon';

const fmt = (iso, opts) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
const shortDate = iso => fmt(iso, { weekday: 'short', month: 'short', day: 'numeric' });
const clock = hhmm => {
  if (!/^\d{2}:\d{2}$/.test(hhmm || '')) return '';
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

/* ---------- settings ----------------------------------------------------------- */

export async function settings() {
  const raw = await kv('GET', 'wk:settings');
  return { auto: false, members: true, ...(raw ? JSON.parse(raw) : {}) };
}

export async function saveSettings(next) {
  const cur = await settings();
  const out = {
    auto: typeof next.auto === 'boolean' ? next.auto : cur.auto,
    members: typeof next.members === 'boolean' ? next.members : cur.members
  };
  await kv('SET', 'wk:settings', JSON.stringify(out));
  return out;
}

/* ---------- what goes in it ------------------------------------------------------ */

const isLuncheon = e => /^luncheon/.test(e.id || '') || /lunch/i.test(e.title || '');

export function content(base, monday = thisMonday()) {
  const today = localDate();
  const from = today > monday ? today : monday;
  const twoWeeks = addDays(monday, 13);
  const members = roster();
  const nameOf = slug => (members.find(m => m.slug === slug && !m.unlisted) || {}).name || '';

  const cal = (read('events.json').calendar || [])
    .filter(e => e.date >= from).sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')));
  const luncheon = cal.find(e => isLuncheon(e) && e.date <= addDays(monday, 45));
  const others = cal.filter(e => e !== luncheon && e.date <= twoWeeks);

  const weekAgo = addDays(monday, -7);
  const deals = (read('deals.json').deals || [])
    .filter(d => nameOf(d.member) && (!d.expires || d.expires >= from))
    .sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  const newDeals = deals.filter(d => (d.added || '') >= weekAgo).length;

  const when = e => [shortDate(e.date), clock(e.start)].filter(Boolean).join(', ');
  const item = e => ({
    title: e.title,
    meta: [when(e), e.where, e.cost].filter(Boolean).join(' · '),
    text: e.summary || '',
    href: `${base}/events/#${e.id}`
  });

  const blocks = [
    { p: `Here is what is on at the chamber for the week of ${fmt(monday, { month: 'long', day: 'numeric' })}.` },
    ...(luncheon ? [
      { h: luncheon.date <= addDays(monday, 6) ? 'Luncheon this week' : 'Next luncheon' },
      { items: [item(luncheon)] },
      ...(luncheon.rsvp && /^https?:\/\//.test(luncheon.rsvp.href || '')
        ? [{ button: { label: luncheon.rsvp.label || 'Register', href: luncheon.rsvp.href } }] : []),
      ...(luncheon.guestFee ? [{ note: `Members register with the club directly. Not a member yet? Come as a guest: the $${luncheon.guestFee} guest fee is paid on the events page first.` }] : [])
    ] : []),
    ...(others.length ? [{ h: 'Coming up in the next two weeks' }, { items: others.slice(0, 8).map(item) }] : []),
    ...(deals.length ? [
      { h: 'Member deals' },
      { items: deals.slice(0, 8).map(d => ({
        title: `${(d.added || '') >= weekAgo ? 'New: ' : ''}${d.title}`,
        meta: `${nameOf(d.member)} · ${d.for === 'members' ? 'for chamber members' : 'for everyone'}${d.code ? ` · code ${d.code}` : ''}${d.expires ? ` · ends ${shortDate(d.expires)}` : ''}`,
        text: d.detail || '',
        href: `${base}/deals/`
      })) },
      ...(deals.length > 8 ? [{ note: `And ${deals.length - 8} more on the deals page.` }] : [])
    ] : []),
    { button: { label: 'Everything on the chamber website', href: base + '/' } }
  ];

  const lead = luncheon && luncheon.date <= addDays(monday, 6)
    ? `luncheon ${fmt(luncheon.date, { weekday: 'long' })}`
    : newDeals ? `${newDeals} new member deal${newDeals === 1 ? '' : 's'}` : '';
  const subject = `Chamber this week: ${fmt(monday, { month: 'short', day: 'numeric' })}${lead ? `, ${lead}` : ''}`;

  return {
    subject, blocks,
    counts: { luncheon: luncheon ? 1 : 0, events: others.length, deals: deals.length, newDeals },
    empty: !luncheon && !others.length && !deals.length
  };
}

/* ---------- the footer and the opt-out ------------------------------------------- */

export const weeklySig = email => createHmac('sha256', (process.env.MEMBER_SECRET || process.env.ADMIN_PASSCODE || '').trim())
  .update('pcc-weekly-optout:' + email).digest('hex').slice(0, 24);

const stopLink = (base, email) => `${base}/api/newsletter?wout=${weeklySig(email)}&e=${encodeURIComponent(email)}`;

const WHY = {
  nl: 'you signed up for chamber news',
  m: 'you are a chamber member',
  both: 'you are a chamber member and signed up for chamber news'
};

export function render(issue, r, base) {
  const stop = r ? stopLink(base, r.email) : `${base}/newsletter/`;
  return {
    ...renderEmail({
      site: SITE,
      preheader: 'Luncheon, events and member deals this week',
      blocks: issue.blocks,
      footer: [{ note: `You get this on Monday mornings because ${WHY[r ? r.kind : 'nl']}. Stop the Monday email: ${stop}` }]
    }),
    stop
  };
}

/* ---------- who it goes to --------------------------------------------------------- */

export async function audience(s) {
  const stopped = new Set(Object.keys(hashToObject(await kv('HGETALL', 'wk:optout'))));
  const out = new Map();
  for (const sub of await subscribers()) {
    if (!stopped.has(sub.email)) out.set(sub.email, 'nl');
  }
  if (s.members) {
    const outOfMember = await optedOut();
    for (const m of roster()) {
      for (const a of memberAddrs(m)) {
        if (stopped.has(a) || outOfMember.has(a)) continue;
        out.set(a, out.get(a) === 'nl' || out.get(a) === 'both' ? 'both' : 'm');
      }
    }
  }
  return [...out].map(([email, kind]) => ({ email, kind }));
}

/* ---------- making an issue and sending it ------------------------------------------ */

const WEEK = 7 * 86400;

export async function current() {
  const week = await kv('GET', 'wk:current');
  if (!week) return null;
  const raw = await kv('GET', `wk:issue:${week}`);
  if (!raw) return null;
  return { ...JSON.parse(raw), queued: Number(await kv('LLEN', `wk:q:${week}`)) || 0 };
}

/* Builds this week's issue and queues everybody. Does nothing if this
   week's already exists, so the schedule and a person pressing the
   button cannot double-send. */
export async function createIssue(base, by) {
  const monday = thisMonday();
  if (await kv('EXISTS', `wk:issue:${monday}`) === 1) return { exists: true, week: monday };

  const s = await settings();
  const c = content(base, monday);
  if (c.empty) {
    const rec = { week: monday, skipped: 'Nothing on: no events in the next two weeks and no deals up.', at: new Date().toISOString(), by };
    await kv('SET', `wk:issue:${monday}`, JSON.stringify(rec), 'EX', String(WEEK * 2));
    await kv('SET', 'wk:current', monday);
    return rec;
  }
  const to = await audience(s);
  const issue = {
    week: monday, subject: c.subject, blocks: c.blocks, counts: c.counts,
    total: to.length, sent: 0, at: new Date().toISOString(), by
  };
  await kv('SET', `wk:issue:${monday}`, JSON.stringify(issue), 'EX', String(WEEK * 2));
  for (let i = 0; i < to.length; i += 200) {
    await kv('RPUSH', `wk:q:${monday}`, ...to.slice(i, i + 200).map(r => JSON.stringify(r)));
  }
  await kv('EXPIRE', `wk:q:${monday}`, String(WEEK));
  await kv('SET', 'wk:current', monday);
  return issue;
}

/* Sends as much of the queue as today's allowance has room for. */
export async function drain(base) {
  const week = await kv('GET', 'wk:current');
  if (!week) return { sent: 0, left: 0 };
  const raw = await kv('GET', `wk:issue:${week}`);
  if (!raw) return { sent: 0, left: 0 };
  const issue = JSON.parse(raw);
  if (issue.skipped) return { sent: 0, left: 0 };

  const room = Math.max(0, dailyLimit() - await sentToday());
  let sent = 0;
  while (sent < room) {
    const take = Math.min(100, room - sent);
    const popped = await kv('LPOP', `wk:q:${week}`, String(take));
    const batch = (Array.isArray(popped) ? popped : popped ? [popped] : []).map(x => JSON.parse(x));
    if (!batch.length) break;
    const messages = batch.map(r => {
      const m = render(issue, r, base);
      return {
        to: r.email, subject: issue.subject, html: m.html, text: m.text,
        headers: { 'List-Unsubscribe': `<${m.stop}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', 'Reply-To': SITE.email }
      };
    });
    try {
      await sendMany(messages);
    } catch (err) {
      /* Put them back at the front, for tomorrow or the next press. */
      await kv('LPUSH', `wk:q:${week}`, ...batch.reverse().map(r => JSON.stringify(r)));
      if (sent) break;
      throw err;
    }
    sent += batch.length;
  }
  const left = Number(await kv('LLEN', `wk:q:${week}`)) || 0;
  if (sent) {
    issue.sent = (issue.sent || 0) + sent;
    issue.lastSend = new Date().toISOString();
    await kv('SET', `wk:issue:${week}`, JSON.stringify(issue), 'KEEPTTL');
  }
  return { sent, left, room };
}

/* The morning job. Builds on Monday if automatic sending is on, sends
   what fits every day. */
export async function morning(base) {
  const s = await settings();
  let made = null;
  if (s.auto && isMonday()) made = await createIssue(base, 'schedule');
  const out = await drain(base);
  return { auto: s.auto, made: made ? (made.skipped ? 'skipped' : made.exists ? 'already' : 'yes') : 'no', ...out };
}

export async function stopWeekly(email, sig) {
  if (email && sig.length === 24 && sig === weeklySig(email)) {
    await kv('HSET', 'wk:optout', email, new Date().toISOString());
    return true;
  }
  return false;
}
