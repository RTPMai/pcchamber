/* ==========================================================================
   NEW TO POLK CITY

   A page for people who just moved here, or just opened a business here.
   Hand it to realtors, put it in welcome kits, link it from the city.

   The practical items (utilities, schools, alerts) come from the city and
   the school district's own websites, checked September 2026. Phone
   numbers and hours drift, so each item links to the source and the page
   says when it was last checked. Update "checked" in content/newcomers.json
   when you go through it again, once a year is plenty.

   The "Find local businesses" section is not in the file. It is built
   from the directory, so it is never out of date.

   Fields, per item:
     section   heading it sits under. Items with the same section group together
     title     short
     body      a sentence or three
     href      a link to the source or next step
     link      the link's text
   ========================================================================== */

import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../content/newcomers.json', import.meta.url), 'utf8'));

export const NEWCOMERS = { checked: data.checked || '', items: data.items || [] };
