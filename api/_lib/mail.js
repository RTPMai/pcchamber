/* ==========================================================================
   SENDING EMAIL

   Everything goes through Resend, with the same two settings the password
   emails already use:

     RESEND_API_KEY      from resend.com
     MEMBER_EMAIL_FROM   for example Polk City Area Chamber <hello@polkcitychamber.com>
                         on a domain verified in Resend

   Resend's free plan is 100 emails a day and 3,000 a month. The quarterly
   member email and a newsletter to a few hundred people fit inside that.
   A newsletter to more than 100 people in one day does not, and needs the
   paid plan or sending over two days. The newsletter screen says so before
   anything goes out.

   COUNTING

   Every send is counted against the day in the store (mail:day:<date>,
   by the UTC day, which is the day Resend counts by). The Monday digest
   uses the count to send only what fits today and carry the rest to
   tomorrow. MAIL_DAILY_LIMIT changes the limit, for a paid Resend plan.
   ========================================================================== */

import { kv, storeReady } from './store.js';
import { SITE } from '../../data/site.js';

/* REPLIES

   MEMBER_EMAIL_FROM is a sending address, not a mailbox anyone reads. So
   every email carries a Reply-To, and a reply always reaches a person:
   whatever the caller asked for (a form sends the person who filled it
   in), otherwise the chamber's own address in data/site.js. It goes in
   Resend's reply_to field, not a raw header, because some mail programs
   ignore the raw one. */
const replyFields = headers => {
  const h = { ...(headers || {}) };
  const asked = h['Reply-To'];
  delete h['Reply-To'];
  return {
    reply_to: asked || SITE.email,
    ...(Object.keys(h).length ? { headers: h } : {})
  };
};

export const dailyLimit = () => {
  const n = parseInt(process.env.MAIL_DAILY_LIMIT || '', 10);
  return n > 0 ? n : 100;
};

const dayKey = () => 'mail:day:' + new Date().toISOString().slice(0, 10);

/* Never lets a counting problem stop an email that already went. */
async function count(n) {
  if (!n || !storeReady()) return;
  try {
    await kv('INCRBY', dayKey(), n);
    await kv('EXPIRE', dayKey(), 3 * 86400);
  } catch (err) { console.error('could not count sent mail', err); }
}

export async function sentToday() {
  if (!storeReady()) return 0;
  try { return Number(await kv('GET', dayKey())) || 0; } catch { return 0; }
}

export function mailMissing() {
  return [
    !(process.env.RESEND_API_KEY || '').trim() && 'RESEND_API_KEY',
    !(process.env.MEMBER_EMAIL_FROM || '').trim() && 'MEMBER_EMAIL_FROM'
  ].filter(Boolean);
}

const from = () => (process.env.MEMBER_EMAIL_FROM || '').trim();
const key = () => (process.env.RESEND_API_KEY || '').trim();

async function resend(path, payload) {
  const res = await fetch('https://api.resend.com' + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw Object.assign(new Error('The email could not be sent.'), { status: 502, detail: await res.text() });
  }
  return res.json();
}

/* One message. to can be one address or several. */
export async function sendMail({ to, subject, text, html, headers }) {
  const out = await resend('/emails', {
    from: from(),
    to: Array.isArray(to) ? to : [to],
    subject, text,
    ...(html ? { html } : {}),
    ...replyFields(headers)
  });
  await count((Array.isArray(to) ? to : [to]).length);
  return out;
}

/* Many different messages, up to 100 per call to Resend. Each one gets
   its own unsubscribe link, which is why they are separate messages and
   not one email with everybody in BCC. */
export async function sendMany(messages) {
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map(m => ({
      from: from(),
      to: Array.isArray(m.to) ? m.to : [m.to],
      subject: m.subject, text: m.text,
      ...(m.html ? { html: m.html } : {}),
      ...replyFields(m.headers)
    }));
    await resend('/emails/batch', chunk);
    sent += chunk.length;
    await count(chunk.length);
  }
  return sent;
}

/* Plain, safe HTML escaping for the few emails that have an HTML part. */
export const escHtml = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
