/* ==========================================================================
   CALENDAR FILES AND ADD-TO-CALENDAR LINKS

   Three ways to get an event into a personal calendar, because people use
   different ones and none of them accepts the same format:

     .ics download   Outlook desktop, Apple Calendar, and anything else
     Google link     opens a pre-filled event in Google Calendar
     Outlook link    opens a pre-filled event in Outlook on the web

   And one better option most chamber sites miss: a subscription feed at
   /events/chamber.ics. Subscribe once and every future event appears
   automatically, including ones added later. Adding events one at a time
   means coming back to the site every month.

   WHY THERE IS A TIMEZONE BLOCK IN HERE

   Times in data/events.js are local wall-clock, which is the only sane way
   to write them. Converting with a fixed offset works until the clocks
   change: Iowa is UTC-5 in October and UTC-6 in November, so a hardcoded
   offset puts every November event an hour out. Emitting a real
   America/Chicago VTIMEZONE and using TZID lets the calendar application
   do the conversion, correctly, forever.
   ========================================================================== */

/* America/Chicago. Central, US DST rules: second Sunday in March to the
   first Sunday in November. */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Chicago',
  'X-LIC-LOCATION:America/Chicago',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0600',
  'TZOFFSETTO:-0500',
  'TZNAME:CDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0600',
  'TZNAME:CST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE'
];

const stamp = (date, time) => date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';

/* Escape per RFC 5545: backslash, semicolon, comma, and newline. */
const ics = s => String(s || '')
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
  .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/* Lines over 75 octets must be folded, or strict parsers reject the file.
   Outlook is one of the strict ones. */
function fold(line) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) { parts.push(' ' + rest.slice(0, 74)); rest = rest.slice(74); }
  if (rest) parts.push(' ' + rest);
  return parts.join('\r\n');
}

function describe(e) {
  return [e.summary, e.detail, e.cost ? `Cost: ${e.cost}` : '']
    .filter(Boolean).join('\n\n');
}

function vevent(e, site, now) {
  return [
    'BEGIN:VEVENT',
    `UID:${e.id}@${site.url.replace(/^https?:\/\//, '')}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=America/Chicago:${stamp(e.date, e.start)}`,
    `DTEND;TZID=America/Chicago:${stamp(e.date, e.end)}`,
    `SUMMARY:${ics(e.title)}`,
    `DESCRIPTION:${ics(describe(e))}`,
    e.address ? `LOCATION:${ics(e.where + ', ' + e.address)}` : `LOCATION:${ics(e.where)}`,
    `URL:${site.url}/events/`,
    'STATUS:CONFIRMED',
    'END:VEVENT'
  ].filter(Boolean);
}

function wrap(lines) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Polk City Area Chamber of Commerce//Events//EN',
    'CALSCALE:GREGORIAN',
    ...lines,
    'END:VCALENDAR'
  ].map(fold).join('\r\n') + '\r\n';
}

const nowStamp = () => new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

/* One file for one event. */
export function eventIcs(e, site) {
  return wrap([...VTIMEZONE, ...vevent(e, site, nowStamp())]);
}

/* The whole calendar, for subscribing. */
export function feedIcs(events, site) {
  const now = nowStamp();
  return wrap([
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${ics(site.shortName + ' events')}`,
    'X-WR-TIMEZONE:America/Chicago',
    `X-WR-CALDESC:${ics('Events from the ' + site.name + '.')}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
    ...VTIMEZONE,
    ...events.flatMap(e => vevent(e, site, now))
  ]);
}

/* ---------- the two web links ---------- */

/* Google and Outlook both want UTC, so this is the one place a conversion
   happens. Built from the timezone name rather than a fixed offset. */
function utcStamp(date, time, tz = 'America/Chicago') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);

  /* Guess it is UTC, ask what that instant looks like in Chicago, and
     correct by the difference. Two passes settle any DST boundary. */
  let guess = Date.UTC(y, m - 1, d, hh, mm);
  for (let i = 0; i < 2; i++) {
    const seen = new Date(guess).toLocaleString('en-US', { timeZone: tz, hour12: false });
    const [dp, tp] = seen.split(', ');
    const [sm, sd, sy] = dp.split('/').map(Number);
    const [sh, si] = tp.split(':').map(Number);
    const diff = Date.UTC(y, m - 1, d, hh, mm) - Date.UTC(sy, sm - 1, sd, sh === 24 ? 0 : sh, si);
    guess += diff;
    if (diff === 0) break;
  }
  return new Date(guess).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function googleUrl(e, site) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${utcStamp(e.date, e.start)}/${utcStamp(e.date, e.end)}`,
    details: describe(e) + `\n\n${site.url}/events/`,
    location: e.address ? `${e.where}, ${e.address}` : e.where,
    ctz: 'America/Chicago'
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function outlookUrl(e, site) {
  const iso = (date, time) => `${date}T${time}:00`;
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: iso(e.date, e.start),
    enddt: iso(e.date, e.end),
    body: describe(e) + `\n\n${site.url}/events/`,
    location: e.address ? `${e.where}, ${e.address}` : e.where
  });
  return 'https://outlook.live.com/calendar/0/deeplink/compose?' + p.toString();
}
