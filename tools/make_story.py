#!/usr/bin/env python3
"""Cut a day's Instagram story sequence out of the episode's reel (Edu, 28 Oct 2026: "cut the video in little bits").

Usage
  python3 tools/make_story.py episodes/<id> [--line "end-card teaser"] [--highlight START-END] [--max 9.0]

Writes, in posting order:
  episodes/<id>/story_1.mp4   the hook: from 0 s to the last sentence that ends before --max (ideally the open question)
  episodes/<id>/story_2.mp4   one highlight: the most concrete sentence from the middle of the reel (3-7.5 s), or --highlight
  episodes/<id>/story_3.jpg   the end card: "NEW REEL", the teaser line, the handle (stories can't link to the reel via the API)
  episodes/<id>/story.json    the list above, for publish_media.sh / prepost_check.py / the posting step
Each clip is the reel scaled to 90% over a blurred copy of itself, so its captions sit below the story header and nothing
important falls under the reply bar (stories cover roughly y < 250 and y > 1600).
"""
import argparse, json, re, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("--line", default="", help="teaser on the end card (default: meta story_line, else the topic)")
ap.add_argument("--highlight", default="", help="START-END seconds for clip 2 (default: picked automatically)")
ap.add_argument("--max", type=float, default=9.0, help="longest hook clip in seconds")
a = ap.parse_args()
ep = Path(a.ep); ep = (ep if ep.is_absolute() else root / ep).resolve()
eid = ep.name
reel = ep / f"{eid}.mp4"
words = json.loads((ep / "words.json").read_text())
meta = json.loads((ep / "meta.json").read_text()) if (ep / "meta.json").exists() else {}
channel = json.loads((root / "channels" / f"{meta['channel']}.json").read_text()) if meta.get("channel") else {}
handle = channel.get("handle", "@sonartracker.io")
brand = channel.get("brand", {})
ACCENT, BG = brand.get("accent", "#3bc9ee"), brand.get("bg", "#070b12")
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(reel)],
                             capture_output=True, text=True).stdout or 0)
NUM = re.compile(r"\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred|thousand|million|billion|trillion|half)\b", re.I)

# ---- sentences from the word timings ----
sents, cur = [], []
for w in words:
    cur.append(w)
    if re.search(r"[.?!][\"')\]]*$", w["text"].strip()):
        sents.append(cur); cur = []
if cur:
    sents.append(cur)
S = [{"start": s[0]["startMs"] / 1000, "end": s[-1]["endMs"] / 1000, "text": " ".join(x["text"].strip() for x in s)} for s in sents]
for i, s in enumerate(S):
    s["next"] = S[i + 1]["start"] if i + 1 < len(S) else s["end"] + 1

def tail(s):  # end a clip just after a sentence, before the next word
    return round(min(s["end"] + 0.3, max(s["end"] + 0.05, s["next"] - 0.03)), 2)

# ---- clip 1: the hook ----
hook = [s for s in S if 3.0 <= s["end"] <= a.max] or S[:1]
end_s = hook[-1]
qs = [s for s in hook if s["text"].endswith("?")]
if qs and qs[-1]["end"] >= hook[-1]["end"] - 2.5:
    end_s = qs[-1]
c1 = (0.0, tail(end_s))

# ---- clip 2: one concrete sentence from the middle ----
if a.highlight:
    h0, h1 = (float(x) for x in a.highlight.split("-"))
    c2 = (h0, h1)
else:
    emph = []
    if (ep / "storyboard.json").exists():
        emph = [e.lower().strip(".,:;!?") for e in json.loads((ep / "storyboard.json").read_text()).get("emphasis", [])]
    best, score = None, -9
    for s in S:
        d = s["end"] - s["start"]
        if s["start"] < c1[1] + 0.5 or s["end"] > total - 2.0 or not 2.9 <= d <= 7.5:
            continue
        sc = (2 if NUM.search(s["text"]) else 0) + (1 if any(e and e in s["text"].lower() for e in emph) else 0)
        sc -= 3 * abs((s["start"] + s["end"]) / 2 - 0.55 * total) / max(total, 1)
        if sc > score:
            best, score = s, sc
    c2 = (round(max(0, best["start"] - 0.15), 2), tail(best)) if best else None

# ---- clip 3: the end card ----
def font(name, size):
    for p in (f"/usr/share/fonts/opentype/inter/{name}.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()

line = a.line or meta.get("story_line") or re.split(r"\s[—-]\s|:\s|\(", meta.get("topic", "") or "Today's reel")[0]
W, H = 1080, 1920
cover = ep / "cover.jpg"
bg = Image.open(cover).convert("RGB").resize((W, H)) if cover.exists() else Image.new("RGB", (W, H), BG)
bg = Image.blend(bg.filter(ImageFilter.GaussianBlur(28)), Image.new("RGB", (W, H), BG), 0.62)
d = ImageDraw.Draw(bg)

def wrap(text, f, width):
    out, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=f) <= width:
            cur = trial
        else:
            out.append(cur); cur = w
    out.append(cur)
    return [l for l in out if l]

f_pill, f_big, f_sub, f_handle, f_hint = font("Inter-Bold", 34), font("Inter-ExtraBold", 84), font("Inter-SemiBold", 42), font("Inter-Bold", 46), font("Inter-Medium", 34)
big = wrap(line, f_big, 900)[:3]
y = max(420, (H - (66 + 56 + len(big) * 100 + 36 + 96 + 70 + 40)) // 2 - 40)
pw = d.textlength("NEW REEL", font=f_pill) + 56
d.rounded_rectangle([(W - pw) / 2, y, (W + pw) / 2, y + 66], radius=33, fill=ACCENT)
d.text((W / 2, y + 33), "NEW REEL", font=f_pill, fill="#06121a", anchor="mm")
y += 66 + 56
for l in big:
    d.text((W / 2, y + 46), l, font=f_big, fill="#ffffff", anchor="mm"); y += 100
y += 36
d.text((W / 2, y + 24), "The full answer is in today's reel", font=f_sub, fill="#d4dde8", anchor="mm"); y += 96
d.text((W / 2, y + 24), handle, font=f_handle, fill=ACCENT, anchor="mm"); y += 70
d.text((W / 2, y + 20), "Tap our profile → Reels", font=f_hint, fill="#9fb0c3", anchor="mm")
card = ep / "story_3.jpg"
bg.save(card, quality=92)

# ---- render the clips ----
def clip(t0, t1, out):
    dur = t1 - t0
    fc = (f"[0:v]trim={t0}:{t1},setpts=PTS-STARTPTS,fps=30,split[a][b];"
          f"[a]scale={W}:{H},boxblur=24:2,eq=brightness=-0.16[bg];[b]scale=972:1728[fg];"
          f"[bg][fg]overlay=(W-w)/2:96,format=yuv420p,setsar=1[v];"
          f"[0:a]atrim={t0}:{t1},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,"
          f"afade=t=in:st=0:d=0.12,afade=t=out:st={max(0, dur - 0.3):.2f}:d=0.3[au]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(reel), "-filter_complex", fc, "-map", "[v]", "-map", "[au]",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "128k",
                    "-movflags", "+faststart", str(out)], check=True)

for old in list(ep.glob("story_*.mp4")) + [ep / "story.mp4", ep / "story_card.png"]:
    old.unlink(missing_ok=True)
parts = []
clip(*c1, ep / "story_1.mp4"); parts.append({"file": "story_1.mp4", "kind": "video", "from": c1[0], "to": c1[1]})
if c2:
    clip(*c2, ep / "story_2.mp4"); parts.append({"file": "story_2.mp4", "kind": "video", "from": c2[0], "to": c2[1]})
parts.append({"file": "story_3.jpg", "kind": "image", "line": line})
(ep / "story.json").write_text(json.dumps(parts, indent=2))

said = lambda t0, t1: " ".join(w["text"].strip() for w in words if w["startMs"] / 1000 >= t0 - 0.05 and w["endMs"] / 1000 <= t1 + 0.05)
print(f"story 1 (hook {c1[0]:.1f}-{c1[1]:.1f}s): {said(*c1)}")
print(f"story 2 (highlight {c2[0]:.1f}-{c2[1]:.1f}s): {said(*c2)}" if c2 else "story 2: no 3-7.5 s sentence found in the middle; skipped")
print(f"story {len(parts)} (card): {line}")
