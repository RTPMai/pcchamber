/* ==========================================================================
   MEMBER DEALS

   Discounts members offer, either to other chamber members or to anyone.
   Members add and remove their own from their account page, at
   /members/deals/. The chamber can edit or take one down in the admin.

   They are all public, including the members-only ones. A deal that says
   "10% off for chamber members" is an advert for joining the chamber,
   and hiding it behind a sign in would waste that.

   Fields:
     id        stable, made when the deal is created
     member    the member's slug
     title     the offer, in a few words. "10% off embroidery"
     detail    optional. How to claim it, what it covers
     for       'members' | 'everyone'
     code      optional promo code
     expires   optional YYYY-MM-DD. Gone from the site the day after.
     added     YYYY-MM-DD
   ========================================================================== */

import { readFileSync } from 'node:fs';

const load = () => JSON.parse(readFileSync(new URL('../content/deals.json', import.meta.url), 'utf8'));

export const DEALS = load().deals || [];

/* Most members will have one or two. Three stops the page turning into
   somebody's product catalogue. */
export const MAX_DEALS = 3;
