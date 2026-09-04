#!/usr/bin/env python3
"""
Prepares board portraits for the Get Involved page.

    pip install pillow
    python3 tools/board-photos.py path/to/photos

Takes any square-ish portrait, crops it to a true square, resizes to 256
and writes a WebP into assets/board/.

WHY IT CROPS RATHER THAN SQUASHES
Several of the originals are taller than they are wide. Forcing those into
a square by stretching distorts the face. Cropping keeps the proportions.

WHY IT DOES NOT CROP FROM THE CENTRE
In a portrait the face sits above the middle. A centred crop on a tall
image takes the same amount off the top as the bottom and clips foreheads.
This takes a quarter off the top and the rest off the bottom, so the head
keeps its room and the trim comes out of the chest.

The name of the file becomes the name in the data, so shawn.webp maps to
the board member whose photo field is 'shawn'.
"""

import os
import sys
from PIL import Image

SIZE = 256
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'board')


def square(im):
    w, h = im.size
    side = min(w, h)

    if h > w:
        top = int((h - side) * 0.25)   # head room kept, chest trimmed
        box = (0, top, side, top + side)
    else:
        left = (w - side) // 2
        box = (left, 0, left + side, side)

    return im.crop(box)


def main(src):
    os.makedirs(OUT, exist_ok=True)
    files = sorted(f for f in os.listdir(src) if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')))
    if not files:
        print(f'No images found in {src}')
        return

    for f in files:
        im = Image.open(os.path.join(src, f)).convert('RGB')
        before = im.size
        out = square(im).resize((SIZE, SIZE), Image.LANCZOS)

        name = os.path.splitext(f)[0].lower() + '.webp'
        path = os.path.join(OUT, name)
        out.save(path, 'WEBP', quality=82, method=6)

        note = '' if before[0] == before[1] else f'  (cropped from {before[0]}x{before[1]})'
        print(f'  assets/board/{name}  {os.path.getsize(path) // 1024}KB{note}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
