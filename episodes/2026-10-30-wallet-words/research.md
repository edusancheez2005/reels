# Your wallet holds no crypto: it holds words (sources, checked 30 Oct 2026, 04:00–04:15 London)

Teach reel (insights/plan.md, Fri 30 Oct), told through a real event: the 2025 fake-Ledger letters. Follows the landfill
story's lesson (recovery words).

## How a wallet works
1. A crypto wallet "stores the public and/or private keys" for transactions; the coins themselves are records on the
   blockchain. [Certain] — https://en.wikipedia.org/wiki/Cryptocurrency_wallet (lead sentence); bitcoin.org "Some things you
   need to know": https://bitcoin.org/en/you-need-to-know
2. Recovery phrase standard: BIP-39 "Mnemonic code for generating deterministic keys", assigned 2013-09-10; a mnemonic of
   12 words (128 bits) up to 24 words (256 bits); each word is an index 0–2047 into a fixed wordlist, i.e. one of 2,048
   words; the English list has exactly 2,048 lines. [Certain] — https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039.mediawiki
   (ENT/CS/MS table: 128→12 words, 256→24 words); https://bips.dev/39/ (screenshot); wordlist
   https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt (wc -l = 2048, checked 30 Oct).
3. The phrase generates the wallet's keys ("generation of deterministic wallets"), so entering it into another compatible
   wallet restores access: the coins "come back" because they never left the blockchain. [Certain] — BIP-39 abstract; Ledger:
   a recovery phrase "unlocks access to a crypto wallet" (Cointelegraph, 30 Apr 2025: "A seed phrase, or recovery phrase, is a
   string of up to 24 words that unlocks access to a crypto wallet. A scammer with the phrase can access and control the
   assets and transfer its holdings elsewhere.").
4. No undo: "Bitcoin has no central authority to reverse a mistake... No one—not developers, miners, wallet providers, or
   exchanges—can recover funds..." (section "There is no undo button"). [Certain] — https://bitcoin.org/en/you-need-to-know

## The letters
5. 29 Apr 2025: Jacob Canfield, a crypto trader and tech commentator, posted on X a physical letter he had received, posing as
   Ledger: Ledger's logo, business address and a reference number, a "critical security update", a QR code, and an
   instruction to enter his recovery phrase; it warned that "failure to complete this mandatory validation process may
   result in restricted access to your wallet and funds". [Certain] — Cointelegraph, 30 Apr 2025, Brayden Lindrea:
   https://cointelegraph.com/news/ledger-scammers-send-letters-steal-recovery-seed-phrases (screenshot with the real photos
   from his post); The Block, 30 Apr 2025: https://www.theblock.co/post/352479/ledger-confirms-physical-scam-letters-requesting-seed-phrase
   ("trader Jacob Canfield"). The voice does not say he entered anything (he didn't; he posted a warning).
6. Ledger (a maker of hardware crypto wallets) said it was a scam: "Ledger will never call, DM, or ask for your 24-word
   recovery phrase. If someone does, it's a scam." [Certain] — Cointelegraph and The Block, 30 Apr 2025 (quoting Ledger on X).
   Ledger's support site banner (screenshot, 30 Oct 2026): "Ledger will never ask for the 24 words of your recovery phrase.
   Never share them." — https://support.ledger.com/article/360005434914-zd
7. 2020 leak: Ledger announced a data breach in July 2020; a database with "more than 273,000 customers'" emails, physical
   addresses and phone numbers was released on a hacking forum later that year. [Certain] — The Block, 30 Apr 2025.
   On screen: "273,000+" / voice "over two hundred seventy thousand". NOT claimed: that the 2025 letters used that leak
   (Ledger didn't confirm; Canfield suggested it). The voice only states the leak happened.
8. Feb 2026: fake Trezor letters (reported 13 Feb by Dmitry Smilyanets; the letter in his photo is dated 01/20/2026) demanded an "Authentication Check" by 15 Feb 2026 or lose device functions;
   a QR code leads to a fake setup page that asks for the 12, 20 or 24-word phrase and sends it to the attacker.
   [Certain] — Cointelegraph, 17 Feb 2026: https://cointelegraph.com/news/scammers-send-physical-letters-trezor-ledger-users-again
   (screenshot with the real letter photo, source Dmitry Smilyanets). Exact line in the photo and in BleepingComputer: "Authentication Check will soon become a mandatory part of Trezor" (on screen as a quote card); BleepingComputer, 14 Feb 2026 (Lawrence Abrams):
   https://bleepingcomputer.com/news/security/snail-mail-letters-target-trezor-and-ledger-users-in-crypto-theft-attacks
   ("will never ask users to enter, scan, upload, or share their recovery phrase"; phrases "should be entered directly on
   the hardware wallet device"). Trezor = another hardware-wallet maker.
9. The two mistakes the trick needs: a deadline (Ledger letter: "mandatory", restricted access; Trezor letter: by 15 Feb)
   and entering the words on a website (the QR code leads to a phishing site that collects the phrase). [Certain] — items 5, 8.
10. Fix: enter the phrase only on your own wallet device / app, never on a website, email or mail. [Certain] —
   BleepingComputer (item 8); Ledger quote (item 6).

## On screen (every number)
- s7 recreated letter box: "VALIDATION IS MANDATORY" — item 5 ("mandatory validation process"); no deadline date shown, none was reported for the Ledger letter.
- "12 or 24 words" — item 2. "2,048 words" — item 2. "BIP-39 · 2013" — item 2. "April 2025" — item 5.
- (2020 leak not used on screen or in the voice after script review.)
- Example words on the 3D card are generic BIP-39 list words chosen for the visual, labelled "example"; not a real wallet.

## Blocked from this workspace
- theblock.co and bleepingcomputer.com (Cloudflare check) and benzinga.com: text read via the fetch tool, no screenshots.
  Cointelegraph screenshots carry the same events.
