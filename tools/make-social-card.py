#!/usr/bin/env python3
"""
Makes the social share card and the favicons.

You do not need to run this. The finished images are committed in assets/.
Run it only if the wording, the colours, or the logo change.

    pip install pillow
    python3 tools/make-social-card.py

It needs the two brand fonts in tools/fonts/. Both are free from Google Fonts:
    Fraunces      https://fonts.google.com/specimen/Fraunces
    Public Sans   https://fonts.google.com/specimen/Public+Sans
Download the variable .ttf of each and save them as fraunces.ttf and
publicsans.ttf.
"""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
OUT = os.path.join(HERE, "..", "assets")

NAVY   = (0, 39, 52)
SUN    = (241, 156, 48)
AUTUMN = (163, 100, 55)
SPRING = (131, 142, 82)
WINTER = (104, 161, 184)
MUTED  = (170, 195, 205)

TITLE = "Polk City Area Chamber of Commerce"
SUB   = "The business network for Polk City, Alleman, Elkhart and Sheldahl."

W, H = 1200, 630


def fraunces(size, weight=600, opsz=None):
    f = ImageFont.truetype(os.path.join(FONTS, "fraunces.ttf"), size)
    f.set_variation_by_axes([opsz or min(144, size), weight, 100, 0])
    return f


def public_sans(size, weight=500):
    f = ImageFont.truetype(os.path.join(FONTS, "publicsans.ttf"), size)
    f.set_variation_by_axes([weight])
    return f


def roundel(size):
    """The four seasons mark. Drawn at 4x and shrunk so the edges are clean."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, s, s], fill=NAVY)

    inset = s * 0.06
    box = [inset, inset, s - inset, s - inset]
    for start, colour in ((270, SUN), (0, AUTUMN), (90, WINTER), (180, SPRING)):
        d.pieslice(box, start, start + 90, fill=colour)

    hole = s * 0.34
    d.ellipse([(s - hole) / 2, (s - hole) / 2, (s + hole) / 2, (s + hole) / 2], fill=NAVY)
    return img.resize((size, size), Image.LANCZOS)


def wrap(draw, text, font, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        test = (line + " " + w).strip()
        if draw.textlength(test, font=font) <= width:
            line = test
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def social_card():
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)

    pad = 78
    mark = roundel(104)
    img.paste(mark, (pad, pad), mark)

    title_font = fraunces(74, weight=600, opsz=144)
    sub_font = public_sans(29, weight=400)

    y = pad + 104 + 54
    for line in wrap(d, TITLE, title_font, W - pad * 2):
        d.text((pad, y), line, font=title_font, fill=(255, 255, 255))
        y += 84

    y += 16
    for line in wrap(d, SUB, sub_font, W - pad * 2 - 60):
        d.text((pad, y), line, font=sub_font, fill=MUTED)
        y += 40

    # The four seasons across the foot, in the order they run.
    bar = 16
    for i, colour in enumerate((SPRING, SUN, AUTUMN, WINTER)):
        d.rectangle([i * W / 4, H - bar, (i + 1) * W / 4, H], fill=colour)

    img.save(os.path.join(OUT, "social-card.png"), optimize=True)
    print("assets/social-card.png")


def icons():
    for size, name in ((180, "apple-touch-icon.png"), (32, "favicon-32.png")):
        roundel(size).save(os.path.join(OUT, name), optimize=True)
        print(f"assets/{name}")

    # A real .ico so old browsers and Windows pinning behave.
    roundel(64).save(os.path.join(OUT, "favicon.ico"),
                     sizes=[(16, 16), (32, 32), (48, 48)])
    print("assets/favicon.ico")


if __name__ == "__main__":
    social_card()
    icons()
