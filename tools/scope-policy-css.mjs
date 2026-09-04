/* ==========================================================================
   SCOPE THE POLICY CENTER STYLESHEET

   The Policy Center was written as a standalone site, so its stylesheet
   styles body, html, and eleven class names the main site also uses:
   wrap, brand, foot, hero, doors, chips, count, crumb, empty, tools, skip.

   Dropped onto a page as-is it would restyle the chamber header and footer,
   and the chamber stylesheet would restyle it back. Both would look wrong.

   So every rule gets scoped under #policyapp. Nothing outside that element
   can be touched, and its own variables stop leaking to :root.

   Run by build.mjs. You should not need to run it yourself.
   ========================================================================== */

export function scopeCss(css, scope = '#policyapp') {
  const out = [];
  let i = 0;

  while (i < css.length) {
    /* Skip whitespace first. Without this, a comment sitting between two
       rules is not recognised as a comment, gets absorbed into the next
       selector, and that whole rule silently escapes scoping. */
    if (/\s/.test(css[i])) { out.push(css[i]); i++; continue; }

    /* Comments pass through untouched. */
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out.push(css.slice(i, stop));
      i = stop;
      continue;
    }

    /* @import, @charset and friends: copy the whole statement. */
    if (css[i] === '@') {
      const brace = css.indexOf('{', i);
      const semi = css.indexOf(';', i);
      if (semi !== -1 && (brace === -1 || semi < brace)) {
        out.push(css.slice(i, semi + 1));
        i = semi + 1;
        continue;
      }
      const rule = css.slice(i, brace).trim();
      const block = readBlock(css, brace);

      /* Media and supports wrap other rules, so recurse inside them.
         Keyframes and font-face must not be touched. */
      if (/^@(media|supports|layer|container)/i.test(rule)) {
        out.push(rule + ' {' + scopeCss(block.body, scope) + '}');
      } else {
        out.push(rule + ' {' + block.body + '}');
      }
      i = block.end;
      continue;
    }

    const brace = css.indexOf('{', i);
    if (brace === -1) { out.push(css.slice(i)); break; }

    const selector = css.slice(i, brace).trim();
    const block = readBlock(css, brace);

    if (selector) out.push(rewrite(selector, scope) + ' {' + block.body + '}');
    i = block.end;
  }

  return out.join('\n');
}

function readBlock(css, brace) {
  let depth = 0;
  for (let j = brace; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}') {
      depth--;
      if (depth === 0) return { body: css.slice(brace + 1, j), end: j + 1 };
    }
  }
  return { body: css.slice(brace + 1), end: css.length };
}

function rewrite(selector, scope) {
  return selector.split(',').map(part => {
    const s = part.trim();
    if (!s) return s;

    /* :root holds the Policy Center's own colour variables. Pinning them to
       the container keeps them out of the main site's variable space. */
    if (s === ':root' || s === 'html' || s === 'body' || s === 'html body') return scope;

    /* Already scoped, e.g. hand-written overrides. */
    if (s.startsWith(scope)) return s;

    /* *, ::selection and similar pseudo-elements at the top level. */
    if (s.startsWith('*')) return scope + ' ' + s;

    return scope + ' ' + s;
  }).join(', ');
}
