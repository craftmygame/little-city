# Live character customizer — design

**Date:** 2026-07-21
**Branch:** `feat/live-character-customizer` (off `hairstyle-preview-pr`)
**Status:** design approved, spec under review

## Problem

The `hairstyle-preview-pr` branch added three mohawk styles to the shared
`HAIRSTYLES` pool (`character.js:24`). Because a player's whole look is derived
deterministically from their display name (`appearanceFromName`, `main.js:2905`)
with a uniform pick over the pool, two things fell out of that:

1. **Vibe drift.** Mohawks now auto-assign to ~43% of players and NPCs (3 of 7
   styles, uniform), which reads off-tone for the city crowd.
2. **No agency.** There is no way for a player to change their look — it is
   whatever their name hashes to. The only explicit picker is the dev-only
   `hairstyle-preview.html`, which never ships.

We want the city to read on-vibe by default *and* let players change their own
character, with the change visible to everyone in the room.

## Goals

- A player can change their character's **hairstyle, hair colour, shirt colour,
  and accessory** (the "identity essentials") from within the game.
- Editing is **live and in-place**: a compact side panel, no screen switch; every
  change restyles the player's real on-screen avatar instantly (WYSIWYG).
- When the panel opens, the **camera smoothly eases to face the character** and
  slowly orbits so the player can see the look from good angles; it eases back on
  close.
- A customized look is **visible to all other players** in the room.
- The **auto-assigned crowd stays on-vibe**: mohawks become rare in the default
  pool (target ~12%), while remaining fully choosable in the picker.

## Non-goals (YAGNI)

- Editing skin, pants, or the raglan/headphones toggles — auto from name.
- **Persistence** — the custom look lasts the session and resets on refresh. No
  `localStorage`.
- A physical wardrobe/mirror location in the city — a HUD button is enough.
- A second 3D preview scene — we restyle the real avatar instead.

## Design

### 1. Appearance model — base + overrides

Keep `appearanceFromName(name)` as the **base** look. Layer a small **overrides**
object holding only the four editable fields:

```
overrides = { hairStyle, hair, shirt, accessory }   // any subset, or empty
finalAppearance = { ...appearanceFromName(name), ...overrides }
```

If the player never opens the panel, `overrides` is empty and the look is exactly
the name-derived one today — fully backward compatible.

The panel initializes its controls from the current resolved appearance, so the
first edit "pins" all four editable fields at once (they become explicit
overrides). This keeps the model trivial: once customizing, all four editable
fields are present in `overrides`.

### 2. Compact broadcast code

Broadcast overrides as **one short string** in the existing state tick — a new
`a:` field alongside `n:myName` in `netSend` (`main.js:3135`) — **not** the full
9-field appearance object.

Encoding — indices into the canonical palettes/lists, dot-joined:

```
a = [ hairStyleIdx, hairIdx, shirtIdx, accIdx ].join('.')     // e.g. "4.2.7.5"
```

- `hairStyleIdx` → `HAIRSTYLES` (the distinct 7)
- `hairIdx`      → `HAIRC`
- `shirtIdx`     → `SHIRTS`
- `accIdx`       → `ACCESSORY_CHOICES = ['boba','easycard','tanghulu','bear','scooterHelmet', null]`

Absent/empty `a` → no overrides → remote falls back to pure name-derivation
(exactly today's behaviour). Old or uncustomized clients interoperate for free.

`resolveAppearance(name, code)`:
1. `base = appearanceFromName(name)`
2. if `code`: parse four indices, set `base.hairStyle/hair/shirt/accessory`.
3. Apply the helmet rule (see Edge cases) and return `base`.

*Alternative considered & rejected:* send the full resolved appearance object
every tick — simpler decode, but ~9 fields riding ~20×/s forever and it discards
the elegant name-derivation for the non-editable fields.

### 3. Auto-pool curation (rare mohawks)

Introduce a **weighted bag** used only for *auto* assignment; the picker keeps the
distinct list.

```
// character.js
export const HAIRSTYLES = ['fluffy','wavy','bob','short',
                           'mohawk-classic','mohawk-radial-five','mohawk-radial-extended']; // picker: distinct
// classics weight 5, each mohawk weight 1  → mohawks ≈ 3/23 ≈ 13%
export const AUTO_HAIRSTYLES = [ ...5×each classic..., ...1×each mohawk... ];
```

- `makeCharacter` default (NPCs + un-customized): `pk(AUTO_HAIRSTYLES)` instead of
  `pk(HAIRSTYLES)` (`character.js:85`) — rng index into the weighted bag.
- `appearanceFromName`: `from(AUTO_HAIRSTYLES, 'hs')` instead of
  `from(HAIRSTYLES, 'hs')` (`main.js:2911`) — deterministic hash index into the
  same weighted bag.

Both auto paths get rare mohawks from one shared bag; the picker always passes an
explicit `hairStyle`, so it is unaffected and still offers all 7. (Note: this
re-shuffles existing name→hairstyle mappings, which is fine — no persistence, and
we are re-curating intentionally.)

### 4. UI — side button + non-blocking panel

- A small **HUD button** (e.g. 🎨) pinned to one screen edge, always visible
  during play. Toggles the panel.
- The **panel is a compact, non-blocking side card** (like `hairstyle-preview.html`'s
  floating `#panel`), *not* a full-screen overlay like the intro. The city and the
  avatar stay visible beside it.
- Controls: **hairstyle** (7, labelled via the preview's `STYLE_LABELS`),
  **hair-colour** swatches (`HAIRC`), **shirt-colour** swatches (`SHIRTS`),
  **accessory** chooser (boba / easycard / tanghulu / bear / scooter-helmet /
  none).
- Each change → update `overrides` → `setLocalAppearance(finalAppearance)`
  (rebuilds the real avatar in place) → re-encode `a` → next tick broadcasts it.
- Markup in `index.html`; styling reuses existing overlay/card tokens in
  `styles.css`.

### 5. Camera behaviour while customizing

- On open: ease the camera to **face the avatar's front** (entrance +Z side) at a
  comfortable close distance, then slowly orbit yaw so all sides are seen. Reuse
  the existing `camYaw` / `camPitch` / distance with an eased interpolation.
- While the panel is open, **suspend player movement input** so the framing stays
  stable (WASD won't walk the avatar off-frame).
- On close: ease back to the gameplay street camera and resume movement.

### 6. Networking — remote live-rebuild

`onPlayerState` (`main.js:2950`) builds a remote once in `ensureRemote` and never
restyles it. Add: track each remote's last `a` code; when it changes, dispose the
old avatar mesh and rebuild from `resolveAppearance(name, a)`. This is the one
genuine netcode addition. `ensureRemote` also reads `state.a` for the initial
build so a player who is already customized is rendered correctly on join.

## Edge cases

- **Helmet vs. headgear.** If the resolved accessory is `scooterHelmet`, force
  `cap=false` and `headphones=false` (mirrors `appearanceFromName`'s existing
  logic) so there's no double headgear. Applied inside `resolveAppearance` / the
  local build.
- **Accessory = none.** `accIdx` maps to `null` → no accessory attached.
- **Malformed `a`.** If the code doesn't parse to four valid indices, ignore it
  and fall back to pure name-derivation (defensive; never throw in the net path).
- **Self-echo.** `onPlayerState` already returns early for self
  (`isSelfPlayer`), so the local avatar is only ever built from local overrides,
  not the broadcast.

## Files touched

- `character.js` — `AUTO_HAIRSTYLES` weighted bag; weighted default pick in
  `makeCharacter`.
- `main.js` — overrides state + encode/decode/`resolveAppearance`; panel wiring
  and live-apply; camera framing + movement suspend; broadcast `a` in `netSend`;
  remote rebuild on `a` change in `onPlayerState`/`ensureRemote`;
  `appearanceFromName` uses `AUTO_HAIRSTYLES`.
- `index.html` — HUD button + panel markup.
- `styles.css` — button + panel styles (reuse existing tokens).

No new runtime module → **no `deploy-antics.mjs` change** (nothing to add to the
`FILES` manifest).

## Testing / verification

- `npm run check` — city data + syntax checks still pass.
- Manual (single client): open game → click HUD button → panel opens, camera eases
  to face the avatar and orbits → change hairstyle / hair / shirt / accessory →
  avatar restyles live in place → close → camera eases back, movement resumes.
- Manual (two clients / two browser tabs in the same room): customize on client A →
  confirm client B rebuilds A's avatar with the new look within a tick; change
  again → confirm live update; confirm a fresh joiner sees A already customized.
- Crowd check: NPCs and un-customized players now only occasionally show a mohawk
  (~1 in 8), not ~4 in 9.
- Refresh check: after refresh, the look resets to name-derived (no persistence),
  as intended.
