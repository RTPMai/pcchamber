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
    'Demo site. The 61 member listings are real. Descriptions, membership tiers and some event dates are still being collected.',

  /* FORMS
     The join form and the event form post here. Any form service that
     accepts a plain POST works: Formspree, Basin, Getform, Tally.

     Leave it empty and both forms fall back to opening an email instead,
     so nothing breaks before it is set up.

     Formspree free tier handles 50 submissions a month, which is more
     than this chamber will use. Create a form, paste the endpoint here.  */
  formEndpoint: '',

  /* POLICY CENTER
     Now part of this site at /policy-center/ rather than a separate
     address, and gated because access is a paid member benefit.
     See api/policy.js and the README section on it. */
  policyCenterUrl: '/policy-center/',

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
