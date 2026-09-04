/* ==========================================================================
   POLK CITY AREA CHAMBER — WEBSITE
   SITE FILE

   Chamber facts, menu, and footer. Edit here, not in the HTML.
   ========================================================================== */

export const SITE = {
  name: 'Polk City Area Chamber of Commerce',
  shortName: 'Polk City Area Chamber',
  tagline: 'The business network for Polk City, Alleman, Elkhart and Sheldahl.',

  // Set this to the real address before launch. It is used for canonical
  // links, the sitemap, and the social share card.
  url: 'https://polkcitychamber.com',

  email: 'admin@polkcitychamber.com',
  phone: '515-229-0812',
  mail: 'PO Box 226, Polk City, IA 50226',

  social: {
    facebook: 'https://www.facebook.com/polkcitychamber',
    instagram: 'https://www.instagram.com/polkcitychamber',
    linkedin: 'https://www.linkedin.com/company/go-polk-city/',
    tiktok: 'https://www.tiktok.com/@polkcitychamber'
  },

  // Turn this off the day real member data replaces the samples.
  demoBanner: true,
  demoBannerText:
    'Demo site. Layout and features are real. Member listings and a few dates are placeholders until the live data is loaded in.',

  // The Policy Center is a separate project. Point this at its live address.
  policyCenterUrl: 'https://policy-center.vercel.app',

  // Every page gets one season color from the chamber logo roundel.
  // sun, autumn, spring, winter, navy
  nav: [
    { href: '/',            label: 'Home',        season: 'navy'   },
    { href: '/directory/',  label: 'Directory',   season: 'spring' },
    { href: '/events/',     label: 'Events',      season: 'sun'    },
    { href: '/membership/', label: 'Membership',  season: 'autumn' },
    { href: '/resources/',  label: 'Resources',   season: 'winter' },
    { href: '/get-involved/', label: 'Get involved', season: 'sun' },
    { href: '/about/',      label: 'About',       season: 'navy'   }
  ]
};

/* The four doors on the home page. One sentence each, before anyone clicks.
   Same rule as the Policy Center: say what it is, not what it is called. */
export const DOORS = [
  {
    href: '/directory/',
    season: 'spring',
    title: 'Find a local business',
    blurb: 'Every chamber member, sorted by what they actually do, with a real page for each one that shows up in search.'
  },
  {
    href: '/events/',
    season: 'sun',
    title: 'Come to something',
    blurb: 'The monthly luncheon, the golf tournament, ribbon cuttings, and what is happening around town.'
  },
  {
    href: '/membership/',
    season: 'autumn',
    title: 'Join the chamber',
    blurb: 'What it costs, what you get for it, and how to sign up. Prices are on the page, not behind a form.'
  },
  {
    href: '/resources/',
    season: 'winter',
    title: 'Get help running your business',
    blurb: 'Grants, permits, hiring help, and what is changing in state law that affects you.'
  }
];
