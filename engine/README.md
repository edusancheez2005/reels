# explainer-reels v2 — a Claude Code skill

Topic in → finished 9:16 explainer reel out, with in-frame kinetic captions, a voice, and
illustrated scenes that change on the exact word they show.

## What you need
- **Claude Code** (desktop app Code tab or terminal). A browser chat can't render video.
- **Node 18+, Python 3, ffmpeg.** Claude installs what's missing on first run.
- **A voice**, either:
  - an ElevenLabs API key (exact word timings, many voices, paid per use), or
  - free and offline Kokoro voices (`pip install kokoro-onnx soundfile numpy`; ~350 MB model download), or
  - your own recording.

## Install
Unzip into your Claude Code skills folder (`~/.claude/skills/explainer-reels/`, or
`%USERPROFILE%\.claude\skills\explainer-reels\` on Windows). Open Claude Code in an empty folder and say:

> Set up explainer-reels here, then make a reel about how a crypto whale alert works.

## What's in v2
- **Kinetic captions** in the frame, with Figma-style selection boxes on key phrases.
- **Light/dark scene rhythm**, whip and zoom-through transitions.
- **Real evidence**: `screenshot.mjs` captures page elements at 2× (cookie banners hidden), and
  `Shot` scenes animate a camera over them with hand-drawn boxes, underlines and circles.
- **Real logos** via Simple Icons (`get_logos.mjs`).
- **Illustration scenes**: particle shapes, a real world map with shipping routes and a moving
  ship, a 3D mempool, phone notifications, a worker character, a balance scale, timelines, counters.
- **Fact-check discipline**: research.md with sources, hooks verified against primary records.
- **Pacing validator**: no scene over 4 s, nothing static for 2 s, every beat on a word.

## Folder map
```
SKILL.md                 the workflow Claude follows
references/              script, visual and storyboard rules (every component documented)
scripts/                 tts_elevenlabs · tts_local · transcribe_words · print_words · get_logos ·
                         screenshot · build_timeline · qa_stills
template/                Remotion project (28 scene components, kinetic captions, transitions)
examples/whale-wakes/    real on-chain story: screenshots, logos, 18 scenes
examples/fish-round-trip/ pure illustration: map route, characters, 16 scenes
```
