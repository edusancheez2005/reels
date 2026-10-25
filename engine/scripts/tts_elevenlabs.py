#!/usr/bin/env python3
"""Voice a script with ElevenLabs and get word-level timestamps.

Usage:
  python3 tts_elevenlabs.py episodes/<slug>/script.txt --out episodes/<slug> [--voice-id ID]
                            [--model eleven_multilingual_v2] [--speed 1.05] [--stability 0.45]

Writes <out>/voice.mp3 and <out>/words.json (Remotion Caption[]).
Needs ELEVENLABS_API_KEY in the environment or a .env file.
Uses POST /v1/text-to-speech/{voice_id}/with-timestamps (character alignment → words).
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import chars_to_words, load_env  # noqa: E402

DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs premade voice; pick your own in brand.json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--out", required=True)
    ap.add_argument("--voice-id")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--speed", type=float, default=1.05, help="0.7–1.2; ~1.05 suits reels")
    ap.add_argument("--stability", type=float, default=0.45)
    ap.add_argument("--similarity", type=float, default=0.8)
    ap.add_argument("--style", type=float, default=0.15)
    args = ap.parse_args()

    load_env()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY not set (env or reel-studio/.env). Ask the user for it.")

    voice = args.voice_id or os.environ.get("ELEVENLABS_VOICE_ID")
    if not voice:
        brand = Path("reel-studio/brand.json")
        if brand.is_file():
            voice = json.loads(brand.read_text()).get("voiceId")
    voice = voice or DEFAULT_VOICE

    text = " ".join(Path(args.script).read_text().split())
    if len(text) > 4500:
        sys.exit(f"Script is {len(text)} chars. Reels should be far shorter (~600–1000). Cut it.")

    body = {
        "text": text,
        "model_id": args.model,
        "voice_settings": {
            "stability": args.stability,
            "similarity_boost": args.similarity,
            "style": args.style,
            "use_speaker_boost": True,
            "speed": args.speed,
        },
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:500]}")

    al = data.get("alignment") or data.get("normalized_alignment")
    if not al:
        sys.exit("No alignment in response; cannot sync captions.")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "voice.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
    words = chars_to_words(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
    (out / "words.json").write_text(json.dumps(words, indent=1))

    dur = words[-1]["endMs"] / 1000
    print(f"OK  {len(words)} words, {dur:.1f}s spoken, {len(words) / dur * 60:.0f} wpm → {out}/voice.mp3, words.json")
    if dur > 75:
        print("WARN  longer than 75 s. Consider cutting the script.")


if __name__ == "__main__":
    main()
