/* ==========================================================================
   /api/events

   Registering for an event on the chamber site, and checking people in at
   the door.

   WHICH EVENTS

   Only events with "Take registrations on this site" ticked in the admin.
   Events that register somewhere else (the luncheon through the club) keep
   their own button and are not affected. Any event can still be checked
   in at the door, registered or not, so the luncheon gets a sign-in list
   and its tickets get counted.

   LUNCHEON TICKETS

   An event with "Luncheon tickets can be used" ticked lets a member bring
   someone on one of their tickets. When that person is checked in, the
   ticket is logged against the member in the benefits tracker, dated the
   day of the event, with the guest's name. Undo the check-in and the
   ticket comes back.

   WHERE REGISTRATIONS LIVE

   The store, not git: rsvp:<event id>, one hash field per person, kept
   for 400 days. Downloadable as a spreadsheet from the admin.
   ========================================================================== */

import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { kv, kvBump, storeReady, storeMissing, hashToObject } from './_lib/store.js';
import { isAdmin, readBody, visitorKey, fail } from './_lib/adminauth.js';
import { currentMember } from './member.js';
import { sendMail, mailMissing } from './_lib/mail.js';
import { logUse, unlogUse } from './_lib/benefitlog.js';
import { ghMissing } from './_lib/github.js';
import { SITE } from '../data/site.js';
import { isGated, stripeMissing, createCheckout, getSession, recordPaid } from './_lib/guestfee.js';

const events = () =>
  JSON.parse(readFileSync(new URL('../content/events.json', import.meta.url), 'utf8')).calendar || [];
const members = () =>
  JSON.parse(readFileSync(new URL('../content/members.json', import.meta.url), 'utf8')).members || [];

const today = () => new Date().toISOString().slice(0, 10);
const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const KEEP = String(60 * 60 * 24 * 400);

async function attendees(id) {
  const raw = hashToObject(await kv('HGETALL', `rsvp:${id}`));
  return Object.values(raw).map(v => JSON.parse(v)).sort((a, b) => a.at.localeCompare(b.at));
}
const put = (id, r) => kv('HSET', `rsvp:${id}`, r.id, JSON.stringify(r)).then(() => kv('EXPIRE', `rsvp:${id}`, KEEP));
const headcount = list => list.reduce((n, r) => n + 1 + (r.guests || 0), 0);
const memberName = slug => (members().find(m => m.slug === slug) || {}).name || slug;

function when(e) {
  const d = new Date(e.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const t = s => {
    const [h, m] = s.split(':').map(Number);
    return `${(h % 12) || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`;
  };
  return e.start ? `${d}, ${t(e.start)}${e.end ? ' to ' + t(e.end) : ''}` : d;
}

/* ---------- somebody registering ------------------------------------------ */

async function register(req, res, body) {
  const e = events().find(x => x.id === body.event);
  if (!e || !e.register) {
    res.status(404).json({ error: 'no_event', message: 'Registration is not open for that event.' });
    return;
  }
  if (e.date < today()) {
    res.status(400).json({ error: 'past', message: 'That event has already happened.' });
    return;
  }

  const tries = await kvBump(`rl:rsvp:${visitorKey(req)}`, 3600);
  if (tries > 15) {
    res.status(429).json({ error: 'slow_down', message: 'Too many registrations from here. Try again in an hour, or email the chamber.' });
    return;
  }

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  if (!name) { res.status(400).json({ error: 'no_name', message: 'Put in your name.' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
    return;
  }

  const list = await attendees(e.id);
  if (list.some(r => r.email === email && r.name.toLowerCase() === name.toLowerCase())) {
    res.status(200).json({ ok: true, message: `You are already on the list for ${e.title}. See you there.` });
    return;
  }
  const guests = Math.max(0, Math.min(5, Math.floor(Number(body.guests) || 0)));
  const cap = Number(e.capacity) || 0;
  if (cap && headcount(list) + 1 + guests > cap) {
    res.status(409).json({ error: 'full', message: 'Sorry, that event is full. Email the chamber to go on a waiting list.' });
    return;
  }

  const m = currentMember(req);
  const r = {
    id: randomBytes(5).toString('hex'),
    name, email,
    business: clean(body.business, 120) || (m ? m.name : ''),
    guests,
    member: m ? m.slug : null,
    ticket: Boolean(m && e.tickets && body.ticket),
    at: new Date().toISOString(),
    checkedIn: null
  };
  await put(e.id, r);

  /* The confirmation is a nicety. If email is not set up, or fails, the
     registration still stands. */
  if (!mailMissing().length) {
    try {
      await sendMail({
        to: email,
        subject: `You are registered: ${e.title}`,
        text: [
          `Hi ${name.split(' ')[0]},`,
          '',
          `You are on the list for ${e.title}${guests ? `, plus ${guests} guest${guests === 1 ? '' : 's'}` : ''}.`,
          '',
          when(e),
          [e.where, e.address].filter(Boolean).join(', '),
          e.cost ? `Cost: ${e.cost}` : '',
          r.ticket ? `On one of ${m.name}'s luncheon tickets.` : '',
          '',
          `Add it to your calendar: ${SITE.url}/events/ics/${e.id}.ics`,
          '',
          'Cannot make it after all? Reply to this email and let us know.',
          '',
          'Polk City Area Chamber of Commerce'
        ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n'),
        headers: { 'Reply-To': SITE.email }
      });
    } catch (err) {
      console.error('registration email failed', err.detail || err);
    }
  }

  res.status(200).json({ ok: true, message: `You are registered for ${e.title}. A confirmation is on its way to ${email}.` });
}

/* ---------- the luncheon guest fee (see api/_lib/guestfee.js) ------------- */

const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host || new URL(SITE.url).host}`;

async function gate(req, res, body) {
  const e = events().find(x => x.id === body.event);
  if (!isGated(e) || e.date < today()) {
    res.status(404).json({ error: 'no_event', message: 'Registration is not open for that event.' });
    return;
  }
  const m = currentMember(req);

  /* A member: straight to the venue's link, and onto the check-in list.
     Clicking twice does not add them twice. */
  if (body.action === 'memberlink') {
    if (!m) { res.status(401).json({ error: 'signed_out', message: 'Sign in as a member first.' }); return; }
    const field = 'mem-' + m.slug;
    if (!(await kv('HGET', `rsvp:${e.id}`, field))) {
      await put(e.id, {
        id: field, name: m.name, email: '', business: m.name, guests: 0,
        member: m.slug, ticket: false, via: 'member', at: new Date().toISOString(), checkedIn: null
      });
    }
    res.status(200).json({ ok: true, href: e.rsvp.href });
    return;
  }

  if (body.action === 'guestcheckout') {
    if (stripeMissing().length) {
      res.status(503).json({ error: 'not_configured',
        message: `Online payment is not switched on yet. Email ${SITE.email} and the chamber will sort it out.` });
      return;
    }
    if (await kvBump(`rl:gf:${visitorKey(req)}`, 3600) > 10) {
      res.status(429).json({ error: 'slow_down', message: 'Too many tries from here. Email the chamber instead.' });
      return;
    }
    const name = clean(body.name, 80);
    const email = clean(body.email, 120).toLowerCase();
    if (!name) { res.status(400).json({ error: 'no_name', message: 'Put in your name.' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
      return;
    }
    const session = await createCheckout(e, { name, email, business: clean(body.business, 120) }, origin(req));
    res.status(200).json({ ok: true, url: session.url });
    return;
  }

  res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
}

/* The page people land on after paying. Asks Stripe, not the browser,
   whether it was paid. */
async function guestConfirm(req, res, body) {
  if (stripeMissing().length) { res.status(503).json({ error: 'not_configured', message: 'Online payment is not switched on.' }); return; }
  const id = String(body.session || '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) { res.status(400).json({ error: 'bad_session', message: 'That payment link is not right.' }); return; }
  const session = await getSession(id);
  if (session.payment_status !== 'paid') {
    res.status(202).json({ pending: true, message: 'Stripe has not confirmed the payment yet. This page will check again.' });
    return;
  }
  const e = await recordPaid(session);
  if (!e) { res.status(404).json({ error: 'no_event', message: 'Paid, but that event is no longer on the calendar. Email the chamber.' }); return; }
  res.status(200).json({ ok: true, href: e.rsvp.href, title: e.title, date: e.date, where: e.where, email: session.customer_details?.email || session.customer_email || '' });
}

/* ---------- the door ------------------------------------------------------ */

async function admin(req, res, body) {
  const who = clean(body.who, 80) || 'the chamber';
  const e = body.event ? events().find(x => x.id === body.event) : null;

  if (body.action === 'overview') {
    const cutoff = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    const list = events().filter(x => x.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    const counts = await Promise.all(list.map(x => kv('HLEN', `rsvp:${x.id}`)));
    res.status(200).json({
      today: today(),
      events: list.map((x, i) => ({
        id: x.id, title: x.title, date: x.date, where: x.where,
        register: Boolean(x.register), tickets: Boolean(x.tickets), guestFee: Number(x.guestFee) || null,
        capacity: Number(x.capacity) || null, entries: Number(counts[i]) || 0
      }))
    });
    return;
  }

  if (!e) { res.status(404).json({ error: 'no_event', message: 'That event is not on the calendar.' }); return; }

  if (body.action === 'attendees') {
    const list = await attendees(e.id);
    res.status(200).json({
      event: { id: e.id, title: e.title, date: e.date, where: e.where, tickets: Boolean(e.tickets), capacity: Number(e.capacity) || null, guestFee: Number(e.guestFee) || null },
      attendees: list.map(r => ({ ...r, memberName: r.member ? memberName(r.member) : null })),
      headcount: headcount(list),
      trackerReady: !ghMissing().length
    });
    return;
  }

  const logTicket = async r => {
    if (!r.ticket || !r.member || r.ticketUse || ghMissing().length) return r;
    const use = await logUse({
      member: r.member, benefit: 'luncheon', date: e.date,
      note: `${e.title}: ${r.name}`
    }, who);
    return { ...r, ticketUse: use.id };
  };
  const unlogTicket = async r => {
    if (!r.ticketUse) return r;
    await unlogUse(r.ticketUse, who);
    const { ticketUse, ...rest } = r;
    return rest;
  };

  if (body.action === 'add') {
    const name = clean(body.name, 80);
    const member = members().some(m => m.slug === body.member) ? body.member : null;
    if (!name && !member) { res.status(400).json({ error: 'no_name', message: 'Put in a name or pick a member.' }); return; }
    let r = {
      id: randomBytes(5).toString('hex'),
      name: name || memberName(member),
      email: clean(body.email, 120).toLowerCase(),
      business: member ? memberName(member) : clean(body.business, 120),
      guests: 0,
      member,
      ticket: Boolean(member && e.tickets && body.ticket),
      at: new Date().toISOString(),
      checkedIn: body.checkin === false ? null : new Date().toISOString(),
      walkin: true
    };
    if (r.checkedIn) r = await logTicket(r);
    await put(e.id, r);
    res.status(200).json({ ok: true, attendee: { ...r, memberName: member ? memberName(member) : null } });
    return;
  }

  const raw = await kv('HGET', `rsvp:${e.id}`, String(body.id || ''));
  if (!raw) { res.status(404).json({ error: 'gone', message: 'That person is not on the list any more.' }); return; }
  let r = JSON.parse(raw);

  if (body.action === 'checkin') {
    if (body.undo) {
      r = await unlogTicket({ ...r, checkedIn: null });
    } else {
      if (typeof body.ticket === 'boolean' && r.member && e.tickets) r.ticket = body.ticket;
      r = await logTicket({ ...r, checkedIn: r.checkedIn || new Date().toISOString() });
    }
    await put(e.id, r);
    res.status(200).json({ ok: true, attendee: { ...r, memberName: r.member ? memberName(r.member) : null } });
    return;
  }

  if (body.action === 'remove') {
    await unlogTicket(r);
    await kv('HDEL', `rsvp:${e.id}`, r.id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
}

export default async function handler(req, res) {
  try {
    if (!storeReady()) {
      res.status(503).json({ error: 'not_configured', message: `Registration is not set up yet. Missing: ${storeMissing().join(', ')}.` });
      return;
    }
    const body = await readBody(req);
    if (body.action === 'register') return await register(req, res, body);
    if (body.action === 'memberlink' || body.action === 'guestcheckout') return await gate(req, res, body);
    if (body.action === 'guestconfirm') return await guestConfirm(req, res, body);
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'locked', message: 'Please sign in to the admin again.' });
      return;
    }
    return await admin(req, res, body);
  } catch (err) {
    fail(res, err, 'events failed:');
  }
}
