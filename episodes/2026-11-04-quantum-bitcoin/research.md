# Research: quantum computers vs Bitcoin (Wed 4 Nov 2026, prebuilt with Edu on 2 Nov)

Channel: crypto (plan row Wed 4 Nov). Every URL below came from a web search result (Edu, 2 Nov: never fetch from memory).
Checked 2 Nov 2026, 12:40–13:10 London.

## Facts used (each with its source)

1. **Google's estimate.** Google Quantum AI whitepaper "Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities:
   Resource Estimates and Mitigations" (Babbush, Zalcman, Gidney, Broughton, Khattar, Neven, Bergamaschi, Drake, Boneh), arXiv
   2603.28846, submitted 30 Mar 2026 (v2 15 Apr). Breaking ECDLP-256 (the maths behind Bitcoin's signatures) with Shor's algorithm:
   fewer than 1,200 logical qubits / 90M Toffoli gates (or < 1,450 / 70M), **fewer than half a million physical qubits** on
   superconducting hardware with 1e-3 error rates, runtime **minutes**. https://arxiv.org/abs/2603.28846
   Google Research blog, 31 Mar 2026 (Ryan Babbush, Hartmut Neven): "fewer than 500,000 physical qubits", "in a few minutes",
   "an approximately 20-fold reduction"; advises crypto to move to post-quantum cryptography and to refrain from "exposing or
   reusing vulnerable wallet addresses". https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/
   CoinDesk, 31 Mar 2026, reports "about nine minutes once a transaction exposes a public key" (not used: the paper and blog say
   "minutes"; the reel says "in minutes").
   https://www.coindesk.com/tech/2026/03/31/bitcoin-bulls-scramble-for-post-quantum-protection-as-google-drops-bombshell-paper
2. **Today's hardware.** Google's Willow chip: "Google said that the new chip has 105 qubits." DCD (Dec 2024):
   https://datacenterdynamics.com/en/news/google-debuts-willow-quantum-computing-chip
   Google's March 2026 blog links Willow as its flagship processor. Largest gate-based machine by physical qubits (all makers):
   1,180 (neutral atoms), as of Sep 2026, quantum-expectations.com (page updated 26 Oct 2026):
   https://www.quantum-expectations.com/answers/most-qubits-quantum-computer → the reel compares with Google's own chip (105),
   and says plainly that nobody knows when such a machine will exist.
3. **How much bitcoin is exposed.** Glassnode Research, "Measuring Bitcoin's Quantum-Exposed Supply", 20 May 2026 (updated 6 Oct
   2026): "6.04M BTC, or 30.2% of the issued supply, is exposed" = coins whose public key is already visible on-chain, at rest.
   Structural (the address type shows it: early P2PK, bare multisig, Taproot) 1.92M BTC (9.6%); operational (address reuse,
   partial spending, custody practices) 4.12M BTC (20.6%), incl. ~1.63M on exchanges. Hashed address types (P2PKH, P2SH, P2WPKH,
   P2WSH) hide the key until a spend reveals it. https://research.glassnode.com/measuring-bitcoins-quantum-exposed-supply/
   → "six million", "nearly a third" (30.2%).
4. **The other side.** CoinShares (Christopher Bendiksen), report 6 Feb 2026, via The Block 8 Feb 2026: ~1.6M BTC sit in legacy
   P2PK outputs, but only about **10,200 BTC** are in addresses large enough to cause "appreciable market disruption" if
   compromised; the rest are 32,000+ outputs of ~50 BTC that would take an extraordinarily long time to crack one by one. They
   call the broad estimates overblown.
   https://www.theblock.co/post/388969/coinshares-says-only-10200-btc-face-real-quantum-risk-pushing-back-on-overblown-estimates
5. **The fix in progress.** BIP-360 "Pay-to-Merkle-Root (P2MR)", authors Hunter Beast, Ethan Heilman, Isabel Foxen Duke,
   **Status: Draft**, soft fork: a new output type (addresses start bc1z) that drops Taproot's key-path spend so the public key
   isn't sitting on-chain; it does not itself add post-quantum signatures.
   https://raw.githubusercontent.com/bitcoin/bips/master/bip-0360.mediawiki (the official BIPs repo file) and the rendered copy
   https://bips.dev/360/ (both from a search on 2 Nov; an earlier fetch of the github.com page used a typed URL, so it's
   not cited).
6. **Standards exist.** NIST, 13 Aug 2024: "NIST Releases First 3 Finalized Post-Quantum Encryption Standards" (FIPS 203 ML-KEM;
   FIPS 204 ML-DSA and FIPS 205 SLH-DSA for digital signatures). https://www.nist.gov/node/1856616 (on screen only if it fits)
7. **When.** Nobody knows. Ethereum Foundation researchers don't expect a cryptographically relevant quantum computer for 8–12
   years (DL News, 25 Mar 2026); Justin Drake puts at least a 10% chance on key recovery by 2032 (CoinDesk, as 1). Ethereum's
   roadmap: "L1 protocol upgrades could be completed by 2029" (https://pq.ethereum.org/, DL News:
   https://www.dlnews.com/articles/defi/ethereum-foundation-estimates-2029-for-quantum-upgrades-to-network/). Not spoken (the
   channel rule: drop the Ethereum detour when Bitcoin carries the point).

## Descriptors used in the voice
- "data firm Glassnode": Glassnode publishes on-chain data and research (the cited page is Glassnode Research, fact 3).
- "crypto firm CoinShares": the report is by CoinShares' bitcoin research lead (The Block, fact 4).
- "Google" = Google Quantum AI / Google Research (fact 1).

## The practical takeaway (forwardable)
Don't reuse an address: let the wallet give a fresh one each time, so the public key stays hidden until you spend (Google's
advice, fact 1; Glassnode's "operational exposure", fact 3).

## Deliberately not used
- "Nine minutes": CoinDesk's reading; the paper's own wording is "minutes".
- The 41% chance of beating a block: CoinDesk only, not in the paper's abstract.
- Mining: a common question (quantum doesn't break mining the same way), but I have no source fetched this session; cut.
- Ethereum and its 2029 target: second chain, cut from the voice (channel rule).
- Satoshi's coins: Sunday's what-if (8 Nov); not here.
- Any price effect: never.

## Format: candidates (last posted: scenario Mon; Tue = character)
1. **object (chosen)**: the reel is about two objects: the machine (a 3D quantum computer, the gold "chandelier" cooled to near
   absolute zero, with its chip) and the lock (a public key as a lock on a vault of coins, covered or exposed). Close-ups, the
   machine opened up, the lock tested.
2. breakdown: wallets as places in one world, the quantum beam reaching exposed ones. Clear, but Tue's world scenes + Thu's
   suggested breakdown → too many worlds this week.
3. motion: 105 vs 500,000 qubits, 6M of 20M bitcoin as particles. Good for numbers, weak on "what breaks".
Mix: object leads; numbers as Growth/BigNumber, receipts (Google blog, Glassnode, BIP-360, The Block) as Shots.
