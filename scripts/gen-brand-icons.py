#!/usr/bin/env python3
"""
gen-brand-icons.py: draw the Vanta mark from geometry and write every surface.

WHY THIS EXISTS
---------------
The mark is two white capsules leaning slightly apart on black. It used to be a
prism, and the icons were built from a PNG of that prism, so changing the brand
meant redrawing a master and re-running a script that only knew about Android.
This one owns the whole set: browser tab, Home Screen icon, PWA manifest icons,
the marketing-site favicon and nav mark, and the Android launcher (legacy tiles,
adaptive foreground, round tile).

The figure is defined once, as ratios of the mark's overall width, measured on
the reference (944px canvas, mark 348x209, capsules 7.4 degrees apart). Every
output is the same drawing at a different size, so no surface can drift.

Outputs
-------
  web/public/assets/icon-{512,192,180}.png        black tile, mark at 62.5%
  landing/public/vanta-logo.png                    favicon + apple-touch
  landing/src/assets/vanta-logo.png                nav mark, transparent, cropped
  android/.../mipmap-*/ic_launcher_foreground.png  adaptive foreground, safe circle
  android/.../mipmap-*/ic_launcher.webp            legacy square tile
  android/.../mipmap-*/ic_launcher_round.webp      legacy circle

The adaptive foreground is white-on-transparent and sits inside Android's 66dp
safe circle (the mark's diagonal is about 62dp), because the launcher mask and
the splash icon both crop anything nearer the corners. The monochrome layer
reuses the same file and tints its alpha silhouette, so it stays flat white art.

Run:  python3 scripts/gen-brand-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web/public/assets'
LANDING = ROOT / 'landing'
RES = ROOT / 'android/app/src/main/res'

SS = 4  # supersample factor: every curve is drawn 4x and resampled down
ANGLE = 7.4
# Measured on the reference, as ratios of the mark's overall width.
L_RATIO = 0.569        # capsule length
T_RATIO = 0.294        # capsule thickness
SPACING_RATIO = 0.635  # centre-to-centre distance
GLOW_RATIO = 0.06      # halo blur radius
BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)


def capsule(length, thickness, angle):
    layer = Image.new('L', (length * 2, length * 2), 0)
    x0 = (layer.width - thickness) / 2
    y0 = (layer.height - length) / 2
    ImageDraw.Draw(layer).rounded_rectangle(
        (x0, y0, x0 + thickness, y0 + length),
        radius=thickness / 2,
        fill=255,
    )
    return layer.rotate(angle, resample=Image.BICUBIC)


def draw_mark(canvas_px, mark_width_px, background, glow=True):
    """Render the two capsules centred on a square of `canvas_px`."""
    size = canvas_px * SS
    mark_w = mark_width_px * SS
    length = int(mark_w * L_RATIO)
    thickness = int(mark_w * T_RATIO)
    spacing = mark_w * SPACING_RATIO

    ink = Image.new('L', (size, size), 0)
    # The capsules lean towards each other at the bottom.
    for direction, angle in ((-1, -ANGLE), (1, ANGLE)):
        shape = capsule(length, thickness, angle)
        cx = size / 2 + direction * spacing / 2
        ink.paste(shape, (int(cx - shape.width / 2), int((size - shape.height) / 2)), shape)

    layer = Image.new('RGBA', (size, size), background)
    if glow:
        halo = ink.filter(ImageFilter.GaussianBlur(max(1, int(mark_w * GLOW_RATIO))))
        layer.paste(WHITE, (0, 0), halo.point(lambda a: int(a * 0.45)))
    layer.paste(WHITE, (0, 0), ink)
    return layer.resize((canvas_px, canvas_px), Image.LANCZOS)


def write(path, image):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    print('wrote', path.relative_to(ROOT))


def main():
    for px in (512, 192, 180):
        write(WEB / f'icon-{px}.png', draw_mark(px, round(px * 0.625), BLACK))

    # Same mark, different surfaces: favicon carries the black tile because a
    # transparent white mark disappears in a light tab bar.
    write(LANDING / 'public/vanta-logo.png', draw_mark(512, 330, BLACK))
    nav = draw_mark(640, 560, (0, 0, 0, 0))
    write(LANDING / 'src/assets/vanta-logo.png', nav.crop(nav.getbbox()))

    for folder, scale in (('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)):
        # 108dp adaptive canvas. The mark is 52.9dp wide, about 62dp on the
        # diagonal, inside the 66dp safe circle of every launcher mask.
        canvas = round(108 * scale)
        write(
            RES / f'mipmap-{folder}/ic_launcher_foreground.png',
            draw_mark(canvas, round(canvas * 0.49), (0, 0, 0, 0), glow=False),
        )

        tile_px = round(48 * scale)
        tile = draw_mark(tile_px, round(tile_px * 0.625), BLACK)
        for name, mask in (
            ('ic_launcher.webp', Image.new('L', (tile_px, tile_px), 0)),
            ('ic_launcher_round.webp', Image.new('L', (tile_px, tile_px), 0)),
        ):
            draw = ImageDraw.Draw(mask)
            if name.endswith('round.webp'):
                draw.ellipse((0, 0, tile_px - 1, tile_px - 1), fill=255)
            else:
                draw.rounded_rectangle(
                    (0, 0, tile_px - 1, tile_px - 1), radius=round(tile_px * 0.22), fill=255
                )
            legacy = tile.copy()
            legacy.putalpha(mask)
            legacy.save(RES / f'mipmap-{folder}/{name}', format='WEBP', lossless=True, quality=100)
            print(f'wrote mipmap-{folder}/{name}')


if __name__ == '__main__':
    main()
