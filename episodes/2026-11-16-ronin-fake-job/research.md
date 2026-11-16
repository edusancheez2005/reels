# Ronin bridge, March 2022: $625M through a fake job offer, unnoticed for six days

Plan row: Mon 16 Nov 2026 (insights/plan.md), channel crypto, topic_source plan. Trend scout (insights/trends/2026-11-16.md)
recommended the weekend sell-off; it doesn't clear the §0b bar (price-move story, crypto-outlet coverage, same angle as 4 Nov).

Blocked from this workspace (Cloudflare bot check): theblock.co (the fake-job scoop, 156038), fbi.gov (attribution statement),
slowmist.medium.com; roninchain.com blog posts now return 404. So: The Block's reporting is cited through The Hacker News and
Malwarebytes (both quote it); the FBI's words through Al Jazeera (agencies); Ronin's own alert through TechCrunch's quote and
Malwarebytes' quote. The two drain transactions were checked directly on an explorer (Blockscout; Etherscan blocks bots).

## Facts (every on-screen claim)

1. **Two transactions on 23 Mar 2022 drained 173,600 ETH and 25.5M USDC from the Ronin bridge.** Primary record, Blockscout:
   - tx 0xc28fad5e8d5e0ce6a2eaf67b6687be5d58113e16be590824d6cfa1a94467d0b7, block 14442835, 2022-03-23 13:29:09 UTC:
     173,600 ETH from MainchainGatewayProxy (0x1A2a1c938CE3eC39b6D47113c7955bAa9DD454F2) to 0x098B716B8Aaf21512996dC57EB0615e2383E2f96.
   - tx 0xed2c72ef1a552ddaec6dd1f5cddf0b59a8f37f82bdda5257d9c7c37db7bb9b08, block 14442840, 13:31:04 UTC: 25,500,000 USDC, same from/to.
   - https://eth.blockscout.com/tx/0xc28fad5e8d5e0ce6a2eaf67b6687be5d58113e16be590824d6cfa1a94467d0b7
   - Also TechCrunch 29 Mar 2022: "exploited for 173,600 ether, or about $597 million, and $25.5 million worth of the stablecoin USDC"; "The hack occurred across two transactions".
     https://techcrunch.com/2022/03/29/axie-infinitys-ronin-network-suffers-%E2%89%88625m-exploit-in-largest-defi-hack-to-date/
   - The address 0x098B…2f96 is the one OFAC tied to Lazarus (Merkle Science): https://merklescience.com/blog/hack-track-analysis-of-ronin-network-exploit
2. **About $625 million.** TechCrunch: "This hack totals almost $625 million at current value, making it the largest decentralized finance hack to date". Al Jazeera/The Record/Blockworks headlines also say $625M. (At 23 Mar prices Merkle Science says ~$568M; we say "about $625 million", the figure reported at discovery.)
3. **Nobody noticed for six days; found when a user couldn't withdraw 5k ETH.** TechCrunch: "the exploit occurred six days ago on March 23, but was not discovered until March 29"; Ronin quoted: "We discovered the attack this morning after a report from a user being unable to withdraw 5k ETH from the bridge." Same quote in Malwarebytes.
4. **Ronin = the sidechain built for Axie Infinity; Sky Mavis = the (Vietnam-based) maker.** TechCrunch ("Ronin was made specifically as a sidechain to support Axie Infinity"; ~2.9 million community), Al Jazeera ("the Vietnam-based firm behind the game, Sky Mavis").
5. **Five of nine validator keys were needed; Sky Mavis controlled four.** Ronin post-mortem quoted by Malwarebytes: "At the time, Sky Mavis controlled 4/9 validators, which would not be enough to forge withdrawals." TechCrunch 6 Apr 2022: "The hacker was able to obtain five of the nine keys used to validate the network, enough to enable them to withdraw tokens".
   https://www.malwarebytes.com/blog/news/2022/07/fake-job-offer-leads-to-600-million-theft
   https://techcrunch.com/2022/04/06/axie-infinity-creator-raises-150m-round-to-compensate-victims-of-625m-ronin-hack/
6. **The fifth key: the Axie DAO allowlist from Nov 2021, discontinued Dec 2021 but not revoked.** Post-mortem quoted by Malwarebytes and ForkLog: "in November 2021 when Sky Mavis requested help from the Axie DAO to distribute free transactions due to an immense user load. The Axie DAO allowlisted Sky Mavis to sign various transactions on its behalf. This was discontinued in December 2021, but the allowlist access was not revoked." Script: "a partner group let Sky Mavis sign for it during a traffic rush" (= "immense user load").
   https://forklog.com/en/ronin-sidechain-developers-reveal-further-details-of-625-million-hack/
7. **A senior engineer, a fake LinkedIn job offer, several interviews, a generous package, the offer as a PDF.** The Block (July 2022, two sources) via The Hacker News: "a senior engineer at the company was duped into applying for a job at a non-existent company, causing the individual to download a fake offer document disguised as a PDF"; quoting The Block: "After what one source described as multiple rounds of interviews, a Sky Mavis engineer was offered a job with an extremely generous compensation package". LinkedIn: The Hacker News ("tricked by a fraudulent job offer on LinkedIn"), Malwarebytes ("Scams originating from LinkedIn ... this is where scammers tried to persuade various people on the development team"; "A booby-trapped PDF granted the attackers access to Ronin systems").
   https://thehackernews.com/2022/07/hackers-used-fake-job-offer-to-hack-and.html
   Sky Mavis's own post-mortem, April 2022 (The Hacker News: "the company said in a post-mortem analysis in April"): "one employee was compromised ... The attacker managed to leverage that access to penetrate Sky Mavis IT infrastructure and gain access to the validator nodes."
   Script "Opening it gave the hackers four of those nine keys" = PDF → IT infrastructure → Sky Mavis's 4 validator nodes (Malwarebytes: "they were able to compromise 4 out of the required 5 nodes").
8. **The FBI named Lazarus Group (and APT38), linked to North Korea.** Al Jazeera, 15 Apr 2022, quoting the FBI statement: "Through our investigations we were able to confirm Lazarus Group and APT38, cyber actors associated with [North Korea], are responsible for the theft".
   https://www.aljazeera.com/news/2022/4/15/north-korea-hackers-accused-of-axie-infinity-crypto-heist
9. (Not in the voice; caption/comment only) Sky Mavis raised $150M led by Binance to reimburse users, and planned to grow the validator set to 21 (TechCrunch, 6 Apr 2022).

On screen, Blockscout's page also shows today's dollar value of the 173,600 WETH (~$317.5M at ~$1,822/ETH, Nov 2026); the $625M is the value reported at discovery. The Hacker News headline's "$540 Million" is a later valuation.

Not used: the engineer's name (never published), the claim that the PDF was "spyware" of a specific family, the "$540M" figure some outlets used (later value).

## Format: candidates
- **character** (pick): it's a person story: one engineer at a desk, a job offer, a PDF that opens the door. Trader3D (grounded person at a desk) acts it out; a real headline and the explorer receipt carry the facts; one borrowed Iso3D shot shows the 5-of-9 lock, since that's the mechanism. The previous reel (15 Nov) was scenario, 14 Nov character, 13 Nov motion, so it's not a repeat of the last reel; the plan suggests character too.
- breakdown: the 5-of-9 keys mechanism suits an Iso3D world, but the hook is the human trick (a job offer), and Sat 21 Nov's DAO reel is planned as breakdown.
- documentary: strong receipts (TechCrunch, explorer, Al Jazeera), but the job-offer scene would have nothing to show.

## Lesson (the story's own)
Two mistakes: the engineer opened a stranger's file on a work computer that could reach the signing keys; Sky Mavis left old access switched on (and held 4 of 9 keys in one place). Step for today: never open files from a recruiter on a computer that holds your wallet.

## Script review
- Round 1 (fresh reviewer): REWRITE (missing link PDF → keys, "fake" withdrawals contradicted real keys, unattributed mistakes). Rewritten.
- Round 2 (fresh reviewer): REWRITE ("keys" not explained, ending link, "your keys"). Applied every line it listed: "five of nine secret keys approved", "hackers sent ... a fake LinkedIn job offer, as a PDF", "The PDF let them into the computers holding those four keys", "That help ended in December, but the permission stayed on", "Two mistakes: ...", "one file can hand hackers your coins". Max 2 rounds reached; final text below follows its replacement almost word for word (kept "Six days later", which it marked as better if there was room).
- Wording vs sources: "a partner lent Sky Mavis their key during a player rush" = the Axie DAO allowlisted Sky Mavis to sign on its behalf due to "immense user load" (fact 6); "two withdrawals took the money" = the two drain transactions (fact 1); "a user's failed withdrawal exposed the theft" = fact 3.
