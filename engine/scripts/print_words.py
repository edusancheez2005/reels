#!/usr/bin/env python3
"""Print every word with its index and time, to anchor the storyboard against.

Usage: python3 print_words.py episodes/<slug>/words.json
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import FPS, read_words  # noqa: E402

words = read_words(sys.argv[1])
print(f"{'idx':>4}  {'time':>6}  {'frame':>5}  word")
for i, w in enumerate(words):
    gap = ""
    if i and w["startMs"] - words[i - 1]["endMs"] > 250:
        gap = f"   ← pause {(w['startMs'] - words[i - 1]['endMs']) / 1000:.2f}s"
    print(f"{i:>4}  {w['startMs'] / 1000:>6.2f}  {round(w['startMs'] / 1000 * FPS):>5}  {w['text'].strip()}{gap}")
print(f"\n{len(words)} words · {words[-1]['endMs'] / 1000:.2f}s")
