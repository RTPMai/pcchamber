/* ==========================================================================
   WHAT THE ADMIN CAN EDIT

   Everything the admin shows is described here. Adding a field is a line in
   this file, not a change to the interface. If you add one, add it to the
   matching JSON too or existing entries will just show it blank.

   Field types
     text      one line
     textarea  a paragraph
     select    a fixed list, from options
     date      YYYY-MM-DD, shown as a date picker
     time      HH:MM, 24 hour
     url       validated as a web address
     email
     tel
     check     a yes or no
     list      several short strings, one per line
     members   pick chamber members from the directory

   derive builds a value automatically when somebody adds a new entry, so
   they never have to fill in a reference or a web address by hand. It only
   runs on add, never on an existing entry, because these become permanent
   web addresses the moment they are published.

   help is the sentence under the label. Write it for somebody who has never
   done this before, and say what happens as a result of the choice, not what
   the field is called.
   ========================================================================== */

/* Turns a name into something safe for a web address. Same rules the
   directory importer uses, so a business added here and a business added
   from a spreadsheet end up with the same shape of address. */
export const slug = s => String(s).toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/['\u2019`.,]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-(llc|inc|co|corp|ltd|pc|pllc|lc)$/g, '')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

export const COLLECTIONS = [
  {
    id: 'events',
    file: 'events.json',
    key: 'calendar',
    season: 'sun',
    title: 'Events',
    blurb: 'The luncheon, Coffee and Connections, and anything else with a date.',
    note: 'Events disappear from the site by themselves the day after they happen. You do not need to come back and delete them.',
    sort: 'date',
    label: e => e.title || 'Untitled event',
    sub: e => [e.date, e.where].filter(Boolean).join(' · '),
    fields: [
      { id: 'title', label: 'Event name', type: 'text', required: true },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'start', label: 'Start time', type: 'time', required: true,
        help: 'Local time, the time you would say out loud. The website works out the rest.' },
      { id: 'end', label: 'End time', type: 'time', required: true },
      { id: 'where', label: 'Venue name', type: 'text', required: true },
      { id: 'address', label: 'Full address', type: 'text',
        help: 'Goes into the calendar file, so it works in someone\u2019s phone maps.' },
      { id: 'venue', label: 'Is the venue a chamber member?', type: 'members', max: 1,
        help: 'If so, the event links to their directory page. Leave empty if not.' },
      { id: 'summary', label: 'What is it', type: 'textarea', required: true,
        help: 'One plain sentence. This is what people read before deciding to come.' },
      { id: 'detail', label: 'Anything else', type: 'textarea',
        help: 'Optional. A second paragraph for the things that need explaining.' },
      { id: 'cost', label: 'Cost', type: 'text',
        help: 'Write "Free" if it is free. Leaving it blank makes people assume it is not.' },
      { id: 'rsvpLabel', label: 'Button text', type: 'text', path: 'rsvp.label',
        help: 'For example, Register. Leave both this and the link empty for no button.' },
      { id: 'rsvpHref', label: 'Button link', type: 'url', path: 'rsvp.href' },
      { id: 'audience', label: 'Who can come', type: 'select', options: ['public', 'members'],
        labels: { public: 'Anyone', members: 'Members only' } },
      { id: 'season', label: 'Colour', type: 'select', options: ['sun', 'autumn', 'spring', 'winter'],
        labels: { sun: 'Orange', autumn: 'Brown', spring: 'Green', winter: 'Blue' },
        help: 'Cosmetic. Keeps the luncheons looking like each other.' },
      { id: 'id', label: 'Reference', type: 'text', required: true, advanced: true,
        derive: e => slug(`${e.title || 'event'}-${e.date || ''}`),
        help: 'Filled in for you from the name and date. Used for the calendar file. Never reuse one.' }
    ]
  },

  {
    id: 'members',
    file: 'members.json',
    key: 'members',
    season: 'spring',
    title: 'Member directory',
    blurb: 'All 61 businesses, their contact details, and the sentence describing what they do.',
    note: 'Slugs are permanent. Once a page is public and search engines have found it, changing the slug breaks every link pointing at it.',
    sort: 'name',
    label: m => m.name,
    sub: m => [m.summary ? null : 'No description yet', m.city].filter(Boolean).join(' · '),
    flag: m => !m.summary,
    flagNote: 'Needs a sentence',
    fields: [
      { id: 'name', label: 'Business name', type: 'text', required: true },
      { id: 'summary', label: 'What they do', type: 'textarea',
        help: 'One plain sentence, as they would say it. This shows in the list. Ask the member rather than guessing.' },
      { id: 'about', label: 'Longer description', type: 'textarea',
        help: 'Optional. A paragraph on their own page.' },
      { id: 'category', label: 'Category', type: 'select', from: 'categories', required: true },
      { id: 'tier', label: 'Membership level', type: 'select', options: ['basic', 'pro', 'premier'],
        labels: { basic: 'Member', pro: 'Pro member', premier: 'Premier member' } },
      { id: 'city', label: 'Town', type: 'text' },
      { id: 'person', label: 'Contact name', type: 'text', path: 'contact.person' },
      { id: 'phone', label: 'Phone', type: 'tel', path: 'contact.phone' },
      { id: 'email', label: 'Email', type: 'email', path: 'contact.email' },
      { id: 'web', label: 'Website', type: 'url', path: 'contact.web' },
      { id: 'address', label: 'Address', type: 'text', path: 'contact.address' },
      { id: 'serves', label: 'What they offer', type: 'list',
        help: 'One per line. Shows as tags on their page. Optional.' },
      { id: 'access', label: 'Who can sign in as this member', type: 'list',
        help: 'One email address per line. Anybody listed can sign in as this business. Add each person who needs access, not just a shared inbox. Left empty, the contact email above is used.' },
      { id: 'logo', label: 'Logo file', type: 'text',
        help: 'Optional, for example /assets/members/their-slug.svg. Without one they get their initial.' },
      { id: 'slug', label: 'Web address', type: 'text', required: true, advanced: true,
        derive: m => slug(m.name || ''),
        help: 'Filled in from the business name. Their page is at /directory/this/. Do not change it once the site is live.' }
    ]
  },

  {
    id: 'jobs',
    file: 'jobs.json',
    key: 'jobs',
    season: 'spring',
    title: 'Job board',
    blurb: 'Openings at member businesses. Free for members to post.',
    note: 'A posting comes off the site on its own the day after it closes. Only post jobs a member has actually sent you.',
    sort: 'posted',
    label: j => j.title,
    sub: j => [j.type, j.closes ? 'closes ' + j.closes : null].filter(Boolean).join(' · '),
    fields: [
      { id: 'title', label: 'Job title', type: 'text', required: true },
      { id: 'member', label: 'Which member is hiring', type: 'members', max: 1, required: true },
      { id: 'type', label: 'Type', type: 'select', options: ['Full time', 'Part time', 'Seasonal', 'Contract'] },
      { id: 'pay', label: 'Pay', type: 'text',
        help: 'Put a real number. Postings without one get a fraction of the applications.' },
      { id: 'summary', label: 'What the job is', type: 'textarea', required: true },
      { id: 'detail', label: 'Anything else', type: 'textarea' },
      { id: 'applyLabel', label: 'Button text', type: 'text', path: 'apply.label' },
      { id: 'applyHref', label: 'How to apply', type: 'text', path: 'apply.href',
        help: 'A web address, or mailto:someone@example.com, or tel:5155550000' },
      { id: 'posted', label: 'Date posted', type: 'date', required: true },
      { id: 'closes', label: 'Closing date', type: 'date', required: true,
        help: 'It comes off the site the day after this.' },
      { id: 'id', label: 'Reference', type: 'text', required: true, advanced: true,
        derive: j => slug(`${j.title || 'job'}-${j.posted || ''}`),
        help: 'Filled in for you. Never reuse one.' }
    ]
  },

  {
    id: 'news',
    file: 'news.json',
    key: 'posts',
    season: 'autumn',
    title: 'News and spotlights',
    blurb: 'Chamber news, and the member spotlights that Pro and Premier members are promised.',
    note: 'If this page is empty a year from now, the spotlight benefit is not being delivered and members can see that.',
    sort: '-date',
    label: p => p.title,
    sub: p => [p.date, p.kind === 'spotlight' ? 'Spotlight' : 'News'].join(' · '),
    fields: [
      { id: 'title', label: 'Headline', type: 'text', required: true,
        help: 'Plain, not clever. It has to work as a link on Facebook.' },
      { id: 'kind', label: 'Type', type: 'select', options: ['news', 'spotlight'],
        labels: { news: 'Chamber news', spotlight: 'Member spotlight' } },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'summary', label: 'One sentence', type: 'textarea', required: true,
        help: 'Shows in the list and in the preview when somebody shares it.' },
      { id: 'member', label: 'Which member', type: 'members', max: 1,
        help: 'For a spotlight. Links the post to their directory page.' },
      { id: 'body', label: 'The post', type: 'list', required: true,
        help: 'One paragraph per line. Leave a blank line between them if it helps you read it.' },
      { id: 'slug', label: 'Web address', type: 'text', required: true, advanced: true,
        derive: p => slug(p.title || ''),
        help: 'Filled in from the headline. The post lives at /news/this/. Do not change it after publishing.' }
    ]
  },

  {
    id: 'board',
    file: 'board.json',
    key: 'board',
    season: 'navy',
    title: 'Board of directors',
    blurb: 'Who is on the board, and the open positions.',
    note: 'Photos go in assets/board/ and are prepared with tools/board-photos.py. Ask for help with that part.',
    label: b => b.name,
    sub: b => [b.role, b.business].filter(Boolean).join(' · '),
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'role', label: 'Role', type: 'text', required: true,
        help: 'President, Treasurer, Director, and so on.' },
      { id: 'business', label: 'Business', type: 'text',
        help: 'Or "Community member" for somebody not representing a business.' },
      { id: 'member', label: 'Their chamber listing', type: 'members', max: 1,
        help: 'If their business is a member, their name links to its directory page.' },
      { id: 'photo', label: 'Photo file', type: 'text',
        help: 'The filename in assets/board/ without .webp, for example shawn. Blank shows their initial.' },
      { id: 'vacant', label: 'This position is open', type: 'check',
        help: 'Shows as a dashed card. Leaving a vacancy visible is how it gets filled.' }
    ]
  },

  {
    id: 'referrals',
    file: 'referrals.json',
    key: 'referrals',
    season: 'winter',
    title: 'Who to call',
    blurb: 'The members the chamber names when somebody asks who to use.',
    note: 'Referral exclusivity is a paid benefit. Who gets named here is a board decision, not an administrative one.',
    label: r => r.need,
    sub: r => r.gap ? 'Nobody in membership' : `${(r.members || []).length} named`,
    fields: [
      { id: 'need', label: 'The situation', type: 'text', required: true,
        help: 'Write it the way a member would say it. "I need to check my coverage", not "Insurance".' },
      { id: 'members', label: 'Who gets named', type: 'members',
        help: 'In the order you want them shown.' },
      { id: 'gap', label: 'The chamber has nobody for this', type: 'check',
        help: 'Says so plainly on the page. Better than pointing someone at nobody, and it doubles as a recruiting line.' },
      { id: 'note', label: 'What to expect', type: 'textarea' },
      { id: 'id', label: 'Reference', type: 'text', required: true, advanced: true,
        derive: r => slug(r.need || ''),
        help: 'Filled in for you.' }
    ]
  }
];
