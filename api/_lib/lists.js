/* ==========================================================================
   WHO GETS CHAMBER EMAIL

   Shared by the newsletter screen, member messages and the Monday digest,
   so the three cannot disagree about who is on which list or how somebody
   gets off one.

   Two lists, kept apart on purpose:

     subscribers   people who signed up for chamber news and confirmed it.
                   nl:subs in the store. Leave with their unsubscribe link.

     members       the addresses on each member's sign-in list, or their
                   public email if they have no list. Leave member email
                   with the opt-out link, which is signed with
                   MEMBER_SECRET so nobody can opt anybody else out.
                   nm:optout in the store.
   ========================================================================== */

import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { kv, hashToObject } from './store.js';

export const okEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function subscribers() {
  const raw = hashToObject(await kv('HGETALL', 'nl:subs'));
  return Object.entries(raw).map(([email, v]) => ({ email, ...JSON.parse(v) }));
}

export const memberAddrs = m => {
  const list = Array.isArray(m.access) && m.access.length ? m.access : (m.contact?.email ? [m.contact.email] : []);
  return [...new Set(list.map(x => String(x).trim().toLowerCase()).filter(okEmail))];
};

export const optSig = email => createHmac('sha256', (process.env.MEMBER_SECRET || process.env.ADMIN_PASSCODE || '').trim())
  .update('pcc-member-optout:' + email).digest('hex').slice(0, 24);

export const unsubLink = (base, s) => `${base}/api/newsletter?unsub=${s.u}&e=${encodeURIComponent(s.email)}`;
export const optOutLink = (base, email) => `${base}/api/newsletter?mout=${optSig(email)}&e=${encodeURIComponent(email)}`;

export async function optedOut() {
  return new Set(Object.keys(hashToObject(await kv('HGETALL', 'nm:optout'))));
}

export const roster = () =>
  JSON.parse(readFileSync(new URL('../../content/members.json', import.meta.url), 'utf8')).members || [];
