# Starter passwords, loaded from the admin

Six files. Extract at the repo root and overwrite. content/members.json is
not in here; the one you already pushed is right.

    api/_lib/starters.js        new: the loading logic, shared by both ways in
    api/admin.js                new "starters" action, admin sign in required
    api/member.js               takes starterKey from the shared file
    build.mjs                   builds /admin/starters/
    scripts/seed-starters.mjs   terminal version, same logic
    vercel.json                 gives the admin function 60 seconds

Once deployed:

1. Sign in at /admin/ with the admin passcode.
2. Go to /admin/starters/ and pick starters.csv. "Check it" writes nothing.
   Expect 88 ready and 11 not on the roster.
3. Press Load. Then delete starters.csv from your computer.

Check it took:

    api/_lib/starters.js exists, and /admin/starters/ loads after deploy.
