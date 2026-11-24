# A billion dollars, freshly baked — research (Tue 24 Nov 2026, morning, channel sonar)

Plan row: Tue 24 Nov · morning · sonar · skit · cooking-show · bit deadpan-demo. Topic source: plan (trend scout overruled, see
insights/trends/2026-11-24.md). The plan's lead was "a fresh verified Tether or Circle mint"; the freshest verified one is
Circle's USDC mint on Solana on the evening of 23 Nov 2026 (below), so the story is USDC, not USDT.

## The event (primary record: Solana chain, queried 24 Nov 2026 ~04:00 UTC via the public RPC https://api.mainnet-beta.solana.com,
## found on https://solana.com/docs/references/clusters)

USDC on Solana = mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (Circle's own list: https://developers.circle.com/stablecoins/usdc-contract-addresses).
Its mint authority on chain (getAccountInfo, 24 Nov): `BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG` (only this authority can create USDC on Solana).
Four `mintTo` instructions of exactly 250,000,000 USDC each, signed by that authority, into token account
`3emsAVdmGKERbHjmGfQ6oZ1e35dkf5iYcS6U4CPKFVaa` (owner `7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE`; Whale Alert labels it "USDC Treasury"):

| UTC, Mon 23 Nov 2026 | signature | treasury balance after |
|---|---|---|
| 19:13:37 | 9qqMYau5goV5YVir3vbrTU7yVGYvyuxS6SKoYxxfZHenkxBXdpWBSWMryec2rrGtgLxpSDuxNZxDvNk4MHYAUeA | 1,248,992,545.91 |
| 19:18:07 | AMxxoZCD4hqQyAB6bjghWn4j3cyki7cFvDsYTkpc67fPveWnTmaGt3o823TpsaU7TewnpWVP7ULMKLJotA8tvSa | 1,498,992,545.91 |
| 19:19:31 | 2mprGTKvNXjFd7zN1uxbbRjt3HPzBRVhkFyjq98gW287S4erzn3uWyVEWzZigekekQQzJ1T8fj4p9doxUTEvyqhF | 1,748,992,545.91 |
| 19:20:24 | 47Ud2xviQSkoJzkhVcPJdEYFDdbhsnP4CbJuk3cZYqeKsx6eCbPm75gxmmaWCoK5ryvPbzcpFWVSkYSMhyS2ceMh | 1,998,992,545.91 |

- Fact 1: **1,000,000,000 USDC minted in 6 min 47 s** (19:13:37 → 19:20:24 UTC, 23 Nov 2026) = "a billion ... in under seven minutes",
  "four batches", "two hundred and fifty million. Again. Again. Again." Treasury balance 998,992,545.91 → 1,998,992,545.91.
  (A separate 20,000,000 USDC mint at 19:13:57 went to another account; not counted, not mentioned.)
- Receipt: Whale Alert's pages for the first and last mint (reached by following "Next" from the 21 Nov mint page linked by
  PANews, https://panews.io/articles/01a1fd92-5c98-71b8-9cb9-fbfe290015fb):
  https://whale-alert.io/transaction/solana/9qqMYau5goV5YVir3vbrTU7yVGYvyuxS6SKoYxxfZHenkxBXdpWBSWMryec2rrGtgLxpSDuxNZxDvNk4MHYAUeA
  https://whale-alert.io/transaction/solana/47Ud2xviQSkoJzkhVcPJdEYFDdbhsnP4CbJuk3cZYqeKsx6eCbPm75gxmmaWCoK5ryvPbzcpFWVSkYSMhyS2ceMh
  ("250,000,000 $USDC ... minted at USDC Treasury", Mon, 23 Nov 2026 19:20:24 UTC, balance 1,748,992,545.91 → 1,998,992,545.91). Captured as assets/wa_last.png.
- "Last night": 19:13–19:20 UTC on Mon 23 Nov = 19:13–19:20 London (GMT); the reel posts Tue 24 Nov morning.
- Context fact 2: the same treasury minted ~5.28 billion USDC on Solana between 17 and 23 Nov (34 mintTo calls by the mint
  authority; on-chain sum). Not used in the voice (one number rule).
- Context fact 3: USDC supply on Solana 9,044,315,779.82 at slot 473,203,342 (getTokenSupply, 24 Nov ~04:02 UTC). Not used.

## How USDC works (Circle)
- Fact 4: "A Circle customer can always mint or redeem USDC in 1:1 exchange for U.S. Dollars through their Circle Account"
  (https://www.circle.com/blog/how-to-be-stable-usdc-transparency-and-trust) → "someone gives you real dollars", "want your dollars back?".
  Whale Alert's own explainer on the mint page: "a burn removes coins from the supply" → "your coins go in the bin".
- Fact 5: "USDC is a digital dollar backed 100% by highly liquid cash and cash-equivalent assets"; "The majority of the USDC
  reserve is held in the Circle Reserve Fund (USDXX), an SEC-registered 2a-7 government money market fund" holding "cash,
  short-dated US Treasuries and overnight US Treasury repurchase agreements"; "the remainder... in cash" at large banks
  (https://www.circle.com/en/transparency) → "Cash, and short-term US government debt" ("somewhere boring" is the joke).
- Fact 6: "a Big Four accounting firm provides monthly third-party assurance that the value of USDC reserves are greater than
  the amount of USDC in circulation"; holdings "fully disclosed on a weekly basis, along with associated mint/burn flows"
  (https://www.circle.com/en/transparency) → "Accountants count that drawer every month."
- "built to be worth one dollar": Circle says "always redeemable 1:1" (transparency page). We do NOT say "always worth one dollar"
  (USDC traded below $1 in March 2023).

## The week before: more burned than minted
- Fact 7: DefiLlama data, week to 23 Nov 2026 08:15 UTC: USDC supply $68.72B, 7-day change −$607M (−0.88%); all stablecoins
  $284.44B, −1.53% (https://stablecoininsider.org/stablecoin-supply-snapshot-2026-11-23/). Net supply fell, so across all
  chains more USDC was redeemed (burned) than minted that week → "The week before, more went in the bin than out of the oven."
  The window ends before last night's mints, hence "the week before".
- So "a fresh billion isn't a price signal" (channel rule: no price predictions; a mint describes issuance, not direction).

## Genre candidates
1. **cooking-show** (chosen, plan): a mint *is* a recipe (dollars in, coins out); the chef stays calm while the kitchen burns
   (deadpan-demo); the auditor is a health inspector. Neither of the last two skits (heist, office) used it.
2. game-show: "is this coin backed?" with buzzers. Weaker: no story.
3. nature-doc: used by the-whale on 20 Nov (and on-chain whales again). Rejected.

Bit: **deadpan-demo** (last two: dramatic-irony, countdown). Stonks: the health inspector, one word ("Receipt."). No clapping,
no jumping, no swearing, no "GET OUT!" (signing-screen didn't use it either, but this is a how-it-works skit: the guide says it
doesn't suit; ends on the step instead).

## Used (last five skits; none comes back)
- signing-screen: "Today, you help hackers…" cold open; three signers; Stonks "Ooh. Green."; "signs anything with a green button"; "walks out the front door"; inside-man line; ends on step + pause.
- one-share-one-yen: pop-up "You sure?"; "I'm a professional"; cancel attempts with swearing; "Unplug Tokyo"; enter key missing.
- two-pizzas: royal taster "For poison" (so no taste-testing here, though the plan row suggested it); "Keep the change"; "Fucking worth it"; "year of our Lord".
- the-bedroom: trailer cards; "Volcano lair"; "We brought helicopters"; "Which room?"; "In no cinemas".
- wrong-number: "Is this Dave?"; "I could be Dave"; "June wedding?"; red-flag list ending on milk first; "Speaking."
Also retired: "has never been prouder", "still clapping", "because you're a genius", "One problem.".

## Joke pass (funniest ten seconds, three engines)
- deadpan-demo: "Step two: you park them somewhere boring. Cash, and short-term US government debt." / "The oven is on fire. You're plating." / [suit] "Garnish." ← kept
- understatement: "A billion dollars. A light supper." (good, but the oven line beats it)
- literal: "liquidity" poured from a jug. (too abstract)
**The moment to send to a friend:** "The oven is on fire. You're plating." + "Garnish." — the friend who stays calm while everything burns.

## Sonar
One mention of the week, caption only (channels/sonar.json rule; plan row).

## Script review (RUNBOOK §2a)
Round 1: REWRITE (opener and step wording too close to signing-screen; best joke 3/5; ~62 s; "minted", "burn", "stablecoin" unexplained; "you" switched to the customer). Round 2: REWRITE on two small points (opener template close to two-pizzas; length), "with these four changes the script would PASS". Applied: new opener "Your kitchen made a billion..." (kept a full sentence with someone in it, hard rule 7), "that billion", trimmed to 135 words / 57.7 s. Best joke 4/5: "Coins are hitting the ceiling. You're wiping the rim of the plate." (the send-to-a-friend moment). The fire gag was dropped (could read as Circle being reckless).
