// =====================================================================
//  paris/landmarks-cite.js — ÎLE DE LA CITÉ & ÎLE SAINT-LOUIS
// ---------------------------------------------------------------------
//  The medieval heart of the toy Paris, sitting on the two islands the
//  Seine wraps around (all coords land on the islands per geo.js):
//
//   1) NOTRE-DAME DE PARIS — a chunky low-poly Gothic cathedral in pale
//      limestone with a grey roof. Twin square WEST towers (flat tops +
//      tall louvre openings) flank a gabled west facade with three
//      recessed portals and a round rose window. A long pitched-roof nave
//      runs east to a rounded apse; a slender flèche (spire) rises at the
//      nave/transept crossing; a ring of flying buttresses braces the
//      apse. The facade is turned to face WEST / downstream (toward the
//      Louvre).
//   2) SAINTE-CHAPELLE — a tall narrow chapel of very tall stained glass
//      under a steep slate roof with a small spire, lighter stone.
//   3) LA CONCIERGERIE — a long medieval hall along the north bank with a
//      pair of round towers under conical witch-hat roofs.
//   4) BRIDGES — a couple of short stone arch bridges spanning the Seine
//      channels around the island.
//   5) ÎLE SAINT-LOUIS — a row of elegant 4–5 storey stone townhouses
//      with mansard roofs lining the quay.
//
//  Everything is built local (base at y=0, +Y up, centred at origin,
//  +Z = front) then placed with the ctx surface helpers and bake-merged.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, placeFacing,
          parisToDir, landmarkDir, LANDMARKS, addCollider, claim,
          bakeMerge, groundR, geo, rng } = ctx;
  const UP = new THREE.Vector3(0, 1, 0);

  // ---- low-poly mesh helpers (group-first, faceted, shadowed) ---------
  const solid = (g, m) => { const o = new THREE.Mesh(faceted(g), m); o.castShadow = true; o.receiveShadow = true; return o; };
  function box(grp, mat, w, h, d, x, y, z, ry){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); if(ry) m.rotation.y = ry; grp.add(m); return m;
  }
  function cyl(grp, mat, rt, rb, h, seg, x, y, z, ry){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg || 8), mat);
    m.position.set(x || 0, y || 0, z || 0); if(ry) m.rotation.y = ry; grp.add(m); return m;
  }
  // a square-section bar stretched between two local points (a, b)
  function strut(grp, a, b, w, mat){
    const d = b.clone().sub(a); const len = d.length(); if(len < 1e-4) return null;
    const m = solid(new THREE.BoxGeometry(w, len, w), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len)); grp.add(m); return m;
  }
  // a vertical slab with a rounded ("tombstone") top — Gothic openings & portals
  function archPanel(mat, w, h, t){
    const hw = w / 2, spring = Math.max(0.01, h - hw);
    const s = new THREE.Shape();
    s.moveTo(-hw, 0); s.lineTo(-hw, spring); s.absarc(0, spring, hw, Math.PI, 0, true); s.lineTo(hw, 0); s.closePath();
    const geo2 = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 7 });
    geo2.translate(0, 0, -t / 2);
    return solid(geo2, mat);
  }
  // a steep mansard-style frustum (wide base -> narrow top)
  function frustum(mat, wb, db, wt, dt, h){
    const x0 = wb / 2, z0 = db / 2, x1 = wt / 2, z1 = dt / 2;
    const v = [[-x0,0,z0],[x0,0,z0],[x0,0,-z0],[-x0,0,-z0],[-x1,h,z1],[x1,h,z1],[x1,h,-z1],[-x1,h,-z1]];
    const q = [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]];
    const pos = []; for(const f of q){ const [a,b,c,d] = f; pos.push(...v[a],...v[b],...v[c],...v[a],...v[c],...v[d]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    return solid(g, mat);
  }
  // a triangular-prism gable roof; ridge runs along local +Z (length)
  function gableRoof(mat, width, rise, length){
    const w = width / 2, h = rise, l = length / 2;
    const v = [[-w,0,l],[w,0,l],[0,h,l],[-w,0,-l],[w,0,-l],[0,h,-l]];
    const tris = [[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4]];
    const pos = []; for(const t of tris) for(const i of t) pos.push(...v[i]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    return solid(g, mat);
  }

  // ---- shared palette --------------------------------------------------
  const LIME    = toon('#d8cdb0');                       // pale limestone
  const LIME_D  = toon('#c7bb9a');                       // shaded stone / surrounds
  const LIME_L  = toon('#e4dcc4');                       // lighter stone (Sainte-Chapelle)
  const MED     = toon('#c9bd9b');                       // medieval Conciergerie stone
  const TOWN    = toon('#d2c7ac');                       // Île St-Louis townhouse stone
  const TOWN_B  = toon('#cabf9f');
  const ROOF    = toon('#6b7280');                       // grey cathedral roof
  const ROOF_D  = toon('#565d68');                       // shaded roof
  const SLATE   = toon('#5a6068');                       // spire / cones / mansards
  const DARK    = toon('#39383a');                       // recessed window / louvre voids
  const GLASS   = toon('#bfe3e0');                        // plain glazing
  const GLOW    = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.9 });   // lit windows
  const ROSE    = toon('#8a6fae', { emissive: '#5b3f86', emissiveIntensity: 0.55 });  // rose-window glass
  const SC_GLASS= toon('#7fb6c9', { emissive: '#3f7d94', emissiveIntensity: 0.5 });   // Sainte-Chapelle glass
  const GOLD    = toon('#e8c46f', { emissive: '#b3801f', emissiveIntensity: 0.45 });  // finials
  const BR      = toon('#bdb090');                       // bridge stone
  const BR_D    = toon('#a89a7b');                       // bridge shadow / parapet
  const BR_L    = toon('#cabf9f');                       // bridge deck
  const PAVE    = toon('#bdb39a');                       // parvis paving

  // helper: place a built (local, +Z-front) group facing faceDir, then bake & add
  function placeBake(g, dir, faceDir, extra){ placeFacing(g, dir, faceDir, extra || 0); planetGroup.add(bakeMerge(g)); }
  // a collider at a LOCAL (x,z) offset from a placed landmark (+Z toward faceDir)
  function colliderAt(dir, faceDir, x, z, r){
    const up = dir.clone().normalize();
    const fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up)).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const p = up.clone().multiplyScalar(groundR(up)).addScaledVector(right, x).addScaledVector(fwd, z);
    addCollider(p.normalize(), r);
  }

  // =====================================================================
  //  1) NOTRE-DAME DE PARIS
  //  Local frame: +Z = WEST facade (towers + rose); nave runs into -Z to
  //  the rounded apse. Built base at y=0.
  // =====================================================================
  const cath = new THREE.Group();

  const NW = 1.7, NHW = NW / 2;          // nave width / half
  const WALL = 2.3;                       // nave wall height
  const FRONT_Z = 1.9;                    // west facade front plane
  const NAVE_BACK = -2.6;                 // east end of the nave box
  const NAVE_CZ = (FRONT_Z - 0.3 + NAVE_BACK) / 2;
  const NAVE_LEN = (FRONT_Z - 0.3) - NAVE_BACK;
  const TWR = 4.5, TW = 0.95;             // tower height / width
  const TX = 1.05;                        // tower centre x
  const TZ = FRONT_Z - TW / 2;            // tower centre z (front face on FRONT_Z)
  const RIDGE = WALL + 1.3;               // nave roof ridge height (~3.6)

  // parvis paving in front of the facade (the square)
  box(cath, PAVE, 2.9, 0.1, 1.9, 0, 0.05, FRONT_Z + 0.95);
  // base socle under the whole body
  box(cath, LIME_D, NW + 0.3, 0.18, NAVE_LEN + 0.5, 0, 0.09, NAVE_CZ);

  // ---- nave body + steep pitched roof ----
  box(cath, LIME, NW, WALL, NAVE_LEN, 0, WALL / 2, NAVE_CZ);
  // a clerestory band of small lit windows along each nave wall
  for(const sx of [-1, 1]) for(let i = 0; i < 4; i++){
    const z = NAVE_CZ + (i - 1.5) * 0.85;
    box(cath, GLOW, 0.02, 0.5, 0.22, sx * (NHW + 0.005), WALL * 0.62, z);
  }
  const naveRoof = gableRoof(ROOF, NW + 0.18, 1.3, NAVE_LEN + 0.1);
  naveRoof.position.set(0, WALL, NAVE_CZ); cath.add(naveRoof);
  box(cath, ROOF_D, 0.1, 0.1, NAVE_LEN + 0.2, 0, RIDGE, NAVE_CZ);   // ridge cap

  // lower side aisles (give the nave a stepped Gothic profile)
  for(const sx of [-1, 1]){
    box(cath, LIME_D, 0.42, WALL * 0.62, NAVE_LEN - 0.1, sx * (NHW + 0.2), WALL * 0.31, NAVE_CZ);
  }

  // ---- transept (short crossing arms) + gable ends ----
  const TR_CZ = NAVE_CZ + 0.3;            // crossing position
  box(cath, LIME, 2.7, WALL * 0.92, 1.0, 0, WALL * 0.46, TR_CZ);
  const trRoof = gableRoof(ROOF, 1.12, 0.95, 2.78); trRoof.rotation.y = Math.PI / 2;
  trRoof.position.set(0, WALL * 0.92, TR_CZ); cath.add(trRoof);
  for(const sx of [-1, 1]){                // transept rose-ish window on each arm end
    const r = solid(new THREE.CircleGeometry(0.3, 14), ROSE);
    r.rotation.y = sx * Math.PI / 2; r.position.set(sx * 1.36, WALL * 0.6, TR_CZ); cath.add(r);
  }

  // ---- rounded apse at the east end + conical roof ----
  cyl(cath, LIME, NHW + 0.02, NHW + 0.02, WALL, 9, 0, WALL / 2, NAVE_BACK);
  cyl(cath, ROOF, 0, NHW + 0.16, 0.95, 9, 0, WALL + 0.42, NAVE_BACK);
  for(let i = 0; i < 5; i++){              // apse lancet windows
    const a = (i - 2) * 0.5;
    box(cath, GLOW, 0.02, 0.6, 0.16, Math.sin(a) * (NHW + 0.03), WALL * 0.55, NAVE_BACK + Math.cos(a) * (NHW + 0.03), a);
  }

  // ---- flying buttresses bracing the apse / choir (both sides) ----
  for(const sx of [-1, 1]){
    for(const z of [NAVE_BACK + 0.4, NAVE_BACK + 1.15, NAVE_BACK + 1.9]){
      const px = sx * 1.55;
      box(cath, LIME_D, 0.2, 1.55, 0.2, px, 0.77, z);                       // outer pier
      cyl(cath, SLATE, 0, 0.16, 0.4, 6, px, 1.72, z);                       // pier pinnacle
      strut(cath, new THREE.Vector3(sx * 1.45, 1.5, z), new THREE.Vector3(sx * (NHW + 0.02), 2.0, z), 0.1, LIME); // flyer
      box(cath, LIME, 0.16, 0.16, 0.16, sx * (NHW + 0.05), 2.05, z);        // wall buttress shoulder
    }
  }

  // ---- twin WEST towers (square, flat top, tall louvre openings) ----
  for(const sx of [-1, 1]){
    const x = sx * TX;
    box(cath, LIME, TW, TWR, TW, x, TWR / 2, TZ);
    // tall louvre openings on the two visible upper faces (+Z front, ±X side)
    const lv1 = archPanel(DARK, 0.34, 1.5, 0.12); lv1.position.set(x, 2.7, TZ + TW / 2 + 0.01); cath.add(lv1);
    const lv2 = archPanel(DARK, 0.34, 1.5, 0.12); lv2.rotation.y = sx * Math.PI / 2;
    lv2.position.set(x + sx * (TW / 2 + 0.01), 2.7, TZ); cath.add(lv2);
    // a couple of stone louvre slats over the openings (front face)
    for(const by of [3.0, 3.4, 3.8]) box(cath, LIME_D, 0.36, 0.05, 0.04, x, by, TZ + TW / 2 + 0.04);
    // horizontal string-course bands
    for(const by of [1.7, 2.45]) box(cath, LIME_D, TW + 0.06, 0.1, TW + 0.06, x, by, TZ);
    // flat top: parapet + corner pinnacles
    box(cath, LIME_D, TW + 0.12, 0.14, TW + 0.12, x, TWR + 0.07, TZ);
    for(const cx of [-1, 1]) for(const cz of [-1, 1])
      cyl(cath, SLATE, 0, 0.1, 0.32, 6, x + cx * (TW / 2 - 0.06), TWR + 0.28, TZ + cz * (TW / 2 - 0.06));
  }

  // ---- gabled west facade between the towers ----
  const FW = 1.18;                         // facade width (between towers)
  box(cath, LIME, FW, 3.0, 0.5, 0, 1.5, FRONT_Z - 0.25);               // facade wall
  const fgable = gableRoof(LIME_D, FW + 0.06, 0.7, 0.5); fgable.position.set(0, 3.0, FRONT_Z - 0.25); cath.add(fgable);
  // gallery / king's-gallery string courses
  for(const by of [1.05, 2.55]) box(cath, LIME_D, FW + 0.04, 0.12, 0.56, 0, by, FRONT_Z - 0.22);
  // three recessed portals at the base (stone surround + dark arched void)
  for(const px of [-0.36, 0, 0.36]){
    const sur = archPanel(LIME_D, 0.32, 1.0, 0.16); sur.position.set(px, 0.0, FRONT_Z + 0.04); cath.add(sur);
    const voi = archPanel(DARK, 0.22, 0.86, 0.16); voi.position.set(px, 0.0, FRONT_Z - 0.02); cath.add(voi);
  }
  // round ROSE window above the portals
  const roseY = 1.85;
  const ring = solid(new THREE.TorusGeometry(0.42, 0.07, 6, 18), LIME_D);
  ring.position.set(0, roseY, FRONT_Z + 0.02); cath.add(ring);
  const glass = solid(new THREE.CircleGeometry(0.4, 18), ROSE);
  glass.position.set(0, roseY, FRONT_Z); cath.add(glass);
  for(let k = 0; k < 8; k++){                                          // tracery spokes
    const a = k / 8 * Math.PI * 2;
    box(cath, LIME, 0.04, 0.78, 0.03, 0, roseY, FRONT_Z + 0.03).rotation.z = a;
  }
  cyl(cath, LIME_D, 0.09, 0.09, 0.07, 8, 0, roseY, FRONT_Z + 0.04).rotation.x = Math.PI / 2; // hub

  // ---- the flèche (slender central spire) at the crossing ----
  const SX = 0, SZ = TR_CZ;
  box(cath, LIME, 0.5, 0.6, 0.5, SX, RIDGE - 0.2, SZ);                 // crossing lantern base
  for(const cx of [-1, 1]) for(const cz of [-1, 1])                    // 4 base pinnacles
    cyl(cath, SLATE, 0, 0.09, 0.34, 6, SX + cx * 0.34, RIDGE + 0.05, SZ + cz * 0.34);
  const spireBase = RIDGE + 0.1;
  cyl(cath, SLATE, 0.0, 0.34, 1.5, 4, SX, spireBase + 0.75, SZ, Math.PI / 4);   // tall slate pyramid
  cyl(cath, SLATE, 0.02, 0.05, 0.4, 6, SX, spireBase + 1.6, SZ);               // needle
  const cap = solid(new THREE.SphereGeometry(0.07, 8, 6), GOLD); cap.position.set(SX, spireBase + 1.85, SZ); cath.add(cap);
  box(cath, GOLD, 0.04, 0.26, 0.04, SX, spireBase + 1.95, SZ);                  // finial cross (vertical)
  box(cath, GOLD, 0.16, 0.04, 0.04, SX, spireBase + 1.97, SZ);                  // finial cross (arms)
  // spire tip ≈ spireBase + 2.08 ≈ 5.5 units

  const ndDir = landmarkDir('notredame');
  const ndFace = landmarkDir('louvre');
  const NS = 1.3;                                    // real-feel: towers ~69 m, spire ~96 m (island is tight)
  cath.scale.setScalar(NS);
  placeBake(cath, ndDir, ndFace);                    // facade faces WEST / downstream
  // colliders trace the cathedral body — the parvis in front stays walkable
  colliderAt(ndDir, ndFace, -TX * NS, TZ * NS, 0.62 * NS);   // west towers
  colliderAt(ndDir, ndFace,  TX * NS, TZ * NS, 0.62 * NS);
  colliderAt(ndDir, ndFace, 0, 1.55 * NS, 0.5 * NS);         // facade between the towers
  colliderAt(ndDir, ndFace, 0, -0.6 * NS, 0.95 * NS);        // nave
  colliderAt(ndDir, ndFace, -1.1 * NS, TR_CZ * NS, 0.5 * NS);// transept arms
  colliderAt(ndDir, ndFace,  1.1 * NS, TR_CZ * NS, 0.5 * NS);
  colliderAt(ndDir, ndFace, 0, (NAVE_BACK + 0.1) * NS, 0.9 * NS);// apse + buttress ring
  claim(ndDir, 2.5 * NS);

  // =====================================================================
  //  2) SAINTE-CHAPELLE — tall narrow chapel, very tall windows, steep
  //  slate roof + small spire, lighter stone.
  // =====================================================================
  function buildSainteChapelle(){
    const g = new THREE.Group();
    const w = 0.78, d = 1.25, h = 2.7;
    box(g, LIME_L, w + 0.16, 0.16, d + 0.16, 0, 0.08, 0);             // socle
    box(g, LIME_L, w, h, d, 0, h / 2, 0);                            // body
    // very tall stained-glass windows down the long sides + the apse end
    for(const sx of [-1, 1]) for(let i = 0; i < 4; i++){
      const z = (i - 1.5) * 0.28 * (d / 0.84);
      const win = archPanel(SC_GLASS, 0.16, 1.7, 0.1); win.rotation.y = sx * Math.PI / 2;
      win.position.set(sx * (w / 2 + 0.005), 0.55, z); g.add(win);
      box(g, LIME, 0.07, h * 0.95, 0.09, sx * (w / 2 + 0.02), h * 0.47, z + 0.22); // buttress mullion
    }
    const frontWin = archPanel(SC_GLASS, 0.4, 1.9, 0.1); frontWin.position.set(0, 0.5, d / 2 + 0.01); g.add(frontWin);
    // very steep thin roof + ridge + small spire
    const roof = gableRoof(SLATE, w + 0.12, 1.35, d + 0.1); roof.position.set(0, h, 0); g.add(roof);
    box(g, SLATE, 0.07, 0.07, d + 0.16, 0, h + 1.35, 0);
    cyl(g, SLATE, 0, 0.16, 1.0, 6, 0, h + 1.35 + 0.5, 0);            // flèche
    cyl(g, GOLD, 0, 0.04, 0.18, 6, 0, h + 1.35 + 1.05, 0);          // finial
    return g;
  }
  const scDir = parisToDir(-300, 180);
  placeBake(buildSainteChapelle(), scDir, landmarkDir('louvre'));
  addCollider(scDir, 0.7);
  claim(scDir, 1.0);

  // =====================================================================
  //  3) LA CONCIERGERIE — long medieval hall along the north bank with a
  //  pair of round towers under conical witch-hat roofs.
  //  Local: long axis = X; +Z = river-facing (north) front.
  // =====================================================================
  function buildConciergerie(){
    const g = new THREE.Group();
    const L = 2.2, d = 0.8, h = 1.7;
    box(g, MED, L + 0.2, 0.16, d + 0.18, 0, 0.08, 0);                // socle
    box(g, MED, L, h, d, 0, h / 2, 0);                               // long hall
    box(g, ROOF, L + 0.1, 0.45, d + 0.1, 0, h + 0.2, 0);             // low hipped roof slab
    // crenellated parapet hint + rows of small dark windows
    for(let i = 0; i < 7; i++){
      const x = (i - 3) * (L / 7);
      box(g, DARK, 0.12, 0.4, 0.02, x, h * 0.55, d / 2 + 0.005);     // front window
      box(g, DARK, 0.12, 0.4, 0.02, x, h * 0.55, -d / 2 - 0.005);    // rear window
      box(g, MED, 0.1, 0.12, 0.1, x, h + 0.46, d / 2 - 0.06);        // merlon
    }
    // the pair of round towers on the river side, with witch-hat cones
    for(const tx of [-0.62, 0.18]){
      const tr = 0.34, th = 2.15;
      cyl(g, MED, tr, tr + 0.04, th, 12, tx, th / 2, d / 2 + 0.06);
      cyl(g, LIME_D, tr + 0.05, tr + 0.05, 0.1, 12, tx, th * 0.86, d / 2 + 0.06); // corbel band
      cyl(g, SLATE, 0, tr + 0.12, 1.0, 12, tx, th + 0.46, d / 2 + 0.06);          // conical roof
      cyl(g, GOLD, 0, 0.05, 0.16, 6, tx, th + 1.02, d / 2 + 0.06);                // finial
      box(g, DARK, 0.12, 0.34, 0.02, tx, th * 0.55, d / 2 + tr + 0.05);           // tower window
    }
    return g;
  }
  const cgDir = parisToDir(-360, 300);
  // front faces the river (north). north of the island bank:
  placeBake(buildConciergerie(), cgDir, parisToDir(-360, 500));
  addCollider(cgDir, 1.3);
  claim(cgDir, 1.7);

  // =====================================================================
  //  4) BRIDGES OVER THE SEINE — every crossing in geo.BRIDGES sits on a
  //  walkable land causeway (geo.seineDepth skips the carve there), so the
  //  bridge model is dressing: a deck slab flush with the ground, stone
  //  fascia walls with arch cutouts hanging over the water on both sides,
  //  parapets and little lamps. Pont Alexandre III gets its four gilded
  //  pylons and garlands. The player just strolls straight across.
  // =====================================================================
  const LAMP_IRON = toon('#33383f');
  const LAMP_GLOW = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.9 });
  const PYLON     = toon('#d8cdb0');
  // fascia: a thin wall with NA semicircular arch cutouts, top edge at y=top
  function fasciaWall(span, top, NA, mat){
    const hs = span / 2, seg = span / NA, r = Math.min(seg * 0.36, top * 0.72), springY = -top * 0.35;
    const s = new THREE.Shape();
    s.moveTo(-hs, -top); s.lineTo(-hs, 0); s.lineTo(hs, 0); s.lineTo(hs, -top); s.closePath();
    for(let i = 0; i < NA; i++){
      const cx = -hs + seg * (i + 0.5);
      const h = new THREE.Path();
      h.moveTo(cx - r, -top); h.lineTo(cx - r, springY); h.absarc(cx, springY, r, Math.PI, 0, true); h.lineTo(cx + r, -top); h.closePath();
      s.holes.push(h);
    }
    const geo2 = new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: false, curveSegments: 7 });
    geo2.translate(0, 0, -0.045);
    return solid(geo2, mat);
  }
  function buildCausewayBridge(span, width, NA, grand){
    const g = new THREE.Group();
    const inner = new THREE.Group(); inner.rotation.y = Math.PI / 2; g.add(inner); // span X -> +Z (across river)
    box(inner, BR_L, span, 0.1, width, 0, 0.0, 0);                         // deck slab (top ~5cm proud)
    for(const sz of [-1, 1]){
      const f = fasciaWall(span, 0.72, NA, BR);                            // arch faces over the water
      f.rotation.y = 0; f.position.set(0, 0.1, sz * (width / 2)); inner.add(f);
      box(inner, BR_D, span, 0.2, 0.09, 0, 0.24, sz * (width / 2));        // parapet
      box(inner, BR_L, span, 0.05, 0.13, 0, 0.36, sz * (width / 2));       // parapet cap
    }
    // little lamps at the third points of each parapet
    for(const sz of [-1, 1]) for(const fx of [-span * 0.22, span * 0.22]){
      cyl(g, LAMP_IRON, 0.03, 0.045, 0.5, 6, sz * (width / 2), 0.62, fx);
      box(g, LAMP_GLOW, 0.09, 0.12, 0.09, sz * (width / 2), 0.93, fx);
      const cap = solid(new THREE.ConeGeometry(0.07, 0.08, 6), LAMP_IRON);
      cap.position.set(sz * (width / 2), 1.03, fx); g.add(cap);
    }
    if(grand){
      // Pont Alexandre III: four tall stone pylons crowned by gilded Renommées
      for(const sz of [-1, 1]) for(const fx of [-span * 0.42, span * 0.42]){
        const px = sz * (width / 2 + 0.1);
        box(g, PYLON, 0.3, 1.5, 0.3, px, 0.75, fx);
        box(g, BR_D, 0.38, 0.1, 0.38, px, 1.52, fx);
        const fig = solid(new THREE.ConeGeometry(0.12, 0.42, 6), GOLD);
        fig.position.set(px, 1.78, fx); g.add(fig);
        for(const sw of [-1, 1]){                                        // gilt wings
          const w = box(g, GOLD, 0.05, 0.3, 0.14, px + sw * 0.12, 1.86, fx);
          w.rotation.z = -sw * 0.5;
        }
        const orb = solid(new THREE.SphereGeometry(0.07, 8, 6), GOLD);
        orb.position.set(px, 2.06, fx); g.add(orb);
      }
      // gilded garland strip along each fascia
      for(const sz of [-1, 1]) box(g, GOLD, 0.04, 0.05, span * 0.8, sz * (width / 2 + 0.05), 0.16, 0);
    }
    return g;
  }
  for(const b of geo.BRIDGES){
    const cDir = parisToDir(b.c[0], b.c[1]);
    // +Z across the river = perpendicular to the stored tangent
    const acrossDir = parisToDir(b.c[0] - b.t[1] * 260, b.c[1] + b.t[0] * 260);
    const span = 2 * 260 * geo.K * geo.R * 1.05;                          // bank to bank + a touch
    const width = (geo.BRIDGE_HALF_W * 2 * geo.K * geo.R) * 1.35;         // hides the causeway strip
    const g = buildCausewayBridge(span, width, b.grand ? 3 : 4, !!b.grand);
    placeFacing(g, cDir, acrossDir, 0);
    planetGroup.add(bakeMerge(g));
  }

  // =====================================================================
  //  5) ÎLE SAINT-LOUIS — a row of elegant 4–5 storey stone townhouses
  //  with mansard roofs lining the quay (built local, +Z = quay/river).
  // =====================================================================
  function buildTownhouse(){
    const g = new THREE.Group();
    const w = 0.9, d = 0.86, floors = 4 + (rng() < 0.5 ? 1 : 0);
    const fh = 0.62, h = floors * fh;
    const wall = rng() < 0.5 ? TOWN : TOWN_B;
    box(g, LIME_D, w + 0.12, 0.14, d + 0.12, 0, 0.07, 0);            // socle
    box(g, wall, w, h, d, 0, h / 2, 0);                              // body
    box(g, LIME_D, w + 0.06, 0.1, d + 0.06, 0, fh, 0);              // ground-floor cornice
    // window rows on the +Z facade (top floors lit at random)
    for(let f = 1; f < floors; f++){
      const y = f * fh + fh * 0.45;
      for(const wx of [-0.26, 0, 0.26]){
        const lit = rng() < 0.45;
        box(g, lit ? GLOW : GLASS, 0.18, 0.32, 0.03, wx, y, d / 2 + 0.005);
        box(g, LIME_D, 0.24, 0.04, 0.05, wx, y - 0.2, d / 2 + 0.02); // sill
      }
    }
    box(g, LIME_D, w + 0.08, 0.12, d + 0.08, 0, h + 0.02, 0);       // eaves cornice
    // mansard roof: steep slate frustum + flat cap + dormers
    const mans = frustum(SLATE, w + 0.06, d + 0.06, w * 0.62, d * 0.62, 0.6); mans.position.y = h + 0.08; g.add(mans);
    box(g, ROOF_D, w * 0.64, 0.08, d * 0.64, 0, h + 0.68, 0);
    for(const wx of [-0.22, 0.22]){                                  // dormer windows
      box(g, SLATE, 0.2, 0.22, 0.12, wx, h + 0.3, d * 0.4);
      box(g, GLOW, 0.12, 0.14, 0.03, wx, h + 0.31, d * 0.46);
    }
    return g;
  }
  const ilDir = landmarkDir('ileStLouis');
  claim(ilDir, 2.0);
  for(let i = 0; i < 5; i++){
    const e = 400 + i * 60, n = -118;           // north quay row (all on-island, verified)
    const dir = parisToDir(e, n);
    const house = buildTownhouse();
    placeFacing(house, dir, parisToDir(e, n + 200));   // facades face the river (north)
    planetGroup.add(bakeMerge(house));
    addCollider(dir, 0.6);
    claim(dir, 0.8);
  }
}
