# Starter passwords, admin loader, unlisted members

Everything changed today, in one zip. Extract at the repo root and overwrite.
Safe whether or not you already uploaded the earlier two.

    content/members.json        access lists; 4 unlisted Individuals; 3 new businesses
    data/members.js             MEMBERS is the public directory, ALL_MEMBERS is everybody
    build.mjs                   /admin/starters/; starter redirect; hides listing
                                buttons for unlisted members
    api/_lib/starters.js        new: starter loading logic
    api/admin.js                "starters" action
    api/member.js               starter sign in; tells the page if a member is listed
    api/_lib/audit.js           unlisted members not nagged for a description
    admin/schema.js             "Keep off the public directory" checkbox
    scripts/seed-starters.mjs   terminal version of the loader
    vercel.json                 admin function gets 60 seconds

Then /admin/ -> /admin/starters/ -> pick starters.csv -> Check it.
Expect 99 ready, 0 not on the roster.
