/* Adding and removing benefit uses from code other than the admin's Log
   button. Used by event check-in, so a member's guest checked in on a
   luncheon ticket counts against their tickets without anybody having to
   remember to log it separately. Same file, same commit trail. */

import { randomBytes } from 'node:crypto';
import { updateContent } from './github.js';

export async function logUse(use, who) {
  const entry = {
    id: randomBytes(5).toString('hex'),
    member: use.member,
    benefit: use.benefit,
    date: use.date,
    ...(use.qty > 1 ? { qty: use.qty } : {}),
    ...(use.note ? { note: String(use.note).slice(0, 300) } : {}),
    by: who,
    at: new Date().toISOString()
  };
  await updateContent('benefits.json', data => {
    data.uses = Array.isArray(data.uses) ? data.uses : [];
    data.uses.push(entry);
  }, `Log ${use.benefit} for ${use.member} (event check-in, by ${who})`, `${who} via chamber admin`);
  return entry;
}

export async function unlogUse(id, who) {
  await updateContent('benefits.json', data => {
    data.uses = (data.uses || []).filter(u => u.id !== id);
  }, `Remove a logged benefit use (event check-in, by ${who})`, `${who} via chamber admin`);
}
