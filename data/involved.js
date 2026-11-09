import { readFileSync } from 'node:fs';
import { t, TEXT, PRIVACY_SECTIONS } from './text.js';

/* ==========================================================================
   GET INVOLVED and PRIVACY

   The old site had a Get Involved page and a Privacy Policy page. Both are
   rebuilt here so nothing that is currently linked or indexed goes dead.

   The board list is a placeholder. Real names, roles, and the businesses
   they represent go in BOARD below.
   ========================================================================== */

export const INVOLVED = {
  lede: t('involved.lede'),
  intro: t('involved.intro'),
  ways: TEXT.ways,
  board: JSON.parse(readFileSync(new URL('../content/board.json', import.meta.url), 'utf8')).board
};

export const PRIVACY = {
  updated: t('privacy.updated'),
  intro: t('privacy.intro'),
  sections: PRIVACY_SECTIONS
};
