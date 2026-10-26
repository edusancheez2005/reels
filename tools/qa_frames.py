#!/usr/bin/env python3
"""Fast QA for slow (3D) reels: render one still per scene (last beat + settle) and tile a contact sheet.
Usage (from the repo root): python3 tools/qa_frames.py episodes/<id> [--only 3,5] [--cols 5] [--scale 0.5]
Run after build_timeline.py, with the env from .env.local (REMOTION_BROWSER)."""
import argparse, json, subprocess, sys
from pathlib import Path
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("--only")
ap.add_argument("--cols", type=int, default=5)
ap.add_argument("--scale", default="0.5")
a = ap.parse_args()
root = Path(__file__).resolve().parent.parent
ep = Path(a.ep).resolve()
studio = root / "reel-studio"
tl = json.loads((ep / "timeline.json").read_text())
qa = ep / "qa"
qa.mkdir(exist_ok=True)
only = {int(x) for x in a.only.split(",")} if a.only else None
for i, s in enumerate(tl["scenes"], 1):
    if only and i not in only:
        continue
    b = s.get("beats") or [0]
    f = s["from"] + min(max(b) + 9, s["durationInFrames"] - 2)
    out = qa / f"{i:02d}.png"
    r = subprocess.run(["npx", "remotion", "still", "Reel", str(out), "--frame", str(f), "--scale", a.scale, "--log", "error"], cwd=studio)
    if r.returncode:
        sys.exit(f"scene {i} failed")
    print(f"scene {i:02d} frame {f} -> {out.name}", flush=True)
pngs = sorted(qa.glob("[0-9][0-9].png"))
ims = [Image.open(p).convert("RGB").resize((270, 480)) for p in pngs]
cols = a.cols
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 276, rows * 486), (40, 40, 40))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * 276, (k // cols) * 486))
sheet.save(qa / "contact.png")
print("contact:", qa / "contact.png")
