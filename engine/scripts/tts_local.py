#!/usr/bin/env python3
"""Free, offline voice: Kokoro-82M (Apache-2.0) via kokoro-onnx, with estimated word timings.

Usage:
  python3 tts_local.py episodes/<slug>/script.txt --out episodes/<slug> [--voice af_heart] [--speed 1.05]

Several voices: start a script line with a speaker tag, e.g. "[stonks] Genius!", and give each speaker a voice in
<out>/cast.json (or --cast): {"stonks": {"voice": "am_puck", "speed": 1.1}, "suit": {"voice": "bm_george"}}. Untagged lines
are the narrator (--voice). The tags are not spoken or captioned; words.json marks those words with "speaker", and
speech.json lists every sentence with its speaker and times (for mouth movement).
A cast entry can also bend its voice into a cartoon sound: "pitch" (2.0 = an octave up), "glide" (rises through the line),
"hold" (seconds: holds the last vowel, "GET OUUUT!"), "rasp" and "bite" (rage), "drive" (overdrive) and "thin" (cut the low end, in
Hz), e.g. {"voice": "bm_george", "speed": 0.5, "pitch": 2.8, "hold": 1.0, "drive": 9}. See voice_fx().
A cast entry with "file" (e.g. {"file": "sfx/getout.mp3", "voice": "bm_george"}) plays that recording as the line instead of
voicing it (the words still get captions and timings); the file comes from <repo>/local-assets/ or the `media` branch, and
the entry's voice settings are the fallback if it can't be loaded.
A line that is only "[pause 2]" adds that many seconds of silence after the sentence before it (max 5): room for a picture
gag with no talking over it (Stonks jumping and clapping, a sound effect, a door slamming).

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
SAY = {}
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
        core = SAY.get(core, core)
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


def _wsola(x, rate_at, n_win=1024, hop=256, tol=160):
    """Stretch time without changing pitch (overlap-add with waveform matching). rate_at(i) = how much longer the sound
    around input sample i should become (1 = unchanged, 4 = four times as long)."""
    win = np.hanning(n_win).astype(np.float32)
    n = len(x)
    cap = int(n * 8) + n_win * 2
    y = np.zeros(cap, dtype=np.float32)
    wsum = np.zeros(cap, dtype=np.float32)
    pos, prev, k = 0.0, None, 0
    while int(pos) + n_win + tol < n and (k * hop + n_win) < cap:
        ideal = int(pos)
        if prev is None or prev + hop + n_win > n:
            at = ideal
        else:
            ref = x[prev + hop: prev + hop + n_win]
            lo, hi = max(0, ideal - tol), min(n - n_win, ideal + tol)
            at = lo + int(np.argmax(np.correlate(x[lo: hi + n_win], ref, "valid")))
        y[k * hop: k * hop + n_win] += x[at: at + n_win] * win
        wsum[k * hop: k * hop + n_win] += win
        prev, k = at, k + 1
        pos += hop / max(1.0, float(rate_at(ideal)))
    end = max(n_win, (k - 1) * hop + n_win)
    return y[:end] / np.maximum(wsum[:end], 1e-3)


def voice_fx(audio, pitch=1.0, glide=0.0, drive=0.0, thin=0.0, hold=0.0, rasp=0.0, bite=0.0):
    """Turn a voiced line into a cartoon sound (Edu, 17 Nov 2026: "a squeaky, mad kind of voice... like a sound effect";
    then "higher and angrier and longer").
    pitch: resampling factor (2.0 = an octave up and twice as fast: set the cast entry's speed lower to compensate);
    glide: how much further the pitch climbs by the end of the line (0.25 = a rising shriek);
    hold:  seconds added by holding the loudest vowel of the line's second half ("GET OUUUUT!");
    rasp:  0-1, a fast flutter in the loudness that reads as rage; bite: dB of boost around 3 kHz (harsh);
    drive: overdrive, 0-10 (the voice breaks up as if shouted into a cheap microphone);
    thin:  cut everything below this many Hz (300 = small and tinny)."""
    x = np.asarray(audio, dtype=np.float32)
    if len(x) < 2048:
        return x
    if hold > 0:
        # the vowel to hold: the longest loud run in the last two thirds of the line
        w = int(0.02 * SR)
        env = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same"))
        s0 = int(len(x) * 0.33)
        loud = env[s0:] > 0.5 * env[s0:].max()
        best, run, start = (0, 0), 0, 0
        for i, v in enumerate(np.append(loud, False)):
            if v and run == 0:
                start = i
            run = run + 1 if v else 0
            if run > best[1] - best[0]:
                best = (start, start + run)
        a0, a1 = s0 + best[0], s0 + best[1]
        c0, c1 = a0 + int((a1 - a0) * 0.25), a0 + int((a1 - a0) * 0.8)
        if c1 - c0 > 256:
            extra = hold * pitch * (1 + glide / 2) * SR  # in input samples: the pitch change shrinks it again
            factor = (c1 - c0 + extra) / (c1 - c0)
            x = _wsola(x, lambda i: factor if c0 <= i < c1 else 1.0)
    n = len(x)
    if pitch != 1.0 or glide:
        out_n = max(16, int(n / (pitch * (1 + glide / 2))))
        rate = pitch * (1 + glide * np.linspace(0.0, 1.0, out_n))
        pos = np.cumsum(rate) - rate[0]
        pos = pos[pos < n - 1]
        x = np.interp(pos, np.arange(n), x).astype(np.float32)
    if rasp:
        t = np.arange(len(x)) / SR
        flutter = 0.5 * (1 + np.sin(2 * np.pi * 71 * t + 1.7 * np.sin(2 * np.pi * 9 * t)))
        x = (x * (1 - float(rasp) * 0.7 * flutter)).astype(np.float32)
    if thin or bite:
        X = np.fft.rfft(x)
        fr = np.fft.rfftfreq(len(x), 1 / SR)
        if thin:
            X *= 1.0 / np.sqrt(1.0 + (thin / np.maximum(fr, 1e-6)) ** 6)
        if bite:
            X *= 1.0 + (10 ** (bite / 20) - 1) * np.exp(-0.5 * ((np.log2(np.maximum(fr, 1.0) / 3000.0)) / 0.6) ** 2)
        x = np.fft.irfft(X, len(x)).astype(np.float32)
    if drive:
        m = float(np.abs(x).max()) or 1.0
        g = 1.0 + float(drive)
        x = (np.tanh(x / m * g) / np.tanh(g) * m).astype(np.float32)
    fade = min(len(x) // 4, int(0.03 * SR))
    x[-fade:] *= np.linspace(1.0, 0.0, fade, dtype=np.float32)
    return x


def load_clip(rel):
    """A recording used in place of a voiced line (cast entry "file", e.g. "sfx/getout.mp3"). Media never lives on main:
    look in <repo>/local-assets/ first, then fetch it from the repo's `media` branch. Returns float32 mono at SR, or None."""
    import subprocess
    root = Path(__file__).resolve().parents[2]
    local = root / "local-assets" / rel
    if not local.is_file():
        local.parent.mkdir(parents=True, exist_ok=True)
        for cmd in (["git", "-C", str(root), "show", f"origin/media:{rel}"], None):
            try:
                if cmd is None:
                    subprocess.run(["git", "-C", str(root), "fetch", "-q", "--depth", "1", "origin", "media:refs/remotes/origin/media"], check=True, timeout=120)
                    cmd = ["git", "-C", str(root), "show", f"origin/media:{rel}"]
                data = subprocess.run(cmd, check=True, capture_output=True, timeout=60).stdout
                if data:
                    local.write_bytes(data)
                    break
            except Exception:
                continue
    if not local.is_file():
        try:
            urllib.request.urlretrieve(f"https://raw.githubusercontent.com/edusancheez2005/reels/media/{rel}", local)
        except Exception:
            return None
    try:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(local), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True, timeout=60).stdout
    except Exception:
        return None
    x = np.frombuffer(raw, dtype=np.float32).copy()
    return x if len(x) > SR // 10 else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--out", required=True)
    ap.add_argument("--voice", default="af_heart", help="af_heart (best), af_bella, am_michael, bf_emma, bm_george…")
    ap.add_argument("--speed", type=float, default=1.05)
    ap.add_argument("--cache", default=str(Path.home() / ".cache" / "kokoro"))
    ap.add_argument("--say", default=None, help="JSON file {written: spoken} (e.g. {\"UST\": \"U S T\"}): respell words for the voice only; captions keep the written words")
    ap.add_argument("--gap-scale", type=float, default=1.0, help="scale the pauses between sentences (0.6 = tighter, more energetic)")
    ap.add_argument("--cast", default=None, help="JSON file {speaker: {voice, speed}} for lines tagged [speaker]; default <out>/cast.json if it exists")
    a = ap.parse_args()

    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        sys.exit("pip install kokoro-onnx soundfile numpy   (then re-run)")

    model, voices = ensure_model(Path(a.cache))
    k = Kokoro(str(model), str(voices))
    phonemize = lambda s: k.tokenizer.phonemize(s, "en-us")  # noqa: E731

    cast_file = Path(a.cast) if a.cast else Path(a.out) / "cast.json"
    cast = json.loads(cast_file.read_text()) if cast_file.is_file() else {}
    lines = []  # (speaker or None, sentence)
    pause_after = {}  # sentence index -> extra seconds of silence after it ("[pause 2]" on its own line)
    for raw in Path(a.script).read_text().splitlines():
        raw = raw.strip()
        if not raw:
            continue
        mp = re.match(r"^\[pause\s+([0-9.]+)\]$", raw, re.I)
        if mp:
            if lines:
                pause_after[len(lines) - 1] = pause_after.get(len(lines) - 1, 0.0) + min(float(mp.group(1)), 5.0)
            continue
        m = re.match(r"^\[(\w+)\]\s*(.*)$", raw)
        who, text = (m.group(1), m.group(2)) if m else (None, raw)
        if who and who not in cast:
            sys.exit(f"speaker [{who}] has no voice: add it to {cast_file}")
        lines += [(who, sn) for sn in split_sentences(text)]
    sentences = [sn for _, sn in lines]
    say = json.loads(Path(a.say).read_text()) if a.say else {}
    SAY.update(say)

    def spoken(sent):
        out = []
        for w in sent.split():
            m = re.match(r"^([\"'(]*)(.*?)([.,;:!?\"')]*)$", w)
            pre, core, post = m.groups()
            out.append(pre + say.get(core, core) + post)
        return " ".join(out)

    chunks, captions, speech, t0 = [], [], [], 0.0
    lead = np.zeros(int(0.08 * SR), dtype=np.float32)
    chunks.append(lead)
    t0 = len(lead) / SR
    for si, sent in enumerate(sentences):
        who = lines[si][0]
        voice = cast[who].get("voice", a.voice) if who else a.voice
        speed = cast[who].get("speed", a.speed) if who else a.speed
        clip = load_clip(cast[who]["file"]) if who and cast[who].get("file") else None
        if who and cast[who].get("file") and clip is None:
            print(f"  WARNING: could not load {cast[who]['file']} for [{who}]; voicing the line instead", file=sys.stderr)
        if clip is not None:
            audio = trim(clip)  # the recording is the line: no voice, no effects
        else:
            samples, sr = k.create(spoken(sent), voice=voice, speed=speed, lang="en-gb" if voice.startswith("b") else "en-us")
            assert sr == SR, sr
            audio = trim(np.asarray(samples, dtype=np.float32))
        if clip is None and who and any(cast[who].get(k_) for k_ in ("pitch", "glide", "drive", "thin", "hold", "rasp", "bite")):
            c_ = cast[who]
            audio = voice_fx(audio, **{k_: float(c_[k_]) for k_ in ("pitch", "glide", "drive", "thin", "hold", "rasp", "bite") if c_.get(k_) is not None})
        words = sent.split()
        spans = align_sentence(words, audio, phonemize)
        for w, (s, e) in zip(words, spans):
            captions.append({"text": (" " if captions else "") + w, "startMs": round((t0 + s) * 1000),
                             "endMs": round((t0 + e) * 1000), "timestampMs": None, "confidence": None})
            if who:
                captions[-1]["speaker"] = who
        speech.append({"speaker": who or "narrator", "text": sent, "startMs": round(t0 * 1000), "endMs": round((t0 + len(audio) / SR) * 1000)})
        chunks.append(audio)
        gap = GAP.get(sent.rstrip("\"')]")[-1], 0.25) * a.gap_scale if si < len(sentences) - 1 else 0.15
        gap += pause_after.get(si, 0.0)  # room for a picture gag: Stonks jumping, a door slamming
        chunks.append(np.zeros(int(gap * SR), dtype=np.float32))
        t0 += len(audio) / SR + gap
        print(f"  {si + 1}/{len(sentences)}  {len(audio) / SR:5.2f}s  {sent[:60]}")

    full = np.concatenate(chunks)
    # even out the speakers: each character line sits 1.5 dB above the narrator's median level (some voices are far louder)
    def _rms(a):
        a = a[np.abs(a) > 1e-4]
        return float(np.sqrt((a ** 2).mean())) if len(a) else 0.0
    def _span(sp):
        return slice(int(sp["startMs"] / 1000 * SR), int(sp["endMs"] / 1000 * SR))
    nar = [_rms(full[_span(sp)]) for sp in speech if sp["speaker"] == "narrator"]
    if nar and len(nar) < len(speech):
        target = float(np.median(nar)) * 10 ** (1.5 / 20)
        for sp in speech:
            if sp["speaker"] != "narrator":
                r = _rms(full[_span(sp)])
                if r > 0:
                    # "gain_db" in the cast entry: louder or quieter than the other characters (a scream wants about +5)
                    full[_span(sp)] *= target / r * 10 ** (float(cast.get(sp["speaker"], {}).get("gain_db", 0.0)) / 20)
    full = full / (np.abs(full).max() + 1e-9) * 0.89  # peak-normalise to about −1 dBFS
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    wav = out / "voice.wav"
    sf.write(wav, full, SR)
    (out / "words.json").write_text(json.dumps(captions, indent=1))
    (out / "speech.json").write_text(json.dumps(speech, indent=1))
    dur = len(full) / SR
    print(f"OK  {len(captions)} words, {dur:.1f}s, {len(captions) / dur * 60:.0f} wpm → {wav}, words.json")


if __name__ == "__main__":
    main()
