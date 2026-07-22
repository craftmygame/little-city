# Camera prototype plan — optional exploration controls

Decided 2026-07-20. This is a **stylistic alternative demonstration apparatus**
for in-game comparison. It must not present the existing locked-follow camera
as defective, replace it by default, or create a parallel gameplay system.

## Purpose

Let the project’s developer and play-testers compare the existing authored
third-person street shot with two exploration-oriented alternatives in the
same city, using the same player, movement speed, collisions, quest flow,
camera occlusion handling, and zoom/map behaviour.

The question is not “which control scheme is objectively correct?” It is:

> Does independent looking improve exploration enough to justify reducing the
> deliberately composed, runner-led camera feel?

## Baseline — preserve exactly

The current mode is the control condition and remains the default:

- `WASD`/arrows move and turn the player using character-relative controls.
- The street camera follows a smoothed player heading, with fixed low pitch.
- Camera collision/shoulder avoidance chooses a clear trailing angle.
- Wheel transitions between street and map views.

Current implementation owner: `main.js`, in the `CAMERA FOLLOW` and `INPUT`
sections. Do not introduce a second camera or input subsystem.

## Prototype modes

### Locked follow (`locked`)

The unchanged baseline above. It is the default for ordinary play and is always
available as the immediate comparison point.

### Pitch-look follow (`pitch-look`)

- Pointer drag / right-side touch drag changes camera pitch only; horizontal
  drag remains visually inert.
- The camera stays behind the runner’s heading, retaining the original
  blinkered, tank-led street composition.
- Pitch stays bounded to prevent disorienting under-ground or vertical views.
- Existing occlusion pull-in and shoulder avoidance remain active.

This is the deliberately conservative “lukewarm” comparison: it opens the
vertical horizon and pairs with map zoom without freeing the camera sideways.

### Free-look follow (`freelook`)

- Pointer drag / right-side touch drag changes camera yaw and pitch.
- Movement remains character-relative, so this is a minimal camera-only
  variation.
- Yaw remains open while pitch stays bounded to prevent disorienting
  under-ground or vertical views.
- The camera retains existing occlusion pull-in and shoulder avoidance.
- Do not forcibly snap the player’s heading to the camera. If recentring is
  tested, make it gentle, delayed, and explicitly documented.

This is the broader camera-only alternative: it answers whether free
observation is valuable while preserving the authored movement feel.

### Yaw-look follow (`yaw-look`)

- Pointer drag / right-side touch drag changes camera yaw only.
- The runner remains the camera’s leading direction and retains the original
  fixed street pitch.
- This is the horizontal counterpart to `pitch-look`: a small, natural peek
  around corners without changing the vertical composition.

### Less free-look follow (`less-freelook`)

- Pointer/right-side touch drag changes both yaw and pitch while preserving
  tank movement.
- Drag sensitivity is two-thirds of `freelook` on both axes.
- Yaw is limited to ±0.85 radians (about ±49°), and the street pitch range is
  one-third smaller than `freelook`.
- It is intended to retain most of the useful curiosity of free-look while
  keeping the authored, runner-led framing nearby.

## Access and presentation

- Start with a shareable query parameter, e.g. `?camera=locked`,
  `?camera=pitch-look`, `?camera=yaw-look`, `?camera=less-freelook`, or
  `?camera=freelook`.
- Invalid/missing values resolve to `locked`.
- Add a small, unobtrusive in-game mode label or toggle only if it materially
  improves play-testing. It must clearly mark non-default modes as prototypes.
- Update help text so it matches the active mode. The present desktop “drag
  the screen” claim is inaccurate: drag only distinguishes click from drag.
- Keep `window.__cam` and `window.__camMode` useful for visual checks.

## Touch requirements

- Left-side floating joystick remains movement.
- Right-side drag becomes look only in the pitch-look, yaw-look,
  less-freelook, and free-look modes.
- Buttons, HUD controls, click/tap-to-interact, emotes, and menu interactions
  must retain their current priority.
- Locked mode retains current touch behaviour unless a clearly labelled
  play-test choice requires otherwise.

## Implementation sequence

1. Document/control-select the camera mode in existing `main.js` state.
2. Refactor only enough shared math to make the current locked mode explicit
   and behaviourally unchanged.
3. Implement `pitch-look` with bounded pitch and existing camera collision
   path; preserve click-versus-drag interaction.
4. Implement `yaw-look` with tank movement and the same camera collision path.
5. Implement `less-freelook` with reduced yaw/pitch bounds and sensitivity.
6. Implement `freelook` with full yaw, bounded pitch, and the same tank movement.
7. Adapt touch routing and active-mode help copy.
8. Add short tester instructions and record findings/recommendation in the PR
   or this document’s decision log.

## Acceptance checks

- `npm run check` passes.
- `?camera=locked` reproduces the current street and map camera behaviour.
- Pointer/touch look does not trigger accidental interactions after a drag.
- Click/tap interaction still works without a drag.
- Street camera avoids/pulls in around buildings in all modes.
- No camera can pitch below the local ground or become unstable near the
  tiny-planet antipode, water, hills, or observatory mode.
- Player collisions, water boundary, jump, animation, quest pickup/delivery,
  remote player rendering, and map zoom still work.
- Test each mode at spawn, a dense street/landmark edge, an open vista, and on
  a touch-sized viewport.

## Evaluation prompts

- Does free-looking make landmarks and route choices easier to read?
- Does it weaken the city’s deliberate street-level composition?
- Does pitch-only looking preserve more of the authored street composition
  while still helping players read the skyline and terrain?
- Does yaw-only looking provide enough corner-peeking without loosening the
  composed vertical perspective?
- Does less free-look retain the benefits of free-look while feeling closer to
  the authored locked shot?
- Does independent camera motion cause disorientation, occlusion churn, or
  interaction mistakes?
- Which mode feels best on mouse/keyboard? Which on touch?

## Non-goals

- No change to city layout, character art, quest design, physics, or network
  protocol solely to support the prototype.
- No replacement of the locked mode without an explicit developer decision.
- No new generic controls framework or duplicate camera implementation.

## Build record

Implemented 2026-07-20 in the existing `main.js` player, camera, pointer, and
touch paths. There is no second renderer, camera, or movement system.

### Try it

- Baseline: `/?camera=locked` (also the fallback for no/invalid `camera` value).
- Conservative variation: `/?camera=pitch-look`.
- Horizontal counterpart: `/?camera=yaw-look`.
- Restrained two-axis variation: `/?camera=less-freelook`.
- Camera-only variation: `/?camera=freelook`.
- While running, `window.__cameraControls()` reports the active mode and
  `window.__cameraControls('freelook')` (or either other mode) switches it for
  quick developer checks. `window.__cam` and `window.__camMode` remain the
  existing framing/zoom helpers.
- Add `?camera-preview` to any of those URLs to show the in-world **Camera rig ·
  dev** strip. Its three buttons deliberately present the original comparison
  set — Locked, Pitch, Free restrained, and Free — and update the `camera` URL
  parameter without reloading. The strip is opt-in so normal play and any
  future settings design remain untouched.

Non-default modes show a small “Camera prototype” label. `pitch-look` accepts
only vertical drag; `yaw-look` accepts only horizontal drag; `less-freelook`
uses a slower, capped yaw/pitch orbit; and `freelook` accepts the existing
full-yaw, bounded-pitch orbit. A short click/tap still interacts. On touch, the existing
left-side joystick remains responsible for the original tank movement and the
unoccupied right side drives the active camera articulation.

### Validation completed

- `npm run check` passed: city-definition validation and JavaScript syntax.
- Headless Chrome confirmed the live UI and mode resolution for locked,
  `pitch-look`, `yaw-look`, `less-freelook`, and `freelook`.

### Play-test decision — 2026-07-20

Initial play-testing found `camera-relative` movement disorienting: sideways
camera-relative travel felt detached from the runner’s planted tank movement.
It has therefore been removed rather than retained as a third option.
`freelook` was preferred because it keeps tank movement while allowing a
pleasant, bounded look around the tiny planet. The newly added `pitch-look`
mode is the intentionally more faithful intermediate comparison. `yaw-look`
and `less-freelook` were added as further warm comparisons after that test:
the former isolates around-the-corner peeking, while the latter reduces
free-look sensitivity and range by roughly one-third.

### Play-test results — 2026-07-20

The experiment succeeded: independent camera articulation can expand
exploration without disturbing the tiny planet’s deliberate, runner-led feel.

| Mode | Observed result |
| --- | --- |
| `locked` | Strong authored baseline: planted, intentional, and composition-led. |
| `pitch-look` | Pleasant vertical articulation and horizon reading. Map zoom already supplies some pitch freedom, so its incremental value is modest. |
| `yaw-look` | The lightest-touch alternative with the clearest effect: clean corner-peeking while preserving the original fixed street pitch and tank movement. Potentially the most faithful enhancement. |
| `less-freelook` | Gently communicates that more camera freedom is available, but remains slow, deliberate, and close to the original operating feel. |
| `freelook` | The fullest feeling of exploration. Its outer edge can become slightly playful/comedic, but the bounds prevent geometric instability or loss of control. |
| _retired: `camera-relative`_ | Disorienting; horizontal travel felt detached from the runner and undermined the planted tank movement. Not retained. |

No single style is declared the replacement. The rig makes the trade-off
legible: `yaw-look` is the smallest faithful enhancement, while `freelook`
offers the strongest exploratory benefit. `less-freelook` is the useful middle
comparison between them.

### Draft pull request

**Title:** Add optional camera-look prototype rig for play-testing

**Summary**

This adds a set of optional, shareable camera-control prototypes without
changing the default locked-follow camera or the game’s character-relative
tank movement. The goal is to let play-testers compare how much independent
looking improves exploration against the existing authored street-level feel.

**What changed**

- Kept `?camera=locked` as the default and control condition.
- Added `?camera=pitch-look` for vertical-only camera articulation.
- Added `?camera=yaw-look` for horizontal corner-peeking only.
- Added `?camera=less-freelook` for a slower, capped two-axis orbit.
- Added `?camera=freelook` for the full two-axis camera-only comparison.
- Kept collision pull-in, shoulder avoidance, map zoom, click/tap interaction,
  touch joystick movement, quests, and multiplayer on their existing paths.
- Updated help copy and added a small prototype label for non-default modes.

**Play-test findings**

- Camera-relative movement was tried and removed: it weakened the deliberate,
  planted tank-control feeling.
- Yaw-only is the smallest and arguably most faithful change; it makes looking
  around corners feel natural while preserving the original composition.
- Restrained and full free-look both feel viable. The restrained version stays
  more deliberate; full free-look provides the greatest exploration freedom.

**Review / follow-up questions**

1. Which prototype, if any, should be promoted beyond a play-test URL?
2. Should the chosen alternative remain opt-in, or be exposed through a small
   in-game setting after further testing on touch devices?
3. Does `yaw-look` provide enough value to be the minimal enhancement, or is
   the additional visibility of `freelook` worth its looser framing?

**Validation**

- `npm run check` passes.
- Headless Chrome confirmed each mode’s query parsing and mode-specific help.
- Manual play-testing covered the intended comparative feel across the camera
  variants. Further touch and dense-street collision testing remains useful
  before any mode becomes a product default.

### Manual play-test remaining

Play-test the acceptance locations and interactions above before selecting a
preferred style; this implementation deliberately makes no recommendation yet.
