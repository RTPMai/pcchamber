/* ==========================================================================
   OPEN OFF-SITE LINKS IN A NEW TAB

   Runs over the built HTML rather than being remembered at each link. A
   rule applied by hand gets forgotten the first time somebody adds a link
   in a hurry, and there are well over a hundred of them.

   WHAT COUNTS AS OFF-SITE
     An http or https link to a different host. That is all.

   WHAT IS LEFT ALONE
     Anything relative, anything on this site, and mailto:, tel: and
     download links. Sending someone to a new tab to open their own email
     client leaves them with a blank tab to close.

   ACCESSIBILITY
     A link that opens a new tab without warning is disorienting for
     someone using a screen reader, and for anyone relying on the back
     button. Each one gets a small arrow for sighted users and a short
     hidden phrase for everyone else.
   ========================================================================== */

/* Anchors only, and only ones with an http(s) href. The [^>]* either side
   catches attributes written before or after href. */
const ANCHOR = /<a\s([^>]*href="(https?:\/\/[^"]+)"[^>]*)>([\s\S]*?)<\/a>/gi;

function host(url) {
  try { return new URL(url).host.replace(/^www\./, ''); }
  catch { return null; }
}

export function externalLinks(html, siteUrl) {
  const own = host(siteUrl);

  return html.replace(ANCHOR, (whole, attrs, href, inner) => {
    /* Already handled, by this or by hand. */
    if (/\starget=/i.test(attrs)) return whole;

    const target = host(href);
    if (!target || target === own) return whole;

    /* A download of an off-site file should still download, not navigate. */
    if (/\sdownload(\s|=|$)/i.test(attrs)) return whole;

    const rel = /\srel="([^"]*)"/i.exec(attrs);
    const merged = rel
      ? attrs.replace(rel[0], ` rel="${[...new Set((rel[1] + ' noopener noreferrer').split(/\s+/))].join(' ')}"`)
      : `${attrs} rel="noopener noreferrer"`;

    return `<a ${merged} target="_blank">${inner}<span class="ext" aria-hidden="true"></span><span class="skip-text"> (opens in a new tab)</span></a>`;
  });
}
