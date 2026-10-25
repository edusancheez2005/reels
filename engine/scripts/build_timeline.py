#!/usr/bin/env python3
"""Resolve storyboard word-anchors into frames, validate pacing, and install into the Remotion studio.

Usage: python3 build_timeline.py episodes/<slug> [--studio reel-studio] [--fps 30] [--strict]

Reads   <ep>/words.json, <ep>/storyboard.json, <ep>/voice.mp3 (or .wav), <ep>/assets/*
Writes  <ep>/timeline.json
Copies  timeline → <studio>/src/timeline.json, audio → <studio>/public/voice.<ext>,
        assets → <studio>/public/assets/<slug>/
Exit code 1 on any error (or on warnings with --strict).
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import FPS, norm, read_words  # noqa: E402

SCENE_MIN_S, SCENE_SOFT_MAX_S, SCENE_MAX_S = 1.0, 3.5, 4.0
BEAT_GAP_WARN_S, BEAT_GAP_ERR_S = 1.2, 2.0
TAIL_HOLD_S = 0.5


def image_size(path):
    """(w, h) of a PNG/JPEG/WebP without third-party deps; None if unknown."""
    try:
        from PIL import Image  # optional
        with Image.open(path) as im:
            return list(im.size)
    except Exception:
        pass
    import struct
    try:
        b = Path(path).read_bytes()[:64 * 1024]
        if b[:8] == b"\x89PNG\r\n\x1a\n":
            return list(struct.unpack(">II", b[16:24]))
        if b[:2] == b"\xff\xd8":
            i = 2
            while i < len(b):
                if b[i] != 0xFF:
                    i += 1
                    continue
                m = b[i + 1]
                if m in (0xC0, 0xC1, 0xC2):
                    h, w = struct.unpack(">HH", b[i + 5:i + 9])
                    return [w, h]
                i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
    except Exception:
        pass
    return None


def rewrite_assets(obj, slug, ep, warns):
    """Point every asset-ish string ('src', 'logo') at public/assets/<slug>/ and add 'size' for screenshots."""
    if isinstance(obj, list):
        return [rewrite_assets(x, slug, ep, warns) for x in obj]
    if not isinstance(obj, dict):
        return obj
    out = {}
    for k, v in obj.items():
        if k in ("src", "logo") and isinstance(v, str) and not v.startswith(("http", "assets/")):
            f = ep / "assets" / v
            if not f.is_file():
                warns.append(f"asset not found: assets/{v}")
            elif k == "src" and "size" not in obj:
                sz = image_size(f)
                if sz:
                    out["size"] = sz
            out[k] = f"assets/{slug}/{v}"
        else:
            out[k] = rewrite_assets(v, slug, ep, warns)
    return out


class Resolver:
    def __init__(self, words):
        self.words = words
        self.toks = [norm(w["text"]) for w in words]

    def find(self, spec, start_idx, label):
        """Return (word_index, ms) for an anchor spec, searching from start_idx."""
        if isinstance(spec, int):
            spec = {"word": spec}
        if isinstance(spec, str):
            spec = {"anchor": spec}
        at = spec.get("at", "start")
        if "word" in spec:
            i = int(spec["word"])
            if not 0 <= i < len(self.words):
                raise ValueError(f"{label}: word index {i} out of range 0..{len(self.words) - 1}")
            return i, self.words[i]["endMs" if at == "end" else "startMs"], i
        phrase = [norm(t) for t in str(spec["anchor"]).split()]
        phrase = [p for p in phrase if p]
        if not phrase:
            raise ValueError(f"{label}: empty anchor")
        want = int(spec.get("occurrence", 1))
        seen = 0
        for i in range(start_idx, len(self.toks) - len(phrase) + 1):
            if self.toks[i:i + len(phrase)] == phrase:
                seen += 1
                if seen == want:
                    last = i + len(phrase) - 1
                    ms = self.words[last]["endMs"] if at == "end" else self.words[i]["startMs"]
                    return i, ms, last
        nearby = " ".join(w["text"].strip() for w in self.words[start_idx:start_idx + 12])
        raise ValueError(f"{label}: anchor '{spec['anchor']}' (occurrence {want}) not found after word {start_idx}. "
                         f"Next words: \"{nearby}…\"")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--studio", default="reel-studio")
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()

    ep = Path(a.episode)
    fps = a.fps
    words = read_words(ep / "words.json")
    sb = json.loads((ep / "storyboard.json").read_text())
    scenes_in = sb.get("scenes") or []
    if not scenes_in:
        sys.exit("storyboard.json has no scenes")
    slug = sb.get("slug") or ep.name
    R = Resolver(words)
    f = lambda ms: round(ms / 1000 * fps)  # noqa: E731

    errors, warns = [], []
    resolved, cursor = [], 0
    for n, sc in enumerate(scenes_in):
        lab = f"scene {n + 1} ({sc.get('component', '?')})"
        try:
            idx, ms, last = R.find(sc["anchor"], cursor, lab)
        except (ValueError, KeyError) as e:
            errors.append(str(e) if isinstance(e, ValueError) else f"{lab}: missing 'anchor'")
            continue
        if n == 0 and idx != 0:
            errors.append(f"{lab}: the first scene must anchor to word 0 (got word {idx}). The hook starts on frame 0.")
        resolved.append({"n": n, "label": lab, "src": sc, "idx": idx, "ms": 0 if n == 0 else ms})
        cursor = idx + 1

    if errors:
        report(errors, warns)
        sys.exit(1)

    end_ms = words[-1]["endMs"] + float(sb.get("tail", TAIL_HOLD_S)) * 1000
    total_frames = f(end_ms)
    out_scenes = []
    for k, r in enumerate(resolved):
        start_f = f(r["ms"])
        end_f = f(resolved[k + 1]["ms"]) if k + 1 < len(resolved) else total_frames
        next_idx = resolved[k + 1]["idx"] if k + 1 < len(resolved) else len(words)
        dur_s = (end_f - start_f) / fps
        if end_f <= start_f:
            errors.append(f"{r['label']}: zero length (two scenes on the same word?)")
            continue
        if dur_s > SCENE_MAX_S and r["src"].get("long"):
            warns.append(f"{r['label']}: {dur_s:.2f}s (allowed: long continuous shot). Keep the camera moving.")
        elif dur_s > SCENE_MAX_S:
            errors.append(f"{r['label']}: {dur_s:.2f}s is too long (max {SCENE_MAX_S}s). Split it into two scenes.")
        elif dur_s > SCENE_SOFT_MAX_S:
            warns.append(f"{r['label']}: {dur_s:.2f}s is long. Make sure beats keep it moving.")
        if dur_s < SCENE_MIN_S and k != 0:
            warns.append(f"{r['label']}: {dur_s:.2f}s is very short. Can viewers read it?")

        beats, bcursor = [], r["idx"]
        for b in r["src"].get("beats", []):
            try:
                bidx, bms, blast = R.find(b, bcursor, f"{r['label']} beat {b!r}")
            except ValueError as e:
                errors.append(str(e))
                continue
            if bidx >= next_idx:
                errors.append(f"{r['label']}: beat {b!r} (word {bidx}) falls in the next scene (starts word {next_idx}).")
                continue
            beats.append(f(bms) - start_f)
            bcursor = bidx  # allow repeated anchors via occurrence; keep order
        if beats != sorted(beats):
            errors.append(f"{r['label']}: beats are out of order {beats}")

        props = rewrite_assets(dict(r["src"].get("props", {})), slug, ep, warns)
        out_scenes.append({
            "id": r["src"].get("id", f"s{k + 1}"),
            "component": r["src"]["component"],
            "props": props,
            "from": start_f,
            "durationInFrames": end_f - start_f,
            "beats": beats,
            "theme": r["src"].get("theme", sb.get("theme", "dark")),
            "transition": r["src"].get("transition", "pop"),
            "anchorText": " ".join(w["text"].strip() for w in words[r["idx"]:min(r["idx"] + 4, len(words))]),
        })

    # pacing: gaps between visual events (scene cuts + beats)
    moving = set()
    for s_, r_ in zip(out_scenes, resolved):
        if r_["src"].get("moving"):  # continuously animated scene (counter, particles, scan): counts as motion
            moving.update(range(s_["from"], s_["from"] + s_["durationInFrames"], max(1, fps // 2)))
    events = sorted({0, *moving, *[s["from"] for s in out_scenes], *[s["from"] + b for s in out_scenes for b in s["beats"]]})
    events.append(total_frames)
    for x, y in zip(events, events[1:]):
        gap = (y - x) / fps
        if gap > BEAT_GAP_ERR_S:
            errors.append(f"{gap:.2f}s with nothing moving ({x / fps:.2f}s → {y / fps:.2f}s). Add beats or a scene.")
        elif gap > BEAT_GAP_WARN_S:
            warns.append(f"{gap:.2f}s without a beat ({x / fps:.2f}s → {y / fps:.2f}s).")

    # caption emphasis: phrases listed in storyboard "emphasis" get a selection box when spoken
    caps = [dict(w) for w in words]
    for phrase in sb.get("emphasis", []):
        toks = [norm(t) for t in str(phrase).split() if norm(t)]
        hit = False
        for i in range(len(R.toks) - len(toks) + 1):
            if R.toks[i:i + len(toks)] == toks:
                for j in range(i, i + len(toks)):
                    caps[j]["emph"] = True
                hit = True
        if not hit:
            warns.append(f"emphasis '{phrase}' not found in the words")

    timeline = {
        "slug": slug,
        "captionStyle": sb.get("captionStyle", "kinetic"),
        "fps": fps,
        "width": 1080,
        "height": 1920,
        "durationInFrames": total_frames,
        "audio": None,
        "captions": caps,
        "scenes": out_scenes,
    }

    audio = next((p for p in [ep / "voice.mp3", ep / "voice.wav"] if p.is_file()), None)
    if not audio:
        warns.append("No voice.mp3/voice.wav found. Rendering silent.")
    else:
        timeline["audio"] = f"voice{audio.suffix}"

    report(errors, warns)
    if errors or (a.strict and warns):
        sys.exit(1)

    (ep / "timeline.json").write_text(json.dumps(timeline, indent=1))
    studio = Path(a.studio)
    if (studio / "src").is_dir():
        (studio / "src" / "timeline.json").write_text(json.dumps(timeline, indent=1))
        (studio / "public").mkdir(exist_ok=True)
        if audio:
            shutil.copy(audio, studio / "public" / f"voice{audio.suffix}")
        if (ep / "assets").is_dir():
            dst = studio / "public" / "assets" / slug
            shutil.rmtree(dst, ignore_errors=True)
            shutil.copytree(ep / "assets", dst)
        print(f"Installed into {studio}/src/timeline.json")
    else:
        print(f"(studio '{studio}' not found; wrote {ep}/timeline.json only)")

    print(f"\nOK  {len(out_scenes)} scenes · {total_frames} frames · {total_frames / fps:.1f}s")
    for s in out_scenes:
        print(f"  {s['from'] / fps:6.2f}s  {s['durationInFrames'] / fps:4.1f}s  {s['component']:<9} "
              f"beats@{[round(b / fps, 2) for b in s['beats']]}  \"{s['anchorText']}…\"")


def report(errors, warns):
    for w in warns:
        print("WARN  " + w)
    for e in errors:
        print("ERROR " + e)


if __name__ == "__main__":
    main()
