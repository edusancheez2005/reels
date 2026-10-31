# Storyboard spec

`episodes/<slug>/storyboard.json` says *what* is on screen and *on which word* it happens.
`build_timeline.py` turns it into frames and checks the pacing.

```json
{
  "slug": "whale-wakes",
  "theme": "dark",
  "tail": 0.9,
  "emphasis": ["fee?", "Sixty cents.", "Not one coin"],
  "scenes": [
    {"anchor": "The fee", "component": "Shot", "theme": "light", "transition": "zoom",
     "props": {"src": "mempool-fee.png", "url": "mempool.space/tx/…", "cam": [{"x": 0.5, "y": 0.6, "zoom": 1.15}, {"x": 0.42, "y": 0.7, "zoom": 1.9}],
               "marks": [{"beat": 1, "kind": "box", "x": 352, "y": 430, "w": 74, "h": 40}], "source": "mempool.space"},
     "beats": ["fee", "Sixty"]}
  ]
}
```

## Top-level fields

| Field | Meaning |
|---|---|
| `theme` | Default scene theme, `"dark"` or `"light"`. |
| `tail` | Seconds held after the last word (default 0.5). ~0.9 gives the ending room. |
| `emphasis` | Phrases whose caption words get the selection box (all occurrences). Consecutive words share one box. |
| `captionStyle` | `"kinetic"` (in-frame phrase at the top), `"pill"` (small dark pill near the bottom, words light up as spoken, emphasis in the accent colour: the breakdown look), `"band"` (v1 bottom captions) or `"none"`. `captionY` moves the pill (default 1330). |
| `header` | `{"title", "date"}`: fixed line at the top of every frame, e.g. `{"title": "THE $6.3B BINANCE HACK", "date": "29 OCT 2026"}`. |
| `chapters` | `[{"anchor", "label"}]`, 4–6 one-word labels: the chapter bar under the header, with a dot that travels as the story goes (Edu, 30 Oct 2026, after watcher.guru's Binance reel). Not a "timeline" in the Ruler sense. |
| `defs` | Shared props, used by a scene with `"props": {"$use": "<key>", ...overrides}`. One Iso3D world defined once, used by several scenes. |

## Scene fields

| Field | Meaning |
|---|---|
| `anchor` | Word/phrase where the scene starts (see Anchors). |
| `component` | One of the components below. |
| `props` | The component's props. Asset paths (`src`, `logo`) are file names in `episodes/<slug>/assets/`. |
| `beats` | Anchors for the component's beats, in spoken order. |
| `theme` | `"dark"` / `"light"` for this scene. Alternate in runs of 1–3. |
| `transition` | Entrance: `pop` (default), `whip` (blurred horizontal whip; also whips the previous scene out), `zoom` (zoom-through), `rise`, `cut`. |
| `moving` | `true` if the component animates continuously (particles, counters, scans, maps). Counts as motion for the pacing check. |
| `long` | `true` to allow a continuous camera shot longer than 4 s (warning instead of error). |

## Anchors

| Form | Meaning |
|---|---|
| `"tiny charge"` | First match of this phrase *after the previous anchor* (case- and punctuation-insensitive). |
| `{"anchor": "one", "occurrence": 2}` | 2nd match after the previous anchor. |
| `{"anchor": "charge", "at": "end"}` | Land at the end of the phrase. |
| `{"word": 37}` | Word index from `print_words.py`. Only when a phrase is ambiguous. |

Scene anchors move forward; a scene's beats are matched from its own anchor and must fall before
the next scene starts. **Item `i` of a component appears on beat `i`**; extra items cascade 6 frames
apart. Order items in the order they're spoken.

## Components

Everything sits on a 1000×900 stage drawn under the caption band (canvas y ≈ 430–1410).
Coordinates below are stage coordinates unless noted. All v2 components are theme-aware.

### Evidence
**Shot**: a real screenshot in a browser frame that tilts in. The camera moves to `cam[i]` on beat i
(`x`,`y` = focus as 0–1 of the image, `zoom` ≥ 1). `marks` draw on their beat, in the **image's own pixels**:
`box` (Figma-style selection), `underline` (marker stroke), `circle` (hand-drawn ring), `spot` (dim everything else).
`src`, `url`, `chrome` ("browser"|"card"|"none"), `width` (default 920), `maxHeight`, `cam[]`, `marks[]`, `source`, `tilt`.
`url` is the page's real address, a true prefix of it, or the bare domain. Never tidy the slug to match a new headline
(30 Oct 2026: a typed Al Jazeera slug that didn't exist failed the review; sites often keep the old slug after a headline update).
`size` is filled in automatically.

**Quote**: a paraphrased claim card with attribution (use instead of faking an article).
`source`, `text`, `mark` (substring to highlight on beat 1), `stamp` (e.g. a year, beat 2).

### Numbers
**BigNumber**: a counter. Beats: [start count (+logo, chip), land, label]; with one beat it lands on it.
`value`, `prefix`, `suffix`, `decimals`, `logo`, `chip`, `label`, `tone` (accent|good|alert|text).

**Growth**: bars that grow per beat, plus a multiplier badge on the next beat. `items[{label, value, display}]`, `badge`.

**Ruler**: a timeline ruler. Edu, 29 Oct 2026: "there's always some sort of timeline": don't use it by default. Show dates on the
object itself (a stamp on the document, a tag on the 3D scene) and keep Ruler for reels where the span of years *is* the point. The playhead glides to `marks[i]` on beat i, and the `span` bracket appears on the next beat.
`from`, `to` (decimal years), `marks[{at, label, sub}]`, `span{a, b, label}`.

**Checklist**: a title/counter, then rows on beats, then all badges stamp on the following beat.
`title`, `counter{to, suffix}`, `rows[{left, right, badge, tone}]`, `note`.

**PriceLine**: an illustrative jittery line. Label on beat 0, struck through on the last beat. `label`, `strike`.

### Mechanism and illustration
**ParticleShape**: ~1,000 glowing dots assemble into a shape on beat 0, a label lands on beat 1,
and they optionally `split` into clusters at targets on the last beat. `shape` ("whale" | "fish" | "circle" | any SVG path d),
`label`, `sublabel`, `count`, `tone`, `formed` (start assembled), `split[{x, y, label}]`.

**Flow**: nodes (with real `logo` files or `icon` emoji) and arrows. Reveal order via `order`; an entry can
be an array to reveal several together. `nodes[{id, label, sub, x, y, logo, icon, tone, size, badge, cross}]`,
`edges[{from, to, label, dashed, flow, tone}]`, `order`.

**RouteMap**: a real world map (Natural Earth) with animated routes, a ship riding the line, pins and a camera.
`legs[{route: "uk-cn" | "cn-uk" | [[lon,lat]…], beat, dur, ship, label, color}]`, `pins[{name, lon, lat, beat, hide, side}]`,
`cam[{beat, lon, lat, zoom}]` (a cam on beat 0 is the opening shot), `bbox`.

**Mempool**: an isometric 3D pool of pending transactions. `mode: "fill"` (rain in, label, highlighted tx drops in)
or `"scan"` (beam reads every tile, counter). `label`, `highlight`, `reader`.

**TxWall**: a scrolling wall of transactions; flashes on middle beats; the highlighted tx slides in on the last beat.

**Phone**: a lockscreen; one notification slides in per beat (newest on top). `time`, `date`, `notifs[{app, title, body, icon, iconBg}]`.
Use generic app names, never a real company's alert.

**SeaScene**: a trawler on a moving sea; the net hauls a cod up on beat 0, a location pill on beat 1. `place`.

**ColdChain**: beats [catch, frozen, packed, shipped]. The fish lands on a blast-freezer tray; frost crystals
grow while the digital readout drops to `temp` and mist rises; it's packed into a carton (flaps fold,
tape runs, FROZEN stamp); the cartons load into a refrigerated container whose doors swing shut and lock.
`label` (pill, e.g. "Refrigerated container"), `temp`.

**Filleting**: beats [arrive, thaw, cut, peel]. A close-up on the board: the frozen fish lands; ice melts into
droplets and a puddle; gloved hands cut behind the head, then saw along the spine (scale flecks);
the fillet peels off, flips to the flesh side and lands on a tray, leaving the skeleton.

**PinBones**: tweezers pull pin bones from the flesh side of the fillet, evenly between the first and last beat. `count`, `label`.

**Scale** (left pan, right pan, tip; the side with more coins drops), **Souvenir** (fish & chips + passport stamps per beat),
**Quote** (above). Drawings live in `src/lib/illustrations.tsx` (Cod, Trawler, CargoShip, Container, Worker, FishChips)
and `src/lib/fishArt.tsx` (detailed cod: skin side, flesh side, skeleton, head, frost growth, nitrile gloves, fillet knife).
Add your own there, and build scenes as staged sequences: each beat should trigger a visible physical change.

**BatteryCell**: a cutaway of a rechargeable cell — layered graphite (left), metal-oxide lattice (right), liquid, a dashed separator wall,
10 Li⁺ ions and an optional outer wire with a `phone` or `plug`. `actions[i]` fire on beat i: `left|right|liquid|wall|ions` (reveal; hide them first via `hide`),
`wire|phone|plug`, `charge`/`discharge` (ions cross; electrons run the wire), `split` (highlighted ion drops its electron), `block` (electron bounces off the wall),
`home` (dashed arrow + `homeLabel`), `cycle` (rocks back and forth), `meter` (charge %), `label:<n>`, `cam` (no-op, a beat for `cam[]`).
Props: `ions` (left|right) or `ionStart` 0–1, `dur`, `cam[{beat, x, y, zoom}]` (beat -1 = opening shot), `labels[{text,x,y,tone}]`, `leftLabel`, `rightLabel`, `highlight`.
ParticleShape also has a built-in `battery` shape.

### 3D (default look since 2026-10-26 — Edu wants realistic, detailed visuals like the Keyframes reels)
Real-time Three.js scenes (`src/three/`, via `@remotion/three` + react-three-fiber + drei + postprocessing).
Each one is a full-bleed canvas under the caption with a Lightformer studio rig (no HDRI download), bloom, subtle
chromatic aberration, film grain and vignette, a beat-driven camera (`cam[{beat, pos, look, fov, dur}]`, beat -1 =
opening shot, plus slow push-in + handheld drift), `tags[{text, x, y, to, tone, size}]` (2D labels in 1080×1920 px,
shown by `label:<n>` actions; `to` draws a leader line) and an optional `caption` (e.g. "Magnified illustration").
All four take `actions[i]` fired on beat i, like BatteryCell.

**Phone3D**: a generic unbranded smartphone built in layers (hollow titanium frame, front glass + lock screen with a
battery widget, mid-frame, foil battery pouch with label, logic board + shield can, camera modules, back glass with
camera bump). `spin` (rotY → spinTo), `open` (back glass lifts away), `explode` (layers separate in depth), `wall`
(battery seam glows), `path` (electrons run battery → board), `screen` (wakes; pct → pctTo), `cable` (USB-C plugs in),
`heat` (pouch swells + glows, smoke + embers; `heat0` to start hot). Props: `rotY`, `rotX`, `opened`, `exploded`,
`screenOn`, `wall`, `pct`, `pctTo`, `back` (back-glass colour). Front view rotY≈0.3; back view rotY≈2.7.

**Cell3D**: magnified Li-ion cross-section: copper foil | graphite sheets (hex texture) | electrolyte | porous separator
| metal-oxide lattice (instanced) | aluminium foil; 18 glowing Li⁺ ions; gold outer wire with electrons. `build`,
`wire`, `charge`/`discharge` (`dur`), `restless`, `split` (atom drops its electron), `block` (electron bounces off the
separator, red ring), `pass` (ion slips through a pore), `pierce` (metal burr through the separator), `short`
(electrons pour through the hole), `heat`, `focusL`/`focusR`/`focusWall`/`focusNone` (latest wins). Props: `ions`
(anode|cathode), `ionStart`, `wire`, `hole`, `heat0`. Default camera frames the whole cell; the highlighted ion sits
at about (-1.63, -0.2, 0) for close-ups.

**Hair3D**: a human hair (cuticle scales) above a separator film, to scale (`hair`, `film` in µm). `hair`, `film`.

**Swarm3D**: rows×rows phones (default 36² = 1,296) dropping onto a plane under fog, with an optional logo card,
`title`, a counter (`value`, `suffix`) that lands on the `count` beat, and `sub`. Fly the camera up with `cam`.

Rendering: WebGL needs `Config.setChromiumOpenGlRenderer('swangle')` (set in remotion.config.ts). It is software
rendering: about 2–3 s per 1080×1920 frame on 2 cores, so a 33 s reel takes about 40–50 min. QA with
`python3 tools/qa_frames.py episodes/<id>` (one still per scene, ~4 min) instead of the full draft video.
Text on canvases uses the system Inter; tags are SVG overlays, so there are no font downloads at render time.

**Pool3D**: a mempool — a glass basin of ~160 glowing transaction cubes coloured by fee rate (deep blue = low, cyan, amber = high),
for any "pending transactions / block building / bots watching" beat. Actions: `fill` (cubes rain in), `count` (counter `value`
lands, with `sub`; `\n` breaks lines), `send` (your white outlined cube flies in), `sort` (cubes lift by fee: a fee terrain),
`block` (top `blockSize` cubes fly up and pack into a new block), `chain` (new block links to the chain), `wait` (your cube pulses
amber), `bump` (your fee jumps: turns amber and lifts), `bots` (violet watcher drones with reading beams; read cubes flash),
`scan` (a violet scan plane sweeps the pool), `big` (gold "big trade" cube drops into the front lane), `sandA`/`sandB` (bot cubes
slide in before/after it), `copy` (violet clone grows out of the big trade), `jump` (clone moves ahead), `label:<n>`, `cam`.
State props for later scenes: `you`, `chain`, `packed`, `sorted`, `botsOn`, `bigOn`, `cloneOn`. Bots are violet on purpose:
red/green are reserved for down/up moves on Sonar.

**Vault3D**: a gunmetal safe with a thick glass door (coins stay visible), a pile of gold coins and a gold key, for private-key /
self-custody / lost-coins beats. Actions: `build`, `key` (key floats in), `turn` (key into the lock, door swings open), `move`
(a few coins fly out), `lose` (key pulls out, tumbles away, breaks into sparks; door shuts), `lock` (frost + ice-blue ring),
`scan` (light sweep: anyone can see them), `try` (door rattles, keyhole flashes amber), `drain` (with `opened: true`: a stream of coins pours
out of the door for the rest of the scene, the pile empties and a red alarm beacon pulses: a hack draining an exchange's hot wallet), `label:<n>`, `cam`. State props:
`opened`, `keyGone`, `frozen`; `plate` (text on the top plate), `coins`, `scale` (0.62). Frame it with look y ≈ -0.5, camera z ≈ 8–9.
**Drive3D**: a generic unbranded encrypted USB drive with 10 attempt lights. Actions: `drive`, `ten` (lights on), `lockout`
(ghost padlock), `used` (first `used` lights turn amber), `left` (remaining pulse), `label:<n>`, `cam`. Camera z ≈ 15–17.
**Coin3D** also has `lost` (frost sweeps over `lost` coins' worth of stacks, counter switches to the lost amount, `lostText`)
and `filled: true` (stacks start full, no `stack` beat). Keep `sub` matched to the number it sits under.

**Character3D**: a stylised "designer toy" person (big round head, hoodie, mitten hands) as the stand-in for a real person in
a story (Edu, 29 Oct 2026: "the guy's a character"). Never a likeness; put "3D stand-in" in the name card's `note` once.
Arms are two-bone IK, so poses are hand targets. Actions: `enter` (walks in from the left, turns to camera), `wave`, `card`
(name card from `card: {name, role, note, y}`, keep y ≤ 1350), `type` (at the laptop; with `desk: true`), `coins` (coins pop
from the laptop onto a pile; `count` = the beat the pile and `counter: {to, suffix, x, y, size}` finish), `hacked` (with `desk: true`: the laptop glows red and pulses, a compromised machine), `hold` (a drive in
both hands), `two` (a drive in each hand), `facepalm`, `shrug`, `look` (+ `look: "left"|"right"|"down"`), `idle`, `label:<n>`,
`cam`. Props: `pose` (start pose), `x`, `turn`, `colours: {top, legs, skin, hair}`. Portrait framing: standing full figure
cam ≈ `{pos: [0, 0.85, 8.8], look: [0, 0.15, 0], fov: 30}`; at the desk ≈ `{pos: [2.7, 1.15, 10], look: [0.45, -0.1, 0.6]}`.
**Drives3D**: two generic 2.5-inch laptop hard drives in an open wooden desk drawer with clutter. Actions: `drawer` (slides
out), `glow` (drive A amber), `pick` (drive A flies out), `swap` (shell game ×3), `stick` (hand-written sticker on A: `sticker`),
`key` (gold key rises from A), `label:<n>`, `cam`. A tag with `at: "a"|"b"` points at that drive (`dy` = height above it,
~290). `solo: true` = one drive on a dark pedestal (cam ≈ `{pos: [0, 1.75, 4.9], look: [0, -0.15, 0], fov: 32}`).
Drawer cam ≈ `{pos: [0, 6.6, 3.0], look: [0, 0, 0.1], fov: 34}` (top-down: the drawer is wider than portrait allows).
**Landfill3D** (rebuilt 29 Oct): a mound covered in instanced lumpy bin bags, boxes, tyres, cans and planks, with the 2.5-inch
LaptopDrive. Actions as before (`drive`, `drop`, `bury`, `ping`, `scan`, `fence`, `deny`, `own`, `key`).
Faster QA: `node stills.mjs <outDir> <frame> <frame> ...` in reel-studio renders many stills from one bundle (qa_frames uses it).

**Iso3D** (30 Oct 2026, the breakdown look): one clean isometric world on a dark slab, an orthographic camera that glides between its
parts, and sentence-case label pills with leader lines. Build the story's mechanism as places in one world (the vault, the laptop, the
system, the check, the key, the coins) and let consecutive Iso3D scenes move the camera through it: they read as one continuous shot.
Define the world once in `defs` and `$use` it; carry state forward with `state` (`alert`, `good`, `frozen`, `links`, `moved`).
Props: `world {w, d}` (default 12 × 7), `objects [{id, kind, at: [x, z], size, tone, icon, text, rot}]` with kind `server | block |
doc | key | vault | laptop | coins | pawn | pad | wall`, tone `alert | good | accent | ice | warm | muted`, block screen `icon`
`check | key | warn | lock | cross | coin | eye | sign`; `hidden [ids]`; `links [{id, from, to, style: dashed | beam, tone}]`;
`movers [{id, kind: doc | coin, path: [ids or [x, z]], dur}]`; `labels [{text, at, side: left | right | up, dx, dy, tone}]` (pills
are kept on screen automatically); `cam [{beat, target: [x, y, z], zoom, dur}]` (zoom ≈ 65 for the whole slab, 110–130 close).
Actions: `show:<id>`, `hide:<id>`, `alert:<id>` (turns red), `good:<id>` (green), `freeze:<id>` (ice), `pulse:<id>`, `link:<id>`
(draws a dashed line or a glowing beam), `move:<id>` (a document or coin travels its path), `label:<n>`, `cam`.
Colour means something: red = the attacker or what went wrong, green = what looked legitimate or what's safe, warm = money moving.
Pawns are abstract people (no faces): label them ("engineer", "3D stand-in" is not needed for a pawn).
Added 31 Oct 2026 (bitcoin-one-dollar): `off:<id>` / `state.off` (a machine switched off: lights out, body dark; e.g. miners
quitting one per word), block icons `bolt | clock | puzzle`, and `tags` (big kit tags in 1080×1920 px, shown by `tag:<n>`) so the
hook number can sit over the world on beat 0.

**Title**: big kinetic text, one line per beat. Use sparingly. `lines`, `accent`, `size`.

### v1 (dark-only cards, still available)
Stat, Steps, Compare, Terminal, Window, Diagram, Chart, Image.

## Adding a component
Create it in `src/scenes/`, register it in `src/scenes/index.ts`, take `({props, beats, durationInFrames})`,
read colours from `usePal()`, and drive reveals from `useReveal(beats, i)` / `revealFrame(beats, i)`.
Keep it in the template so later episodes can reuse it.

**Seed3D** (Wallet3D.tsx, 30 Oct 2026): a cream recovery-phrase card (12 numbered example BIP-39 words, "example words · not a
real wallet") on a walnut desk, a generic unbranded hardware wallet, an optional wall of 2,048 word tiles. Actions: `card`,
`write`, `glow`, `key` (gold key rises from the card), `wall`, `pick` (12 tiles fly onto the card), `device`, `restore`
(screen → "Wallet restored"), `copy` (the words lift off and fly away red), `two` (a second copy slides out), `label:<n>`, `cam`.
Props: `words`, `title`, `device`, `blank`, `wordsLit`. Whole card + device: cam ≈ `{pos: [0.47, 7.6, 7.2], look: [0.47, 0, 0.3], fov: 34}`.
**Letter3D**: a generic scam letter (IMPORTANT NOTICE, grey text, QR code, red box, hologram seal; no brand) in an envelope, and
a phone with a fake "Verify your wallet" page. Actions: `arrive`, `open`, `qr`, `deadline` (red stamp), `site`, `type`, `steal`,
`label:<n>`, `cam`. Props: `deadline` + `deadlineLabel` (only what the real letter said: a reviewer failed an invented
"IN 7 DAYS"), `opened`, `phone`. Always `caption: "Recreation"`. Tags over light objects: add `"pill": true` (dark backing; any 3D tag).
Character3D also takes `item: "letter"` (with `hold`) to hold a sheet of paper instead of a drive.
