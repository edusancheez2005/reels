# Character models (Actor3D)

Rigged VRM characters with faces, used by the `Actor3D` scene.

| File | Character | Source | Licence |
|---|---|---|---|
| `Bizdude.vrm` | the suit guy | 100Avatars R2 by Polygonal Mind | CC0 |
| `StonksReporter.vrm` | Stonks | 100Avatars R3 by Polygonal Mind | CC0 |

Both files state `licenseName: CC0` and `commercialUssageName: Allow` in their VRM metadata. They were downloaded on
17 Nov 2026 from the links in the Open Source Avatars registry (https://github.com/toxsam/open-source-avatars,
`data/avatars/100avatars-r2.json` and `-r3.json`), which lists about 300 more CC0 characters in the same format.

To add a character: put its `.vrm` here, add its head height and radius to `MODELS` in `src/three/Actor3D.tsx`
(render a still and adjust until the hands land on the head in the `panic` pose), and add a row above.
