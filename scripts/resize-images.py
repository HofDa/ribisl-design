"""Regenerate responsive WebP variants with Pillow: python3 scripts/resize-images.py."""
from pathlib import Path
from PIL import Image
import re

ROOT = Path(__file__).resolve().parents[1] / 'public'
for folder in ('pieces', 'katrin', 'swatch'):
    for source in sorted((ROOT / folder).glob('*.webp')):
        if re.search(r'-\d+w$', source.stem):
            continue
        if source.name in ('fabric-ink.webp', 'fabric-swirl.webp'):
            continue
        with Image.open(source) as image:
            for width in ((80, 160) if folder == 'swatch' else (160, 320)):
                if width >= image.width:
                    continue
                height = round(image.height * width / image.width)
                image.resize((width, height), getattr(Image, 'Resampling', Image).LANCZOS).save(
                    source.with_stem(f'{source.stem}-{width}w'), quality=82, method=6)
