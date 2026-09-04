/* ==========================================================================
   MEMBERSHIP

   Taken from "Membership levels and benefits", the proposal currently in
   front of the board.

   THE DRAFT SWITCH

   draft stays true until the board votes. While it is true a red banner
   sits at the top of the membership page and the prices are marked as not
   final. Turn it off only after the vote.
   ========================================================================== */

export const MEMBERSHIP = {
  draft: true,
  draftNote:
    'This structure is a proposal under review by the chamber board. Prices and benefits are not final and should not be quoted to prospective members yet.'
};

export const TIER_LIST = [
  {
    id: 'individual',
    season: 'winter',
    name: 'Individual Membership',
    price: '$100 to $125',
    per: 'a year',
    who: 'For a person rather than a business. Residents, retirees, job seekers, and people who want to be part of the local business community without owning a business.',
    includes: [
      'Networking event access',
      'Educational programs and workshops',
      'Volunteer and committee opportunities',
      'Chamber news and updates',
      'New member social recognition',
      'Business Policy Center access'
    ]
  },
  {
    id: 'basic',
    season: 'spring',
    name: 'Basic Business',
    price: '$200 to $600',
    per: 'a year, by size',
    highlight: true,
    who: 'The working level of chamber membership. Everything a local business needs to be found, referred and connected.',
    /* Priced by headcount rather than one flat number, so a sole trader is
       not paying what a thirty-person employer pays. */
    scale: [
      { label: 'Under 5 employees', price: '$200' },
      { label: '5 to 15 employees', price: '$400' },
      { label: '16 or more employees', price: '$600' },
      { label: 'Nonprofit, any size', price: '$150' }
    ],
    includes: [
      'Directory listing, chamber and NP Living',
      'Chamber window cling',
      'Referral exclusivity',
      'Referral growth credit',
      'Business Policy Center access',
      'Reciprocal Greater Des Moines Partnership membership',
      'Ribbon cuttings',
      'Events calendar listing',
      'Luncheon access',
      'Coffee and Connections',
      'Notary access'
    ]
  },
  {
    id: 'partner',
    season: 'sun',
    name: 'Community Partner',
    price: '$750',
    per: 'a year',
    who: 'For businesses that want visibility and a seat at the table, not just a listing.',
    builds: 'Basic Business',
    includes: [
      'Logo on the Get Involved page',
      '3 luncheon tickets',
      'Invitation to the legislator coffee',
      'Host a networking event at your business',
      'Contribute to the New Member Welcome Kit'
    ]
  },
  {
    id: 'investor',
    season: 'winter',
    name: 'Community Investor',
    price: '$1,750',
    per: 'a year',
    who: 'For businesses using the chamber as a marketing channel, with recurring exposure to the full membership.',
    builds: 'Community Partner',
    includes: [
      'Email signature logo and newsletter recognition',
      'Golf hole sponsorship',
      '$250 sponsorship credit',
      '6 luncheon tickets total, not 6 more',
      '2 social media spotlights a year',
      'Stand-alone email to the full membership',
      'Negotiated financial institution rate'
    ]
  },
  {
    id: 'sponsor',
    season: 'autumn',
    name: 'Community Sponsor',
    price: '$3,500',
    per: 'a year',
    who: 'For businesses making a substantial investment in the chamber, and who want to see what it returned.',
    builds: 'Community Investor',
    includes: [
      'Golf tournament foursome',
      '$500 sponsorship credit',
      'Quarterly social media spotlights',
      'Annual member plaque',
      'Digital chamber member badge',
      'Logo on event signage',
      'Quarterly impact report',
      'Priority slot in the Welcome Kit'
    ]
  },
  {
    id: 'champion',
    season: 'navy',
    name: 'Community Champion',
    price: '$6,000',
    per: 'a year',
    flag: 'Invitation only, capped at 3 members',
    who: 'The top level, deliberately scarce. Influence over chamber priorities and access to the people making local decisions.',
    builds: 'Community Sponsor',
    includes: [
      'Seat at the Chamber Priorities roundtable',
      'Naming sponsorship of a signature event',
      'Feature profile in an annual chamber publication',
      'Community Champion plaque',
      'Priority scheduling',
      'Two golf foursomes',
      '$1,000 sponsorship credit',
      '12 luncheon tickets total',
      'Monthly social media spotlight rotation',
      'In-person annual impact report presentation'
    ]
  }
];

/* Why a business here pays for this, written for someone deciding. */
export const WHY = [
  {
    season: 'spring',
    title: 'People find you',
    body: 'Your directory page is a real page with a real address, so it turns up when somebody searches for what you do plus Polk City. Most chamber directories are invisible to search engines. This one is not.'
  },
  {
    season: 'sun',
    title: 'You are the one referred',
    body: 'Referral exclusivity means that when the chamber gets a call asking who to use for what you do, you are the answer. In a town this size that is most of the value.'
  },
  {
    season: 'winter',
    title: 'Somebody reads the boring documents',
    body: 'The chamber tracks what the legislature, the county, and the city are doing to businesses here and writes it in plain language in the Business Policy Center. That is a member benefit, not a public page.'
  },
  {
    season: 'autumn',
    title: 'You get a say',
    body: 'The chamber speaks for local business to the city and the county. What it says is shaped by members who show up.'
  }
];

export const JOIN_FAQ = [
  {
    q: 'Do I have to be in Polk City?',
    a: 'No. The chamber covers the wider area, including Alleman, Elkhart, and Sheldahl, and plenty of members are based elsewhere in the metro and do business here.'
  },
  {
    q: 'How is Basic Business priced?',
    a: 'By headcount, so a one-person business is not paying what a thirty-person employer pays. Nonprofits pay $150 at any size.'
  },
  {
    q: 'What does referral exclusivity actually mean?',
    a: 'When somebody asks the chamber who to call for what you do, you are the name given. It is the one benefit a larger chamber cannot copy, because it only works when the list is short.'
  },
  {
    q: 'Can I come to a luncheon before I join?',
    a: 'Yes. Guests are welcome at the guest rate. Come to one before you spend anything.'
  },
  {
    q: 'What happens after I apply?',
    a: 'You get an invoice and a short form asking how you want your directory listing written. Your page is live within a week.'
  },
  {
    q: 'Is this the same as the city?',
    a: 'No. The chamber is an independent nonprofit. The city is at polkcityia.gov.'
  }
];
