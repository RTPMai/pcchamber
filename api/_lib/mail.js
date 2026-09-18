/* ==========================================================================
   SENDING EMAIL

   Everything goes through Resend, with the same two settings the password
   emails already use:

     RESEND_API_KEY      from resend.com
     MEMBER_EMAIL_FROM   for example Polk City Area Chamber <hello@polkcitychamber.com>
                         on a domain verified in Resend

   Resend's free plan is 100 emails a day and 3,000 a month. The quarterly
   member email and a newsletter to a few hundred people fit inside that.
   A newsletter to more than 100 people in one day does not, and needs the
   paid plan or sending over two days. The newsletter screen says so before
   anything goes out.
   ========================================================================== */

export function mailMissing() {
  return [
    !(process.env.RESEND_API_KEY || '').trim() && 'RESEND_API_KEY',
    !(process.env.MEMBER_EMAIL_FROM || '').trim() && 'MEMBER_EMAIL_FROM'
  ].filter(Boolean);
}

const from = () => (process.env.MEMBER_EMAIL_FROM || '').trim();
const key = () => (process.env.RESEND_API_KEY || '').trim();

async function resend(path, payload) {
  const res = await fetch('https://api.resend.com' + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw Object.assign(new Error('The email could not be sent.'), { status: 502, detail: await res.text() });
  }
  return res.json();
}

/* One message. to can be one address or several. */
export function sendMail({ to, subject, text, html, headers }) {
  return resend('/emails', {
    from: from(),
    to: Array.isArray(to) ? to : [to],
    subject, text,
    ...(html ? { html } : {}),
    ...(headers ? { headers } : {})
  });
}

/* Many different messages, up to 100 per call to Resend. Each one gets
   its own unsubscribe link, which is why they are separate messages and
   not one email with everybody in BCC. */
export async function sendMany(messages) {
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map(m => ({
      from: from(),
      to: Array.isArray(m.to) ? m.to : [m.to],
      subject: m.subject, text: m.text,
      ...(m.html ? { html: m.html } : {}),
      ...(m.headers ? { headers: m.headers } : {})
    }));
    await resend('/emails/batch', chunk);
    sent += chunk.length;
  }
  return sent;
}

/* Plain, safe HTML escaping for the few emails that have an HTML part. */
export const escHtml = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
