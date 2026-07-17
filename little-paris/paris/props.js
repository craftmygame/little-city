// =====================================================================
//  paris/props.js — ICONIC PARISIAN STREET FURNITURE
// ---------------------------------------------------------------------
//  Chunky low-poly cel-shaded "model village" street dressing scattered
//  tastefully around the city core (and along the Seine / on the water):
//    1) CAFÉ TERRACE   — bistro tables + rattan chairs under a striped
//                        awning on a short facade stub
//    2) WALLACE FOUNTAIN — dark-green cast-iron drinking fountain, four
//                        caryatids under a little domed cupola
//    3) MORRIS COLUMN  — fat green pillar wrapped in colourful posters,
//                        crowned by an ornate green dome
//    4) MÉTRO ENTRANCE — Guimard Art-Nouveau green ironwork: two curvy
//                        amber-globe lamp standards + an "M" sign + railing
//    5) GREEN KIOSK    — hexagonal newspaper stand with a domed cone roof
//    6) BOUQUINISTES   — rows of green book boxes on the Seine quais
//    7) CAROUSEL       — one striped double-decker carousel with horses
//    8) BATEAU-MOUCHE  — long, low glass-canopy tour boats on the river
//
//  Everything is built local (base at y=0, +Y up, centred at origin,
//  +Z = front) then placed with the ctx surface helpers and baked.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, geo,
          placeOnSurface, placeFacing, parisToDir, landmarkDir, LANDMARKS,
          addCollider, claim, freeSpot, rand, randi, rng, pick } = ctx;

  const UP = new THREE.Vector3(0, 1, 0);
  // spawn plaza clearing measured ON THE SPHERE (the metre chart squeezes
  // tangential distances this far from Notre-Dame — chart metres lie)
  const START_DIR = parisToDir(-3800, -280);
  const R_WORLD = ctx.R;
  const nearSpawn = (e, n, worldUnits) => parisToDir(e, n).angleTo(START_DIR) * R_WORLD < worldUnits;

  // ---- low-poly mesh helpers (faceted, shadowed) ----------------------
  const solid = (g, m) => { const me = new THREE.Mesh(faceted(g), m); me.castShadow = true; me.receiveShadow = true; return me; };
  function box(g, m, w, h, d, x = 0, y = 0, z = 0){ const me = solid(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); g.add(me); return me; }
  function cyl(g, m, rt, rb, h, seg, x = 0, y = 0, z = 0){ const me = solid(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); g.add(me); return me; }
  function cone(g, m, r, h, seg, x = 0, y = 0, z = 0){ const me = solid(new THREE.ConeGeometry(r, h, seg), m); me.position.set(x, y, z); g.add(me); return me; }
  function sph(g, m, r, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1){ const me = solid(new THREE.SphereGeometry(r, 10, 8), m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); g.add(me); return me; }
  function disc(g, m, r, h, seg, x = 0, y = 0, z = 0){ const me = new THREE.Mesh(faceted(new THREE.CylinderGeometry(r, r, h, seg)), m); me.position.set(x, y, z); me.receiveShadow = true; g.add(me); return me; }
  // a square-section bar stretched between two points (for the carousel ribs)
  function bar(g, a, b, w, m){ const d = b.clone().sub(a); const len = d.length(); if(len < 1e-4) return null;
    const me = solid(new THREE.BoxGeometry(w, len, w), m); me.position.copy(a).addScaledVector(d, 0.5);
    me.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len)); g.add(me); return me; }

  // ---- shared palette --------------------------------------------------
  const GREEN   = toon('#2f6b4f');   // Wallace / Morris / kiosk cast-iron green
  const GREEN_D = toon('#27543f');
  const GREEN_L = toon('#3f7a52');   // Guimard Art-Nouveau green
  const IRON    = toon('#33383f');
  const STONE   = toon('#cdbd9c');
  const STONE_D = toon('#b2a07e');
  const WOOD    = toon('#c79a5a');
  const WOOD_D  = toon('#9c7a44');
  const WHITE   = toon('#efe7d6');
  const CREAM   = toon('#f1e7d2');
  const RED     = toon('#b3675c');   // muted terracotta — saturated red is the player's accent
  const GOLD    = toon('#d8b878');
  const DARK    = toon('#2b2b2e');
  const AMBER   = toon('#ffcf7a', { emissive: '#ffb347', emissiveIntensity: 0.95 });
  const GLOWY   = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.9 });
  const GLASS   = toon('#bfe3e0', { transparent: true, opacity: 0.6 });
  const POSTER  = ['#a85a4f', '#c2a05a', '#5a7a9c', '#a87d99', '#b08356', '#7d9271', '#96738f'].map(c => toon(c));

  // =====================================================================
  //  1) CAFÉ TERRACE
  // =====================================================================
  function awning(g, x, y, z, w, matA, matB){
    const depth = 0.66, drop = 0.26;
    const stripes = Math.max(6, Math.round(w / 0.32)), sw = w / stripes;
    for(let i = 0; i < stripes; i++){
      const mat = (i % 2 === 0) ? matA : matB, sx = -w / 2 + sw * (i + 0.5);
      const top = box(g, mat, sw * 0.98, 0.04, depth, x + sx, y + 0.06, z + depth / 2); top.rotation.x = -0.4;
      box(g, mat, sw * 0.98, drop, 0.04, x + sx, y - drop / 2, z + depth * 0.9);
    }
    box(g, WOOD_D, w, 0.05, 0.05, x, y - drop, z + depth * 0.92);   // front bar
  }
  function chair(g, x, z, rot){
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; g.add(c);
    cyl(c, WOOD, 0.15, 0.15, 0.04, 10, 0, 0.26, 0);                 // round seat
    const back = new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 10, 1, true, 0, Math.PI)), WOOD);
    back.position.set(0, 0.43, -0.02); back.castShadow = true; c.add(back);  // open rattan back
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) cyl(c, WOOD_D, 0.015, 0.02, 0.26, 5, sx * 0.1, 0.13, sz * 0.1);
  }
  function tableSet(g, x, z){
    cyl(g, IRON, 0.03, 0.04, 0.5, 6, x, 0.25, z);                   // thin pedestal
    cyl(g, IRON, 0.13, 0.13, 0.03, 8, x, 0.02, z);                  // foot
    cyl(g, CREAM, 0.32, 0.32, 0.04, 12, x, 0.52, z);                // round bistro top
    chair(g, x, z - 0.42, 0); chair(g, x, z + 0.42, Math.PI);
  }
  function makeCafe(){
    const g = new THREE.Group();
    const wallMat = toon(pick(['#e7dcc4', '#ddd2ba', '#e9d7bb', '#d8cdb0']));
    const sp = pick([['#b3675c', '#f1e7d2'], ['#3f7a52', '#f1e7d2']]);   // terracotta/cream or green/cream
    const sA = toon(sp[0]), sB = toon(sp[1]);
    const W = 2.6, H = 2.2, D = 0.34, bz = -1.0;
    box(g, STONE, W + 0.2, 0.12, D + 0.2, 0, 0.06, bz);             // base course
    box(g, wallMat, W, H, D, 0, H / 2, bz);                         // facade stub
    box(g, GREEN, W + 0.06, 0.16, D + 0.06, 0, H, bz);             // cornice
    box(g, GLOWY, 1.0, 1.1, 0.05, -0.55, 0.95, bz + D / 2 + 0.03);  // lit café window
    box(g, GREEN, 1.12, 1.22, 0.04, -0.55, 0.95, bz + D / 2 + 0.01);
    box(g, toon('#5a3f30'), 0.62, 1.4, 0.06, 0.7, 0.7, bz + D / 2 + 0.03); // door
    box(g, GLOWY, 0.5, 0.5, 0.04, 0.7, 1.05, bz + D / 2 + 0.05);
    awning(g, 0, H * 0.72, bz + D / 2 + 0.02, W * 0.96, sA, sB);
    const spots = [[-0.7, 0.8], [0.7, 0.9], [0.0, 1.7], [-1.0, 2.0], [0.9, 2.0]];
    const N = randi(3, 4);
    for(let i = 0; i < N; i++) tableSet(g, spots[i][0], spots[i][1]);
    return { obj: g, ar: 1.7, h: 2.4 };
  }

  // =====================================================================
  //  2) WALLACE FOUNTAIN  (~1.4 units)
  // =====================================================================
  function makeWallace(){
    const g = new THREE.Group();
    cyl(g, GREEN_D, 0.36, 0.46, 0.18, 8, 0, 0.09, 0);              // octagonal plinth
    cyl(g, GREEN, 0.3, 0.34, 0.16, 8, 0, 0.25, 0);                 // pedestal
    cyl(g, GREEN_D, 0.34, 0.34, 0.05, 8, 0, 0.34, 0);              // rim
    cyl(g, GREEN, 0.13, 0.16, 0.92, 8, 0, 0.82, 0);                // central stem
    const cr = 0.27;
    for(let i = 0; i < 4; i++){                                     // four draped caryatids
      const a = i / 4 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * cr, z = Math.sin(a) * cr;
      cyl(g, GREEN, 0.055, 0.085, 0.78, 6, x, 0.78, z);            // slender draped body
      const drape = box(g, GREEN_D, 0.14, 0.5, 0.05, x, 0.74, z); drape.rotation.y = -a;
      sph(g, GREEN, 0.07, x, 1.2, z);                              // head
      box(g, GREEN, 0.16, 0.05, 0.16, x, 1.27, z);                 // little capital
    }
    cyl(g, GREEN_D, 0.36, 0.34, 0.07, 8, 0, 1.34, 0);              // entablature
    cyl(g, GREEN, 0.34, 0.36, 0.05, 8, 0, 1.4, 0);
    sph(g, GREEN, 0.34, 0, 1.44, 0, 1, 0.72, 1);                   // domed cupola
    cyl(g, GREEN_D, 0.0, 0.06, 0.16, 6, 0, 1.74, 0);               // finial
    sph(g, GOLD, 0.04, 0, 1.84, 0);
    return { obj: g, ar: 0.5, h: 1.9 };
  }

  // =====================================================================
  //  3) MORRIS COLUMN  (~1.8-unit body + ornate dome)
  // =====================================================================
  function makeMorris(){
    const g = new THREE.Group();
    cyl(g, GREEN_D, 0.52, 0.6, 0.18, 16, 0, 0.09, 0);              // base
    cyl(g, GREEN, 0.46, 0.48, 1.5, 16, 0, 0.93, 0);               // fat column
    for(let i = 0; i < 9; i++){                                    // colourful poster bands
      const a = i / 9 * Math.PI * 2, x = Math.cos(a) * 0.49, z = Math.sin(a) * 0.49;
      const p = box(g, POSTER[i % POSTER.length], 0.3, 0.78, 0.025, x, 0.74, z); p.rotation.y = Math.PI / 2 - a;
    }
    cyl(g, GREEN, 0.49, 0.47, 0.1, 16, 0, 1.5, 0);                 // green collar
    cyl(g, GREEN_D, 0.5, 0.52, 0.12, 16, 0, 1.62, 0);             // cornice
    sph(g, GREEN, 0.48, 0, 1.72, 0, 1, 0.78, 1);                   // dome
    cyl(g, GREEN_D, 0.36, 0.46, 0.05, 16, 0, 1.74, 0);            // dome ribs
    cyl(g, GREEN_D, 0.18, 0.3, 0.05, 16, 0, 1.92, 0);
    cyl(g, GREEN_D, 0.0, 0.08, 0.22, 8, 0, 2.12, 0);               // finial
    sph(g, GOLD, 0.05, 0, 2.26, 0);
    return { obj: g, ar: 0.62, h: 2.3 };
  }

  // =====================================================================
  //  4) MÉTRO ENTRANCE  (Guimard Art-Nouveau)
  // =====================================================================
  function railSeg(g, x, z, w, rotY){
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = rotY; g.add(s);
    box(s, GREEN_L, w, 0.04, 0.04, 0, 0.55, 0);                    // top rail
    box(s, GREEN_L, w, 0.04, 0.04, 0, 0.18, 0);                    // lower rail
    const n = Math.max(2, Math.round(w / 0.28));
    for(let i = 0; i <= n; i++){ const px = -w / 2 + w / n * i; cyl(s, GREEN_L, 0.02, 0.025, 0.55, 5, px, 0.3, 0);
      if(i < n) sph(s, GREEN_L, 0.04, px + w / (2 * n), 0.5, 0); }  // little scroll knobs
  }
  function lampStandard(g, x, z){
    const s = x < 0 ? -1 : 1, grp = new THREE.Group(); grp.position.set(x, 0, z); g.add(grp);
    cyl(grp, GREEN_L, 0.07, 0.1, 0.16, 8, 0, 0.08, 0);             // base
    cyl(grp, GREEN_L, 0.05, 0.06, 0.7, 7, 0, 0.5, 0);              // curvy stalk (3 leaning segments)
    const s2 = cyl(grp, GREEN_L, 0.04, 0.05, 0.5, 7, s * 0.08, 0.98, 0); s2.rotation.z = -s * 0.4;
    const s3 = cyl(grp, GREEN_L, 0.035, 0.04, 0.34, 7, s * 0.26, 1.28, 0); s3.rotation.z = -s * 0.95;
    cone(grp, GREEN_L, 0.12, 0.16, 7, s * 0.44, 1.42, 0);          // green calyx
    sph(grp, AMBER, 0.13, s * 0.44, 1.5, 0);                       // amber glass globe
    sph(grp, GREEN_D, 0.05, s * 0.44, 1.66, 0);                    // bud cap
  }
  function makeMetro(){
    const g = new THREE.Group();
    box(g, DARK, 1.3, 0.06, 1.5, 0, 0.03, 0);                      // dark stairwell mouth
    for(let i = 0; i < 4; i++) box(g, toon('#3a3a3d'), 1.0, 0.05, 0.22, 0, 0.05, 0.5 - i * 0.22); // steps going down
    railSeg(g, 0, -0.78, 1.4, 0);                                  // railing (open at +Z front)
    railSeg(g, -0.68, 0, 1.5, Math.PI / 2);
    railSeg(g, 0.68, 0, 1.5, Math.PI / 2);
    lampStandard(g, -0.72, 0.7); lampStandard(g, 0.72, 0.7);       // flanking curvy lamps
    box(g, GREEN_L, 0.1, 0.7, 0.1, 0, 0.35, -0.7);                 // "M" sign post
    box(g, GREEN, 0.5, 0.4, 0.06, 0, 0.95, -0.7);                  // sign board
    box(g, AMBER, 0.34, 0.3, 0.03, 0, 0.95, -0.66);               // lit "M" plate
    box(g, GREEN_D, 0.06, 0.26, 0.04, -0.1, 0.95, -0.63);
    box(g, GREEN_D, 0.06, 0.26, 0.04, 0.1, 0.95, -0.63);
    box(g, GREEN_D, 0.18, 0.06, 0.04, 0, 1.05, -0.63);
    return { obj: g, ar: 1.0, h: 1.5 };
  }

  // =====================================================================
  //  5) GREEN KIOSK  (newspaper stand)
  // =====================================================================
  function makeKiosk(){
    const g = new THREE.Group();
    cyl(g, GREEN_D, 0.66, 0.72, 0.14, 6, 0, 0.07, 0);              // hex base
    cyl(g, GREEN, 0.6, 0.62, 1.3, 6, 0, 0.79, 0);                 // hex body
    for(let i = 0; i < 6; i++){                                    // poster side panels
      const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 0.61, z = Math.sin(a) * 0.61;
      const p = box(g, POSTER[(i + 2) % POSTER.length], 0.42, 0.6, 0.02, x, 0.95, z); p.rotation.y = Math.PI / 2 - a;
    }
    box(g, DARK, 0.66, 0.5, 0.04, 0, 1.05, 0.6);                   // serving window (+Z front)
    box(g, WOOD, 1.04, 0.06, 0.32, 0, 0.72, 0.62);                // counter shelf
    box(g, WOOD_D, 1.04, 0.05, 0.05, 0, 0.55, 0.78);              // counter lip
    for(let k = 0; k < 3; k++) box(g, POSTER[k], 0.18, 0.03, 0.22, -0.3 + k * 0.3, 0.76, 0.62); // papers
    cyl(g, GREEN_D, 0.7, 0.66, 0.08, 6, 0, 1.48, 0);              // eaves ring
    cone(g, GREEN, 0.84, 0.6, 6, 0, 1.82, 0);                     // domed cone roof
    sph(g, GREEN_D, 0.08, 0, 2.12, 0);                            // ridge knob
    cyl(g, GOLD, 0.0, 0.035, 0.2, 6, 0, 2.26, 0);                 // finial spike
    return { obj: g, ar: 0.74, h: 2.1 };
  }

  // =====================================================================
  //  6) BOUQUINISTES  (green book boxes on the quais)
  // =====================================================================
  function bookBox(g, x){
    const y0 = 0.53;
    box(g, GREEN, 0.6, 0.26, 0.4, x, y0 + 0.13, 0);                // box body
    box(g, GREEN_D, 0.6, 0.04, 0.4, x, y0, 0);                     // bottom
    for(let k = 0; k < 6; k++) box(g, POSTER[(k + Math.round(x * 5) + 6) % POSTER.length], 0.08, 0.05, 0.34, x - 0.25 + k * 0.1, y0 + 0.28, 0); // book spines
    const lid = box(g, GREEN_D, 0.62, 0.04, 0.42, x, y0 + 0.34, -0.18); lid.rotation.x = -1.0; // open propped lid
  }
  function makeBookStall(){
    const g = new THREE.Group();
    box(g, STONE_D, 2.3, 0.5, 0.28, 0, 0.25, -0.25);               // quai parapet wall (runs along X)
    box(g, STONE, 2.34, 0.06, 0.32, 0, 0.5, -0.25);               // wall cap
    const n = randi(2, 3), bw = 0.62, total = n * bw + (n - 1) * 0.06;
    for(let i = 0; i < n; i++) bookBox(g, -total / 2 + bw / 2 + i * (bw + 0.06));
    return { obj: g, ar: 1.2, h: 1.1 };
  }

  // =====================================================================
  //  7) CAROUSEL  (one striped double-decker)
  // =====================================================================
  function horse(g, x, z, heading){
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = heading; g.add(h);
    box(h, WHITE, 0.16, 0.2, 0.46, 0, 0.55, 0);                    // body
    const neck = box(h, WHITE, 0.12, 0.24, 0.14, 0, 0.72, 0.2); neck.rotation.x = 0.5;
    box(h, WHITE, 0.11, 0.12, 0.2, 0, 0.86, 0.3);                  // head
    box(h, RED, 0.15, 0.06, 0.22, 0, 0.66, 0);                     // saddle
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) cyl(h, WOOD_D, 0.018, 0.022, 0.45, 5, sx * 0.06, 0.32, sz * 0.16);
  }
  function makeCarousel(){
    const g = new THREE.Group();
    disc(g, WOOD_D, 1.36, 0.06, 18, 0, 0.03, 0);                   // ground ring
    cyl(g, WOOD, 1.28, 1.28, 0.16, 18, 0, 0.11, 0);               // deck
    cyl(g, RED, 0.18, 0.2, 1.7, 12, 0, 0.95, 0);                  // central column
    cyl(g, GOLD, 0.22, 0.22, 0.08, 12, 0, 1.82, 0);              // hub
    const N = 8;
    for(let i = 0; i < N; i++){
      const a = i / N * Math.PI * 2, x = Math.cos(a) * 1.0, z = Math.sin(a) * 1.0;
      cyl(g, GOLD, 0.025, 0.025, 1.5, 6, x, 0.95, z);             // brass pole
      if(i % 2 === 0) horse(g, x, z, a + Math.PI / 2);            // a few horses
    }
    const roofY = 1.74;
    cone(g, CREAM, 1.5, 0.62, 18, 0, roofY + 0.31, 0);            // canopy cone
    const apex = new THREE.Vector3(0, roofY + 0.62, 0);
    for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2;   // red radial stripes on the canopy
      bar(g, apex, new THREE.Vector3(Math.cos(a) * 1.48, roofY + 0.01, Math.sin(a) * 1.48), 0.05, RED); }
    for(let i = 0; i < 18; i++){                                   // scalloped striped valance
      const a = i / 18 * Math.PI * 2, r = 1.45;
      const f = box(g, (i % 2 === 0) ? RED : CREAM, 0.28, 0.24, 0.04, Math.cos(a) * r, roofY - 0.02, Math.sin(a) * r); f.rotation.y = Math.PI / 2 - a;
    }
    cyl(g, GOLD, 0.0, 0.1, 0.34, 8, 0, roofY + 0.78, 0);          // finial
    sph(g, RED, 0.09, 0, roofY + 1.0, 0);                         // top ball
    return { obj: g, ar: 1.5, h: 2.7 };
  }

  // =====================================================================
  //  8) BATEAU-MOUCHE  (long, low, glass-canopy tour boat)
  // =====================================================================
  function makeBateau(){
    const g = new THREE.Group();
    const HULL = toon('#34526b'), HULLD = toon('#2a4154');
    const L = 2.8, W = 0.78, hh = 0.26;
    box(g, HULL, W, hh, L * 0.78, 0, hh / 2, -L * 0.04);           // main hull
    box(g, HULLD, W, 0.06, L * 0.8, 0, 0.02, -L * 0.04);          // waterline strip
    const bs = new THREE.Shape(); bs.moveTo(-W / 2, 0); bs.lineTo(W / 2, 0); bs.lineTo(0, 0.66); bs.closePath();
    const bg = new THREE.ExtrudeGeometry(bs, { depth: hh, bevelEnabled: false, curveSegments: 1 });
    bg.rotateX(Math.PI / 2); bg.translate(0, hh, 0);
    const bow = new THREE.Mesh(faceted(bg), HULL); bow.castShadow = true; bow.receiveShadow = true;
    bow.position.set(0, 0, L * 0.35); g.add(bow);                  // pointed bow (+Z)
    box(g, HULL, W, hh, 0.3, 0, hh / 2, -L * 0.42);                // stern
    box(g, WOOD, W * 0.92, 0.04, L * 0.74, 0, hh + 0.02, -L * 0.04); // deck
    box(g, GLASS, W * 0.82, 0.34, L * 0.66, 0, hh + 0.22, -L * 0.02); // long glass canopy
    box(g, WHITE, W * 0.9, 0.05, L * 0.7, 0, hh + 0.42, -L * 0.02);   // roof
    box(g, WHITE, W * 0.5, 0.04, L * 0.7, 0, hh + 0.45, -L * 0.02);
    box(g, WHITE, W * 0.5, 0.22, 0.4, 0, hh + 0.5, L * 0.18);         // wheelhouse
    cyl(g, IRON, 0.012, 0.012, 0.4, 5, 0, hh + 0.6, -L * 0.42);       // flag pole
    box(g, RED, 0.18, 0.12, 0.02, 0.1, hh + 0.74, -L * 0.42);
    return { obj: g, ar: 1.4, h: 1.2 };
  }

  // =====================================================================
  //  PLACEMENT
  // =====================================================================
  function buildable(e, n, minSeine = 190){
    if(Math.hypot(e, n) >= 5520) return false;                     // across the metropolis, stop at the sea
    if(geo.isPark(e, n)) return false;
    if(geo.roadMask(e, n) > 0.5) return false;                     // off the avenues
    if(geo.seineDist2D(e, n) < geo.riverHalfAt(e, n) + geo.chartMargin(minSeine - 165, e, n) && !geo.onIsland(e, n)) return false; // off the river
    if(geo.onBridge(e, n, 70)) return false;                       // off the bridge walkways
    if(nearSpawn(e, n, 7.0)) return false;                         // spawn plaza stays open (camera orbit room)
    return true;
  }
  function findSpot(r){
    for(let i = 0; i < 320; i++){
      const ang = rng() * Math.PI * 2, rad = Math.pow(rng(), 0.7) * 5500;
      const e = Math.cos(ang) * rad, n = Math.sin(ang) * rad;
      if(!buildable(e, n)) continue;
      const dir = parisToDir(e, n);
      if(!freeSpot(dir, r)) continue;
      return dir;
    }
    return null;
  }
  function findNearPlaza(r){
    const plazas = ['bastille', 'republique', 'opera', 'madeleine', 'pantheon', 'concorde', 'hoteldeville', 'saintsulpice', 'palaisroyal'];
    for(let t = 0; t < 40; t++){
      const L = LANDMARKS[pick(plazas)], ang = rng() * Math.PI * 2, rad = rand(200, 460);
      const e = L.e + Math.cos(ang) * rad, n = L.n + Math.sin(ang) * rad;
      if(!buildable(e, n)) continue;
      const dir = parisToDir(e, n);
      if(!freeSpot(dir, r)) continue;
      return dir;
    }
    return findSpot(r);
  }
  // kerbside spots along the étoile avenues — where street furniture lives
  // at eye level (just past the roadway, inside the building corridor)
  function findKerb(r){
    const ARC = LANDMARKS.arc;
    for(let t = 0; t < 120; t++){
      const av = pick(geo.AVENUES);
      const d = rand(260, 3600), side = rng() < 0.5 ? -1 : 1, off = rand(58, 86);
      const ca = Math.cos(av.angle), sa = Math.sin(av.angle);
      const e = ARC.e + ca * d - sa * off * side, n = ARC.n + sa * d + ca * off * side;
      if(!buildable(e, n)) continue;
      const dir = parisToDir(e, n);
      if(!freeSpot(dir, r)) continue;
      return dir;
    }
    return findSpot(r);
  }
  function placeProp(res, dir, { collide = true, extra = 0, spin = null, faceDir = null, claimMul = 1.05 } = {}){
    const { obj, ar, h } = res;
    if(faceDir) placeFacing(obj, dir, faceDir, extra);
    else placeOnSurface(obj, dir, extra, spin == null ? rand(0, Math.PI * 2) : spin);
    planetGroup.add(ctx.bakeMerge(obj));
    if(collide) addCollider(dir, ar * 0.8, h);
    claim(dir, ar * claimMul);
  }
  function scatter(count, maker, clearance, finder = findSpot){
    for(let i = 0; i < count; i++){ const d = finder(clearance); if(d) placeProp(maker(), d); }
  }

  // 1) cafés   2) Wallace   3) Morris   5) kiosks — biased to the avenue
  // kerbs (eye-level dressing) and the great places — very Paris
  scatter(4, makeCafe, 2.0, findKerb);
  scatter(4, makeCafe, 2.0, findNearPlaza);
  scatter(3, makeCafe, 2.0);
  scatter(6, makeWallace, 0.7, findKerb);
  scatter(4, makeWallace, 0.7);
  scatter(6, makeMorris, 0.8, findKerb);
  scatter(2, makeMorris, 0.8);
  scatter(5, makeKiosk, 0.95, findKerb);
  scatter(3, makeKiosk, 0.95);
  // 4) Métro entrances near plazas
  scatter(8, makeMetro, 1.2, findNearPlaza);

  // 7) one carousel near the Eiffel base / Trocadéro / Sacré-Cœur (parks ok)
  (function buildCarousel(){
    const bases = ['trocadero', 'eiffel', 'sacrecoeur', 'hoteldeville'];
    for(let t = 0; t < 80; t++){
      const L = LANDMARKS[pick(bases)], ang = rng() * Math.PI * 2, rad = rand(260, 540);
      const e = L.e + Math.cos(ang) * rad, n = L.n + Math.sin(ang) * rad;
      if(Math.hypot(e, n) >= 4400) continue;
      if(geo.seineDist2D(e, n) < geo.riverHalfAt(e, n) + geo.chartMargin(15, e, n) && !geo.onIsland(e, n)) continue;
      if(geo.roadMask(e, n) > 0.6) continue;
      const dir = parisToDir(e, n);
      if(!freeSpot(dir, 1.6)) continue;
      placeProp(makeCarousel(), dir); return;
    }
    const d = findSpot(1.6); if(d) placeProp(makeCarousel(), d);
  })();

  // 6) bouquinistes — rows of book boxes set back onto the Seine banks
  (function buildBouquinistes(){
    const pts = geo.SEINE_PTS; let made = 0;
    for(let i = 3; i < pts.length - 3 && made < 14; i += 4){
      const a = pts[i - 2], b = pts[i + 2];
      let tx = b[0] - a[0], tn = b[1] - a[1]; const tl = Math.hypot(tx, tn) || 1; tx /= tl; tn /= tl;
      const sides = rng() < 0.5 ? [[-tn, tx], [tn, -tx]] : [[tn, -tx], [-tn, tx]];
      const cx = pts[i][0], cn = pts[i][1]; let chosen = null;
      for(const sd of sides){
        for(let off = 180; off <= 320; off += 20){
          const e = cx + sd[0] * off, n = cn + sd[1] * off;
          if(Math.hypot(e, n) >= 4200) break;
          if(geo.isPark(e, n)) continue;
          if(geo.seineDist2D(e, n) < 178) continue;                // ensure on the bank, not the water
          if(geo.onBridge(e, n, 55)) continue;                     // not on a bridge approach
          if(geo.roadMask(e, n) > 0.6) continue;
          const dir = parisToDir(e, n);
          if(!freeSpot(dir, 1.0)) continue;
          chosen = dir; break;
        }
        if(chosen) break;
      }
      if(!chosen) continue;
      const stall = makeBookStall();
      placeFacing(stall.obj, chosen, parisToDir(cx, cn), 0);        // open boxes face the river
      planetGroup.add(ctx.bakeMerge(stall.obj));
      addCollider(chosen, stall.ar * 0.45, stall.h);
      claim(chosen, stall.ar);
      made++;
    }
  })();

  // 8) bateaux-mouches — on the open western reach of the Seine
  (function buildBateaux(){
    const pts = geo.SEINE_PTS, cand = [];
    for(let i = 6; i < pts.length - 6; i++){
      const e = pts[i][0], n = pts[i][1];
      if(geo.onIsland(e, n)) continue;
      if(e < -3600 || e > -700) continue;                          // mid-river, west of the islands
      // keep clear of the bridge causeways (a moored boat on land looks silly)
      if(geo.onBridge(e, n) || geo.onBridge(pts[i - 4][0], pts[i - 4][1]) || geo.onBridge(pts[i + 4][0], pts[i + 4][1])) continue;
      cand.push(i);
    }
    let made = 0;
    const step = Math.max(1, Math.floor(cand.length / 4));
    for(let k = 0; k < cand.length && made < 3; k += step){
      const i = cand[k], e = pts[i][0], n = pts[i][1];
      const dir = parisToDir(e, n);
      if(!freeSpot(dir, 1.2)) continue;
      const downstream = parisToDir(pts[i + 2][0], pts[i + 2][1]);
      const boat = makeBateau();
      placeFacing(boat.obj, dir, downstream, 0.45);                // sits near water level, points downstream
      planetGroup.add(ctx.bakeMerge(boat.obj));
      claim(dir, 1.4);
      made++;
    }
  })();
}
