# Starter passwords

Four files. Extract at the repo root and overwrite.

    content/members.json        access lists for all 61 members (88 addresses)
    api/member.js               starter sign in, forced change, cleanup on remove
    build.mjs                   sign in redirects to the change page; wording; team tag
    scripts/seed-starters.mjs   loads the starters into Upstash

Push first so the new sign in code is live, then load the starters from
your machine:

    vercel env pull .env.local
    node --env-file=.env.local scripts/seed-starters.mjs starters.csv
    node --env-file=.env.local scripts/seed-starters.mjs starters.csv --write

The first run is a dry run. Expect 88 seeded and 11 "not on the roster"
(the seven businesses that are not in the directory yet).

Then delete starters.csv. Do not commit it. Starters expire in 14 days.

Check it took:

    grep -c starterKey api/member.js      should print 6
