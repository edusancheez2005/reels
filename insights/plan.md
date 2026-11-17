# Plan: Mon 16 – Sun 22 Nov 2026

Weekly review, 15 Nov. Rows come from Edu's "Upcoming themes" (below) for 16–22 Nov, in his order; formats checked so no two days
repeat (Sun 15 internet-down was scenario). What this week's numbers change (see `insights/learnings.md`):
- Reach collapsed on 8 Nov: every reel since has 34–545 views against 1,500–4,900 the week before, across every format and topic.
  That looks like an account-level problem, not the scripts, so the content rules stay as they were and Edu has been asked to check
  Account Status. Don't drop or rework a topic because of the 8–15 Nov numbers.
- The one change: the card, number or object is on screen from the first frame of every scene (no empty dark frames while the
  voice starts), and every reel lands under 60 s. Reviewers flagged empty scene openings in 4 of 7 reels this week; two ran 62 s.
- Still in force: the big number first; end on one concrete step for today, said and shown; no politics in hook or caption; a real
  name card or headline over a toy-like 3D stand-in where one exists.
The daily run uses today's row: it decides the channel and topic (overriding the rota). Hooks are leads: verify every number
before using it. Follow "Story reels: Edu's standard" in the script guide; every reel gets a designed cover (`tools/make_cover.py`)
and the 3-part story. Hypotheticals: say "a thought experiment, not a prediction" in the first two lines and never imply a price.

**17 Nov, live with Edu: new format test.** Edu: "something's not going well... we got to change the formatting"; "we need some
creative content"; on the new rigged characters: "way cooler and way better... have those characters instead of the other ones";
on the voice: "the lady talking is actually horrible". What changed, from the 17 Nov evening reel on:
- A new format, `skit` (`episodes/2026-11-17-genius-copy-paste`, posted the evening of 17 Nov as the pilot): a deadpan narrator, the
  suit guy and Stonks, characters speaking in their own voices.
- **Skit and explainer days alternate** until the weekly review of 29 Nov (the gate never allows the same format two days
  running anyway): Wed 18 explainer, Thu 19 skit, Fri 20 explainer, Sat 21 skit, Sun 22 explainer. The review compares the two
  groups on views, 3-second skip and shares per reach, and says which one to keep. The skit rows below replace the old Thu and Sat
  rows (inflows/outflows and The DAO go back to the backlog).
- Every reel, skit or not: the narrator is `am_michael` (channels/*.json) and any person on screen is an `Actor3D` character
  (RUNBOOK hard rule 8), opening on a scene, not a number card (hard rule 7).


| Day | Channel | Type | Topic and angle | Hook (formula # from tools/ig/hooks.json) | Story card teaser |
|---|---|---|---|---|---|
| Mon 16 Nov | crypto | Story · format: character (the engineer, the fake job offer and the PDF; real Sky Mavis post-mortem and FBI statement as receipts) | Ronin bridge, March 2022: hackers took about $625M through a fake job offer, and nobody noticed for six days. How one PDF gave them the keys, why 5 of 9 signatures were enough, how it was found (a user couldn't withdraw), and who the FBI named. Step for today: never open files from a recruiter you haven't verified on a work device or a computer that holds your wallet. Keep governments out of the hook and caption (Edu's held-back rule); one attributed line in the voice ("the FBI says…") is enough. | #25 Someone Else's Result: "Hackers took $625 million, and nobody noticed for six days." (verify the amount, the six days, the 5-of-9 keys and the job-offer detail) | "$625M and a fake job" |
| Tue 17 Nov | sonar | Proof · format: motion (stacks of coins sliding between holders as the numbers land) | Who holds the most bitcoin today: the US spot ETFs, exchanges, companies like Strategy, governments, and Satoshi's estimated ~1.1M. Use the latest dated figures with their source on screen; say which are estimates. Step for today: if your coins sit on an exchange, they're in one of those piles, not yours. No product mention (Thu has it). | #22 Contrarian Flip: "Wall Street funds now hold more bitcoin than Satoshi." (verify the latest ETF total vs the 1.1M estimate; if it isn't true yet, use the closest true comparison) | "Who owns the bitcoin?" |
| Wed 18 Nov | crypto | Teach · format: object (a mint stamping new coins, its output halving) | The halving: about 450 new bitcoin are made a day; at the next halving (expected 2028) that drops to 225. What a block reward is, why it halves every 210,000 blocks, what happened to miners after the April 2024 halving, and the 21M cap. Step for today: check where the date estimate comes from (block height, not a calendar date). No price talk. | #19 The Deadline: "Every day about 450 new bitcoin are created. In 2028, that drops to 225." (verify today's reward, blocks per day and the expected date) | "450 a day, then 225" |
| Thu 19 Nov | crypto | Skit · format: skit (the suit guy and Stonks: script-guide "Skits", storyboard-spec `Actor3D`, reference `episodes/2026-11-17-genius-copy-paste`) | "The screenshot": your wallet gives you 12 recovery words and says write them on paper; you screenshot them instead, "because you're a genius"; then malware that reads your photos finds them. Lead to verify: Kaspersky's SparkCat report (Feb 2025) on apps in the official app stores that scanned photo galleries for recovery phrases; use only what the report says (what the apps did, how many downloads, which stores). If it doesn't hold up, pick another sourced case of a photographed or cloud-stored phrase being stolen. Step for today: write the words on paper; never photograph them or type them anywhere. | "Here's how to lose your crypto with one screenshot." (lead with the case's real number if it has one; verify first) | "One screenshot" |
| Fri 20 Nov | crypto | Story · format: object (the popcorn tin under the bathroom floor; DOJ photos and filings as receipts) | Silk Road's popcorn tin: in 2021 US agents found 50,676 BTC hidden in a popcorn tin under a bathroom floor (James Zhong). How he took it from Silk Road in 2012, how a 2019 break-in report helped lead agents to him, the seizure and his sentence. Step for today: every coin's history is public on the chain, so anything you do with it can be traced later. | #25 Someone Else's Result: "50,676 bitcoin were hidden in a popcorn tin under a bathroom floor." (verify the count, the year and the sentence) | "The popcorn tin" |
| Sat 21 Nov | crypto | Skit · format: skit | "Wrong number": a stranger texts "Hi, is this Dave?"; you're not Dave, but she's nice and she knows crypto; you put money on her "platform"; then it costs more to "unlock" it. Real case and numbers from `episodes/2026-11-11-pig-butchering-banker/research.md` (the Kansas bank CEO, $47.1M, 24 years; the FBI's yearly total): re-check each one. Told in the second person; the banker is "a real bank CEO", not mocked. Step for today: if a stranger brings up crypto, block them; a fee to withdraw means the money is already gone. | "Here's how to lose forty-seven million dollars to a wrong-number text." (verify) | "Wrong number" |
| Sun 22 Nov | crypto | Story (what-if) · format: scenario (one group buys up most of the mining power for a day) | What if one group controlled most of Bitcoin's mining? A thought experiment, said so up front: what a 51% attack can and can't do (reverse its own recent payments, not steal your coins or change the 21M cap), the real Ethereum Classic attacks in 2020 and what they cost exchanges. Step for today: for big payments, wait for more confirmations, which is why exchanges do. | #23 The Statistic: a real 51% attack amount from 2020 (verify the Ethereum Classic double-spend figures) | "51% for a day" |

Why this mix: Edu's picks, in his order. Types: Story, Proof, Teach, Proof, Story, Teach, Story (never two in a row). Formats:
character, motion, object, documentary, object, breakdown, scenario (no repeats day to day; Sun 15 was scenario, so Mon 16 is not).
One Sonar mention (Thu). Hacks spaced out (Mon, Sat). The Sunday review checks each slot against its numbers and writes the next plan.

## Upcoming themes, 16–29 Nov (Edu asked for the next few weeks, 2 Nov 2026)
Topics and order agreed in Edu's live session. The Sunday reviews turn each week into the table above (hooks verified, formats
checked against the previous reel, numbers applied) and may swap a slot only if the numbers clearly say so; the trend scout can
still replace a day for a top story. Rules behind the picks: strictly crypto; a big number in the first line; a practical warning
someone would forward; no politicians in hooks or captions (2 Nov: the TRUMP reel started slowly, possibly Instagram's
political-content limit); scams and hacks spaced out; never the same format two days running.

| Day | Ch | Theme | Hook lead (verify) | Format |
|---|---|---|---|---|
| Mon 16 | crypto | Ronin bridge: $625M stolen through a fake job offer, unnoticed for six days (2022) | "Hackers took $625 million, and nobody noticed for six days." | character (the engineer and the PDF) |
| Tue 17 | sonar | Who holds the most bitcoin: ETFs, exchanges, companies, Satoshi | "Wall Street funds now hold more bitcoin than Satoshi." | motion |
| Wed 18 | crypto | The halving: new bitcoin per day halves in 2028 | "Every day about 450 new bitcoin are created. In 2028, that drops to 225." | object |
| Thu 19 | sonar | Exchange inflows vs outflows: what a whale moving coins can and can't tell you (fresh verified event first) | from a live on-chain move | documentary |
| Fri 20 | crypto | Silk Road's popcorn tin: 50,676 BTC found under a bathroom floor (James Zhong, 2021 seizure) | "50,000 bitcoin were hidden in a popcorn tin." | object |
| Sat 21 | crypto | The DAO hack (2016): $60M, and why Ethereum split in two | "One bug made Ethereum split into two blockchains." | breakdown |
| Sun 22 | crypto | What if one group controlled most of Bitcoin's mining? (51% attacks; Ethereum Classic, 2020) | a real 51% attack amount (verify) | scenario |
| Mon 23 | crypto | Bybit, Feb 2025: $1.5B through a tampered signing screen | "Hackers took nearly $1.5 billion in a single transaction." | breakdown |
| Tue 24 | sonar | Stablecoin mints: $1B of new USDT overnight, what actually happened | the latest verified mint | documentary |
| Wed 25 | crypto | SIM swaps: losing crypto through your phone number (protection only) | "A thief can take over your phone number in minutes." | scenario |
| Thu 26 | sonar | Dormant wallets: why very old coins waking up makes headlines (fresh verified event first) | a live wake-up | breakdown |
| Fri 27 | crypto | Dogecoin: the joke that became a top-10 coin | "Dogecoin was made as a joke in 2013." | character |
| Sat 28 | crypto | The first bitcoin payment: Satoshi to Hal Finney (Jan 2009) | "The first bitcoin payment ever was 10 coins, between two strangers." | character |
| Sun 29 | crypto | Fresh address, lost phone: how wallet recovery actually works (what-if: you lose your phone tonight) | practical | scenario |
Held back for now: the 2020 Twitter scam (politicians' accounts, a teenager's case), China's mining ban and North Korea's hackers
(governments: likely to be treated as political by Instagram).
