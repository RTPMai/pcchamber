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
import { TIER_LIST, WHY, JOIN_FAQ } from './data/membership.js';
import { ABOUT, FAQ, RESOURCE_GROUPS } from './data/pages.js';

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

const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || 'Member';

/* Categories cycle through the four season colors so the directory reads
   as one family rather than eleven unrelated colors. */
const SEASONS = ['spring', 'sun', 'winter', 'autumn'];
const catSeason = id => SEASONS[Math.max(0, CATEGORIES.findIndex(c => c.id === id)) % 4];

/* ---------- shared chrome ------------------------------------------------ */

const LOGO = `<svg viewBox="0 0 100 100" role="img" aria-label="Polk City Area Chamber of Commerce">
<circle cx="50" cy="50" r="47" fill="#002734"/>
<path d="M50 50 L50 11 A39 39 0 0 1 89 50 Z" fill="#F19C30"/>
<path d="M50 50 L89 50 A39 39 0 0 1 50 89 Z" fill="#A36437"/>
<path d="M50 50 L50 89 A39 39 0 0 1 11 50 Z" fill="#68A1B8"/>
<path d="M50 50 L11 50 A39 39 0 0 1 50 11 Z" fill="#838E52"/>
<circle cx="50" cy="50" r="16" fill="#002734"/>
</svg>`;

function head({ title, description, canonical, season = 'navy' }) {
  const full = `${title} | ${SITE.shortName}`;
  return `<!doctype html>
<html lang="en" data-season="${season}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${canonical}">
<meta name="theme-color" content="#002734">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE.url}${canonical}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<link rel="stylesheet" href="/assets/styles.css">
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
      ${LOGO}
      <span class="brand-text">Polk City Area Chamber<span>Polk City, Alleman, Elkhart, Sheldahl</span></span>
    </a>
    <button class="burger" id="burger" aria-expanded="false" aria-controls="menu">Menu</button>
    <nav class="menu" id="menu" aria-label="Main">
      ${items}
      <a class="join" href="/membership/#join">Join</a>
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
        ${LOGO}
        <p>${esc(SITE.tagline)}</p>
        <p><a href="mailto:${SITE.email}">${SITE.email}</a><br>${esc(SITE.mail)}</p>
      </div>
      <div>
        <h4>Around the site</h4>
        <ul>
          ${SITE.nav.filter(n => n.href !== '/').map(n => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('')}
          <li><a href="${SITE.policyCenterUrl}">Business Policy Center</a></li>
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

  const doors = DOORS.map(d => `<a class="door" href="${d.href}" data-season="${d.season}">
  <h3>${esc(d.title)}</h3>
  <p>${esc(d.blurb)}</p>
</a>`).join('');

  const body = `
<section class="hero">
  <div class="wrap">
    <h1>Good business here depends on knowing the people and the rules.</h1>
    <p>${esc(SITE.tagline)} We run the room where local owners meet, and we keep track of what the state, the county, and the city are doing to them.</p>
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
      <a class="btn sun" href="/membership/#join">See what it costs to join</a>
      <a class="btn ghost" href="/about/">More about the chamber</a>
    </div>
  </div></div>
</section>`;

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
    const badge = m.tier !== 'basic'
      ? `<span class="badge">${esc(TIERS[m.tier].label)}</span>` : '';
    const hay = [m.name, m.summary, m.about, catLabel(m.category), ...(m.serves || [])]
      .join(' ').toLowerCase();
    return `<a class="listing" href="/directory/${m.slug}/" data-season="${season}" data-cat="${m.category}" data-find="${esc(hay)}">
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
    <div class="btnrow"><a class="btn sun" href="/membership/#join">Join the chamber</a></div>
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
    <h1>${esc(m.name)}</h1>
    <p>${esc(m.summary)}</p>
  </div>
</div>
<div class="wrap band" data-season="${season}">
  <div class="cols">
    <div>
      <p>${esc(m.about || m.summary)}</p>
      ${tags}
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

  const one = e => `<article class="event" data-season="${e.season || 'sun'}">
  ${e.date ? `<div class="date">${esc(longDate(e.date))}</div>` : `<div class="date">${esc(e.when)}</div>`}
  <h3>${esc(e.title)}</h3>
  <div class="meta">${esc(e.where)}${e.time ? ` &middot; ${esc(e.time)}` : ''}${e.audience === 'members' ? ' &middot; Members only' : ''}</div>
  <p>${esc(e.summary)}</p>
  ${e.detail ? `<p>${esc(e.detail)}</p>` : ''}
  ${e.cost ? `<p class="cost">${esc(e.cost)}</p>` : ''}
  ${e.rsvp ? `<div class="btnrow"><a class="btn" href="${esc(e.rsvp.href)}">${esc(e.rsvp.label)}</a></div>` : ''}
</article>`;

  const body = `
<div class="pagehead" data-season="sun">
  <div class="wrap">
    <h1>Events</h1>
    <p>Come to one before you join. Guests are welcome at almost everything here.</p>
  </div>
</div>
<div class="wrap band">
  <h2>Coming up</h2>
  ${upcoming.length ? upcoming.map(one).join('') : `<div class="empty"><p>Nothing on the calendar right now. The luncheon still runs monthly, so check back or email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p></div>`}
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
  <div class="btnrow"><a class="btn" href="mailto:${SITE.email}?subject=Community%20event">Email the details</a></div>
</div>`;

  return page({
    title: 'Events',
    description: 'The monthly chamber luncheon, the annual golf tournament, ribbon cuttings, and community events in the Polk City area.',
    canonical: '/events/',
    season: 'sun'
  }, body);
}

function membershipPage() {
  const tiers = TIER_LIST.map(t => `<div class="tier${t.highlight ? ' pick' : ''}" data-season="${t.season}">
  <h3>${esc(t.name)}</h3>
  <div class="price">${esc(t.price)}</div>
  <div class="per">${esc(t.per)}</div>
  <p class="who">${esc(t.who)}</p>
  <ul>${t.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  <a class="btn" href="#join">Join at ${esc(t.name)}</a>
</div>`).join('');

  const why = WHY.map(w => `<div class="reason" data-season="${w.season}">
  <h3>${esc(w.title)}</h3>
  <p>${esc(w.body)}</p>
</div>`).join('');

  const faq = JOIN_FAQ.map(f => `<details class="faq">
  <summary>${esc(f.q)}</summary>
  <div class="ans"><p>${esc(f.a)}</p></div>
</details>`).join('');

  const body = `
<div class="pagehead" data-season="autumn">
  <div class="wrap">
    <h1>Membership</h1>
    <p>What it costs and what you get. On the page, where you can read it without asking anyone.</p>
  </div>
</div>
<div class="wrap band">
  <div class="note"><p>Placeholder pricing. Swap in the board-approved figures in <code>data/membership.js</code> before this goes public.</p></div>
  <div class="tiers">${tiers}</div>
</div>
<div class="band warm">
  <div class="wrap">
    <h2>Why businesses here pay for this</h2>
    <div class="reasons">${why}</div>
  </div>
</div>
<div class="wrap band" id="join">
  <h2>Join</h2>
  <p class="lede">Two steps. Tell us about the business, then pay the invoice we send back.</p>
  <p>In the demo build this is a mailto link. In the real thing it becomes a short form and a Stripe payment page, so a new member can join at nine at night without anybody writing a check.</p>
  <div class="btnrow">
    <a class="btn sun" href="mailto:${SITE.email}?subject=I%20want%20to%20join%20the%20chamber">Start a membership</a>
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
    title: 'Membership',
    description: 'Polk City Area Chamber membership tiers, prices, and what each one includes.',
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
  <div class="wrap"><div class="col">
    <h2>The Business Policy Center</h2>
    <p>Most of these state pages are written for people who already know the jargon. The chamber keeps a separate site that says what changed, who it applies to, and whether you should care, in plain language, with every claim linked to its source.</p>
    <div class="btnrow"><a class="btn sun" href="${SITE.policyCenterUrl}">Open the Policy Center</a></div>
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

  for (const m of MEMBERS) await put(path.join('directory', m.slug), memberPage(m));

  await cp('assets', path.join(OUT, 'assets'), { recursive: true });

  const urls = ['/', '/directory/', '/events/', '/membership/', '/resources/', '/about/']
    .concat(MEMBERS.map(m => `/directory/${m.slug}/`));

  await writeFile(path.join(OUT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}
</urlset>`);

  await writeFile(path.join(OUT, 'robots.txt'),
`User-agent: *
Allow: /
Sitemap: ${SITE.url}/sitemap.xml
`);

  console.log(`Built ${urls.length} pages into /${OUT}`);
  console.log(`  ${MEMBERS.length} member pages, ${CATEGORIES.length} categories`);
}

main().catch(e => { console.error(e); process.exit(1); });
