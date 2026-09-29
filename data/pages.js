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

/* ==========================================================================
   BUSINESS RESOURCES

   One hub page with a card per section, and a real page behind each card.
   The old version put every link on one page and it was a wall.

   The Business Policy Center is deliberately NOT listed inside these
   sections. It sits as a single button on the hub. Repeating it in every
   group made it look like four different things.

   Each group needs:
     slug     its web address under /resources/
     season   sun | autumn | spring | winter
     title    what the section is called
     blurb    one sentence, shown on the card before anyone clicks
     intro    a short paragraph, shown at the top of its own page
     links    { label, href, note }

   TO ADD A LINK
     Put it in the group where somebody would look for it, not the group
     that matches who runs it. A grant administered by the county still
     belongs under money.
   ========================================================================== */

export const RESOURCE_GROUPS = [
  {
    slug: 'money',
    season: 'sun',
    title: 'Money you can go after',
    blurb: 'Grants, loans, and free advice, with straight talk about who actually qualifies.',
    intro: 'Most of these programmes are open to businesses here and most local owners never apply. The eligibility rules are the part that catches people out, so read those before the dollar figures.',
    links: [
      { label: 'Iowa Economic Development Authority', href: 'https://www.iowaeda.com/', note: 'State programmes for expansion, equipment, and workforce training.' },
      { label: 'IowaGrants.gov', href: 'https://www.iowagrants.gov/', note: 'Where state grant applications are actually filed. Register before a deadline, not on the day.' },
      { label: 'Iowa SBDC', href: 'https://www.iowasbdc.org/', note: 'Free one-to-one business advising. Genuinely free, not a sales funnel.' },
      { label: 'SBA Iowa District Office', href: 'https://www.sba.gov/district/iowa', note: 'SBA loan programmes and lender matching.' },
      { label: 'SCORE Des Moines', href: 'https://www.score.org/desmoines', note: 'Free, confidential mentoring from people who have run businesses. Phone, video, email, or in person, for as long as you want it.' },
      { label: 'Targeted Small Business certification', href: 'https://opportunityiowa.gov/business/small-business-entrepreneurs/small-business-resources/targeted-small-business-program', note: 'For Iowa businesses under $4 million average gross income that are at least 51% owned and run by a woman, a minority, a service-disabled veteran, or a person with a disability. See state buying needs 48 hours early, skip competitive bidding on state purchases under $25,000, and apply for loans up to $50,000.' },
      { label: 'Iowa Center for Economic Success', href: 'https://theiowacenter.org/', note: 'Coaching, classes, and business loans up to $50,000. Home of the SBA Women\'s Business Center for Iowa. 515-283-0940.' },
      { label: 'Iowa MicroLoan', href: 'https://www.iowamicroloan.org/', note: '$5,000 to $50,000 on a six-year term to start, expand, or refinance. You generally need a bank to have turned you down first.' },
      { label: 'One Economy Financial Development Corp', href: 'https://oefdc.org/businesses', note: 'Loans up to $5,000 to start or grow a business, decided on more than your credit score. Meeting with them is free and involves no credit check.' },
      { label: 'Choose Iowa grants', href: 'https://www.chooseiowa.com/grants', note: 'Food and farm programmes. Check the exclusions: meat and dairy processing are handled separately.' },
      { label: 'Grants.gov', href: 'https://www.grants.gov/', note: 'Federal grants. Large, slow, and worth it for a few.' },
      { label: 'Polk County news and announcements', href: 'https://www.polkcountyiowa.gov/news-and-announcements/', note: 'Where county grant rounds get announced, including CDBG.' }
    ]
  },
  {
    slug: 'rules',
    season: 'winter',
    title: 'Rules and paperwork',
    blurb: 'What you have to file, who you file it with, and what changed this year.',
    intro: 'Nothing here is interesting and all of it is compulsory. The city page is the one most often needed and least often found.',
    links: [
      { label: 'City of Polk City', href: 'https://www.polkcityia.gov/', note: 'Permits, zoning, signage, and council agendas. The chamber is not the city.' },
      { label: 'Polk City municipal code', href: 'https://www.polkcityia.gov/businesses/pages/municipal-code', note: 'The actual rules, including what you can put on your building.' },
      { label: 'Iowa Secretary of State, business filings', href: 'https://sos.iowa.gov/business/', note: 'Register an entity, file a biennial report.' },
      { label: 'Iowa Department of Revenue', href: 'https://revenue.iowa.gov/taxes/file-my-taxes/business-taxes', note: 'Sales tax permits and withholding.' },
      { label: 'IRS Small Business Center', href: 'https://www.irs.gov/businesses/small-businesses-self-employed', note: 'Federal taxes. When the IRS and a firm blog disagree, the IRS is right.' },
      { label: 'Polk County Assessor, appealing an assessment', href: 'https://www.polkcountyiowa.gov/county-assessor/appealing-your-assessment/', note: 'Protest deadlines live here and they are not generous.' }
    ]
  },
  {
    slug: 'hiring',
    season: 'spring',
    title: 'Hiring and people',
    blurb: 'Finding staff, training them, and staying on the right side of employment rules.',
    intro: 'Two of these cost nothing and are underused. Posting a job on IowaWORKS is free, and DMACC will sometimes cover part of the cost of training you were going to pay for anyway.',
    links: [
      { label: 'IowaWORKS', href: 'https://www.iowaworks.gov/', note: 'Post jobs at no cost and connect to hiring events.' },
      { label: 'Iowa Workforce Development', href: 'https://www.iowaworkforcedevelopment.gov/', note: 'Unemployment insurance, wage rules, and the posters you are required to display.' },
      { label: 'Workforce and training grants', href: 'https://workforce.iowa.gov/opportunities/grants', note: 'Money towards training existing staff.' },
      { label: 'DMACC business and industry training', href: 'https://www.dmacc.edu/business-and-industry/', note: 'Customised training, sometimes with the cost partly reimbursed.' },
      { label: 'Evelyn K. Davis Center', href: 'https://lsiowa.org/evelyn-k-davis-center/', note: 'Workforce training, job search help, and small business coaching in Des Moines. Now run by Lutheran Services in Iowa.' },
      { label: 'The chamber job board', href: '/jobs/', note: 'Free for members. Openings at member businesses, seen by people who already live here.' }
    ]
  },
  {
    slug: 'disaster-help',
    season: 'autumn',
    title: 'Storm and flood recovery',
    blurb: 'What is still open after the July 2026 flooding, and what has already closed.',
    intro: 'The July 2 to 4 flooding put Polk County under an SBA disaster declaration. The deadline to apply for damage to buildings, equipment and stock passed on September 21, 2026. Working capital loans are still open, and a business does not need to have had physical damage to apply for one. Nonprofits are covered by a second declaration with later deadlines.',
    links: [
      { label: 'Apply for an SBA disaster loan', href: 'https://lending.sba.gov/', note: 'Economic injury applications for businesses are open until April 23, 2027. Working capital for bills the flooding stopped you paying, up to $2 million at 4%.' },
      { label: 'Nonprofits: apply by November 2', href: 'https://www.sba.gov/funding-programs/disaster-assistance', note: 'A separate declaration covers private nonprofits and faith-based organisations. Physical damage closes November 2, 2026, economic injury June 1, 2027, at 3.625%.' },
      { label: 'SBA fact sheet for this disaster', href: '/assets/docs/sba-disaster-loan-fact-sheet.pdf', note: 'Declaration #21727 and #21728. Rates, terms, limits, and what is not eligible. PDF.' },
      { label: 'The SBA news release', href: '/assets/docs/sba-disaster-loan-news-release.pdf', note: 'The original July 24 announcement, including the outreach centres that have since closed. PDF.' },
      { label: 'SBA customer service', href: 'mailto:disastercustomerservice@sba.gov', note: 'Or 800-659-2955. They will tell you whether it is worth applying before you fill anything in.' },
      { label: 'Help for households', href: 'https://homelandsecurity.iowa.gov/assistance', note: 'State grants and disaster case advocacy for residents. Grant applications run 45 days from the disaster, but a case advocate can help after that.' },
      { label: 'Iowa disaster assistance flyer', href: '/assets/docs/iowa-disaster-assistance.pdf', note: 'Iowa HSEM, plain English. Also 515-675-1884 or disastercaseadvocacy@iowa.gov. PDF.' }
    ]
  },
  {
    slug: 'growing',
    season: 'autumn',
    title: 'Growing and getting known',
    blurb: 'Ways to reach customers that do not need a marketing budget.',
    intro: 'The chamber runs most of these and members have already paid for them. A ribbon cutting reaches more people locally than anything you could buy for the same money, which is nothing.',
    links: [
      { label: 'Ask for a ribbon cutting', href: 'mailto:admin@polkcitychamber.com?subject=Ribbon%20cutting%20request', note: 'Included with membership. Opening, moving, expanding, or a milestone all count.' },
      { label: 'Add your event to the community calendar', href: '/events/add/', note: 'Open to anyone running something locally, member or not.' },
      { label: 'The member directory', href: '/directory/', note: 'Your listing is a real page that turns up in search. Keep your details current.' },
      { label: 'Catch Des Moines', href: 'https://www.catchdesmoines.com/', note: 'Regional tourism listings. Worth it if you get visitor traffic from Saylorville and Big Creek.' },
      { label: 'Greater Des Moines Partnership', href: 'https://www.dsmpartnership.com/', note: 'Metro-wide business network. Basic Business membership includes reciprocal membership.' },
      { label: 'North Polk Living', href: 'https://www.iowalivingmagazines.com/north-polk', note: 'The local monthly magazine. Openings, milestones, and events are free to send in. Press releases go to tammy@iowalivingmagazines.com.' },
      { label: 'Goldman Sachs 10,000 Small Businesses', href: 'https://www.iowa10ksb.com/', note: 'A no-cost growth programme for established businesses, run through DMACC and the other Iowa community colleges. Offices on the Ankeny campus. Take the eligibility quiz before you apply.' },
      { label: 'Iowa APEX Accelerator', href: 'https://www.ciras.iastate.edu/government-contracting/', note: 'Free help selling to federal, state, and local government: registration, bids, and certifications. Run by Iowa State\'s CIRAS.' },
      { label: 'IASourceLink', href: 'https://www.iasourcelink.com/', note: 'Searchable directory of 360+ nonprofit business resources across Iowa. Start here when nothing above fits.' }
    ]
  }
];
