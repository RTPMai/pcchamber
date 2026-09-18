/* ==========================================================================
   HOW CHAMBER EMAILS LOOK

   One plain layout for the quarterly member email and the newsletter.
   Email clients are twenty years behind browsers, so: tables for layout,
   styles written on each element, no web fonts, no images except the
   logo, and a text version of everything for the clients that want it.

   An email is a list of blocks:

     { h: 'Heading' }
     { p: 'A paragraph.' }
     { items: [{ title, meta, text, href }] }
     { button: { label, href } }
     { rows: [[left, right], ...] }       two columns, like a receipt
     { note: 'small grey text' }
   ========================================================================== */

import { escHtml as e } from './mail.js';

const NAVY = '#002734', SOFT = '#526A73', SUN = '#F19C30', RULE = '#E4DED3', PAPER = '#FBFAF7';

function htmlBlock(b) {
  if (b.h) return `<h2 style="font-family:Georgia,serif;font-size:20px;color:${NAVY};margin:28px 0 10px">${e(b.h)}</h2>`;
  if (b.p) return `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:${NAVY}">${e(b.p)}</p>`;
  if (b.note) return `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${SOFT}">${e(b.note)}</p>`;
  if (b.button) return `<p style="margin:18px 0 22px"><a href="${e(b.button.href)}" style="background:${SUN};color:${NAVY};font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${e(b.button.label)}</a></p>`;
  if (b.rows) return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px">${b.rows.map(([l, r]) =>
    `<tr><td style="padding:9px 0;border-bottom:1px solid ${RULE};font-size:15px;color:${NAVY}">${e(l)}</td><td style="padding:9px 0;border-bottom:1px solid ${RULE};font-size:15px;color:${SOFT};text-align:right;white-space:nowrap">${e(r)}</td></tr>`).join('')}</table>`;
  if (b.items) return b.items.map(i => `<div style="margin:0 0 16px;padding-left:12px;border-left:3px solid ${SUN}">
    <div style="font-size:16px;font-weight:bold;color:${NAVY}">${i.href ? `<a href="${e(i.href)}" style="color:${NAVY}">${e(i.title)}</a>` : e(i.title)}</div>
    ${i.meta ? `<div style="font-size:14px;color:${SOFT};margin-top:2px">${e(i.meta)}</div>` : ''}
    ${i.text ? `<div style="font-size:15px;color:${NAVY};margin-top:4px;line-height:1.5">${e(i.text)}</div>` : ''}
  </div>`).join('');
  return '';
}

function textBlock(b) {
  if (b.h) return '\n' + b.h.toUpperCase() + '\n';
  if (b.p || b.note) return (b.p || b.note) + '\n';
  if (b.button) return `${b.button.label}: ${b.button.href}\n`;
  if (b.rows) return b.rows.map(([l, r]) => `  ${l}: ${r}`).join('\n') + '\n';
  if (b.items) return b.items.map(i => [`- ${i.title}`, i.meta && `  ${i.meta}`, i.text && `  ${i.text}`, i.href && `  ${i.href}`].filter(Boolean).join('\n')).join('\n') + '\n';
  return '';
}

/* footer is a list of blocks too, usually a note with the unsubscribe link. */
export function renderEmail({ site, preheader = '', blocks, footer = [] }) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${PAPER}">
<span style="display:none;max-height:0;overflow:hidden">${e(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${RULE};border-radius:12px">
<tr><td style="background:${NAVY};border-radius:12px 12px 0 0;padding:18px 24px">
  <a href="${e(site.url)}" style="color:#ffffff;text-decoration:none;font-family:Georgia,serif;font-size:18px;font-weight:bold">${e(site.name)}</a>
</td></tr>
<tr><td style="padding:24px 28px 8px;font-family:Arial,Helvetica,sans-serif">
${blocks.map(htmlBlock).join('\n')}
</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid ${RULE};font-family:Arial,Helvetica,sans-serif">
${footer.map(htmlBlock).join('\n')}
<p style="margin:0;font-size:12px;color:${SOFT}">${e(site.name)} &middot; ${e(site.mail)}</p>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = blocks.map(textBlock).join('\n') + '\n--\n' + footer.map(textBlock).join('') + `${site.name}, ${site.mail}\n`;
  return { html, text };
}
