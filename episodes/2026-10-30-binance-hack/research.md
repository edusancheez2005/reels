# Binance hack, 29 Oct 2026: who, how, why, the market

Researched Fri 30 Oct 2026, 19:00–19:30 UTC. All figures as reported at that time.

## Facts used (each with a source)

1. **Amount.** Binance puts the loss at about $6.3B. Blockchain firms: TRM $6.36B (at time-of-theft prices), Elliptic $6.43B,
   Chainalysis ~$6.4B. Script: "over six billion dollars"; screen: "$6.3B" (Binance's own figure).
   - https://www.aljazeera.com/economy/2026/10/30/binance-says-2-54bn-in-crypto-funds-frozen-amid-potential-security-issue
   - https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history
   - https://www.elliptic.co/insights/binance-largest-hack-in-history/
   - https://www.chainalysis.com/blog/binance-exploit-latest-findings-and-response/
2. **Speed.** Started ~20:05 UTC Thu 29 Oct; most of the funds left in roughly 20 minutes (TRM; Reuters via Arab News says
   the bulk of the heist unfolded in around 20 minutes, starting late on Thursday). A second wave hit Avalanche and Polygon ~23:05 UTC.
   - TRM (above); https://www.arabnews.com/world/hackers-steal-63-billion-from-binance-in-record-heist-blamed-on-north-korea-3009040
3. **Record.** Biggest crypto theft ever; about four times the $1.5B Bybit hack of Feb 2025 (TRM "about four times";
   Elliptic "more than four times the $1.46 billion Bybit theft"). Screen: "4x the old record".
4. **Who.** TRM attributes it "with high confidence" to TraderTraitor, North Korea's hacking unit. Chainalysis assesses
   TraderTraitor and told Reuters it was highly confident. Elliptic: "likely" North Korea-linked, consistent with TraderTraitor
   (a Lazarus-associated group). Script: "Three crypto detective firms point to North Korea's hacking team, TraderTraitor."
5. **Not confirmed by any government.** FBI: "aware of the incident and is engaged with relevant public and private partners";
   it has not attributed the hack (Nextgov, Reuters). North Korea routinely denies such claims (Reuters).
   - https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/
6. **The last record.** The FBI publicly blamed TraderTraitor for the $1.5B Bybit hack: IC3 PSA I-022625-PSA, 26 Feb 2025.
   - https://www.ic3.gov/PSA/2025/PSA250226
7. **How they got in.** Binance: the breach "may involve a compromised DevOps engineer's laptop", which let the attacker reach
   an internal service and submit unauthorised withdrawals; no private-key leak reported (Elliptic quoting Binance; Nextgov).
   Co-CEO Richard Teng (Reuters): a "complex attack" with a compromised laptop and malware meant to erase traces; the hackers
   manipulated a system used to approve transactions, moving funds out of a Binance hot wallet without normal approvals.
   Script: "From there, they got into the system that approves withdrawals".
8. **Chains.** TRM: ten blockchains. Elliptic: eleven (XRP Ledger, Solana, NEAR, Base, Optimism, Bitcoin, Tron, Ethereum,
   Arbitrum, Avalanche, Polygon). Script: "at least ten crypto networks".
9. **The Bitget clue.** Elliptic: some Binance funds reached the same Ethereum address as proceeds of last month's suspected
   North Korea-linked Bitget exploit, 0x15104a9ce0f08a8f0075a0869ae80e795fe0feb7 (small overlap: ~$39k Binance vs ~$510k Bitget;
   could be a shared launderer). Chainalysis: Binance funds "commingling" with Bitget exploit funds, its strongest evidence.
   Bitget hack (Sep 2026, ~$387M): its CEO blamed North Korea.
   - https://fortune.com/2026/09/25/north-korea-bitget-387-million-crypto-attack/
   - https://therecord.media/crypto-ceo-accuses-north-korea-of-387-million-theft
10. **Why.** UN Panel of Experts report (March 2024): North Korea's cyber activities "generate approximately 50 percent of its
    foreign currency income" (citing one member state) and the income is "used to fund its weapons programs".
    - https://www.koreatimes.co.kr/amp/foreignaffairs/northkorea/20240321/malicious-nk-cyberactivities-account-for-half-of-foreign-currency-income-fund-wmd-programs-un-report
    - https://www.theblock.co/post/283849/un-north-korea-hack-report
11. **Frozen.** Elliptic verified $2.84B frozen on-chain (44%); Chainalysis ~$2.8B; TRM ~$2.7B; Binance ~$3B located. Tether
    froze nearly $1.57B, Circle more than $800M (Reuters). Frozen by the stablecoin issuers in the attacker's wallets, not at
    Binance. Script: "almost three billion dollars of the stolen money is now frozen".
12. **Customers.** Binance said it would cover all losses and user funds are "safe" (Al Jazeera); pledged to use its emergency
    protection fund and company money (Nextgov); set aside ~$6.34B of company funds (Reuters). Withdrawals halted.
13. **Market.** CoinGecko hourly prices: BTC $80,769 (29 Oct 20:00 UTC) -> $76,404 (30 Oct 19:22 UTC), -5.4%;
    BNB $744.12 -> $696.17, -6.4%. Reuters: bitcoin hit a six-week low of $76,368; Al Jazeera: bitcoin fell about 5%.
    - https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=2
    - https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=usd&days=2

14. **Binance = the world's biggest crypto exchange.** Al Jazeera: "The world's largest crypto exchange"; Reuters via Arab News:
    "the world's biggest cryptocurrency exchange" (both 30 Oct 2026, URLs in 1 and 2).
15. **Bitget is another exchange.** The Record: "Crypto platform Bitget said hackers stole more than $387 million from its
    exchange"; its CEO blamed North Korea (URL in 9).

## Script review
- Round 1 (fresh reviewer, 30 Oct ~19:55 UTC): REWRITE. Fixed: "them" -> "TraderTraitor"; "Not confirmed yet" -> "It's not
  official"; "blockchain(s)" -> "crypto"; the laptop is "hacked" (not an inside job); the clue is "the detectives'" clue and
  Bitget is introduced as "another exchange"; "it" -> "the stolen money" for the frozen funds; UN line -> "hacking earns North
  Korea about half its foreign money"; BNB dropped from the voice (kept in the caption); story-specific ending ("security, and its
  promise to pay you back. This hack tested both."). Kept "at least ten crypto networks" (sourced, shows the scale).
- Round 2 (same reviewer): PASS. Not taken: "last record hack" -> "previous record hack" (optional; would need a re-voice and
  re-render, and "for the last record hack" follows "biggest crypto theft ever", so it reads as the previous record).

## Deliberately not used
- Elliptic's "almost certainly the largest theft of any kind in history": one firm's hedged claim.
- EIP-7702 / pre-signed authorisations, Tornado Cash funding, laundering automation: true, but too technical for 55 s.
- Fake-job-offer phishing: TraderTraitor's known method in past hacks (DMM Bitcoin), not reported for this one.
- "North Korea did it" as a fact: only blockchain firms say so; no government has confirmed (said on screen and in voice).

## On-screen claims map
- $6.3B / "stolen from Binance" -> 1; "~20 min" -> 2; "4x Bybit ($1.5B, 2025)" -> 3; TRM/Chainalysis/Elliptic headlines -> 4;
  "It's not official" (no government attribution) -> 5; FBI PSA (Bybit = TraderTraitor) -> 6; engineer's laptop, approval system -> 7;
  10 chain logos/labels ("at least ten crypto networks") -> 8; shared wallet 0x1510...feb7 + Bitget headline -> 9; UN 50% -> 10; ~$2.8B frozen -> 11;
  "will cover all losses" -> 12; BTC -5.4% chart -> 13 (BNB -6.4% only in the caption, no longer spoken or shown).
