# Phase 4 landmark audit — compiled worklist (2026-07-19 overnight run)

## presidential-office

1. Silhouette — PASS  2. Colors — PASS
3. Signature — PARTIAL — missing vertical white pilaster stripes on wings (only horizontal bands)
4. Interior — FAIL — center col {x:0,z:0,r:2.1} sits ON the doorway (door at z=1.755 < r); three overlapping circles block the whole facade

Fixes: thin vertical stone pilaster boxes between arch windows; rework cols like city-hall (wing circles at x≈±3.4 + portico jamb piers, x≈0 open).

## longshan-temple

1. Silhouette — PASS  2. Colors — PASS minor (tile duller than real liuli glaze)
3. Signature — PARTIAL — swallowtail OK; dragon columns abstract/olive; waterfall wall + pond weak; no ridge dragons
4. Interior — FAIL — three hall-centered circles overlap into one solid disk; front doorway 0.43 inside blocking circle

Fixes: perimeter/pier cols per hall with doorway gaps (SYS-hall pattern) opening front hall + incense courtyard; waterfall relief + pond depth; optional ridge dragon pair.

One section per landmark, pasted from the parallel audit agents. Implementation
order: biggest first — 101, CKS, Main Station, Dome, then the rest.

## taipei-101

1. Silhouette — FAIL — 8 tiers all reuse fixed radii (no overall taper base→crown); no ruyi corner ornaments (plain frustums)
2. Dominant colors — PASS (podium stone too dark-grey `#5C656A`→cream; gold rings should be accent-only)
3. Signature features — FAIL — coin medallions present (good); no tuned-mass-damper sphere/observatory band; podium flat roof, not angular glass canopy
4. Interior — PASS baseline (open portal, walkable lobby, core collider) but a small room, not a grand mall atrium

Fixes (agent provided drop-in snippets, see audit output): per-tier shrink 0.965; 4 gold ruyi brackets per tier; observatory band + gold damper sphere near crown; shallow glass pyramid mall roof; podium stone `#B7B0A0`.
Interior atrium: raise ceiling ~4.1→7-8 with skylight, mezzanine ledge ring, escalator boxes, shopfront kiosks along walls.

## city-hall

1. Silhouette — PASS (taper more pronounced than real, minor)
2. Colors — FAIL — towers read blue-glass; real is white/light-grey precast with punched window bands (ratio inverted)
3. Signature — FAIL — no rooftop antenna, no red 臺北市政府 signage, central void only opens above y≈2.2
4. Interior — PASS

Fixes: swap frame/glass dominance; mast+sphere antenna (101 idiom); red sign plate (A11 idiom landmarks.js:927); widen central void (atrium 2.6→~2.0).

## sun-yat-sen-hall

1. Silhouette — PASS  2. Colors — PASS
3. Signature — FAIL — colonnade only on front porch; real has wraparound peristyle
4. Interior — PASS (statue chamber done well)

Fixes: extend columns to side + rear faces (CKS buildPalaceHall loop idiom, landmarks.js:158-167).

## main-station

1. Silhouette — PASS (caveat: cone apex pokes through ridge cap; roof reads pointier than the real low hip roof)
2. Dominant colors — FAIL — walls are orange-brown `#9C5B43`, should be cream/beige stone; roof is GREEN `#2F7D5B`, should be terracotta/red-brown
3. Signature features — FAIL — no 臺北車站 signage, arch entrance on +Z only (needs all 4 faces), no clock, no checkered floor
4. Interior — FAIL — placement uses solid `ar: 3.5`, not enterable

Fixes: roof `#B5482E`/ridge `#7A2E1F`; walls `#E8E0CB`; mirror arch to all faces; clock on front; canvas signage (xiangshanPanelTexture technique); fix cone/ridge artifact.
Interior: replace `ar` with wall-tracing `cols` + door gaps on 4 faces, thin checkerboard floor slab near y=0, re-check pad/claim.

## taipei-arena

1. Silhouette — FAIL — saucer dome on drum; real is flat-topped rounded box + ice-rink annex
2. Colors — PASS
3. Signature features — FAIL 1/3 — no corner LED screen mass, no annex
4. Interior — FAIL — solid `ar: 4.0`, not enterable

Fixes: flatten dome; curved LED mass off-center near entrance; low annex volume; cols ring with +Z gap + simple hall (copy buildCivicComplex atrium pattern ~landmarks.js:951-963).

## raohe-night-market

1. Silhouette — PASS  2. Colors — PASS (reweight sign[] warmer/red)
3. Signature features — PASS 2/3 (optional pepper-bun hero stall)
4. Walkability — PASS (lane IS the interior; no work needed)

## shilin-night-market

1. Silhouette — FAIL — identical to Raohe; real Shilin is a sprawling grid + red-brick main food-court building, no paifang gates
2. Colors — generic PASS; missing red-brick signature
3. Signature features — FAIL 0/3 — gates are a Raohe feature miscast here; Ciyou Temple clone geographically wrong
4. Walkability — PASS mechanism (A-lite: no interior required)

Fix path (agent-recommended): split into two thin wrappers — `_buildMarketCore(CTX, opts)` + `buildRaoheMarket` (today's defaults) + `buildShilinMarket` ({no gates, red-brick hall, 2 lanes, no temple}); update builder names in city/taipei.js; zero main.js changes.

## grand-hotel (A-lite)

1. Silhouette — FAIL — reads as a low pavilion; real is a 14-story vertical slab
2. Colors — PASS  3. Signature features — PARTIAL (roof + columns good; no stacked floors)

Fixes: central block ~2.6→4.5-5.0 tall; 3× repeated floor bands (string-course + window rows); raise wings proportionally.

## palace-museum (A-lite)

1. Silhouette — PASS  2. Colors — PASS  3. Signature features — PASS
Minor: second window row; third terrace step.

## miramar-ferris-wheel (A-lite)

1. Silhouette — PASS
2. Colors — FAIL — rim + spokes solid red/rainbow; real frame is white/steel
3. Signature — PARTIAL (colorful cabins lost against rainbow frame)

Fixes: rimMat → white/steel toon; spokes → steelMat; keep rainbow only on cabin stripes. (landmarks.js:1002, 1039)

## baoan-temple (A-lite)

1. Silhouette — PASS  2. Colors — PARTIAL (all columns red; front pair should be grey stone)
3. Signature — FAIL on dragon columns (plain cylinders)

Fixes: front two columns grey-stone + thicker; spiral bump coil suggestion (jiannian pattern); optional third rear hall.

## cks-memorial

1. Silhouette — FAIL — gate + blue octagonal double roof read correctly, but the hall sits on a flat slab: the monumental tiered white platform + twin 89-step stairway is absent (steps are flat pavers all at y=0.04)
2. Dominant colors — PASS
3. Signature features — FAIL — axial plaza OK; missing: rising twin stairway, gate inscription plaque, bronze CKS statue (chamber has only a glow panel)
4. Interior — PASS structurally (walls traced, doorway open) but empty shell

Fixes: 2 stacked terraces under hall (non-collidable); ramp step y with t + split twin flights; gold plaque box on gate lintel; bronze seated statue (box+sph, `#8C7853`) on dais; re-check pad after widening.

## grand-hyatt

1. Silhouette — PASS weak (no set-backs; three same-depth boxes)
2. Colors — PASS
3. Signature features — FAIL 1.5/3 — porte-cochère OK; low glass lobby wing reads opaque
4. Interior — PASS (door genuinely open)

Fixes: tier set-backs; glaze the lobby front band.

## breeze-nanshan

1. Silhouette — FAIL — near-uniform cylinder; real tower tapers/twists continuously
2. Colors — PARTIAL (teal → cooler silver-blue)
3. Signature features — FAIL 0/3 — no taper, no vertical fins (bands are horizontal), no podium roof garden
4. Interior — PASS

Fixes: stacked shrinking segments for taper; 6-8 thin vertical fin boxes; green roof-garden blobs on podium at y=1.38; cool the glass tone.

## mitsukoshi-a11

1. Silhouette — PASS  2. Colors — PASS
3. Signature features — PARTIAL — LED billboard flush mid-wall; real A11 screen wraps the chamfered corner
4. Interior — PASS

Fixes: move/enlarge LED onto an angled corner face.

## taipei-dome

1. Silhouette — FAIL — real complex has 23-story hotel + office towers attached that dominate the skyline; model has none. Plan is a pure circle, real is rounded-rectangular.
2. Dominant colors — PASS (minor: bronze fascia + cream bands should trend darker glass)
3. Signature features — PASS (gap: no forecourt plaza at the entrance slit)
4. Interior — PASS — walkable ballpark exists and matches cols. Gaps: no foul lines, no outfield fence, entrance dumps into stands.

Fixes: add glazed hotel+office tower slabs beside the dome (biggest win); rounded-rect podium; darken fascia; entrance forecourt.
Interior: chalk foul lines, low outfield wall, short concourse at entrance.
