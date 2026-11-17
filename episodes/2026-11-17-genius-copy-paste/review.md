VERDICT: PASS WITH NOTES

Must fix: none

Number and address check against research.md (frames taken from the final mp4 at full size; addresses compared character by character, case included): everything the reel states matches.
- "$50,000,000" hook tag (s1) and "WALLET $50,000,000 USDT" (s2, 3.9–5.0s): fact 1, rounded for the tag; the wallet total is 49,999,950 + 50 (research "On screen", BALANCE line).
- "$50 to 0xbaf…F8b5" (s2, s4): fact 2; a true start and end of the real destination.
- "$49,999,950" (s4 SEND, s14 SENT, s17 BALANCE): fact 1.
- "42 CHARACTERS" over "0xbaf4b1aF7E3B560d937" / "DA0458514552B6495F8b5" (s5): the real destination, all 42 characters exact. Facts 3 and 5.
- "0xBaF...f8b5" (s7, s14): the look-alike's true start and end. Fact 5.
- "0xBaF", "f8b5" and the middle "F2F13638C04B10F8119760B2D2aE86b08" (s9, s10): the look-alike's 33 middle characters, exact.
- "+0.005 USDT from 0xBaF…f8b5", "real transaction · 19 Dec 2025" (s14): fact 6.
- AddressMatch (s15): both addresses exact, 42 characters each; the green marks sit on the first 3 after 0x and the last 4. Fact 5.
- "BALANCE $49,999,950" → "$0.00" (s17): research "On screen".
- Explorer page (s20): the URL shows the theft hash as far as "0xc0514a79…d45f6431" before the card cuts it, and that part matches fact 1; "Dec 19 2025 15:32:59 (+00:00 UTC)" and "49,999,950 USDT" match.
- One figure is on screen but not in research.md: "($49,934,850.07)", Blockscout's own dollar valuation inside the real capture (s20). The reel never states it, so it is not counted as a mismatch; see note 1.
- End card and caption (the $50 test, 0.005 USDT, first 3 and last 4, 49,999,950 USDT, December 2025, the three tx prefixes): all match.

Notes for next time:
1. The receipt (s20, 46.0–50.0s) is the weakest scene in the reel.
   - 46.3–47.2s: the zoom slides the capture's top row ("10mo ago · Dec 19 2025 15:32:59") half under the URL bar, so for about a second it reads as sliced text.
   - The URL and the trader's address run off the card's right edge with no ellipsis.
   - When the voice says "December twenty twenty-five" (48.0–49.7s) the date is only in the source line, which is about 22 px (the rule is 26). The box is on "Fake_Phishing1691332" instead.
   - The amount box also frames "($49,934,850.07)", which is not in research.md and sits next to the reel's own $49,999,950.
   - The card fills about a quarter of the frame and nothing moves from 48.3s to 49.9s.
   - Fix: open on the whole capture (zoom 1.0) with the date row clear of the URL bar, box "Dec 19 2025" on "December", box only "49,999,950 USDT", shorten the URL to "eth.blockscout.com/tx/0xc0514a79…", make the card bigger, and log any figure the crop shows in research.md.
2. Two places where the picture is a beat off the words.
   - s15 (34.1–37.0s): on "look-alike address" the right address types first and the look-alike only lands at about 34.8s. Then "Now it's sitting in your history" plays over the comparison card, while the history screen was up earlier (32.2–34.1s). Type the look-alike first, and cut back to the WALLET HISTORY screen on "sitting in your history".
   - s5: "42 CHARACTERS" lands at 13.3s on "characters", 1.6s after "forty-two" is said (11.6s). Land it on "forty-two".
3. Two things on screen a beginner can trip on.
   - s15 says "same start, same end", but the highlighted ends are "0xbaf" / "F8b5" against "0xBaF" / "f8b5". The capitals differ and the reel never says capitals don't count, so expect "they're not the same" comments. Add a small line such as "capital letters don't count" (put the source in research.md first).
   - "USDT" is on four screens and never explained, and the voice says "half a cent" over "+0.005 USDT" (s14). Add a sub-line "≈ half a cent", or label it once as "USDT, a dollar coin".
4. Look and readability.
   - Hook captions (0–3.7s): the pages break as "Here's how to lose fifty" / "million dollars with one copy" / "and paste.", so both emphasis boxes are split in two. Break at "Here's how to lose" / "fifty million dollars" / "with one copy and paste."
   - On the yellow scenes the already-spoken caption words fade to a pale grey that almost vanishes ("Here's how to lose" at 1.3s, "Your friend has" at 28.0s). Use a darker grey on light moods.
   - s12 (29.3–30.0s): the push-in to Stonks cuts the suit guy's face in half at the left edge. Keep his face whole or frame Stonks alone.
   - 14 of the 21 scenes are the two characters in front of a flat one-colour wall with a desk, a cup and a plant. The monitor shots carry all the detail. Dress the room (a window, a shelf, sticky notes, a second screen) so "detailed, not flat" holds for skits too.
5. Jokes: they land. The shortcut → "Because you're a genius" → "One problem" shape reads on one viewing, and "Your friend is still clapping." / "Great trade!" is the best beat.
   - Weakest line: "[suit] No." It is flat, and the hands-on-head pose does the work. A line that sets up the narrator would hit harder: "[suit] Undo. Undo!" straight into "Crypto has no undo button."
   - "Stonks!" (29.3s) repeats the "Genius!" beat (20.8s): friend shouts one word, a stamp pops. Vary the second one.
   - Stonks is on screen from 9.1s and speaks at 20.8s, but "YOUR FRIEND" only appears at 28.1s. Put the tag on his entrance.
   - Measured, not heard: Stonks's three lines are about 7 dB louder than the narrator (peaks −4 dB against −9 dB). Check on a phone speaker that this is the punch you want.

Scores 1–5: sync 4, detail/realism 3, hook 5, beginner clarity 4, accuracy 5, phone readability 4

After the review (17 Nov, before posting): note 5's level difference was fixed in the audio only. The characters' lines now sit 1.5 dB
above the narrator's median level instead of about 7 dB; the picture is the reviewed render, frame for frame. `tts_local.py` now
evens speakers out the same way for every episode. The other notes are for the next skits.
