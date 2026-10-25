"""Shared helpers for the explainer-reels scripts (stdlib only)."""
import json
import os
import re
from pathlib import Path

FPS = 30


def load_env():
    """Load KEY=VALUE lines from .env files in common places into os.environ (no overwrite)."""
    for p in [Path.cwd() / ".env", Path.cwd() / "reel-studio" / ".env", Path.cwd().parent / "reel-studio" / ".env"]:
        if p.is_file():
            for line in p.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def norm(token: str) -> str:
    """Normalise a word for anchor matching: lowercase, letters/digits only (keeps apostrophes out)."""
    return re.sub(r"[^0-9a-z]+", "", token.lower())


def read_words(path):
    words = json.loads(Path(path).read_text())
    if not isinstance(words, list) or not words:
        raise SystemExit(f"{path}: expected a non-empty list of captions")
    for i, w in enumerate(words):
        for k in ("text", "startMs", "endMs"):
            if k not in w:
                raise SystemExit(f"{path}: word {i} missing '{k}'")
    return words


def chars_to_words(chars, starts, ends):
    """Group character-level alignment (seconds) into Remotion Caption[] (ms).

    Punctuation-only tokens are glued onto the previous word so captions read naturally.
    """
    words, cur, cur_start, cur_end = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append([cur, cur_start, cur_end])
                cur, cur_start = "", None
            continue
        if cur_start is None:
            cur_start = s
        cur += ch
        cur_end = e
    if cur:
        words.append([cur, cur_start, cur_end])

    merged = []
    for text, s, e in words:
        if merged and not norm(text):  # pure punctuation like "—" or "..."
            merged[-1][0] += text
            merged[-1][2] = e
        else:
            merged.append([text, s, e])

    return [
        {
            "text": (" " if i else "") + t,
            "startMs": round(s * 1000),
            "endMs": round(e * 1000),
            "timestampMs": None,
            "confidence": None,
        }
        for i, (t, s, e) in enumerate(merged)
    ]
