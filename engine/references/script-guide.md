# Script guide

A faceless explainer reel lives or dies in the script. The visuals can only show what the
words give them.

## Shape (45–60 s, 120–160 words)

Edu, 29 Oct 2026: the 33 s version was "too short, barely any information". Information first; never pad.

| Part | Time | Job |
|---|---|---|
| Hook | 0–3 s | The most striking verifiable fact, with a number, shown on screen immediately. |
| Who / setup | 3–12 s | Who this is about and why they matter, or the wrong intuition. |
| What happened / mechanism | 12–42 s | The chain of events or the 3 steps, cause → effect. Each step = one picture. |
| Payoff + lesson | last 10–15 s | The consequence, then the specific lesson from *this* story and why it works. |
| Loop line | last 1–2 s | Optional. Leads back into the first line. |

## Story reels: Edu's standard (29 Oct 2026)

What went wrong in the landfill reel, and the rule that fixes it:
1. **Introduce every person before they act.** Name, who they are, why we care: "James Howells, an IT engineer who mined
   bitcoin in 2009, when it was worth almost nothing." Never "a man" and then a name with no context.
2. **Explain how it happened, not just that it happened.** The mechanism of the mistake (e.g. two drives in one drawer, the wrong
   one binned), what they tried next, and why it failed (the judge's actual reason).
3. **Answer the viewer's obvious questions** before they ask them: who is he? how? can't he just dig it up? what now?
4. **6+ concrete, sourced facts** (names, dates, places, amounts). A reel with three facts feels empty however good it looks.
5. **The ending names this story's specific mistakes and the specific fix, and says why.** Not "keep your keys safe".
   Landfill example: "He made two mistakes. His key existed in one place only, and that place was a drive he treated like
   junk. Write your recovery words down, keep two copies in two safe places, and label the device that holds your key."
6. **Self-check before voicing:** read the script as a stranger. If you'd ask "wait, who?" or "why?", the script isn't done.

No intro, no "hey guys", no "in this video". The first word is already content.

## Talk like a friend (Edu, 30 Oct 2026: "talk in a simplistic manner"; "a little bit more enthusiastic")

Say it the way you'd explain it to a mate, in the order people think, with a bit of energy:
- Edu's own example: "If you lose your words, you lose everything. If you know the words, you can type them into another
  wallet and get your coins back." Not "Those words make the secret key that spends them."
- Plain words over precise jargon ("get your coins back", "the code that moves your coins"); if-then sentences for cause
  and effect; one idea per line.
- Energy comes from the writing first: short punchy lines, a turn ("Here's the crazy part:", "And that's the problem."),
  questions the viewer is already asking ("So why can't he just dig it up?"). Max one "!" per reel; no hype words.
- Read it aloud with a smile. If it sounds like a textbook, rewrite it.

## Clarity pass (Edu, 30 Oct 2026: parts of the wallet script "do not make much sense")

Every sentence must make sense on one listen, in order, to someone who has never bought crypto. What went wrong in
`episodes/2026-10-30-wallet-words` and the rule each breaks:
- "Those words make the secret key that spends them, picked from a list of two thousand and forty-eight." Two ideas in one
  sentence, "them" points at the coins, and "picked from" attaches to the key. → One idea per sentence; every pronoun has one
  possible meaning. "The words rebuild the secret key that moves your coins. Each word comes from a list of 2,048."
- "Lose your phone? Type them into a new wallet: the coins come back." The line before said the coins never leave the
  blockchain. → Never contradict an earlier line: "...and you're back in."
- The jump from "how it works" straight into "In April 2025, trader Jacob Canfield got a paper letter..." with no link. →
  Every new part opens with the bridge: "That's why scammers want those words."
- "recovery words" first appears inside the scam, never introduced as the name of the 12–24 words. → Name a term the first
  time the thing appears: "...12 or 24 words, called your recovery phrase."
- "owners of Trezor, another maker, got one with a deadline." → Don't drop the noun to save words: "got a similar letter".
- "Two mistakes make it work" when nobody in the story made a mistake (Canfield spotted the scam). → The landfill-style
  "his two mistakes" ending is for a person who made them. Otherwise: "The trick needs you to do two things: ..."
Self-check: read the script aloud once, no rewinding. Any line you'd have to replay gets rewritten.

## What-if reels (Edu, 29 Oct 2026: "hypothetical situations like that are very cool")

"What would happen if Bitcoin fell to $1?", "What if Bitcoin was the only money?". Thought experiments, never predictions.
1. **Hook on the most striking concrete consequence, with a number:** "If Bitcoin fell to one dollar, the computers that keep
   it running would earn about three dollars every ten minutes." Not "What if Bitcoin crashed?".
2. **Line 2 says it's a thought experiment:** "Nobody's predicting this. But it shows how Bitcoin really works." The channel
   rule still holds: never imply where the price will go.
3. **3–4 consequences, each tied to a real mechanism or a real past event,** with the source in research.md (the block
   reward, the difficulty adjustment, China's 2021 mining ban, Mt. Gox, FTX). Plain "would probably", never certainty.
4. **One line on the other side** (what supporters or critics would say), then **a practical takeaway** the viewer can use.
5. Show-ability: each consequence needs a picture (3D scene, real chart, real document), not talking points on cards.

## Skits (Edu, 17 Nov 2026: "we need some creative content"; "you can have more than one character speak")

**The default daily format from 18 Nov 2026.** After the first one (`episodes/2026-11-17-genius-copy-paste/`) went up, Edu:
"Absolutely love it. It's so funny and stupid... I like the skits idea", and yes to skits on consecutive days. In its first two
hours that reel had a 16% three-second skip rate (the explainers that week: 36–57%) and 26 likes (explainers: 1–5).
A skit is true content told as a joke: a deadpan narrator talks to "you", two cartoon characters act it out.

**What Edu asked for after the pilot (17 Nov), and every skit must do:**
1. *A different story every day.* "It's always like $50 million copy paste scam... I need like maybe like a story." The pilot's
   "Here's how to lose X with one Y" is one shape out of many: use it at most once a week. A skit doesn't have to be a scam
   or a loss: it can be how something works, how something started, a win, a mystery.
2. *A film, not a list.* "We need something like a movie kind of thing." Each skit borrows a kind of film and plays it
   straight. Set `"genre"` in storyboard.json; the gate fails if it matches either of the last two skits. Use any short name:
   `how-to-lose` (the pilot), `office` (a workplace drama), `heist` (the plan, the hiding place, the one mistake), `horror`
   (a dark room and a countdown), `nature-doc` (a hushed narrator watching a whale in its habitat), `romcom` (a meet-cute that
   turns), `trailer` (grave one-line cards and a title), `origin` (how it began, as a buddy comedy), `sports` (a training
   montage and commentary), `courtroom`, `noir` (a detective following money), `disaster`, `period`, `game-show`.
   The narrator stays `am_michael` and deadpan; the genre is in the words, the place and the light. Never use a real film's
   title, characters, lines or music, and never imitate a real presenter's voice.
3. *A story has a beginning, a turn and an ending.* (1) Who "you" are and what you want, in one line. (2) Two or three steps,
   each a worse idea done with total confidence. (3) The turn: "One problem." and how it really works, in one or two plain
   sentences. (4) An ending picture that calls back to the start (the friend is still clapping; the pizza box is still on the
   table). (5) "This happened to a real [person] in [month, year]." (6) The one step, as an order, when the story has one;
   a how-it-works skit ends on the one thing to remember instead.
4. *Less text on screen.* "It's just like quite a lot of text, maybe." The picture and the voice tell it. Budget for the whole
   skit: at most 8 tags and 2 stamps (the pilot had 18 and 3; the gate warns over budget and fails over 12 in total). A tag is
   three words or fewer and carries the number or the name, never a sentence the voice is already saying. What's on the
   monitor counts as picture. One real receipt (a `Shot`) near the end proves it happened.
5. *One number, not a pile.* "The numbers are always kind of like the same." Pick the one figure the story turns on and say
   it once or twice. Don't open every skit on a dollar amount.
6. *Stonks celebrates the worst moment.* "Stonks, and like your friend has never been prouder, and he's like jumping and
   clapping... I find that really funny." Every skit has it once, set up by a flat line from the narrator ("Your friend has
   never been prouder."), then `stonks:jump` (or `stonks:dance`) for at least two seconds on a shot wide enough to see his
   feet leave the floor, and a callback at the very end where he is still at it. His lines are one to three words and change
   every skit; "Stonks!" at most once.
7. *A place built for this story.* Not the yellow desk room every day. `mood`, `backdrop: "sky"` and `props` in the
   storyboard (storyboard-spec, `Actor3D`) make a night street, a bathroom floor with a popcorn tin, a courtroom, the sea.
   Two or three places at most; the first shot is already in the story's place (the gate checks it differs from the last reels).

**Sound, pauses and the last word** (Edu, 17 Nov 2026, after the pilot: "you can add like little sound effects... in the last
one it was like you've lost like 50 million whatever, and then... your friend is still clapping, and it's like get out, like
as a joke... That'd be quite funny."):
- *"GET OUT!"* is the skit's last word, and nobody on screen says it. Edu, in three notes on 17 Nov: "It has to be like a
  squeaky, like get out, like a squeaky, mad kind of voice. Like it's like a sound effect"; "higher and angrier and longer";
  "It's not him that says it. It's like a third party, like kind of like person that's seeing everything... just a sound
  effect that it's in the background"; and, when a try went far too high and distorted, "way too high... you can't even tell
  that he's saying get out... way lower... way less distorted." The words must be clear: loud and held, not mangled. So: after the real case and the step, the narrator says the callback ("Your friend is
  still clapping."), there is a pause with only the clapping, then an off-screen voice shouts a loud, drawn-out
  `[squeak] GET OUT!` over the scene, and the video cuts dead about a third of a second after it, with Stonks still mid-jump.
  No door, no fade, no end card: the cut is the joke, and the reel loops straight back into the hook.
  - Nobody acts it: no `talk`, no pointing, no mouth movement, no character turning to shout. The two of them just carry
    on (Stonks jumping, the suit guy ruined); a `shake` and a slow push-in on the scream are enough, with both faces
    still fully in frame at the end of it.
  - `squeak` is in every channel's `cast` (a voice raised a little, held on the vowel and pushed only slightly: `pitch`, `hold`,
    `drive`, `bite`, `gain_db` in cast.json; copy the whole `cast` into the episode). Don't change its settings in an episode:
    Edu picks them by ear.
  - In script.txt, as the last three lines: `Your friend is still clapping.` / `[pause 1.3]` / `[squeak] GET OUT!`
  - In the storyboard: `"tail": 0.3`, and a last scene anchored on "GET" with `"actions": ["shake"]`, both characters as they
    were in the scene before.
  Use it on most skits; it is the running gag. Never use the well-known "GET OUT" scream clip itself, or any other clip:
  it is somebody's recording.
- *Pauses.* A line that is only `[pause 2]` in script.txt adds two seconds of silence after the sentence before it (max 5).
  That is where a picture gag lives: Stonks jumping and clapping after his set-up line, the beat before "Get out.", the
  silence after a terrible idea. Two or three pauses a skit, 1–2 s each; they count towards the 45–55 s.
- *Sound effects* are made by `engine/scripts/make_sfx.py` (synthesised; nothing downloaded, nothing sampled). Three are
  automatic in `Actor3D` scenes: an actor in the `jump` or `clap` pose is heard clapping, a `stamp` lands with a `boom`, an
  entrance (`<id>:in`) gets a `pop`. The rest you place on a scene with `"sfx": [{"name", "beat"}]` (storyboard-spec):
  `dun` (dun dun DUN) on the turn, `trombone` when it has gone wrong, `crickets` over an awkward pause, `ding` for the bright
  idea, `buzzer` for the wrong answer, `cash` when money moves, `scratch` when everything stops, `rimshot` after a bad joke,
  `applause`, `whoosh`, `tick` (a countdown), `slam`. One effect per joke, at most six placed effects a skit, and never on top
  of a sentence that carries a fact: put it in a pause or between sentences.
- Never use a clip from a film, a show, a song or a meme sound, however well known: only these effects and the characters'
  own voices.

**Borrowed from what is travelling on Reels right now** (researched 17 Nov 2026 at Edu's request; use one per skit at most,
and only where it fits the story; none of these needs a trending song, which this pipeline can't attach anyway):
- *The narrator contradicts.* The oldest narrator joke there is: a character says something confident, the narrator flatly
  corrects it. `[stonks] It's going up!` / "It was not going up." Use it once, at the turn.
- *"This is Dave."* The narrator-voice-over format that has been everywhere since 2025 is third person: "This is Dave. Dave
  thinks he found a shortcut. Dave is wrong." Our default is "you"; a third-person skit is a fine change of pace.
- *"Some bills are non-negotiable. The bills:"* (trending in November 2026): treating a luxury as a fixed cost. A good cold
  open for a skit about inflation, fees or subscriptions.
- *"Major cheat code in life"* (same month): a tip framed as an insider shortcut. This is "because you're a genius" in the
  audience's own words: the skit's bad idea can be introduced as a cheat code.
- *"It's cool to do both"*: two things that contradict each other, side by side. Stonks buying and panic-selling the same day.
- *State the conflict in the first line, then switch character.* The comedy reels that got sent to friends that week all did
  this: the problem in the first sentence, the second character's reaction straight after.
- Make it something a person would send to one specific friend ("this is you"). That is the reason "you" works.

**Still true from the pilot:**
- **Voice**: a deadpan narrator speaking to "you", in the present tense. Short sentences. He never laughs at the joke.
- **Length**: about 120–140 words, 45–55 s.
- **The cast** (`channels/<channel>.json` → `cast`): the suit guy takes the shortcut; Stonks is the friend who cheers every bad
  idea. Two to five short lines between them, each on its own line starting with the tag: `[stonks] Promoted!`,
  `[suit] Send.` The narrator carries the facts. Either can play a part in the story (Stonks as the boss, the judge, a small
  fish), but they stay themselves.
- **True where it counts**: every number and every step of how it works comes from a real, sourced case (research.md, as
  always). The characters, "you" and the jokes are the fiction; say so in the caption ("The suit guy and his friend are made
  up. The numbers are real."). Never write "did exactly this" about a real victim: the jokes are not facts about them.
- No price talk, no advice beyond the one step, nothing cruel about a real person. Don't name a victim to mock them; a
  convicted person's public court record can be told plainly.
- Ideas: `backlog/skits.md` (each is a lead to verify, with its genre). Reuse a story an explainer already told only after
  7 days, and only with a new angle.

## Hooks (Edu, 2026-10-27: "a cool fact")

Open on the single most striking fact the reel can prove, stated flat, with a number, and show it in the first second.
Then the twist that makes people stay. A hook beats a question when the question has no answer.
- Good: "There will only ever be twenty-one million bitcoin. Over twenty million already exist." (picture: 21 stacks, 20 full)
- Good: "In 2010, someone paid ten thousand bitcoin for two pizzas." (picture: the real forum post)
- Weak: "Will Bitcoin go up or down?" (nobody can answer it; it was used once, don't repeat)
- Don't overclaim in the hook: scarcity alone doesn't create value (scarcity + people wanting it does). Say what's true.

## Hooks (Edu, 2026-10-26: "a way better hook")

The first line has to create a reason to keep watching: a hidden object, a danger, a surprising number, or a
"you've used this today and never noticed" moment, *and* it must be showable in the first second. Then promise the
explanation ("Here's why it's there."). Close the loop at the end by echoing the hook.
- Good: "There's a plastic wall inside your phone, thinner than most human hairs. If it fails, your phone can catch fire."
- Weak: "Your phone battery doesn't store electricity." (true, but no stakes, nothing to picture)
- Avoid: "Have you ever wondered how X works?" (no stakes, no picture)
Prefer a real-world payoff (a recall, a record, a famous failure) over trivia, verified against primary sources.

## Hooks that are showable

Good (each has an instant picture):
- "Your phone can't feel your finger. It feels a tiny leak of electricity."
- "This one file let hackers into Hugging Face."
- "A whale just moved four hundred million dollars of Bitcoin. Here's how we saw it first."

Bad (nothing to show):
- "Have you ever wondered how technology works?"
- "Today we're talking about touchscreens."

Patterns: *counter-intuitive claim*, *specific number*, *"this one X"* with X on screen,
*a question the viewer has literally had in their hand*.

## Audience: smart beginners (Edu, 2026-10-27)

Assume the viewer is a smart adult who is new to the topic (on Sonar: just starting to understand crypto; half won't know
what a "fee" or a "block" is). Make it easy without making them feel dumb.
- **Define on first use, in passing.** One quick clause, then move on: "a fee, the small tip you pay to get processed".
  No "basically", no "think of it like you're five", no talking down.
- **One new term per sentence, max.** Jargon stacking ("fee rate", "mempool", "Ethereum", "sandwich" in 15 s) loses people.
- **Cut terms the story doesn't need.** If a detour adds a second chain or a second concept, drop it.
- **Anchor to everyday things** they already know (a queue, a waiting room, a receipt) before naming the crypto word.
- Self-check: read the script as someone who has never bought crypto. Every word they'd have to google gets explained or cut.

## Writing for the ear (and for TTS)

- Short sentences, mostly 6–14 words. One idea per sentence.
- Concrete nouns that you can draw: grid, wire, charge, finger, file, wallet, block.
- Numbers spoken as words, and few of them: one big number beats five small ones.
- Avoid acronyms on first mention, unless the acronym *is* the hook ("HTTPS").
- Read it out loud. If you stumble, the voice will too.
- Use punctuation to steer the TTS: a comma is a short breath, a full stop a longer one, and
  "—" a dramatic pause. Avoid ellipses (they render inconsistently).
- Respell words the voice mispronounces ("Sui" → "Swee", "Solana" is usually fine).

## Show-ability check (do this before handing the script over)

Go sentence by sentence and write, next to each one, what is on screen. If a sentence has
no picture, rewrite it or cut it. This list becomes the storyboard draft.

## Facts

Every claim maps to a line in `research.md` with a URL. Round numbers honestly ("about"),
and never invent precision. If sources disagree, say the safer number.
