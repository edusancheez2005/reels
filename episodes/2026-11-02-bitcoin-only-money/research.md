# What if Bitcoin was the only money? — research

Episode 2026-11-02-bitcoin-only-money · channel crypto · topic_source: plan (trend scout 03:50 London: "NOTHING BIG: follow the plan",
see insights/trends/2026-11-02.md). Thought experiment, said so in line 2. No price predictions. Maya is a made-up person (not a
stand-in for anyone real), so her card says "made-up resident · thought experiment".

## Facts (each on screen or spoken; checked 2 Nov 2026)

1. **Bitcoin's base network handles about 3.3–7 transactions a second; a block about every 10 minutes.** Wikipedia, "Bitcoin
   scalability problem": "the base layer processes an estimated 3.3 to 7 transactions per second"; "an average block creation
   time of 10 minutes". https://en.wikipedia.org/wiki/Bitcoin_scalability_problem — script uses the upper figure, "about seven".
   On screen: "≈7 payments / second".
2. **Visa: 65,000+ transaction messages per second (capacity).** Visa fact sheet, data as of 30 Jun 2019:
   "65,000+ transaction messages per second (capacity)". https://www.visa.de/dam/VCOM/global/about-visa/documents/visa-fact-sheet-july-2019.pdf
   Also in Visa's 10-K filings (SEC): https://www.sec.gov/Archives/edgar/data/0001403161/000140316118000055/v093018.htm
   Script: "Visa handles up to sixty-five thousand a second" (capacity, not average load). On screen: "65,000 / second · capacity".
3. **Record average Bitcoin fee: $128, 20 April 2024 (halving day).** Cointelegraph, citing YCharts:
   https://cointelegraph.com/news/bitcoin-fees-crash-after-daily-average-record-halving-day — also CoinMarketCap Academy
   https://coinmarketcap.com/academy/article/bitcoin-transaction-fees-plummet-after-record-highs-on-halving-day . On screen: "$128 average fee · 20 Apr 2024".
   Why fees: blocks have limited room, so payments wait (the queue) and higher fees get picked first (Wikipedia scalability page:
   limited block size → fees rise with demand).
4. **Bitcoin payments can't be reversed; no chargebacks.** Wikipedia "Bitcoin" lists "the inability to process chargebacks" among
   reasons cited for not using bitcoin. https://en.wikipedia.org/wiki/Bitcoin . A refund is a new payment the receiver chooses to send.
   On screen: "can't be reversed", "only the café can send it back".
5. **Every transaction is public on the blockchain.** Wikipedia "Bitcoin": "all transactions are public on the blockchain";
   "Bitcoin is pseudonymous, with funds linked to addresses, not real-world identities." https://en.wikipedia.org/wiki/Bitcoin
   On screen: "public record · forever". (Script says "public", not "your name is public": addresses, not names.)
6. **Bitcoin lost 64% of its dollar value in 2022.** CoinDesk, "Understanding Bitcoin's 64% Decline in 2022":
   https://coindesk.com/video/understanding-bitcoins-64percent-decline-in-2022/ ; Fox Business year-end report
   https://www.foxbusiness.com/markets/brutal-year-bitcoin-almost-3b-lost-in-crypto-hacks-marked-2022 . (Motley Fool AU rounds to 65%;
   we use 64%.) On screen: "2022: −64%".
7. **Lose the key/phrase, lose the coins; nobody can reset it.** Wikipedia "Bitcoin": "Losing a private key means losing access to the
   bitcoins, with no other proof of ownership accepted by the protocol." https://en.wikipedia.org/wiki/Bitcoin
   A recovery phrase is 12 or 24 words that rebuild the key (as in our 30 Oct wallet-words reel; BIP-39 word list of 2,048).
   On screen: "12 words", "no reset".
8. **Supporters' side: fixed supply, nobody can print more.** Wikipedia "Bitcoin": new coins only "until ₿21 million have been issued
   in total". https://en.wikipedia.org/wiki/Bitcoin . On screen: "21,000,000 max".
9. **Lightning: a second layer for near-instant, low-fee payments.** Wikipedia scalability page: Lightning "allows near-instant,
   low-fee payments that settle on the Bitcoin base layer." https://en.wikipedia.org/wiki/Bitcoin_scalability_problem
   On screen: "Lightning · a layer on top · near-instant".
10. (Context, not spoken) The one real-world try: El Salvador made bitcoin legal tender in Sept 2021; in Jan 2025, after a $1.4B IMF
    deal, acceptance became voluntary and taxes can't be paid in BTC. https://cointelegraph.com/news/el-salvador-bitcoin-status-btc-law-amendment
    Not used on screen (word budget).

## What I didn't use
- "Bitcoin can only do 3 tx/s" (low end) — used the generous "about seven" so we don't overstate the problem.
- Visa's average real load (much lower than 65k) — the script says "up to", i.e. capacity.

## Lesson (the ending)
Two of Maya's problems already apply to anyone holding bitcoin today: payments can't be pulled back (fact 4) → check the address
before sending; the phrase is the only way back in and nobody can reset it (fact 7) → two offline copies.

## Format
Candidates:
- **scenario** (chosen): a what-if lived by one ordinary person; Edu's direction for today (1 Nov): "the person walking around like a
  third person observation and animations". A new reusable `Walk3D` scene: Maya walks a small built street, camera following.
  Uses the Walk3D world in more scenes than the 3-scene cap, because the format is one continuous walk through one world with a new stop
  and camera each time (same reasoning as the Iso3D exception).
- motion: 7 vs 65,000 is a great number contrast, but loses the "day in that world" feeling Edu asked for.
- breakdown: the last breakdown was 31 Oct (what-if $1); repeating that look two what-ifs in a row would feel samey.
Previous reels: 1 Nov character, 31 Oct breakdown, 30 Oct character/documentary → scenario differs.

## Receipts (real pages, captured)
- Cointelegraph halving-day fee article (fact 3).
- Wikipedia "Bitcoin scalability problem" line (fact 1/9).
- Visa fact sheet is a PDF (headless browser can't render it) → Quote card with the exact words + source.

## Script review
Round 1 (fresh reviewer): REWRITE — Visa line missing "payments", queue cause, "public" line orphaned (cut; fact 5 no longer on
screen), "print more" what, "recovery words" vs "phrase", no why on the last fix. All applied.
Round 2 (fresh reviewer): REWRITE — queue vs café line, "can't be reversed" → "no bank can cancel", "dollar value" in a no-dollar
world, "no bank" → "nobody", "layer on top" jargon. All applied verbatim (max 2 rounds reached; every listed line changed).

## On screen (each traced to a fact above)
- s1 "≈ 7 / second", "the whole world's payments" (fact 1); s5 Wikipedia line "an estimated 3.3 to 7 transactions per second" (fact 1).
- s4 "65,000 / sec · Visa capacity" (fact 2), "≈ 7 / sec" (fact 1), "≈ 9,000× more": our arithmetic, 65,000 ÷ 7 ≈ 9,286, rounded down.
- s6 "pending · waiting in line", "bigger fee → goes first" (fact 3 mechanism: limited block space, higher fees picked first).
- s7 Cointelegraph headline "$128" and "average of $128 on April 20" (fact 3).
- s8 "no bank to call", "only the café can refund" (fact 4).
- s9 "−64% · Bitcoin's price · 2022" (fact 6).
- s10 "her recovery phrase · 12 words", "wallet locked · no reset button" (fact 7).
- s11 "21,000,000 · Supporters: nobody can print more" (fact 8).
- s12 "an add-on built on Bitcoin", "paid · near-instant" (fact 9).
- s14–15 "Payments are final / double-check before you send"; "two copies · offline" (lesson; facts 4 and 7). The Seed3D card shows
  example words (generic BIP-39 words, not a real wallet), as in the 30 Oct reel.
- Street signs (CAFÉ, BANK, BOOKS, MARKET, BAKERY, door "12") are generic props in Maya's made-up world, no real brands.
