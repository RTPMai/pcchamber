/* ==========================================================================
   scripts/seed-starters.mjs

   Loads starter passwords into the credential store, one per address, so
   members can sign in before the setup emails are working. Anybody who
   signs in with one is sent straight to pick their own password, and can
   do nothing else on the site until they have.

     node --env-file=.env.local scripts/seed-starters.mjs starters.csv
         dry run: checks every row, writes nothing

     node --env-file=.env.local scripts/seed-starters.mjs starters.csv --write
         hashes and saves them

   .env.local comes from `vercel env pull .env.local`, or make it by hand
   with the two Upstash values (KV_REST_API_URL and KV_REST_API_TOKEN, or
   the UPSTASH_REDIS_REST_* pair).

   THE CSV

   Two columns with a header row: email,password. Extra columns are ignored.

   WHAT IT SKIPS, AND SAYS SO

     not on the roster     the address is in no member's access list in
                           content/members.json, so it could not sign in
     already set           they have chosen their own password; a starter
                           would be ignored anyway
     already seeded        a starter is waiting for them; rerunning does not
                           change it, so a sheet you already handed out stays
                           right. Add --force to replace them.
     too short             under 12 characters

   AFTERWARDS

   Delete the CSV. Only hashes go to the store, and nothing goes in the
   repository, but the CSV is every starter password in plain text.

   Starters expire after STARTER_DAYS (14). After that the member uses
   "Email me a link" on the sign in page, which needs Resend set up.
   ========================================================================== */

import { readFileSync } from 'node:fs';

import { kv, kvGet, storeReady, storeMissing } from '../api/_lib/store.js';
import { hash, MIN_LENGTH } from '../api/_lib/passwords.js';
import { starterKey, STARTER_DAYS } from '../api/member.js';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const write = args.includes('--write');
const force = args.includes('--force');

if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/seed-starters.mjs starters.csv [--write] [--force]');
  process.exit(1);
}
if (!storeReady()) {
  console.error('No credential store. Missing: ' + storeMissing().join(', '));
  process.exit(1);
}

const tidy = e => String(e || '').trim().toLowerCase();

/* Same rule as sign in: the access list, or the contact address if there
   is no list. */
const roster = JSON.parse(readFileSync(new URL('../content/members.json', import.meta.url), 'utf8')).members;
const owner = new Map();
for (const m of roster) {
  const list = Array.isArray(m.access) && m.access.length ? m.access : [m.contact && m.contact.email].filter(Boolean);
  for (const e of list) owner.set(tidy(e), m.name);
}

/* Plain enough CSV: no quoted commas in an email or a starter password. */
const lines = readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
const head = lines.shift().split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
const ei = head.findIndex(h => h.includes('email'));
const pi = head.findIndex(h => h.includes('password'));
if (ei < 0 || pi < 0) {
  console.error('The first row needs an email column and a password column. Found: ' + head.join(', '));
  process.exit(1);
}

const out = { seeded: [], notOnRoster: [], alreadySet: [], alreadySeeded: [], tooShort: [] };
const ttl = STARTER_DAYS * 24 * 60 * 60;

for (const line of lines) {
  const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  const email = tidy(cells[ei]);
  const password = cells[pi] || '';
  if (!email) continue;

  if (!owner.has(email)) { out.notOnRoster.push(email); continue; }
  if (password.length < MIN_LENGTH) { out.tooShort.push(email); continue; }
  if (await kvGet(`pw:${email}`)) { out.alreadySet.push(email); continue; }
  if (!force && await kvGet(starterKey(email))) { out.alreadySeeded.push(email); continue; }

  if (write) await kv('SET', starterKey(email), await hash(password), 'EX', ttl);
  out.seeded.push(`${email}  (${owner.get(email)})`);
}

const show = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label}: ${list.length}`);
  for (const x of list) console.log('  ' + x);
};

show(write ? 'Seeded' : 'Would seed', out.seeded);
show('Not on the roster, skipped', out.notOnRoster);
show('Already chose their own password, skipped', out.alreadySet);
show('Starter already waiting, skipped (use --force to replace)', out.alreadySeeded);
show('Under ' + MIN_LENGTH + ' characters, skipped', out.tooShort);

console.log(write
  ? `\nDone. Starters expire in ${STARTER_DAYS} days. Delete ${file} now.`
  : '\nDry run. Nothing was written. Add --write to save.');
