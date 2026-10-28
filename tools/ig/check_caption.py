#!/usr/bin/env python3
"""Caption check for the reels pipeline: Jake Schincariol's caption linter + humanizer, tuned for a crypto account.

Usage
  python3 tools/ig/check_caption.py episodes/<id>/caption.txt          # report only
  python3 tools/ig/check_caption.py episodes/<id>/caption.txt --fix    # also apply the safe fixes in place

Only the part above the "Sources:" block is linted (that part is the Instagram caption; Sources go in the first comment).

Safe fixes (applied with --fix, and always applied by tools/prepost_check.py to what gets posted):
  invisible characters (zero-width, BOM, NBSP...), em/en dashes, curly quotes, ellipsis characters.
NOT auto-applied: the slop-word replacements. They are listed for a human-style rewrite, because in crypto some of them
change the meaning (an exchange "hack" is not a "trick", a token "unlock" is not a "get", Ethereum's "Beacon" chain...).

Exit 1 (and "CAPTION: FIX") if anything hard fails: over 2,200 characters, more than 5 hashtags, a first line that is blank
or opens on a hashtag/mention, or leftover invisible characters / em dashes (when not run with --fix).
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import caption as cap      # noqa: E402  (vendored, MIT, unchanged)
import humanize as hum     # noqa: E402  (vendored, MIT, unchanged)
import detect as det       # noqa: E402  (vendored, MIT, unchanged)

# words in slop.json that are real terms in crypto: never flag them
ALLOW = {"hack", "unlock", "beacon", "ecosystem", "thus"}
SOURCES_RE = re.compile(r"\n\s*Sources:", re.I)


def split(text):
    parts = SOURCES_RE.split(text, maxsplit=1)
    post = parts[0].strip()
    sources = ("Sources:" + parts[1]).strip() if len(parts) > 1 else ""
    return post, sources


def safe_clean(text, lex=None):
    """Invisible-character and typography passes only. Returns (text, hits)."""
    lex = lex or hum.load_lexicon(str(HERE / "slop.json"))
    t, urls = hum.protect_urls(text)
    t, inv = hum.pass_invisible(t, lex)
    t, typo = hum.pass_typographic(t, lex)
    t = hum.restore_urls(t, urls)
    return t.strip(), inv + typo


def check(post, lex=None):
    """Lint the caption (post part). Returns dict with fails, warns, info."""
    lex = lex or hum.load_lexicon(str(HERE / "slop.json"))
    fails, warns, info = [], [], []
    a = cap.analyse(post)
    for c in a["checks"]:
        line = f"{c['check']}: {c['detail']}"
        (fails if c["status"] == "FAIL" else warns if c["status"] == "WARN" else info).append(line)
    # machine fingerprints that should never ship
    _, inv = hum.pass_invisible(post, lex)
    if inv:
        fails.append("invisible characters: " + ", ".join(f"{h['count']}x {h['name']}" for h in inv))
    if "—" in post or "–" in post:
        fails.append("em/en dash in the caption (run with --fix)")
    # slop words: dry run on a copy, minus crypto terms
    _, lexi = hum.pass_lexical(post, lex)
    for h in lexi:
        if h["find"].lower() in ALLOW:
            continue
        warns.append(f"stock phrase '{h['find']}' x{h['count']} (plainer: '{h['replace']}')")
    for s in hum.scan_structures(post, lex):
        if s["name"].startswith("Hashtag wall"):
            continue  # the HASHTAGS check above already enforces Instagram's cap of 5
        warns.append(f"{s['name']}: {s['fix']}")
    res, overall, verdict = det.run(post, lex)
    info.append(f"human score {overall:.0f} ({verdict}); weakest: {min(det.CHECKS, key=lambda k: res[k][0])}")
    return {"fails": fails, "warns": warns, "info": info, "visible": a["visible"], "hashtags": a["hashtags"]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("caption")
    ap.add_argument("--fix", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    p = Path(args.caption)
    text = p.read_text(encoding="utf-8")
    lex = hum.load_lexicon(str(HERE / "slop.json"))
    if args.fix:
        cleaned, hits = safe_clean(text, lex)
        if cleaned != text.strip():
            p.write_text(cleaned + "\n", encoding="utf-8")
            text = cleaned
        if hits:
            print("fixed: " + ", ".join(f"{h['count']}x {h['name']}" for h in hits))
    post, sources = split(text)
    r = check(post, lex)
    if not sources:
        r["warns"].append("no 'Sources:' block (needed for the first comment)")
    if args.json:
        print(json.dumps(r, indent=2, ensure_ascii=False))
    else:
        print("WHAT THE FEED SHOWS before '... more':\n  " + r["visible"].replace("\n", "\n  "))
        for f in r["fails"]:
            print("FAIL  " + f)
        for w in r["warns"]:
            print("WARN  " + w)
        for i in r["info"]:
            print("ok    " + i)
        print("CAPTION: " + ("FIX" if r["fails"] else "OK"))
    sys.exit(1 if r["fails"] else 0)


if __name__ == "__main__":
    main()
