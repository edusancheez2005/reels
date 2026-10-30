# Review rubric: Edu's standard for a finished reel

Used by the independent reviewer agent at the end of every run (RUNBOOK §2b). The reviewer did not make the video.
**The bar is "Edu would be happy to have this on @sonartracker.io", not perfection.** Approved examples to compare with:
`episodes/2026-10-25-whale-wakes`, `episodes/2026-10-26-battery-lithium`, `episodes/2026-10-27-bitcoin-origin`.
Default to PASS. Use FAIL only for the "must fix" items below; everything else is a note for future episodes.

## What Edu has asked for (his words, paraphrased)
1. **Perfect sync.** The words on screen, the voice and the visual all match: when a thing is said, it is shown.
2. **Quick but detailed animations.** Something meaningful changes every 1–2 s; nothing sits still for more than ~2 s.
3. **Realistic and detailed, not flat.** Real screenshots and documents, real logos, realistic 3D for the key mechanism.
   His "meh" feedback was about simple, under-detailed drawings (the fish-cutting and fridge scenes before they were rebuilt).
4. **A hook that's a cool fact.** The first 2 s state the most striking verifiable fact, with a number, and show it.
   An unanswerable question ("will it go up or down?") is weak.
5. **For smart beginners.** Every crypto term is explained in a quick plain clause the first time; max one new term per
   sentence; no unexplained jargon on screen either (e.g. "coinbase transaction", "ETF", "mempool", "mine" without a gloss). Never childish.
6. **True and sourced.** Every number on screen is in research.md with a source. No price predictions, no financial advice.
   When the reel touches what something is worth, the critics' side gets a line.
7. **Plain words.** "Refrigerated container", not "reefer". American female voice.
8. **Readable on a phone.** Nothing important clipped at the frame edges, no tiny text, highlight boxes on the right words.
   Nothing important in Instagram's overlay zone (bottom ~20%, right-edge buttons): see visual-style.md "Instagram safe zone".
9. **Enough substance** (Edu, 29 Oct 2026: the 33 s landfill reel was "too short, barely any information"). 45–60 s, 6+
   concrete sourced facts, every person introduced before they act, how it happened explained, and an ending that names this
   story's specific mistakes and the fix, and says why.
10. **Original visuals.** No "Illustration" captions on obvious graphics. A timeline (date Ruler) at most once, and only when a
   sequence of dates is the point; the chapter bar at the top is not a timeline (Edu asked for it, 30 Oct 2026). No component in
   more than 3 scenes, except consecutive Iso3D scenes on one world, which count as one continuous shot. Show the real thing
   (document, headline, name card) where possible.

## Must fix (FAIL), only these
- A factual error, a number that doesn't match research.md, or a claim with no source.
- A price prediction, a "buy/sell" nudge, or anything that reads as financial advice.
- Sync clearly broken: a scene shows something different from what's being said for more than ~1 s, or captions visibly lag the voice.
- A visual defect a normal viewer would notice: clipped/cut-off text or objects, an empty or black scene, a highlight box on the
  wrong thing, overlapping labels that can't be read, a render glitch.
- The hook (first ~3 s) is confusing to a beginner, or unexplained jargon makes a whole section impossible to follow.
  (A single unexplained term elsewhere is a note, not a fail.)
- Anything that fakes a real person's words, a real organisation's post, or a screenshot.
- Too thin (Edu, 29 Oct): under 40 s, fewer than 6 concrete facts, a person who matters is never introduced, or an ending that
  is a generic tip instead of this story's specific lesson with the why.

## Notes (PASS WITH NOTES), don't block posting
Pacing could be tighter, a scene could be more detailed, a better visual metaphor exists, a minor term could have a gloss,
the caption could be sharper, colour/composition nits. Max 5 notes, each one actionable for the next episode.

## Output (episodes/<id>/review.md)
```
VERDICT: PASS | PASS WITH NOTES | FAIL
Must fix:            (only for FAIL; each: scene id, timestamp, what's wrong, the concrete change)
Notes for next time: (max 5)
Scores 1–5: sync, detail/realism, hook, beginner clarity, accuracy, phone readability
```

## Script check (RUNBOOK §2a, before the voice)
PASS only if all of these hold, otherwise REWRITE with the exact lines to change:
- Every person is introduced (name, who they are, why they matter) before they act.
- The chain of events is explained: how it happened, what was tried, why it failed or worked.
- 6+ concrete facts, each one in research.md with a source.
- The ending names this story's specific mistakes and the fix, and says why (never a generic "keep your keys safe").
- 120–160 words; the hook is a striking verifiable fact with a number; no price predictions.
