"""Framed store screenshots from raw/{tr,en}: headline + subline over the brand canvas.

Run: pip install pillow && python3 docs/store-screenshots/frame.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT = ROOT + "/node_modules/@expo-google-fonts/plus-jakarta-sans/{0}/PlusJakartaSans_{0}.ttf"
CANVAS, INK, MUTED, LEAF = "#F7F5F0", "#17201A", "#4A564D", "#2E7D4F"

SHOTS = [
    ("01-discover", {"tr": ("Sokağındakini keşfet", "Hediye, ödünç ya da günlük kiralık"),
                     "en": ("Find it down the street", "Gifted, lent or rented by the day")}),
    ("05-request", {"tr": ("Günleri seç, iste", "Ücret buluşmada elden ödenir"),
                    "en": ("Pick the days, ask", "Rent is paid in cash at the handover")}),
    ("06-chat", {"tr": ("Her şey tek sohbette", "İstek, onay ve buluşma bir arada"),
                 "en": ("One chat for everything", "Request, accept and meet up")}),
    ("08-handover", {"tr": ("Teslimi fotoğrafla", "Yalnızca iki taraf görür"),
                     "en": ("Photo at the handover", "Only the two of you can see it")}),
    ("07-map", {"tr": ("Adresin hep gizli", "Haritada yalnızca yaklaşık konum"),
                "en": ("Your address stays private", "The map shows only a rough spot")}),
    ("09-group", {"tr": ("Apartmanına özel grup", "Davet koduyla kapalı paylaşım"),
                  "en": ("A group for your building", "Closed sharing with an invite code")}),
]

def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255)
    return m

def compose(raw, W, H, shot_w, top, title, sub, t_size, s_size, crop_status=0):
    img = Image.new("RGB", (W, H), CANVAS)
    d = ImageDraw.Draw(img)
    bold = ImageFont.truetype(FONT.format("700Bold"), t_size)
    reg = ImageFont.truetype(FONT.format("400Regular"), s_size)
    y = int(H * 0.055)
    d.rounded_rectangle([W / 2 - 40, y, W / 2 + 40, y + 12], 6, fill=LEAF)
    y += int(t_size * 0.75)
    d.text((W / 2, y), title, font=bold, fill=INK, anchor="ma")
    y += int(t_size * 1.3)
    d.text((W / 2, y), sub, font=reg, fill=MUTED, anchor="ma")
    src = Image.open(raw).convert("RGB")
    if crop_status:
        src = src.crop((0, crop_status, src.width, src.height))
    h = round(src.height * shot_w / src.width)
    src = src.resize((shot_w, h), Image.LANCZOS)
    r = int(shot_w * 0.075)
    x = (W - shot_w) // 2
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle([x, top + 18, x + shot_w, top + h + 18], r, fill=60)
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    img = Image.composite(Image.new("RGB", (W, H), "#B9BDB5"), img, sh)
    border = Image.new("RGB", (shot_w + 12, h + 12), "#17201A")
    img.paste(border, (x - 6, top - 6), rounded(border, r + 6))
    img.paste(src, (x, top), rounded(src, r))
    return img

for lang in ("tr", "en"):
    for i, (name, caps) in enumerate(SHOTS, 1):
        title, sub = caps[lang]
        raw = f"{ROOT}/docs/store-screenshots/raw/{lang}/{name}.png"
        out_i = f"{ROOT}/docs/store-screenshots/ios-6.9/{lang}"
        out_a = f"{ROOT}/docs/store-screenshots/android/{lang}"
        os.makedirs(out_i, exist_ok=True); os.makedirs(out_a, exist_ok=True)
        compose(raw, 1320, 2868, 1040, 570, title, sub, 84, 48).save(f"{out_i}/{i:02d}-{name[3:]}.png")
        # Android: no iOS status bar / Dynamic Island in a Play listing
        compose(raw, 1080, 1920, 760, 370, title, sub, 64, 36, crop_status=170).save(f"{out_a}/{i:02d}-{name[3:]}.png")
