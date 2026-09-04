/* ==========================================================================
   BUILD

   Reads the files in /data and writes plain HTML into /dist.

   Why a build step at all: every member gets a real page at a real address.
   That is the whole point. A directory drawn by JavaScript after the page
   loads is invisible to Google, which is the problem the current site has.

   You do not need to run this yourself. Vercel runs it every time you save
   a change on GitHub. To run it locally anyway: node build.mjs
   ========================================================================== */

import { mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { SITE, DOORS } from './data/site.js';
import { CATEGORIES, TIERS, MEMBERS } from './data/members.js';
import { RECURRING, CALENDAR } from './data/events.js';
import { MEMBERSHIP, TIER_LIST, WHY, JOIN_FAQ } from './data/membership.js';
import { ABOUT, FAQ, RESOURCE_GROUPS } from './data/pages.js';
import { INVOLVED, PRIVACY } from './data/involved.js';
import { POSTS } from './data/news.js';
import { JOBS } from './data/jobs.js';
import { REFERRALS } from './data/referrals.js';
import { JOIN_FORM, EVENT_FORM } from './data/forms.js';

const OUT = 'dist';

/* ---------- small helpers ------------------------------------------------ */

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Turns [label](https://address) into a link. Nothing else. */
const linkify = s => esc(s).replace(
  /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
  (_, label, href) => `<a href="${href}">${label}</a>`
);

const swapPolicy = s => String(s).replace(/\{POLICY\}/g, SITE.policyCenterUrl);

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return `${names[day]}, ${MONTHS[m - 1]} ${d}`;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/* Reverse index: member slug -> the needs they are the named referral for.
   Built once so the directory does not scan the referral list per member. */
const REFERRAL_BY_MEMBER = (() => {
  const map = new Map();
  for (const r of REFERRALS) {
    for (const slug of r.members) {
      if (!map.has(slug)) map.set(slug, []);
      map.get(slug).push(r);
    }
  }
  return map;
})();

/* Members can supply a logo. Until they do, the plate shows their initial
   in their category's season colour, which looks deliberate rather than
   like a missing image. */
const logoPlate = (m, cls = 'logo') => m.logo
  ? `<span class="${cls}"><img src="${esc(m.logo)}" alt="${esc(m.name)} logo" loading="lazy"></span>`
  : `<span class="${cls}"><span class="initial" aria-hidden="true">${esc(m.name.trim()[0] || '?')}</span></span>`;

const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || 'Member';

/* Categories cycle through the four season colors so the directory reads
   as one family rather than eleven unrelated colors. */
const SEASONS = ['spring', 'sun', 'winter', 'autumn'];
const catSeason = id => SEASONS[Math.max(0, CATEGORIES.findIndex(c => c.id === id)) % 4];

/* ---------- shared chrome ------------------------------------------------ */

/* The real logo, as three separate files rather than one lockup.

   The roundel cannot simply be recoloured for a dark background: its outer
   ring is navy and its gazebo is white, so inverting one destroys the other.
   So on navy it sits on a white plate, at full colour, as the brand intends.
   The wordmark is plain text and does invert, hence two colour versions.

   These are <img> references, not inline SVG. Inlining 38KB of paths into
   all 31 pages would be 1.2MB of duplicated markup for no benefit. */

const MARK = (cls = '') =>
  `<span class="mark${cls ? ' ' + cls : ''}"><img src="/assets/mark.svg" alt="" width="40" height="40"></span>`;

const WORDMARK = (colour = 'white') =>
  `<img class="wordmark" src="/assets/wordmark-${colour}.svg" alt="Polk City Area Chamber of Commerce" width="180" height="32">`;

function head({ title, description, canonical, season = 'navy', noindex = false }) {
  const full = `${title} | ${SITE.shortName}`;
  return `<!doctype html>
<html lang="en" data-season="${season}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${canonical}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta name="theme-color" content="#002734">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE.url}${canonical}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:image" content="${SITE.url}/assets/social-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE.url}/assets/social-card.png">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" href="/assets/favicon-32.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function banner() {
  if (!SITE.demoBanner) return '';
  return `<div class="demo"><div class="wrap"><p><strong>${esc(SITE.demoBannerText)}</strong></p></div></div>`;
}

function header(current) {
  const items = SITE.nav.map(n => {
    const now = n.href === current ? ' aria-current="page"' : '';
    return `<a href="${n.href}"${now}>${esc(n.label)}</a>`;
  }).join('');
  return `${banner()}
<header class="top">
  <div class="wrap">
    <a class="brand" href="/">
      ${MARK()}
      <span class="brand-text">${WORDMARK('white')}</span>
    </a>
    <button class="burger" id="burger" aria-expanded="false" aria-controls="menu">Menu</button>
    <nav class="menu" id="menu" aria-label="Main">
      ${items}
      <a class="join" href="/join/">Join</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  const s = SITE.social;
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        ${MARK('big')}
        <p>${esc(SITE.tagline)}</p>
        <p><a href="mailto:${SITE.email}">${SITE.email}</a><br>${esc(SITE.mail)}</p>
      </div>
      <div>
        <h4>Around the site</h4>
        <ul>
          ${SITE.nav.filter(n => n.href !== '/').map(n => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('')}
          <li><a href="/jobs/">Jobs</a></li>
          <li><a href="/news/">News and spotlights</a></li>
          <li><a href="/policy-center/">Business Policy Center<span class="memberonly"> (members)</span></a></li>
          <li><a href="/privacy/">Privacy</a></li>
        </ul>
      </div>
      <div>
        <h4>Follow along</h4>
        <ul>
          <li><a href="${s.facebook}">Facebook</a></li>
          <li><a href="${s.instagram}">Instagram</a></li>
          <li><a href="${s.linkedin}">LinkedIn</a></li>
          <li><a href="${s.tiktok}">TikTok</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-legal">
      <p>The chamber is an independent nonprofit and is not part of city government. For city services go to <a href="https://www.polkcityia.gov">polkcityia.gov</a>. &copy; ${new Date().getFullYear()} ${esc(SITE.name)}.</p>
    </div>
  </div>
</footer>`;
}

const TAIL = `<script>
(function(){
  var b=document.getElementById('burger'), m=document.getElementById('menu');
  if(!b||!m) return;
  b.addEventListener('click',function(){
    var open=m.classList.toggle('open');
    b.setAttribute('aria-expanded', open?'true':'false');
  });
})();
</script>
</body>
</html>`;

function page(meta, body, extraScript = '') {
  return head(meta) + header(meta.canonical) + `<main id="main">` + body + `</main>` + footer() + extraScript + TAIL;
}

/* ---------- pages -------------------------------------------------------- */

function nextEvent() {
  const t = todayISO();
  return CALENDAR.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
}

function homePage() {
  const n = nextEvent();
  const strip = n ? `<div class="next" data-season="${n.season}">
  <div class="wrap">
    <span class="when">Next up: ${esc(longDate(n.date))}</span>
    <span class="what">${esc(n.title)} at ${esc(n.where)}${n.time ? `, ${esc(n.time)}` : ''}</span>
    ${n.rsvp ? `<a class="go" href="${esc(n.rsvp.href)}">${esc(n.rsvp.label)}</a>` : ''}
  </div>
</div>` : '';

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phone,
    address: { '@type': 'PostalAddress', streetAddress: 'PO Box 226', addressLocality: 'Polk City', addressRegion: 'IA', postalCode: '50226', addressCountry: 'US' },
    sameAs: Object.values(SITE.social)
  };

  const latest = [...POSTS].sort((a, b) => b.date.localeCompare(a.date))[0];
  const openJobs = liveJobs().length;

  const doors = DOORS.map(d => `<a class="door" href="${d.href}" data-season="${d.season}">
  <h3>${esc(d.title)}</h3>
  <p>${esc(d.blurb)}</p>
</a>`).join('');

  const body = `
<section class="hero">
  <div class="wrap">
    <h1>The business network for Polk City, Alleman, Elkhart and Sheldahl.</h1>
    <p>We connect local businesses to customers, to each other, and to the information they need to run. Find a member, come to a luncheon, or join.</p>
  </div>
</section>
${strip}
<section class="doors">
  <div class="wrap">
    ${doors}
  </div>
</section>
<section class="band warm">
  <div class="wrap"><div class="col">
    <h2>What the chamber is for</h2>
    <p class="lede">${esc(ABOUT.lede)}</p>
    <p>${esc(ABOUT.body[1])}</p>
    <div class="btnrow">
      <a class="btn sun" href="/membership/">See what it costs to join</a>
      <a class="btn ghost" href="/about/">More about the chamber</a>
    </div>
  </div></div>
</section>
<section class="band">
  <div class="wrap">
    <div class="reasons">
      <div class="reason" data-season="autumn">
        <h3>Latest</h3>
        ${latest ? `<p><a href="/news/${latest.slug}/">${esc(latest.title)}</a><br><span style="color:var(--navy-soft);font-size:.9rem">${esc(longDate(latest.date))}</span></p>
        <p>${esc(latest.summary)}</p>` : '<p>Nothing posted yet.</p>'}
      </div>
      <div class="reason" data-season="spring">
        <h3>Hiring right now</h3>
        <p>${openJobs === 0 ? 'No openings posted at the moment.' : openJobs === 1 ? 'One member business has an opening.' : `${openJobs} member businesses have openings.`}</p>
        <p><a href="/jobs/">See the job board</a></p>
      </div>
    </div>
  </div>
</section>
<script type="application/ld+json">${JSON.stringify(org)}</script>`;

  return page({
    title: 'Home',
    description: `${SITE.tagline} Member directory, events, membership, and what is changing in state and local policy.`,
    canonical: '/',
    season: 'navy'
  }, body);
}

function directoryIndex() {
  const sorted = [...MEMBERS].sort((a, b) => {
    const r = (TIERS[a.tier]?.rank ?? 9) - (TIERS[b.tier]?.rank ?? 9);
    return r !== 0 ? r : a.name.localeCompare(b.name);
  });

  const chips = [`<button class="chip" data-cat="all" aria-pressed="true">Everyone</button>`]
    .concat(CATEGORIES
      .filter(c => MEMBERS.some(m => m.category === c.id))
      .map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="false">${esc(c.label)}</button>`))
    .join('');

  const rows = sorted.map(m => {
    const season = catSeason(m.category);
    const isReferral = REFERRAL_BY_MEMBER.has(m.slug);
    const badge = isReferral
      ? '<span class="badge">Chamber referral</span>'
      : m.tier !== 'basic'
        ? `<span class="badge">${esc(TIERS[m.tier].label)}</span>` : '';
    const hay = [m.name, m.summary, m.about, catLabel(m.category), ...(m.serves || [])]
      .join(' ').toLowerCase();
    return `<a class="listing" href="/directory/${m.slug}/" data-season="${season}" data-cat="${m.category}" data-find="${esc(hay)}">
  ${logoPlate(m)}
  <span class="body">
    <h3>${esc(m.name)}</h3>
    <p>${esc(m.summary)}</p>
    <span class="cat">${esc(catLabel(m.category))}</span>
  </span>
  ${badge}
</a>`;
  }).join('');

  const body = `
<div class="pagehead" data-season="spring">
  <div class="wrap">
    <h1>Member directory</h1>
    <p>Every business in the chamber, with a page of its own. Hire local first.</p>
  </div>
</div>
<div class="wrap">
  <div class="tools">
    <div class="search">
      <label class="skip" for="q">Search members</label>
      <input id="q" type="search" placeholder="Search by name or what you need" autocomplete="off">
    </div>
  </div>
  <div class="chips" id="chips">${chips}</div>
  <p class="count" id="count">${sorted.length} members</p>
  <div id="rows">${rows}</div>
  <div class="empty" id="empty" hidden>
    <p>Nothing matches that. Try a plainer word, or email <a href="mailto:${SITE.email}">${SITE.email}</a> and we will point you at someone.</p>
  </div>
  <div class="band">
    <h2>Not on this list?</h2>
    <p>A directory page costs less than one newspaper ad and it works all year.</p>
    <div class="btnrow"><a class="btn sun" href="/join/">Join the chamber</a></div>
  </div>
</div>`;

  const script = `<script>
(function(){
  var q=document.getElementById('q'), rows=document.getElementById('rows'),
      count=document.getElementById('count'), empty=document.getElementById('empty'),
      chips=document.getElementById('chips');
  var all=[].slice.call(rows.querySelectorAll('.listing'));
  var cat='all';

  function apply(){
    var term=q.value.trim().toLowerCase();
    var words=term?term.split(/\\s+/):[];
    var shown=0;
    all.forEach(function(el){
      var okCat = cat==='all' || el.getAttribute('data-cat')===cat;
      var hay=el.getAttribute('data-find');
      var okTerm = words.every(function(w){
        if(hay.indexOf(w)>-1) return true;
        // plain plural tolerance, same rule as the Policy Center
        if(w.length>3 && hay.indexOf(w.replace(/(es|s)$/,''))>-1) return true;
        return hay.indexOf(w+'s')>-1;
      });
      var ok=okCat&&okTerm;
      el.hidden=!ok;
      if(ok) shown++;
    });
    count.textContent = shown===1 ? '1 member' : shown+' members';
    empty.hidden = shown>0;
  }

  q.addEventListener('input', apply);
  chips.addEventListener('click', function(e){
    var b=e.target.closest('.chip'); if(!b) return;
    cat=b.getAttribute('data-cat');
    [].forEach.call(chips.querySelectorAll('.chip'),function(c){
      c.setAttribute('aria-pressed', c===b?'true':'false');
    });
    apply();
  });
})();
</script>`;

  return page({
    title: 'Member directory',
    description: 'Every Polk City Area Chamber member business, sorted by what they do, with contact details and a page for each.',
    canonical: '/directory/',
    season: 'spring'
  }, body, script);
}

function memberPage(m) {
  const season = catSeason(m.category);
  const c = m.contact || {};
  const rows = [];
  if (c.person)  rows.push(['Contact', esc(c.person)]);
  if (c.phone)   rows.push(['Phone', `<a href="tel:${esc(c.phone).replace(/[^0-9+]/g, '')}">${esc(c.phone)}</a>`]);
  if (c.email)   rows.push(['Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`]);
  if (c.web)     rows.push(['Website', `<a href="${esc(c.web)}" rel="noopener">${esc(c.web.replace(/^https?:\/\//, ''))}</a>`]);
  if (c.address) rows.push(['Address', esc(c.address)]);
  if (m.joined)  rows.push(['Member since', String(m.joined)]);

  const dl = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const tags = (m.serves || []).length
    ? `<ul class="tags">${m.serves.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: m.name,
    description: m.summary,
    url: `${SITE.url}/directory/${m.slug}/`,
    ...(c.phone ? { telephone: c.phone } : {}),
    ...(c.address ? { address: c.address } : {}),
    memberOf: { '@type': 'Organization', name: SITE.name, url: SITE.url }
  };

  /* Other members doing the same kind of work. Useful to a reader, and it
     gives every member page internal links pointing at it. */
  const siblings = MEMBERS
    .filter(o => o.category === m.category && o.slug !== m.slug)
    .slice(0, 4);
  const refs = REFERRAL_BY_MEMBER.get(m.slug) || [];
  const referralNote = refs.length ? `<div class="note" style="margin:22px 0 0">
  <p><strong>Chamber referral.</strong> When a member asks the chamber ${esc(refs.map(r => r.need.replace(/^I need /, 'who to call to ').replace(/^My staff need /, 'about ')).join(' or '))}, this is who they are pointed at.</p>
</div>` : '';

  const related = siblings.length ? `<div class="related">
  <h4>Others in ${esc(catLabel(m.category).toLowerCase())}</h4>
  <ul>${siblings.map(o => `<li><a href="/directory/${o.slug}/">${esc(o.name)}</a> <span>${esc(o.summary)}</span></li>`).join('')}</ul>
</div>` : '';

  const reach = c.web
    ? `<a class="btn" href="${esc(c.web)}" rel="noopener">Visit the website</a>`
    : c.phone
      ? `<a class="btn" href="tel:${esc(c.phone).replace(/[^0-9+]/g, '')}">Call ${esc(m.name)}</a>`
      : `<a class="btn" href="mailto:${SITE.email}?subject=${encodeURIComponent('Introduction to ' + m.name)}">Ask for an introduction</a>`;

  const body = `
<div class="memberhead" data-season="${season}">
  <div class="wrap">
    <p class="crumb"><a href="/directory/">Member directory</a> / ${esc(catLabel(m.category))}</p>
    ${logoPlate(m, 'logo')}
    <h1>${esc(m.name)}</h1>
    <p>${esc(m.summary)}</p>
  </div>
</div>
<div class="wrap band" data-season="${season}">
  <div class="cols">
    <div>
      <p>${esc(m.about || m.summary)}</p>
      ${tags}
      ${referralNote}
      ${related}
      <a class="back" href="/directory/">Back to the directory</a>
    </div>
    <aside class="card">
      <h4>Get in touch</h4>
      <dl>${dl}</dl>
      <div class="btnrow">${reach}</div>
      <p class="crumb" style="margin:16px 0 0">${esc(TIERS[m.tier].label)} of the Polk City Area Chamber.</p>
    </aside>
  </div>
</div>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;

  return page({
    title: m.name,
    description: `${m.name}, a Polk City Area Chamber member. ${m.summary}`,
    canonical: `/directory/${m.slug}/`,
    season
  }, body);
}

function eventsPage() {
  const t = todayISO();
  const upcoming = CALENDAR.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date));

  /* Dated events get structured data so they can show up as events in search
     results rather than as an ordinary page. */
  const eventLd = upcoming.map(e => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'Place', name: e.where, address: { '@type': 'PostalAddress', addressLocality: 'Polk City', addressRegion: 'IA', addressCountry: 'US' } },
    description: e.summary,
    organizer: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    ...(e.rsvp ? { url: e.rsvp.href } : {})
  }));

  const one = e => `<article class="event" data-season="${e.season || 'sun'}">
  ${e.date ? `<div class="date">${esc(longDate(e.date))}</div>` : `<div class="date">${esc(e.when)}</div>`}
  <h3>${esc(e.title)}</h3>
  <div class="meta">${esc(e.where)}${e.time ? ` &middot; ${esc(e.time)}` : ''}${e.audience === 'members' ? ' &middot; Members only' : ''}</div>
  <p>${esc(e.summary)}</p>
  ${e.detail ? `<p>${esc(e.detail)}</p>` : ''}
  ${e.cost ? `<p class="cost">${esc(e.cost)}</p>` : ''}
  ${e.rsvp ? `<div class="btnrow"><a class="btn" href="${esc(e.rsvp.href)}">${esc(e.rsvp.label)}</a></div>` : ''}
</article>`;

  /* The calendar is drawn by JavaScript from this, but the list below is
     real HTML. Turn JavaScript off and you lose the grid, not the events. */
  const calData = upcoming.map(e => ({
    date: e.date, title: e.title, where: e.where,
    season: e.season || 'sun',
    href: e.rsvp ? e.rsvp.href : '/events/'
  }));

  const body = `
<div class="pagehead" data-season="sun">
  <div class="wrap">
    <h1>Events</h1>
    <p>Come to one before you join. Guests are welcome at almost everything here.</p>
  </div>
</div>
<div class="wrap band">
  <div class="viewswitch" id="viewswitch" hidden>
    <button type="button" data-view="list" aria-pressed="true">List</button>
    <button type="button" data-view="cal" aria-pressed="false">Calendar</button>
  </div>
  <div id="calview" hidden>
    <div class="cal-head">
      <h3 id="calmonth"></h3>
      <span class="spacer"></span>
      <button type="button" id="calprev">Previous</button>
      <button type="button" id="calnext">Next</button>
    </div>
    <table class="cal" id="caltable"><thead><tr>
      <th><abbr title="Sunday">Sun</abbr></th><th><abbr title="Monday">Mon</abbr></th>
      <th><abbr title="Tuesday">Tue</abbr></th><th><abbr title="Wednesday">Wed</abbr></th>
      <th><abbr title="Thursday">Thu</abbr></th><th><abbr title="Friday">Fri</abbr></th>
      <th><abbr title="Saturday">Sat</abbr></th>
    </tr></thead><tbody></tbody></table>
    <p class="help" style="margin-top:12px;color:var(--navy-soft);font-size:.9rem">Tap a day to see what is on. Recurring items like the luncheon appear on their dated instances.</p>
  </div>
  <div id="listview">
  <h2>Coming up</h2>
  ${upcoming.length ? upcoming.map(one).join('') : `<div class="empty"><p>Nothing on the calendar right now. The luncheon still runs monthly, so check back or email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p></div>`}
  </div>
</div>
<div class="band warm">
  <div class="wrap">
    <h2>Happens on a rhythm</h2>
    <p class="lede">These do not need announcing every time.</p>
    ${RECURRING.map(one).join('')}
  </div>
</div>
<div class="wrap band">
  <h2>Have something to add?</h2>
  <p>The community calendar is open to anyone running something in the area, member or not. Send the date, place, and a sentence about what it is.</p>
  <div class="btnrow"><a class="btn" href="/events/add/">Add your event</a></div>
</div>
${eventLd.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('')}
<script>
(function(){
  var EVENTS = ${JSON.stringify(calData)};
  var sw=document.getElementById('viewswitch'),
      list=document.getElementById('listview'),
      cal=document.getElementById('calview'),
      tbody=document.querySelector('#caltable tbody'),
      label=document.getElementById('calmonth');
  if(!sw) return;
  sw.hidden=false;

  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var today=new Date(); today.setHours(0,0,0,0);
  var cur=new Date(today.getFullYear(), today.getMonth(), 1);

  function iso(d){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function draw(){
    label.textContent = MONTHS[cur.getMonth()]+' '+cur.getFullYear();
    var first=new Date(cur.getFullYear(), cur.getMonth(), 1);
    var start=new Date(first); start.setDate(1-first.getDay());
    var html='';
    for(var w=0; w<6; w++){
      html+='<tr>';
      for(var d=0; d<7; d++){
        var day=new Date(start); day.setDate(start.getDate()+w*7+d);
        var key=iso(day);
        var out = day.getMonth()!==cur.getMonth() ? ' out' : '';
        var isToday = day.getTime()===today.getTime() ? ' today' : '';
        var on=EVENTS.filter(function(e){ return e.date===key; });
        html+='<td class="'+(out+isToday).trim()+'"><span class="num">'+day.getDate()+'</span>';
        on.forEach(function(e){
          html+='<a class="ev" data-season="'+e.season+'" href="'+e.href+'" title="'+e.title+', '+e.where+'">'+e.title+'</a>';
        });
        html+='</td>';
      }
      html+='</tr>';
      var last=new Date(start); last.setDate(start.getDate()+w*7+6);
      if(last.getMonth()!==cur.getMonth() && w>=3) break;
    }
    tbody.innerHTML=html;
  }

  function move(n){ cur=new Date(cur.getFullYear(), cur.getMonth()+n, 1); draw(); }
  document.getElementById('calprev').addEventListener('click', function(){ move(-1); });
  document.getElementById('calnext').addEventListener('click', function(){ move(1); });

  sw.addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    var wantCal = b.getAttribute('data-view')==='cal';
    list.hidden=wantCal; cal.hidden=!wantCal;
    [].forEach.call(sw.querySelectorAll('button'), function(x){
      x.setAttribute('aria-pressed', x===b ? 'true':'false');
    });
    if(wantCal) draw();
  });
})();
</script>`;

  return page({
    title: 'Events',
    description: 'The monthly chamber luncheon, the annual golf tournament, ribbon cuttings, and community events in the Polk City area.',
    canonical: '/events/',
    season: 'sun'
  }, body);
}

function membershipPage() {
  /* Six levels with long benefit lists. Stacked rows, like the printed
     sheet, rather than columns nobody can read on a phone. */
  const tiers = TIER_LIST.map(tr => {
    const scale = tr.scale ? `<table class="scale">
    <caption>Priced by size</caption>
    <tbody>${tr.scale.map(s => `<tr><th scope="row">${esc(s.label)}</th><td>${esc(s.price)}</td></tr>`).join('')}</tbody>
  </table>` : '';

    return `<section class="level${tr.highlight ? ' pick' : ''}" data-season="${tr.season}">
  <div class="level-head">
    <div>
      ${tr.flag ? `<span class="flag">${esc(tr.flag)}</span>` : ''}
      <h3>${esc(tr.name)}</h3>
      <p class="who">${esc(tr.who)}</p>
    </div>
    <div class="level-price">
      <span class="price">${esc(tr.price)}</span>
      <span class="per">${esc(tr.per)}</span>
    </div>
  </div>
  <div class="level-body">
    ${scale}
    ${tr.builds ? `<p class="builds">Everything in ${esc(tr.builds)}, plus:</p>` : ''}
    <ul class="perks">${tr.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    <div class="btnrow"><a class="btn" href="/join/?level=${tr.id}">Join at ${esc(tr.name)}</a></div>
  </div>
</section>`;
  }).join('');

  const why = WHY.map(w => `<div class="reason" data-season="${w.season}">
  <h3>${esc(w.title)}</h3>
  <p>${esc(w.body)}</p>
</div>`).join('');

  const faq = JOIN_FAQ.map(f => `<details class="faq">
  <summary>${esc(f.q)}</summary>
  <div class="ans"><p>${esc(f.a)}</p></div>
</details>`).join('');

  const draft = MEMBERSHIP.draft ? `<div class="draft">
  <p><strong>Draft, not yet approved.</strong> ${esc(MEMBERSHIP.draftNote)}</p>
</div>` : '';

  const body = `
<div class="pagehead" data-season="autumn">
  <div class="wrap">
    <h1>Membership levels and benefits</h1>
    <p>What each level of chamber membership costs and what comes with it.</p>
  </div>
</div>
<div class="wrap band">
  ${draft}
  ${tiers}
</div>
<div class="band warm">
  <div class="wrap">
    <h2>Why businesses here pay for this</h2>
    <div class="reasons">${why}</div>
  </div>
</div>
<div class="wrap band" id="join">
  <h2>Not sure which level fits?</h2>
  <p class="lede">Tell us about the business and we will say which level makes sense. No pressure and no salesperson.</p>
  <div class="btnrow">
    <a class="btn sun" href="/join/">Start a membership</a>
    <a class="btn ghost" href="/events/">Come to a luncheon first</a>
  </div>
</div>
<div class="band warm">
  <div class="wrap"><div class="col">
    <h2>Before you ask</h2>
    ${faq}
  </div></div>
</div>`;

  return page({
    title: 'Membership levels and benefits',
    description: 'What each level of Polk City Area Chamber membership costs and what comes with it.',
    canonical: '/membership/',
    season: 'autumn'
  }, body);
}

function resourcesPage() {
  const groups = RESOURCE_GROUPS.map(g => `<section class="group" data-season="${g.season}">
  <h2>${esc(g.title)}</h2>
  <p>${esc(g.blurb)}</p>
  <ul>
    ${g.links.map(l => `<li>
      <a href="${esc(swapPolicy(l.href))}">${esc(l.label)}</a>
      <span>${esc(l.note)}</span>
    </li>`).join('')}
  </ul>
</section>`).join('');

  const body = `
<div class="pagehead" data-season="winter">
  <div class="wrap">
    <h1>Business resources</h1>
    <p>The useful links, sorted by the problem you are trying to solve rather than by who runs the program.</p>
  </div>
</div>
<div class="wrap band">
  ${groups}
</div>
<div class="band warm">
  <div class="wrap">
    <h2>Who to call</h2>
    <p class="lede">Knowing what changed is half of it. These are the members the chamber points people at, by situation.</p>
    <div class="group" data-season="spring">
      <ul>
        ${REFERRALS.map(r => {
          if (r.gap) return `<li><strong>${esc(r.need)}</strong><span>${esc(r.note)}</span></li>`;
          const named = r.members
            .map(s => MEMBERS.find(x => x.slug === s))
            .filter(Boolean)
            .map(x => `<a href="/directory/${x.slug}/">${esc(x.name)}</a>`)
            .join(', ');
          return `<li><strong>${esc(r.need)}</strong><span>${named || 'No member listed yet.'}${r.note ? ` &middot; ${esc(r.note)}` : ''}</span></li>`;
        }).join('')}
      </ul>
    </div>
    <p style="font-size:.94rem;color:var(--navy-soft)">A referral is not an endorsement of quality. It means the business is a chamber member who works in that area and has agreed to take the call.</p>
  </div>
</div>
<div class="band">
  <div class="wrap"><div class="col">
    <h2>The Business Policy Center</h2>
    <p>Most of these state pages are written for people who already know the jargon. The chamber keeps its own, saying what changed, who it applies to, and whether you should care, in plain language, with every claim linked to its source.</p>
    <p>It is a member benefit, so it sits behind the member passcode. Every level of membership includes it.</p>
    <div class="btnrow">
      <a class="btn sun" href="/policy-center/">Open the Policy Center</a>
      <a class="btn ghost" href="/join/">Join to get access</a>
    </div>
  </div></div>
</div>`;

  return page({
    title: 'Business resources',
    description: 'Grants, permits, hiring help, and policy tracking for Polk City area businesses.',
    canonical: '/resources/',
    season: 'winter'
  }, body);
}

function aboutPage() {
  const faq = FAQ.map(f => `<details class="faq">
  <summary>${esc(f.q)}</summary>
  <div class="ans"><p>${linkify(f.a)}</p></div>
</details>`).join('');

  const body = `
<div class="pagehead" data-season="navy">
  <div class="wrap">
    <h1>About the chamber</h1>
    <p>${esc(ABOUT.lede)}</p>
  </div>
</div>
<div class="wrap band"><div class="col">
  ${ABOUT.body.map(p => `<p>${esc(p)}</p>`).join('')}
</div></div>
<div class="band warm">
  <div class="wrap"><div class="col">
    <h2>Questions people ask</h2>
    ${faq}
  </div></div>
</div>
<div class="wrap band"><div class="col">
  <h2>Get in touch</h2>
  <p>Email is the fastest way to reach a person.</p>
  <p><a href="mailto:${SITE.email}">${SITE.email}</a><br>${esc(SITE.mail)}<br>${esc(SITE.phone)}</p>
</div></div>`;

  return page({
    title: 'About',
    description: 'Who the Polk City Area Chamber of Commerce is, what it does, and how to reach it.',
    canonical: '/about/',
    season: 'navy'
  }, body);
}


function involvedPage() {
  const ways = INVOLVED.ways.map(w => `<article class="event" data-season="${w.season}">
  <h3>${esc(w.title)}</h3>
  <p>${esc(w.body)}</p>
  <p class="cost">What it takes: ${esc(w.ask)}</p>
  <div class="btnrow"><a class="btn" href="${esc(w.action.href.replace('{EMAIL}', SITE.email))}">${esc(w.action.label)}</a></div>
</article>`).join('');

  const board = INVOLVED.board.map(b => `<li><strong>${esc(b.role)}</strong> <span>${esc(b.name)}${b.business ? `, ${esc(b.business)}` : ''}</span></li>`).join('');

  const body = `
<div class="pagehead" data-season="sun">
  <div class="wrap">
    <h1>Get involved</h1>
    <p>${esc(INVOLVED.lede)}</p>
  </div>
</div>
<div class="wrap band"><div class="col">
  <p class="lede">${esc(INVOLVED.intro)}</p>
</div></div>
<div class="wrap band">
  ${ways}
</div>
<div class="band warm">
  <div class="wrap"><div class="col">
    <h2>Who is on the board</h2>
    <div class="related" style="margin-top:0;border-top:none;padding-top:0">
      <ul>${board}</ul>
    </div>
  </div></div>
</div>`;

  return page({
    title: 'Get involved',
    description: 'Committees, event volunteering, sponsorship, and board seats at the Polk City Area Chamber of Commerce.',
    canonical: '/get-involved/',
    season: 'sun'
  }, body);
}

function privacyPage() {
  const secs = PRIVACY.sections.map(s => `<h3>${esc(s.title)}</h3>
<p>${esc(s.body)}</p>`).join('');

  const body = `
<div class="pagehead" data-season="navy">
  <div class="wrap">
    <h1>Privacy</h1>
    <p>Last updated ${esc(PRIVACY.updated)}.</p>
  </div>
</div>
<div class="wrap band"><div class="col">
  <p class="lede">${esc(PRIVACY.intro)}</p>
  ${secs}
  <h3>Questions</h3>
  <p>Email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
</div></div>`;

  return page({
    title: 'Privacy',
    description: 'What the Polk City Area Chamber of Commerce collects, what it does not, and how to change it.',
    canonical: '/privacy/',
    season: 'navy'
  }, body);
}

function notFoundPage() {
  const body = `
<div class="pagehead" data-season="winter">
  <div class="wrap">
    <h1>That page is not here</h1>
    <p>The site was rebuilt in 2026 and a few addresses moved. Nothing is lost, it is just somewhere else.</p>
  </div>
</div>
<div class="wrap band"><div class="col">
  <p>The four most likely places you were headed:</p>
  <div class="btnrow">
    <a class="btn" href="/directory/">Member directory</a>
    <a class="btn ghost" href="/events/">Events</a>
    <a class="btn ghost" href="/membership/">Membership</a>
    <a class="btn ghost" href="/resources/">Business resources</a>
  </div>
  <p style="margin-top:26px">Still stuck? Email <a href="mailto:${SITE.email}">${SITE.email}</a> and say what you were looking for.</p>
</div></div>`;

  return page({
    title: 'Page not found',
    description: 'That page has moved.',
    canonical: '/404/',
    season: 'winter'
  }, body);
}


/* ---------- news and spotlights ------------------------------------------ */

const KIND = { spotlight: { label: 'Member spotlight', season: 'autumn' },
               news:      { label: 'Chamber news',     season: 'winter' } };

function newsIndex() {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const rows = sorted.map(p => {
    const k = KIND[p.kind] || KIND.news;
    return `<a class="listing" href="/news/${p.slug}/" data-season="${k.season}">
  <span class="body">
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary)}</p>
    <span class="cat">${esc(longDate(p.date))}</span>
  </span>
  <span class="badge">${esc(k.label)}</span>
</a>`;
  }).join('');

  const body = `
<div class="pagehead" data-season="autumn">
  <div class="wrap">
    <h1>News and spotlights</h1>
    <p>What the chamber is doing, and a closer look at the businesses in it.</p>
  </div>
</div>
<div class="wrap band">
  ${rows || '<div class="empty"><p>Nothing posted yet.</p></div>'}
</div>
<div class="band warm">
  <div class="wrap"><div class="col">
    <h2>Want a spotlight?</h2>
    <p>Pro and Premier members get one a year, written by the chamber and posted across social and the member email. It is included, so ask for it.</p>
    <div class="btnrow"><a class="btn sun" href="mailto:${SITE.email}?subject=Member%20spotlight">Ask for a spotlight</a></div>
  </div></div>
</div>`;

  return page({
    title: 'News and spotlights',
    description: 'Chamber news and member spotlights from the Polk City Area Chamber of Commerce.',
    canonical: '/news/',
    season: 'autumn'
  }, body);
}

function postPage(p) {
  const k = KIND[p.kind] || KIND.news;
  const m = p.member ? MEMBERS.find(x => x.slug === p.member) : null;

  const aside = m ? `<aside class="card">
  <h4>About ${esc(m.name)}</h4>
  <p style="font-size:.95rem;margin:0 0 14px">${esc(m.summary)}</p>
  <div class="btnrow"><a class="btn" href="/directory/${m.slug}/">See their listing</a></div>
</aside>` : `<aside class="card">
  <h4>Get this in your inbox</h4>
  <p style="font-size:.95rem;margin:0 0 14px">The chamber sends one email a month. No more than that.</p>
  <div class="btnrow"><a class="btn" href="mailto:${SITE.email}?subject=Add%20me%20to%20the%20chamber%20email">Ask to be added</a></div>
</aside>`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: p.title,
    datePublished: p.date,
    description: p.summary,
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/news/${p.slug}/`
  };

  const body = `
<div class="memberhead" data-season="${k.season}">
  <div class="wrap">
    <p class="crumb"><a href="/news/">News and spotlights</a> / ${esc(k.label)}</p>
    <h1>${esc(p.title)}</h1>
    <p>${esc(longDate(p.date))}</p>
  </div>
</div>
<div class="wrap band" data-season="${k.season}">
  <div class="cols">
    <div>
      ${p.body.map(x => `<p>${esc(x)}</p>`).join('')}
      <a class="back" href="/news/">Back to news</a>
    </div>
    ${aside}
  </div>
</div>
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;

  return page({
    title: p.title,
    description: p.summary,
    canonical: `/news/${p.slug}/`,
    season: k.season
  }, body);
}

/* ---------- job board ----------------------------------------------------- */

function liveJobs() {
  const t = todayISO();
  return JOBS.filter(j => !j.closes || j.closes >= t)
             .sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
}

function jobsPage() {
  const live = liveJobs();

  const card = j => {
    const m = MEMBERS.find(x => x.slug === j.member);
    return `<article class="event" data-season="spring">
  <div class="date">${esc(j.type)}${j.pay ? ` &middot; ${esc(j.pay)}` : ''}</div>
  <h3>${esc(j.title)}</h3>
  <div class="meta">${m ? `<a href="/directory/${m.slug}/">${esc(m.name)}</a>` : 'Chamber member'} &middot; Closes ${esc(longDate(j.closes))}</div>
  <p>${esc(j.summary)}</p>
  ${j.detail ? `<p>${esc(j.detail)}</p>` : ''}
  ${j.apply ? `<div class="btnrow"><a class="btn" href="${esc(j.apply.href)}">${esc(j.apply.label)}</a></div>` : ''}
</article>`;
  };

  const ld = live.map(j => {
    const m = MEMBERS.find(x => x.slug === j.member);
    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: j.title,
      description: [j.summary, j.detail].filter(Boolean).join(' '),
      datePosted: j.posted,
      validThrough: j.closes,
      employmentType: j.type.toUpperCase().replace(' ', '_'),
      hiringOrganization: { '@type': 'Organization', name: m ? m.name : SITE.name },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Polk City', addressRegion: 'IA', addressCountry: 'US' } }
    };
  });

  const body = `
<div class="pagehead" data-season="spring">
  <div class="wrap">
    <h1>Jobs</h1>
    <p>Openings at chamber member businesses. Free to post if you are a member.</p>
  </div>
</div>
<div class="wrap band">
  ${live.length ? live.map(card).join('') : `<div class="empty"><p>No openings right now. Members can post one at any time by emailing <a href="mailto:${SITE.email}">${SITE.email}</a>.</p></div>`}
</div>
<div class="band warm">
  <div class="wrap"><div class="col">
    <h2>Posting a job</h2>
    <p>Send the title, whether it is full or part time, the pay, a sentence about the work, and how to apply. It goes up within a day and comes down on its own when it closes.</p>
    <p>Put a real number in the pay field. Postings without one get a fraction of the applications, and everybody who reads it assumes the worst.</p>
    <div class="btnrow"><a class="btn sun" href="mailto:${SITE.email}?subject=Job%20posting">Post a job</a></div>
  </div></div>
</div>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('')}`;

  return page({
    title: 'Jobs',
    description: 'Current job openings at Polk City area chamber member businesses.',
    canonical: '/jobs/',
    season: 'spring'
  }, body);
}


/* ---------- forms --------------------------------------------------------- */

function field(f) {
  const req = f.required ? ' required' : '';
  const star = f.required ? ' <span class="req" aria-hidden="true">required</span>' : '';
  const help = f.help ? `<span class="help" id="${f.id}-help">${esc(f.help)}</span>` : '';
  const described = f.help ? ` aria-describedby="${f.id}-help"` : '';

  let input;
  if (f.type === 'textarea') {
    input = `<textarea id="${f.id}" name="${f.id}" rows="4"${req}${described}></textarea>`;
  } else if (f.type === 'select') {
    input = `<select id="${f.id}" name="${f.id}"${req}${described}>
      ${f.options.map(o => `<option>${esc(o)}</option>`).join('')}
    </select>`;
  } else if (f.type === 'checkbox') {
    return `<div class="field check">
      <label for="${f.id}"><input type="checkbox" id="${f.id}" name="${f.id}" value="yes"> ${esc(f.label)}</label>
      ${help}
    </div>`;
  } else {
    input = `<input type="${f.type}" id="${f.id}" name="${f.id}"${req}${described}>`;
  }

  return `<div class="field">
    <label for="${f.id}">${esc(f.label)}${star}</label>
    ${help}
    ${input}
  </div>`;
}

function formPage(form, { canonical, season, aside }) {
  const live = Boolean(SITE.formEndpoint);

  /* No endpoint configured yet, so the form would post into nothing.
     Show the email route instead of a button that silently fails. */
  const fallback = `<div class="note">
    <p><strong>The form is not connected yet.</strong> Set <code>formEndpoint</code> in <code>data/site.js</code> and this becomes a real form. Until then, email works.</p>
  </div>
  <div class="btnrow"><a class="btn sun" href="mailto:${SITE.email}?subject=${encodeURIComponent(form.subject)}">Email the chamber instead</a></div>`;

  const theForm = `<form class="form" id="theform" action="${esc(SITE.formEndpoint)}" method="POST">
    <input type="hidden" name="_subject" value="${esc(form.subject)}">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="gotcha">
    ${form.fields.map(field).join('')}
    <div class="btnrow"><button type="submit" class="btn sun">${esc(form.submit)}</button></div>
    <p class="help">We use what you send here to reply and nothing else. See the <a href="/privacy/">privacy page</a>.</p>
  </form>
  <div class="done" id="done" hidden>
    <h3>${esc(form.after)}</h3>
    <p><a href="/">Back to the home page</a></p>
  </div>`;

  const body = `
<div class="pagehead" data-season="${season}">
  <div class="wrap">
    <h1>${esc(form.title)}</h1>
    <p>${esc(form.lede)}</p>
  </div>
</div>
<div class="wrap band" data-season="${season}">
  <div class="cols">
    <div>
      ${form.note ? `<p class="lede">${esc(form.note)}</p>` : ''}
      ${live ? theForm : fallback}
    </div>
    ${aside}
  </div>
</div>
${live ? `<script>
(function(){
  var f=document.getElementById('theform'), done=document.getElementById('done');
  if(!f) return;
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var btn=f.querySelector('button[type=submit]');
    btn.disabled=true; btn.textContent='Sending';
    fetch(f.action, { method:'POST', body:new FormData(f), headers:{Accept:'application/json'} })
      .then(function(r){
        if(!r.ok) throw new Error('bad response');
        f.hidden=true; done.hidden=false; done.scrollIntoView({block:'center'});
      })
      .catch(function(){
        btn.disabled=false; btn.textContent=${JSON.stringify(form.submit)};
        alert('That did not send. Please email ' + ${JSON.stringify(SITE.email)} + ' instead.');
      });
  });
})();
</script>` : ''}`;

  return page({
    title: form.title,
    description: form.lede,
    canonical,
    season
  }, body);
}

function joinPage() {
  const aside = `<aside class="card">
  <h4>What happens next</h4>
  <ol style="margin:0;padding-left:1.1em;font-size:.95rem">
    <li style="margin-bottom:8px">We read it and reply within two working days.</li>
    <li style="margin-bottom:8px">You get an invoice for the level that fits.</li>
    <li style="margin-bottom:8px">A short follow-up asks how you want your listing written.</li>
    <li>Your directory page goes live within a week.</li>
  </ol>
  <p style="font-size:.93rem;color:var(--navy-soft);margin:16px 0 0">Prefer to talk first? <a href="mailto:${SITE.email}">Email the chamber</a>.</p>
</aside>`;
  return formPage(JOIN_FORM, { canonical: '/join/', season: 'autumn', aside });
}

function eventFormPage() {
  const aside = `<aside class="card">
  <h4>What gets listed</h4>
  <p style="font-size:.95rem;margin:0 0 12px">Anything happening in the Polk City area that a local business or resident would want to know about. Member or not.</p>
  <p style="font-size:.95rem;margin:0">Events come off the site on their own the day after they happen, so nothing has to be tidied up later.</p>
</aside>`;
  return formPage(EVENT_FORM, { canonical: '/events/add/', season: 'sun', aside });
}


/* ---------- Policy Center shell ------------------------------------------- */

function policyCenterPage() {
  /* This page carries no member content. It is a lock and a form. The
     entries arrive from /api/policy only after the passcode checks out,
     which is why the content is not in the built site at all. */
  const body = `
<div class="pagehead" data-season="winter">
  <div class="wrap">
    <h1>Business Policy Center</h1>
    <p>What the legislature, the county and the city are doing to businesses here, in plain language. A chamber member benefit.</p>
  </div>
</div>
<div class="wrap band" data-season="winter">
  <div class="cols">
    <div>
      <div id="gate">
        <h2>Members only</h2>
        <p>Enter the member passcode. It is in the monthly chamber email, and it changes once a year.</p>
        <form class="form" id="gateform" style="max-width:22rem">
          <div class="field">
            <label for="passcode">Member passcode</label>
            <input type="password" id="passcode" name="passcode" autocomplete="current-password" required>
          </div>
          <div class="btnrow"><button type="submit" class="btn sun">Open the Policy Center</button></div>
          <p class="help" id="gatemsg" role="status" aria-live="polite"></p>
        </form>
        <p style="margin-top:24px">Not a member, or lost the passcode? <a href="/join/">Join the chamber</a> or <a href="mailto:${SITE.email}?subject=Policy%20Center%20passcode">email the chamber</a>.</p>
      </div>
      <div id="policyapp" hidden></div>
    </div>
    <aside class="card" id="gateaside">
      <h4>What is in here</h4>
      <ul style="margin:0;padding-left:1.1em;font-size:.95rem">
        <li style="margin-bottom:7px">Grants you can actually apply for, with the eligibility rules the state pages bury</li>
        <li style="margin-bottom:7px">What changed in Iowa law and whether it affects you</li>
        <li style="margin-bottom:7px">Property tax, assessments and appeal deadlines</li>
        <li style="margin-bottom:7px">What is on the ballot, with no endorsements</li>
        <li>What the city and county are deciding</li>
      </ul>
      <p style="font-size:.93rem;color:var(--navy-soft);margin:16px 0 0">Reviewed monthly. Every claim carries its source.</p>
    </aside>
  </div>
</div>
<link rel="stylesheet" href="/policy-center/policy.css">
<script>
(function(){
  var form=document.getElementById('gateform'),
      gate=document.getElementById('gate'),
      aside=document.getElementById('gateaside'),
      app=document.getElementById('policyapp'),
      msg=document.getElementById('gatemsg');

  function boot(code){
    /* The response is the content file. Run it, then start their app. */
    var s=document.createElement('script'); s.text=code; document.head.appendChild(s);
    var a=document.createElement('script'); a.src='/policy-center/app.js';
    a.onload=function(){
      gate.hidden=true; if(aside) aside.hidden=true; app.hidden=false;
    };
    document.head.appendChild(a);
  }

  /* Already unlocked on this device, so skip the form. */
  fetch('/api/policy', { credentials:'same-origin' })
    .then(function(r){ return r.ok ? r.text() : null; })
    .then(function(code){ if(code) boot(code); })
    .catch(function(){});

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var btn=form.querySelector('button');
    btn.disabled=true; msg.textContent='Checking';
    fetch('/api/policy', {
      method:'POST', credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ passcode:document.getElementById('passcode').value })
    }).then(function(r){
      if(r.ok) return r.text();
      return r.json().then(function(j){ throw new Error(j.message || (j.error==='wrong_passcode' ? 'That passcode is not right.' : 'Could not open the Policy Center.')); });
    }).then(boot)
      .catch(function(err){ btn.disabled=false; msg.textContent=err.message; });
  });
})();
</script>`;

  return page({
    title: 'Business Policy Center',
    description: 'A Polk City Area Chamber member benefit. What is changing in state and local policy for businesses here.',
    canonical: '/policy-center/',
    season: 'winter',
    noindex: true
  }, body);
}

/* ---------- write it out -------------------------------------------------- */

async function put(rel, html) {
  const file = path.join(OUT, rel, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true });
  await mkdir(OUT, { recursive: true });

  await put('.', homePage());
  await put('directory', directoryIndex());
  await put('events', eventsPage());
  await put('membership', membershipPage());
  await put('resources', resourcesPage());
  await put('about', aboutPage());
  await put('get-involved', involvedPage());
  await put('privacy', privacyPage());
  await put('news', newsIndex());
  for (const post of POSTS) await put(path.join('news', post.slug), postPage(post));
  await put('jobs', jobsPage());
  await put('join', joinPage());
  await put(path.join('events', 'add'), eventFormPage());
  await writeFile(path.join(OUT, '404.html'), notFoundPage());

  for (const m of MEMBERS) await put(path.join('directory', m.slug), memberPage(m));

  await put('policy-center', policyCenterPage());
  await mkdir(path.join(OUT, 'policy-center'), { recursive: true });
  for (const f of ['app.js', 'policy.css']) {
    await cp(path.join('policy', f), path.join(OUT, 'policy-center', f));
  }

  await cp('assets', path.join(OUT, 'assets'), { recursive: true });

  const urls = ['/', '/directory/', '/events/', '/membership/', '/resources/', '/about/', '/get-involved/', '/privacy/', '/news/', '/jobs/', '/join/', '/events/add/']
    .concat(MEMBERS.map(m => `/directory/${m.slug}/`))
    .concat(POSTS.map(p => `/news/${p.slug}/`));

  await writeFile(path.join(OUT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}
</urlset>`);

  await writeFile(path.join(OUT, 'robots.txt'),
`User-agent: *
Allow: /
Disallow: /policy-center/
Disallow: /api/

Sitemap: ${SITE.url}/sitemap.xml
`);

  console.log(`Built ${urls.length} pages into /${OUT}`);
  console.log(`  ${MEMBERS.length} member pages, ${CATEGORIES.length} categories`);
}

main().catch(e => { console.error(e); process.exit(1); });
