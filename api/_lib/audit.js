/* ==========================================================================
   THE CONTENT AUDIT

   A short list of what on the website has gone stale or was never filled
   in. Nobody has to remember to look: it arrives by email on the 1st of
   each month, and the same list sits at the top of the admin home screen.

   Every check is a question somebody would otherwise have to ask by
   clicking around. Each finding says what is wrong and where in the admin
   to fix it. An empty list means there is nothing to do, and the email
   says so in one line rather than not arriving, so a missing email means
   something is broken rather than that everything is fine.

   WHEN

   vercel.json runs /api/digest?job=audit at 9am Central on the 1st. It
   only sends if AUDIT_AUTO is set to on in Vercel, the same pattern as the
   quarterly member email.

   WHERE IT GOES

   AUDIT_TO in Vercel, one address or several separated by commas. Without
   it, the chamber's own address from data/site.js.

   ADDING A CHECK

   Add a function to CHECKS below. It gets the context and returns a
   finding, a list of findings, or nothing.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { kv, storeReady } from './store.js';
import { SITE } from '../../data/site.js';

const read = f => JSON.parse(readFileSync(new URL(`../../content/${f}`, import.meta.url), 'utf8'));
const days = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const ago = iso => Math.floor((Date.now() - new Date(iso + 'T12:00:00Z')) / 864e5);
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/* How long before each thing counts as stale. */
export const LIMITS = {
  calendarAhead: 30,   // days of events that should always be on the calendar
  newsQuiet: 45,       // days since the last news post
  newsletterQuiet: 35, // days since the last newsletter
  jobOld: 60,          // days a job can sit without a closing date passing
  newcomersCheck: 120  // days between checks of the New to Polk City list
};

const CHECKS = [

  /* Nothing on the calendar is the most visible sign of a dead site. */
  ({ events, today }) => {
    const ahead = days(LIMITS.calendarAhead);
    const soon = events.filter(e => e.date >= today && e.date <= ahead);
    const last = events.map(e => e.date).sort().pop();
    if (!soon.length) {
      return { level: 'high', where: 'Events', text: `Nothing on the calendar in the next ${LIMITS.calendarAhead} days.` };
    }
    if (!last || last < ahead) {
      return { level: 'medium', where: 'Events', text: `The calendar ends ${last}. Add what is coming after that.` };
    }
  },

  /* Events coming up that people cannot sign up for yet. */
  ({ events, today }) => events
    .filter(e => e.date >= today && e.date <= days(21) && !(e.rsvp && e.rsvp.href) && !e.register)
    .filter(e => /luncheon|trunk|mixer|golf|gala|dinner|tournament/i.test(e.title))
    .map(e => ({ level: 'medium', where: 'Events', text: `${e.title} on ${e.date} has no way to register.` })),

  ({ posts }) => {
    const last = posts.map(p => p.date).sort().pop();
    if (!last) return { level: 'medium', where: 'News', text: 'No news posts yet.' };
    const n = ago(last);
    if (n > LIMITS.newsQuiet) return { level: 'low', where: 'News', text: `Last news post was ${n} days ago.` };
  },

  ({ deals, today }) => {
    const gone = deals.filter(d => d.expires && d.expires < today);
    if (gone.length) {
      return { level: 'medium', where: 'Member deals', text: `${plural(gone.length, 'deal')} past the end date still listed: ${gone.map(d => d.title).join(', ')}.` };
    }
  },

  ({ jobs, today }) => jobs
    .filter(j => (j.closes && j.closes < today) || (j.posted && ago(j.posted) > LIMITS.jobOld))
    .map(j => ({ level: 'low', where: 'Job board', text: `${j.title} was posted ${j.posted} and looks finished. Remove it or update the closing date.` })),

  ({ members }) => {
    const out = [];
    const noSummary = members.filter(m => !m.summary);
    const noEmail = members.filter(m => !(m.contact && m.contact.email) && !(Array.isArray(m.access) && m.access.length));
    if (noSummary.length) {
      out.push({ level: noSummary.length > members.length / 4 ? 'high' : 'medium', where: 'Member directory',
        text: `${plural(noSummary.length, 'member')} of ${members.length} have no description.` });
    }
    if (noEmail.length) {
      out.push({ level: 'medium', where: 'Member directory',
        text: `${plural(noEmail.length, 'member')} have no email, so they cannot sign in or get member emails: ${noEmail.map(m => m.name).join(', ')}.` });
    }
    return out;
  },

  ({ newcomers }) => {
    if (!newcomers.checked) return { level: 'low', where: 'New to Polk City', text: 'The list has never been checked.' };
    const n = ago(newcomers.checked);
    if (n > LIMITS.newcomersCheck) {
      return { level: 'low', where: 'New to Polk City', text: `Last checked ${n} days ago. Utilities and contacts change.` };
    }
  },

  ({ newsletterLast }) => {
    if (!newsletterLast) return { level: 'low', where: 'Newsletter', text: 'No newsletter has been sent yet.' };
    const n = ago(newsletterLast.at.slice(0, 10));
    if (n > LIMITS.newsletterQuiet) return { level: 'low', where: 'Newsletter', text: `Last newsletter went out ${n} days ago.` };
  },

  () => SITE.demoBanner
    ? { level: 'high', where: 'Settings', text: 'The demo banner is still switched on. Turn it off in data/site.js before launch.' }
    : null
];

const ORDER = { high: 0, medium: 1, low: 2 };

export async function runAudit() {
  let newsletterLast = null;
  if (storeReady()) {
    try { const raw = await kv('GET', 'nl:last'); newsletterLast = raw ? JSON.parse(raw) : null; } catch { /* the rest still runs */ }
  }
  const ctx = {
    today: new Date().toISOString().slice(0, 10),
    events: read('events.json').calendar || [],
    posts: read('news.json').posts || [],
    deals: read('deals.json').deals || [],
    jobs: read('jobs.json').jobs || [],
    members: read('members.json').members || [],
    newcomers: read('newcomers.json'),
    newsletterLast
  };
  const findings = CHECKS.flatMap(check => {
    try { return [].concat(check(ctx) || []); } catch (err) { console.error('audit check failed', err); return []; }
  });
  return findings.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}

export const auditTo = () => {
  const list = String(process.env.AUDIT_TO || SITE.email || '').split(',').map(s => s.trim()).filter(Boolean);
  return list;
};

export function auditEmail(findings) {
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Chicago' });
  const subject = findings.length
    ? `Website check, ${month}: ${plural(findings.length, 'thing')} to look at`
    : `Website check, ${month}: nothing to do`;
  const label = { high: 'Fix soon', medium: 'Worth doing', low: 'When you have a minute' };
  const text = findings.length
    ? [
        'The monthly look at what on the chamber website needs a refresh.',
        '',
        ...['high', 'medium', 'low'].flatMap(level => {
          const these = findings.filter(f => f.level === level);
          return these.length ? [label[level].toUpperCase(), ...these.map(f => `- ${f.where}: ${f.text}`), ''] : [];
        }),
        `Everything above is fixed in the admin: ${SITE.url}/admin/`,
        '',
        'This email comes on the 1st of each month.'
      ].join('\n')
    : [
        'The monthly look at the chamber website found nothing out of date.',
        '',
        'This email comes on the 1st of each month. If it ever stops arriving, something is broken.'
      ].join('\n');
  return { subject, text };
}
