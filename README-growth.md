# Stats, check-in, quarterly email, deals, newsletter

Added September 2026. Each file has the full explanation at the top.

| What | Where people see it | Code |
|---|---|---|
| Listing stats | Member account page, admin Member benefits | `api/track.js`, `api/_lib/stats.js` |
| Event registration and check-in | Register button on `/events/`, admin Event check-in | `api/events.js` |
| Quarterly member email | Admin Quarterly member email | `api/digest.js` |
| Member deals | `/deals/`, member pages, `/members/deals/`, admin Member deals | `api/deals.js`, `content/deals.json` |
| New to Polk City | `/new-to-polk-city/` | `content/newcomers.json` |
| Newsletter | Footer, `/newsletter/`, admin Newsletter | `api/newsletter.js` |

## Settings in Vercel

- `CRON_SECRET`: any long random string. Vercel uses it to run the quarterly email.
- `DIGEST_AUTO=on`: only when you want the quarterly email to send by itself.
- `RESEND_API_KEY` and `MEMBER_EMAIL_FROM`: already needed for passwords. The sending domain must be verified in Resend.
- Upstash and GitHub settings: already set.

## Worth knowing

- Resend free plan: 100 emails a day, 3,000 a month.
- Subscribers and registrations live in Upstash, not git. Download both from the admin now and then.
- 10 serverless functions now. Vercel Hobby allows 12.
- The quarterly email covers the quarter before the current one. Sent by hand in September, it covers April to June.

## Luncheon guest fee

Members go straight to the club's registration. Non-members pay the guest fee through Stripe first. Set per event with "Guest fee for non-members" in the admin. Full notes at the top of `api/_lib/guestfee.js`.

- `STRIPE_SECRET_KEY`: from Stripe. Until it is set, guests are told to email the chamber.
- `STRIPE_WEBHOOK_SECRET`: add a webhook in Stripe for `checkout.session.completed` pointing at `/api/stripe`, and paste its signing secret. It covers guests who pay and close the tab.
- 11 serverless functions now. Vercel Hobby allows 12.

## Added September 29

| What | Where | Code |
|---|---|---|
| Back button works in the admin | Every admin screen has its own address after the # | `admin/app.js` |
| Monthly content audit | Emailed on the 1st, and live as "Needs attention" on the admin home | `api/_lib/audit.js`, runs inside `api/digest.js` |
| Membership dues through Stripe invoices | Admin, Membership dues | `api/_lib/dues.js`, `data/dues.js`, runs inside `api/stripe.js` |
| Message to members by category or level | Admin, Message to members | `api/newsletter.js` |
| ChamberMaster export | Admin, Member directory, "Download for ChamberMaster" | `admin/app.js` |

Still 11 serverless functions. Everything new runs inside ones that already existed.

New in Vercel:

- `AUDIT_AUTO=on` and `AUDIT_TO` (addresses, comma separated) for the monthly email
- The Stripe webhook also needs `invoice.paid`, `invoice.voided` and `invoice.marked_uncollectible` added to its events

New member fields, set in the admin: **Size, for dues** (Basic Business only) and **Dues override** (under settings). Members cannot change either from their own listing.

`LAUNCH.md` has the dated checklist to the October 29 mixer.
