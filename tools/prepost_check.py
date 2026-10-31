#!/usr/bin/env python3
"""Pre-post gate for auto-posting. Usage: python3 tools/prepost_check.py episodes/<id> [--approved]

--approved: Edu said "post it" for this episode in the session. Skips only the auto-post switch and the
one-auto-post-per-day limit (a second is allowed for a midday breaking story) and the 3-breaking-reels-per-week cap; every other check still runs and must pass.

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
approved = "--approved" in sys.argv[2:]
ep = Path(sys.argv[1])
ep = ep if ep.is_absolute() else (root / ep)
ep = ep.resolve()
eid = ep.name
fails = []
warns = []

flag = json.loads((root / "channels" / "autopost.json").read_text())
if not flag.get("enabled") and not approved:
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
if meta.get("superseded_by"):
    fails.append(f"superseded by {meta['superseded_by']}; don't post")

# one auto-post per London day; a second only for a midday breaking story when the first one wasn't breaking
# (Edu, 31 Oct 2026). And not just news: at most 3 breaking reels in any 7 days, the rest come from the plan/backlog.
now_l = datetime.datetime.now(ZoneInfo("Europe/London"))
today = now_l.date().isoformat()
try:
    this_src = json.loads((ep / "storyboard.json").read_text()).get("topic_source", "plan")
except Exception:
    this_src = "plan"
posted_today, breaking_7d = [], []
for m in root.glob("episodes/*/meta.json"):
    if m.parent == ep:
        continue
    o = json.loads(m.read_text())
    pa = str(o.get("posted_at", ""))
    if not o.get("posted") or not pa:
        continue
    try:
        pdt = datetime.datetime.fromisoformat(pa.replace("Z", "+00:00")).astimezone(ZoneInfo("Europe/London"))
    except ValueError:
        continue
    if o.get("auto_posted") and pdt.date().isoformat() == today:
        posted_today.append((m.parent.name, o.get("topic_source", "plan")))
    if o.get("topic_source") == "breaking" and (now_l - pdt).days < 7:
        breaking_7d.append(m.parent.name)
if not approved:
    second_ok = this_src == "breaking" and len(posted_today) == 1 and posted_today[0][1] != "breaking"
    if posted_today and not second_ok:
        fails.append(f"already auto-posted today ({', '.join(n for n, _ in posted_today)})")
    if this_src == "breaking" and len(breaking_7d) >= 3:
        fails.append(f"already 3 breaking-news reels in the last 7 days ({', '.join(breaking_7d)}); use the plan/backlog")

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

# format variety (Edu, 31 Oct 2026: "I don't want you to use the same exact format every single time")
def _fmt(epdir):
    try:
        m = json.loads((epdir / "meta.json").read_text())
    except Exception:
        m = {}
    try:
        sbj = json.loads((epdir / "storyboard.json").read_text())
    except Exception:
        sbj = {}
    if m.get("format") or sbj.get("format"):
        return m.get("format") or sbj.get("format")
    comps = [x.get("component") for x in sbj.get("scenes", [])]
    if sbj.get("chapters"):
        return "breakdown"
    if "Character3D" in comps:
        return "character"
    if comps.count("Shot") >= 4:
        return "documentary"
    return "motion"

_sb_here = json.loads((ep / "storyboard.json").read_text()) if (ep / "storyboard.json").exists() else {}
if not _sb_here.get("format"):
    fails.append('storyboard.json has no "format" (pick one for the concept: engine/SKILL.md "Pick the format for the concept")')
else:
    _prev = []
    for d in (root / "episodes").iterdir():
        if d == ep or not d.is_dir() or d.name.startswith("_"):
            continue
        try:
            pm = json.loads((d / "meta.json").read_text())
        except Exception:
            continue
        if pm.get("posted") and pm.get("posted_at"):
            _prev.append((pm["posted_at"], d))
    _prev.sort(reverse=True)
    if _prev:
        last_fmt = _fmt(_prev[0][1])
        recent = [_fmt(d) for _, d in _prev[:3]]
        if last_fmt == _sb_here["format"]:
            msg = f'format "{last_fmt}" is the same as the last posted reel ({_prev[0][1].name}); pick a different one'
            (warns if approved else fails).append(msg)
        elif recent.count(_sb_here["format"]) >= 2:
            print(f'WARN format "{_sb_here["format"]}" used {recent.count(_sb_here["format"])}x in the last 3 reels')

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

# length + variety (Edu, 29 Oct 2026: 45-60 s with real substance; no timeline filler; no "Illustration" labels)
if mp4.exists() and not 40 <= dur <= 70:
    warns.append(f"reel is {dur:.0f}s; the target is 45-60 s (RUNBOOK §2)")
if (ep / "storyboard.json").exists():
    sb = json.loads((ep / "storyboard.json").read_text())
    comps = [x["component"] for x in sb.get("scenes", [])]
    if comps.count("Ruler") > 1:
        warns.append(f"{comps.count('Ruler')} timelines; max 1 (RUNBOOK §2)")
    labels = sum(1 for x in sb.get("scenes", []) if "llustration" in json.dumps(x.get("props", {})))
    if labels:
        warns.append(f"{labels} 'Illustration' captions; obvious graphics shouldn't have one")
    runs = [c for i, c in enumerate(comps) if not (c == "Iso3D" and i > 0 and comps[i - 1] == "Iso3D")]  # one world = one shot
    over = sorted({c for c in runs if runs.count(c) > 3})
    if over:
        warns.append(f"components in more than 3 scenes: {', '.join(over)}")

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
