/* ==========================================================================
   MEMBER DIRECTORY

   61 members, imported from the chamber's CSV export on 2026-09-04.

   Every member here gets a real page at /directory/their-slug/ so search
   engines can find it.

   TO RELOAD FROM A NEW EXPORT
     Save it as tools/members.csv, run `node tools/import-csv.mjs`, then
     rename data/members.generated.js over this file. The importer reports
     everything it changed.

   SLUGS ARE PERMANENT
     Once a page is public and indexed, changing its slug breaks every link
     pointing at it. Fix any that are wrong before launch, not after.

   Fields:
     slug      the web address. Lowercase, hyphens, never change once live.
     name      business name as they want it written
     category  must match one of the CATEGORIES ids below
     tier      basic | pro | premier   (drives sort order and the badge)
     summary   one plain sentence. Shows in the list, before anyone clicks.
     about     a short paragraph. Shows on their page.
     contact   any of: person, phone, email, web, address
     serves    optional list of what they do, shown as tags
     city      the town they are based in. Shown in the list while summaries
               are still being collected.
     joined    year they joined the chamber
     logo      optional. Path to their logo, e.g. '/assets/members/slug.svg'
               Square-ish works best. SVG or PNG with a transparent
               background. Leave it out and the plate shows their initial,
               which looks deliberate rather than broken.

   EVERY SUMMARY IS CURRENTLY EMPTY, ON PURPOSE.
   These are real businesses with real names on real pages. A plausible
   sentence that turns out to be wrong is worse than no sentence, so the
   listing falls back to showing the category until somebody collects the
   real one. Getting 61 sentences is a phone-round or an email, not a
   writing job: ask each member for one line about what they do.
   ========================================================================== */

export const CATEGORIES = [
  { id: 'finance',    label: 'Banking' },
  { id: 'insurance',  label: 'Insurance and financial services' },
  { id: 'realestate', label: 'Real estate and development' },
  { id: 'home',       label: 'Home, trades and utilities' },
  { id: 'food',       label: 'Food and drink' },
  { id: 'retail',     label: 'Shops and retail' },
  { id: 'health',     label: 'Health and wellness' },
  { id: 'pets',       label: 'Veterinary' },
  { id: 'services',   label: 'Professional services' },
  { id: 'family',     label: 'Childcare and education' },
  { id: 'rec',        label: 'Recreation and events' },
  { id: 'nonprofit',  label: 'Nonprofit, civic and faith' },
  { id: 'government', label: 'Government' }
];

export const TIERS = {
  premier: { label: 'Premier member', rank: 0 },
  pro:     { label: 'Pro member',     rank: 1 },
  basic:   { label: 'Member',         rank: 2 }
};

export const MEMBERS = [
  {
    slug: 'all-seasons-veterinary-care',
    name: 'All Seasons Veterinary Care',
    category: 'pets',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-531-8387', email: 'info@allseasonsveterinarycare.com', web: 'https://www.allseasonsveterinarycare.com', address: '755 W Bridge Rd., Polk City, IA, 50226' }
  },
  {
    slug: 'american-legion-post-232',
    name: 'American Legion Post 232',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '712-326-8808', email: 'post232treasurer@gmail.com', address: '114 W Broadway St., Polk City, IA, 50226' }
  },
  {
    slug: 'anytime-fitness-polk-city',
    name: 'Anytime Fitness - Polk City',
    category: 'health',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-528-1262', email: 'polkcityia@anytimefitness.com', address: '407 W Bridge Road, Suite 6, Polk City, IA, 50226' }
  },
  {
    slug: 'arcadia',
    name: 'Arcadia PC',
    category: 'food',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-207-0011', email: 'info@arcadiapolkcity.com', web: 'https://www.arcadiapolkcity.com', address: '1010 Tyler St. #4, Polk City, IA, 50226' }
  },
  {
    slug: 'big-creek-growth',
    name: 'Big Creek Growth',
    category: 'services',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Adam', email: 'adam@vietenterprises.com', web: 'https://www.bigcreekgrowth.com', address: 'Polk City, IA' }
  },
  {
    slug: 'big-creek-historical-society',
    name: 'Big Creek Historical Society',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { email: 'info@polkcityhistory.org', address: '116 S. 3rd Street, Polk City, IA, 50226' }
  },
  {
    slug: 'big-green-umbrella-media',
    name: 'Big Green Umbrella Media, Inc.',
    category: 'services',
    tier: 'basic',
    city: 'Johnston',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Shane', phone: '515-953-4822', email: 'shane@dmcityview.com', web: 'https://www.biggreenumbrellamedia.com', address: '8101 Birchwood Ct, Unit D, Johnston, IA, 50131' }
  },
  {
    slug: 'city-of-polk-city',
    name: 'City of Polk City',
    category: 'government',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6233', email: 'support@polkcityia.gov', web: 'https://www.polkcityia.gov', address: '200 S. 4th Street, PO Box 426, Polk City, IA, 50226' }
  },
  {
    slug: 'corey-hoodjer-farm-bureau-financial-services',
    name: 'Corey Hoodjer, Farm Bureau Financial Services',
    category: 'insurance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Corey Hoodjer', phone: '515-420-6160', email: 'corey.hoodjer@fbfs.com', address: '212 W Van Dorn St., Suite B, Polk City, IA, 50226' }
  },
  {
    slug: 'cullen-and-associates-insurance-services',
    name: 'Cullen & Associates Insurance Services',
    category: 'insurance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-963-8500', web: 'https://www.cullenins.com', address: '905 W Bridge Rd., Polk City, IA, 50226' }
  },
  {
    slug: 'cupp-insurance',
    name: 'Cupp Insurance Inc.',
    category: 'insurance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Rob', phone: '515-984-9090', email: 'rob@cuppinsurance.com', address: '213 W Broadway, PO Box 37, Polk City, IA, 50226' }
  },
  {
    slug: 'fareway-polk-city',
    name: 'Fareway - Polk City',
    category: 'retail',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-9505', web: 'https://www.fareway.com', address: '1101 S 5th St., Polk City, IA, 50226' }
  },
  {
    slug: 'galaxy-cleaning-services',
    name: 'Galaxy Cleaning Services LLC',
    category: 'home',
    tier: 'basic',
    city: 'North Liberty',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '319-471-7069', email: 'info@galaxy-cleaning-services.com', web: 'https://www.galaxy-cleaning-services.com', address: 'North Liberty, IA' }
  },
  {
    slug: 'grinnell-state-bank',
    name: 'Grinnell State Bank',
    category: 'finance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6211', web: 'https://www.grinnell.bank', address: '205 E Broadway St., Polk City, IA, 50226' }
  },
  {
    slug: 'hbu-development',
    name: 'HBU Development',
    category: 'realestate',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Alex', phone: '712-249-7677', email: 'alex@hbu-dev.com', address: '540 Creekview Avenue, Polk City, IA, 50226' }
  },
  {
    slug: 'home-state-bank',
    name: 'Home State Bank',
    category: 'finance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-329-8801', web: 'https://www.hsbankiowa.com', address: '101 E Bridge Road, Polk City, IA, 50226' }
  },
  {
    slug: 'honeydo-2-honeydone',
    name: 'Honeydo 2 Honeydone',
    category: 'home',
    tier: 'basic',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Steve', phone: '515-975-3635', email: 'steve@honeydo2honeydone.com', web: 'https://www.honeydo2honeydone.com' }
  },
  {
    slug: 'hr-approach',
    name: 'HR Approach',
    category: 'services',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Tammy Verbrugge', phone: '515-208-0190', email: 'tammy.verbrugge@hrapproach.com', address: 'P.O. Box 513, Polk City, IA, 50226' }
  },
  {
    slug: 'jacquelyn-duke-realty-one-group-impact',
    name: 'Jacquelyn Duke, Realty One Group Impact',
    category: 'realestate',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Jacquelyn Duke', phone: '515-240-7483', email: 'jacquelyn@sellingcentraliowa.com', address: '617 SW 3rd St #101, Ankeny, IA, 50023' }
  },
  {
    slug: 'kiwanis-club-of-polk-city',
    name: 'Kiwanis Club of Polk City',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { email: 'pckiwanis1@gmail.com', address: 'Polk City, IA' }
  },
  {
    slug: 'knapp-properties',
    name: 'Knapp Properties, Inc.',
    category: 'realestate',
    tier: 'basic',
    city: 'West Des Moines',
    summary: '',   // TODO one plain sentence about what they do
    contact: { web: 'https://www.knappproperties.com', address: '5000 Westown Parkway, Suite 400, West Des Moines, IA, 50266' }
  },
  {
    slug: 'knockerball-118',
    name: 'Knockerball 118',
    category: 'rec',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-577-2420', email: 'knockerball118@gmail.com', web: 'https://www.knockerball118.com', address: 'Ankeny, IA' }
  },
  {
    slug: 'kyle-matzen-edward-jones',
    name: 'Kyle Matzen, Edward Jones',
    category: 'insurance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Kyle Matzen', phone: '515-984-6073', email: 'kyle.matzen@edwardjones.com', address: '407 West Bridge Road, Suite 7, Polk City, IA, 50226' }
  },
  {
    slug: 'lakeside-fellowship',
    name: 'Lakeside Fellowship',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6910', email: 'office@lakesidefellowship.com', address: '1121 W Bridge Rd., Polk City, IA, 50226' }
  },
  {
    slug: 'luana-savings-bank',
    name: 'Luana Savings Bank',
    category: 'finance',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-7100', web: 'https://www.luanasavingsbank.com', address: '855 W Bridge Rd, PO Box 200, Polk City, IA, 50226' }
  },
  {
    slug: 'lucky-wife-wine-slushies',
    name: 'Lucky Wife Wine Slushies',
    category: 'food',
    tier: 'basic',
    city: 'Indian Creek',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-570-5160', web: 'https://www.luckywifewineslushies.com', address: 'Indian Creek, IA' }
  },
  {
    slug: 'lush-aesthetics-and-wellness',
    name: 'Lush Aesthetics & Wellness PLLC',
    category: 'health',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-512-5123', email: 'info@lushwellnessco.com', web: 'https://www.lushwellnessco.com', address: '109 S 2nd St., Polk City, IA, 50226' }
  },
  {
    slug: 'michelles-school-of-dance',
    name: 'Michelle\'s School of Dance',
    category: 'family',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-707-9529', email: 'discoverydancers@yahoo.com', web: 'https://michellesschoolofdance.com', address: '110 Van Dorn St., Polk City, IA, 50226' }
  },
  {
    slug: 'midland-power-cooperative',
    name: 'Midland Power Cooperative',
    category: 'home',
    tier: 'basic',
    city: 'Boone',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '800-833-8876', web: 'https://www.midlandpower.coop', address: '2005 S Story Street, Boone, IA, 50036' }
  },
  {
    slug: 'natalie-st-john-the-downhome-co-remax-precision',
    name: 'Natalie St. John, The Downhome Co. REMAX Precision',
    category: 'realestate',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Natalie St. John', phone: '319-269-4818', email: 'natalie@thedownhomeco.com', address: 'Polk City, IA' }
  },
  {
    slug: 'north-polk-community-school-district',
    name: 'North Polk Community School District',
    category: 'family',
    tier: 'basic',
    city: 'Alleman',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-3400', address: '13930 NE 6th St., Alleman, IA, 50007' }
  },
  {
    slug: 'north-polk-family-medicine',
    name: 'North Polk Family Medicine',
    category: 'health',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6426', email: 'laytonda@gmail.com', address: '1010 S 3rd St., Polk City, IA, 50226' }
  },
  {
    slug: 'nova-med-spa',
    name: 'Nova Med Spa',
    category: 'health',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '563-599-7422', web: 'https://www.novamedspa.org', address: '1010 Tyler St. Suite 3, Polk City, IA, 50226' }
  },
  {
    slug: 'oak-and-berk',
    name: 'Oak & Berk',
    category: 'retail',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Ashley', email: 'ashley@oakandberk.com', web: 'https://www.oakandberk.com', address: '109 W Van Dorn Street, PO Box 33, Polk City, IA, 50226' }
  },
  {
    slug: 'on-with-life',
    name: 'On With Life',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Madison Rollefson', phone: '515-289-9600', email: 'madison.rollefson@onwithlife.org', address: '715 SW Ankeny Rd., Ankeny, IA, 50023' }
  },
  {
    slug: 'p-and-m-apparel',
    name: 'P&M Apparel',
    category: 'retail',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-7740', web: 'https://www.pmapparel.com', address: '1100 S 5th St., Polk City, IA, 50226' }
  },
  {
    slug: 'papas-pizzeria',
    name: 'Papa\'s Pizzeria',
    category: 'food',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Shawn Comer', phone: '515-250-3119', email: 'shawn@papas-pizzeria.com', address: '214 W Van Dorn St., Polk City, IA, 50226' }
  },
  {
    slug: 'pedal-pushers-vintage-shop',
    name: 'Pedal Pushers Vintage Shop',
    category: 'retail',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-720-4117', email: 'flower514446@gmail.com', address: '113 West Broadway St. Suite 3, Polk City, IA, 50226' }
  },
  {
    slug: 'polk-city-ace-hardware',
    name: 'Polk City Ace Hardware',
    category: 'retail',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Stacy Boyer', phone: '712-830-9294', email: 'stacyboyer4@gmail.com', address: '945 South 3rd Street, Polk City, IA, 50226' }
  },
  {
    slug: 'polk-city-chiropractic',
    name: 'Polk City Chiropractic',
    category: 'health',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6300', email: 'polkcitychiro@gmail.com', address: '201 N 3rd St Suite J, Polk City, IA, 50226' }
  },
  {
    slug: 'polk-city-police-officers-association',
    name: 'Polk City Police Officers Association',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-205-9229', email: 'adelaney@polkcityia.gov', address: '309 W Van Dorn St., PO Box 381, Polk City, IA, 50226' }
  },
  {
    slug: 'polk-city-united-methodist-church',
    name: 'Polk City United Methodist Church',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-865-3277', email: 'office@polkcityumc.org', address: '1421 W Broadway, Polk City, IA' }
  },
  {
    slug: 'polk-county-board-of-supervisors',
    name: 'Polk County Board of Supervisors',
    category: 'government',
    tier: 'basic',
    city: 'Des Moines',
    summary: '',   // TODO one plain sentence about what they do
    contact: { web: 'https://www.polkcountyiowa.gov', address: '111 Court Ave, Suite 300, Des Moines, IA, 50309' }
  },
  {
    slug: 'prudent-produce',
    name: 'Prudent Produce',
    category: 'food',
    tier: 'basic',
    city: 'Elkhart',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Tony Thompson', phone: '515-367-0110', email: 'tony@prudentproduce.net', address: '12850 NE 64th Street, Elkhart, IA, 50073' }
  },
  {
    slug: 'qube-hotel',
    name: 'Qube Hotel',
    category: 'rec',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Dipak', phone: '515-984-3092', email: 'dipak.qubehotel@gmail.com', address: '300 Boulder Pointe, Polk City, IA, 50226' }
  },
  {
    slug: 'raising-readers-in-the-heartland',
    name: 'Raising Readers in the Heartland',
    category: 'nonprofit',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { email: 'questions@rrith.org', web: 'https://www.rrith.org', address: '5820 NW 142nd Avenue, Polk City, IA, 50226' }
  },
  {
    slug: 'restoration1-of-des-moines',
    name: 'Restoration1 of Des Moines',
    category: 'home',
    tier: 'basic',
    city: 'Grimes',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Claire', phone: '515-518-7971', email: 'claire@restoration1.com', web: 'https://restoration1.com/des-moines', address: '200 SE 37th St, Suite 280, Grimes, IA, 50111' }
  },
  {
    slug: 'roof-iowa',
    name: 'Roof Iowa',
    category: 'home',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Emily', phone: '515-612-3889', email: 'emily@roofiowa.com', web: 'https://www.roofiowa.com', address: 'PO Box 1345, Ankeny, IA, 50021' }
  },
  {
    slug: 'rush-rolloffs',
    name: 'Rush Rolloffs',
    category: 'home',
    tier: 'basic',
    city: 'Johnston',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-344-3437', email: 'info@rushrolloffs.com', web: 'https://rushrolloffs.com', address: '8805 Chambery Blvd, Suite 300 PMB 21, Johnston, IA, 50131' }
  },
  {
    slug: 'shane-torres-remax-concepts-vantage-team',
    name: 'Shane Torres, REMAX Concepts Vantage Team',
    category: 'realestate',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Shane Torres', phone: '515-984-0222', email: 'shanetorres@remax.net', address: '905 W Bridge Road, Polk City, IA, 50226' }
  },
  {
    slug: 'sherwin-williams-paint-store',
    name: 'Sherwin-Williams Paint Store',
    category: 'retail',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-964-7890', web: 'https://www.sherwinwilliams.com', address: '817 E 1st Street, Ankeny, IA, 50021' }
  },
  {
    slug: 'snaadt-media-group',
    name: 'Snaadt Media Group',
    category: 'services',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Ryan Snaadt', phone: '319-470-6877', email: 'ryan@snaadtmedia.com', address: '203 N. 3rd St. Suite H, Polk City, IA, 50226' }
  },
  {
    slug: 'snyder-and-associates',
    name: 'Snyder & Associates Inc.',
    category: 'home',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-964-2020', web: 'https://www.snyder-associates.com', address: '2727 SW Snyder Blvd., Ankeny, IA, 50023' }
  },
  {
    slug: 'susie-sheldahl-realty-one-group-impact',
    name: 'Susie Sheldahl, Realty One Group Impact',
    category: 'realestate',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Susie Sheldahl', phone: '515-419-1620', email: 'susie@susiesheldahl.com', address: '113 W Broadway, Polk City, IA, 50226' }
  },
  {
    slug: 'teresa-harold-good-trip-travel',
    name: 'Teresa Harold, Good Trip Travel Co.',
    category: 'services',
    tier: 'basic',
    city: 'Slater',
    summary: '',   // TODO one plain sentence about what they do
    contact: { person: 'Teresa Harold', phone: '515-201-9480', email: 'teresa@goodtrip.biz', web: 'https://www.goodtrip.biz/teresa', address: 'Slater, IA' }
  },
  {
    slug: 'that-concierge-girl',
    name: 'That Concierge Girl',
    category: 'services',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-855-6121', email: 'service@thatconciergegirl.com', web: 'https://www.thatconciergegirl.com', address: 'Ankeny, IA' }
  },
  {
    slug: 'tournament-club-of-iowa',
    name: 'Tournament Club of Iowa',
    category: 'rec',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-9440', email: 'info@tcofiowa.com', web: 'https://tcofiowa.com', address: '1000 Tradition Dr., Polk City, IA, 50226' }
  },
  {
    slug: 'triplett-westendorf-financial-group',
    name: 'Triplett-Westendorf Financial Group LLC',
    category: 'insurance',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { email: 'info@triplett-westendorf.com', web: 'https://www.triplett-westendorf.com', address: '7040 NE 14th Street, Suite 103, Ankeny, IA, 50023' }
  },
  {
    slug: 'wellform-md',
    name: 'Wellform MD',
    category: 'health',
    tier: 'basic',
    city: 'Ankeny',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-717-7648', web: 'https://www.wellformmd.com', address: '2675 N Ankeny Blvd, Suite 113, Ankeny, IA, 50023' }
  },
  {
    slug: 'whatcha-smokin-bbq-brew',
    name: 'Whatcha Smokin? BBQ + Brew',
    category: 'food',
    tier: 'basic',
    city: 'Luther',
    summary: '',   // TODO one plain sentence about what they do
    contact: { email: 'whatchasmokin21@gmail.com', address: '403 Iowa Avenue, Luther, IA, 50152' }
  },
  {
    slug: 'yellow-brick-road-early-childhood-development-center',
    name: 'Yellow Brick Road Early Childhood Development Center',
    category: 'family',
    tier: 'basic',
    city: 'Polk City',
    summary: '',   // TODO one plain sentence about what they do
    contact: { phone: '515-984-6147', web: 'https://www.ybrecdc.org', address: '415 W Bridge Rd., Polk City, IA, 50226' }
  }
];
