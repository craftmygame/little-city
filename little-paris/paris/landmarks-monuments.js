// =====================================================================
//  paris/landmarks-monuments.js — THE GREAT MONUMENTS OF PARIS
// ---------------------------------------------------------------------
//  Six chunky, cel-shaded landmarks scattered across the tiny planet,
//  each built local (base at y=0, +Y up, centred at origin, +Z = front),
//  oriented with the ctx surface helpers, then baked into a few merged
//  meshes for perf. Pale Paris limestone (#cdbd9c) unless noted.
//
//   1) LOUVRE       — long U-shaped palace round the Cour Napoléon, corner
//                     pavilions with steep dark mansards + the glass Pyramid.
//   2) INVALIDES    — long esplanade front + the golden ribbed Dôme des
//                     Invalides (drum, gold dome, lantern, gold spire).
//   3) PANTHÉON     — neoclassical temple: columned portico + pediment in
//                     front, columned drum + dome behind.
//   4) OPÉRA GARNIER— ornate Beaux-Arts front (arched loggia, paired
//                     columns, frieze), low verdigris dome + pediment + gold.
//   5) MONTPARNASSE — a lone dark glass skyscraper, ~7 units, floor banding.
//   6) MADELEINE    — a Greek temple: columned peristyle, low roof, pediment.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, placeFacing,
          landmarkDir, addCollider, claim } = ctx;
  const UP = new THREE.Vector3(0, 1, 0);

  // a collider at a LOCAL (x,z) offset from a placed landmark (+Z toward faceDir)
  function colliderAt(dir, faceDir, x, z, r){
    const up = dir.clone().normalize();
    const fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up)).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const p = up.clone().multiplyScalar(ctx.groundR(up)).addScaledVector(right, x).addScaledVector(fwd, z);
    addCollider(p.normalize(), r);
  }

  // ---- low-poly mesh helpers (group-first, faceted, shadowed) ---------
  const solid = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z, rotY){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function cyl(g, mat, rt, rb, h, seg, x, y, z, rotY){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function cone(g, mat, r, h, seg, x, y, z, rotY){
    const m = solid(new THREE.ConeGeometry(r, h, seg || 4), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function ground(g, geo, mat){ const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = false; m.receiveShadow = true; g.add(m); return m; }
  // a square-section bar stretched between two points (lattice / ribs)
  function strut(g, a, b, w, mat){
    const d = b.clone().sub(a); const len = d.length(); if(len < 1e-4) return;
    const m = solid(new THREE.BoxGeometry(w, len, w), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len)); g.add(m); return m;
  }
  // a classical column: base + slightly tapered shaft + capital + abacus
  function column(g, shaftMat, capMat, x, z, h, r){
    cyl(g, capMat,   r * 1.4,  r * 1.6, h * 0.06, 8, x, h * 0.03, z);   // base
    cyl(g, shaftMat, r * 0.84, r,       h * 0.84, 8, x, h * 0.50, z);   // shaft
    cyl(g, capMat,   r * 1.25, r * 0.9, h * 0.08, 8, x, h * 0.90, z);   // capital
    box(g, capMat,   r * 2.7,  h * 0.05, r * 2.7, x, h * 0.96, z);      // abacus
  }
  // a triangular pediment (extruded triangle, base at y=0 local, front +Z)
  function pediment(g, mat, width, height, depth, x, y, z, rotY){
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(0, height); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    const m = solid(geo, mat); m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  // rows of recessed window boxes along an axis
  function winRowX(g, mat, x0, x1, z, n, ys, ww, wh){
    for(let i = 0; i < n; i++){ const x = x0 + (x1 - x0) * ((i + 0.5) / n);
      for(const y of ys) box(g, mat, ww, wh, 0.06, x, y, z); }
  }
  function winRowZ(g, mat, z0, z1, x, n, ys, ww, wh){
    for(let i = 0; i < n; i++){ const z = z0 + (z1 - z0) * ((i + 0.5) / n);
      for(const y of ys) box(g, mat, 0.06, wh, ww, x, y, z); }
  }

  // ---- shared materials -----------------------------------------------
  const STONE    = toon('#cdbd9c');                                   // pale Paris limestone
  const STONE_DK = toon('#b2a07e');                                   // shaded stone / base course
  const STONE_LT = toon('#dccdb0');                                   // highlit stone / attic
  const CORNICE  = toon('#c4b390');                                   // entablature / cornices
  const ROOF_DK  = toon('#34363d');                                   // mansard slate
  const ROOF_DK2 = toon('#45484f');                                   // lighter roof / caps
  const WIN      = toon('#515a62');                                   // recessed window glass
  const GLASS    = toon('#bfe3e0', { transparent: true, opacity: 0.6 }); // the Pyramid glass
  const FRAME    = toon('#8f9699');                                   // pyramid edge framework (metal)
  const WATER    = toon('#6f9fb0');
  const GOLD     = toon('#e8c14a', { emissive: '#e8c14a', emissiveIntensity: 0.25 }); // the Dôme gold
  const GOLD_BR  = toon('#f3d77e', { emissive: '#c69a2e', emissiveIntensity: 0.4 });  // ribs / statuary / finials
  const VERD     = toon('#5a8a78');                                   // Opéra verdigris dome
  const DOMEST   = toon('#ccc7b6');                                   // Panthéon dome stone (cool)
  const DARKGLS  = toon('#3a3f47');                                   // Montparnasse glass
  const BAND     = toon('#4b525c');                                   // Montparnasse floor banding

  // =====================================================================
  //  1) THE LOUVRE — a long, low U-shaped palace round the Cour Napoléon.
  //  Three wings (back + two sides) open toward +Z (faces the Tuileries),
  //  corner/centre pavilions with steep dark mansard roofs, classical
  //  facades, and the glass Pyramid + satellites in the courtyard.
  // =====================================================================
  function louvreWing(g, cx, cz, w, d, h){
    box(g, STONE_DK, w + 0.14, 0.16, d + 0.14, cx, 0.08, cz);   // base course
    box(g, STONE,    w,        h,    d,        cx, h / 2, cz);   // main wall
    box(g, CORNICE,  w + 0.16, 0.14, d + 0.16, cx, h + 0.02, cz); // cornice
    box(g, ROOF_DK2, w,        0.18, d,        cx, h + 0.18, cz); // low roof
  }
  // a corner pavilion: taller block + steep square mansard + finial
  function pavilion(g, cx, cz, s, h){
    box(g, STONE_DK, s + 0.16, 0.18, s + 0.16, cx, 0.09, cz);
    box(g, STONE,    s,        h,    s,        cx, h / 2, cz);
    box(g, CORNICE,  s + 0.18, 0.16, s + 0.18, cx, h + 0.02, cz);
    const rb = s * 0.74, rh = 0.7;                              // steep mansard (square frustum)
    cyl(g, ROOF_DK, rb * 0.5, rb, rh, 4, cx, h + 0.12 + rh / 2, cz, Math.PI / 4);
    box(g, ROOF_DK2, rb * 0.74, 0.08, rb * 0.74, cx, h + 0.12 + rh, cz, Math.PI / 4);
    cone(g, GOLD_BR, 0.05, 0.22, 6, cx, h + 0.12 + rh + 0.14, cz); // gilt finial
  }
  function buildLouvre(){
    const g = new THREE.Group();
    const hWing = 1.0;
    // back wing (along X, at -Z) and the two side wings (along Z, at ±X)
    // — courtyard widened so the player can stroll round the Pyramid inside
    louvreWing(g, 0,   -1.9, 5.2, 0.85, hWing);
    louvreWing(g, -2.4, -0.2, 0.85, 3.7, hWing);
    louvreWing(g,  2.4, -0.2, 0.85, 3.7, hWing);
    // courtyard-facing window rows (two storeys)
    winRowX(g, WIN, -2.3, 2.3, -1.45, 12, [0.55, 0.85], 0.14, 0.22);
    winRowZ(g, WIN, -1.7, 1.3, -1.92, 8, [0.55, 0.85], 0.14, 0.22);
    winRowZ(g, WIN, -1.7, 1.3,  1.92, 8, [0.55, 0.85], 0.14, 0.22);
    // pavilions: back corners, central (Pavillon Sully, bigger), front ends
    pavilion(g, -2.6, -1.9, 1.05, 1.35);
    pavilion(g,  2.6, -1.9, 1.05, 1.35);
    pavilion(g,  0.0, -1.9, 1.25, 1.55);
    pavilion(g, -2.4,  1.55, 1.0, 1.3);
    pavilion(g,  2.4,  1.55, 1.0, 1.3);

    // ---- the glass Pyramid (in the courtyard, ~1.4 units) -------------
    const pr = 0.95, ph = 1.4;                                   // circumradius, height
    cone(g, GLASS, pr, ph, 4, 0, ph / 2, -0.1);                  // translucent glass pyramid
    const corners = [[0, pr], [pr, 0], [0, -pr], [-pr, 0]].map(c => new THREE.Vector3(c[0], 0, c[1] - 0.1));
    const apex = new THREE.Vector3(0, ph, -0.1);
    for(const c of corners) strut(g, c, apex, 0.035, FRAME);     // hip edges
    for(let i = 0; i < 4; i++) strut(g, corners[i], corners[(i + 1) % 4], 0.03, FRAME); // base rim
    for(const f of [0.34, 0.66]){                                // horizontal lattice rings
      const ring = corners.map(c => c.clone().multiplyScalar(1 - f).setY(ph * f));
      for(let i = 0; i < 4; i++) strut(g, ring[i], ring[(i + 1) % 4], 0.022, FRAME);
    }
    // three small companion pyramids
    for(const p of [[-1.5, 0.9], [1.6, 0.8], [-0.2, 1.9]]){
      cone(g, GLASS, 0.3, 0.42, 4, p[0], 0.21, p[1]);
      const sc = [[0, 0.3], [0.3, 0], [0, -0.3], [-0.3, 0]].map(c => new THREE.Vector3(p[0] + c[0], 0, p[1] + c[1]));
      const sa = new THREE.Vector3(p[0], 0.42, p[1]);
      for(const c of sc) strut(g, c, sa, 0.018, FRAME);
    }
    // triangular fountain basins flanking the pyramid
    for(const p of [[-1.5, -0.6], [1.5, -0.6], [0, 1.0]]){
      cyl(g, STONE_DK, 0.46, 0.46, 0.12, 3, p[0], 0.06, p[1], 0.5);
      cyl(g, WATER,    0.37, 0.37, 0.06, 3, p[0], 0.13, p[1], 0.5);
    }
    return g;
  }
  {
    const dir = landmarkDir('louvre');
    const face = landmarkDir('tuileries');
    const palace = buildLouvre();
    const S = 1.25;                      // real-feel: breadth is the Louvre's grandeur
    palace.scale.setScalar(S);
    placeFacing(palace, dir, face, 0);   // open courtyard faces the Tuileries
    planetGroup.add(ctx.bakeMerge(palace));
    // colliders trace the three wings + pavilions + the Pyramid; the front
    // opening and the courtyard corridors stay walkable
    for(const x of [-1.7, 0, 1.7]) colliderAt(dir, face, x * S, -1.9 * S, 0.8 * S);   // back wing
    for(const sx of [-1, 1]){
      colliderAt(dir, face, sx * 2.4 * S, -1.0 * S, 0.7 * S);              // side wings
      colliderAt(dir, face, sx * 2.4 * S,  0.3 * S, 0.7 * S);
      colliderAt(dir, face, sx * 2.4 * S,  1.55 * S, 0.7 * S);             // front pavilions
    }
    colliderAt(dir, face, 0, -0.1 * S, 0.8 * S);                           // the glass Pyramid
    claim(dir, 3.2 * S);
  }

  // =====================================================================
  //  2) LES INVALIDES — a long esplanade front, and behind it the golden
  //  Dôme des Invalides (drum + ribbed GOLD dome + lantern + gold spire,
  //  ~4.5 units). The gold dome is the star.
  // =====================================================================
  function buildInvalides(){
    const g = new THREE.Group();
    // ---- long front building facing the esplanade (+Z) ---------------
    const fw = 3.8, fd = 0.95, fh = 1.0, fz = 1.5;
    box(g, STONE_DK, fw + 0.16, 0.16, fd + 0.16, 0, 0.08, fz);
    box(g, STONE,    fw,        fh,   fd,        0, fh / 2, fz);
    box(g, CORNICE,  fw + 0.18, 0.14, fd + 0.18, 0, fh + 0.02, fz);
    box(g, ROOF_DK2, fw,        0.16, fd,        0, fh + 0.16, fz);
    winRowX(g, WIN, -1.7, 1.7, fz + fd / 2 + 0.01, 11, [0.4, 0.72], 0.16, 0.22);
    // central entrance pavilion with a small arched bay + pediment
    box(g, STONE,   0.9, fh + 0.35, fd + 0.18, 0, (fh + 0.35) / 2, fz);
    box(g, WIN,     0.42, 0.7, 0.06, 0, 0.55, fz + fd / 2 + 0.1);
    pediment(g, CORNICE, 1.1, 0.32, 0.2, 0, fh + 0.35, fz + fd / 2 + 0.02);
    // end pavilions
    for(const sx of [-1, 1]) box(g, STONE, 0.8, fh + 0.22, fd + 0.14, sx * (fw / 2 - 0.1), (fh + 0.22) / 2, fz);

    // ---- the domed church behind (the star) --------------------------
    const cz = -0.85;
    box(g, STONE_DK, 1.85, 0.16, 1.85, 0, 0.08, cz);             // base
    box(g, STONE,    1.7,  1.25, 1.7,  0, 0.7, cz);              // church body
    box(g, CORNICE,  1.82, 0.14, 1.82, 0, 1.32, cz);
    // small corner pediments + porch
    pediment(g, STONE_LT, 1.0, 0.3, 0.18, 0, 1.0, cz + 0.86);
    for(let i = 0; i < 6; i++) column(g, STONE, STONE_LT, -0.55 + i * 0.22, cz + 0.9, 0.95, 0.06);

    // drum
    const drumY = 1.46, drumH = 0.85, drumR = 0.72;
    cyl(g, STONE, drumR, drumR, drumH, 16, 0, drumY + drumH / 2, cz);
    for(let i = 0; i < 12; i++){                                 // peristyle pilasters + windows
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * drumR, z = cz + Math.sin(a) * drumR;
      box(g, STONE_LT, 0.1, drumH * 0.82, 0.1, x, drumY + drumH / 2, z, -a);
      box(g, WIN, 0.14, 0.34, 0.05, Math.cos(a) * (drumR - 0.04), drumY + drumH * 0.45, cz + Math.sin(a) * (drumR - 0.04), -a);
    }
    cyl(g, CORNICE, drumR + 0.06, drumR + 0.06, 0.12, 16, 0, drumY + drumH + 0.05, cz);

    // ---- ribbed GOLD dome --------------------------------------------
    const domeY = drumY + drumH + 0.11;
    const prof = [[0.72, 0], [0.74, 0.18], [0.70, 0.42], [0.60, 0.66], [0.46, 0.88], [0.28, 1.06], [0.10, 1.2], [0.0, 1.26]]
      .map(p => new THREE.Vector2(p[0], p[1]));
    const lathe = new THREE.LatheGeometry(prof, 14);
    const dome = solid(lathe, GOLD); dome.position.set(0, domeY, cz); g.add(dome);
    for(let i = 0; i < 14; i++){                                 // raised gold ribs
      const a = (i / 14) * Math.PI * 2;
      const baseP = new THREE.Vector3(Math.cos(a) * 0.71, domeY, cz + Math.sin(a) * 0.71);
      const topP  = new THREE.Vector3(Math.cos(a) * 0.07, domeY + 1.18, cz + Math.sin(a) * 0.07);
      strut(g, baseP, topP, 0.04, GOLD_BR);
    }
    // lantern (cupola) + spire
    const lanY = domeY + 1.26;
    cyl(g, GOLD_BR, 0.2, 0.22, 0.12, 12, 0, lanY + 0.06, cz);
    cyl(g, GOLD,    0.16, 0.16, 0.34, 8, 0, lanY + 0.29, cz);
    for(let i = 0; i < 8; i++){ const a = (i / 8) * Math.PI * 2; box(g, GOLD_BR, 0.04, 0.34, 0.04, Math.cos(a) * 0.16, lanY + 0.29, cz + Math.sin(a) * 0.16); }
    cone(g, GOLD_BR, 0.2, 0.2, 8, 0, lanY + 0.56, cz);
    cyl(g, GOLD,    0.02, 0.05, 0.55, 6, 0, lanY + 0.93, cz);    // thin gold spire
    const finial = solid(new THREE.SphereGeometry(0.07, 8, 6), GOLD_BR); finial.position.set(0, lanY + 1.24, cz); g.add(finial);
    return g;
  }
  {
    const dir = landmarkDir('invalides');
    const face = landmarkDir('concorde');
    const inv = buildInvalides();
    const S = 1.45;                       // real-feel: the gold dome is 107 m
    inv.scale.setScalar(S);
    placeFacing(inv, dir, face, 0);       // front toward the esplanade / Seine
    planetGroup.add(ctx.bakeMerge(inv));
    // front range + domed church colliders — the court between them is walkable
    for(const x of [-1.4, 0, 1.4]) colliderAt(dir, face, x * S, 1.5 * S, 0.55 * S);
    colliderAt(dir, face, 0, -0.85 * S, 1.0 * S);
    claim(dir, 2.6 * S);
  }

  // =====================================================================
  //  3) PANTHÉON — neoclassical temple: a wide columned portico + pediment
  //  in front, a big columned drum + dome behind (~4 units).
  // =====================================================================
  function buildPantheon(){
    const g = new THREE.Group();
    // main body block
    box(g, STONE_DK, 2.4, 0.16, 2.0, 0, 0.08, -0.1);
    box(g, STONE,    2.2, 1.6,  1.8, 0, 0.8, -0.1);
    box(g, CORNICE,  2.34, 0.16, 1.94, 0, 1.62, -0.1);
    winRowZ(g, WIN, -0.7, 0.6, 1.11, 4, [0.7, 1.15], 0.18, 0.26);

    // ---- front portico: stepped stylobate + columns + pediment -------
    box(g, STONE_DK, 3.0, 0.12, 0.9, 0, 0.06, 1.5);
    box(g, STONE_DK, 2.8, 0.12, 0.7, 0, 0.18, 1.55);
    const colH = 1.5;
    for(let i = 0; i < 6; i++) column(g, STONE, STONE_LT, -1.35 + i * 0.54, 1.55, colH, 0.11);
    for(const sz of [1.15, 1.9]) for(const sx of [-1, 1]) column(g, STONE, STONE_LT, sx * 1.35, sz, colH, 0.11);
    box(g, CORNICE, 3.0, 0.2, 0.95, 0, colH + 0.13, 1.5);        // entablature
    pediment(g, STONE_LT, 3.0, 0.62, 0.55, 0, colH + 0.23, 1.5); // pediment
    box(g, STONE_DK, 2.2, 0.42, 0.05, 0, colH + 0.42, 1.78);     // tympanum relief hint

    // ---- drum + colonnade + dome behind ------------------------------
    const drY = 1.7, drH = 0.7, drR = 0.92;
    cyl(g, STONE, drR, drR, drH, 20, 0, drY + drH / 2, -0.1);
    const colRing = new THREE.Group(); colRing.position.y = drY; g.add(colRing);
    for(let i = 0; i < 18; i++){                                 // ring of columns (peristyle) on the drum
      const a = (i / 18) * Math.PI * 2;
      column(colRing, STONE_LT, STONE, Math.cos(a) * (drR + 0.12), -0.1 + Math.sin(a) * (drR + 0.12), drH, 0.05);
    }
    // balustrade ring atop the colonnade
    cyl(g, CORNICE, drR + 0.2, drR + 0.2, 0.1, 20, 0, drY + drH + 0.05, -0.1);

    const domeY = drY + drH + 0.1;
    const dprof = [[0.92, 0], [0.9, 0.28], [0.8, 0.56], [0.62, 0.82], [0.4, 1.02], [0.16, 1.16], [0.0, 1.2]]
      .map(p => new THREE.Vector2(p[0], p[1]));
    const dome = solid(new THREE.LatheGeometry(dprof, 16), DOMEST); dome.position.set(0, domeY, -0.1); g.add(dome);
    for(let i = 0; i < 16; i++){                                 // subtle stone ribs
      const a = (i / 16) * Math.PI * 2;
      strut(g, new THREE.Vector3(Math.cos(a) * 0.9, domeY, -0.1 + Math.sin(a) * 0.9),
               new THREE.Vector3(Math.cos(a) * 0.1, domeY + 1.12, -0.1 + Math.sin(a) * 0.1), 0.035, STONE_DK);
    }
    cyl(g, STONE_LT, 0.2, 0.22, 0.34, 10, 0, domeY + 1.36, -0.1); // lantern
    cone(g, CORNICE, 0.22, 0.2, 10, 0, domeY + 1.63, -0.1);
    cone(g, GOLD_BR, 0.05, 0.2, 6, 0, domeY + 1.82, -0.1);        // gilt cross/finial
    return g;
  }
  {
    const dir = landmarkDir('pantheon');
    const face = landmarkDir('notredame');
    const pan = buildPantheon();
    const S = 1.5;                       // real-feel: 83 m dome over the Latin Quarter
    pan.scale.setScalar(S);
    placeFacing(pan, dir, face, 0);      // portico faces toward the city
    planetGroup.add(ctx.bakeMerge(pan));
    colliderAt(dir, face, 0, -0.1 * S, 1.15 * S);   // main body + drum
    colliderAt(dir, face, 0, 1.55 * S, 0.75 * S);   // front portico
    claim(dir, 2.3 * S);
  }

  // =====================================================================
  //  4) OPÉRA GARNIER — ornate Beaux-Arts: arched loggia + paired columns
  //  + frieze on the front facade, a low verdigris dome + a triangular
  //  pediment, with hints of gold statuary at the roofline.
  // =====================================================================
  // a facade panel with a row of round-topped (arched) windows, extruded
  function arcadeWall(W, H, n, t, mat){
    const s = new THREE.Shape();
    const hw = W / 2;
    s.moveTo(-hw, 0); s.lineTo(-hw, H); s.lineTo(hw, H); s.lineTo(hw, 0); s.closePath();
    const cell = W / n, ow = cell * 0.56, sill = 0.18, spring = H * 0.6;
    const holes = [];
    for(let i = 0; i < n; i++){
      const cx = -hw + cell * (i + 0.5);
      const p = new THREE.Path();
      p.moveTo(cx - ow / 2, sill); p.lineTo(cx - ow / 2, spring);
      p.absarc(cx, spring, ow / 2, Math.PI, 0, true);
      p.lineTo(cx + ow / 2, sill); p.closePath();
      holes.push(p);
    }
    s.holes = holes;
    const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 });
    geo.translate(0, 0, -t / 2);
    return solid(geo, mat);
  }
  function buildOpera(){
    const g = new THREE.Group();
    const W = 2.7, D = 1.5, h1 = 0.95, fz = D / 2;
    box(g, STONE_DK, W + 0.18, 0.16, D + 0.18, 0, 0.08, 0);      // base
    box(g, STONE,    W,        1.7,  D,        0, 0.85, 0);      // main mass

    // ground-level arched loggia across the front
    box(g, WIN, W - 0.2, h1, 0.05, 0, h1 / 2 + 0.1, fz - 0.06);  // dark recess behind arches
    const arc = arcadeWall(W, h1 + 0.2, 7, 0.18, STONE_LT); arc.position.set(0, 0.1, fz); g.add(arc);
    box(g, CORNICE, W + 0.04, 0.12, 0.3, 0, h1 + 0.32, fz);      // balcony ledge

    // upper level: paired columns (on the balcony ledge) supporting a frieze
    const upY = h1 + 0.4, colH = 0.78;
    const upper = new THREE.Group(); upper.position.y = upY; g.add(upper);
    for(let p = 0; p < 5; p++){
      const px = -1.0 + p * 0.5;
      for(const o of [-0.07, 0.07]) column(upper, STONE_LT, GOLD_BR, px + o, fz - 0.02, colH, 0.05);
    }
    box(g, CORNICE,  W + 0.06, 0.22, 0.34, 0, upY + colH + 0.02, fz - 0.02); // frieze / entablature
    for(let i = 0; i < 9; i++) box(g, GOLD_BR, 0.12, 0.12, 0.05, -1.0 + i * 0.25, upY + colH + 0.02, fz + 0.12); // gilt frieze studs
    box(g, CORNICE,  W + 0.12, 0.14, D + 0.12, 0, 1.78, 0);      // main cornice

    // gold statuary clusters at the roofline corners
    for(const sx of [-1, 1]){
      box(g, GOLD_BR, 0.18, 0.42, 0.18, sx * (W / 2 - 0.1), 2.05, fz - 0.1);
      const head = solid(new THREE.IcosahedronGeometry(0.1, 0), GOLD_BR); head.position.set(sx * (W / 2 - 0.1), 2.34, fz - 0.1); g.add(head);
    }
    // front pediment over the centre
    pediment(g, CORNICE, 1.3, 0.42, 0.3, 0, 1.85, fz - 0.05);
    box(g, GOLD_BR, 0.5, 0.22, 0.05, 0, 1.96, fz + 0.06);        // gilded relief in the pediment

    // low verdigris dome (toward the rear) + a flatter coffer/flag block
    const dome = solid(new THREE.SphereGeometry(0.72, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), VERD);
    dome.scale.set(1, 0.62, 1); dome.position.set(0, 1.85, -0.35); g.add(dome);
    cyl(g, VERD, 0.74, 0.78, 0.18, 16, 0, 1.78, -0.35);          // dome drum
    cone(g, GOLD_BR, 0.12, 0.26, 8, 0, 2.36, -0.35);             // gilt apex
    // a raised stage-house block at the very back
    box(g, VERD, 1.4, 0.5, 0.7, 0, 2.1, -0.55);
    return g;
  }
  {
    const dir = landmarkDir('opera');
    const face = landmarkDir('palaisroyal');
    const op = buildOpera();
    op.scale.setScalar(1.55);                                // real-feel: the Palais Garnier fills its square
    placeFacing(op, dir, face, 0);                           // facade looks down the avenue de l'Opéra
    planetGroup.add(ctx.bakeMerge(op));
    colliderAt(dir, face, -1.23, 0, 1.5);                    // two circles hug the walls,
    colliderAt(dir, face,  1.23, 0, 1.5);                    // the parvis in front stays open
    claim(dir, 3.5);
  }

  // =====================================================================
  //  5) TOUR MONTPARNASSE — a lone dark modern skyscraper: a tall slim
  //  rounded-rectangle glass prism (~7 units) with subtle floor banding.
  //  Stark contrast to old Paris.
  // =====================================================================
  function roundedRect(w, d, r){
    const s = new THREE.Shape(); const hw = w / 2, hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd); s.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    s.lineTo(hw, hd - r);  s.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    s.lineTo(-hw + r, hd); s.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-hw, -hd + r); s.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function buildMontparnasse(){
    const g = new THREE.Group();
    const w = 1.25, d = 0.8, r = 0.2, H = 7.0;
    const geo = new THREE.ExtrudeGeometry(roundedRect(w, d, r), { depth: H, bevelEnabled: false, curveSegments: 4 });
    const tower = solid(geo, DARKGLS); tower.rotation.x = -Math.PI / 2; g.add(tower);
    box(g, ROOF_DK, w + 0.14, 0.2, d + 0.14, 0, 0.1, 0);        // plinth
    // subtle horizontal floor banding on the flat faces
    for(let y = 0.5; y < H - 0.35; y += 0.46){
      box(g, BAND, w - 2 * r + 0.02, 0.05, 0.03, 0, y,  d / 2 + 0.005);
      box(g, BAND, w - 2 * r + 0.02, 0.05, 0.03, 0, y, -d / 2 - 0.005);
      box(g, BAND, 0.03, 0.05, d - 2 * r + 0.02,  w / 2 + 0.005, y, 0);
      box(g, BAND, 0.03, 0.05, d - 2 * r + 0.02, -w / 2 - 0.005, y, 0);
    }
    box(g, ROOF_DK2, w * 0.92, 0.22, d * 0.92, 0, H + 0.06, 0); // rooftop plant
    cyl(g, ROOF_DK2, 0.02, 0.035, 0.7, 6, 0, H + 0.55, 0);      // mast
    return g;
  }
  {
    const dir = landmarkDir('montparnasse');
    const t = buildMontparnasse();
    t.scale.setScalar(1.75);             // real-feel: 210 m — a lone dark slab over the rooftops
    placeOnSurface(t, dir, 0, 0.4);
    planetGroup.add(ctx.bakeMerge(t));
    addCollider(dir, 1.35);
    claim(dir, 2.5);
  }

  // =====================================================================
  //  6) LA MADELEINE — a Greek temple: a solid rectangle ringed by tall
  //  Corinthian-ish columns, a low pitched roof, and a front pediment.
  // =====================================================================
  function buildMadeleine(){
    const g = new THREE.Group();
    const cw = 1.5, cd = 2.7, podH = 0.42, colH = 2.0;          // cella + podium + columns
    // stepped podium (stylobate)
    box(g, STONE_DK, cw + 1.0, 0.16, cd + 1.0, 0, 0.08, 0);
    box(g, STONE_DK, cw + 0.8, 0.14, cd + 0.8, 0, 0.22, 0);
    box(g, STONE,    cw + 0.6, podH - 0.3, cd + 0.6, 0, 0.36, 0);
    // cella (the solid rectangle inside)
    box(g, STONE,    cw, colH + 0.1, cd, 0, podH + (colH + 0.1) / 2, 0);
    winRowZ(g, WIN, -1.0, 1.0, cw / 2 + 0.01, 5, [podH + 0.7, podH + 1.4], 0.16, 0.3);

    // peristyle: tall columns round the rectangle, standing on the podium
    const xC = cw / 2 + 0.34, zC = cd / 2 + 0.34;
    const colsG = new THREE.Group(); colsG.position.y = podH; g.add(colsG);
    const nx = 4, nz = 7;
    for(let i = 0; i < nx; i++){ const x = -xC + (2 * xC) * (i / (nx - 1));
      column(colsG, STONE, STONE_LT, x,  zC, colH, 0.1);
      column(colsG, STONE, STONE_LT, x, -zC, colH, 0.1); }
    for(let j = 1; j < nz - 1; j++){ const z = -zC + (2 * zC) * (j / (nz - 1));
      column(colsG, STONE, STONE_LT,  xC, z, colH, 0.1);
      column(colsG, STONE, STONE_LT, -xC, z, colH, 0.1); }

    // entablature ring + low roof + front & back pediments
    const entY = podH + colH + 0.1;
    box(g, CORNICE, cw + 0.95, 0.24, cd + 0.95, 0, entY + 0.12, 0);
    box(g, STONE_LT, cw + 0.7, 0.18, cd + 0.7, 0, entY + 0.33, 0); // low roof slab
    pediment(g, STONE_LT, cw + 0.95, 0.5, cd * 0.0 + 0.4, 0, entY + 0.24, (cd + 0.95) / 2 - 0.2);
    pediment(g, STONE_LT, cw + 0.95, 0.5, 0.4, 0, entY + 0.24, -((cd + 0.95) / 2 - 0.2), Math.PI);
    box(g, STONE_DK, cw + 0.2, 0.34, 0.05, 0, entY + 0.34, (cd + 0.95) / 2 - 0.12); // front tympanum relief
    return g;
  }
  {
    const dir = landmarkDir('madeleine');
    const face = landmarkDir('concorde');
    const mad = buildMadeleine();
    const S = 1.3;                        // real-feel: a solid Greek temple above its steps
    mad.scale.setScalar(S);
    placeFacing(mad, dir, face, 0);       // pediment front faces toward Concorde
    planetGroup.add(ctx.bakeMerge(mad));
    colliderAt(dir, face, 0, -0.85 * S, 1.05 * S);   // two colliders trace the long temple
    colliderAt(dir, face, 0,  0.85 * S, 1.05 * S);
    claim(dir, 2.2 * S);
  }

  // =====================================================================
  //  7) HÔTEL DE VILLE — the neo-Renaissance city hall: a long stone range
  //  with a taller central clock pavilion and two corner pavilions, all
  //  under steep dark mansards with gilt finials, arched ground floor,
  //  dense window grid and a row of little roofline statues. Its parvis
  //  (streets.js lays the plaza) faces west toward the Louvre.
  // =====================================================================
  function buildHotelDeVille(){
    const g = new THREE.Group();
    const W = 3.4, D = 1.2, h = 1.35, fz = D / 2;
    box(g, STONE_DK, W + 0.18, 0.16, D + 0.18, 0, 0.08, 0);        // base course
    box(g, STONE,    W,        h,    D,        0, h / 2, 0);       // main range
    box(g, CORNICE,  W + 0.14, 0.12, D + 0.14, 0, h + 0.02, 0);    // cornice
    // arched ground-floor arcade + two storeys of windows
    const arcF = arcadeWall(W - 0.7, 0.62, 7, 0.1, STONE_LT); arcF.position.set(0, 0.16, fz + 0.02); g.add(arcF);
    winRowX(g, WIN, -1.5, 1.5, fz + 0.015, 9, [0.92, 1.2], 0.14, 0.2);
    winRowX(g, WIN, -1.5, 1.5, -fz - 0.015, 9, [0.55, 0.95], 0.14, 0.2);
    // steep dark mansard over the range
    const rangeRoof = solid(new THREE.CylinderGeometry(0, 0.62, 0.52, 4), ROOF_DK);
    rangeRoof.scale.set(W / 0.88, 1, D / 0.88); rangeRoof.rotation.y = Math.PI / 4;
    rangeRoof.position.y = h + 0.3; g.add(rangeRoof);
    // corner pavilions + taller central clock pavilion
    function hdvPavilion(cx, s, hh, clock){
      box(g, STONE,   s, hh, D + 0.16, cx, hh / 2, 0);
      box(g, CORNICE, s + 0.12, 0.12, D + 0.28, cx, hh + 0.02, 0);
      const pr = solid(new THREE.CylinderGeometry(0.12, s * 0.62, 0.62, 4), ROOF_DK);
      pr.rotation.y = Math.PI / 4; pr.position.set(cx, hh + 0.38, 0); g.add(pr);
      cone(g, GOLD_BR, 0.05, 0.2, 6, cx, hh + 0.78, 0);            // gilt finial
      if(clock){
        box(g, STONE_LT, 0.5, 0.4, 0.06, cx, hh + 0.16, fz + 0.1); // clock gable
        const face = solid(new THREE.CircleGeometry(0.13, 12), toon('#f4efdf'));
        face.position.set(cx, hh + 0.18, fz + 0.14); g.add(face);
        box(g, ROOF_DK, 0.04, 0.1, 0.01, cx, hh + 0.2, fz + 0.145); // clock hands
      }
    }
    hdvPavilion(-W / 2 + 0.35, 0.8, h + 0.32, false);
    hdvPavilion( W / 2 - 0.35, 0.8, h + 0.32, false);
    hdvPavilion(0, 0.95, h + 0.5, true);
    // roofline statues between the pavilions
    for(const sx of [-1, 1]) for(const px of [0.75, 1.15])
      cone(g, STONE_LT, 0.05, 0.2, 5, sx * px, h + 0.16, fz - 0.05);
    return g;
  }
  {
    const dir = landmarkDir('hoteldeville');
    const face = landmarkDir('louvre');
    const hdv = buildHotelDeVille();
    const S = 1.4;                        // real-feel: the city hall commands its parvis
    hdv.scale.setScalar(S);
    placeFacing(hdv, dir, face, 0);       // ...but turned so the facade fronts its parvis
    planetGroup.add(ctx.bakeMerge(hdv));
    for(const x of [-1.25, 0, 1.25]) colliderAt(dir, face, x * S, 0, 0.78 * S);
    claim(dir, 2.4 * S);
  }
}
