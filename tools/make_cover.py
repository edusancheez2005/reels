#!/usr/bin/env python3
"""Designed reel cover: one giant number + a few words, on a darkened frame from the reel.

Edu (29 Oct 2026) liked how covers like "$263 into $13M" / "SNIPERS EXPOSED $109M" look in the grid: the number is the
hero, 2-6 words frame it, same style every time. Our version uses the channel's own colours, not anyone else's look.

Usage (repo root):
  python3 tools/make_cover.py episodes/<id> --number '$600M' --kicker 'THREW AWAY' --tagline 'IN BITCOIN' \
      --pill 'ON ONE HARD DRIVE' [--frame 18.9 | --image path.png] [--tone gold|accent|alert] [--shift 260]
Or put the same fields in episodes/<id>/cover.json and run with just the episode.
Writes episodes/<id>/cover.jpg (1080x1920). Everything that matters sits inside the profile grid's 3:4 crop (y 240-1680).
"""
import argparse, json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1080, 1920
FONTS = Path("/usr/share/fonts/opentype/inter")
TONES = {"gold": (242, 196, 90), "accent": None, "alert": (255, 91, 107), "good": (61, 220, 132)}


def font(name, size):
    for cand in [FONTS / name, Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")]:
        if cand.exists():
            return ImageFont.truetype(str(cand), size)
    return ImageFont.load_default()


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def text_w(draw, s, f, spacing=0):
    b = draw.textbbox((0, 0), s, font=f)
    return b[2] - b[0] + spacing * max(0, len(s) - 1)


def draw_spaced(draw, xy, s, f, fill, spacing=0):
    x, y = xy
    if not spacing:
        draw.text((x, y), s, font=f, fill=fill)
        return
    for ch in s:
        draw.text((x, y), ch, font=f, fill=fill)
        x += text_w(draw, ch, f) + spacing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ep")
    ap.add_argument("--number")
    ap.add_argument("--kicker", default="")
    ap.add_argument("--tagline", default="")
    ap.add_argument("--pill", default="")
    ap.add_argument("--frame", type=float, help="seconds into the episode mp4 for the background")
    ap.add_argument("--image", help="background image instead of a video frame")
    ap.add_argument("--tone", default="gold")
    ap.add_argument("--shift", type=int, default=0, help="move the background down by N px (frees the top for text)")
    ap.add_argument("--handle", default=None)
    a = ap.parse_args()
    ep = (ROOT / a.ep).resolve() if not Path(a.ep).is_absolute() else Path(a.ep)
    cfg = json.loads((ep / "cover.json").read_text()) if (ep / "cover.json").exists() else {}
    for k in ["number", "kicker", "tagline", "pill", "frame", "image", "tone", "shift", "handle"]:
        if getattr(a, k) in (None, "", 0) and k in cfg:
            setattr(a, k, cfg[k])
    if not a.number:
        sys.exit("need --number (or cover.json)")
    meta = json.loads((ep / "meta.json").read_text()) if (ep / "meta.json").exists() else {}
    ch = json.loads((ROOT / "channels" / f"{meta.get('channel', 'crypto')}.json").read_text()) if (ROOT / "channels" / f"{meta.get('channel', 'crypto')}.json").exists() else {}
    brand = ch.get("brand", {})
    bg = hex2rgb(brand.get("bg", "#070b12"))
    accent = hex2rgb(brand.get("accent", "#3bc9ee"))
    muted = hex2rgb(brand.get("muted", "#8595a8"))
    handle = a.handle or ch.get("handle", "@sonartracker.io")
    tone = TONES.get(a.tone) or accent

    # background
    canvas = Image.new("RGB", (W, H), bg)
    src = None
    if a.image:
        src = Image.open(a.image).convert("RGB")
    elif a.frame is not None:
        mp4 = ep / f"{ep.name}.mp4"
        if mp4.exists():
            with tempfile.TemporaryDirectory() as td:
                out = Path(td) / "f.png"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a.frame), "-i", str(mp4), "-frames:v", "1", str(out)], check=True)
                src = Image.open(out).convert("RGB")
    if src is not None:
        src = src.resize((W, int(src.height * W / src.width)))
        src = src.filter(ImageFilter.GaussianBlur(2))
        canvas.paste(src, (0, a.shift))
    # darken: strong at the top (text) and the edges, lighter low in the middle (the picture)
    shade = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        t = y / H
        if t < 0.55:
            v = 215 - int(105 * (t / 0.55))
        elif t < 0.86:
            v = 110 - int(40 * ((t - 0.55) / 0.31))
        else:
            v = 70 + int(150 * ((t - 0.86) / 0.14))
        sd.line([(0, y), (W, y)], fill=max(0, min(255, v)))
    canvas = Image.composite(Image.new("RGB", (W, H), bg), canvas, shade)

    d = ImageDraw.Draw(canvas)
    y = 560
    if a.kicker:
        fk = font("Inter-ExtraBold.otf", 66)
        s = a.kicker.upper()
        w = text_w(d, s, fk, 6)
        draw_spaced(d, ((W - w) / 2, y), s, fk, (255, 255, 255), 6)
        y += 100
    # the number: as big as fits in 900 px
    size = 330
    fn = font("InterDisplay-Black.otf", size)
    while text_w(d, a.number, fn) > 900 and size > 120:
        size -= 10
        fn = font("InterDisplay-Black.otf", size)
    nb = d.textbbox((0, 0), a.number, font=fn)
    nx = (W - (nb[2] - nb[0])) / 2 - nb[0]
    ny = y - nb[1]
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((nx, ny), a.number, font=fn, fill=tone + (150,))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    canvas.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(canvas)
    d.text((nx, ny), a.number, font=fn, fill=tone)
    y += (nb[3] - nb[1]) + 46
    if a.tagline:
        ft = font("Inter-ExtraBold.otf", 64)
        s = a.tagline.upper()
        w = text_w(d, s, ft, 3)
        draw_spaced(d, ((W - w) / 2, y), s, ft, (255, 255, 255), 3)
        y += 104
    if a.pill:
        fp = font("Inter-Bold.otf", 38)
        s = a.pill.upper()
        w = text_w(d, s, fp, 3)
        px, py = 34, 18
        x0 = (W - w) / 2 - px
        box = [x0, y, x0 + w + 2 * px, y + 38 + 2 * py + 6]
        d.rounded_rectangle(box, radius=40, fill=bg + (0,), outline=accent, width=4)
        draw_spaced(d, ((W - w) / 2, y + py), s, fp, accent, 3)
    fh = font("Inter-SemiBold.otf", 32)
    w = text_w(d, handle, fh)
    d.text(((W - w) / 2, 1600), handle, font=fh, fill=muted)
    out = ep / "cover.jpg"
    canvas.save(out, quality=92)
    print(out)


if __name__ == "__main__":
    main()
