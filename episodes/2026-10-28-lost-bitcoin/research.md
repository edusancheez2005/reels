# Lost forever: how many bitcoin nobody can ever spend — sources & verification (checked 28 Oct 2026)

Hook: "About 3.7 million bitcoin are probably lost forever." Stated as an estimate on screen ("estimate · Chainalysis, 2020").

## How many are lost
- Chainalysis (June 2020) estimated about 3.7 million BTC are lost (coins untouched for at least five years, adjusted for
  known holders). [Likely: it is an estimate] — https://decrypt.co/37171/lost-bitcoin-3-7-million-bitcoin-are-probably-gone-forever?amp=1
  (also https://www.financemagnates.com/cryptocurrency/news/study-finds-almost-4-million-bitcoins-lost-forever/).
  Glassnode's separate estimate is about 3 million — the number is uncertain, which the script says ("The real total is a guess").
- Existing supply ≈ 20.1M BTC: computed from the block subsidy schedule at height 973,285 = 20,104,019 BTC on 27 Oct 2026
  (episodes/2026-10-27-bitcoin-origin/research.md; tip height from mempool.space). One day later it is still ≈20.1M. [Certain]
- "Nearly one in five": 3.7M / 20.1M = 18.4%. [Certain arithmetic on the estimate]
- "Around three hundred billion dollars": 3.7M × $80,824 = $299B. Price: blockchain.com explorer, block 0 page values the
  50 BTC reward at $4,041,196 on 28 Oct 2026 (= $80,824/BTC). — https://www.blockchain.com/explorer/blocks/btc/0 [Certain]
- Coin3D stacks are data-driven: 21 stacks = 21M max; filled to 20.1M; 3.7M shown frosted as "lost".

## Why: no password reset
- A private key is "sort of like the password to your email address, except it can't be reset"; a 12-word backup phrase
  (recovery words) "can be used to regenerate your bitcoin wallet's private keys"; if the backup is lost, a spending
  password won't protect you. — https://www.bitpay.com/blog/private-key-security [Certain]
- Coins stay on the public record: every bitcoin balance and transaction is visible on public block explorers
  (e.g. the genesis address/block on blockchain.com above). [Certain]
- Vault/key/frost visuals are labelled "Illustration".

## Stefan Thomas
- Programmer Stefan Thomas (San Francisco) had 7,002 BTC on an IronKey encrypted drive; he forgot the password; the drive
  allows 10 guesses before it permanently encrypts its contents; he had used 8 (2 left). Reported by The New York Times,
  12 Jan 2021. — https://cointelegraph.com/news/programmer-has-2-password-guesses-left-to-avoid-losing-266m-in-bitcoin [Certain as reported]
  On screen: a paraphrase card labelled "Paraphrased" with attribution (no fake headline/screenshot); the drive is a
  generic, unbranded illustration ("Illustration: a generic encrypted drive"). Script says "In twenty twenty-one ... had",
  i.e. past tense: his current status is not claimed.

## The first 50 bitcoin
- Genesis block (block 0), 3 January 2009 18:15:05 UTC; block reward 50 BTC; "the 50 BTC coinbase reward can't be spent"
  (not added to the transaction database). — https://www.blockchain.com/explorer/blocks/btc/0 (block explorer, primary record) [Certain]
- "a quirk in the way that the genesis block is expressed in the code" — https://en.bitcoin.it/wiki/0 [Certain]

## Fixed supply
- Only 21,000,000 BTC will ever exist (issuance schedule; see bitcoin-origin research). Lost coins are not re-issued. [Certain]

## Not used
- James Howells' landfill hard drive (own backlog item). Satoshi's ~1M coins (used in the 27 Oct episode).
- Burn addresses (couldn't verify balances on mempool.space this run).
- Real screenshots: headless capture returned blank pages in this session, so evidence is shown as sourced cards.
