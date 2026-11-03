# Research: one copy-paste, $50M (address poisoning, 19 Dec 2025)

Channel: sonar (Tue). Topic from insights/plan.md (Tue 3 Nov fallback row; no fresh verified on-chain event this week cleared the bar).
Checked on-chain 3 Nov 2026 ~04:10 UTC via the Blockscout Ethereum explorer API (eth.blockscout.com, docs: https://docs.blockscout.com/api-reference/get-transaction-token-transfers).
Etherscan blocks bots, so Blockscout is the explorer of record here.

## Addresses (Ethereum)
- Trader (victim): 0xcB80784ef74C98A89b6Ab8D96ebE890859600819 (unnamed in all reports)
- Real destination: 0xbaf4b1aF7E3B560d937DA0458514552B6495F8b5
- Lookalike (scammer): 0xBaFF2F13638C04B10F8119760B2D2aE86b08f8b5
- Match: "0xbaf" … "f8b5" (first 3 after 0x, last 4); the middle differs. SlowMist founder Cos: "first 3 characters and last 4 characters are the same" (Cointelegraph).

## Facts (each verified; times UTC)
1. 19 Dec 2025 14:41:11: 49,999,950 USDT arrives at the trader's wallet from 0x28C6c06298d514Db089934071355E5743bf21d60, labelled "Binance: Hot Wallet" / "Binance 14" on Blockscout. Tx 0xb3653c120fb81bba29f4f5835ff8425a58d2f601878fbd357c13abb7aab38c91. Reports: "funds were withdrawn from Binance shortly before" (Cointelegraph https://cointelegraph.com/news/address-poisoning-copy-paste-mistake-50m-usdt-loss). The wallet already held 50 USDT (received 05:08), so the total was 50,000,000.
2. 15:06:47: test payment of 50 USDT to the real destination. Tx 0x7f5d895ce0eca61d4e3230b7d3471c60c7dc507e1e400e1b5c449e54cfca9a98 (Blockscout). CoinDesk: "$50 test transaction" (https://finance.yahoo.com/news/crypto-user-loses-50-million-174321722.html).
3. "Within minutes, a scammer created a wallet address that closely resembled the destination" (CoinDesk via Yahoo, above). 15:20:35: the lookalike sends the trader 0.005 USDT (half a cent) so it shows up in the trader's history. Tx 0x9780f38b63f761ccfb8fde3b2c27630646baace1f06b2959a3874849937288bd (Blockscout; also Bitquery https://bitquery.io/investigations/address-poisoning-ethereum).
4. 15:32:59: the trader sends 49,999,950 USDT to the lookalike. Tx 0xc0514a795f065fce8a3e1238a1ba480e8a792d45f6431ee4ba8d800bedd86a0f (Blockscout). 26 min 12 s after the test; 51 min 48 s after the money arrived ("less than one hour", CoinMarketCap https://coinmarketcap.com/academy/article/usdt-holder-loses-dollar50-million-in-one-hour-after-address-poisoning-scam). The victim "copied the lookalike address from transaction history" (CoinDesk).
5. 16:01:23: the lookalike swaps all 49,999,950 USDT for 49,533,438 DAI (Blockscout, tx 0x40c3071839bc…, "Spender" contract). The Block: swapped "to DAI via MetaMask Swap within 30 minutes", because "Tether can freeze USDT in flagged wallets, while DAI, as a decentralized stablecoin, lacks such centralized controls"; then ~16,690 ETH; ~16,680 ETH deposited into Tornado Cash (https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return). Tornado Cash = a mixer that hides where funds go (Cointelegraph/CoinDesk call it a mixer).
6. 20 Dec 2025 08:00:35: the trader writes an on-chain message to the scammer ("To the Hacker: We have officially filed a criminal case…") — Blockscout tx 0x5f71bd8125a2316567704c161fb6239c7a86993f50c25839bfb2079e108936e7; offers a $1 million white-hat bounty for returning 98% within 48 hours (CoinDesk; The Block).
7. Outcome: no large incoming transfer to the trader's address after 20 Dec 2025 (checked Blockscout token transfers 3 Nov 2026: only spam dust/fake tokens). Script says "nothing came back to the trader's wallet" — only that, not "never recovered by any route".
8. Scale: Bitquery's analysis of Ethereum, 12 months to 31 Jul 2026: 66,966,004 fake-address attempts aimed at 7,997,367 wallets; 1,635 people sent real money to a fake; median theft $300 (https://bitquery.io/investigations/address-poisoning-ethereum). Script: "about sixty-seven million fake addresses planted in a year, on one network" (one study).
9. The fix, MetaMask support (https://support.metamask.io/fr/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams/): verify the full address and "focus on the middle characters"; don't copy addresses from transaction history; save verified addresses in Contacts ("you won't need to copy from history"); hardware wallets show the address to confirm.
10. Why the middle: each extra matching character makes a lookalike ~16× harder to generate (hex), so fakes match only a few characters at the ends — Bitquery notes its first pass missed this case because it required 4 matching characters at each end; this fake matched only 3 at the front. (Used only as "a fake only copies the ends".)
11. Definitions: USDT = Tether's dollar stablecoin; an address = the public code you send coins to.
12. Crypto transfers can't be reversed by anyone once confirmed (the trader's own bounty/legal threats are the only lever) — CoinDesk/Cointelegraph framing; Tether's freezing is the only issuer-side control, which is why the scammer moved to DAI (The Block).

Not used: the trader's identity (unknown; some posts speculated, unverified); "bots" (not in the reports for this case); later spam/fake-token transfers to the victim (real but a distraction); total 2025 hack figures.

## Format candidates
- **breakdown** (chosen): the scam is a mechanism with clear steps (withdraw → test → bait → paste → gone → fix); one Iso3D world (exchange vault, the trader's laptop, the real and fake address "docs", the mixer) the camera moves through, chapter bar, pill captions, and real explorer pages as receipts. Last reel was `object` (quantum), before that character, scenario: breakdown is 4 reels back.
- documentary: explorer pages + headlines as the spine. Strong receipts, but the trick itself (two near-identical addresses in a history list) needs a built picture more than headlines.
- motion: an address-matching animation alone; too abstract for the who/how/then-what.
Plus one new reusable 2D scene, **AddressMatch**: two addresses typed out character by character, the matching ends light up, the different middle flashes red.

Script review: round 1 REWRITE, round 2 REWRITE with two word-level fixes (its → the money; skipping the middle → not reading the whole address), both applied verbatim as the reviewer wrote them. Length 188 words (~64 s), allowed by RUNBOOK §2 'up to ~65 s if the story needs it'.
