// =====================================================================
//  paris/landmarks-etoile.js — THE GRAND AXIS
//  Arc de Triomphe → Place de l'Étoile → Champs-Élysées → Concorde
// ---------------------------------------------------------------------
//  The "axe historique" laid down the front of the planet:
//   1) ARC DE TRIOMPHE — a massive ~3-unit stone block pierced by a tall
//      central archway and a smaller transverse arch through the sides
//      (a real cross-vault you can see through), capped by a plain attic
//      block, with shallow inset relief panels suggesting sculpture. It
//      is turned to face down the Champs toward Concorde.
//   2) PLACE DE L'ÉTOILE — a low round paved plaza disc ringing the Arc.
//   3) CHAMPS-ÉLYSÉES — a wide paved avenue strip with double rows of
//      rounded-canopy trees and a few ornate candelabra lampposts, sampled
//      in metres between the Arc and Concorde and projected to the sphere.
//   4) PLACE DE LA CONCORDE — the Luxor Obelisk: a slender tapering square
//      Egyptian obelisk on a plinth with a small gold pyramidion, flanked
//      by two low round fountains (Fontaines de la Concorde).
//
//  Everything is built local (base at y=0, +Y up, centred at origin,
//  +Z = front) then placed with the ctx surface helpers.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, placeFacing,
          parisToDir, landmarkDir, LANDMARKS, addCollider, claim,
          rand, pick } = ctx;

  // ---- low-poly mesh helpers (group-first, faceted, shadowed) ---------
  const solid = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); g.add(m); return m;
  }
  function cyl(g, mat, rt, rb, h, seg, x, y, z){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x || 0, y || 0, z || 0); g.add(m); return m;
  }
  // a flat ground disc/tile (receives shadow, doesn't cast)
  function ground(geo, mat){ const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = false; m.receiveShadow = true; return m; }

  // a collider at a LOCAL (x,z) offset from a placed landmark (+Z toward faceDir)
  function colliderAt(dir, faceDir, x, z, r){
    const up = dir.clone().normalize();
    const fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up)).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const p = up.clone().multiplyScalar(ctx.groundR(up)).addScaledVector(right, x).addScaledVector(fwd, z);
    addCollider(p.normalize(), r);
  }

  // ---- shared materials -----------------------------------------------
  const STONE     = toon('#cdbd9c');                                   // warm pale stone (Arc)
  const STONE_DK  = toon('#b2a07e');                                   // shaded stone / relief panels
  const STONE_LT  = toon('#d8c8a6');                                   // attic block
  const CORNICE   = toon('#c4b390');                                   // entablature / caps
  const COBBLE    = toon('#8d8478');                                   // plaza paving
  const COBBLE_DK = toon('#766d62');                                   // plaza ring outline
  const PAVE      = toon('#bdb39a');                                   // avenue pavement
  const TRUNK     = toon('#6b4a32');
  const LEAF_A    = toon('#7d9668');   // desaturated sage family (calm cel palette)
  const LEAF_B    = toon('#718c5e');
  const LEAF_C    = toon('#89a071');
  const IRON      = toon('#33383f');
  const IRON_LT   = toon('#474d56');
  const GLOW      = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.9 }); // lamp glass
  const GOLD      = toon('#e8c46f', { emissive: '#b3801f', emissiveIntensity: 0.45 }); // pyramidion
  const GRANITE   = toon('#c3a98c');                                   // obelisk shaft
  const GRANITE_DK= toon('#a98e70');                                   // obelisk bands / plinth
  const BASIN     = toon('#bcb4a3');                                   // fountain stone
  const BASIN_DK  = toon('#a59c8a');
  const WATER     = toon('#5f93b0');

  const arcDir = landmarkDir('arc');
  const conDir = landmarkDir('concorde');

  // =====================================================================
  //  1) ARC DE TRIOMPHE
  //  A solid block formed of four arched faces (their corners overlap to
  //  give chunky piers); the central main arch is tall, the side arches
  //  smaller — together a see-through cross-vault. Plain attic on top.
  // =====================================================================
  // an extruded wall panel with an arched (round-topped) opening cut up
  // from the ground — an inverted-U silhouette, extruded to thickness `t`.
  function archedWall(W, H, openW, spring, t, mat){
    const hw = W / 2, ho = openW / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw, 0); s.lineTo(-hw, H); s.lineTo(hw, H); s.lineTo(hw, 0);
    s.lineTo(ho, 0); s.lineTo(ho, spring);
    s.absarc(0, spring, ho, 0, Math.PI, false);   // round top → crown at spring+ho
    s.lineTo(-ho, 0); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 8 });
    geo.translate(0, 0, -t / 2);
    return solid(geo, mat);
  }

  function buildArc(){
    const g = new THREE.Group();
    const W = 2.6, D = 1.2, t = 0.22, wallH = 2.35;

    box(g, STONE_DK, W + 0.18, 0.16, D + 0.18, 0, 0.08, 0);          // socle / base step

    // four arched faces — front/back hold the big arch, sides the small one
    const front = archedWall(W, wallH, 1.45, 1.35, t, STONE); front.position.z = (D - t) / 2; g.add(front);
    const back  = archedWall(W, wallH, 1.45, 1.35, t, STONE); back.rotation.y = Math.PI;  back.position.z = -(D - t) / 2; g.add(back);
    const right = archedWall(D, wallH, 0.60, 0.95, t, STONE); right.rotation.y =  Math.PI / 2; right.position.x =  (W - t) / 2; g.add(right);
    const left  = archedWall(D, wallH, 0.60, 0.95, t, STONE); left.rotation.y  = -Math.PI / 2; left.position.x  = -(W - t) / 2; g.add(left);

    // entablature + plain attic block + cap lip
    box(g, CORNICE,  W + 0.16, 0.26, D + 0.16, 0, 2.33, 0);
    box(g, STONE_LT, W - 0.16, 0.58, D - 0.16, 0, 2.75, 0);          // plain attic block
    box(g, CORNICE,  W - 0.02, 0.08, D - 0.02, 0, 3.06, 0);

    // shallow inset relief panels suggesting sculpture (front + back faces)
    for(const sz of [1, -1]){
      const fz = sz * (D / 2 - 0.05);
      for(const sx of [-1, 1]){
        box(g, STONE_DK, 0.34, 1.20, 0.05, sx * 0.97, 0.92, fz);     // big pier relief panel
        box(g, STONE_DK, 0.26, 0.26, 0.05, sx * 0.62, 1.95, fz);     // spandrel medallion
      }
      box(g, STONE_DK, 2.18, 0.13, 0.05, 0, 2.33, sz * (D / 2 + 0.05)); // frieze on the cornice
      box(g, STONE_DK, 1.55, 0.30, 0.05, 0, 2.75, sz * (D / 2 - 0.11)); // attic blind/inscription panel
    }
    return g;
  }

  const arc = buildArc();
  arc.scale.setScalar(2.1);                // real-feel: ~50 m IRL — it should dwarf the avenue
  placeFacing(arc, arcDir, conDir, 0.0);   // +Z (front) faces down the Champs toward Concorde
  planetGroup.add(arc);
  // one collider per pier — you can walk the axe historique straight THROUGH the arch
  colliderAt(arcDir, conDir, -2.15, 0, 1.05);
  colliderAt(arcDir, conDir,  2.15, 0, 1.05);
  claim(arcDir, 3.8);

  // =====================================================================
  //  2) PLACE DE L'ÉTOILE — low round paved plaza ring around the Arc
  //  3) PLACE DE LA CONCORDE base — a matching (smaller) paved disc
  // =====================================================================
  function buildPlaza(radius){
    const g = new THREE.Group();
    g.add(ground(new THREE.CylinderGeometry(radius, radius, 0.14, 40), COBBLE));
    const ring = ground(new THREE.TorusGeometry(radius * 0.94, 0.12, 6, 44), COBBLE_DK);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.07; g.add(ring);
    return g;
  }
  const etoile = buildPlaza(2.3);
  placeOnSurface(etoile, arcDir, -0.05, 0);
  planetGroup.add(etoile);

  const conPlaza = buildPlaza(2.0);
  placeOnSurface(conPlaza, conDir, -0.05, 0);
  planetGroup.add(conPlaza);

  // =====================================================================
  //  3) CHAMPS-ÉLYSÉES — paved strip + double tree rows + lampposts.
  //  Sampled in metres between Arc and Concorde, projected per point.
  // =====================================================================
  const A = LANDMARKS.arc, C = LANDMARKS.concorde;
  const de = C.e - A.e, dn = C.n - A.n, L = Math.hypot(de, dn);
  const dh = [de / L, dn / L];          // unit heading (metres) Arc → Concorde
  const ph = [-dh[1], dh[0]];           // unit perpendicular (avenue cross-axis)
  const at = (m, lat) => [A.e + dh[0] * m + ph[0] * lat, A.n + dh[1] * m + ph[1] * lat];

  function buildTree(){
    const g = new THREE.Group();
    cyl(g, TRUNK, 0.05, 0.08, 0.55, 6, 0, 0.275, 0);
    const leaf = pick([LEAF_A, LEAF_B, LEAF_C]);
    const c1 = solid(new THREE.IcosahedronGeometry(0.40, 0), leaf); c1.position.y = 0.92; g.add(c1);
    const c2 = solid(new THREE.IcosahedronGeometry(0.27, 0), leaf); c2.position.set(0.22, 0.78, 0.10); g.add(c2);
    const c3 = solid(new THREE.IcosahedronGeometry(0.24, 0), leaf); c3.position.set(-0.20, 0.82, -0.12); g.add(c3);
    return g;
  }

  function buildLamp(){
    const g = new THREE.Group();
    cyl(g, IRON,    0.10, 0.17, 0.18, 8, 0, 0.09, 0);   // base
    cyl(g, IRON_LT, 0.045, 0.062, 1.50, 8, 0, 0.90, 0); // fluted pole
    cyl(g, IRON,    0.085, 0.10, 0.07, 8, 0, 0.50, 0);  // collar
    cyl(g, IRON,    0.06, 0.06, 0.10, 8, 0, 1.62, 0);   // head hub
    box(g, GLOW,    0.16, 0.22, 0.16, 0, 1.82, 0);      // central lantern
    cyl(g, IRON,    0.0, 0.12, 0.12, 8, 0, 1.99, 0);    // cap (cone)
    for(const sx of [-1, 1]){                            // candelabra side arms
      box(g, IRON,  0.34, 0.04, 0.04, sx * 0.17, 1.58, 0);
      box(g, GLOW,  0.12, 0.16, 0.12, sx * 0.32, 1.50, 0);
      cyl(g, IRON,  0.0, 0.09, 0.08, 6, sx * 0.32, 1.62, 0);
    }
    return g;
  }

  const champs = new THREE.Group();

  // paved strip — short flat tiles aimed along the avenue
  const paveStep = 130;
  for(let m = 0.06 * L; m <= 0.96 * L; m += paveStep){
    const c0 = at(m, 0), c1 = at(m + paveStep, 0);
    const tile = box(new THREE.Group(), PAVE, 1.5, 0.06, 1.18, 0, 0, 0);
    tile.castShadow = false;
    placeFacing(tile, parisToDir(c0[0], c0[1]), parisToDir(c1[0], c1[1]), 0.04);
    champs.add(tile);
  }

  // double rows of trees, both sides
  const treeStep = 150;
  for(let m = 0.11 * L; m <= 0.90 * L; m += treeStep){
    for(const side of [-1, 1]){
      for(const off of [130, 196]){
        const p = at(m, off * side);
        const tr = buildTree();
        placeOnSurface(tr, parisToDir(p[0], p[1]), 0, rand(0, 6.28));
        tr.scale.setScalar(rand(0.85, 1.12));
        champs.add(tr);
      }
    }
  }

  // a few ornate lampposts, alternating sides
  let li = 0;
  for(let m = 0.13 * L; m <= 0.90 * L; m += 380){
    const side = (li++ % 2 === 0) ? -1 : 1;
    const p = at(m, 108 * side);
    const lp = buildLamp();
    placeOnSurface(lp, parisToDir(p[0], p[1]), 0, rand(0, 6.28));
    champs.add(lp);
  }

  // bake the whole avenue into a few merged meshes (perf)
  planetGroup.add(champs);
  const champsMerged = ctx.bakeMerge(champs);
  planetGroup.remove(champs);
  planetGroup.add(champsMerged);

  // =====================================================================
  //  4) PLACE DE LA CONCORDE — Luxor Obelisk + two round fountains
  // =====================================================================
  function buildObelisk(){
    const g = new THREE.Group();
    box(g, BASIN_DK,   0.74, 0.22, 0.74, 0, 0.11, 0);          // plinth (lower)
    box(g, GRANITE_DK, 0.54, 0.18, 0.54, 0, 0.31, 0);          // plinth (upper)
    const core = new THREE.Group(); core.rotation.y = Math.PI / 4; g.add(core); // align square faces
    cyl(core, GRANITE,    0.15, 0.27, 1.95, 4, 0, 1.375, 0);   // tapering square shaft
    cyl(core, GRANITE_DK, 0.30, 0.30, 0.05, 4, 0, 0.43, 0);    // base band
    cyl(core, GRANITE_DK, 0.165, 0.18, 0.04, 4, 0, 2.30, 0);   // upper band
    cyl(core, GOLD,       0.0, 0.18, 0.22, 4, 0, 2.46, 0);     // gold pyramidion
    return g;
  }
  const obelisk = buildObelisk();
  placeFacing(obelisk, conDir, arcDir, 0.02);   // square faces aligned up the Champs
  planetGroup.add(obelisk);
  addCollider(conDir, 0.5);
  claim(conDir, 1.0);

  function buildFountain(){
    const g = new THREE.Group();
    cyl(g, BASIN,    0.86, 0.90, 0.10, 18, 0, 0.05, 0);   // basin floor
    cyl(g, BASIN_DK, 0.90, 0.92, 0.22, 18, 0, 0.11, 0);   // rim wall
    cyl(g, WATER,    0.82, 0.82, 0.06, 18, 0, 0.16, 0);   // water
    cyl(g, BASIN,    0.16, 0.22, 0.34, 12, 0, 0.30, 0);   // central pedestal
    cyl(g, BASIN_DK, 0.34, 0.28, 0.07, 14, 0, 0.50, 0);   // upper bowl
    cyl(g, WATER,    0.28, 0.28, 0.04, 14, 0, 0.54, 0);   // upper water
    cyl(g, WATER,    0.035, 0.05, 0.42, 6, 0, 0.78, 0);   // jet
    const drop = solid(new THREE.IcosahedronGeometry(0.07, 0), WATER); drop.position.y = 1.02; g.add(drop);
    return g;
  }
  for(const side of [-1, 1]){
    const p = [C.e + ph[0] * 215 * side, C.n + ph[1] * 215 * side];   // flank perpendicular to the axis
    const fd = parisToDir(p[0], p[1]);
    const f = buildFountain();
    placeOnSurface(f, fd, 0.0, 0);
    planetGroup.add(f);
    addCollider(fd, 0.85);
    claim(fd, 1.0);
  }
}
