#!/usr/bin/env python3
"""Pre-post gate for auto-posting. Usage: python3 tools/prepost_check.py episodes/<id>

Prints PASS (exit 0) only if every mechanical check passes, and writes
  episodes/<id>/caption_post.txt     caption for Instagram (no Sources block), cleaned of invisible chars/dashes
  episodes/<id>/sources_comment.txt  the Sources block for the first comment
Also lints the caption (tools/ig/check_caption.py) and prints STORY_URLS (in posting order) when every story part is valid and hosted.
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

# story parts (optional: a broken story never blocks the reel)
story_urls = []
sj = ep / "story.json"
if sj.exists():
    parts = json.loads(sj.read_text())
    urls = meta.get("story_urls", [])
    ok = len(urls) == len(parts)
    if not ok:
        warns.append("story: meta.json story_urls don't match story.json (re-run finish_episode.py); skip the story")
    for prt, url in zip(parts, urls):
        f = ep / prt["file"]
        if not f.exists():
            warns.append(f"story: {prt['file']} missing"); ok = False; continue
        if prt["kind"] == "video":
            pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", str(f)], capture_output=True, text=True)
            si = json.loads(pr.stdout or "{}")
            sv = [x for x in si.get("streams", []) if x.get("codec_type") == "video"]
            sd = float(si.get("format", {}).get("duration", 0))
            if not sv or (sv[0].get("width"), sv[0].get("height")) != (1080, 1920) or not 3 <= sd <= 60:
                warns.append(f"story: {prt['file']} not 1080x1920 / 3-60 s ({sd:.1f}s)"); ok = False
        else:
            from PIL import Image
            im = Image.open(f)
            if im.format != "JPEG" or im.size != (1080, 1920) or f.stat().st_size > 8_000_000:
                warns.append(f"story: {prt['file']} must be a 1080x1920 JPEG under 8 MB"); ok = False
        code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-I", "--max-time", "20", url], capture_output=True, text=True).stdout
        if code != "200":
            warns.append(f"story: {url} -> {code}"); ok = False
    if ok:
        story_urls = urls
    else:
        warns.append("story: skipping the story today; the reel can still post")
else:
    warns.append("story: no story.json (tools/make_story.py); the reel can still post")

# length (Edu, 29 Oct 2026: 30-s reels were too thin; back to 45-60 s)
if mp4.exists() and (dur < 42 or dur > 62):
    warns.append(f"reel is {dur:.0f}s; the target is 45-60 s (RUNBOOK §2)")

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
if story_urls:
    print("STORY_URLS=" + ",".join(story_urls))
