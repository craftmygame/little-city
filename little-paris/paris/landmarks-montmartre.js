// =====================================================================
//  paris/landmarks-montmartre.js — LA BUTTE MONTMARTRE
// ---------------------------------------------------------------------
//  Perched on the Montmartre hill (the terrain is already raised at
//  ctx.LANDMARKS.sacrecoeur):
//   1) BASILIQUE DU SACRÉ-CŒUR — a bright travertine Romano-Byzantine
//      basilica: a tall ovoid/egg dome on a colonnaded drum (~4.9 units),
//      four smaller egg domes at the corners, a taller square campanile
//      behind, and a columned portico of three round arches across the
//      front. Front turned downhill/south toward the city (Notre-Dame).
//   2) THE MONUMENTAL CASCADE — a run of stepped stone terraces dropping
//      down the hillside on the downhill side toward the city.
//   3) PLACE DU TERTRE — a little cobbled artists' square beside it with
//      easels (tripod + canvas) and bright parasols.
//   4) LE MOULIN ROUGE — a cabaret-red block crowned by a red rooftop
//      windmill (hub + four latticed X-sails) with warm marquee lights.
//
//  Everything is built local (base at y=0, +Y up, centred at origin,
//  +Z = front) then placed with the ctx surface helpers and baked.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, placeFacing,
          parisToDir, landmarkDir, LANDMARKS, addCollider, claim,
          bakeMerge, rand, pick } = ctx;

  // ---- low-poly mesh helpers (group-first, faceted, shadowed) ---------
  const solid = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z, rotY){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function cyl(g, mat, rt, rb, h, seg, x, y, z){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mat);
    m.position.set(x || 0, y || 0, z || 0); g.add(m); return m;
  }
  // flat ground tile (receives shadow, doesn't cast)
  function ground(g, geo, mat){ const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = false; m.receiveShadow = true; g.add(m); return m; }
  // a pointed ovoid / "egg" dome by lathe: base radius rb at y=0 → apex at y=H
  function eggDome(rb, H, mat, segs){
    const N = 10, pts = [];
    for(let i = 0; i <= N; i++){ const t = i / N; const r = rb * Math.pow(Math.max(0, 1 - Math.pow(t, 1.85)), 0.6); pts.push(new THREE.Vector2(Math.max(r, 0.001), H * t)); }
    return solid(new THREE.LatheGeometry(pts, segs || 12), mat);
  }
  // a half-ring (rainbow) arch in the local XY plane, spanning `span`, crown at cy+span/2
  function archRing(g, cx, cy, z, span, tube, mat){
    const m = solid(new THREE.TorusGeometry(span / 2, tube, 6, 14, Math.PI), mat);
    m.position.set(cx, cy, z); g.add(m); return m;
  }

  // ---- shared travertine palette --------------------------------------
  const TRAV   = toon('#f2efe6');                                          // bright off-white travertine
  const TRAV_D = toon('#e3dccb');                                          // shaded bands / steps
  const TRAV_S = toon('#d3ccb8');                                          // socle / deep shadow
  const ROOF   = toon('#d8d2c2');                                          // dome lead (kept pale)
  const GLOW   = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.85 }); // warm windows
  const GOLD   = toon('#e8c46f', { emissive: '#b3801f', emissiveIntensity: 0.45 }); // finials / crosses
  const COBBLE   = toon('#8d8478');
  const COBBLE_D = toon('#766d62');

  const sacDir = landmarkDir('sacrecoeur');
  const ndDir  = landmarkDir('notredame');

  // a collider at a LOCAL (x,z) offset from a placed landmark (+Z toward faceDir)
  function colliderAt(dir, faceDir, x, z, r){
    const up = dir.clone().normalize();
    const fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up)).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const p = up.clone().multiplyScalar(ctx.groundR(up)).addScaledVector(right, x).addScaledVector(fwd, z);
    addCollider(p.normalize(), r);
  }

  // =====================================================================
  //  1) BASILIQUE DU SACRÉ-CŒUR
  // =====================================================================
  const basilica = new THREE.Group();
  const W = 2.4, D = 2.0;

  // body massing
  box(basilica, TRAV_S, W + 0.26, 0.22, D + 0.26, 0, 0.11, 0);            // socle
  box(basilica, TRAV,   W, 1.40, D, 0, 0.92, 0);                          // main body  (0.22 → 1.62)
  box(basilica, TRAV_D, W + 0.14, 0.12, D + 0.14, 0, 1.66, 0);            // cornice
  // shallow pilasters on the side walls (texture)
  for(const sx of [-1, 1]) for(const pz of [-0.55, 0, 0.55])
    box(basilica, TRAV_D, 0.08, 1.2, 0.16, sx * (W / 2 + 0.02), 0.92, pz);

  // central drum + colonnade + egg dome + lantern
  const DRUM_Y = 1.72, DRUM_H = 0.90, DRUM_TOP = DRUM_Y + DRUM_H;         // 1.72 → 2.62
  cyl(basilica, TRAV, 0.84, 0.86, DRUM_H, 18, 0, DRUM_Y + DRUM_H / 2, 0);
  for(let i = 0; i < 18; i++){ const a = i / 18 * Math.PI * 2; cyl(basilica, TRAV_D, 0.045, 0.045, DRUM_H - 0.08, 6, Math.cos(a) * 0.9, DRUM_Y + DRUM_H / 2, Math.sin(a) * 0.9); }
  cyl(basilica, TRAV_D, 0.92, 0.92, 0.10, 18, 0, DRUM_TOP + 0.03, 0);     // drum cornice
  const dome = eggDome(0.90, 1.55, ROOF, 16); dome.position.y = DRUM_TOP; basilica.add(dome); // apex 4.17
  const APEX = DRUM_TOP + 1.55;
  cyl(basilica, TRAV, 0.20, 0.22, 0.30, 10, 0, APEX + 0.13, 0);           // lantern drum
  const ldome = eggDome(0.20, 0.34, ROOF, 10); ldome.position.y = APEX + 0.28; basilica.add(ldome);
  cyl(basilica, GOLD, 0.018, 0.018, 0.20, 6, 0, APEX + 0.72, 0);          // finial cross (vertical)
  box(basilica, GOLD, 0.13, 0.025, 0.025, 0, APEX + 0.70, 0);            //               (cross-arm)
  { const b = solid(new THREE.SphereGeometry(0.05, 8, 6), GOLD); b.position.y = APEX + 0.60; basilica.add(b); }

  // four smaller corner domes
  const CD_H = 0.50;
  for(const sx of [-1, 1]) for(const sz of [-1, 1]){
    const x = sx * 0.92, z = sz * 0.74;
    cyl(basilica, TRAV,   0.30, 0.32, CD_H, 12, x, DRUM_Y + CD_H / 2, z);
    cyl(basilica, TRAV_D, 0.34, 0.34, 0.06, 12, x, DRUM_Y + CD_H + 0.02, z);
    const cd = eggDome(0.32, 0.66, ROOF, 12); cd.position.set(x, DRUM_Y + CD_H + 0.04, z); basilica.add(cd);
    const fb = solid(new THREE.SphereGeometry(0.035, 6, 5), GOLD); fb.position.set(x, DRUM_Y + CD_H + 0.04 + 0.66 + 0.05, z); basilica.add(fb);
  }

  // taller square campanile behind (−Z)
  const CAM_Z = -(D / 2 + 0.55), CAM_W = 0.94, CAM_H = 3.70;              // body 0.22 → 3.92
  box(basilica, TRAV, CAM_W, CAM_H, CAM_W, 0, 0.22 + CAM_H / 2, CAM_Z);
  for(const by of [1.25, 2.15, 3.05]) box(basilica, TRAV_D, CAM_W + 0.08, 0.10, CAM_W + 0.08, 0, by, CAM_Z); // string courses
  // belfry openings (warm-lit recesses on all four faces)
  const BELF_Y = 3.40;
  for(const sz of [-1, 1]) box(basilica, GLOW, 0.36, 0.58, 0.05, 0, BELF_Y, CAM_Z + sz * (CAM_W / 2 + 0.01));
  for(const sx of [-1, 1]) box(basilica, GLOW, 0.05, 0.58, 0.36, sx * (CAM_W / 2 + 0.01), BELF_Y, CAM_Z);
  box(basilica, TRAV_D, CAM_W + 0.18, 0.14, CAM_W + 0.18, 0, 3.99, CAM_Z); // campanile cornice
  const camDome = eggDome(0.52, 0.86, ROOF, 12); camDome.position.set(0, 4.06, CAM_Z); basilica.add(camDome); // apex 4.92
  { const b = solid(new THREE.SphereGeometry(0.055, 8, 6), GOLD); b.position.set(0, 5.00, CAM_Z); basilica.add(b); }
  cyl(basilica, GOLD, 0.016, 0.016, 0.18, 6, 0, 5.10, CAM_Z);             // tallest point (~5.2)

  // columned portico of three round arches across the front (+Z)
  const PF = D / 2, COLZ = PF + 0.42;                                     // body front face / portico line
  const COLX = [-0.95, -0.32, 0.32, 0.95];
  box(basilica, TRAV_S, W + 0.3, 0.10, 1.3, 0, 0.04, PF + 0.34);          // forecourt step
  box(basilica, TRAV_D, 2.5, 0.18, 1.0, 0, 0.13, PF + 0.30);             // portico podium
  for(const cx of COLX){
    box(basilica, TRAV_D, 0.22, 0.10, 0.22, cx, 0.27, COLZ);             // column base
    cyl(basilica, TRAV,   0.10, 0.11, 1.00, 10, cx, 0.77, COLZ);         // shaft (0.27 → 1.27)
    box(basilica, TRAV_D, 0.24, 0.10, 0.24, cx, 1.31, COLZ);            // capital
  }
  for(let i = 0; i < 3; i++){ const a = COLX[i], b = COLX[i + 1]; archRing(basilica, (a + b) / 2, 1.36, COLZ, (b - a), 0.07, TRAV); }
  box(basilica, TRAV_D, 2.36, 0.16, 0.34, 0, 1.66, COLZ);                // entablature
  box(basilica, TRAV,   2.42, 0.12, 0.40, 0, 1.78, COLZ);                // parapet / attic
  for(const cx of COLX) { const u = solid(new THREE.SphereGeometry(0.06, 8, 6), TRAV); u.position.set(cx, 1.90, COLZ); basilica.add(u); } // parapet urns

  const BS = 1.5;                                                        // real-feel: 83 m dome crowning the hill
  basilica.scale.setScalar(BS);
  placeFacing(basilica, sacDir, ndDir, 0);                               // +Z (portico) faces downhill toward the city
  planetGroup.add(bakeMerge(basilica));
  colliderAt(sacDir, ndDir, 0, 0, 1.35 * BS);                            // main body — portico columns stay strollable
  colliderAt(sacDir, ndDir, 0, CAM_Z * BS, 0.7 * BS);                    // campanile behind
  claim(sacDir, 2.5 * BS);

  // =====================================================================
  //  2) THE MONUMENTAL CASCADE — stepped terraces down the hillside
  //     (downhill = from Sacré-Cœur toward Notre-Dame, mostly south)
  // =====================================================================
  const SAC = LANDMARKS.sacrecoeur, ND = LANDMARKS.notredame;
  let dh_e = ND.e - SAC.e, dh_n = ND.n - SAC.n; const HL = Math.hypot(dh_e, dh_n); dh_e /= HL; dh_n /= HL;
  const ph_e = -dh_n, ph_n = dh_e;                                       // perpendicular (cross-slope)

  const cascade = new THREE.Group();
  const STEPS = 8, M0 = 210, M1 = 900;
  for(let i = 0; i < STEPS; i++){
    const m = M0 + (M1 - M0) * (i / (STEPS - 1));
    const e = SAC.e + dh_e * m, n = SAC.n + dh_n * m;
    const here = parisToDir(e, n);
    const downhill = parisToDir(e + dh_e * 80, n + dh_n * 80);           // facing further down the slope
    const terr = new THREE.Group();
    box(terr, COBBLE,   2.2, 0.16, 0.7, 0, 0, 0);                        // landing slab
    box(terr, COBBLE_D, 2.32, 0.10, 0.12, 0, 0.06, 0.33);               // downhill kerb
    for(let s = 0; s < 3; s++) box(terr, COBBLE, 2.0, 0.10, 0.16, 0, -0.05 - s * 0.10, 0.42 + s * 0.16); // front steps
    for(const sx of [-1, 1]) box(terr, COBBLE_D, 0.14, 0.30, 0.72, sx * 1.05, 0.13, 0); // cheek walls
    if(i % 2 === 0) for(const sx of [-1, 1]){ const p = box(terr, COBBLE_D, 0.12, 0.34, 0.12, sx * 1.05, 0.30, -0.18); p.castShadow = true; } // balustrade posts
    placeFacing(terr, here, downhill, 0);
    cascade.add(terr);
  }
  planetGroup.add(bakeMerge(cascade));
  for(const m of [400, 650]) claim(parisToDir(SAC.e + dh_e * m, SAC.n + dh_n * m), 1.6);

  // =====================================================================
  //  3) PLACE DU TERTRE — little cobbled artists' square beside the church
  // =====================================================================
  const WOOD   = toon('#7a5a3c');
  const CANVAS = toon('#f4efe2');
  const FAB    = ['#d9534f', '#e0a93b', '#4f9bd9', '#5cae6a', '#cf7bb0'];
  const paint  = [toon('#5a86c0'), toon('#c25b5b'), toon('#6fae5a'), toon('#d9b24a')];

  function buildEasel(){
    const g = new THREE.Group();
    const lh = 0.92;
    for(const sx of [-1, 1]){ const l = cyl(g, WOOD, 0.018, 0.024, lh, 5, sx * 0.15, lh / 2, 0.05); l.rotation.x = -0.10; l.rotation.z = sx * 0.12; } // front legs
    { const l = cyl(g, WOOD, 0.018, 0.024, lh, 5, 0, lh / 2, -0.16); l.rotation.x = 0.34; }                                                          // rear leg
    box(g, WOOD, 0.34, 0.03, 0.03, 0, 0.44, 0.03);                       // ledge
    const board = box(g, CANVAS, 0.42, 0.50, 0.03, 0, 0.72, 0.06); board.rotation.x = -0.16;
    const art = box(g, pick(paint), 0.30, 0.36, 0.012, 0, 0.74, 0.08);  art.rotation.x = -0.16;
    return g;
  }
  function buildParasol(){
    const g = new THREE.Group();
    cyl(g, toon('#6b6b6b'), 0.022, 0.022, 1.45, 6, 0, 0.72, 0);          // pole
    const canopy = solid(new THREE.ConeGeometry(0.72, 0.40, 8), toon(pick(FAB))); canopy.position.y = 1.55; g.add(canopy);
    cyl(g, toon('#5a5a5a'), 0.02, 0.02, 0.12, 6, 0, 1.80, 0);            // finial
    return g;
  }

  const TE = [SAC.e + ph_e * 250 - dh_e * 70, SAC.n + ph_n * 250 - dh_n * 70];
  const tDir = parisToDir(TE[0], TE[1]);
  const tertre = new THREE.Group();
  ground(tertre, new THREE.CylinderGeometry(1.5, 1.5, 0.10, 22), COBBLE);
  const ring = ground(tertre, new THREE.TorusGeometry(1.42, 0.07, 6, 30), COBBLE_D); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05;
  for(let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2 + 0.5; const e = buildEasel(); e.position.set(Math.cos(a) * 0.85, 0.05, Math.sin(a) * 0.85); e.rotation.y = -a + 0.6; tertre.add(e); }
  for(let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2 + 1.7; const p = buildParasol(); p.position.set(Math.cos(a) * 1.05, 0.05, Math.sin(a) * 1.05); tertre.add(p); }
  placeOnSurface(tertre, tDir, 0, rand(0, 6.28));
  planetGroup.add(bakeMerge(tertre));
  claim(tDir, 1.6);

  // =====================================================================
  //  4) LE MOULIN ROUGE — red cabaret block + rooftop red windmill
  // =====================================================================
  const RED   = toon('#c0392b');
  const RED_D = toon('#9c2d22');
  const DARK  = toon('#3a2420');
  const BULB  = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 1.0 });
  const WIN   = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.85 });
  const mrDir = landmarkDir('moulinrouge');

  const CREAM = toon('#f1e7d2');
  const mr = new THREE.Group();
  box(mr, RED_D, 2.30, 0.16, 1.80, 0, 0.08, 0);                          // socle
  box(mr, RED,   2.20, 1.42, 1.70, 0, 0.87, 0);                          // main block (0.16 → 1.58)
  box(mr, RED_D, 2.30, 0.10, 1.80, 0, 1.58, 0);                          // cornice
  box(mr, RED,   1.40, 0.70, 1.20, 0, 1.93, -0.12);                      // upper roof block (mill plinth)
  box(mr, RED_D, 1.50, 0.08, 1.30, 0, 2.30, -0.12);                      // plinth cap
  // cream marquee band across the front with dark "MOULIN ROUGE" letter blocks
  box(mr, CREAM, 2.06, 0.30, 0.06, 0, 1.34, 0.88);
  for(let i = 0; i < 11; i++){ if(i === 5) continue;                     // word gap
    box(mr, DARK, 0.09, 0.14 + 0.02 * (i % 3 === 0), 0.02, -0.85 + i * 0.17, 1.34, 0.92); }
  // entrance: dark double door + red canopy on posts
  box(mr, DARK, 0.56, 0.62, 0.04, 0, 0.47, 0.86);
  box(mr, RED_D, 0.92, 0.08, 0.62, 0, 0.90, 1.10);                       // canopy
  for(const sx of [-1, 1]) cyl(mr, DARK, 0.02, 0.025, 0.74, 6, sx * 0.4, 0.53, 1.36);
  // warm windows: one row on the front + two rows down each side + the back
  for(let i = -2; i <= 2; i++){ if(i === 0) continue; box(mr, WIN, 0.18, 0.30, 0.04, i * 0.42, 0.62, 0.86); }
  for(const sx of [-1, 1]) for(const fy of [0.55, 1.05]) for(let i = -1; i <= 1; i++)
    box(mr, WIN, 0.04, 0.28, 0.20, sx * 1.11, fy, i * 0.5);
  for(const fy of [0.55, 1.05]) for(let i = -2; i <= 2; i++)
    box(mr, WIN, 0.18, 0.28, 0.04, i * 0.42, fy, -0.86);
  // marquee bulbs along the cornice
  for(let i = -4; i <= 4; i++){ const b = solid(new THREE.SphereGeometry(0.04, 6, 5), BULB); b.position.set(i * 0.255, 1.64, 0.9); mr.add(b); }

  // rooftop windmill: small drum + conical cap behind, hub + 4 latticed sails in front
  const MILL_Y = 2.28, MILL_Z = 0.36;
  cyl(mr, RED,   0.30, 0.36, 0.70, 12, 0, MILL_Y + 0.35, MILL_Z - 0.50);          // mill drum
  { const cap = solid(new THREE.ConeGeometry(0.40, 0.44, 12), RED_D); cap.position.set(0, MILL_Y + 0.92, MILL_Z - 0.50); mr.add(cap); }
  // sail wheel — built front-facing (sails in the XY plane), then tilted up a touch
  const wheel = new THREE.Group();
  { const hub = solid(new THREE.CylinderGeometry(0.13, 0.13, 0.20, 12), DARK); hub.rotation.x = Math.PI / 2; wheel.add(hub); }
  for(let i = 0; i < 4; i++){
    const arm = new THREE.Group();
    box(arm, RED,   0.05, 1.05, 0.05, 0,    0.55, 0);                     // inner spar (radial)
    box(arm, RED,   0.04, 1.00, 0.04, 0.22, 0.55, 0);                     // outer sail edge bar
    for(let s = 0; s < 6; s++) box(arm, RED_D, 0.24, 0.03, 0.03, 0.11, 0.20 + s * 0.155, 0); // lattice rungs
    arm.rotation.z = i * Math.PI / 2 + Math.PI / 4;                       // splay into an X / saltire
    wheel.add(arm);
  }
  wheel.position.set(0, MILL_Y + 0.46, MILL_Z + 0.04);
  wheel.rotation.x = -0.16;                                              // slight upward tilt (static)
  mr.add(wheel);
  // a few warm bulbs outlining the sails' tips
  for(let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4; const b = solid(new THREE.SphereGeometry(0.05, 6, 5), BULB); b.position.set(Math.sin(a) * 1.02, MILL_Y + 0.46 + Math.cos(a) * 1.02, MILL_Z + 0.16); mr.add(b); }

  placeFacing(mr, mrDir, ndDir, 0);                                      // windmill front faces downhill toward the city
  planetGroup.add(bakeMerge(mr));
  addCollider(mrDir, 1.25);
  claim(mrDir, 1.7);
}
