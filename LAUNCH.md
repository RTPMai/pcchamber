# Launch: working back from the October 29 mixer

Status as of September 29, from the repo itself. The admin home screen now shows the same "Needs attention" list live, so most of this can be ticked off there and watched clear.

## Where things stand

| | Now | Needed for launch |
|---|---|---|
| Descriptions | 1 of 61 | Most of them. A directory of blank cards is the first thing people see. |
| Emails on file | 46 of 61 | All paying members. 15 missing, including 7 upper-tier members worth $12,000 in dues: Grinnell State Bank, Home State Bank, Knapp Properties, Luana Savings Bank, Nova Med Spa, Polk County Board of Supervisors, Snyder & Associates. |
| Levels set | 10 above Basic, 51 Basic | Check the 51 are really Basic |
| Basic sizes set | 0 of 51 | All 51, or they cannot be invoiced |
| Demo banner | On | Off (`data/site.js`) |
| Calendar | Ends Oct 29 | November and December added before the mixer |
| Trunk or Treat (Oct 25) | No sign-up link | Link added as its `rsvp` |
| Papa's spelling, AMP'D entry | Done | |

## This week (Sep 29 to Oct 3)

- [ ] Deploy this update
- [ ] Vercel: `AUDIT_AUTO=on`, `AUDIT_TO` = whoever should get the monthly check
- [ ] Stripe account opened **in the chamber's name, owned by the treasurer**, not a board member's personal login. Put in `STRIPE_SECRET_KEY` (test key first)
- [ ] Stripe webhook at `https://pcchamber.vercel.app/api/stripe` for `checkout.session.completed`, `invoice.paid`, `invoice.voided`, `invoice.marked_uncollectible`. Signing secret into `STRIPE_WEBHOOK_SECRET`
- [ ] Resend: add polkcitychamber.com as a sending domain and put its DNS records in at GoDaddy **now**. This does not need the cutover and it is what makes every email land in inboxes
- [ ] Board, in the minutes: the upgraded tier for P&M in place of a fee (a board member receiving something of value; vote it, Ryan abstains)
- [ ] Board: who owns the repository and the named successor (from the board memo, still open)
- [ ] Board: approve the referral list (`/resources/who-to-call/`)

## Phone round (Oct 5 to 16)

One call per member gets all three at once: a sentence about what they do, the email for invoices and sign in, and headcount for Basic members.

- [ ] The 7 upper-tier members with no email first
- [ ] The other 8 with no email
- [ ] 51 Basic sizes
- [ ] 60 descriptions (members can also write their own once they can sign in)
- [ ] Trunk or Treat sign-up link
- [ ] November and December events on the calendar

## Before the cutover (Oct 12 to 19)

- [ ] Oct 14 luncheon: run the guest fee with the test key the week before, then switch to the live key and let a real guest pay $10. Check they land on the check-in list
- [ ] Send yourself a test member message and a test newsletter
- [ ] Turn off the demo banner, set `formEndpoint`, confirm `MEMBER_PASSCODE`
- [ ] Delete `DEMO_MEMBER` and `DEMO_MEMBER_ALLOW_PRODUCTION` from Vercel, redeploy

## Cutover (Tue Oct 20, not the week of the mixer)

- [ ] Two days before: lower the TTL on the GoDaddy records to 600 seconds
- [ ] Add polkcitychamber.com and www in Vercel, then change only the website records at GoDaddy (A to Vercel's address, www CNAME to `cname.vercel-dns.com`)
- [ ] **Leave MX and any email records alone.** Moving the website must not move the chamber's email
- [ ] Update the Stripe webhook address to `https://polkcitychamber.com/api/stripe`
- [ ] Open `/setup/` on the live domain. Everything green
- [ ] Old addresses: click through a few from Google results and check they redirect

## Mixer week (Oct 26 to 29)

- [ ] Admin home: nothing under "Fix soon"
- [ ] Oct 29: unveil the site and the membership levels

## After (November and December)

- [ ] First newsletter. Consider importing the MailChimp list once, since those people already agreed to hear from the chamber
- [ ] 2027 dues: Membership dues screen, year 2027, send. Mid-November gives a month and a half before January
- [ ] Ask GrowthZone support for their current `std_import.xls` and what they charge per import. Compare it to the "Download for ChamberMaster" file before sending anything
- [ ] Before the December renewals: cancel GoDaddy **website hosting only** (keep the domain registration and email), close Square once Stripe has handled a full month, export MailChimp then cancel
