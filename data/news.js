/* ==========================================================================
   NEWS AND MEMBER SPOTLIGHTS

   Two things share this file because they are the same shape: something the
   chamber wrote, on a date, with its own page.

   A spotlight is the benefit Pro and Premier members are promised. If this
   list is empty a year from now, that benefit is not being delivered, and
   the emptiness of this page is the evidence.

   Fields:
     slug     permanent web address. Never change it once published.
     date     YYYY-MM-DD
     kind     'spotlight' | 'news'
     title    plain, not clever. It has to work as a link on Facebook.
     summary  one sentence. Shows in the list and in the share preview.
     member   optional slug from members.js. Links the post to their page.
     body     array of paragraphs. Plain text, no HTML.
   ========================================================================== */

export const POSTS = [
  {
    slug: 'why-the-chamber-rebuilt-its-website',
    date: '2026-09-02',
    kind: 'news',
    title: 'Why the chamber rebuilt its website',
    summary: 'The old member directory was invisible to search engines. That was costing members business.',
    body: [
      'If you searched for a Polk City business by what it does, the chamber directory did not come up. Not low down. Not at all.',
      'The reason is technical and boring. The old directory loaded its listings after the page opened, using a script. A person sees the list. A search engine sees an empty page and moves on. Sixty-seven member businesses were sitting behind a door that Google could not open.',
      'The new site gives every member a page of its own at its own address, written into the page before anything loads. That is the whole change. It is not glamorous and it is the single most useful thing the chamber can do for a member who paid for a listing.',
      'Everything that was on the old site is still reachable. Old links and bookmarks redirect to the right place rather than breaking.'
    ]
  },
  {
    slug: 'member-spotlight-sample-hr-partners',
    date: '2026-08-19',
    kind: 'spotlight',
    title: 'Member spotlight: Sample HR Partners',
    summary: 'A one-person firm doing the employment paperwork that small employers put off until something goes wrong.',
    member: 'sample-hr-partners',
    body: [
      'Most businesses in the chamber are too small to employ an HR person and big enough that not having one is a problem. That gap is the whole business.',
      'The work is unglamorous. Handbooks that match what a business actually does rather than what a template says. Hiring that does not create a discrimination claim. Keeping up with Iowa wage and leave rules, which change more often than employers expect.',
      'The advice for a business with fewer than ten employees: the handbook matters less than writing down how you handle time off before somebody asks. Most disputes come from a rule that was never written down and then got applied unevenly.'
    ]
  },
  {
    slug: 'luncheon-registration-moves-online',
    date: '2026-08-05',
    kind: 'news',
    title: 'Luncheon registration is online, and it matters more than it sounds',
    summary: 'The kitchen builds the food order off the registration list, so late sign-ups mean somebody does not eat.',
    body: [
      'Registration for the monthly luncheon happens through the club, ahead of the date, and includes picking a meal.',
      'This is not a formality. The kitchen prepares to the list. Someone who turns up without registering is not a small inconvenience, they are a meal that was never made.',
      'Guests are welcome. Bring somebody who is thinking about joining. The luncheon is the least demanding way to find out whether the chamber is worth the dues.'
    ]
  }
];
