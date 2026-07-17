// =====================================================================
//  paris/landmarks-eiffel.js — LA TOUR EIFFEL (the hero landmark)
// ---------------------------------------------------------------------
//  The tallest object on the tiny planet (~10.5 units). Four splayed
//  legs at the corners of a ~2.2-unit square, curving inward as they
//  rise (exponential "Eiffel curve") and merging into one tapering
//  latticed tower. Faceted ironwork: tapered corner uprights + criss-
//  cross diagonal crossbars + horizontal belts so it reads as lattice,
//  not a solid cone. Four big rounded arches between the legs, three
//  platforms (+ a small top observation deck) and a thin antenna mast.
//  A paved esplanade with a little fountain sits at the base. Across the
//  river, a simple Palais de Chaillot (two curved colonnade wings round
//  a terrace) faces back toward the tower.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup } = ctx;
  const toon = ctx.toon, faceted = ctx.faceted;
  const UP = new THREE.Vector3(0, 1, 0);

  // a collider at a LOCAL (x,z) offset from a placed landmark (+Z toward faceDir)
  function colliderAt(dir, faceDir, x, z, r){
    const up = dir.clone().normalize();
    const fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up)).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const p = up.clone().multiplyScalar(ctx.groundR(up)).addScaledVector(right, x).addScaledVector(fwd, z);
    ctx.addCollider(p.normalize(), r);
  }

  // ---- shared low-poly helpers ----------------------------------------
  function box(g, w, h, d, x, y, z, mat, rotY){
    const m = new THREE.Mesh(faceted(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z); if(rotY) m.rotation.y = rotY;
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  function cyl(g, rt, rb, h, x, y, z, mat, seg){
    const m = new THREE.Mesh(faceted(new THREE.CylinderGeometry(rt, rb, h, seg || 8)), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  // a square-section bar (faceted box) stretched between two points
  function strut(g, a, b, w, mat){
    const d = b.clone().sub(a); const len = d.length();
    if(len < 1e-4) return null;
    const m = new THREE.Mesh(faceted(new THREE.BoxGeometry(w, len, w)), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }

  // ---- iron palette (warm "Eiffel brown") -----------------------------
  const IRON   = toon('#6e5a43');                                   // main ironwork
  const IRON_D = toon('#5c4a37');                                   // crossbars / shadowed members
  const DECK   = toon('#7d6a50');                                   // platform decks & railings
  const GOLD   = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.85 }); // warm night lighting
  const BEACON = toon('#ff6a55', { emissive: '#ff3b2f', emissiveIntensity: 1.1 });  // antenna beacon
  const STONE  = toon('#cabf9f');                                   // esplanade paving
  const STONE_D= toon('#b6a988');                                   // border / fountain stone
  const WATER  = toon('#6f9fb0');                                   // fountain water

  // =====================================================================
  //  THE TOWER (built local: base at y=0, +Y up, centred at origin)
  // =====================================================================
  const tower = new THREE.Group();

  const BASE_HALF = 1.1;      // half the 2.2-unit square base → legs at corners
  const H_PROF    = 4.0;      // exponential decay constant of the inward curve
  const TOP_Y     = 9.2;      // top observation deck (~88% of total height)
  const MAST_TOP  = 10.5;     // antenna tip — tallest point on the planet
  // half-width of the (square) cross-section at height y — the Eiffel curve
  const profile = (y) => BASE_HALF * Math.exp(-y / H_PROF);

  // four corner posts (square cross-section, faces toward ±X / ±Z)
  const SGN = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const corner = (i, y) => { const w = profile(y); return new THREE.Vector3(SGN[i][0] * w, y, SGN[i][1] * w); };
  const thickAt = (y) => THREE.MathUtils.lerp(0.14, 0.05, THREE.MathUtils.clamp(y / TOP_Y, 0, 1));

  // vertical lattice levels — denser low, where the legs splay
  const LEVELS = [0, 0.92, 1.8, 2.6, 3.4, 4.2, 5.0, 5.8, 6.7, 7.6, 8.5, TOP_Y];
  const FACES  = [[0, 1], [1, 2], [2, 3], [3, 0]];   // the 4 sides of the square
  const PLAT1 = 2.6, PLAT2 = 5.8;                     // platform heights
  const ARCH_H = 1.8;                                 // arch crown / springline base

  // leg "shoes" — chunky anchor blocks at each foot
  for(let c = 0; c < 4; c++){ const p = corner(c, 0); box(tower, 0.34, 0.22, 0.34, p.x, 0.11, p.z, IRON_D); }

  // 1) tapered corner uprights (follow the curved profile, segment by segment)
  for(let c = 0; c < 4; c++){
    for(let i = 0; i < LEVELS.length - 1; i++){
      const a = corner(c, LEVELS[i]), b = corner(c, LEVELS[i + 1]);
      strut(tower, a, b, thickAt((LEVELS[i] + LEVELS[i + 1]) / 2), IRON);
    }
  }

  // 2) criss-cross diagonal crossbars on each face (skip the arch zone below)
  for(const [a, b] of FACES){
    for(let i = 0; i < LEVELS.length - 1; i++){
      const ylo = LEVELS[i], yhi = LEVELS[i + 1]; if(ylo < ARCH_H) continue;
      const tw = Math.max(0.035, thickAt((ylo + yhi) / 2) * 0.5);
      strut(tower, corner(a, ylo), corner(b, yhi), tw, IRON_D);   // X brace
      strut(tower, corner(b, ylo), corner(a, yhi), tw, IRON_D);
    }
  }

  // 3) horizontal belts at each level above the arches
  for(const [a, b] of FACES){
    for(const y of LEVELS){ if(y < ARCH_H) continue;
      strut(tower, corner(a, y), corner(b, y), Math.max(0.04, thickAt(y) * 0.6), IRON);
    }
  }

  // 4) the four big rounded arches between the legs (the unmistakable silhouette)
  function buildArch(a, b){
    const ca = corner(a, 0), cb = corner(b, 0);
    const Ohat = ca.clone().add(cb); Ohat.y = 0; Ohat.normalize();   // outward (face normal)
    const Lhat = cb.clone().sub(ca); Lhat.y = 0; Lhat.normalize();   // lateral (along the face)
    const z0 = 0.88, spr = ARCH_H - z0;                              // half-span + springline
    const to3 = (u, y) => Ohat.clone().multiplyScalar(profile(y)).addScaledVector(Lhat, u).setY(y);
    const pts = [];
    pts.push(to3(-z0, 0));                                           // left foot
    const AN = 9;
    for(let k = 0; k <= AN; k++){ const ang = Math.PI * (k / AN); pts.push(to3(-z0 * Math.cos(ang), spr + z0 * Math.sin(ang))); }
    pts.push(to3(z0, 0));                                            // right foot
    for(let k = 0; k < pts.length - 1; k++) strut(tower, pts[k], pts[k + 1], 0.16, IRON);
  }
  for(const [a, b] of FACES) buildArch(a, b);

  // 5) platforms (deck slab + railing + warm corner lights)
  function platform(y, over, h){
    const half = profile(y) + over;
    box(tower, half * 2, h, half * 2, 0, y, 0, DECK);
    const rt = 0.04, rh = 0.16, ry = y + h / 2 + rh / 2;
    for(const s of [-1, 1]){
      box(tower, half * 2 + rt, rh, rt, 0, ry, s * half, IRON);
      box(tower, rt, rh, half * 2 + rt, s * half, ry, 0, IRON);
    }
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) box(tower, 0.08, 0.1, 0.08, sx * half, ry + 0.02, sz * half, GOLD);
  }
  platform(PLAT1, 0.30, 0.18);
  platform(PLAT2, 0.22, 0.16);

  // 6) top observation deck + cabin + antenna mast
  const tdHalf = profile(TOP_Y) + 0.12;
  box(tower, tdHalf * 2, 0.14, tdHalf * 2, 0, TOP_Y, 0, DECK);
  box(tower, 0.34, 0.30, 0.34, 0, TOP_Y + 0.22, 0, IRON);            // cabin walls
  box(tower, 0.38, 0.10, 0.38, 0, TOP_Y + 0.16, 0, GOLD);           // lit window band
  const cap = new THREE.Mesh(faceted(new THREE.ConeGeometry(0.22, 0.22, 8)), IRON);
  cap.position.y = TOP_Y + 0.48; cap.castShadow = cap.receiveShadow = true; tower.add(cap);
  const mastBot = TOP_Y + 0.55;
  cyl(tower, 0.025, 0.05, MAST_TOP - mastBot, 0, (mastBot + MAST_TOP) / 2, 0, IRON, 6); // thin mast
  const beacon = new THREE.Mesh(faceted(new THREE.SphereGeometry(0.075, 8, 6)), BEACON);
  beacon.position.y = MAST_TOP + 0.04; beacon.castShadow = true; tower.add(beacon);

  // 7) esplanade detail at the base — paved square + a little fountain
  box(tower, 3.0, 0.08, 3.0, 0, 0.0, 0, STONE);                      // paving
  for(const s of [-1, 1]){
    box(tower, 3.12, 0.10, 0.14, 0, 0.02, s * 1.5, STONE_D);         // border frame
    box(tower, 0.14, 0.10, 3.12, s * 1.5, 0.02, 0, STONE_D);
  }
  cyl(tower, 0.48, 0.52, 0.22, 0, 0.11, 0, STONE_D, 12);             // fountain basin
  cyl(tower, 0.40, 0.40, 0.04, 0, 0.22, 0, WATER, 12);               // water
  cyl(tower, 0.06, 0.09, 0.34, 0, 0.30, 0, STONE, 8);                // central column
  const fb = new THREE.Mesh(faceted(new THREE.SphereGeometry(0.1, 8, 6)), STONE);
  fb.position.y = 0.50; fb.castShadow = true; tower.add(fb);

  // place facing across the river toward Trocadéro, then bake the lattice
  const eiffelDir = ctx.landmarkDir('eiffel');
  const trocDir   = ctx.landmarkDir('trocadero');
  const ES = 1.6;                       // real-feel scale: ~17u — it should tower like the real one
  tower.scale.setScalar(ES);
  ctx.placeFacing(tower, eiffelDir, trocDir);
  planetGroup.add(ctx.bakeMerge(tower));
  // one collider per LEG + the central fountain, so you can wander UNDER the tower
  for(const s of SGN) colliderAt(eiffelDir, trocDir, s[0] * BASE_HALF * ES, s[1] * BASE_HALF * ES, 0.42 * ES);
  colliderAt(eiffelDir, trocDir, 0, 0, 0.5);
  ctx.claim(eiffelDir, 2.2 * ES);

  // =====================================================================
  //  PALAIS DE CHAILLOT (Trocadéro) — two curved colonnade wings round a
  //  central terrace, pale stone, facing the Eiffel.
  // =====================================================================
  const PSTONE  = toon('#d8cdb0');
  const PSTONE_D= toon('#c7bb9a');
  const PROOF   = toon('#cabf9f');

  const palais = new THREE.Group();
  const Rarc = 2.5, hCol = 1.15, colR = 0.12;
  const capTopY = 0.20 + hCol + 0.10;          // top of the capitals (entablature springs here)

  // central terrace opening toward the Eiffel (+Z), with a low parapet + steps
  box(palais, 1.9, 0.16, 1.6, 0, 0.08, 1.35, PSTONE);
  box(palais, 1.9, 0.24, 0.12, 0, 0.20, 2.05, PSTONE_D);            // parapet (Eiffel-facing edge)
  box(palais, 2.1, 0.08, 0.30, 0, 0.04, 2.35, PSTONE_D);           // step down toward the tower
  box(palais, 2.3, 0.06, 0.30, 0, -0.01, 2.68, PSTONE_D);

  // two gentle curved wings of short columns + a flat entablature roof
  function roofSeg(p0, p1, mat){
    const dx = p1.x - p0.x, dz = p1.z - p0.z, len = Math.hypot(dx, dz);
    const m = new THREE.Mesh(faceted(new THREE.BoxGeometry(0.52, 0.14, len + 0.16)), mat);
    m.position.set((p0.x + p1.x) / 2, capTopY + 0.07, (p0.z + p1.z) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    m.castShadow = m.receiveShadow = true; palais.add(m);
  }
  for(const side of [-1, 1]){
    const a0 = side * 0.34, a1 = side * 1.46, NCOL = 7;             // arc angles (from the front gap to the side)
    let prev = null;
    for(let k = 0; k < NCOL; k++){
      const ang = a0 + (a1 - a0) * (k / (NCOL - 1));
      const x = Math.sin(ang) * Rarc, z = Math.cos(ang) * Rarc;
      box(palais, 0.40, 0.20, 0.40, x, 0.10, z, PSTONE_D, ang);     // stylobate block
      cyl(palais, colR * 0.92, colR, hCol, x, 0.20 + hCol / 2, z, PSTONE, 9); // column
      box(palais, 0.30, 0.10, 0.30, x, capTopY - 0.05, z, PSTONE, ang);       // capital
      if(prev) roofSeg(prev, { x, z }, PROOF);                      // flat-roof entablature segment
      prev = { x, z };
    }
  }

  const PS = 1.3;                       // Chaillot reads grander across the river
  palais.scale.setScalar(PS);
  ctx.placeFacing(palais, trocDir, eiffelDir);
  planetGroup.add(ctx.bakeMerge(palais));
  // colliders trace the two colonnade wings; the terrace + front stay walkable
  for(const side of [-1, 1]) for(const ang of [0.5, 0.95, 1.4])
    colliderAt(trocDir, eiffelDir, side * Math.sin(ang) * Rarc * PS, Math.cos(ang) * Rarc * PS, 0.55 * PS);
  ctx.claim(trocDir, 2.6 * PS);
}
