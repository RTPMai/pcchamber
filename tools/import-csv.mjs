/* ==========================================================================
   IMPORT THE MEMBER DIRECTORY FROM A CSV

   Reads tools/members.csv and writes data/members.generated.js.

   Expected columns, in any order. Missing ones are fine:
     business_name, category, contact_name, street_address, city, state,
     zip, phone, email, website, based_in_polk_city, membership_tier,
     renewal_date, notes, data_issues

   WHAT IT DOES ON ITS OWN
     Maps the source categories onto the smaller set the directory uses
     Builds a permanent slug from the business name
     Tidies phone numbers and websites into one format
     Applies ZIP corrections that the data_issues column itself specifies
     Reports everything it changed and everything still missing

   WHAT IT WILL NOT DO
     Write a description. These are real businesses with real names on
     real pages. A plausible-sounding sentence that turns out to be wrong
     is worse than no sentence, so summary is left empty and the listing
     falls back to the category until somebody collects the real one.

   Run:  node tools/import-csv.mjs
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const IN = 'tools/members.csv';
const OUT = 'data/members.generated.js';

/* The source data has 29 categories, several with a single member in them.
   That is too many filter chips to be useful, so they fold into these.
   Anything unmapped lands in 'other' and gets reported. */
const CATEGORY_MAP = {
  'Banking': 'finance',
  'Insurance and financial services': 'insurance',
  'Real estate': 'realestate',
  'Development and real estate': 'realestate',
  'Home services': 'home',
  'Cleaning services': 'home',
  'Waste and hauling': 'home',
  'Engineering': 'home',
  'Utility': 'home',
  'Restaurant and bar': 'food',
  'Food and beverage': 'food',
  'Grocery and retail': 'retail',
  'Medical': 'health',
  'Health and wellness': 'health',
  'Fitness': 'health',
  'Veterinary': 'pets',
  'Business services': 'services',
  'Human resources': 'services',
  'Media': 'services',
  'Travel': 'services',
  'Childcare': 'family',
  'Education': 'family',
  'Arts and education': 'family',
  'Recreation and events': 'rec',
  'Hospitality': 'rec',
  'Nonprofit and civic': 'nonprofit',
  'Church': 'nonprofit',
  'Government': 'government'
};

/* Corrections the source data asks for by name. Only applied where the
   data_issues column states both the wrong value and the right one, and
   only when the row's ZIP actually matches the wrong value. Nothing is
   guessed, so a genuinely out-of-town member keeps their real ZIP.

   Two separate patterns rather than one, because the wrong value and the
   correction can sit in different clauses:
     "50266 is West Des Moines; Polk City is 50226"
     "51401 is Carroll, IA; should be 50226"          <- comma in the middle
     "50026 is not a valid Polk City ZIP; should be 50226" */
const ZIP_WRONG = /(\d{5})\s+is\s+(?:not a valid|[A-Z])/;
const ZIP_RIGHT = /(?:should be|Polk City is)\s*(\d{5})/i;

/* ---------- a CSV reader that copes with quotes and embedded commas ------- */

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell); cell = '';
    } else if (c === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else if (c !== '\r') {
      cell += c;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }

  const head = rows.shift().map(h => h.trim());
  return rows
    .filter(r => r.some(v => v.trim()))
    .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}

/* ---------- tidying ------------------------------------------------------- */

function slugify(name) {
  return name.toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''`.,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-(llc|inc|co|corp|ltd|pc|pllc|lc)$/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function tidyPhone(p) {
  const d = (p || '').replace(/\D/g, '').replace(/^1/, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : (p || '').trim();
}

function tidyUrl(u) {
  if (!u) return null;
  let s = u.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/* ---------- run ----------------------------------------------------------- */

async function main() {
  if (!existsSync(IN)) {
    console.error(`No ${IN} found. Save the directory export there and run this again.`);
    process.exit(1);
  }

  const rows = parseCsv(await readFile(IN, 'utf8'));
  const zipFixes = [], unmapped = [], gaps = [], collisions = [];
  const seen = new Map();

  const members = rows.map(r => {
    const name = r.business_name;

    let slug = slugify(name);
    const n = (seen.get(slug) || 0) + 1;
    seen.set(slug, n);
    if (n > 1) { collisions.push(name); slug = `${slug}-${n}`; }

    const source = r.category || '';
    let category = CATEGORY_MAP[source];
    if (!category) { category = 'other'; unmapped.push(`${name}: "${source}"`); }

    /* Apply a ZIP correction only where the source data names the right one. */
    let zip = r.zip;
    const issues = r.data_issues || '';
    const wrong = ZIP_WRONG.exec(issues);
    const right = ZIP_RIGHT.exec(issues);
    if (wrong && right && zip === wrong[1]) {
      zipFixes.push(`${name}: ${wrong[1]} to ${right[1]}`);
      zip = right[1];
    }

    const contact = {};
    if (r.contact_name) contact.person = r.contact_name;
    if (r.phone) contact.phone = tidyPhone(r.phone);
    if (r.email) contact.email = r.email;
    if (r.website) contact.web = tidyUrl(r.website);
    if (r.street_address) {
      contact.address = [r.street_address, [r.city, r.state].filter(Boolean).join(', '), zip]
        .filter(Boolean).join(', ');
    } else if (r.city) {
      contact.address = [r.city, r.state].filter(Boolean).join(', ');
    }

    const missing = [
      !r.phone && 'phone', !r.email && 'email',
      !r.website && 'website', !r.street_address && 'street address'
    ].filter(Boolean);
    if (missing.length) gaps.push({ name, missing });

    return {
      slug, name, category,
      tier: (r.membership_tier || 'basic').toLowerCase(),
      city: r.city || '',
      contact,
      needsSummary: true
    };
  });

  const emit = m => {
    const c = m.contact;
    const parts = [];
    if (c.person) parts.push(`person: ${q(c.person)}`);
    if (c.phone) parts.push(`phone: ${q(c.phone)}`);
    if (c.email) parts.push(`email: ${q(c.email)}`);
    if (c.web) parts.push(`web: ${q(c.web)}`);
    if (c.address) parts.push(`address: ${q(c.address)}`);
    return `  {
    slug: ${q(m.slug)},
    name: ${q(m.name)},
    category: ${q(m.category)},
    tier: ${q(m.tier)},${m.city ? `\n    city: ${q(m.city)},` : ''}
    summary: '',   // TODO one plain sentence about what they do
    contact: { ${parts.join(', ')} }
  }`;
  };

  const byName = [...members].sort((a, b) => a.name.localeCompare(b.name));

  await writeFile(OUT, `/* Generated by tools/import-csv.mjs on ${new Date().toISOString().slice(0, 10)}
   from ${rows.length} rows. Do not edit this file by hand: rename it over
   data/members.js first, then edit that.

   Every summary is empty on purpose. See the note at the top of the
   importer about why descriptions are not invented. */

export { CATEGORIES, TIERS } from './members.js';

export const MEMBERS = [
${byName.map(emit).join(',\n')}
];
`);

  /* ---------- the report ---------- */

  console.log(`\nRead ${rows.length} members. Wrote ${OUT}\n`);

  if (zipFixes.length) {
    console.log(`ZIP corrections applied, as specified in the source data (${zipFixes.length}):`);
    zipFixes.forEach(z => console.log('   ' + z));
    console.log('');
  }
  if (unmapped.length) {
    console.log(`Categories with no mapping, filed as "other" (${unmapped.length}):`);
    unmapped.forEach(u => console.log('   ' + u));
    console.log('');
  }
  if (collisions.length) {
    console.log(`Names that produced the same slug, numbered (${collisions.length}):`);
    collisions.forEach(c => console.log('   ' + c));
    console.log('');
  }

  const counts = {};
  for (const m of members) counts[m.category] = (counts[m.category] || 0) + 1;
  console.log('Members per category:');
  Object.entries(counts).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`   ${String(v).padStart(2)}  ${k}`));

  console.log(`\nEvery entry needs a one-sentence summary. ${members.length} to write.`);
  const tally = {};
  for (const g of gaps) for (const f of g.missing) tally[f] = (tally[f] || 0) + 1;
  console.log('Contact gaps:', Object.entries(tally).map(([k, v]) => `${v} with no ${k}`).join(', '));
}

main().catch(e => { console.error(e); process.exit(1); });
