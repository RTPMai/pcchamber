/* ==========================================================================
   Polk City Area Chamber, Business Policy Center

   Routing, rendering, search, deep links, change tracking.
   You should not need to edit this file. All content lives in content.js.

   Addresses this file understands:
     #/            the chamber landing page, two doors
     #/membership  membership levels and benefits
     #/policy      the Business Policy Center home
     #/grants      a policy section, using the group id
     #/whats-new   everything added or changed since the last review
     #/terms       words, sources, and the archive
     #/search?q=x  search across everything
     #entry-id     one entry, opened inside its section
   ========================================================================== */

(function () {
  'use strict';

  var view = document.getElementById('view');
  var nav = document.getElementById('section-nav');
  var searchInput = document.getElementById('search');
  var clearBtn = document.getElementById('clear-search');
  var menuBtn = document.getElementById('menu-btn');
  var sectionsEl = document.getElementById('sections');
  var toastEl = document.getElementById('toast');

  var SEASON_CLASS = {
    sun: 't-sun', autumn: 't-autumn', spring: 't-spring', winter: 't-winter', navy: 't-navy',
  };

  /* ---------- if content.js failed to load, say so instead of showing nothing ---------- */

  if (typeof ENTRIES === 'undefined' || typeof GROUPS === 'undefined' || typeof SITE === 'undefined' ||
      typeof TIERS === 'undefined' || typeof BENEFITS === 'undefined' || typeof MEMBERSHIP === 'undefined') {
    view.innerHTML =
      '<div class="t-navy"><header class="sec-head"><h1>This page did not load correctly</h1>' +
      '<p>The content file is missing or has an error in it. Try refreshing. If it keeps happening, ' +
      'please let the chamber know so we can fix it.</p></header></div>';
    return;
  }

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stripTags(html) {
    var d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').toLowerCase();
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function groupById(id) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i];
    return null;
  }

  function entryById(id) {
    for (var i = 0; i < ENTRIES.length; i++) if (ENTRIES[i].id === id) return ENTRIES[i];
    return null;
  }

  /* Archived entries stay reachable by their old links but drop out of
     lists, counts and search. */
  function live() {
    return ENTRIES.filter(function (e) { return !e.archived; });
  }

  function archived() {
    return ENTRIES.filter(function (e) { return e.archived; });
  }

  function inGroup(id) {
    return live().filter(function (e) { return e.group === id; });
  }

  function tint(group) {
    return SEASON_CLASS[group && group.season] || 't-navy';
  }

  /* A section can carry an expiry date, for content that goes stale on a
     known day. The November ballot is the obvious case. */
  function isExpired(g) {
    return !!(g && g.expires && todayISO() > g.expires);
  }

  function changeFlag(e) {
    var since = SITE.previousReviewISO;
    if (!since) return null;
    if (e.updated && e.updated > since) return 'Updated';
    if (e.added && e.added > since) return 'New';
    return null;
  }

  function changed() {
    return live().filter(function (e) { return changeFlag(e); });
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  /* Search index. Singular and plural both indexed so "taxes" finds "tax". */
  function variants(word) {
    var out = [word];
    if (/(ch|sh|s|x|z)$/.test(word)) out.push(word + 'es'); else out.push(word + 's');
    if (/ies$/.test(word)) out.push(word.slice(0, -3) + 'y');
    if (/es$/.test(word)) out.push(word.slice(0, -2));
    if (/s$/.test(word)) out.push(word.slice(0, -1));
    return out;
  }

  ENTRIES.forEach(function (e) {
    var raw = [
      e.title, e.meta, e.plain, stripTags(e.body),
      e.matters ? e.matters.heading + ' ' + stripTags(e.matters.html) : '',
      (e.sources || []).map(function (s) { return s.label + ' ' + s.publisher; }).join(' '),
      (e.topics || []).join(' '),
    ].join(' ').toLowerCase();

    var words = raw.match(/[a-z0-9]+/g) || [];
    var bag = {};
    words.forEach(function (w) { variants(w).forEach(function (v) { bag[v] = 1; }); });
    e._search = raw + ' ' + Object.keys(bag).join(' ');
  });

  /* ---------- shared pieces ---------- */

  function entryHTML(e, showSectionTag) {
    var g = groupById(e.group);
    var flag = changeFlag(e);

    var tags = '';
    if (e.archived) tags += '<span class="pill pill-archived">No longer current</span>';
    if (flag && !e.archived) tags += '<span class="pill pill-' + flag.toLowerCase() + '">' + flag + '</span>';
    if (showSectionTag && g) tags += '<span class="pill pill-section">' + esc(g.nav) + '</span>';
    if (tags) tags = '<span class="pills">' + tags + '</span>';

    var notice = e.archived
      ? '<p class="archived-note">This item is kept here because a link to it may have been shared. ' +
        'It is no longer current and is not part of the sections above.</p>'
      : '';

    var refs = '';
    var pool = (typeof MEMBER_REFERRALS !== 'undefined' && e.referrals) ? MEMBER_REFERRALS[e.referrals] : null;
    if (pool && (pool.members || []).length) {
      refs = '<div class="referrals"><h4>' + esc(pool.heading || 'Chamber members who do this work') + '</h4><ul>' +
        pool.members.map(function (m) {
          var name = m.url
            ? '<a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(m.name) + '</a>'
            : esc(m.name);
          return '<li>' + name + (m.phone ? ' <span class="ref-phone">' + esc(m.phone) + '</span>' : '') + '</li>';
        }).join('') +
        '</ul><p class="ref-note">Listed alphabetically. These are chamber members, not chamber recommendations. ' +
        'We do not vet, endorse, or take responsibility for the work of any business listed here.</p></div>';
    }

    var sources = (e.sources || []).length
      ? '<div class="sources"><h4>Go deeper</h4><ul>' +
        e.sources.map(function (s) {
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
            esc(s.label) + '</a> <span class="pub">' + esc(s.publisher) + '</span></li>';
        }).join('') + '</ul></div>'
      : '';

    var matters = e.matters
      ? '<div class="matters"><h4>' + esc(e.matters.heading) + '</h4>' + e.matters.html + '</div>'
      : '';

    return '<details class="entry ' + tint(g) + (e.archived ? ' is-archived' : '') + '" id="' + esc(e.id) + '">' +
      '<summary>' +
        '<span class="title">' + tags + esc(e.title) +
          '<span class="meta">' + esc(e.meta) + '</span>' +
          (e.plain ? '<span class="plain">' + esc(e.plain) + '</span>' : '') +
        '</span>' +
        '<svg class="chev" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
          '<path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</summary>' +
      '<div class="body">' + notice + e.body + matters + refs + sources +
        '<div class="entry-actions"><button type="button" class="share" data-id="' + esc(e.id) + '">Copy link to this item</button></div>' +
      '</div>' +
    '</details>';
  }

  function expiredBanner(g) {
    return '<div class="expired"><strong>Out of date.</strong> ' + esc(g.expiredNote || '') + '</div>';
  }

  function toolsHTML() {
    return '<section class="tools-block">' +
      '<h2 class="block-title">Quick answers</h2>' +
      '<p class="block-lede">Official state and county lookup tools. These open in a new tab.</p>' +
      '<div class="tools">' +
        TOOLS.map(function (t) {
          return '<a class="tool" href="' + esc(t.url) + '" target="_blank" rel="noopener">' +
            '<b>' + esc(t.title) + '</b><span>' + esc(t.blurb) + '</span></a>';
        }).join('') +
      '</div></section>';
  }

  /* ---------- pages ---------- */

  function renderLanding() {
    view.innerHTML =
      '<section class="landing">' +
        '<img src="assets/logo-stacked.svg" alt="Polk City Area Chamber of Commerce" class="landing-logo">' +
        '<p class="landing-lede">Two things members ask us for most. Pick one.</p>' +
        '<div class="doors">' +
          '<a class="door t-sun" href="#/membership">' +
            '<h2>' + esc(MEMBERSHIP.title) + '</h2>' +
            '<p>What each level of membership costs and exactly what comes with it. Every benefit opens up to explain what it actually means.</p>' +
            '<span class="door-go">See the levels</span>' +
          '</a>' +
          '<a class="door t-winter" href="#/policy">' +
            '<h2>Business Policy Center</h2>' +
            '<p>New laws, the November ballot, grants, taxes and local decisions, explained in plain language for a business here.</p>' +
            '<span class="door-go">Open the Policy Center</span>' +
          '</a>' +
        '</div>' +
        '<p class="landing-foot"><a href="' + esc(SITE.chamberUrl) + '">Back to the main chamber website</a></p>' +
      '</section>';
  }

  function benefitHTML(ref) {
    var id = typeof ref === 'string' ? ref : ref.id;
    var b = BENEFITS[id];
    if (!b) return '';
    var label = (typeof ref === 'object' && ref.label) ? ref.label : b.name;
    return '<details class="benefit">' +
      '<summary><span class="benefit-name">' + esc(label) + '</span>' +
        '<svg class="chev" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
          '<path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</summary>' +
      '<div class="benefit-detail"><p>' + esc(b.detail) + '</p></div>' +
    '</details>';
  }

  function renderMembership() {
    var tints = ['t-navy', 't-spring', 't-sun', 't-winter', 't-autumn', 't-navy'];

    var tiers = TIERS.map(function (tier, i) {
      return '<section class="tier ' + tints[i % tints.length] + '" id="tier-' + esc(tier.id) + '">' +
        '<header class="tier-head">' +
          (tier.limited ? '<span class="tier-limited">' + esc(tier.limited) + '</span>' : '') +
          '<h2>' + esc(tier.name) + '</h2>' +
          '<p class="tier-price">' + esc(tier.price) + '</p>' +
          (tier.priceBands
            ? '<ul class="price-bands">' + tier.priceBands.map(function (b) {
                return '<li><span class="band-label">' + esc(b.label) + '</span>' +
                  '<span class="band-price">' + esc(b.price) + '</span></li>';
              }).join('') + '</ul>'
            : '') +
          (tier.priceNote ? '<p class="tier-pricenote">' + esc(tier.priceNote) + '</p>' : '') +
          (tier.forWhom ? '<p class="tier-for">' + esc(tier.forWhom) + '</p>' : '') +
          (tier.inherits ? '<p class="tier-inherits">Everything in ' + esc(tier.inherits) + ', plus:</p>' : '') +
        '</header>' +
        '<div class="benefits">' + tier.benefits.map(benefitHTML).join('') + '</div>' +
      '</section>';
    }).join('');

    var jump = '<nav class="tier-jump" aria-label="Jump to a level"><ul>' +
      TIERS.map(function (t2) {
        return '<li><a href="#tier-' + esc(t2.id) + '">' + esc(t2.name) + '</a></li>';
      }).join('') + '</ul></nav>';

    view.innerHTML = '<div class="t-sun">' +
      '<p class="crumb"><a href="#/">Back to the start</a></p>' +
      (MEMBERSHIP.draft
        ? '<div class="expired"><strong>Draft, not yet approved.</strong> ' + esc(MEMBERSHIP.draftNote) + '</div>'
        : '') +
      '<header class="sec-head">' +
        '<h1>' + esc(MEMBERSHIP.title) + '</h1>' +
        '<p>' + esc(MEMBERSHIP.intro) + '</p>' +
      '</header>' +
      jump +
      tiers +
      '<p class="landing-foot">' + esc(MEMBERSHIP.footnote) + '</p>' +
    '</div>';
  }

  function renderHome() {
    var cards = GROUPS.map(function (g) {
      var n = inGroup(g.id).length;
      var expired = isExpired(g);
      var fresh = inGroup(g.id).filter(changeFlag).length;

      var badge = expired
        ? '<span class="card-badge card-badge-stale">Out of date</span>'
        : (g.badge ? '<span class="card-badge">' + esc(g.badge) + '</span>' : '');

      return '<a class="card ' + tint(g) + '" href="#/' + esc(g.id) + '">' + badge +
        '<h2>' + esc(g.title) + '</h2>' +
        '<p>' + esc(g.blurb) + '</p>' +
        '<span class="card-count">' + n + (n === 1 ? ' item' : ' items') +
          (fresh ? '<span class="card-fresh">' + fresh + ' new</span>' : '') +
        '</span>' +
      '</a>';
    }).join('');

    var fresh = changed();
    var whatsNew = fresh.length
      ? '<section class="whatsnew">' +
          '<h2 class="block-title">What changed since ' + esc(SITE.previousReviewLabel || 'the last review') + '</h2>' +
          '<ul class="fresh-list">' +
            fresh.slice(0, 6).map(function (e) {
              var g = groupById(e.group);
              return '<li><a href="#' + esc(e.id) + '">' + esc(e.title) + '</a> ' +
                '<span class="fresh-meta">' + esc(changeFlag(e)) + ' in ' + esc(g ? g.nav : '') + '</span></li>';
            }).join('') +
          '</ul>' +
          '<p><a href="#/whats-new">' +
            (fresh.length > 6 ? 'See all ' + fresh.length + ' changes' : 'Open the full list of changes') +
          '</a></p>' +
        '</section>'
      : '';

    view.innerHTML =
      '<p class="crumb"><a href="#/">Back to the start</a></p>' +
      '<section class="hero">' +
        '<h1>' + esc(SITE.title) + '</h1>' +
        '<p class="intro">' + esc(SITE.intro) + '</p>' +
        '<p class="howto">Pick a section below. Each item opens with one sentence telling you the gist, so you can skim first and read only what applies to you.</p>' +
        '<p class="stamp">Last reviewed ' + esc(SITE.reviewedOn) + '. ' + esc(SITE.cadence) + '.</p>' +
      '</section>' +
      '<div class="cards">' + cards + '</div>' +
      whatsNew +
      toolsHTML() +
      '<section class="tools-block">' +
        '<h2 class="block-title">Not sure what a word means?</h2>' +
        '<p class="block-lede">We keep a plain-English list of the terms that show up over and over, plus every source behind this page. <a href="#/terms">Words and sources</a>.</p>' +
      '</section>';
  }

  function renderSection(id) {
    var g = groupById(id);
    if (!g) return renderHome();

    var entries = inGroup(id);

    var used = TOPICS.filter(function (t) {
      return entries.some(function (e) { return (e.topics || []).indexOf(t.id) !== -1; });
    });
    var chips = (entries.length >= 5 && used.length > 1)
      ? '<div class="chips" id="chips">' +
          [{ id: 'all', label: 'All of this section' }].concat(used).map(function (t) {
            return '<button type="button" class="chip" data-topic="' + esc(t.id) + '" aria-pressed="' +
              (t.id === 'all' ? 'true' : 'false') + '">' + esc(t.label) + '</button>';
          }).join('') +
        '</div>'
      : '';

    view.innerHTML = '<div class="' + tint(g) + '">' +
      '<p class="crumb"><a href="#/policy">Back to all sections</a></p>' +
      '<header class="sec-head">' +
        '<h1>' + esc(g.title) + '</h1>' +
        '<p>' + esc(g.lede) + '</p>' +
      '</header>' +
      (isExpired(g) ? expiredBanner(g) : '') +
      chips +
      '<div id="list">' + entries.map(function (e) { return entryHTML(e, false); }).join('') + '</div>' +
      '<p class="empty" id="none" hidden>Nothing in this section matches that filter.</p>' +
    '</div>';

    var chipsEl = document.getElementById('chips');
    if (chipsEl) {
      chipsEl.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.chip');
        if (!btn) return;
        var topic = btn.getAttribute('data-topic');
        Array.prototype.forEach.call(chipsEl.querySelectorAll('.chip'), function (c) {
          c.setAttribute('aria-pressed', String(c === btn));
        });
        var shown = 0;
        entries.forEach(function (e) {
          var el = document.getElementById(e.id);
          var ok = topic === 'all' || (e.topics || []).indexOf(topic) !== -1;
          el.hidden = !ok;
          if (!ok) el.open = false; else shown++;
        });
        document.getElementById('none').hidden = shown > 0;
      });
    }
  }

  function renderWhatsNew() {
    var fresh = changed();
    var body = fresh.length
      ? '<p class="count">' + fresh.length + (fresh.length === 1 ? ' item' : ' items') + '</p>' +
        fresh.map(function (e) { return entryHTML(e, true); }).join('')
      : '<p class="empty">Nothing has changed since the last review. Everything on this page is as it was on ' +
        esc(SITE.reviewedOn) + '.</p>';

    view.innerHTML = '<div class="t-navy">' +
      '<p class="crumb"><a href="#/policy">Back to all sections</a></p>' +
      '<header class="sec-head">' +
        '<h1>What changed</h1>' +
        '<p>Everything added or rewritten since the last review, so you do not have to reread the whole page.</p>' +
      '</header>' + body +
    '</div>';
  }

  function renderTerms() {
    var arch = archived();
    var archBlock = arch.length
      ? '<h2 class="subhead">Archive</h2>' +
        '<p class="block-lede">Older items, kept so that links already shared keep working. These are no longer current.</p>' +
        arch.map(function (e) { return entryHTML(e, true); }).join('')
      : '';

    view.innerHTML = '<div class="t-navy">' +
      '<p class="crumb"><a href="#/policy">Back to all sections</a></p>' +
      '<header class="sec-head">' +
        '<h1>Words and sources</h1>' +
        '<p>Plain definitions for the terms that come up again and again, and the full list of what we read to keep this page current.</p>' +
      '</header>' +
      '<h2 class="subhead">Words you may run into</h2>' +
      '<dl class="glossary">' +
        GLOSSARY.map(function (t) {
          return '<div class="term"><dt>' + esc(t.term) + '</dt><dd>' + esc(t.def) + '</dd></div>';
        }).join('') +
      '</dl>' +
      '<h2 class="subhead">Where this comes from</h2>' +
      '<p class="block-lede">Nothing here is secret. Follow these yourself if you want. Our job is reading them so you do not have to.</p>' +
      '<ul class="watchlist">' +
        WATCHLIST.map(function (w) {
          return '<li><a href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.label) + '</a>' +
            '<span>' + esc(w.note) + '</span></li>';
        }).join('') +
      '</ul>' +
      '<div class="note">' +
        '<h3>Where the chamber stands on politics</h3>' +
        '<p>This page tells you what a law or ballot question does and who it affects. Where there is a real disagreement, we give you both sides. We do not endorse candidates and we do not tell you how to vote.</p>' +
        '<p>The chamber does take positions on business issues. That is part of the job. When we do, the board votes on it, we say plainly that it is the chamber\'s position, and we keep it separate from the factual items.</p>' +
        '<p>If something here looks wrong or unfair to you, tell us. Getting it right matters more than getting it out fast.</p>' +
      '</div>' +
      archBlock +
    '</div>';
  }

  function renderSearch(q) {
    var terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var hits = terms.length
      ? live().filter(function (e) {
          return terms.every(function (t) { return e._search.indexOf(t) !== -1; });
        })
      : [];

    var body;
    if (!terms.length) {
      body = '<p class="empty">Type something in the search box above.</p>';
    } else if (!hits.length) {
      body = '<p class="empty">Nothing matches that. Try a shorter or different word, or ' +
        '<button type="button" class="linkish" id="reset">go back to the sections</button>.</p>';
    } else {
      body = '<p class="count">' + hits.length + (hits.length === 1 ? ' item' : ' items') +
        ' across the whole page</p>' +
        hits.map(function (e) { return entryHTML(e, true); }).join('');
    }

    view.innerHTML = '<div class="t-navy">' +
      '<p class="crumb"><a href="#/policy">Back to all sections</a></p>' +
      '<header class="sec-head">' +
        '<h1>Results for &ldquo;' + esc(q) + '&rdquo;</h1>' +
        '<p>Searching every section at once.</p>' +
      '</header>' + body +
    '</div>';

    var reset = document.getElementById('reset');
    if (reset) reset.addEventListener('click', function () { go('#/policy'); });
  }

  /* ---------- chrome ---------- */

  function renderChrome() {
    setChrome(null, '');

    /* Two destinations only. The logo is the way back to the start, and the
       Policy Center sections are reached from its own home page. A rail of
       nine links was doing more harm than good. */
    var freshCount = changed().length;
    var anyStale = GROUPS.some(isExpired);

    nav.innerHTML =
      '<li><a href="#/membership" data-route="/membership" style="--nav-tint:var(--sun)">Membership</a></li>' +
      '<li><a href="#/policy" data-route="/policy" style="--nav-tint:var(--winter)">Policy Center' +
        (anyStale ? '<span class="nav-stale" title="Something on this side is out of date">!</span>' : '') +
        (freshCount ? '<span class="nav-count" title="' + freshCount + ' items changed since the last review">' + freshCount + '</span>' : '') +
      '</a></li>';

    document.getElementById('foot-review').textContent =
      SITE.org + '. Last reviewed ' + SITE.reviewedOn +
      '. Everything here was accurate on that date. Check the linked sources before you make a business or legal decision based on it.';

    document.getElementById('foot-contact').innerHTML =
      'Is something missing, out of date, or affecting your business that we should be tracking? Email ' +
      '<a href="mailto:' + esc(SITE.contactEmail) + '">' + esc(SITE.contactEmail) + '</a>.';

    document.getElementById('foot-home').innerHTML =
      '<a href="' + esc(SITE.chamberUrl) + '">Back to the chamber website</a>';
  }

  /* The Business Policy Center is one door, not the whole site. Its name,
     its search box and its page titles stay on the policy side. */
  function setChrome(pageTitle, subLabel, showSearch) {
    document.title = pageTitle ? pageTitle + ' | ' + SITE.org : SITE.org;
    var sub = document.getElementById('brand-sub');
    if (sub) {
      sub.textContent = subLabel || '';
      sub.hidden = !subLabel;
    }
    var bar = document.querySelector('.searchbar');
    if (bar) bar.hidden = !showSearch;
  }

  function markNav(route) {
    /* Everything under the Policy Center marks the Policy Center item. */
    if (route && route !== '/membership' && route !== '/') route = '/policy';
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      if (a.getAttribute('data-route') === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- router ---------- */

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function route() {
    var h = location.hash || '#/';
    var openEntry = null;

    var POLICY = SITE.title;

    if (h.indexOf('#/search') === 0) {
      var q = decodeURIComponent((h.split('?q=')[1] || '').replace(/\+/g, ' '));
      renderSearch(q);
      markNav(null);
      setChrome('Search | ' + POLICY, POLICY, true);
    } else if (h.indexOf('#/') === 0) {
      var id = h.slice(2);
      if (!id) {
        renderLanding(); markNav('/'); setChrome(null, '', false);
      } else if (id === 'membership') {
        renderMembership(); markNav('/membership');
        setChrome(MEMBERSHIP.title, 'Membership', false);
      } else if (id === 'policy') {
        renderHome(); markNav('/policy'); setChrome(POLICY, POLICY, true);
      } else if (id === 'terms') {
        renderTerms(); markNav('/terms');
        setChrome('Words and sources | ' + POLICY, POLICY, true);
      } else if (id === 'whats-new') {
        renderWhatsNew(); markNav('/whats-new');
        setChrome('What changed | ' + POLICY, POLICY, true);
      } else if (groupById(id)) {
        renderSection(id); markNav('/' + id);
        setChrome(groupById(id).title + ' | ' + POLICY, POLICY, true);
      } else {
        renderLanding(); markNav('/'); setChrome(null, '', false);
      }
    } else if (h.indexOf('#tier-') === 0) {
      renderMembership();
      markNav('/membership');
      setChrome(MEMBERSHIP.title, 'Membership', false);
      var tierEl = document.getElementById(h.slice(1));
      if (tierEl && tierEl.scrollIntoView) {
        setTimeout(function () { tierEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
        return;
      }
    } else {
      var e = entryById(h.slice(1));
      if (e && e.archived) {
        renderTerms();
        markNav('/terms');
        setChrome(e.title + ' | ' + POLICY, POLICY, true);
        openEntry = e.id;
      } else if (e) {
        renderSection(e.group);
        markNav('/' + e.group);
        setChrome(e.title + ' | ' + POLICY, POLICY, true);
        openEntry = e.id;
      } else {
        renderLanding();
        markNav('/');
        setChrome(null, '', false);
      }
    }

    if (sectionsEl) sectionsEl.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');

    if (openEntry) {
      var el = document.getElementById(openEntry);
      if (el) {
        el.open = true;
        el.classList.add('hit');
        setTimeout(function () { el.classList.remove('hit'); }, 2600);
        setTimeout(function () {
          if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */

  function copyLink(id) {
    var url = location.origin + location.pathname + '#' + id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast('Link copied'); },
        function () { window.prompt('Copy this link:', url); }
      );
    } else {
      window.prompt('Copy this link:', url);
    }
  }

  view.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.share');
    if (btn) copyLink(btn.getAttribute('data-id'));
  });

  var debounce;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounce);
    var q = searchInput.value;
    clearBtn.hidden = !q;
    debounce = setTimeout(function () {
      if (q.trim()) go('#/search?q=' + encodeURIComponent(q.trim()));
      else go('#/policy');
    }, 220);
  });

  clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    clearBtn.hidden = true;
    go('#/policy');
    searchInput.focus();
  });

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = sectionsEl.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  window.addEventListener('hashchange', route);

  /* ---------- go ---------- */

  renderChrome();
  route();
})();
