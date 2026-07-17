# Paris content-module API (`ctx`)

You are building ONE ES-module file under `paris/` that adds a piece of Paris to a
cel-shaded Three.js "tiny planet" (a sphere of radius **24 units**). The engine lives in
`paris.html`; it calls your module's `build(ctx)` once at startup with the shared `ctx`
object documented here. **Only edit your assigned file. Export `build(ctx)`.**

```js
import * as THREE from 'three';        // resolved by the page's importmap — always available
export function build(ctx){ /* add your stuff to ctx.planetGroup */ }
```

## Coordinates & scale
- Everything in Paris is authored in **metres east/north of Notre-Dame** (`e`,`n`).
  `e<0` = west, `n<0` = south. Get a sphere direction with `ctx.parisToDir(e,n)` or, for a
  named place, `ctx.landmarkDir('eiffel')`. The full table is `ctx.LANDMARKS` (each `{e,n,name}`).
- **The map now wraps the WHOLE globe.** Notre-Dame is the front pole; the outer edge of
  greater Paris (`ctx.geo.D_POLE` ≈ 6600 m) maps to the antipode (back pole). So arc-angle
  from the front = `metres × K` where `K = π / 6600`. Reference arcs: Eiffel ≈ 112°, Arc ≈ 127°,
  Sacré-Cœur ≈ 103°, the two Bois ≈ 151°, Stade de France ≈ 172°, La Défense ≈ 179° (the very
  back). Outer/greater-Paris landmark keys: `perelachaise, bercy, placeitalie, montsouris,
  butteschaumont, citeu, boisboulogne, boisvincennes, ladefense, stadedefrance`.
- Horizontal scale: real metres are compressed ~80×. **Do NOT scale building heights by that.**
  Use these **target heights in planet units** so the skyline reads as a cute toy Paris
  (player avatar ≈ 1.6 units tall):
  | thing | height (units) |
  |---|---|
  | Eiffel Tower | **10–11** (the hero — tallest object on the planet) |
  | Tour Montparnasse | 7 |
  | Notre-Dame towers | 4.5 ; spire ~5.5 |
  | Sacré-Cœur (domes on its hill) | 4–5 |
  | Arc de Triomphe | 3 |
  | Panthéon / Invalides / Opéra domes | 3.5–4.5 |
  | Haussmann apartment block | 3–4 (6–7 "floors") |
  | café / kiosk / Métro entrance | 0.6–1.6 |
- Footprints are also compressed: keep landmark footprints roughly **2–6 units** wide so they
  sit on the planet without overlapping neighbours. Think "model village", not 1:1.

## Placement helpers
- `ctx.placeOnSurface(obj, dir, extra=0, spin=0)` — sit `obj` on the ground at `dir`, oriented so
  local **+Y points up** (away from planet centre). `spin` rotates around up. Build your model
  with its **base at y=0, +Y up, centred at origin**.
- `ctx.placeFacing(obj, dir, faceDir, extra=0)` — same, but orient local **+Z toward `faceDir`**
  (a world unit-vector). Use to aim things: e.g. face the Arc down the Champs with
  `faceDir = ctx.landmarkDir('concorde')`. Build your model with **+Z = front**.
- `ctx.groundR(dir)` → radius of the ground at `dir` (units). `ctx.terrain(dir)` → height offset.
- `ctx.geo.frameAt(dir)` → `{up,east,north}` orthonormal tangent basis at `dir` (for laying things
  along a direction, e.g. a row of trees or a bridge across the river).

## Materials & meshes (match the cel-shaded look)
- `ctx.toon(color, opts={})` → `MeshToonMaterial` (color = hex `0xrrggbb` or `'#rrggbb'`).
  Glowing windows/lamps: `ctx.toon('#fff0c4',{emissive:'#ffcf7a',emissiveIntensity:0.9})`.
- `ctx.faceted(geometry)` → returns the geometry as non-indexed with per-face normals (the
  low-poly flat-shaded look). Wrap primitive geometries with it.
- Set `mesh.castShadow = true; mesh.receiveShadow = true;` on solid meshes.
- Group your meshes in a `THREE.Group`, position with the helpers, then `ctx.planetGroup.add(group)`.
- Optional perf: `const merged = ctx.bakeMerge(group)` bakes a positioned group into a few
  merged meshes (one per material). Pattern: build local → `placeOnSurface(group,dir)` →
  `merged = ctx.bakeMerge(group)` → add `merged` (not the original). Worth it for repeated
  detailed buildings; not needed for a single hero landmark.

## Collisions & spacing
- `ctx.addCollider(dir, worldRadius)` — the player slides around this obstacle (worldRadius in units).
  Add one per solid landmark/building so you can't walk through it.
- `ctx.claim(dir, worldRadius)` — reserve ground so other modules' scatter avoids it.
- `ctx.freeSpot(dir, worldRadius)` → bool, is this spot clear of claimed things.

## Geography masks (so you place things in the right kind of place)
`ctx.geo` re-exports: `LANDMARKS`, `parisToDir`, `dirToParis(dir)→{e,n}`, `frameAt`,
`isPark(e,n)`, `roadMask(e,n)→0..1`, `seineDist2D(e,n)→metres`, `onIsland(e,n)`, `SEINE_PTS`
(densified centreline `[[e,n],…]`), `AVENUES` (`[{angle}]`, the 12 rays from the Arc),
`PARK_LIST`, `terrainParis`, `groundColor`, `R`, `K`, `CENTER`, `eastAxis`, `northAxis`.
- Keep buildings OFF the river: skip a spot if `seineDist2D(e,n) < 170 && !onIsland(e,n)`.
- Keep buildings OFF the avenues: skip if `roadMask(e,n) > 0.5`.
- Keep buildings OUT of parks: skip if `isPark(e,n)` (parks get trees/lawns, not blocks).

## RNG
`ctx.rng()` (0..1), `ctx.rand(a,b)`, `ctx.randi(a,b)`, `ctx.pick(arr)` — seeded & shared.
Fine to use freely.

## Don't
- Don't start/stop the render loop, touch the camera, or edit other modules.
- Don't import from a CDN or add `<script>` tags. `import * as THREE from 'three'` only.
- Don't block: `build(ctx)` runs synchronously at load. No `await`, no fetch.
