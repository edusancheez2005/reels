# Weekly Instagram review — runbook

Runs every Sunday evening (scheduled task "Weekly Instagram review"). Read-only on Instagram: it pulls numbers, writes a
report, updates `insights/learnings.md` (which every daily run reads before writing its script) and tells Edu.
It never posts, comments, follows or messages anyone.

## 0. Start
Attach the repo (`add_repo(owner=edusancheez2005, repo=reels, access=push)`), clone it to `~/reels`, `cd ~/reels`.
No studio setup needed (no rendering).

## 1. Pull the numbers (Windsor.ai for Social Media connector)
```
get_data(connector="instagram", accounts=["17841440268229419"], date_preset="last_60dT",
         fields=["media_id","timestamp","media_type","media_permalink","media_caption","media_views","media_reach",
                 "media_reel_skip_rate","media_reel_avg_watch_time","media_shares","media_saved","media_like_count",
                 "media_comments_count"])
get_data(connector="instagram", accounts=["17841440268229419"], fields=["followers_count","media_count"])
```
If a call comes back "pending", call it again with the same parameters until it's done. Save the first result **exactly as
returned, every row** to `insights/raw/<YYYY-MM-DD>.json` (London date). Note `followers_count`.

## 2. Build the report
```bash
python3 tools/ig_stats.py insights/raw/<YYYY-MM-DD>.json --asof <YYYY-MM-DD> --followers <followers_count>
```
It updates `insights/history.json` and writes `insights/weekly/<YYYY-MM-DD>.md`.

## 3. Update `insights/learnings.md`
Read the new report, the previous two reports, and the "Notes for next time" in the review.md of the episodes judged this week.
Then rewrite `learnings.md` (keep its sections: Do / Avoid / Not working yet / Watching), under 12 bullets:
- Every bullet: the instruction for the next scripts, a tag ([Certain] / [Likely] / [Guessing]) and the evidence (reel ids, numbers, n).
- [Likely] needs at least two reels showing the same thing; [Certain] needs a clear pattern across 6+ reels. One reel is [Guessing].
- Remove or downgrade anything this week's numbers contradict. Don't keep a rule just because it was there.
- Judge by outlier multiple, 3-second skip and shares/saves per reach, not raw views. Check posting time last, and only claim
  something about it when the reels compared were posted at genuinely different times.
- If a topic type clearly flops twice, move similar items down in `backlog/crypto.md` (don't delete them) and say so in learnings.

## 3b. Write next week's `insights/plan.md`
Seven rows (one per day, following `channels/rota.json`), in the same table format as the current plan: channel, type
(Proof / Teach / Story / Opinion; never the same type two days running; at most one Sonar product mention a week), topic and
angle, a hook with its formula number from `tools/ig/hooks.json` (Jake Schincariol's 26 formulas; the current plan.md shows the format), and a story-card
teaser. Pull topics from the top of `backlog/crypto.md` and `backlog/sonar.md`, apply `learnings.md`, and reorder the backlogs
so the daily runs reach these topics on the right days. Hooks are leads; the daily run verifies them.

## 4. Save and tell Edu
```bash
git add insights backlog && git commit -m "insights: weekly review <date>" && git push
```
Send Edu (SendUserMessage, status "proactive"), at most 6 short lines:
- followers now (and the change since last week),
- best reel of the week (views, × median, 3s skip) and the worst,
- the one change the daily reels will make because of it,
- anything that needs him (e.g. a reel that underperformed for a reason only he can judge).
No charts, no files. Then stop.
