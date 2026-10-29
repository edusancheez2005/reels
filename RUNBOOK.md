# Scheduled reel run — runbook

Every scheduled run follows this file top to bottom. The run is **fully unattended**: it researches, writes,
voices, builds, checks and renders on its own, **posts to Instagram itself when every pre-post check passes**
(Edu, 27 Oct 2026: "post it yourself"), then tells Edu what went up. If a check fails, it holds the video and
asks Edu instead.

Repo: `edusancheez2005/reels` (public). Engine docs: `engine/SKILL.md` + `engine/references/`.

## Hard rules

1. **Auto-post only through the gate.** Post without waiting for Edu only when `channels/autopost.json` has
   `"enabled": true`, `python3 tools/prepost_check.py episodes/<id>` prints PASS (it requires the reviewer's PASS in `review.md`), **and** you have looked at the final
   `qa/contact.png` yourself and checked every on-screen number and claim against `research.md`. If any of that
   fails, or you're unsure about a single claim, don't post: hand it to Edu for approval (§4b) and say what held it.
   At most one auto-post per run (the gate enforces one per London day). If Edu ever says "pause autopost" (any
   session), set `enabled` to false in `channels/autopost.json` and push; from then on every run waits for "post it".
2. Every on-screen claim must be in the episode's `research.md` with a source URL. Verify the hook
   against a primary record when one exists (block explorer, filing, official page). If a fact can't be
   verified, cut it. Don't soften it.
3. No fake screenshots, fake quotes, fake posts by real people or organisations, or hand-drawn logos
   (use `engine/scripts/get_logos.mjs`). Only a realistic recreation of a real person or event needs a small label; obvious
   graphics (3D props, diagrams, maps) get no "Illustration" caption (Edu, 29 Oct 2026).
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

- If `insights/plan.md` has a row for today's date, that row decides the channel and the topic (it overrides the rota; on a
  `sonar` row a fresh verified on-chain event still comes first). Otherwise channel = `channels/rota.json[weekday]`
  (Europe/London date), or `crypto` if the day isn't listed. Load `channels/<channel>.json`.
- Apply its brand: `python3 tools/use_channel.py <channel>` (writes `reel-studio/brand.json`).
- Topic:
  - **sonar**: first look for a notable verified on-chain event from the last 7 days (whale
    transfer, big exchange inflow/outflow, stablecoin mint/burn). Search the news, then verify the
    transaction on a block explorer (mempool.space for BTC: WebFetch `https://mempool.space/api/tx/<txid>`
    and `/api/address/<addr>/txs`; Etherscan for ETH tokens). Use it only if verified. Otherwise take the first
    unchecked item in `backlog/sonar.md`.
  - **crypto**: the first unchecked item in `backlog/crypto.md` (explainers/history; the line's hook idea is a lead, verify it).
    If fewer than 5 unchecked items remain, append 5 new beginner-friendly crypto explainer topics (each with a hook idea) to the
    backlog in the same commit; don't repeat a topic or a hook fact used in the last 14 episodes.
  - **general** (not on the rota for now): the first unchecked item in `backlog/general.md`.
- Episode id: `YYYY-MM-DD-<slug>`, folder `episodes/<id>/`.

## 2. Produce (follow `engine/SKILL.md`, with these overrides for unattended runs)

- No approval stops for script or storyboard: self-review against `engine/references/script-guide.md`
  and the storyboard rules instead. Nobody reviews before posting, so the fact check is yours.
- Before writing the script, read `insights/learnings.md` (what works on this account, from the weekly stats review) and the
  "Notes for next time" in the last 3 episodes' `review.md`, and apply them. Where they disagree, the account's numbers win.
- If `insights/plan.md` has an entry for today, use its topic, type, angle and hook formula (still verify every fact).
- Script 120–160 words (45–60 s; up to ~65 s if the story needs it). Edu, 29 Oct 2026, on the 33 s landfill reel: "too short,
  barely any information". Information first: follow "Story reels: Edu's standard" in `engine/references/script-guide.md`
  (introduce every person, cause and effect, 6+ concrete facts, an ending that names this story's mistakes and why).
  Voice: `python3 engine/scripts/tts_local.py … --voice af_heart --speed 1.05`.
- Assets: logos via `get_logos.mjs`. Screenshots only if the computer bridge / a browser tool is available
  in this session (otherwise build from illustrations, maps, numbers and logos; don't stall).
- Storyboard: 14–20 scenes, ≤ 1 plain text title per 5 scenes, 10–20 emphasis phrases. Variety (Edu, 29 Oct): no component
  in more than 3 scenes (and change the camera or setting each time); a timeline (Ruler) at most once and only when a
  sequence of 3+ dates is the point, never in two reels in a row; no "Illustration" captions on obvious graphics. Show the
  thing itself (a real document, a headline, the object, the person's name card) rather than a generic stand-in. **Default to the realistic 3D
  components** (`engine/references/storyboard-spec.md` → 3D; Edu's standing feedback): light/dark rhythm applies to 2D scenes only.
  Reuse components first. A new component is fine if a topic needs it (add it under `engine/template/src/scenes/`
  and register it); keep it generic so later episodes can reuse it.
- Build + QA: `build_timeline.py` must pass with no ERROR; for 3D reels run `python3 tools/qa_frames.py episodes/<id>`
  (one still per scene) instead of qa_stills' full draft; look at `qa/contact.png` and fix clipping,
  tiny text, empty scenes, marks off target, and visuals that don't match their words. Max 3 rounds.
- Render: `npx remotion render Reel ../episodes/<id>/<id>.mp4 --codec h264 --crf 18 --x264-preset veryfast`.
  3D renders in software (~60–80 min for 50 s on 2 cores): start it with nohup and keep the session busy (poll the log)
  until it finishes; a background job is stopped soon after the turn ends.
- `cover.jpg` (strongest frame) and `caption.txt`: 1–2 lines + the channel's sign-off + max 5 hashtags (Instagram's cap);
  a final "Sources:" block for the first comment. Then check it:
  `python3 tools/ig/check_caption.py episodes/<id>/caption.txt --fix`. FAIL lines must be fixed. WARN lines are judgement
  calls: rewrite stock phrases and structural tells it lists, keep crypto terms. Make the hook land inside the first ~125
  characters, because that's all the feed shows before "... more".

## 2a. Script review (before the voice)

Edu (29 Oct 2026): the landfill reel didn't say who the man was, how it happened, or why the lesson matters. Catch that before
spending an hour on voice and render. When the script and research.md are done, spawn a fresh reviewer with the Agent tool
(subagent_type "general-purpose", run_in_background false) with this brief, <id> filled in:
> You are the script editor for Edu's crypto explainer reels (@sonartracker.io). You did not write this script. Read
> ~/reels/engine/references/review-rubric.md, section "Script check", and ~/reels/engine/references/script-guide.md,
> section "Story reels: Edu's standard". Then read episodes/<id>/script.txt and episodes/<id>/research.md. Answer: does every
> person get introduced (who, why they matter) before they act? Is the chain of events explained (how it happened, what was
> tried, why it failed)? Are there 6+ concrete sourced facts? Does the ending name this story's specific mistakes and the fix,
> and say why? Is it 120–160 words? Reply with VERDICT: PASS or REWRITE, and for REWRITE the exact lines to change.
Rewrite and ask again until PASS (max 2 rounds). Only then voice it.

## 2b. Independent review (after the final render, before saving/posting)

Edu (27 Oct 2026): an agent that didn't make the video checks it against his standard, and accepts it if it's good enough.
```bash
python3 tools/review_pack.py episodes/<id>   # frames from the final mp4, each labelled with what's being said + scene list
```
Spawn a fresh reviewer with the Agent tool (subagent_type "general-purpose", run_in_background false). Give it this brief,
with <id> filled in, and nothing about how you made the video:
> You are the independent reviewer for Edu's crypto explainer reels on Instagram (@sonartracker.io). You did not make this
> video. Working directory ~/reels. Read engine/references/review-rubric.md first and apply it exactly: default to PASS,
> FAIL only for its must-fix list, the bar is "Edu would be happy to have this on his account", not perfection.
> Material for episode <id>: episodes/<id>/review/pack.md (scenes, timings, words spoken), every
> episodes/<id>/review/sheet_*.png (frames from the final video, each labelled with what's being said),
> episodes/<id>/script.txt, research.md and caption.txt. Check every on-screen number against research.md.
> Write episodes/<id>/review.md in the rubric's output format and reply with its contents.

- **PASS / PASS WITH NOTES** → go on to §3 and §4a. Don't re-render for notes; they feed the next episodes.
- **FAIL** → fix only the must-fix items, re-render once, rebuild the pack, and have a fresh reviewer check again (same brief).
  Still FAIL → don't post: §3, then hand over with §4b and include the must-fix list.
- No Agent tool in this session → review it yourself against the rubric, write review.md, and add
  "(self-review: no reviewer agent available)" under the verdict.
`review.md` is committed with the episode; the `review/` folder is not.

## 2c. Story (the reel cut into bits)

Edu (28 Oct 2026): "cut the video in little bits and post it as a story". After the review passes:
```bash
python3 tools/make_story.py episodes/<id> --line "<end-card teaser, max ~45 chars: the open question or the fact, plainly>"
# optional: --highlight 12.4-17.0  (pick the strongest 3-7 s moment yourself if the automatic pick is weak)
ffmpeg -v error -y -ss 1 -i episodes/<id>/story_2.mp4 -frames:v 1 episodes/<id>/qa/story_2_check.png   # look at it, and at story_3.jpg
```
Three story items, posted in order: (1) the hook, up to ~9 s, ending on a sentence (ideally the open question); (2) one
3–7 s highlight from the middle (the most concrete line, or `--highlight`); (3) an end card image ("NEW REEL", your teaser,
the handle), all inside the story-safe area. Stories can't carry links or stickers through the API, so the card says where
the reel is. If it fails or looks wrong after one fix, skip the story: it never blocks the reel.

## 3. Save the episode and host the video (this is NOT posting)

```bash
python3 tools/finish_episode.py episodes/<id> --channel <channel> --topic "<backlog item text>"
git add -A && git commit -m "episode: <id>" && git push      # scripts, sources, storyboard, caption (no media)
bash tools/publish_media.sh episodes/<id>                   # pushes mp4 + cover (+ story) to the media branch; prints VIDEO_URL / COVER_URL / STORY_URL
```
`VIDEO_URL` is a public raw.githubusercontent.com link that Instagram downloads the video from. GitHub Releases
are not available to these sessions, so don't use them.

## 4a. Post (when the gate passes)

```bash
python3 tools/prepost_check.py episodes/<id>   # PASS → writes caption_post.txt + sources_comment.txt (+ prints STORY_URL)
```
0. **Check what's already live** (29 Oct 2026: three reels on the same landfill story went up in one day because two sessions
   each made a remake; the third got ~1/8 of the views). Pull the last two days of media first:
   `get_data(connector="instagram", accounts=["17841440268229419"], date_preset="last_2dT", fields=["media_id","timestamp","media_caption"])`.
   If a reel on the same story or topic went up in the last 7 days, don't post: hand over with §4b and say which one is live.
   Do the same before telling Edu anything is "not posted", and `git pull` first: another session may have posted it.
1. Publish with the **Windsor.ai for Social Media** connector:
   `execute_action(connector="instagram", account="17841440268229419", action="create_video_post",
   params={video_url: VIDEO_URL, cover_url: COVER_URL, caption: <caption_post.txt>, share_to_feed: true})`.
2. With the returned media id: `create_comment(media_id, message=<sources_comment.txt>)`.
3. If the gate printed STORY_URLS, post each one in that order with `execute_action(connector="instagram",
   account="17841440268229419", action="create_story", params={video_url: <url>})` for .mp4 parts and
   `params={image_url: <url>}` for the .jpg card. A story failure doesn't undo or block the reel; just report it.
4. Update `episodes/<id>/meta.json`: `posted: true`, `auto_posted: true`, `posted_at` (UTC ISO), `instagram_media_id`,
   `sources_comment_id`, `story_media_ids` (if posted); commit and push.
5. Tell Edu (status "proactive"): the mp4 (SendUserFile) and a message: "Posted to @sonartracker.io: <topic>" (and whether
   the story went up), the reviewer's verdict, the caption, the sources, the media id, and "If anything's wrong, delete it
   in the Instagram app and tell me what to fix. Reply 'pause autopost' to go back to approving each one."
If Instagram rejects the video, retry once; if it still fails, don't keep trying: send Edu the mp4 + caption for a manual
upload and say exactly what the error was.

## 4b. Hand over and wait (when the gate fails or autopost is paused)

Send Edu (status "proactive", so it reaches his phone):
- the mp4 (SendUserFile),
- a message with what held it back (the FAIL lines or your doubt), the topic, the caption, the sources, the VIDEO_URL,
  the target Instagram account (@sonartracker.io), and: **"Reply 'post it' to publish the reel and its story clips, or tell me
  what to change."**

Then stop. Do not post.

## 5. When Edu replies to a held video

- **"post it"** (explicit): publish with the **Windsor.ai for Social Media** connector:
  `execute_action(connector="instagram", account="17841440268229419", action="create_video_post",
  params={video_url: VIDEO_URL, cover_url: COVER_URL, caption: <caption.txt without the Sources block>, share_to_feed: true})`.
  Then post the Sources block as the first comment (`create_comment` with the new media id) if one is returned, then the
  story clips (`create_story` for each STORY_URLS item, in order) if there are any.
  If Instagram rejects the video URL, retry once with the Pages URL if GitHub Pages is enabled; otherwise tell Edu
  and attach the mp4 + caption for a manual upload. Report exactly what happened, then update `episodes/<id>/meta.json`
  (`posted: true`, `posted_at`, media ids) and push.
- **Changes requested**: edit, rebuild, re-render, re-run publish_media.sh (same id overwrites the video), and send again. Wait again.
- **"skip"**: leave it unposted and untick nothing.
