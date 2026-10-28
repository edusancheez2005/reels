#!/usr/bin/env python3
"""Cut a 9:16 Instagram story from an episode's reel: the hook (up to ~9 s) + an end card that sends people to the reel.

Usage
  python3 tools/make_story.py episodes/<id> [--line "teaser for the end card"] [--max 9.0]

Writes episodes/<id>/story.mp4 (1080x1920, ~10-13 s, H.264/AAC) and episodes/<id>/story_card.png.
- The clip ends at the last sentence that finishes before --max seconds (an open question is ideal: "How?").
- The reel is scaled to 90% over a blurred copy of itself so its captions sit below the story header and nothing
  important falls under the reply bar (stories cover roughly y < 250 and y > 1600).
- The end card reuses the reel's cover, blurred, with "NEW REEL", a teaser line and the handle.
Stories can't carry captions or clickable links through the API, so the card says where to find the reel.
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("--line", default="", help="teaser on the end card (default: meta story_line, else the topic)")
ap.add_argument("--max", type=float, default=9.0, help="longest hook clip in seconds")
ap.add_argument("--card", type=float, default=3.0, help="end card seconds")
a = ap.parse_args()
ep = Path(a.ep); ep = (ep if ep.is_absolute() else root / ep).resolve()
eid = ep.name
reel = ep / f"{eid}.mp4"
words = json.loads((ep / "words.json").read_text())
meta = json.loads((ep / "meta.json").read_text()) if (ep / "meta.json").exists() else {}
channel = json.loads((root / "channels" / f"{meta.get('channel', 'crypto')}.json").read_text()) if meta.get("channel") else {}
handle = channel.get("handle", "@sonartracker.io")
brand = channel.get("brand", {})
ACCENT = brand.get("accent", "#3bc9ee")

# ---- where to cut: the last sentence end before --max (prefer a question), at least 3 s in ----
ends = []
for i, w in enumerate(words):
    t = w["text"].strip()
    if re.search(r"[.?!][\"')\]]*$", t):
        end = w["endMs"] / 1000
        nxt = words[i + 1]["startMs"] / 1000 if i + 1 < len(words) else end + 1
        ends.append((end, nxt, t.endswith("?")))
cands = [e for e in ends if 3.0 <= e[0] <= a.max]
if not cands:
    cands = [(w["endMs"] / 1000, (words[i + 1]["startMs"] / 1000 if i + 1 < len(words) else w["endMs"] / 1000 + 1), False)
             for i, w in enumerate(words) if w["endMs"] / 1000 <= a.max][-1:]
end, nxt, _ = cands[-1]
qs = [e for e in cands if e[2]]
if qs and qs[-1][0] >= cands[-1][0] - 2.5:
    end, nxt, _ = qs[-1]
cut = round(min(end + 0.3, max(end + 0.05, nxt - 0.03)), 2)

# ---- end card ----
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
bg = Image.open(cover).convert("RGB").resize((W, H)) if cover.exists() else Image.new("RGB", (W, H), brand.get("bg", "#070b12"))
bg = bg.filter(ImageFilter.GaussianBlur(28))
bg = Image.blend(bg, Image.new("RGB", (W, H), brand.get("bg", "#070b12")), 0.62)
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
block = 80 + 40 + len(big) * 100 + 40 + 60 + 70 + 60 + 50
y = max(420, (H - block) // 2 - 40)
pill = "NEW REEL"
pw = d.textlength(pill, font=f_pill) + 56
d.rounded_rectangle([(W - pw) / 2, y, (W + pw) / 2, y + 66], radius=33, fill=ACCENT)
d.text((W / 2, y + 33), pill, font=f_pill, fill="#06121a", anchor="mm")
y += 66 + 56
for l in big:
    d.text((W / 2, y + 46), l, font=f_big, fill="#ffffff", anchor="mm")
    y += 100
y += 36
d.text((W / 2, y + 24), "The full answer is in today's reel", font=f_sub, fill="#d4dde8", anchor="mm")
y += 96
d.text((W / 2, y + 24), handle, font=f_handle, fill=ACCENT, anchor="mm")
y += 70
d.text((W / 2, y + 20), "Tap our profile → Reels", font=f_hint, fill="#9fb0c3", anchor="mm")
card = ep / "story_card.png"
bg.save(card)

# ---- render ----
out = ep / "story.mp4"
fc = (
    f"[0:v]trim=0:{cut},setpts=PTS-STARTPTS,fps=30,split[a][b];"
    f"[a]scale={W}:{H},boxblur=24:2,eq=brightness=-0.16[bg];"
    f"[b]scale=972:1728[fg];"
    f"[bg][fg]overlay=(W-w)/2:96,format=yuv420p,setsar=1[clip];"
    f"[1:v]scale=w='{W}*(1+0.04*t/{a.card})':h=-2:eval=frame,crop={W}:{H},fps=30,fade=t=in:st=0:d=0.25,format=yuv420p,setsar=1[card];"
    f"[0:a]atrim=0:{cut},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st={max(0, cut - 0.3):.2f}:d=0.3[aclip];"
    f"anullsrc=r=48000:cl=stereo,atrim=0:{a.card},asetpts=PTS-STARTPTS[asil];"
    f"[clip][aclip][card][asil]concat=n=2:v=1:a=1[v][au]"
)
cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(reel), "-loop", "1", "-framerate", "30", "-t", str(a.card), "-i", str(card),
       "-filter_complex", fc, "-map", "[v]", "-map", "[au]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
       "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(out)]
subprocess.run(cmd, check=True)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout or 0)
said = " ".join(w["text"].strip() for w in words if w["endMs"] / 1000 <= cut)
print(f"story: {out} ({dur:.1f}s; hook clip 0-{cut}s + {a.card:.0f}s card)")
print(f"hook said: {said}")
print(f"card line: {line}")
