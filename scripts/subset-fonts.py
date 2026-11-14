"""Subset variable fonts to Latin + project punctuation: python3 scripts/subset-fonts.py."""
from pathlib import Path
import glob
from fontTools import subset
from fontTools.varLib import instancer
from fontTools.ttLib import TTFont

OUT_DIR = Path(__file__).resolve().parents[1] / 'src' / 'assets' / 'fonts'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Printable ASCII + German/Italian characters + typographic punctuation
LATIN_CHARS = (
    ''.join(chr(c) for c in range(0x20, 0x7F))
    + '©·×ÄÖÜßÀÈÉÌÒÙàäèéìòöùü–—‘’“”„…€•'
)


def make_subset(src_glob, out_name, text, wght=None):
    src = glob.glob(src_glob)[0]
    font = TTFont(src)
    if wght is not None and 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': wght})
    sub = subset.Subsetter(subset.Options(flavor='woff2', layout_features=['kern', 'liga', 'calt']))
    sub.populate(text=text)
    sub.subset(font)
    font.flavor = 'woff2'
    dest = OUT_DIR / out_name
    font.save(dest)
    print(f'{dest.name}: {dest.stat().st_size} B (from {Path(src).name})')


make_subset(
    'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght*.woff2',
    'outfit-wordmark.woff2',
    'ribisl design· ',
    wght=200,
)
make_subset(
    'node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght*.woff2',
    'gabarito-latin.woff2',
    LATIN_CHARS,
)
make_subset(
    'node_modules/@fontsource-variable/caveat/files/caveat-latin-wght*.woff2',
    'caveat-latin.woff2',
    LATIN_CHARS,
    wght=600,
)
