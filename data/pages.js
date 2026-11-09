/* ==========================================================================
   PAGE CONTENT

   About, FAQ, and the resources page. The wording itself is in content/
   and edited in the admin. See data/text.js.
   ========================================================================== */

import { t, paragraphs, FAQ_ALL, RESOURCES } from './text.js';

/* The wording now lives in content/ and is edited in the admin under
   Website wording. These exports keep their old shape so nothing that
   uses them had to change. */

export const ABOUT = {
  lede: t('about.lede'),
  body: paragraphs(t('about.body'))
};

export const FAQ = FAQ_ALL.filter(f => f.page === 'about');

export const RESOURCE_GROUPS = RESOURCES.sections.map(g => ({
  slug: g.id,
  season: g.season,
  title: g.label,
  blurb: g.blurb,
  intro: g.intro,
  links: RESOURCES.links.filter(l => l.section === g.id)
}));
