# Poly Network, 2021: the hacker who stole $610 million and gave it back

Plan row Thu 5 Nov 2026 (crypto, story). Trend scout 03:50: nothing big (insights/trends/2026-11-05.md) → topic_source "plan".
Researched 5 Nov 2026 03:50–04:10 UTC. Every URL below came from a web search this session.

## Facts (each on screen or spoken)
1. **Hack on 10 Aug 2021, about $610 million.** Tom's Hardware: "stole more than $600 million worth of cryptocurrency from it on
   August 10"; Cointelegraph (12 Aug): "all of the $610 million in funds taken"; CertiK "~$610 million"; Kudelski "the equivalent of
   ... 610 million USD". (rekt.news says ~$611M; per-chain sum 273+85+253 = $611M.) We say "six hundred and ten million".
   https://www.tomshardware.com/news/poly-network-hacker-returns-final-141-million
   https://cointelegraph.com/news/poly-network-hacker-returns-nearly-all-funds-refuses-500k-white-hat-bounty
   https://www.certik.com/resources/blog/poly-network-exploit
2. **Three blockchains: ~$273M from Ethereum, ~$253M from Binance Smart Chain, ~$85M USDC from Polygon.** Cointelegraph, 10 Aug 2021
   (screenshot ct-three). https://cointelegraph.com/news/hackers-stole-at-least-600m-in-poly-exploit-across-three-chains
3. **What Poly Network is:** "a cross-chain protocol that lets crypto users swap tokens among blockchains" (The Block);
   Cointelegraph: "The protocol allows users to swap tokens across different blockchains." → "a bridge that moves coins between blockchains".
   https://www.theblock.co/news/regulation/2021-08-12-poly-network-hacker-returns-nearly-all-of-the-611-million-in-stolen-funds-114390
4. **The bug (keepers):** Kudelski: access rights between EthCrossChainManager and EthCrossChainData were mismanaged; "If an attacker
   could call the right function (putCurEpochConPubKeyBytes) within EthCrossChainData, there would be not even need to attack a
   Keeper's secret key: the attacker could simply set their own public key to replace that of a Keeper". rekt.news: the manager
   would execute a cross-chain call to any target, the attacker ground out a function name whose 4-byte id matched
   putCurEpochConPubKeyBytes, "No private key compromise required!" → script: "anyone could send Poly an instruction to change the
   keepers. The hacker swapped in their own key and sent the coins to themselves." (simplified: the instruction travelled as a
   cross-chain message that Poly's manager contract executed without blocking that target.)
   https://kudelskisecurity.com/research/the-poly-network-hack-explained · https://alpha.rekt.news/polynetwork-rekt
5. **Tether froze ~$33M USDT.** Cointelegraph 10 Aug: Tether CTO Paolo Ardoino "reported that the project had frozen roughly $33
   million in Tether (USDT) from one of the affected addresses"; Cointelegraph 12 Aug: "the roughly $33 million in Tether (USDT)".
   CNBC 17 Aug: "All but $33 million of the crypto has now been returned."
6. **SlowMist** "posted an update shortly after news of the hack broke, saying its analysts had identified the attacker's email
   address, IP address and device fingerprint" (Cointelegraph, both articles; SlowMist's own Medium post blocked by a bot check).
   → script: "said it had found the hacker's email and IP address" (a claim, attributed).
   https://slowmist.medium.com/slowmist-tracking-possible-identification-clues-related-to-poly-network-attackers-b330d4d710f (blocked)
7. **Messages in transactions.** Decrypt 12 Aug: the hacker "kept it all on chain, embedding the questions and answers as 'input
   data'—viewable as UTF-8—in Ethereum transactions sent to themselves". The decoded text (Sam MacPherson's screenshot embedded in
   Decrypt) reads: "Q: WHY RETURNING? A: THAT'S ALWAYS THE PLAN! I AM _NOT_ VERY INTERESTED IN MONEY!" (screenshot decrypt-fun).
   Headline: "Poly Network Hacker Says Exploit Was Just 'For Fun'". https://decrypt.co/78364/poly-network-hacker-says-exploit-was-just-for-fun
8. **"Mr. White Hat" and $500,000.** Cointelegraph 12 Aug: Poly "offered the hacker, whom it dubbed 'Mr. White Hat,' a $500,000
   bounty". CNBC 17 Aug: Poly invited Mr. White Hat to be its "chief security advisor" (not used).
   https://www.cnbc.com/2021/08/17/poly-network-cryptocurrency-hack-latest.html (CNBC blocked our screenshot: Access Denied)
9. **Last key, 23 Aug 2021 (13 days).** Tom's Hardware, 23 Aug 2021: Poly "today announced 'Mr. White Hat,' the hacker who stole more
   than $600 million ... on August 10, has returned the last of the stolen assets"; "They provided the final key to the wallet";
   subhead "The entire $600-plus million haul was returned". CertiK: "Thirteen days after the incident took place, Poly Network
   released an update announcing that the hacker had publicly shared the private key". Engadget 23 Aug: "Poly Network says it has
   recovered all $610 million". (Plan said check 25 Aug: the sources give 23 Aug.) https://www.engadget.com/poly-network-161726337.html
10. **"Then they gave it back":** first returns 11 Aug (Cointelegraph: $258M returned on Wednesday); everything by 23 Aug per Poly/
    Engadget (the frozen USDT was held by Tether, not the hacker).

## Not used / cut
- The hacker's identity: never made public (Cointelegraph). We say "anonymous", never imply a person.
- "Nowhere to cash out" as the reason for returning: commentary, not a record. The script only states the facts (public chain,
  Tether freeze, SlowMist's claim) and the hacker's own words; it does not say why they returned it.
- Chief security advisor offer, the Q&A "for fun" answer (in the tiny part-one image; we use the readable part-three line).
- Explorer screenshots: Etherscan blocks bots; no other explorer link for these tx came back from search, so receipts are news pages.
- Blocked from this workspace: cnbc.com (Access Denied), theblock.co and slowmist.medium.com (bot check).

## Format candidates
- **character** (pick): the story is one anonymous person doing things: typing the attack at night, writing messages into
  transactions, handing over a key. Trader3D (grounded person at a desk, monitors) as the hacker, "3D stand-in · identity unknown".
  The previous reel (midterm-dip-bounce, 4 Nov) was documentary, the one before motion, then breakdown → character is not in the last 3.
- documentary (plan's suggestion): strong receipts, but the previous reel was documentary, so the gate forbids it.
- breakdown: the keeper swap is a mechanism with steps; used on 3 Nov. Borrowed instead: one Iso3D bridge world for the keeper swap.

## The mechanism that makes it click
A bridge = a vault on each chain + a few "keeper" keys that approve moves. The hacker didn't steal a key: they got Poly's own
software to replace the keepers with theirs.

## Script review
Round 1 REWRITE (over 160 words; keeper/key wording; "So why give it back?" implied a reason; fix muddled). Round 2 REWRITE
(introduce keepers as computers; say the return started the next day; clearer fix). Round 2's replacement adopted, with the
"Mr. White Hat" nickname kept and the Tether line shortened. Added facts used: "the next day" = 11 Aug 2021 first returns
(Cointelegraph: $258M returned on Wednesday 11 Aug; the decoded Q&A tweet in Decrypt is timestamped 11 Aug 2021);
"computers called keepers" = Kudelski's Keepers (the nodes whose keys sign cross-chain moves). "The fix: only the keepers should
change the keepers" = in Poly's design a keeper change is meant to need the current keepers' signatures; the bug let the
cross-chain manager call putCurEpochConPubKeyBytes directly (Kudelski, rekt).
