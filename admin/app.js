/* ==========================================================================
   THE ADMIN

   Three screens: sign in, pick a collection, edit a thing in it. Plus the
   benefits tracker, which works differently and is explained where it
   starts, further down.

   Nothing is saved until Save is pressed. Saving makes a commit on GitHub,
   which starts a rebuild, which takes about a minute. The interface says
   this out loud rather than pretending the change is instant, because
   somebody who reloads the site five seconds later and sees no change will
   assume it did not work and do it again.
   ========================================================================== */

import { COLLECTIONS } from './schema.js';
import { BENEFITS, TIER_NAMES, benefitsFor, summarize, uptake, describe, thisYear, yearOf } from './benefits.js';
import { duesYear, money, duesFor, billTo } from './dues.js';

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
};

const state = {
  who: localStorage.getItem('pcc-admin-who') || '',
  collection: null,
  file: null,     // { name, sha, data }
  index: null,    // which item is open
  dirty: false,
  itemDirty: false // typed into the open entry, not kept yet
};

/* ---------- the back button ------------------------------------------------
   Every screen has its own address after the #, like #members or
   #events/luncheon-oct. That is what makes the browser's back and forward
   buttons move between screens instead of leaving the admin, and what
   makes a reload land back on the same screen.

   Screens call mark() with their address. The in-page back buttons call
   up(), which uses the browser's own back when that is where they lead,
   so back and forward stay in step with what is on screen.
   ========================================================================== */

let current = null;   // the address of what is on screen now

const addr = (...parts) => parts.filter(p => p !== '' && p != null).map(p => encodeURIComponent(p)).join('/');

function mark(route) {
  const was = current;
  current = route;
  if (location.hash.slice(1) === route) return;
  history.pushState({ prev: was }, '', route ? '#' + route : location.pathname + location.search);
}

function up(route, draw) {
  if (history.state && history.state.prev === route) history.back();
  else draw();
}

/* ---------- talking to the server ---------------------------------------- */

async function call(payload, url = '/api/admin') {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let body;
  /* A crashed function returns the platform's own error page, which is not
     JSON. Parsing blindly would report a syntax error instead of the fault. */
  try { body = JSON.parse(text); } catch { body = null; }
  if (!res.ok) {
    throw new Error(
      (body && body.message) ||
      (res.status >= 500 ? `Something went wrong at our end (error ${res.status}).` : 'That did not work.')
    );
  }
  return body;
}

/* ---------- reading and writing nested fields ---------------------------- */

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function set(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  const empty = value === '' || value == null ||
    (Array.isArray(value) && value.length === 0);
  if (empty) delete cur[last];
  else cur[last] = value;

  /* An object left with nothing in it, like rsvp after both parts were
     cleared, would render as an empty button. Drop it. */
  if (parts.length) {
    let owner = obj;
    for (let i = 0; i < parts.length - 1; i++) owner = owner[parts[i]];
    const holder = parts[parts.length - 1];
    if (owner[holder] && Object.keys(owner[holder]).length === 0) delete owner[holder];
  }
}

/* ---------- screens ------------------------------------------------------- */

function screenSignIn(message) {
  const pass = el('input', { type: 'password', id: 'pass', autocomplete: 'current-password' });
  const who = el('input', { type: 'text', id: 'who', value: state.who, autocomplete: 'name' });
  const msg = el('p', { class: 'msg', role: 'status' }, message || '');

  const go = async () => {
    if (!who.value.trim()) { msg.textContent = 'Please put your name in, so changes have an author.'; return; }
    msg.textContent = 'Checking';
    try {
      await call({ action: 'signin', passcode: pass.value });
      state.who = who.value.trim();
      localStorage.setItem('pcc-admin-who', state.who);
      await loadDirectory();
      route(location.hash.slice(1));
    } catch (e) { msg.textContent = e.message; }
  };

  render(
    el('div', { class: 'panel narrow' },
      el('h1', {}, 'Chamber admin'),
      el('p', { class: 'lede' }, 'Change what is on the website. No technical knowledge needed.'),
      el('div', { class: 'field' },
        el('label', { for: 'who' }, 'Your name'),
        el('span', { class: 'help' }, 'Goes on the change, so there is a record of who did what.'),
        who),
      el('div', { class: 'field' },
        el('label', { for: 'pass' }, 'Admin passcode'),
        pass),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: go }, 'Sign in')),
      msg
    ), false);

  pass.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  (state.who ? pass : who).focus();
}

function screenHome() {
  mark('');
  const attention = el('div', { class: 'attention', 'aria-live': 'polite' });
  loadAttention(attention);
  render(
    el('div', {},
      el('h1', {}, 'What would you like to change?'),
      attention,
      el('div', { class: 'cards' },
        el('button', { class: 'card', 'data-season': 'autumn', onclick: () => screenBenefits() },
          el('strong', {}, 'Member benefits'),
          el('span', {}, 'Log it when a member uses a benefit, and see who is not using theirs.')),
        el('button', { class: 'card', 'data-season': 'sun', onclick: () => screenEvents() },
          el('strong', {}, 'Event check-in'),
          el('span', {}, 'Who registered, who showed up, and luncheon tickets used at the door.')),
        el('button', { class: 'card', 'data-season': 'winter', onclick: () => screenNewsletter() },
          el('strong', {}, 'Newsletter'),
          el('span', {}, 'Write a short opening. Events, news and deals fill in the rest.')),
        el('button', { class: 'card', 'data-season': 'navy', onclick: () => screenDues() },
          el('strong', {}, 'Membership dues'),
          el('span', {}, 'Send each member their invoice through Stripe, and see who has paid.')),
        el('button', { class: 'card', 'data-season': 'winter', onclick: () => screenMessage() },
          el('strong', {}, 'Message to members'),
          el('span', {}, 'Email every member, or only some: all the restaurants, all the Sponsors.')),
        el('button', { class: 'card', 'data-season': 'spring', onclick: () => screenDigest() },
          el('strong', {}, 'Quarterly member email'),
          el('span', {}, 'Each member\u2019s listing stats and unused benefits, once a quarter.')),
        COLLECTIONS.map(c =>
          el('button', { class: 'card', 'data-season': c.season, onclick: () => openCollection(c) },
            el('strong', {}, c.title),
            el('span', {}, c.blurb))))
    ));
}

async function loadCollection(c) {
  state.collection = c;
  state.file = await call({ action: 'load', file: c.file });
  state.dirty = false;
}

/* The monthly content audit, live. Same checks as the email on the 1st,
   so what the email asks for can be ticked off here and seen to clear. */
async function loadAttention(box) {
  let d;
  try { d = await call({ action: 'audit' }, '/api/digest'); } catch { return; }
  if (!d.findings.length) {
    box.replaceChildren(el('p', { class: 'note' }, 'Nothing on the website looks out of date.'));
    return;
  }
  const label = { high: 'Fix soon', medium: 'Worth doing', low: 'When you can' };
  box.replaceChildren(el('details', { class: 'panel attention-list', open: d.findings.some(f => f.level === 'high') },
    el('summary', {}, `Needs attention (${d.findings.length})`),
    el('ul', {}, d.findings.map(f => el('li', { 'data-level': f.level },
      el('span', { class: 'lvl' }, label[f.level]),
      el('strong', {}, f.where), ' ', f.text))),
    el('p', { class: 'help' }, d.auto
      ? `This list is also emailed to ${d.to.join(', ')} on the 1st of each month.`
      : 'Set AUDIT_AUTO to on in Vercel to have this list emailed on the 1st of each month.')));
}

async function openCollection(c) {
  mark(addr(c.key));
  render(el('p', { class: 'loading' }, 'Loading ' + c.title.toLowerCase()));
  try {
    await loadCollection(c);
    screenList();
  } catch (e) {
    render(el('div', { class: 'panel' },
      el('h1', {}, 'Could not open that'),
      el('p', { class: 'msg' }, e.message),
      el('div', { class: 'row' }, el('button', { class: 'btn', onclick: screenHome }, 'Back'))));
  }
}

function items() { return state.file.data[state.collection.key] || []; }

function sorted() {
  const c = state.collection;
  const list = items().map((item, i) => ({ item, i }));
  if (!c.sort) return list;
  const desc = c.sort.startsWith('-');
  const key = desc ? c.sort.slice(1) : c.sort;
  list.sort((a, b) => String(a.item[key] ?? '').localeCompare(String(b.item[key] ?? '')));
  if (desc) list.reverse();
  return list;
}

function screenList() {
  const c = state.collection;
  const list = sorted();
  const needing = c.flag ? items().filter(c.flag).length : 0;
  mark(addr(c.key));

  /* Search filters the rows already on screen rather than redrawing, so
     the box keeps focus while somebody types. It matches anything in the
     entry: name, contact person, email, town, what they do. Kept per
     section, so coming back from an entry keeps the search. */
  state.q = state.q || {};
  const search = el('input', { type: 'search', class: 'bsearch', placeholder: `Search ${c.title.toLowerCase()}`, 'aria-label': `Search ${c.title.toLowerCase()}` });
  search.value = state.q[c.key] || '';
  const none = el('li', { class: 'empty', hidden: true }, 'Nothing matches that.');

  const rowsEl = list.map(({ item, i }) =>
    el('li', { 'data-find': [c.label(item), c.sub ? c.sub(item) : '', JSON.stringify(item)].join(' ').toLowerCase(), 'data-i': i },
      el('button', { class: 'row-open', onclick: () => openItem(i) },
        el('strong', {}, c.label(item)),
        el('span', {}, c.sub ? c.sub(item) : ''),
        c.flag && c.flag(item) && el('em', { class: 'flag' }, c.flagNote)),
      el('button', { class: 'row-del', title: 'Remove', onclick: () => removeItem(i) }, 'Remove')));

  const applySearch = () => {
    state.q[c.key] = search.value;
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const li of rowsEl) {
      const hit = !q || li.dataset.find.includes(q);
      li.hidden = !hit;
      if (hit) shown++;
    }
    none.hidden = !(q && !shown);
  };
  search.addEventListener('input', applySearch);
  /* Enter opens the only match. */
  search.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const hits = rowsEl.filter(li => !li.hidden);
    if (hits.length === 1) openItem(Number(hits[0].dataset.i));
  });

  render(
    el('div', {},
      el('button', { class: 'back', onclick: leaveCollection }, 'All sections'),
      el('h1', {}, c.title),
      c.note && el('p', { class: 'note' }, c.note),
      needing > 0 && el('p', { class: 'note warn' },
        `${needing} of ${items().length} still ${c.flagNote ? c.flagNote.toLowerCase() : 'need attention'}.`),
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', onclick: () => openItem(-1) }, 'Add new'),
        c.key === 'members' && el('button', { class: 'btn', onclick: downloadChamberMaster }, 'Download for ChamberMaster'),
        state.dirty && el('button', { class: 'btn', onclick: save }, 'Save changes'),
        state.dirty && el('span', { class: 'unsaved' }, 'Not saved yet')),
      list.length > 5 && search,
      el('ul', { class: 'list' },
        list.length ? [...rowsEl, none] : el('li', { class: 'empty' }, 'Nothing here yet.'))
    ));
  applySearch();
  if (list.length > 5 && !matchMedia('(hover: none)').matches) search.focus();
}

function leaveCollection() {
  if (state.dirty && !confirm('You have changes that are not saved. Leave anyway?')) return;
  state.collection = null; state.file = null; state.dirty = false;
  up('', screenHome);
}

function removeItem(i) {
  const c = state.collection;
  const name = c.label(items()[i]);
  if (!confirm(`Remove "${name}"? It disappears from the website when you save.`)) return;
  items().splice(i, 1);
  state.dirty = true;
  screenList();
}

/* ---------- the edit form ------------------------------------------------- */

function fieldControl(f, item, onchange) {
  const path = f.path || f.id;
  const value = get(item, path);
  const id = 'f-' + f.id;

  if (f.type === 'textarea') {
    const n = el('textarea', { id, rows: 4 });
    n.value = value || '';
    n.addEventListener('input', () => onchange(path, n.value));
    return n;
  }

  if (f.type === 'list') {
    const n = el('textarea', { id, rows: 6 });
    n.value = Array.isArray(value) ? value.join('\n') : (value || '');
    n.addEventListener('input', () =>
      onchange(path, n.value.split('\n').map(s => s.trim()).filter(Boolean)));
    return n;
  }

  if (f.type === 'check') {
    const n = el('input', { type: 'checkbox', id });
    n.checked = Boolean(value);
    n.addEventListener('change', () => onchange(path, n.checked ? true : ''));
    return n;
  }

  if (f.type === 'select') {
    const opts = f.from
      ? (state.file.data[f.from] || []).map(o => ({ v: o.id, t: o.label }))
      : f.options.map(o => ({ v: o, t: (f.labels && f.labels[o]) || o }));
    const n = el('select', { id },
      el('option', { value: '' }, '\u2014'),
      opts.map(o => el('option', { value: o.v, selected: value === o.v }, o.t)));
    n.addEventListener('change', () => onchange(path, n.value));
    return n;
  }

  if (f.type === 'members') return memberPicker(f, value, path, onchange, id);

  const types = { date: 'date', time: 'time', url: 'url', email: 'email', tel: 'tel' };
  const n = el('input', { type: types[f.type] || 'text', id });
  n.value = value || '';
  n.addEventListener('input', () => onchange(path, n.value));
  return n;
}

/* The one control that needs real data behind it. Typing a business name
   is how people get slugs wrong, so they pick from the actual directory. */
function memberPicker(f, value, path, onchange, id) {
  const single = f.max === 1;
  let chosen = single ? (value ? [value] : []) : (Array.isArray(value) ? [...value] : []);

  const wrap = el('div', { class: 'picker' });
  const search = el('input', { type: 'search', id, placeholder: 'Type a business name' });
  const results = el('div', { class: 'picker-results' });
  const chips = el('div', { class: 'picker-chips' });

  const push = () => onchange(path, single ? (chosen[0] || '') : chosen);

  const drawChips = () => {
    chips.replaceChildren(...chosen.map(slug =>
      el('span', { class: 'chip' },
        nameFor(slug),
        el('button', { title: 'Remove', onclick: () => {
          chosen = chosen.filter(s => s !== slug); push(); drawChips();
        } }, '\u00d7'))));
  };

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    if (!q) { results.replaceChildren(); return; }
    const hits = DIRECTORY
      .filter(m => m.name.toLowerCase().includes(q) && !chosen.includes(m.slug))
      .slice(0, 6);
    results.replaceChildren(...(hits.length ? hits.map(m =>
      el('button', { class: 'picker-hit', onclick: () => {
        if (single) chosen = [m.slug]; else chosen.push(m.slug);
        search.value = ''; results.replaceChildren(); push(); drawChips();
      } }, m.name)) : [el('p', { class: 'picker-none' }, 'No member by that name.')]));
  };

  search.addEventListener('input', draw);
  drawChips();
  wrap.append(chips, search, results);
  return wrap;
}

let DIRECTORY = [];
const nameFor = slug => (DIRECTORY.find(m => m.slug === slug) || {}).name || slug;

/* The member picker needs the directory whichever way somebody arrived,
   signing in fresh or returning with a cookie. Loading it on only one of
   those paths left the picker silently empty for anyone who signed in. */
async function loadDirectory() {
  if (DIRECTORY.length) return;
  const members = await call({ action: 'load', file: 'members.json' });
  DIRECTORY = (members.data.members || [])
    .map(m => ({ slug: m.slug, name: m.name, tier: m.tier }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function openItem(i) {
  const c = state.collection;
  const adding = i === -1;
  const item = adding ? {} : JSON.parse(JSON.stringify(items()[i]));
  state.index = i;
  state.itemDirty = false;
  mark(addr(c.key, adding ? 'new' : i));

  const onchange = (path, v) => { set(item, path, v); state.itemDirty = true; };
  const toList = () => { state.itemDirty = false; up(addr(c.key), screenList); };
  const backToList = () => {
    if (state.itemDirty && !confirm('Discard the changes to this entry?')) return;
    toList();
  };

  const body = el('div', {},
    c.fields.filter(f => !f.advanced).map(f => fieldRow(f, item, onchange)),
    el('details', { class: 'advanced' },
      el('summary', {}, 'Settings you probably should not change'),
      c.fields.filter(f => f.advanced).map(f => fieldRow(f, item, onchange)))
  );

  const msg = el('p', { class: 'msg', role: 'status' });

  const keep = () => {
    /* Fill in anything that can be worked out before complaining about it.
       References and web addresses live in the advanced section, so asking
       somebody to fill one in means asking them to find a box they cannot
       see. These are only derived when adding, never on an existing entry,
       because changing one after publishing breaks every link to it. */
    if (adding) {
      for (const f of c.fields) {
        const path = f.path || f.id;
        if (f.derive && !get(item, path)) {
          const made = f.derive(item);
          if (made) {
            set(item, path, uniqueValue(path, made));
            const box = document.getElementById('f-' + f.id);
            if (box) box.value = get(item, path);
          }
        }
      }
    }

    const missing = c.fields.filter(f => f.required && !get(item, f.path || f.id));
    if (missing.length) {
      /* If what is missing is hidden away, open the drawer rather than
         pointing at a box that is not on screen. */
      if (missing.some(f => f.advanced)) {
        const drawer = document.querySelector('details.advanced');
        if (drawer) drawer.open = true;
      }
      msg.textContent = 'Still needed: ' + missing.map(f => f.label.toLowerCase()).join(', ') + '.';
      return;
    }
    if (adding) items().push(item); else items()[i] = item;
    state.dirty = true;
    toList();
  };

  render(
    el('div', {},
      el('button', { class: 'back', onclick: backToList }, 'Back to ' + c.title.toLowerCase()),
      el('h1', {}, adding ? 'Add to ' + c.title.toLowerCase() : c.label(item)),
      body,
      el('div', { class: 'row sticky' },
        el('button', { class: 'btn primary', onclick: keep }, adding ? 'Add it' : 'Keep changes'),
        el('button', { class: 'btn', onclick: toList }, 'Cancel'),
        msg)
    ));
}

function fieldRow(f, item, onchange) {
  const id = 'f-' + f.id;
  return el('div', { class: 'field' + (f.type === 'check' ? ' check' : '') },
    el('label', { for: id }, f.label, f.required && el('span', { class: 'req' }, 'required')),
    f.help && el('span', { class: 'help' }, f.help),
    fieldControl(f, item, onchange));
}

/* Two events called the same thing on the same day would fight over one
   address. Number the second one rather than letting it overwrite. */
function uniqueValue(path, base) {
  const taken = new Set(items().map(o => get(o, path)).filter(Boolean));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/* ---------- saving -------------------------------------------------------- */

async function save() {
  const c = state.collection;
  render(el('p', { class: 'loading' }, 'Saving'));
  try {
    const out = await call({
      action: 'save',
      file: c.file,
      data: state.file.data,
      sha: state.file.sha,
      who: state.who,
      note: `Update ${c.title.toLowerCase()}`
    });
    state.file.sha = out.sha;
    state.dirty = false;
    /* A member added or renamed should appear in the picker straight away. */
    if (c.file === 'members.json') {
      DIRECTORY = (state.file.data.members || [])
        .map(m => ({ slug: m.slug, name: m.name, tier: m.tier }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    render(
      el('div', { class: 'panel narrow' },
        el('h1', {}, 'Saved'),
        el('p', {}, 'The change is recorded. The website rebuilds itself and the change will be live in about a minute.'),
        el('p', { class: 'help' }, 'If you reload the site straight away and do not see it, wait and reload again. It is not broken.'),
        el('div', { class: 'row' },
          el('button', { class: 'btn primary', onclick: () => openCollection(c) }, 'Back to ' + c.title.toLowerCase()),
          el('button', { class: 'btn', onclick: goHome }, 'All sections'))));
  } catch (e) {
    render(
      el('div', { class: 'panel narrow' },
        el('h1', {}, 'Not saved'),
        el('p', { class: 'msg' }, e.message),
        el('p', { class: 'help' }, 'Your changes are still here. Nothing has been lost.'),
        el('div', { class: 'row' },
          el('button', { class: 'btn primary', onclick: save }, 'Try again'),
          el('button', { class: 'btn', onclick: screenList }, 'Back'))));
  }
}

/* ---------- the benefits tracker ------------------------------------------

   Not a collection like the others, for two reasons.

   What it shows is worked out, not typed: how many luncheon tickets are
   left is the allowance for their level minus what has been logged. So it
   has its own screens rather than a form.

   And it saves one entry at a time, straight away. There is no Save
   button to forget. Each entry is its own commit in content/benefits.json,
   with the name of whoever logged it, and the member sees it on their
   account page as soon as it is saved, without waiting for a rebuild.
   -------------------------------------------------------------------------- */

const bens = { uses: [], year: thisYear(), tier: 'all', sort: 'low' };

async function loadUses() {
  const file = await call({ action: 'load', file: 'benefits.json' });
  bens.uses = Array.isArray(file.data.uses) ? file.data.uses : [];
}

const today = () => new Date().toISOString().slice(0, 10);
const tierName = t => TIER_NAMES[t] || t || 'No level set';
const usesFor = slug => bens.uses.filter(u => u.member === slug);
const benefitLabel = id => (BENEFITS.find(b => b.id === id) || {}).label || id;

/* Listing stats, when the store has them. */
function viewsText(slug) {
  const st = bens.stats && bens.stats[slug] && bens.stats[slug].year;
  if (!st) return null;
  return `${(st.view || 0).toLocaleString('en-US')} page view${st.view === 1 ? '' : 's'}`;
}
function clicksText(slug) {
  const st = bens.stats && bens.stats[slug] && bens.stats[slug].year;
  if (!st) return '';
  const n = (st.web || 0) + (st.phone || 0) + (st.email || 0) + (st.map || 0);
  return n ? `, ${n} contact click${n === 1 ? '' : 's'}` : '';
}

function yearsAvailable() {
  return [...new Set(bens.uses.map(u => yearOf(u.date)).concat(thisYear(), bens.year))]
    .filter(Boolean).sort((a, b) => b - a);
}

async function loadBenefits() {
  await loadDirectory();
  await loadUses();
  try {
    bens.stats = (await call({ action: 'stats', year: bens.year, slugs: DIRECTORY.map(m => m.slug) })).stats || {};
  } catch { bens.stats = {}; }
  bens.loaded = true;
}

async function screenBenefits() {
  mark('benefits');
  render(el('p', { class: 'loading' }, 'Loading benefits'));
  try {
    await loadBenefits();
    drawBenefitsOverview();
  } catch (e) {
    render(el('div', { class: 'panel' },
      el('h1', {}, 'Could not open that'),
      el('p', { class: 'msg' }, e.message),
      el('div', { class: 'row' }, el('button', { class: 'btn', onclick: screenHome }, 'Back'))));
  }
}

function overviewRows() {
  return DIRECTORY
    .filter(m => bens.tier === 'all' || m.tier === bens.tier)
    .map(m => {
      const mine = usesFor(m.slug).filter(u => yearOf(u.date) === bens.year);
      const rows = summarize(m.tier, mine, bens.year);
      return {
        m, rows, logged: mine.length,
        pct: uptake(rows),
        last: mine.map(u => u.date).sort().pop() || null
      };
    });
}

function drawBenefitsOverview() {
  mark('benefits');
  const list = overviewRows();
  if (bens.sort === 'low') {
    list.sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1) || a.logged - b.logged || a.m.name.localeCompare(b.m.name));
  } else {
    list.sort((a, b) => a.m.name.localeCompare(b.m.name));
  }
  const idle = list.filter(r => !r.logged).length;
  const tiersInUse = [...new Set(DIRECTORY.map(m => m.tier))];

  const pick = (label, value, options, onpick) => {
    const s = el('select', {}, options.map(([v, t]) => el('option', { value: v, selected: String(v) === String(value) }, t)));
    s.addEventListener('change', () => onpick(s.value));
    return el('label', { class: 'mini' }, label, s);
  };

  /* Search filters the rows already on screen rather than redrawing, so
     the box keeps focus and the cursor while somebody is typing. */
  const search = el('input', { type: 'search', class: 'bsearch', placeholder: 'Find a member', 'aria-label': 'Find a member' });
  search.value = bens.q || '';
  const none = el('li', { class: 'empty', hidden: true }, 'No member by that name.');

  const rowsEl = list.map(r =>
    el('li', { 'data-find': r.m.name.toLowerCase() },
      el('button', { class: 'row-open', onclick: () => drawBenefitsMember(r.m.slug) },
        el('strong', {}, r.m.name),
        el('span', {}, [
          tierName(r.m.tier),
          r.pct == null ? null : `${r.pct}% of counted benefits used`,
          r.last ? 'last logged ' + r.last : null,
          viewsText(r.m.slug)
        ].filter(Boolean).join(' \u00b7 ')),
        r.pct != null && r.logged > 0 && el('span', { class: 'meter', 'aria-hidden': 'true' },
          el('i', { style: `width:${r.pct}%` })),
        !r.logged && el('em', { class: 'flag' }, 'Nothing used yet'))));

  const applySearch = () => {
    bens.q = search.value;
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const li of rowsEl) {
      const hit = !q || li.dataset.find.includes(q);
      li.hidden = !hit;
      if (hit) shown++;
    }
    none.hidden = !(q && !shown);
  };
  search.addEventListener('input', applySearch);
  /* Enter opens the only match, so find-and-open is two keystrokes. */
  search.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const open = rowsEl.filter(li => !li.hidden);
    if (open.length === 1) open[0].querySelector('button').click();
  });

  render(
    el('div', {},
      el('button', { class: 'back', onclick: goHome }, 'All sections'),
      el('h1', {}, 'Member benefits'),
      el('p', { class: 'note' },
        'Click Log when a member uses something. It saves with today\u2019s date and they see it on their account page straight away.'),
      tiersInUse.length === 1 && tiersInUse[0] === 'basic' && el('p', { class: 'note warn' },
        'Every member is still on Basic Business, so everybody shows the Basic allowances. ',
        'Set each member\u2019s level under Member directory first.'),
      search,
      el('div', { class: 'filters' },
        pick('Year', bens.year, yearsAvailable().map(y => [y, String(y)]), v => { bens.year = Number(v); drawBenefitsOverview(); }),
        pick('Level', bens.tier, [['all', 'Every level']].concat(
          ['individual', 'basic', 'partner', 'investor', 'sponsor', 'champion'].map(t => [t, tierName(t)])),
          v => { bens.tier = v; drawBenefitsOverview(); }),
        pick('Order', bens.sort, [['low', 'Least used first'], ['name', 'By name']], v => { bens.sort = v; drawBenefitsOverview(); })),
      el('p', { class: 'tally' },
        `${list.length} member${list.length === 1 ? '' : 's'}. `,
        idle ? el('strong', {}, `${idle} with nothing logged for ${bens.year}.`) : 'All have something logged.'),
      el('ul', { class: 'list' },
        list.length ? rowsEl.concat(none) : el('li', { class: 'empty' }, 'No members on that level.')),
      el('div', { class: 'row' },
        el('button', { class: 'btn', onclick: downloadSummary }, `Download ${bens.year} summary`),
        el('button', { class: 'btn', onclick: downloadLog }, `Download ${bens.year} log`)),
      el('p', { class: 'help' }, 'Both open in Excel. The summary is one line per member per benefit; the log is every entry.')
    ));

  applySearch();
  search.focus();
}

/* One member. Every benefit that gets counted has two buttons:

     Log     saves one use, dated today, straight away. The common case.
     Note    opens a small form under the row for the uncommon one: a
             different date, more than one at a time, or a note.

   Sponsorship credit needs a dollar amount, so its Log opens the form. */
function drawBenefitsMember(slug, flash) {
  const m = DIRECTORY.find(x => x.slug === slug);
  if (!m) return drawBenefitsOverview();
  mark(addr('benefits', slug));
  const mine = usesFor(slug).filter(u => yearOf(u.date) === bens.year);
  const rows = summarize(m.tier, mine, bens.year).filter(r => r.kind !== 'open');

  const status = el('div', { class: 'flash', role: 'status' });
  if (flash) {
    status.append(el('span', {}, flash.text));
    if (flash.undo) {
      status.append(el('button', { class: 'linkbtn', onclick: () => removeUse(flash.undo, true) }, 'Undo'));
    }
  }

  const save = async (use, btn) => {
    if (btn) btn.disabled = true;
    try {
      const out = await call({ action: 'loguse', who: state.who, use: { member: slug, ...use } });
      bens.uses.push(out.entry);
      const b = BENEFITS.find(x => x.id === out.entry.benefit);
      const what = out.entry.amount
        ? `$${out.entry.amount.toLocaleString('en-US')} of ${b.label.toLowerCase()}`
        : (out.entry.qty ? `${out.entry.qty} \u00d7 ` : '') + b.label.toLowerCase();
      drawBenefitsMember(slug, { text: `Logged ${what}, ${out.entry.date}.`, undo: out.entry });
    } catch (e) {
      if (btn) btn.disabled = false;
      status.replaceChildren(el('span', { class: 'err' }, e.message));
    }
  };

  async function removeUse(u, quiet) {
    if (!quiet && !confirm(`Remove ${benefitLabel(u.benefit).toLowerCase()} on ${u.date}? It comes off their account page too.`)) return;
    try {
      await call({ action: 'unloguse', who: state.who, id: u.id });
      bens.uses = bens.uses.filter(x => x.id !== u.id);
      drawBenefitsMember(slug, { text: quiet ? 'Undone.' : 'Removed.' });
    } catch (e) {
      alert(e.message);
    }
  }

  const detailForm = (r, li) => {
    const date = el('input', { type: 'date', value: today(), 'aria-label': 'Date' });
    const qty = el('input', { type: 'number', min: '1', max: '99', value: '1', 'aria-label': 'How many' });
    const amount = el('input', { type: 'number', min: '1', step: '1', placeholder: 'Dollars', 'aria-label': 'Dollar amount' });
    const note = el('input', { type: 'text', maxlength: '300', placeholder: 'Which event, which post', 'aria-label': 'Note' });
    const go = el('button', { class: 'btn primary small' }, 'Log it');
    go.addEventListener('click', () => save({
      benefit: r.id, date: date.value, qty: qty.value, amount: amount.value, note: note.value
    }, go));

    const form = el('div', { class: 'bdetail' },
      el('label', {}, 'Date', date),
      (r.kind === 'count' || r.kind === 'tally') && el('label', { class: 'narrowin' }, 'How many', qty),
      r.kind === 'dollars' && el('label', { class: 'narrowin' }, 'Amount', amount),
      el('label', { class: 'grow' }, 'Note, the member sees this', note),
      el('div', { class: 'bdetail-go' },
        go,
        el('button', { class: 'linkbtn', onclick: () => form.remove() }, 'Cancel')));

    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') go.click(); });
    return { form, focus: () => (r.kind === 'dollars' ? amount : note).focus() };
  };

  const openDetail = (r, li) => {
    const shown = li.querySelector('.bdetail');
    if (shown) { shown.remove(); return; }
    document.querySelectorAll('.bdetail').forEach(f => f.remove());
    const { form, focus } = detailForm(r, li);
    li.append(form);
    focus();
  };

  const rowFor = r => {
    const li = el('li', { class: r.over ? 'over' : (r.kind === 'once' && r.used ? 'done' : '') },
      el('span', { class: 'bname' }, r.label),
      el('span', { class: 'bsays' }, describe(r),
        r.over ? ' \u00b7 over the allowance' : '',
        r.left > 0 && r.kind !== 'once' ? ` \u00b7 ${r.kind === 'dollars' ? '$' + r.left.toLocaleString('en-US') : r.left} left` : ''));

    if (!r.outside) {
      const log = el('button', { class: 'bquick primary' }, 'Log');
      log.addEventListener('click', () =>
        r.kind === 'dollars' ? openDetail(r, li) : save({ benefit: r.id, date: today() }, log));
      const more = el('button', { class: 'bquick', onclick: () => openDetail(r, li) }, 'Note');
      li.append(el('span', { class: 'bbtns' }, log, more));
    }
    return li;
  };

  const groups = [
    ['Counted each year', r => (r.kind === 'count' || r.kind === 'dollars') && !r.outside],
    ['Once a year', r => r.kind === 'once' && !r.outside],
    ['Referrals', r => r.kind === 'tally' && !r.outside],
    ['Not part of their level', r => r.outside]
  ];

  render(
    el('div', {},
      el('button', { class: 'back', onclick: () => up('benefits', drawBenefitsOverview) }, 'Back to member benefits'),
      el('h1', {}, m.name),
      el('p', { class: 'lede' }, `${tierName(m.tier)}, membership year ${bens.year}.`,
        viewsText(slug) ? ` Their page: ${viewsText(slug)}${clicksText(slug)}.` : ''),
      status,

      groups.map(([title, test]) => {
        const these = rows.filter(test);
        if (!these.length) return null;
        return el('section', { class: 'bgroup' },
          el('h2', { class: 'bgroup-title' }, title),
          el('ul', { class: 'blist' }, these.map(rowFor)));
      }),

      el('section', { class: 'bgroup' },
        el('h2', { class: 'bgroup-title' }, `Logged in ${bens.year}`),
        mine.length
          ? el('ul', { class: 'list' }, [...mine].sort((a, b) => b.date.localeCompare(a.date) || (b.at || '').localeCompare(a.at || '')).map(u =>
              el('li', {},
                el('div', { class: 'row-open static' },
                  el('strong', {}, benefitLabel(u.benefit) +
                    (u.qty ? ` \u00d7 ${u.qty}` : '') + (u.amount ? `, $${u.amount.toLocaleString('en-US')}` : '')),
                  el('span', {}, [u.date, u.note, u.by ? 'logged by ' + u.by : null].filter(Boolean).join(' \u00b7 '))),
                el('button', { class: 'row-del', title: 'Remove', onclick: () => removeUse(u) }, 'Remove'))))
          : el('p', { class: 'help' }, 'Nothing logged yet this year.'))
    ));
}

/* ---------- spreadsheets ---------------------------------------------------- */

function csv(rows) {
  const cell = v => {
    const t = v == null ? '' : String(v);
    return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };
  return rows.map(r => r.map(cell).join(',')).join('\r\n');
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
  const a = el('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadSummary() {
  const out = [['Member', 'Level', 'Benefit', 'Allowed', 'Used', 'Left', 'Status']];
  for (const { m, rows } of overviewRows()) {
    for (const r of rows) {
      out.push([m.name, tierName(m.tier), r.label, r.allowed ?? 'No limit', r.used, r.left ?? '', describe(r)]);
    }
  }
  download(`chamber-benefits-summary-${bens.year}.csv`, csv(out));
}

function downloadLog() {
  const names = Object.fromEntries(DIRECTORY.map(m => [m.slug, m.name]));
  const out = [['Date', 'Member', 'Benefit', 'How many', 'Amount', 'Note', 'Logged by']];
  bens.uses
    .filter(u => yearOf(u.date) === bens.year)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(u => out.push([u.date, names[u.member] || u.member, benefitLabel(u.benefit),
      u.qty || (BENEFITS.find(b => b.id === u.benefit)?.kind === 'dollars' ? '' : 1), u.amount || '', u.note || '', u.by || '']));
  download(`chamber-benefits-log-${bens.year}.csv`, csv(out));
}

/* ---------- event check-in ------------------------------------------------

   Every event from the last six weeks and everything coming up. Open one
   to see who registered, check people in, and add walk-ins. On luncheons,
   checking in somebody who came on a member's ticket logs the ticket in
   the benefits tracker. Undoing the check-in gives it back.
   -------------------------------------------------------------------------- */

const EV = '/api/events';

function failScreen(e, back) {
  render(el('div', { class: 'panel' },
    el('h1', {}, 'Could not open that'),
    el('p', { class: 'msg' }, e.message),
    el('div', { class: 'row' }, el('button', { class: 'btn', onclick: back || screenHome }, 'Back'))));
}

async function screenEvents() {
  mark('events');
  render(el('p', { class: 'loading' }, 'Loading events'));
  let d;
  try { d = await call({ action: 'overview' }, EV); } catch (e) { return failScreen(e); }
  const up = d.events.filter(e => e.date >= d.today);
  const past = d.events.filter(e => e.date < d.today).reverse();

  const row = e => el('li', {},
    el('button', { class: 'row-open', onclick: () => screenEvent(e.id) },
      el('strong', {}, e.title),
      el('span', {}, [
        e.date, e.where,
        e.entries ? `${e.entries} on the list` : null,
        e.register ? 'registration on' : null,
        e.tickets ? 'luncheon tickets' : null,
        e.guestFee ? `$${e.guestFee} guest fee` : null
      ].filter(Boolean).join(' \u00b7 '))));

  render(el('div', {},
    el('button', { class: 'back', onclick: goHome }, 'All sections'),
    el('h1', {}, 'Event check-in'),
    el('p', { class: 'note' }, 'Open an event on the day to check people in. To take registrations on the website, tick "Take registrations on this site" on the event under Events.'),
    el('h2', { class: 'bgroup-title' }, 'Coming up'),
    up.length ? el('ul', { class: 'list' }, up.map(row)) : el('p', { class: 'help' }, 'Nothing on the calendar.'),
    past.length > 0 && el('h2', { class: 'bgroup-title', style: 'margin-top:30px' }, 'Recent'),
    past.length > 0 && el('ul', { class: 'list' }, past.map(row))));
}

async function screenEvent(id, flash) {
  mark(addr('events', id));
  render(el('p', { class: 'loading' }, 'Loading the list'));
  let d;
  try {
    await loadDirectory();
    d = await call({ action: 'attendees', event: id }, EV);
  } catch (e) { return failScreen(e, screenEvents); }
  const ev = d.event;
  const people = d.attendees;
  const inCount = people.filter(p => p.checkedIn).reduce((n, p) => n + 1 + (p.guests || 0), 0);

  const status = el('div', { class: 'flash', role: 'status' }, flash || '');
  const act = async (payload, okText) => {
    status.textContent = 'Saving';
    try {
      await call({ ...payload, event: id, who: state.who }, EV);
      screenEvent(id, okText);
    } catch (e) { status.replaceChildren(el('span', { class: 'err' }, e.message)); }
  };

  /* Add at the door: pick a member from the list, or type any name. */
  const list = el('datalist', { id: 'dl-members' }, DIRECTORY.map(m => el('option', { value: m.name })));
  const who = el('input', { type: 'text', list: 'dl-members', placeholder: 'Name, or start typing a member', 'aria-label': 'Who' });
  const guestOf = el('input', { type: 'text', placeholder: 'Guest\u2019s name, if on a ticket', 'aria-label': 'Guest name', hidden: true });
  const ticket = el('input', { type: 'checkbox' });
  const ticketRow = ev.tickets && el('label', { class: 'inline-check' }, ticket, ' On this member\u2019s luncheon ticket');
  const findMember = () => DIRECTORY.find(m => m.name.toLowerCase() === who.value.trim().toLowerCase());
  const sync = () => { guestOf.hidden = !(ticket.checked && findMember()); };
  ticket.addEventListener('change', sync);
  who.addEventListener('input', sync);

  const addBtn = el('button', { class: 'btn primary small' }, 'Add and check in');
  addBtn.addEventListener('click', () => {
    const m = findMember();
    act({
      action: 'add',
      member: m ? m.slug : null,
      name: m ? (guestOf.value.trim() || m.name) : who.value,
      ticket: Boolean(m && ticket.checked)
    }, 'Added and checked in.');
  });

  const search = el('input', { type: 'search', class: 'bsearch', placeholder: 'Find someone on the list' });
  const rows = people.map(p => {
    const t = ev.tickets && p.member && !p.checkedIn && el('input', { type: 'checkbox', checked: p.ticket, title: 'On a luncheon ticket' });
    const li = el('li', { 'data-find': [p.name, p.business, p.email].join(' ').toLowerCase(), class: p.checkedIn ? 'is-in' : '' },
      el('div', { class: 'row-open static' },
        el('strong', {}, p.name + (p.guests ? ` + ${p.guests}` : '')),
        el('span', {}, [
          p.business, p.email,
          p.ticket && p.memberName ? `on ${p.memberName}\u2019s ticket` + (p.ticketUse ? ' (logged)' : '') : null,
          p.paid ? `paid $${p.paid} guest fee` : null,
          p.via === 'member' ? 'member, sent to the venue\u2019s registration' : null,
          p.walkin ? 'added at the door' : null,
          p.checkedIn ? 'checked in ' + new Date(p.checkedIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
        ].filter(Boolean).join(' \u00b7 '))),
      el('span', { class: 'bbtns' },
        t && el('label', { class: 'inline-check small' }, t, ' ticket'),
        p.checkedIn
          ? el('button', { class: 'bquick', onclick: () => act({ action: 'checkin', id: p.id, undo: true }, `${p.name} un-checked.`) }, 'Undo')
          : el('button', { class: 'bquick primary', onclick: () => act({ action: 'checkin', id: p.id, ...(t ? { ticket: t.checked } : {}) }, `${p.name} checked in.`) }, 'Check in'),
        el('button', { class: 'bquick', onclick: () => confirm(`Take ${p.name} off the list?`) && act({ action: 'remove', id: p.id }, 'Removed.') }, 'Remove')));
    return li;
  });
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    rows.forEach(li => { li.hidden = q && !li.dataset.find.includes(q); });
  });

  const exportCsv = () => download(`${ev.id}-attendees.csv`, csv([
    ['Name', 'Business', 'Email', 'Guests', 'Member', 'Guest fee paid', 'On a ticket of', 'Registered', 'Checked in'],
    ...people.map(p => [p.name, p.business, p.email, p.guests || 0, p.member ? 'yes' : '', p.paid || '', p.ticket ? p.memberName : '', p.at.slice(0, 16).replace('T', ' '), p.checkedIn ? 'yes' : ''])
  ]));

  render(el('div', {},
    el('button', { class: 'back', onclick: () => up('events', screenEvents) }, 'All events'),
    el('h1', {}, ev.title),
    el('p', { class: 'lede' }, `${ev.date} \u00b7 ${ev.where}. ${d.headcount} on the list${ev.capacity ? ` of ${ev.capacity}` : ''}, ${inCount} checked in.`),
    ev.tickets && !d.trackerReady && el('p', { class: 'note warn' }, 'The benefits tracker is not connected, so tickets will not be logged. Check GITHUB_REPO and GITHUB_TOKEN.'),
    status,
    el('div', { class: 'panel logform' },
      el('h2', {}, 'Add at the door'),
      list, who, ticketRow, guestOf,
      el('div', { class: 'row' }, addBtn)),
    people.length > 8 && search,
    people.length
      ? el('ul', { class: 'list checkin' }, rows)
      : el('p', { class: 'help' }, 'Nobody on the list yet.'),
    people.length > 0 && el('div', { class: 'row' }, el('button', { class: 'btn', onclick: exportCsv }, 'Download the list'))));
}

/* ---------- newsletter ------------------------------------------------------ */

const NL = '/api/newsletter';
const adminEmail = () => localStorage.getItem('pcc-admin-email') || '';

async function screenNewsletter(flash) {
  mark('newsletter');
  render(el('p', { class: 'loading' }, 'Loading the newsletter'));
  let st;
  try { st = await call({ action: 'status' }, NL); } catch (e) { return failScreen(e); }

  const subject = el('input', { type: 'text', maxlength: '150', placeholder: 'What is on in October' });
  const intro = el('textarea', { rows: '5', placeholder: 'A few sentences in your own words. Blank lines make new paragraphs.' });
  subject.value = sessionStorage.getItem('pcc-nl-subject') || '';
  intro.value = sessionStorage.getItem('pcc-nl-intro') || '';
  const keep = () => { sessionStorage.setItem('pcc-nl-subject', subject.value); sessionStorage.setItem('pcc-nl-intro', intro.value); };
  subject.addEventListener('input', keep); intro.addEventListener('input', keep);

  const frame = el('iframe', { class: 'mailpreview', title: 'Preview', hidden: true });
  const status = el('div', { class: 'flash', role: 'status' }, flash || '');
  const testTo = el('input', { type: 'email', value: adminEmail(), placeholder: 'you@example.com', 'aria-label': 'Send a test to' });

  const run = async (payload, then) => {
    status.textContent = 'Working';
    try {
      const r = await call({ subject: subject.value, intro: intro.value, who: state.who, ...payload }, NL);
      status.textContent = r.message || '';
      if (then) then(r);
    } catch (e) { status.replaceChildren(el('span', { class: 'err' }, e.message)); }
  };

  const preview = () => run({ action: 'preview' }, r => { frame.srcdoc = r.html; frame.hidden = false; status.textContent = ''; });
  const test = () => { localStorage.setItem('pcc-admin-email', testTo.value.trim()); run({ action: 'test', to: testTo.value }); };
  const send = () => {
    if (!subject.value.trim()) { status.textContent = 'Give it a subject line first.'; return; }
    if (!confirm(`Send "${subject.value}" to ${st.subscribers} subscriber${st.subscribers === 1 ? '' : 's'} now? This cannot be undone.`)) return;
    run({ action: 'send', expect: st.subscribers }, () => {
      sessionStorage.removeItem('pcc-nl-subject'); sessionStorage.removeItem('pcc-nl-intro');
      setTimeout(() => screenNewsletter('Sent.'), 800);
    });
  };
  const exportCsv = async () => {
    const r = await call({ action: 'export' }, NL);
    download('newsletter-subscribers.csv', csv([['Email', 'Confirmed'], ...r.subscribers.map(x => [x.email, x.at.slice(0, 10)])]));
  };

  const c = st.counts;
  render(el('div', {},
    el('button', { class: 'back', onclick: goHome }, 'All sections'),
    el('h1', {}, 'Newsletter'),
    el('p', { class: 'lede' },
      `${st.subscribers} subscriber${st.subscribers === 1 ? '' : 's'}. `,
      st.last ? `Last sent ${st.last.at.slice(0, 10)}: \u201c${st.last.subject}\u201d.` : 'Nothing sent yet.'),
    st.missing.length > 0 && el('p', { class: 'note warn' }, `Email is not set up. Missing in Vercel: ${st.missing.join(', ')}.`),
    st.subscribers > st.dailyLimit && el('p', { class: 'note warn' },
      `Resend\u2019s free plan sends ${st.dailyLimit} emails a day, and the list is ${st.subscribers}. Upgrade Resend before sending, or the rest will fail.`),
    el('p', { class: 'note' },
      `Filled in for you: ${c.events} upcoming event${c.events === 1 ? '' : 's'}, ${c.posts} news post${c.posts === 1 ? '' : 's'} and ${c.deals} new deal${c.deals === 1 ? '' : 's'} since the last one. Add a subject and an opening, preview, test, send.`),
    el('div', { class: 'field' }, el('label', {}, 'Subject'), subject),
    el('div', { class: 'field' }, el('label', {}, 'Opening'), el('span', { class: 'help' }, 'Optional, and short. The events, news and deals follow it.'), intro),
    el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: preview }, 'Preview'),
      testTo, el('button', { class: 'btn', onclick: test }, 'Send a test'),
      el('button', { class: 'btn primary', onclick: send, disabled: !st.subscribers || st.missing.length > 0 }, `Send to ${st.subscribers}`)),
    status,
    frame,
    el('div', { class: 'row', style: 'margin-top:26px' },
      el('button', { class: 'btn', onclick: exportCsv }, 'Download the subscriber list')),
    el('p', { class: 'help' }, 'Keep a copy now and then. The list lives in the credential store, not in git.')));
}

/* ---------- quarterly member email ------------------------------------------ */

const DG = '/api/digest';

async function screenDigest() {
  mark('digest');
  render(el('p', { class: 'loading' }, 'Loading'));
  let st;
  try {
    await loadDirectory();
    st = await call({ action: 'status' }, DG);
  } catch (e) { return failScreen(e); }

  const pick = el('select', {}, DIRECTORY.map(m => el('option', { value: m.slug }, m.name)));
  const frame = el('iframe', { class: 'mailpreview', title: 'Preview', hidden: true });
  const status = el('div', { class: 'flash', role: 'status' });
  const testTo = el('input', { type: 'email', value: adminEmail(), placeholder: 'you@example.com', 'aria-label': 'Send a test to' });

  const run = async (payload, then) => {
    status.textContent = 'Working';
    try {
      const r = await call({ who: state.who, member: pick.value, ...payload }, DG);
      status.textContent = r.message || '';
      if (then) then(r);
    } catch (e) { status.replaceChildren(el('span', { class: 'err' }, e.message)); }
  };
  const preview = () => run({ action: 'preview' }, r => {
    frame.srcdoc = r.html; frame.hidden = false;
    status.textContent = r.to.length ? `Goes to ${r.to.join(', ')}.` : 'This member has no email on file, so they would not get one.';
  });
  pick.addEventListener('change', preview);

  const l = st.last;
  render(el('div', {},
    el('button', { class: 'back', onclick: goHome }, 'All sections'),
    el('h1', {}, 'Quarterly member email'),
    el('p', { class: 'lede' }, `Covers ${st.quarter}. ${st.withEmail} members have an email on file.`),
    el('p', { class: 'note' }, st.auto
      ? 'Automatic sending is on. It goes out by itself on the 5th of January, April, July and October.'
      : 'Automatic sending is off. Send it from here, or set DIGEST_AUTO to on in Vercel when you are happy with it.'),
    st.missing.length > 0 && el('p', { class: 'note warn' }, `Not fully set up. Missing in Vercel: ${st.missing.join(', ')}.`),
    l && el('p', { class: 'help' }, `Last run ${l.at.slice(0, 10)} for ${l.quarter}: ${l.sent} sent${l.skipped ? `, ${l.skipped} already had it` : ''}.`),
    st.withoutEmail.length > 0 && el('details', {},
      el('summary', {}, `${st.withoutEmail.length} members have no email and will not get it`),
      el('p', { class: 'help' }, st.withoutEmail.join(', '))),
    el('div', { class: 'field', style: 'margin-top:20px' }, el('label', {}, 'See it as'), pick),
    el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: preview }, 'Preview'),
      testTo,
      el('button', { class: 'btn', onclick: () => { localStorage.setItem('pcc-admin-email', testTo.value.trim()); run({ action: 'test', to: testTo.value }); } }, 'Send me a test'),
      el('button', { class: 'btn primary', disabled: st.missing.length > 0, onclick: () =>
        confirm(`Send this quarter's email to every member now? Anyone who already got it this quarter is skipped.`) && run({ action: 'send' }, () => screenDigest()) },
        'Send to all members')),
    status,
    frame));
}

/* ---------- ChamberMaster export ---------------------------------------------
   The directory, laid out in GrowthZone's standard member import template
   (std_import.xls), for whatever reporting still runs through
   ChamberMaster. This site stays the one place members are edited; this
   file is what gets handed over, so nobody keeps two lists by hand.

   ChamberMaster cannot import a list itself. GrowthZone support does it
   from this template, and on plans below Pro they charge for each import.
   The template's column names and order must not change. If support sends
   a newer template, change COLUMNS to match it and nothing else.
   ========================================================================== */

const CM_COLUMNS = [
  'CompanyName', 'CompanyFileByName', 'Status', 'MemberType',
  'Phone', 'AltPhone', 'TollFreePhone', 'Fax', 'Website',
  'MailAddr1', 'MailAddr2', 'MailCity', 'MailState', 'MailZip',
  'PhysAddr1', 'PhysAddr2', 'PhysCity', 'PhysState', 'PhysZip',
  'BillContactFirstname', 'BillContactLastname', 'BillContactTitle',
  'BillAddr1', 'BillAddr2', 'BillCity', 'BillState', 'BillZip',
  'NumFullTimeEmployees', 'NumPartTimeEmployees', 'JoinDate', 'DropDate',
  'BusinessDescription', 'InternalComments', 'RenewalMonth',
  'DuesLevelName', 'AnnualDuesAmount', 'BillingFrequency',
  'PrimaryBusinessCategory', 'SecondBusinessCategory', 'ThirdBusinessCategory',
  'PrimaryContactFirstname', 'PrimaryContactLastName', 'PrimaryContactTitle', 'PrimaryContactEmail', 'PrimaryContactPhone',
  ...[1, 2, 3, 4].flatMap(n => [`AdditionalContactFirstname${n}`, `AdditionalContactLastname${n}`, `AdditionalContactTitle${n}`, `AdditionalContactEmail${n}`, `AdditionalContactPhone${n}`]),
  'MemberCustomField1', 'MemberCustomField2', 'MemberCustomField3'
];

/* "407 W Bridge Road, Suite 6, Polk City, IA, 50226" into its parts,
   working from the end: zip, state, town, then the street, with anything
   between the street and the town (a suite, a PO box) as the second line. */
function splitAddress(a) {
  const parts = String(a || '').split(',').map(x => x.trim()).filter(Boolean);
  const out = { line: '', line2: '', city: '', state: '', zip: '' };
  const lastIs = re => parts.length && re.test(parts[parts.length - 1]);
  if (lastIs(/^\d{5}(-\d{4})?$/)) out.zip = parts.pop();
  else if (lastIs(/^[A-Za-z]{2}\s+\d{5}(-\d{4})?$/)) { const [st, z] = parts.pop().split(/\s+/); out.state = st.toUpperCase(); out.zip = z; }
  if (!out.state && lastIs(/^[A-Za-z]{2}$/)) out.state = parts.pop().toUpperCase();
  if (parts.length) out.city = parts.pop();
  out.line = parts.shift() || '';
  out.line2 = parts.join(', ');
  return out;
}

function splitName(n) {
  const parts = String(n || '').trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? [parts.slice(0, -1).join(' '), parts[parts.length - 1]] : [parts[0] || '', ''];
}

function downloadChamberMaster() {
  const cats = Object.fromEntries((state.file.data.categories || []).map(c => [c.id, c.label]));
  const rows = (state.file.data.members || []).map(m => {
    const c = m.contact || {};
    const a = splitAddress(c.address);
    const d = duesFor(m);
    const [first, last] = splitName(c.person);
    const primary = billTo(m);
    const more = (Array.isArray(m.access) ? m.access : []).map(x => String(x).trim().toLowerCase()).filter(x => x && x !== primary).slice(0, 4);
    const row = {
      CompanyName: m.name, Status: 'Active', MemberType: TIER_NAMES[m.tier] || '',
      Phone: String(c.phone || '').slice(0, 30), Website: c.web || '',
      MailAddr1: a.line, MailAddr2: a.line2, MailCity: a.city || m.city || '', MailState: a.state || (a.city || m.city ? 'IA' : ''), MailZip: a.zip,
      PhysAddr1: a.line, PhysAddr2: a.line2, PhysCity: a.city || m.city || '', PhysState: a.state || (a.city || m.city ? 'IA' : ''), PhysZip: a.zip,
      BusinessDescription: m.summary || '', RenewalMonth: 1,
      DuesLevelName: TIER_NAMES[m.tier] || '', AnnualDuesAmount: d.cents > 0 ? (d.cents / 100).toFixed(2) : '',
      BillingFrequency: d.cents > 0 ? 1 : '',
      PrimaryBusinessCategory: cats[m.category] || m.category || '',
      PrimaryContactFirstname: first, PrimaryContactLastName: last, PrimaryContactEmail: primary,
      PrimaryContactPhone: String(c.phone || '').slice(0, 30),
      MemberCustomField1: m.slug
    };
    more.forEach((e, i) => { row[`AdditionalContactEmail${i + 1}`] = e; });
    return CM_COLUMNS.map(k => row[k] ?? '');
  });
  download(`chambermaster-import-${today()}.csv`, csv([CM_COLUMNS, ...rows]));
}

/* ---------- message to members --------------------------------------------
   An email to members themselves, picked by category and level. The
   server works out the addresses so the count shown is the count sent.
   Notes at the top of api/newsletter.js.
   ========================================================================== */

async function screenMessage(flash) {
  mark('message');
  render(el('p', { class: 'loading' }, 'Loading'));
  let st;
  try { st = await call({ action: 'm-status' }, NL); } catch (e) { return failScreen(e); }

  const saved = (() => { try { return JSON.parse(sessionStorage.getItem('pcc-msg') || '{}'); } catch { return {}; } })();
  const box = (name, value, label, on) => {
    const i = el('input', { type: 'checkbox', name, value, checked: on });
    return el('label', { class: 'check' }, i, ' ', label);
  };
  const catBoxes = el('div', { class: 'checks' },
    st.categories.filter(c => c.count).map(c => box('cat', c.id, `${c.label} (${c.count})`, (saved.categories || []).includes(c.id))));
  const tierBoxes = el('div', { class: 'checks' },
    Object.entries(TIER_NAMES).map(([id, name]) => box('tier', id, name, (saved.tiers || []).includes(id))));

  const subject = el('input', { type: 'text', maxlength: '150', value: saved.subject || '', placeholder: 'Main Street closed Saturday morning' });
  const text = el('textarea', { rows: '8', placeholder: 'Write it the way you would say it. A blank line starts a new paragraph.' });
  text.value = saved.text || '';
  const buttonLabel = el('input', { type: 'text', maxlength: '60', value: saved.buttonLabel || '', placeholder: 'Sign up here' });
  const buttonHref = el('input', { type: 'url', value: saved.buttonHref || '', placeholder: 'https://' });
  const testTo = el('input', { type: 'email', value: adminEmail(), placeholder: 'you@example.com', 'aria-label': 'Send a test to' });
  const count = el('p', { class: 'note' }, 'Counting');
  const status = el('div', { class: 'flash', role: 'status' }, flash || '');
  const frame = el('iframe', { class: 'mailpreview', title: 'Preview', hidden: true });
  let expect = 0;

  const picked = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
  const payload = () => ({
    categories: picked('cat'), tiers: picked('tier'),
    subject: subject.value, text: text.value, buttonLabel: buttonLabel.value, buttonHref: buttonHref.value
  });
  const keep = () => sessionStorage.setItem('pcc-msg', JSON.stringify(payload()));

  const recount = async () => {
    keep();
    try {
      const c = await call({ action: 'm-count', ...payload() }, NL);
      expect = c.addresses;
      const scope = picked('cat').length || picked('tier').length ? 'the members picked' : 'every member';
      count.textContent = `Goes to ${c.addresses} address${c.addresses === 1 ? '' : 'es'} at ${c.members} member${c.members === 1 ? '' : 's'} (${scope}).` +
        (c.noEmail ? ` ${c.noEmail} of them have no email on file and will not get it.` : '');
    } catch (e) { count.textContent = e.message; }
  };
  catBoxes.addEventListener('change', recount);
  tierBoxes.addEventListener('change', recount);
  [subject, text, buttonLabel, buttonHref].forEach(i => i.addEventListener('input', keep));

  const run = async (extra, then) => {
    status.textContent = 'Working';
    try {
      const r = await call({ ...payload(), who: state.who, ...extra }, NL);
      status.textContent = r.message || '';
      if (then) then(r);
    } catch (e) { status.replaceChildren(el('span', { class: 'err' }, e.message)); }
  };
  const preview = () => run({ action: 'm-preview' }, r => { frame.srcdoc = r.html; frame.hidden = false; status.textContent = ''; });
  const test = () => { localStorage.setItem('pcc-admin-email', testTo.value.trim()); run({ action: 'm-test', to: testTo.value }); };
  const send = () => {
    if (!subject.value.trim() || !text.value.trim()) { status.textContent = 'Write a subject and a message first.'; return; }
    if (!confirm(`Send "${subject.value}" to ${expect} address${expect === 1 ? '' : 'es'} now? This cannot be undone.`)) return;
    run({ action: 'm-send', expect }, () => { sessionStorage.removeItem('pcc-msg'); setTimeout(() => screenMessage('Sent.'), 800); });
  };

  render(el('div', {},
    el('button', { class: 'back', onclick: goHome }, 'All sections'),
    el('h1', {}, 'Message to members'),
    el('p', { class: 'lede' }, 'For members only, not the newsletter list. Tick nothing to write to every member.',
      st.last ? ` Last one: \u201c${st.last.subject}\u201d, ${st.last.at.slice(0, 10)}.` : ''),
    st.missing.length > 0 && el('p', { class: 'note warn' }, `Email is not set up. Missing in Vercel: ${st.missing.join(', ')}.`),
    st.optedOut > 0 && el('p', { class: 'help' }, `${st.optedOut} address${st.optedOut === 1 ? ' has' : 'es have'} opted out of member messages and are left off.`),
    el('div', { class: 'field' }, el('label', {}, 'Categories'), catBoxes),
    el('div', { class: 'field' }, el('label', {}, 'Levels'), tierBoxes),
    count,
    el('div', { class: 'field' }, el('label', {}, 'Subject'), subject),
    el('div', { class: 'field' }, el('label', {}, 'Message'), text),
    el('details', { class: 'advanced' },
      el('summary', {}, 'Add a button'),
      el('div', { class: 'field' }, el('label', {}, 'Button text'), buttonLabel),
      el('div', { class: 'field' }, el('label', {}, 'Where it goes'), buttonHref)),
    el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: preview }, 'Preview'),
      testTo,
      el('button', { class: 'btn', onclick: test }, 'Send me a test'),
      el('button', { class: 'btn primary', disabled: st.missing.length > 0, onclick: send }, 'Send to members')),
    status,
    frame));
  recount();
}

/* ---------- membership dues ------------------------------------------------
   Stripe sends the invoices and takes the money. This screen decides who
   gets one, sends them a few at a time, and shows who has paid. The
   amounts come from data/dues.js, which reads the same prices as the
   membership page. Full notes at the top of api/_lib/dues.js.
   ========================================================================== */

const ST = '/api/stripe';
const dues = { year: duesYear(), show: 'all', picked: new Set(), q: '' };
const OPEN_DUES = ['sent', 'paid'];

function duesState(m) {
  const r = m.record;
  if (r && r.status === 'paid') return 'paid';
  if (r && r.status === 'sent') return 'sent';
  if (m.problem) return 'fix';
  if (m.cents === 0) return 'free';
  return 'ready';
}

async function screenDues(flash) {
  mark('dues');
  render(el('p', { class: 'loading' }, 'Loading dues'));
  let d;
  try { d = await call({ action: 'status', year: dues.year }, ST); } catch (e) { return failScreen(e); }

  const ms = d.members.map((m, i) => ({ ...m, i, state: duesState(m) }));
  const by = st => ms.filter(m => m.state === st);
  const sum = list => list.reduce((t, m) => t + (m.record ? m.record.cents : m.cents || 0), 0);
  const ready = by('ready'), sent = by('sent'), paid = by('paid'), fix = by('fix');
  const status = el('div', { class: 'flash', role: 'status' }, flash || '');

  const sendThese = async (slugs, label) => {
    if (!slugs.length) return;
    const total = sum(ms.filter(m => slugs.includes(m.slug)));
    if (!confirm(`Send ${label} for ${dues.year}, ${money(total)} in all? Stripe emails ${slugs.length === 1 ? 'it' : 'each one'} straight away.`)) return;
    document.querySelectorAll('#admin button').forEach(b => { b.disabled = true; });
    let done = 0, sentN = 0;
    const problems = [];
    try {
      for (let i = 0; i < slugs.length; i += 5) {
        status.textContent = `Sending ${Math.min(i + 5, slugs.length)} of ${slugs.length}`;
        const out = await call({ action: 'send', year: dues.year, slugs: slugs.slice(i, i + 5), who: state.who }, ST);
        for (const r of out.results) {
          done++;
          if (r.sent) sentN++;
          else problems.push(`${(ms.find(m => m.slug === r.slug) || {}).name || r.slug}: ${r.error || r.skipped}`);
        }
      }
    } catch (e) {
      problems.push(e.message);
    }
    screenDues(`Sent ${sentN} of ${slugs.length}.` + (problems.length ? ` Not sent: ${problems.join('; ')}.` : ''));
  };

  const refresh = async () => {
    status.textContent = 'Asking Stripe';
    try {
      const out = await call({ action: 'refresh', year: dues.year }, ST);
      screenDues(out.changed
        ? `${out.changed} updated from Stripe.${out.more ? ' Press again for the rest.' : ''}`
        : `Checked ${out.checked}. Nothing new from Stripe.`);
    } catch (e) { status.textContent = e.message; }
  };

  const downloadDues = () => download(`dues-${dues.year}.csv`, csv([
    ['Member', 'Level', 'Amount', 'Invoice to', 'Status', 'Invoice number', 'Sent', 'Due', 'Paid', 'Problem'],
    ...ms.map(m => [m.name, m.label || m.tierName, m.record ? (m.record.cents / 100) : (m.cents == null ? '' : m.cents / 100),
      m.record ? m.record.email : m.email, m.state, m.record ? m.record.number : '', m.record ? m.record.sentAt.slice(0, 10) : '',
      m.record ? m.record.due : '', m.record && m.record.paidAt ? m.record.paidAt.slice(0, 10) : '', m.problem || ''])
  ]));

  const WORDS = { paid: 'Paid', sent: 'Invoiced, not paid', fix: 'Needs fixing', free: 'Not billed', ready: 'Ready to invoice' };
  const shown = dues.show === 'all' ? ms : ms.filter(m => m.state === dues.show);

  const row = m => {
    const r = m.record;
    const bits = [
      m.label || m.tierName,
      r ? money(r.cents) : (m.cents ? money(m.cents) : null),
      m.state === 'paid' ? `paid ${(r.paidAt || '').slice(0, 10)}` : null,
      m.state === 'sent' ? `sent ${r.sentAt.slice(0, 10)}, due ${r.due}` : null,
      r && ['void', 'uncollectible'].includes(r.status) ? `last invoice ${r.status}` : null,
      m.problem || null
    ].filter(Boolean).join(' \u00b7 ');
    const tick = m.state === 'ready' && d.ready && el('input', {
      type: 'checkbox', class: 'pick', 'aria-label': `Select ${m.name}`, checked: dues.picked.has(m.slug),
      onchange: e => { e.target.checked ? dues.picked.add(m.slug) : dues.picked.delete(m.slug); updatePicked(); }
    });
    return el('li', { 'data-state': m.state, 'data-find': [m.name, m.email, m.label, m.tierName].join(' ').toLowerCase() },
      el('label', { class: 'row-open static' + (tick ? ' pickable' : '') },
        tick || null,
        el('span', { class: 'who' }, el('strong', {}, m.name), el('span', {}, bits))),
      el('div', { class: 'row-actions' },
        m.state === 'ready' && d.ready && el('button', { class: 'btn', onclick: () => sendThese([m.slug], `an invoice to ${m.name}`) }, 'Send'),
        m.state === 'fix' && el('a', { class: 'btn', href: '#' + addr('members', m.i) }, 'Fix'),
        r && r.url && OPEN_DUES.includes(r.status) && el('a', { class: 'btn', href: r.url, target: '_blank', rel: 'noopener' }, 'Invoice')));
  };

  /* Picking: tick any ready rows, then Send selected. Ticks survive
     changing the filter or searching, and are cleared after sending. */
  for (const slug of [...dues.picked]) if (!ready.some(m => m.slug === slug)) dues.picked.delete(slug);
  const sendPicked = el('button', { class: 'btn primary', onclick: () => {
    const slugs = ready.filter(m => dues.picked.has(m.slug)).map(m => m.slug);
    sendThese(slugs, slugs.length === 1 ? `an invoice to ${ms.find(m => m.slug === slugs[0]).name}` : `${slugs.length} invoices`);
  } });
  const updatePicked = () => {
    const n = dues.picked.size;
    const total = sum(ready.filter(m => dues.picked.has(m.slug)));
    sendPicked.textContent = n ? `Send ${n} selected (${money(total)})` : 'Send selected';
    sendPicked.disabled = !d.ready || !n;
  };
  const selectShown = () => {
    listEl.querySelectorAll('li:not([hidden]) input.pick').forEach(i => { i.checked = true; dues.picked.add(i.closest('li').dataset.slug); });
    updatePicked();
  };
  const clearPicked = () => {
    dues.picked.clear();
    listEl.querySelectorAll('input.pick').forEach(i => { i.checked = false; });
    updatePicked();
  };

  const search = el('input', { type: 'search', class: 'bsearch', placeholder: 'Find a member', 'aria-label': 'Find a member' });
  search.value = dues.q;
  const listEl = el('ul', { class: 'list dues-list' }, shown.map(m => { const li = row(m); li.dataset.slug = m.slug; return li; }));
  const applySearch = () => {
    dues.q = search.value;
    const q = search.value.trim().toLowerCase();
    listEl.querySelectorAll('li').forEach(li => { li.hidden = Boolean(q) && !li.dataset.find.includes(q); });
  };
  search.addEventListener('input', applySearch);

  const years = [duesYear() - 1, duesYear(), duesYear() + 1];
  const pick = el('select', { 'aria-label': 'Membership year' }, years.map(y => el('option', { value: y, selected: y === dues.year }, String(y))));
  pick.addEventListener('change', () => { dues.year = Number(pick.value); screenDues(); });
  const filter = el('select', { 'aria-label': 'Show' },
    [['all', 'Everyone'], ...Object.entries(WORDS)].map(([v, t]) => el('option', { value: v, selected: v === dues.show }, t)));
  filter.addEventListener('change', () => { dues.show = filter.value; screenDues(); });

  render(el('div', {},
    el('button', { class: 'back', onclick: goHome }, 'All sections'),
    el('h1', {}, 'Membership dues'),
    el('p', { class: 'lede' },
      `${dues.year}: ${paid.length} paid (${money(sum(paid))}), ${sent.length} invoiced and waiting (${money(sum(sent))}), ${ready.length} ready to invoice (${money(sum(ready))}).`),
    !d.ready && el('p', { class: 'note warn' }, 'Stripe is not connected. Set STRIPE_SECRET_KEY in Vercel to send invoices.'),
    d.ready && d.test && el('p', { class: 'note' }, 'Stripe is in test mode. Nothing real is charged, and Stripe does not email test invoices to members. Open an invoice here to see what they would see.'),
    fix.length > 0 && el('p', { class: 'note warn' },
      `${fix.length} member${fix.length === 1 ? '' : 's'} cannot be invoiced yet. Usually a Basic Business member without a size set, or no email on file. Show "Needs fixing" to work through them.`),
    el('p', { class: 'help' }, `Invoices are due ${d.days} days after sending. Stripe emails the member a link to pay by card or bank, sends reminders, and records the payment. To cancel one, void it in Stripe, then press Check Stripe.`),
    el('div', { class: 'row' },
      el('label', {}, 'Year '), pick,
      el('label', {}, ' Show '), filter),
    el('div', { class: 'row' },
      sendPicked,
      el('button', { class: 'btn', disabled: !d.ready || !ready.length,
        onclick: () => sendThese(ready.map(m => m.slug), `all ${ready.length} invoice${ready.length === 1 ? '' : 's'}`) },
        ready.length ? `Send all ${ready.length} ready (${money(sum(ready))})` : 'Nobody left to invoice'),
      el('button', { class: 'btn', disabled: !d.ready || !sent.length, onclick: refresh }, 'Check Stripe'),
      el('button', { class: 'btn', onclick: downloadDues }, 'Download the list')),
    d.ready && ready.length > 0 && el('div', { class: 'row pickrow' },
      el('button', { class: 'linkish', onclick: selectShown }, 'Tick every ready member shown'),
      el('button', { class: 'linkish', onclick: clearPicked }, 'Clear ticks')),
    search,
    status,
    shown.length ? listEl : el('p', { class: 'help' }, 'Nobody in this group.')));
  updatePicked();
  applySearch();
}

/* ---------- shell --------------------------------------------------------- */

function render(node, chrome = true) {
  const main = $('#admin');
  main.replaceChildren(node);
  $('#whoami').textContent = chrome && state.who ? `Signed in as ${state.who}` : '';
  $('#signout').hidden = !chrome;
}

window.addEventListener('beforeunload', e => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
});

$('#signout').addEventListener('click', async () => {
  if (state.dirty && !confirm('You have changes that are not saved. Sign out anyway?')) return;
  await call({ action: 'signout' }).catch(() => {});
  state.file = null; state.collection = null; state.dirty = false;
  screenSignIn('Signed out.');
});

/* ---------- following an address -----------------------------------------
   Used on load, after sign-in, and when back or forward is pressed. */

function goHome() { up('', screenHome); }

/* Put the address back when somebody chooses to stay after a warning. */
function stay() {
  history.pushState({ prev: null }, '', current ? '#' + current : location.pathname + location.search);
}

/* Swap the address for a sensible one without adding a history step,
   for an address that points at something no longer there. */
function fix(route) {
  history.replaceState(history.state, '', route ? '#' + route : location.pathname + location.search);
}

async function route(hash) {
  const [head = '', sub] = hash.split('/').map(p => { try { return decodeURIComponent(p); } catch { return p; } });
  const c = COLLECTIONS.find(x => x.key === head);

  /* Leaving an entry with edits typed in but not kept. */
  if (state.itemDirty && hash !== current) {
    if (!confirm('Discard the changes to this entry?')) return stay();
    state.itemDirty = false;
  }
  /* Leaving a section with changes not saved. */
  if (state.collection && c !== state.collection) {
    if (state.dirty && !confirm('You have changes that are not saved. Leave anyway?')) return stay();
    state.collection = null; state.file = null; state.dirty = false;
  }

  if (c) {
    if (state.collection !== c || !state.file) {
      render(el('p', { class: 'loading' }, 'Loading ' + c.title.toLowerCase()));
      try { await loadCollection(c); } catch (e) { current = hash; return failScreen(e); }
    }
    if (sub == null) return screenList();
    if (sub === 'new') return openItem(-1);
    const i = Number(sub);
    if (Number.isInteger(i) && i >= 0 && i < items().length) return openItem(i);
    fix(addr(c.key));
    return screenList();
  }

  switch (head) {
    case 'benefits':
      if (!sub) return screenBenefits();
      mark(hash);
      if (!bens.loaded) {
        render(el('p', { class: 'loading' }, 'Loading benefits'));
        try { await loadBenefits(); } catch (e) { return failScreen(e); }
      }
      if (!DIRECTORY.some(m => m.slug === sub)) fix('benefits');
      return drawBenefitsMember(sub);
    case 'events':
      return sub ? screenEvent(sub) : screenEvents();
    case 'newsletter':
      return screenNewsletter();
    case 'digest':
      return screenDigest();
    case 'dues':
      return screenDues();
    case 'message':
      return screenMessage();
    default:
      if (head) fix('');
      return screenHome();
  }
}

window.addEventListener('popstate', () => { route(location.hash.slice(1)); });

/* Already signed in from earlier today? Skip the form and go straight to
   the screen in the address, if there is one. */
(async () => {
  try {
    await loadDirectory();
  } catch {
    return screenSignIn();
  }
  route(location.hash.slice(1));
})();
