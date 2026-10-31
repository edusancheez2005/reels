# What if Bitcoin fell to $1? — sources (checked 31 Oct 2026, 04:00 London)

Type: what-if (thought experiment, said so in line 2). No price prediction; nothing implies where the price will go.

## The hook: what miners would earn
- Block subsidy is 3.125 BTC since the April 2024 halving (block 840,000). [Certain] — block 840,000 mined 20 Apr 2024 00:09 UTC (https://mempool.space/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5); last 144 blocks: (453.47 − 3.47 fees) ÷ 144 = 3.125 BTC subsidy each (below).
- Last 144 blocks (973,782–973,925, ~one day to 31 Oct 2026): total reward 453.47 BTC, of which fees 3.47 BTC →
  **3.149 BTC per block** (3.125 subsidy + ~0.024 fees). [Certain] — https://mempool.space/api/v1/mining/reward-stats/144
- mempool.space/mining (screenshot 31 Oct 2026 ~04:05 UTC): recent blocks 973,922–973,926 each paid 3.13–3.14 BTC; reward
  stats 453.48 BTC over 144 blocks. — https://mempool.space/mining
- BTC price 31 Oct 2026: **$77,125**. [Certain] — https://mempool.space/api/v1/prices
- Derived: today a block pays 3.149 × $77,125 = **$242,866** → voice "worth two hundred forty thousand dollars today",
  screen "≈ $240,000". At $1: 3.149 × $1 = **$3.15** → "about three dollars". 
- A block is found about every 10 minutes on average (the target). Last ~2 weeks average 595 s ≈ 9.9 min. [Certain] —
  https://learnmeabitcoin.com/guide/target ("Blocks are mined roughly every 10 minutes"); https://mempool.space/api/v1/difficulty-adjustment (timeAvg 595,096 ms)

## Why machines would switch off
- Bitcoin mining uses about **138 TWh a year, about 0.5% of global electricity** (Cambridge Digital Mining Industry Report, 2025). [Certain] —
  https://jbs.cam.ac.uk/2025/cambridge-study-sustainable-energy-rising-in-bitcoin-mining/
- Derived: 138 TWh ÷ 52,560 blocks a year ≈ 2.6 million kWh per block. Even at 1 cent per kWh that is ~$26,000 of
  electricity per block, so $3 per block is "less than the power bill" by a factor of thousands. [Certain as arithmetic]
- "Most machines switch off" is the thought experiment's reasoning (machines that earn less than their power cost stop),
  said as a consequence, supported by the 2021 event below where a third of the hashrate went offline within weeks.

## The catch: fewer machines → slower blocks, until the reset
- Difficulty ("the puzzle") adjusts every 2,016 blocks, roughly every two weeks, to bring blocks back to ~10 min; each change
  is capped at ×4 / ÷4. [Certain] — https://learnmeabitcoin.com/guide/target
- 2021: China's crackdown on bitcoin mining; network hashrate (7-day avg) fell from 136.47 EH/s to 85 EH/s, **down 35%**
  ("a third of the network went dark"); blocks averaged nearly every **13.9 minutes** over the previous two weeks; on 1 July
  2021 one block took **129 minutes** ("over two hours"), the longest gap since 2011; difficulty then dropped **27.9%**, the
  largest decrease since 2009 ("twenty-eight percent easier"). [Certain] — The Block, 3 Jul 2021:
  https://www.theblock.co/post/110425/bitcoin-largest-difficulty-drop-ever
- China banned mining: Bloomberg, 30 Jun 2021, "China's Bitcoin Crackdown Sets Up Record Tweak to Mining Puzzle". [Certain] —
  https://www.bloomberg.com/news/articles/2021-06-30/china-s-bitcoin-crackdown-sets-up-record-tweak-to-mining-puzzle

- On-screen receipts for 2021: Decrypt, 1 Jul 2021, "Bitcoin Mining Difficulty Set to Plummet Following China's Crackdown —
  With China's Bitcoin miners forced to shut down or relocate, the difficulty of Bitcoin mining is about to drop by a massive 27%."
  (screenshot) — https://decrypt.co/74958/bitcoin-mining-difficulty-set-to-plummet-following-chinas-crackdown ; CoinDesk (via
  Yahoo Finance), 3 Jul 2021, exact words on the Quote card: "At 6:25 UTC Saturday, mining difficulty plunged by nearly 28% at
  block 689,471." and "biggest-ever drop in mining difficulty" — https://ca.finance.yahoo.com/news/bitcoin-mining-difficulty-records-largest-064247219.html
  (The Block and CoinDesk's own site blocked the screenshot tool: Cloudflare / Vercel checks.)
- Normal block ≈ 10 min vs 129 min on 1 Jul 2021 → ×12.9 ≈ "×13" (derived).

## The holders
- Strategy (formerly MicroStrategy) holds **848,517 BTC** (8-K, 26 Oct 2026, week 19–25 Oct), average cost ~$75,446 per
  bitcoin, total cost **~$64 billion** incl. fees. [Certain] — The Block, 26 Oct 2026:
  https://www.theblock.co/news/business/2026-10-26-strategy-pauses-bitcoin-buys-repurchases-205-million-of-strc-preferred-shares-431699
- "Strategy is the largest corporate holder of Bitcoin." [Certain] — https://www.theblock.co/treasuries/mstr
- On-screen receipt: BitcoinTreasuries.NET Strategy page (31 Oct 2026): "#1 PUBLIC COMPANY", "World's largest corporate Bitcoin
  holder", BTC holdings 848,517, total cost basis $64.02B. — https://bitcointreasuries.net/public-companies/strategy
  (strategy.com and sec.gov blocked the screenshot tool.)
- Derived: 848,517 BTC × $1 = **$848,517** → "under a million". [Certain as arithmetic]

## The other side and the takeaway
- No company, government or rule sets a minimum price for bitcoin: the protocol fixes supply and block timing, not price
  (the difficulty rule above is the only automatic response). [Certain] — https://learnmeabitcoin.com/guide/target (what the rules adjust)
- Critics' line ("no floor = the risk") is a fair summary of the critics' view; the takeaway ("only put in what you could
  afford to lose") is a standard risk warning, not a buy/sell call.
- Bitcoin first reached $1 on 9 Feb 2011 (context only, not on screen). — https://cryptoslate.com/11-years-ago-today-bitcoin-reached-1/

## Deliberately not used
- Exact miner break-even prices (vary by machine and power contract; no single source).
- The "51% attack gets cheaper" argument (true in principle, but costs are contested and it adds a term).

## Script review (31 Oct, fresh agents)
- Round 1 REWRITE: one name for miners throughout; "it" ambiguity in "It's happened before"; "network" unexplained → "mining
  power"; bridge to the holders; ending must give the specific lesson and why. Applied.
- Round 2 REWRITE: give the ten-minute normal so "over two hours" lands; "would" for every consequence; introduce Strategy as a
  company; ending = rules rescue the network, not the price, because no rule sets a floor (critics' line kept); dropped the
  generic tip. Applied (Strategy line uses The Block's "largest corporate holder").

## On screen, scene by scene (every claim → a line above)
s1 "$3 per block, if 1 bitcoin = $1" (3.149 × $1); label "the computers that run Bitcoin" · s2 "Not a prediction. A thought
experiment." · s3 "miners", "the next block of payments" · s4 mempool.space recent blocks, 3.13 BTC · s5 ≈ $240,000, chip
"3.13 BTC × $77,125 · 31 Oct 2026" · s6 "at $1: about $3 a block", "mining: ~0.5% of the world's power" (Cambridge 138 TWh,
0.5% of global electricity) · s7 "every block is a puzzle", "fewer miners → slower blocks" · s8 Decrypt headline (1 Jul 2021)
· s9 −35%, "Bitcoin's mining power · June–July 2021" (136.47 → 85 EH/s) · s10 ~10 min vs 129 min, 1 July 2021, ×13 · s11
"every 2,016 blocks (≈ 2 weeks)", "puzzle re-tunes to the miners left" · s12 CoinDesk quote "nearly 28%", "Biggest drop ever"
· s13 "blocks keep coming", "owners' coins: worth almost nothing" · s14 BitcoinTreasuries: world's largest corporate holder,
$64.02B cost basis · s15 $848,517 = 848,517 BTC × $1 · s16 "the rules protect the network", "no rule sets a price floor" ·
s17 "No floor. That's the risk." (critics' view, voiced as "Critics call that the risk").
