/* ==========================================================================
   EVENT PHOTOS

   Albums of photos from chamber events, at /gallery/. Added in the admin,
   under Event photos: pick the photos, they are shrunk in the browser to a
   sensible size, and one save publishes the whole album.

   The photos live in assets/gallery/<album>/ like any other image. The
   list of albums lives in content/gallery.json, which looks like:

     slug      the album's web address, made when it is created
     title     "October luncheon"
     date      YYYY-MM-DD, the day of the event
     summary   optional. A sentence about the event
     event     optional. The event's reference from the calendar
     cover     optional. Which photo leads the album. The first if unset
     photos    [{ id, src, thumb, w, h, alt }]
               src is the full size (1600 pixels on the long side), thumb
               the small one the grid shows (640). alt describes the photo
               for somebody who cannot see it. If it is left blank the
               album title is used, which is better than nothing and worse
               than a sentence.

   An album with no photos is not published.
   ========================================================================== */

import { readFileSync } from 'node:fs';

const load = () => JSON.parse(readFileSync(new URL('../content/gallery.json', import.meta.url), 'utf8'));

export const ALBUMS = (load().albums || [])
  .filter(a => a.slug && Array.isArray(a.photos) && a.photos.length)
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

export const coverOf = a => a.photos.find(p => p.id === a.cover) || a.photos[0];
