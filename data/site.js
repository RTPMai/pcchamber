/* ==========================================================================
   POLK CITY AREA CHAMBER — WEBSITE
   SITE FILE

   Chamber facts, menu, and footer. Edit here, not in the HTML.
   ========================================================================== */

export const SITE = {
  name: 'Polk City Area Chamber of Commerce',
  shortName: 'Polk City Area Chamber',
  tagline: 'The business network for Polk City, Alleman, Elkhart and Sheldahl.',

  // The address the site lives at. Used for canonical links, the sitemap,
  // the social share card, and every link in the emails the site sends.
  // Until the domain moves to Vercel this has to stay on the vercel.app
  // address, or those links land on the old GoDaddy site.
  // AT CUTOVER: set SITE_URL=https://polkcitychamber.com in Vercel and
  // redeploy. No code change needed.
  url: ((typeof process !== 'undefined' && process.env && process.env.SITE_URL) || 'https://pcchamber.vercel.app').replace(/\/+$/, ''),

  email: 'admin@polkcitychamber.com',
  phone: '515-229-0812',
  mail: 'PO Box 226, Polk City, IA 50226',

  social: {
    facebook: 'https://www.facebook.com/polkcitychamber',
    instagram: 'https://www.instagram.com/polkcitychamber',
    linkedin: 'https://www.linkedin.com/company/go-polk-city/',
    tiktok: 'https://www.tiktok.com/@polkcitychamber',
    youtube: 'https://www.youtube.com/channel/UCndg7vLfAKBheqFRqbeBytQ'
  },

  /* RED ALERT BAR
     A red strip above the header on every page. For things with a
     deadline: storm recovery, a program closing, a road shut.

     It switches itself off after the date in `until`, so a stale notice
     cannot sit there for a year. Set `active: false` to pull it early.

     title  the bold bit, a few words
     text   one sentence
     href   where it goes, usually a page on this site
     label  the link text
     until  YYYY-MM-DD. The last day it shows. */
  alert: {
    active: true,
    title: 'Storm and flood recovery:',
    text: 'SBA damage loans for the July flooding reopened until November 20, and working capital loans stay open into 2027.',
    href: '/resources/disaster-help/',
    label: 'What is still open',
    until: '2027-04-23'
  },

  // Turn this off the day real member data replaces the samples.
  demoBanner: false,
  demoBannerText:
    'Demo site. The 61 member listings are real. Descriptions, membership tiers and some event dates are still being collected.',

  /* FORMS
     The join form and the event form post here. /api/track?form=1 emails
     each one to the chamber through Resend (see api/_lib/forms.js), to
     FORMS_TO in Vercel or the email above.

     Leave it empty and both forms fall back to opening an email instead.
     If Resend is down or not set up, they fall back the same way.  */
  formEndpoint: '/api/track?form=1',

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

/* The four doors on the home page now live in content/text.json and are
   edited in the admin under Website wording. */
