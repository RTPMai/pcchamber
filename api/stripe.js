/* ==========================================================================
   /api/stripe   STRIPE'S WEBHOOK

   Stripe calls this when a guest fee is paid. It does the same thing as
   the page people land on after paying, which is the point: somebody who
   pays and closes the tab still ends up on the check-in list and still
   gets the registration link by email.

   Every call is checked against STRIPE_WEBHOOK_SECRET, so nobody can post
   a fake payment here. See api/_lib/guestfee.js for setup.
   ========================================================================== */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { recordPaid } from './_lib/guestfee.js';

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

export default async function handler(req, res) {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (req.method !== 'POST' || !secret) { res.status(404).end(); return; }
  try {
    const body = await raw(req);
    if (!verified(body, req.headers['stripe-signature'], secret)) {
      res.status(400).json({ error: 'bad_signature' });
      return;
    }
    const event = JSON.parse(body);
    if (event.type === 'checkout.session.completed') await recordPaid(event.data.object);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe webhook failed', err, err.detail || '');
    res.status(500).json({ error: 'failed' });
  }
}
