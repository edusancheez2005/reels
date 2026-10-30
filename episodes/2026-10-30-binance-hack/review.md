VERDICT: PASS WITH NOTES (after the must-fix below was fixed; the reviewer's original verdict was FAIL, kept in full below)

Fix applied 30 Oct 2026, 21:04-21:06 UTC: both Al Jazeera address bars (s2, s18) now read the real domain "aljazeera.com"
(spliced frames 92-151 and 1397-1478; checked frames at 4.0 s and 48.0 s of the final mp4). The reviewer wrote: "With this
fixed, the reel is a PASS WITH NOTES." Also spliced: s5 box nudge. Not re-rendered: the other layout notes (s13 "platform"
cut, s14 underline, s19 ring, s20 tag size/margin, s8 tag margin) - Edu at 21:03: "no need to re-render. post it, its perfect".
No second fresh review: Edu asked to post now; the only must-fix was the URL text, verified on the frames above.

---- Original review ----
Original verdict: FAIL

Must fix:
1. s2 (3.1–5.1 s) and s18 (46.6–49.3 s), the Al Jazeera screenshot: the browser bar shows an address that doesn't exist.
   - What's wrong: the bar reads "aljazeera.com/economy/2026/10/30/binance-says-6-3bn-stolen". [Certain] That URL returns 404.
     The article's real address (research.md item 1, and the page's own canonical link) is
     ".../binance-says-2-54bn-in-crypto-funds-frozen-amid-potential-security-issue". Al Jazeera updated the headline but kept the
     original slug, and the producer typed a new slug to match the new headline.
   - What's genuine: [Certain] the headline, standfirst and "would cover all losses" quote are real captures (checked against
     assets/raw/aljazeera.png and aj_cover.png).
   - Why it's a fail: only the typed URL is invented, but it still makes a screenshot of a real organisation give a false source.
     That is the rubric's "fakes a screenshot" and factual-error line. Every other URL bar in the reel (TRM, Chainalysis, FBI IC3,
     The Record, Korea Times) is a true prefix of a live page, and earlier reels used either the bare domain or the real path.
   - The change: set `url` in storyboard.json lines 103 and 958 (timeline.json lines 1486 and 2412) to "aljazeera.com", the bare
     domain as in wallet-words and landfill-story. A true prefix of the real URL, ending in "…", also works. Re-render s2 and s18
     and splice them in. No re-voice or timing change is needed. With this fixed, the reel is a PASS WITH NOTES.

Checked: 61.6 s, 20 scenes, 13+ sourced facts.

Every on-screen number matches research.md:
- $6.3B (item 1): s1, s4 and the cover.
- 20 MIN, "Thu 29 Oct · from 20:05 UTC" (item 2): the counter ticks 9 → 13 → 19 at 5.1–5.9 s and lands on 20 before "twenty" is spoken.
- $1.5B Bybit 2025 and ×4 (item 3): 6.3 / 1.5 = 4.2.
- Headlines: TRM $6.36B, Chainalysis and Elliptic $6.4B (item 1).
- TRM takeaways: ten blockchains, 20:05 UTC, "about four times" (items 2–4 and 8).
- FBI PSA I-022625-PSA, 26 Feb 2025, $1.5B Bybit (item 6).
- Ten chain logos, all in Elliptic's list of eleven (item 8).
- 0x1510…feb7 and "Bitget hack, Sep 2026" (item 9).
- $387 million, 25 Sep 2026 (items 9 and 15).
- ≈50%, UN panel of experts 2024 (item 10).
- $2.8B frozen (item 11): Elliptic $2.84B, Chainalysis ~$2.8B.
- "would cover all losses" (item 12).
- BTC −5.4% (item 13), recomputed from assets/raw/btc_coingecko.json: $80,769 → $76,404 = −5.40%. The chart follows the hourly
  series (peak $81.7k at Thu 16:00, low $76.4k).
- Caption: BNB is −6.44%, shown as "about 6%".

Beyond the numbers:
- All seven screenshot sources are real captures in assets/raw/.
- Hedges survive in both voice and caption: "point to", "It's not official", "may have started", "about".
- Everyone is introduced before they act: Binance, the three firms, TraderTraitor, the unnamed engineer (labelled 3D stand-in),
  Bitget ("another exchange") and the UN experts.
- How it happened is shown step by step: laptop → withdrawal approvals → wallets → 10+ networks.
- No price prediction or nudge, and the caption says "Not financial advice".
- The hook puts $6.3 BILLION on screen from the first frame while the vault empties.
- Captions track the voice word for word in every frame I sampled.
- The ending is tied to this story ("This hack tested both"), so it clears the "generic tip" bar (see note 3).

Notes for next time:
1. Instagram safe zone and edge margins.
   - s20 (58.6–61.6 s): the closing tag "+ THEIR PROMISE TO PAY YOU BACK" runs from x 84 to 991 at y ≈ 1455, so "CK" sits under
     Instagram's button column (the limit is x < 940 when y > 1000). Split it onto two lines or size it to end by x 920. If time
     allows, this is cheap to fold into the same re-render.
   - "COMPROMISED LAPTOP" (s8, 21.8–22.3 s) ends 14 px from the right edge, and "THEIR SECURITY" (s20) ends 36 px from it.
     Keep ≥ 40 px.
   - Smaller nits:
     - The s5 box on "North Korea Link" (~10.4–11.2 s) starts inside the "N".
     - The s14 underline (38.7–39.6 s) sits half a line low. It runs across the top of "a report by a U.N." instead of under
       "about half of its".
     - The Record headline's last word "platform" is cut off by the card edge at 34.9–35.6 s.
     - The s19 ring around −5.4% covers the "Fri 12:00" tick (51.6–52.6 s).
2. Give "It's not official" its own visual (s7, 13.6–14.6 s).
   - For that second, the screen shows the 2025 FBI notice. So the only official-looking thing on screen works against the caveat
     being spoken.
   - Show the caveat first: either Nextgov's line that the FBI "is aware of the incident" (already captured in
     assets/raw/nextgov.png) or a "NO GOVERNMENT HAS CONFIRMED IT" stamp. Then bring in the PSA on "but the FBI" (14.6 s).
3. Sharpen the ending (s20, 52.6–61.6 s).
   - It names two things your crypto depends on, but not this story's mistake and its fix. The material is there:
     - the weak spot: one engineer's laptop could reach the system that approves withdrawals;
     - the fix: no single machine or person should be able to move funds alone;
     - the "promise" half is concrete: Binance set aside about $6.34B of its own money (item 12).
   - For example: "The weak spot: one laptop could reach the system that approves withdrawals. Binance is paying it back from its
     own money. Crypto on an exchange depends on both."
   - Also, the scene holds a single label from 54.5 to 57.3 s. Let each tag land on its word, with some motion between them.
4. The mechanism is the flattest part (s9, s10, s12).
   - What's there: 2D Flow cards with emoji laptop and padlock icons, generic chain-link icons for Base, Arbitrum, Avalanche and
     Tron, and a bank icon for Bitget. Edu asks for realistic 3D for the key mechanism, and real logos.
   - Build laptop → approval console → hot wallet → coins fanning out to ten real chain logos, in the same 3D world as the s1
     vault. Use Bitget's real logo (it's in the s13 screenshot).
   - The big-head toon engineer (s8) has now been flagged in three reels (wallet-words note 3, landfill-story note 5). Give the
     figure adult proportions in a real office, or show Binance's own statement instead.
   - 10 of the 20 scenes use the same Shot card, against the "no component in more than 3 scenes" rule. Vary the treatment in the
     s13–s18 run (split-screen, phone, 3D desk).
5. Beginner gaps on screen.
   - "frozen by Tether, Circle and others" (s17, 43.0–46.6 s) never says who they are or how stolen crypto can be frozen. Add
     "the companies behind digital dollars froze their coins" to the voice or the label.
   - The highlighted Chainalysis label "Previous attributed DPRK Hack" (s11, 30.9 s) leaves "DPRK" unexplained. Add a
     "= North Korea" tag.
   - In the caption, change "BNB about 6%" to "Binance's own coin, BNB, about 6%".

Scores 1–5: sync 4, detail/realism 4, hook 5, beginner clarity 4, accuracy 4, phone readability 4
