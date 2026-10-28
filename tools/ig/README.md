# tools/ig: caption linter + humanizer

Vendored from [Jake Schincariol's instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill)
(MIT, commit `d03c56b`, 13 Sep 2026). License: `LICENSE-instagram-agent-skill`.

| file | origin | what it does |
|---|---|---|
| `caption.py` | unchanged | lints a caption: what the feed shows before "... more" (~125 chars), length, max 5 hashtags, one ask, links, emoji |
| `humanize.py` | unchanged | strips invisible characters, dashes and curly quotes; slop-word replacements |
| `detect.py` | unchanged | five local heuristics → a "human score" (informational only) |
| `slop.json` | unchanged | the lexicon the two above use |
| `hooks.json` | unchanged | the 26 hook formulas (`insights/plan.md` tags each day's hook with one, e.g. #23 The Statistic) |
| `check_caption.py` | ours | wraps the three for this pipeline (see below) |

`check_caption.py` lints only the caption part (above `Sources:`), applies the **safe** fixes with `--fix`
(invisible characters, dashes, quotes) and **lists** slop words instead of replacing them, because some are real crypto
terms (`hack`, `unlock`, `beacon`, `ecosystem` are allow-listed). Hard fails: over 2,200 characters, over 5 hashtags,
a first line that's blank or starts with `#`/`@`, leftover invisible characters or dashes. Everything else is a warning.
`tools/prepost_check.py` runs it on every caption before posting and always posts the cleaned text.

Not vendored: the hook scorer (`hookscore.py`) and beat sheet (our storyboard pipeline already times every beat to the voice, and the
author's own test found the hook scorer can't separate hits from misses), and the browser-based competitor research.
