/* ==========================================================================
   PAGE CONTENT

   About, FAQ, and the resources page. Plain text, no HTML needed except
   simple links written as [label](https://address).
   ========================================================================== */

export const ABOUT = {
  lede: 'The chamber is a nonprofit run by local business owners. It exists to make it easier to start, run, and grow a business in the Polk City area.',
  body: [
    'Polk City is one of the faster growing communities in Iowa, and growth cuts both ways for a small business. More rooftops mean more customers, and they also mean more competition, higher rents, and a city government making decisions that land directly on your operation.',
    'The chamber is how local businesses keep track of that together. It runs the monthly luncheon, the golf tournament, and the ribbon cuttings. It maintains the member directory. It watches what the legislature and the county are doing and translates it. And it speaks for local business when the city is deciding something that affects them.',
    'It is not part of city government and it does not endorse candidates.'
  ]
};

export const FAQ = [
  {
    q: 'Is the chamber part of the city?',
    a: 'No. The chamber is an independent nonprofit that works alongside the city and other partners. For city business, permits, and council information, go to [polkcityia.gov](https://www.polkcityia.gov).'
  },
  {
    q: 'Do I need to be a member to come to events?',
    a: 'Most events are open to anyone. Some networking events are members only, and members pay less at the ones that cost money.'
  },
  {
    q: 'What kinds of businesses join?',
    a: 'All of them. Sole proprietors working out of a spare room, trades, restaurants, banks, nonprofits, and a few larger employers.'
  },
  {
    q: 'Does the chamber take political positions?',
    a: 'The chamber advocates for local business on policy that affects local business. It does not endorse candidates or parties, and the Business Policy Center presents what changed and what it means without telling anyone how to vote.'
  },
  {
    q: 'How do I get something on the community calendar?',
    a: 'Email the details to admin@polkcitychamber.com. Community events do not have to be run by a member.'
  },
  {
    q: 'Who runs the chamber?',
    a: 'A volunteer board of directors elected by the membership, with day-to-day work handled by chamber staff and committee volunteers.'
  }
];

export const RESOURCE_GROUPS = [
  {
    season: 'sun',
    title: 'Money you can go after',
    blurb: 'Grants, loans, and free help, with plain language about who actually qualifies.',
    links: [
      { label: 'Business Policy Center, grants section', href: '{POLICY}#/money', note: 'The chamber keeps this current and says who is excluded, which the state pages often bury.' },
      { label: 'Iowa Economic Development Authority', href: 'https://www.iowaeda.com/', note: 'State programs for expansion, equipment, and workforce training.' },
      { label: 'Iowa SBDC', href: 'https://www.iowasbdc.org/', note: 'Free one-on-one business advising. Genuinely free, not a sales funnel.' },
      { label: 'SBA Iowa District Office', href: 'https://www.sba.gov/district/iowa', note: 'SBA loan programs and lender matching.' }
    ]
  },
  {
    season: 'winter',
    title: 'Rules and paperwork',
    blurb: 'What you have to file, who you file it with, and what changed this year.',
    links: [
      { label: 'Business Policy Center, new laws section', href: '{POLICY}#/laws', note: 'What the legislature changed and whether it affects you.' },
      { label: 'Iowa Secretary of State, business filings', href: 'https://sos.iowa.gov/business/', note: 'Register an entity, file a biennial report.' },
      { label: 'Iowa Department of Revenue', href: 'https://revenue.iowa.gov/', note: 'Sales tax permits and withholding.' },
      { label: 'City of Polk City', href: 'https://www.polkcityia.gov/', note: 'Permits, zoning, and signage rules.' }
    ]
  },
  {
    season: 'spring',
    title: 'Hiring and people',
    blurb: 'Finding staff, training them, and staying on the right side of employment rules.',
    links: [
      { label: 'IowaWORKS', href: 'https://www.iowaworks.gov/', note: 'Post jobs at no cost and connect to hiring events.' },
      { label: 'Iowa Workforce Development', href: 'https://www.iowaworkforcedevelopment.gov/', note: 'Unemployment insurance, wage rules, and workplace posters.' },
      { label: 'DMACC business and industry training', href: 'https://www.dmacc.edu/business-and-industry/', note: 'Customized training, sometimes with the cost partly reimbursed.' }
    ]
  },
  {
    season: 'autumn',
    title: 'Growing and getting known',
    blurb: 'Ways to reach customers that do not require a marketing budget.',
    links: [
      { label: 'Ask for a ribbon cutting', href: 'mailto:admin@polkcitychamber.com?subject=Ribbon%20cutting%20request', note: 'Free to members and reaches several thousand people locally.' },
      { label: 'Add your event to the community calendar', href: 'mailto:admin@polkcitychamber.com?subject=Community%20event', note: 'Open to anyone, member or not.' },
      { label: 'Catch Des Moines', href: 'https://www.catchdesmoines.com/', note: 'Regional tourism listings, useful if you get visitor traffic from Saylorville and Big Creek.' }
    ]
  }
];
