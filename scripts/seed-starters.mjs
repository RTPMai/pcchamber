/* ==========================================================================
   scripts/seed-starters.mjs

   The terminal version of /admin/starters/, which is the easier way.
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

import { storeReady, storeMissing } from '../api/_lib/store.js';
import { parseStarters, loadStarters, STARTER_DAYS } from '../api/_lib/starters.js';

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

const roster = JSON.parse(readFileSync(new URL('../content/members.json', import.meta.url), 'utf8')).members;
const out = await loadStarters(parseStarters(readFileSync(file, 'utf8')), roster, { write, force });

const show = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label}: ${list.length}`);
  for (const x of list) console.log('  ' + (x.email ? `${x.email}  (${x.business})` : x));
};

show(write ? 'Seeded' : 'Would seed', out.seeded);
show('Not on the roster, skipped', out.notOnRoster);
show('Already chose their own password, skipped', out.alreadySet);
show('Starter already waiting, skipped (use --force to replace)', out.alreadySeeded);
show('Too short, skipped', out.tooShort);

console.log(write
  ? `\nDone. Starters expire in ${STARTER_DAYS} days. Delete ${file} now.`
  : '\nDry run. Nothing was written. Add --write to save.');
