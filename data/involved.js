/* ==========================================================================
   GET INVOLVED and PRIVACY

   The old site had a Get Involved page and a Privacy Policy page. Both are
   rebuilt here so nothing that is currently linked or indexed goes dead.

   The board list is a placeholder. Real names, roles, and the businesses
   they represent go in BOARD below.
   ========================================================================== */

export const INVOLVED = {
  lede: 'Membership pays for the chamber. Volunteers are what make it do anything.',
  intro: 'There is no full-time staff. Every event, every ribbon cutting, and every page of this website exists because somebody with a business to run decided to spend an evening on it. Here is where the help is actually needed.',

  ways: [
    {
      season: 'sun',
      title: 'Join a committee',
      body: 'Committees do the work between board meetings. Events, membership, and communications each meet about once a month and each could use two more people.',
      ask: 'A couple of hours a month.',
      action: { label: 'Ask which committee needs people', href: 'mailto:{EMAIL}?subject=Committee%20interest' }
    },
    {
      season: 'spring',
      title: 'Help at an event',
      body: 'The golf tournament needs about fifteen people for one morning. The luncheon needs one person to run the sign-in table. Neither requires a commitment beyond the day.',
      ask: 'One morning.',
      action: { label: 'Put your name down', href: 'mailto:{EMAIL}?subject=Event%20volunteer' }
    },
    {
      season: 'autumn',
      title: 'Sponsor something',
      body: 'Sponsorship is how the chamber funds programs without raising dues. The golf tournament has hole sponsorships. Luncheons have a speaker slot. New programs need a first backer.',
      ask: 'Money, and your logo in front of the local business community.',
      action: { label: 'See what is available', href: 'mailto:{EMAIL}?subject=Sponsorship' }
    },
    {
      season: 'winter',
      title: 'Run for the board',
      body: 'Board seats come open at the annual meeting. Directors set the budget, approve programs, and decide what the chamber says on behalf of local business.',
      ask: 'A monthly meeting and a real say in what happens.',
      action: { label: 'Ask about open seats', href: 'mailto:{EMAIL}?subject=Board%20interest' }
    }
  ],

  /* The board, as shown on the chamber website.

     Where a director's business is a chamber member, "member" is their
     slug from members.js and their name links to their directory page.
     Two are listed as community members rather than representing a
     business, which is how the chamber describes them.

     The Administrative Director seat is open. Leaving it visible rather
     than hiding it is deliberate: it is a real vacancy, it explains why
     things move at the pace they do, and somebody reading this page is
     exactly who might fill it. */
  board: [
    { name: 'Shawn Comer',      role: 'President',        business: "Papa's Pizzeria", member: 'papas-pizzeria' },
    { name: 'Susie Sheldahl',   role: 'Vice President',   business: 'Realty One Group Impact', member: 'susie-sheldahl-realty-one-group-impact' },
    { name: 'Jake Lundgren',    role: 'Treasurer',        business: 'Knapp Properties', member: 'knapp-properties' },
    { name: 'Brandon Converse', role: 'Secretary',        business: 'Luana Savings Bank', member: 'luana-savings-bank' },
    { name: 'Laramie Sandquist', role: 'Director',        business: 'Community member' },
    { name: 'Brian Nelson',     role: 'Director',         business: "Nelson's Automotive" },
    { name: 'Ryan Toney',       role: 'Director',         business: 'P&M Apparel', member: 'p-and-m-apparel' },
    { name: 'Mary Treanor',     role: 'Fiscal Agent',     business: 'Community member' },
    { name: 'Administrative Director', role: 'Staff',     business: 'Position open', vacant: true }
  ]
};

export const PRIVACY = {
  updated: 'September 2026',
  intro: 'Short version: the chamber collects almost nothing, does not sell anything to anyone, and does not run advertising trackers on this site.',
  sections: [
    {
      title: 'What this website collects',
      body: 'Page view counts through privacy-friendly analytics. No cookies are set for advertising, and no personal profile is built. The chamber can see that a page was viewed and roughly where from, not who viewed it.'
    },
    {
      title: 'What you give us on purpose',
      body: 'If you email the chamber, apply for membership, or register for an event, the chamber keeps what you sent so it can respond and keep records. Membership records include business contact details and payment history.'
    },
    {
      title: 'Who else sees it',
      body: 'Your directory listing is public by design, because being found is the point. Nothing else is shared, sold, or rented. Event registration handled by a venue is subject to that venue\u2019s own policy.'
    },
    {
      title: 'How long it is kept',
      body: 'Membership and financial records are kept as long as the chamber is required to keep them for accounting and nonprofit reporting. Email is kept until it is no longer useful.'
    },
    {
      title: 'Changing or removing your information',
      body: 'Email the chamber and it gets changed. A member who leaves can ask for their directory page to come down, and it will.'
    }
  ]
};
