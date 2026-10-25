#!/usr/bin/env python3
"""Word-level transcript of an existing voiceover (your own recording).

Usage: python3 transcribe_words.py episodes/<slug>/voice.mp3 --out episodes/<slug> [--engine auto|elevenlabs|faster-whisper|whisper]

Writes <out>/words.json (Remotion Caption[]). Engines, in 'auto' order:
  1. ElevenLabs speech-to-text (if ELEVENLABS_API_KEY is set)
  2. faster-whisper (pip install faster-whisper)
  3. openai-whisper (pip install openai-whisper)
"""
import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import load_env  # noqa: E402


def caption(i, text, s, e):
    return {"text": (" " if i else "") + text.strip(), "startMs": round(s * 1000), "endMs": round(e * 1000),
            "timestampMs": None, "confidence": None}


def eleven(path, key):
    boundary = uuid.uuid4().hex
    fname = Path(path).name
    ctype = mimetypes.guess_type(fname)[0] or "audio/mpeg"
    parts = []
    for name, val in [("model_id", "scribe_v1"), ("timestamps_granularity", "word"), ("tag_audio_events", "false")]:
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{fname}"\r\n'
                 f"Content-Type: {ctype}\r\n\r\n".encode() + Path(path).read_bytes() + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=b"".join(parts), method="POST",
                                 headers={"xi-api-key": key, "Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read())
    ws = [w for w in data.get("words", []) if w.get("type", "word") == "word"]
    return [caption(i, w["text"], w["start"], w["end"]) for i, w in enumerate(ws)]


def faster(path):
    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", compute_type="int8")
    segs, _ = model.transcribe(path, word_timestamps=True, language="en")
    ws = [w for s in segs for w in s.words]
    return [caption(i, w.word, w.start, w.end) for i, w in enumerate(ws)]


def openai_whisper(path):
    import whisper
    res = whisper.load_model("small.en").transcribe(path, word_timestamps=True, language="en")
    ws = [w for s in res["segments"] for w in s.get("words", [])]
    return [caption(i, w["word"], w["start"], w["end"]) for i, w in enumerate(ws)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--out", required=True)
    ap.add_argument("--engine", default="auto")
    a = ap.parse_args()
    load_env()
    key = os.environ.get("ELEVENLABS_API_KEY")

    order = [a.engine] if a.engine != "auto" else (["elevenlabs"] if key else []) + ["faster-whisper", "whisper"]
    words, errors = None, []
    for eng in order:
        try:
            words = {"elevenlabs": lambda: eleven(a.audio, key), "faster-whisper": lambda: faster(a.audio),
                     "whisper": lambda: openai_whisper(a.audio)}[eng]()
            if words:
                print(f"engine: {eng}")
                break
        except Exception as e:  # try the next engine
            errors.append(f"{eng}: {e}")
    if not words:
        sys.exit("No transcription engine worked:\n  " + "\n  ".join(errors) +
                 "\nInstall one: pip install faster-whisper   (or set ELEVENLABS_API_KEY)")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "words.json").write_text(json.dumps(words, indent=1))
    print(f"OK  {len(words)} words → {out}/words.json")


if __name__ == "__main__":
    main()
