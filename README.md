# Polk City Area Chamber, website demo

A working demo of a replacement for the chamber's public website. Same brand system as the Business Policy Center, same rule about plain language, same one-sentence summary before anyone has to click.

This is the front half of the platform. Dues collection, member logins, and event registration are the back half and are not in here.

---

## What it does that the current site does not

**Every member gets a real page.** `/directory/sample-community-bank/` is an actual file at an actual address, with its own title, description, and structured data. Google can index it. The current directory loads its listings with JavaScript after the page opens, which is why searching for a Polk City business plus what they do does not turn up the chamber.

**Prices are on the membership page.** Not behind an application form. Somebody deciding whether they can afford this should not have to email a stranger to find out.

**The next event is on the home page automatically.** It reads the calendar and shows the soonest one. Past events drop off by themselves on the day after. Nothing to clean up.

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

Everything else builds itself from those five files.

| File | What it does | Edit it? |
| --- | --- | --- |
| `build.mjs` | Turns the data into HTML pages | No |
| `assets/styles.css` | Colors, type, layout | Only to change the look |
| `vercel.json` | Tells Vercel how to build | No |

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

**Drop in the real logos.** The roundel in `build.mjs` is a stand-in built from the brand colours. The clean SVGs from the Policy Center repo should replace it.

**Point the Policy Center link at the live address.** `SITE.policyCenterUrl`.

**Decide about slugs.** A member's address is `/directory/their-slug/`. Once it is public and indexed, changing a slug breaks every link to it. Get them right the first time, or plan redirects.

---

## Two things worth deciding with the board, not alone

**Who owns this.** Same question as the Policy Center, and it does not get smaller as the site does more. Repository ownership, what happens if you step off the board, and how the content comes out if the chamber ever moves to a vendor.

**Where the line is between this and the back office.** This site is content, and content is safe: nothing to breach, nothing to reconcile. Dues, logins, and stored payment methods are a different category of obligation. The demo deliberately stops at the line, and the join button is a mailto for exactly that reason.
