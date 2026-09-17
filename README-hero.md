# Hero video drop-in

Extract this at the root of the pcchamber repo and let it overwrite. The
paths already match, so nothing needs moving.

    build.mjs                              overwrite (hero markup, ~line 255)
    assets/styles.css                      overwrite (hero block)
    assets/media/chamber-hero.mp4          new, 3.9 MB, 1920x800, no audio
    assets/media/chamber-hero-mobile.mp4   new, 2.0 MB, 1280 wide, no audio
    assets/media/chamber-hero-poster.jpg   new, first frame, poster and
                                           reduced-motion still

Then:

    node build.mjs

Should report 80 pages and 95 inline scripts parsing. Commit and push.

## What changed

build.mjs, in the homepage body template: the hero section lost its .wrap
div and became two columns. Left is a navy panel holding the mark, the white
wordmark, and the existing h1 and paragraph. Right is the video. The copy
itself is unchanged.

assets/styles.css, the Hero block: 50/50 grid. The panel's left padding is
max(24px, calc((100vw - 1080px) / 2 + 24px)) so the headline stays lined up
with .wrap on every section below. Under 860px it stacks, copy first, video
at 230px tall. A prefers-reduced-motion rule hides the video and paints the
poster as a background instead.

The asset copy step already handles this. build.mjs ends with
cp('assets', dist/assets, { recursive: true }) and does not filter by
extension, so assets/media lands in dist/assets/media on its own.

## Notes

Both videos are silent. Browsers will not autoplay anything with sound, and
the muted plus playsinline pair is what makes it work on iOS. Do not drop
either attribute.

The poster path appears twice in styles.css, once on the video element in
build.mjs and once in the reduced-motion rule. Keep them in sync if you
rename it.

The source footage is 2.4:1 and the video column is half the page, so the
crop is tighter than the raw clip. The aerials hold up. The interior shots
lose more off the sides.
