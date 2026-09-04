/* ==========================================================================
   THE ADMIN

   Three screens: sign in, pick a collection, edit a thing in it.

   Nothing is saved until Save is pressed. Saving makes a commit on GitHub,
   which starts a rebuild, which takes about a minute. The interface says
   this out loud rather than pretending the change is instant, because
   somebody who reloads the site five seconds later and sees no change will
   assume it did not work and do it again.
   ========================================================================== */

import { COLLECTIONS } from './schema.js';

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
    .map(m => ({ slug: m.slug, name: m.name }))
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
        .map(m => ({ slug: m.slug, name: m.name }))
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
