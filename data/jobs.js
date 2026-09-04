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
  /* Empty on purpose. The demo postings were removed when the real member
     directory went in, because a made-up vacancy attached to a real named
     employer is not a placeholder, it is a false statement about somebody
     else's business.

     Add real ones as members send them. The page handles an empty list. */
];
