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
import re
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
            # "plus": seconds after that point, for a beat inside a "[pause]" (a gag that lands after the line, not on it)
            return i, self.words[i]["endMs" if at == "end" else "startMs"] + round(float(spec.get("plus", 0)) * 1000), i
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
                    return i, ms + round(float(spec.get("plus", 0)) * 1000), last
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

        raw = dict(r["src"].get("props", {}))
        use = raw.pop("$use", None)  # shared props from storyboard "defs" (e.g. one Iso3D world used by several scenes)
        if use:
            base = (sb.get("defs") or {}).get(use)
            if base is None:
                errors.append(f"{r['label']}: $use '{use}' not found in storyboard defs")
            else:
                raw = {**json.loads(json.dumps(base)), **raw}
        props = rewrite_assets(raw, slug, ep, warns)
        # 3D overlay tags are centred SVG text: keep each pill inside x 120-920 (reviews of 3-4 Nov 2026 failed two reels for this)
        for t in props.get("tags", []) if isinstance(props.get("tags"), list) else []:
            if isinstance(t, dict) and t.get("text"):
                fs = t.get("size", 34)
                wpx = len(t["text"]) * (fs * 0.66 + 4) + fs
                if wpx > 1040:
                    errors.append(f"{r['label']}: tag '{t['text']}' is ~{wpx:.0f}px wide at size {fs}: it will run off the frame. Shorten it, lower the size, or split it into two tags.")
                elif wpx > 800:
                    warns.append(f"{r['label']}: tag '{t['text']}' is ~{wpx:.0f}px wide at size {fs}; keep tags inside x 120-920 (<= 800px).")
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

    # sound effects (Edu, 17 Nov 2026: "you can add like little sound effects... that'd be quite funny"). Explicit ones come
    # from a scene's "sfx": [{"name", "beat", "offset", "gain", "dur"}]; Actor3D scenes also get them from their actions:
    # a stamp lands with a boom, an actor who jumps or claps is heard clapping, an entrance pops. "autoSfx": false turns
    # the automatic ones off for a scene. The sounds are synthesised by make_sfx.py (nothing downloaded or sampled).
    sfx = []
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from make_sfx import SFX as SFX_LIB
    except Exception as e:  # numpy missing: render without effects rather than fail
        SFX_LIB = {}
        warns.append(f"sound effects unavailable ({e})")

    def add_sfx(lab, name, at_f, gain=None, dur_f=None):
        if name not in SFX_LIB:
            if SFX_LIB:
                errors.append(f"{lab}: unknown sound effect '{name}' (have: {', '.join(sorted(SFX_LIB))})")
            return
        sec, loops, g0, _ = SFX_LIB[name]
        at_f = max(0, min(int(at_f), total_frames - 2))
        n = int(dur_f) if dur_f else round(sec * fps)
        n = max(2, min(n, total_frames - at_f))
        sfx.append({"name": name, "from": at_f, "durationInFrames": n, "volume": round(float(gain if gain is not None else g0), 3), "loop": bool(loops)})

    for s_, r_ in zip(out_scenes, resolved):
        lab, src, bts = r_["label"], r_["src"], s_["beats"]
        beat_f = lambda i: s_["from"] + (bts[i] if isinstance(i, int) and 0 <= i < len(bts) else 0)  # noqa: E731
        end_f = s_["from"] + s_["durationInFrames"]
        for x in src.get("sfx", []) or []:
            if not isinstance(x, dict) or not x.get("name"):
                errors.append(f"{lab}: sfx entries look like {{\"name\": \"ding\", \"beat\": 1}}")
                continue
            at = beat_f(x.get("beat", -1)) + round(float(x.get("offset", 0)) * fps)
            add_sfx(lab, x["name"], at, x.get("gain"), round(float(x["dur"]) * fps) if x.get("dur") else None)
        if s_["component"] == "Actor3D" and src.get("autoSfx", True):
            pr = s_["props"]
            groups = [str(a).split("+") for a in pr.get("actions", []) or []]
            explicit = {x.get("name") for x in src.get("sfx", []) or [] if isinstance(x, dict)}
            pose_at = {}  # actor id -> [(frame, pose)]
            for a_ in pr.get("actors", []) or []:
                if not a_.get("hidden"):
                    pose_at.setdefault(a_["id"], []).append((s_["from"], a_.get("pose", "relax")))
            for gi, grp in enumerate(groups):
                for act in grp:
                    parts = act.split(":")
                    if act == "stamp" and "boom" not in explicit:
                        add_sfx(lab, "boom", beat_f(gi))
                    elif len(parts) == 2 and parts[1] == "in" and "pop" not in explicit:
                        add_sfx(lab, "pop", beat_f(gi))
                        pose_at.setdefault(parts[0], []).append((beat_f(gi), next((a_.get("pose", "relax") for a_ in pr.get("actors", []) if a_["id"] == parts[0]), "relax")))
                    elif len(parts) == 2 and parts[1] == "out":
                        pose_at.setdefault(parts[0], []).append((beat_f(gi), "relax"))
                    elif len(parts) == 2 and parts[1] not in ("look", "talk"):
                        pose_at.setdefault(parts[0], []).append((beat_f(gi), parts[1]))
            if "clap" not in explicit:
                for who, evs in pose_at.items():
                    evs.sort()
                    for (f0, pose), nxt in zip(evs, evs[1:] + [(end_f, "")]):
                        if pose in ("jump", "clap") and nxt[0] - f0 >= 6:
                            add_sfx(lab, "clap", f0 + 4, None, nxt[0] - f0 - 4)
    sfx.sort(key=lambda x: x["from"])

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
    # swearing is allowed in the voice (Edu, 18 Nov 2026); the words shown on screen are masked: "f*cking", "sh*t"
    for c_ in caps:
        t_ = re.sub(r"(?i)(f)u(ck)", r"\1*\2", c_.get("text", ""))
        c_["text"] = re.sub(r"(?i)\b((?:bull)?sh)i(t(?:s|ty|e)?)\b", r"\1*\2", t_)
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

    # chapter bar (Edu, 30 Oct 2026): "chapters": [{"anchor", "label"}] -> frames, in spoken order
    chapters, ccur = [], 0
    for c in sb.get("chapters", []):
        try:
            cidx, cms, _ = R.find(c["anchor"], ccur, f"chapter {c.get('label', '?')!r}")
        except (ValueError, KeyError) as e:
            errors.append(str(e) if isinstance(e, ValueError) else "chapter without 'anchor'")
            continue
        chapters.append({"label": str(c.get("label", "")).upper(), "from": 0 if not chapters and cidx == 0 else f(cms)})
        ccur = cidx + 1
    if sb.get("chapters") and len(chapters) > 6:
        warns.append(f"{len(chapters)} chapters: more than 6 labels get cramped on a phone")

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
    if sfx:
        timeline["sfx"] = sfx
    if chapters:
        timeline["chapters"] = chapters
    if sb.get("header"):
        timeline["header"] = sb["header"]
    if sb.get("captionY"):
        timeline["captionY"] = sb["captionY"]

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
        if sfx:
            from make_sfx import ensure as ensure_sfx
            ensure_sfx(studio / "public" / "sfx", sorted({x["name"] for x in sfx}))
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
