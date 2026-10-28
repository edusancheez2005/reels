#!/usr/bin/env python3
"""Pre-post gate for auto-posting. Usage: python3 tools/prepost_check.py episodes/<id>

Prints PASS (exit 0) only if every mechanical check passes, and writes
  episodes/<id>/caption_post.txt     caption for Instagram (no Sources block), cleaned of invisible chars/dashes
  episodes/<id>/sources_comment.txt  the Sources block for the first comment
Also lints the caption (tools/ig/check_caption.py) and prints STORY_URL when the story is valid and hosted.
Otherwise prints FAIL with the reasons (exit 1), or PAUSED if auto-posting is switched off (exit 3).
It does not replace reading the contact sheet and research.md yourself; it catches the mechanical failures.
"""
import datetime, json, re, subprocess, sys
from pathlib import Path
from zoneinfo import ZoneInfo
sys.path.insert(0, str(Path(__file__).resolve().parent / "ig"))
from check_caption import check as caption_check, safe_clean  # noqa: E402  (caption linter + humanizer)

root = Path(__file__).resolve().parent.parent
ep = Path(sys.argv[1])
ep = ep if ep.is_absolute() else (root / ep)
ep = ep.resolve()
eid = ep.name
fails = []
warns = []

flag = json.loads((root / "channels" / "autopost.json").read_text())
if not flag.get("enabled"):
    print(f"PAUSED: auto-posting is off ({flag.get('note', '')}). Hand over for approval instead.")
    sys.exit(3)

for f in [f"{eid}.mp4", "cover.jpg", "caption.txt", "research.md", "storyboard.json", "meta.json", "words.json"]:
    if not (ep / f).exists():
        fails.append(f"missing {f}")
if not (ep / "qa" / "contact.png").exists():
    fails.append("no qa/contact.png (QA not run)")

meta = json.loads((ep / "meta.json").read_text()) if (ep / "meta.json").exists() else {}
if meta.get("posted"):
    fails.append("already posted")

# one auto-post per London day
today = datetime.datetime.now(ZoneInfo("Europe/London")).date().isoformat()
for m in root.glob("episodes/*/meta.json"):
    if m.parent == ep:
        continue
    o = json.loads(m.read_text())
    if o.get("auto_posted") and str(o.get("posted_at", "")).startswith(today):
        fails.append(f"already auto-posted today ({m.parent.name})")

# video: 1080x1920 h264 + aac, sane length, matches the voice
mp4 = ep / f"{eid}.mp4"
if mp4.exists():
    pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration", "-of", "json", str(mp4)], capture_output=True, text=True)
    info = json.loads(pr.stdout or "{}")
    streams = info.get("streams", [])
    v = [s for s in streams if s.get("codec_type") == "video"]
    a = [s for s in streams if s.get("codec_type") == "audio"]
    dur = float(info.get("format", {}).get("duration", 0))
    if not v or v[0].get("codec_name") != "h264" or (v[0].get("width"), v[0].get("height")) != (1080, 1920):
        fails.append(f"video stream not h264 1080x1920: {v[:1]}")
    if not a:
        fails.append("no audio stream")
    if not 15 <= dur <= 90:
        fails.append(f"duration {dur:.1f}s outside 15-90s")
    words = json.loads((ep / "words.json").read_text()) if (ep / "words.json").exists() else []
    if words:
        speech = words[-1]["endMs"] / 1000
        if not (speech + 0.2 <= dur <= speech + 3.0):
            fails.append(f"duration {dur:.1f}s doesn't fit the voice ({speech:.1f}s)")

# caption
cap = (ep / "caption.txt").read_text() if (ep / "caption.txt").exists() else ""
parts = re.split(r"\n\s*Sources:", cap, maxsplit=1)
post, sources = parts[0].strip(), ("Sources:" + parts[1]).strip() if len(parts) > 1 else ""
post, _ = safe_clean(post)          # invisible characters, dashes, curly quotes: never ship them
sources, _ = safe_clean(sources)
if post:
    cc = caption_check(post)
    fails += [f"caption: {f}" for f in cc["fails"]]
    warns += [f"caption: {w}" for w in cc["warns"]]
if not post:
    fails.append("empty caption")
if not sources:
    fails.append("caption.txt has no 'Sources:' block")
if len(post) > 2200:
    fails.append(f"caption {len(post)} chars > 2200")
channel = meta.get("channel", "")
if channel in ("sonar", "crypto") and "not financial advice" not in post.lower():
    fails.append("caption lacks 'Not financial advice.'")
banned = r"\b(will (go|hit|reach|pump|moon|explode|crash)|to the moon|price target|buy now|sell now|guaranteed|can't lose|100x)\b"
for txt, where in ((post, "caption"), ((ep / "script.txt").read_text() if (ep / "script.txt").exists() else "", "script")):
    hit = re.search(banned, txt, re.I)
    if hit:
        fails.append(f"price-prediction/hype phrase in {where}: '{hit.group(0)}'")

# independent review (RUNBOOK §2b)
rv = (ep / "review.md").read_text() if (ep / "review.md").exists() else ""
vm = re.search(r"VERDICT:\s*(PASS WITH NOTES|PASS|FAIL)", rv)
if not vm:
    fails.append("no review.md verdict (run the independent review, RUNBOOK §2b)")
elif vm.group(1) == "FAIL":
    fails.append("reviewer verdict is FAIL (see review.md)")

# sources
res = (ep / "research.md").read_text() if (ep / "research.md").exists() else ""
if len(re.findall(r"https?://", res)) < 3:
    fails.append("research.md has fewer than 3 source links")

# hosted files reachable
for url in (meta.get("video_url", ""), meta.get("video_url", "").replace(".mp4", ".jpg")):
    if not url:
        fails.append("no video_url in meta.json (run finish_episode.py + publish_media.sh)")
        break
    code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-I", "--max-time", "20", url], capture_output=True, text=True).stdout
    if code != "200":
        fails.append(f"{url} -> HTTP {code}")

# story (optional: a broken story never blocks the reel)
story_url = ""
story = ep / "story.mp4"
if story.exists():
    pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", str(story)], capture_output=True, text=True)
    si = json.loads(pr.stdout or "{}")
    sv = [x for x in si.get("streams", []) if x.get("codec_type") == "video"]
    sd = float(si.get("format", {}).get("duration", 0))
    url = meta.get("story_url", "")
    code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-I", "--max-time", "20", url], capture_output=True, text=True).stdout if url else "no url"
    if not sv or (sv[0].get("width"), sv[0].get("height")) != (1080, 1920) or not 3 <= sd <= 60:
        warns.append(f"story: not 1080x1920 / 3-60 s ({sd:.1f}s); skip the story")
    elif code != "200":
        warns.append(f"story: {url or 'no story_url in meta.json'} -> {code}; skip the story")
    else:
        story_url = url
else:
    warns.append("story: no story.mp4 (tools/make_story.py); the reel can still post")

for w in warns:
    print("WARN", w)
if fails:
    print("FAIL")
    for f in fails:
        print(" -", f)
    sys.exit(1)
(ep / "caption_post.txt").write_text(post + "\n")
(ep / "sources_comment.txt").write_text(sources + "\n")
print("PASS")
print(f"VIDEO_URL={meta['video_url']}")
print(f"COVER_URL={meta['video_url'].replace('.mp4', '.jpg')}")
print(f"CAPTION_FILE={ep / 'caption_post.txt'}")
print(f"SOURCES_FILE={ep / 'sources_comment.txt'}")
if story_url:
    print(f"STORY_URL={story_url}")
