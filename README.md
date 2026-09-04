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
| `content/*.json` | **All the content the admin edits.** Members, events, jobs, news, board, referrals. |
| `data/*.js` | Thin loaders over those JSON files, plus the documentation. Not content. |
| `data/events.js` | The event calendar. Times are local wall-clock, always. |
| `data/membership.js` | Tiers, prices, benefits. **Placeholder pricing.** |
| `data/pages.js` | About text, FAQ, and the resources sections |
| `data/site.js` | Chamber contact details, menu, the demo banner |
| `data/involved.js` | Get Involved page, the board, and the privacy policy |
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
| `tools/calendar-files.mjs` | Builds the .ics files and add-to-calendar links | No |
| `tools/needs-a-sentence.mjs` | Lists what the directory is still missing | No |
| `tools/external-links.mjs` | Sends off-site links to a new tab | No |
| `tools/board-photos.py` | Crops and resizes board headshots | Only when the board changes |

---

## Reloading the directory

The 61 members are already in. To reload from a fresh export:

1. Save the CSV as `tools/members.csv`
2. Run `node tools/import-csv.mjs`
3. Rename `data/members.generated.js` over `data/members.js`

The importer maps the 29 source categories onto the 13 the directory uses, builds slugs, tidies phone numbers and websites, and prints everything it changed.

It applies a ZIP correction only where the `data_issues` column names both the wrong value and the right one. Six were corrected on import. Knapp Properties kept its 50266 because it is genuinely in West Des Moines, which is the point of only fixing what the data itself flags.

For a paste rather than a CSV, `tools/import-directory.mjs` handles loose text.

**It does not write descriptions, and neither should anything else.** These are real businesses with real names on real pages. A plausible sentence that turns out to be wrong is worse than no sentence. All 61 summaries are empty and the listing falls back to the category and town until somebody collects the real ones.

Run `node tools/needs-a-sentence.mjs` for a working list, worst first.

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

**Collect 61 sentences.** Every summary is empty. This is a phone round, not a writing job: ask each member for one line about what they do.

**Assign tiers.** Every member is on the default, so tier sorting and the referral badge are doing nothing.

**Check the slugs before launch.** Once a page is public and indexed, changing its slug breaks every link to it.

**Put in the approved dues.** `data/membership.js` has invented numbers in it.

**Turn off the demo banner.** One line in `data/site.js`.

**Set MEMBER_PASSCODE in Vercel** or the Policy Center will refuse everyone.

**Set formEndpoint** to have the forms submit directly rather than opening an email.

**Vote on the membership structure.** `data/membership.js` has `draft: true`, which puts a red banner on the page. Turn it off after the board votes, not before.

**Get the board to agree the referral list.** `data/referrals.js` drives `/resources/who-to-call/`. The fourteen members named in it were picked off their category during the import, not chosen by anyone at the chamber, and referral exclusivity is a paid benefit. Treat the current list as a first draft.

There is deliberately no referral badge in the directory. It made a claim on a member's behalf that nobody had agreed to, and it outranked the tier badge, so a paying Premier member could show nothing while a Basic member showed a badge. The referral list lives only on the Who to call page, where the surrounding text explains what being named means.

Two categories are marked as gaps: no accountant or CPA, and no attorney. Leave them marked until somebody joins. A referral to nobody is worse than an admitted gap.

**Confirm the Trunk or Treat sign-up link** when it goes out to business emails, and add it as the event's `rsvp`.

**The job board is empty on purpose.** The demo postings were removed when the real directory went in: a made-up vacancy attached to a real named employer is not a placeholder, it is a false statement about somebody else's business. Same reason the sample member spotlight was deleted. Add real ones as they come.

**Point the Policy Center link at the live address.** `SITE.policyCenterUrl`.

**Decide about slugs.** A member's address is `/directory/their-slug/`. Once it is public and indexed, changing a slug breaks every link to it. Get them right the first time, or plan redirects.

---

## Member sign in

At `/members/`. A member signs in with their email address and a password they chose themselves.

**The chamber never sets and never sees a password.** A new member, or one who has forgotten theirs, asks for a link by email and chooses it on the page. That is the only way a password system can work without somebody at the chamber handling other people's credentials.

### Where passwords are kept, and why not in git

Hashed with scrypt, in a key-value store. Not in the repository, for two reasons and the second is the one people miss.

Git history is permanent. A hash committed today is in the history for ever, including after the member leaves. You cannot take it back out without rewriting history.

And every password change would be a commit, and every commit rebuilds the site. A member changing their own password should not deploy the chamber website.

**If the store is ever lost, nothing irreplaceable goes with it.** Members set a new password by email, the same way they set the first one. So it does not need backing up and does not carry the obligations a real member database would.

### Set these in Vercel

    MEMBER_SECRET      32 or more characters of random text. Signs sessions
                       and setup links. Changing it signs everybody out,
                       which is how you revoke everything at once.
    KV_REST_API_URL    both set for you when you add Upstash Redis from
    KV_REST_API_TOKEN  the Vercel marketplace. Free at this size.
    RESEND_API_KEY     from resend.com, for setup and reset emails
    MEMBER_EMAIL_FROM  the address those come from

Until they are set, the endpoint names the ones missing.

### The password rules, and why they are what they are

Twelve characters. That is the only rule.

No "must contain a number and a symbol". Composition rules push people towards `Passw0rd!` and towards writing it on a note by the till. Length is what actually makes a password hard to guess, and three or four unrelated words is both easy to remember and hard to attack.

Obvious passwords are refused outright, including with numbers stuck on the end, because `password1234` is the first thing anybody tries and no length rule catches it. So is the member's own business name.

### What protects it

Five wrong attempts for one address stops it for fifteen minutes, and the count expires on its own so nobody has to unlock anything. This is only possible because there is somewhere to keep a count.

An address not on the roster takes the same time and gives the same answer as a wrong password, so sign in cannot be used to work out who is a chamber member. Measured gap: about a millisecond.

Passwords are per address, not per business, so two people at the same member cannot lock each other out.

### Who can sign in

Each member can carry an `access` list of email addresses, editable in the admin. Anybody on it can hold a password for that business. Left empty, the public contact address is accepted so this works before anything is filled in.

### The thing standing in the way

**Sixteen of the 61 members have no email address at all**, including Grinnell State Bank, Home State Bank, Luana Savings Bank, Knapp Properties, P&M Apparel and Yellow Brick Road. Your treasurer's business, a board member's business, and every bank in the referral list. Until those are collected, a quarter of the membership cannot sign in.

That is why the Policy Center still accepts the shared passcode as a fallback. Once every member has an address, delete the passcode branch in `api/policy.js` and unset `MEMBER_PASSCODE`.

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

## The admin

At `/admin/`, reachable from an "Admin sign in" link at the very bottom of every page. Built so somebody with no technical background can change the site without seeing GitHub, a terminal, or a line of code.

The link is deliberately visible rather than a secret address. Hiding the door does not lock it, the passcode is the actual security, and a tool nobody can find is a tool nobody uses. The page itself is still `noindex` and disallowed in `robots.txt`, so it will not turn up in a search.

**How it works.** The admin reads and writes the JSON files in `content/` through the GitHub API. Saving makes a real commit, Vercel notices, and the site rebuilds. About a minute end to end. So there is no database, nothing new to back up, and every change has an author, a timestamp and an undo, because it is all git history.

The admin says the minute out loud. Somebody who reloads the site five seconds after saving and sees nothing will assume it failed and do it again.

### Set these in Vercel before it works

    ADMIN_PASSCODE   what you give whoever is doing the editing.
                     Different from MEMBER_PASSCODE. Do not reuse it.
    GITHUB_TOKEN     a fine-grained personal access token, scoped to
                     Contents: Read and write, on THIS repository only
    GITHUB_REPO      owner/repository
    GITHUB_BRANCH    optional, defaults to main

Until all three are set, the admin says exactly which one is missing rather than failing silently.

### If the admin says it cannot read a file

GitHub answers 404 for four completely different problems, and one of them is deliberate: a fine-grained token that has not been granted a repository gets 404 rather than 403, so that a token cannot be used to probe which private repositories exist. Good security, terrible debugging.

So the admin works out which one it actually is and tells you:

| What you see | What to do |
| --- | --- |
| Cannot see the repository | `GITHUB_REPO` is wrong, or the token does not list this repository under Repository access with Contents set to Read and write. On an organisation, an owner may still need to approve the token. |
| The token is not valid | It expired. Create a new one and update `GITHUB_TOKEN`. |
| No branch called X | Set `GITHUB_BRANCH` to the default branch it names. |
| content/... is not in them | The `content/` folder was not committed. Check `.gitignore`. |

**One useful deduction:** if `/admin/` loads at all, the build succeeded, and the build cannot succeed without `content/`. So a 404 on a deployed site almost always means the token or the repository name, not a missing file.

### The risk, plainly

That token can rewrite the site. Scope it to this one repository and never to an account, give it an expiry, and rotate it whenever the person holding the admin passcode changes. If it ever leaks, revoke it on GitHub and the problem stops immediately.

The passcode is shared, not per-person. That is why signing in asks for a name and puts it in the commit: it gives a record of who changed what. A record, not a security boundary. Anybody with the passcode could type any name.

Two edits at once are handled. Every save carries the file version it was based on, so if somebody else saved first, GitHub rejects it and the admin says so rather than quietly overwriting their work.

### Why content moved to JSON

The `data/*.js` files carry most of the explanation of how this site works. A machine writing over them would strip every comment on the first save. So the content lives in `content/*.json` and the `.js` files became thin loaders. Edit through the admin or edit the JSON directly; both end in the same place.

### Adding a field

`admin/schema.js` describes every collection. Adding a field is a line there, not a change to the interface. Add it to the matching JSON too, or existing entries show it blank.

References and web addresses are generated from the name and date when somebody adds something, because they live in the collapsed advanced section and asking a first-time user to fill in a box they cannot see is how a tool gets abandoned. They are only generated on add, never on an existing entry, since changing one after publishing breaks every link to it.

---

## Business resources

A hub at `/resources/` with a card per section and a real page behind each one, rather than every link on a single page. Sections live in `RESOURCE_GROUPS` in `data/pages.js`; adding a group adds its page and its card automatically.

Two rules worth keeping:

**Sort by the problem, not by who runs the programme.** A grant administered by the county still belongs under money. People arrive knowing what they need, not which agency provides it.

**The Policy Center appears once.** It is a single button on the hub, not an entry inside each section. Repeating it in every group made one thing look like four.

`/resources/who-to-call/` is generated from `data/referrals.js` and ends with the categories the chamber cannot fill, which doubles as the recruiting pitch for the businesses missing from membership.

**Still needed:** the link list from the current site's Business Resources page. Its content could not be read from outside, so the sections above are a curated set rather than a port. Paste the current page and anything missing goes in.

---

## Getting events into people's calendars

Every event carries four routes into a personal calendar:

- **Google** and **Outlook** links open a pre-filled event in the web calendar
- **Download (.ics)** covers Outlook desktop, Apple Calendar, and everything else
- **Subscribe** at `/events/chamber.ics` is a live feed of the whole calendar

The subscription is the one worth pushing. Add it once and future events appear on their own, including ones added months later. Adding events one at a time means coming back to the site every month, which nobody does. The events page has per-calendar instructions under "Subscribing, per calendar".

**Write times as local wall-clock and nothing else.** `start: '11:30'` means half past eleven in Polk City. Never write a UTC time in `data/events.js`.

The reason matters: Iowa is UTC-5 in October and UTC-6 in November. Converting with a fixed offset silently puts every event after the first Sunday in November an hour out. The build emits a real `America/Chicago` VTIMEZONE block and uses `TZID`, so the calendar application does the conversion and gets it right across the change. The Google and Outlook links convert to UTC using the timezone name rather than an offset, for the same reason.

Files are only generated for events still to come, so the feed does not grow forever.

---

## Forms

The join form and the event submission form always render. What changes is where they go.

With `formEndpoint` set in `data/site.js`, they POST straight to the chamber. Any service accepting a plain POST works: Formspree, Basin, Getform, Tally. Formspree's free tier covers fifty submissions a month, more than this chamber will use.

With it empty, submitting opens the person's email client with every answer already filled in and labelled. Nothing is lost and no setup is needed. If a live endpoint fails mid-submission, it falls back to the same email rather than dropping what they typed.

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

## Board photos

Eight are in. When the board changes, drop the new headshots into a folder and run:

    pip install pillow
    python3 tools/board-photos.py path/to/photos

It crops each one to a true square, resizes to 256, and writes a WebP into `assets/board/`. Then set `photo` in `data/involved.js` to the filename without its extension. Anyone without a photo shows their initial instead, which reads as intentional rather than broken.

**It crops rather than squashing,** because several headshots come in taller than they are wide and stretching one distorts the face. **It does not crop from the centre,** because in a portrait the face sits above the middle and a centred crop clips foreheads. A quarter comes off the top and the rest off the bottom, so the head keeps its room and the trim comes out of the chest.

The photos carry an empty `alt`. The person's name sits right beside the picture, so describing it again only makes a screen reader say the name twice.

---

## Off-site links

Every link to another website opens in a new tab. This is applied to the built HTML by `tools/external-links.mjs`, not remembered link by link, because a hand-applied rule gets forgotten the first time somebody adds a link in a hurry and there are over five hundred of them.

What is left alone, deliberately:

- Anything relative or on this site. Those stay in the same tab.
- `mailto:` and `tel:` links. Opening a new tab to launch someone's email client leaves them a blank tab to close.
- Off-site downloads, so they download rather than navigate.

Each off-site link gets a small arrow and a hidden phrase reading "opens in a new tab", because a tab opening without warning is disorienting for anyone using a screen reader or relying on the back button. The arrow is suppressed in the header, footer, buttons and the add-to-calendar row, where it would be noise.

The Policy Center already did this for its own source links, so it was left as it was.

---

## If you add another serverless function

Write it as an ES module. `package.json` sets `"type": "module"`, so every `.js` file in the project is ESM. A function written with `require`, `module.exports` and `__dirname` throws on every invocation, the platform returns its own plain-text error page, and the browser reports a JSON parse error that has nothing to do with the real fault. `api/policy.js` is the working pattern: `import` at the top, `export default async function handler(req, res)`.

Anything calling one of these endpoints should read the response as text before trying to parse it, for the same reason.

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
