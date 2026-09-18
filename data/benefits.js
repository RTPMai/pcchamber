/* ==========================================================================
   BENEFITS, AS NUMBERS

   The membership page says what each level gets in words. This file says
   the same thing as numbers, so the tracker can count what has been used
   and what is left.

   USED IN THREE PLACES, SO KEEP IT PLAIN

     the admin      logging a use, and the who-is-using-what overview
     the member     "Your benefits" on the member account page
     the build      copies this file and membership.js into /admin/

   It runs in the browser and on the server, so it cannot import anything
   from Node. Only ./membership.js.

   THE FOUR KINDS

     count     a number per year. Luncheon tickets, spotlights.
     dollars   a dollar amount per year. Sponsorship credit.
     once      done or not done this year. The plaque, the window cling.
     open      included with no limit. Logged so the chamber can see it is
               being used, not to stop anybody. Ribbon cuttings, notary.

   per says which levels get it and how many. For open benefits the number
   is just true.

   THE YEAR

   Counts reset at the start of the membership year. That is January unless
   YEAR_STARTS_MONTH says otherwise. If dues ever move to a fiscal year,
   change the one number below and every count follows.

   A MEMBER WHO CHANGES LEVEL

   What they are allowed is always worked out from the level they are on
   now, against everything logged this year. Upgrading in June gives them
   the bigger allowance straight away, with what they already used counted
   against it. That is almost always what you want.
   ========================================================================== */

import { TIER_LIST } from './membership.js';

export const YEAR_STARTS_MONTH = 1;   // 1 is January

/* Lowest to highest. Individual sits outside the ladder because it is for
   a person, and does not include Basic Business. */
const LADDER = ['basic', 'partner', 'investor', 'sponsor', 'champion'];

/* The level named and every level above it. Matches "Everything in X,
   plus" on the membership page. */
const from = (tier, value = true) =>
  Object.fromEntries(LADDER.slice(LADDER.indexOf(tier)).map(t => [t, value]));

export const BENEFITS = [

  /* ---------- counted ---------------------------------------------------- */

  { id: 'luncheon', label: 'Luncheon tickets', kind: 'count', unit: 'ticket',
    detail: 'One time use each. They do not roll over to next year.',
    per: { partner: 3, investor: 6, sponsor: 6, champion: 12 } },

  { id: 'spotlight', label: 'Social media spotlights', kind: 'count', unit: 'spotlight',
    per: { investor: 2, sponsor: 4, champion: 12 } },

  { id: 'eblast', label: 'Stand-alone email to the full membership', kind: 'count', unit: 'email',
    per: from('investor', 1) },

  { id: 'foursome', label: 'Golf tournament foursomes', kind: 'count', unit: 'foursome',
    per: { sponsor: 1, champion: 2 } },

  { id: 'impact', label: 'Impact reports', kind: 'count', unit: 'report',
    detail: 'Quarterly.',
    per: from('sponsor', 4) },

  /* ---------- dollars ---------------------------------------------------- */

  { id: 'credit', label: 'Sponsorship credit', kind: 'dollars',
    detail: 'Put toward any chamber sponsorship.',
    per: { investor: 250, sponsor: 500, champion: 1000 } },

  /* ---------- once a year ------------------------------------------------ */

  { id: 'cling', label: 'Chamber window cling', kind: 'once', per: from('basic', 1) },
  { id: 'gdmp', label: 'Greater Des Moines Partnership membership set up', kind: 'once', per: from('basic', 1) },
  { id: 'social-welcome', label: 'New member social recognition', kind: 'once', per: { individual: 1 } },
  { id: 'logo-involved', label: 'Logo on the Get Involved page', kind: 'once', per: from('partner', 1) },
  { id: 'host', label: 'Host a networking event', kind: 'once', per: from('partner', 1) },
  { id: 'signature', label: 'Email signature logo and newsletter recognition', kind: 'once', per: from('investor', 1) },
  { id: 'golf-hole', label: 'Golf hole sponsorship', kind: 'once', per: from('investor', 1) },
  { id: 'plaque', label: 'Annual member plaque', kind: 'once', per: from('sponsor', 1) },
  { id: 'badge', label: 'Digital chamber member badge', kind: 'once', per: from('sponsor', 1) },
  { id: 'naming', label: 'Naming sponsorship of a signature event', kind: 'once', per: { champion: 1 } },
  { id: 'profile', label: 'Feature profile in the annual publication', kind: 'once', per: { champion: 1 } },
  { id: 'impact-live', label: 'In-person annual impact report', kind: 'once', per: { champion: 1 } },

  /* ---------- open ------------------------------------------------------- */

  { id: 'ribbon', label: 'Ribbon cuttings', kind: 'open', per: from('basic') },
  { id: 'calendar', label: 'Events calendar listings', kind: 'open', per: from('basic') },
  { id: 'referral', label: 'Referrals sent their way', kind: 'open', per: from('basic') },
  { id: 'growth-credit', label: 'Referral growth credit', kind: 'open', per: from('basic') },
  { id: 'coffee', label: 'Coffee and Connections', kind: 'open', per: from('basic') },
  { id: 'notary', label: 'Notary', kind: 'open', per: from('basic') },
  { id: 'events', label: 'Networking events and workshops', kind: 'open', per: { individual: true } },
  { id: 'volunteer', label: 'Volunteering and committees', kind: 'open', per: { individual: true } },
  { id: 'legislator', label: 'Legislator coffee', kind: 'open', per: from('partner') },
  { id: 'welcome-kit', label: 'Welcome Kit contributions', kind: 'open', per: from('partner') },
  { id: 'signage', label: 'Logo on event signage', kind: 'open', per: from('sponsor') },
  { id: 'roundtable', label: 'Chamber Priorities roundtable', kind: 'open', per: { champion: true } }
];

export const TIER_NAMES = Object.fromEntries(TIER_LIST.map(t => [t.id, t.name]));

/* The membership year a date falls in, as the year it started. With a
   January start that is just the calendar year. */
export function yearOf(iso) {
  const [y, m] = String(iso || '').split('-').map(Number);
  if (!y) return null;
  return m >= YEAR_STARTS_MONTH ? y : y - 1;
}

export function thisYear(now = new Date()) {
  return yearOf(now.toISOString().slice(0, 10));
}

/* What someone on this level gets. */
export const benefitsFor = tier => BENEFITS.filter(b => b.per[tier] != null);

/* How much one logged use counts for. A count logged with no quantity
   is one; a dollar entry with no amount counts for nothing rather than
   guessing. */
const weight = (b, use) =>
  b.kind === 'dollars' ? Number(use.amount) || 0 : Math.max(1, Number(use.qty) || 1);

/* Everything the tracker shows, for one member, for one year.

   Returns one row per benefit on their level, plus any logged against a
   benefit their level does not include (from before a downgrade, or a
   mistake), so nothing logged ever silently disappears. */
export function summarize(tier, uses, year) {
  const mine = uses.filter(u => yearOf(u.date) === year);
  const rows = benefitsFor(tier).map(b => {
    const logged = mine.filter(u => u.benefit === b.id);
    const used = logged.reduce((n, u) => n + weight(b, u), 0);
    const allowed = b.kind === 'open' ? null : b.per[tier];
    return {
      id: b.id, label: b.label, kind: b.kind, unit: b.unit || '', detail: b.detail || '',
      allowed, used,
      left: allowed == null ? null : Math.max(0, allowed - used),
      over: allowed != null && used > allowed,
      last: logged.map(u => u.date).sort().pop() || null
    };
  });

  const known = new Set(rows.map(r => r.id));
  for (const u of mine) {
    if (known.has(u.benefit)) continue;
    const b = BENEFITS.find(x => x.id === u.benefit);
    rows.push({
      id: u.benefit, label: b ? b.label : u.benefit, kind: b ? b.kind : 'open',
      unit: '', detail: 'Not part of their current level.', allowed: null,
      used: mine.filter(x => x.benefit === u.benefit).length, left: null, over: false,
      last: null, outside: true
    });
    known.add(u.benefit);
  }
  return rows;
}

/* One number for the overview: of the benefits that have a limit, how
   much has been used, averaged. Open benefits are left out, because there
   is no amount that counts as fully used. */
export function uptake(rows) {
  const capped = rows.filter(r => r.allowed != null && !r.outside);
  if (!capped.length) return null;
  const share = capped.reduce((n, r) => n + Math.min(1, r.used / r.allowed), 0) / capped.length;
  return Math.round(share * 100);
}

/* How a row reads, in words. Shared so the admin and the member see the
   same sentence. */
export function describe(r) {
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (r.kind === 'open') return r.used ? `Used ${r.used === 1 ? 'once' : r.used + ' times'}` : 'Not used yet';
  if (r.kind === 'once') return r.used ? 'Done' : 'Not yet';
  if (r.kind === 'dollars') return `$${r.used.toLocaleString('en-US')} of $${r.allowed.toLocaleString('en-US')} used`;
  if (r.outside) return plural(r.used, 'use');
  return `${r.used} of ${plural(r.allowed, r.unit)} used`;
}
