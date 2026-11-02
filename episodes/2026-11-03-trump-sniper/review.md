VERDICT: PASS WITH NOTES

Must fix: none.
Round 1's three must-fixes are resolved in this render (2026-11-03-trump-sniper.mp4, 15:42):
- s17 (41.3–42.2 s): the trader's-side tag is now two lines inside the frame, "SAYS HIS TEAM SPOTTED" / "THE POOL EARLY", at x ≈ 220–860.
- s5 (9.0–10.3 s): the underline sits under "In a message posted on his Truth Social platform and X, Trump", and the quote box encloses the whole quote.
- s18 (44.6–45.2 s): "everyone who bought later" sits fully in frame, at x ≈ 360–870.

Notes for next time:
1. The caption layout can now run a line edge to edge, and a few labels miss the house margins.
   - s19, 45.5–47.0 s: [Certain] "seven hundred and sixty-four" is a single ~1,036 px line. Its selection box spans x ≈ 4–1075, and the text spans x 22–1058.
   - Nothing is cut in the file, but there is no side margin. [Guessing] On phones where Instagram crops the sides of a 9:16 reel, the first and last letters would go.
   - Cause: this came from fixing the "sixty-/four" hyphen break. Hyphenated numbers now stay whole, but nothing caps the line width.
   - The fix: cap caption lines at ~940 px (x 70–1010). Break or shrink anything wider, e.g. "seven hundred / and sixty-four".
   - Same family, smaller:
     - s3, ~5.6–6.5 s: "5,970,000 TRUMP" ends at x 986, y 1067–1144, under the like button.
     - s8, 16.9–17.6 s: the "people buy from it" box starts at x 0.
     - The "3D recreation · trade details" line is ~20 px, against a house minimum of 26 px.
2. Trader3D is in 8 of 23 scenes (s1, s3, s7, s12, s14, s16, s17, s23). Edu's cap is 3.
   - Two setups repeat shot for shot: s3 = s12 (the fee screen) and s14 = s23 (the "+$108M" wide shot).
   - s3, 4.4–5.6 s: the screen shows "fee: $84,000" while the voice says "by buying a meme coin". The fee isn't explained until 27 s.
   - The stand-in still reads as a toy. In the s1 close-up, which is the reel's first frame, his far eyebrow pokes out past his head.
   - The fix:
     - Use Trader3D in 3 scenes at most.
     - Open s3 straight on "BOUGHT · FIRST SECOND", so the fee screen first appears in s12, when the fee is said.
     - Swap the s16 face close-up for a real Bubblemaps wallet map. Source it in research.md first.
     - Fix the eyebrow mesh.
3. Receipt crops in s19 and s10.
   - s19, 45.2–48.1 s:
     - The long NBC URL wraps onto three lines inside a one-line address bar, so its top and bottom lines are sliced in half.
     - The push-in eats the end of the headline. By 47.5 s it reads "…on Trump's mer". The boxed "764,000 have lost money" stays whole.
   - s10, 20.6–22.3 s:
     - The Helius quote is a thin strip of ~26 px text in an otherwise empty frame.
     - It also shows unexplained jargon: "single-sided liquidity position on Meteora's DLMM".
   - The fix:
     - Give Shot URLs a one-line true prefix ending in "…", or make the bar truncate.
     - End push-ins while the whole headline line still fits.
     - Crop the Helius asset to "Seventeen hours before the launch, 10% of the total $TRUMP supply was deposited" and zoom it to fill the width.
4. story_2.mp4 cuts mid-word. This is cheap to fix before posting.
   - [Certain] It ends at reel time 21.95 s with a fade. "launch." runs to ~22.16 s, and its "ch" sits at 22.04–22.14 s, so the story ends on "…seventeen hours before laun–".
   - The fix: in story.json set story_2 "to": 21.95 → 22.25 and re-export. The audio is silent from 22.20 to 22.34 s.
   - Next time: snap story out-points to the end of a word plus at least 50 ms.
   - story_1 (ends 7.53 s, between "TRUMP." and "Donald") and story_3 are fine.
5. Two terms never get a plain clause:
   - "meme coin", in the hook (4.7 s) and on the cover.
   - "Solana", on the s7 screen ("Solana · new pool alerts").
   - The fix: put a small tag in s3, e.g. "meme coin = a coin built on a joke or a famous name", or say "a joke coin" in the voice. On the s7 screen, "new pool alerts" alone is enough.

Scores 1–5: sync 4, detail/realism 4, hook 4, beginner clarity 4, accuracy 5, phone readability 3

Checked:
- Numbers on screen vs research.md: all match.
  - $1,090,000 / $1.09M (facts 4, 5).
  - $109,000,000 and "first second of trading" (fact 4).
  - 17 Jan 2025, 3 days before the inauguration (fact 1).
  - Truth Social and X, plus his post's words (fact 2, CBS capture).
  - 17 h and 10% of supply (fact 3, Helius capture).
  - $84,000 priority fee (fact 4).
  - 5,970,000 TRUMP at ≈ $0.18 each (fact 5; 1.09 ÷ 5.97 = 0.183).
  - "9+ wallets" (fact 4).
  - +$108M profit booked (fact 5).
  - 58 and 764,000 wallets, Chainalysis, May 2025 (fact 8, NBC capture).
  - Count-ups land on the sourced values.
  - Incidental, not claims: the "0.4 / 1.2 SOL" terminal feed (s7), the 21:04 Friday phone clock (s22) and the generic price line (s23).
- Receipts:
  - [Likely] All four are captures of the real pages (assets/, made with engine/scripts/screenshot.mjs).
  - [Certain] Every URL bar is a research.md URL or a true prefix of one.
  - The phone shows a generic "Social" app.
  - The trader is never named. His card reads "3D stand-in · identity unproven", and his denial gets a line.
  - Nothing fakes a person's words, an organisation's post or a screenshot.
- Sync:
  - [Certain] The mp4's audio matches voice.wav at 0 ms lag (envelope correlation 0.999), so the captions run on the voice's own word timings.
  - Every cut lands on a sentence start, and the tags land on their words.
  - ffmpeg blackdetect and freezedetect find no black frames and no frozen stretches.
- Substance and advice:
  - 57.5 s, 23 scenes, 10+ sourced facts.
  - Trump, Bubblemaps ("an analytics firm") and the snipers are introduced before they act.
  - The chain of events is explained: the pool was public 17 h early → bots → the fee → the first-second buy → the cash-out → later buyers paid.
  - The ending is this story's own lesson, with its why.
  - No price talk and no buy/sell nudge.
  - caption.txt passes the caption lint (786 characters, 5 tags). It now credits the 5.97M / $0.18 figures to Lookonchain and says "Not financial advice".
  - The voice's median pitch is ~198 Hz, in the female range.
- Cover and stories:
  - The cover reads "$109M from $1.09M, in the first second" and fits inside a 3:4 grid crop. Its blurred backdrop shows "+$108M" cut at the left edge, which is harmless.
  - story_1 and story_2 are the reel itself, inset clear of the story UI.
  - story_3's "$1M into $109M" matches The Block's headline.
