/* ==========================================================================
   MEMBERSHIP

   PRICING BELOW IS PLACEHOLDER. Swap in the board-approved figures before
   this goes anywhere near the public.

   The design decision worth defending: prices are on the page. Peer chambers
   hide them behind an application form, which makes a prospective member
   ask a person before they know whether they can afford it. That is one
   more reason to close the tab.
   ========================================================================== */

export const TIER_LIST = [
  {
    id: 'individual',
    season: 'winter',
    name: 'Individual',
    price: '$75',
    per: 'a year',
    who: 'Residents, retirees, and people who want to support local business without running one.',
    includes: [
      'Luncheons at the member rate',
      'The monthly member email',
      'A vote at the annual meeting'
    ]
  },
  {
    id: 'basic',
    season: 'spring',
    name: 'Member',
    price: '$200',
    per: 'a year',
    who: 'Sole proprietors and businesses with a handful of employees.',
    includes: [
      'A page in the member directory that shows up in search',
      'Luncheons at the member rate',
      'Ribbon cutting when you open, move, or expand',
      'Post your events on the community calendar'
    ]
  },
  {
    id: 'pro',
    season: 'autumn',
    name: 'Pro',
    price: '$450',
    per: 'a year',
    highlight: true,
    who: 'Established businesses that want the chamber working for them, not just listing them.',
    includes: [
      'Everything in Member',
      'Higher placement in the directory',
      'Two luncheon tickets included',
      'One member spotlight a year across chamber social and email',
      'Named as the referral for your category on the Business Policy Center'
    ]
  },
  {
    id: 'premier',
    season: 'sun',
    name: 'Premier',
    price: '$1,000',
    per: 'a year',
    who: 'Businesses treating the chamber as a marketing channel and wanting to be visible all year.',
    includes: [
      'Everything in Pro',
      'Logo on the home page and in the footer of every chamber email',
      'Four luncheon tickets included',
      'A hole sponsorship at the golf tournament',
      'First call on sponsorship of new chamber programs'
    ]
  }
];

/* The honest version of what a chamber membership is, written for someone
   deciding whether to spend the money. */
export const WHY = [
  {
    season: 'spring',
    title: 'People find you',
    body: 'Your directory page is a real page with a real address, so it turns up when somebody searches for what you do plus Polk City. Most chamber directories are invisible to search engines. This one is not.'
  },
  {
    season: 'sun',
    title: 'You meet the people who refer work',
    body: 'In a town this size most business arrives by referral. The luncheon is a low-effort way to be the name that comes to mind when somebody gets asked who to call.'
  },
  {
    season: 'winter',
    title: 'Somebody reads the boring documents',
    body: 'The chamber tracks what the legislature, the county, and the city are doing to businesses here, and writes it in plain language on the Business Policy Center.'
  },
  {
    season: 'autumn',
    title: 'You get a say',
    body: 'The chamber speaks for local business to the city and the county. What it says is shaped by members who show up.'
  }
];

/* Straight answers to the questions people actually ask before joining. */
export const JOIN_FAQ = [
  {
    q: 'Do I have to be in Polk City?',
    a: 'No. The chamber covers the wider area, including Alleman, Elkhart, and Sheldahl, and plenty of members are based elsewhere in the metro and do business here.'
  },
  {
    q: 'Can I come to a luncheon before I join?',
    a: 'Yes. Guests are welcome at the luncheon at the guest rate. Come to one before you spend anything.'
  },
  {
    q: 'What happens after I apply?',
    a: 'You get an invoice and a short form asking how you want your directory listing written. Your page is live within a week.'
  },
  {
    q: 'Is this the same as the city?',
    a: 'No. The chamber is an independent nonprofit. The city is at polkcityia.gov.'
  },
  {
    q: 'Can I pay monthly?',
    a: 'Not currently. Dues are annual. If cost is the obstacle, say so, because the board would rather have you in at a lower tier than not at all.'
  }
];
