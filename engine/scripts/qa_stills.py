#!/usr/bin/env python3
"""Render a fast low-res draft and pull one still per scene into a contact sheet for visual QA.

Usage (from reel-studio/): python3 qa_stills.py ../episodes/<slug>/timeline.json --studio .

Writes <ep>/qa/draft.mp4, <ep>/qa/NN.png (one per scene, at its last beat + settle), <ep>/qa/contact.png
Then Read contact.png and check: safe zone, overlaps, legibility, empty frames, words ↔ visuals.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

SETTLE = 9  # frames after the last beat so entrance animations have finished


def run(cmd, cwd=None):
    print("$ " + " ".join(cmd))
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode:
        sys.exit(f"command failed ({r.returncode})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("timeline")
    ap.add_argument("--studio", default=".")
    ap.add_argument("--cols", type=int, default=4)
    a = ap.parse_args()

    tl_path = Path(a.timeline).resolve()
    tl = json.loads(tl_path.read_text())
    qa = tl_path.parent / "qa"
    shutil.rmtree(qa, ignore_errors=True)
    qa.mkdir()
    fps = tl["fps"]

    draft = qa / "draft.mp4"
    run(["npx", "remotion", "render", "Reel", str(draft), "--scale", "0.5", "--crf", "28", "--log", "error"], cwd=a.studio)

    rows = []
    for i, s in enumerate(tl["scenes"], 1):
        local = (s["beats"][-1] if s["beats"] else 0) + SETTLE
        frame = s["from"] + min(local, s["durationInFrames"] - 1)
        out = qa / f"{i:02d}.png"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{frame / fps:.3f}", "-i", str(draft),
                        "-frames:v", "1", str(out)], check=True)
        rows.append(f"{i:02d}.png  scene {i} {s['component']:<9} @ {frame / fps:5.2f}s  \"{s['anchorText']}…\"")

    n = len(tl["scenes"])
    rws = -(-n // a.cols)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "1", "-i", str(qa / "%02d.png"),
                    "-vf", f"scale=270:-1,tile={a.cols}x{rws}:padding=8:color=0x333333",
                    "-frames:v", "1", str(qa / "contact.png")], check=True)

    print("\n".join(rows))
    print(f"\nContact sheet: {qa / 'contact.png'}   (read left→right, top→bottom)")
    print(f"Draft video:   {draft}")


if __name__ == "__main__":
    main()
