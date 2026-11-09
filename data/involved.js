import { readFileSync } from 'node:fs';

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

  board: JSON.parse(readFileSync(new URL('../content/board.json', import.meta.url), 'utf8')).board
};

export const PRIVACY = {
  updated: 'November 2026',
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
      title: 'Signing in',
      body: 'Members and chamber admins who sign in get one cookie that keeps them signed in. It does nothing else and is not used for tracking or advertising. Signing out or closing the session ends it.'
    },
    {
      title: 'Listing stats',
      body: 'Member directory pages count how often they are viewed and how often someone taps to call, email, visit the website or get directions, so members can see what their listing does for them. Only the totals are kept. To avoid counting one person twice, a scrambled code made from your connection and the date is kept for one day and then deleted. No cookies are involved.'
    },
    {
      title: 'The newsletter',
      body: 'If you sign up, the chamber keeps your email address and the date you confirmed, and uses it only to send chamber news. Every newsletter has a one-click unsubscribe link, and unsubscribing deletes your address from the list.'
    },
    {
      title: 'Who else sees it',
      body: 'Your directory listing is public by design, because being found is the point. Nothing else is shared, sold, or rented. Event registration handled by a venue is subject to that venue\u2019s own policy.'
    },
    {
      title: 'Services that run the site',
      body: 'A few outside companies handle parts of the work and only see what they need to do it: Stripe processes online payments, Resend delivers email, and Vercel hosts the site. Card numbers go straight to Stripe and never reach the chamber. Each company has its own privacy policy.'
    },
    {
      title: 'Keeping it safe',
      body: 'The whole site runs over an encrypted connection. Member and admin areas need a sign in, and only the board members and volunteers who need records for chamber work can see them.'
    },
    {
      title: 'How long it is kept',
      body: 'Membership and financial records are kept as long as the chamber is required to keep them for accounting and nonprofit reporting. Email is kept until it is no longer useful.'
    },
    {
      title: 'Changing or removing your information',
      body: 'Email the chamber at admin@polkcitychamber.com and it gets changed. A member who leaves can ask for their directory page to come down, and it will.'
    },
    {
      title: 'Links to other sites',
      body: 'This site links to a lot of other organizations, from state agencies to member websites. Once you leave, their privacy practices apply, not the chamber\u2019s.'
    },
    {
      title: 'Children',
      body: 'This site is meant for adults and businesses. The chamber does not knowingly collect information from children under 13.'
    },
    {
      title: 'Changes to this policy',
      body: 'If this policy changes, the new version goes on this page with a new date at the top.'
    },
    {
      title: 'Questions',
      body: 'Email admin@polkcitychamber.com with any question about this policy or your information.'
    }
  ]
};
