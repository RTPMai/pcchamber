/* ==========================================================================
   /api/digest   THE QUARTERLY MEMBER EMAIL

   Once a quarter each member gets a short note about their own
   membership: how often their directory page was seen, which benefits
   they still have this year, and what is coming up. Unused benefits are
   the quiet reason people do not renew, and this puts them in front of
   the member four times a year without anybody at the chamber doing it.

   WHEN

   vercel.json runs this at 10am Central on the 5th of January, April,
   July and October, about the quarter just finished. It only actually
   sends if DIGEST_AUTO is set to on in the Vercel settings. Until then
   the admin can preview it, send a test to themselves, and send it by
   hand from the Quarterly member email screen.

   WHO

   Everybody on a member's sign-in list (their "access" emails), or their
   public email if they have no list, which is the same rule sign-in uses.
   Each member is sent at most one per quarter, however many times it is
   run, so pressing Send twice is harmless.

   NEEDS

     RESEND_API_KEY, MEMBER_EMAIL_FROM   to send (same as password emails)
     KV_REST_API_URL, KV_REST_API_TOKEN  for the stats and the once-only record
     GITHUB_REPO, GITHUB_TOKEN           to read the benefits log
     CRON_SECRET                         set by Vercel for scheduled runs
     DIGEST_AUTO=on                      when you want it automatic
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { isAdmin, readBody, fail } from './_lib/adminauth.js';
import { kv, kvPipeline, storeReady, storeMissing } from './_lib/store.js';
import { sendMail, sendMany, mailMissing } from './_lib/mail.js';
import { readContent, ghMissing } from './_lib/github.js';
import { statsFor, lastQuarter, statsLine } from './_lib/stats.js';
import { renderEmail } from './_lib/emailhtml.js';
import { summarize, describe, thisYear, TIER_NAMES } from '../data/benefits.js';
import { SITE } from '../data/site.js';

const read = f => JSON.parse(readFileSync(new URL(`../content/${f}`, import.meta.url), 'utf8'));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const recipients = m => {
  const list = Array.isArray(m.access) && m.access.length ? m.access : (m.contact?.email ? [m.contact.email] : []);
  return [...new Set(list.map(x => String(x).trim().toLowerCase()).filter(Boolean))];
};

function quarterName(q) {
  return `${MONTHS[(q.q - 1) * 3]} to ${MONTHS[(q.q - 1) * 3 + 2]} ${q.year}`;
}

function upcoming() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  return (read('events.json').calendar || [])
    .filter(e => e.date >= from && e.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

const shortDate = iso => {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/* Everything one member's email needs, gathered once for everybody. */
async function gather() {
  const q = lastQuarter();
  const year = thisYear();
  const roster = read('members.json').members || [];
  const { data } = await readContent('benefits.json');
  const stats = await statsFor(roster.map(m => m.slug), year, q);
  return { q, year, roster, uses: data.uses || [], stats, events: upcoming() };
}

function build(m, ctx) {
  const s = ctx.stats[m.slug] || { year: {}, quarter: {} };
  const rows = summarize(m.tier, ctx.uses.filter(u => u.member === m.slug), ctx.year)
    .filter(r => !r.outside && r.kind !== 'open');
  const left = rows.filter(r =>
    (r.kind === 'count' || r.kind === 'dollars') ? r.left > 0 : r.kind === 'once' ? !r.used : false);
  const usedSome = rows.filter(r => r.used > 0);
  const qv = s.quarter.view || 0, yv = s.year.view || 0;
  const base = `https://${ctx.host}`;

  const blocks = [
    { p: `Hi ${m.name},` },
    { p: `Here is where your chamber membership stands after ${quarterName(ctx.q)}.` },

    { h: 'Your directory page' },
    qv
      ? { p: `Your page was viewed ${qv.toLocaleString('en-US')} time${qv === 1 ? '' : 's'} last quarter${yv > qv ? `, and ${yv.toLocaleString('en-US')} so far this year` : ''}.` }
      : { p: 'Your page had no views last quarter. A description and a logo make a real difference to that.' },
    ...(statsLine(s.quarter).length ? [{ p: `From it, people made ${statsLine(s.quarter).join(', ')}.` }] : []),
    ...(!m.summary || !m.logo ? [{
      p: `Your listing is missing ${[!m.summary && 'a description', !m.logo && 'a logo'].filter(Boolean).join(' and ')}. It takes two minutes and it is the first thing people see.`
    }, { button: { label: 'Update your listing', href: `${base}/members/listing/` } }] : []),

    { h: `Your benefits for ${ctx.year}` },
    { note: TIER_NAMES[m.tier] || m.tier },
    ...(left.length
      ? [{ p: 'Still yours to use this year:' }, { rows: left.map(r => [r.label, r.kind === 'once' ? 'Not used yet' : `${r.kind === 'dollars' ? '$' + r.left.toLocaleString('en-US') : r.left} left`]) }]
      : [{ p: 'You have used everything your level includes this year. Nicely done.' }]),
    ...(usedSome.length ? [{ note: `Used so far: ${usedSome.map(r => `${r.label.toLowerCase()} (${describe(r).toLowerCase()})`).join('; ')}.` }] : []),
    { button: { label: 'See your account', href: `${base}/members/` } },

    ...(ctx.events.length ? [
      { h: 'Coming up' },
      { items: ctx.events.map(e => ({ title: e.title, meta: `${shortDate(e.date)} \u00b7 ${e.where}`, href: `${base}/events/#${e.id}` })) }
    ] : [])
  ];

  const footer = [{ note: 'You get this once a quarter because you are a chamber member. Questions, or would rather not get it? Just reply.' }];
  const { html, text } = renderEmail({ site: SITE, preheader: `Your listing and benefits after ${quarterName(ctx.q)}`, blocks, footer });
  return { subject: `Your chamber membership: ${quarterName(ctx.q)}`, html, text };
}

const sentKey = (q, slug) => `dg:${q.year}Q${q.q}:${slug}`;

async function sendAll(ctx, by) {
  const eligible = ctx.roster.filter(m => recipients(m).length);
  const flags = await kvPipeline(eligible.map(m => ['EXISTS', sentKey(ctx.q, m.slug)]));
  const todo = eligible.filter((m, i) => !Number(flags[i]));

  const messages = todo.map(m => ({ to: recipients(m), ...build(m, ctx), headers: { 'Reply-To': SITE.email } }));
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    sent += await sendMany(messages.slice(i, i + 100));
    await kvPipeline(todo.slice(i, i + 100).map(m => ['SET', sentKey(ctx.q, m.slug), '1', 'EX', String(200 * 864e2)]));
  }
  const record = {
    at: new Date().toISOString(), quarter: `${ctx.q.year} Q${ctx.q.q}`, sent,
    skipped: eligible.length - todo.length, noEmail: ctx.roster.length - eligible.length, by
  };
  await kv('SET', 'dg:last', JSON.stringify(record));
  return record;
}

function missing() {
  return [...mailMissing(), ...storeMissing(), ...ghMissing()];
}

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || new URL(SITE.url).host;

    /* The schedule. Vercel sends the CRON_SECRET it set as a bearer token. */
    if (req.method === 'GET') {
      const secret = (process.env.CRON_SECRET || '').trim();
      if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).json({ error: 'locked' });
        return;
      }
      if ((process.env.DIGEST_AUTO || '').trim().toLowerCase() !== 'on') {
        res.status(200).json({ ok: true, skipped: 'DIGEST_AUTO is not on' });
        return;
      }
      if (missing().length) {
        res.status(503).json({ error: 'not_configured', missing: missing() });
        return;
      }
      const ctx = { ...(await gather()), host: new URL(SITE.url).host };
      res.status(200).json({ ok: true, ...(await sendAll(ctx, 'schedule')) });
      return;
    }

    if (!isAdmin(req)) {
      res.status(401).json({ error: 'locked', message: 'Please sign in to the admin again.' });
      return;
    }
    const body = await readBody(req);
    const who = String(body.who || 'the chamber').slice(0, 80);

    if (body.action === 'status') {
      const roster = read('members.json').members || [];
      const last = storeReady() ? await kv('GET', 'dg:last') : null;
      res.status(200).json({
        missing: missing(),
        auto: (process.env.DIGEST_AUTO || '').trim().toLowerCase() === 'on',
        quarter: quarterName(lastQuarter()),
        withEmail: roster.filter(m => recipients(m).length).length,
        withoutEmail: roster.filter(m => !recipients(m).length).map(m => m.name),
        last: last ? JSON.parse(last) : null
      });
      return;
    }

    if (missing().length) {
      res.status(503).json({ error: 'not_configured', message: `Not set up yet. Missing in Vercel: ${missing().join(', ')}.` });
      return;
    }

    const ctx = { ...(await gather()), host };
    const m = ctx.roster.find(x => x.slug === body.member) || ctx.roster[0];

    if (body.action === 'preview') {
      const out = build(m, ctx);
      res.status(200).json({ member: m.name, to: recipients(m), ...out });
      return;
    }

    if (body.action === 'test') {
      const to = String(body.to || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        res.status(400).json({ error: 'bad_email', message: 'Put in the address to send the test to.' });
        return;
      }
      const out = build(m, ctx);
      await sendMail({ to, subject: '[Test] ' + out.subject, text: out.text, html: out.html });
      res.status(200).json({ ok: true, message: `Test for ${m.name} sent to ${to}.` });
      return;
    }

    if (body.action === 'send') {
      const r = await sendAll(ctx, who);
      res.status(200).json({ ok: true, ...r,
        message: `Sent to ${r.sent} member${r.sent === 1 ? '' : 's'}.` +
          (r.skipped ? ` ${r.skipped} already had this quarter's.` : '') +
          (r.noEmail ? ` ${r.noEmail} have no email on file.` : '') });
      return;
    }

    res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
  } catch (err) {
    fail(res, err, 'digest failed:');
  }
}
