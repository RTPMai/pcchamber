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
| `data/referrals.js` | Who the chamber points people at, by situation. Shared with the Policy Center. |

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

**Fill in the real referrals.** `data/referrals.js` drives the Who to call block and the referral badges. Two categories are honestly marked as gaps: no accountant or CPA, and no attorney. Leave them marked until somebody joins. A referral to nobody is worse than an admitted gap.

**Empty the job board and the news list, or fill them.** The three jobs and three posts in there are examples. A job board with fake postings is worse than an empty one.

**Drop in the real logos.** The roundel in `build.mjs` is a stand-in built from the brand colours. The clean SVGs from the Policy Center repo should replace it.

**Point the Policy Center link at the live address.** `SITE.policyCenterUrl`.

**Decide about slugs.** A member's address is `/directory/their-slug/`. Once it is public and indexed, changing a slug breaks every link to it. Get them right the first time, or plan redirects.

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
