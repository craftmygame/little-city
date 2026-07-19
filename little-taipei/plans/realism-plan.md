# Realism plan — make Little Taipei match the real Taipei map

Decided 2026-07-19 (goal session + architecture interview). This file is the
standing brief for all realism work. Start any realism session by pasting the
matching phase prompt from the bottom of this file.

Read `city/taipei.js` first. Its header claims coordinates are real km from
Taipei 101 — **currently true only outside downtown**. The Xinyi core is
pre-inflated ~×2 in the data (e.g. City Hall authored at `[0.08, 1.1]`, really
0.42 km from 101; Main Station `[-4.8, 1.55]` is exact). Phase 2 fixes this.

## Invariants (never trade away)

- **Bearings and adjacency**: if A is NE of B in real Taipei, same in game.
- **Topology**: road crossing order, which roads meet which, which side of a
  river things sit on.
- **Compressed distances are INTENTIONAL.** Absolute rendered distances must
  NOT match the real map — bearings and topology are what "matching" means.
  After Phase 2, ALL inflation/compression lives in the runtime `spread`
  transform; the data itself is true real km.
- **The Renai Rd spawn sightline** (Taipei 101 right, SYS Hall left) is a
  protected gameplay anchor; verify it after any layout change.

## Fidelity zones

- **Zone A (strict)** — the Xinyi–Zhongzheng corridor: real-coordinate
  placement (drift tolerance ~0.15 km), recognition rubric, walk-in interiors.
  Members (13): Taipei 101, City Hall, SYS Hall, Taipei Dome, Grand Hyatt,
  Breeze Nan Shan, Mitsukoshi A11, Taipei Arena, Raohe Night Market,
  CKS Memorial, Presidential Office, Main Station, Longshan Temple.
- **Zone A-lite** — northern cluster: Grand Hotel, Shilin Night Market,
  Palace Museum, Miramar, Bao'an Temple. Recognition rubric only (looks right
  from outside); no interior work this round.
- **Zone B (topology)** — all of Taipei City + across-river districts: full
  arterial grid (~30 roads incl. Shilin/Neihu/Nangang), Tamsui bridges,
  Keelung-river bridges, the three rivers + Dadaocheng confluence, Songshan
  Airport void. Drift tolerance ~0.4 km; no building work.
- **Zone C (backdrop)** — outer ranges (Wulai, Linkou, Sanxia): right
  direction and mass only. The globe's circumference is ~36 map-km; Phase 3
  decides once how the ranges close at the antipode.

## Architecture decisions (interview, 2026-07-19)

1. **Coordinate model: normalize.** Migrate all data to true real km; the
   runtime `spread` transform carries ALL inflation. (Chosen over keeping the
   mixed convention.)
2. **Ground truth: scripted OSM/Overpass fetch.** A dev script queries
   OpenStreetMap for named features and emits `scripts/geo-truth.json`.
   Re-runnable; open-licensed; commit the JSON. No manual coordinate research.
3. **Comparison: vector overlay + browser sessions.** `map-preview.mjs`
   renders game data and OSM reference into one layered SVG (the automated
   backbone); at phase checkpoints, browser sessions capture game vs Google
   Maps screenshots into `plans/checks/<date>/` for feel review.
4. **Interiors: grand ground floors + hero set-piece.** Single-story walkable
   halls scaled to landmark prominence (no general floor system). One hero
   vertical experience: the **Taipei 101 observatory** via elevator-teleport.
5. **Building bar: recognition rubric.** Silhouette + dominant colors + 2–3
   signature features vs photos/Street View. Stylized, not photogrammetry.

## Checkpoints (run these, don't improvise)

- After any layout edit: `npm run check` (drift) + SVG overlay at the three
  framings (basin / city grid / Xinyi core).
- After any building edit: recognition rubric vs photos/Street View.
- At each phase end: browser session (game vs Google Maps screenshots into
  `plans/checks/`) + in-game spawn sightline pass per CLAUDE.md.

## Browser-session checkpoint procedure (Phase 1, decision 3)

Run at every phase end (and after any layout change big enough to doubt):

1. Start the game locally (`npm start`, http://localhost:4173/), press BEGIN.
2. Capture with the Chrome DevTools MCP tools (or manually) into
   `plans/checks/<YYYY-MM-DD>/`:
   - `spawn-sightline.png` — the spawn view on Renai Rd: Taipei 101 must be
     ahead-right, SYS Hall left. This is the protected gameplay anchor.
   - `game-<framing>.png` — fly-camera or zoomed-out shots matching the three
     SVG framings (basin / grid / xinyi) where the phase touched them.
3. Open Google Maps centred on Taipei 101 at a zoom matching the framing
   (~12 for basin, ~14 for grid, ~16 for xinyi core; map AND terrain style
   where relief matters) and screenshot to `maps-<framing>-<style>.png`.
4. Compare side by side: bearings and adjacency must match (the Invariants);
   absolute distances must NOT (compression is intentional). Note verdicts in
   the phase's commit message or this file.
5. SVG overlays from `node scripts/map-preview.mjs --out plans/checks/<date>`
   are the precise backbone; the browser pass is for feel and recognition.

## Overnight run log — 2026-07-19/20 (judgment calls)

- **Phase 4 audit ran early** (during Phase 1's Overpass waits): the 18-landmark
  rubric audit is independent of Phases 1–3, so its agents ran in parallel;
  compiled worklist in `plans/checks/2026-07-19/audit-worklist.md`.
- **Overpass strategy**: per-feature queries hit rate limits and 45 s timeouts;
  switched to 3–4 bulk queries + local matching. Same-named roads in other
  districts (信義路 in Xindian, 中山北路 in Tamsui…) needed per-road bboxes in
  the manifest. `--roads-only` flag refreshes road features alone.
- **Phase 2 spread retune**: exact preservation of today's rendering is
  mathematically impossible — the old map double-booked a ring (the inflated
  window edge rendered at the same radius as already-real Raohe/Arena), so a
  faithful transform would fold the map. Chose a `boost` stage on spreadDist:
  slope 3.61 to 0.55 real km (street window renders at today's scale), dip to
  0.74 through 1.15–1.8 km, rejoining the classic curve at 2.4 km with zero
  net offset — everything beyond 2.4 km renders bit-identically to before.
  Core landmarks shift ≤ ~0.6 km rendered (their old data was individually
  sloppy: City Hall ×2.58, Hyatt ×4.08); declump absorbs footprint overlaps.
- **Xiangshan**: whole Four-Beasts ensemble (mountains, graded sites, trail,
  parks, pond, approach ribbon) translated rigidly onto the true 象山 peak
  (delta [-0.186, +0.808]); tiger-mountain snapped to its own geo-truth peak.
  The pond went to the trailhead flat (real slopes have none).
- **Zone C ranges**: kept compressed distances, normalized bearings to the
  true peaks (Qixingshan is due N, not NE); drift check tests bearing (≤10°)
  for zone C instead of km.
- **Spawn sightline**: real Ren'ai geometry aims the street wedge away from
  101, so a second protected wedge (spawn → 101, half 0.34 km) now keeps
  procedural blocks out of the tower sightline. Verified in-game.
- **Rivers**: adopted OSM centrelines (fixes two real errors: old Tamsui ran
  ~1.7 km too far west, old Keelung entered from the SOUTH-east at y=-1.5
  instead of NE at y=+2). DP-simplification cuts some meander corners —
  Phase 3's overlay pass refines.
- **Shops** inside the old inflated window divided by ~1.9; others untouched.
- Red MRT line now terminates at the real Xiangshan station instead of
  running into the mountain foot.

## Phases

1. Tooling — geo-truth fetch, drift report, SVG preview.
2. Normalize — migrate downtown data to real km; retune runtime spread.
3. Layout — full arterial grid, bridges, airport, antipode.
4. Buildings — rubric audit, interiors, 101 observatory.

Run in order; each phase makes the next verifiable. One session each.

---

## Overnight run prompt — all phases

> Run all phases of plans/realism-plan.md in order (1 Tooling → 2 Normalize →
> 3 Layout → 4 Buildings), using each phase's prompt from that file and
> honoring its Invariants and Zones sections in every phase.
>
> Ground rules for the unattended run:
> - Work autonomously start to finish; never stop to ask. Make judgment calls
>   (spread retune, antipode closure, observatory layout) and document them
>   in plans/realism-plan.md instead of blocking.
> - git commit after each completed phase (local only — never push, never
>   deploy). Each phase's acceptance criteria must pass before its commit.
> - Save all verification evidence — SVG overlays and game-vs-Google-Maps
>   browser screenshots — to plans/checks/<date>/.
> - Phase 4: run the 18-landmark audit as parallel agents; implement fixes
>   and interiors serially, biggest landmarks first (101, CKS, Main Station,
>   Dome), so anything unfinished is minor. Escalate to worktree-parallel
>   implementation only if time is running short, merging one landmark at a
>   time with npm run check after each merge.
> - If a phase fails its acceptance criteria after honest retries, commit
>   what passes, mark the failure clearly, and move on rather than thrash.
> - End with a morning summary: what shipped per phase, every judgment call
>   made, what failed or was skipped, and where the evidence lives.

## Phase 1 prompt — Tooling

> Phase 1 of plans/realism-plan.md (read Invariants + Zones first): build the
> ground-truth tooling. No gameplay or layout changes in this phase.
>
> 1. `scripts/fetch-geo-truth.mjs` (dev-only, network): query the Overpass
>    API for a named feature list — all Zone A/A-lite landmarks, the arterial
>    roads (existing 15 + the full grid target: every district's 2–4 real
>    arterials), the three rivers, and the Tamsui/Keelung bridges. Simplify
>    polylines (e.g. Douglas-Peucker) to ≤8 waypoints per road, ≤10 per
>    river. Project lat/lon → km-from-101 (equirectangular around
>    25.0337 N, 121.5645 E). Emit `scripts/geo-truth.json` with per-feature
>    zone tags. Commit the JSON; the script is for regeneration.
> 2. Extend `scripts/check-city.mjs`: after `validateCity()`, compare city
>    data against geo-truth and print a per-feature drift report (km + ratio
>    toward/away from 101). WARN-ONLY for now — downtown is known-inflated
>    until Phase 2; the report doubles as Phase 2's migration worklist.
>    Include a `--strict` flag (fail beyond Zone A 0.15 km / Zone B 0.4 km)
>    that Phase 2 will turn on by default.
> 3. `scripts/map-preview.mjs`: render city data top-down to SVG — layers for
>    roads, rivers, mountains, parks, landmarks, districts, plus the
>    geo-truth reference in a contrasting color. Three fixed framings (basin
>    ~24 km, city grid ~12 km, Xinyi core ~4 km) × two modes (raw km, and
>    spread-transformed using the exact transform from main.js). No new
>    dependencies.
> 4. Document the browser-session checkpoint procedure in this plan file
>    (game screenshot vs Google Maps at matching zoom/style, saved to
>    `plans/checks/<date>/`).
>
> Acceptance: `npm run check` still passes and prints the drift report; the
> six SVGs render and the raw-km overlay visibly shows the downtown inflation
> mismatch (that's expected, not a bug); the game itself is unchanged.

## Phase 2 prompt — Normalize coordinates

> Phase 2 of plans/realism-plan.md (read Invariants + Zones first): migrate
> all city data to true real km, with rendering unchanged as far as possible.
>
> 1. First read the spread implementation in main.js and write down the
>    current composite transform (data inflation × runtime spread). Don't
>    edit anything until you can predict where a given real-km point renders
>    today.
> 2. Use the Phase 1 drift report to find every inflated feature (landmarks,
>    roads, parks, ponds, gradedSites, metro paths, trails, shops, and the
>    Four Beasts / Xiangshan mountain anchors — the inflation is not limited
>    to the street window). Rewrite their coordinates to geo-truth real km.
> 3. Retune `planet.spread` so post-migration rendered positions match
>    today's as closely as possible — verify by diffing before/after
>    spread-mode SVGs. Small shifts are acceptable; topology changes are not.
> 4. Model-local placement data (`cols`, `foot`, `scale`) is unaffected —
>    only `at:` positions and path coordinates move. Re-check pad fits.
> 5. Flip the drift check to strict-by-default. Fix the header comment in
>    city/taipei.js and the line-120 NOTE; update CLAUDE.md if it describes
>    coordinates.
>
> Acceptance: `npm run check` passes in strict mode; before/after spread-mode
> SVG diff shows no topology change; in-game — spawn sightline intact, walk
> the Xinyi block and the Xiangshan trail start-to-summit. Browser-session
> checkpoint + screenshots into plans/checks/.

## Phase 3 prompt — Layout

> Phase 3 of plans/realism-plan.md (read Invariants + Zones first): make the
> map read correctly from above, city-wide.
>
> 1. Roads: build the full arterial grid from geo-truth — extend the existing
>    15 to their real lengths and add the missing arterials so every district
>    (incl. Shilin, Neihu, Nangang, and the across-river districts) has its
>    2–4 real ones. Keep widths in the current 0.16–0.34 km range by road
>    class.
> 2. Bridges: investigate how roads interact with waterways in main.js, then
>    add the Tamsui crossings (Taipei Bridge, Zhongxiao Bridge) and 1–2
>    Keelung-river crossings (Dazhi, Minquan) — likely a new bridge
>    representation (deck over water). Cross-river districts must visibly
>    connect.
> 3. Songshan Airport: keep procedural blocks off the real footprint and add
>    a simple terminal + runway strip — the runway void is one of the most
>    recognizable features of the real map from above.
> 4. Verify the Dadaocheng river confluence and river shapes against the
>    overlay; adjust waterway paths where the overlay disagrees.
> 5. Antipode: decide and implement how the outer ranges close on the far
>    side of the globe; document the decision in this plan.
>
> Acceptance: strict drift check passes (new roads included in geo-truth);
> overlay at all three framings reads like the real map; browser-session
> checkpoint at city + mid zoom (map and terrain styles); in-game pass over
> the new bridges and one outer district; spawn sightline intact.

## Phase 4 prompt — Buildings

> Phase 4 of plans/realism-plan.md (read Invariants + Zones first): make the
> landmarks recognizable and explorable.
>
> 1. Audit (fan-out): one agent per landmark — 13 Zone A + 5 Zone A-lite —
>    compares the current model against photos/Street View using the rubric
>    (silhouette, dominant colors, 2–3 signature features) and returns
>    pass/fail per criterion with specific gaps. Compile into a worklist,
>    biggest landmarks first.
> 2. Fix rubric failures: Zone A-lite gets exterior fixes only; Zone A gets
>    exterior fixes plus interiors.
> 3. Interiors (Zone A): grand single-story walkable halls scaled to real
>    prominence — 101's mall atrium, CKS's memorial chamber, Main Station's
>    concourse, the Dome's ballpark, etc. Visual-only mezzanines are fine.
>    Follow CLAUDE.md placement rules: cols trace walls only, doorways open,
>    floors thin near y=0, pad sized to footprint; verify far corners.
> 4. Hero set-piece: the Taipei 101 observatory. Elevator door in the atrium
>    → fade → teleport to a walkable observatory deck pad high on the tower
>    (collider ring + glass, the tiny-planet panorama below) → elevator back
>    down. One-off machinery in main.js; do not generalize it.
>
> Acceptance: every audited landmark passes the rubric; every Zone A landmark
> is enterable in-game; observatory round-trip works; `npm run check` strict
> passes; browser-session checkpoint comparing 3–4 hero buildings against
> Street View photos; deploy-verify per CLAUDE.md.
