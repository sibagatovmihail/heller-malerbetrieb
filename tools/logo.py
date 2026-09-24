"""Rebuilds the business's existing logo (as listed on Gelbe Seiten) as a clean SVG.

Layout, colours and lettering follow the original 510 x 180 lockup:
terracotta panel with the painters' guild motto "KUNST BRINGT GUNST" and the
guild arms in a cartouche; cream panel with "Maler- & Lackierermeister" and
the name "Jörg Heller" in Fraktur, the J reaching over the panel edge with a
light halo. Text is converted to outlines, so the SVG renders identically
everywhere without web fonts.

Fonts (SIL OFL, fetched from Google Fonts into tools/, not committed):
UnifrakturMaguntia (name), EB Garamond (motto, subtitle).

Usage:  python3 tools/logo.py   → assets/logo.svg, assets/favicon.svg,
        and prints the inline <svg> used in index.html
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = Path(__file__).parent
ROOT = HERE.parent

TERRA = "#DDA78D"      # left panel (sampled from the original)
CREAM = "#FFECDD"      # right panel
WINE = "#56181B"       # the name
TAUPE = "#A08A82"      # subtitle
MOTTO = "#F6DED2"      # motto letters on terracotta
HALO = "#FFF4EE"


def text_path(font, text, size, x, y, track=0.0, anchor="start", scale_x=1.0):
    """Outline of `text` at baseline y; returns (d, width)."""
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    s = size / upm
    names = [cmap[ord(c)] for c in text]
    width = sum(hmtx[n][0] * s * scale_x for n in names) + track * (len(names) - 1)
    if anchor == "middle":
        x -= width / 2
    elif anchor == "end":
        x -= width
    pen = SVGPathPen(gs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    cx = x
    for n in names:
        tp = TransformPen(pen, (s * scale_x, 0, 0, -s, cx, y))
        gs[n].draw(tp)
        cx += hmtx[n][0] * s * scale_x + track
    return pen.getCommands(), width


def ink_bounds(font, text, size):
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    bp = BoundsPen(gs)
    x = 0
    for c in text:
        n = cmap[ord(c)]
        tp = TransformPen(bp, (1, 0, 0, 1, x, 0))
        gs[n].draw(tp)
        x += font["hmtx"][n][0]
    xmin, ymin, xmax, ymax = bp.bounds
    k = size / upm
    return xmin * k, ymin * k, xmax * k, ymax * k


def arms(cx, cy, k=1.0):
    """The painters' guild arms: three shields (red, silver, white) on a
    rose field, framed by a white baroque cartouche with scrolls. Drawn in a
    72 x 80 box centred on (cx, cy)."""
    return f'''<g transform="translate({cx - 36 * k:.2f} {cy - 40 * k:.2f}) scale({k})">
    <ellipse cx="37" cy="44" rx="31" ry="34" fill="#B97A63" opacity=".35" filter="url(#arms-soft)"/>
    <!-- cartouche: scrolled top, volutes at the sides, rounded foot -->
    <path fill="#FCF4F0" stroke="#D29A86" stroke-width="1.1" stroke-linejoin="round" d="
      M36 9 C31 9 27 12 24 12 C20 12 17 9 13 10 C8 11 6 16 9 19 C11 21 14 20 14 18
      C12 21 9 25 6 27 C2 30 3 36 7 36 C10 36 11 33 10 31 C12 34 12 38 11 42
      C10 47 6 49 7 54 C8 58 12 58 13 55 C15 62 21 69 28 72 C31 74 34 76 36 78
      C38 76 41 74 44 72 C51 69 57 62 59 55 C60 58 64 58 65 54 C66 49 62 47 61 42
      C60 38 60 34 62 31 C61 33 62 36 65 36 C69 36 70 30 66 27 C63 25 60 21 58 18
      C58 20 61 21 63 19 C66 16 64 11 59 10 C55 9 52 12 48 12 C45 12 41 9 36 9 Z"/>
    <!-- crest: two small scrolls with a band between -->
    <path fill="#F3D5CA" stroke="#B85A4E" stroke-width=".9" d="M25 12 C24 6 28 2 32 4 C34 5 34 8 32 9 C31 7 29 7 28 9 C27 10 27 12 28 13 Z"/>
    <path fill="#F3D5CA" stroke="#B85A4E" stroke-width=".9" d="M47 12 C48 6 44 2 40 4 C38 5 38 8 40 9 C41 7 43 7 44 9 C45 10 45 12 44 13 Z"/>
    <path fill="#E7B3A4" stroke="#B85A4E" stroke-width=".8" d="M30 10 C33 8 39 8 42 10 L41 13 C38 12 34 12 31 13 Z"/>
    <!-- the field -->
    <path fill="#EFC9BC" stroke="#C47E6C" stroke-width=".9" d="M17 20 H55 V44 C55 56 46 64 36 69 C26 64 17 56 17 44 Z"/>
    <path fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".8" d="M19.5 22.5 H52.5 V44 C52.5 54.5 44.5 61.5 36 66"/>
    <!-- three shields, two over one -->
    <path fill="#C4574D" stroke="#9E3F37" stroke-width=".8" d="M21.5 25 H33.5 V31.5 C33.5 36 30.5 39 27.5 40.5 C24.5 39 21.5 36 21.5 31.5 Z"/>
    <path fill="#FBEAE3" stroke="#C47E6C" stroke-width=".8" d="M38.5 25 H50.5 V31.5 C50.5 36 47.5 39 44.5 40.5 C41.5 39 38.5 36 38.5 31.5 Z"/>
    <path fill="#FFFFFF" stroke="#C47E6C" stroke-width=".8" d="M30 43 H42 V49.5 C42 54 39 57 36 58.5 C33 57 30 54 30 49.5 Z"/>
    <path fill="#FFFFFF" opacity=".55" d="M23 26.5 H27 V31 C26 33 24.5 34 23 34.5 Z"/>
  </g>'''


def build():
    frak = TTFont(HERE / "unifraktur.ttf")
    gara = TTFont(HERE / "ebgaramond.ttf")

    W, H = 510, 180
    split = 172

    # name: cap height and ink extent measured on the original —
    # H from y 80 to the baseline at 125, ink from x 134 to 485
    name = "Jörg Heller"
    cap = ink_bounds(frak, "H", 1000)[3] / 1000          # cap height per unit size
    size = 45 / cap
    x0, _, x1, _ = ink_bounds(frak, name, size)
    sx = (485 - 134) / (x1 - x0)
    name_d, _ = text_path(frak, name, size, 134 - x0 * sx, 125, scale_x=sx)

    # subtitle: a wide, light serif on the original — spans x 222 to 485
    sub = "Maler-& Lackierermeister"
    sub_size = 20.5
    _, _, sw, _ = ink_bounds(gara, sub, sub_size)
    sub_d, _ = text_path(gara, sub, sub_size, 485, 65, track=.25, anchor="end", scale_x=(263 - .25 * 23) / sw)
    # motto: condensed caps, x 9 to 116
    m1, _ = text_path(gara, "KUNST BRINGT", 14.5, 64.5, 42, anchor="middle", scale_x=.9)
    m2, _ = text_path(gara, "GUNST", 14.5, 64.5, 59, anchor="middle", scale_x=.9)

    body = f'''<defs>
    <filter id="arms-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="name-shade" x="-5%" y="-10%" width="110%" height="130%"><feDropShadow dx=".6" dy="1" stdDeviation=".6" flood-color="#3A0E10" flood-opacity=".35"/></filter>
  </defs>
  <rect width="{W}" height="{H}" fill="{CREAM}"/>
  <rect width="{split}" height="{H}" fill="{TERRA}"/>
  <path fill="{MOTTO}" d="{m1} {m2}"/>
  {arms(65, 110, 1.1)}
  <path fill="{TAUPE}" d="{sub_d}"/>
  <path fill="{HALO}" stroke="{HALO}" stroke-width="4.5" stroke-linejoin="round" d="{name_d}"/>
  <path fill="{WINE}" stroke="{WINE}" stroke-width=".6" stroke-linejoin="round" filter="url(#name-shade)" d="{name_d}"/>'''

    logo = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
            f'aria-label="Jörg Heller, Maler- und Lackierermeister. Kunst bringt Gunst">\n  {body}\n</svg>\n')
    (ROOT / "assets" / "logo.svg").write_text(logo)

    fav = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs><filter id="arms-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>
  <rect width="96" height="96" rx="20" fill="{TERRA}"/>
  {arms(48, 49, 1.08)}
</svg>
'''
    (ROOT / "assets" / "favicon.svg").write_text(fav)
    print("logo.svg", len(logo), "bytes; name size %.1f" % size)


if __name__ == "__main__":
    build()
