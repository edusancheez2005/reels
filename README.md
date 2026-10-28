# reels

An automated pipeline for short explainer reels (9:16, 30–35 s), produced by Claude on a schedule
and posted to Instagram automatically when it passes the pre-post checks (`tools/prepost_check.py`); otherwise held for approval.

- **engine/**: the explainer-reels skill (research → script → voice → word-anchored storyboard →
  Remotion render → QA). See `engine/SKILL.md`.
- **RUNBOOK.md**: what every scheduled run does, including the approval gate.
- **channels/**: brand, tone, rules and Instagram account per channel, plus `rota.json` (which weekday runs which channel).
- **backlog/**: topic queues per channel (ticked when produced).
- **episodes/**: every episode's script, sources, storyboard, word timings and caption. Videos live on the
  `media` branch (newest 12 only), served at raw.githubusercontent.com links for Instagram to fetch.
- **tools/**: `setup.sh`, `use_channel.py`, `finish_episode.py`, `publish_media.sh`.

## Schedule
Every day at 06:49 London time. Crypto explainers Mon/Wed/Fri/Sat/Sun, Sonar on-chain topics Tue/Thu.
Each run posts itself when the checks pass, then sends a phone notification (video, caption, sources, media id).
Pause with `channels/autopost.json` → `"enabled": false` (or tell Claude "pause autopost"); held videos wait for "post it".

## Run one by hand
```bash
bash tools/setup.sh && source .env.local
python3 tools/use_channel.py general
# then follow RUNBOOK.md §2–4
```

## Also
- **Daily story:** each reel gets a story cut from its hook plus an end card pointing to the reel (`tools/make_story.py`).
- **Caption check:** `tools/ig/` (Jake Schincariol's caption linter + humanizer, MIT) runs on every caption before posting.
- **Weekly stats review:** every Sunday evening `RUNBOOK-weekly.md` pulls the account's numbers, writes `insights/weekly/<date>.md`
  and updates `insights/learnings.md`, which every daily run reads before writing its script.
