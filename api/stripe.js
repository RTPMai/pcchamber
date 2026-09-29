/* ==========================================================================
   /api/stripe   EVERYTHING STRIPE

   Two jobs in one function, to stay inside the plan's limit on functions.

   STRIPE'S WEBHOOK

   Stripe calls this when a guest fee is paid. It does the same thing as
   the page people land on after paying, which is the point: somebody who
   pays and closes the tab still ends up on the check-in list and still
   gets the registration link by email.

   Every call is checked against STRIPE_WEBHOOK_SECRET, so nobody can post
   a fake payment here. See api/_lib/guestfee.js for setup.

   It also hears about membership dues invoices being paid or voided,
   and updates the admin's dues list. See api/_lib/dues.js.

   THE ADMIN'S DUES SCREEN

   Posts here with the admin cookie and no Stripe signature. Actions:
   status, send, refresh.
   ========================================================================== */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { recordPaid } from './_lib/guestfee.js';
import { duesEvent, duesStatus, sendDues, refreshDues, stripeReady, BATCH } from './_lib/dues.js';
import { isAdmin } from './_lib/adminauth.js';
import { storeReady, storeMissing } from './_lib/store.js';

/* The signature is over the exact bytes Stripe sent, so this reads the
   raw body and never lets anything parse it first. */
const raw = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

function verified(body, header, secret) {
  const parts = Object.fromEntries(String(header || '').split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return false;
  const want = createHmac('sha256', secret).update(`${parts.t}.${body}`).digest('hex');
  const a = Buffer.from(want), b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const config = { api: { bodyParser: false } };

async function admin(req, res, body) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'locked', message: 'Please sign in to the admin again.' });
    return;
  }
  if (!storeReady()) {
    res.status(503).json({ error: 'not_configured', message: `Not set up yet. Missing in Vercel: ${storeMissing().join(', ')}.` });
    return;
  }
  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 2025 || year > 2100) {
    res.status(400).json({ error: 'bad_year', message: 'Pick a membership year.' });
    return;
  }
  if (body.action === 'status') {
    res.status(200).json(await duesStatus(year));
    return;
  }
  if (!stripeReady()) {
    res.status(503).json({ error: 'not_configured', message: 'Stripe is not connected. Set STRIPE_SECRET_KEY in Vercel.' });
    return;
  }
  if (body.action === 'send') {
    const slugs = Array.isArray(body.slugs) ? body.slugs.map(String) : [];
    res.status(200).json({ results: await sendDues(year, slugs, String(body.who || '').slice(0, 80)), batch: BATCH });
    return;
  }
  if (body.action === 'refresh') {
    res.status(200).json(await refreshDues(year));
    return;
  }
  res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(404).end(); return; }
  try {
    const body = await raw(req);

    /* No Stripe signature: the admin. */
    if (!req.headers['stripe-signature']) {
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch { /* treated as no action */ }
      await admin(req, res, parsed);
      return;
    }

    const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (!secret) { res.status(404).end(); return; }
    if (!verified(body, req.headers['stripe-signature'], secret)) {
      res.status(400).json({ error: 'bad_signature' });
      return;
    }
    const event = JSON.parse(body);
    if (event.type === 'checkout.session.completed') await recordPaid(event.data.object);
    else if (event.type.startsWith('invoice.')) await duesEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe failed', err, err.detail || '');
    if (!res.headersSent) res.status(err.status || 500).json({ error: 'failed', message: err.message || 'Something went wrong.' });
  }
}
