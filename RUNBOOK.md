# Scheduled reel run — runbook

Every scheduled run follows this file top to bottom. The run is **unattended until the final step**:
it researches, writes, voices, builds, checks and renders on its own, then hands the finished
video to Edu and **waits for his explicit approval before anything is posted.**

Repo: `edusancheez2005/reels` (public). Engine docs: `engine/SKILL.md` + `engine/references/`.

## Hard rules

1. **Never post, publish or schedule anything without Edu replying with explicit approval in this
   session** ("post it", "yes post", or equivalent). Silence, a thumbs-up on something else, or an
   approval from an earlier run does not count. One approval = one post.
2. Every on-screen claim must be in the episode's `research.md` with a source URL. Verify the hook
   against a primary record when one exists (block explorer, filing, official page). If a fact can't be
   verified, cut it. Don't soften it.
3. No fake screenshots, fake quotes, fake posts by real people or organisations, or hand-drawn logos
   (use `engine/scripts/get_logos.mjs`). Illustrations are labelled as illustrations where it matters.
4. Never commit secrets. Never commit media (mp4, wav) to `main`; videos go to the `media` branch via `tools/publish_media.sh`.
5. Keep the run lean: read only what you need, at most 3 QA rounds, one final render.

## 0. Start

```bash
# attach first: add_repo(owner=edusancheez2005, repo=reels, access=push). If RUNBOOK.md is missing after cloning,
# the engine hasn't been pushed yet: notify Edu ("reels repo is empty, setup unfinished") and stop.
git clone https://github.com/edusancheez2005/reels.git ~/reels && cd ~/reels
bash tools/setup.sh            # studio deps, voice model, headless Chrome; prints the env to source
source .env.local              # REMOTION_BROWSER etc.
```

## 1. Pick the channel and topic

- Channel = `channels/rota.json[weekday]` (Europe/London date); if the day isn't listed (a manual weekend run), use `general`. Load `channels/<channel>.json`.
- Apply its brand: `python3 tools/use_channel.py <channel>` (writes `reel-studio/brand.json`).
- Topic:
  - **sonar**: first look for a notable verified on-chain event from the last 7 days (whale
    transfer, big exchange inflow/outflow, stablecoin mint/burn). Search the news, then verify the
    transaction on a block explorer (mempool.space for BTC: WebFetch `https://mempool.space/api/tx/<txid>`
    and `/api/address/<addr>/txs`; Etherscan for ETH tokens). Use it only if verified. Otherwise take the first
    unchecked item in `backlog/sonar.md`.
  - **general**: the first unchecked item in `backlog/general.md`.
- Episode id: `YYYY-MM-DD-<slug>`, folder `episodes/<id>/`.

## 2. Produce (follow `engine/SKILL.md`, with these overrides for unattended runs)

- No approval stops for script or storyboard: self-review against `engine/references/script-guide.md`
  and the storyboard rules instead. Edu reviews the finished video.
- Script 110–150 words (45–60 s). Voice: `python3 engine/scripts/tts_local.py … --voice af_heart --speed 1.05`.
- Assets: logos via `get_logos.mjs`. Screenshots only if the computer bridge / a browser tool is available
  in this session (otherwise build from illustrations, maps, numbers and logos; don't stall).
- Storyboard: 14–20 scenes, ≤ 1 plain text title per 5 scenes, 10–20 emphasis phrases. **Default to the realistic 3D
  components** (`engine/references/storyboard-spec.md` → 3D; Edu's standing feedback): light/dark rhythm applies to 2D scenes only.
  Reuse components first. A new component is fine if a topic needs it (add it under `engine/template/src/scenes/`
  and register it); keep it generic so later episodes can reuse it.
- Build + QA: `build_timeline.py` must pass with no ERROR; for 3D reels run `python3 tools/qa_frames.py episodes/<id>`
  (one still per scene) instead of qa_stills' full draft; look at `qa/contact.png` and fix clipping,
  tiny text, empty scenes, marks off target, and visuals that don't match their words. Max 3 rounds.
- Render: `npx remotion render Reel ../episodes/<id>/<id>.mp4 --codec h264 --crf 18 --x264-preset veryfast`.
  3D renders in software (~60–80 min for 48 s on 2 cores): start it with nohup and keep the session busy (poll the log)
  until it finishes; a background job is stopped soon after the turn ends.
- `cover.jpg` (strongest frame) and `caption.txt`: 1–2 lines + 3–5 hashtags + the channel's sign-off;
  a final "Sources:" block for the first comment.

## 3. Save the episode and host the video (this is NOT posting)

```bash
python3 tools/finish_episode.py episodes/<id> --channel <channel> --topic "<backlog item text>"
git add -A && git commit -m "episode: <id>" && git push      # scripts, sources, storyboard, caption (no media)
bash tools/publish_media.sh episodes/<id>                   # pushes mp4 + cover to the media branch; prints VIDEO_URL / COVER_URL
```
`VIDEO_URL` is a public raw.githubusercontent.com link that Instagram downloads the video from. GitHub Releases
are not available to these sessions, so don't use them.

## 4. Hand over and wait

Send Edu (status "proactive", so it reaches his phone):
- the mp4 (SendUserFile),
- a message with the topic, the caption, the sources, the VIDEO_URL, the target Instagram account (@sonartracker.io), and:
  **"Reply 'post it' to publish, or tell me what to change."**

Then stop. Do not post.

## 5. When Edu replies

- **"post it"** (explicit): publish with the **Windsor.ai for Social Media** connector:
  `execute_action(connector="instagram", account="17841440268229419", action="create_video_post",
  params={video_url: VIDEO_URL, cover_url: COVER_URL, caption: <caption.txt without the Sources block>, share_to_feed: true})`.
  Then post the Sources block as the first comment (`create_comment` with the new media id) if one is returned.
  If Instagram rejects the video URL, retry once with the Pages URL if GitHub Pages is enabled; otherwise tell Edu
  and attach the mp4 + caption for a manual upload. Report exactly what happened, then update `episodes/<id>/meta.json`
  (`posted: true`, the permalink if available) and push.
- **Changes requested**: edit, rebuild, re-render, re-run publish_media.sh (same id overwrites the video), and send again. Wait again.
- **"skip"**: leave it unposted and untick nothing.
