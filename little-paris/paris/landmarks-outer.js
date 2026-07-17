// =====================================================================
//  paris/landmarks-outer.js — GREATER-PARIS LANDMARKS (the far side)
// ---------------------------------------------------------------------
//  The map now wraps the whole globe: Notre-Dame at the front pole, the
//  outer ring of greater Paris at the back pole. These seven chunky,
//  cel-shaded "model-village" monuments fill the outer / back side of
//  the planet so the toy Paris reads all the way round.
//
//  Each model is built LOCAL (base at y=0, +Y up, centred at origin,
//  +Z = front), oriented with the ctx surface helpers, then baked into a
//  few merged meshes for perf. Same faceted toon idiom as the monuments.
//
//   1) LA DÉFENSE      — the Grande Arche (hollow marble cube) ringed by a
//                        cluster of blue-grey glass office towers. The only
//                        true skyline; sits at the very back of the globe.
//   2) STADE DE FRANCE — a big low elliptical concrete stadium with a dark
//                        tilted roof lip and a green pitch inside.
//   3) BOIS DE VINCENNES — the Château de Vincennes: a square keep with four
//                        turreted corners + a low curtain wall, and the dark
//                        glassy Lac Daumesnil beside it.
//   4) BOIS DE BOULOGNE  — a lake with a tiny wooded island + a little round
//                        classical temple folly (colonnade under a dome).
//   5) PÈRE-LACHAISE   — a stone entrance portal facing the city, behind it a
//                        field of mausolea/tombs, crosses, an obelisk, cypress.
//   6) BERCY (BnF)     — the Bibliothèque nationale: four L-shaped "open book"
//                        green-glass towers round a sunken wooden deck.
//   7) PLACE D'ITALIE  — a small modern square: a curved low block + a low
//                        circular plaza + a little red Chinatown paifang gate.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, placeFacing,
          landmarkDir, addCollider, claim, rand, randi, pick } = ctx;
  const UP = new THREE.Vector3(0, 1, 0);

  // ---- low-poly mesh helpers (group-first, faceted, shadowed) ---------
  const solid = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z, rotY){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function cyl(g, mat, rt, rb, h, seg, x, y, z, rotY, open){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function cone(g, mat, r, h, seg, x, y, z, rotY){
    const m = solid(new THREE.ConeGeometry(r, h, seg || 4), mat);
    m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  function disc(g, mat, r, h, seg, x, y, z){ return cyl(g, mat, r, r, h, seg || 24, x, y, z); }
  // a triangular pediment (extruded triangle, base at y=0 local, front +Z)
  function pediment(g, mat, width, height, depth, x, y, z, rotY){
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(0, height); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    const m = solid(geo, mat); m.position.set(x || 0, y || 0, z || 0); if(rotY) m.rotation.y = rotY; g.add(m); return m;
  }
  // derive a planet collider from a point LOCAL to a placed group
  const _v = new THREE.Vector3();
  function colAt(group, lx, lz, worldR){
    group.updateMatrixWorld(true);
    _v.set(lx, 0.3, lz).applyMatrix4(group.matrixWorld);
    addCollider(_v.clone().normalize(), worldR);
  }

  // ---- shared materials -----------------------------------------------
  const MARBLE   = toon('#e9e7e2');                                   // Grande Arche marble
  const MARBLE_DK= toon('#d4d2cb');                                   // recessed arch panels
  const GLASS_A  = toon('#7d93a6');                                   // office glass (blue-grey)
  const GLASS_B  = toon('#8fa6b8');
  const TBAND    = toon('#566472');                                   // tower floor banding
  const DARK     = toon('#3a3f47');                                   // plinths / caps / decks
  const CONCRETE = toon('#d8d8d2');                                   // stadium concrete
  const CONCR_DK = toon('#bcbcb4');                                   // stadium inner bowl
  const ROOFLIP  = toon('#5a5e66');                                   // stadium tilted roof lip
  const PITCH    = toon('#3f8a44');                                   // green pitch
  const STONE_P  = toon('#cfc3a6');                                   // pale castle / cemetery stone
  const STONE_PD = toon('#b7ab8d');                                   // shaded stone
  const STONE_LT = toon('#ddd2b6');                                   // highlit stone
  const ROOF_BL  = toon('#54606e');                                   // blue-grey conical roofs
  const WATER    = toon('#3f6b86', { transparent: true, opacity: 0.85 }); // glassy water
  const CYPRESS  = toon('#2f5236');                                   // cypress / dark conifers
  const TREE_GRN = toon('#3f7d44');                                   // island foliage
  const TRUNK    = toon('#6e553a');
  const GLASS_GR = toon('#8fb0a0');                                   // BnF green-tinted glass
  const GR_BAND  = toon('#5f7c6e');                                   // BnF floor banding
  const WOOD     = toon('#9c7b4f');                                   // BnF sunken deck
  const WOOD_DK  = toon('#7c6038');
  const PLAZA    = toon('#cfc8bd');                                   // Place d'Italie plaza
  const MODERN   = toon('#b9bec6');                                   // curved modern block
  const MODERN_W = toon('#7d8a98');                                   // its window banding
  const RED      = toon('#c0392b');                                   // paifang lacquer
  const GOLD     = toon('#e8c14a', { emissive: '#e8c14a', emissiveIntensity: 0.25 });
  const TILE_GR  = toon('#356b54');                                   // glazed paifang roof tiles
  const WIN      = toon('#515a62');                                   // generic dark window

  // =====================================================================
  //  1) LA DÉFENSE — the Grande Arche: a hollow open marble cube (four thick
  //  slabs forming a square archway), ringed by a cluster of blue-grey glass
  //  office towers. The archway faces back toward Paris (the Arc de Triomphe).
  // =====================================================================
  function grandeArche(g){
    const W = 5.0, H = 5.0, D = 1.8, t = 0.9;        // outer cube, slab thickness
    const inner = H - 2 * t;                          // square opening side
    // four slabs of the frame
    box(g, MARBLE, W, t, D, 0, t / 2, 0);                            // base
    box(g, MARBLE, W, t, D, 0, H - t / 2, 0);                        // lintel
    box(g, MARBLE, t, inner, D, -(W / 2 - t / 2), H / 2, 0);         // left pier
    box(g, MARBLE, t, inner, D,  (W / 2 - t / 2), H / 2, 0);         // right pier
    // recessed glazed panels on the front faces of each slab (facade hint)
    box(g, MARBLE_DK, W - 1.4, t * 0.62, 0.05, 0, t / 2, D / 2 + 0.01);
    box(g, MARBLE_DK, W - 1.4, t * 0.62, 0.05, 0, H - t / 2, D / 2 + 0.01);
    box(g, MARBLE_DK, t * 0.55, inner - 0.4, 0.05, -(W / 2 - t / 2), H / 2, D / 2 + 0.01);
    box(g, MARBLE_DK, t * 0.55, inner - 0.4, 0.05,  (W / 2 - t / 2), H / 2, D / 2 + 0.01);
    // thin window grid lines on the inner reveal of the opening
    for(let i = 1; i < 4; i++){
      const y = t + (inner) * (i / 4);
      box(g, MARBLE_DK, inner, 0.05, 0.05, 0, y, D / 2 - 0.02);
    }
  }
  function officeTower(g, x, z, w, h, d, mat){
    box(g, DARK, w + 0.12, 0.18, d + 0.12, x, 0.09, z);              // plinth
    box(g, mat,  w, h, d, x, h / 2, z);                             // glass shaft
    for(let y = 0.7; y < h - 0.35; y += 0.85){                       // floor banding (4 faces)
      box(g, TBAND, w - 0.04, 0.06, 0.04, x, y, z + d / 2 + 0.005);
      box(g, TBAND, w - 0.04, 0.06, 0.04, x, y, z - d / 2 - 0.005);
      box(g, TBAND, 0.04, 0.06, d - 0.04, x + w / 2 + 0.005, y, z);
      box(g, TBAND, 0.04, 0.06, d - 0.04, x - w / 2 - 0.005, y, z);
    }
    box(g, DARK, w * 0.9, 0.16, d * 0.9, x, h + 0.06, z);            // rooftop plant
  }
  try {
    const dir = landmarkDir('ladefense');
    const g = new THREE.Group();
    grandeArche(g);
    // a ring of skyscrapers around the arch — varied heights 4–7u
    const towers = [
      [-4.2, -1.4, 1.25, 6.6, 1.05, GLASS_A],
      [ 4.0, -2.1, 1.35, 6.9, 1.15, GLASS_B],
      [-3.7,  2.7, 1.15, 4.6, 1.0,  GLASS_B],
      [ 3.6,  2.9, 1.2,  5.3, 1.05, GLASS_A],
      [ 0.0, -4.3, 1.3,  6.2, 1.2,  GLASS_B],
    ];
    for(const t of towers) officeTower(g, t[0], t[1], t[2], t[3], t[4], t[5]);
    placeFacing(g, dir, landmarkDir('arc'), 0);                     // archway opens toward Paris
    // colliders: the arch + each tower
    addCollider(dir, 2.2);
    for(const t of towers) colAt(g, t[0], t[1], Math.max(t[2], t[4]) * 0.62);
    claim(dir, 5.0);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] ladefense', e); }

  // =====================================================================
  //  2) STADE DE FRANCE — a big low elliptical stadium: a flaring concrete
  //  bowl wall (~2u tall, ~6u across) with a darker tilted roof lip and a
  //  green pitch inside. Built round, then squashed to an ellipse.
  // =====================================================================
  try {
    const dir = landmarkDir('stadedefrance');
    const g = new THREE.Group();
    const R0 = 3.0, wallH = 1.8;
    // green pitch + running track
    disc(g, CONCR_DK, R0 - 0.35, 0.10, 32, 0, 0.05, 0);
    disc(g, PITCH,    R0 - 1.0,  0.12, 32, 0, 0.07, 0);
    // outer facade wall (open cylinder)
    cyl(g, CONCRETE, R0, R0, wallH, 36, 0, wallH / 2 + 0.06, 0, 0, true);
    // inner seating bowl: slopes from low/near-pitch up & out to the rim
    cyl(g, CONCR_DK, R0 - 0.2, R0 - 1.1, wallH * 0.95, 36, 0, wallH * 0.95 / 2 + 0.12, 0, 0, true);
    // vertical facade pilasters
    for(let i = 0; i < 20; i++){
      const a = (i / 20) * Math.PI * 2;
      box(g, STONE_LT, 0.1, wallH * 0.9, 0.12, Math.cos(a) * R0, wallH / 2 + 0.06, Math.sin(a) * R0, -a);
    }
    // darker tilted roof lip flaring out over the stands
    cyl(g, ROOFLIP, R0 + 0.55, R0, 0.34, 36, 0, wallH + 0.16, 0, 0, true);
    cyl(g, DARK,    R0 + 0.58, R0 + 0.55, 0.08, 36, 0, wallH + 0.31, 0, 0, true);
    g.scale.set(1.18, 1, 1);                                        // squash to an oval
    placeOnSurface(g, dir, 0, 0.5);
    addCollider(dir, 3.0);
    claim(dir, 3.7);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] stadedefrance', e); }

  // =====================================================================
  //  3) BOIS DE VINCENNES — the Château de Vincennes: a tall square keep
  //  (donjon) with four turreted corners + blue-grey conical roofs, ringed
  //  by a low curtain wall with corner towers. The dark glassy Lac Daumesnil
  //  sits beside it. (This spot is inside the eastern Bois — a park.)
  // =====================================================================
  try {
    const dir = landmarkDir('boisvincennes');
    const g = new THREE.Group();
    // ---- low curtain wall (square perimeter) + corner towers ----------
    const cw = 4.2, wh = 1.0, wt = 0.32;
    for(const s of [-1, 1]){
      box(g, STONE_P, cw, wh, wt, 0, wh / 2, s * cw / 2);           // N / S wall
      box(g, STONE_P, wt, wh, cw, s * cw / 2, wh / 2, 0);           // E / W wall
    }
    box(g, WIN, 0.9, 0.7, 0.1, 0, 0.45, cw / 2 + 0.02);             // gatehouse opening (front)
    for(const sx of [-1, 1]) for(const sz of [-1, 1]){
      cyl(g, STONE_P, 0.42, 0.46, wh + 0.5, 10, sx * cw / 2, (wh + 0.5) / 2, sz * cw / 2);
      cone(g, ROOF_BL, 0.5, 0.6, 10, sx * cw / 2, wh + 0.5 + 0.3, sz * cw / 2);
    }
    // ---- the keep (donjon) --------------------------------------------
    const kH = 4.0, kS = 1.7;
    box(g, STONE_PD, kS + 0.2, 0.18, kS + 0.2, 0, 0.09, 0);          // base course
    box(g, STONE_P,  kS, kH, kS, 0, kH / 2, 0);                      // main keep
    box(g, STONE_PD, kS + 0.22, 0.22, kS + 0.22, 0, kH - 0.05, 0);   // machicolation cornice
    // window slits
    for(const sz of [-1, 1]) for(const yy of [1.1, 2.0, 2.9])
      box(g, WIN, 0.2, 0.5, 0.06, 0, yy, sz * (kS / 2 + 0.01));
    // four corner turrets rising above the keep, blue conical roofs
    const tr = kS / 2;
    for(const sx of [-1, 1]) for(const sz of [-1, 1]){
      cyl(g, STONE_P, 0.3, 0.32, kH + 0.4, 10, sx * tr, (kH + 0.4) / 2, sz * tr);
      cone(g, ROOF_BL, 0.4, 0.75, 10, sx * tr, kH + 0.4 + 0.36, sz * tr);
    }
    // central keep roof + finial
    box(g, ROOF_BL, kS * 0.9, 0.3, kS * 0.9, 0, kH + 0.1, 0);
    cone(g, ROOF_BL, 0.85, 0.9, 4, 0, kH + 0.6, 0, Math.PI / 4);
    // ---- Lac Daumesnil (dark glassy water disc) beside the château ----
    disc(g, WATER, 1.6, 0.12, 28, 4.2, 0.06, 0.6);
    disc(g, TREE_GRN, 0.4, 0.14, 8, 4.4, 0.1, 0.5);                  // little island
    placeOnSurface(g, dir, 0, rand(0, Math.PI * 2));
    addCollider(dir, 1.6);
    claim(dir, 2.4);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] boisvincennes', e); }

  // =====================================================================
  //  4) BOIS DE BOULOGNE — a lake (with a tiny wooded island) and a little
  //  classical kiosk/temple folly: a round colonnade under a small dome.
  //  (Inside the western Bois — a park; kept light.)
  // =====================================================================
  try {
    const dir = landmarkDir('boisboulogne');
    const g = new THREE.Group();
    // ---- the lake + island --------------------------------------------
    disc(g, WATER, 1.5, 0.12, 28, 0, 0.06, 0);
    disc(g, TREE_GRN, 0.45, 0.14, 8, 0.2, 0.1, -0.1);               // island lawn
    cyl(g, TRUNK, 0.06, 0.07, 0.4, 6, 0.2, 0.32, -0.1);             // island tree
    cone(g, TREE_GRN, 0.34, 0.7, 7, 0.2, 0.78, -0.1);
    // ---- the temple folly (offset on the bank) ------------------------
    const fx = -2.5, fz = 0.3, fr = 0.72, colH = 1.0;
    disc(g, STONE_LT, fr + 0.2, 0.16, 16, fx, 0.08, fz);            // stylobate
    for(let i = 0; i < 6; i++){                                      // ring of thin columns
      const a = (i / 6) * Math.PI * 2;
      const cx = fx + Math.cos(a) * fr, cz = fz + Math.sin(a) * fr;
      cyl(g, STONE_P, 0.05, 0.06, colH, 8, cx, 0.16 + colH / 2, cz);
    }
    cyl(g, STONE_LT, fr + 0.14, fr + 0.14, 0.12, 16, fx, 0.16 + colH + 0.06, fz); // entablature ring
    const dome = solid(new THREE.SphereGeometry(fr + 0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), STONE_P);
    dome.scale.set(1, 0.7, 1); dome.position.set(fx, 0.16 + colH + 0.12, fz); g.add(dome);
    cone(g, STONE_LT, 0.07, 0.18, 6, fx, 0.16 + colH + 0.12 + (fr + 0.05) * 0.7 + 0.08, fz); // finial
    placeOnSurface(g, dir, 0, rand(0, Math.PI * 2));
    colAt(g, fx, fz, 0.7);                                          // small collider on the folly only
    claim(dir, 1.9);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] boisboulogne', e); }

  // =====================================================================
  //  5) PÈRE-LACHAISE — a stone entrance portal facing the city, behind it a
  //  field of mausolea / tombs, a scatter of crosses, one obelisk, and a few
  //  tall dark cypress trees. Low collider only on the gate.
  // =====================================================================
  function tombstone(g, x, z){
    const h = rand(0.4, 0.85), w = rand(0.3, 0.5), d = rand(0.3, 0.46);
    box(g, STONE_PD, w + 0.06, 0.1, d + 0.06, x, 0.05, z);          // plinth
    box(g, pick([STONE_P, STONE_LT, STONE_PD]), w, h, d, x, h / 2 + 0.08, z); // little mausoleum
    if(rand() < 0.4) box(g, STONE_LT, w * 0.8, 0.12, d * 0.8, x, h + 0.14, z); // slab roof
    else { // small roof ridge
      box(g, STONE_LT, w, 0.14, d, x, h + 0.14, z);
    }
    if(rand() < 0.35){ // a cross on top
      box(g, STONE_LT, 0.05, 0.34, 0.05, x, h + 0.34, z);
      box(g, STONE_LT, 0.2, 0.05, 0.05, x, h + 0.4, z);
    }
  }
  try {
    const dir = landmarkDir('perelachaise');
    const g = new THREE.Group();
    // ---- entrance portal (two piers + lintel + pediment), front = +Z ---
    const gz = 2.2, pierH = 1.5;
    for(const sx of [-1, 1]){
      box(g, STONE_PD, 0.5, 0.16, 0.5, sx * 1.0, 0.08, gz);
      box(g, STONE_P,  0.4, pierH, 0.4, sx * 1.0, pierH / 2 + 0.1, gz);
    }
    box(g, STONE_LT, 2.6, 0.34, 0.5, 0, pierH + 0.27, gz);          // entablature / lintel
    pediment(g, STONE_LT, 2.6, 0.5, 0.5, 0, pierH + 0.44, gz);      // pediment
    box(g, WIN, 1.1, pierH - 0.1, 0.08, 0, (pierH - 0.1) / 2 + 0.1, gz); // dark gateway
    // ---- the necropolis behind the gate -------------------------------
    const placed = [];
    let guard = 0;
    while(placed.length < 13 && guard++ < 200){
      const x = rand(-2.2, 2.2), z = rand(-3.4, 0.8);
      if(Math.hypot(x, z - gz) < 1.4) continue;                     // keep clear of the gateway
      let ok = true;
      for(const p of placed){ if(Math.hypot(x - p[0], z - p[1]) < 0.62){ ok = false; break; } }
      if(!ok) continue;
      tombstone(g, x, z); placed.push([x, z]);
    }
    // one prominent obelisk
    cyl(g, STONE_LT, 0.13, 0.22, 1.3, 4, 0.3, 0.65 + 0.1, -1.5, Math.PI / 4);
    cone(g, STONE_LT, 0.2, 0.3, 4, 0.3, 1.45, -1.5, Math.PI / 4);
    box(g, STONE_PD, 0.5, 0.2, 0.5, 0.3, 0.1, -1.5);
    // a few dark cypress trees
    for(let i = 0; i < 4; i++){
      const x = pick([-2.0, -0.9, 1.2, 2.1]) + rand(-0.2, 0.2), z = rand(-3.2, -0.6);
      cyl(g, TRUNK, 0.07, 0.09, 0.4, 6, x, 0.2, z);
      cone(g, CYPRESS, 0.32, rand(1.4, 1.9), 7, x, rand(1.0, 1.3), z);
    }
    placeFacing(g, dir, landmarkDir('notredame'), 0);              // portal faces the city
    colAt(g, 0, gz, 1.3);                                           // low collider on the gate only
    claim(dir, 2.6);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] perelachaise', e); }

  // =====================================================================
  //  6) BERCY — the Bibliothèque nationale de France (site François-Mitterrand):
  //  four identical L-shaped "open book" green-glass towers at the corners of a
  //  square, opening inward over a sunken wooden deck.
  // =====================================================================
  function bookTower(g, cx, cz, sx, sz, H){
    // corner of the L at (cx,cz); two slabs reach inward (toward −sx, −sz)
    const thick = 0.28, wide = 1.5;
    box(g, DARK, wide + 0.12, 0.18, thick + 0.12, cx - sx * wide / 2, 0.09, cz); // plinth A
    box(g, DARK, thick + 0.12, 0.18, wide + 0.12, cx, 0.09, cz - sz * wide / 2); // plinth B
    box(g, GLASS_GR, wide, H, thick, cx - sx * wide / 2, H / 2, cz);             // slab A (+X reach)
    box(g, GLASS_GR, thick, H, wide, cx, H / 2, cz - sz * wide / 2);             // slab B (+Z reach)
    for(let y = 0.7; y < H - 0.3; y += 0.8){                                     // floor banding
      box(g, GR_BAND, wide, 0.06, 0.03, cx - sx * wide / 2, y, cz + thick / 2 + 0.005);
      box(g, GR_BAND, wide, 0.06, 0.03, cx - sx * wide / 2, y, cz - thick / 2 - 0.005);
      box(g, GR_BAND, 0.03, 0.06, wide, cx + thick / 2 + 0.005, y, cz - sz * wide / 2);
      box(g, GR_BAND, 0.03, 0.06, wide, cx - thick / 2 - 0.005, y, cz - sz * wide / 2);
    }
  }
  try {
    const dir = landmarkDir('bercy');
    const g = new THREE.Group();
    const a = 2.4, H = 5.0;
    // sunken wooden deck + central garden between the four books
    box(g, WOOD_DK, 2 * a + 0.4, 0.12, 2 * a + 0.4, 0, 0.02, 0);
    box(g, WOOD,    2 * a - 0.2, 0.14, 2 * a - 0.2, 0, 0.05, 0);
    for(let i = -2; i <= 2; i++) box(g, WOOD_DK, 2 * a - 0.2, 0.02, 0.05, 0, 0.13, i * (a / 2.5)); // planks
    disc(g, TREE_GRN, a - 0.7, 0.1, 20, 0, 0.09, 0);                // sunken garden patch
    // four corner towers, each opening toward the centre
    const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for(const c of corners) bookTower(g, c[0] * a, c[1] * a, c[0], c[1], H);
    placeOnSurface(g, dir, 0, 0.6);
    for(const c of corners) colAt(g, c[0] * a, c[1] * a, 0.95);     // a collider per tower
    claim(dir, 3.4);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] bercy', e); }

  // =====================================================================
  //  7) PLACE D'ITALIE — a small modern square: a low circular plaza, one
  //  gently curved low modern block, and a little red Chinatown paifang gate
  //  (two posts + an upturned tiled roof beam) nodding to the 13th's Chinatown.
  // =====================================================================
  try {
    const dir = landmarkDir('placeitalie');
    const g = new THREE.Group();
    // ---- low circular plaza -------------------------------------------
    disc(g, PLAZA, 2.3, 0.12, 28, 0, 0.06, 0);
    disc(g, MODERN_W, 1.0, 0.14, 24, 0, 0.08, 0);                   // inner ring motif
    // ---- the curved modern block (arc of tangent segments, on the −Z side)
    const Rarc = 2.3, bh = 2.5;
    for(let i = 0; i < 6; i++){
      const ang = -Math.PI / 2 + (i - 2.5) * 0.24;
      const x = Rarc * Math.cos(ang), z = Rarc * Math.sin(ang);
      const rotY = -(ang + Math.PI / 2);
      box(g, MODERN, 0.95, bh, 0.7, x, bh / 2, z, rotY);
      for(const yy of [0.7, 1.3, 1.9])                              // window banding
        box(g, MODERN_W, 0.8, 0.16, 0.04, x, yy, z + 0.36 * Math.sin(rotY + Math.PI / 2), rotY);
    }
    box(g, DARK, 2.0, 0.2, 0.5, 0, 2.55, -Rarc - 0.1);             // roof cap accent
    // ---- the red paifang gate (front, toward the city) ----------------
    const px = 0.95, postH = 1.6;
    for(const sx of [-1, 1]){
      box(g, DARK, 0.3, 0.12, 0.3, sx * px, 0.06, 1.9);             // post base
      box(g, RED,  0.18, postH, 0.18, sx * px, postH / 2 + 0.1, 1.9);
    }
    box(g, RED,    2.4, 0.18, 0.3, 0, postH + 0.18, 1.9);          // lower beam
    box(g, GOLD,   2.3, 0.06, 0.34, 0, postH + 0.3, 1.9);          // gilt trim
    box(g, TILE_GR, 2.6, 0.14, 0.42, 0, postH + 0.42, 1.9);       // glazed tiled roof beam
    for(const sx of [-1, 1]){                                       // upturned eave tips
      const tip = box(g, TILE_GR, 0.5, 0.1, 0.42, sx * 1.25, postH + 0.46, 1.9);
      tip.rotation.z = -sx * 0.5;
      cone(g, GOLD, 0.05, 0.14, 4, sx * 1.45, postH + 0.62, 1.9);  // gold finial
    }
    placeFacing(g, dir, landmarkDir('notredame'), 0);              // gate greets the city
    colAt(g, 0, -Rarc, 1.5);                                        // curved block
    colAt(g, 0, 1.9, 0.8);                                          // paifang
    claim(dir, 2.7);
    planetGroup.add(ctx.bakeMerge(g));
  } catch(e){ console.error('[landmarks-outer] placeitalie', e); }
}
