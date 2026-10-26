/* ==========================================================================
   THE TWO PUBLIC FORMS

   The join form (/join/) and the add-an-event form send here. Each
   submission is emailed to the chamber through Resend, with Reply-To set
   to whoever filled it in, so hitting Reply answers them. They get a short
   copy of what they sent.

   It lives inside /api/track rather than its own function because Vercel
   Hobby allows 12 functions and the site is at 11. data/site.js points
   formEndpoint at /api/track?form=1.

   WHERE IT GOES

   FORMS_TO in Vercel, one address or several separated by commas. Without
   it, the chamber's own address from data/site.js.

   IF EMAIL IS NOT SET UP

   It answers 503 and the page falls back to opening an email with the
   answers filled in, so nothing typed is lost.
   ========================================================================== */

import { JOIN_FORM, EVENT_FORM } from '../../data/forms.js';
import { SITE } from '../../data/site.js';
import { sendMail, mailMissing } from './mail.js';
import { kvBump, storeReady } from './store.js';
import { visitorKey } from './adminauth.js';

const FORMS = { join: JOIN_FORM, event: EVENT_FORM };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formsTo = () => {
  const list = String(process.env.FORMS_TO || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : [SITE.email];
};

/* Urlencoded bodies arrive parsed. Anything else, parse it here. */
function fields(body) {
  if (body && typeof body === 'object') return body;
  const s = String(body || '');
  try { return JSON.parse(s); } catch {}
  return Object.fromEntries(new URLSearchParams(s));
}

const clean = (v, max) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
const oneLine = s => s.replace(/\s+/g, ' ');

export async function handleForm(req, res, raw) {
  const body = fields(raw);

  /* The hidden field a person never sees. A bot fills it in. Say thanks
     and send nothing. */
  if (clean(body._gotcha, 200)) { res.status(200).json({ ok: true }); return; }

  const form = FORMS[clean(body._form, 20)];
  if (!form) { res.status(400).json({ error: 'no_form', message: 'That form is not one this site has.' }); return; }

  if (mailMissing().length) {
    res.status(503).json({ error: 'not_configured', message: 'Email is not set up yet.' });
    return;
  }

  if (storeReady() && await kvBump(`rl:form:${visitorKey(req)}`, 3600) > 5) {
    res.status(429).json({ error: 'slow_down', message: `Too many from here. Email ${SITE.email} instead.` });
    return;
  }

  const answers = [];
  for (const f of form.fields) {
    let v = f.type === 'checkbox' ? (body[f.id] ? 'Yes' : 'No') : clean(body[f.id], f.type === 'textarea' ? 3000 : 300);
    if (f.type !== 'textarea') v = oneLine(v);
    if (f.required && !v) {
      res.status(400).json({ error: 'missing', message: `${f.label} is required.` });
      return;
    }
    if (v) answers.push({ label: f.label, value: v });
  }

  const email = oneLine(clean(body.email, 120)).toLowerCase();
  if (!EMAIL.test(email)) {
    res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
    return;
  }

  const name = answers.find(a => a.label === 'Business name' || a.label === 'Event name');
  const subject = form.subject + (name ? ': ' + name.value.slice(0, 80) : '');
  const listed = answers.map(a => `${a.label}: ${a.value}`).join('\n');

  /* Said first, in plain words, because this lands in an inbox among
     everything else and comes from an address nobody recognizes. */
  const who = answers.find(a => /name/i.test(a.label) && a !== name);
  const intro = `Someone filled in the ${form.subject.toLowerCase()} form on the chamber website.\n`
    + `Hit Reply and your answer goes straight to them${who ? ', ' + who.value : ''} at ${email}.\n`;

  await sendMail({
    to: formsTo(),
    subject: 'Website form: ' + subject,
    text: `${intro}\n${listed}\n\nSent automatically by ${SITE.url}.`,
    headers: { 'Reply-To': email }
  });

  /* Their copy is a nicety. If it fails, the chamber still has it. */
  try {
    await sendMail({
      to: email,
      subject: `We got it: ${form.subject.toLowerCase()}`,
      text: `${form.after}\n\nHere is what you sent:\n\n${listed}\n\nAnything wrong? Reply to this email.\n\n${SITE.name}`,
      headers: { 'Reply-To': SITE.email }
    });
  } catch (err) { console.error('form copy to sender failed', err, err.detail || ''); }

  res.status(200).json({ ok: true });
}
