# Who holds the most bitcoin? (Tue 17 Nov 2026, sonar, plan row)

Checked 17 Nov 2026, 03:55–04:20 London. Every URL came from a web search. Screenshots captured by me where the site allowed it
(`assets/*_full.png`); SEC.gov and Arkham (arkm.com) blocked the headless browser, so those are Quote cards with exact words.

## Facts used (on screen / in the voice)

1. **US spot bitcoin ETFs hold 1,252,607 BTC**, "% of 21M: 5.965%", "Last updated: November 16, 2026". BlackRock's iShares
   Bitcoin Trust (IBIT): 783,448.3 BTC. Source: Bitbo, US Bitcoin ETF Tracker — https://bitbo.io/treasuries/us-etfs/
   (screenshot `assets/bitbo_full.png`). Script: "about one point two five million ... this week". ETFs = funds traded on a stock
   exchange (Yahoo Finance, 8 Oct 2026, says "approximately $107 billion in net assets" as of 7 Oct:
   https://finance.yahoo.com/markets/crypto/articles/wall-street-funds-now-hold-050023411.html — the "Wall Street funds now hold
   more bitcoin than Satoshi" framing is theirs too).
2. **ETFs first passed Satoshi's estimated 1.1M on 5 Dec 2024** (1,105,923 BTC, CoinGlass data). The Block, 6 Dec 2024 —
   https://www.theblock.co/post/327831/us-spot-bitcoin-etfs-surpass-satoshis-estimated-1-1-million-btc (read via fetch agent;
   page blocks the headless browser). Background only, not on screen.
3. **Satoshi: an estimated ~1.1 million BTC.** Cointelegraph Magazine, "Big Questions: Does Satoshi actually own 1.1 million
   Bitcoin?", 22 Sep 2026: "Researchers can trace an estimated 1.1 million BTC to a distinctive early mining operation. The harder
   question is whether that miner was actually Satoshi." —
   https://cointelegraph.com/magazine/big-questions-does-satoshi-actually-own-1-million-bitcoin (screenshot `assets/ct_full.png`).
   The pattern ("Patoshi") was found by Sergio Demian Lerner in 2013; he calls the evidence circumstantial. Bitquery (1 Sep 2026):
   1,096,102 BTC unmoved on the Patoshi list, range "roughly 0.89 to 1.17 million BTC" by method —
   https://bitquery.io/investigations/satoshi-nakamoto-net-worth. Script says "estimated" and "one early miner ... never moved".
4. **Strategy owns 850,849 BTC as of 15 Nov 2026** (bought 485 BTC on 9–15 Nov). SEC Form 8-K dated 16 Nov 2026 —
   https://www.sec.gov/Archives/edgar/data/0001050446/000119312526462151/mstr-20261116.htm (read via fetch agent; "Aggregate BTC
   Holdings 850,849"). On-screen receipt: Cointelegraph, 9 Nov 2026, "Strategy buys 1,036 Bitcoin as BTC holdings climb to 850,364"
   — https://cointelegraph.com/news/strategy-buy-1036-bitcoin-holdings-850364-btc (screenshot `assets/ctstr_full.png`); the 8-K
   number is newer and still "over 850,000". "Software company": Strategy, formerly MicroStrategy (business-intelligence software),
   per the same coverage.
5. **US government: about 325,000 BTC** (Arkham, "Who owns the most bitcoin", page dated 28 Sep 2026: the US government "holds 325K
   BTC"; UK "holds 61,245 BTC") — https://info.arkm.com/research/who-owns-the-most-bitcoin-2025-edition (read via fetch agent; arkm.com
   blocks the headless browser → Quote card). Bitcoin.com (17 Feb 2026) had ~328,372 per Arkham wallet data —
   https://news.bitcoin.com/us-government-holds-328372-btc-as-onchain-data-confirms-23b-federal-crypto-stockpile. Mostly seized in
   criminal cases (Silk Road, Bitfinex hack): same Arkham page. Estimate from wallet labels, said as "Arkham puts the US at about".
6. **Coinbase: about 969,000 BTC in its wallets** (Arkham, same page: "holdings of 969K BTC", second-largest entity). These are
   wallets attributed to the exchange and hold customers' coins; Arkham's figures are wallet attributions. Script: "most of those
   aren't Coinbase's. They belong to its customers" (Coinbase holds customer crypto in custody; its own corporate BTC is far smaller —
   Arkham describes these as exchange holdings). Kept as "Arkham counts ... in its wallets".
   Coinbase's OWN bitcoin (corporate treasury) is about 16,492 BTC after buying $88M in Q1 2026: KuCoin News, "Coinbase Adds $88M in
   Bitcoin in Q1, Holdings Reach 16,492 BTC" — https://www.kucoin.com/news/flash/coinbase-adds-88m-in-bitcoin-in-q1-holdings-reach-16-492-btc ;
   Bitcoin.com, 8 May 2026, "Coinbase Buys $88 Million Worth of Bitcoin in Q1 2026 ... the publicly listed exchange's corporate
   treasury" — https://news.bitcoin.com/coinbase-buys-88-million-bitcoin-q1-2026/ (screenshot `assets/cbown_full.png`).
   So ~16.5K of ~969K is Coinbase's own → "most of those aren't Coinbase's. They belong to its customers" holds.
7. **Over 20 million bitcoin have been mined** (The Block, 9 Mar 2026: "Bitcoin's mined supply has surpassed 20 million BTC") —
   https://www.theblock.co/news/ecosystems/2026-03-09-bitcoin-mined-supply-hits-20-million-btc-392660. Cap 21M (Bitbo shows % of 21M).
8. Exchanges in total: ~2.68M BTC (CryptoQuant via AMBCrypto/KuCoin, 16 Apr 2026) —
   https://www.kucoin.com/news/flash/bitcoin-exchange-reserves-drop-to-2-683m-btc-amid-weak-retail-activity. NOT used: 7 months old,
   secondary source.

## Not used
- China ~190,000 BTC (PlusToken seizure, 2020): Arkham says it's unclear whether China still holds them. Cut.
- Cryptobriefing's undated "US about 198,000": out of date, conflicts with Arkham.
- UK 61,245: cut for length.
- Any price or dollar value of the piles (prices moved a lot this month; no price talk).

## Hook check
"Wall Street funds now hold more bitcoin than Satoshi": 1,252,607 (ETFs, 16 Nov) > ~1.1M (estimate; Bitquery upper bound 1.17M).
True on every published estimate. On screen: "1.25M" vs "~1.1M (estimate)".

## Format (Edu, 31 Oct: never the same as the last reel)
Last 3 posted: 2026-11-16 character, 11-15 scenario, 11-14 character.
- **motion** (pick): this is a comparison of numbers; the clearest picture is the piles themselves. A new reusable 2D component,
  `CoinStacks`: one gold coin = 50,000 BTC, stacks build coin by coin per holder, with real receipts (Bitbo, Cointelegraph) between.
  The ending slides coins off the exchange pile into "your wallet". Matches the plan row.
- documentary: real pages as the spine. Strong receipts for 2 of 5 holders only (SEC and Arkham block capture), so it would be quote
  cards; weaker.
- object (a vault with labelled drawers): duplicates Wed's object reel. No.

## Step for today
Coins on an exchange are in the exchange's pile and the exchange controls the keys; a self-custody wallet means only you have the
recovery words (keep them offline). Safety practice, no product, no price.

## Double-count check (script reviewer, round 1)
Coinbase is the custodian for most US spot ETFs (incl. IBIT). Arkham's page lists BlackRock (799K) and Coinbase (969K) as separate
entities, i.e. it attributes ETF custody wallets to the fund issuers, not to Coinbase. I can't open Arkham's methodology from here
(Cloudflare), so the reel never adds the piles together or claims a total; each stack is shown as its own source's figure.
Key/self-custody line: "whoever holds the key controls the coins" is the basic custody principle (Cointelegraph's custody coverage;
plain-English, no figure).
