// PUT IN: lib/crewcore/handbook-changes.js
// lib/crewcore/handbook-changes.js: turns HANDBOOK_CHANGES into what the
// Handbook screen shows (Nov 2026). The "What changed" box at the top lists
// each change as a link that jumps to it, and the section and sub-heading it
// points at carry a New or Updated tag.
//
// The change list only applies while its version is the live handbook
// version. An old list left in place after the next revision shows nothing,
// so stale "Updated" tags can't linger.
//
// ESM. Pure functions, no storage.

const KINDS = new Set(["new", "updated"]);

/** The anchor id a sub-heading gets on screen: hb-<section>--<slug>. */
export function headingAnchor(sectionId, heading) {
  const slug = String(heading || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `hb-${sectionId}--${slug}`;
}

/** Every change item that points somewhere that isn't in the handbook. [] when all good. */
export function changeProblems(sections, changes) {
  const problems = [];
  const items = (changes && Array.isArray(changes.items)) ? changes.items : [];
  const byId = new Map((sections || []).map((s) => [s.id, s]));
  items.forEach((it, i) => {
    const s = byId.get(it && it.section);
    if (!s) { problems.push(`item ${i}: no section "${it && it.section}"`); return; }
    if (!KINDS.has(it.kind)) problems.push(`item ${i}: kind must be new or updated`);
    if (!it.summary || !String(it.summary).trim()) problems.push(`item ${i}: no summary`);
    if (it.heading && !s.blocks.some((b) => b.h === it.heading)) problems.push(`item ${i}: no heading "${it.heading}" in ${s.id}`);
  });
  return problems;
}

/**
 * The handbook as the screen draws it: sections with a `tag` ("new",
 * "updated" or null), sub-heading blocks with an `anchor` and a `tag`, and
 * `changes`, the list for the What changed box, each with the anchor it
 * jumps to and the title to show. Items that point nowhere are dropped
 * rather than drawn as dead links.
 */
export function annotateHandbook(sections, changes, version) {
  const live = !!(changes && changes.version === version && Array.isArray(changes.items));
  const items = live ? changes.items.filter((it, i) => changeProblems(sections, { items: [it] }).length === 0) : [];

  const out = (sections || []).map((s) => {
    const mine = items.filter((it) => it.section === s.id);
    const whole = mine.find((it) => !it.heading);
    const tag = whole ? whole.kind : (mine.length ? "updated" : null);
    const blocks = s.blocks.map((b) => {
      if (!b.h) return b;
      const hit = mine.find((it) => it.heading === b.h);
      return { ...b, anchor: headingAnchor(s.id, b.h), tag: hit ? hit.kind : null };
    });
    return { ...s, tag, blocks };
  });

  // Listed in reading order, whatever order the items were written in.
  const titles = new Map(out.map((s) => [s.id, s.title]));
  const where = (it) => {
    const si = out.findIndex((s) => s.id === it.section);
    const bi = it.heading ? out[si].blocks.findIndex((b) => b.h === it.heading) : -1;
    return si * 10000 + bi;
  };
  const ordered = items.map((it, i) => ({ it, i, w: where(it) })).sort((a, b) => a.w - b.w || a.i - b.i).map((x) => x.it);
  const list = ordered.map((it) => ({
    kind: it.kind,
    summary: it.summary,
    title: it.heading ? `${titles.get(it.section)}: ${it.heading}` : titles.get(it.section),
    anchor: it.heading ? headingAnchor(it.section, it.heading) : `hb-${it.section}`,
  }));

  return { sections: out, changes: list };
}
