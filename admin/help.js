/* ==========================================================================
   ADMIN HELP

   The how-tos behind the Help button at the top of every admin screen.
   Plain steps for the jobs that come up, so whoever is running the admin
   can do them without asking anybody.

   EDITING THIS FILE
   Each topic is one entry below. To change wording, change the text and
   keep the quotes and commas as they are. To add a topic, copy one whole
   entry, from its { to its }, and change it.

     title     what somebody would want to do, said the way they would say it
     screens   which admin screens it belongs to. Help opens with these
               topics at the top. The names are what shows after the # in
               the address bar: calendar, members, deals, jobs, posts,
               board, referrals, events, benefits, dues, newsletter,
               message, digest. An empty string means the home screen.
     words     extra words people might search for that are not in the title
     steps     one line each, in order
     note      optional. Anything worth knowing that is not a step.

   If a button gets renamed in the admin, rename it here too.
   ========================================================================== */

export const HELP_INTRO = 'Pick what you are trying to do. Topics for the screen you are on are at the top.';

export const HELP_STUCK = 'Every save is recorded with your name and the date, so a mistake can always be put back. If something still will not work, write down what you pressed and what it said, and pass that on.';

export const HELP = [

  /* ---------- the basics ---------- */

  {
    title: 'How saving works',
    screens: ['', 'calendar', 'members', 'deals', 'jobs', 'posts', 'board', 'referrals'],
    words: 'save keep publish live not showing changes lost',
    steps: [
      'Open an entry and make your changes.',
      'Press Keep changes (or Add it, for something new). This holds the change but does not publish it yet.',
      'Back on the list, press Save changes. "Not saved yet" next to it means you still need to.',
      'The website rebuilds itself. The change is live in about a minute.'
    ],
    note: 'If you reload the website straight away and do not see the change, wait a minute and reload again. It is not broken. Leaving a section without saving throws your changes away, and the admin warns you first.'
  },

  {
    title: 'Find something in a long list',
    screens: ['calendar', 'members', 'deals', 'jobs', 'posts', 'referrals', 'benefits', 'events'],
    words: 'search filter look up',
    steps: [
      'Type in the search box above the list. It matches names, contact people, emails, towns, anything in the entry.',
      'If only one thing matches, press Enter to open it.'
    ]
  },

  /* ---------- events ---------- */

  {
    title: 'Add an event to the calendar',
    screens: ['', 'calendar'],
    words: 'new event calendar date add schedule',
    steps: [
      'From the home screen, open Events.',
      'Press Add new.',
      'Fill in the event name, date, start and end time, venue name, and the one sentence under "What is it".',
      'Add the full address so it works in phone maps.',
      'Fill in Cost. Write "Free" if it is free; a blank cost makes people assume it is not.',
      'If people sign up somewhere else, put that link in Button link and a word like "Register" in Button text. Leave both empty for no button.',
      'Press Add it, then Save changes.'
    ],
    note: 'The Google, Outlook and calendar file links are made for you. Leave the Reference box alone; it fills itself in.'
  },

  {
    title: 'Change or cancel an event',
    screens: ['calendar'],
    words: 'edit move reschedule cancel delete remove postpone',
    steps: [
      'Open Events and find the event.',
      'To change it: open it, edit, press Keep changes, then Save changes.',
      'To cancel it: press Remove on its row, then Save changes.'
    ],
    note: 'Do not change the Reference on an event that is already out there. Anyone who added it to their calendar is tied to it.'
  },

  {
    title: 'Set up a luncheon with the guest fee',
    screens: ['calendar', 'events'],
    words: 'luncheon lunch tci tournament club guest fee non-member price $10 $20 stripe',
    steps: [
      'Open Events and press Add new.',
      'Button link: the club\'s registration page. Button text: Register.',
      'Cost: the lunch price the club charges, for example $20.',
      'Guest fee for non-members: 10.',
      'Tick "Luncheon tickets can be used".',
      'Leave "Take registrations on this site" off. People register with the club.',
      'Press Add it, then Save changes.'
    ],
    note: 'The website then shows members the lunch price and guests the total (lunch plus the guest fee), and explains who gets paid what. Members sign in and go straight to the club. Guests pay the chamber online first, then get the club\'s link by email.'
  },

  {
    title: 'Take sign-ups on the website instead',
    screens: ['calendar', 'events'],
    words: 'register registration rsvp sign up capacity full limit',
    steps: [
      'Open the event under Events.',
      'Tick "Take registrations on this site".',
      'If space is limited, put a number in "How many people fit". Sign-ups close when it is full, counting guests.',
      'Press Keep changes, then Save changes.',
      'See who signed up under Event check-in.'
    ]
  },

  {
    title: 'Check people in at an event',
    screens: ['', 'events'],
    words: 'check in door attendance who came headcount walk in',
    steps: [
      'From the home screen, open Event check-in and pick the event.',
      'Press Check in next to each person as they arrive. Undo puts them back.',
      'Somebody not on the list: type their name under "Add at the door" (start typing to pick a member) and press Add and check in.',
      'At the end, press Download the list for a spreadsheet of who registered and who came.'
    ]
  },

  {
    title: 'Somebody is coming on a member\'s luncheon ticket',
    screens: ['events', 'benefits'],
    words: 'ticket luncheon ticket prepaid guest of member',
    steps: [
      'Open the luncheon under Event check-in.',
      'Under "Add at the door", pick the member, tick "On this member\'s luncheon ticket", and type the guest\'s name.',
      'Press Add and check in. The ticket is logged against that member automatically.',
      'If the person is already on the list, tick the ticket box on their row before pressing Check in.'
    ]
  },

  /* ---------- members ---------- */

  {
    title: 'Add a new member',
    screens: ['', 'members'],
    words: 'new member join joined add business signup',
    steps: [
      'From the home screen, open Member directory.',
      'Press Add new.',
      'Fill in the business name, category and membership level.',
      'If they are Basic Business, set "Size, for dues". Their dues invoice cannot go out without it.',
      'Add the contact name and email. They cannot sign in without an email.',
      'Individual members who should not have a public page: tick "Keep off the public directory".',
      'Press Add it, then Save changes.'
    ],
    note: 'Members can write their own description after they sign in, so you do not have to.'
  },

  {
    title: 'Change a member\'s listing',
    screens: ['members'],
    words: 'edit update phone email website address description logo level tier',
    steps: [
      'Open Member directory and search for them.',
      'Open their entry, make the change, press Keep changes, then Save changes.'
    ],
    note: 'Members can change most of this themselves after signing in. Do not change "Web address" under the hidden settings; it breaks every link to their page.'
  },

  {
    title: 'Approve or turn down a size request',
    screens: ['members', 'dues'],
    words: 'size request employees basic dues approve decline',
    steps: [
      'When a member asks for a size, a note shows at the top of Member directory.',
      'Search "size request" to find them, and open the member.',
      'Press Approve or Turn down. This saves straight away by itself.'
    ],
    note: 'Turning one down leaves their size as it was. They are not told, so let them know why.'
  },

  {
    title: 'Let another person sign in for a business',
    screens: ['members'],
    words: 'access login sign in second person employee owner email',
    steps: [
      'Open the member under Member directory.',
      'In "Who can sign in as this member", add their email on its own line.',
      'The first address is the owner. Move a different one to the top to change the owner.',
      'Press Keep changes, then Save changes.'
    ],
    note: 'The owner can also add and remove people from their own account page.'
  },

  {
    title: 'A member forgot their password',
    screens: ['members'],
    words: 'password forgot reset locked out cannot sign in login',
    steps: [
      'Send them to the member sign in page on the website.',
      'They press "First time, or forgotten it?" and get a link by email to choose a new password.',
      'If no email arrives, check their address is right in Member directory, and that the address is in "Who can sign in as this member" (or is the contact email, if that box is empty).'
    ],
    note: 'Nobody at the chamber sees or sets passwords. Too many wrong tries locks the address for a few minutes; waiting fixes it.'
  },

  {
    title: 'Load starter passwords for new members',
    screens: ['members'],
    words: 'starter password csv first sign in rollout',
    steps: [
      'Go to /admin/starters/ on the website.',
      'Pick the starters spreadsheet and press Check it.',
      'If it looks right, press Load them. Each member signs in with their starter password and is asked to choose their own.'
    ]
  },

  {
    title: 'Remove a member',
    screens: ['members'],
    words: 'delete remove quit left lapsed cancel membership',
    steps: [
      'Open Member directory and search for them.',
      'Press Remove on their row, then Save changes.'
    ],
    note: 'Their page comes off the website. If they might come back, consider ticking "Keep off the public directory" instead.'
  },

  {
    title: 'Download members for ChamberMaster',
    screens: ['members'],
    words: 'chambermaster export spreadsheet csv download',
    steps: [
      'Open Member directory.',
      'Press Download for ChamberMaster. It saves a spreadsheet in their import format.'
    ]
  },

  /* ---------- benefits and dues ---------- */

  {
    title: 'Log a benefit a member used',
    screens: ['', 'benefits'],
    words: 'benefit used log ticket spotlight track',
    steps: [
      'From the home screen, open Member benefits.',
      'Find the member and open them.',
      'Fill in the benefit they used and press Log it. It saves straight away.',
      'Made a mistake? Press Undo in the message that appears.'
    ],
    note: 'The member sees it on their account page right away. Luncheon tickets used at check-in are logged for you.'
  },

  {
    title: 'See who is not using their benefits',
    screens: ['benefits'],
    words: 'unused report summary download',
    steps: [
      'Open Member benefits.',
      'Filter by level and sort to see who has used the least.',
      'Use the download buttons for the year\'s summary or the full log.'
    ]
  },

  {
    title: 'Send dues invoices',
    screens: ['', 'dues'],
    words: 'dues invoice bill stripe pay renewal',
    steps: [
      'From the home screen, open Membership dues.',
      'Members under "Ready to invoice" can be sent one. Tick the ones you want, or use Send all ready.',
      'Confirm. Stripe emails each member a link to pay by card or bank, and sends reminders.',
      'Press Check Stripe now and then to update who has paid.'
    ],
    note: 'A member missing from "Ready" usually needs a size set (Basic Business) or an email. To cancel an invoice, void it in Stripe, then press Check Stripe.'
  },

  /* ---------- email ---------- */

  {
    title: 'Send the newsletter',
    screens: ['', 'newsletter'],
    words: 'newsletter email subscribers send blast',
    steps: [
      'From the home screen, open Newsletter.',
      'Write a subject line and a short opening. Events, news and new deals are filled in for you.',
      'Press Preview to see it.',
      'Press Send a test and check your inbox.',
      'Press the Send to button (it shows how many subscribers). It cannot be undone.'
    ],
    note: 'Use Download the subscriber list now and then to keep a copy.'
  },

  {
    title: 'Email all members, or just some',
    screens: ['', 'message'],
    words: 'email message members announcement restaurants sponsors group',
    steps: [
      'From the home screen, open Message to members.',
      'Tick the groups to send to, or tick nothing to send to every member.',
      'Write a subject and message. A blank line starts a new paragraph.',
      'Send a test to yourself first, then send. It cannot be undone.'
    ],
    note: 'This goes to members only, not the newsletter list.'
  },

  {
    title: 'The quarterly member email',
    screens: ['digest'],
    words: 'quarterly digest stats report email',
    steps: [
      'Open Quarterly member email from the home screen.',
      'The screen says whether it sends by itself. When automatic sending is on, it goes out on the 5th of January, April, July and October.',
      'To send it now, press Send to all members. Anyone who already got it this quarter is skipped.'
    ]
  },

  /* ---------- the other sections ---------- */

  {
    title: 'Post news or a member spotlight',
    screens: ['', 'posts'],
    words: 'news post article spotlight announcement blog',
    steps: [
      'Open News and spotlights and press Add new.',
      'Write the headline, pick news or spotlight, set the date, and write the one-sentence summary.',
      'For a spotlight, pick the member.',
      'Write the post. Each line in the box is a paragraph.',
      'Press Add it, then Save changes.'
    ]
  },

  {
    title: 'Post a job or take one down',
    screens: ['jobs'],
    words: 'job hiring opening position career',
    steps: [
      'Open Job board.',
      'To post: Add new, fill in the title, which member is hiring, what the job is, how to apply, and the dates. Add it, then Save changes.',
      'To take one down: Remove on its row, then Save changes.'
    ],
    note: 'Jobs come down by themselves after their closing date.'
  },

  {
    title: 'Fix or take down a member deal',
    screens: ['deals'],
    words: 'deal discount offer promo code coupon',
    steps: [
      'Open Member deals.',
      'Open the deal to fix it, or press Remove on its row to take it down.',
      'Save changes.'
    ],
    note: 'Members post and manage their own deals. Deals with an end date come down by themselves.'
  },

  {
    title: 'Update the board page',
    screens: ['board'],
    words: 'board directors officers president vacant open seat photo',
    steps: [
      'Open Board of directors.',
      'Open a person to change their role or business, or Add new for someone joining.',
      'For an open seat, tick "This position is open".',
      'Press Keep changes, then Save changes.'
    ]
  },

  {
    title: 'Change the "Who to call" list',
    screens: ['referrals'],
    words: 'referral who to call recommend plumber need',
    steps: [
      'Open Who to call.',
      'Open a situation to change which members are named, or Add new for a new one.',
      'If the chamber has nobody for it yet, tick "The chamber has nobody for this".',
      'Press Keep changes, then Save changes.'
    ]
  },

  /* ---------- when something is off ---------- */

  {
    title: 'It says something is "missing in Vercel" or not set up',
    screens: ['', 'dues', 'newsletter', 'message', 'digest', 'events'],
    words: 'error missing vercel not set up stripe resend broken setup',
    steps: [
      'Go to /setup/ on the website. It lists what is in place and what is missing.',
      'Those settings live in Vercel, not in the admin. Pass the list on to whoever looks after the website\'s hosting.'
    ]
  },

  {
    title: 'It said "Not saved"',
    screens: ['', 'calendar', 'members', 'deals', 'jobs', 'posts', 'board', 'referrals'],
    words: 'error failed not saved conflict',
    steps: [
      'Your changes are still there. Nothing is lost.',
      'Press Try again.',
      'If it fails again, somebody else may have saved the same section at the same time. Note your change, leave the section, open it again, and redo it.'
    ]
  }
];
