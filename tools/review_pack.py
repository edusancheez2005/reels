#!/usr/bin/env python3
"""Build the material the independent reviewer looks at (it can't watch video).
Usage: python3 tools/review_pack.py episodes/<id>

Writes episodes/<id>/review/:
  pack.md          scene list: time, component, theme, the words spoken during each scene
  sheet_NN.png     frames from the FINAL mp4 (hook frames, then ~3 per scene at its beats), each labelled with
                   scene id, component, time and the words being spoken at that moment
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
ep = Path(sys.argv[1]); ep = (ep if ep.is_absolute() else root / ep).resolve()
eid = ep.name
mp4 = ep / f"{eid}.mp4"
tl = json.loads((ep / "timeline.json").read_text())
words = json.loads((ep / "words.json").read_text())
fps = tl["fps"]; total = tl["durationInFrames"]
out = ep / "review"; out.mkdir(exist_ok=True)
for f in out.glob("*"):
    f.unlink()

def said(t0, t1):
    return " ".join(w["text"].strip() for w in words if w["endMs"] / 1000 > t0 and w["startMs"] / 1000 < t1)

# pick frames
picks = []  # (frame, scene_id, component)
for t in (0.3, 1.0, 2.0):
    f = int(t * fps)
    sc = next((s for s in tl["scenes"] if s["from"] <= f < s["from"] + s["durationInFrames"]), tl["scenes"][0])
    picks.append((f, sc["id"] + " (hook)", sc["component"]))
for s in tl["scenes"]:
    a, d = s["from"], s["durationInFrames"]
    cands = [a + min(10, d // 3)] + [a + b + 12 for b in s.get("beats", [])] + [a + d - 4]
    cands = sorted({min(max(c, a), a + d - 1) for c in cands})
    chosen = []
    for c in cands:
        if all(abs(c - x) >= 14 for x in chosen):
            chosen.append(c)
    if len(chosen) > 3:  # keep first, middle, last
        chosen = [chosen[0], chosen[len(chosen) // 2], chosen[-1]]
    picks += [(c, s["id"], s["component"]) for c in chosen]
picks = sorted({p[0]: p for p in picks if p[0] < total}.values())

# extract (one pass)
sel = "+".join(f"eq(n\\,{f})" for f, _, _ in picks)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vf", f"select='{sel}',scale=360:640", "-vsync", "0", str(out / "f_%03d.png")], check=True)
frames = sorted(out.glob("f_*.png"))

try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
    bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
except OSError:
    font = bold = ImageFont.load_default()

def wrap(text, width=40):
    lines, cur = [], ""
    for w in text.split():
        if len(cur) + len(w) + 1 > width:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    return lines[:3]

COLS, ROWS, W, H, LAB = 4, 3, 360, 640, 78
per = COLS * ROWS
for si in range(0, len(frames), per):
    sheet = Image.new("RGB", (COLS * W, ROWS * (H + LAB)), "#111")
    d = ImageDraw.Draw(sheet)
    for k, fp in enumerate(frames[si:si + per]):
        f, sid, comp = picks[si + k]
        t = f / fps
        x, y = (k % COLS) * W, (k // COLS) * (H + LAB)
        sheet.paste(Image.open(fp), (x, y))
        d.text((x + 6, y + H + 4), f"{sid} · {comp} · {t:.1f}s", fill="#ffd36b", font=bold)
        for j, line in enumerate(wrap("“" + said(t - 0.6, t + 0.6) + "”")):
            d.text((x + 6, y + H + 24 + j * 17), line, fill="#e6e6e6", font=font)
    sheet.save(out / f"sheet_{si // per + 1:02d}.png")
for fp in frames:
    fp.unlink()

lines = [f"# Review pack: {eid}", "", f"Duration {total / fps:.1f}s · {len(tl['scenes'])} scenes · captions: {tl.get('captionStyle')}", "",
         "| scene | start | len | component | theme | words spoken during the scene |", "|---|---|---|---|---|---|"]
for s in tl["scenes"]:
    a, d = s["from"] / fps, s["durationInFrames"] / fps
    lines.append(f"| {s['id']} | {a:.1f}s | {d:.1f}s | {s['component']} | {s.get('theme', '')} | {said(a, a + d)} |")
lines += ["", f"Sheets: {', '.join(p.name for p in sorted(out.glob('sheet_*.png')))} (each frame labelled with what's being said ±0.6 s)."]
(out / "pack.md").write_text("\n".join(lines) + "\n")
print(f"review pack: {out} ({len(picks)} frames, {len(list(out.glob('sheet_*.png')))} sheets)")
