/* ==========================================================================
   SPONSORSHIP INVOICES, THROUGH STRIPE

   Same machinery as membership dues (api/_lib/dues.js): Stripe sends the
   invoice, takes the payment, sends reminders and the receipt. This file
   decides what goes on the invoice and remembers what happened to it.

   HOW IT RUNS

   Admin, Sponsorship invoices. Pick who it is for (a member, or a
   business that is not one), pick sponsorships from the menu or type one
   in, and press Send. Stripe emails the invoice with a Pay button.

   SPONSORSHIP CREDIT

   Investor, Sponsor and Champion members have a yearly sponsorship
   credit (data/benefits.js). When the invoice is for one of them, the
   screen shows what credit they have left this year and takes it off the
   invoice as its own line, so the member sees exactly what their level
   covered. The credit is logged in the benefits tracker the moment the
   invoice is sent. If the invoice is later voided in Stripe, that log
   entry is taken back out by itself.

   When the credit covers the whole thing, nothing goes to Stripe: the
   sponsorship is recorded as covered and the credit is logged.

   WHAT IS STORED

     spons:<year>               one entry per invoice
     dues:cust:<slug>           a member's Stripe customer, shared with dues
     spons:cust:<email>         a non-member's Stripe customer

   SETTINGS

   None new. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, the same ones
   dues use, with the same invoice events on the webhook.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { kv, hashToObject } from './store.js';
import { stripeApi as stripe, stripeReady, testMode } from './dues.js';
import { readContent, updateContent, ghMissing } from './github.js';
import { summarize, thisYear, TIER_NAMES } from '../../data/benefits.js';
import { billTo } from '../../data/dues.js';
import { SITE } from '../../data/site.js';

export const SP_DAYS = 30;
const okEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const bad = (message, status = 400) => Object.assign(new Error(message), { status });

const readLocal = f => JSON.parse(readFileSync(new URL(`../../content/${f}`, import.meta.url), 'utf8'));
const roster = () => readLocal('members.json').members || [];

async function records(year) {
  const raw = hashToObject(await kv('HGETALL', `spons:${year}`));
  return Object.entries(raw).map(([id, v]) => ({ id, ...JSON.parse(v) }))
    .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
}
const put = (year, rec) => {
  const { id, ...rest } = rec;
  return kv('HSET', `spons:${year}`, id, JSON.stringify(rest));
};

/* Credit left this year, in cents, for every member who has any. Read
   from GitHub rather than the deployed copy, so a use logged a minute ago
   counts. */
async function creditLeft() {
  const year = thisYear();
  const { data } = await readContent('benefits.json');
  const uses = data.uses || [];
  const out = {};
  for (const m of roster()) {
    const row = summarize(m.tier, uses.filter(u => u.member === m.slug), year).find(r => r.id === 'credit');
    if (row && row.allowed) out[m.slug] = Math.round(row.left * 100);
  }
  return out;
}

export async function spStatus(year) {
  const menu = (readLocal('sponsorships.json').sponsorships || [])
    .filter(x => !x.retired && x.name)
    .map(x => ({ id: x.id, name: x.name, detail: x.detail || '', cents: Math.round(Number(String(x.price || '').replace(/[$,]/g, '')) * 100) || 0 }));
  let credit = {};
  let creditNote = '';
  if (!ghMissing().length) {
    try { credit = await creditLeft(); }
    catch { creditNote = 'Sponsorship credit could not be checked just now, so it is not offered. Try again in a minute.'; }
  }
  return {
    year, menu, credit, creditNote, invoices: await records(year),
    ready: stripeReady(), test: testMode(), days: SP_DAYS, creditYear: thisYear()
  };
}

async function customerFor(to, key) {
  if (to.slug) {
    let id = await kv('GET', `dues:cust:${to.slug}`);
    if (!id) {
      const c = await stripe('/customers', { name: to.name, email: to.email, 'metadata[slug]': to.slug, preferred_locales: 'en-US' }, key('cust'));
      id = c.id;
      await kv('SET', `dues:cust:${to.slug}`, id);
    } else {
      await stripe('/customers/' + id, { email: to.email, name: to.name }, key('custupd'));
    }
    return id;
  }
  let id = await kv('GET', `spons:cust:${to.email}`);
  if (!id) {
    const c = await stripe('/customers', { name: to.name, email: to.email, 'metadata[kind]': 'sponsor', preferred_locales: 'en-US' }, key('cust'));
    id = c.id;
    await kv('SET', `spons:cust:${to.email}`, id);
  }
  return id;
}

async function logCredit(slug, cents, note, who) {
  const entry = {
    id: randomBytes(5).toString('hex'), member: slug, benefit: 'credit',
    date: new Date().toISOString().slice(0, 10), amount: cents / 100,
    note: clean(note, 300), by: clean(who, 80), at: new Date().toISOString()
  };
  await updateContent('benefits.json', data => {
    data.uses = Array.isArray(data.uses) ? data.uses : [];
    data.uses.push(entry);
  }, `Log $${cents / 100} sponsorship credit for ${slug} (sponsorship invoice, by ${who})`, `${who} via chamber admin`);
  return entry.id;
}

async function unlogCredit(id, why) {
  await updateContent('benefits.json', data => {
    data.uses = (data.uses || []).filter(u => u.id !== id);
  }, `Take back sponsorship credit: ${why}`, 'Stripe via chamber site');
}

export async function spSend(body, who) {
  const year = thisYear();
  const nonce = /^[a-z0-9]{8,32}$/.test(String(body.nonce || '')) ? body.nonce : null;
  if (!nonce) throw bad('Reload the page and try again.');

  /* Pressing Send twice, or a slow network retrying, returns the first. */
  const already = await kv('HGET', `spons:${year}`, nonce);
  if (already) return { ok: true, again: true, record: { id: nonce, ...JSON.parse(already) } };

  /* Who it is for. */
  let to;
  if (body.member) {
    const m = roster().find(x => x.slug === body.member);
    if (!m) throw bad('That member is not in the directory.');
    const email = clean(body.email, 160).toLowerCase() || billTo(m);
    if (!okEmail(email)) throw bad(`${m.name} has no email on file. Put one in for the invoice.`);
    to = { slug: m.slug, name: m.name, email, tier: m.tier };
  } else {
    const name = clean(body.name, 120);
    const email = clean(body.email, 160).toLowerCase();
    if (!name) throw bad('Put in the name of the business the invoice is for.');
    if (!okEmail(email)) throw bad('Put in the email address the invoice goes to.');
    to = { name, email };
  }

  /* What is on it. */
  const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 10).map(l => ({
    name: clean(l.name, 120), detail: clean(l.detail, 300), cents: Math.round(Number(l.cents))
  })).filter(l => l.name || l.cents);
  if (!lines.length) throw bad('Add at least one sponsorship.');
  for (const l of lines) {
    if (!l.name) throw bad('Every line needs a description.');
    if (!(l.cents > 0) || l.cents > 5e6) throw bad(`Check the amount for "${l.name}".`);
  }
  const subtotal = lines.reduce((t, l) => t + l.cents, 0);

  /* Credit, checked against the live benefits log, never more than the
     invoice. */
  let credit = Math.max(0, Math.round(Number(body.creditCents) || 0));
  if (credit) {
    if (!to.slug) throw bad('Only members have sponsorship credit.');
    const left = (await creditLeft())[to.slug] || 0;
    if (credit > left) throw bad(`${to.name} has $${(left / 100).toLocaleString('en-US')} of credit left, not $${(credit / 100).toLocaleString('en-US')}.`);
    credit = Math.min(credit, subtotal);
  }
  const total = subtotal - credit;
  const what = lines.map(l => l.name).join(', ');
  const days = Math.min(90, Math.max(1, parseInt(body.days, 10) || SP_DAYS));

  const base = { to, lines, subtotal, credit, total, year, sentAt: new Date().toISOString(), by: clean(who, 80) };

  if (!total) {
    const creditUse = await logCredit(to.slug, credit, `Covered: ${what}`, who);
    const rec = { id: nonce, ...base, status: 'covered', creditUse };
    await put(year, rec);
    return { ok: true, record: rec };
  }

  if (!stripeReady()) throw bad('Stripe is not connected. Set STRIPE_SECRET_KEY in Vercel.', 503);

  const lock = await kv('SET', `spons:lock:${nonce}`, '1', 'NX', 'EX', '120');
  if (lock !== 'OK') throw bad('That invoice is being sent right now.', 409);
  try {
    const key = step => `pcc-spons-${nonce}-${step}`;
    const customer = await customerFor(to, key);
    const inv = await stripe('/invoices', {
      customer,
      collection_method: 'send_invoice',
      days_until_due: String(days),
      pending_invoice_items_behavior: 'exclude',
      description: `${SITE.name}: sponsorship for ${to.name}.`,
      footer: `Thank you for supporting the chamber. Questions about this invoice: ${SITE.email}`,
      'metadata[kind]': 'sponsorship', 'metadata[id]': nonce, 'metadata[year]': String(year),
      ...(to.slug ? { 'metadata[slug]': to.slug } : {})
    }, key('inv'));

    let n = 0;
    for (const l of lines) {
      await stripe('/invoiceitems', {
        customer, invoice: inv.id, currency: 'usd', amount: String(l.cents),
        description: l.detail ? `${l.name}. ${l.detail}` : l.name
      }, key('item' + n++));
    }
    if (credit) {
      await stripe('/invoiceitems', {
        customer, invoice: inv.id, currency: 'usd', amount: String(-credit),
        description: `Sponsorship credit included with your ${year} ${TIER_NAMES[to.tier] || ''} membership`.replace(/\s+/g, ' ')
      }, key('credit'));
    }

    const fin = await stripe(`/invoices/${inv.id}/finalize`, { auto_advance: 'true' }, key('fin'));
    await stripe(`/invoices/${inv.id}/send`, {}, key('send'));

    const rec = {
      id: nonce, ...base, status: 'sent', invoice: inv.id, number: fin.number || '',
      url: fin.hosted_invoice_url || '', due: fin.due_date ? new Date(fin.due_date * 1000).toISOString().slice(0, 10) : ''
    };
    await put(year, rec);

    /* Logged after Stripe accepted it, so a failed send never uses up
       anybody's credit. */
    if (credit) {
      try {
        rec.creditUse = await logCredit(to.slug, credit, `Applied to sponsorship invoice ${rec.number || inv.id}: ${what}`, who);
        await put(year, rec);
      } catch (err) {
        console.error('credit log failed', err, err.detail || '');
        rec.creditProblem = 'Sent, but the credit could not be logged in the benefits tracker. Log it there by hand.';
        await put(year, rec);
      }
    }
    return { ok: true, record: rec };
  } finally {
    await kv('DEL', `spons:lock:${nonce}`);
  }
}

const STATUS = { paid: 'paid', void: 'void', uncollectible: 'uncollectible', open: 'sent' };

async function settle(year, rec, status) {
  if (status === rec.status) return false;
  const next = { ...rec, status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) };
  if (status === 'void' && rec.creditUse) {
    try {
      await unlogCredit(rec.creditUse, `invoice ${rec.number || rec.invoice} for ${rec.to.name} was voided`);
      delete next.creditUse;
      next.creditReturned = true;
    } catch (err) {
      console.error('credit return failed', err, err.detail || '');
      next.creditProblem = 'Voided, but the credit could not be put back in the benefits tracker. Remove the log entry by hand.';
    }
  }
  await put(year, next);
  return true;
}

export async function spRefresh(year) {
  const open = (await records(year)).filter(r => r.status === 'sent' && r.invoice).slice(0, 25);
  let changed = 0;
  for (const r of open) {
    const inv = await stripe('/invoices/' + r.invoice);
    if (await settle(year, r, STATUS[inv.status] || r.status)) changed++;
  }
  return { checked: open.length, changed };
}

/* From the webhook. Only touches invoices this file sent. */
export async function spEvent(event) {
  const inv = event.data && event.data.object;
  const meta = inv && inv.metadata;
  if (!meta || meta.kind !== 'sponsorship' || !meta.id || !meta.year) return;
  const status = { 'invoice.paid': 'paid', 'invoice.voided': 'void', 'invoice.marked_uncollectible': 'uncollectible' }[event.type];
  if (!status) return;
  const raw = await kv('HGET', `spons:${meta.year}`, meta.id);
  if (!raw) return;
  const rec = { id: meta.id, ...JSON.parse(raw) };
  if (rec.invoice !== inv.id) return;
  await settle(meta.year, rec, status);
}
