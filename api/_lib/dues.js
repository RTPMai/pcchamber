/* ==========================================================================
   MEMBERSHIP DUES, THROUGH STRIPE INVOICES

   Stripe does the parts that should not be home-made: the invoice email,
   the page where a member pays by card or bank transfer, receipts,
   reminders, refunds, and the record the treasurer reconciles against.
   This file only decides who gets an invoice for how much, sends them in
   batches, and remembers what happened to each.

   HOW IT RUNS

   Admin, Membership dues. Pick the year, check the list, press Send. Each
   member not yet invoiced for that year gets one Stripe invoice, due in
   30 days, emailed by Stripe with a Pay button. Pressing Send twice does
   nothing the second time: a member with an open or paid invoice for the
   year is skipped.

   When a member pays, Stripe tells /api/stripe (the webhook) and the list
   shows Paid. "Check Stripe" on the same screen asks Stripe directly, for
   anything the webhook missed.

   To cancel an invoice, void it in the Stripe dashboard, then Check
   Stripe. A voided invoice can be sent again from the admin.

   WHAT IS STORED

     dues:<year>         one entry per member: invoice id, amount, status
     dues:cust:<slug>    the member's Stripe customer, reused every year

   SETTINGS

     STRIPE_SECRET_KEY       the same one the guest fee uses
     STRIPE_WEBHOOK_SECRET   the same webhook, with invoice.paid,
                             invoice.voided and
                             invoice.marked_uncollectible added to its
                             events in the Stripe dashboard

   TESTING

   With an sk_test_ key nothing real is charged, and Stripe does not email
   test invoices to anyone outside the Stripe account. Open the invoice
   link in the admin list to see what the member would see.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { kv, hashToObject } from './store.js';
import { duesFor, billTo } from '../../data/dues.js';
import { TIER_NAMES } from '../../data/benefits.js';
import { SITE } from '../../data/site.js';

export const DAYS_TO_PAY = 30;
const OPEN = ['sent', 'paid'];

export const stripeReady = () => Boolean((process.env.STRIPE_SECRET_KEY || '').trim());
export const testMode = () => (process.env.STRIPE_SECRET_KEY || '').trim().startsWith('sk_test_');

const roster = () =>
  JSON.parse(readFileSync(new URL('../../content/members.json', import.meta.url), 'utf8')).members || [];

async function stripe(path, form, idem) {
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: form ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${(process.env.STRIPE_SECRET_KEY || '').trim()}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idem ? { 'Idempotency-Key': idem } : {})
    },
    ...(form ? { body: new URLSearchParams(form).toString() } : {})
  });
  const out = await res.json();
  if (!res.ok) {
    const msg = out.error && out.error.message ? `Stripe said: ${out.error.message}` : 'Stripe did not accept that.';
    throw Object.assign(new Error(msg), { status: 502, detail: JSON.stringify(out.error || out) });
  }
  return out;
}

async function records(year) {
  const raw = hashToObject(await kv('HGETALL', `dues:${year}`));
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, JSON.parse(v)]));
}

const put = (year, slug, rec) => kv('HSET', `dues:${year}`, slug, JSON.stringify(rec));

/* The whole list for the admin screen. */
export async function duesStatus(year) {
  const recs = await records(year);
  const members = roster().map(m => {
    const d = duesFor(m);
    return {
      slug: m.slug, name: m.name, tier: m.tier, tierName: TIER_NAMES[m.tier] || m.tier || '',
      cents: d.cents, label: d.label || '', problem: d.problem || (d.cents > 0 && !billTo(m) ? 'No email' : ''),
      email: billTo(m), record: recs[m.slug] || null
    };
  });
  return { year, members, ready: stripeReady(), test: testMode(), days: DAYS_TO_PAY };
}

/* One member's invoice. Returns what happened, never throws for an
   ordinary reason not to send, so one bad row does not stop a batch. */
async function sendOne(year, m, who) {
  const d = duesFor(m);
  const email = billTo(m);
  if (d.cents === null) return { slug: m.slug, skipped: d.problem };
  if (d.cents === 0) return { slug: m.slug, skipped: 'Not billed' };
  if (!email) return { slug: m.slug, skipped: 'No email' };

  const prev = JSON.parse(await kv('HGET', `dues:${year}`, m.slug) || 'null');
  if (prev && OPEN.includes(prev.status)) return { slug: m.slug, skipped: 'Already invoiced' };

  /* Two people pressing Send at once must not bill anyone twice. */
  const lock = await kv('SET', `dues:lock:${year}:${m.slug}`, '1', 'NX', 'EX', '120');
  if (lock !== 'OK') return { slug: m.slug, skipped: 'Being sent right now' };

  try {
    const attempt = prev ? (prev.attempt || 1) + 1 : 1;
    const key = step => `pcc-dues-${year}-${m.slug}-${attempt}-${step}`;

    let customer = await kv('GET', `dues:cust:${m.slug}`);
    if (!customer) {
      const c = await stripe('/customers', {
        name: m.name, email, 'metadata[slug]': m.slug, preferred_locales: 'en-US'
      }, key('cust'));
      customer = c.id;
      await kv('SET', `dues:cust:${m.slug}`, customer);
    } else {
      /* The contact email may have changed since last year. */
      await stripe('/customers/' + customer, { email, name: m.name }, key('custupd'));
    }

    const what = `${year} membership dues, ${d.label}`;
    const inv = await stripe('/invoices', {
      customer,
      collection_method: 'send_invoice',
      days_until_due: String(DAYS_TO_PAY),
      pending_invoice_items_behavior: 'exclude',
      description: `${SITE.name}: ${year} membership for ${m.name}.`,
      footer: `Questions about this invoice: ${SITE.email}`,
      'metadata[slug]': m.slug, 'metadata[year]': String(year), 'metadata[kind]': 'dues'
    }, key('inv'));

    await stripe('/invoiceitems', {
      customer, invoice: inv.id, currency: 'usd',
      amount: String(d.cents), description: what
    }, key('item'));

    const fin = await stripe(`/invoices/${inv.id}/finalize`, { auto_advance: 'true' }, key('fin'));
    await stripe(`/invoices/${inv.id}/send`, {}, key('send'));

    const rec = {
      id: inv.id, number: fin.number || '', cents: d.cents, email,
      status: 'sent', url: fin.hosted_invoice_url || '', due: fin.due_date ? new Date(fin.due_date * 1000).toISOString().slice(0, 10) : '',
      sentAt: new Date().toISOString(), by: who, attempt
    };
    await put(year, m.slug, rec);
    return { slug: m.slug, sent: true, record: rec };
  } finally {
    await kv('DEL', `dues:lock:${year}:${m.slug}`);
  }
}

/* A batch, kept small so it finishes inside the function's time limit.
   The admin screen calls this repeatedly until everyone is done. */
export const BATCH = 5;
export async function sendDues(year, slugs, who) {
  const all = roster();
  const out = [];
  for (const slug of slugs.slice(0, BATCH)) {
    const m = all.find(x => x.slug === slug);
    if (!m) { out.push({ slug, skipped: 'Not a member' }); continue; }
    try { out.push(await sendOne(year, m, who)); }
    catch (err) {
      console.error('dues send failed', slug, err.detail || err);
      out.push({ slug, error: err.message });
    }
  }
  return out;
}

/* What Stripe says now, for invoices the webhook may have missed. */
const STATUS = { paid: 'paid', void: 'void', uncollectible: 'uncollectible', open: 'sent' };
export async function refreshDues(year) {
  const recs = await records(year);
  const open = Object.entries(recs).filter(([, r]) => r.status === 'sent').slice(0, 25);
  let changed = 0;
  for (const [slug, r] of open) {
    const inv = await stripe('/invoices/' + r.id);
    const status = STATUS[inv.status] || r.status;
    if (status !== r.status) {
      changed++;
      await put(year, slug, { ...r, status, ...(status === 'paid' ? { paidAt: new Date((inv.status_transitions?.paid_at || Date.now() / 1000) * 1000).toISOString() } : {}) });
    }
  }
  return { checked: open.length, changed, more: Object.values(recs).filter(r => r.status === 'sent').length > 25 };
}

/* From the webhook. Only touches invoices this file sent. */
export async function duesEvent(event) {
  const inv = event.data && event.data.object;
  const meta = inv && inv.metadata;
  if (!meta || meta.kind !== 'dues' || !meta.slug || !meta.year) return;
  const status = { 'invoice.paid': 'paid', 'invoice.voided': 'void', 'invoice.marked_uncollectible': 'uncollectible' }[event.type];
  if (!status) return;
  const r = JSON.parse(await kv('HGET', `dues:${meta.year}`, meta.slug) || 'null');
  if (!r || r.id !== inv.id) return;
  await put(meta.year, meta.slug, { ...r, status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) });
}
