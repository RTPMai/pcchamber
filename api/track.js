/* ==========================================================================
   /api/track

   Counts a view of a member's directory page, or a click on one of their
   contact links. Called from the member page with navigator.sendBeacon,
   so it never slows the page down and a failure here is invisible.

   Anything that looks like a bot is ignored. So is anything without a
   real member slug, so nobody can fill the store with junk keys.

   See api/_lib/stats.js for what is stored and why it identifies nobody.

   ALSO THE FORMS

   /api/track?form=1 is the join form and the event form. It shares this
   function to stay under Vercel Hobby's 12. See api/_lib/forms.js.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { storeReady } from './_lib/store.js';
import { KINDS, countHit } from './_lib/stats.js';
import { visitorKey, readBody, fail } from './_lib/adminauth.js';
import { handleForm } from './_lib/forms.js';

const SLUGS = new Set(
  JSON.parse(readFileSync(new URL('../content/members.json', import.meta.url), 'utf8')).members.map(m => m.slug)
);

const BOT = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|headless|lighthouse|monitor/i;

export default async function handler(req, res) {
  const isForm = (req.query && req.query.form) || /[?&]form=/.test(req.url || '');
  if (isForm) {
    if (req.method !== 'POST') { res.status(405).json({ error: 'post_only' }); return; }
    try { return await handleForm(req, res, req.body !== undefined ? req.body : await readBody(req)); }
    catch (err) { return fail(res, err, 'form failed'); }
  }

  /* Always a quiet 204. There is nothing a visitor needs to know. */
  const done = () => res.status(204).end();
  try {
    if (req.method !== 'POST' || !storeReady()) return done();
    if (BOT.test(String(req.headers['user-agent'] || ''))) return done();

    let body = await readBody(req);
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const slug = String(body.s || '');
    const kind = String(body.k || '');
    if (!SLUGS.has(slug) || !KINDS.includes(kind)) return done();

    await countHit(slug, kind, visitorKey(req, `${slug}|${kind}`));
  } catch (err) {
    console.error('track failed', err, err.detail || '');
  }
  return done();
}
