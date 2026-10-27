# The public waiting room — sources (checked 2026-10-27)

Channel: sonar (Tuesday). Topic from backlog: "What the mempool is, and why bots watch every transaction".
Why not a fresh on-chain event: the only notable moves found for the last 7 days (two 12–13-year-old wallets, ~411–417 BTC,
reported 18–19 Oct) are outside the 7-day window and the reports give no txid or address to verify on mempool.space; a
dormant-whale reel also ran on 25 Oct.

## Facts on screen / in the voice-over

1. **"This morning, forty-six thousand bitcoin payments were sitting in a public waiting room."** mempool.space home page,
   fetched 27 Oct 2026 ≈ 06:55 UTC: "46,656 TXs" unconfirmed; mempool memory usage 127.65 MB of 300 MB; recommended fee
   1 sat/vB (all priorities); average block time ~9.4 min. — https://mempool.space/
   → On screen: "46,656 unconfirmed transactions · mempool.space, 27 Oct 2026, 06:55 UTC". Voice says "forty-six thousand"
   and "this morning" because the number changes minute to minute.
2. **Mempool definition.** "the queue of pending and unconfirmed transactions for a cryptocurrency network node."
   — mempool.space FAQ: https://mempool.space/docs/faq
   → "It's called the mempool"; "holds it in its own pool of waiting transactions" (each node has its own queue).
3. **Nodes check and pass it on.** "Each peer and miner independently validates the transaction before broadcasting it further."
   — Bitcoin developer guide, Transactions: https://developer.bitcoin.org/devguide/transactions.html
4. **Highest fee rate first.** "The priority of a pending Bitcoin transaction is determined by its fee rate" (sat/vB)
   — mempool.space FAQ; "all transactions are prioritized based on their fee per byte" — developer.bitcoin.org (as above).
   Not confirmed until in a block: the FAQ's "pending and unconfirmed" queue (fact 2).
5. **About every ten minutes.** Difficulty retargets every 2,016 blocks; "The ideal value is 1,209,600 seconds (two weeks)"
   → 1,209,600 / 2,016 = 600 s = 10 min. — https://developer.bitcoin.org/devguide/block_chain.html
   (mempool.space showed a recent average of ~9.4 min on 27 Oct — "about".)
6. **Pay too little, and you wait.** "your transaction is probably using a lower fee rate relative to other transactions
   currently in the mempool" — mempool.space FAQ; "Any transaction paying only the minimum fee should be prepared to wait a
   long time before there's enough spare space in a block to include it." — developer.bitcoin.org Transactions.
7. **Replace with a higher fee (RBF).** "If the transaction was made with RBF enabled, your stuck transaction can simply be
   replaced with a new one that has a higher fee." — mempool.space FAQ. → script: "*Some* wallets let you…" (needs RBF).
8. **Public before final.** Follows from 1–4: the pool is relayed between nodes and shown on public explorers before a block
   includes it (mempool.space lists unconfirmed transactions).
9. **Sandwich.** "To sandwich, a searcher will watch the mempool for large DEX trades", then "execute an optimal buy order
   immediately before the large trade" and "a sell order immediately after the large trade". Searchers use bots.
   — ethereum.org, Maximal extractable value (MEV): https://ethereum.org/developers/docs/mev/
10. **Copy + higher fee.** "Generalized frontrunners are bots that watch the mempool to detect profitable transactions." They
   copy the transaction, swap in their own address, and submit it "with a higher gas price" so it executes first.
   — ethereum.org MEV page (as above). Voice says "higher fee" (gas price is Ethereum's fee).

## Deliberate simplifications
- The 3D pool, blocks, cubes and bots are illustrations (labelled "Illustration"); cube counts and fee colours are schematic.
- The wallet notification is a generic illustrative app ("Wallet"), not any real product's alert; the 0.01 BTC amount is illustrative.
- Sandwiching is described on Ethereum (where the source describes it); the script does not claim it happens to bitcoin payments.
- "someone may have already seen it" — hedged: anyone running a node or watching an explorer can see pending transactions.
- NOT used: mempool size limits (300 MB default) and eviction, CPFP, accelerators, MEV dollar totals (not needed / not sourced here).
- No price talk, no advice.
