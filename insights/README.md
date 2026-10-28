# insights/

The account's own numbers, pulled weekly through the Windsor.ai Instagram connector (official Instagram API).

| file | what |
|---|---|
| `learnings.md` | what works on this account, with confidence and evidence. **Read by every daily run before it writes a script.** |
| `plan.md` | the coming week's reels (topic, type, angle, hook formula), built with Jake Schincariol's /ig-plan method. **Read by the daily run.** |
| `weekly/<date>.md` | each weekly report: reels ranked by outlier multiple, 3-second skip rate, watch time, shares/saves |
| `raw/<date>.json` | the exact rows Windsor returned that week |
| `history.json` | every reel's latest numbers plus one snapshot per pull, and follower counts |

How it's made: `RUNBOOK-weekly.md` (scheduled every Sunday evening) → `tools/ig_stats.py`.
Method adapted from Jake Schincariol's `/ig-audit` (MIT): rank by views ÷ the account's own median, not raw views; the
3-second skip rate grades the hook; shares and saves per reach are the strongest signals; day/time is checked last.
