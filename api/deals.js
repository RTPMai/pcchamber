/* ==========================================================================
   /api/deals

   A signed-in member adding, changing and removing their own deals. Same
   pattern as /api/listing: every change is a commit to content/deals.json
   with the member's name on it, applied to a fresh copy of the file, and
   only ever to deals that carry this member's slug.

   The chamber can edit or remove any deal in the admin.
   ========================================================================== */

import { randomBytes } from 'node:crypto';
import { currentMember } from './member.js';
import { readContent, updateContent, ghMissing } from './_lib/github.js';
import { readBody, fail } from './_lib/adminauth.js';
import { MAX_DEALS } from '../data/deals.js';

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const today = () => new Date().toISOString().slice(0, 10);

export default async function handler(req, res) {
  try {
    const member = currentMember(req);
    if (!member) {
      res.status(401).json({ error: 'signed_out', message: 'Please sign in again.' });
      return;
    }
    const missing = ghMissing();
    if (missing.length) {
      res.status(503).json({ error: 'not_configured', message: `Deals are not set up yet. Missing: ${missing.join(', ')}.` });
      return;
    }

    const body = await readBody(req);
    const author = `${member.name} via member sign in`;
    const live = d => !d.expires || d.expires >= today();

    if (body.action === 'list') {
      const { data } = await readContent('deals.json');
      res.status(200).json({
        max: MAX_DEALS,
        deals: (data.deals || []).filter(d => d.member === member.slug)
      });
      return;
    }

    if (body.action === 'save') {
      const d = body.deal || {};
      const title = clean(d.title, 80);
      const expires = /^\d{4}-\d{2}-\d{2}$/.test(String(d.expires || '')) ? d.expires : '';
      if (!title) {
        res.status(400).json({ error: 'no_title', message: 'Say what the deal is, in a few words.' });
        return;
      }
      if (expires && expires < today()) {
        res.status(400).json({ error: 'expired', message: 'That end date has already passed.' });
        return;
      }

      let saved = null;
      await updateContent('deals.json', data => {
        data.deals = data.deals || [];
        const mine = data.deals.filter(x => x.member === member.slug);
        const existing = d.id ? mine.find(x => x.id === d.id) : null;
        if (d.id && !existing) {
          throw Object.assign(new Error('That deal is not there any more. Reload the page.'), { status: 404 });
        }
        if (!existing && mine.filter(live).length >= MAX_DEALS) {
          throw Object.assign(new Error(`You can have ${MAX_DEALS} deals up at once. Take one down first.`), { status: 400 });
        }
        const next = {
          id: existing ? existing.id : randomBytes(4).toString('hex'),
          member: member.slug,
          title,
          ...(clean(d.detail, 400) ? { detail: clean(d.detail, 400) } : {}),
          for: d.for === 'members' ? 'members' : 'everyone',
          ...(clean(d.code, 30) ? { code: clean(d.code, 30) } : {}),
          ...(expires ? { expires } : {}),
          added: existing ? existing.added : today()
        };
        if (existing) data.deals[data.deals.indexOf(existing)] = next;
        else data.deals.push(next);
        saved = next;
      }, `${member.name} ${d.id ? 'updated' : 'posted'} a deal`, author);

      res.status(200).json({ ok: true, deal: saved, message: 'Saved. It shows on the deals page and your listing in about a minute.' });
      return;
    }

    if (body.action === 'remove') {
      let found = false;
      await updateContent('deals.json', data => {
        data.deals = (data.deals || []).filter(x => {
          if (x.member === member.slug && x.id === body.id) { found = true; return false; }
          return true;
        });
      }, `${member.name} took down a deal`, author);
      res.status(found ? 200 : 404).json(found
        ? { ok: true, message: 'Taken down. It disappears from the site in about a minute.' }
        : { error: 'gone', message: 'That deal was already gone.' });
      return;
    }

    res.status(400).json({ error: 'unknown_action', message: 'That is not something this page does.' });
  } catch (err) {
    fail(res, err, 'deals failed:');
  }
}
