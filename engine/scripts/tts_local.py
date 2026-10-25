#!/usr/bin/env python3
"""Free, offline voice: Kokoro-82M (Apache-2.0) via kokoro-onnx, with estimated word timings.

Usage:
  python3 tts_local.py episodes/<slug>/script.txt --out episodes/<slug> [--voice af_heart] [--speed 1.05]

First run downloads the model (~350 MB) from the kokoro-onnx GitHub releases into ~/.cache/kokoro.
Requires: pip install kokoro-onnx soundfile numpy

Timing: each sentence is voiced separately (exact sentence boundaries); inside a sentence, word
times are allocated by phoneme count and snapped to the nearest dip in loudness. Typical error is
well under 0.1 s, which is fine for captions and beats. ElevenLabs (tts_elevenlabs.py) gives exact
timings and more voices if you have a key.
"""
import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]
SR = 24000
GAP = {".": 0.30, "?": 0.34, "!": 0.30, ":": 0.22, ";": 0.22}


def ensure_model(cache: Path):
    cache.mkdir(parents=True, exist_ok=True)
    for f in FILES:
        p = cache / f
        if not p.is_file() or p.stat().st_size < 1000:
            print(f"downloading {f} …")
            urllib.request.urlretrieve(MODEL_URL + f, p)
    return cache / FILES[0], cache / FILES[1]


def split_sentences(text):
    text = " ".join(text.split())
    parts = re.findall(r"[^.?!]+[.?!]+[\"')\]]*|[^.?!]+$", text)
    return [p.strip() for p in parts if p.strip()]


def rms_env(x, hop=240):  # 10 ms frames at 24 kHz
    n = len(x) // hop
    if n == 0:
        return np.zeros(1)
    fr = x[: n * hop].reshape(n, hop)
    return np.sqrt((fr ** 2).mean(axis=1) + 1e-12)


def trim(x, thr_db=-42):
    env = rms_env(x)
    db = 20 * np.log10(env / (env.max() + 1e-9) + 1e-9)
    voiced = np.where(db > thr_db)[0]
    if len(voiced) == 0:
        return x
    a = max(0, voiced[0] - 2) * 240
    b = min(len(x), (voiced[-1] + 3) * 240)
    return x[a:b]


def word_weights(words, phonemize):
    w = []
    for word in words:
        core = re.sub(r"[^\w'’-]", "", word)
        ph = phonemize(core) if core else ""
        n = max(1, len(ph.replace(" ", "")))
        pause = 0.0
        if re.search(r"[,;:—–]$", word):
            pause = 4.0  # a comma costs roughly four phonemes of time
        w.append((n, pause))
    return w


def align_sentence(words, audio, phonemize):
    """Return [(start_s, end_s)] for each word within this sentence's audio."""
    dur = len(audio) / SR
    ww = word_weights(words, phonemize)
    total = sum(n + p for n, p in ww)
    t, spans = 0.0, []
    for n, p in ww:
        s = t
        e = s + dur * n / total
        spans.append([s, e])
        t = e + dur * p / total
    # Snap each internal boundary to a nearby dip in loudness: minimise
    # (normalised loudness) + (distance from the phoneme-based guess), keeping words in order
    # and at least 70 ms long. Searching ±160 ms catches most real word gaps.
    env = rms_env(audio)
    env = np.convolve(env, np.ones(3) / 3, mode="same")
    norm_env = env / (np.percentile(env, 95) + 1e-9)
    starts = [s for s, _ in spans]
    for i in range(1, len(starts)):
        guess = starts[i]
        lo_t = max(starts[i - 1] + 0.07, guess - 0.16)
        hi_t = min(dur - 0.05, guess + 0.16, (starts[i + 1] - 0.07) if i + 1 < len(starts) else dur)
        lo, hi = int(lo_t * 100), int(hi_t * 100)
        if hi <= lo:
            continue
        ks = np.arange(lo, hi + 1)
        cost = norm_env[ks] + 0.9 * np.abs(ks / 100 - guess) / 0.16
        starts[i] = ks[int(np.argmin(cost))] / 100
    out = []
    for i, s in enumerate(starts):
        e = spans[i][1]
        if i + 1 < len(starts):
            e = min(max(e, s + 0.07), starts[i + 1])
        out.append([s, max(e, s + 0.05)])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--out", required=True)
    ap.add_argument("--voice", default="af_heart", help="af_heart (best), af_bella, am_michael, bf_emma, bm_george…")
    ap.add_argument("--speed", type=float, default=1.05)
    ap.add_argument("--cache", default=str(Path.home() / ".cache" / "kokoro"))
    a = ap.parse_args()

    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        sys.exit("pip install kokoro-onnx soundfile numpy   (then re-run)")

    model, voices = ensure_model(Path(a.cache))
    k = Kokoro(str(model), str(voices))
    phonemize = lambda s: k.tokenizer.phonemize(s, "en-us")  # noqa: E731

    sentences = split_sentences(Path(a.script).read_text())
    chunks, captions, t0 = [], [], 0.0
    lead = np.zeros(int(0.08 * SR), dtype=np.float32)
    chunks.append(lead)
    t0 = len(lead) / SR
    for si, sent in enumerate(sentences):
        samples, sr = k.create(sent, voice=a.voice, speed=a.speed, lang="en-us")
        assert sr == SR, sr
        audio = trim(np.asarray(samples, dtype=np.float32))
        words = sent.split()
        spans = align_sentence(words, audio, phonemize)
        for w, (s, e) in zip(words, spans):
            captions.append({"text": (" " if captions else "") + w, "startMs": round((t0 + s) * 1000),
                             "endMs": round((t0 + e) * 1000), "timestampMs": None, "confidence": None})
        chunks.append(audio)
        gap = GAP.get(sent.rstrip("\"')]")[-1], 0.25) if si < len(sentences) - 1 else 0.15
        chunks.append(np.zeros(int(gap * SR), dtype=np.float32))
        t0 += len(audio) / SR + gap
        print(f"  {si + 1}/{len(sentences)}  {len(audio) / SR:5.2f}s  {sent[:60]}")

    full = np.concatenate(chunks)
    full = full / (np.abs(full).max() + 1e-9) * 0.89  # peak-normalise to about −1 dBFS
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    wav = out / "voice.wav"
    sf.write(wav, full, SR)
    (out / "words.json").write_text(json.dumps(captions, indent=1))
    dur = len(full) / SR
    print(f"OK  {len(captions)} words, {dur:.1f}s, {len(captions) / dur * 60:.0f} wpm → {wav}, words.json")


if __name__ == "__main__":
    main()
