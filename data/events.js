/* ==========================================================================
   EVENTS

   Two lists. RECURRING is what happens on a rhythm and does not need
   re-entering. CALENDAR is dated items.

   An event disappears from the site the day after it happens. Nothing to
   remember, nothing to tidy up.

   TIMES ARE LOCAL WALL-CLOCK, ALWAYS
   Write the time you would say out loud. 11:30 means half past eleven in
   Polk City, whatever the clocks are doing. The build converts to UTC for
   the calendar files using a proper America/Chicago timezone block, so
   an event in November lands correctly even though the clocks change on
   the first of that month. Never write a UTC time here.

   Fields:
     id        stable, used for the .ics filename. Do not reuse one.
     date      YYYY-MM-DD
     start     'HH:MM' 24-hour, local
     end       'HH:MM' 24-hour, local
     title     what it is called
     where     venue name
     address   full postal address, used by the calendar files and maps
     venue     optional slug from members.js, if the venue is a member
     summary   one plain sentence
     detail    optional paragraph
     cost      free text
     rsvp      { label, href } or leave out
     audience  'members' | 'public'
     season    sun | autumn | spring | winter
   ========================================================================== */

export const TIMEZONE = 'America/Chicago';

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
    title: 'Coffee and Connections',
    when: 'Fourth Thursday of the month, 7:45 am',
    where: 'Rising Sun Cafe',
    summary: 'An hour of networking before the working day starts. No program, no speaker.',
    cost: 'Free, buy your own coffee',
    audience: 'public',
    season: 'winter'
  },
  {
    title: 'Ribbon cuttings',
    when: 'Scheduled as needed',
    where: 'Your place of business',
    summary: 'A photo, a crowd, and a post that reaches several thousand people locally.',
    detail: 'Open to any chamber member opening, moving, expanding, or hitting a milestone. The chamber brings the oversized scissors and handles the promotion.',
    cost: 'Included with membership',
    rsvp: { label: 'Ask for a ribbon cutting', href: 'mailto:admin@polkcitychamber.com?subject=Ribbon%20cutting%20request' },
    audience: 'members',
    season: 'spring'
  }
];

export const CALENDAR = [
  {
    id: 'luncheon-2026-09-09',
    date: '2026-09-09', start: '11:30', end: '13:00',
    title: 'Polk City Area Chamber Luncheon',
    where: 'Tournament Club of Iowa',
    address: '1000 Tradition Dr, Polk City, IA 50226',
    venue: 'tournament-club-of-iowa',
    summary: 'The monthly luncheon. Register through the club ahead of the date and pick your meal.',
    cost: '$20',
    rsvp: { label: 'Register', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  },
  {
    id: 'coffee-2026-09-24',
    date: '2026-09-24', start: '07:45', end: '09:00',
    title: 'Coffee and Connections',
    where: 'Rising Sun Cafe',
    address: '107 N 2nd St, Polk City, IA 50226',
    summary: 'Early networking before the day starts. Turn up, buy a coffee, talk to people.',
    cost: 'Free',
    audience: 'public',
    season: 'winter'
  },
  {
    id: 'luncheon-2026-10-14',
    date: '2026-10-14', start: '11:30', end: '13:00',
    title: 'Polk City Area Chamber Luncheon',
    where: 'Tournament Club of Iowa',
    address: '1000 Tradition Dr, Polk City, IA 50226',
    venue: 'tournament-club-of-iowa',
    summary: 'The monthly luncheon. Register through the club ahead of the date and pick your meal.',
    cost: '$20',
    rsvp: { label: 'Register', href: 'https://tcofiowa.com/product/2026-chamber-of-commerce-meetings/' },
    audience: 'public',
    season: 'sun'
  },
  {
    id: 'trunk-or-treat-2026-10-25',
    date: '2026-10-25', start: '16:00', end: '18:00',
    title: 'Chamber Trunk or Treat',
    where: 'Polk City Town Square',
    address: '107 S 3rd St, Polk City, IA 50226',
    summary: 'A community event for Polk City area residents, with local businesses handing out candy.',
    detail: 'Attendees can vote for their favourite decorated trunk at the chamber table. A sign-up link for businesses will go out by email.',
    cost: 'Free',
    audience: 'public',
    season: 'autumn'
  },
  {
    id: 'coffee-2026-10-29',
    date: '2026-10-29', start: '07:45', end: '09:00',
    title: 'Coffee and Connections',
    where: 'Rising Sun Cafe',
    address: '107 N 2nd St, Polk City, IA 50226',
    summary: 'Early networking before the day starts. Turn up, buy a coffee, talk to people.',
    cost: 'Free',
    audience: 'public',
    season: 'winter'
  },
  {
    id: 'mixer-2026-10-29',
    date: '2026-10-29', start: '17:30', end: '19:30',
    title: 'Chamber Connections: Networking and Membership Mixer',
    where: 'Arcadia',
    address: '1010 Tyler St #4, Polk City, IA 50226',
    venue: 'arcadia',
    summary: 'An evening for current members, past members, and any business thinking about joining.',
    detail: 'Hors d\u2019oeuvres, networking, and a chance to hear how the chamber can help your business. Come whether or not you are a member.',
    cost: 'Free',
    audience: 'public',
    season: 'autumn'
  }
];
