# The 2010 bug that made 184 billion bitcoin — sources (checked 1 Nov 2026, 04:00–04:30 UTC)

Plan row: Sun 1 Nov (crypto, story, "documentary" suggested). Trend scout found nothing that clears RUNBOOK §0b
(see insights/trends/2026-11-01.md), so topic_source = plan.

## What happened
1. 15 Aug 2010: block 74638 contained a transaction that created 184,467,440,737.09551616 BTC. Two addresses received
   92.2 billion BTC each (the block's miner got an extra 0.01 BTC). [Certain] — Bitcoin Wiki, "Value overflow incident"
   (CVE-2010-5139): https://en.bitcoin.it/wiki/CVE-2010-5139 ; Decrypt, 26 Aug 2020, "The Day Someone Created 184 Billion
   Bitcoin" (two addresses each received 92,233,720,368 BTC): https://decrypt.co/39750/184-bill
   - Exact output value per Garzik's dump: 92233720368.54277039 BTC; he asks whether it's UINT64_MAX (the largest number
     the field could hold). [Certain] — https://bitcointalk.org/index.php?topic=822.0 (first post)
   - On screen: "184,467,440,737 BTC", "92,233,720,368 BTC × 2", "Block 74,638", "15 Aug 2010".
2. The input of the transaction was 0.5 BTC (from a faucet, never used since). [Certain] — Bitcoin Wiki (above).
3. Cause: the code that checks transactions "did not account for the case of outputs so large that they overflowed when
   summed" — the sum wrapped around, so it no longer exceeded the input and the "outputs ≤ inputs" check passed.
   [Certain] — Bitcoin Wiki; Decrypt ("overflow bug"). The car-mileage-counter rollover is our analogy for integer
   overflow, not a quote.
4. 21 million: the most bitcoin that can ever exist. The 0.3.10 fix was a soft-forking change that rejected overflow
   transactions (totals that wrap around) [Certain — Bitcoin Wiki]; it also rejected any transaction paying more than 21 million BTC
   in one output. [Certain] — Bitcoin Wiki (above). 184.47 billion ÷ 21 million ≈ 8,784× (our arithmetic; not on screen
   unless as "≈ 8,800×").

## Who
5. Jeff Garzik (forum name jgarzik) spotted it: thread "Strange block 74638", 15 Aug 2010, 06:08:49 PM (forum time):
   "The "value out" in this block #74638 is quite strange". [Certain] — https://bitcointalk.org/index.php?topic=822.0 ;
   Decrypt names him as the one who spotted it.
   - Who he is: "spent five years as a Bitcoin core developer and ten years at Red Hat"; his Linux kernel work "is now found
     in every Android phone". [Certain] — https://bloq.com/team/ (Bloq CEO/co-founder). On screen: "Early Bitcoin developer".
6. Satoshi Nakamoto, Bitcoin's pseudonymous creator (author of the white paper, https://bitcoin.org/bitcoin.pdf), posted the
   fix: thread "Version 0.3.10 - block 74638 overflow PATCH!", by satoshi, 15 Aug 2010, 11:48:22 PM (forum time). The post
   says the valid chain has grown longer than the invalid one, so upgrading reorganises automatically. [Certain] —
   https://bitcointalk.org/index.php?topic=827.0 ; Decrypt: "Satoshi implemented the fix, Bitcoin patch 0.3.10".
   Bitcoin Wiki: "a new client was released within five hours". Script says "That night" (true by either timing).
   His identity is unknown [Certain, widely reported]; on screen "identity unknown".
7. Who made the transaction is unknown. [Certain] — Decrypt ("The exploiter remains anonymous"). Not spoken (time).

## How it ended
8. Patched nodes rejected the bad block (soft fork); unpatched nodes kept building on the bad chain, but the good chain
   overtook it at block 74691 on 16 Aug 2010. The bad transaction is not on the longest chain, so the coins it created
   don't exist. [Certain] — Bitcoin Wiki.
   - Primary check (mempool.space API, 1 Nov 2026): block 74691 = 00000000005c22d199706df1c38b38d76f8401920dcbe91edf3417f8847da707
     (matches the wiki's hash), timestamp 2010-08-16 08:20:08 UTC → "by next morning". Block 74638 on today's chain =
     000000000069e1affe7161ab4bcbeacebb4ddf155b50e807f42de971b688a09b, timestamp 2010-08-15 23:53:59 UTC, 3 transactions —
     a different hash from the bad block in the wiki (0000000000790ab3f22e…), i.e. a replacement block mined after the fix.
     Block 74637: 2010-08-15 17:02:43 UTC. https://mempool.space/block/000000000069e1affe7161ab4bcbeacebb4ddf155b50e807f42de971b688a09b
   - Not used: the overflow txid listed on the wiki (4a5e1e4b…) resolves to the genesis coinbase on mempool.space, so we
     don't show a txid.
9. A block = a batch of payments added to the chain about every ten minutes (white paper uses 10-minute blocks in its
   calculations). [Certain] — https://bitcoin.org/bitcoin.pdf ; Bitcoin Wiki.

## Not used
- Price then (~$0.07, Decrypt): dropped for length.
- "Within five hours" as an on-screen number: forum timestamps give ~5 h 40 min between the two threads; the voice says
  "that night" instead.

## Format candidates
- character (chosen): two real people drive this story (Garzik spots it, Satoshi fixes it). 3D stand-ins at their desks, the
  real forum threads and today's explorer as receipts, plus an odometer that rolls over for the bug itself. Last posted
  reel (31 Oct) was breakdown; character was last used 30 Oct morning (4 reels ago).
- documentary: the plan's suggestion (forum thread + explorer as the spine). Rejected: used 3 reels ago (Binance), and this
  is a people story more than a news story.
- motion: counters and a mileage-counter rollover. Good for the number, but loses the two people; borrowed for 2 scenes.

## Lesson (ours, from the facts above)
- The mistake: the check added amounts without checking they were small enough to add (fact 3).
- The fix: reject outputs above 21 million and overflowing sums (fact 4).
- Why it matters: the 21M limit is enforced by every node running the same code; when the code was wrong, it took a code
  change everyone ran to restore it (facts 6, 8).

## Script review
- Round 1 (fresh agent): REWRITE — "twice" ambiguous, "every computer" unclear, fix line lacked the why. Applied.
- Round 2 (fresh agent): REWRITE — "spotted it" ambiguous, "bitcoin" dropped after two numbers, ending's "why" didn't land.
  Applied its exact lines (max 2 rounds reached; all its points addressed). Final 160 words.

## On screen, scene by scene (every claim → a line above)
- s1 "184,467,440,737 BTC", chip "Block 74,638 · 15 Aug 2010", "created out of nothing" (1). s2 "21 million" vs "184,467 million",
  "≈ 8,800×" (4, arithmetic 8,784). s3 card "JEFF GARZIK · Early Bitcoin developer · Linux coder · 3D stand-in" (5).
- s4 "a block = a batch of payments" (9). s5 real forum thread 822: theymos's printout of the block's two 92233720368.54 outputs,
  Garzik's "92233720368.54277039 BTC?" line, the thread title + 15 Aug 2010 date (1, 5).
- s6–s7 "computers running Bitcoin", "rule: out ≤ in", "in: 0.5 BTC", "out: 92,233,720,368 BTC × 2" (1–3).
- s8 Odometer (our analogy, labelled as a mileage counter): "rolls over → looks tiny", "smaller than the ½ BTC paid in" (3).
- s9 "check passed ✓" (3). s10 card "SATOSHI NAKAMOTO · Bitcoin's anonymous creator · 3D stand-in · real identity unknown",
  "15 Aug 2010 · that night" (6). s11 real forum thread 827 (title, date, "The good block chain has overtaken the bad block
  chain…") (6, 8). s12 mempool.space block 74,638 today: a normal 50 BTC block (8).
- s13 "never checked the size" (3). s14 "The fix · version 0.3.10": "Any amount over 21 million BTC — REJECTED", "Totals that
  roll over — REJECTED" (4). s15 "21,000,000 BTC", "the limit lives in the code" (4, lesson). s16 "rolled over",
  "Wrong code → wrong limit" (lesson).
