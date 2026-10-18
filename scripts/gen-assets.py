#!/usr/bin/env python3
"""Generates ALL bundled raster assets procedurally (original artwork, released as CC0-1.0).
Run: python3 scripts/gen-assets.py   (requires Pillow; only needed when regenerating assets)"""
import json, os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
A = os.path.join(ROOT, "assets")
OUT = (20, 16, 40, 255)


def canvas(s=32):
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def shape(d, box, fill, line=OUT, kind="rect", r=3):
    if kind == "ellipse":
        d.ellipse(box, fill=fill, outline=line)
    elif kind == "round":
        d.rounded_rectangle(box, r, fill=fill, outline=line)
    else:
        d.rectangle(box, fill=fill, outline=line)


# ---------------- Pixel Art Pack ----------------
def heart():
    im, d = canvas(); c = (230, 60, 90, 255); o = (60, 10, 30, 255)
    d.ellipse((3, 5, 16, 18), fill=c, outline=o); d.ellipse((15, 5, 28, 18), fill=c, outline=o)
    d.polygon([(4, 14), (27, 14), (16, 28)], fill=c, outline=o); d.rectangle((6, 8, 9, 10), fill=(255, 170, 185, 255)); return im

def star():
    im, d = canvas(); d.polygon([(16, 2), (20, 12), (30, 12), (22, 19), (25, 29), (16, 23), (7, 29), (10, 19), (2, 12), (12, 12)], fill=(255, 210, 60, 255), outline=(120, 70, 0, 255)); return im

def coin():
    im, d = canvas(); shape(d, (3, 3, 28, 28), (255, 200, 40, 255), (110, 60, 0, 255), "ellipse"); shape(d, (8, 8, 23, 23), (255, 230, 110, 255), (190, 120, 10, 255), "ellipse"); d.rectangle((15, 11, 16, 20), fill=(190, 120, 10, 255)); return im

def gem():
    im, d = canvas(); o = (10, 40, 90, 255); d.polygon([(8, 6), (24, 6), (30, 14), (16, 29), (2, 14)], fill=(70, 170, 255, 255), outline=o)
    d.polygon([(8, 6), (16, 14), (2, 14)], fill=(150, 215, 255, 255)); d.polygon([(24, 6), (16, 14), (30, 14)], fill=(40, 120, 220, 255)); return im

def mushroom():
    im, d = canvas(); d.pieslice((2, 4, 30, 28), 180, 360, fill=(220, 50, 50, 255), outline=(70, 10, 10, 255)); d.rectangle((11, 16, 21, 28), fill=(245, 235, 210, 255), outline=(70, 50, 30, 255))
    for p in [(8, 10), (15, 7), (21, 11)]:
        d.ellipse((p[0], p[1], p[0] + 4, p[1] + 4), fill=(255, 255, 255, 255))
    return im

# ---------------- Game UI Pack ----------------
def bar(fill, hi, w):
    im, d = canvas(); shape(d, (1, 11, 30, 21), (40, 30, 60, 255), (10, 8, 20, 255), "round", 2); d.rectangle((3, 13, w, 19), fill=fill); d.rectangle((3, 13, w, 14), fill=hi); return im

def slot():
    im, d = canvas(); shape(d, (2, 2, 29, 29), (55, 48, 85, 255), (15, 12, 30, 255), "round", 4); shape(d, (6, 6, 25, 25), (30, 26, 52, 255), (90, 80, 140, 255), "round", 2); return im

def pause():
    im, d = canvas(); shape(d, (2, 2, 29, 29), (50, 44, 80, 255), (15, 12, 30, 255), "ellipse"); d.rectangle((10, 9, 13, 22), fill=(235, 235, 250, 255)); d.rectangle((18, 9, 21, 22), fill=(235, 235, 250, 255)); return im

# ---------------- RPG Sprite Pack ----------------
def sword():
    im, d = canvas(); d.polygon([(26, 3), (29, 6), (12, 23), (9, 20)], fill=(215, 225, 240, 255), outline=(40, 50, 70, 255)); d.rectangle((6, 19, 14, 22), fill=(150, 100, 40, 255), outline=(50, 30, 10, 255)); d.rectangle((4, 23, 8, 28), fill=(100, 60, 25, 255), outline=(40, 25, 10, 255)); return im

def shield():
    im, d = canvas(); d.polygon([(4, 4), (28, 4), (28, 16), (16, 29), (4, 16)], fill=(70, 110, 200, 255), outline=(15, 25, 60, 255)); d.polygon([(16, 4), (28, 4), (28, 16), (16, 29)], fill=(50, 85, 170, 255)); d.rectangle((14, 8, 17, 22), fill=(255, 215, 80, 255)); return im

def potion():
    im, d = canvas(); d.rectangle((13, 3, 19, 9), fill=(200, 200, 210, 255), outline=(40, 40, 60, 255)); d.ellipse((5, 9, 27, 29), fill=(180, 60, 200, 255), outline=(50, 10, 70, 255)); d.ellipse((9, 14, 14, 19), fill=(230, 160, 245, 255)); return im

def slime():
    im, d = canvas(); d.pieslice((3, 8, 29, 34), 180, 360, fill=(90, 210, 110, 255), outline=(15, 70, 30, 255)); d.rectangle((3, 21, 29, 27), fill=(90, 210, 110, 255)); d.ellipse((10, 15, 13, 19), fill=(10, 30, 10, 255)); d.ellipse((19, 15, 22, 19), fill=(10, 30, 10, 255)); d.ellipse((7, 11, 10, 13), fill=(190, 255, 200, 255)); return im

def key():
    im, d = canvas(); d.ellipse((3, 3, 15, 15), outline=(120, 75, 0, 255), width=3, fill=None); d.rectangle((13, 8, 28, 11), fill=(255, 200, 40, 255), outline=(120, 75, 0, 255)); d.rectangle((22, 11, 24, 17), fill=(255, 200, 40, 255)); d.rectangle((26, 11, 28, 15), fill=(255, 200, 40, 255)); return im

# ---------------- Fantasy Icons Pack ----------------
def wand():
    im, d = canvas(); d.line((6, 27, 24, 9), fill=(110, 70, 30, 255), width=3); d.polygon([(25, 3), (27, 8), (31, 9), (28, 12), (29, 17), (25, 14), (21, 17), (22, 12), (18, 9), (23, 8)], fill=(255, 230, 90, 255), outline=(140, 90, 0, 255)); return im

def crystal():
    im, d = canvas(); d.polygon([(16, 2), (25, 12), (21, 29), (11, 29), (7, 12)], fill=(110, 230, 230, 255), outline=(10, 70, 90, 255)); d.polygon([(16, 2), (16, 29), (11, 29), (7, 12)], fill=(180, 250, 250, 255)); return im

def scroll():
    im, d = canvas(); d.rectangle((6, 6, 26, 26), fill=(240, 225, 185, 255), outline=(110, 80, 30, 255)); d.ellipse((3, 4, 9, 28), fill=(215, 190, 140, 255), outline=(110, 80, 30, 255)); d.ellipse((23, 4, 29, 28), fill=(215, 190, 140, 255), outline=(110, 80, 30, 255))
    for y in (11, 15, 19):
        d.line((11, y, 22, y), fill=(110, 80, 30, 255))
    return im

def crown():
    im, d = canvas(); d.polygon([(3, 24), (3, 9), (10, 16), (16, 6), (22, 16), (29, 9), (29, 24)], fill=(255, 205, 50, 255), outline=(120, 75, 0, 255)); d.rectangle((3, 22, 29, 27), fill=(235, 170, 20, 255), outline=(120, 75, 0, 255)); d.ellipse((14, 17, 18, 21), fill=(220, 40, 70, 255)); return im

def skull():
    im, d = canvas(); d.ellipse((5, 3, 27, 22), fill=(240, 240, 235, 255), outline=(40, 40, 50, 255)); d.rectangle((11, 20, 21, 28), fill=(240, 240, 235, 255), outline=(40, 40, 50, 255)); d.ellipse((9, 11, 14, 16), fill=(30, 20, 40, 255)); d.ellipse((18, 11, 23, 16), fill=(30, 20, 40, 255)); return im

# ---------------- Nature Pack ----------------
def tree():
    im, d = canvas(); d.rectangle((13, 18, 19, 29), fill=(120, 80, 40, 255), outline=(50, 30, 10, 255)); d.ellipse((4, 2, 28, 22), fill=(60, 170, 80, 255), outline=(15, 70, 30, 255)); d.ellipse((9, 6, 15, 11), fill=(130, 220, 130, 255)); return im

def flower():
    im, d = canvas(); d.line((16, 17, 16, 29), fill=(40, 130, 60, 255), width=2)
    for p in [(16, 4), (16, 16), (8, 10), (24, 10)]:
        d.ellipse((p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5), fill=(250, 120, 170, 255), outline=(120, 30, 70, 255))
    d.ellipse((12, 9, 20, 17), fill=(255, 220, 70, 255), outline=(140, 90, 0, 255)); return im

def cloud():
    im, d = canvas(); c = (245, 248, 255, 255); e = (110, 130, 170, 255)
    d.ellipse((2, 12, 16, 26), fill=c, outline=e); d.ellipse((10, 5, 24, 22), fill=c, outline=e); d.ellipse((16, 12, 30, 26), fill=c, outline=e); d.rectangle((9, 16, 23, 25), fill=c); return im

def sun():
    im, d = canvas()
    for a in [(16, 1, 16, 6), (16, 26, 16, 31), (1, 16, 6, 16), (26, 16, 31, 16), (5, 5, 8, 8), (24, 24, 27, 27), (5, 27, 8, 24), (24, 8, 27, 5)]:
        d.line(a, fill=(255, 190, 40, 255), width=2)
    d.ellipse((8, 8, 24, 24), fill=(255, 220, 60, 255), outline=(190, 110, 0, 255)); return im

def leaf():
    im, d = canvas(); d.polygon([(4, 27), (6, 10), (20, 3), (28, 5), (26, 19), (14, 27)], fill=(90, 200, 90, 255), outline=(20, 80, 30, 255)); d.line((5, 27, 24, 8), fill=(30, 110, 50, 255), width=2); return im

# ---------------- Food Icons Pack ----------------
def apple():
    im, d = canvas(); d.ellipse((4, 8, 28, 29), fill=(225, 50, 50, 255), outline=(80, 10, 10, 255)); d.line((16, 8, 17, 3), fill=(100, 60, 20, 255), width=2); d.ellipse((17, 3, 25, 8), fill=(80, 190, 80, 255), outline=(20, 80, 30, 255)); d.ellipse((8, 12, 12, 17), fill=(255, 160, 160, 255)); return im

def burger():
    im, d = canvas(); d.pieslice((3, 3, 29, 22), 180, 360, fill=(225, 160, 70, 255), outline=(100, 60, 10, 255)); d.rectangle((3, 13, 29, 16), fill=(90, 200, 70, 255)); d.rectangle((3, 16, 29, 20), fill=(130, 70, 40, 255), outline=(50, 25, 10, 255)); d.rounded_rectangle((3, 21, 29, 28), 3, fill=(225, 160, 70, 255), outline=(100, 60, 10, 255)); return im

def cake():
    im, d = canvas(); d.rectangle((4, 14, 28, 28), fill=(250, 200, 150, 255), outline=(110, 60, 30, 255)); d.rectangle((4, 14, 28, 19), fill=(250, 140, 190, 255), outline=(120, 40, 80, 255)); d.rectangle((15, 6, 17, 13), fill=(240, 240, 250, 255), outline=(60, 60, 90, 255)); d.ellipse((14, 2, 18, 7), fill=(255, 170, 40, 255)); return im

def cheese():
    im, d = canvas(); d.polygon([(3, 22), (29, 22), (29, 12), (3, 6)], fill=(255, 210, 70, 255), outline=(120, 80, 0, 255)); d.rectangle((3, 22, 29, 27), fill=(235, 180, 40, 255), outline=(120, 80, 0, 255)); d.ellipse((9, 12, 14, 17), fill=(235, 180, 40, 255)); d.ellipse((19, 15, 24, 20), fill=(235, 180, 40, 255)); return im

def cup():
    im, d = canvas(); d.rectangle((6, 8, 22, 27), fill=(250, 250, 250, 255), outline=(50, 50, 70, 255)); d.rectangle((6, 8, 22, 13), fill=(140, 80, 40, 255)); d.arc((19, 11, 29, 23), 270, 90, fill=(50, 50, 70, 255), width=2); return im

# ---------------- Buttons and UI Elements ----------------
def btn(fill, edge):
    im, d = canvas(); shape(d, (1, 8, 30, 24), fill, edge, "round", 5); d.rectangle((5, 10, 26, 12), fill=tuple(min(255, c + 50) for c in fill[:3]) + (255,)); return im

def checkbox():
    im, d = canvas(); shape(d, (4, 4, 27, 27), (240, 240, 252, 255), (40, 36, 70, 255), "round", 4); d.line((9, 16, 14, 22), fill=(60, 170, 100, 255), width=3); d.line((14, 22, 23, 9), fill=(60, 170, 100, 255), width=3); return im

def toggle():
    im, d = canvas(); shape(d, (1, 9, 30, 23), (110, 90, 230, 255), (30, 20, 90, 255), "round", 7); d.ellipse((17, 10, 29, 22), fill=(250, 250, 255, 255), outline=(30, 20, 90, 255)); return im

def arrow():
    im, d = canvas(); shape(d, (2, 2, 29, 29), (60, 50, 110, 255), (15, 12, 30, 255), "round", 6); d.polygon([(10, 8), (23, 16), (10, 24)], fill=(240, 240, 255, 255)); return im

# ---------------- Technology Icons ----------------
def chip():
    im, d = canvas(); d.rectangle((8, 8, 23, 23), fill=(50, 60, 90, 255), outline=(10, 15, 30, 255)); d.rectangle((12, 12, 19, 19), fill=(90, 230, 200, 255))
    pin = (190, 200, 220, 255)
    for i in (10, 15, 20):
        d.line((i, 3, i, 7), fill=pin, width=2); d.line((i, 24, i, 28), fill=pin, width=2); d.line((3, i, 7, i), fill=pin, width=2); d.line((24, i, 28, i), fill=pin, width=2)
    return im

def monitor():
    im, d = canvas(); d.rounded_rectangle((2, 4, 29, 22), 2, fill=(40, 44, 70, 255), outline=(10, 12, 25, 255)); d.rectangle((5, 7, 26, 19), fill=(80, 150, 255, 255)); d.rectangle((13, 22, 18, 26), fill=(120, 125, 150, 255)); d.rectangle((8, 26, 23, 28), fill=(120, 125, 150, 255)); return im

def phone():
    im, d = canvas(); d.rounded_rectangle((8, 2, 23, 29), 3, fill=(40, 44, 70, 255), outline=(10, 12, 25, 255)); d.rectangle((10, 6, 21, 24), fill=(110, 90, 230, 255)); d.ellipse((14, 25, 17, 28), fill=(190, 195, 220, 255)); return im

def code():
    im, d = canvas(); b = (120, 200, 255, 255); d.rounded_rectangle((2, 5, 29, 26), 3, fill=(30, 32, 52, 255), outline=(10, 12, 25, 255))
    d.line((9, 11, 5, 16), fill=b, width=2); d.line((5, 16, 9, 21), fill=b, width=2); d.line((22, 11, 26, 16), fill=b, width=2); d.line((26, 16, 22, 21), fill=b, width=2); d.line((18, 9, 13, 23), fill=(180, 140, 255, 255), width=2); return im

def wifi():
    im, d = canvas()
    for r in (13, 9, 5):
        d.arc((16 - r - 3, 24 - r - 8, 16 + r + 3, 24 + r - 2), 225, 315, fill=(110, 90, 230, 255), width=3)
    d.ellipse((13, 22, 19, 28), fill=(110, 90, 230, 255)); return im


PACKS = [
    {"id": "pixel-art", "name": "Pixel Art Pack", "description": "Classic collectible pixel icons: heart, star, coin, gem and mushroom.",
     "assets": [("heart", heart), ("star", star), ("coin", coin), ("gem", gem), ("mushroom", mushroom)]},
    {"id": "game-ui", "name": "Game UI Pack", "description": "HUD pieces for games: health bar, mana bar, inventory slot, heart and pause button.",
     "assets": [("health-bar", lambda: bar((80, 220, 120, 255), (170, 250, 190, 255), 21)), ("mana-bar", lambda: bar((70, 130, 255, 255), (160, 200, 255, 255), 15)), ("inventory-slot", slot), ("heart-icon", heart), ("pause-button", pause)]},
    {"id": "rpg-sprites", "name": "RPG Sprite Pack", "description": "Fantasy RPG items and a slime enemy.",
     "assets": [("sword", sword), ("shield", shield), ("potion", potion), ("slime", slime), ("key", key)]},
    {"id": "fantasy-icons", "name": "Fantasy Icons Pack", "description": "Magic and royalty icons: wand, crystal, scroll, crown, skull.",
     "assets": [("wand", wand), ("crystal", crystal), ("scroll", scroll), ("crown", crown), ("skull", skull)]},
    {"id": "nature", "name": "Nature Pack", "description": "Tree, flower, cloud, sun and leaf for platformers and maps.",
     "assets": [("tree", tree), ("flower", flower), ("cloud", cloud), ("sun", sun), ("leaf", leaf)]},
    {"id": "food-icons", "name": "Food Icons Pack", "description": "Simple food and drink icons.",
     "assets": [("apple", apple), ("burger", burger), ("cake", cake), ("cheese", cheese), ("cup", cup)]},
    {"id": "buttons-ui", "name": "Buttons and UI Elements Pack", "description": "Buttons, checkbox, toggle and arrow for UI mockups.",
     "assets": [("button-purple", lambda: btn((110, 90, 230, 255), (30, 20, 90, 255))), ("button-blue", lambda: btn((60, 140, 240, 255), (10, 40, 100, 255))), ("checkbox", checkbox), ("toggle", toggle), ("arrow-button", arrow)]},
    {"id": "tech-icons", "name": "Technology Icons Pack", "description": "Chip, monitor, phone, code and wireless icons.",
     "assets": [("chip", chip), ("monitor", monitor), ("phone", phone), ("code", code), ("wifi", wifi)]},
]

LICENSE = {"spdx": "CC0-1.0", "name": "CC0 1.0 Universal (Public Domain Dedication)", "url": "https://creativecommons.org/publicdomain/zero/1.0/",
           "commercialUse": True, "attributionRequired": False,
           "notes": "Original artwork generated procedurally by the PNG Asset Lab authors for this project."}


def write_json(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, indent=2); f.write("\n")


def build_pack(p):
    pdir = os.path.join(A, "packs", p["id"]); os.makedirs(pdir, exist_ok=True)
    assets = []
    prev = Image.new("RGBA", (5 * 34 + 2, 36), (0, 0, 0, 0))
    for i, (name, fn) in enumerate(p["assets"]):
        im = fn(); assert im.size == (32, 32)
        fname = name + ".png"; im.save(os.path.join(pdir, fname), optimize=True)
        assets.append({"id": name, "name": name.replace("-", " ").title(), "path": fname, "width": 32, "height": 32})
        prev.alpha_composite(im, (2 + i * 34, 2))
    prev.save(os.path.join(A, "previews", p["id"] + ".png"), optimize=True)
    write_json(os.path.join(pdir, "pack.json"), {"schema": "png-asset-lab.pack/1", "id": p["id"], "name": p["name"], "version": "1.0.0",
                                                   "description": p["description"], "license": LICENSE, "preview": "../../previews/" + p["id"] + ".png", "assets": assets})


def slime_frame(squash, blink):
    im, d = canvas(); h = 14 + squash; w = 22 - squash; x0 = 16 - w // 2; y1 = 29; y0 = y1 - h
    d.pieslice((x0, y0, x0 + w, y1 + h), 180, 360, fill=(90, 210, 110, 255), outline=(15, 70, 30, 255))
    d.rectangle((x0, y1 - 4, x0 + w, y1), fill=(90, 210, 110, 255)); d.line((x0, y1, x0 + w, y1), fill=(15, 70, 30, 255))
    ey = y0 + h // 2 - 1; eye = (10, 30, 10, 255)
    if blink:
        d.line((x0 + w // 4 - 1, ey + 1, x0 + w // 4 + 3, ey + 1), fill=eye); d.line((x0 + 3 * w // 4 - 3, ey + 1, x0 + 3 * w // 4 + 1, ey + 1), fill=eye)
    else:
        d.rectangle((x0 + w // 4 - 1, ey - 1, x0 + w // 4 + 2, ey + 3), fill=eye); d.rectangle((x0 + 3 * w // 4 - 2, ey - 1, x0 + 3 * w // 4 + 1, ey + 3), fill=eye)
    d.rectangle((x0 + 3, y0 + h // 2 - 4, x0 + 5, y0 + h // 2 - 3), fill=(190, 255, 200, 255))
    return im


def build_sample():
    squash = [0, 2, 5, 2, -2, -4]; sheet = Image.new("RGBA", (32 * 6, 32 * 2), (0, 0, 0, 0))
    for i, s in enumerate(squash):
        sheet.alpha_composite(slime_frame(s, False), (i * 32, 0)); sheet.alpha_composite(slime_frame(s, True), (i * 32, 32))
    sheet.save(os.path.join(A, "samples", "sample-slime-sheet.png"), optimize=True)
    write_json(os.path.join(A, "samples", "sample-slime-sheet.json"), {"name": "sample-slime-sheet.png", "width": 192, "height": 64,
               "grid": {"cols": 6, "rows": 2, "cellWidth": 32, "cellHeight": 32, "marginX": 0, "marginY": 0, "spacingX": 0, "spacingY": 0}, "license": LICENSE})


def build_plugin_icon():
    im = Image.new("RGBA", (128, 128), (30, 32, 40, 255)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 6, 121, 121), 22, fill=(32, 34, 46, 255), outline=(110, 90, 230, 255), width=4)
    for i in range(8):
        for j in range(8):
            c = (58, 60, 78, 255) if (i + j) % 2 == 0 else (44, 46, 62, 255); d.rectangle((24 + i * 10, 24 + j * 10, 33 + i * 10, 33 + j * 10), fill=c)
    im.alpha_composite(slime_frame(2, False).resize((64, 64), Image.NEAREST), (32, 36))
    d.rounded_rectangle((24, 24, 103, 103), 6, outline=(90, 150, 255, 255), width=3)
    im.save(os.path.join(ROOT, "icon.png"), optimize=True)


if __name__ == "__main__":
    for p in PACKS:
        build_pack(p)
    build_sample(); build_plugin_icon()
    print("assets generated")
