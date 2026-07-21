# Live Character Customizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-game, non-blocking side panel that lets a player live-restyle their character's hairstyle, hair colour, shirt colour, and accessory, visible to everyone in the room; and make the auto-assigned crowd's mohawks rare.

**Architecture:** Keep the name-derived look (`appearanceFromName`) as the base and layer a tiny `{hairStyle,hair,shirt,accessory}` overrides object on top, serialized to a compact `a:` code broadcast in the existing state tick. A HUD button toggles a side panel whose clicks call `setLocalAppearance` on the real avatar; the camera eases to a slow turntable while it's open. Remotes rebuild their mesh when a peer's `a` code changes. A shared weighted `AUTO_HAIRSTYLES` bag drives auto-assignment so mohawks stay rare while the picker still offers all seven.

**Tech Stack:** Vanilla ES modules, Three.js 0.184 (import-map CDN), Antics multiplayer SDK. No build step; served static. No test framework — validation is `npm run check` (city-data + `node --check` syntax) plus manual in-game verification.

## Global Constraints

- **Author flat / tiny-planet rules** unchanged — this feature touches only appearance + UI + camera, no city data or landmark geometry.
- **Runtime files only ship if listed in `deploy-antics.mjs`'s `FILES` array.** This plan adds **no new module** (all code lands in existing `character.js`, `main.js`, `index.html`, `styles.css`), so `deploy-antics.mjs` is **not** modified.
- **Multiplayer determinism:** a peer's look must be reproducible on every client from data they broadcast — here, their name plus the `a` code. Never rely on local-only state for a look others must see.
- **Editable fields are exactly four:** `hairStyle`, `hair` (colour), `shirt` (colour), `accessory`. Skin, pants, cap, raglan, headphones stay auto from the name.
- **No persistence** — custom look lasts the session; a refresh resets to name-derived. No `localStorage`.
- **Palettes/lists are the canonical index space** for the code: `HAIRSTYLES`, `HAIRC`, `SHIRTS`, and `ACCESSORY_CHOICES` (defined in Task 2). Indices in the `a` code refer to these.
- Run `npm run check` from `little-taipei/` after every code change (per CLAUDE.md).

---

### Task 1: Rare-mohawk auto-pool (`AUTO_HAIRSTYLES`)

Make auto-assignment (NPCs + un-customized players) pick mohawks rarely, without touching the picker's seven distinct styles.

**Files:**
- Modify: `little-taipei/character.js` (near line 24; and the default pick at line 85)
- Modify: `little-taipei/main.js` (import line ~8–9; `appearanceFromName` at line 2911)

**Interfaces:**
- Produces: `export const AUTO_HAIRSTYLES` — a weighted array of style strings (classics ×5, each mohawk ×1). Consumed by `makeCharacter`'s default pick and by `appearanceFromName`.

- [ ] **Step 1: Add the weighted bag in `character.js`**

Immediately after the `HAIRSTYLES` line (`character.js:24`), add:

```js
// Auto-assignment pool (NPCs + name-derived players). Classics are weighted
// heavily so the street crowd reads on-vibe; the three mohawks stay rare
// (~3/23 ≈ 13%) but remain fully choosable via the customizer's HAIRSTYLES list.
export const AUTO_HAIRSTYLES = [
  ...Array(5).fill('fluffy'), ...Array(5).fill('wavy'),
  ...Array(5).fill('bob'),    ...Array(5).fill('short'),
  'mohawk-classic', 'mohawk-radial-five', 'mohawk-radial-extended',
];
```

- [ ] **Step 2: Use it for the default pick in `makeCharacter`**

In `character.js:85`, change the fallback pool from `HAIRSTYLES` to `AUTO_HAIRSTYLES`:

```js
const hairStyle = (typeof opt.hairStyle==='string') ? opt.hairStyle : pk(AUTO_HAIRSTYLES);
```

- [ ] **Step 3: Import and use it in `appearanceFromName`**

In `main.js`, extend the character import (lines ~8–9) to include `AUTO_HAIRSTYLES`:

```js
import { makeCharacter, createCharacterAnimator, MOTION,
         SKIN, HAIRC, SHIRTS, PANTSC, CAPS, HAIRSTYLES, AUTO_HAIRSTYLES } from './character.js';
```

Then in `appearanceFromName` (`main.js:2911`), change the hairstyle source from `HAIRSTYLES` to `AUTO_HAIRSTYLES`:

```js
  return { skin:from(SKIN,'sk'), hair:from(HAIRC,'ha'), hairStyle:from(AUTO_HAIRSTYLES,'hs'),
```

(Leave every other field in that object untouched.)

- [ ] **Step 4: Validate**

Run: `cd little-taipei && npm run check`
Expected: `City definition valid` + `drift check passed.` (no syntax errors from either changed file).

- [ ] **Step 5: Manual in-game check**

Run: `npm start`, open http://localhost:4173/, press BEGIN, and scan the street crowd/NPCs. Expected: mohawks are now occasional (roughly 1 in 8), not ~half.

- [ ] **Step 6: Commit**

```bash
git add little-taipei/character.js little-taipei/main.js
git commit -m "Rare-mohawk auto-pool: weighted AUTO_HAIRSTYLES for auto-assignment"
```

---

### Task 2: Appearance overrides model — encode / decode / resolve

Add the data layer: the four-field override, its compact code, and a resolver. No UI, no networking yet. Wire it into BEGIN so the local avatar is built through the resolver (look is unchanged).

**Files:**
- Modify: `little-taipei/main.js` (add helpers near `appearanceFromName`, ~line 2917; edit BEGIN handler at line 3157–3158)

**Interfaces:**
- Produces:
  - `const ACCESSORY_CHOICES` = `['boba','easycard','tanghulu','bear','scooterHelmet', null]`
  - `encodeAppearanceCode(ov) -> string` — dot-joined indices `"hs.hc.sh.ac"`
  - `decodeAppearanceCode(code) -> {hairStyle,hair,shirt,accessory} | null`
  - `resolveAppearance(name, code) -> appearanceObject` (base from name + overrides + helmet rule)
  - Module-level `myOverrides` (`{hairStyle,hair,shirt,accessory}`) and `myAppearanceCode` (string), set at BEGIN.
- Consumes: `appearanceFromName` (existing), `HAIRSTYLES`, `HAIRC`, `SHIRTS` (imported).

- [ ] **Step 1: Add the choices list, codec, and resolver**

Directly after `appearanceFromName`'s closing brace (`main.js:2917`), add:

```js
// The customizer's accessory choices (distinct, plus an explicit "none").
// Index space for the broadcast code's 4th field.
const ACCESSORY_CHOICES = ['boba','easycard','tanghulu','bear','scooterHelmet', null];

// Compact broadcast code for the four editable fields: dot-joined palette indices.
function encodeAppearanceCode(ov){
  const hs = Math.max(0, HAIRSTYLES.indexOf(ov.hairStyle));
  const hc = Math.max(0, HAIRC.indexOf(ov.hair));
  const sh = Math.max(0, SHIRTS.indexOf(ov.shirt));
  let ac = ACCESSORY_CHOICES.indexOf(ov.accessory ?? null); if(ac < 0) ac = ACCESSORY_CHOICES.length - 1;
  return [hs, hc, sh, ac].join('.');
}
function decodeAppearanceCode(code){
  if(typeof code !== 'string') return null;
  const p = code.split('.').map(n => parseInt(n, 10));
  if(p.length !== 4 || p.some(n => !Number.isFinite(n))) return null;
  return { hairStyle:HAIRSTYLES[p[0]], hair:HAIRC[p[1]], shirt:SHIRTS[p[2]], accessory:ACCESSORY_CHOICES[p[3]] };
}
// Full appearance for a peer/self: name-derived base with the editable fields overridden.
function resolveAppearance(name, code){
  const base = appearanceFromName(name);
  const ov = decodeAppearanceCode(code);
  if(ov){
    if(ov.hairStyle) base.hairStyle = ov.hairStyle;
    if(ov.hair)      base.hair      = ov.hair;
    if(ov.shirt)     base.shirt     = ov.shirt;
    base.accessory = ov.accessory || null;
    if(base.accessory === 'scooterHelmet'){ base.cap = false; base.headphones = false; } // no double headgear
  }
  return base;
}
```

- [ ] **Step 2: Declare the session-local override state**

Next to the existing `let myAppearance=null;` block (`main.js:2116`), add:

```js
let myOverrides=null;           // {hairStyle,hair,shirt,accessory} — the four editable fields
let myAppearanceCode='';        // encoded broadcast code for myOverrides
```

- [ ] **Step 3: Build the local avatar through the resolver at BEGIN**

Replace the single line `main.js:3158`:

```js
  setLocalAppearance(appearanceFromName(myName));   // create the final avatar before revealing the street
```

with:

```js
  const base0 = appearanceFromName(myName);         // name-derived starting look
  myOverrides = { hairStyle:base0.hairStyle, hair:base0.hair, shirt:base0.shirt, accessory:base0.accessory };
  myAppearanceCode = encodeAppearanceCode(myOverrides);
  setLocalAppearance(resolveAppearance(myName, myAppearanceCode));   // identical to base0, now driven by the codec
```

- [ ] **Step 4: Validate**

Run: `cd little-taipei && npm run check`
Expected: passes, no syntax errors.

- [ ] **Step 5: Manual in-game check**

Run `npm start`, BEGIN, and confirm the player avatar looks exactly as it did before this task (the resolver with name-derived overrides must reproduce the base look). In DevTools console, `__game` is exposed; there's no assertion needed — just a visual sanity check that the avatar renders normally.

- [ ] **Step 6: Commit**

```bash
git add little-taipei/main.js
git commit -m "Appearance overrides model: ACCESSORY_CHOICES, encode/decode/resolve, BEGIN wiring"
```

---

### Task 3: HUD button + non-blocking side panel + live local apply

Add the 🎨 button and a floating side panel that restyles the real on-screen avatar on every click. Single-client visible result.

**Files:**
- Modify: `little-taipei/index.html` (add a topbar `.iconbtn`; add the `#customize` panel markup)
- Modify: `little-taipei/styles.css` (add `#customize` styles)
- Modify: `little-taipei/main.js` (label maps, panel builder, open/close + apply wiring; extend the pointerup interact-exclusion list)

**Interfaces:**
- Consumes: `myOverrides`, `myAppearanceCode`, `resolveAppearance`, `setLocalAppearance`, `encodeAppearanceCode`, `ACCESSORY_CHOICES`, palettes.
- Produces:
  - `applyLocalOverrides()` — recompute `myAppearanceCode` from `myOverrides` and rebuild the local avatar.
  - `openCustomize()` / `closeCustomize()` / `buildCustomizePanel()` — panel lifecycle + render.
  - `let customizing=false;` — module flag (Task 4 reads it for the camera; declared here).

- [ ] **Step 1: Add the HUD button**

In `index.html`, inside `#topbar` (after the `btnHelp` line, `index.html:25`), add:

```html
    <div id="btnDress" class="iconbtn" title="Customize your look"><span class="ic">🎨</span><span class="lbl">Look</span></div>
```

- [ ] **Step 2: Add the panel markup**

In `index.html`, after the `#emotes` line (`index.html:47`), add:

```html
<aside id="customize" aria-hidden="true">
  <header><span>🎨 Your look</span><button id="czClose" title="Close">✕</button></header>
  <div id="czBody"></div>
</aside>
```

- [ ] **Step 3: Style the panel (`styles.css`)**

Append to `styles.css`:

```css
  #customize{position:fixed;top:calc(74px + env(safe-area-inset-top));right:14px;z-index:15;
    width:min(300px,calc(100vw - 28px));max-height:calc(100vh - 120px);overflow:auto;
    background:rgba(255,255,255,.92);backdrop-filter:blur(4px);border:3px solid #fff;border-radius:18px;
    box-shadow:0 6px 0 rgba(0,0,0,.12);padding:12px;display:none;pointer-events:auto;}
  #customize.show{display:block;}
  #customize header{display:flex;align-items:center;justify-content:space-between;
    font-weight:700;color:var(--ink);font-size:15px;margin-bottom:6px;}
  #customize header button{border:none;background:transparent;font-size:18px;cursor:pointer;color:var(--ink);line-height:1;}
  #customize .czLabel{margin:10px 0 5px;font-size:11px;font-weight:800;letter-spacing:.06em;
    text-transform:uppercase;opacity:.6;color:var(--ink);}
  #customize .czRow{display:flex;flex-wrap:wrap;gap:6px;}
  #customize .czRow button{font:600 13px 'Fredoka',system-ui;padding:6px 10px;border-radius:9px;
    border:2px solid var(--ink);background:#fff;color:var(--ink);cursor:pointer;}
  #customize .czRow button.on{background:var(--ink);color:#fff;}
  #customize .czSwatch{width:28px;height:28px;padding:0;border-radius:50%;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.4);}
  #customize .czSwatch.on{box-shadow:0 0 0 3px var(--ink),inset 0 0 0 1px rgba(255,255,255,.5);}
```

- [ ] **Step 4: Add label maps + the apply/build/open/close functions (`main.js`)**

Near the customizer helpers from Task 2 (after `resolveAppearance`, `main.js` ~2917+), add:

```js
const STYLE_LABELS = {
  fluffy:'Fluffy', wavy:'Wavy', bob:'Bob', short:'Short',
  'mohawk-classic':'Mohawk · classic', 'mohawk-radial-five':'Mohawk · radial 5', 'mohawk-radial-extended':'Mohawk · radial 8',
};
const ACCESSORY_LABELS = { boba:'🧋 Boba', easycard:'💳 EasyCard', tanghulu:'🍡 Tanghulu', bear:'🧸 Bear', scooterHelmet:'🛵 Helmet' };
let customizing = false;   // true while the panel is open (Task 4 reads this for the camera + input gating)

function applyLocalOverrides(){
  myAppearanceCode = encodeAppearanceCode(myOverrides);
  setLocalAppearance(resolveAppearance(myName, myAppearanceCode));
  buildCustomizePanel();   // reflect the new selection state
}

function buildCustomizePanel(){
  const body = document.getElementById('czBody');
  if(!body || !myOverrides) return;
  const section = (label) => { const h=document.createElement('div'); h.className='czLabel'; h.textContent=label;
                               const row=document.createElement('div'); row.className='czRow'; body.append(h,row); return row; };
  body.textContent = '';
  // hairstyle
  const rHair = section('Hairstyle');
  for(const s of HAIRSTYLES){ const b=document.createElement('button'); b.textContent=STYLE_LABELS[s]||s;
    if(s===myOverrides.hairStyle) b.classList.add('on');
    b.onclick=()=>{ myOverrides.hairStyle=s; applyLocalOverrides(); }; rHair.append(b); }
  // hair colour
  const rHC = section('Hair colour');
  for(const c of HAIRC){ const b=document.createElement('button'); b.className='czSwatch'; b.style.background=c;
    if(c===myOverrides.hair) b.classList.add('on');
    b.onclick=()=>{ myOverrides.hair=c; applyLocalOverrides(); }; rHC.append(b); }
  // shirt colour
  const rSh = section('Shirt colour');
  for(const c of SHIRTS){ const b=document.createElement('button'); b.className='czSwatch'; b.style.background=c;
    if(c===myOverrides.shirt) b.classList.add('on');
    b.onclick=()=>{ myOverrides.shirt=c; applyLocalOverrides(); }; rSh.append(b); }
  // accessory
  const rAcc = section('Accessory');
  for(const a of ACCESSORY_CHOICES){ const b=document.createElement('button'); b.textContent=a?ACCESSORY_LABELS[a]:'None';
    if((a||null)===(myOverrides.accessory||null)) b.classList.add('on');
    b.onclick=()=>{ myOverrides.accessory=a; applyLocalOverrides(); }; rAcc.append(b); }
  tw(body);   // twemojify the accessory emoji labels
}

function openCustomize(){ customizing=true; document.getElementById('customize').classList.add('show');
  document.getElementById('customize').setAttribute('aria-hidden','false'); document.body.classList.remove('menuOpen'); buildCustomizePanel(); }
function closeCustomize(){ customizing=false; document.getElementById('customize').classList.remove('show');
  document.getElementById('customize').setAttribute('aria-hidden','true'); }
```

- [ ] **Step 5: Wire the buttons**

Next to the other HUD wiring (near `btnHelp`, `main.js:2867`), add:

```js
document.getElementById('btnDress').addEventListener('click',()=>{ customizing ? closeCustomize() : openCustomize(); });
document.getElementById('czClose').addEventListener('click', closeCustomize);
```

- [ ] **Step 6: Stop panel taps from triggering world interaction**

In the pointerup interact guard (`main.js:2738`), add `#customize` to the excluded selectors:

```js
addEventListener('pointerup',e=>{ if(dragging && !movedFar && started && !e.target.closest('#touch,#emotes,.iconbtn,.bigbtn,#customize')) doInteract(); dragging=false; });
```

- [ ] **Step 7: Validate**

Run: `cd little-taipei && npm run check`
Expected: passes.

- [ ] **Step 8: Manual in-game check**

`npm start`, BEGIN, click the 🎨 button. Expected: panel opens on the right; clicking each hairstyle / hair swatch / shirt swatch / accessory instantly restyles your avatar in place; the selected option shows the `on` highlight; ✕ closes it. (Camera framing comes in Task 4 — for now the avatar may be partly off-frame; that's fine.)

- [ ] **Step 9: Commit**

```bash
git add little-taipei/index.html little-taipei/styles.css little-taipei/main.js
git commit -m "Customizer UI: HUD button + side panel with live local restyle"
```

---

### Task 4: Camera turntable + input suspend while customizing

When the panel is open, ease the camera to face the avatar and slowly orbit it; suspend movement/jump/interact so the framing stays put. Ease back on close.

**Files:**
- Modify: `little-taipei/main.js` (camera state near line 2617; `updateCamera` at 2653; `animate` gate at 3052; `tryJump` at 2727)

**Interfaces:**
- Consumes: `customizing` (Task 3), `player`, `surfDir`, `camFollowHeading`, `camUp`, existing camera globals.
- Produces: `updateCustomizeCam(dt)` — dedicated framing path; `czOrbit` angle accumulator.

- [ ] **Step 1: Add the orbit accumulator**

Near the camera state declarations (`main.js:2619`, by `let camYaw=0, camPitch=0.46;`), add:

```js
let czOrbit = 0;   // turntable angle while the customizer is open
```

- [ ] **Step 2: Branch `updateCamera` into the turntable path**

At the very top of `updateCamera(dt)` (`main.js:2653`, before the `if(window.__freecam)` line), add:

```js
  if(customizing){ return updateCustomizeCam(dt); }
```

Then add the new function immediately after `updateCamera`'s closing brace (`main.js:2705`):

```js
// A calm turntable framing the player from the front while the customizer is open.
function updateCustomizeCam(dt){
  const up = surfDir;
  czOrbit += dt * 0.35;                                   // slow orbit
  const dist = 3.4, pitch = 0.16, lookH = 1.5;
  // camFollowHeading trails the (idle) runner; +π puts the camera in front to show the face, then orbit.
  const camF = camFollowHeading.clone().applyAxisAngle(up, Math.PI + czOrbit);
  const horiz = Math.cos(pitch) * dist, vert = Math.sin(pitch) * dist + lookH;
  const look = player.position.clone().addScaledVector(up, lookH);
  const desired = player.position.clone().addScaledVector(camF, -horiz).addScaledVector(up, vert);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 6));   // ease in on open, orbit while open
  camUp.lerp(up, 1 - Math.exp(-dt * 8)).normalize(); camera.up.copy(camUp);
  camera.lookAt(look);
}
```

(On close, `customizing` flips false and the normal `updateCamera` resumes — its own `camera.position.lerp` eases the shot back to gameplay, so no explicit tween-back is needed.)

- [ ] **Step 3: Suspend movement + interaction while customizing**

Replace the `if(started){ ... }` block in `animate` (`main.js:3052–3056`) with:

```js
  if(started){
    if(customizing){ inputMove=0; inputTurn=0; }
    else { readKeys(); updatePlayer(dt); checkInteract(); }
  }
```

- [ ] **Step 4: Block jump while customizing**

In `tryJump` (`main.js:2727`), add the `!customizing` guard:

```js
function tryJump(){ if(grounded && started && !customizing){ vVel=JUMP; grounded=false; doSquash(0.96,1.04); sfxJump(); } }
```

- [ ] **Step 5: Validate**

Run: `cd little-taipei && npm run check`
Expected: passes.

- [ ] **Step 6: Manual in-game check**

`npm start`, BEGIN, open 🎨. Expected: the camera smoothly swings to face your character and slowly orbits it; WASD/arrows and jump do nothing while open; changes are clearly visible from the front. Close → camera eases back to the normal street shot and movement resumes.

- [ ] **Step 7: Commit**

```bash
git add little-taipei/main.js
git commit -m "Customizer camera turntable + input suspend while panel open"
```

---

### Task 5: Broadcast the custom look + remote live-rebuild

Send the `a` code in the state tick and make peers rebuild your avatar when it changes. Makes customization visible to everyone.

**Files:**
- Modify: `little-taipei/main.js` (`netSend` at 3135; `ensureRemote` at 2923; `onPlayerState` at 2950)

**Interfaces:**
- Consumes: `myAppearanceCode`, `resolveAppearance`, `makeCharacter`, `makeLabel`, `addBlobShadow`, `remoteParcelMesh`, `createCharacterAnimator`, `remote` map.
- Produces: `buildRemoteRecord(id, remoteName, state, code)` (shared by first-appear + rebuild); `rebuildRemoteLook(id, r, code)`; each remote record gains an `appCode` field.

- [ ] **Step 1: Broadcast the code**

In `netSend` (`main.js:3135–3137`), add `a:myAppearanceCode` to the state object (alongside `n:myName`):

```js
  room.me.setState({ x:+player.position.x.toFixed(2), y:+player.position.y.toFixed(2), z:+player.position.z.toFixed(2),
    qx:+player.quaternion.x.toFixed(3), qy:+player.quaternion.y.toFixed(3), qz:+player.quaternion.z.toFixed(3), qw:+player.quaternion.w.toFixed(3),
    c:carrying?1:0, n:myName, a:myAppearanceCode, s:score, ad:inputMove<0?-1:1, ag:grounded?1:0, av:+vVel.toFixed(2), wp:+(walkPhase%6.28).toFixed(2) }); }
```

(That is the exact existing payload from `main.js:3135–3137` with `a:myAppearanceCode` inserted after `n:myName`. Keep every other field.)

- [ ] **Step 2: Build remotes from the resolved look**

Replace the `makeCharacter(...)` line in `ensureRemote` (`main.js:2926`):

```js
  const g=makeCharacter(appearanceFromName(remoteName));   // keyed on the owner's name → exact look they see for themselves (same on every client)
```

with:

```js
  const g=makeCharacter(resolveAppearance(remoteName, state.a));   // name-derived base + their broadcast overrides
```

Then, in the `remote.set(p.id,{...})` object at the end of `ensureRemote` (`main.js:2934–2939`), add an `appCode` field so later ticks can detect changes. Change the trailing `carry:false, score:0, name:remoteName});` to:

```js
    carry:false, score:0, name:remoteName, appCode:(typeof state.a==='string'?state.a:'')});
```

- [ ] **Step 3: Add the rebuild helper**

Immediately after `ensureRemote`'s closing brace (`main.js:2940`), add:

```js
// Restyle an existing remote in place when their broadcast look (code) changes.
// Rebuilds the avatar mesh + its attachments; preserves position, motion phase, carry, score, name.
function rebuildRemoteLook(id, r, code){
  const pos = r.group.position.clone(), quat = r.group.quaternion.clone(), phase = r.target.phase;
  scene.remove(r.group);
  const g = makeCharacter(resolveAppearance(r.name, code));
  g.position.copy(pos); g.quaternion.copy(quat); scene.add(g);
  const tag = makeLabel(r.name); tag.position.y = 2.05; g.add(tag);
  addBlobShadow(g, 0.38);
  const par = remoteParcelMesh(); par.visible = r.carry; g.add(par);
  r.group = g; r.parts = g.userData.parts; r.tag = tag; r.parcel = par;
  r.anim = createCharacterAnimator(g, { seed:id, maxSpeed:MOVE, intensity:0.96, phase });
  r.appCode = code;
}
```

- [ ] **Step 4: Detect code changes in `onPlayerState`**

In `onPlayerState` (`main.js:2950–2956`), inside the `if(r){ ... }` block, add a rebuild check. Change the line `r.carry=!!state.c; if(state.n) setRemoteName(r,state.n); r.score=state.s||0; }` to:

```js
      r.carry=!!state.c; if(state.n) setRemoteName(r,state.n); r.score=state.s||0;
      if(typeof state.a==='string' && state.a!==r.appCode) rebuildRemoteLook(p.id, r, state.a); }
```

- [ ] **Step 5: Validate**

Run: `cd little-taipei && npm run check`
Expected: passes.

- [ ] **Step 6: Manual two-client check**

`npm start`. Open http://localhost:4173/ in two browser windows; in window A press BEGIN, copy the room link from "💌 invite friends", and open it in window B (press BEGIN there too). With both in the same room:
- Confirm each sees the other's avatar.
- In A, open 🎨 and change hairstyle / hair / shirt / accessory. Expected: within a tick, B's copy of A restyles to match.
- Have B join *after* A has already customized. Expected: B renders A already wearing the custom look (initial `ensureRemote` used the `a` code).

- [ ] **Step 7: Commit**

```bash
git add little-taipei/main.js
git commit -m "Broadcast custom look via 'a' code; remotes rebuild on change"
```

---

## Self-Review

**Spec coverage:**
- Editable essentials (hairstyle/hair/shirt/accessory) → Task 3 panel + Task 2 model. ✓
- Live in-place WYSIWYG, no screen switch → Task 3 (`applyLocalOverrides` → `setLocalAppearance`; non-blocking `#customize`). ✓
- Camera eases to face + slow orbit; eases back → Task 4 (`updateCustomizeCam`). ✓
- Visible to all players → Task 5 (`a` broadcast + `rebuildRemoteLook`). ✓
- On-vibe auto crowd (rare mohawks), picker keeps all 7 → Task 1 (`AUTO_HAIRSTYLES`) + Task 3 (picker uses `HAIRSTYLES`). ✓
- No persistence → nothing writes `localStorage`; `myOverrides` init from name each BEGIN. ✓
- Helmet-vs-headgear, accessory=none, malformed code, self-echo → Task 2 `resolveAppearance` (helmet rule, `|| null`, `decode` returns null on bad input) + existing `isSelfPlayer` early-return. ✓
- No new runtime module / no `deploy-antics.mjs` change → confirmed; all edits in existing shipped files. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code and exact insertion points. ✓

**Type/name consistency:** `myOverrides`/`myAppearanceCode`/`customizing`/`czOrbit` declared once and used consistently; `encodeAppearanceCode`/`decodeAppearanceCode`/`resolveAppearance`/`applyLocalOverrides`/`buildCustomizePanel`/`openCustomize`/`closeCustomize`/`updateCustomizeCam`/`rebuildRemoteLook` names match across tasks; `ACCESSORY_CHOICES` shared by codec + panel; remote record's `appCode` set in Task 5 Step 2 and read in Steps 3–4. ✓
