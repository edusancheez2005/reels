# The pay cut (the bitcoin halving, told as your job) — research

Plan row: Wed 18 Nov 2026 · morning · crypto · skit · genre office. Trend scout checked first (insights/trends/2026-11-18.md): nothing cleared the §0b bar, so the plan stands. topic_source: plan.

## Facts used (every on-screen and spoken claim)

1. **Mining reward started at 50 BTC per block and halves every 210,000 blocks (roughly every 4 years).**
   - learnmeabitcoin: "The block subsidy started at 50 BTC, and it halves every 210,000 blocks (roughly every 4 years)." https://learnmeabitcoin.com/technical/mining/block-reward
   - The Block: "Bitcoin halvings are programmed to occur automatically every 210,000 blocks — roughly every four years." https://www.theblock.co/post/289875/bitcoin-ushers-in-fourth-halving-as-miners-block-subsidy-reward-drops-to-3-125-btc
   - Blockstream: halving "reduces the mining block reward by 50% every 210,000 blocks"; the constant `nSubsidyHalvingInterval = 210000` is in Bitcoin Core's source (src/kernel/chainparams.cpp), and `GetBlockSubsidy()` halves the subsidy (`nSubsidy >>= halvings`). https://help.blockstream.com/education/economics/bitcoin-economics/what-is-the-bitcoin-halving
   → Script: "In 2009, every block … pays fifty brand-new coins"; "The cut is in bitcoin's code, every four years or so."
2. **Halving dates and rewards** (Blockstream table; bitref; CoinGecko):
   - 28 Nov 2012, block 210,000: 50 → 25 BTC
   - 9 Jul 2016, block 420,000: 25 → 12.5 BTC
   - 11 May 2020, block 630,000: 12.5 → 6.25 BTC
   - April 2024, block 840,000: 6.25 → 3.125 BTC (block timestamp 20 Apr 2024 00:09:27 UTC; 19 Apr in US time zones, which is why Blockstream's table and The Block say 19 April. The script says only "April 2024".)
   Sources: https://help.blockstream.com/education/economics/bitcoin-economics/what-is-the-bitcoin-halving · https://bitref.com/halving/ · https://www.coingecko.com/explain/bitcoin_halving
   → Script: "2012… Twenty-five", "2016, twelve and a half", "2020, six and a quarter", "2024, three point one two five".
3. **Block 840,000 (the receipt):** blockchain.com explorer: "Bitcoin Block 840,000", mined 4/20/2024 00:09:27 UTC, "Mining Reward 3.125 BTC"; "This block marks the 4th bitcoin halving where the mining reward dropped from 6.25 to 3.125 bitcoin per block." https://www.blockchain.com/explorer/blocks/btc/840000
4. **The supply cap:** total supply is 20,999,999.9769 BTC, "technically less than the 21 million cap", a result of the halving schedule. https://learnmeabitcoin.com/technical/mining/block-reward ; Blockstream page (above) ties the halving to the 21 million limit.
   → Script: "That's why only twenty-one million bitcoin will ever exist."
5. **Next halving:** block 1,050,000, reward 1.5625 BTC, estimated April 2028 (learnmeabitcoin "13 Apr 2028 (estimate)"; CoinGecko "April 17, 2028"; bitref "around April, 2028"). It's set by block height, not a calendar date, so the exact day moves. → Script: "the next around 2028" (said as an estimate).
6. **New coins per day:** after the 2024 halving, "miners will now produce around 450 BTC in total per day compared to 900 BTC previously" (The Block, above); Blockstream: daily issuance falls from about 450 to about 225 BTC at the next halving. ~144 blocks a day (one every ~10 minutes, Blockstream) × 3.125 = 450. (Kept in research; may appear as a tag only.)
7. **Miners and blocks:** miners bundle pending transactions into a block; the protocol targets "one block every ten minutes on average" (Blockstream); the miner who adds a block gets the block subsidy (new coins) plus fees (blockchain.com block 840,000 page splits the 40.75 BTC block reward into 3.125 BTC subsidy + 37.63 BTC fees). → Script: "every block of payments you seal pays fifty brand-new coins" (the subsidy, which is the part that halves).
8. **Nobody decides each cut:** the halving is "programmed to occur automatically" (The Block) at fixed block heights in the code (Blockstream). → Script: "Nobody decides it. Everyone sees it coming." (The schedule is public; next block height is known years in advance.)

## The fiction
"You", the boss, the office, the coffee machine and the chair are made up (no real person). Miners don't actually have a boss: that is the turn. No price talk anywhere (none in script, tags or caption).

## Candidate genres
1. **office** (chosen, the plan's): a pay cut every four years is a workplace drama; the boss announcing cuts while everyone claps is the joke; "There is no boss" is the turn (it's code). Last skit was how-to-lose, so the gate allows it.
2. **game-show**: "the prize halves every round" — fun, but the host-and-contestant set says less about pay.
3. **period** (2009 → 2024 as a costume drama across eras) — good for the dates, but the office sells the "pay" metaphor better.

9. **2009 start:** the genesis block (block 0) was mined on 3 January 2009 with a 50 BTC reward; blocks paid 50 BTC until block 210,000 (Nov 2012). https://en.bitcoin.it/wiki/0 · https://decrypt.co/56934/the-bitcoin-genesis-block-how-it-all-started- → Script: "In 2009, every block … pays fifty brand-new coins."
10. **"Until they stop":** the subsidy keeps halving until it rounds to zero; total supply 20,999,999.9769 BTC (learnmeabitcoin, above). → Script: "halves the new coins every four years or so, until they stop. Only twenty-one million will ever exist."
