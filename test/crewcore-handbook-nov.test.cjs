// PUT IN: test/crewcore-handbook-nov.test.cjs
/**
 * CrewCore handbook, Nov 2026 revision.
 *
 * Three things changed with Ryan, and each is tested by calling the real
 * functions, not by reading source text:
 *
 *   1. The handbook text itself (lib/crewcore/handbook-content.js), version
 *      2026-11, so everyone is asked to agree again.
 *   2. "What changed in this version": a list of links at the top of the
 *      Handbook screen and New / Updated tags on the parts that changed
 *      (lib/crewcore/handbook-changes.js). A link that points nowhere is a
 *      dead link on an HR document, so the list is checked against the text.
 *   3. 48 hours' notice on full and half days. Ryan's call: warn the
 *      approver, still allow the request (lib/crewcore/pto.js noticeHours,
 *      isShortNotice, shortNoticeLine; set on the record in
 *      lib/crewcore/pto-request.js).
 */

const path = require('path');
const t = require('./harness.cjs');

const ROOT = path.join(__dirname, '..');

/* ---- fake Upstash, enough for a request and its notification ---------- */

const kv = new Map();
const P = 'alliteration:';
const CC = 'crewcore_data';

global.fetch = async (url, opts) => {
  const raw = String(url);
  if (raw.startsWith('https://api.resend.com/')) {
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'em_1' }) };
  }
  if (/\/pipeline$/.test(raw)) {
    const cmds = JSON.parse(opts.body);
    const out = cmds.map(([op, key, val]) => {
      if (op === 'INCR') { const n = Number(kv.get(key) || 0) + 1; kv.set(key, String(n)); return { result: n }; }
      if (op === 'SET') { kv.set(key, val); return { result: 'OK' }; }
      if (op === 'GET') return { result: kv.has(key) ? kv.get(key) : null };
      if (op === 'DEL') { kv.delete(key); return { result: 1 }; }
      return { result: null };
    });
    return { ok: true, status: 200, json: async () => out };
  }
  const setM = raw.match(/\/set\/(.+)$/);
  if (setM && opts && opts.method === 'POST') {
    kv.set(decodeURIComponent(setM[1]), opts.body);
    return { ok: true, status: 200, json: async () => ({ result: 'OK' }) };
  }
  const key = decodeURIComponent((raw.match(/\/get\/(.+)$/) || [])[1] || '');
  return { ok: true, status: 200, json: async () => ({ result: kv.has(key) ? kv.get(key) : null }) };
};

process.env.KV_REST_API_URL = 'https://fake-upstash.test';
process.env.KV_REST_API_TOKEN = 'fake-token';
process.env.SESSION_SECRET = 'test-secret-for-handbook-nov';

// A fixed moment: Monday Mar 1 2027, 9:00 a.m. in Polk City (CST, UTC-6).
const MON_9AM = new Date('2027-03-01T15:00:00Z');

function seed() {
  kv.clear();
  kv.set(P + 'users', JSON.stringify({
    ryan:  { username: 'ryan',  name: 'Ryan',  superuser: true },
    sasha: { username: 'sasha', name: 'Sasha', access: { apps: ['crewcore'] } },
  }));
  kv.set(CC + ':employee_index', JSON.stringify(['EMP-1', 'EMP-2']));
  kv.set(CC + ':employee:EMP-1', JSON.stringify({ id: 'EMP-1', name: 'Sasha Smith', username: 'sasha', status: 'active', start_date: '2015-03-01' }));
  kv.set(CC + ':employee:EMP-2', JSON.stringify({ id: 'EMP-2', name: 'Ryan', username: 'ryan', status: 'active', start_date: '2000-01-01' }));
  kv.set(CC + ':pto_policy', JSON.stringify({ start_year: 2027, approvers: ['ryan'], versions: {}, closures: { 2027: [] } }));
}

function notices() {
  const out = [];
  for (const [k, v] of kv) {
    if (!/notification/i.test(k) || /index|seq|counter/i.test(k)) continue;
    try { const n = JSON.parse(v); if (n && n.title) out.push(n); } catch (e) { /* not a record */ }
  }
  return out;
}

(async () => {
  const content = await import(path.join(ROOT, 'lib/crewcore/handbook-content.js'));
  const ch = await import(path.join(ROOT, 'lib/crewcore/handbook-changes.js'));
  const pto = await import(path.join(ROOT, 'lib/crewcore/pto.js'));
  const { HANDBOOK_SECTIONS: S, HANDBOOK_CHANGES: C, HANDBOOK_UPDATED: V } = content;

  /* ---- 1. the text ------------------------------------------------------ */

  t.test('the handbook is the Nov 2026 version, so everyone agrees again', () => {
    t.equal(V, '2026-11', 'version');
    t.equal(C.version, V, 'the change list is for this version');
  });

  const allText = S.flatMap((s) => [s.title, ...s.blocks.flatMap((b) => [b.h, b.p, ...(b.list || []), ...(b.ol || [])])]).filter(Boolean).join('\n');

  t.test('no em dashes and no "his or her" anywhere in the text', () => {
    t.assert(!/—/.test(allText), 'em dash in the handbook');
    t.assert(!/his or her|he or she|him or her/i.test(allText), 'gendered pair left in');
  });

  t.test('the holiday list is the shop\'s closed days list, not "the federal calendar"', () => {
    t.assert(!/federal holiday calendar/.test(allText), 'old wording still there');
    const pt = S.find((s) => s.id === 'paid-time-off');
    const i = pt.blocks.findIndex((b) => b.h === 'Paid Holidays');
    const listed = pt.blocks[i + 2].list.map((x) => x.toLowerCase());
    const closed = pto.defaultClosures(2026).filter((c) => !c.closes_at).map((c) => c.name.toLowerCase());
    closed.forEach((name) => {
      const want = name === 'day after thanksgiving' ? 'the day after thanksgiving' : name;
      t.assert(listed.includes(want), 'closed all day but not in the handbook: ' + name);
    });
    t.equal(listed.length, closed.length, 'and nothing extra');
    t.assert(/noon on Christmas Eve and New Year's Eve/.test(pt.blocks[i + 3].p), 'half days named');
  });

  t.test('the PTO rules Ryan set are in the text', () => {
    [
      /at least 48 hours' notice/,
      /first come, first served/,
      /October through December/,
      /counts as an unexcused absence/,
      /prorated by the days left in the year/,
      /Three tardies count as one unexcused occurrence/,
      /If the complaint is about Ryan, report it to Megan/,
      /only with|at least two weeks' notice/,
    ].forEach((re) => t.assert(re.test(allText), 'missing: ' + re));
  });

  t.test('every section id is unique and has at least one block', () => {
    const ids = S.map((s) => s.id);
    t.equal(new Set(ids).size, ids.length, 'duplicate section id');
    S.forEach((s) => t.assert(s.blocks.length > 0, 'empty section ' + s.id));
  });

  /* ---- 2. what changed --------------------------------------------------- */

  t.test('every change points at a real section and heading', () => {
    t.equal(ch.changeProblems(S, C).join('; '), '', 'dead links');
    t.assert(C.items.length >= 10, 'the list is there');
  });

  t.test('changeProblems catches a dead link, a bad kind and a missing summary', () => {
    t.equal(ch.changeProblems(S, { items: [{ section: 'nope', kind: 'new', summary: 'x' }] }).length, 1, 'no section');
    t.equal(ch.changeProblems(S, { items: [{ section: 'attendance', heading: 'Nope', kind: 'new', summary: 'x' }] }).length, 1, 'no heading');
    t.equal(ch.changeProblems(S, { items: [{ section: 'attendance', kind: 'changed', summary: 'x' }] }).length, 1, 'bad kind');
    t.equal(ch.changeProblems(S, { items: [{ section: 'attendance', kind: 'new', summary: ' ' }] }).length, 1, 'no summary');
  });

  const live = ch.annotateHandbook(S, C, V);

  t.test('headings get anchors and the changed ones get their tag', () => {
    const pt = live.sections.find((s) => s.id === 'paid-time-off');
    const busy = pt.blocks.find((b) => b.h === 'Busy Season and Holidays');
    t.equal(busy.tag, 'new', 'new heading tagged');
    t.equal(busy.anchor, 'hb-paid-time-off--busy-season-and-holidays', 'anchor');
    t.equal(pt.blocks.find((b) => b.h === 'Jury Duty').tag, null, 'untouched heading untagged');
    t.equal(pt.tag, 'updated', 'section with changes inside is updated');
    t.equal(live.sections.find((s) => s.id === 'benefits').tag, 'new', 'whole new section');
    t.equal(live.sections.find((s) => s.id === 'employment-disclaimers').tag, null, 'untouched section');
  });

  t.test('each link in the box jumps to an anchor that exists', () => {
    const anchors = new Set(live.sections.flatMap((s) => ['hb-' + s.id, ...s.blocks.filter((b) => b.anchor).map((b) => b.anchor)]));
    live.changes.forEach((c) => t.assert(anchors.has(c.anchor), 'nowhere to jump: ' + c.anchor));
    t.equal(live.changes.length, C.items.length, 'one line per change');
  });

  t.test('the box lists changes in reading order', () => {
    const order = live.sections.map((s) => s.id);
    const pos = live.changes.map((c) => order.findIndex((id) => c.anchor === 'hb-' + id || c.anchor.startsWith('hb-' + id + '--')));
    for (let i = 1; i < pos.length; i += 1) t.assert(pos[i] >= pos[i - 1], 'out of order at ' + live.changes[i].title);
  });

  t.test('an old change list shows nothing: no stale tags after the next update', () => {
    const later = ch.annotateHandbook(S, C, '2027-05');
    t.equal(later.changes.length, 0, 'no box');
    t.assert(later.sections.every((s) => s.tag === null && s.blocks.every((b) => !b.tag)), 'no tags');
  });

  t.test('a broken item is dropped, not drawn as a dead link', () => {
    const out = ch.annotateHandbook(S, { version: V, items: [...C.items, { section: 'gone', kind: 'new', summary: 'x' }] }, V);
    t.equal(out.changes.length, C.items.length, 'dropped');
  });

  /* ---- the screen draws it ---------------------------------------------- */

  const screen = (await import(path.join(ROOT, 'apps/crewcore.js'))).default;
  const draw = (hb) => Object.assign(Object.create(screen), { _handbook: hb })._renderHandbook();

  t.test('the Handbook screen shows the box, the tags and working links', () => {
    const html = draw({ ...live, updated: V, acknowledged: false });
    t.assert(!/undefined|NaN|\[object Object\]/.test(html), 'placeholder leaked');
    t.assert(html.includes('What changed in this version'), 'box');
    t.assert(/class="cc-hb-tag cc-hb-tag-new">New</.test(html), 'New tag');
    t.assert(/class="cc-hb-tag cc-hb-tag-updated">Updated</.test(html), 'Updated tag');
    const links = [...html.matchAll(/data-anchor="([^"]+)"/g)].map((m) => m[1]);
    t.equal(links.length, C.items.length, 'a link per change');
    links.forEach((a) => t.assert(html.includes(`id="${a}"`), 'link to nothing: ' + a));
    t.assert(/<ol><li>Verbal warning/.test(html), 'discipline steps numbered');
  });

  t.test('content without the change list (the offline mock) still draws, untagged', () => {
    const html = draw({ sections: S, updated: V });
    t.assert(!html.includes('What changed'), 'no box');
    t.assert(!html.includes('cc-hb-tag-'), 'no tags');
    t.assert(!/undefined|NaN/.test(html), 'placeholder leaked');
  });

  /* ---- 3. 48 hours' notice ------------------------------------------------ */

  const policy = {};
  const day = (d, extra) => Object.assign({ type: 'all_days', start_date: d }, extra || {});

  t.test('notice is counted from the start of the shift, in Polk City time', () => {
    // Mon 9:00 a.m. to Wed 8:00 a.m. is 47 hours.
    t.equal(pto.noticeHours(day('2027-03-03'), policy, MON_9AM), 47, 'Wednesday');
    t.equal(pto.noticeHours(day('2027-03-04'), policy, MON_9AM), 71, 'Thursday');
    t.equal(pto.isShortNotice(day('2027-03-03'), policy, MON_9AM), true, '47 hours is short');
    t.equal(pto.isShortNotice(day('2027-03-04'), policy, MON_9AM), false, '71 hours is fine');
  });

  t.test('exactly 48 hours is enough notice', () => {
    const at = new Date('2027-03-01T14:00:00Z'); // Mon 8:00 a.m. CST
    t.equal(pto.noticeHours(day('2027-03-03'), policy, at), 48, '48');
    t.equal(pto.isShortNotice(day('2027-03-03'), policy, at), false, 'not short');
  });

  t.test('an afternoon half day counts from the end of lunch', () => {
    t.equal(pto.noticeHours(day('2027-03-03', { type: 'half_day', half: 'afternoon' }), policy, MON_9AM), 52, 'afternoon');
    t.equal(pto.isShortNotice(day('2027-03-03', { type: 'half_day', half: 'afternoon' }), policy, MON_9AM), false, 'so Wednesday afternoon is fine');
    t.equal(pto.isShortNotice(day('2027-03-03', { type: 'half_day', half: 'morning' }), policy, MON_9AM), true, 'Wednesday morning is short');
  });

  t.test('arrive late, leave early and appointments are never short notice', () => {
    ['arrive_late', 'leave_early', 'appointment'].forEach((type) => {
      t.equal(pto.noticeHours(day('2027-03-01', { type }), policy, MON_9AM), null, type);
      t.equal(pto.isShortNotice(day('2027-03-01', { type }), policy, MON_9AM), false, type);
    });
  });

  t.test('the server clock is UTC; the rule uses the shop\'s', () => {
    // 11:30 p.m. Sunday in Polk City is already Monday in UTC.
    const sunNight = new Date('2027-03-01T05:30:00Z');
    t.equal(pto.noticeHours(day('2027-03-02'), policy, sunNight), 32, 'Sunday 11:30 p.m. to Tuesday 8 a.m.');
  });

  t.test('the approver\'s line', () => {
    t.equal(pto.shortNoticeLine({ short_notice: true, notice_hours: 20 }), 'Short notice (20 hours ahead). The handbook asks for 48 hours on full and half days.', 'hours');
    t.equal(pto.shortNoticeLine({ short_notice: true, notice_hours: 1 }), 'Short notice (1 hour ahead). The handbook asks for 48 hours on full and half days.', 'one hour');
    t.assert(/after it started/.test(pto.shortNoticeLine({ short_notice: true, notice_hours: -3 })), 'already started');
    t.equal(pto.shortNoticeLine({ short_notice: false }), '', 'nothing to say');
    t.equal(pto.shortNoticeLine(null), '', 'nothing at all');
  });

  /* ---- the request is flagged, never refused ------------------------------ */

  const req = await import(path.join(ROOT, 'lib/crewcore/pto-request.js'));
  const store = await import(path.join(ROOT, 'lib/crewcore/pto-store.js'));
  const cc = await import(path.join(ROOT, 'lib/crewcore/store.js'));

  async function ask(body, { by = 'sasha', isApprover = false, source = 'app' } = {}) {
    const emp = await cc.getEmployee('EMP-1');
    const doc = await store.getPolicyDoc();
    return req.createTimeoffRequest({ emp, body, doc, by, isApprover, source, clock: MON_9AM });
  }

  seed();
  {
    const made = await ask({ type: 'all_days', start_date: '2027-03-03', return_date: '2027-03-04' });
    t.test('a full day two days out goes through, flagged for the approver', () => {
      t.assert(made.ok, 'refused: ' + JSON.stringify(made.errors));
      t.equal(made.request.status, 'pending', 'still pending, not refused');
      t.equal(made.request.short_notice, true, 'flagged');
      t.equal(made.request.notice_hours, 47, 'with the hours');
      const n = notices().find((x) => /Time off request/.test(x.title));
      t.assert(n && /Short notice \(47 hours ahead\)/.test(n.detail || n.body || ''), 'the approver\'s notice says so');
    });
  }

  seed();
  {
    const made = await ask({ type: 'all_days', start_date: '2027-03-08', return_date: '2027-03-09' });
    t.test('a week out is not flagged', () => {
      t.assert(made.ok, 'refused');
      t.assert(!made.request.short_notice, 'flagged by mistake');
      const n = notices().find((x) => /Time off request/.test(x.title));
      t.assert(n && !/Short notice/.test(n.detail || n.body || ''), 'no warning in the notice');
    });
  }

  seed();
  {
    const made = await ask({ type: 'all_days', start_date: '2027-03-02', return_date: '2027-03-03' }, { source: 'kiosk' });
    t.test('the kiosk is held to the same rule', () => {
      t.assert(made.ok && made.request.short_notice === true, 'kiosk request not flagged');
    });
  }

  seed();
  {
    const made = await ask({ type: 'appointment', start_date: '2027-03-01', leave_at: '14:00', return_at: '15:00' });
    t.test('a same-day appointment is not flagged', () => {
      t.assert(made.ok, 'refused: ' + JSON.stringify(made.errors));
      t.assert(!made.request.short_notice, 'flagged');
    });
  }

  seed();
  {
    const made = await ask({ type: 'all_days', start_date: '2027-03-02', return_date: '2027-03-03', approved: true }, { by: 'ryan', isApprover: true });
    t.test('time off an approver logs as approved is not flagged', () => {
      t.assert(made.ok && made.request.status === 'approved', 'not logged');
      t.assert(!made.request.short_notice, 'flagged');
    });
  }

  seed();
  {
    const emp = await cc.getEmployee('EMP-1');
    const doc = await store.getPolicyDoc();
    const made = await req.createTimeoffSeries({
      emp, doc, by: 'sasha', isApprover: false, clock: MON_9AM,
      body: { type: 'half_day', half: 'morning', start_date: '2027-03-03', repeat: 'weekly', repeat_until: '2027-03-24' },
    });
    t.test('a repeating request flags only its first date when that is short', () => {
      t.assert(made.ok, 'refused: ' + JSON.stringify(made.errors));
      t.equal(made.requests[0].short_notice, true, 'first date flagged');
      t.assert(made.requests.slice(1).every((r) => !r.short_notice), 'later dates not flagged');
      const n = notices().find((x) => /Repeating/.test(x.title));
      t.assert(n && /First date: Short notice/.test(n.detail || n.body || ''), 'notice says so');
    });
  }

  seed();
  {
    const emp = await cc.getEmployee('EMP-1');
    const doc = await store.getPolicyDoc();
    const made = await req.createTimeoffSeries({
      emp, doc, by: 'ryan', isApprover: true, clock: MON_9AM,
      body: { type: 'half_day', half: 'morning', start_date: '2027-03-02', repeat: 'weekly', repeat_until: '2027-03-23', approved: true },
    });
    t.test('a repeating series an approver logs as approved is not flagged', () => {
      t.assert(made.ok && made.requests[0].status === 'approved', 'not logged: ' + JSON.stringify(made.errors));
      t.assert(made.requests.every((r) => !r.short_notice), 'flagged');
    });
  }

  /* ---- the approver's row ------------------------------------------------- */

  t.test('the approver sees "Short notice" on the request row; the employee does not', () => {
    const r = { id: 'TO-1', employee_id: 'EMP-1', employee_name: 'Sasha', status: 'pending', type: 'all_days', start_date: '2027-03-03', end_date: '2027-03-03', hours: 8, short_notice: true, notice_hours: 47 };
    const st = (scope) => Object.assign(Object.create(screen), { _to: { scope, me: { is_approver: scope === 'team', employee_id: scope === 'team' ? 'EMP-2' : 'EMP-1' } } });
    t.assert(/Short notice \(47 hours ahead\)/.test(st('team')._toRequestRow(r, { showName: true })), 'approver row');
    t.assert(!/Short notice/.test(st('own')._toRequestRow(r)), 'own row');
  });

  process.exit(t.report());
})().catch((e) => {
  console.log('  FAIL crewcore-handbook-nov could not run: ' + (e && e.stack || e));
  process.exit(1);
});
