// =====================================================================
//  paris/buildings.js — HAUSSMANN CITY FABRIC
// ---------------------------------------------------------------------
//  The cream-limestone apartment blocks that make up the bulk of Paris.
//  Each block is a chunky low-poly model: a regular grid of tall recessed
//  windows over 6–7 floors, continuous wrought-iron balconies on the
//  "noble" 2nd floor and the top floor, a different ground-floor shopfront,
//  and a grey ZINC mansard roof with little dormers + chimney pots.
//
//  PERFORMANCE: this is the bulk of the city, so every block is built
//  locally, placed, then baked with ctx.bakeMerge() down to a handful of
//  merged meshes (one per shared material) before being added — exactly
//  the buildHouses() pattern. Materials are shared across ALL blocks so
//  the whole fabric stays at a tiny, fixed material set.
//
//  Built local: base at y=0, +Y up, centred in X/Z, +Z = front facade.
// =====================================================================
import * as THREE from 'three';

export function build(ctx){
  const { planetGroup, toon, faceted, bakeMerge, placeFacing,
          parisToDir, LANDMARKS, addCollider, claim, freeSpot,
          rng, rand, randi, pick, geo } = ctx;

  // ---- shared low-poly mesh helpers -----------------------------------
  const solid = (g, mat) => { const m = new THREE.Mesh(faceted(g), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  function box(g, mat, w, h, d, x, y, z){
    const m = solid(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); g.add(m); return m;
  }
  function cyl(g, mat, rt, rb, h, seg, x, y, z){
    const m = solid(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x || 0, y || 0, z || 0); g.add(m); return m;
  }
  // a truncated rectangular pyramid (mansard slopes) as a faceted prism
  function frustumGeo(bw, bd, h, topScale){
    const a = bw / 2, b = bd / 2, c = a * topScale, e = b * topScale;
    const v = [
      [-a, 0,  b], [ a, 0,  b], [ a, 0, -b], [-a, 0, -b],   // base   0..3
      [-c, h,  e], [ c, h,  e], [ c, h, -e], [-c, h, -e],   // top    4..7
    ];
    const quads = [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]; // four slopes
    const pos = [];
    for(const q of quads){
      const p0 = v[q[0]], p1 = v[q[1]], p2 = v[q[2]], p3 = v[q[3]];
      pos.push(p0[0],p0[1],p0[2], p1[0],p1[1],p1[2], p2[0],p2[1],p2[2]);
      pos.push(p0[0],p0[1],p0[2], p2[0],p2[1],p2[2], p3[0],p3[1],p3[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  // ---- shared materials (reused across every block) -------------------
  const CREAM = ['#e8ddc8', '#ddd0b4', '#d8c8a8', '#e3d6bd'].map(c => toon(c)); // limestone tones
  const TRIM  = toon('#efe7d4');                                  // surrounds / sills / cornices / dormers / stacks
  const PANE  = toon('#3f4b56');                                  // ground-floor vitrine glass
  const PANE_SOFT = toon('#57636d');                              // upper-floor windows — softer, simpler
  const MULL  = toon('#eae3d0');                                  // white mullion crosses (tall French windows)
  const SHUTTER = toon('#8493a0');                                // grey-blue folded shutters
  const IRON  = toon('#2b2f36');                                  // wrought-iron balconies + ridges
  const ZINC  = toon('#525a64', { side: THREE.DoubleSide });      // zinc mansard roof
  const TERRA = toon('#bf6147');                                  // terracotta chimney pots
  const PLAQUE= toon('#33517a');                                  // enamel blue street-name plaque
  const TABAC = toon('#b34a3c');                                  // tabac 'carotte' diamond
  const SIGNB = toon('#20262c');                                  // dark sign board behind painted letters
  // muted Parisian shopfront palette — fascia + optional awning stripe pair
  const SHOPFRONTS = [
    { fascia: toon('#3d5a49'), stripe: [toon('#4a6b57'), toon('#e9e2cf')] },              // brasserie green
    { fascia: toon('#71413a'), stripe: [toon('#84504a'), toon('#e9e2cf')] },              // librairie oxblood
    { fascia: toon('#9b7d46'), stripe: null },                                            // boulangerie ochre
    { fascia: toon('#39465c'), stripe: [toon('#46566e'), toon('#d8d2c0')], tabac: true }, // tabac navy
    { fascia: toon('#5d6b50'), stripe: [toon('#6c7c5e'), toon('#e9e2cf')] },              // fleuriste sage
    { fascia: toon('#4a4f5c'), stripe: null },                                            // atelier slate
  ];

  // =====================================================================
  //  ONE HAUSSMANN BLOCK  (local model)
  // =====================================================================
  function buildBlock(opts){
    opts = opts || {};
    const g = new THREE.Group();
    const facade = pick(CREAM);

    const W  = rand(2.1, 3.0);          // facade width (along the street)
    const D  = rand(1.5, 1.8);          // depth into the block
    const T  = opts.floors || randi(6, 7); // total floors incl. ground (fewer out in the banlieue)
    const gH = rand(0.5, 0.6);          // ground-floor (shopfront) height
    const fH = rand(0.40, 0.45);        // upper-floor height
    const upper = T - 1;                // number of upper floors
    const bodyH = gH + upper * fH;      // masonry height (below the roof)
    const winH = fH * 0.62;
    const nobleF = Math.min(2, upper);  // the "noble" 2nd floor
    const topF   = upper;               // the top floor

    const hw = W / 2, hd = D / 2;

    // -- base socle + masonry body --------------------------------------
    box(g, TRIM,   W + 0.07, 0.14, D + 0.07, 0, 0.07, 0);
    box(g, facade, W,        bodyH, D,       0, bodyH / 2, 0);

    // -- shopfront cornice (ground/upper divide) + main cornice ---------
    box(g, TRIM, W + 0.06, 0.08, D + 0.06, 0, gH,         0);
    box(g, TRIM, W + 0.12, 0.11, D + 0.12, 0, bodyH - 0.02, 0);

    // -- regular grid of tall recessed windows on a face ----------------
    const bays = Math.max(3, Math.min(6, Math.round(W / 0.5)));
    const cellW = W / bays;
    const winW = Math.min(cellW * 0.52, 0.34);

    function windowGrid(sign, detailed){
      const fz   = sign * hd;
      const outZ = fz + sign * 0.02;     // surrounds / bands (proud)
      const panZ = fz + sign * 0.005;    // pane (just proud of wall, behind surround)
      for(let f = 1; f <= upper; f++){
        const cy = gH + (f - 0.5) * fH;
        const eye = f <= 2;              // the eye-level detail band (1st + 2nd floor)
        // continuous sill course; lintel course only in the eye-level band
        box(g, TRIM, W + 0.03, 0.04,  0.05, 0, cy - winH / 2 - 0.02, outZ);
        if(eye) box(g, TRIM, W + 0.03, 0.035, 0.045, 0, cy + winH / 2 + 0.03, outZ);
        for(let b = 0; b < bays; b++){
          const bx = -hw + (b + 0.5) * cellW;
          box(g, eye ? PANE : PANE_SOFT, winW, winH, 0.04, bx, cy, panZ);
          if(eye){
            // white mullion cross — tall French windows, not dark slabs
            box(g, MULL, 0.024, winH, 0.05, bx, cy, fz + sign * 0.014);
            box(g, MULL, winW, 0.024, 0.05, bx, cy + winH * 0.18, fz + sign * 0.014);
          }
          if(detailed && eye){
            // stone surround pilasters
            box(g, TRIM, 0.04, winH + 0.03, 0.05, bx - winW / 2 - 0.03, cy, outZ);
            box(g, TRIM, 0.04, winH + 0.03, 0.05, bx + winW / 2 + 0.03, cy, outZ);
            // some windows keep their folded shutters
            if(rng() < 0.4){
              box(g, SHUTTER, 0.07, winH * 0.96, 0.03, bx - winW / 2 - 0.10, cy, outZ);
              box(g, SHUTTER, 0.07, winH * 0.96, 0.03, bx + winW / 2 + 0.10, cy, outZ);
            }
          }
        }
      }
    }

    // -- continuous wrought-iron balcony across a face ------------------
    function balcony(sign, f){
      const fz = sign * hd;
      const cy = gH + (f - 0.5) * fH;
      const slabY = cy - winH / 2 - 0.04;
      const rz = fz + sign * 0.12;
      box(g, TRIM, W + 0.05, 0.05, 0.18, 0, slabY, fz + sign * 0.08);   // projecting stone slab
      const railBase = slabY + 0.02, railH = 0.26;
      box(g, IRON, W * 0.99, 0.025, 0.025, 0, railBase + railH, rz);    // top rail
      box(g, IRON, W * 0.99, 0.02,  0.025, 0, railBase + 0.03,  rz);    // lower rail
      const nb = Math.max(5, Math.round(W / 0.22));
      for(let i = 0; i <= nb; i++){
        const bx = -W * 0.495 + i * (W * 0.99 / nb);
        box(g, IRON, 0.012, railH, 0.012, bx, railBase + railH / 2, rz);// balusters
      }
    }

    // -- ground-floor shopfront — the eye-level heart of the facade -----
    function shopfront(sign, dress){
      const fz = sign * hd;
      const outZ = fz + sign * 0.02, glassZ = fz + sign * 0.006;
      const ng = randi(2, 3);
      const margin = 0.16, span = W - margin * 2, sw = span / ng;
      box(g, TRIM, W + 0.04, 0.1, 0.06, 0, 0.06, outZ);                 // plinth
      const shop = dress ? pick(SHOPFRONTS) : null;
      const doorAt = dress ? randi(0, ng - 1) : -1;
      for(let i = 0; i < ng; i++){
        const cx = -span / 2 + (i + 0.5) * sw;
        const openW = sw * 0.78, openH = gH * 0.72;
        if(i === doorAt){
          // panelled shop door with a lit transom light
          box(g, shop.fascia, openW * 0.55, gH * 0.78, 0.05, cx, 0.16 + gH * 0.39, glassZ);
          box(g, PANE, openW * 0.34, gH * 0.30, 0.04, cx, 0.16 + gH * 0.58, fz + sign * 0.012);
        } else {
          box(g, PANE, openW, openH, 0.05, cx, 0.16 + openH / 2, glassZ); // vitrine
          box(g, MULL, openW, 0.022, 0.04, cx, 0.16 + openH * 0.62, fz + sign * 0.012); // transom bar
          if(shop) box(g, shop.fascia, openW, openH * 0.22, 0.05, cx, 0.16 + openH * 0.11, fz + sign * 0.010); // stallriser
        }
        box(g, TRIM, 0.08, gH, 0.06, -span / 2 + i * sw, gH / 2, outZ); // pier
      }
      box(g, TRIM, 0.08, gH, 0.06, span / 2, gH / 2, outZ);             // end pier
      if(!dress) return;
      // fascia band + dark sign board with painted 'lettering' dashes
      box(g, shop.fascia, W * 0.99, 0.13, 0.06, 0, gH - 0.045, outZ);
      box(g, SIGNB, span * 0.5, 0.075, 0.02, 0, gH - 0.045, fz + sign * 0.055);
      const nL = randi(3, 5);
      for(let k = 0; k < nL; k++)
        box(g, TRIM, 0.045, 0.028, 0.014, -span * 0.19 + k * span * 0.095, gH - 0.045, fz + sign * 0.062);
      // striped canvas awning over the vitrines
      if(shop.stripe && rng() < 0.75){
        const aw = span * 0.66, stripes = Math.max(4, Math.round(aw / 0.22)), swd = aw / stripes;
        for(let k = 0; k < stripes; k++){
          const sm = shop.stripe[k % 2];
          const top = box(g, sm, swd * 0.96, 0.03, 0.34, -aw / 2 + (k + 0.5) * swd, gH * 0.86, fz + sign * 0.20);
          top.rotation.x = sign * 0.5;
          box(g, sm, swd * 0.96, 0.10, 0.03, -aw / 2 + (k + 0.5) * swd, gH * 0.86 - 0.12, fz + sign * 0.36);
        }
      }
      // tabac 'carotte' — the red diamond jutting out over the pavement
      if(shop.tabac){
        const cx = hw * 0.55;
        box(g, IRON, 0.03, 0.03, 0.18, cx, gH + 0.10, fz + sign * 0.09);
        const car = box(g, TABAC, 0.11, 0.26, 0.03, cx, gH + 0.10, fz + sign * 0.20);
        car.rotation.z = Math.PI / 4; car.scale.set(1, 0.55, 1);
      }
      // hanging shop sign on an iron bracket at 1st-floor height
      if(rng() < 0.5){
        const sx = -hw * 0.5;
        box(g, IRON, 0.03, 0.03, 0.30, sx, gH + fH * 0.9, fz + sign * 0.15);
        box(g, shop.fascia, 0.22, 0.16, 0.02, sx, gH + fH * 0.9 - 0.15, fz + sign * 0.28);
      }
      // enamel blue street-name plaque near the corner
      if(rng() < 0.8){
        const px = (rng() < 0.5 ? -1 : 1) * (hw - 0.28);
        box(g, TRIM, 0.27, 0.14, 0.015, px, gH + 0.18, outZ);
        box(g, PLAQUE, 0.235, 0.105, 0.02, px, gH + 0.18, fz + sign * 0.032);
      }
    }

    // both long faces read as street facades (backs face streets too);
    // the front adds pilasters + shutters, ends stay minimal
    windowGrid( 1, true);
    windowGrid(-1, false);
    shopfront( 1, true);
    shopfront(-1, true);
    for(const f of new Set([nobleF, topF])){ balcony(1, f); balcony(-1, f); }

    // -- short-end window columns (±X faces) ----------------------------
    for(const sx of [-1, 1]){
      const fx = sx * hw, outX = fx + sx * 0.02, panX = fx + sx * 0.005;
      const ecols = Math.max(2, Math.min(3, Math.round(D / 0.7)));
      for(let f = 1; f <= upper; f++){
        const cy = gH + (f - 0.5) * fH;
        for(let c = 0; c < ecols; c++){
          const bz = -hd + (c + 0.5) * (D / ecols);
          const win = box(g, PANE, 0.04, winH, winW * 0.9, panX, cy, bz);
          win.scale.set(1, 1, 1);
        }
      }
    }

    // -- grey zinc mansard roof -----------------------------------------
    const mh = rand(0.5, 0.7), topS = 0.6;
    const roof = solid(frustumGeo(W + 0.04, D + 0.04, mh, topS), ZINC);
    roof.position.y = bodyH; g.add(roof);
    box(g, ZINC, (W + 0.04) * topS, 0.05, (D + 0.04) * topS, 0, bodyH + mh, 0); // flat top
    box(g, IRON, (W + 0.04) * topS + 0.04, 0.03, 0.04, 0, bodyH + mh + 0.02, 0); // ridge crest

    // dormer windows poking out of the front slope
    const nd = randi(2, 3);
    for(let i = 0; i < nd; i++){
      const dx = (-(nd - 1) / 2 + i) * (W / (nd + 0.2));
      const t = 0.4;
      const zc = (hd + 0.02) * (1 - t) + (hd + 0.02) * topS * t; // slope surface z
      const y  = bodyH + mh * t;
      box(g, TRIM, 0.28, 0.30, 0.16, dx, y + 0.06, zc + 0.04);   // dormer body
      box(g, PANE, 0.17, 0.18, 0.04, dx, y + 0.07, zc + 0.13);   // dormer pane
      box(g, ZINC, 0.32, 0.05, 0.16, dx, y + 0.22, zc + 0.02);   // dormer cap
    }

    // 1–2 chimney stacks with terracotta pots
    const nc = randi(1, 2);
    for(let i = 0; i < nc; i++){
      const cx = (i === 0 ? -1 : 1) * W * rand(0.18, 0.3);
      const cz = rand(-hd * 0.2, hd * 0.2);
      const ch = rand(0.4, 0.6), y0 = bodyH + mh;
      box(g, TRIM, 0.26, ch, 0.2, cx, y0 + ch / 2, cz);          // stack
      box(g, TRIM, 0.31, 0.05, 0.25, cx, y0 + ch, cz);           // cap slab
      const np = randi(2, 3);
      for(let p = 0; p < np; p++){
        const px = cx - 0.06 * (np - 1) / 2 + p * 0.06;
        cyl(g, TERRA, 0.035, 0.04, 0.14, 6, px, y0 + ch + 0.09, cz);
      }
    }

    return g;
  }

  // =====================================================================
  //  PLACEMENT — scatter blocks across the buildable, central city
  //  Fewer, better-spaced blocks: the corridors between them have to be
  //  wide enough to actually stroll down, and the great flat monuments
  //  (Arc, Opéra, Louvre…) need open ground around them instead of a wall
  //  of apartment buildings.
  // =====================================================================
  const arc = LANDMARKS.arc;

  // flat monuments + landmarks that deserve a clear apron of open ground
  const BREATHE = [
    ['arc', 370], ['concorde', 330], ['opera', 280], ['madeleine', 260],
    ['louvre', 400], ['pantheon', 260], ['invalides', 330], ['hoteldeville', 300],
    ['eiffel', 470], ['montparnasse', 280], ['sacrecoeur', 400], ['notredame', 380],
    ['bastille', 240], ['republique', 240], ['trocadero', 320], ['moulinrouge', 240],
  ].map(([k, r]) => ({ e: LANDMARKS[k].e, n: LANDMARKS[k].n, r }));
  const nearMonument = (e, n) => {
    for(const m of BREATHE){ if(Math.hypot(e - m.e, n - m.n) < m.r) return true; }
    return false;
  };
  const START = { e: -3800, n: -280 };                           // keep the spawn plaza open
  const EDGE = 5520;                                             // build out to the polar-sea shore (carve starts ~5670 — corners must stay on flat ground)

  // the reward view: a protected sightline down the Champ de Mars axis from
  // the spawn plaza to the Tour Eiffel — nothing tall may stand in the wedge
  const EIFFEL = LANDMARKS.eiffel;
  const VISTA = (() => {
    const dx = EIFFEL.e - START.e, dy = EIFFEL.n - START.n;
    const L = Math.hypot(dx, dy);
    return { ox: START.e - dx/L*400, oy: START.n - dy/L*400, tx: dx/L, ty: dy/L, len: L + 800, half: 190 };
  })();
  const inVista = (e, n) => {
    const dx = e - VISTA.ox, dy = n - VISTA.oy;
    const along = dx*VISTA.tx + dy*VISTA.ty;
    if(along < 0 || along > VISTA.len) return false;
    return Math.abs(-dx*VISTA.ty + dy*VISTA.tx) < VISTA.half;
  };

  let placed = 0, tries = 0;
  const MAX = 300, MAX_TRIES = 90000;
  const START_DIR = parisToDir(START.e, START.n);
  // camera-safe corridors: facades must sit well back from street centrelines,
  // and neighbouring blocks keep a strolling gap between them
  const CORRIDOR = 165;                                          // metres from any avenue/boulevard centreline
  const BLOCK_GAP = 2.6;                                         // world-unit claim radius between block centres

  while(placed < MAX && tries < MAX_TRIES){
    tries++;
    // sample Paris metres across the whole metropolis — mildly biased to the
    // core, but the outer arrondissements & banlieue fabric fill the far globe
    const ang = rng() * Math.PI * 2;
    const rad = Math.pow(rng(), 0.85) * EDGE;
    const e = Math.cos(ang) * rad, n = Math.sin(ang) * rad;
    const fromND = Math.hypot(e, n);

    if(fromND >= EDGE) continue;                                 // within greater Paris
    if(geo.isPark(e, n)) continue;                               // parks/Bois get trees, not blocks
    // river setback: 70 m centrally, growing outward — near the pole a block's
    // DIAGONAL spans far more chart metres, so the margin must grow with it
    const rivMargin = 70 + Math.max(0, (fromND - 4200) / 1800) * 90;
    if(!(geo.seineDist2D(e, n) > geo.riverHalfAt(e, n) + geo.chartMargin(rivMargin, e, n) || geo.onIsland(e, n))) continue; // well off the river / quays
    if(geo.onBridge(e, n, 95)) continue;                         // keep the bridge approaches clear
    if(geo.roadMask(e, n) >= 0.42) continue;                     // off avenues AND the Périphérique
    if(geo.roadDist2D(e, n) < CORRIDOR) continue;                // leave a camera-wide street corridor
    if(nearMonument(e, n)) continue;                             // give the monuments room
    // spawn clearing measured on the sphere — chart metres shrink out here
    if(parisToDir(e, n).angleTo(START_DIR) * geo.R < 7.5) continue;
    if(inVista(e, n)) continue;                                  // protect the Eiffel sightline

    const dir = parisToDir(e, n);
    if(!freeSpot(dir, BLOCK_GAP)) continue;                      // clear walking gap to any neighbour

    // skyline gradient: tall Haussmann in the core, lower blocks in the
    // outer arrondissements, squat banlieue stock toward the edge
    const floors = fromND < 3400 ? randi(6, 7)
                 : fromND < 4900 ? randi(5, 6)
                 :                 randi(3, 5);

    // orient: face the Étoile near the Arc (radial avenues), else snap to a
    // rough street grid using the local east/north tangent frame
    const fr = geo.frameAt(dir);
    let faceDir;
    const dArc = Math.hypot(e - arc.e, n - arc.n);
    if(dArc < 1400){
      const de = arc.e - e, dn = arc.n - n, L = Math.hypot(de, dn) || 1;
      faceDir = fr.east.clone().multiplyScalar(de / L).addScaledVector(fr.north, dn / L);
    } else {
      const cell = Math.floor((e + 1e5) / 650) * 3 + Math.floor((n + 1e5) / 650) * 5;
      const k = ((cell % 4) + 4) % 4;
      faceDir = (k === 0) ? fr.east.clone()
              : (k === 1) ? fr.north.clone()
              : (k === 2) ? fr.east.clone().negate()
              :             fr.north.clone().negate();
    }

    const block = buildBlock({ floors });
    placeFacing(block, dir, faceDir, -0.02);
    planetGroup.add(block);
    const merged = bakeMerge(block);
    planetGroup.remove(block);
    planetGroup.add(merged);

    addCollider(dir, 0.9, 4.2);  // forgiving footprint — slide past corners easily; full-height blocker
    claim(dir, BLOCK_GAP);    // keeps a camera-walkable street between block centres
    placed++;
  }
}
