/* ==========================================================================
   JOB BOARD

   Members post openings here. Nobody else does.

   Every posting has a closes date and disappears from the site the day
   after. That is deliberate. A job board full of filled positions is worse
   than no job board, and it is the failure mode of every one of these that
   a chamber has ever run.

   Fields:
     id       anything unique. Used for the web address.
     member   slug from members.js. The employer must be a member.
     title    the job title, as they would advertise it
     type     'Full time' | 'Part time' | 'Seasonal' | 'Contract'
     pay      free text. Encourage a real number, it doubles applications.
     summary  one plain sentence
     detail   optional paragraph
     apply    { label, href } either a mailto or their careers page
     posted   YYYY-MM-DD
     closes   YYYY-MM-DD. After this it drops off automatically.
   ========================================================================== */

export const JOBS = [
  {
    id: 'hvac-service-tech',
    member: 'sample-heating-cooling',
    title: 'HVAC service technician',
    type: 'Full time',
    pay: '$28 to $36 an hour depending on certification',
    summary: 'Service and installation work on residential and light commercial systems.',
    detail: 'EPA certification required. Company van, tools provided, and an on-call rotation roughly one week in four.',
    apply: { label: 'Apply by email', href: 'mailto:hello@example.com?subject=HVAC%20service%20technician' },
    posted: '2026-08-24',
    closes: '2026-10-15'
  },
  {
    id: 'front-desk-childcare',
    member: 'sample-learning-center',
    title: 'Assistant teacher, preschool room',
    type: 'Full time',
    pay: '$17 to $19 an hour',
    summary: 'Working with three and four year olds alongside a lead teacher.',
    detail: 'No early childhood credential required to start. The centre pays for the CDA credential after six months.',
    apply: { label: 'Apply by email', href: 'mailto:hello@example.com?subject=Assistant%20teacher' },
    posted: '2026-08-30',
    closes: '2026-11-01'
  },
  {
    id: 'seasonal-snow-crew',
    member: 'sample-lawn-and-landscape',
    title: 'Seasonal snow removal crew',
    type: 'Seasonal',
    pay: '$22 an hour, plus call-out premium',
    summary: 'Overnight and early morning snow clearing on commercial properties from November through March.',
    detail: 'Valid driver licence required. Hours are unpredictable by nature, which is the job. Good fit for someone with daytime commitments.',
    apply: { label: 'Call to apply', href: 'tel:5155550112' },
    posted: '2026-09-01',
    closes: '2026-11-30'
  }
];
