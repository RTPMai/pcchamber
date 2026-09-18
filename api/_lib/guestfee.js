/* ==========================================================================
   THE LUNCHEON GUEST FEE

   Events with a guest fee (the luncheon, $10) and a registration link
   somewhere else (the Tournament Club) work like this:

     A signed-in member     goes straight to the club's registration link.
     Anybody else           pays the guest fee to the chamber through
                            Stripe, then gets the club's link, on screen
                            and by email.

   Lunch itself is still paid to the club. The guest fee is the chamber's.

   The club's link is never written into the public website for these
   events. It only comes back from the server after sign-in or payment.
   That is a nudge, not a lock: the club's page is public, and anybody who
   already knows the address can go straight there. The check-in list
   shows who paid, which is the real backstop at the door.

   Everyone who goes through, member or paying guest, is added to the
   event's check-in list, so the list at the door is ready before anybody
   arrives.

   SETTINGS

     STRIPE_SECRET_KEY       from the Stripe dashboard, Developers, API keys.
                             sk_test_... while testing, sk_live_... after.
     STRIPE_WEBHOOK_SECRET   optional but recommended. Stripe, Developers,
                             Webhooks, add endpoint
                             https://polkcitychamber.com/api/stripe
                             for the event checkout.session.completed, and
                             copy its signing secret (whsec_...). This is
                             what still sends the link if somebody pays and
                             closes the tab before coming back.

   Without STRIPE_SECRET_KEY the page says online payment is not switched
   on yet and points people to the chamber's email.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { kv } from './store.js';
import { sendMail, mailMissing } from './mail.js';
import { SITE } from '../../data/site.js';

export const stripeMissing = () => (process.env.STRIPE_SECRET_KEY || '').trim() ? [] : ['STRIPE_SECRET_KEY'];

export const calendar = () =>
  JSON.parse(readFileSync(new URL('../../content/events.json', import.meta.url), 'utf8')).calendar || [];

/* An event is gated when it has both a fee and somewhere to register. */
export const isGated = e => Boolean(e && e.rsvp && e.rsvp.href && Number(e.guestFee) > 0);

async function stripe(path, form) {
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: form ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${(process.env.STRIPE_SECRET_KEY || '').trim()}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    ...(form ? { body: new URLSearchParams(form).toString() } : {})
  });
  const out = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error('The payment could not be started. Try again, or email the chamber.'),
      { status: 502, detail: JSON.stringify(out.error || out) });
  }
  return out;
}

export function createCheckout(e, guest, origin) {
  const cents = Math.round(Number(e.guestFee) * 100);
  return stripe('/checkout/sessions', {
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(cents),
    'line_items[0][price_data][product_data][name]': `Guest fee: ${e.title}, ${e.date}`,
    'line_items[0][price_data][product_data][description]': 'Chamber guest fee. Lunch is paid separately to the venue.',
    customer_email: guest.email,
    'metadata[event]': e.id,
    'metadata[name]': guest.name,
    'metadata[business]': guest.business || '',
    'payment_intent_data[description]': `Guest fee, ${e.title} ${e.date}, ${guest.name}`,
    success_url: `${origin}/events/paid/?s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/events/#${e.id}`
  });
}

export const getSession = id => stripe('/checkout/sessions/' + encodeURIComponent(id));

/* Put a paid guest on the check-in list and email them the link. Safe to
   call more than once for the same payment: the return page and the
   webhook both call it, and whichever is second does nothing. */
export async function recordPaid(session) {
  if (session.payment_status !== 'paid') return null;
  const e = calendar().find(x => x.id === session.metadata?.event);
  if (!e) return null;

  const field = 'pay-' + session.id.slice(-16);
  const existing = await kv('HGET', `rsvp:${e.id}`, field);
  if (!existing) {
    const r = {
      id: field,
      name: session.metadata.name || 'Guest',
      email: (session.customer_details?.email || session.customer_email || '').toLowerCase(),
      business: session.metadata.business || '',
      guests: 0, member: null, ticket: false,
      paid: (session.amount_total || 0) / 100,
      at: new Date().toISOString(), checkedIn: null
    };
    await kv('HSET', `rsvp:${e.id}`, field, JSON.stringify(r));
    await kv('EXPIRE', `rsvp:${e.id}`, String(60 * 60 * 24 * 400));
  }

  const first = await kv('SET', `gf:mailed:${session.id}`, '1', 'NX', 'EX', String(60 * 60 * 24 * 60));
  const to = session.customer_details?.email || session.customer_email;
  if (first === 'OK' && to && !mailMissing().length) {
    try {
      await sendMail({
        to,
        subject: `Next step: register for ${e.title}`,
        text: [
          `Thanks, ${String(session.metadata.name || '').split(' ')[0] || 'and welcome'}. Your $${(session.amount_total / 100).toFixed(2)} guest fee is paid.`,
          '',
          `Now register and pick your meal with the venue. Lunch is paid to them:`,
          e.rsvp.href,
          '',
          `${e.title}, ${e.date}${e.start ? ' at ' + e.start : ''}, ${e.where}.`,
          '',
          'Enjoy the lunch, and ask anyone there about joining. Members skip the guest fee.',
          '',
          SITE.name
        ].join('\n'),
        headers: { 'Reply-To': SITE.email }
      });
    } catch (err) {
      console.error('guest fee email failed', err.detail || err);
    }
  }
  return e;
}
