/* ==========================================================================
   POLK CITY AREA CHAMBER OF COMMERCE
   BUSINESS POLICY CENTER, CONTENT FILE

   This is the only file you need to edit to update the site.
   You do not need to touch index.html, styles.css, or app.js.

   HOW TO UPDATE
   1. Change reviewedOn below to today's date.
   2. Add, edit, or delete entries in the ENTRIES list.
   3. Save. If you are using GitHub, commit the change.
      The site rebuilds itself within about a minute.

   WRITING RULES FOR THIS PAGE
   - Write for a busy shop owner, not a lawyer.
   - Short sentences. One idea each.
   - If you have to use a technical word, add it to the GLOSSARY below.
   - No dashes in the middle of sentences. Use a period and start again.

   RULES THAT WILL SAVE YOU A HEADACHE
   - Every entry needs a unique "id". Use lowercase words with dashes.
     The id becomes the entry's web address, so it is how you link
     straight to one item from Facebook or an email.
   - Once an entry is published, do not change its id. That would break
     any link already shared.
   - Keep quotes balanced. If the page goes blank after an edit, you have
     almost certainly got a stray quote or a missing comma.
   ========================================================================== */

const SITE = {
  title: 'Business Policy Center',
  org: 'Polk City Area Chamber of Commerce',
  intro:
    'New laws, the November ballot, and local decisions that affect businesses here. Each one is explained in plain language, with links so you can check it yourself.',
  reviewedOn: 'October 12, 2026',
  reviewedOnISO: '2026-10-12',

  /* Set this to whatever reviewedOnISO used to be, each time you review.
     Anything added or updated after this date gets a "New" or "Updated"
     badge and shows in the What's new list on the home page.
     Leave it empty on the very first launch, when everything is new. */
  previousReviewISO: '2026-09-01',

  /* The same date written the way a person reads it. Shows up as
     "What changed since August 1, 2026" on the home page. */
  previousReviewLabel: 'September 1, 2026',

  cadence: 'Reviewed monthly',
  contactEmail: 'admin@polkcitychamber.com',
  chamberUrl: '/',
};

/* Topic filters. Keep this list short. Four or five is the limit before
   people stop reading them. Each "id" must match the topics used in entries. */
const TOPICS = [
  { id: 'money', label: 'Money and grants' },
  { id: 'tax', label: 'Taxes and property' },
  { id: 'workforce', label: 'Hiring and staff' },
  { id: 'development', label: 'Growth and building' },
  { id: 'elections', label: 'Elections' },
];

/* The lookup tools at the top of the page. */
const TOOLS = [
  {
    title: 'Who represents me?',
    blurb: 'Type in your address. It shows your state senator and state representative, with phone and email.',
    url: 'https://www.legis.iowa.gov/legislators/find',
  },
  {
    title: 'Email any lawmaker',
    blurb: 'The full contact list for the Iowa Legislature.',
    url: 'https://www.legis.iowa.gov/legislators/informationOnLegislators/allLegislators',
  },
  {
    title: 'Register to vote',
    blurb: 'Register online with an Iowa license or ID. You can also check that you are still registered.',
    url: 'https://www.polkcountyiowa.gov/county-auditor/election/registerupdate-registration/',
  },
  {
    title: 'Where do I vote?',
    blurb: 'The official polling place lookup. Polls are open 7 a.m. to 8 p.m.',
    url: 'https://sos.iowa.gov/voters/find-my-precinctpolling-place',
  },
  {
    title: 'What district am I in?',
    blurb: 'Maps showing which voting districts cover your address.',
    url: 'https://www.polkcountyiowa.gov/county-auditor/election/election-maps/',
  },
  {
    title: 'Polk County elections office',
    blurb: 'Election dates, absentee ballots, who is running, and official results.',
    url: 'https://www.polkcountyiowa.gov/county-auditor/election/',
  },
  {
    title: 'Every new Iowa law',
    blurb: 'The official state list of bills that passed, with the dates they take effect.',
    url: 'https://www.legis.iowa.gov/law/statutory/acts/enrolledBills',
  },
  {
    title: 'Chamber business resources',
    blurb: 'Our list of places that help with funding, licensing, and business advice.',
    url: '/resources/',
  },
];

/* The three groups entries fall into. */
/* The four sections of the site. Each becomes its own page.
   "nav" is the short label in the top menu.
   "season" ties the section to a color from the chamber logo.
   "blurb" is what shows on the home page card. */
const GROUPS = [
  {
    id: 'grants',
    nav: 'Grants',
    season: 'sun',
    title: 'Money you can go after',
    blurb: 'Grants, loans, and free help a Polk City area business can actually apply for, with straight talk about who qualifies.',
    lede: 'Each entry says who qualifies, because most of these are not open to everybody. Deadlines move, so always check the source link before you plan around a date.',
  },
  {
    id: 'ballot',
    nav: 'Ballot',
    season: 'winter',
    badge: 'November 3',

    /* This whole section goes out of date the day after the election.
       After this date the site shows a warning on the section and on the
       home page card, so nobody reads stale race information as current.
       When you rewrite the section for results, clear both of these. */
    expires: '2026-11-03',
    expiredNote: 'The election has happened. The races described below are finished and the information here is out of date. We are rewriting this section with the results and what they mean for local business.',

    title: 'On the ballot November 3',
    blurb: 'Federal, state, county, and township offices are all on this ballot, plus a statewide question about taxes.',
    lede: 'This is a big ballot. The chamber does not tell you who to vote for. These entries explain what each choice decides, and give the argument on both sides.',
  },
  {
    id: 'tax',
    nav: 'Taxes',
    season: 'navy',
    title: 'Taxes',
    blurb: 'What changed in federal and Iowa tax rules, what it means for equipment and deductions, and where to get real answers.',
    lede: 'The chamber does not give tax advice and nothing here is tax advice. What this section does is tell you what changed and what to ask your accountant about, so you go into that conversation knowing which questions to raise.',
  },
  {
    id: 'law',
    nav: 'New laws',
    season: 'spring',
    title: 'New laws',
    blurb: 'What changed at the Statehouse this year, and what it does to your taxes, your hiring, and your paperwork.',
    lede: 'The Iowa Legislature finished its work for the year on May 3. These are now law, or will be soon.',
  },
  {
    id: 'local',
    nav: 'Polk City',
    season: 'autumn',
    title: 'Happening in Polk City',
    blurb: 'City and county decisions that touch local businesses directly. This is the part that changes the most.',
    lede: 'Projects, funding, and priorities worth watching close to home.',
  },
];

/* Plain definitions for words that are hard to avoid.
   Add to this whenever you use a term a member might not know. */
const GLOSSARY = [
  {
    term: 'TIF',
    def: 'Tax increment financing. A city helps pay for a new development, then pays itself back out of the extra property tax the finished project generates. It is one of the main tools small cities use to get commercial projects built.',
  },
  {
    term: 'Rollback',
    def: 'The share of your property value that actually gets taxed. If your building is worth $200,000 and the rollback is 90%, you are taxed on $180,000.',
  },
  {
    term: 'Homestead exemption',
    def: 'A discount on property taxes for the home you live in. It does not apply to commercial property.',
  },
  {
    term: 'General fund',
    def: 'The main city checking account. It pays for police, streets, parks, and staff.',
    },
  {
    term: 'CDBG',
    def: 'Community Development Block Grant. Federal money passed down through the county for things like sidewalks, utilities, and accessibility work.',
  },
  {
    term: '28E agreement',
    def: 'A contract between two or more Iowa governments to share a service. Polk City uses one for regional water.',
  },
  {
    term: 'Toss-up',
    def: 'A rating used by election analysts. It means neither side is favored to win.',
  },
  {
    term: 'Match, or cost share',
    def: 'Money you have to put in yourself to unlock grant money. A 1 to 1 match means for every dollar the grant gives you, you spend a dollar of your own.',
  },
  {
    term: 'Reimbursement grant',
    def: 'You pay for the work first, then send receipts and get paid back. Important to know, because it means you need the cash up front.',
  },
  {
    term: 'Pass-through business',
    def: 'A sole proprietorship, LLC, partnership, or S corporation. The business itself does not pay income tax. The profit passes through to your personal return and you pay it there. Most Polk City businesses are pass-throughs.',
  },
  {
    term: 'Depreciation',
    def: 'Deducting the cost of something expensive a little at a time over several years, instead of all at once. Full expensing means you get to skip that and take it all in year one.',
  },
  {
    term: 'Placed in service',
    def: 'The date equipment is installed and ready to use, which is what tax deadlines run on. Not the date you ordered it or paid for it. A machine still in the crate on December 31 does not count for that year.',
  },
  {
    term: 'Open seat',
    def: 'A race with no incumbent, because the current officeholder retired or is running for something else. Open seats are usually closer, and the winner arrives with no fixed positions on local issues.',
  },
  {
    term: 'Retention election',
    def: 'A yes or no vote on whether a sitting judge keeps the job. There is no opponent. You are only voting to keep them or not.',
  },
];

/* ==========================================================================
   MEMBER REFERRALS

   Chamber members who do a particular kind of work, shown inside the entry
   where someone is most likely to need them. This is the referral benefit
   in practice: a member gets named at the exact moment a question comes up.

   THREE RULES. These are not suggestions.

   1. ALL OR NONE. If you list one accountant, you list every member who
      does that work. Picking favorites is how a chamber loses members.
      If you are not willing to list all of them, list none and point at
      the full directory instead.

   2. ALPHABETICAL, ALWAYS. The list renders in the order you type it, so
      type it alphabetically. Do not order by tier, by who asked, or by
      who you like. Someone will notice.

   3. UPDATE IT WHEN MEMBERSHIP CHANGES. A member who joins and does not
      get added has a real complaint. A member who lapses and stays listed
      is worse, because the chamber is now vouching for a non-member.

   Leave a list empty and nothing renders. That is the safe default, and
   it is where this ships until the board approves the names.
   ========================================================================== */

const MEMBER_REFERRALS = {
  /* No accountants or CPAs are chamber members as of the September 2026
     review. Every listing in the directory was checked. The three financial
     services members do wealth management and insurance, not tax
     preparation, so listing them here would send people to the wrong kind
     of professional.

     Leave this empty until an accounting firm joins. Then add them here and
     the block appears automatically. */
  accounting: {
    heading: 'Chamber members who do this work',
    members: [],
  },

  banking: {
    heading: 'Chamber member banks',
    members: [
      { name: 'Grinnell State Bank', url: 'https://www.grinnell.bank', phone: '515-984-6211' },
      { name: 'Home State Bank', url: 'https://www.hsbankiowa.com', phone: '515-329-8801' },
      { name: 'Luana Savings Bank', url: 'https://www.luanasavingsbank.com', phone: '515-984-7100' },
    ],
  },

  hr: {
    heading: 'Chamber members who do this work',
    members: [
      { name: 'HR Approach', phone: '515-208-0190' },
    ],
  },

  childcare: {
    heading: 'Chamber member child care providers',
    members: [
      { name: 'Yellow Brick Road Early Childhood Development Center', url: 'https://www.ybrecdc.org', phone: '515-984-6147' },
    ],
  },
};

/* ==========================================================================
   ENTRIES

   Template for a new entry. Copy this, fill it in, paste it into the list:

   {
     id: 'short-unique-name',
     group: 'law',                 // law, money, ballot, or local
     added: '2026-09-01',          // the date you added it. Drives the New badge.
     updated: '2026-10-01',        // optional. Only when you rewrite an existing item.
     archived: false,              // optional. See ARCHIVING below.
     referrals: 'accounting',      // optional. Shows the member list of that name.
     topics: ['tax'],              // one or more topic ids
     title: 'Headline in plain words',
     meta: 'Bill number, date, status',
     plain: 'One sentence a member can understand without opening the entry.',
     body: `<p>What happened.</p>`,
     matters: {
       heading: 'What this means for you',
       html: `<p>Why a local business owner should care.</p>`,
     },
     sources: [
       { label: 'What the link says', publisher: 'Who published it', url: 'https://...' },
     ],
   },

   ARCHIVING, AND WHY YOU SHOULD NEVER DELETE AN ENTRY

   Once you have shared a link to an entry on Facebook or in an email, that
   link needs to keep working forever. Deleting the entry breaks it, exactly
   the same way renaming the id would.

   So when something is no longer current, do not delete it. Add:

       archived: true,

   The entry then disappears from its section, from the counts, and from
   search, but the link still works. Anyone who follows an old link sees the
   item with a clear notice that it is no longer current. Archived items are
   also listed together on the Words and Sources page.
   ========================================================================== */

const ENTRIES = [
  {
    id: 'tax-federal-changes',
    group: 'tax',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax', 'money'],
    title: 'Federal tax rules changed a lot, mostly in small business favor',
    meta: 'One Big Beautiful Bill Act, signed July 4, 2025',
    plain: 'The biggest change: if you buy equipment, you can usually deduct the whole cost the year you buy it instead of spreading it over years. Several other business breaks were made permanent.',
    body: `
      <p>A federal tax law signed in July 2025 rewrote several rules that matter to small businesses. Most took effect for the 2025 tax year, with more kicking in for 2026. The short version of what changed:</p>
      <ul>
        <li><strong>Full expensing of equipment came back.</strong> You can deduct 100% of the cost of qualifying equipment in the year you put it into service, rather than a little each year. This was in the middle of being phased out. It was restored permanently for property bought after January 19, 2025.</li>
        <li><strong>The Section 179 limits went way up.</strong> This is the other way to write off equipment immediately. The ceiling is far above anything a typical Polk City business would hit, which effectively means the limit is no longer the constraint.</li>
        <li><strong>The pass-through deduction was made permanent.</strong> If you file as a sole proprietor, LLC, partnership, or S corp, this is the deduction on your business income that was set to expire at the end of 2025. It did not expire. Starting in 2026, there is also a new minimum deduction of $400 if you have at least $1,000 of qualified business income from a business you actively work in.</li>
        <li><strong>Research costs done in the U.S. are deductible again in the year you spend them</strong>, rather than spread over five years. Research done outside the U.S. is still spread over 15 years. Relevant if you develop products or software.</li>
        <li><strong>Meals you provide to employees for your own convenience are no longer deductible</strong> starting in 2026. They used to be half deductible. This is one of the few changes that goes the wrong way.</li>
      </ul>`,
    matters: {
      heading: 'What to actually do with this',
      html: `
        <p>Do not try to apply any of this yourself from a web page. Take this list to your accountant and ask which ones apply to your entity type and your numbers. That conversation is worth having before December, not in March.</p>
        <p>One honest warning about researching this online. While putting this page together we found accounting firm blog posts giving flatly contradictory figures for the same year, including wrong deduction percentages and outdated limits. Some appear to be describing the old law. If a number matters to your decision, get it from the IRS or from your own CPA, not from a search result.</p>`,
    },
    sources: [
      { label: 'Small business and self-employed tax center', publisher: 'IRS', url: 'https://www.irs.gov/businesses/small-businesses-self-employed' },
      { label: 'How to depreciate property, Publication 946', publisher: 'IRS', url: 'https://www.irs.gov/publications/p946' },
      { label: 'Free counseling on business finances', publisher: "America's SBDC Iowa", url: 'https://iowasbdc.org/' },
    ],
  },

  {
    id: 'tax-equipment-vehicles',
    group: 'tax',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax', 'money', 'development'],
    title: 'Buying equipment or a work vehicle? Timing matters right now.',
    meta: 'Section 179 and bonus depreciation',
    plain: 'Full first-year write-off is now permanent for most equipment bought after January 19, 2025. If a purchase is coming anyway, the year you make it can still change which tax bill it lowers.',
    body: `
      <p>There are two ways to deduct the cost of equipment up front, and they work together. Your accountant will pick the combination. What you need to know as an owner:</p>
      <ul>
        <li><strong>100% is now permanent.</strong> The 2025 law made full first-year write-off permanent for qualifying property bought after January 19, 2025. There is no phase-down scheduled. Timing still matters because it decides which tax year gets the deduction.</li>
        <li><strong>"Placed in service" is the deadline, not "ordered."</strong> Equipment sitting in a crate on December 31 does not count. It has to be installed and ready to use.</li>
        <li><strong>Vehicles are their own mess.</strong> SUVs in the common weight range are capped at a much lower amount than other equipment. Pickups with a long cargo bed and cargo vans without rear seating generally are not. The weight rating on the sticker inside your driver's door is what decides it.</li>
        <li><strong>You need more than half business use</strong> for the vehicle to qualify at all, and your deduction is reduced to the business percentage.</li>
        <li><strong>Section 179 cannot create a loss.</strong> It is capped at your business income. Anything unused carries forward.</li>
      </ul>`,
    matters: {
      heading: 'The practical version',
      html: `
        <p>If you were already planning to replace a truck, a mower, a walk-in cooler, a point of sale system, or shop equipment, ask your accountant whether doing it this year rather than next is worth real money. Sometimes it is a lot. Sometimes it is nothing, because you cannot use the deduction anyway.</p>
        <p>What you should not do is buy something you did not need in order to get a deduction. A write-off gives you back a fraction of what you spent. Spending $40,000 to save $9,000 is still spending $31,000.</p>`,
    },
    sources: [
      { label: 'About Form 4562, the form this gets claimed on', publisher: 'IRS', url: 'https://www.irs.gov/forms-pubs/about-form-4562' },
      { label: 'How to depreciate property, Publication 946', publisher: 'IRS', url: 'https://www.irs.gov/publications/p946' },
    ],
  },

  {
    id: 'tax-deductions-basics',
    group: 'tax',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax'],
    title: 'What actually counts as a business deduction',
    meta: 'The rule, and the three things people get wrong',
    plain: 'An expense has to be ordinary and necessary for your trade. Meals are half deductible, entertainment is not deductible at all, and missing paperwork is the top reason deductions get thrown out.',
    body: `
      <p>The underlying test has not changed. To be deductible, an expense must be <strong>ordinary</strong>, meaning common and accepted in your line of work, and <strong>necessary</strong>, meaning helpful and appropriate. A caterer buying a commercial mixer passes. The same caterer buying a boat for "client entertainment" does not.</p>
      <p>Three things people consistently get wrong:</p>
      <ul>
        <li><strong>Meals versus entertainment.</strong> A meal with a client is generally half deductible. Tickets to a game or a round of golf are not deductible at all, and have not been for years. If the meal happens at the entertainment event, keep it on a separate receipt.</li>
        <li><strong>Meals for your own staff.</strong> Food you provide to employees for your convenience lost its deduction starting in 2026. If you have been feeding a crew and deducting half of it, that changed.</li>
        <li><strong>Records written after the fact.</strong> The single most common reason a deduction gets disallowed is documentation created later. Mileage logs, receipts, and a note of the business purpose need to be kept as you go. A reconstructed log is weak evidence.</li>
      </ul>`,
    matters: {
      heading: 'Why this is on a chamber website',
      html: `
        <p>Not because we can tell you what to deduct. Because these three mistakes are common, cost real money, and are entirely avoidable with a habit rather than an expert.</p>
        <p>If you take one thing from this entry: set up a way to capture receipts and mileage the day they happen. A shoebox works. A phone app works. Doing it in March does not.</p>`,
    },
    sources: [
      { label: 'Deducting business expenses', publisher: 'IRS', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/deducting-business-expenses' },
      { label: 'Guide to business expense resources', publisher: 'IRS', url: 'https://www.irs.gov/forms-pubs/guide-to-business-expense-resources' },
    ],
  },

  {
    id: 'tax-iowa',
    group: 'tax',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax'],
    title: 'Iowa taxes: income, sales, and what is on the ballot',
    meta: 'State level',
    plain: 'Iowa income tax is a flat 3.8%. The window to protest your property assessment is April 2 to April 30. There is also a tax question on the November ballot.',
    body: `
      <p><strong>Income tax.</strong> Iowa moved to a flat individual rate of 3.8%. For pass-through owners, your business income flows onto your personal return, so this rate is the one that hits you.</p>
      <p><strong>Sales tax and withholding.</strong> Registration, filing schedules, and permits all run through the Iowa Department of Revenue. Filing frequency depends on your volume and can change, so check your notices rather than assuming last year's schedule still applies.</p>
      <p><strong>Property tax.</strong> The 2026 overhaul is covered in the New Laws section. If you own a commercial building or apartments, read that one too.</p>
      <p><strong>On the November ballot.</strong> A constitutional amendment would require a two thirds vote of the Legislature to raise income tax rates, instead of a simple majority. See the Ballot section for the arguments on both sides.</p>`,
    matters: {
      heading: 'Put these four dates in your calendar right now',
      html: `
        <p>The window to challenge your property assessment is the single most overlooked thing on this page. It is the one moment a business owner can directly push back on a tax bill, it comes once a year, and most people find out about it in June.</p>
        <ul>
          <li><strong>January 1.</strong> The assessment date. Whatever your property was worth that day is what the assessor is valuing, so that is the date your evidence has to speak to.</li>
          <li><strong>By April 1.</strong> Assessment notices go out, but only if your value changed. No notice does not mean no assessment.</li>
          <li><strong>April 2 to April 25.</strong> Informal review with the assessor. This is the easy path. You call, they often walk the property, and if they agree you are done. Free, and no formal filing. Go early. Late requests can get denied simply for lack of time to review them.</li>
          <li><strong>April 2 to April 30.</strong> Formal written protest to the Board of Review. This is the hard deadline. It only gets extended in counties under a disaster declaration, which happened in 17 Iowa counties in 2026, not Polk. If April 30 falls on a weekend, you get the next business day.</li>
        </ul>
        <p>One thing that trips people up: you must file with the Board of Review during that window to preserve any later appeal. If you skip it, you cannot go to the state appeal board or district court afterward.</p>
        <p>The test the assessor applies is simple. Could you sell the property for that number today? If yes, the value is probably right. If clearly not, you have a case, and comparable sales are the evidence that wins it.</p>`,
    },
    sources: [
      { label: 'How to appeal your assessment, with forms and deadlines', publisher: 'Polk County Assessor', url: 'https://www.polkcountyiowa.gov/county-assessor/appealing-your-assessment/' },
      { label: 'Business taxes, registration and filing', publisher: 'Iowa Department of Revenue', url: 'https://revenue.iowa.gov/taxes/file-my-taxes/business-taxes' },
      { label: 'What happens if you appeal past the Board of Review', publisher: 'Iowa Property Assessment Appeal Board', url: 'https://paab.iowa.gov/how-do-i-protest-local-board-review' },
    ],
  },

  {
    id: 'tax-where-to-get-help',
    group: 'tax',
    added: '2026-09-01',
    updated: '2026-10-12',
    referrals: 'accounting',
    topics: ['tax', 'money'],
    title: 'Where to get real answers, including free ones',
    meta: 'The chamber does not give tax advice',
    plain: 'Some of this help costs nothing. If you do not have an accountant, the SBDC and The Iowa Center will talk through your situation for free.',
    body: `
      <p>To be direct about it: the chamber cannot tell you what to deduct or how to file. The rules turn on your entity type, your income, and details of your situation that we do not know. Getting that wrong hurts you and it would hurt the chamber's credibility.</p>
      <p>What we can do is point you at people who can.</p>
      <ul>
        <li><strong>A CPA or enrolled agent.</strong> No accounting firm is currently a chamber member, so we cannot point you at one of our own. Ask other members who they use. That word of mouth is worth more than a directory listing anyway.</li>
        <li><strong>America's SBDC Iowa.</strong> Free one on one counseling, including financial and recordkeeping questions. They will not file your return, but they will help you understand your books.</li>
        <li><strong>The Iowa Center.</strong> Coaching and lending for owners who have trouble with conventional bank financing.</li>
        <li><strong>SCORE.</strong> Free mentoring from working and retired executives.</li>
        <li><strong>The IRS Small Business Tax Center.</strong> Free, authoritative, and better organized than people expect. When a website and the IRS disagree, the IRS is right.</li>
      </ul>`,
    matters: {
      heading: 'A word on tax scams',
      html: `
        <p>If someone contacts you promising a large refund or credit you have never heard of, treat it as a scam until proven otherwise. Employee retention credit fraud hit a lot of small businesses, and the ones who filed bad claims are the ones who had to pay it back with penalties.</p>
        <p>The IRS does not open contact by phone, text, or email demanding payment. If you get that call, hang up.</p>`,
    },
    sources: [
      { label: 'Small business and self-employed tax center', publisher: 'IRS', url: 'https://www.irs.gov/businesses/small-businesses-self-employed' },
      { label: 'Free business counseling', publisher: "America's SBDC Iowa", url: 'https://iowasbdc.org/' },
      { label: 'Coaching and small business loans', publisher: 'The Iowa Center', url: 'https://theiowacenter.org/' },
      { label: 'Recognize tax scams and fraud', publisher: 'IRS', url: 'https://www.irs.gov/newsroom/tax-scamsconsumer-alerts' },
    ],
  },

  {
    id: 'property-tax-sf2472',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax', 'development'],
    title: 'Property taxes are going down. City budgets are getting capped.',
    meta: 'Senate File 2472, signed May 18, 2026, now law',
    plain: 'Your property tax bill should ease. But the city now has a strict limit on how fast its income can grow, and fewer tools to attract new businesses.',
    body: `
      <p>The state expects this law to cut property taxes by about $4.2 billion over six years. Here is what it actually does.</p>
      <ul>
        <li>Cities and counties can only grow property tax collections on existing property by 2% a year, starting with budgets for July 2027. Taxes on new construction are added on top and do not count against the cap. A few things are exempt, including school funding and some special levies. County hospitals get 4%. The bus system and emergency management get 3%.</li>
        <li>Starting July 2027, cities and counties cannot keep more than 35% of their yearly spending in savings. Highly rated borrowers are exempt.</li>
        <li>Homeowners get a new discount of 10% off their taxable value, up to $20,000. This does not apply to commercial property.</li>
        <li>Apartment buildings become their own tax category with the January 2027 assessment. Their taxable value will be set 3 points higher than houses in 2027 and 6 points higher after that.</li>
        <li>New TIF districts are capped at 23 years. Existing TIF districts with no end date can keep only 60% of the money after 20 years, and cannot take on new debt while over that limit.</li>
        <li>The Business Property Tax Credit stays at $150,000. But the $125 million the state used to send cities to make up the difference now goes into a state fund instead.</li>
      </ul>`,
    matters: {
      heading: 'What this means in Polk City',
      html: `
        <p>About 90% of our property tax base is houses. Only about 10% is businesses. The city council has said its number one goal is bringing in more commercial development, so homeowners are not carrying so much of the load.</p>
        <p>Now here is the tension. The 2% cap applies to taxes on existing property. Taxes on new houses and buildings are added on top, so growth still brings in money. But every existing home's share is capped, while costs for streets, water, and police keep rising. If those costs rise faster than 2%, something has to give. Usually that shows up as slower projects, thinner services, or new fees.</p>
        <p>The TIF change matters even more. TIF is how a small city makes the numbers work on a commercial project. Capping new districts at 23 years makes some of those deals harder to close. That is a direct hit to the exact goal the city is chasing.</p>
        <p>If you own an apartment building or a mixed use building, your taxes start going up with the 2027 assessment, which hits bills due in fall 2028. Worth mentioning to your accountant before you set next year's budget.</p>`,
    },
    sources: [
      { label: 'A clear breakdown of what the law changes', publisher: 'Iowa Capital Dispatch', url: 'https://iowacapitaldispatch.com/2026/05/18/gov-kim-reynolds-signs-property-tax-law-projected-to-save-4-2-billion-over-6-years/' },
      { label: 'Session recap written for small business owners', publisher: 'NFIB Iowa', url: 'https://www.nfib.com/news/news/the-iowa-legislative-session-recap/' },
      { label: "The governor's statement when she signed it", publisher: 'Office of the Governor', url: 'https://governor.iowa.gov/press-release/2026-05-19/gov-reynolds-signs-property-tax-relief-bill-other-bills-law' },
      { label: 'News coverage of the signing and the debate', publisher: 'The Gazette', url: 'https://www.thegazette.com/news/state/gov-kim-reynolds-signs-iowa-property-tax-reform-bill-into-law/article_4a1970f1-0cfa-497c-8f96-b557eae835c7.html' },
    ],
  },

  {
    id: 'business-court-sf639',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'Iowa now has a court just for big business lawsuits',
    meta: 'Senate File 639, in effect since September 1, 2026',
    plain: 'Two judges now handle large business disputes. It only applies to cases seeking $200,000 or more, or cases mainly asking a judge to order someone to do or stop doing something. Most small businesses will never see it.',
    body: `
      <p>Two judges, Jeffrey Bert and David Nelmark, are set aside to handle complicated business lawsuits. The court opened September 1, 2026. To qualify, a case has to seek at least $200,000 in damages, or mainly ask the court for an order instead of money.</p>
      <p>The kinds of cases it covers include contract fights, fraud, technology and patent licensing, trade secrets, non-compete agreements, commercial real estate disputes, and shareholder cases.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>For most Main Street businesses, nothing changes. The dollar threshold is too high. It matters if you are signing a large contract, a franchise deal, or a big commercial lease. Knowing a dispute would get resolved faster changes whether a fight is worth having. Most relevant to construction, development, and larger manufacturers.</p>`,
    },
    sources: [
      { label: 'The law as passed', publisher: 'Iowa Legislature', url: 'https://www.legis.iowa.gov/docs/publications/LGE/91/SF639.pdf' },
      { label: 'The two judges appointed to the business court', publisher: 'Iowa Judicial Branch', url: 'https://www.iowacourts.gov/announcements/chief-justice-christensen-appoints-judge-jeffrey-d-bert-and-judge-david-nelmark-to-serve-exclusivel' },
    ],
  },

  {
    id: 'faster-filings-sf629',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'You can now pay for rush service on state business filings',
    meta: 'Senate File 629, effective July 1, 2026',
    plain: 'If you need an LLC or other business filing done fast, you can now pay extra for rush service, as quick as one hour.',
    body: `<p>The Secretary of State now offers paid rush service on business filings: one hour ($200), same day ($125), two days ($50), or five days ($15), on top of the regular fee. You also get written confirmation when it is filed. Regular processing did not change.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>Small, but useful. If you are starting an LLC, closing a sale, or up against a bank deadline, you can now buy your way to a faster filing instead of waiting in line.</p>`,
    },
    sources: [
      { label: 'New laws taking effect this summer and fall', publisher: 'NFIB Iowa', url: 'https://www.nfib.com/news/news/a-strong-season-for-iowa-small-business/' },
      { label: 'File with the Iowa Secretary of State', publisher: 'sos.iowa.gov', url: 'https://sos.iowa.gov/business-services' },
    ],
  },

  {
    id: 'child-care-hf2514',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    referrals: 'childcare',
    topics: ['workforce'],
    title: 'Child care workers can now get child care help, permanently',
    meta: 'House File 2514, effective July 1, 2026',
    plain: 'A program that helps daycare staff afford their own child care is now permanent. That should mean more open daycare spots locally, which makes it easier for you to hire.',
    body: `<p>Since 2023 this had been a temporary pilot program. It is now permanent. People who work in child care can get state child care assistance no matter what they earn, as long as they work at least 32 hours a week in child care.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>Think of this as a hiring issue, not a social program. Daycares here are short staffed, which means fewer open spots, which means parents cannot take shifts. Helping daycares keep employees opens up spots for everyone else's workers. If you run a daycare or are thinking about opening one, this changes your staffing math directly.</p>`,
    },
    sources: [
      { label: 'What passed and what failed this session', publisher: 'Iowa Capital Dispatch', url: 'https://iowacapitaldispatch.com/2026/05/04/the-2026-legislative-session-is-over-heres-what-passed-failed-and-what-is-already-iowa-law/' },
    ],
  },

  {
    id: 'startup-investment-sf2453',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'State universities have to invest in startups built on their research',
    meta: 'Senate File 2453, must comply by July 1, 2027',
    plain: 'Roughly $39 million or more is headed to funds that back startups coming out of Iowa, Iowa State, and UNI research. Most local businesses will not be eligible.',
    body: `<p>Iowa, Iowa State, and UNI each have to put at least 1% of their foundation endowments into state-certified innovation funds that back companies built on university research. That works out to roughly $39 million or more. The law takes effect December 31, 2026, and the money has to be in place by July 1, 2027. A foundation can get a one-year waiver if there are not enough good funds or the market is bad.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>For most members, nothing. This money is for companies spun out of university research. If you are building something on technology licensed from one of the three universities, talk to that school's research office about which funds qualify.</p>`,
    },
    sources: [
      { label: 'The law as passed', publisher: 'Iowa Legislature', url: 'https://www.legis.iowa.gov/docs/publications/LGE/91/SF2453.pdf' },
      { label: 'State help for small businesses and startups', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/small-business-entrepreneurs/small-business-resources' },
    ],
  },

  {
    id: 'cdl-english-sf2426',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['workforce'],
    title: 'New English test for commercial drivers',
    meta: 'Senate File 2426, testing starts by March 1, 2027',
    plain: 'By March 1, 2027, anyone getting or renewing a CDL will have to pass an English test. Employers can already be fined $10,000 per driver who does not meet the federal English standard.',
    body: `<p>Starting by March 1, 2027, or sooner if the DOT finishes its new records system, anyone applying for or renewing a CDL or learner's permit will have to pass a computer-based English test.</p>
      <p>Drivers already have to meet the federal English standard, and the penalties are in place now. A driver who does not meet it faces a serious misdemeanor and a $1,000 fine. A carrier faces a $10,000 fine per driver and can be ordered off the road in Iowa.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>If you hire drivers for trucking, delivery, construction, or farm work, the fine lands on you, not just the driver. Check your current drivers now, and build the test into hiring and renewal plans before March. Finding drivers was already hard.</p>`,
    },
    sources: [
      { label: 'The law as passed', publisher: 'Iowa Legislature', url: 'https://www.legis.iowa.gov/docs/publications/LGE/91/SF2426.pdf' },
      { label: 'Notable bills from this session', publisher: 'Iowa Capital Dispatch', url: 'https://iowacapitaldispatch.com/2026/05/04/the-2026-legislative-session-is-over-heres-what-passed-failed-and-what-is-already-iowa-law/' },
    ],
  },

  {
    id: 'bills-returning-2027',
    group: 'law',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax', 'workforce', 'development'],
    title: 'Three bills that failed and will probably be back',
    meta: 'Did not pass in 2026. Speak up before January.',
    plain: 'Right to repair, energy costs, and penny rounding all died this year. Lawmakers usually try again. Now is when your opinion counts.',
    body: `
      <ul>
        <li><strong>Right to repair.</strong> Would have required farm equipment makers to sell parts, tools, and software to independent repair shops and owners. Would affect equipment dealers, repair shops, and farms.</li>
        <li><strong>Energy costs.</strong> A package of changes to utility and energy rules for employers.</li>
        <li><strong>Penny rounding.</strong> Rounding cash transactions at the register.</li>
      </ul>`,
    matters: {
      heading: 'What this means for you',
      html: `
        <p>Bills that fail one year usually come back the next. If one of these would change how you operate, say so now. Once the session starts in January and a bill is moving, your legislator has usually already picked a side.</p>
        <p>Tell the chamber, and tell your legislator yourself. The lookup tools at the top of this page will find their contact information in about a minute.</p>`,
    },
    sources: [
      { label: 'Bills that did not make it', publisher: 'NFIB Iowa', url: 'https://www.nfib.com/news/news/the-iowa-legislative-session-recap/' },
      { label: 'Find and contact your legislators', publisher: 'Iowa Legislature', url: 'https://www.legis.iowa.gov/legislators/find' },
    ],
  },

  {
    id: 'grants-start-here',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    referrals: 'banking',
    topics: ['money'],
    title: 'Start here before you chase any grant',
    meta: 'Free help, no cost to you',
    plain: 'Iowa pays for free business counseling. Use it before you spend a weekend on an application you were never eligible for.',
    body: `
      <p>Grant applications take real time. The fastest way to waste a weekend is to write one you never qualified for. These services are free and they will tell you straight.</p>
      <ul>
        <li><strong>America's SBDC Iowa.</strong> Free one on one counseling. They help with business plans, financials, and figuring out which funding actually fits you.</li>
        <li><strong>The Iowa Center.</strong> Coaching plus small business lending for people who have trouble getting a conventional bank loan.</li>
        <li><strong>IASourceLink.</strong> A directory of Iowa business resources, searchable by what you need.</li>
        <li><strong>SCORE.</strong> Free mentoring from retired and working executives.</li>
      </ul>`,
    matters: {
      heading: 'Why this is the first entry, not the last',
      html: `
        <p>Most grants below have a catch. Some are only for nonprofits. Some require you to spend your own money first and get paid back. Some need a match. A counselor spots that in ten minutes.</p>
        <p>All of these are already listed on the chamber's Business Resources page. This entry just tells you which one to call first.</p>`,
    },
    sources: [
      { label: 'Find your local SBDC counselor', publisher: "America's SBDC Iowa", url: 'https://iowasbdc.org/' },
      { label: 'Coaching and small business loans', publisher: 'The Iowa Center', url: 'https://theiowacenter.org/' },
      { label: 'Search Iowa business resources', publisher: 'IASourceLink', url: 'https://www.iasourcelink.com/' },
      { label: 'The chamber resource list', publisher: 'Polk City Area Chamber', url: '/resources/' },
    ],
  },

  {
    id: 'grants-training-staff',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    referrals: 'hr',
    topics: ['money', 'workforce'],
    title: 'Money to train the people you already have',
    meta: 'Iowa Workforce Development and IEDA. Ongoing.',
    plain: 'Smaller manufacturers can get up to 80% of training costs back through a new program, if a new round opens. Other programs cover apprenticeships and training your existing staff. This is the most overlooked money on this page.',
    body: `
      <p><strong>AMP'D Iowa.</strong> Advanced Manufacturing Pathways Development is a new program funded by a $4.7 million federal grant. It opened June 29, 2026, and the first application deadline was July 24, 2026. The state does not show a new round yet, so call Iowa Workforce Development before you plan around it.</p>
      <p>Manufacturers with fewer than 250 full-time employees get <strong>80% of training costs</strong> back. Those with 250 to 499 get 65%, and 500 or more get 50%. The cap is $4,000 per employee and $250,000 per employer. The state pays in two parts: when training ends, and after the worker stays six months. It covers new hires and people already on your payroll. You need a manufacturing industry code (NAICS 31 to 33) and an Iowa location, the job has to be on the federal list of eligible occupations, and you cannot have had permanent layoffs in the last six months. Applications are on IowaGrants.gov.</p>
      <p>Several longer-running programs help with the same problem.</p>
      <ul>
        <li><strong>Iowa Jobs Training Program, known as 260F.</strong> Helps pay to train employees you already have. Now run by Iowa Workforce Development. It is for businesses that manufacture, process, assemble, or do research and development. Retail, health care, and professional services businesses cannot use it.</li>
        <li><strong>Registered Apprenticeship.</strong> Yearly grants for businesses that already sponsor a registered apprenticeship program, covering more than 1,000 occupations. Not just the building trades. The last window ran January 2 to February 2, 2026. Set up your program first, then apply in January.</li>
        <li><strong>Internship programs.</strong> The state's two internship grants, for innovative businesses and for STEM roles, are both closed for the year that runs July 2026 to June 2027 because the Legislature changed their funding. Check back next year.</li>
        <li><strong>Community College Consortium, part of the 260F program.</strong> For training projects where two or more businesses go in together. The same retail, health care, and professional services exclusion applies.</li>
        <li><strong>Child care grants for employers.</strong> Iowa Workforce Development has run Child Care Business Incentive Grants in past years to help employers expand child care for their workers. They are not open now, but watch for a new round given how tight local capacity is.</li>
      </ul>`,
    matters: {
      heading: 'Why this fits Polk City',
      html: `
        <p>Most Polk City businesses are too small to run a training budget. These programs are built for exactly that situation, and most apply to people already on your payroll, not just new hires. Be aware that most of them are aimed at manufacturing and similar work.</p>
        <p>If you are a smaller manufacturer, call about AMP'D first. An 80% reimbursement is a better deal than almost anything else on this page, so it is worth asking when the next round opens.</p>
        <p>The consortium option is worth a look for the chamber itself. If several members need similar training, going in together may unlock money none of you could get alone. Tell the chamber if that interests you.</p>`,
    },
    sources: [
      { label: "AMP'D Iowa rules and eligibility", publisher: 'Iowa Workforce Development', url: 'https://workforce.iowa.gov/opportunities/grants/ampd' },
      { label: 'All Iowa Workforce Development grants', publisher: 'Iowa Workforce Development', url: 'https://workforce.iowa.gov/opportunities/grants' },
      { label: 'Training and workforce funding programs', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/financial-assistance' },
    ],
  },

  {
    id: 'grants-targeted-small-business',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['money'],
    title: 'If you are a woman, minority, veteran with a service-connected disability, or a person with a disability',
    meta: 'Targeted Small Business certification, IEDA',
    plain: 'Free state certification that gets you early access to state contracts and the right to sell up to $25,000 to state agencies without competitive bidding.',
    body: `
      <p>Iowa's Targeted Small Business program certifies businesses that are at least 51% owned, operated, and actively managed by a woman, a person with minority status, a service-disabled veteran, or a person with a disability. If the business has a board, at least 51% of the board must also be from these groups.</p>
      <p><strong>To qualify you must:</strong></p>
      <ul>
        <li>Be located in Iowa</li>
        <li>Operate for profit</li>
        <li>Average less than $4 million in gross income over the last three years</li>
      </ul>
      <p><strong>What certification gets you:</strong></p>
      <ul>
        <li>Early notice of state bid opportunities, 48 hours before they go public</li>
        <li>Bond waivers of up to $50,000 on state construction projects</li>
        <li>The ability to sell up to $25,000 in goods or services to a state agency without competitive bidding</li>
        <li>A listing in the public directory that both government and private buyers use</li>
        <li>Introductions to free business help and state purchasing contacts</li>
      </ul>`,
    matters: {
      heading: 'Why this is worth an afternoon',
      html: `
        <p>The certification itself costs nothing. The $4 million ceiling means nearly every chamber member who fits the ownership criteria qualifies on size.</p>
        <p>The part people miss is the procurement side. State agencies have to report how much they buy from certified businesses. That is a real sales channel, not a token gesture, and most eligible owners never sign up for it.</p>
        <p><strong>Who this is not for.</strong> If you do not sell to the state, certification is paperwork with no payoff. A restaurant, a boutique or a lawn care business will get nothing out of it. A contractor, printer, IT firm or marketing agency will.</p>
        <p><strong>There is also a loan.</strong> IEDA offers Targeted Small Business loans of up to $50,000 to start or expand. They can pay for equipment, furnishings, inventory, and some operating costs, but not real estate. You do not have to be certified to apply, and loan recipients get free business counseling. Start with the pre-application form and email it to tsbloan@iowaeda.com.</p>`,
    },
    sources: [
      { label: 'Program details and how to qualify', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/small-business-entrepreneurs/small-business-resources/targeted-small-business-program' },
      { label: 'TSB loans and the pre-application form', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/small-business-entrepreneurs/small-business-resources/targeted-small-business-program/tsb-loans' },
      { label: 'Start a certification application', publisher: 'Iowa Economic Development Authority', url: 'https://iowaeda.microsoftcrmportals.com/tsb-application-start/' },
      { label: 'What certification gets you as a state vendor', publisher: 'Iowa Dept. of Administrative Services', url: 'https://das.iowa.gov/vendors/targeted-small-business-program' },
    ],
  },

  {
    id: 'grants-food-and-farm',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['money', 'development'],
    title: 'Food, farm, and anything you make from Iowa products',
    meta: 'Choose Iowa Value-Added Grants. Window opens Dec. 1, 2026, closes Jan. 15, 2027.',
    plain: 'Up to $25,000 for equipment, a commercial kitchen, or an on-farm store. You have to match it dollar for dollar, and small and medium businesses get preference.',
    body: `
      <p>The Iowa Department of Agriculture runs cost-share grants to help businesses sell more Iowa agricultural products, either by producing more or by reaching new markets.</p>
      <p><strong>What it covers:</strong> equipment used to produce value-added agricultural products, an on-farm store or commercial kitchen, and food hub development or expansion.</p>
      <p><strong>The rules:</strong> up to $25,000. You must match the grant one to one from private sources, in cash, financing or other grant funds. In-kind contributions do not count. You cannot start the project or buy anything until the grant agreement is signed, and it has to finish within 12 months. Preference goes to small and medium businesses, meaning up to 250 full-time employees. Applications are scored and you need at least 70 points to be considered.</p>
      <p><strong>The timing.</strong> The next window opens December 1, 2026 and closes at noon on January 15, 2027. Winners are expected in late March. That is a short window over the holidays, so decide in November, not December.</p>
      <p><strong>An important exception.</strong> Meat and dairy processing projects are <em>not</em> eligible for this grant. They have their own separate programs, the Butchery Innovation Grant and the Dairy Innovation Grant, on the same website.</p>`,
    matters: {
      heading: 'Who this actually fits here',
      html: `
        <p>Think bakeries, coffee roasters, breweries, caterers, farm stands, anyone doing a commercial kitchen buildout, and any operation turning Iowa grown product into something you sell. If you are a butcher or a dairy operation, go straight to the separate grant for your industry instead.</p>
        <p>Watch the match requirement. If the grant covers $25,000, you need $25,000 of your own money in the project. Plan the cash flow before you apply, not after.</p>`,
    },
    sources: [
      { label: 'Guidelines, scoring and eligible projects', publisher: 'Choose Iowa', url: 'https://www.chooseiowa.com/grants/valueadded' },
      { label: 'All Choose Iowa grants, including butchery and dairy', publisher: 'Choose Iowa', url: 'https://www.chooseiowa.com/grants' },
    ],
  },

  {
    id: 'grants-manufacturers-and-startups',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['money', 'development'],
    title: 'Manufacturers, inventors, and anyone selling overseas',
    meta: 'CIRAS, IEDA Innovation Continuum, and STEP',
    plain: 'Technology grants up to $75,000 for manufacturers, up to $75,000 for federal research applications, and help with the cost of finding customers in other countries. The manufacturing assessment window is open now.',
    body: `
      <p><strong>Manufacturing 4.0 Technology Investment Program.</strong> Grants of up to $75,000 over the life of the business, for smart manufacturing equipment and connected-technology hardware or software.</p>
      <p>The conditions are specific. You need a <strong>1 to 1 cash match</strong>, from a private source. In-kind does not count. You need a manufacturing industry code (NAICS 31 to 33), 3 to 124 full-time employees across all locations, at least 51% of revenue from selling manufactured goods, at least three years in operation, and good standing with the Iowa Department of Revenue. Failure on that last one is an automatic denial.</p>
      <p><strong>The timing trap on this one is brutal.</strong> A CIRAS assessment from Iowa State is required and must be submitted with the application. But the window to <em>request</em> the assessment closes months before applications open. <strong>For the next round, you can request a CIRAS assessment from September 8 through November 20, 2026.</strong> Applications open January 4, 2027 and close January 29, 2027 on IowaGrants.gov. If you wait until you see applications open, you have missed it.</p>
      <p><strong>America's Seed Fund support.</strong> If you are going after a federal SBIR or STTR research grant, Iowa will put in up to $75,000. That is $50,000 once you win a phase one award and another $25,000 when you submit a phase two proposal.</p>
      <p><strong>The Iowa Innovation Continuum.</strong> Five state-backed funds that invest in Iowa companies through loans or royalty agreements rather than plain grants. These are for technology and high growth businesses, not Main Street retail.</p>
      <p><strong>Export help.</strong> IEDA's export programs, partly paid for by the federal STEP grant, pay back 75% of some costs, up to $8,000. That covers trade shows abroad, U.S. trade shows with a lot of foreign buyers, and translating your website or marketing for another country. They are only for selling outside the United States, not to other states. Apply at least 45 days before the event.</p>`,
    matters: {
      heading: 'Be honest about whether this is you',
      html: `
        <p>Most of these are not for a retail shop or a service business. They are for manufacturers, product companies, and technology startups.</p>
        <p>The manufacturing grants are the most likely fit for a Polk City area member. If you make something in a building with equipment in it, the CIRAS assessment is worth the call regardless of whether you apply, and the request window closes November 20.</p>`,
    },
    sources: [
      { label: 'Manufacturing 4.0 rules, match and deadlines', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/financial-assistance/manufacturing-40-technology-investment' },
      { label: 'Grants and funding programs', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/financial-assistance/grants-funding' },
      { label: 'Export assistance programs', publisher: 'Opportunity Iowa', url: 'https://opportunityiowa.gov/business/international-trade/financial-services' },
      { label: 'Where these applications are filed', publisher: 'IowaGrants.gov', url: 'https://www.iowagrants.gov/' },
    ],
  },

  {
    id: 'grants-nonprofit-and-community',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['money', 'development'],
    title: 'Community project money, and the catch on it',
    meta: 'Prairie Meadows and Polk County. Applications open December, close late February.',
    plain: 'There is a lot of casino-funded grant money in Polk County, from $100 up to $1 million. Read this before you get excited: it is for nonprofits, not for-profit businesses.',
    body: `
      <p>Since 1989, Polk County and Prairie Meadows have put more than $1.8 billion back into the community through grant programs. There are two related tracks.</p>
      <p><strong>Prairie Meadows grants.</strong> Community Betterment Grants run from $100 to $99,999 for small and medium projects. Legacy Grants run from $100,000 to $1 million for large signature projects. Applications typically open in December and close at the end of February. Categories include arts and culture, economic development, education, and health and human services.</p>
      <p><strong>Polk County grants.</strong> Funded from the county's share of Prairie Meadows profits and awarded by the Board of Supervisors. Community Betterment Grants run $500 to $10,000, and you apply December 1 to February 28. Community Development Grants for larger projects run $15,000 to $100,000, and you apply July 1 to August 31.</p>
      <p><strong>The eligibility catch.</strong> Applicants must be nonprofits with IRS tax-exempt status, or a city, county, public school district, or church. A for-profit business cannot apply directly. Legacy Grant projects must be mainly in Polk or a nearby county. Organizations under religious management are not eligible for the county program under state law.</p>`,
    matters: {
      heading: 'How a business actually uses this',
      html: `
        <p>You cannot apply for your storefront. But the chamber is a nonprofit, and so are most of the community organizations you work with. Projects that improve the business district, fund a community event, or build shared infrastructure can go through one of those.</p>
        <p>One warning worth having. Demand for county betterment grants has tripled in recent years, and the county saw its highest volume of declined requests in at least fifteen years. Assume it is competitive and apply early.</p>
        <p>If you have a project idea that would help Polk City businesses generally, bring it to the chamber before the December window opens. Putting it together takes longer than people think.</p>`,
    },
    sources: [
      { label: 'Prairie Meadows grant programs and deadlines', publisher: 'Prairie Meadows', url: 'https://www.prairiemeadows.com/' },
      { label: 'Polk County community grants', publisher: 'Polk County', url: 'https://communitygrants.polkcountyiowa.gov/' },
      { label: 'Reporting on rising demand for county grants', publisher: 'Axios Des Moines', url: 'https://www.axios.com/local/des-moines/2025/06/24/polk-county-grant-rules-demand-triples' },
    ],
  },

  {
    id: 'grants-where-to-look',
    group: 'grants',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['money'],
    title: 'Where to look for everything else',
    meta: 'Two official listings, plus one common trap',
    plain: 'IowaGrants.gov lists every state grant. Grants.gov lists every federal one. And USDA rural programs usually will not work here, for a reason worth understanding.',
    body: `
      <p><strong>IowaGrants.gov</strong> is the state's official listing of open grant opportunities. Anyone can browse it. Search by agency or keyword.</p>
      <p><strong>Grants.gov</strong> is the federal equivalent.</p>
      <p><strong>The USDA rural trap.</strong> People see that Polk City has about 6,500 residents and assume USDA rural business programs apply. Two problems. First, some of those programs, like Rural Business Development Grants, only take applications from a city, county, tribe, or nonprofit, not from the business itself. Second, and more important, eligibility is not just about your town's population. Money has to go to areas outside the built-up edge of any city of 50,000 or more. Polk City sits right against Ankeny, which passed 77,000 people. Check the USDA eligibility map for your specific address before you invest any time.</p>`,
    matters: {
      heading: 'A word on grant scams',
      html: `
        <p>If a company emails or calls offering to get you a business grant for a fee, it is a scam. Real government grants never require an upfront payment to apply, and no one can guarantee you an award.</p>
        <p>Every legitimate program on this page is listed on a .gov site and free to apply for. If you are not sure, call the SBDC before you send anyone money.</p>`,
    },
    sources: [
      { label: 'State of Iowa grant listings', publisher: 'IowaGrants.gov', url: 'https://www.iowagrants.gov/' },
      { label: 'Federal grant listings', publisher: 'Grants.gov', url: 'https://www.grants.gov/' },
      { label: 'Rural Business Development Grant rules', publisher: 'USDA Rural Development', url: 'https://www.rd.usda.gov/programs-services/business-programs/rural-business-development-grants' },
    ],
  },

  {
    id: 'voting-dates-2026',
    group: 'ballot',
    added: '2026-10-12',
    topics: ['elections'],
    title: 'Voting dates and deadlines for November 3',
    meta: 'Early voting starts October 14',
    plain: 'Early voting opens October 14. Mail ballot requests are due October 19. Polk City has its own early voting day on October 20.',
    body: `
      <ul>
        <li><strong>Wednesday, October 14.</strong> Early voting starts at the Polk County Election Office, 2309 Euclid Ave., Des Moines. Open 8 a.m. to 4:30 p.m. weekdays through November 2, plus Saturday, October 24 (8 a.m. to 4 p.m.) and Saturday, October 31 (8 a.m. to 5 p.m.). Mailed ballots go out the same day.</li>
        <li><strong>Monday, October 19 at 5 p.m.</strong> Mail ballot requests must be received by the county. Postmarks do not count. This is also the deadline to pre-register. After that you can still register in person when you vote, with ID and proof of address.</li>
        <li><strong>Tuesday, October 20, 10 a.m. to 4 p.m.</strong> Early voting in Polk City at the Community Room, 200 S. 4th St. Nearby: Heartland Church in Ankeny (October 19), Bondurant Library (October 20), and Johnston Library (October 21 to 24).</li>
        <li><strong>Tuesday, November 3.</strong> Polls are open 7 a.m. to 8 p.m. Polk City 1 votes at Lakeside Fellowship, 1121 W. Bridge Rd. Polk City 2 votes at Polk City United Methodist Church, 1421 W. Broadway St. Mailed ballots must arrive by 8 p.m. that day, so mail them at least a week early.</li>
      </ul>
      <p>Statewide offices are also on the ballot: Attorney General, Secretary of State, Auditor, Treasurer, and Secretary of Agriculture.</p>`,
    matters: {
      heading: 'Why this is on a chamber website',
      html: `<p>Your employees vote too. Posting these dates in the break room costs nothing. If you have staff who work long shifts, the October 20 satellite in town is the easiest way for them to vote without losing time.</p>`,
    },
    sources: [
      { label: 'November 3 voter information and sample ballots', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/county-auditor/election/news-and-press-releases/general-election-november-3-2026-voter-information/' },
      { label: 'Track your mailed ballot', publisher: 'Iowa Secretary of State', url: 'https://sos.iowa.gov/elections/absenteeballotstatus/absentee/search' },
      { label: 'Make a plan to vote', publisher: 'Iowa Secretary of State', url: 'https://sos.iowa.gov/news-resources/secretary-pate-encourages-iowans-make-plan-vote-2026-general-election' },
    ],
  },

  {
    id: 'income-tax-amendment-sjr11',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['tax', 'elections'],
    title: 'Ballot question: make income tax increases harder',
    meta: 'Constitutional Amendment 1 on the back of your ballot. It started as Senate Joint Resolution 11.',
    plain: 'A yes vote would change the state constitution so raising the individual or corporate income tax rate, or creating a new state income tax, needs two thirds of each chamber instead of a simple majority. Local option taxes are not covered.',
    body: `
      <p>Right now, lawmakers can raise income tax rates with a simple majority vote. This change would require two thirds of both chambers to agree instead. It covers individual and corporate income tax rates and any new state income tax. It does not cover local option taxes.</p>
      <p>Look for it on the back of the ballot, listed as Constitutional Amendment 1.</p>
      <p>It already passed the Legislature twice, which is what puts it in front of voters. The final vote in the House was 57 to 21 on May 3.</p>
      <p>Some background worth having. Iowa's income tax is currently a flat 3.8%. Next year's state budget is $9.6 billion. It plans to spend about $1.2 billion more than it takes in, covered by drawing down a savings fund.</p>`,
    matters: {
      heading: 'Both sides, plainly',
      html: `
        <p><strong>Supporters say</strong> it locks in low taxes for the long run, so businesses can plan without worrying about a future increase.</p>
        <p><strong>Opponents say</strong> it ties the hands of future lawmakers if the economy turns. They point at the gap between spending and revenue as a sign the state may need flexibility sooner than people think.</p>
        <p>For a business owner, the question underneath this is where the money comes from instead. If income taxes get hard to raise, pressure usually shifts to sales taxes, fees, and property taxes. Property taxes were just capped at the local level. Worth thinking about these two changes together.</p>`,
    },
    sources: [
      { label: 'Official ballot wording, Polk City sample ballot', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/media/jwwhzzpy/polk_city_1-sample.pdf' },
      { label: 'The amendment, the vote, and the budget picture', publisher: 'NFIB Iowa', url: 'https://www.nfib.com/news/news/the-iowa-legislative-session-recap/' },
      { label: 'Sample ballots and election dates', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/county-auditor/election/' },
    ],
  },

  {
    id: 'governor-race',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['elections', 'tax'],
    title: 'Governor: an open seat for the first time in 20 years',
    meta: 'Zach Lahn (R) and Rob Sand (D). Rated lean Democratic.',
    plain: 'Kim Reynolds is not running again. Whoever wins sets the tax and business agenda for the next four years.',
    body: `
      <p>Gov. Kim Reynolds is not running for a third term. This is Iowa's first open race for governor since 2006.</p>
      <p>Zach Lahn is a businessman and farmer. He won a five way Republican primary on June 2 by less than one percentage point over Congressman Randy Feenstra, 37.8% to 37.0%.</p>
      <p>Rob Sand is the state auditor and the only Democrat currently holding a statewide office in Iowa. He ran unopposed in his primary.</p>
      <p>The Cook Political Report, which rates races nationally, moved this race from toss-up to lean Democratic in August.</p>`,
    matters: {
      heading: 'Why it matters for business',
      html: `
        <p>The governor drives the tax agenda. How the new property tax law gets carried out, and whether the state changes its business incentives, both run through that office.</p>
        <p>There is also a practical angle. A competitive race means both campaigns want local audiences between now and November. If you would like a candidate to come talk to Polk City businesses, this is the year to ask. Tell the chamber.</p>`,
    },
    sources: [
      { label: 'Who is running, and past results', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Iowa_gubernatorial_and_lieutenant_gubernatorial_election,_2026' },
      { label: 'How the primary finished', publisher: 'Iowa Capital Dispatch', url: 'https://iowacapitaldispatch.com/2026/06/02/rep-randy-feenstra-concedes-to-zach-lahn-in-2026-iowa-gop-gubernatorial-primary/' },
      { label: 'Where the Republican candidates stood', publisher: 'Iowa Public Radio', url: 'https://www.iowapublicradio.org/political-news/2026-05-15/2026-iowa-governors-race-republican-primary-candidates' },
    ],
  },

  {
    id: 'senate-race',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['elections'],
    title: 'U.S. Senate: another open seat',
    meta: 'Ashley Hinson (R), Josh Turek (D), Thomas Laehn (L)',
    plain: 'Joni Ernst is retiring. The race is close, and the farm economy is the issue driving it.',
    body: `
      <p>Sen. Joni Ernst is retiring after two terms. Ashley Hinson currently represents northeast Iowa in Congress. Josh Turek is a state representative.</p>
      <p>In August, Cook Political Report moved this race from leaning Republican to a toss-up. They pointed to the farm economy and a tough national climate for Republicans. Recent polls show a close race. A Fox News poll taken September 24 to 28 had Turek at 49% and Hinson at 47% among likely voters, within the margin of error.</p>`,
    matters: {
      heading: 'Why it matters for business',
      html: `
        <p>Tariffs and farm income are the live issue. When farm income drops, it hits equipment dealers, seed and fertilizer suppliers, trucking, and eventually the restaurants and shops those families spend money at. Central Iowa feels that before most places do.</p>
        <p>A close Senate race also means candidates are unusually available for local events right now.</p>`,
    },
    sources: [
      { label: 'Who is running', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/United_States_Senate_election_in_Iowa,_2026' },
      { label: 'Background on the open seat', publisher: 'Ballotpedia News', url: 'https://news.ballotpedia.org/2026/08/06/turek-hinson-running-for-open-u-s-senate-seat-in-iowa-as-ernst-retires/' },
    ],
  },

  {
    id: 'congressional-district',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['elections'],
    title: 'U.S. House: Polk City is in the 3rd District',
    meta: 'Zach Nunn (R) and Sarah Trone Garriott (D)',
    plain: 'One of the closest House races in the country runs right through here. Nunn has held the seat since 2022. Trone Garriott is a state senator from West Des Moines.',
    body: `
      <p>All of Polk County, including Polk City, is in Iowa's <strong>3rd</strong> Congressional District.</p>
      <p><strong>Zach Nunn (Republican)</strong> is the incumbent, from Bondurant. He won the seat in 2022 by unseating Cindy Axne, and was reelected in 2024.</p>
      <p><strong>Sarah Trone Garriott (Democrat)</strong> is a state senator from West Des Moines and an ordained Lutheran pastor who works on interfaith engagement for the Des Moines Area Religious Council. She won the June 2 primary. State Rep. Jennifer Konfrst had been running and dropped out in favor of her.</p>
      <p>Analysts rate this as one of the most competitive House races in the country.</p>`,
    matters: {
      heading: 'Why this office matters even if you never vote',
      html: `
        <p>Your congressional office is who you call when a federal agency is sitting on something. A stuck permit, an SBA loan problem, an export question, a dispute with a federal contractor. That is casework, and every congressional office does it regardless of party.</p>`,
    },
    sources: [
      { label: '3rd District race overview', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Iowa%27s_3rd_Congressional_District_election,_2026' },
      { label: 'How analysts rate the 3rd District race', publisher: 'Cook Political Report', url: 'https://www.cookpolitical.com/house/race/483096' },
      { label: 'Constituent services for the 3rd District', publisher: 'Office of Rep. Zach Nunn', url: 'https://nunn.house.gov/' },
      { label: 'District maps for Polk County', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/county-auditor/election/election-maps/' },
    ],
  },

  {
    id: 'state-legislature-races',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['elections', 'tax'],
    title: 'Polk City gets a brand new state senator and a brand new state representative',
    meta: 'Senate District 23 and House District 45, no incumbent in either',
    plain: 'Both seats are open. Jack Whitver retired, and four-term Rep. Brian Lohse lost his June primary. Whoever wins in November will be new to the job, and new to us.',
    body: `
      <p>Polk City sits in <strong>Iowa Senate District 23</strong> and <strong>Iowa House District 45</strong>. Something unusual happened this year. Neither race has an incumbent on the November ballot.</p>

      <h4>Senate District 23</h4>
      <p>The district covers rural northern Polk County plus parts of eastern Polk and eastern Dallas counties, including Polk City, Alleman, Elkhart, Granger, Runnells, and parts of Grimes and Urbandale.</p>
      <p>Jack Whitver of Grimes held the seat and served as Senate Majority Leader from 2018. He announced in September 2025 that he would not run again, citing ongoing treatment following a brain tumor diagnosis. Mike Bousselot, a state senator from Ankeny, won the June 2 Republican primary over Wes Enos, about 65% to 35%. Bousselot ended his campaign on August 14 to take a private sector job, and on August 19 the Republican Party named Enos as its nominee.</p>
      <ul>
        <li><strong>Wes Enos (Republican)</strong>, a former Bondurant City Council member.</li>
        <li><strong>Tony Thompson (Democrat)</strong>, a farmer and business owner from Elkhart. He was unopposed in the primary.</li>
      </ul>

      <h4>House District 45</h4>
      <p>The district includes Polk City, Bondurant, Mitchellville, part of Carlisle and nearby communities.</p>
      <p>Brian Lohse of Bondurant had held the seat since 2019 and was running for a fifth term. He lost the June 2 Republican primary to Austin Stubbs by roughly 75% to 25%.</p>
      <ul>
        <li><strong>Austin Stubbs (Republican)</strong>.</li>
        <li><strong>Kendra Haug (Democrat)</strong>. She was unopposed in the primary.</li>
      </ul>
      <p>Candidate profiles for House District 45 are linked below.</p>`,
    matters: {
      heading: 'Why this is the most important thing on this page for the chamber',
      html: `
        <p>Come January, nobody representing Polk City at the Statehouse will have held the job before. That has not happened here in a long time.</p>
        <p>Everything in the New Laws section came out of these two chambers. The property tax cap, the TIF limits that make commercial development harder to finance, the child care program. Right to repair and the energy bill come back in January. All of it gets decided by people who, as of today, have no record on how any of it affects a business in Polk City.</p>
        <p>That cuts both ways. There is no established relationship to lean on. There is also no fixed position to argue against. A new legislator's first year is when they are most open to hearing from constituents, and both winners will be looking for local footing.</p>
        <p>Worth noting: nobody arrives already knowing our commercial development problem or our 90 to 10 tax base. Someone has to tell them, early.</p>
        <p>That is the argument for the chamber having an advocacy function at all. If we wait until February, the session is already moving and positions are set.</p>`,
    },
    sources: [
      { label: 'House District 45 race overview', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Iowa_House_of_Representatives_District_45' },
      { label: 'Three Iowa House incumbents lost their primaries', publisher: 'Iowa Capital Dispatch', url: 'https://iowacapitaldispatch.com/briefs/three-iowa-house-incumbents-lose-primary-elections/' },
      { label: 'Wes Enos, the Republican nominee in Senate District 23', publisher: 'Des Moines Register', url: 'https://www.desmoinesregister.com/story/news/politics/elections/2026/08/19/wes-enos-republican-nominee-iowa-senate-district-23-election/91374099007/' },
      { label: 'Official list of general election candidates', publisher: 'Iowa Secretary of State', url: 'https://sos.iowa.gov/sites/default/files/2026-08/2026%20General%20-%20Candidate%20List%20Database%20-%20All%20Elections_0.pdf' },
      { label: 'Senate District 23 nominee change', publisher: 'KCRG', url: 'https://www.kcrg.com/2026/08/14/state-sen-mike-bousselot-ends-2026-campaign/' },
      { label: 'Find your legislators by address', publisher: 'Iowa Legislature', url: 'https://www.legis.iowa.gov/legislators/find' },
      { label: 'Look up your full sample ballot', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Polk_County_Sample_Ballot_(Iowa)' },
    ],
  },

  {
    id: 'county-township-local-races',
    group: 'ballot',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['elections'],
    title: 'County offices, township officers, and judges',
    meta: 'Also on the November 3 ballot',
    plain: 'Polk City does not pick a county supervisor this year. But the county attorney, recorder, and treasurer are on everyone\'s ballot, along with three county boards and judges.',
    body: `
      <h4>County supervisor: not your district this year</h4>
      <p>Three of the five seats on the Polk County Board of Supervisors are up, but none of them cover Polk City.</p>
      <ul>
        <li><strong>District 1:</strong> the southwest side of Des Moines, West Des Moines, Clive, and Windsor Heights. Supervisor Matt McCoy lost his June primary to John Forbes.</li>
        <li><strong>District 4:</strong> east and southeast Des Moines, Pleasant Hill, Runnells, Camp Township, and Four Mile Township. Longtime supervisor Tom Hockensmith is retiring. Heather Jones-Brown (D) faces Alyson DeMoss (R).</li>
        <li><strong>District 5:</strong> north and northwestern Des Moines, the East Village, and parts of downtown. Longtime supervisor Angela Connolly is retiring.</li>
      </ul>

      <h4>Countywide offices, on every Polk County ballot</h4>
      <ul>
        <li><strong>County Attorney.</strong> Incumbent Kimberly Graham (Democrat) faces Jonah Dyer (Republican), a Des Moines defense lawyer named by a Republican convention in June.</li>
        <li><strong>County Recorder.</strong> An open seat, since longtime recorder Julie Haggerty is retiring. Lisa J. Chiodo (Democrat) is unopposed. The recorder keeps permanent public records: birth, death and marriage certificates, and real estate documents.</li>
        <li><strong>County Treasurer.</strong> Incumbent Mary L. Wells (Democrat) is unopposed.</li>
      </ul>
      <p>Your sample ballot will show exactly who appears.</p>

      <h4>Everything else down the ballot</h4>
      <ul>
        <li><strong>Township officers.</strong> Trustee and clerk races appear only on ballots in rural precincts outside city limits, such as Madison Township. They are not on Polk City ballots.</li>
        <li><strong>Three nonpartisan county boards.</strong> Hospital Board of Trustees, Soil and Water Conservation Board, and Agricultural Extension Council.</li>
        <li><strong>Judicial retention.</strong> Yes or no on whether sitting judges keep their seats. No opponents.</li>
        <li><strong>Local public measures.</strong> No city or county measures are on Polk City ballots this year.</li>
      </ul>
      <p>City council and school board are not on this ballot. Iowa moved those to odd years, so the next ones are November 2027.</p>`,
    matters: {
      heading: 'Why the county board still matters to you',
      html: `
        <p>You are not voting for a supervisor this year, but the board will have at least three new members in January. Tom Hockensmith and Angela Connolly are retiring, and Matt McCoy lost his primary. That reshapes the board for years.</p>
        <p>This is the body that sets the county property tax levy, decides how Polk County spends its Community Development Block Grant money, and awards the county community betterment grants covered in the Grants section. Those decisions reach Polk City whether or not we picked the people making them.</p>
        <p>Practical advice: pull your sample ballot about a week early and look up anything you do not recognize. The bottom of the ballot is where most people quit, and those races are often decided by the fewest votes.</p>`,
    },
    sources: [
      { label: 'Polk City sample ballots, precincts 1 and 2', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/media/jwwhzzpy/polk_city_1-sample.pdf' },
      { label: 'Republicans enter county supervisor and attorney races', publisher: 'Axios Des Moines', url: 'https://www.axios.com/local/des-moines/2026/06/30/scoop-republicans-enter-polk-county-races-for-supervisor-and-attorney' },
      { label: 'Official Polk County election results', publisher: 'Polk County Auditor', url: 'https://polkelectionia.gov/ElectionNight' },
      { label: 'What the general election covers', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/county-auditor/election/news-and-press-releases/general-election-november-3-2026-voter-information/' },
      { label: 'Sample ballot lookup by address', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Polk_County_Sample_Ballot_(Iowa)' },
      { label: 'Election dates, early voting, and absentee', publisher: 'Polk County Auditor', url: 'https://www.polkcountyiowa.gov/county-auditor/election/' },
    ],
  },

  {
    id: 'economic-development-manager',
    group: 'local',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'Polk City has someone working on business recruitment now',
    meta: 'Started July 2026',
    plain: 'Jake Smith works in Polk City two days a week on bringing in and growing businesses. This is a new resource. Use it.',
    body: `<p>The city and the Greater Des Moines Partnership set up a trial arrangement. The Partnership hired Jake Smith as an Economic Development Manager. He has been based in Polk City two days a week since mid July.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `
        <p>There is now a real person, with metro level resources behind him, spending regular time in town on business growth. A year ago that did not exist.</p>
        <p>If you are looking to expand, move, find space, or get connected to someone, this is a door worth knocking on. Tell the chamber what you need and we will make sure it gets to the right people.</p>`,
    },
    sources: [
      { label: 'Council packet announcing the arrangement', publisher: 'City of Polk City', url: 'https://www.polkcityia.gov/AgendaCenter/ViewFile/Agenda/_07132026-155' },
      { label: 'Partnership benefits for chamber members', publisher: 'Greater Des Moines Partnership', url: 'https://www.dsmpartnership.com/investors-and-affiliate-network/regional-chamber-members/member-benefits' },
    ],
  },

  {
    id: 'cdbg-funding',
    group: 'local',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'Federal grant money renewed for Polk County',
    meta: 'Announced August 11, 2026',
    plain: 'Polk County got $2.5 million in federal money for things like sidewalks and utilities. Polk City is one of nine cities that can tap it.',
    body: `
      <p>Polk County received $2.5 million in federal housing and development funding. Going forward it qualifies for up to $987,000 a year.</p>
      <p>Nine cities take part, including Polk City. The others are Altoona, Bondurant, Clive, Grimes, Johnston, Pleasant Hill, Urbandale, and Windsor Heights, plus the unincorporated parts of the county.</p>`,
    matters: {
      heading: 'What this means for you',
      html: `<p>Each city picks what it spends the money on, and the list changes year to year. Sidewalks, utilities, accessibility work, and other infrastructure all qualify. So does storefront facade rehabilitation, which is the use most directly aimed at businesses. If your block is due for that kind of work, getting into the conversation early is how you have a say in the timing. Otherwise you find out when the orange barrels show up.</p>`,
    },
    sources: [
      { label: 'The announcement and the list of cities', publisher: 'Polk County', url: 'https://www.polkcountyiowa.gov/news-and-announcements/polk-county-announces-continuation-of-federal-community-development-block-grants-cdbg/' },
    ],
  },

  {
    id: 'commercial-residential-imbalance',
    group: 'local',
    added: '2026-09-01',
    topics: ['development', 'tax', 'workforce'],
    title: 'Polk City has lots of houses and not enough businesses',
    meta: 'From the city comprehensive plan and council priorities',
    plain: 'Houses make up about 90% of the tax base. Residents, the council, and the business community all agree we need more commercial. That agreement is unusual, and it is worth using.',
    body: `
      <p>Polk City is one of the fastest growing cities of its size in Iowa, at roughly 6,500 people. Stores and businesses have not kept up with all the new houses.</p>
      <p>When the city asked residents for input on its long range plan, 74% said the lack of jobs was a weakness. Lack of commercial development came out as the number one weakness overall. City leaders have said bringing in more commercial development is the council's top priority.</p>`,
    matters: {
      heading: 'Why the chamber keeps bringing this up',
      html: `
        <p>Residents, the city council, and business owners all want the same thing here. That almost never happens. It is the strongest position we have when we talk to the city or to lawmakers.</p>
        <p>Housing is part of the same problem. More than half the homes for sale here have been priced at $500,000 and up. Most people who work at Polk City businesses cannot afford to live here, so they commute. That makes it a hiring problem, not just a housing problem. If it is affecting your ability to staff up, tell us. Real examples from real members are what make the case.</p>`,
    },
    sources: [
      { label: "Why commercial development is the council's top priority", publisher: 'Business Record', url: 'https://www.businessrecord.com/commercial-development-no-1-priority-for-polk-city/' },
      { label: 'New retail helping balance the tax base', publisher: 'Business Record', url: 'https://www.businessrecord.com/new-polk-city-retail-center-helping-balance-communitys-tax-base/' },
      { label: 'Coverage of the debate over growth near Saylorville', publisher: 'WHO 13', url: 'https://who13.com/news/metro-news/polk-city-divided-moving-forward-on-development-near-saylorville-campgrounds/' },
    ],
  },

  {
    id: 'project-watchlist',
    group: 'local',
    added: '2026-09-01',
    updated: '2026-10-12',
    topics: ['development'],
    title: 'Projects worth watching',
    meta: 'Checked and updated at each review',
    plain: 'Five local projects that could change your foot traffic, your costs, or your access. The trail connection is the one with a real deadline.',
    body: `
      <ul>
        <li><strong>510 S. 3rd Street.</strong> A review committee picked HBU Development and DEV Partners. Their concept is two 16-unit apartment buildings plus a commercial building. The council held a hearing on selling the land September 28. Rezoning and site plan approval would still come later.</li>
        <li><strong>Trail connection.</strong> Linking the Neal Smith Trail to the High Trestle Trail. Targeted to finish by December 2026.</li>
        <li><strong>East Northside Drive intersection.</strong> Construction on the N. 3rd Street and E. Northside Drive intersection is underway, with a contract deadline of November 16, 2026.</li>
        <li><strong>Regional water agreement.</strong> The council has been voting on changes to the shared water contract. Water capacity and rates are a real cost for some members.</li>
        <li><strong>Highway 415 corridor.</strong> The stretch between Polk City and Ankeny, where most of the growth pressure sits. A Highway 415 and 44th Street concept study went to the council work session on October 12.</li>
      </ul>`,
    matters: {
      heading: 'The one with a date on it',
      html: `<p>The trail connection has an actual deadline and an obvious upside. Cyclists and walkers coming through means more people passing your door. If you sell food, drinks, retail, rentals, or services, start planning for it now instead of noticing it next spring.</p>`,
    },
    sources: [
      { label: 'City agendas, minutes, and project notices', publisher: 'City of Polk City', url: 'https://www.polkcityia.gov/' },
      { label: 'Council agendas and packets', publisher: 'City of Polk City', url: 'https://www.polkcityia.gov/AgendaCenter' },
      { label: 'Sale of 510 S. 3rd Street', publisher: 'City of Polk City', url: 'https://www.polkcityia.gov/400/Sale-of-510-S-3rd-Street' },
      { label: 'Mayor and city council', publisher: 'City of Polk City', url: 'https://www.polkcityia.gov/167/Mayor-City-Council' },
    ],
  },
];

/* Sources we check. Shown near the bottom of the page. */
const WATCHLIST = [
  { label: 'City of Polk City', note: 'Council agendas and minutes. The most useful source on this list.', url: 'https://www.polkcityia.gov/' },
  { label: 'Polk County announcements', note: 'Grants, county programs, and supervisor decisions.', url: 'https://www.polkcountyiowa.gov/news-and-announcements/' },
  { label: 'Iowa Legislature', note: 'The official list of bills that became law, with effective dates.', url: 'https://www.legis.iowa.gov/law/statutory/acts/enrolledBills' },
  { label: 'Iowa Capital Dispatch', note: 'Nonprofit statehouse reporting. Good for the why behind a bill.', url: 'https://iowacapitaldispatch.com/' },
  { label: 'NFIB Iowa', note: 'Small business take on state laws. They advocate for a point of view, so read it as one side.', url: 'https://www.nfib.com/state-news/iowa' },
  { label: 'Business Record', note: 'Des Moines area business news. Covers Polk City regularly.', url: 'https://www.businessrecord.com/' },
  { label: 'Iowa Public Radio', note: 'Statewide news and policy coverage.', url: 'https://www.iowapublicradio.org/' },
  { label: 'Ballotpedia', note: 'Neutral reference on candidates, offices, and ballot questions.', url: 'https://ballotpedia.org/Iowa' },
  { label: 'Greater Des Moines Partnership', note: 'Now a direct partner through the economic development arrangement.', url: 'https://www.dsmpartnership.com/' },
];
