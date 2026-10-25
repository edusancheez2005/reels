#!/usr/bin/env python3
"""Tick the backlog item and write meta.json. Usage: python3 tools/finish_episode.py episodes/<id> [--channel sonar|general] [--topic "..."]"""
import argparse, datetime, json, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("--channel"); ap.add_argument("--topic")
a = ap.parse_args()
ep = (root / a.ep).resolve() if not Path(a.ep).is_absolute() else Path(a.ep)
eid = ep.name
meta_p = ep / "meta.json"
meta = json.loads(meta_p.read_text()) if meta_p.exists() else {}
meta.update({"id": eid, "channel": a.channel or meta.get("channel"), "topic": a.topic or meta.get("topic"),
             "produced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
             "video_url": f"https://github.com/edusancheez2005/reels/releases/download/ep-{eid}/{eid}.mp4",
             "posted": meta.get("posted", False)})
meta_p.write_text(json.dumps(meta, indent=2))
if meta.get("channel") and meta.get("topic"):
    bl = root / "backlog" / f"{meta['channel']}.md"
    lines = bl.read_text().splitlines()
    for i, l in enumerate(lines):
        if l.startswith("- [ ]") and meta["topic"].lower()[:40] in l.lower():
            lines[i] = l.replace("- [ ]", "- [x]", 1) + f" ({eid})"
            break
    else:
        lines.append(f"- [x] {meta['topic']} ({eid})")
    bl.write_text("\n".join(lines) + "\n")
print(json.dumps(meta, indent=2))
