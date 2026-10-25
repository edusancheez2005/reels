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
| `captionStyle` | `"kinetic"` (default, in-frame phrase at the top), `"band"` (v1 bottom captions) or `"none"`. |

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
`size` is filled in automatically.

**Quote**: a paraphrased claim card with attribution (use instead of faking an article).
`source`, `text`, `mark` (substring to highlight on beat 1), `stamp` (e.g. a year, beat 2).

### Numbers
**BigNumber**: a counter. Beats: [start count (+logo, chip), land, label]; with one beat it lands on it.
`value`, `prefix`, `suffix`, `decimals`, `logo`, `chip`, `label`, `tone` (accent|good|alert|text).

**Growth**: bars that grow per beat, plus a multiplier badge on the next beat. `items[{label, value, display}]`, `badge`.

**Ruler**: a timeline ruler. The playhead glides to `marks[i]` on beat i, and the `span` bracket appears on the next beat.
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

**Title**: big kinetic text, one line per beat. Use sparingly. `lines`, `accent`, `size`.

### v1 (dark-only cards, still available)
Stat, Steps, Compare, Terminal, Window, Diagram, Chart, Image.

## Adding a component
Create it in `src/scenes/`, register it in `src/scenes/index.ts`, take `({props, beats, durationInFrames})`,
read colours from `usePal()`, and drive reveals from `useReveal(beats, i)` / `revealFrame(beats, i)`.
Keep it in the template so later episodes can reuse it.
