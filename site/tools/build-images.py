"""Turns the raw store screenshots into the site's WebP images.

Reads docs/store-screenshots/raw/{tr,en}/0N-*.png (1320x2868, unframed) and writes
site/img/{tr,en}/0N-{360,540,720}.webp. Run from the repo root with Pillow:
    python3 site/tools/build-images.py
"""
import glob
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'store-screenshots', 'raw')
OUT = os.path.join(ROOT, 'site', 'img')
WIDTHS = (360, 540, 720)

for lang in ('tr', 'en'):
    os.makedirs(os.path.join(OUT, lang), exist_ok=True)
    for path in sorted(glob.glob(os.path.join(SRC, lang, '0[1-8]-*.png'))):
        number = os.path.basename(path)[:2]
        image = Image.open(path).convert('RGB')
        for width in WIDTHS:
            height = round(image.height * width / image.width)
            target = os.path.join(OUT, lang, f'{number}-{width}.webp')
            image.resize((width, height), Image.LANCZOS).save(target, 'WEBP', quality=80, method=6)
            print(target, os.path.getsize(target) // 1024, 'KB')
