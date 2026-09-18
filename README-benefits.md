# Benefits tracker

Admin logs what members use. Members see what they have and what is left.

## Where things live

- `data/benefits.js` is the allowance for each level, as numbers. Change a benefit on the membership page (`data/membership.js`) and change it here too.
- `content/benefits.json` is the log. One entry per use, saved as its own commit with the name of whoever logged it.
- Admin: **Member benefits** card at `/admin/`. Overview sorted least used first, a page per member to log and remove uses, and two CSV downloads.
- Members: **Your benefits** on `/members/` once signed in. Read live from GitHub, so a logged use shows up right away with no rebuild.

## Kinds of benefit

- **count**: a number per year (luncheon tickets, spotlights)
- **dollars**: a dollar amount per year (sponsorship credit)
- **once**: done or not done this year (plaque, window cling)
- **open**: no limit, logged so you can see it is being used (ribbon cuttings, notary)

Counts reset each membership year. January by default; change `YEAR_STARTS_MONTH` in `data/benefits.js` if dues move to a fiscal year.

## Worth knowing

- Allowances follow the member's current level. Upgrade someone mid-year and they get the bigger allowance with what they already used counted against it.
- Notes on an entry are visible to the member. Write them for the member.
- Each log is a commit, so each one kicks off a rebuild. Harmless, just noise in the Vercel deploy list.
- Needs the same `GITHUB_REPO` and `GITHUB_TOKEN` the admin already uses. Nothing new to set in Vercel.

## Levels changed

`content/members.json` now uses the six approved levels: `individual`, `basic`, `partner`, `investor`, `sponsor`, `champion`. The old `pro` and `premier` are gone. The directory badge shows for Community Partner and up. The build fails with the member's name if anyone is on a level that does not exist.
