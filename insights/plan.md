# Plan: Mon 2 – Sun 8 Nov 2026

Weekly review, 1 Nov: Mon–Thu rows kept as written (Edu gave Monday's direction on 1 Nov); Fri–Sun added from the top of
`backlog/crypto.md`. What this week's numbers change (see `insights/learnings.md`): stay strictly on crypto (the off-crypto AI-hack
reel was the weakest since 27 Oct), and every reel carries one plain warning or fact people would forward (shares are still 0 on
8 of 9 judged reels; the two "happening today" reels got 10 of 13 shares). Exchange-hack cooldown ends 6 Nov.

Earlier note (29 Oct):

Rewritten 29 Oct after Edu's asks: more short, entertaining true stories (like the "$109M bought in block 0" sniper reel he
showed), meme coins and snipers, and hypotheticals ("what if Bitcoin fell to $1?", "what if Bitcoin was the only money?").
Still Jake Schincariol's /ig-plan method (a mix of post types, never the same type twice in a row, a hook formula per slot) and
our own numbers (`insights/learnings.md`). Rota kept: Sonar on Tue/Thu, crypto explainers the other days.
The daily run uses today's row: it decides the channel and topic (overriding the rota). Hooks are leads: verify every number
before using it. All reels 45–60 s; follow "Story reels: Edu's standard" in the script guide; open on the number and show it on
screen in the first second; every reel gets a designed cover (`tools/make_cover.py`) and the 3-part story.
Formats (Edu, 31 Oct: "don't use the same exact format every single time... be creative"): each row suggests one; the run can pick
better for the concept, but never the same format as the previous reel (engine/SKILL.md "Pick the format for the concept").
Hypotheticals: say "this is a thought experiment, not a prediction" in the first two lines, ground every consequence in a real
mechanism or a real past event, and never imply where the price will go (channel rule).

| Day | Channel | Type | Topic and angle | Hook (formula # from tools/ig/hooks.json) | Story card teaser |
|---|---|---|---|---|---|
| Mon 2 Nov | crypto | Hypothetical (dystopian) · format: scenario (follow one person through a day where Bitcoin is the only money: coffee, a refund that never comes, rent, a lost phrase) | What if Bitcoin was the only money? A day in that world: no refunds or chargebacks, every payment on a public record, the base network settling only a handful of payments a second (queues, fees), prices that swing daily, a lost phrase = lost savings, and the workaround (Lightning). One line on what supporters say it would fix. | #23, number-led what-if: "If Bitcoin were the only money on Earth, the whole world would share a network that settles about seven payments a second." (verify the throughput figure and a card network's published capacity) | "Bitcoin as the only money" |
| ↳ Mon 2 Nov, Edu's direction (1 Nov 2026) | | | "make it very creative. make the person walking around like a third person observation and animations and stuff". Build it as a third-person follow-cam: one 3D character walks through a small built world (street → café counter → phone/wallet → home/rent → lost-phrase moment), the camera trailing behind/over the shoulder and orbiting at each stop; each consequence is an animation happening around them (a payment pending with a queue/fee counter over the café, a refund button that greys out, a public-ledger trail lighting up behind them, a price ticker swinging on a shop sign). Character3D only has `enter` for walking today: extend it (or add a reusable Walk/Street3D scene) with a walk cycle along a path + a follow camera, and keep it generic. Still: thought-experiment line up front, every number sourced, no price predictions. | | |
| Tue 3 Nov | sonar | Proof · format: breakdown or motion (the copy-paste trick as steps; not the format of the last reel (quantum = object)) | A fresh verified on-chain event. Fallback: the $50M copy-paste (address poisoning, Dec 2025): a look-alike address planted in a trader's history, a test transfer, then the real one; why nobody can reverse it; how to check an address. | #1 Cost Confession / #23: "In December 2025, one copy-paste cost a crypto trader $50 million. Nobody can reverse it." (49,999,950 USDT, Cointelegraph 20 Dec 2025) | "One copy-paste: $50M" |
| ↳ Tue 3 + Wed 4 Nov, posted early (2 Nov 2026) | | | Edu had both built in his live session and said "post them" / "one now and one in 5 hours": the TRUMP sniper reel went up at ~16:55 on 2 Nov and the quantum reel at ~21:55. The rows below moved up two days (copy-paste → Tue, meme coins → Wed, Poly Network → Thu, Satoshi what-if → Fri) and Sat/Sun took the next backlog items. | | |
| Wed 4 Nov | crypto | Teach (balanced) · format: object or motion (a coin minted from a joke in seconds, a chart rising and collapsing; not the format Tue used) | What is a meme coin? Follows the sniper reel (posted 2 Nov): a coin with no product, just a joke, a dog or a celebrity; anyone can launch one in minutes; why most go to zero and who's left holding them. Say plainly most buyers lose. No tips, no hype. Forwardable line: "if a coin's only reason to exist is that it's going up, you're the exit." | #23 The Statistic: "In February 2025, a meme coin named after a dog hit a $400 million market value in five minutes." (Broccoli, after CZ showed his dog: The Block, 14 Feb 2025; verify, and add the share of launched coins that die, e.g. Solidus Labs on pump.fun) | "A $400M joke" |
| Thu 5 Nov | crypto | Story (entertaining) · format: documentary (the hacker's real on-chain messages and Poly Network's open letter as receipts, a counter going up then back down) | Poly Network, 2021: the hacker who stole $610 million and gave it all back. Who Poly Network was, the bug, the hacker's messages written into transactions, the "Mr. White Hat" bounty offer, why they returned it (traced on public chains, nowhere to cash out). Lesson: on-chain theft is public; and bridges are where the biggest losses happen. Cooldown over by then. | #25 Someone Else's Result: "In 2021, a hacker stole $610 million in crypto. Two weeks later, they gave all of it back." (verify the total and the 25 Aug 2021 date of the last return) | "Stole $610M, gave it back" |
| Fri 6 Nov | crypto | Hypothetical · format: scenario or breakdown (a block explorer page with a dormant 2009 address lighting up; not the same format as Thu) | What if Satoshi's coins started moving? A thought experiment, said so up front: about a million bitcoin believed (an estimate, the "Patoshi" pattern) to be Satoshi's haven't moved since 2010; what the community and markets would read into a move, how it could be checked (a signed message), and what it can't tell you. Never imply a price move. | #3 Nobody Tells You / #23: "About a million bitcoin, believed to be Satoshi's, haven't moved since 2010." (verify the estimate, Sergio Lerner's Patoshi analysis, and say it's an estimate) | "If Satoshi's coins moved" |
| Sat 7 Nov | crypto | Story (entertaining) · format: character (the CEO as a 3D stand-in, the laptop only he could open; real court/monitor reports as receipts) | QuadrigaCX: the Canadian exchange whose CEO died in Dec 2018 holding the only access to customers' crypto; what the court-appointed monitor (EY) later found (the cold wallets were mostly empty). Who he was, what the users lost, why one person holding the keys is the mistake. Verify every figure (amount owed, number of users) in the monitor's reports. | #25 Someone Else's Result / #3: "In 2018, a crypto exchange's CEO died, and nobody else could open its wallets." (verify the date and the amount owed) | "The CEO who died with the keys" |
| Sun 8 Nov | crypto | Story · format: documentary (real filings and headlines as the spine) | FTX's collapse, Nov 2022: how customer deposits ended up at Alameda, the run in a few days, the bankruptcy, the 2023 verdict. Lesson: an exchange holding your coins can lend them out; not your keys, not your coins. Exchange-hack cooldown is over by then; this is a collapse, not a hack. Verify every number in court records. | #23 The Statistic: "In November 2022, the crypto exchange FTX went from 32 billion dollars to bankrupt in about a week." (verify the valuation and the dates) | "$32B to bankrupt" |

Why this mix: Edu wants entertaining true stories and what-ifs; our numbers say open on one big, concrete number with a stake
(three reels at ~1,700 views and ~1/3 skipping vs ~150 views and ~1/2 skipping without). Every slot opens that way. The sniper
reel is the one Edu's reference account hit with (41K views vs their usual 1–4K). The security and what-if reels carry practical
warnings people forward, because shares are still near zero.
Extra on Fri 30 Oct: a breaking-news reel on the $6.3B Binance hack (Edu asked for it that evening).
Next week (backlog order): QuadrigaCX (the CEO who died with the keys), FTX, the halving, Twitter 2020 bitcoin scam, what if the internet went down.
The Sunday review checks each slot against its numbers and writes the next plan.

## Upcoming themes, 9–29 Nov (Edu asked for the next few weeks, 2 Nov 2026)
Topics and order agreed in Edu's live session. The Sunday reviews turn each week into the table above (hooks verified, formats
checked against the previous reel, numbers applied) and may swap a slot only if the numbers clearly say so; the trend scout can
still replace a day for a top story. Rules behind the picks: strictly crypto; a big number in the first line; a practical warning
someone would forward; no politicians in hooks or captions (2 Nov: the TRUMP reel started slowly, possibly Instagram's
political-content limit); scams and hacks spaced out; never the same format two days running.

| Day | Ch | Theme | Hook lead (verify) | Format |
|---|---|---|---|---|
| Mon 9 | crypto | The IronKey: a programmer with two password guesses left before 7,002 BTC lock forever (Stefan Thomas) | "Two wrong guesses and 7,002 bitcoin are gone forever." (check the 2023 Unciphered offer and today's status) | object (Drive3D: the 10 attempt lights) |
| Tue 10 | sonar | How to read a whale alert without panicking (this week's Sonar mention) | a real recent alert that was just an exchange moving its own coins | breakdown |
| Wed 11 | crypto | Pig-butchering: the scam that starts with a wrong-number text | the FBI IC3 yearly crypto-fraud total (verify) | scenario (follow one person through the texts) |
| Thu 12 | sonar | Mt. Gox: 850,000 BTC lost in 2014, and the repayment wallets moving a decade later | "In 2014, the biggest bitcoin exchange said it had lost 850,000 coins." | documentary (filings + explorer receipts) |
| Fri 13 | crypto | Terra/Luna: about $40B gone in a week (May 2022), and what a stablecoin is | "A coin designed to always be worth $1 fell to almost zero in days." | motion (the peg loop) |
| Sat 14 | crypto | The Squid Game token: up thousands of percent, then zero in minutes; buyers couldn't sell (Nov 2021) | "People bought it, but the code wouldn't let them sell." | character |
| Sun 15 | crypto | What if the internet went down? Bitcoin by satellite and radio | "Bitcoin blocks are already beamed from space." | scenario |
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
