#!/usr/bin/env python3
"""Sound effects for the reels, synthesised from scratch (Edu, 17 Nov 2026: "you can add like little sound effects... that'd be
quite funny"). Nothing is downloaded and nothing is sampled from anyone's recording, so there is no licence to track, and no
audio file is committed: build_timeline.py calls ensure() to write the .wav files into <studio>/public/sfx/ when they are missing.

Usage: python3 engine/scripts/make_sfx.py [out_dir]        (default reel-studio/public/sfx)

SFX = name -> (seconds, loops, default gain). Use them from a storyboard scene: "sfx": [{"name": "trombone", "beat": 2}].
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100

# name: (length in seconds, loops, default gain in the mix, what it is for)
SFX = {
    "boom": (0.9, False, 0.55, "a deep hit: a stamp landing, a number dropping"),
    "slam": (0.6, False, 0.7, "a door slamming: after 'Get out.'"),
    "clap": (2.015, True, 0.5, "one person clapping fast (loops): Stonks"),
    "applause": (2.6, False, 0.4, "a small crowd clapping: sitcom, game show, courtroom"),
    "ding": (1.2, False, 0.45, "a bell: a bright idea, a correct answer, a message arriving"),
    "buzzer": (0.6, False, 0.45, "wrong answer"),
    "cash": (0.9, False, 0.45, "a till: money arriving or leaving"),
    "trombone": (1.9, False, 0.5, "sad trombone, four falling notes: it went wrong"),
    "dun": (1.7, False, 0.5, "dun dun DUN: the turn ('One problem.')"),
    "whoosh": (0.5, False, 0.4, "a fast swish: a cut, something flying past"),
    "scratch": (0.38, False, 0.45, "a record scratch: everything stops"),
    "crickets": (2.1, True, 0.3, "crickets (loops): an awkward silence"),
    "pop": (0.14, False, 0.4, "a small pop: someone appears"),
    "rimshot": (1.3, False, 0.45, "ba-dum-tss: after a bad joke"),
    "tick": (2.0, True, 0.35, "a clock ticking (loops): a countdown"),
}


def _t(sec):
    return np.arange(int(sec * SR)) / SR


def _noise(n, seed):
    return np.random.default_rng(seed).uniform(-1.0, 1.0, n)


def _band(x, lo=None, hi=None, order=4):
    """Zero-phase band filter in the frequency domain (smooth roll-off, no extra dependency)."""
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(fr)
    if hi:
        g *= 1.0 / np.sqrt(1.0 + (fr / hi) ** (2 * order))
    if lo:
        g *= 1.0 / np.sqrt(1.0 + (lo / np.maximum(fr, 1e-6)) ** (2 * order))
    return np.fft.irfft(X * g, len(x))


def _sweep(f0, f1, sec, shape=1.0):
    """A sine whose pitch glides from f0 to f1."""
    t = _t(sec)
    k = (t / sec) ** shape
    f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def _saw(freq, sec, harmonics=14, vib=0.0):
    t = _t(sec)
    f = freq * (1 + vib * np.sin(2 * np.pi * 5.5 * t)) if np.isscalar(freq) else freq
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape)) / SR
    return sum(np.sin(n * ph) / n for n in range(1, harmonics + 1)) * 0.6


def _place(buf, x, at_sec, gain=1.0):
    i = int(at_sec * SR)
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * gain


def _fade(x, a=0.004, r=0.02):
    n = len(x)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e = np.ones(n)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def _norm(x, peak=0.85, rms=0.2):
    """Soft-limit to `peak`, then turn down until the loudness (RMS) is at most `rms`: a held note at full peak would bury
    the voice (which runs at about 0.12 RMS), a short hit would not."""
    m = np.max(np.abs(x)) or 1.0
    y = np.tanh(x / m * 1.2) / np.tanh(1.2) * peak
    r = float(np.sqrt(np.mean(y**2))) or 1e-9
    return y * min(1.0, rms / r)


def _one_clap(seed, bright=1.0):
    n = int(0.09 * SR)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    for k in range(3):  # a clap is a few tiny slaps a few ms apart
        d = int((0.0035 * k + rng.uniform(0, 0.0015)) * SR)
        b = _noise(n - d, seed * 7 + k) * np.exp(-np.arange(n - d) / (0.011 * SR))
        out[d:] += b * (1.0 if k == 0 else 0.6)
    return _band(out, lo=600 * bright, hi=2600 * bright, order=3)


def boom():
    sec = SFX["boom"][0]
    t = _t(sec)
    x = _sweep(120, 36, sec, 0.45) * np.exp(-t / 0.2)
    click = _band(_noise(len(t), 1), hi=1800) * np.exp(-t / 0.006) * 0.6
    return _norm(_fade(x + click, 0.001, 0.08))


def slam():
    sec = SFX["slam"][0]
    t = _t(sec)
    thump = _sweep(105, 48, sec, 0.5) * np.exp(-t / 0.06)
    wood = _band(_noise(len(t), 2), lo=150, hi=1300) * np.exp(-t / 0.035) * 0.9
    buf = thump + wood
    rattle = _band(_noise(int(0.12 * SR), 3), lo=1800, hi=4200) * np.exp(-_t(0.12) / 0.025) * 0.35
    _place(buf, rattle, 0.03)
    return _norm(_fade(buf, 0.001, 0.08))


def clap():
    sec = SFX["clap"][0]
    buf = np.zeros(int(sec * SR))
    rng = np.random.default_rng(11)
    for k in range(13):  # 13 claps, 155 ms apart, so the loop joins up with itself
        _place(buf, _one_clap(20 + k), k * 0.155 + rng.uniform(0, 0.006), 0.8 + rng.uniform(0, 0.2))
    return _norm(buf, 0.8, 0.11)


def applause():
    sec = SFX["applause"][0]
    buf = np.zeros(int(sec * SR))
    rng = np.random.default_rng(5)
    for k in range(260):
        _place(buf, _one_clap(100 + k, bright=rng.uniform(0.7, 1.4)), rng.uniform(0, sec - 0.1), rng.uniform(0.3, 1.0))
    t = _t(sec)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (sec - t) / 0.9)
    return _norm(buf * env, 0.75, 0.11)


def ding():
    sec = SFX["ding"][0]
    t = _t(sec)
    f = 1318.5
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / d) for m, a, d in ((1, 1.0, 0.45), (2.76, 0.45, 0.22), (5.4, 0.2, 0.1)))
    return _norm(_fade(x, 0.002, 0.1), 0.8)


def buzzer():
    sec = SFX["buzzer"][0]
    x = _band(np.sign(_saw(110, sec, 9)) + np.sign(_saw(117, sec, 9)), hi=1500, order=2)
    return _norm(_fade(x, 0.01, 0.05), 0.75, 0.13)


def cash():
    sec = SFX["cash"][0]
    buf = np.zeros(int(sec * SR))
    coins = _band(_noise(int(0.07 * SR), 8), lo=5000) * np.exp(-_t(0.07) / 0.02)
    _place(buf, coins, 0.0, 0.3)

    def bell(f, d):
        t = _t(d)
        return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / tau) for m, a, tau in ((1, 1.0, 0.22), (2.4, 0.4, 0.1), (4.1, 0.2, 0.05)))

    _place(buf, bell(2093, 0.6), 0.05, 0.8)
    _place(buf, bell(2637, 0.7), 0.16, 1.0)
    return _norm(_fade(buf, 0.001, 0.08), 0.8)


def _brass(freq, sec, bend=0.0):
    t = _t(sec)
    f = freq * (1 - bend * (t / sec) ** 2) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    x = _band(_saw(f, sec, 16), hi=1500, order=2)
    env = np.minimum(1, t / 0.035) * np.minimum(1, (sec - t) / 0.06)
    return x * env


def trombone():
    sec = SFX["trombone"][0]
    buf = np.zeros(int(sec * SR))
    at = 0.0
    for f, d, bend in ((311.1, 0.33, 0.0), (293.7, 0.33, 0.0), (277.2, 0.33, 0.0), (261.6, 0.9, 0.09)):
        _place(buf, _brass(f, d, bend), at)
        at += d
    return _norm(buf, 0.8, 0.14)


def dun():
    sec = SFX["dun"][0]
    buf = np.zeros(int(sec * SR))
    for at, d, g, fs in ((0.0, 0.3, 0.6, (98.0, 146.8)), (0.36, 0.3, 0.75, (98.0, 146.8)), (0.72, 0.95, 1.0, (69.3, 103.8, 138.6))):
        hit = sum(_brass(f, d) for f in fs) + _sweep(70, 40, d, 0.5) * np.exp(-_t(d) / 0.12) * 1.2
        _place(buf, hit, at, g)
    return _norm(buf, 0.85, 0.16)


def whoosh():
    sec = SFX["whoosh"][0]
    t = _t(sec)
    n = _noise(len(t), 9)
    out = np.zeros(len(t))
    cents = np.geomspace(350, 4200, 9)
    for i, c in enumerate(cents):
        peak = 0.06 + 0.3 * i / (len(cents) - 1)
        out += _band(n, lo=c * 0.75, hi=c * 1.3, order=2) * np.exp(-((t - peak) ** 2) / (2 * 0.05**2))
    return _norm(_fade(out, 0.01, 0.1), 0.75)


def scratch():
    sec = SFX["scratch"][0]
    a, b = 0.15, 0.13
    x = np.concatenate([_sweep(1300, 220, a, 0.7), np.zeros(int((sec - a - b) * SR)), _sweep(300, 1500, b, 1.4)])
    x = x[: int(sec * SR)]
    x = np.sign(x) * np.abs(x) ** 0.5
    n = _band(_noise(len(x), 10), lo=900, hi=5000, order=2) * np.abs(x)
    return _norm(_fade(_band(x * 0.5 + n, hi=5200, order=2), 0.002, 0.03), 0.75)


def crickets():
    sec = SFX["crickets"][0]
    t = _t(sec)
    out = np.zeros(len(t))
    for f, period, off, g in ((4300, 0.42, 0.0, 1.0), (4750, 0.42, 0.21, 0.6)):
        ph = (t - off) % period
        chirp = (ph < 0.055) * (0.5 - 0.5 * np.cos(2 * np.pi * 58 * ph))
        out += np.sin(2 * np.pi * f * t) * chirp * g
    return _norm(out, 0.6, 0.08)


def pop():
    sec = SFX["pop"][0]
    t = _t(sec)
    return _norm(_fade(_sweep(380, 950, sec, 0.6) * np.exp(-t / 0.035), 0.001, 0.02), 0.8)


def rimshot():
    sec = SFX["rimshot"][0]
    buf = np.zeros(int(sec * SR))
    for at, f0, f1 in ((0.0, 190, 95), (0.17, 150, 78)):
        d = 0.25
        _place(buf, _sweep(f0, f1, d, 0.5) * np.exp(-_t(d) / 0.07) + _band(_noise(int(d * SR), 12), lo=1500, hi=6000, order=2) * np.exp(-_t(d) / 0.02) * 0.3, at)
    d = 0.9
    cym = _band(_noise(int(d * SR), 13), lo=4500, hi=10000, order=2) * np.exp(-_t(d) / 0.28)
    snare = _band(_noise(int(0.2 * SR), 14), lo=900, hi=5000, order=2) * np.exp(-_t(0.2) / 0.04)
    _place(buf, cym, 0.36, 0.7)
    _place(buf, snare, 0.36, 0.8)
    return _norm(buf, 0.8)


def tick():
    sec = SFX["tick"][0]
    buf = np.zeros(int(sec * SR))
    for k in range(4):
        f = 2600 if k % 2 == 0 else 2050
        d = 0.03
        click = np.sin(2 * np.pi * f * _t(d)) * np.exp(-_t(d) / 0.006) + _band(_noise(int(d * SR), 30 + k), lo=2500) * np.exp(-_t(d) / 0.002) * 0.5
        _place(buf, click, k * 0.5)
    return _norm(buf, 0.7)


MAKERS = {"boom": boom, "slam": slam, "clap": clap, "applause": applause, "ding": ding, "buzzer": buzzer, "cash": cash, "trombone": trombone, "dun": dun,
          "whoosh": whoosh, "scratch": scratch, "crickets": crickets, "pop": pop, "rimshot": rimshot, "tick": tick}


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def ensure(out_dir, names=None, force=False):
    """Write any missing effect into out_dir. Returns the names written."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    made = []
    for name in names or MAKERS:
        p = out / f"{name}.wav"
        if force or not p.exists():
            x = MAKERS[name]()
            n = int(SFX[name][0] * SR)
            x = np.pad(x, (0, max(0, n - len(x))))[:n]
            write(p, x)
            made.append(name)
    return made


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else "reel-studio/public/sfx"
    made = ensure(d, force=True)
    for name in made:
        sec, loops, gain, what = SFX[name]
        print(f"{name:<9} {sec:4.2f}s {'loop' if loops else '    '}  gain {gain}  {what}")
