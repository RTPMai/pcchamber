# Polk City Area Chamber, website demo

A working demo of a replacement for the chamber's public website. Same brand system as the Business Policy Center, same rule about plain language, same one-sentence summary before anyone has to click.

This is the front half of the platform. Dues collection, member logins, and event registration are the back half and are not in here.

---

## What it does that the current site does not

**Every member gets a real page.** `/directory/sample-community-bank/` is an actual file at an actual address, with its own title, description, and structured data. Google can index it. The current directory loads its listings with JavaScript after the page opens, which is why searching for a Polk City business plus what they do does not turn up the chamber.

**Prices are on the membership page.** Not behind an application form. Somebody deciding whether they can afford this should not have to email a stranger to find out.

**Three things expire by themselves.** Past events, closed job postings, and the next-event line on the home page all update from the dates in the data. Nothing has to be remembered or cleaned up, which matters when nobody is being paid to remember.

**The next event is on the home page automatically.** It reads the calendar and shows the soonest one. Past events drop off by themselves on the day after. Nothing to clean up.

**It passes a WCAG 2.1 AA audit.** Thirteen page types, mobile and desktop, zero violations under axe-core. That is not a nice-to-have for an organisation that takes public money and speaks for the business community.

**Search and filtering work without a page reload,** but every listing is already in the HTML before any JavaScript runs. Turn JavaScript off and the directory still works.

---

## The files you would actually edit

| File | What is in it |
| --- | --- |
| `data/members.js` | The member directory. **All sample data. Replace it.** |
| `data/events.js` | The luncheon, the golf tournament, the calendar |
| `data/membership.js` | Tiers, prices, benefits. **Placeholder pricing.** |
| `data/pages.js` | About text, FAQ, the resources links |
| `data/site.js` | Chamber contact details, menu, the demo banner |
| `data/involved.js` | Get Involved page and the privacy policy. **Board list is placeholder.** |
| `data/news.js` | Chamber news and member spotlights |
| `data/jobs.js` | The job board. Postings drop off on their own. |
| `data/referrals.js` | Who the chamber points people at, by situation |
| `data/forms.js` | The join form and the event submission form |
| `api/_policy/content.js` | **Policy Center entries.** Members only, so it lives here, not in the site. |

Everything else builds itself from those five files.

| File | What it does | Edit it? |
| --- | --- | --- |
| `build.mjs` | Turns the data into HTML pages | No |
| `assets/styles.css` | Colors, type, layout | Only to change the look |
| `vercel.json` | Build settings and the redirects from the old site | Only to add a redirect |
| `tools/import-directory.mjs` | Turns a pasted directory into member entries | No |
| `tools/make-social-card.py` | Rebuilds the share card and favicons | Only if the wording changes |

---

## Loading the real directory

Do not type sixty-seven members by hand.

1. Paste the directory, in whatever shape it comes out, into `tools/paste.txt`
2. Run `node tools/import-directory.mjs`
3. It writes `data/members.generated.js` and prints a list of anything it could not work out
4. Set `category` and `tier` on each entry, then rename the file over `data/members.js`

It works out names, phones, emails, websites, addresses and slugs. It will not guess a category or a tier, because getting those wrong is worse than leaving them blank.

---

## The old site's addresses still work

`vercel.json` redirects every page on the current GoDaddy site to its new home, including `/business-member-directory`, `/chamber-golf-tournament`, and `/business-resources`. Anyone with a bookmark, and every link Google already has, lands in the right place instead of on an error.

If a page is added to the old site before the switch, add a redirect for it too.

---

## Running it

You do not have to. Vercel runs the build every time a file changes on GitHub.

To run it on your own machine:

```
node build.mjs        # writes everything into /dist
npm run dev           # builds, then serves it at localhost:3000
```

Node 18 or newer. No dependencies to install.

## Putting it online

1. Push this folder to a new GitHub repository.
2. On Vercel, **Add New, Project**, import the repository, and deploy. It reads `vercel.json` and needs no settings changed.
3. Set `SITE.url` in `data/site.js` to the real address before you submit a sitemap.

---

## Before this stops being a demo

**Replace the members.** Every listing is a placeholder. The real 67 need to be pasted into `data/members.js`. Category and tier drive sorting, colour, and the badge, so those two fields matter more than the prose.

**Put in the approved dues.** `data/membership.js` has invented numbers in it.

**Turn off the demo banner.** One line in `data/site.js`.

**Replace the board list.** `data/involved.js` has placeholder names and roles on the Get Involved page.

**Set MEMBER_PASSCODE in Vercel** or the Policy Center will refuse everyone.

**Set formEndpoint** or the join and event forms stay in email fallback.

**Vote on the membership structure.** `data/membership.js` has `draft: true`, which puts a red banner on the page. Turn it off after the board votes, not before.

**Fill in the real referrals.** `data/referrals.js` drives the Who to call block and the referral badges. Two categories are honestly marked as gaps: no accountant or CPA, and no attorney. Leave them marked until somebody joins. A referral to nobody is worse than an admitted gap.

**Empty the job board and the news list, or fill them.** The three jobs and three posts in there are examples. A job board with fake postings is worse than an empty one.

**Point the Policy Center link at the live address.** `SITE.policyCenterUrl`.

**Decide about slugs.** A member's address is `/directory/their-slug/`. Once it is public and indexed, changing a slug breaks every link to it. Get them right the first time, or plan redirects.

---

## The Policy Center

It now lives at `/policy-center/` inside this site rather than at its own address, and it is gated because access is a paid benefit at every membership level.

**Set the passcode before deploying.** In Vercel: Project, Settings, Environment Variables.

    MEMBER_PASSCODE = whatever you tell members

Without it the endpoint refuses everyone, which is the safe way for it to fail.

**Why it is a server function and not a JavaScript password box.** A password checked in the browser is theatre: the content still downloads to everyone and anyone can read it with View Source. If members are paying for this, the content genuinely must not be sent to people who have not paid. So the entries live in `api/_policy/`, outside the built site, and `api/policy.js` only releases them after the passcode checks out on the server. You can confirm this yourself: search `dist/` for any entry text after a build and you will not find it.

**What this is not.** One shared passcode for the whole membership, not per-member accounts. A member who leaves can still use it until you change it, and one member can pass it to a friend. That is a real limitation and a deliberate trade: it keeps the content off the public web, costs nothing, and adds no database. Per-member logins belong with dues collection, which the board has not decided yet. Change the passcode when the membership year turns over.

The page also carries `noindex` and is excluded from the sitemap and disallowed in `robots.txt`.

**Membership is not in here.** It lives on the public site at `/membership/` and nowhere else, so there is one file to edit and nothing to drift. The Policy Center's own membership section, its two-door landing page, and its top navigation rail were removed, and `#/membership` now redirects to `/membership/` so old links and bookmarks still land somewhere sensible. The Policy Center opens straight onto its section cards.

**Its stylesheet is scoped, automatically.** `policy.css` was written for a standalone site: it styles `body`, `html`, and eleven class names the chamber site also uses, including `wrap`, `foot`, `hero` and `brand`. Dropped on the page as-is it would restyle the chamber header and footer. `tools/scope-policy-css.mjs` rewrites every rule under `#policyapp` at build time, including pinning its `:root` variables to that container. Edit `policy/policy.css` normally and the scoping happens on build.

---

## Forms

`data/site.js` has a `formEndpoint`. Any service that accepts a plain POST works: Formspree, Basin, Getform, Tally. Formspree's free tier covers fifty submissions a month, which is more than this chamber will use.

Leave it empty and both forms fall back to an email link rather than a button that silently does nothing.

Both forms carry a honeypot field positioned off screen rather than hidden with `display:none`, which bots detect.

---

## The logo files

`assets/` holds five, and which one to use is not arbitrary.

| File | Use it for |
| --- | --- |
| `mark.svg` | The roundel alone, full colour. Header, footer, icons. |
| `wordmark-navy.svg` | The type alone, for light backgrounds |
| `wordmark-white.svg` | The type alone, for navy |
| `logo-horizontal.svg` | The full lockup. Print, letterhead, anything sent out. |
| `logo-stacked.svg` | The full lockup, taller. Square spaces, social avatars. |

**Why the mark and the type are separate files.** The roundel cannot be recoloured for a dark background. Its outer ring is navy and its gazebo is white, so inverting one destroys the other. On navy the roundel sits on a white plate at full colour, which is what the `.mark` class does. The wordmark is plain type and inverts cleanly, hence two colour versions of it and only one of the mark.

**They are `<img>` references, not inline SVG.** The artwork is about 38KB of path data. Inlining it into all 31 pages would add well over a megabyte of duplicated markup and stop it being cached.

The originals from Illustrator carried around 8KB each of C2PA provenance metadata, which has been stripped. If you re-export, strip it again or the files roughly double.

---

## Re-running the accessibility audit

Worth doing after any change to colours or markup.

```
npm install --no-save axe-core playwright
```

Then point axe at each page in `dist/`. The one thing that has already failed once is colour contrast on muted grey text sitting on a seasonal wash. `--navy-soft` is set to a value that clears 4.5:1 on all five washes. If you lighten it, re-check.

---

## Two things worth deciding with the board, not alone

**Who owns this.** Same question as the Policy Center, and it does not get smaller as the site does more. Repository ownership, what happens if you step off the board, and how the content comes out if the chamber ever moves to a vendor.

**Where the line is between this and the back office.** This site is content, and content is safe: nothing to breach, nothing to reconcile. Dues, logins, and stored payment methods are a different category of obligation. The demo deliberately stops at the line, and the join button is a mailto for exactly that reason.
