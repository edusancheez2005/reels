# Research: "Because you're a genius" — the $50M copy-paste, as a skit (Tue 17 Nov 2026, built live with Edu)

Edu, 17 Nov 2026: the explainers stopped pulling views; he wants creative, funny shorts with proper 3D characters (the "genius guy"
meme shape: a smart-sounding shortcut that backfires), "obviously crypto related", longer than 15–20 s, and a new narrator voice.
He picked the two test characters ("way cooler and way better") and said "Make a video and post it."

Format: **skit** (new). A deadpan narrator talks to "you"; two rigged 3D characters act it out: the suit guy (the "genius") and
Stonks (the friend who cheers every bad idea). The story is a real one, told in the second person: the 19 Dec 2025
address-poisoning theft. Every number in the script is from that case. The friend, the jokes and "you" are the fiction.

All facts below were verified for `episodes/2026-11-03-copy-paste-50m` (on-chain via the Blockscout Ethereum explorer, 3 Nov 2026)
and are reused from its research.md, where each has its transaction hash. No URL here was fetched from memory.

## Facts used (script line → fact → source)
1. "lose fifty million dollars with one copy and paste" → on 19 Dec 2025 a trader sent 49,999,950 USDT to a scammer's look-alike
   address after copying it from the wallet's transaction history. Tx 0xc0514a795f065fce8a3e1238a1ba480e8a792d45f6431ee4ba8d800bedd86a0f
   (Blockscout). CoinDesk: the victim "copied the lookalike address from transaction history"
   (https://finance.yahoo.com/news/crypto-user-loses-50-million-174321722.html). "Fifty million" rounds 49,999,950; the caption gives the exact figure.
2. "you send a fifty-dollar test to the right wallet address." → 15:06:47 UTC, a 50 USDT test to the real destination. Tx
   0x7f5d895ce0eca61d4e3230b7d3471c60c7dc507e1e400e1b5c449e54cfca9a98 (Blockscout). CoinDesk: "$50 test transaction". The script
   says "the right address", not "your own wallet": the reports don't establish whose wallet the destination was.
3. "The address is forty-two random-looking characters." → ethereum.org, "Ethereum accounts": an account "has a 42-character address";
   "20 bytes, written as 0x and 40 hexadecimal characters" (https://ethereum.org/en/developers/docs/accounts/, found by search 17 Nov 2026).
4. "you copy it from your history" → fact 1 (CoinDesk).
5. "The start looks right. The end looks right." → real destination 0xbaf4b1aF7E3B560d937DA0458514552B6495F8b5, look-alike
   0xBaFF2F13638C04B10F8119760B2D2aE86b08f8b5: same first 3 characters after 0x and same last 4; the middle differs. SlowMist
   founder Cos: "first 3 characters and last 4 characters are the same" (Cointelegraph, above). Both addresses are shown on screen (AddressMatch).
6. "Minutes ago, a scammer sent you half a cent from a look-alike address. Now it's sitting in your history." → 15:20:35 UTC, 14 minutes after the test, the
   look-alike sent the trader 0.005 USDT so it would sit in the wallet's history. Tx
   0x9780f38b63f761ccfb8fde3b2c27630646baace1f06b2959a3874849937288bd (Blockscout; Bitquery
   https://bitquery.io/investigations/address-poisoning-ethereum). The theft followed at 15:32:59, 12 minutes later.
7. "Fifty million dollars, gone. Crypto has no undo button." → nothing came back to the trader's wallet (Blockscout token
   transfers, checked 3 Nov 2026); a confirmed transfer can't be reversed by anyone; the trader's only lever was a $1M bounty offer
   (CoinDesk; The Block https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return).
8. "This happened to a real trader in December twenty twenty-five." → facts 1, 2, 5, 6 (19 Dec 2025). The trader is unnamed in every report.
9. "Never copy an address from your wallet history." (on screen and in the caption: "Save the real one as a contact.") → MetaMask support, "Address poisoning scams": don't copy addresses from
   transaction history; verify the full address and "focus on the middle characters"; save verified addresses as contacts
   (https://support.metamask.io/fr/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams/).

## The fiction (say so in the caption)
- The characters' spoken lines ("[stonks] Genius!", "[suit] Send.", "[stonks] Stonks!", "[suit] No.", "[stonks] Great trade!"):
  made up, short, and never presented as anyone's real words. Edu, 17 Nov: "you can have more than one character speak and then
  could be different voices."
- "You", the friend (Stonks), "You are a responsible adult", "Looking it up again is for normal people", "Nobody reads the middle",
  "Your friend has never been prouder / is still clapping": jokes. No real person is shown or named; the suit guy is a cartoon, not the trader.
- The reports don't say whether the trader checked the ends of the address; "The start looks right. The end looks right."
  describes the two addresses (true), and "Nobody reads the middle" is the joke about why the trick works.

## Not used
- Binance as the source of the funds, the DAI swap, Tornado Cash, the bounty: true (3 Nov research) but they slow a skit down.
- Price talk, predictions, advice beyond the one step.

## On screen (each from the facts above)
- "$50,000,000" (hook tag): fact 1, rounded; the monitor and the receipt show the exact 49,999,950 USDT.
- Monitor states: "$50" test to "0xbaf…F8b5" (fact 2; a true prefix and suffix of the real destination); "$49,999,950" (fact 1);
  "0xBaF…f8b5" (the look-alike, fact 5); "+0.005 USDT from 0xBaF…f8b5" with the tag "real transaction · 19 Dec 2025" (fact 6);
  "BALANCE $0.00" (the wallet held 50,000,000 USDT: 49,999,950 received + 50 already there; after the 50 test and the 49,999,950
  transfer only the 0.005 bait remained, which rounds to $0.00). The monitor is a cartoon screen, not a screenshot of any app.
- "42 characters" with the real destination address written out in two lines (fact 3; the address is fact 5).
- "0xBaF" / "f8b5" and the look-alike's middle characters (fact 5). AddressMatch: both real addresses (fact 5).
- The explorer page near the end: the real theft transaction on Blockscout (fact 1), captured for the 3 Nov episode.
- End card: "never copy an address from your wallet history" / "save the real one as a contact" (fact 9).

## Characters and voice
- Models: "Bizdude" (suit guy) and "StonksReporter" (Stonks) from the 100Avatars collection by Polygonal Mind, licence CC0
  (stated in each file's VRM metadata: licenseName CC0, commercial use Allow), listed in the Open Source Avatars registry
  (https://github.com/toxsam/open-source-avatars, found by search 17 Nov 2026).
- Same story as the 3 Nov reel (14 days ago, outside the 7-day no-repeat rule), told in a different format.

## Script review (17 Nov 2026)
Independent reviewer, round 1: REWRITE, line edits only ("hook, structure and chronology hold"). Applied: "exactly this" removed
(it stated the jokes as fact about a real victim); the half-cent line now says why it matters ("Now it's sitting in your
history"); "your wallet's history" instead of "your history"; "Typing them" → "Looking it up again" (nobody types an address);
"random-looking"; "Now the real money"; "looks right" instead of "matches"; "wallet address". Not applied: the extra spoken
line "Save the real one as a contact" (length); it is on screen and in the caption instead. "One problem." kept as the turn.

## Voices (17 Nov 2026)
Narrator: Kokoro `am_michael` (Edu picked it from six samples: "I quite like the first voice"). Stonks: `am_puck`. Suit guy:
`bm_george`. All three are stock synthetic voices from the same open model; none imitates a real person.
