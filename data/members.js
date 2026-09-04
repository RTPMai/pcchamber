/* ==========================================================================
   MEMBER DIRECTORY

   Every member listed here gets its own real page at
   /directory/their-slug/ so search engines can find it.

   Fields:
     slug      the web address. Lowercase, hyphens, never change it once live.
     name      business name as they want it written
     category  must match one of the CATEGORIES ids below
     tier      basic | pro | premier   (drives sort order and the badge)
     summary   one plain sentence. Shows in the list, before anyone clicks.
     about     a short paragraph. Shows on their page.
     contact   any of: person, phone, email, web, address
     serves    optional list of what they do, shown as tags
     joined    year they joined the chamber
     logo      optional. Path to their logo, e.g. '/assets/members/slug.svg'
               Square-ish works best. SVG or PNG with a transparent
               background. Leave it out and the plate shows their initial,
               which looks deliberate rather than broken.
   ========================================================================== */

export const CATEGORIES = [
  { id: 'finance',    label: 'Banking and finance' },
  { id: 'insurance',  label: 'Insurance' },
  { id: 'realestate', label: 'Real estate and construction' },
  { id: 'food',       label: 'Food and drink' },
  { id: 'retail',     label: 'Shops and retail' },
  { id: 'health',     label: 'Health and wellness' },
  { id: 'services',   label: 'Professional services' },
  { id: 'home',       label: 'Home and trades' },
  { id: 'family',     label: 'Child care and education' },
  { id: 'rec',        label: 'Recreation and events' },
  { id: 'nonprofit',  label: 'Nonprofit and civic' }
];

export const TIERS = {
  premier: { label: 'Premier member', rank: 0 },
  pro:     { label: 'Pro member',     rank: 1 },
  basic:   { label: 'Member',         rank: 2 }
};

/* ---------------------------------------------------------------------------
   SAMPLE DATA. Replace all of it.

   These are placeholders, not real businesses. They exist so the board can
   see how a full directory behaves: sorting, filtering, search, and what one
   member's page looks like. Delete this block and paste the real 67.
   --------------------------------------------------------------------------- */

export const MEMBERS = [
  {
    slug: 'sample-community-bank',
    name: 'Sample Community Bank',
    category: 'finance',
    tier: 'premier',
    summary: 'Local branch handling business checking, equipment loans, and SBA paperwork.',
    about: 'A community bank with a lender who sits down with small business owners in person. Handles SBA 7(a) and 504 applications in house rather than sending them to a call center.',
    serves: ['Business checking', 'Equipment loans', 'SBA lending', 'Commercial mortgages'],
    contact: { person: 'Branch manager', phone: '515-555-0100', email: 'hello@example.com', web: 'https://example.com', address: '100 Main Street, Polk City, IA 50226' },
    joined: 2016
  },
  {
    slug: 'sample-credit-union',
    name: 'Sample Credit Union',
    category: 'finance',
    tier: 'basic',
    summary: 'Member-owned lender offering business accounts and vehicle financing.',
    about: 'Serves both personal and small business members. Lower fees than a bank on day-to-day accounts, smaller lending limits on the commercial side.',
    serves: ['Business accounts', 'Vehicle loans', 'Lines of credit'],
    contact: { phone: '515-555-0101', web: 'https://example.com' },
    joined: 2019
  },
  {
    slug: 'sample-insurance-agency',
    name: 'Sample Insurance Agency',
    category: 'insurance',
    tier: 'pro',
    summary: 'Independent agent quoting commercial liability, property, and workers comp.',
    about: 'Independent, so quotes come from several carriers rather than one. Reviews existing policies for gaps at no charge, which is worth doing if your coverage predates a build-out.',
    serves: ['Commercial liability', 'Property', 'Workers compensation', 'Bonding'],
    contact: { person: 'Agent', phone: '515-555-0102', email: 'hello@example.com' },
    joined: 2014
  },
  {
    slug: 'sample-realty-group',
    name: 'Sample Realty Group',
    category: 'realestate',
    tier: 'pro',
    summary: 'Residential and commercial brokerage covering Polk City and the north metro.',
    about: 'Handles listings, buyer representation, and commercial leasing. Knows which storefronts are coming open before they list, which matters in a market this small.',
    serves: ['Commercial leasing', 'Residential sales', 'Land'],
    contact: { phone: '515-555-0103', web: 'https://example.com', address: '200 Broadway Street, Polk City, IA 50226' },
    joined: 2018
  },
  {
    slug: 'sample-construction-co',
    name: 'Sample Construction Company',
    category: 'realestate',
    tier: 'basic',
    summary: 'General contractor doing commercial build-outs and light industrial work.',
    about: 'Tenant improvements, additions, and small commercial ground-up. Pulls its own permits with the city.',
    serves: ['Build-outs', 'Additions', 'Site work'],
    contact: { phone: '515-555-0104' },
    joined: 2021
  },
  {
    slug: 'sample-coffee-house',
    name: 'Sample Coffee House',
    category: 'food',
    tier: 'basic',
    summary: 'Downtown coffee shop with room to hold a small meeting.',
    about: 'Open early, closes mid afternoon. The back room seats about a dozen and is where a lot of chamber committee work actually happens.',
    serves: ['Coffee', 'Breakfast', 'Meeting space'],
    contact: { phone: '515-555-0105', address: '300 Broadway Street, Polk City, IA 50226' },
    joined: 2022
  },
  {
    slug: 'sample-tavern',
    name: 'Sample Tavern and Grill',
    category: 'food',
    tier: 'basic',
    summary: 'Sit-down restaurant and bar that caters for groups.',
    about: 'Full menu, full bar, and a private room. Handles catering for chamber events and business lunches.',
    serves: ['Dine in', 'Catering', 'Private room'],
    contact: { phone: '515-555-0106', web: 'https://example.com' },
    joined: 2017
  },
  {
    slug: 'sample-hardware-store',
    name: 'Sample Hardware',
    category: 'retail',
    tier: 'basic',
    summary: 'Hardware and lumber, with commercial accounts for contractors.',
    about: 'Stocks the everyday items a trade business burns through, and will set up a house account with monthly billing.',
    serves: ['Hardware', 'Lumber', 'Contractor accounts'],
    contact: { phone: '515-555-0107' },
    joined: 2012
  },
  {
    slug: 'sample-boutique',
    name: 'Sample Boutique',
    category: 'retail',
    tier: 'basic',
    summary: 'Clothing and gift shop on the main street.',
    about: 'Apparel, gifts, and a corporate gifting program for businesses that need something local to hand a client.',
    serves: ['Apparel', 'Gifts', 'Corporate gifting'],
    contact: { phone: '515-555-0108', web: 'https://example.com' },
    joined: 2023
  },
  {
    slug: 'sample-family-dental',
    name: 'Sample Family Dental',
    category: 'health',
    tier: 'pro',
    summary: 'General dentistry taking most commercial insurance plans.',
    about: 'Family practice with evening hours twice a week, which matters for employees who cannot leave a job site midday.',
    serves: ['General dentistry', 'Cleanings', 'Emergency visits'],
    contact: { phone: '515-555-0109', web: 'https://example.com' },
    joined: 2015
  },
  {
    slug: 'sample-physical-therapy',
    name: 'Sample Physical Therapy',
    category: 'health',
    tier: 'basic',
    summary: 'Outpatient therapy including work injury rehabilitation.',
    about: 'Treats work-related injuries and coordinates directly with employers on return-to-work plans.',
    serves: ['Work injury rehab', 'Sports therapy', 'Dry needling'],
    contact: { phone: '515-555-0110' },
    joined: 2020
  },
  {
    slug: 'sample-hr-partners',
    name: 'Sample HR Partners',
    category: 'services',
    tier: 'premier',
    summary: 'Outsourced HR for small employers, including handbooks and hiring.',
    about: 'Works with businesses too small to staff an HR person. Writes handbooks, runs hiring, and keeps employers on the right side of Iowa wage and leave rules.',
    serves: ['Handbooks', 'Hiring', 'Payroll setup', 'Compliance'],
    contact: { person: 'Owner', email: 'hello@example.com', web: 'https://example.com' },
    joined: 2019
  },
  {
    slug: 'sample-marketing-studio',
    name: 'Sample Marketing Studio',
    category: 'services',
    tier: 'basic',
    summary: 'Websites, photography, and social media for small businesses.',
    about: 'One-person shop doing sites, product photography, and monthly social management on retainer.',
    serves: ['Websites', 'Photography', 'Social media'],
    contact: { email: 'hello@example.com', web: 'https://example.com' },
    joined: 2024
  },
  {
    slug: 'sample-heating-cooling',
    name: 'Sample Heating and Cooling',
    category: 'home',
    tier: 'basic',
    summary: 'HVAC service and installation, residential and light commercial.',
    about: 'Service contracts for commercial buildings, plus after-hours emergency calls.',
    serves: ['HVAC service', 'Installation', 'Service contracts'],
    contact: { phone: '515-555-0111' },
    joined: 2013
  },
  {
    slug: 'sample-lawn-and-landscape',
    name: 'Sample Lawn and Landscape',
    category: 'home',
    tier: 'basic',
    summary: 'Commercial mowing, snow removal, and landscape installation.',
    about: 'Seasonal contracts for commercial properties, including snow removal with a per-event or seasonal rate.',
    serves: ['Commercial mowing', 'Snow removal', 'Landscaping'],
    contact: { phone: '515-555-0112' },
    joined: 2018
  },
  {
    slug: 'sample-learning-center',
    name: 'Sample Learning Center',
    category: 'family',
    tier: 'pro',
    summary: 'Licensed child care and preschool with infant openings.',
    about: 'Licensed center serving infants through preschool. Works with employers on the state child care assistance and employer match programs.',
    serves: ['Infant care', 'Preschool', 'Before and after school'],
    contact: { phone: '515-555-0113', web: 'https://example.com' },
    joined: 2020
  },
  {
    slug: 'sample-golf-club',
    name: 'Sample Golf Club',
    category: 'rec',
    tier: 'premier',
    summary: 'Golf course and event venue that hosts the monthly chamber luncheon.',
    about: 'Eighteen holes, a clubhouse that seats a crowd, and the venue for the chamber luncheon and the annual golf tournament.',
    serves: ['Golf', 'Event space', 'Catering', 'Weddings'],
    contact: { phone: '515-555-0114', web: 'https://example.com' },
    joined: 2011
  },
  {
    slug: 'sample-community-foundation',
    name: 'Sample Community Foundation',
    category: 'nonprofit',
    tier: 'basic',
    summary: 'Local grantmaker funding community projects and small capital needs.',
    about: 'Makes small grants to local organizations and projects. Application rounds twice a year.',
    serves: ['Grants', 'Donor funds', 'Scholarships'],
    contact: { email: 'hello@example.com', web: 'https://example.com' },
    joined: 2016
  }
];
