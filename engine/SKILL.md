---
name: explainer-reels
description: Make faceless, word-synced explainer reels (9:16 Reels/TikTok/Shorts) from a topic, link or script — fact-checked research, real screenshots and logos, AI voice with word timestamps, an illustrated storyboard anchored to words, Remotion animation, kinetic captions, QA and render. Use for "make a reel about X", "explainer video on X", "/explainer-reels".
---

# Explainer Reels

One subject in, one finished vertical reel out: a voice, a caption that lights up word by word,
and illustrated scenes that change *on the word they show*.

The whole skill rests on one idea: **audio is the clock.** We voice the script first, get a
timestamp for every word, and anchor every scene and every animation beat to a *word*, never to
a hand-typed second. Captions, voice and visuals stay locked together, and a script edit never
breaks the sync: re-voice, re-build, re-render.

```
subject → research.md (sourced, verified) → script.txt → voice + words.json
        → assets (real screenshots, real logos) → storyboard.json (scenes + beats on words)
        → timeline.json → QA contact sheet → reel.mp4 + caption.txt + cover.jpg
```

## House standard (Edu, 29 Oct 2026: "so much better... even if it might take longer, do this type of content")

The bar is `../episodes/2026-10-29-landfill-story/` (55 s). Every reel:
- **45–60 s, a real story told properly**: who each person is, how it happened, what they tried, how it ended, and the
  story's own lesson with the why (script-guide "Story reels: Edu's standard"; "What-if reels" for hypotheticals).
- **A 3D character for each real person** (`Character3D`, a stylised stand-in, never a likeness; "3D stand-in" once on the
  name card), **real documents and articles as on-screen receipts** (court records, news pages, explorers: `Shot`), and
  **3D scenes built for this story** (props, rooms, objects), not a stock set reused in five scenes.
- **The number on screen in the first second**, a **designed cover** (`python3 ../tools/make_cover.py`, one giant number
  + a few words), no "Illustration" captions on obvious graphics, no timeline by default.
- Budget the time: a full 3D render is 1–2 h on this machine. QA stills first (`../tools/qa_frames.py`, one bundle), and
  fix one scene later with `../tools/splice_scene.sh` instead of re-rendering everything.
In the daily autopilot (`../RUNBOOK.md`), fresh reviewer agents replace "wait for the user's OK" at the script and video
steps, and posting follows the gate in `../channels/autopost.json` + `../tools/prepost_check.py`.

Read before the first episode, and whenever a step is unclear:
- `references/script-guide.md` — hooks, structure, writing for the ear
- `references/visual-style.md` — the look: kinetic captions, light/dark rhythm, motion, transitions
- `references/storyboard-spec.md` — storyboard fields and every scene component with its props
- `../episodes/2026-10-25-whale-wakes/` (real data, screenshots, logos) and `../episodes/2026-10-25-fish-round-trip/`
  (pure illustration: map route, characters). Both pass validation; copy their density.

## 0. Setup (first run in a folder)

1. Check `node` (≥18), `npm`, `python3`, `ffmpeg`. Install what's missing (ask before system installs).
2. `cp -r <skill>/template ./reel-studio && cd reel-studio && npm install`
3. **Voice**, pick one:
   - ElevenLabs (best, exact timings): `ELEVENLABS_API_KEY` in `reel-studio/.env`. Ask the user; never echo it.
   - Free and offline: `pip install kokoro-onnx soundfile numpy` (the model downloads on first use, ~350 MB).
   - The user's own recording, transcribed (3c).
4. **Screenshots**: `npm i -D playwright && npx playwright install chromium` (inside reel-studio).
5. Ask once and save to `reel-studio/brand.json`: accent colour, handle, voice, notes.
6. If Chrome can't be downloaded, `export REMOTION_BROWSER=/path/to/chrome`. Offline: `"fontSource": "system"`.

## 1. Research → `episodes/<slug>/research.md`

- 5–10 facts, **each with a source URL**. Prefer primary sources (block explorers, filings, docs, papers).
- **Verify the hook against the primary record** whenever one exists. Example: the press called the
  whale wallet "dormant six years", but the chain showed a small 2024 test payment, so the script says
  "the same address had held them since March 2020". Write down what you checked and when.
- Note anything you deliberately *didn't* use and why (e.g. a widely repeated but unsupported distance).
- Find the one mechanism that makes it click and the one surprising detail. That's the reel.

## 2. Script → `episodes/<slug>/script.txt`

Follow `references/script-guide.md`: 120–160 spoken words (45–60 s), a showable first sentence with the big number,
numbers spelled out as spoken, every noun showable. **Show the user the script and wait for an OK** (daily autopilot: the
fresh script reviewer in RUNBOOK §2a instead).

## 3. Voice + word timestamps

- 3a ElevenLabs: `python3 <skill>/scripts/tts_elevenlabs.py episodes/<slug>/script.txt --out episodes/<slug>`
- 3b Free: `python3 <skill>/scripts/tts_local.py episodes/<slug>/script.txt --out episodes/<slug> [--voice af_heart|bf_emma|am_michael]`
- 3c Own recording at `episodes/<slug>/voice.mp3`: `python3 <skill>/scripts/transcribe_words.py … --out episodes/<slug>`

Then `python3 <skill>/scripts/print_words.py episodes/<slug>/words.json` and anchor against that list.

## 4. Assets → `episodes/<slug>/assets/`

- **Real screenshots** (evidence beats, e.g. the explorer page, the news headline):
  `node <skill>/scripts/screenshot.mjs <url> episodes/<slug>/assets/name.png --selector "<css>" --zoom 1.6 [--dark]`
  Capture the *element* that proves the point, zoomed so text stays sharp. Cookie banners are hidden automatically.
  Pages that need sign-in: use the browser the user is signed into (Claude in Chrome / built-in browser), screenshot,
  and save the file. Never fabricate a screenshot or recreate a real site's page as if it were real.
- **Real logos**: `node <skill>/scripts/get_logos.mjs --out episodes/<slug>/assets bitcoin binance …`
  (Simple Icons, official colours). Missing brands come from the brand's press kit. Logos refer to the brand, never imply endorsement.
- To place marks on a screenshot, overlay a coordinate grid and read pixel positions (see the QA step for viewing images).

## 5. Storyboard → `episodes/<slug>/storyboard.json`

Follow `references/storyboard-spec.md`. The rules that make or break it:
- **A new scene every 1.5–3.5 s**, a beat at least every ~1 s. Scene 1 starts at word 0.
- **Every scene and beat is anchored to a word or phrase.** Never type seconds.
- **Alternate light and dark scenes** in runs of 1–3, and use `whip`/`zoom` transitions between sections.
- **Mix the three kinds of scene**: evidence (screenshots with marks), mechanism (illustrations,
  maps, particles, 3D) and numbers (big counters, bars, rulers). Plain text titles are max 1 in 5 scenes.
- List 10–20 `emphasis` phrases: those caption words get the selection box.

Show the user a short table (time · words · scene) and **wait for an OK before rendering** (daily autopilot: your own
QA stills against the house standard instead).

## 6. Build, QA, render

```
python3 <skill>/scripts/build_timeline.py episodes/<slug> --studio reel-studio      # resolves anchors, validates pacing
cd reel-studio && python3 <skill>/scripts/qa_stills.py ../episodes/<slug>/timeline.json --studio . --cols 6
# 3D reels: python3 ../tools/qa_frames.py episodes/<slug>  (from the repo root; all stills from one bundle)
```
Fix every ERROR. **Look at `qa/contact.png` yourself** (Read the image) and fix: anything clipped at
the frame edge, text too small for a phone, empty scenes, marks off target, a scene that doesn't
match its words. Spot-check transitions with `npx remotion still Reel out.png --frame N`. Repeat until clean.

```
npx remotion render Reel ../episodes/<slug>/<slug>.mp4 --codec h264 --crf 18 --x264-preset veryfast
```
Then `cover.jpg` (designed: `python3 ../tools/make_cover.py episodes/<slug> --number ... --kicker ... --tagline ...`
on a clean frame of the strongest visual) and `caption.txt` (1–3 lines, max 5 hashtags, the source list for the first
comment). Verify with `ffprobe`:
1080×1920, 30 fps, audio present.

## 7. Deliver & learn

Hand over the mp4, caption and cover. Each correction the user gives goes into `brand.json → notes`
with a one-line reason and applies to every future episode.

## Posting

Rendering is local; posting is a separate, explicit step. Outside the daily autopilot, never post without the user
approving that specific video and caption. In the autopilot, Edu's standing instruction applies: post only when
`channels/autopost.json` is on and `tools/prepost_check.py` passes (RUNBOOK §4a), after checking what's already live
(never the same story twice: 29 Oct 2026, a third landfill reel in one day got 1/8 of the views).

## Never

- Never render before the script and storyboard are approved.
- Never hardcode a time in the storyboard. Anchor to words.
- Never put a claim on screen that isn't in `research.md` with a source. Only a realistic recreation of a real person or
  event needs a label; AI-generated images are labelled as AI; obvious 3D graphics get none (Edu, 29 Oct 2026).
- Never fake a screenshot, a quote, or a post by a real person or organisation. Paraphrase with attribution instead (`Quote` scene).
- Never draw a brand's logo or a known character by hand. Use the real logo file or nothing.
- No music unless asked. Voice-only exports let the user add a trending sound in-app.
