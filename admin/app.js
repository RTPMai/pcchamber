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
  dirty: false
};

/* ---------- talking to the server ---------------------------------------- */

async function call(payload) {
  const res = await fetch('/api/admin', {
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
      screenHome();
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
  render(
    el('div', {},
      el('h1', {}, 'What would you like to change?'),
      el('div', { class: 'cards' },
        el('button', { class: 'card', 'data-season': 'autumn', onclick: () => screenBenefits() },
          el('strong', {}, 'Member benefits'),
          el('span', {}, 'Log it when a member uses a benefit, and see who is not using theirs.')),
        COLLECTIONS.map(c =>
          el('button', { class: 'card', 'data-season': c.season, onclick: () => openCollection(c) },
            el('strong', {}, c.title),
            el('span', {}, c.blurb))))
    ));
}

async function openCollection(c) {
  state.collection = c;
  render(el('p', { class: 'loading' }, 'Loading ' + c.title.toLowerCase()));
  try {
    state.file = await call({ action: 'load', file: c.file });
    state.dirty = false;
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

  render(
    el('div', {},
      el('button', { class: 'back', onclick: leaveCollection }, 'All sections'),
      el('h1', {}, c.title),
      c.note && el('p', { class: 'note' }, c.note),
      needing > 0 && el('p', { class: 'note warn' },
        `${needing} of ${items().length} still ${c.flagNote ? c.flagNote.toLowerCase() : 'need attention'}.`),
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', onclick: () => openItem(-1) }, 'Add new'),
        state.dirty && el('button', { class: 'btn', onclick: save }, 'Save changes'),
        state.dirty && el('span', { class: 'unsaved' }, 'Not saved yet')),
      el('ul', { class: 'list' },
        list.length ? list.map(({ item, i }) =>
          el('li', {},
            el('button', { class: 'row-open', onclick: () => openItem(i) },
              el('strong', {}, c.label(item)),
              el('span', {}, c.sub ? c.sub(item) : ''),
              c.flag && c.flag(item) && el('em', { class: 'flag' }, c.flagNote)),
            el('button', { class: 'row-del', title: 'Remove', onclick: () => removeItem(i) }, 'Remove')))
          : el('li', { class: 'empty' }, 'Nothing here yet.'))
    ));
}

function leaveCollection() {
  if (state.dirty && !confirm('You have changes that are not saved. Leave anyway?')) return;
  state.collection = null; state.file = null; state.dirty = false;
  screenHome();
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

  const onchange = (path, v) => { set(item, path, v); };

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
    screenList();
  };

  render(
    el('div', {},
      el('button', { class: 'back', onclick: screenList }, 'Back to ' + c.title.toLowerCase()),
      el('h1', {}, adding ? 'Add to ' + c.title.toLowerCase() : c.label(item)),
      body,
      el('div', { class: 'row sticky' },
        el('button', { class: 'btn primary', onclick: keep }, adding ? 'Add it' : 'Keep changes'),
        el('button', { class: 'btn', onclick: screenList }, 'Cancel'),
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
          el('button', { class: 'btn', onclick: screenHome }, 'All sections'))));
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

function yearsAvailable() {
  return [...new Set(bens.uses.map(u => yearOf(u.date)).concat(thisYear(), bens.year))]
    .filter(Boolean).sort((a, b) => b - a);
}

async function screenBenefits() {
  render(el('p', { class: 'loading' }, 'Loading benefits'));
  try {
    await loadDirectory();
    await loadUses();
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

  render(
    el('div', {},
      el('button', { class: 'back', onclick: screenHome }, 'All sections'),
      el('h1', {}, 'Member benefits'),
      el('p', { class: 'note' },
        'Log it when a member uses something: a luncheon ticket, a spotlight, a ribbon cutting. ',
        'It saves straight away and they see it on their account page.'),
      tiersInUse.length === 1 && tiersInUse[0] === 'basic' && el('p', { class: 'note warn' },
        'Every member is still on Basic Business, so everybody shows the Basic allowances. ',
        'Set each member\u2019s level under Member directory first.'),
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
        list.length ? list.map(r =>
          el('li', {},
            el('button', { class: 'row-open', onclick: () => drawBenefitsMember(r.m.slug) },
              el('strong', {}, r.m.name),
              el('span', {}, [
                tierName(r.m.tier),
                r.pct == null ? null : `${r.pct}% of counted benefits used`,
                r.last ? 'last logged ' + r.last : null
              ].filter(Boolean).join(' \u00b7 ')),
              r.pct != null && r.logged > 0 && el('span', { class: 'meter', 'aria-hidden': 'true' },
                el('i', { style: `width:${r.pct}%` })),
              !r.logged && el('em', { class: 'flag' }, 'Nothing used yet'))))
          : el('li', { class: 'empty' }, 'No members on that level.')),
      el('div', { class: 'row' },
        el('button', { class: 'btn', onclick: downloadSummary }, `Download ${bens.year} summary`),
        el('button', { class: 'btn', onclick: downloadLog }, `Download ${bens.year} log`)),
      el('p', { class: 'help' }, 'Both open in Excel. The summary is one line per member per benefit; the log is every entry.')
    ));
}

function drawBenefitsMember(slug, message) {
  const m = DIRECTORY.find(x => x.slug === slug);
  const mine = usesFor(slug).filter(u => yearOf(u.date) === bens.year);
  const rows = summarize(m.tier, mine, bens.year);
  const offered = benefitsFor(m.tier);

  /* The log form. */
  const benefit = el('select', { id: 'b-benefit' },
    el('option', { value: '' }, 'Pick one'),
    offered.map(b => el('option', { value: b.id }, b.label)),
    el('optgroup', { label: 'Not on their level' },
      BENEFITS.filter(b => !offered.includes(b)).map(b => el('option', { value: b.id }, b.label))));
  const date = el('input', { type: 'date', id: 'b-date', value: today() });
  const qty = el('input', { type: 'number', id: 'b-qty', min: '1', max: '99', value: '1' });
  const amount = el('input', { type: 'number', id: 'b-amount', min: '1', step: '1', placeholder: '250' });
  const note = el('input', { type: 'text', id: 'b-note', maxlength: '300' });
  const qtyRow = el('div', { class: 'field half' }, el('label', { for: 'b-qty' }, 'How many'), qty);
  const amountRow = el('div', { class: 'field half' }, el('label', { for: 'b-amount' }, 'Dollar amount'), amount);
  const msg = el('p', { class: 'msg', role: 'status' }, message || '');
  if (message) msg.classList.add('ok');

  const showExtra = () => {
    const b = BENEFITS.find(x => x.id === benefit.value);
    qtyRow.hidden = !b || b.kind !== 'count';
    amountRow.hidden = !b || b.kind !== 'dollars';
  };
  benefit.addEventListener('change', showExtra);
  showExtra();

  const logIt = async btn => {
    btn.disabled = true;
    msg.classList.remove('ok');
    msg.textContent = 'Saving';
    try {
      const out = await call({
        action: 'loguse', who: state.who,
        use: { member: slug, benefit: benefit.value, date: date.value, qty: qty.value, amount: amount.value, note: note.value }
      });
      bens.uses.push(out.entry);
      bens.year = yearOf(out.entry.date);
      drawBenefitsMember(slug, `Logged ${benefitLabel(out.entry.benefit).toLowerCase()}. ${m.name} can see it now.`);
    } catch (e) {
      btn.disabled = false;
      msg.textContent = e.message;
    }
  };

  const removeUse = async u => {
    if (!confirm(`Remove ${benefitLabel(u.benefit).toLowerCase()} on ${u.date}? It comes off their account page too.`)) return;
    try {
      await call({ action: 'unloguse', who: state.who, id: u.id });
      bens.uses = bens.uses.filter(x => x.id !== u.id);
      drawBenefitsMember(slug, 'Removed.');
    } catch (e) {
      alert(e.message);
    }
  };

  const logBtn = el('button', { class: 'btn primary' }, 'Log it');
  logBtn.addEventListener('click', () => logIt(logBtn));

  const groups = [
    ['Counted each year', r => (r.kind === 'count' || r.kind === 'dollars') && !r.outside],
    ['Once a year', r => r.kind === 'once' && !r.outside],
    ['Included, no limit', r => r.kind === 'open' && !r.outside],
    ['Not part of their level', r => r.outside]
  ];

  render(
    el('div', {},
      el('button', { class: 'back', onclick: drawBenefitsOverview }, 'Back to member benefits'),
      el('h1', {}, m.name),
      el('p', { class: 'lede' }, `${tierName(m.tier)}, membership year ${bens.year}.`),

      el('div', { class: 'panel logform' },
        el('h2', {}, 'Log a use'),
        el('div', { class: 'field' }, el('label', { for: 'b-benefit' }, 'What did they use'), benefit),
        el('div', { class: 'split' },
          el('div', { class: 'field half' }, el('label', { for: 'b-date' }, 'When'), date),
          qtyRow, amountRow),
        el('div', { class: 'field' },
          el('label', { for: 'b-note' }, 'Note'),
          el('span', { class: 'help' }, 'Optional. Which event, which post. The member can see this, so write it for them.'),
          note),
        el('div', { class: 'row' }, logBtn),
        msg),

      groups.map(([title, test]) => {
        const these = rows.filter(test);
        if (!these.length) return null;
        return el('section', { class: 'bgroup' },
          el('h2', { class: 'bgroup-title' }, title),
          el('ul', { class: 'blist' }, these.map(r =>
            el('li', { class: r.over ? 'over' : (r.kind === 'once' && r.used ? 'done' : '') },
              el('span', { class: 'bname' }, r.label),
              el('span', { class: 'bsays' }, describe(r),
                r.over ? ' \u00b7 over the allowance' : '',
                r.left > 0 && r.kind !== 'once' ? ` \u00b7 ${r.kind === 'dollars' ? '$' + r.left.toLocaleString('en-US') : r.left} left` : ''),
              el('button', { class: 'bquick', onclick: () => {
                benefit.value = r.id; showExtra(); benefit.scrollIntoView({ behavior: 'smooth', block: 'center' }); date.focus();
              } }, 'Log')))));
      }),

      el('section', { class: 'bgroup' },
        el('h2', { class: 'bgroup-title' }, `Logged in ${bens.year}`),
        mine.length
          ? el('ul', { class: 'list' }, [...mine].sort((a, b) => b.date.localeCompare(a.date)).map(u =>
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

/* Already signed in from earlier today? Skip the form. */
(async () => {
  try {
    await loadDirectory();
    screenHome();
  } catch {
    screenSignIn();
  }
})();
