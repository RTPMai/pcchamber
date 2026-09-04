# Website and member platform: what to do

Prepared for the board of the Polk City Area Chamber of Commerce.

---

## The decision in one paragraph

The chamber needs a member database, dues billing, event registration, and a website. Buying all four from ChamberMaster or a competitor costs somewhere in the low thousands per year. Building the website ourselves and buying only the payment piece costs a few hundred. The build is already most of the way done and can be seen working. The question in front of the board is not whether it can be built. It is whether the chamber wants a system it maintains itself.

---

## What each option costs

| | Buy a platform | Build the site, buy the payments |
| --- | --- | --- |
| Software | Roughly $4,000 to $10,000 a year | Hosting is free at our size |
| Setup | Reported at $1,500 for onboarding, plus about $3,500 if the website is included | Already built |
| Payments | Included | Stripe takes roughly 2.9% plus 30 cents per transaction |
| Who fixes it | The vendor | Us |
| Who answers the phone at 9pm | The vendor | Us |

**A caveat on those figures.** ChamberMaster and GrowthZone do not publish prices. The numbers above come from competitors who sell against them and from chamber budgets that are public. They are a reasonable anchor, not a quote. The one solid fact is that the price is quote-only and gated behind a demo request. If the board wants a real number, someone has to sit through the demo.

**The question to answer before comparing anything.** What share of annual chamber revenue is $5,000? For an organisation this size that may be a large fraction of the budget, or it may be recoverable in a single year through automated renewals that stop memberships lapsing quietly. Either answer is defensible. Guessing is not.

---

## What is already built

A working website demo exists and can be viewed on a phone during the meeting. It has:

- A member directory where every business gets its own page at its own address
- Events, membership tiers with prices shown, business resources, and a Get Involved page
- Redirects from every address on the current site, so nothing that is bookmarked or indexed breaks
- The chamber's brand, matching the Business Policy Center

It does **not** have logins, dues collection, or stored payment details. That is deliberate, and it is where the two options genuinely diverge.

---

## The honest case for buying

**Somebody to call.** Part of what the price buys is a support line when dues will not process the week they are due. That has real value when the chamber has no full-time staff.

**Benefit tracking that the proposed tier structure needs.** Consumable luncheon tickets, sponsorship credits, spotlight counts. Something has to track all of it. Right now that something is a person with a spreadsheet, and the new tier structure makes the spreadsheet worse.

**It survives a board turnover.** A vendor does not resign.

**The Administrative Director seat is currently empty.** Choosing a system before knowing who will operate it daily is how organisations end up with software nobody uses.

## The honest case for building

**The cost gap is ten to twenty times, and it is real.**

**Search visibility.** The current directory is drawn by JavaScript after the page loads, which means search engines never see a single member listing. A member searching for a local supplier does not find us, and neither does a customer looking for a member. The demo fixes this by generating real pages. A template directory from a vendor may or may not.

**We can already do it.** The Business Policy Center is live proof for the public half, and Apparelytics is proof for the back office half.

**No export problem.** Content lives in plain text files the chamber owns outright.

---

## The risk the board should discuss out loud

If we build it, one volunteer board member becomes the chamber's software vendor. Unpaid does not make that go away. It is a dependency on a person, and it lasts as long as the chamber uses the system, not as long as the project takes.

Three things should be written down before any building continues:

1. **Who owns the repository.** Not who has access. Who owns it.
2. **What happens if that person steps off the board.** A named successor, or a stated plan to move to a vendor.
3. **What the export path is.** Same question the board should ask a ChamberMaster salesperson, and it should be answerable for our own build too.

---

## What is recommended

**Split the decision. Do not make one call about four different things.**

1. **Approve the website now.** It is content. There is nothing to breach, no money to reconcile, and it directly fixes a search visibility problem that costs members business today. Low risk, already built.

2. **Buy the payment rail, do not build it.** Stripe Checkout, or a small membership platform. Taking dues means failed cards, refunds, and reconciliation with the treasurer's books. That is where a weekend project turns into a permanent obligation, and it is the right thing to pay a vendor for.

3. **Wait on the member database until the Administrative Director seat is filled.** Whoever sits in that chair will live in that system daily and should have a say in choosing it.

4. **Get the three continuity questions answered in writing** before any further building happens.

---

## What the board is being asked to decide today

- Approve the new website going live, subject to content sign-off
- Agree the dues figures that appear on the membership page
- Decide who owns the repository and what happens if that person leaves
- Decide whether to request a real ChamberMaster quote for comparison

*Everything else can wait for the next meeting.*
