/* ==========================================================================
   REFERRALS

   The Business Policy Center tells a member what changed and what it means.
   The obvious next question is "who do I call about this", and the referral
   block is the answer. This file is the shared list behind both sites.

   Two reasons this matters more than it looks:

   1. It is the Pro tier benefit that is hardest to copy. Any chamber can
      offer a directory listing. Being the named referral for your category
      is exclusive by definition, and exclusivity is what makes a tier worth
      paying for.

   2. It is honest about gaps. A category with no member in it says so.
      Pretending otherwise sends a member to nobody and costs the chamber
      the credibility the Policy Center is built on.

   Fields:
     id        stable identifier
     need      the situation a member is in, written as they would say it
     members   slugs from members.js. Order is the order shown.
     gap       true if the chamber has nobody. Shows an honest note instead.
     note      optional line about what to expect
   ========================================================================== */

export const REFERRALS = [
  {
    id: 'lending',
    need: 'I need financing or an SBA loan',
    members: ['sample-community-bank', 'sample-credit-union'],
    note: 'Both handle small business lending. The bank does SBA paperwork in house.'
  },
  {
    id: 'insurance',
    need: 'I need to check my coverage',
    members: ['sample-insurance-agency'],
    note: 'Independent, so quotes come from several carriers. Worth a review if your coverage predates a build-out.'
  },
  {
    id: 'accounting',
    need: 'I need help with taxes or bookkeeping',
    members: [],
    gap: true,
    note: 'The chamber has no accountant or CPA in membership right now, so there is nobody to point you at. If you are one, this is an open category.'
  },
  {
    id: 'employment',
    need: 'I need to hire, fire, or write a handbook',
    members: ['sample-hr-partners'],
    note: 'Works with employers too small to staff an HR person.'
  },
  {
    id: 'childcare',
    need: 'My staff need child care',
    members: ['sample-learning-center'],
    note: 'Licensed, and works with employers on the state assistance and employer match programs.'
  },
  {
    id: 'property',
    need: 'I need space, or I am building something',
    members: ['sample-realty-group', 'sample-construction-co'],
    note: 'Leasing and build-out. The contractor pulls its own permits with the city.'
  },
  {
    id: 'legal',
    need: 'I need a business attorney',
    members: [],
    gap: true,
    note: 'No attorney in membership currently. Another open category.'
  }
];
