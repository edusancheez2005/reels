# Claude and the Riemann hypothesis (breaking, midday 22 Nov 2026)

Topic source: midday trend scout (insights/trends/2026-11-22.md, "## Midday"). Every fact below re-checked by me from the pages
listed, 22 Nov 2026 ~11:55–12:25 UTC. Scientific American, Nature, Science, Bloomberg, NYT and the Guardian refused automated
fetch: used only for their headlines as returned by search (Bloomberg 21 Nov: "Anthropic Researcher Claims AI Solution for
Riemann Hypothesis With Claude"; NYT breaking-news post on X: "An Anthropic mathematician claimed to have proven the Riemann
hypothesis, the most famous unsolved problem in mathematics."; Scientific American: "Anthropic mathematician proves Riemann
hypothesis, most famous problem in all of math" and "Dueling claims of Riemann hypothesis proofs emerge"; Nature: "Mathematicians
astounded by AI and human-written proofs of iconic Riemann hypothesis"), never for details.
Producer's note: this reel was produced by Claude, which is built by Anthropic, about a claim made with Claude. Same rule as the
20 Nov IPO reel: held for Edu's approval rather than auto-posted; tone strictly factual, the claim stays a claim, a sceptic's
line included.

## Facts used on screen / in the voice

1. **Friday 20 Nov 2026: Levent Alpöge, a mathematician at Anthropic, said he proved the Riemann hypothesis with Claude.**
   BBC (Kali Hays, Sat 21 Nov, via Yahoo News AU): "An Anthropic employee and mathematician" said on Friday he used Claude over
   "about six weeks"; the proof was found with a "non-public version" of Claude.
   https://au.news.yahoo.com/ai-solving-maths-problems-anthropic-230902059.html
   The Next Web (21 Nov 13:12 UTC): "a mathematician at Anthropic"; a four-page note on his website on Friday (alpo.ge/remark.pdf);
   the proof exists only as Lean code, no paper yet. https://thenextweb.com/news/anthropic-alpoge-claude-riemann-hypothesis-proof-lean
   Engadget (21 Nov 19:45 UTC): "Anthropic employee claims to have proven the most famous math problem using Claude".
   https://www.engadget.com/2324141/anthropic-employee-claims-to-have-proven-the-most-famous-math-problem-using-claude/
   Plus the Bloomberg / NYT headlines above. Anthropic itself has made no statement (none found in any source).
2. **About six weeks with Claude.** BBC (above): "about six weeks". TNW: a timeline running 6 Oct – 16 Nov.
3. **The Riemann hypothesis, from 1859, about how prime numbers are spread out.** Clay Mathematics Institute: "Formulated in
   Riemann's 1859 paper"; a proof "would shed light on many of the mysteries surrounding the distribution of prime numbers";
   status on the page: "Unsolved". https://www.claymath.org/millennium/riemann-hypothesis/ (screenshot)
   Prime numbers (2, 3, 5, 7: divisible only by 1 and themselves): standard definition.
4. **$1 million prize, offered since 2000.** Clay: "designated a $7 million prize fund for the solutions to these problems, with
   $1 million allocated to the solution of each problem"; "The prizes were announced at a meeting in Paris, held on May 24, 2000".
   Only Poincaré is listed as solved. https://www.claymath.org/millennium-problems
5. **The proof is ~17 million lines of Lean, in 175,187 files.** Primary record: Michael Rubinstein's check page at the University
   of Waterloo: released as Lean, "175,187 files, about 17 million lines".
   https://www.math.uwaterloo.ca/~mrubinst/alpoge_claude_grh/ (screenshot)
   Lean = a proof assistant: software that checks every step of a proof (TNW; Nacionale: proof assistants check exactly the
   stated statement).
6. **Independent checks: no errors.** Rubinstein's page (run 21 Nov): all 175,187 modules compile, the main theorems depend only on
   Lean's three standard axioms, kernel replay accepted all 175,187, nanoda checked 1,484,729 declarations: "All four checks
   finished with no errors." It also lists other checkers: Andrew Sutherland (MIT), Elliot Arledge, Bartosz Naskręcki, Simon DeDeo.
   TNW: Sutherland (MIT) compiled it independently on Friday. Scientific American on X: "Independent mathematicians have now
   finished the full verification... The results are real, they say." (https://x.com/sciam/status/2124198343773450715, headline only)
7. **James Maynard (Oxford): "98 or 99 percent" sure.** Engadget: Maynard (University of Oxford) told the NYT he was "98 or 99
   percent certain" the discovery is accurate. TNW: Maynard "98 or 99 percent". (Two outlets, both citing the NYT.)
8. **No human has read it all; Tao: digesting it will take time.** BBC: Terence Tao: "I imagine the digestion process will take
   some time, though in this case at least we have a human author to communicate with". TNW: Tao (UCLA) wrote that understanding
   the proof will take time; Alpöge admits he has not mastered all the surrounding mathematics and plans to write it up. New
   Scientist via Compound: he "has not posted a human-readable version". Rubinstein: a 165-page working draft for the zeta case
   dated 21 Nov (a draft, not a published paper).
9. **It does not break bitcoin / crypto encryption.** Compound (20 Nov): the claim "does not weaken RSA or the encryption behind
   payments and crypto". https://getcompound.ai/news/riemann-hypothesis-proof-encryption-markets ·
   Nacionale: RSA rests on factoring, and the hypothesis "says nothing about how to do that splitting".
   https://www.nacionale.com/en/articles/would-riemann-hypothesis-proof-break-encryption-what-it-would-change-alpoge-claude ·
   Bitcoin News on X (headline): "NO, ANTHROPIC'S RIEMANN HYPOTHESIS BREAKTHROUGH DOES NOT BREAK BITCOIN".
10. **Prize rules: published, two years, general acceptance.** Clay rules (adopted 26 Sep 2018): publication in a "Qualifying
   Outlet", "at least two years must have passed since publication" and "the proposed solution must have received general
   acceptance in the global mathematics community". https://www.claymath.org/millennium-problems/rules/ (screenshot)

## Deliberately not used
- "Lean FRO and Mathlib jointly certified it" (several blogs): not found in any primary or major source. Not used.
- "250,000 pages" (BBC): true as reported but a second size number would confuse the 17-million-lines hook. Not used.
- Brian Conrad's "frankly completely outrageous" (TNW only): one secondary source; Tao's line (BBC) is the sceptic beat instead.
- Masullo's rival all-human proof: a second story; reported problems in it; would need its own explanation. Not used.
- Generalized Riemann hypothesis, Navier–Stokes claim, Anthropic's August zeta-zero paper: true context, too much for 60 s.
- The IPO / share price: separate story (20 Nov reel). No stock, no prediction.

## Format
Candidates: (a) `documentary` — breaking news with strong receipts (Clay's own pages, Rubinstein's check page, the BBC story), the
claim vs the checks; the last non-skit reel was `motion`, so allowed. (b) `breakdown` — "how a computer checks a proof" as steps in
one Iso3D world: fits the middle but makes the whole reel dark and abstract. (c) `character` — Alpöge at a desk with Claude: we
know almost nothing about how he worked day to day. Pick: **documentary**, borrowing one Iso3D world for the mechanism
(claim → 17M lines → independent checkers → prize vault) and receipts between.
Opening: dark (the last reel opened light), on the Iso3D world (the last three opened on Actor3D), with "$1,000,000" as a tag.
