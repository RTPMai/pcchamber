/* ==========================================================================
   POLK CITY AREA CHAMBER OF COMMERCE
   MEMBERSHIP CONTENT FILE

   Tiers, prices, and the plain-language description of every benefit.

   HOW THIS IS PUT TOGETHER

   Each benefit is written ONCE in the BENEFITS list below, with a short
   name and a fuller description. Tiers then refer to benefits by their id.
   That means you edit a description in one place and it updates everywhere
   it appears.

   Where a benefit scales by tier, such as the number of Lunch and Learn
   tickets, the tier can override the displayed name with "label" while
   still sharing the same description.

   THE DRAFT SWITCH

   This is a proposal. Until the board votes on it, "draft" stays true and
   a clear banner appears at the top of the membership page. Turn it off
   only after the board has approved the structure and the prices.
   ========================================================================== */

const MEMBERSHIP = {
  draft: true,
  draftNote:
    'This structure is a proposal under review by the chamber board. Prices and benefits are not final and should not be quoted to prospective members yet.',

  title: 'Membership levels and benefits',
  intro:
    'What each level of chamber membership costs and what comes with it. Every benefit below can be opened for a fuller explanation of what it actually means in practice.',
  footnote:
    'Questions about which level fits your business? Email admin@polkcitychamber.com and we will talk it through.',
};

/* ==========================================================================
   BENEFITS

   Template:
     'benefit-id': {
       name: 'Short name, as it appears in the list',
       detail: 'A paragraph or two on what this actually gets you.',
     },

   Write the detail the way you would explain it to someone across the
   counter. Say what they receive, when they receive it, and what they have
   to do to use it. A benefit nobody understands is a benefit nobody values.
   ========================================================================== */

const BENEFITS = {
  'directory-listing': {
    name: 'Directory listing, chamber and NP Living',
    detail: 'Your business appears in the online chamber directory with your address, phone, email and website, and in the North Polk Living directory. This is the listing the chamber office looks at when someone calls asking for a recommendation, so keeping your details current matters more than most people realise.',
  },
  'window-cling': {
    name: 'Chamber window cling',
    detail: 'A decal for your door or window showing you are a chamber member. Small thing, but it is the most visible signal to a walk-in customer that you are part of the local business community, and it prompts more conversations than you would expect.',
  },
  'referral-exclusivity': {
    name: 'Referral exclusivity',
    detail: 'When someone contacts the chamber looking for a plumber, a caterer, an insurance agent or anything else, we send them to members only. Non-members do not get referred, no matter how well known they are. This runs on every tier, including Basic, and it is the benefit most directly tied to getting you paying work.',
  },
  'notary': {
    name: 'Notary access',
    detail: 'Free notary service through the chamber office when a notary is available. Call ahead rather than dropping in, since availability depends on staffing.',
  },
  'gdmp-reciprocal': {
    name: 'Reciprocal Greater Des Moines Partnership membership',
    detail: 'Your chamber membership gives you access to the Greater Des Moines Partnership, the regional business organisation for the metro. That means their events, their business resources and their advocacy network, at no extra cost. For a business here that wants metro-level connections, this is quietly one of the largest dollar-value items on the list.',
  },
  'ribbon-cutting': {
    name: 'Ribbon cuttings',
    detail: 'The chamber will organise and attend a ribbon cutting for a new business, a new location, a major remodel or a significant anniversary. We bring the oversized scissors, invite the membership and city officials, and take photos you can use. Contact the office a few weeks ahead so it can be promoted properly.',
  },
  'events-calendar': {
    name: 'Events calendar listing',
    detail: 'Post your own business events to the chamber community events calendar, where members and residents look for what is happening locally. Free to use and not limited by tier.',
  },
  'luncheon': {
    name: 'Luncheon access',
    detail: 'Attend the chamber luncheon, also called Lunch and Learn. Same event, two names. A meal, a speaker on a practical business topic, and time to meet other members. Open to every member at the member rate, paid per event. Higher tiers include prepaid tickets instead.',
  },
  'coffee-connections': {
    name: 'Coffee and Connections',
    detail: 'A regular morning networking meetup, informal and short enough to fit before your day starts. It is the lowest-effort way to actually meet other members, and the most consistent thing on the chamber calendar.',
  },
  'policy-center': {
    name: 'Business Policy Center access',
    detail: 'The chamber tracks new state laws, the ballot, grant opportunities and local government decisions, then explains in plain language what each one means for a business here. Instead of you monitoring the Statehouse and city council, we do it and hand you the short version, with links so you can check anything yourself.',
  },
  'referral-credit': {
    name: 'Referral growth credit',
    detail: 'Refer a business that joins the chamber and you earn a credit toward your own next renewal, scaled to the level the new member joins at. Refer enough and your membership pays for itself. The new member has to name you when they join, so tell them to.',
  },

  'logo-get-involved': {
    name: 'Logo on the Get Involved page',
    detail: 'Your logo appears on the chamber website, linked to your site. This is the first benefit that puts your brand rather than just your name in front of people browsing the chamber site.',
  },
  'luncheon-tickets': {
    name: 'Luncheon tickets',
    detail: 'Prepaid seats at the chamber luncheon, the same event as Lunch and Learn. Tickets are transferable, so you can send an employee instead of going yourself. They are one time use and they do not roll over. Three tickets means three seats across the year. Once you have used them you are welcome to keep attending, you just pay the member rate from then on.',
  },
  'legislator-coffee': {
    name: 'Invitation to the legislator coffee',
    detail: 'A small-group morning session with state legislators representing this area, held during or ahead of the legislative session. Small enough that you can actually raise something specific about your business rather than listening to a speech. This is the practical end of the chamber advocacy work described in the Business Policy Center.',
  },
  'host-networking': {
    name: 'Host a networking event at your business',
    detail: 'Put your business forward to host one chamber networking event during the year. Members come to you, see your space and meet your staff. For a retail, service or hospitality business this is the single most effective benefit on this list, because people who have been inside your building remember it.',
  },
  'welcome-kit-contribute': {
    name: 'Contribute to the New Member Welcome Kit',
    detail: 'Every new chamber member receives a welcome kit. You may include an item, a coupon, a sample or promotional material. Your business reaches every new member at the exact moment they are looking for local suppliers and are most likely to try someone new.',
  },

  'email-sig-logo': {
    name: 'Email signature logo and newsletter recognition',
    detail: 'Your logo is carried in the chamber email signature and you are recognised in the chamber newsletter. This puts your brand in front of the full membership repeatedly through the year rather than once.',
  },
  'golf-hole': {
    name: 'Golf hole sponsorship',
    detail: 'A sponsored hole at the annual chamber golf tournament, with your signage at the tee. Included rather than purchased separately.',
  },
  'sponsorship-credit': {
    name: 'Sponsorship credit',
    detail: 'A credit you can apply to any chamber sponsorship opportunity during the year, whether that is an event, a program or a publication. You choose where it goes, which means it fits your marketing rather than ours.',
  },
  'social-spotlight': {
    name: 'Social media spotlights',
    detail: 'Dedicated posts about your business across the chamber social accounts, which reach both members and the wider community. You supply photos and what you want said, and we schedule it. Best used around something specific such as a new product, a hire, an anniversary or a seasonal offer.',
  },
  'eblast': {
    name: 'Stand-alone email to the full membership',
    detail: 'One email of your own, sent to the entire chamber membership. Not a mention inside a newsletter, but a message that is entirely yours. You write it, the chamber sends it, which means it comes from an address members already trust and it does not land in spam. One per year, so save it for something that warrants it.',
  },
  'bank-rate': {
    name: 'Negotiated financial institution rate',
    detail: 'Access to a preferential rate or terms arranged between the chamber and a member financial institution. The chamber has three member banks, which is a strong negotiating position. This benefit becomes real once that agreement is signed and does not exist before then.',
  },

  'golf-foursome': {
    name: 'Golf tournament foursome',
    detail: 'Entry for four at the annual chamber golf tournament. A full day with other members and their guests, and the largest single networking event the chamber runs.',
  },
  'member-plaque': {
    name: 'Annual member plaque',
    detail: 'A physical plaque marking your support for the year, suitable for a lobby or office wall. Customers and visitors notice these, particularly in professional service offices.',
  },
  'digital-badge': {
    name: 'Digital chamber member badge',
    detail: 'A badge graphic for your website, email signature and social profiles, identifying you as a chamber member at your level. Sent as image files ready to use.',
  },
  'event-signage-logo': {
    name: 'Logo on event signage',
    detail: 'Your logo appears on printed and displayed signage at chamber events through the year, in front of attendees who are already local and already spending money locally.',
  },
  'impact-report': {
    name: 'Impact report',
    detail: 'A report showing what your membership actually produced: clicks to your listing from the chamber website, engagement with emails that featured you, attendance at events you sponsored, and how many referrals the chamber sent your way. Most chambers cannot tell you any of this. Being able to see it is what turns a renewal decision from a guess into a calculation.',
  },
  'welcome-kit-priority': {
    name: 'Priority slot in the Welcome Kit',
    detail: 'Your item is placed at the front of the New Member Welcome Kit rather than in the general contents, so it is the first thing a new member sees when they open it.',
  },

  'priorities-roundtable': {
    name: 'Seat at the Chamber Priorities roundtable',
    detail: 'An annual working session with the chamber board to help shape what the chamber pushes for in the year ahead: which local issues get attention, what the advocacy agenda looks like, and where the chamber puts its effort. This is influence rather than recognition, and it is the substantive reason to be at this level.',
  },
  'champion-plaque': {
    name: 'Community Champion plaque',
    detail: 'A distinct plaque marking Champion status, which is limited to three businesses at any time.',
  },
  'signature-event-naming': {
    name: 'Naming sponsorship of a signature event',
    detail: 'Premier or naming sponsorship of one major annual chamber event. Your business is attached to that event in every announcement, every piece of signage and every mention of it through the year.',
  },
  'annual-publication-profile': {
    name: 'Feature profile in an annual chamber publication',
    detail: 'A written profile of your business, not an advertisement. Your story, your people and what you do, distributed to the membership and the community.',
  },
  'priority-scheduling': {
    name: 'Priority scheduling',
    detail: 'First choice of dates for ribbon cuttings, hosted events and chamber appearances. Matters most around a grand opening or a seasonal launch, where the date is not flexible for you.',
  },

  'networking-access': {
    name: 'Networking event access',
    detail: 'Attend chamber networking events and meet the people running businesses here. Open to individual members, not only businesses.',
  },
  'education-programs': {
    name: 'Educational programs and workshops',
    detail: 'Chamber-run sessions on business and professional topics, open to individual members.',
  },
  'volunteer-committee': {
    name: 'Volunteer and committee opportunities',
    detail: 'Serve on a chamber committee or volunteer at chamber events. The most direct route into the local business community for someone without a business of their own, and how a lot of people end up on the board.',
  },
  'chamber-news': {
    name: 'Chamber news and updates',
    detail: 'The chamber newsletter and member communications, so you know what is happening locally before it happens.',
  },
  'new-member-recognition': {
    name: 'New member social recognition',
    detail: 'A welcome post across the chamber social accounts when you join, introducing you to the membership and the community.',
  },
};

/* ==========================================================================
   TIERS

   "inherits" prints the "Everything in X, plus" line and should match the
   id of the tier below it in value.

   A benefit is listed either as a plain id string, or as
   { id: 'benefit-id', label: 'Overridden name' } when the amount differs
   by tier. The description stays shared either way.
   ========================================================================== */

const TIERS = [
  {
    id: 'individual',
    name: 'Individual Membership',
    price: '$100 to $125',
    forWhom: 'For a person rather than a business. Residents, retirees, job seekers and people who want to be part of the local business community without owning a business.',
    benefits: [
      'networking-access',
      'education-programs',
      'volunteer-committee',
      'chamber-news',
      'new-member-recognition',
      'policy-center',
    ],
  },
  {
    id: 'basic',
    name: 'Basic Business',
    price: '$200 to $600',

    /* Where a tier is priced by size, list the bands here instead of
       burying them in a sentence. They render as a rate table, because
       "what do I actually pay" is the first question anyone has. */
    priceBands: [
      { label: 'Under 5 employees', price: '$200' },
      { label: '5 to 15 employees', price: '$400' },
      { label: '16 or more employees', price: '$600' },
      { label: 'Nonprofit, any size', price: '$150' },
    ],
    forWhom: 'The working level of chamber membership. Everything a local business needs to be found, referred and connected.',
    benefits: [
      'directory-listing',
      'window-cling',
      'referral-exclusivity',
      'referral-credit',
      'policy-center',
      'gdmp-reciprocal',
      'ribbon-cutting',
      'events-calendar',
      'luncheon',
      'coffee-connections',
      'notary',
    ],
  },
  {
    id: 'partner',
    name: 'Community Partner',
    price: '$750',
    inherits: 'Basic Business',
    forWhom: 'For businesses that want visibility and a seat at the table, not just a listing.',
    benefits: [
      'logo-get-involved',
      { id: 'luncheon-tickets', label: '3 luncheon tickets' },
      'legislator-coffee',
      'host-networking',
      'welcome-kit-contribute',
    ],
  },
  {
    id: 'investor',
    name: 'Community Investor',
    price: '$1,750',
    inherits: 'Community Partner',
    forWhom: 'For businesses using the chamber as a marketing channel, with recurring exposure to the full membership.',
    benefits: [
      'email-sig-logo',
      'golf-hole',
      { id: 'sponsorship-credit', label: '$250 sponsorship credit' },
      { id: 'luncheon-tickets', label: '6 luncheon tickets total, not 6 more' },
      { id: 'social-spotlight', label: '2 social media spotlights a year' },
      'eblast',
      'bank-rate',
    ],
  },
  {
    id: 'sponsor',
    name: 'Community Sponsor',
    price: '$3,500',
    inherits: 'Community Investor',
    forWhom: 'For businesses making a substantial investment in the chamber, and who want to see what it returned.',
    benefits: [
      'golf-foursome',
      { id: 'sponsorship-credit', label: '$500 sponsorship credit' },
      { id: 'social-spotlight', label: 'Quarterly social media spotlights' },
      'member-plaque',
      'digital-badge',
      'event-signage-logo',
      { id: 'impact-report', label: 'Quarterly impact report' },
      'welcome-kit-priority',
    ],
  },
  {
    id: 'champion',
    name: 'Community Champion',
    price: '$6,000',
    limited: 'Invitation only, capped at 3 members',
    inherits: 'Community Sponsor',
    forWhom: 'The top level, deliberately scarce. Influence over chamber priorities and access to the people making local decisions.',
    benefits: [
      'priorities-roundtable',
      'signature-event-naming',
      'annual-publication-profile',
      'champion-plaque',
      'priority-scheduling',
      { id: 'golf-foursome', label: 'Two golf foursomes' },
      { id: 'sponsorship-credit', label: '$1,000 sponsorship credit' },
      { id: 'luncheon-tickets', label: '12 luncheon tickets total' },
      { id: 'social-spotlight', label: 'Monthly social media spotlight rotation' },
      { id: 'impact-report', label: 'In-person annual impact report presentation' },
    ],
  },
];
