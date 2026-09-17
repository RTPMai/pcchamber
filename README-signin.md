# Member sign in, header bar

Two files. Extract at the repo root and overwrite. These are built on top of
the copy you uploaded, so the hero changes you already applied are still in
them. Nothing else in the repo is touched, and the video files stay where
they are.

    build.mjs           header() gains the Sign in link, ~line 154
    assets/styles.css   .menu .signin rules, burger breakpoint 1000 -> 1100

Check it took before you push:

    grep -c signin build.mjs

Should print 12. If it prints 11 you are still on the old file.

Then:

    node build.mjs
    grep -o 'class="signin"' dist/index.html

Should print class="signin" once.
