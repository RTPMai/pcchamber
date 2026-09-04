/* ==========================================================================
   FORMS

   Two forms: joining the chamber, and adding an event to the community
   calendar. Both post to SITE.formEndpoint.

   If that endpoint is empty, both forms turn themselves into an email
   link instead. Nothing breaks, it just falls back.

   Field types: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select'
                | 'date' | 'checkbox'
   ========================================================================== */

export const JOIN_FORM = {
  title: 'Join the chamber',
  lede: 'Tell us about the business. We will send an invoice and a short follow-up about how you want your directory listing written.',
  note: 'Nothing here commits you to anything. If you are not sure which level fits, leave it on "Not sure yet" and we will advise.',
  subject: 'Chamber membership application',
  submit: 'Send application',
  after: 'Thanks. Somebody will be back to you within two working days.',
  fields: [
    { id: 'business', label: 'Business name', type: 'text', required: true,
      help: 'If you are joining as an individual rather than a business, put your own name.' },
    { id: 'contact', label: 'Your name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone', type: 'tel' },
    { id: 'website', label: 'Website', type: 'url', help: 'Optional, but it goes on your directory page.' },
    { id: 'level', label: 'Which level', type: 'select', required: true,
      options: ['Not sure yet', 'Individual Membership', 'Basic Business', 'Community Partner',
                'Community Investor', 'Community Sponsor', 'Community Champion'] },
    { id: 'employees', label: 'How many employees', type: 'select',
      help: 'Basic Business is priced by headcount, so this decides what you pay.',
      options: ['Just me', 'Under 5', '5 to 15', '16 or more', 'We are a nonprofit'] },
    { id: 'does', label: 'What does the business do', type: 'textarea', required: true,
      help: 'A sentence or two. This becomes the first draft of your directory listing, so plain is better than polished.' },
    { id: 'heard', label: 'How did you hear about the chamber', type: 'text' }
  ]
};

export const EVENT_FORM = {
  title: 'Add an event to the calendar',
  lede: 'Open to anyone running something in the Polk City area. You do not have to be a member.',
  note: 'Events go up within a working day and come off the site automatically once the date has passed.',
  subject: 'Community event submission',
  submit: 'Submit event',
  after: 'Got it. It will be on the calendar within a working day.',
  fields: [
    { id: 'title', label: 'Event name', type: 'text', required: true },
    { id: 'date', label: 'Date', type: 'date', required: true },
    { id: 'time', label: 'Time', type: 'text', help: 'For example, 6:00 pm to 8:00 pm.' },
    { id: 'where', label: 'Where', type: 'text', required: true },
    { id: 'summary', label: 'What is it', type: 'textarea', required: true,
      help: 'One or two plain sentences. This is what people read before deciding to come.' },
    { id: 'cost', label: 'Cost', type: 'text', help: 'Put "Free" if it is free. Leaving it blank makes people assume it is not.' },
    { id: 'link', label: 'Link for tickets or more detail', type: 'url' },
    { id: 'contact', label: 'Your name', type: 'text', required: true },
    { id: 'email', label: 'Your email', type: 'email', required: true,
      help: 'Only so we can query anything. It does not go on the site.' },
    { id: 'member', label: 'This is a chamber member event', type: 'checkbox' }
  ]
};
