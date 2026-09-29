/* ==========================================================================
   WHAT EACH MEMBER OWES

   Worked out from the same tier list the membership page shows
   (data/membership.js), so the invoice and the website can never quote
   different numbers. Change a price there and the next invoices follow.

   Basic Business is priced by size, so a Basic member needs their size set
   in the admin (Member directory, "Size, for dues") before they can be
   invoiced. Everyone else pays their level's one price.

   A member's own "Dues override" wins over all of that. Use it for a
   negotiated rate, a board-approved in-kind arrangement, or 0 for somebody
   who is not invoiced at all this year.

   Used by the admin in the browser and by api/_lib/dues.js on the server,
   so both always agree.
   ========================================================================== */

import { TIER_LIST } from './membership.js';

/* Basic Business sizes, in the order data/membership.js lists them. */
export const SIZES = [
  { id: 'small', label: 'Under 5 employees' },
  { id: 'mid', label: '5 to 15 employees' },
  { id: 'large', label: '16 or more employees' },
  { id: 'nonprofit', label: 'Nonprofit, any size' }
];

const cents = price => {
  const n = Number(String(price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

/* { cents, label } when there is an amount, { cents: null, problem } when
   the member cannot be invoiced yet. cents is 0 for somebody not billed. */
export function duesFor(m) {
  if (m.dues !== undefined && m.dues !== null && m.dues !== '') {
    const n = Number(m.dues);
    if (!Number.isFinite(n) || n < 0) return { cents: null, problem: 'Dues override is not a number' };
    return { cents: Math.round(n * 100), label: n === 0 ? 'Not billed' : 'Override' };
  }
  const tier = TIER_LIST.find(t => t.id === m.tier);
  if (!tier) return { cents: null, problem: 'No membership level set' };
  if (Array.isArray(tier.scale) && tier.scale.length) {
    const i = SIZES.findIndex(s => s.id === m.size);
    if (i < 0) return { cents: null, problem: 'Size not set' };
    const row = tier.scale.find(r => r.label === SIZES[i].label) || tier.scale[i];
    const c = row && cents(row.price);
    return c ? { cents: c, label: `${tier.name}, ${SIZES[i].label.toLowerCase()}` } : { cents: null, problem: 'No price for that size' };
  }
  const c = cents(tier.price);
  return c ? { cents: c, label: tier.name } : { cents: null, problem: 'No price for that level' };
}

/* Who the invoice goes to: the listed contact email first, since that is
   usually whoever pays, then the first person who can sign in. */
export function billTo(m) {
  const list = [m.contact && m.contact.email, ...(Array.isArray(m.access) ? m.access : [])]
    .map(x => String(x || '').trim().toLowerCase()).filter(Boolean);
  return list[0] || '';
}

/* Invoices sent in October or later are for next year's membership. */
export function duesYear(now = new Date()) {
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

export const money = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 });
