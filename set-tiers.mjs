/* ==========================================================================
   scripts/set-tiers.mjs

   Sets every member's tier in content/members.json from the chamber's
   2026 list (Chamber_List_2026.xlsx). Only the tier field changes.

     node scripts/set-tiers.mjs           dry run, shows what would change
     node scripts/set-tiers.mjs --write   saves content/members.json

   Names are matched loosely (case, punctuation, "&" vs "and", small typos),
   so "Papa's Pizzaria" on the site still finds "Papa's Pizzeria" here.
   Anything it can't match is listed at the end and left alone.
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';

/* No nonprofit level in the approved six. Change this one word if the
   board decides otherwise. */
const NONPROFIT = 'basic';

const LIST = [
  // Community Sponsor
  ['Polk County Iowa Board of Supervisors', 'sponsor'],
  ['City of Polk City', 'sponsor'],

  // Community Investor
  ['Grinnell State Bank', 'investor'],
  ['Home State Bank', 'investor'],
  ['Knapp Properties', 'investor'],
  ['Luana Savings Bank', 'investor'],
  ['Nova MedSpa', 'investor'],

  // Community Partner
  ['Snyder & Associates Inc.', 'partner'],
  ['Triplett-Westendorf Financial Services LLC', 'partner'],
  ['Whatcha Smokin? BBQ + Brew, Whatcha Smokin? BBQ Catering', 'partner'],

  // Individual
  ['Laramie Sandquist', 'individual'],
  ['Whitney Parker', 'individual'],

  // Nonprofit and religious
  ['Lakeside Fellowship Church', NONPROFIT],
  ['Polk City United Methodist Church', NONPROFIT],
  ['On With Life', NONPROFIT],
  ['Polk City Iowa American Legion Post 232', NONPROFIT],
  ['Big Creek Historical Society', NONPROFIT],
  ['Kiwanis Club of Polk City', NONPROFIT],
  ['North Polk Community School District', NONPROFIT],
  ['Polk City Police Officers Association', NONPROFIT],

  // Basic Business, every employee band
  ['Halie Trappe', 'basic'], // listed as Individual, note says Basic (Realtor)
  ['P&M Apparel', 'basic'],  // listed as Trade ($350)
  ['Cullen & Associates Insurance Services', 'basic'],
  ['Cupp Insurance Inc.', 'basic'],
  ['Kyle Matzen- Financial Advisor with Edward Jones', 'basic'],
  ['Fareway', 'basic'],
  ['Lucky Wife Wine Slushies', 'basic'],
  ['Oak & Berk', 'basic'],
  ['Qube Hotel', 'basic'],
  ['Raising Readers in the Heartland', 'basic'],
  ['Restoration 1 of Des Moines', 'basic'],
  ['Rush Rolloffs', 'basic'],
  ['Snaadt Media Group', 'basic'],
  ['Yellow Brick Road', 'basic'],
  ['All Seasons Veterinary Care', 'basic'],
  ['Anytime Fitness Polk City', 'basic'],
  ['Big Creek Growth', 'basic'],
  ['Big Green Umbrella Media, Inc.', 'basic'],
  ['Galaxy Cleaning Services LLC', 'basic'],
  ['Teresa Herold, Travel Advisor with Good Trip Travel Co.', 'basic'],
  ['HBU Development', 'basic'],
  ['HR Approach', 'basic'],
  ['Jacquelyn Duke, Realtor with Realty One Group Impact', 'basic'],
  ['Knockerball 118', 'basic'],
  ['Lush Aesthetics & Wellness PLLC', 'basic'],
  ["Michelle's School of Dance", 'basic'],
  ['Midland Power Cooperative', 'basic'],
  ['Natalie St. John | the downhome co.', 'basic'],
  ['North Polk Family Medicine', 'basic'],
  ["Papa's Pizzeria", 'basic'],
  ['Pedal Pushers Vintage Shop', 'basic'],
  ['Polk City Ace Hardware', 'basic'],
  ['Polk City Chiropractic', 'basic'],
  ['Prudent Produce', 'basic'],
  ['Shane Torres- Agent with REMAX Concepts - Vantage Team', 'basic'],
  ['Roof Iowa', 'basic'],
  ['Susie Sheldahl, Realtor with Realty One Group Impact', 'basic'],
  ['That Concierge Girl', 'basic'],
  ['The Sherwin-Williams Company', 'basic'],
  ['WellForm MD', 'basic'],
  ['Arcadia PC', 'basic'],
  ['D.R. Horton Iowa', 'basic'],
  ['Corey Hoodjer -Agent with Farm Bureau Financial Services', 'basic'],
  ['honeyDO 2 honeyDONE', 'basic'],
  ['Tournament Club of Iowa', 'basic'],
  ['Hacienda Vieja', 'basic']
];

const FILE = new URL('../content/members.json', import.meta.url);
const write = process.argv.includes('--write');

const norm = s => String(s).toLowerCase()
  .replace(/[\u2018\u2019]/g, "'").replace(/&|\+/g, 'and')
  .replace(/\b(inc|llc|pllc|co|the)\b/g, '').replace(/[^a-z0-9]/g, '');

function dist(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

const data = JSON.parse(readFileSync(FILE, 'utf8'));
const members = data.members;
const valid = new Set(Object.keys(data.tiers || {}));
const taken = new Set();

function find(name) {
  const n = norm(name);
  const open = members.filter(m => !taken.has(m));
  const tries = [
    m => norm(m.name) === n,
    m => { const s = norm(m.name); return s.length > 4 && (n.includes(s) || s.includes(n)); },
    m => dist(norm(m.name), n) <= 2
  ];
  for (const test of tries) {
    const hits = open.filter(test);
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) return { ambiguous: hits.map(h => h.name) };
  }
  return null;
}

const changed = [], same = [], missing = [], unsure = [];
for (const [name, tier] of LIST) {
  if (!valid.has(tier)) throw new Error(`"${tier}" is not a level in members.json (${name})`);
  const m = find(name);
  if (!m) { missing.push(name); continue; }
  if (m.ambiguous) { unsure.push(`${name}  ->  ${m.ambiguous.join(' / ')}`); continue; }
  taken.add(m);
  const note = norm(m.name) === norm(name) ? '' : `   (list says "${name}")`;
  if (m.tier === tier) same.push(m.name);
  else { changed.push(`${m.name}: ${m.tier || '(none)'} -> ${tier}${note}`); m.tier = tier; }
}
const leftOver = members.filter(m => !taken.has(m)).map(m => `${m.name} (${m.tier})`);

const show = (title, rows) => rows.length && console.log(`\n${title} (${rows.length})\n  ` + rows.join('\n  '));
show('Changing', changed);
console.log(`\nAlready right: ${same.length}`);
show('On the list but not on the site', missing);
show('More than one possible match, skipped', unsure);
show('On the site but not on the list, left as is', leftOver);

const counts = {};
members.forEach(m => { counts[m.tier] = (counts[m.tier] || 0) + 1; });
console.log('\nLevels after:', counts);

if (write) {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('\nSaved content/members.json');
} else {
  console.log('\nDry run. Add --write to save.');
}
