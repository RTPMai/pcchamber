/* ==========================================================================
   LISTING STATS

   How often each member's directory page was looked at, and how often
   somebody clicked through to call, email, visit their website, or get
   directions. Shown to the member on their account page and in the
   quarterly email, because "your page was seen 212 times" is the easiest
   renewal argument the chamber has.

   WHAT IS STORED

   Only counts. Per member, per year and per month:

     st:y:2027:<slug>      view, web, phone, email, map
     st:m:2027-03:<slug>   the same, for one month

   To avoid counting one person reloading a page twenty times, each
   visitor is recognised for one day by a hash of their address, browser
   and the date. The hash is kept for a day and a bit, then expires. No
   cookies, nothing that identifies anybody.
   ========================================================================== */

import { kvPipeline, hashToObject, storeReady } from './store.js';

export const KINDS = ['view', 'web', 'phone', 'email', 'map'];

const month = d => d.toISOString().slice(0, 7);
const zero = () => Object.fromEntries(KINDS.map(k => [k, 0]));

function add(into, raw) {
  const o = hashToObject(raw);
  for (const k of KINDS) into[k] += Number(o[k] || 0);
  return into;
}

/* The months of a quarter, as YYYY-MM. q is 1 to 4. */
export function quarterMonths(year, q) {
  return [0, 1, 2].map(i => `${year}-${String((q - 1) * 3 + 1 + i).padStart(2, '0')}`);
}

/* The quarter before the one a date is in. Used by the quarterly email,
   which goes out at the start of a quarter about the one just finished. */
export function lastQuarter(now = new Date()) {
  const q = Math.floor(now.getUTCMonth() / 3) + 1;
  return q === 1 ? { year: now.getUTCFullYear() - 1, q: 4 } : { year: now.getUTCFullYear(), q: q - 1 };
}

/* For many members at once, in one round trip. Returns
   { slug: { year: {...}, quarter: {...} } }. quarter is optional. */
export async function statsFor(slugs, year, quarter) {
  const out = Object.fromEntries(slugs.map(s => [s, { year: zero(), quarter: zero() }]));
  if (!storeReady() || !slugs.length) return out;

  const months = quarter ? quarterMonths(quarter.year, quarter.q) : [];
  const cmds = [];
  for (const s of slugs) {
    cmds.push(['HGETALL', `st:y:${year}:${s}`]);
    for (const m of months) cmds.push(['HGETALL', `st:m:${m}:${s}`]);
  }
  const res = await kvPipeline(cmds);
  let i = 0;
  for (const s of slugs) {
    add(out[s].year, res[i++]);
    for (let j = 0; j < months.length; j++) add(out[s].quarter, res[i++]);
  }
  return out;
}

/* One hit. Returns false if this visitor was already counted today. */
export async function countHit(slug, kind, visitor) {
  const now = new Date();
  const seen = `st:seen:${visitor}`;
  const [first] = await kvPipeline([['SET', seen, '1', 'NX', 'EX', '93600']]);
  if (first !== 'OK') return false;
  const y = `st:y:${now.getUTCFullYear()}:${slug}`;
  const m = `st:m:${month(now)}:${slug}`;
  await kvPipeline([
    ['HINCRBY', y, kind, '1'],
    ['HINCRBY', m, kind, '1'],
    ['EXPIRE', m, String(60 * 60 * 24 * 800)]
  ]);
  return true;
}

/* In words, for the member page and the email. */
export function statsLine(s) {
  const bits = [];
  const n = (v, one, many) => `${v.toLocaleString('en-US')} ${v === 1 ? one : many}`;
  if (s.web) bits.push(n(s.web, 'website visit', 'website visits'));
  if (s.phone) bits.push(n(s.phone, 'call tap', 'call taps'));
  if (s.email) bits.push(n(s.email, 'email tap', 'email taps'));
  if (s.map) bits.push(n(s.map, 'directions lookup', 'directions lookups'));
  return bits;
}
