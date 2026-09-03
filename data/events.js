/* ==========================================================================
   EVENTS

   Two lists. RECURRING is the stuff that happens on a rhythm and does not
   need re-entering. CALENDAR is dated items, newest first.

   An event drops off the site automatically the day after its date.
   Nothing to remember, nothing to clean up.

   Fields:
     date      YYYY-MM-DD. Required on CALENDAR items.
     time      free text, e.g. '11:30 am to 1:00 pm'
     title     what it is called
     where     venue name
     summary   one plain sentence
     detail    optional paragraph
     cost      free text, e.g. '$20 for members, $30 for guests'
     rsvp      { label, href } or leave out
     audience  'members' | 'public'
     season    color: sun | autumn | spring | winter
   ========================================================================== */

export const RECURRING = [
  {
    title: 'Monthly chamber luncheon',
    when: 'Second Wednesday of the month, 11:30 am',
    where: 'Tournament Club of Iowa',
    summary: 'Lunch, a short program, and the closest thing the chamber has to a standing meeting.',
    detail: 'Pay and pick your meal ahead of time through the club. Registering in advance matters more than it sounds, because the kitchen builds the order off that list.',
    cost: '$20, tax and gratuity included',
    rsvp: { label: 'Register and pick a meal', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  },
  {
    title: 'Ribbon cuttings',
    when: 'Scheduled as needed',
    where: 'Your place of business',
    summary: 'A photo, a crowd, and a post that reaches several thousand people locally.',
    detail: 'Open to any chamber member opening, moving, expanding, or hitting a milestone. The chamber brings the oversized scissors and handles the promotion.',
    cost: 'Free to members',
    rsvp: { label: 'Ask for a ribbon cutting', href: 'mailto:admin@polkcitychamber.com?subject=Ribbon%20cutting%20request' },
    audience: 'members',
    season: 'spring'
  },
  {
    title: 'Meaningful Connections',
    when: 'Quarterly',
    where: 'Rotating member locations',
    summary: 'Small-group networking built so you actually talk to people instead of collecting cards.',
    detail: 'Hosted at a different member business each time, which doubles as an introduction to that business.',
    cost: 'Free to members',
    audience: 'members',
    season: 'winter'
  }
];

export const CALENDAR = [
  {
    date: '2026-09-09',
    time: '11:30 am to 1:00 pm',
    title: 'September luncheon',
    where: 'Tournament Club of Iowa',
    summary: 'Program to be announced. Register through the club by the Friday before.',
    cost: '$20',
    rsvp: { label: 'Register', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  },
  {
    date: '2026-09-24',
    time: '8:00 am shotgun start',
    title: 'Annual chamber golf tournament',
    where: 'Tournament Club of Iowa',
    summary: 'Four-person best shot, the chamber\'s largest fundraiser of the year.',
    detail: 'Hole sponsorships and team spots both sell out. Sponsorship is the cheapest broad exposure the chamber sells all year.',
    cost: 'Team and sponsor rates vary',
    rsvp: { label: 'Ask about a team or sponsorship', href: 'mailto:admin@polkcitychamber.com?subject=Golf%20tournament' },
    audience: 'public',
    season: 'spring'
  },
  {
    date: '2026-10-14',
    time: '11:30 am to 1:00 pm',
    title: 'October luncheon',
    where: 'Tournament Club of Iowa',
    summary: 'Program to be announced.',
    cost: '$20',
    rsvp: { label: 'Register', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  },
  {
    date: '2026-11-11',
    time: '11:30 am to 1:00 pm',
    title: 'November luncheon',
    where: 'Tournament Club of Iowa',
    summary: 'First luncheon after the election. Program to be announced.',
    cost: '$20',
    rsvp: { label: 'Register', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  }
];
