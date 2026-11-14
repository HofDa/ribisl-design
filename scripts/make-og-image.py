"""Generate a 1200x630 OpenGraph preview card: python3 scripts/make-og-image.py."""
from io import BytesIO
from pathlib import Path
import glob
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'og-image.jpg'

W, H = 1200, 630
MUSTARD = '#F7AB28'
TAG = '#FBF9F4'
INK = '#1E181A'
RED = '#C4122F'


def load_font(src_glob, wght, size):
    font = TTFont(glob.glob(str(ROOT / src_glob))[0])
    if 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': wght})
    font.flavor = None
    buf = BytesIO()
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def draw_dashed_rect(draw, box, color, width=2, dash=12, gap=9):
    x0, y0, x1, y1 = box
    for a, b in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = max(1, (dx * dx + dy * dy) ** 0.5)
        ux, uy = dx / length, dy / length
        pos = 0
        while pos < length:
            end = min(length, pos + dash)
            draw.line((a[0] + ux * pos, a[1] + uy * pos, a[0] + ux * end, a[1] + uy * end), fill=color, width=width)
            pos += dash + gap


def draw_smiley(draw, cx, cy, size):
    s = size / 100.0
    lw = max(4, round(9 * s))
    for off_x, off_y, col in ((4 * s, 3.5 * s, RED), (0, 0, INK)):
        x = cx - 50 * s + off_x
        y = cy - 50 * s + off_y
        draw.line((x + 42 * s, y + 15 * s, x + 42 * s, y + 48 * s), fill=col, width=lw)
        draw.line((x + 59 * s, y + 15 * s, x + 59 * s, y + 48 * s), fill=col, width=lw)
        draw.arc((x + 19 * s, y + 12 * s, x + 81 * s, y + 74 * s), start=0, end=180, fill=col, width=lw)


img = Image.new('RGB', (W, H), MUSTARD)

# Subtle denim/linen cloth texture overlay from yellow.webp tile
tile = Image.open(ROOT / 'public' / 'fabric' / 'yellow.webp').convert('RGB').resize((600, 600), Image.LANCZOS)
for tx in range(0, W, tile.width):
    for ty in range(0, H, tile.height):
        img.paste(tile, (tx, ty))

# Cotton patch card on the left with drop shadow and dashed stitching
card_box = (66, 66, 770, 564)
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rectangle((card_box[0] + 10, card_box[1] + 14, card_box[2] + 10, card_box[3] + 14), fill=(30, 24, 26, 48))
img = Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB')

draw = ImageDraw.Draw(img)
draw.rectangle(card_box, fill=TAG)
draw_dashed_rect(draw, (card_box[0] + 16, card_box[1] + 16, card_box[2] - 16, card_box[3] - 16), RED, width=2, dash=12, gap=10)

# Fonts
f_mark = load_font('node_modules/@fontsource-variable/outfit/files/outfit-latin-wght*.woff2', 200, 112)
f_tag = load_font('node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght*.woff2', 700, 42)
f_sub = load_font('node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght*.woff2', 480, 28)
f_pill = load_font('node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght*.woff2', 650, 22)

# Pill tag
pill = (112, 110, 412, 152)
draw.rectangle(pill, fill=MUSTARD)
draw_dashed_rect(draw, (pill[0] + 4, pill[1] + 4, pill[2] - 4, pill[3] - 4), INK, width=1, dash=6, gap=5)
draw.text((126, 118), 'BOZEN · SÜDTIROL · ITALIA', font=f_pill, fill=INK)

# Wordmark & copy
draw.text((110, 194), 'ribisl design', font=f_mark, fill=INK)
draw.text((112, 344), 'Upcycling & Redesign.', font=f_tag, fill=RED)
draw.text((112, 410), 'Westen, Taschen, Wendehüte & Kurse', font=f_sub, fill=INK)
draw.text((112, 450), 'Handgemachte Einzelstücke · @ribisl_design', font=f_sub, fill='#4B4043')

# Smiley tag badge in corner of cotton card
draw_smiley(draw, 696, 142, 72)

# Reversible swirl bucket hat on the right
hat = Image.open(ROOT / 'public' / 'pieces' / 'hat-swirl-cut.webp').convert('RGBA')
hat.thumbnail((395, 395), Image.LANCZOS)
img.paste(hat, (782, round((H - hat.height) / 2) + 10), hat)

img.save(OUT, 'JPEG', quality=80, optimize=True, progressive=True)
print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size} B ({W}x{H})')
