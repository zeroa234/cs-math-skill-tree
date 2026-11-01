"""宣传片封面：大标题 + 鲸鱼娘（deepseek 娘，片中的旁白）笑脸半身 + Blender 3D 技能树背景。

做法沿用 os-review-bilingual/scripts/cover.py：直接导入那边的 hero()（立绘裁到腰、身后一圈蓝色外发光）
和 glow_text()（带光晕、描边的大字），立绘也是那边用的 game-aesthetic-asset/output/deepseek-chan/src/E4_happy.png。
四种尺寸和“竖版内容只放中间 3:4”的规矩同那边（B 站 / 抖音的封面位）。

用法（项目根目录；需要 Pillow + NumPy + SciPy，本机用 ComfyUI 的 Python）：
  # 1. 背景：开场镜头第 318 帧（10.6 s，标题那一刻）的干净画面，不带字，约 5 秒
  blender -b --factory-startup -P scripts/promo/blender-tree.py -- --shot intro --out temp/promo/cover --frames 318 --samples 128
  # 2. 合成
  D:/ComfyUI-aki-v3.2/python/python.exe scripts/promo/cover.py
输出 output/promo/cover-{16x9,4x3,3x4,9x16}.png、output/promo/cover.jpg（16:9）和 README 用的 docs/images/cover.webp。
标题下那行数字从 output/skilltree.json 读。
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OSR_COVER = ROOT.parent / "os-review-bilingual/scripts/cover.py"
BG = ROOT / "temp/promo/cover/0318.png"
FONT = ROOT / "src/promo/public/fonts/NotoSansSC-VF.ttf"
OUT = ROOT / "output/promo"
SIZES = {"16x9": (1920, 1080), "4x3": (1440, 1080), "3x4": (1080, 1440), "9x16": (1080, 1920)}
BG0 = (6, 9, 15)
INK, INK2, ACCENT, LIT = (238, 241, 246), (188, 196, 210), (122, 167, 247), (245, 196, 106)   # 同 src/promo/src/lib/core.ts
TITLE = ("我把计算机专业", "做成了一棵技能树")
LABEL = "CS × 数学技能树"
# 树的亮度重心放在内容区的哪儿（x 按画面宽、y 按内容区高的比例），以及缩放（1 = 背景帧的高度等于内容区高度）
# 横版：树在文字后面、人物左边，树根露在字下面；竖版：字在上，树在字下面偏左，人物在右下
TREE = {"landscape": (0.42, 0.47, 1.05), "portrait": (0.42, 0.6, 0.8)}


def load_osr():
    spec = importlib.util.spec_from_file_location("osr_cover", OSR_COVER)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def font(size, weight=900):
    f = ImageFont.truetype(str(FONT), max(1, int(size)))
    f.set_variation_by_axes([weight])
    return f


def stats_line():
    t = json.loads((ROOT / "output/skilltree.json").read_text(encoding="utf-8"))
    m = t["meta"]
    return f"{m['skills']} 个技能 · {len(t['lanes'])} 个领域 · {m['steps']} 步 · {m['requiredEdges']} 条必须前置"


def background(w, h, portrait, safe_top, safe_h):
    """树按亮度重心摆位（TREE），文字那一侧压暗"""
    src = Image.open(BG).convert("RGBA")
    lum = np.asarray(src.convert("L"), float)
    lum[lum < 60] = 0                                    # 只算节点和连线
    cx = (lum.sum(0) * np.arange(src.width)).sum() / lum.sum()
    cy = (lum.sum(1) * np.arange(src.height)).sum() / lum.sum()
    tx, ty, zoom = TREE["portrait" if portrait else "landscape"]
    s = safe_h / src.height * zoom
    big = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    # 不要求铺满：Blender 的世界背景就是 BG0，露出来的边用底色补；四边羽化，免得地面光在画面中间断成一条线
    fy = np.clip(np.minimum(np.arange(big.height), np.arange(big.height)[::-1]) / (0.12 * big.height), 0, 1)
    fx = np.clip(np.minimum(np.arange(big.width), np.arange(big.width)[::-1]) / (0.12 * big.width), 0, 1)
    big.putalpha(Image.fromarray((np.outer(fy, fx) * 255).astype(np.uint8), "L"))
    im = Image.new("RGBA", (w, h), BG0 + (255,))
    ox, oy = round(tx * w - cx * s), round(safe_top + ty * safe_h - cy * s)
    im.alpha_composite(big, (max(0, ox), max(0, oy)), (max(0, -ox), max(0, -oy)))
    a = np.zeros((h, w, 4), np.uint8)
    a[..., :3] = BG0
    if portrait:
        yy = (np.arange(h)[:, None] - safe_top) / safe_h
        shade = np.interp(yy, [0, 0.3, 0.45, 1], [0.85, 0.6, 0, 0]) * np.ones((1, w))
    else:
        xx = np.linspace(0, 1, w)[None, :]
        shade = np.interp(xx, [0, 0.38, 0.62, 1], [0.82, 0.45, 0, 0]) * np.ones((h, 1))   # 同成片开场
    a[..., 3] = (shade * 255).astype(np.uint8)
    im.alpha_composite(Image.fromarray(a, "RGBA"))
    return im


def spaced(d, xy, text, f, fill, gap):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + gap


def cover(osr, size, stats):
    w, h = SIZES[size]
    portrait = h > w
    safe_h = w * 4 / 3 if size == "9x16" else h          # 竖版只用中间 3:4
    safe_top = (h - safe_h) / 2
    u = min(w, safe_h) / 1080
    im = background(w, h, portrait, safe_top, safe_h)
    # 人物：右下角，半身（位置规矩同 os-review 的封面）
    hp, pad = osr.hero(safe_h * (0.6 if portrait else 0.98))
    shift = {"16x9": 0.6 * pad, "4x3": 0.16 * w, "3x4": 0.12 * w, "9x16": 0.12 * w}[size]
    hx = int(w - hp.width + shift)
    im.alpha_composite(hp, (hx, int(safe_top + safe_h - hp.height + pad)))
    # 字：左边（竖版在上面）；放不下按同一比例缩，横版不盖到脸上
    d = ImageDraw.Draw(im)
    x0 = int(90 * u)
    right = w - x0 if portrait else min(w - x0, hx + osr.FACE_X * hp.width)
    s1, s2 = 118 * u, 140 * u
    wide = max(d.textlength(TITLE[0], font=font(s1)), d.textlength(TITLE[1], font=font(s2)))
    k = min(1, (right - x0) / wide)
    f1, f2 = font(s1 * k), font(s2 * k)
    fl, fs = font(34 * u, 600), font(min(36 * u, 40 * u * k), 500)
    h1 = d.textbbox((0, 0), TITLE[0], font=f1)
    h2 = d.textbbox((0, 0), TITLE[1], font=f2)
    block = 34 * u + 34 * u + (h1[3] - h1[1]) + 18 * u + (h2[3] - h2[1]) + 44 * u + 36 * u
    y = safe_top + (100 * u if portrait else (safe_h - block) / 2 - 10 * u)
    spaced(d, (x0 + 4 * u, y), LABEL, fl, ACCENT, 8 * u)
    y += 34 * u + 34 * u - h1[1]
    osr.glow_text(im, (x0, y), TITLE[0], f1, INK, (0, 0, 0), int(22 * u))
    y += h1[3] + 18 * u - h2[1]
    osr.glow_text(im, (x0, y), TITLE[1], f2, LIT, LIT, int(26 * u))
    y += h2[3] + 44 * u
    d = ImageDraw.Draw(im)
    d.text((x0 + 4 * u, y), stats, font=fs, fill=INK2, stroke_width=max(1, int(2 * u)), stroke_fill=BG0)
    return im.convert("RGB")


def main():
    osr = load_osr()
    stats = stats_line()
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        im = cover(osr, size, stats)
        p = OUT / f"cover-{size}.png"
        im.save(p)
        print(p.relative_to(ROOT))
        if size == "16x9":
            im.save(OUT / "cover.jpg", quality=92)
            im.save(ROOT / "docs/images/cover.webp", quality=86, method=6)
            print("output/promo/cover.jpg, docs/images/cover.webp")


if __name__ == "__main__":
    main()
