/* ==========================================================================
   STARTER PASSWORDS

   One random password per address, handed out by the chamber so members
   can sign in before the setup emails work. Hashed the same way as real
   passwords, kept under starter:<email>, and gone on their own after
   STARTER_DAYS. How sign in treats them is in api/member.js.

   Loaded one of two ways, both running loadStarters() below:

     /admin/starters/            upload the CSV in the browser
     scripts/seed-starters.mjs   the same thing from a terminal

   WHAT IT SKIPS, AND SAYS SO

     not on the roster     in no member's access list, so could not sign in
     already set           they chose their own password; a starter would
                           be ignored anyway
     already seeded        a starter is waiting; loading again leaves it, so
                           a sheet already handed out stays right. Pass
                           force to replace them.
     too short             under 12 characters
   ========================================================================== */

import { kvPipeline } from './store.js';
import { hash, MIN_LENGTH } from './passwords.js';

export const STARTER_DAYS = 14;
export const MAX_ROWS = 300;

const tidy = e => String(e || '').trim().toLowerCase();
export const starterKey = email => `starter:${tidy(email)}`;

/* Plain CSV: a header row naming an email column and a password column.
   No quoted commas, which neither an email nor a starter contains. */
export function parseStarters(text) {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) throw Object.assign(new Error('That file is empty.'), { status: 400 });
  const head = lines.shift().split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const ei = head.findIndex(h => h.includes('email'));
  const pi = head.findIndex(h => h.includes('password'));
  if (ei < 0 || pi < 0) {
    throw Object.assign(new Error('The first row needs an email column and a password column. Found: ' + head.join(', ')), { status: 400 });
  }
  if (lines.length > MAX_ROWS) {
    throw Object.assign(new Error(`That is ${lines.length} rows. The most it takes at once is ${MAX_ROWS}.`), { status: 400 });
  }
  return lines.map(line => {
    const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return { email: tidy(cells[ei]), password: cells[pi] || '' };
  }).filter(r => r.email);
}

/* roster is the members array from content/members.json. Same rule as
   sign in: the access list, or the contact address when there is none. */
export async function loadStarters(rows, roster, { write = false, force = false } = {}) {
  const owner = new Map();
  for (const m of roster) {
    const list = Array.isArray(m.access) && m.access.length ? m.access : [m.contact && m.contact.email].filter(Boolean);
    for (const e of list) owner.set(tidy(e), m.name);
  }

  const out = { seeded: [], notOnRoster: [], alreadySet: [], alreadySeeded: [], tooShort: [] };
  const seen = new Set();
  const candidates = [];
  for (const r of rows) {
    if (seen.has(r.email)) continue;
    seen.add(r.email);
    if (!owner.has(r.email)) { out.notOnRoster.push(r.email); continue; }
    if (r.password.length < MIN_LENGTH) { out.tooShort.push(r.email); continue; }
    candidates.push(r);
  }

  /* Two reads per address in one round trip, rather than two hundred. */
  const found = await kvPipeline(candidates.flatMap(r => [['GET', `pw:${r.email}`], ['GET', starterKey(r.email)]]));

  const ready = [];
  candidates.forEach((r, i) => {
    if (found[i * 2]) { out.alreadySet.push(r.email); return; }
    if (found[i * 2 + 1] && !force) { out.alreadySeeded.push(r.email); return; }
    ready.push(r);
  });

  if (write && ready.length) {
    const ttl = STARTER_DAYS * 24 * 60 * 60;
    const sets = [];
    for (const r of ready) sets.push(['SET', starterKey(r.email), await hash(r.password), 'EX', ttl]);
    const saved = await kvPipeline(sets);
    const failed = saved.filter(x => x !== 'OK').length;
    if (failed) {
      throw Object.assign(new Error(`${failed} of ${sets.length} did not save. Nothing is wrong with loading again: the ones that saved will be skipped.`), { status: 502 });
    }
  }
  out.seeded = ready.map(r => ({ email: r.email, business: owner.get(r.email) }));
  return out;
}
