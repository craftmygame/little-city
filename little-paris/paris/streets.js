// =====================================================================
//  paris/streets.js — THE STREET LAYER (what makes Paris a planned city)
// ---------------------------------------------------------------------
//  1) PLANE TREES — pollarded (straight trunk + a tight, trimmed cuboid
//     canopy) lining the 12 radiating avenues of l'Étoile and threaded
//     along the Seine quays. All trunks in one InstancedMesh, all
//     canopies in another (per-instance colour), so a few hundred trees
//     cost almost nothing. No colliders (you can stroll through them).
//  2) CANDÉLABRES — ornate Parisian lampposts: a fluted dark column with
//     a glowing emissive-glass lantern head, set at intervals down the
//     avenues. Built local, then baked into a couple of merged meshes.
//  3) PLAZA ACCENTS — low flat paved discs/squares of cobble colour at
//     the great places (Étoile, Concorde, Bastille, République, Opéra,
//     Madeleine, Hôtel de Ville) so the junctions read as "places".
//  4) COLUMN MONUMENTS — the July Column at Bastille (slender bronze
//     column on a square plinth, gold winged "Génie" on top) and the
//     Monument à la République (a stepped pedestal with a standing
//     bronze figure). These get small colliders.
//
//  Everything is built local (base at y=0, +Y up, centred at origin)
//  then dropped onto the sphere with the ctx surface helpers.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function build(ctx){
  const { planetGroup, toon, faceted, placeOnSurface, parisToDir,
          landmarkDir, LANDMARKS, geo, addCollider, claim,
          rand, pick, bakeMerge } = ctx;
  const { AVENUES, SEINE_PTS, seineDist2D } = geo;

  // ---- low-poly mesh helpers (faceted, shadowed, group-first) ---------
  const solid = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z){ const m = solid(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x||0, y||0, z||0); g.add(m); return m; }
  function cyl(g, mat, rt, rb, h, seg, x, y, z){ const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x||0, y||0, z||0); g.add(m); return m; }
  function sph(g, mat, r, x, y, z){ const m = solid(new THREE.IcosahedronGeometry(r, 0), mat); m.position.set(x||0, y||0, z||0); g.add(m); return m; }
  // flat ground tile: receives shadow but doesn't cast (avoids shadow acne on the plaza)
  const flat = (geo, mat) => { const m = new THREE.Mesh(faceted(geo), mat); m.castShadow = false; m.receiveShadow = true; return m; };

  // ---- shared materials -----------------------------------------------
  const TRUNK     = toon('#a59a80');                                   // mottled plane-tree bark
  const LEAF      = toon('#ffffff');                                   // white → tinted per-instance
  const IRON      = toon('#34393f');                                   // dark cast-iron column
  const IRON_LT   = toon('#474d56');                                   // fluting / arms
  const GLOW      = toon('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 0.95 }); // lantern glass
  const COBBLE    = toon('#8d8478');                                   // plaza paving
  const COBBLE_DK = toon('#6f675c');                                   // plaza ring outline
  const STONE_PALE= toon('#d8cbb0');                                   // plinth stone
  const STONE_DK  = toon('#b9ab8c');                                   // pedestal stone
  const BRONZE    = toon('#5f8f79');                                   // verdigris bronze (column / Marianne)
  const GOLD      = toon('#e8c46f', { emissive: '#b3801f', emissiveIntensity: 0.5 }); // Génie / gilt accents

  const ARC = LANDMARKS.arc;
  const dummy = new THREE.Object3D();
  const tmpCol = new THREE.Color();

  // =====================================================================
  //  1) PLANE TREES — gather every planting spot first, then instance.
  //  A spot = { dir, s } (s = uniform scale). We skip the river and the
  //  far edge of the planet.
  // =====================================================================
  const slots = [];
  const tryPlant = (e, n, s) => {
    if(seineDist2D(e, n) < geo.riverHalfAt(e, n) + geo.chartMargin(15, e, n)) return;  // don't plant in the Seine
    if(Math.hypot(e, n) > 5560) return;          // stop at the polar-sea shore
    slots.push({ dir: parisToDir(e, n), s });
  };

  // --- avenues: march out from the Arc, a tree each side of the roadway
  const AV_OFFSET = 56;                          // just past the widened roadway (48 m half-width)
  for(const av of AVENUES){
    const ca = Math.cos(av.angle), sa = Math.sin(av.angle);
    const px = -sa, py = ca;                      // unit perpendicular (cross-axis)
    for(let d = 420; d <= 4000; d += 220){   // start past the place — the 12 avenues converge there
      const ce = ARC.e + ca * d, cn = ARC.n + sa * d;
      for(const side of [-1, 1]){
        tryPlant(ce + px * AV_OFFSET * side, cn + py * AV_OFFSET * side, rand(0.86, 1.14));
      }
    }
  }

  // --- Seine quays: walk the centreline, plant rows offset onto each bank
  for(let i = 0; i < SEINE_PTS.length - 1; i += 3){
    const a = SEINE_PTS[i], b = SEINE_PTS[i + 1];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
    const px = -ty, py = tx;                       // perpendicular = toward the banks
    const off = geo.riverHalfAt(a[0], a[1]) + geo.chartMargin(73, a[0], a[1]);  // past the quai road band, wherever the river runs
    for(const side of [-1, 1]){
      tryPlant(a[0] + px * off * side, a[1] + py * off * side, rand(0.82, 1.08));
    }
  }

  // --- build the two InstancedMeshes (pollarded plane tree)
  const N = slots.length;
  const trunkGeo = faceted(new THREE.CylinderGeometry(0.055, 0.08, 0.82, 6)); trunkGeo.translate(0, 0.41, 0);
  // layered-blob canopy — reads as trimmed foliage at eye level (no cubes)
  const canopyGeo = (() => {
    const a = new THREE.IcosahedronGeometry(0.335, 1); a.scale(1.18, 0.88, 1.18); a.translate(0, 0.98, 0);
    const b = new THREE.IcosahedronGeometry(0.245, 1); b.scale(1.06, 0.80, 1.06); b.translate(0.11, 1.30, 0.05);
    const c = new THREE.IcosahedronGeometry(0.19, 1);  c.scale(1.0, 0.78, 1.0);  c.translate(-0.13, 1.24, -0.06);
    return faceted(mergeGeometries([a, b, c], false));
  })();

  const trunks   = new THREE.InstancedMesh(trunkGeo, TRUNK, N);
  const canopies = new THREE.InstancedMesh(canopyGeo, LEAF, N);
  trunks.castShadow = canopies.castShadow = true;
  trunks.receiveShadow = canopies.receiveShadow = true;
  trunks.frustumCulled = canopies.frustumCulled = false;   // instances span the whole globe
  const canopyCol = new Float32Array(N * 3);
  const greens = ['#7d9668', '#89a071', '#718c5e', '#95ac80', '#677f55'];  // desaturated sage family
  for(let i = 0; i < N; i++){
    const { dir, s } = slots[i];
    placeOnSurface(dummy, dir, 0, rand(0, 6.28));
    dummy.scale.set(s, s * rand(0.94, 1.12), s);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    canopies.setMatrixAt(i, dummy.matrix);
    tmpCol.set(pick(greens)).offsetHSL(0, rand(-0.03, 0.03), rand(-0.05, 0.05));
    canopyCol[i * 3] = tmpCol.r; canopyCol[i * 3 + 1] = tmpCol.g; canopyCol[i * 3 + 2] = tmpCol.b;
  }
  canopies.instanceColor = new THREE.InstancedBufferAttribute(canopyCol, 3);
  canopies.instanceColor.needsUpdate = true;
  planetGroup.add(trunks);
  planetGroup.add(canopies);
  // flat blob-shadow discs ground the street trees (shadow maps are off)
  {
    const shadGeo = faceted(new THREE.CircleGeometry(0.55, 12)); shadGeo.rotateX(-Math.PI/2); shadGeo.translate(0, 0.03, 0);
    const shadMat = new THREE.MeshBasicMaterial({ color:'#20302c', transparent:true, opacity:0.14, depthWrite:false });
    const shads = new THREE.InstancedMesh(shadGeo, shadMat, N);
    shads.frustumCulled = false;
    for(let i = 0; i < N; i++){
      const { dir, s } = slots[i];
      placeOnSurface(dummy, dir, 0, 0); dummy.scale.set(s, 1, s); dummy.updateMatrix();
      shads.setMatrixAt(i, dummy.matrix);
    }
    planetGroup.add(shads);
  }

  // =====================================================================
  //  2) CANDÉLABRES — ornate lampposts down the avenues (~1.8 units).
  //  Built into one group then baked into a couple of merged meshes.
  // =====================================================================
  function buildLamp(){
    const g = new THREE.Group();
    cyl(g, IRON,    0.115, 0.165, 0.18, 8, 0, 0.09, 0);   // octagonal base
    cyl(g, IRON,    0.085, 0.115, 0.12, 8, 0, 0.24, 0);   // base moulding
    cyl(g, IRON_LT, 0.045, 0.07,  1.30, 8, 0, 0.92, 0);   // fluted shaft
    cyl(g, IRON,    0.075, 0.09,  0.06, 8, 0, 0.58, 0);   // mid collar
    cyl(g, IRON,    0.06,  0.075, 0.10, 8, 0, 1.60, 0);   // head hub
    box(g, GLOW,    0.16,  0.22,  0.16,    0, 1.78, 0);   // central lantern glass
    cyl(g, IRON,    0.0,   0.12,  0.13, 8, 0, 1.95, 0);   // crowning cap (cone)
    sph(g, IRON,    0.04,                  0, 2.05, 0);   // finial
    for(const sx of [-1, 1]){                              // candelabra side arms + small lanterns
      box(g, IRON_LT, 0.30, 0.045, 0.045, sx * 0.16, 1.55, 0);
      box(g, GLOW,    0.11, 0.15,  0.11,  sx * 0.30, 1.46, 0);
      cyl(g, IRON,    0.0,  0.085, 0.09, 6, sx * 0.30, 1.58, 0);
    }
    return g;
  }

  const lamps = new THREE.Group();
  for(const av of AVENUES){
    const ca = Math.cos(av.angle), sa = Math.sin(av.angle);
    const px = -sa, py = ca;
    let k = 0;
    for(let d = 460; d <= 4000; d += 420){
      const side = (k++ % 2 === 0) ? -1 : 1;     // alternate kerbs
      const e = ARC.e + ca * d + px * AV_OFFSET * side;
      const n = ARC.n + sa * d + py * AV_OFFSET * side;
      if(seineDist2D(e, n) < geo.riverHalfAt(e, n) + geo.chartMargin(15, e, n)) continue;
      if(Math.hypot(e, n) > 5560) continue;
      const lamp = buildLamp();
      placeOnSurface(lamp, parisToDir(e, n), 0, rand(0, 6.28));
      lamps.add(lamp);
    }
  }
  planetGroup.add(lamps);
  const lampsMerged = bakeMerge(lamps);
  planetGroup.remove(lamps);
  planetGroup.add(lampsMerged);

  // =====================================================================
  //  3) PLAZA ACCENTS — low paved discs / squares at the great places.
  //  (Slightly raised inner medallion so it reads even where another
  //  module has already laid a bigger plaza, e.g. Étoile / Concorde.)
  // =====================================================================
  function buildPlaza(radius, square){
    const g = new THREE.Group();
    if(square){
      g.add(flat(new THREE.BoxGeometry(radius * 1.8, 0.12, radius * 1.8), COBBLE));
      const ring = flat(new THREE.BoxGeometry(radius * 1.86, 0.04, radius * 1.86), COBBLE_DK);
      ring.position.y = 0.07; g.add(ring);
    } else {
      g.add(flat(new THREE.CylinderGeometry(radius, radius, 0.12, 40), COBBLE));
      const ring = flat(new THREE.TorusGeometry(radius * 0.93, 0.1, 6, 44), COBBLE_DK);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.07; g.add(ring);
    }
    return g;
  }
  const PLACES = [
    { key: 'arc',          r: 1.9, square: false },
    { key: 'concorde',     r: 1.7, square: true  },
    { key: 'bastille',     r: 1.3, square: false },
    { key: 'republique',   r: 1.5, square: true  },
    { key: 'opera',        r: 1.3, square: false },
    { key: 'madeleine',    r: 1.2, square: false },
    { key: 'hoteldeville', r: 1.5, square: true  },
  ];
  for(const p of PLACES){
    const plaza = buildPlaza(p.r, p.square);
    placeOnSurface(plaza, landmarkDir(p.key), -0.02, p.square ? rand(0, 6.28) : 0);
    planetGroup.add(plaza);
  }

  // =====================================================================
  //  4) COLUMN MONUMENTS
  //  A reusable little standing figure (chunky low-poly silhouette).
  // =====================================================================
  function buildFigure(bodyMat, accentMat, winged){
    const g = new THREE.Group();
    cyl(g, bodyMat, 0.12, 0.18, 0.12, 8, 0, 0.06, 0);          // robe hem / skirt flare
    cyl(g, bodyMat, 0.05, 0.13, 0.34, 8, 0, 0.25, 0);          // tapered torso
    sph(g, bodyMat, 0.085, 0, 0.46, 0);                        // head
    const armUp = box(g, bodyMat, 0.045, 0.26, 0.045, -0.11, 0.40, 0); armUp.rotation.z = 0.7;   // raised arm
    const armDn = box(g, bodyMat, 0.045, 0.22, 0.045,  0.11, 0.26, 0); armDn.rotation.z = -0.25; // lowered arm
    if(winged){
      for(const sx of [-1, 1]){                                 // two gilt wings sweeping up & back
        const w = box(g, accentMat, 0.05, 0.36, 0.20, sx * 0.13, 0.34, -0.06);
        w.rotation.z = sx * -0.55; w.rotation.y = sx * 0.35;
      }
      const star = solid(new THREE.OctahedronGeometry(0.07, 0), accentMat); // star held aloft
      star.position.set(-0.22, 0.62, 0); g.add(star);
    } else {
      const branch = box(g, accentMat, 0.03, 0.28, 0.03, -0.22, 0.62, 0);   // olive branch
      branch.rotation.z = 0.35;
    }
    return g;
  }

  // --- July Column (Colonne de Juillet) at Bastille -------------------
  function buildJulyColumn(){
    const g = new THREE.Group();
    box(g, STONE_PALE, 0.92, 0.18, 0.92, 0, 0.09, 0);          // base step
    box(g, STONE_DK,   0.60, 0.46, 0.60, 0, 0.41, 0);          // square plinth
    box(g, STONE_PALE, 0.70, 0.08, 0.70, 0, 0.68, 0);          // plinth cap
    cyl(g, BRONZE,     0.13, 0.16, 1.55, 14, 0, 1.49, 0);      // slender bronze shaft
    for(const y of [0.95, 1.32, 1.69, 2.06])                    // gilt rings
      cyl(g, GOLD, 0.155, 0.155, 0.045, 14, 0, y, 0);
    cyl(g, GOLD, 0.21, 0.15, 0.12, 14, 0, 2.33, 0);            // gilt capital
    cyl(g, GOLD, 0.16, 0.16, 0.10, 14, 0, 2.45, 0);            // gallery / globe drum
    const genie = buildFigure(GOLD, GOLD, true);               // gold winged "Génie de la Liberté"
    genie.scale.setScalar(0.78); genie.position.y = 2.50; g.add(genie);
    return g;
  }
  const bastilleDir = landmarkDir('bastille');
  const julyCol = buildJulyColumn();
  julyCol.scale.setScalar(1.6);          // real-feel: 47 m column over the place
  placeOnSurface(julyCol, bastilleDir, 0, 0);
  planetGroup.add(julyCol);
  addCollider(bastilleDir, 0.65);
  claim(bastilleDir, 1.1);

  // --- Monument à la République: stepped pedestal + standing Marianne --
  function buildRepublique(){
    const g = new THREE.Group();
    box(g, STONE_PALE, 1.04, 0.20, 1.04, 0, 0.10, 0);          // base step
    box(g, STONE_DK,   0.66, 1.00, 0.66, 0, 0.70, 0);          // tall pedestal
    box(g, STONE_DK,   0.30, 0.42, 0.04, 0, 0.70, 0.34);       // inscription panel (front)
    box(g, STONE_PALE, 0.80, 0.10, 0.80, 0, 1.25, 0);          // pedestal cap
    const marianne = buildFigure(BRONZE, BRONZE, false);        // standing bronze figure
    marianne.scale.setScalar(1.7); marianne.position.y = 1.30; g.add(marianne);
    return g;
  }
  const repDir = landmarkDir('republique');
  const repMon = buildRepublique();
  repMon.scale.setScalar(1.35);
  placeOnSurface(repMon, repDir, 0, 0);
  planetGroup.add(repMon);
  addCollider(repDir, 0.62);
  claim(repDir, 1.0);
}
