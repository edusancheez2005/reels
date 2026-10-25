# reels

An automated pipeline for short explainer reels (9:16, 45–60 s), produced by Claude on a schedule
and posted to Instagram **only after a human approves each video**.

- **engine/**: the explainer-reels skill (research → script → voice → word-anchored storyboard →
  Remotion render → QA). See `engine/SKILL.md`.
- **RUNBOOK.md**: what every scheduled run does, including the approval gate.
- **channels/**: brand, tone, rules and Instagram account per channel, plus `rota.json` (which weekday runs which channel).
- **backlog/**: topic queues per channel (ticked when produced).
- **episodes/**: every episode's script, sources, storyboard, word timings and caption. Videos live on the
  `media` branch (newest 12 only), served at raw.githubusercontent.com links for Instagram to fetch.
- **tools/**: `setup.sh`, `use_channel.py`, `finish_episode.py`, `publish_media.sh`.

## Schedule
Mon/Wed/Fri: general "how does that work?" topics. Tue/Thu: Sonar on-chain topics.
Each run finishes with a phone notification (video, caption, sources). Reply **"post it"** to publish, or say what to change.

## Run one by hand
```bash
bash tools/setup.sh && source .env.local
python3 tools/use_channel.py general
# then follow RUNBOOK.md §2–4
```
