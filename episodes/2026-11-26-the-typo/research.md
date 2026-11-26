# The typo — a $23.7M fee to send $100K, told as a disaster film (Thu 26 Nov 2026, morning, sonar)

Plan row: Thu 26 Nov · morning · sonar · skit · genre disaster · bit slow-motion · "The typo".
topic_source: plan (the trend scout's candidates failed the §0b bar: insights/trends/2026-11-26.md).
The plan's lead said "you type the fee in the wrong box". The record says otherwise: it was a software bug in how the fee was
calculated, and the hardware wallet showed the fee in a form nobody could read. The script follows the record (no "wrong box").
The November 2023 83 BTC fee was not used (not needed; not re-verified).

## Facts (all checked 26 Nov 2026, 04:00–04:30 London)

1. **The transaction, on chain (primary record).** Blockscout, Ethereum mainnet, tx
   0x2c9931793876db33b1a9aad123ad4921dfb9cd5e59dbb78ce78f277759587115: Success, method `deposit`, block 13307440,
   timestamp "Sep 27 2021 12:10:08 (+01:00 UTC)" = 11:10:08 UTC (a Monday). From "Bitfinex: Hot Wallet", to "StarkEx
   Proxy/Interface"; tokens transferred "100,000 USDT" (then StarkEx → "Rhino.fi: Bridge", 100,000 USDT). Transaction fee
   "7,676.619078292762408538 ETH". Gas price 53,243,669.87 Gwei; base fee 58.907 Gwei; gas used 144,179.
   — https://eth.blockscout.com/tx/0x2c9931793876db33b1a9aad123ad4921dfb9cd5e59dbb78ce78f277759587115 (reached via blockscout.com
   from a web search, then the explorer's own search box; Etherscan blocked the headless browser). Screenshot: assets/tx_receipt.png.
   (Rhino.fi is DeversiFi's later name; the explorer labels the contract with it.)
2. **$23.7 million fee to send $100,000 of tether.** The Block: a Bitfinex wallet "just paid" $23.7 million in fees "to send
   $100,000 of tether (USDT)", covering the fees "on behalf of the non-custodial exchange DeversiFi", which "spun out of Bitfinex
   in 2019". — https://www.theblock.co/news/ecosystems/2021-09-27-bitfinex-just-spent-23-7-million-in-fees-to-make-one-ethereum-transaction-118753
   CoinMarketCap Academy, "Why a $100,000 Tether Transfer Cost $23.7M in Fees": 7,676 ETH. —
   https://coinmarketcap.com/academy/article/why-100-000-tether-transfer-cost-23-7m-in-fees
   → 23,700,000 / 100,000 = 237: "two hundred and thirty-seven times what you sent".
3. **DeversiFi's own account of what happened.** Spokesperson to The Block: "At 11:10 UTC on the 27th September a deposit
   transaction was made using a hardware wallet from the main DeversiFi user interface with an erroneously high gas fee."
   "No customer funds on DeversiFi are at risk and this is an internal issue for DeversiFi to resolve." — The Block URL above.
4. **The cause: a decimal bug, and a fee no human could read.** CoinDesk: the post-mortem blamed "a fee calculation flub in how
   the EthereumJS library processes decimals"; the bug "could only apply to large wallets such as theirs"; fix: "additional safety
   and sanity checks" so gas fees "could not exceed unrealistic thresholds". —
   https://hotfix.coindesk.com/tech/2021/09/28/an-update-on-the-erroneously-high-gas-fee-that-temporarily-cost-deversifi-237m
   CoinMarketCap Academy (post-mortem by CTO Konrad Strachan): an issue "that would only affect very fat wallets", "combined with
   the fact that Ledger hardware wallets may sometimes display fees in a non-human readable manner." — CMC URL above.
   → script: "Your software got a decimal wrong. Your hardware wallet showed the fee as a number no human could read."
5. **A normal fee is a few dollars.** CoinDesk: "a simple ERC-20 token swap that should have cost $5" (URL above). The same
   on-chain record shows the network's base fee that block was 58.9 Gwei, against a price paid of 53,243,669.87 Gwei.
   → "Normally, a few dollars."
6. **What a fee is / who gets it.** The tip goes to whoever produced the block: "mined by an unknown Ethereum miner, who ranks in
   the top ten miners by blocks mined over the last seven days" (The Block). The return transaction on chain comes "From Miner:
   0xb7e...707" (fact 8). In 2021 Ethereum still used miners (proof of work; the switch was Sept 2022).
   → "A fee is the tip for the miner, the computer that writes your transfer onto the blockchain."
7. **No undo / they had to ask.** CoinDesk: DeversiFi "reached out to Binance", which passed on its contact to the miner; the miner
   agreed to return the funds "after a few emails back and forth". DeversiFi tweet (quoted by CMC, CoinDesk, BeInCrypto): "The
   blockchain is immutable, but the revolution we are part of is defined by our values as humans. Thank you to the miner of block
   13307440 who we can confirm is returning 7,626 ETH that were incorrectly paid today as a tx fee."
   → "A blockchain has no undo." / "The miner gives it back."
8. **Returned the same night (primary record).** Blockscout tx 0x85294effd53126b3bfa9e7f655267e00ac1ae2ef76f4569644670bf5403637d6:
   block 13310195, "Sep 27 2021 22:14:20 (+01:00 UTC)" = 21:14 UTC, From "Miner: 0xb7e...707" To "Bitfinex: Hot Wallet",
   value 7,385 ETH, fee 0.0113 ETH ($34). — https://eth.blockscout.com/tx/0x85294effd53126b3bfa9e7f655267e00ac1ae2ef76f4569644670bf5403637d6
   Business Insider: the miner "had sent 7,385 ether back to Bitfinex, worth around $22.2 million at the time". —
   https://www.businessinsider.in/cryptocurrency/news/a-crypto-exchange-accidentally-paid-a-24-million-fee-for-a-100000-ethereum-transaction-but-the-miner-agreed-to-return-it/articleshow/86588797.cms
   → "That night." (11:10 → 21:14 UTC, the same day). The voice doesn't give the returned amount.
9. **Kept 50 as a thank-you.** CoinDesk: DeversiFi "pushed for the miner to keep 50 ETH ... as a reward". BeInCrypto: "the miner
   kept 50 ETH". CMC: DeversiFi "offered a 50 ETH return fee". — https://beincrypto.com/miner-returns-7626-eth-wrongly-paid-by-bitfinex/
   (7,676 − 7,626 = 50, matching the tweet.) → "Keeps fifty ether as a thank-you."
10. **Bitfinex's CTO:** "Kudos to the miner for being proactive and fair." (Business Insider, URL above; caption background, not voiced.)

Fiction (caption says so): "you", the man who says it's fine (the suit guy), the control room, the slow-motion replay, the miner
as a character (Stonks), his lines. Nothing in the voice is said about a named real person; DeversiFi is named only as the company
the transaction came from, with the real date.

## Candidate genres
- **disaster** (picked, plan): the click as the inciting event of a disaster film — the control room, the alarms, the replay in
  slow motion, the "man who says it's fine"; and a disaster film's last-reel rescue (the miner gives it back).
- courtroom: "the people versus the decimal point" — fun, but courtroom is a weaker fit for a replay engine.
- game-show: "what is the fee?" — used later this week (Sat evening).

## Used in the last five skits (rule a) — none reused
two-nobel-prizes: rain/noir narration, "It's your case.", "[stonks] Leverage." ×3, "You ask what he's drinking.", ending on the moral.
no-signal: rules-of-horror list, "Same eyebrows.", "[suit] Well, shit.", "True story,", "Somewhere, another stranger is printing an ID.", step held.
hold-the-line: kick-off/commentary, "[stonks] Come on, shop!", "Ref!" / "Play on.", "They'll be disappointed with that."
freshly-baked: TV chef, "Again. Again. Again.", "[stonks] Receipt.", "Five stars.", "No report, no dinner."
the-signing-screen: "Today, you help hackers...", "[suit] Triple-checked.", "Ooh. Green.", "Every heist needs an inside man", "This was Bybit...".
This skit: slow-motion replay (new engine), "[suit] It's fine." (new), Stonks as the miner who finds a 23-million tip ("Huh." /
"Anytime."), no clapping, no swear, no GET OUT (warm ending: the money comes back), ends on the step, held.
Note: "Somewhere, a miner checks his tips." echoes no-signal's "Somewhere, another stranger..." — rewritten to avoid it.

## Joke pass (rule f) — the funniest ten seconds, three engines
1. slow-motion (kept): "Quarter speed. The finger. A finger with its whole life ahead of it." / pause / "The button."
2. understatement: "Twenty-three million dollars. A rounding error, in the wrong direction." — weaker.
3. deadpan-sums: "That's two hundred and thirty-seven times the money. You could have sent it by private jet." — kept only the 237.
Send-to-a-friend moment: "A finger with its whole life ahead of it." — for the friend who presses "confirm" without reading.
Second: the miner's reply, "Anytime."

## Script review (RUNBOOK §2a)
Round 1: REWRITE — "Every disaster film has a man who..." reused the-signing-screen's "Every heist needs an inside man" set-up;
"Again." echoed freshly-baked; "the computer" vs a miner who acts; "fifty ether" unexplained (a fourth number); the ending
contradicted the cause ("read the fee line" vs "no human could read"); 147 words. All fixed (sirens open; "Replay. Slower.";
"Keeps a tip. For the tip."; ending "Can't read it? It's not fine." calls back to the suit's line).
Round 2: three small edits ("dollar fee", "The miner checks", "Before you send"), applied verbatim; reviewer: "once they're in,
it passes". Final 140 words. Best jokes 4/5 (the finger; the tip jar / "Huh."). Send-to-a-friend: the finger line.

Note on the receipt: Blockscout shows the fee as "$23,438,406.9" using its own historical ETH price; the outlets at the time
(The Block, CMC, Business Insider) reported $23.7 million. On screen and in the voice we use the outlets' figure ("$23.7M",
"nearly twenty-four million"); the receipt's marks point at the ETH amount (7,676.6 ETH) and the 100,000 USDT, not the USD figure.
