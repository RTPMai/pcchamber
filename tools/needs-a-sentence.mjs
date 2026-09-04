/* ==========================================================================
   WHAT IS STILL MISSING FROM THE DIRECTORY

   Prints a working list, worst first, so the round of phone calls and
   emails has an order to it rather than starting at A.

   Run:  node tools/needs-a-sentence.mjs
   ========================================================================== */

import { MEMBERS, CATEGORIES } from '../data/members.js';

const label = id => (CATEGORIES.find(c => c.id === id) || {}).label || id;

const scored = MEMBERS.map(m => {
  const c = m.contact || {};
  const missing = [
    !m.summary && 'a sentence',
    !c.phone && 'phone',
    !c.email && 'email',
    !c.web && 'website',
    !c.address && 'address',
    !m.city && 'town'
  ].filter(Boolean);
  return { m, missing };
}).sort((a, b) => b.missing.length - a.missing.length || a.m.name.localeCompare(b.m.name));

const worst = scored.filter(s => s.missing.length >= 3);
const rest = scored.filter(s => s.missing.length > 0 && s.missing.length < 3);
const done = scored.filter(s => s.missing.length === 0);

console.log(`\n${MEMBERS.length} members.\n`);

console.log(`START HERE. Thin enough that the page looks empty (${worst.length}):`);
for (const s of worst) {
  console.log(`   ${s.m.name}`);
  console.log(`      ${label(s.m.category)} | no ${s.missing.join(', no ')}`);
}

console.log(`\nMissing one or two things (${rest.length}):`);
for (const s of rest) console.log(`   ${s.m.name} — no ${s.missing.join(', no ')}`);

console.log(`\nComplete (${done.length}).`);

const tally = {};
for (const s of scored) for (const f of s.missing) tally[f] = (tally[f] || 0) + 1;
console.log('\nTotals:');
Object.entries(tally).sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`   ${String(v).padStart(2)} with no ${k}`));

const noTier = MEMBERS.filter(m => m.tier === 'basic').length;
if (noTier === MEMBERS.length) {
  console.log(`\nEvery member is on the default tier. Nobody is marked pro or premier,`);
  console.log(`so tier sorting and the referral badge are doing nothing yet.`);
}
