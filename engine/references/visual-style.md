# Visual style

Default look is "clean tech explainer": dark background, one accent colour, real-looking
interfaces and diagrams, a big bold caption that lights up word by word. Change it in
`brand.json`. The *timing rules* below are not style. They apply to every look.

## Canvas

- 1080×1920, 30 fps, H.264, AAC.
- **Safe zone:** keep everything important inside y 220–1500. The platform covers the bottom
  ~420 px (username, description) and a column of buttons on the right (x > 970) from about
  y 1100 down. That's why captions stop at x 970 and nothing important sits in the
  bottom-right corner of the visual stage.
- Visual stage: y 260–1180. Caption band: centred around y ≈ 1330.

## Timing rules (the sync)

1. **Audio is the clock.** Every scene start and every beat is a word anchor, resolved to a
   frame by `build_timeline.py`.
2. **Land on the word.** An entrance animation *starts* 2 frames (~65 ms) before the anchor word,
   so the motion onset is perceived on the word. Viewers notice sound arriving before the
   picture much more than the reverse, so visuals lead slightly and never trail. The
   template's `LEAD_FRAMES` handles this, so don't add your own offsets.
3. **Scene length 1.5–3.5 s**, hard max 4 s. The hook scene can be shorter.
4. **No dead air on screen:** a beat (something appearing, highlighting, counting or
   moving) at least every ~0.8 s.
5. **Cuts on sentence starts**, beats on key nouns and numbers. Never cut mid-word.
6. **Last frame:** hold the payoff visual for ~0.5 s after the last word, then end. No outro card.

## Motion vocabulary

Quick but not frantic. Most entrances take 6–10 frames (0.2–0.33 s).
- **Pop**: scale 0.6 → 1.0 with a spring (damping ~12). For icons, numbers and nodes.
- **Slide-up**: 40 px up + fade, 8 frames. For text lines and list items.
- **Draw**: SVG line or path stroke from 0 → 100%, 10–15 frames. For arrows, connections and wires.
- **Count**: numbers tick up over 12–20 frames, ending on the anchor word.
- **Highlight**: an accent underline or box sweeps in on the key word inside UI text.
- **Push-in**: a slow 1.00 → 1.06 scale across a whole scene keeps static shots alive.
- **Scene transition**: a hard cut by default, with a 4-frame slide or fade only between sections.
  Fancy transitions read as template-y.

Avoid: spinning, bouncing loops, particle confetti, whoosh on every cut, and more than two
things animating at once.

## Captions (kinetic, in-frame)

- A short phrase (≤5 words, never across a sentence break) sits above the visual, centred at y ≈ 250.
- Words appear as they're spoken. Earlier words dim to grey, and the current word is bright and semibold.
- **Emphasis phrases** (storyboard `emphasis`) get a Figma-style selection box (blue outline, two corner
  handles) that grows word by word. Use it on 1 phrase per page at most, and 10–20 per reel.
- The caption is exactly the spoken text. Display formatting (e.g. "$377M") goes in the visual.
- `captionStyle: "band"` switches back to v1 bottom captions (big, word-highlighted).

## Light / dark rhythm

Alternate runs of 1–3 light scenes (`#ECECEE`, dot grid) and dark scenes (`#09090B`, faint grid).
Evidence screenshots usually read best on light, and particles, glows and 3D on dark. The change of
background is itself a beat, so put it on a sentence start.

## Transitions

`whip` (horizontal motion blur; the outgoing scene whips out too) between sections, `zoom`
(zoom-through) into a detail or a number, `pop` within a section, `rise` for phones and cards, and
`cut` when the same visual continues.

## Honesty in the frame

- Screenshots carry a small "Source: …" line. Paraphrased claims use the `Quote` card with attribution.
- Illustrative data (a jittery price line, a sample notification) must not look like a specific real record.
- Logos come from Simple Icons or a press kit, never redrawn.

## Typography & colour

- One typeface family for UI and captions (Inter by default), plus a mono for code/terminal (JetBrains Mono).
- Background `#0B0D12`, panels `#151923`, lines `#2A3142`, text `#E8ECF4`, muted `#8A93A6`,
  and one accent (default `#4F8CFF`). A second "alert" colour (`#FF5C5C`) is for danger or wrong only.
- At most ~8 words of non-caption text on screen at once. Labels, not paragraphs.

## What makes it look "real"

- Recreate interfaces (browser windows, terminals, phone screens, dashboards, charts)
  with real-looking content: plausible numbers, real field names, monospace hashes.
- Diagrams use the subject's real parts (grid of electrodes, mempool → block → chain), not
  generic shapes.
- Screenshots or logos of a product being explained are fine as evidence on screen, but
  are not decoration. Images live in `episodes/<slug>/assets/`.
