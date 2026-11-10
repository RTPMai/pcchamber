// PUT IN: lib/crewcore/pto.js
// lib/crewcore/pto.js: time off: policy, grants, carryover and balances.
//
// Sep 21 2026, Ryan's call, reversing the Aug 2026 "PTO stays in QuickBooks"
// decision. CrewCore is now the ledger for PTO balances, not just a request
// form. What he decided:
//
//   * CrewCore tracks balances and accruals.
//   * Ryan or Megan approve. Nobody else. (policy.approvers, a list of
//     usernames set in Settings. Empty means NOBODY can approve, and the
//     screen says so, rather than falling back to "any admin".)
//   * PTO only. No separate sick or unpaid buckets.
//   * Sep 21 2026 addendum: every request says whether it USES PTO. Most
//     do. One that does not (unpaid time) still goes through approval and
//     still shows on "who's out", but takes nothing off the balance. It is
//     counted separately as unpaid hours so it is visible, not lost.
//   * A lump sum every Jan 1, tracked in hours.
//   * Unused hours carry over up to a cap.
//
// The amounts come from the Employee Handbook's Paid Time Off section: 10
// days for a new hire (prorated for the year they start), 15 days after a
// full year, granted Jan 1. At 8 hours a day that is 80 and 120 hours. Every
// number is a Setting, not a constant.
//
// NOTE: the Handbook text still says PTO "does not rollover". Ryan chose a
// carryover cap. The default cap here is 0, which is what the Handbook says
// today, so nothing changes until somebody sets a real cap in Settings and
// updates the Handbook to match.
//
// ---- HOW A BALANCE IS WORKED OUT -----------------------------------------
//
// Nothing is written on Jan 1. There is no cron that can fail to run and
// leave everybody at zero. A balance is COMPUTED every time it is asked for,
// year by year, from four stored things:
//
//   1. the employee's start date (for the grant tier and new hire proration)
//   2. an optional starting balance per employee (the hours they had left in
//      QuickBooks on switchover), which replaces the grant for that one year
//   3. manual adjustments (event comp time, corrections), each with a reason
//   4. approved requests
//
// For each year from the first tracked year to the one asked about:
//
//     start     = starting balance (that year only) OR grant + carried in
//     carried   = min(cap, what was left at the end of last year)
//     balance   = start + adjustments - approved hours
//
// Pending requests are shown beside the balance, never subtracted from it.
// A balance can go negative (an approver said yes to more than was left);
// that is reported as a fact, not clamped away.
//
// ---- WHY THE POLICY IS VERSIONED BY YEAR ---------------------------------
//
// If the grant or the cap changes in 2027, 2026's history must not change
// with it. Otherwise raising the cap would quietly hand everybody extra
// hours carried out of a year that already closed under the old rule. So
// the policy is stored as versions keyed by the year they take effect, and
// every year is worked out with the version in force for it. Same lesson as
// the time clock's pay week: a setting must never rewrite what was stored
// under the old one.
//
// No imports on purpose: the screen imports this file too, so the browser
// and the server do the same arithmetic. Same pattern as poHealth() in
// PromoPro and stipendBalance() in schema.js.
//
// ESM. Do NOT convert to module.exports.

export const PTO_REQUEST_STATUSES = ["pending", "approved", "denied", "cancelled"];

export const DEFAULT_POLICY = Object.freeze({
  hours_per_day: 8,
  // The shop day, for working out partial days (arrive late, leave early,
  // appointments). Ryan: 8 to 5. With 8 paid hours that leaves an hour of
  // lunch, assumed 12 to 1, and not counted as time off.
  shift_start: "08:00",
  shift_end: "17:00",
  lunch_start: "12:00",
  lunch_end: "13:00",
  // Highest tier whose min_years is at or under the full years someone has
  // completed by Jan 1 wins. min_years 0 is the new hire tier.
  tiers: [
    { min_years: 0, hours: 80 },   // Handbook: 10 days
    { min_years: 1, hours: 120 },  // Handbook: 15 days after a full year
  ],
  // Handbook: "pro-rated for the year in which they start".
  prorate_first_year: true,
  // Handbook today: does not roll over. Ryan wants a cap; 0 until it is set.
  carryover_cap_hours: 0,
});

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function norm(u) {
  return String(u || "").trim().toLowerCase();
}

function isDay(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

function yearOf(day) {
  const y = parseInt(String(day || "").slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function dayNum(day) {
  return Math.round(Date.parse(day + "T00:00:00Z") / 86400000);
}

function daysInYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

const TIME_LABELS = {
  shift_start: "Day starts", shift_end: "Day ends", lunch_start: "Lunch starts", lunch_end: "Lunch ends",
};

/** "13:30" -> 810. Anything else -> null. */
export function toMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** 810 -> "1:30 PM", for labels. */
export function fmtTime(t) {
  const n = toMinutes(t);
  if (n == null) return String(t || "");
  const h = Math.floor(n / 60), m = n % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function dayShift(day, n) {
  return new Date((dayNum(day) + n) * 86400000).toISOString().slice(0, 10);
}

// ---- Policy ---------------------------------------------------------------

/**
 * One policy version, cleaned. Anything missing or broken falls back to the
 * default for that field rather than failing, so a half-saved record cannot
 * zero out everybody's grant.
 */
export function cleanPolicy(p) {
  const src = p && typeof p === "object" ? p : {};
  const out = {
    hours_per_day: Number(src.hours_per_day) > 0 ? round2(src.hours_per_day) : DEFAULT_POLICY.hours_per_day,
    prorate_first_year: src.prorate_first_year === undefined ? DEFAULT_POLICY.prorate_first_year : src.prorate_first_year !== false,
    carryover_cap_hours: Number(src.carryover_cap_hours) >= 0 && src.carryover_cap_hours !== "" && src.carryover_cap_hours != null
      ? round2(src.carryover_cap_hours) : DEFAULT_POLICY.carryover_cap_hours,
  };
  ["shift_start", "shift_end", "lunch_start", "lunch_end"].forEach((k) => {
    out[k] = toMinutes(src[k]) != null ? String(src[k]) : DEFAULT_POLICY[k];
  });
  const tiers = Array.isArray(src.tiers) ? src.tiers
    .map((t) => ({ min_years: Math.floor(Number(t && t.min_years)), hours: round2(Number(t && t.hours)) }))
    .filter((t) => Number.isFinite(t.min_years) && t.min_years >= 0 && Number.isFinite(t.hours) && t.hours >= 0)
    : [];
  out.tiers = tiers.length ? sortTiers(tiers) : DEFAULT_POLICY.tiers.map((t) => ({ ...t }));
  // A tier list with no new hire tier would hand a new hire nothing at all.
  if (out.tiers[0].min_years !== 0) out.tiers.unshift({ min_years: 0, hours: out.tiers[0].hours });
  return out;
}

function sortTiers(tiers) {
  // One tier per min_years; the last one given wins.
  const by = new Map();
  tiers.forEach((t) => by.set(t.min_years, t));
  return Array.from(by.values()).sort((a, b) => a.min_years - b.min_years);
}

/**
 * Validates a policy edit from Settings. Returns the cleaned version or the
 * reasons it was refused. Stricter than cleanPolicy(): a person typing a
 * number gets told when it is wrong, rather than having it silently replaced.
 */
export function validatePolicy(input) {
  const b = input && typeof input === "object" ? input : {};
  const errors = [];
  if (b.hours_per_day !== undefined) {
    const v = Number(b.hours_per_day);
    if (!(v > 0 && v <= 24)) errors.push("Hours in a work day must be between 0 and 24");
  }
  if (b.carryover_cap_hours !== undefined) {
    const v = Number(b.carryover_cap_hours);
    if (b.carryover_cap_hours === "" || !(v >= 0)) errors.push("Carryover cap must be 0 or more hours");
  }
  if (b.tiers !== undefined) {
    if (!Array.isArray(b.tiers) || !b.tiers.length) {
      errors.push("At least one grant tier is required");
    } else {
      b.tiers.forEach((t, i) => {
        const y = Number(t && t.min_years);
        const h = Number(t && t.hours);
        if (!(Number.isInteger(y) && y >= 0)) errors.push(`Tier ${i + 1}: years must be a whole number, 0 or more`);
        if (!(h >= 0)) errors.push(`Tier ${i + 1}: hours must be 0 or more`);
      });
      if (!b.tiers.some((t) => Number(t && t.min_years) === 0)) {
        errors.push("One tier must start at 0 years, or new hires get nothing");
      }
    }
  }
  ["shift_start", "shift_end", "lunch_start", "lunch_end"].forEach((k) => {
    if (b[k] !== undefined && toMinutes(b[k]) == null) errors.push(`${TIME_LABELS[k]} must be a time like 08:00`);
  });
  const ss = toMinutes(b.shift_start), se = toMinutes(b.shift_end);
  if (ss != null && se != null && se <= ss) errors.push("The work day has to end after it starts");
  const ls = toMinutes(b.lunch_start), le = toMinutes(b.lunch_end);
  if (ls != null && le != null && le < ls) errors.push("Lunch has to end after it starts");
  let approvers;
  if (b.approvers !== undefined) {
    if (!Array.isArray(b.approvers)) errors.push("Approvers must be a list of usernames");
    else approvers = Array.from(new Set(b.approvers.map(norm).filter(Boolean)));
  }
  let emailFrom;
  if (b.email_from !== undefined) {
    emailFrom = String(b.email_from || "").trim();
    if (emailFrom && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(emailFrom)) {
      errors.push("The from-address for time off emails has to be an email address");
    }
  }
  if (errors.length) return { ok: false, errors };
  // Only the fields that were sent. withPolicyVersion() lays this over the
  // version already in force, so saving the cap alone never resets the tiers.
  const policy = {};
  ["hours_per_day", "carryover_cap_hours", "tiers", "prorate_first_year",
    "shift_start", "shift_end", "lunch_start", "lunch_end"].forEach((k) => {
    if (b[k] !== undefined) policy[k] = b[k];
  });
  if (policy.prorate_first_year !== undefined) policy.prorate_first_year = policy.prorate_first_year !== false;
  return { ok: true, policy, approvers, emailFrom };
}

/**
 * The stored document: { start_year, approvers, versions: { "2026": {...} } }.
 * Always returns a usable shape.
 */
export function cleanPolicyDoc(doc, today = new Date()) {
  const d = doc && typeof doc === "object" ? doc : {};
  const versions = {};
  Object.keys(d.versions || {}).forEach((k) => {
    const y = parseInt(k, 10);
    if (Number.isFinite(y)) versions[String(y)] = cleanPolicy(d.versions[k]);
  });
  const sy = parseInt(d.start_year, 10);
  return {
    start_year: Number.isFinite(sy) ? sy : today.getFullYear(),
    approvers: Array.isArray(d.approvers) ? Array.from(new Set(d.approvers.map(norm).filter(Boolean))) : [],
    // Who decision emails come from. Not versioned: it is not a rule about
    // anybody's hours. Blank means the default in lib/crewcore/pto-email.js.
    email_from: typeof d.email_from === "string" ? d.email_from.trim() : "",
    // Days the shop is closed, saved per year once an admin edits a year.
    // A year with nothing saved uses defaultClosures() below.
    closures: cleanClosureMap(d.closures),
    versions,
    updated_at: d.updated_at || null,
    updated_by: d.updated_by || null,
  };
}

/**
 * The policy in force for a year: the latest version that took effect on or
 * before it. A year before every version uses the earliest one. No versions
 * at all means the Handbook defaults.
 */
export function policyForYear(doc, year) {
  const d = cleanPolicyDoc(doc);
  const ys = Object.keys(d.versions).map(Number).sort((a, b) => a - b);
  // The closed days ride along on the policy, so everything that already
  // works hours out from "the policy for this year" (the route, the kiosk,
  // the form on the screen) skips them without being changed. cleanPolicy()
  // drops the field, so it is never saved into a version by accident.
  const closed = closuresForYear(d, year);
  if (!ys.length) return { ...cleanPolicy(DEFAULT_POLICY), closed };
  let pick = ys[0];
  ys.forEach((y) => { if (y <= Number(year)) pick = y; });
  return { ...d.versions[String(pick)], closed };
}

// ---- Days the shop is closed (Ryan, Oct 8 2026) ---------------------------
//
// Shown on everybody's time off calendar, and never taken off anybody's PTO:
// off Wednesday to Friday of Thanksgiving week costs one day, not three.
//
// Ryan's list, from the federal holidays: closed New Year's Day, Memorial
// Day, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving
// and the day after, and Christmas. NOT MLK Day, Presidents Day or
// Juneteenth. Half days (closing at noon) on Christmas Eve and New Year's
// Eve, except when that day is already the observed holiday (Christmas 2027
// is observed Fri Dec 24, so that is a full day closed, not a half).
// Federal observed-date rules: Saturday moves to Friday, Sunday to Monday.
//
// Admins can change any year's list in Settings. Once a year is saved, the
// saved list is the whole truth for that year; until then, these defaults.
//
// Hours already on a decided request are not recalculated. Only new or
// edited requests skip closed days.

export const HALF_DAY_CLOSE = "12:00";

function ymd(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function dowOf(day) {
  return new Date(day + "T00:00:00Z").getUTCDay();
}
/** The nth (1-based) weekday `dow` of a month, or the last one when n is -1. */
function nthWeekday(y, m, dow, n) {
  if (n === -1) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = last; d > 0; d--) if (dowOf(ymd(y, m, d)) === dow) return ymd(y, m, d);
  }
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const day = ymd(y, m, d);
    if (!isDay(day)) break;
    if (dowOf(day) === dow && ++count === n) return day;
  }
  return null;
}
/** Federal observed date: a Saturday holiday is Friday, a Sunday one Monday. */
function observed(day) {
  const w = dowOf(day);
  return w === 6 ? dayShift(day, -1) : w === 0 ? dayShift(day, 1) : day;
}

/** P&M's closed days for a year, before any admin edits. Sorted. */
export function defaultClosures(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return [];
  const out = [];
  // New Year's Day for this year and next: Jan 1 on a Saturday is observed
  // on Dec 31 of the year before, which belongs on that year's list.
  [y, y + 1].forEach((yy) => {
    const d = observed(ymd(yy, 1, 1));
    if (yearOf(d) === y) out.push({ date: d, name: "New Year's Day" });
  });
  out.push({ date: nthWeekday(y, 5, 1, -1), name: "Memorial Day" });
  out.push({ date: observed(ymd(y, 7, 4)), name: "Independence Day" });
  out.push({ date: nthWeekday(y, 9, 1, 1), name: "Labor Day" });
  out.push({ date: nthWeekday(y, 10, 1, 2), name: "Columbus Day" });
  out.push({ date: observed(ymd(y, 11, 11)), name: "Veterans Day" });
  const tg = nthWeekday(y, 11, 4, 4);
  out.push({ date: tg, name: "Thanksgiving" });
  out.push({ date: dayShift(tg, 1), name: "Day after Thanksgiving" });
  out.push({ date: observed(ymd(y, 12, 25)), name: "Christmas" });
  // Half days, only on a weekday that is not already closed all day.
  const full = new Set(out.map((c) => c.date));
  [[ymd(y, 12, 24), "Christmas Eve"], [ymd(y, 12, 31), "New Year's Eve"]].forEach(([d, name]) => {
    const w = dowOf(d);
    if (w !== 0 && w !== 6 && !full.has(d)) out.push({ date: d, name, closes_at: HALF_DAY_CLOSE });
  });
  return out.filter((c) => isDay(c.date)).sort((a, b) => a.date.localeCompare(b.date));
}

function cleanClosure(c) {
  if (!c || !isDay(c.date)) return null;
  const name = String(c.name || "").trim().slice(0, 60) || "Closed";
  const out = { date: c.date, name };
  if (c.closes_at && toMinutes(c.closes_at) != null) out.closes_at = String(c.closes_at);
  return out;
}

function cleanClosureMap(m) {
  const out = {};
  if (!m || typeof m !== "object") return out;
  Object.keys(m).forEach((k) => {
    const y = parseInt(k, 10);
    if (!Number.isFinite(y) || !Array.isArray(m[k])) return;
    const by = new Map();
    m[k].map(cleanClosure).filter((c) => c && yearOf(c.date) === y).forEach((c) => by.set(c.date, c));
    out[String(y)] = Array.from(by.values()).sort((a, b) => a.date.localeCompare(b.date));
  });
  return out;
}

/** The closed days in force for a year: the saved list, or the defaults. */
export function closuresForYear(doc, year) {
  const saved = cleanClosureMap(doc && doc.closures)[String(year)];
  return saved ? saved : defaultClosures(year);
}

/**
 * An edit to one year's closed days from Settings: { year, days: [...] }, or
 * { year, reset: true } to go back to the defaults.
 */
export function validateClosures(input) {
  const b = input && typeof input === "object" ? input : {};
  const year = parseInt(b.year, 10);
  if (!(Number.isInteger(year) && year >= 2000 && year <= 2100)) return { ok: false, errors: ["Pick a year"] };
  if (b.reset === true) return { ok: true, year, reset: true };
  if (!Array.isArray(b.days)) return { ok: false, errors: ["Closed days must be a list"] };
  const errors = [];
  const seen = new Set();
  const days = [];
  b.days.forEach((c, i) => {
    const n = i + 1;
    const date = String((c && c.date) || "").trim();
    if (!isDay(date)) { errors.push(`Closed day ${n}: pick a date`); return; }
    if (yearOf(date) !== year) { errors.push(`Closed day ${n}: ${date} is not in ${year}`); return; }
    if (seen.has(date)) { errors.push(`${date} is on the list twice`); return; }
    seen.add(date);
    const name = String((c && c.name) || "").trim();
    if (!name) errors.push(`Closed day ${n}: give it a name`);
    const closesAt = c && c.closes_at ? String(c.closes_at).trim() : "";
    if (closesAt && toMinutes(closesAt) == null) errors.push(`Closed day ${n}: the closing time must look like 12:00`);
    days.push(cleanClosure({ date, name, closes_at: closesAt }));
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, year, days: days.sort((a, x) => a.date.localeCompare(x.date)) };
}

/** Closed days as a lookup by date, from whatever policy object was passed. */
function closedMap(policy) {
  const list = policy && Array.isArray(policy.closed) ? policy.closed : [];
  const m = new Map();
  list.forEach((c) => { const x = cleanClosure(c); if (x) m.set(x.date, x); });
  return m;
}

/**
 * The policy for one particular day: null when the shop is closed all day,
 * or with the shift cut short at closing time on a half day.
 */
function dayPolicy(p, closed, day) {
  const c = closed.get(day);
  if (!c) return p;
  if (!c.closes_at) return null;
  const end = Math.min(toMinutes(p.shift_end), toMinutes(c.closes_at));
  if (end <= toMinutes(p.shift_start)) return null;
  const hh = String(Math.floor(end / 60)).padStart(2, "0"), mm = String(end % 60).padStart(2, "0");
  return { ...p, shift_end: `${hh}:${mm}` };
}

/** True when the shop is closed all day on `day` under this policy. */
export function isClosedAllDay(policy, day) {
  const c = closedMap(policy).get(day);
  return !!c && !c.closes_at;
}

/**
 * Saves an edit as the version for `fromYear` onward. Earlier years keep
 * whatever was in force for them, which is the whole point of versioning.
 */
export function withPolicyVersion(doc, fromYear, policy, by, now = new Date()) {
  const d = cleanPolicyDoc(doc, now);
  const versions = { ...d.versions };
  // The first save ever freezes the defaults that were in force before it,
  // so a year already being tracked does not pick up the new numbers.
  if (!Object.keys(versions).length && Number(fromYear) > d.start_year) {
    versions[String(d.start_year)] = cleanPolicy(DEFAULT_POLICY);
  }
  versions[String(fromYear)] = cleanPolicy({ ...policyForYear(d, fromYear), ...policy });
  return { ...d, versions, updated_at: now.toISOString(), updated_by: by || null };
}

export function canApprove(username, doc) {
  const u = norm(username);
  if (!u) return false;
  return cleanPolicyDoc(doc).approvers.includes(u);
}

// ---- Grants ---------------------------------------------------------------

/** Full years completed between a start date and Jan 1 of `year`. */
export function fullYearsBy(startDate, year) {
  if (!isDay(startDate)) return 0;
  const [sy, sm, sd] = startDate.split("-").map(Number);
  let years = Number(year) - sy;
  // Jan 1 of `year` has not yet reached the anniversary unless the start was
  // itself Jan 1.
  if (sm > 1 || sd > 1) years -= 1;
  return Math.max(0, years);
}

export function tierHours(policy, years) {
  const p = cleanPolicy(policy);
  let h = p.tiers[0].hours;
  p.tiers.forEach((t) => { if (t.min_years <= years) h = t.hours; });
  return h;
}

/**
 * Hours granted on Jan 1 of `year` (or on the start date, for a new hire).
 * No start date on file: treated as a new hire tier, full year, rather than
 * guessed at.
 */
export function grantFor(employee, year, policy) {
  const p = cleanPolicy(policy);
  const start = employee && employee.start_date;
  if (!isDay(start)) return tierHours(p, 0);
  const sy = yearOf(start);
  if (sy > year) return 0;
  if (sy === year) {
    const base = tierHours(p, 0);
    if (!p.prorate_first_year) return base;
    // Days left in the year counting the start day, to the nearest hour.
    const left = dayNum(`${year}-12-31`) - dayNum(start) + 1;
    return Math.round(base * left / daysInYear(year));
  }
  return tierHours(p, fullYearsBy(start, year));
}

// ---- Requests ---------------------------------------------------------------

/** Weekdays between two days, both ends counted. */
export function weekdaysBetween(start, end) {
  if (!isDay(start) || !isDay(end) || end < start) return 0;
  let n = 0;
  for (let d = dayNum(start); d <= dayNum(end); d++) {
    const dow = new Date(d * 86400000).getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
  }
  return n;
}

/** What the request form fills in for hours before a person changes it. */
export function estimateHours(start, end, policy) {
  return round2(weekdaysBetween(start, end) * cleanPolicy(policy).hours_per_day);
}

export function requestYear(r) {
  return yearOf(r && r.start_date);
}

/**
 * Whether a request comes out of PTO. Anything saved before the choice
 * existed has no field, and all of those were PTO, so missing means yes.
 */
export function usesPto(r) {
  return !(r && r.use_pto === false);
}

// ---- Request types ------------------------------------------------------
//
// The same five choices as the old Jotform "Time Off Request" P&M used
// before QuickBooks (form 230514256537050), with the fields each one asked
// for. Ryan, Sep 21: all five come out of PTO.
//
// The HOURS are worked out here from the type and the times, never typed in
// by the person asking, so the number that comes off a balance is the same
// on the screen, on the server and in the tests. An approver logging time
// off for somebody may override it (a holiday inside a week off, a shift
// that isn't the normal one).

export const REQUEST_TYPES = [
  { value: "all_days",    label: "All day(s)" },
  { value: "half_day",    label: "Half day" },
  { value: "arrive_late", label: "Arrive late" },
  { value: "leave_early", label: "Leave early" },
  { value: "appointment", label: "Appointment" },
];
const TYPE_VALUES = REQUEST_TYPES.map((t) => t.value);

export function typeLabel(v) {
  const t = REQUEST_TYPES.find((x) => x.value === v);
  return t ? t.label : "Time off";
}

/**
 * Minutes of the paid day inside [from, to]: clipped to the shift, lunch
 * taken out. Leaving at 11 on an 8 to 5 day with lunch 12 to 1 is 5 hours,
 * not 6.
 */
export function paidMinutesBetween(from, to, policy) {
  const p = cleanPolicy(policy);
  const a = Math.max(from, toMinutes(p.shift_start));
  const b = Math.min(to, toMinutes(p.shift_end));
  if (b <= a) return 0;
  const la = Math.max(a, toMinutes(p.lunch_start));
  const lb = Math.min(b, toMinutes(p.lunch_end));
  return (b - a) - Math.max(0, lb - la);
}

function quarter(h) {
  return Math.round(h * 4) / 4;
}

/**
 * Hours a request takes off the balance, from its type and times. Returns
 * null when the fields needed to work it out are missing or wrong, so a
 * caller never mistakes "could not tell" for 0.
 */
export function hoursForRequest(r, policy) {
  const p = cleanPolicy(policy);
  // Closed days (Oct 8 2026) never come off a balance. A half day the shop
  // closes at noon only counts the hours it is open.
  const closed = closedMap(policy);
  const b = r || {};
  // The part-day types are all on one day: start_date. No date, no closures
  // to apply, which keeps the old behaviour for callers that never sent one.
  const dp = isDay(b.start_date) ? dayPolicy(p, closed, b.start_date) : p;
  switch (b.type) {
    case "all_days": {
      if (!isDay(b.start_date) || !isDay(b.return_date) || b.return_date <= b.start_date) return null;
      let total = 0;
      for (let d = b.start_date; d < b.return_date; d = dayShift(d, 1)) {
        const w = dowOf(d);
        if (w === 0 || w === 6) continue;
        const day = dayPolicy(p, closed, d);
        if (!day) continue;
        total += day === p ? p.hours_per_day
          : Math.min(p.hours_per_day, quarter(paidMinutesBetween(toMinutes(day.shift_start), toMinutes(day.shift_end), day) / 60));
      }
      return round2(total);
    }
    case "half_day": {
      if (b.half !== "morning" && b.half !== "afternoon") return null;
      if (!dp) return 0;
      const half = round2(p.hours_per_day / 2);
      if (dp === p) return half;
      // Shop closes early: the morning is whatever is open up to a half
      // day, the afternoon whatever is left after that.
      const open = quarter(paidMinutesBetween(toMinutes(dp.shift_start), toMinutes(dp.shift_end), dp) / 60);
      return round2(b.half === "morning" ? Math.min(half, open) : Math.max(0, open - half));
    }
    case "arrive_late": {
      const t = toMinutes(b.arrive_at);
      if (t == null) return null;
      if (!dp) return 0;
      return quarter(paidMinutesBetween(toMinutes(dp.shift_start), t, dp) / 60);
    }
    case "leave_early": {
      const t = toMinutes(b.leave_at);
      if (t == null) return null;
      if (!dp) return 0;
      return quarter(paidMinutesBetween(t, toMinutes(dp.shift_end), dp) / 60);
    }
    case "appointment": {
      const a = toMinutes(b.leave_at), c = toMinutes(b.return_at);
      if (a == null || c == null || c <= a) return null;
      if (!dp) return 0;
      return quarter(paidMinutesBetween(a, c, dp) / 60);
    }
    default:
      return null;
  }
}

/** One line describing a request, for lists and notifications. */
export function requestSummary(r) {
  const b = r || {};
  switch (b.type) {
    case "half_day":    return `Half day, ${b.half === "morning" ? "morning" : "afternoon"}`;
    case "arrive_late": return `Arriving ${fmtTime(b.arrive_at)}`;
    case "leave_early": return `Leaving ${fmtTime(b.leave_at)}`;
    case "appointment": return `Appointment ${fmtTime(b.leave_at)} to ${fmtTime(b.return_at)}`;
    case "all_days":    return b.return_date ? `Back ${b.return_date}` : "All day";
    default:            return "";
  }
}

/**
 * A new request.
 *
 * With a type: the fields that type needs, and the hours are worked out
 * (hoursForRequest). `allowHours` lets an approver override that number.
 *
 * With no type: an approver's plain entry, first day, last day and hours.
 * The route only lets approvers use it.
 *
 * One calendar year per request. Dec 30 to Jan 2 is two requests, because
 * the hours come out of two different years' balances.
 */
export function validateRequest(input, policy, { allowHours = true } = {}) {
  const b = input && typeof input === "object" ? input : {};
  const errors = [];
  const rec = {};
  const type = b.type ? String(b.type) : "";
  const note = String(b.note || b.reason || "").trim().slice(0, 500);

  if (type && !TYPE_VALUES.includes(type)) {
    return { ok: false, errors: ["Pick a type of request"] };
  }

  const start = String(b.start_date || "").trim();
  if (!isDay(start)) errors.push(type === "all_days" || !type ? "Pick a first day off" : "Pick the date");

  let end = start;
  if (type === "all_days") {
    const ret = String(b.return_date || "").trim();
    if (!isDay(ret)) errors.push("Pick the day you'll be back at work");
    else if (isDay(start) && ret <= start) errors.push("The day you're back has to be after the first day off");
    else if (isDay(start)) {
      end = dayShift(ret, -1);
      rec.return_date = ret;
    }
  } else if (!type) {
    end = String(b.end_date || start).trim();
    if (!isDay(end)) errors.push("Pick a last day off");
    else if (isDay(start) && end < start) errors.push("The last day can't be before the first day");
  }

  if (type === "half_day") {
    if (b.half !== "morning" && b.half !== "afternoon") errors.push("Pick morning or afternoon");
    else rec.half = b.half;
  }
  if (type === "arrive_late") {
    if (toMinutes(b.arrive_at) == null) errors.push("Pick the time you'll arrive");
    else rec.arrive_at = String(b.arrive_at);
  }
  if (type === "leave_early") {
    if (toMinutes(b.leave_at) == null) errors.push("Pick the time you're leaving");
    else rec.leave_at = String(b.leave_at);
  }
  if (type === "appointment") {
    const a = toMinutes(b.leave_at), c = toMinutes(b.return_at);
    if (a == null) errors.push("Pick the time you're leaving");
    if (c == null) errors.push("Pick the time you'll be back");
    if (a != null && c != null && c <= a) errors.push("You have to be back after you leave");
    if (a != null) rec.leave_at = String(b.leave_at);
    if (c != null) rec.return_at = String(b.return_at);
  }

  if (isDay(start) && isDay(end) && end >= start && yearOf(start) !== yearOf(end)) {
    errors.push("Split time off that crosses New Year's into two requests, one per year");
  }
  if (errors.length) return { ok: false, errors };

  rec.type = type || "all_days";
  rec.start_date = start;
  rec.end_date = end;
  rec.note = note;
  // Sep 22 2026 (Ryan): did they tell their supervisor? A record of what
  // they said, not a rule. It never blocks a request, because somebody
  // whose supervisor is off that day still needs to ask for the time.
  rec.told_supervisor = b.told_supervisor === true || b.told_supervisor === "true";
  // Uses PTO unless it says otherwise, in so many words.
  rec.use_pto = !(b.use_pto === false || b.use_pto === "false" || b.use_pto === "no");

  const given = Number(b.hours);
  const hasGiven = b.hours !== undefined && b.hours !== null && b.hours !== "";
  let hours;
  if (type) {
    const computed = hoursForRequest({ ...rec }, policy);
    hours = allowHours && hasGiven ? given : computed;
    rec.hours_computed = computed;
  } else {
    if (!allowHours) return { ok: false, errors: ["Pick a type of request"] };
    hours = given;
  }
  if (!(hours > 0)) {
    const allClosed = type && closedMap(policy).size > 0 && (() => {
      for (let d = start; d <= end; d = dayShift(d, 1)) {
        const w = dowOf(d);
        if (w !== 0 && w !== 6 && !isClosedAllDay(policy, d)) return false;
      }
      return true;
    })();
    if (allClosed) return { ok: false, errors: ["The shop is closed then, so there's no time off to take"] };
    return { ok: false, errors: [type ? "That works out to 0 hours off. Check the date and times" : "Hours must be more than 0"] };
  }
  if (hours > (dayNum(end) - dayNum(start) + 1) * 24) {
    return { ok: false, errors: ["That's more hours than there are in those days"] };
  }
  rec.hours = round2(hours);
  if (rec.hours_computed != null && rec.hours !== rec.hours_computed) rec.hours_overridden = true;
  return { ok: true, record: rec };
}

export function validateAdjustment(input) {
  const b = input && typeof input === "object" ? input : {};
  const errors = [];
  const y = parseInt(b.year, 10);
  const h = Number(b.hours);
  const reason = String(b.reason || "").trim().slice(0, 300);
  if (!(Number.isFinite(y) && y >= 2000 && y <= 2100)) errors.push("Pick a year");
  if (!Number.isFinite(h) || h === 0) errors.push("Hours can't be 0. Use a minus sign to take hours away");
  if (!reason) errors.push("Say why. An adjustment with no reason is a mystery next year");
  if (errors.length) return { ok: false, errors };
  return { ok: true, record: { year: y, hours: round2(h), reason } };
}

export function validateOpening(input) {
  const b = input && typeof input === "object" ? input : {};
  if (b.hours === null || b.hours === "") return { ok: true, record: null };
  const y = parseInt(b.year, 10);
  const h = Number(b.hours);
  const errors = [];
  if (!(Number.isFinite(y) && y >= 2000 && y <= 2100)) errors.push("Pick a year");
  if (!Number.isFinite(h)) errors.push("Starting balance must be a number of hours");
  if (errors.length) return { ok: false, errors };
  return { ok: true, record: { year: y, hours: round2(h) } };
}

// ---- The ledger -------------------------------------------------------------

/**
 * Year by year balance for one person, from the first tracked year through
 * `throughYear`.
 *
 * @param {object} o
 * @param {object} o.employee      needs start_date, may carry pto_opening
 * @param {Array}  o.requests      this person's requests, any status
 * @param {Array}  o.adjustments   this person's adjustments
 * @param {object} o.policyDoc     the stored, versioned policy
 * @param {number} o.throughYear
 */
export function ptoLedger(o) {
  const emp = (o && o.employee) || {};
  const doc = cleanPolicyDoc(o && o.policyDoc);
  const through = Number(o && o.throughYear) || new Date().getFullYear();
  const reqs = Array.isArray(o && o.requests) ? o.requests.filter(Boolean) : [];
  const adjs = Array.isArray(o && o.adjustments) ? o.adjustments.filter(Boolean) : [];
  const opening = emp.pto_opening && Number.isFinite(Number(emp.pto_opening.year)) ? emp.pto_opening : null;

  const hireYear = isDay(emp.start_date) ? yearOf(emp.start_date) : null;
  let first = opening ? Number(opening.year) : Math.max(doc.start_year, hireYear || doc.start_year);
  const rows = [];
  let prev = null;

  for (let y = first; y <= through; y++) {
    const policy = policyForYear(doc, y);
    const isOpening = opening && Number(opening.year) === y;
    const grant = isOpening ? 0 : grantFor(emp, y, policy);
    const endOfLast = prev ? prev.balance : 0;
    const carried = isOpening || !prev ? 0 : Math.min(policy.carryover_cap_hours, Math.max(0, endOfLast));
    const lapsed = isOpening || !prev ? 0 : round2(Math.max(0, endOfLast) - carried);
    const startHours = isOpening ? round2(Number(opening.hours) || 0) : round2(grant + carried);
    const adjusted = round2(adjs.filter((a) => Number(a.year) === y).reduce((s, a) => s + (Number(a.hours) || 0), 0));
    const yearReqs = reqs.filter((r) => requestYear(r) === y);
    const sum = (rows) => round2(rows.reduce((s, r) => s + (Number(r.hours) || 0), 0));
    const pto = yearReqs.filter(usesPto);
    const used = sum(pto.filter((r) => r.status === "approved"));
    const pending = sum(pto.filter((r) => r.status === "pending"));
    // Approved time off that did not use PTO. Shown, never subtracted.
    const unpaid = sum(yearReqs.filter((r) => !usesPto(r) && r.status === "approved"));
    const balance = round2(startHours + adjusted - used);
    prev = {
      year: y,
      source: isOpening ? "opening" : "grant",
      grant, carried, lapsed,
      start: startHours,
      adjusted, used, pending, balance, unpaid,
      // What would be left if everything pending were approved.
      after_pending: round2(balance - pending),
      cap: policy.carryover_cap_hours,
    };
    rows.push(prev);
  }
  return rows;
}

/** The one year a screen usually wants, or a zero row for a year not tracked. */
export function ptoBalance(o, year) {
  const y = Number(year) || new Date().getFullYear();
  const rows = ptoLedger({ ...o, throughYear: y });
  const row = rows.find((r) => r.year === y);
  if (row) return row;
  return { year: y, source: "none", grant: 0, carried: 0, lapsed: 0, start: 0, adjusted: 0, used: 0, pending: 0, balance: 0, unpaid: 0, after_pending: 0, cap: 0 };
}

/** Whether a request would take someone past what they have left. */
export function overBy(balanceRow, hours) {
  const left = Number(balanceRow && balanceRow.after_pending) || 0;
  return round2(Math.max(0, Number(hours || 0) - left));
}

/**
 * Who is out between two days, for the "coming up" list. Approved and
 * pending both show; the screen marks which is which. Sorted by first day.
 */
export function whoIsOut(requests, from, to) {
  return (Array.isArray(requests) ? requests : [])
    .filter((r) => r && (r.status === "approved" || r.status === "pending"))
    .filter((r) => isDay(r.start_date) && isDay(r.end_date) && r.end_date >= from && r.start_date <= to)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
}

/**
 * Lay one week of a calendar out as BARS rather than a chip per day (Ryan,
 * Sep 22). Each request that touches the week becomes one bar clipped to the
 * week's own days, and bars are stacked into lanes so two people off at once
 * never sit on top of each other.
 *
 * @param {Array} rows      requests
 * @param {Array} weekDates seven ISO days, or "" for padding before the 1st
 *                          and after the last of the month
 * @returns bars with from/to column indexes, whether the true start and end
 *          fall in this week, and a lane number.
 */
export function weekBars(rows, weekDates) {
  const week = Array.isArray(weekDates) ? weekDates : [];
  const bars = [];
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    if (!r || !isDay(r.start_date) || !isDay(r.end_date)) return;
    let from = -1;
    let to = -1;
    week.forEach((date, col) => {
      if (!date) return;
      if (r.start_date <= date && r.end_date >= date) {
        if (from === -1) from = col;
        to = col;
      }
    });
    if (from === -1) return;
    bars.push({
      request: r, from, to,
      opens: week[from] === r.start_date,
      closes: week[to] === r.end_date,
      lane: 0,
    });
  });
  // Ordered by the REQUEST's own start and length, not by where it lands in
  // this week, so somebody keeps the same lane from one week row to the next
  // instead of hopping up and down mid-absence. Longest first breaks a tie,
  // then the name, so the order is the same every time it is drawn.
  const dur = (r) => dayNum(r.end_date) - dayNum(r.start_date);
  bars.sort((a, b) =>
    String(a.request.start_date).localeCompare(String(b.request.start_date))
    || (dur(b.request) - dur(a.request))
    || String(a.request.employee_name || "").localeCompare(String(b.request.employee_name || "")));
  const lanes = [];
  bars.forEach((b) => {
    let lane = lanes.findIndex((used) => used.every((o) => o.to < b.from || o.from > b.to));
    if (lane === -1) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push(b);
    b.lane = lane;
  });
  return bars;
}

/**
 * The shop-wide time off calendar everybody can see (Ryan, Oct 8 2026,
 * reversing Sep 22's "admins and supervisors only"). His calls: everyone
 * sees name, dates and TYPE (all day, half day, arrive late, leave early,
 * appointment), APPROVED requests only so nobody plans around one that gets
 * denied, and anyone can narrow it by department.
 *
 * This is a whitelist on purpose. Hours, paid or unpaid, the employee's
 * note, the approver's reply, who decided, the email record and the history
 * never leave the server through here. A field added to a request later is
 * left out until somebody adds it below.
 */
const CALENDAR_FIELDS = ["type", "half", "arrive_at", "leave_at", "return_at", "return_date"];

export function shopCalendarRows(requests, employees) {
  const byId = new Map((Array.isArray(employees) ? employees : []).filter(Boolean).map((e) => [e.id, e]));
  return (Array.isArray(requests) ? requests : [])
    .filter((r) => r && r.status === "approved" && isDay(r.start_date) && isDay(r.end_date))
    .map((r) => {
      const e = byId.get(r.employee_id);
      if (!e) return null;
      const row = {
        id: r.id, employee_id: r.employee_id,
        employee_name: e.name || r.employee_name || "",
        department: e.department || "",
        start_date: r.start_date, end_date: r.end_date, status: "approved",
      };
      CALENDAR_FIELDS.forEach((k) => { if (r[k] != null && r[k] !== "") row[k] = r[k]; });
      return row;
    })
    .filter(Boolean)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
}

/**
 * What a caller may do to a request. One definition, so the screen draws
 * the buttons the server will honour.
 */
export function requestActions(r, { isApprover = false, isOwner = false, isAdmin = false } = {}) {
  const st = r && r.status;
  return {
    // Fixing a request after the fact (Ryan, Sep 22): an approver or a
    // CrewCore admin, on anything not already cancelled. Approving is still
    // approvers only; editing is correcting a record, not deciding it.
    edit: (isApprover || isAdmin) && st !== "cancelled",
    // Never on your own request (Oct 29 2026, security audit): an approver
    // asking for time off waits for the other approver like anyone else.
    approve: isApprover && !isOwner && st === "pending",
    deny: isApprover && !isOwner && st === "pending",
    // The person asking can take back a request nobody has answered yet.
    // Once approved, only an approver can cancel it, because by then the
    // schedule was planned around it.
    cancel: (isOwner && st === "pending") || (isApprover && (st === "pending" || st === "approved")),
  };
}

// ---- Repeating time off (Ryan, Nov 3 2026) --------------------------------
//
// Some people have a standing appointment: every week, every other week, or
// once a month. Ryan's calls:
//   - The employee asks with the usual form plus "Repeats", and an approver
//     approves the whole series once.
//   - Each date uses PTO or not, the same switch every request has.
//   - A series runs through Dec 31 at the latest, matching the yearly grant.
//     They ask again in January.
//   - Every week, every other week, or once a month.
//
// HOW IT IS STORED: every date is its own ordinary request, carrying the
// same `series` object. So balances, the calendar, emails, the kiosk and
// the Time Clock reports treat each date exactly like any other request,
// and skipping one date is cancelling that one date. The route decides a
// series all at once (one approval, one email, one notification).
//
// Shop closed days are skipped. Once a month means the same weekday in the
// same week of the month ("the 2nd Tuesday"), which is how standing
// appointments are booked; a start on the 5th Tuesday falls back to the
// last Tuesday of months that have only four.

export const REPEAT_OPTIONS = [
  { value: "weekly",   label: "Every week" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly",  label: "Once a month" },
];
const REPEAT_VALUES = REPEAT_OPTIONS.map((o) => o.value);

/** A series can't run forever by accident: a year of weekly dates, at most. */
export const MAX_SERIES_DATES = 53;

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "last"];

/** Which week of the month a date is in: 1 to 4, or 5 for a 5th weekday. */
function weekOfMonth(day) {
  return Math.ceil(Number(day.slice(8, 10)) / 7);
}

/**
 * Every date in a series, oldest first, closed days skipped. Returns
 * { ok, dates } or { ok: false, errors }.
 */
export function seriesDates(start, every, until, policy) {
  const errors = [];
  if (!isDay(start)) errors.push("Pick the first date");
  if (!REPEAT_VALUES.includes(every)) errors.push("Pick how often it repeats");
  if (!isDay(until)) errors.push("Pick the last date it repeats");
  if (errors.length) return { ok: false, errors };
  if (until < start) return { ok: false, errors: ["The last date can't be before the first"] };
  if (yearOf(until) !== yearOf(start)) {
    return { ok: false, errors: [`A repeating request runs through Dec 31 at the latest. Ask again in January for ${yearOf(start) + 1}.`] };
  }
  const w = dowOf(start);
  if (w === 0 || w === 6) return { ok: false, errors: ["The first date is on a weekend"] };

  const closed = closedMap(policy);
  const dates = [];
  const take = (d) => { if (!(closed.get(d) && !closed.get(d).closes_at)) dates.push(d); };

  if (every === "monthly") {
    const nth = weekOfMonth(start);
    let y = Number(start.slice(0, 4));
    let m = Number(start.slice(5, 7));
    for (let i = 0; i < 12; i += 1) {
      const d = nth >= 5 ? nthWeekday(y, m, w, -1) : nthWeekday(y, m, w, nth);
      if (d && d >= start && d <= until) take(d);
      m += 1; if (m > 12) { m = 1; y += 1; }
    }
  } else {
    const step = every === "weekly" ? 7 : 14;
    for (let d = start; d <= until; d = dayShift(d, step)) take(d);
  }
  if (!dates.length) return { ok: false, errors: ["The shop is closed on every one of those dates"] };
  if (dates.length > MAX_SERIES_DATES) return { ok: false, errors: [`That's ${dates.length} dates. ${MAX_SERIES_DATES} is the most one series can have.`] };
  return { ok: true, dates };
}

/** "Every Tuesday", "Every other Tuesday", "2nd Tuesday of the month". */
export function repeatLabel(every, start) {
  if (!isDay(start)) return "";
  const day = DOW_NAMES[dowOf(start)];
  if (every === "weekly") return `Every ${day}`;
  if (every === "biweekly") return `Every other ${day}`;
  if (every === "monthly") return `${ORDINALS[Math.min(weekOfMonth(start), 5)]} ${day} of the month`;
  return "";
}

/**
 * The requests in a series, one per date, each validated on its own so a
 * half day the shop closes early is worked out for that date. `body` is the
 * form (type, times, use_pto, note...) with start_date as the first date.
 * Returns { ok, records, dates } or { ok: false, errors }.
 */
export function buildSeries(body, policyFor, { allowHours = false } = {}) {
  const b = body && typeof body === "object" ? body : {};
  const every = String(b.repeat || "");
  const start = String(b.start_date || "").trim();
  const policy = policyFor(yearOf(start) || 0);
  const s = seriesDates(start, every, String(b.repeat_until || "").trim(), policy);
  if (!s.ok) return s;

  // A repeating "all day" is one day at a time.
  const one = (d) => {
    const x = { ...b, start_date: d };
    if ((b.type || "all_days") === "all_days") x.return_date = dayShift(d, 1);
    delete x.repeat; delete x.repeat_until;
    return x;
  };
  const first = validateRequest(one(s.dates[0]), policy, { allowHours });
  if (!first.ok) return first;

  const records = [];
  s.dates.forEach((d) => {
    const v = validateRequest(one(d), policy, { allowHours });
    // A date that works out to nothing (a half day the shop is closed for
    // that part) is dropped rather than refusing the whole series.
    if (v.ok) records.push(v.record);
  });
  if (!records.length) return { ok: false, errors: ["None of those dates works out to any time off"] };
  return { ok: true, records, dates: records.map((r) => r.start_date) };
}

/** The dates of one series in a list of requests, oldest first. */
export function seriesMembers(requests, seriesId) {
  if (!seriesId) return [];
  return (Array.isArray(requests) ? requests : [])
    .filter((r) => r && r.series && r.series.id === seriesId)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
}

/**
 * One line for a whole series: "Every Tuesday, Nov 3 to Dec 29 (9 dates),
 * Appointment 2:00 PM to 3:00 PM".
 */
export function seriesSummary(members) {
  const m = (members || []).filter(Boolean);
  if (!m.length) return "";
  const s = m[0].series || {};
  const fmt = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const kind = m[0].type && m[0].type !== "all_days" ? requestSummary(m[0]) : "All day";
  return `${repeatLabel(s.every, m[0].start_date)}, ${fmt(m[0].start_date)} to ${fmt(m[m.length - 1].start_date)} (${m.length} ${m.length === 1 ? "date" : "dates"}), ${kind}`;
}

// ---- Notice -----------------------------------------------------------------
//
// Nov 2026 Handbook: full and half days need at least 48 hours' notice.
// Arriving late, leaving early and appointments can be asked for the same
// day. Ryan's call: WARN the approver, never block the request (illness and
// emergencies come in late on purpose, and an approver decides).
//
// The clock is the shop's (America/Chicago), not the server's (UTC). The
// time off starts at the start of the shift, or at the end of lunch for an
// afternoon half day.

export const NOTICE_HOURS = 48;
const NOTICE_TYPES = ["all_days", "half_day", ""];

function shopWallMinutes(now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(now).map((p) => [p.type, p.value]));
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute) / 60000;
}

/**
 * Hours between `now` and when the time off starts, rounded down. null when
 * the notice rule does not apply to this type, or the date is unreadable.
 */
export function noticeHours(r, policy, now = new Date()) {
  const type = (r && r.type) ? String(r.type) : "";
  if (!NOTICE_TYPES.includes(type)) return null;
  const [y, m, d] = String((r && r.start_date) || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  const p = cleanPolicy(policy);
  const at = type === "half_day" && r.half === "afternoon" ? toMinutes(p.lunch_end) : toMinutes(p.shift_start);
  const startMin = Date.UTC(y, m - 1, d) / 60000 + at;
  return Math.floor((startMin - shopWallMinutes(now)) / 60);
}

/** True when a full or half day is asked for with less than 48 hours to go. */
export function isShortNotice(r, policy, now = new Date()) {
  const h = noticeHours(r, policy, now);
  return h != null && h < NOTICE_HOURS;
}

/** The line an approver reads. "" when there is nothing to say. */
export function shortNoticeLine(r) {
  if (!r || r.short_notice !== true) return "";
  const h = Number(r.notice_hours);
  const when = !Number.isFinite(h) ? "" : h <= 0 ? " (asked for after it started)" : ` (${h} ${h === 1 ? "hour" : "hours"} ahead)`;
  return `Short notice${when}. The handbook asks for ${NOTICE_HOURS} hours on full and half days.`;
}
