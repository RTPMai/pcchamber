import { readFileSync } from 'node:fs';

/* ==========================================================================
   WEBSITE WORDING

   The page text the admin can edit lives in content/text.json, faq.json,
   resources.json, privacy.json and settings.json. Edit it in the admin,
   under Website wording. This file only reads it.

   Any text can hold a link written as [label](address). The address can
   be a full web address, a page on this site starting with /, or a
   mailto: link. A blank line starts a new paragraph.
   ========================================================================== */

const load = name => JSON.parse(readFileSync(new URL(`../content/${name}`, import.meta.url), 'utf8'));

export const TEXT = load('text.json');
export const FAQ_ALL = load('faq.json').faq;
export const RESOURCES = load('resources.json');
export const PRIVACY_SECTIONS = load('privacy.json').privacy;
export const SETTINGS = load('settings.json');

const byId = new Map(TEXT.blocks.map(b => [b.id, b.text]));

/* A missing block fails the build rather than putting a blank on a page.
   Blocks are fixed in the admin, so this only trips if the file was
   edited by hand. */
export function t(id) {
  if (!byId.has(id)) throw new Error(`content/text.json has no block called "${id}".`);
  return String(byId.get(id) || '');
}

export const paragraphs = s => String(s).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
