/* ==========================================================================
   REFERRALS

   The Business Policy Center tells a member what changed and what it means.
   The obvious next question is "who do I call about this", and this is the
   answer. Referral exclusivity is a Basic Business benefit, so being named
   here is something members are paying for.

   Two reasons this matters more than it looks:

   1. It is the benefit hardest for a bigger chamber to copy. Any chamber
      can offer a directory listing. Being the named referral only works
      when the list is short.

   2. It is honest about gaps. A category with no member says so. Pointing
      a member at nobody costs the chamber the credibility the Policy
      Centre is built on, and an admitted gap doubles as a recruiting line.

   Fields:
     id        stable identifier
     need      the situation a member is in, written as they would say it
     members   slugs from members.js. Order is the order shown.
     gap       true if the chamber has nobody in this category
     note      optional line about what to expect
   ========================================================================== */

export const REFERRALS = [
  {
    id: 'lending',
    need: 'I need financing or an SBA loan',
    members: ['home-state-bank', 'grinnell-state-bank', 'luana-savings-bank'],
    note: 'Three member banks. Ask more than one, because small business lending appetites differ more than the rates do.'
  },
  {
    id: 'insurance',
    need: 'I need to check my coverage',
    members: ['cupp-insurance', 'cullen-and-associates-insurance-services', 'corey-hoodjer-farm-bureau-financial-services'],
    note: 'Worth a review if your coverage predates a build-out or a change in headcount.'
  },
  {
    id: 'accounting',
    need: 'I need help with taxes or bookkeeping',
    members: [],
    gap: true,
    note: 'The chamber has no accountant or CPA in membership, so there is nobody to point you at. If you are one, this category is open and it is the most asked-for referral the chamber cannot fill.'
  },
  {
    id: 'legal',
    need: 'I need a business attorney',
    members: [],
    gap: true,
    note: 'No attorney in membership either. Another open category.'
  },
  {
    id: 'employment',
    need: 'I need to hire, fire, or write a handbook',
    members: ['hr-approach'],
    note: 'Works with employers too small to staff an HR person.'
  },
  {
    id: 'childcare',
    need: 'My staff need child care',
    members: ['yellow-brick-road-early-childhood-development-center'],
    note: 'Licensed centre in Polk City.'
  },
  {
    id: 'property',
    need: 'I need space, or I am building something',
    members: ['knapp-properties', 'hbu-development', 'snyder-and-associates'],
    note: 'Commercial property, development, and the engineering side of a build.'
  },
  {
    id: 'marketing',
    need: 'I need to be seen by more people',
    members: ['snaadt-media-group', 'big-green-umbrella-media'],
    note: 'Media and marketing, including the local publications members already read.'
  },
  {
    id: 'venue',
    need: 'I need somewhere to hold an event',
    members: ['tournament-club-of-iowa'],
    note: 'Where the monthly luncheon and the golf tournament happen.'
  }
];
