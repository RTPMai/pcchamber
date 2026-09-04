/* ==========================================================================
   DIRECTORY IMPORTER

   Turns a pasted member directory into the shape members.js wants, so you
   are editing text rather than typing eighteen fields sixty-seven times.

   HOW TO USE

   1. Copy the directory out of wherever it lives. The chamber website, a
      spreadsheet, an email, a Word document. Shape does not matter much.
   2. Save it as tools/paste.txt
   3. Run:  node tools/import-directory.mjs
   4. Read what it prints. It will tell you what it could not work out.
   5. It writes data/members.generated.js. Check it, fix the TODOs, then
      rename it over data/members.js.

   WHAT IT WORKS OUT ON ITS OWN
     the business name, phone, email, website, street address, and a slug

   WHAT YOU STILL HAVE TO DO
     category and tier. Those are judgement calls and it will not guess.

   It never overwrites data/members.js. That is deliberate.
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const IN  = 'tools/paste.txt';
const OUT = 'data/members.generated.js';

/* ---------- recognisers -------------------------------------------------- */

const RE = {
  email:  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  url:    /\b((?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|net|biz|co|io|us|info)(?:\/[^\s,]*)?)\b/i,
  phone:  /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
  street: /\d+\s+[\w.'-]+(?:\s+[\w.'-]+)*\s*(?:,|\s)\s*(?:[A-Za-z .'-]+,\s*)?(?:IA|Iowa)\b[\s,]*\d{0,5}/i,
  noise:  /^(show more|view profile|learn more|read more|visit website|directions|member since|categories?|back to top)\b/i
};

/* Slugs are permanent web addresses. Keep them boring. */
function slugify(name) {
  return name.toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-(llc|inc|co|corp|ltd|pc|pllc|lc)$/g, '')
    .slice(0, 60);
}

function tidyUrl(u) {
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/[.,;]$/, '');
}

function tidyPhone(p) {
  const d = p.replace(/\D/g, '').replace(/^1/, '');
  return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}` : p.trim();
}

/* A line that is only contact details is not a description. Labels like
   "Phone:" and "Email:" get stripped first, or a labelled phone number
   reads as prose and ends up in the description. */
function isContactLine(line) {
  const stripped = line
    .replace(/\b(phone|tel|telephone|email|e-mail|web|website|url|address|fax|mobile|cell)\b\s*:?/gi, '')
    .replace(RE.email, '').replace(RE.phone, '')
    .replace(RE.url, '').replace(/[|,\-–\s]/g, '');
  return stripped.length < 4;
}

/* ---------- parse -------------------------------------------------------- */

function parseBlock(block, index) {
  const lines = block.split('\n')
    .map(l => l.trim())
    .filter(l => l && !RE.noise.test(l));
  if (!lines.length) return null;

  const name = lines[0].replace(/\s*[|•·]\s*$/, '').trim();
  const rest = lines.slice(1);
  const whole = lines.join(' \n ');

  const email = (whole.match(RE.email) || [null])[0];
  const phone = (whole.match(RE.phone) || [null])[0];
  const addr  = (whole.match(RE.street) || [null])[0];

  /* Do not mistake the member's own email domain for a website. */
  let web = (whole.replace(RE.email, '').match(RE.url) || [null])[0];
  if (web && email && web.toLowerCase().includes(email.split('@')[1]?.toLowerCase())) {
    /* same domain as the email is usually still their real site, keep it */
  }

  const prose = rest.filter(l => !isContactLine(l) && l !== addr);
  const summary = prose.length ? prose[0].replace(/\s+/g, ' ').trim() : '';
  /* about only exists if there is genuinely more than the summary. Repeating
     the summary in both fields makes every member page read like a stutter. */
  const about   = prose.length > 1 ? prose.slice(1).join(' ').replace(/\s+/g, ' ').trim() : '';

  const contact = {};
  if (phone) contact.phone = tidyPhone(phone);
  if (email) contact.email = email;
  if (web)   contact.web = tidyUrl(web);
  if (addr)  contact.address = addr.replace(/\s+/g, ' ').trim();

  return {
    slug: slugify(name) || `member-${index + 1}`,
    name,
    summary,
    about,
    contact,
    missing: [
      !summary && 'summary',
      !Object.keys(contact).length && 'any contact detail'
    ].filter(Boolean)
  };
}

/* ---------- emit --------------------------------------------------------- */

const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function emit(m) {
  const c = m.contact;
  const parts = [];
  if (c.person)  parts.push(`person: ${q(c.person)}`);
  if (c.phone)   parts.push(`phone: ${q(c.phone)}`);
  if (c.email)   parts.push(`email: ${q(c.email)}`);
  if (c.web)     parts.push(`web: ${q(c.web)}`);
  if (c.address) parts.push(`address: ${q(c.address)}`);

  return `  {
    slug: ${q(m.slug)},
    name: ${q(m.name)},
    category: 'services',        // TODO pick from CATEGORIES
    tier: 'basic',               // TODO basic | pro | premier
    summary: ${q(m.summary || 'TODO one plain sentence about what they do.')},
    about: ${q(m.about)},
    contact: { ${parts.join(', ')} }
  }`;
}

/* ---------- run ---------------------------------------------------------- */

async function main() {
  if (!existsSync(IN)) {
    console.error(`No ${IN} found. Paste the directory into that file and run this again.`);
    process.exit(1);
  }

  const raw = await readFile(IN, 'utf8');

  /* Blank lines separate members. If the paste has none, fall back to one
     member per line, which is what a spreadsheet copy usually looks like. */
  let blocks = raw.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  if (blocks.length < 3) {
    blocks = raw.split('\n').map(b => b.trim()).filter(Boolean);
    console.log('No blank lines between entries, so treating one line as one member.');
  }

  const parsed = blocks.map(parseBlock).filter(Boolean);

  /* Two businesses with similar names would collide on the same address. */
  const seen = new Map();
  for (const m of parsed) {
    const n = (seen.get(m.slug) || 0) + 1;
    seen.set(m.slug, n);
    if (n > 1) m.slug = `${m.slug}-${n}`;
  }

  const file = `/* Generated by tools/import-directory.mjs on ${new Date().toISOString().slice(0, 10)}.
   Every entry needs a category and a tier chosen by hand. Search for TODO.
   Check the slugs before this goes live. Once a slug is public and indexed,
   changing it breaks every link pointing at it. */

export { CATEGORIES, TIERS } from './members.js';

export const MEMBERS = [
${parsed.map(emit).join(',\n')}
];
`;

  await writeFile(OUT, file);

  console.log(`\nRead ${parsed.length} members from ${IN}`);
  console.log(`Wrote ${OUT}\n`);

  const short = parsed.filter(m => m.missing.length);
  if (short.length) {
    console.log(`${short.length} need a look:`);
    for (const m of short) console.log(`  ${m.name}  (no ${m.missing.join(', no ')})`);
    console.log('');
  }
  console.log('Every entry has category and tier set to a default. Fix those,');
  console.log('then rename data/members.generated.js over data/members.js.');
}

main().catch(e => { console.error(e); process.exit(1); });
