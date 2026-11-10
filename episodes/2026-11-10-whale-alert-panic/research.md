# How to read a whale alert without panicking (Strategy's $4.26B "dump", Nov 2025)

Channel: sonar · plan row Tue 10 Nov (Teach, breakdown) · topic_source: plan · researched 10 Nov 2026, 03:50–04:40 London.

## Why this story (and not a recent alert)
The plan asked for a recent alert that looked scary and turned out to be an exchange moving its own coins. I checked the
recent big alerts (TokenPost/Whale Alert, 1–9 Nov 2026: 7,499 BTC unknown→Binance; 3,000 BTC Binance→unknown; 1,694 BTC
Kraken→unknown; 1,697 BTC unknown→Coinbase Institutional→unknown). No source labels any of them as internal, and none gives a
hash. I found the 1,697 BTC pair on-chain myself (below): it is real and it went in and out of the same Coinbase-scale wallet
in consecutive blocks, but the next hop split the coins into 51 outputs that were all spent within 35 minutes, so I can't say
what it was. Saying "it meant nothing" would be a guess. So the reel uses the best-documented false alarm instead, a year ago
this week: Strategy's 43,415 BTC move, read as a sale, denied by Saylor, and followed by a filing showing it had bought more.
The Nov 2026 round trip is kept out of the script (cut for length; it would also need a motive I can't prove).

## Facts used (each with source)
1. **$4.26B / 43,415 BTC, one day, 100+ addresses.** Arkham Research, "Why Strategy Is Moving BTC To New Wallets", 14 Nov 2025
   5:15 pm EST, by Finn Grant. First sentence: "Strategy (formerly MicroStrategy) transferred 43,415 BTC worth $4.26B to over
   100 different addresses today." https://info.arkm.com/research/why-strategy-transfers-moving-btc-bitcoin-sell-saylor
   Script: "Four billion dollars of bitcoin moved in one day" ($4.26B on screen). "forty-three thousand" (43,415 on screen).
   "over a hundred new addresses".
2. **The rumour: "Strategy was dumping".** The Block, 14 Nov 2025, 11:35 AM EST (Jason Shubnell): "'We are buying': Michael
   Saylor says 'no truth' to rumor that Strategy sold 47,000 bitcoin". The rumour was an X post (Walter Bloomberg account)
   saying Arkham data showed Strategy's holdings falling from 484,000 BTC to about 437,000 BTC; the post itself said "It's
   unclear whether this came from transfers or sales."
   https://www.theblock.co/post/378918/michael-saylor-no-truth-to-rumor-strategy-sold-47000-bitcoin
   Script: "the internet said Strategy was dumping it" (on screen: The Block headline as the receipt).
3. **The tracker only knew ~484,000 of Strategy's coins.** Same The Block article (Arkham data: 484,000 → ~437,000).
   Script: "That tracker only knew about four hundred and eighty-four thousand of Strategy's coins."
4. **Strategy really held over 640,000 BTC.** SEC Form 8-K, 17 Nov 2025 (mstr-20251117): 8,178 BTC bought 10–16 Nov 2025;
   aggregate holdings 649,870 BTC as of 16 Nov 2025. So before that week's buys: 649,870 − 8,178 = 641,692 BTC (over 640,000).
   https://www.sec.gov/Archives/edgar/data/1050446/000119312525283991/mstr-20251117.htm
   Also supports "a company holding hundreds of thousands of bitcoin".
5. **Arkham: a storage switch, not a sale.** Arkham article (1): "On-chain movements do not mean that Strategy has sold their
   BTC"; thesis "custodian/wallet rotation" (from Coinbase Custody, its existing custodian, to a new custodian, or internal
   refresh); "Large-scale holders like Strategy regularly undergo wallet and custodian rotations for security, operational,
   or counterparty risk management reasons." The Block also quotes Arkham: Strategy "regularly undergoes wallet/custodian
   rotations". Script: "Arkham, who runs the tracker, called it a storage switch." (Arkham runs the tracker the rumour used: The
   Block says the post cited "Arkham data".)
6. **Saylor: "no truth".** The Block (2): "There is no truth to this rumor," Saylor replied; on CNBC: "We are buying. We're
   buying quite a lot, actually, and we'll report our next buys on Monday morning." Saylor is Strategy's executive chairman
   and co-founder. Script: "Chairman Michael Saylor said there was 'no truth' to the rumour."
7. **Three days later, the filing: 8,178 BTC bought.** SEC 8-K dated 17 Nov 2025 (14 → 17 Nov = 3 days): 8,178 BTC for
   $835.6M, 10–16 Nov 2025. Script: "Three days later, a filing showed Strategy had bought eight thousand more."
8. **Coins sent to exchanges are often about to be sold.** Decrypt, 20 Feb 2026, citing CryptoQuant: the largest holders "keep
   depositing to exchanges, presumably to sell"; "Lower exchange inflows put less selling pressure on prices."
   https://decrypt.co/358782/bitcoin-sell-pressure-easing-whales-dumping-exchanges  ("often", not "always").
9. **The step: open the transaction in a free explorer (mempool.space) and follow the coins one more hop.** mempool.space is a
   free, open-source Bitcoin explorer (docs found via search: https://api.mempool.space/docs/api). On-screen example page: a
   real transaction (below). Advice, not a claim.

## On-chain check I did (mempool.space API, 10 Nov 2026 ~04:15 London) — the 5 Nov 2026 round trip (not in the script)
- TokenPost, 7 Nov 2026, "Bitcoin Transfer Leads $600.7 Million in Crypto Moves as Outflows Top Inflows": "At 11:35 a.m. ET, an
  unknown wallet sent 1,697 BTC worth $130.2 million to Coinbase Institutional." / "The largest move sent 1,697 BTC worth $130.5
  million from Coinbase Institutional to an unknown new wallet at 11:49 a.m. ET." https://www.tokenpost.com/news/investing/50613
- Block 974684 (5 Nov 2026 16:26:10 UTC) tx 501a868cecebb9e76bb6c349e269444c3c0c1294ea41b8de8c3280204532cc4a:
  bc1qmakjy7ns2z8vwgptf9vs8fndp304fg0p9xafm2 → 3MqUP6G1daVS5YTD8fz3QgwjZortWwxXFd 1,697.8800273 BTC.
- Block 974685 (16:34:29 UTC) tx dcfdddf91036bf0a7c06db991f8ec1a7d9e7d903bbccc6869503f3399ee9e41a:
  3MqUP6… → 1GA1Udsdjwc1Z7gDZpDjVhZZy82hpvBcrN 1,697.88 BTC (3MqUP6…: 121,183 txs, 26.5M BTC through it: an exchange-scale wallet).
- Block 974686 (16:41:10 UTC) tx 8bbade55…85d1: 1GA1… split into 51 outputs (49 × 30.55644266 BTC); all 51 spent by 17:08 UTC.
  Motive unknown → not used as a "false alarm" claim. The tx page https://mempool.space/tx/dcfdddf91036bf0a7c06db991f8ec1a7d9e7d903bbccc6869503f3399ee9e41a
  is used only as the example explorer page for the final step (caption: "example transaction").

## Not used, and why
- "Strategy sold 47,000 bitcoin" (the rumour's number) — the rumour; Arkham's measured move is 43,415.
- "Strategy is the biggest holder of bitcoin" — ETFs/funds and Satoshi complicate it; said "hundreds of thousands" instead.
- Any price move that day (BTC fell below $95,000 per Arkham) — no price talk on this channel.
- A line on how Sonar labels wallets (the plan asked for one): I have no source describing Sonar's labelling, so I left it out
  rather than invent a feature.
- The Nov 2026 Coinbase 1,697 BTC round trip: verified on-chain but motive unknown (above); cut for length.

## Format candidates
1. **breakdown** (picked): three clear steps (labels → direction → what next) = chapter bar + one Iso3D world: Strategy's vault,
   the tracker screen with its labelled wallets, an exchange block, 100+ new storage pads, the filing doc. Plan suggests it;
   last reel (ironkey) was `object`, the three before: documentary, character, object. Not a repeat.
2. documentary: The Block headline, Arkham article and SEC filing as the spine. Good receipts, but the reel is a how-to with
   steps; the breakdown map makes "into or out of an exchange" visible. Receipts are borrowed as Shot scenes.
3. motion: counters (484k vs 641k) and arrows. Too abstract for the "follow the coins" step.

## Lesson (ending)
The rumour's two mistakes: it trusted a tracker's total (the tracker only knew ~3/4 of Strategy's wallets) and it read a move as a
sale (the coins went to new storage addresses, not an exchange). Fix: open the transaction in a free explorer and follow the coins
one more hop: into an exchange, or into new wallets that just sit.

## Script review
- Round 1 (fresh reviewer): REWRITE — undefined terms (dumping, wallet tracker, exchange), Saylor unanchored, Q1 had no "so what", ending lacked what to look for. Rewritten.
- Round 2 (fresh reviewer): REWRITE — "wallet" unexplained, "the tracker" vs "Arkham", "which total?", "a filing" unclear, ending's mistake not specific. Applied the reviewer's exact replacement lines (160 words); "Probably storage" → "Often storage" per its note. Max 2 rounds reached; the final text is the reviewer's own fix.
