#!/usr/bin/env python3
"""Weekly Instagram stats review (method adapted from Jake Schincariol's /ig-audit, MIT).

Usage
  python3 tools/ig_stats.py insights/raw/<YYYY-MM-DD>.json [--asof YYYY-MM-DD] [--followers N]

Input: the rows returned by the Windsor get_data call in RUNBOOK-weekly.md (the whole {"status":..,"data":[..]} object
or just the list). Output:
  insights/history.json            every reel's latest numbers + a snapshot per pull (+ follower counts)
  insights/weekly/<asof>.md        the report: ranking by outlier multiple, hook grade, what separates top from bottom
Raw views mostly measure follower count, so reels are ranked by the OUTLIER MULTIPLE (views / the account's own median),
graded on the 3-second skip rate (the hook's grade) and on shares/saves per reach (the strongest signals a viewer gives).
Reels younger than 3 days are listed as "too early".
"""
import argparse, datetime, json, re, statistics
from pathlib import Path
from zoneinfo import ZoneInfo

root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("raw")
ap.add_argument("--asof", default=datetime.date.today().isoformat())
ap.add_argument("--followers", type=int)
ap.add_argument("--min-age", type=float, default=3.0)
a = ap.parse_args()
asof = datetime.date.fromisoformat(a.asof)
LON = ZoneInfo("Europe/London")

raw = json.loads(Path(a.raw).read_text())
rows = raw.get("data", raw) if isinstance(raw, dict) else raw
rows = [r for r in rows if r.get("media_id") and (r.get("media_type") in (None, "REELS", "VIDEO"))]

# ---- history ----
hp = root / "insights" / "history.json"
hist = json.loads(hp.read_text()) if hp.exists() else {"media": {}, "followers": {}}
METRICS = ["media_views", "media_reach", "media_reel_skip_rate", "media_reel_avg_watch_time", "media_shares", "media_saved",
           "media_like_count", "media_comments_count"]
for r in rows:
    m = hist["media"].setdefault(r["media_id"], {"snapshots": {}})
    m.update({k: v for k, v in r.items() if k not in METRICS})
    m["latest"] = {k: r.get(k) for k in METRICS}
    m["snapshots"][a.asof] = m["latest"]
if a.followers is not None:
    hist["followers"][a.asof] = a.followers
hp.parent.mkdir(exist_ok=True)
hp.write_text(json.dumps(hist, indent=1, sort_keys=True))

# ---- join with our episodes ----
NUMWORDS = r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|million|billion|trillion)\b"
eps = {}
for mp in root.glob("episodes/*/meta.json"):
    meta = json.loads(mp.read_text())
    mid = meta.get("instagram_media_id")
    if not mid:
        continue
    ep = mp.parent
    script = (ep / "script.txt").read_text() if (ep / "script.txt").exists() else ""
    first = re.split(r"(?<=[.?!])\s", script.strip(), maxsplit=1)[0] if script else ""
    words = json.loads((ep / "words.json").read_text()) if (ep / "words.json").exists() else []
    dur = words[-1]["endMs"] / 1000 + 1.0 if words else None
    review = (ep / "review.md").read_text() if (ep / "review.md").exists() else ""
    sc = re.search(r"Scores 1.5:\s*(.+)", review)
    eps[mid] = {"id": ep.name, "channel": meta.get("channel"), "topic": meta.get("topic"), "hook": first, "dur": dur,
                "sources_comment": bool(meta.get("sources_comment_id")), "scores": sc.group(1).strip() if sc else ""}

def fnum(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0

# age is measured from now when reviewing today, else from the end of the --asof day
ref = datetime.datetime.now(LON) if asof == datetime.datetime.now(LON).date() else datetime.datetime.combine(asof, datetime.time(23, 59), LON)
reels = []
for mid, m in hist["media"].items():
    L = m.get("latest", {})
    ts = m.get("timestamp", "")
    try:
        t = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S%z")
    except ValueError:
        continue
    e = eps.get(mid, {})
    hook = e.get("hook") or (m.get("media_caption") or "").split("\n")[0]
    reach = fnum(L.get("media_reach"))
    comments = fnum(L.get("media_comments_count")) - (1 if e.get("sources_comment") else 0)
    tl = t.astimezone(LON)
    reels.append({
        "mid": mid, "id": e.get("id", "(posted outside the pipeline)"), "channel": e.get("channel", "?"),
        "posted": tl, "age": (ref - tl).total_seconds() / 86400,
        "hook": hook, "dur": e.get("dur"), "scores": e.get("scores", ""),
        "views": fnum(L.get("media_views")), "reach": reach, "skip": fnum(L.get("media_reel_skip_rate")),
        "watch": fnum(L.get("media_reel_avg_watch_time")) / 1000, "shares": fnum(L.get("media_shares")),
        "saves": fnum(L.get("media_saved")), "likes": fnum(L.get("media_like_count")), "comments": max(0.0, comments),
        "permalink": m.get("media_permalink", ""),
        "q": "?" in hook, "num": bool(re.search(r"\d|" + NUMWORDS, hook, re.I)), "hook_words": len(hook.split()),
    })
for r in reels:
    r["watch_pct"] = r["watch"] / r["dur"] if r["dur"] else None
    k = r["reach"] / 1000 if r["reach"] else None
    r["sends_k"] = r["shares"] / k if k else 0
    r["saves_k"] = r["saves"] / k if k else 0
    r["eng_k"] = (r["likes"] + r["comments"]) / k if k else 0

mature = [r for r in reels if r["age"] >= a.min_age]
young = [r for r in reels if r["age"] < a.min_age]
med = statistics.median([r["views"] for r in mature]) if mature else 0
for r in reels:
    r["mult"] = r["views"] / med if med else 0
mature.sort(key=lambda r: (r["mult"], r["sends_k"]), reverse=True)

def pct(x):
    return f"{100 * x:.0f}%" if x is not None else "-"

lines = [f"# Instagram review, {a.asof}", ""]
fol = hist.get("followers", {})
if fol:
    ds = sorted(fol)
    ch = f" ({fol[ds[-1]] - fol[ds[-2]]:+d} since {ds[-2]})" if len(ds) > 1 else ""
    lines.append(f"Followers: {fol[ds[-1]]}{ch}")
lines += [f"Reels judged: {len(mature)} (posted ≥ {a.min_age:g} days ago) · too early: {len(young)} · median views {med:.0f}", "",
          "Ranked by outlier multiple (views ÷ the account's median). 3s skip = share of views that left within 3 s (the hook's grade).", "",
          "| # | posted | reel | hook | len | views | × median | 3s skip | avg watch | shares | saves | likes+comm /1k reach |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|"]
for i, r in enumerate(mature, 1):
    lines.append(f"| {i} | {r['posted']:%a %d %b %H:%M} | {r['id']} ({r['channel']}) | {r['hook'][:90]} | {(str(round(r['dur'])) + 's') if r['dur'] else '-'} | {r['views']:.0f} | "
                 f"{r['mult']:.1f}× | {pct(r['skip'])} | {r['watch']:.1f}s ({pct(r['watch_pct'])}) | {r['shares']:.0f} | {r['saves']:.0f} | {r['eng_k']:.0f} |")
if young:
    lines += ["", "Too early to judge: " + "; ".join(f"{r['id']} ({r['views']:.0f} views after {r['age']:.1f} days, {pct(r['skip'])} skip)" for r in young)]

# ---- what separates top from bottom ----
lines += ["", "## Signals (computed; interpret with the sample size in mind)", ""]
def group(name, key):
    known = [r for r in mature if key(r) is not None]
    yes = [r for r in known if key(r)]
    no = [r for r in known if not key(r)]
    if not yes or not no:
        return f"- {name}: all {len(mature)} reels on one side, nothing to compare."
    f = lambda g: f"median {statistics.median([x['views'] for x in g]):.0f} views, {pct(statistics.median([x['skip'] for x in g]))} skip (n={len(g)})"
    warn = "  ← n too small" if min(len(yes), len(no)) < 3 else ""
    return f"- {name}: yes → {f(yes)}; no → {f(no)}{warn}"
if len(mature) >= 2:
    lines.append(group("hook states a number", lambda r: r["num"]))
    lines.append(group("hook is a question", lambda r: r["q"]))
    lines.append(group("crypto/Sonar topic", lambda r: None if r["channel"] == "?" else r["channel"] in ("crypto", "sonar")))
    lines.append(group("posted before 12:00 London", lambda r: r["posted"].hour < 12))
    lines.append(group("longer than 55 s", lambda r: None if not r["dur"] else r["dur"] > 55))
    if len(mature) >= 6:
        third = max(1, len(mature) // 3)
        top, bot = mature[:third], mature[-third:]
        lines.append(f"- top third vs bottom third: 3s skip {pct(statistics.median([r['skip'] for r in top]))} vs "
                     f"{pct(statistics.median([r['skip'] for r in bot]))}; avg watch {statistics.median([r['watch'] for r in top]):.1f}s vs "
                     f"{statistics.median([r['watch'] for r in bot]):.1f}s; shares/1k reach {statistics.median([r['sends_k'] for r in top]):.1f} vs "
                     f"{statistics.median([r['sends_k'] for r in bot]):.1f}")
    zero = sum(1 for r in mature if r["shares"] == 0)
    lines.append(f"- reels with zero shares: {zero} of {len(mature)}")
lines += ["", "Next: update insights/learnings.md from this (RUNBOOK-weekly.md §3)."]

out = root / "insights" / "weekly" / f"{a.asof}.md"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text("\n".join(lines) + "\n")
print("\n".join(lines))
print(f"\nwrote {out}")
