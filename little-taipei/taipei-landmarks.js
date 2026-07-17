/* =====================================================================
 *  TAIPEI TINY PLANET — LANDMARK MODELS  (pure local-space builders)
 * ---------------------------------------------------------------------
 *  Every builder receives a CTX object and returns a THREE.Group built
 *  in LOCAL space: origin at the base-centre on the ground, +Y up, the
 *  building's FRONT facing +Z. No sphere/planet math lives here — the
 *  host (taipei.html) places each model onto the planet surface.
 *
 *  CTX = { THREE, toon, faceted, mesh, box, cyl, cone, sph, group }
 *  A mesh with userData.tpSpin = <rad/sec> is rotated about its local Z
 *  by the host each frame (Miramar Ferris wheel).
 * ===================================================================== */

// ---------------------------------------------------------------------
//  TAIPEI 101 — the dramatic vertical anchor
// ---------------------------------------------------------------------
function buildTaipei101(CTX){
  const g = CTX.group();
  const SQ = Math.PI / 4;                 // spin 4-gons so flat faces front
  const R  = (w) => w / Math.SQRT2;       // square face-width -> circumradius

  const stone     = CTX.toon('#5C656A');
  const stoneDark = CTX.toon('#454D52');
  const glassA    = CTX.toon('#4C8C8A');
  const glassB    = CTX.toon('#6FA8A2');
  const podGlass  = CTX.toon('#3E5E60');
  const gold      = CTX.toon('#D0A23C', { emissive: '#7A5E1F', emissiveIntensity: 0.25 });
  const silver    = CTX.toon('#9AA3A8');
  const mastMat   = CTX.toon('#C9CED2');
  const beaconMat = CTX.toon('#C0392B', { emissive: '#C0392B', emissiveIntensity: 0.6 });
  const litWin    = CTX.toon('#bfe3e0', { emissive: '#9fd8d0', emissiveIntensity: 0.3 });
  const holeMat   = CTX.toon('#2E3940');
  const lobbyGlow = CTX.toon('#E8D7A7', { emissive:'#D9B96B', emissiveIntensity:0.32 });
  const lobbyFloor= CTX.toon('#C8C2B6');

  // Walkable podium lobby. The old podium was one sealed solid box with doors
  // painted on its face; this U-shell leaves a real street-level opening.
  g.add(CTX.box(9.40,0.08,7.40,lobbyFloor,0,0.04,0));                    // broad public floor / forecourt edge
  g.add(CTX.box(9.00,4.10,0.22,stone,0,2.10,-3.42));                     // rear wall
  g.add(CTX.box(0.22,4.10,6.85,stone,-4.42,2.10,0));                     // side walls
  g.add(CTX.box(0.22,4.10,6.85,stone, 4.42,2.10,0));
  g.add(CTX.box(2.60,4.10,0.22,stone,-3.15,2.10,3.42));                  // glazed façade wings
  g.add(CTX.box(2.60,4.10,0.22,stone, 3.15,2.10,3.42));
  g.add(CTX.box(0.22,3.20,0.22,silver,-1.68,1.62,3.44));                 // tall portal frame
  g.add(CTX.box(0.22,3.20,0.22,silver, 1.68,1.62,3.44));
  g.add(CTX.box(3.58,0.22,0.22,silver,0,3.18,3.44));
  g.add(CTX.box(8.25,3.35,0.05,lobbyGlow,0,1.80,-3.28));                 // warm rear lobby
  g.add(CTX.box(2.25,2.80,1.35,stoneDark,0,1.44,-2.10));                 // lift/core volume
  g.add(CTX.box(1.60,0.88,0.46,gold,1.35,0.47,-0.72));                   // reception beside, not across, the route
  for(const x of [-3.10,-2.25,2.25,3.10]){
    g.add(CTX.box(0.72,3.45,0.05,podGlass,x,1.78,3.55));
    g.add(CTX.box(0.035,3.45,0.07,silver,x-0.36,1.78,3.58));
  }
  g.add(CTX.box(9.12,0.12,7.05,silver,0,4.12,0));                       // podium roof / tower datum
  g.add(CTX.box(5.20,0.18,1.55,silver,0,3.02,4.05));                    // deep arrival canopy
  for(const x of [-3.6,-2.7,-1.8,-.9,0,.9,1.8,2.7,3.6])
    g.add(CTX.box(0.035,3.35,0.06,silver,x,1.78,3.60));                  // real façade's fine vertical grid

  // tower: 8 flaring "bamboo node" frustums — tall & slender, the planet's anchor
  const segH = 2.55, rBot = R(4.25), rTop = R(5.35), yBase = 4.12;
  for (let i = 0; i < 8; i++){
    const y0 = yBase + i * segH;
    const seg = CTX.cyl(rTop, rBot, segH, (i % 2 ? glassB : glassA), 0, y0 + segH / 2, 0, 4);
    seg.rotation.y = SQ; g.add(seg);
    const band = CTX.cyl(R(4.55), R(4.55), 0.20, gold, 0, y0 + 0.12, 0, 4);
    band.rotation.y = SQ; g.add(band);
  }
  const yTop = yBase + 8 * segH;

  [2, 4, 6].forEach((i, k) => {
    const y0 = yBase + i * segH;
    g.add(CTX.box(0.8,0.38,0.05,litWin,(k-1)*0.9,y0+0.9,2.47));
  });

  // 4 ancient-coin medallions
  const cy = yBase+0.82, cd = 2.47;
  const coins = [
    { p: [0,  cy,  cd], r: [Math.PI / 2, 0, 0], h: [0,  cy,  cd + 0.06] },
    { p: [0,  cy, -cd], r: [Math.PI / 2, 0, 0], h: [0,  cy, -cd - 0.06] },
    { p: [cd, cy,  0],  r: [0, 0, Math.PI / 2], h: [cd + 0.06, cy, 0] },
    { p: [-cd, cy, 0],  r: [0, 0, Math.PI / 2], h: [-cd - 0.06, cy, 0] }
  ];
  coins.forEach(c => {
    const coin = CTX.cyl(0.34, 0.34, 0.10, gold, c.p[0], c.p[1], c.p[2], 16);
    coin.rotation.set(c.r[0], c.r[1], c.r[2]); g.add(coin);
    g.add(CTX.box(0.12, 0.12, 0.12, holeMat, c.h[0], c.h[1], c.h[2]));
  });

  // crown + pinnacle + beacon
  const crown = CTX.cyl(R(1.8),R(3.4),1.05,glassB,0,yTop+0.52,0,4);
  crown.rotation.y = SQ; g.add(crown);
  g.add(CTX.cyl(0.46,0.58,0.26,stoneDark,0,yTop+1.15,0,8));
  g.add(CTX.cyl(0.07,0.20,2.80,mastMat,0,yTop+2.62,0,8));
  g.add(CTX.sph(0.16,beaconMat,0,yTop+4.10,0,10));
  return g;
}

// ---------------------------------------------------------------------
//  CHIANG KAI-SHEK MEMORIAL / LIBERTY SQUARE ensemble
// ---------------------------------------------------------------------
function buildCKSComplex(CTX) {
  const marble    = CTX.toon('#F3F1EA');
  const cobalt    = CTX.toon('#2456A6');
  const gold      = CTX.toon('#D4AF37');
  const red       = CTX.toon('#B5302A');
  const cream     = CTX.toon('#F0EEE6');
  const goldGrn   = CTX.toon('#C9A84C');
  const yellow    = CTX.toon('#E3B23C');
  const redCol    = CTX.toon('#B0392F');
  const whiteBase = CTX.toon('#EDE9E0');
  const green     = CTX.toon('#3E7A55');
  const paver     = CTX.toon('#E9E4D6');
  const paver2    = CTX.toon('#DED7C4');
  const PI = Math.PI, S2 = Math.SQRT2;

  function sweptRoof(W, D, H, roofMat, baseY, eaveMat) {
    const roof = CTX.group();
    const r = 1;
    const pyr = CTX.cone(r, H, roofMat, 0, baseY + H / 2, 0, 4);
    pyr.rotation.y = PI / 4;
    pyr.scale.set(W / (r * S2), 1, D / (r * S2));
    roof.add(pyr);
    roof.add(CTX.box(W * 0.42, H * 0.12, D * 0.07, roofMat, 0, baseY + H * 0.84, 0));
    const fH = Math.max(0.07, H * 0.13), fT = 0.05, ov = Math.min(0.18, W * 0.06);
    const fy = baseY - fH * 0.35;
    roof.add(CTX.box(W + ov * 2, fH, fT, eaveMat, 0, fy,  D / 2 + ov));
    roof.add(CTX.box(W + ov * 2, fH, fT, eaveMat, 0, fy, -D / 2 - ov));
    roof.add(CTX.box(fT, fH, D + ov * 2, eaveMat,  W / 2 + ov, fy, 0));
    roof.add(CTX.box(fT, fH, D + ov * 2, eaveMat, -W / 2 - ov, fy, 0));
    const cs = [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]];
    const len = Math.min(0.6, Math.max(0.3, W * 0.22));
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i]; const e = CTX.group();
      const b = CTX.box(len, 0.07, 0.15, eaveMat, len * 0.45, 0.05, 0);
      b.rotation.z = PI / 6; e.add(b);
      e.position.set(c[0], baseY + 0.04, c[1]);
      e.rotation.y = Math.atan2(-c[1], c[0]); roof.add(e);
    }
    return roof;
  }
  function octaTips(radius, y, mat, tilt) {
    const grp = CTX.group();
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4 + PI / 8; const e = CTX.group();
      const b = CTX.box(0.5, 0.07, 0.14, mat, 0.22, 0.05, 0);
      b.rotation.z = tilt; e.add(b);
      e.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      e.rotation.y = -a; grp.add(e);
    }
    return grp;
  }
  function buildPalaceHall(gable) {
    const h = CTX.group();
    h.add(CTX.box(4.6, 0.26, 3.6, whiteBase, 0, 0.13, 0));
    h.add(CTX.box(4.2, 0.26, 3.2, whiteBase, 0, 0.39, 0));
    const baseTop = 0.52, colY = baseTop + 0.95;
    h.add(CTX.box(3.4, 1.9, 2.4, red, 0, colY, 0));
    const fx = [-1.5, -0.75, 0, 0.75, 1.5];
    for (let i = 0; i < fx.length; i++) {
      h.add(CTX.cyl(0.12, 0.13, 1.9, redCol, fx[i], colY, 1.28, 10));
      h.add(CTX.cyl(0.12, 0.13, 1.9, redCol, fx[i], colY, -1.28, 10));
    }
    const sz = [-1.0, 0, 1.0];
    for (let i = 0; i < sz.length; i++) {
      h.add(CTX.cyl(0.12, 0.13, 1.9, redCol, -1.7, colY, sz[i], 10));
      h.add(CTX.cyl(0.12, 0.13, 1.9, redCol,  1.7, colY, sz[i], 10));
    }
    const archY = baseTop + 1.9 + 0.13;
    h.add(CTX.box(3.7, 0.22, 2.7, green, 0, archY, 0));
    h.add(CTX.box(3.85, 0.1, 2.85, goldGrn, 0, archY + 0.16, 0));
    for (let i = 0; i < fx.length; i++) {
      h.add(CTX.box(0.18, 0.18, 0.2, goldGrn, fx[i], archY, 1.4));
      h.add(CTX.box(0.16, 0.16, 0.18, green, fx[i], archY, -1.4));
    }
    const eaveBase = archY + 0.22;
    h.add(sweptRoof(4.7, 3.7, 0.8, yellow, eaveBase, goldGrn));
    const bandY = eaveBase + 0.8;
    h.add(CTX.box(3.0, 0.55, 2.0, red, 0, bandY + 0.05, 0));
    const upBase = bandY + 0.35;
    h.add(sweptRoof(3.5, 2.6, 1.05, yellow, upBase, goldGrn));
    h.add(CTX.box(2.0, 0.16, 0.12, goldGrn, 0, upBase + 1.0, 0));
    if (gable) {
      const gb = CTX.group();
      const prism = CTX.cyl(0.85, 0.85, 0.4, yellow, 0, 0, 0, 3);
      prism.rotation.x = PI / 2; gb.add(prism);
      gb.rotation.z = PI / 2; gb.position.set(0, upBase + 0.2, 1.3); h.add(gb);
      h.add(CTX.box(0.14, 0.14, 0.12, goldGrn, 0, upBase + 0.95, 1.45));
    }
    return h;
  }

  const g = CTX.group();
  // A broad, level-looking pedestrian axis makes the ensemble read as a civic
  // place rather than four unrelated miniatures. The host supplies the curved
  // terrain patch beneath these thin route markers.
  g.add(CTX.box(2.8,0.035,11.2,paver,0,0.018,0.25));
  g.add(CTX.box(11.8,0.028,3.2,paver2,0,0.014,0));

  // CKS main hall (back)
  const hall = CTX.group();
  hall.add(CTX.box(5.0,0.08,5.0,whiteBase,0,0.04,0));
  const pedTop = 0.08;
  hall.add(CTX.box(0.22,2.2,4.5,marble,-2.14,pedTop+1.1,0));
  hall.add(CTX.box(0.22,2.2,4.5,marble, 2.14,pedTop+1.1,0));
  hall.add(CTX.box(4.5,2.2,0.22,marble,0,pedTop+1.1,-2.14));
  hall.add(CTX.box(1.5,2.2,0.22,marble,-1.5,pedTop+1.1,2.14));
  hall.add(CTX.box(1.5,2.2,0.22,marble, 1.5,pedTop+1.1,2.14));
  hall.add(CTX.box(3.8,1.7,0.05,cream,0,0.94,-2.00));                 // softly lit inner wall
  hall.add(CTX.box(4.7, 0.1, 4.7, goldGrn, 0, pedTop + 2.15, 0));
  const cubeTop = pedTop + 2.2;
  // Open memorial threshold: jambs and lintel frame a true 1.3 x 2.0 passage.
  hall.add(CTX.box(0.14,1.98,0.18,red,-0.72,1.02,2.27));
  hall.add(CTX.box(0.14,1.98,0.18,red, 0.72,1.02,2.27));
  hall.add(CTX.box(1.58,0.16,0.18,red,0,2.03,2.27));
  hall.add(CTX.box(0.08,1.98,0.14,gold,-0.83,1.02,2.31));
  hall.add(CTX.box(0.08,1.98,0.14,gold, 0.83,1.02,2.31));
  const N = 6;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    hall.add(CTX.box(2.0+t*2.2,0.08,0.28,marble,0,0.04,2.38+t*1.55));
  }
  const oct = CTX.group();
  function octa(rT, rB, h, mat, y) { const m = CTX.cyl(rT, rB, h, mat, 0, y, 0, 8); m.rotation.y = PI / 8; oct.add(m); return m; }
  octa(3.45, 3.45, 0.14, cobalt, 3.27);
  octa(2.5, 3.3, 0.95, cobalt, 3.815);
  oct.add(octaTips(3.45, 3.36, cobalt, PI / 5));
  octa(2.45, 2.45, 0.08, gold, 4.34);
  octa(2.35, 2.35, 0.4, marble, 4.49);
  octa(2.45, 2.45, 0.08, gold, 4.65);
  octa(2.95, 2.95, 0.12, cobalt, 4.75);
  octa(0.9, 2.85, 1.5, cobalt, 5.56);
  oct.add(octaTips(2.95, 4.82, cobalt, PI / 5));
  octa(0.55, 0.95, 0.3, cobalt, 6.46);
  oct.add(CTX.sph(0.32, gold, 0, 6.78, 0));
  oct.add(CTX.cone(0.26, 0.9, gold, 0, 7.35, 0, 8));
  oct.position.y = cubeTop - 3.2; hall.add(oct);
  hall.position.set(0, 0, -5); g.add(hall);

  // Liberty Square gate (front) — five-arch paifang: chunky white piers carrying a
  // continuous entablature, blue hip roofs sized to sit ON the beam (not float)
  const gate = CTX.group();
  // Individual pier bases leave the five arches physically and visually open.
  const px = [-3.7, -2.25, -1.18, 1.18, 2.25, 3.7];
  for (let i = 0; i < px.length; i++) {
    gate.add(CTX.box(0.56, 2.9, 0.70, cream, px[i], 1.75, 0));
    gate.add(CTX.box(0.66, 0.22, 0.80, whiteBase, px[i], 0.41, 0));   // pier base
    gate.add(CTX.box(0.62, 0.14, 0.76, goldGrn,  px[i], 3.12, 0));    // pier capital
  }
  const ax = [-2.98, -1.63, 0, 1.63, 2.98];
  for (let i = 0; i < ax.length; i++) {
    const d = CTX.cyl(0.56, 0.56, 0.22, cream, ax[i], 2.45, 0, 12);
    d.rotation.x = PI / 2; gate.add(d);
    gate.add(CTX.box(0.16, 0.34, 0.24, goldGrn, ax[i], 2.85, 0.03));
  }
  gate.add(CTX.box(8.7, 0.45, 0.80, cream, 0, 3.25, 0));
  gate.add(CTX.box(8.7, 0.16, 0.86, goldGrn, 0, 2.97, 0));
  gate.add(sweptRoof(2.3, 1.5, 1.1, cobalt, 3.52, goldGrn));
  let rl, rr;
  rl = sweptRoof(1.7, 1.35, 0.85, cobalt, 3.48, goldGrn); rl.position.x = -1.95; gate.add(rl);
  rr = sweptRoof(1.7, 1.35, 0.85, cobalt, 3.48, goldGrn); rr.position.x =  1.95; gate.add(rr);
  rl = sweptRoof(1.45, 1.25, 0.68, cobalt, 3.44, goldGrn); rl.position.x = -3.55; gate.add(rl);
  rr = sweptRoof(1.45, 1.25, 0.68, cobalt, 3.44, goldGrn); rr.position.x =  3.55; gate.add(rr);
  gate.position.set(0, 0, 6); g.add(gate);

  // flanking halls
  const theater = buildPalaceHall(false); theater.position.set(-6, 0, 0); theater.rotation.y = PI / 2; g.add(theater);
  const concert = buildPalaceHall(true);  concert.position.set(6, 0, 0); concert.rotation.y = -PI / 2; g.add(concert);
  return g;
}

// ---------------------------------------------------------------------
//  GRAND HOTEL (Yuanshan)  +  NATIONAL PALACE MUSEUM
// ---------------------------------------------------------------------
function buildGrandHotel(CTX){
  const g = CTX.group();
  const gold = CTX.toon('#E6A817'), goldHi = CTX.toon('#F2BE2E'), goldTr = CTX.toon('#D4AF37');
  const verm = CTX.toon('#C1272D'), wall = CTX.toon('#A83228'), stone = CTX.toon('#E7E0CE');
  const green = CTX.toon('#2E7D4F'), win = CTX.toon('#33425C'), dark = CTX.toon('#6E1F1C');

  function makeRoof(w,d,h,roofMat,ridgeMat,fasciaMat){
    const R = CTX.group();
    const pw = CTX.group();
    const pyr = CTX.cone(1,h,roofMat,0,h/2,0,4); pyr.rotation.y = Math.PI/4; pw.add(pyr);
    pw.scale.set(w*0.7071,1,d*0.7071); R.add(pw);
    const fy=0.06;
    R.add(CTX.box(w+0.25,0.14,0.07, fasciaMat, 0, fy, d/2+0.06));
    R.add(CTX.box(w+0.25,0.14,0.07, fasciaMat, 0, fy, -(d/2+0.06)));
    R.add(CTX.box(0.07,0.14,d+0.25, fasciaMat, w/2+0.06, fy, 0));
    R.add(CTX.box(0.07,0.14,d+0.25, fasciaMat, -(w/2+0.06), fy, 0));
    R.add(CTX.box(w*0.46,0.14,0.16, ridgeMat, 0, h-0.04, 0));
    R.add(CTX.box(0.18,0.26,0.2, ridgeMat,  w*0.23, h-0.01, 0));
    R.add(CTX.box(0.18,0.26,0.2, ridgeMat, -w*0.23, h-0.01, 0));
    const cs=[[w/2,d/2],[-w/2,d/2],[w/2,-d/2],[-w/2,-d/2]];
    for(let i=0;i<cs.length;i++){
      const cx=cs[i][0], cz=cs[i][1]; const piv=CTX.group();
      piv.position.set(cx*0.86, fy+0.02, cz*0.86); piv.rotation.y = -Math.atan2(cz,cx);
      const flick=CTX.box(0.55,0.1,0.16, ridgeMat, 0.18, 0, 0); flick.rotation.z = 0.6; piv.add(flick); R.add(piv);
    }
    return R;
  }
  g.add(CTX.box(10,0.55,3.4, stone, 0, 0.275, 0));
  g.add(CTX.box(4.0,0.18,0.5, stone, 0, 0.18, 1.85));
  g.add(CTX.box(3.6,0.18,0.4, stone, 0, 0.36, 1.7));
  g.add(CTX.box(10,0.07,0.12, stone, 0, 0.64, 1.66));
  for(let i=0;i<13;i++){ const x=-4.8+i*0.8; g.add(CTX.box(0.08,0.22,0.1, stone, x, 0.5, 1.66)); }
  g.add(CTX.box(4.2,2.6,3.0, wall, 0, 1.85, 0));
  g.add(CTX.box(3.0,1.8,2.6, wall, -3.5, 1.45, 0));
  g.add(CTX.box(3.0,1.8,2.6, wall,  3.5, 1.45, 0));
  g.add(CTX.box(4.3,0.2,3.05, goldTr, 0, 3.1, 0));
  for(let i=0;i<7;i++){
    const x=-1.8+i*0.6;
    g.add(CTX.cyl(0.15,0.17,2.3, verm, x, 1.7, 1.62, 8));
    g.add(CTX.box(0.36,0.12,0.36, goldTr, x, 2.92, 1.62));
    g.add(CTX.box(0.36,0.1,0.36, stone, x, 0.6, 1.62));
  }
  for(const x of [-4.6,-4.0,-3.4,-2.8, 2.8,3.4,4.0,4.6]){
    g.add(CTX.cyl(0.13,0.15,1.6, verm, x, 1.35, 1.42, 8));
    g.add(CTX.box(0.3,0.1,0.3, goldTr, x, 2.2, 1.42));
  }
  for(let i=0;i<5;i++){ const x=-1.6+i*0.8; g.add(CTX.box(0.42,0.7,0.06, win, x, 2.55, 1.53)); g.add(CTX.box(0.5,0.08,0.06, goldTr, x, 2.95, 1.53)); }
  for(const x of [-4.4,-3.6,-2.8, 2.8,3.6,4.4]) g.add(CTX.box(0.4,0.6,0.06, win, x, 1.7, 1.43));
  for(let i=0;i<3;i++){ const z=-0.8+i*0.8; g.add(CTX.box(0.06,0.6,0.4, win, 2.12, 2.5, z)); g.add(CTX.box(0.06,0.6,0.4, win, -2.12, 2.5, z)); }
  g.add(CTX.box(0.9,1.4,0.12, dark, 0, 1.25, 1.55));
  g.add(CTX.box(1.1,0.16,0.14, goldTr, 0, 2.0, 1.55));
  const cr = makeRoof(5.8,3.7,2.0, gold, goldHi, green); cr.position.y = 3.15; g.add(cr);
  g.add(CTX.sph(0.18, goldHi, 0, 5.2, 0));
  const lw = makeRoof(3.4,2.9,1.1, gold, goldHi, green); lw.position.set(-3.5,2.35,0); g.add(lw);
  const rw = makeRoof(3.4,2.9,1.1, gold, goldHi, green); rw.position.set( 3.5,2.35,0); g.add(rw);
  return g;
}

function buildPalaceMuseum(CTX){
  const g = CTX.group();
  const mLight = CTX.toon('#E7DEC9'), mDark = CTX.toon('#D8C9A8'), white = CTX.toon('#CFC9BC');
  const jade = CTX.toon('#3FA38C'), jadeDk = CTX.toon('#2E8E78'), goldR = CTX.toon('#E5B23A');
  const red = CTX.toon('#C0392B'), pWhite = CTX.toon('#EFE9DD'), win = CTX.toon('#2E4A48');
  function makeRoof(w,d,h,roofMat,ridgeMat,fasciaMat){
    const R = CTX.group(); const pw = CTX.group();
    const pyr = CTX.cone(1,h,roofMat,0,h/2,0,4); pyr.rotation.y = Math.PI/4; pw.add(pyr);
    pw.scale.set(w*0.7071,1,d*0.7071); R.add(pw);
    const fy=0.06;
    R.add(CTX.box(w+0.25,0.14,0.07, fasciaMat, 0, fy, d/2+0.06));
    R.add(CTX.box(w+0.25,0.14,0.07, fasciaMat, 0, fy, -(d/2+0.06)));
    R.add(CTX.box(0.07,0.14,d+0.25, fasciaMat, w/2+0.06, fy, 0));
    R.add(CTX.box(0.07,0.14,d+0.25, fasciaMat, -(w/2+0.06), fy, 0));
    R.add(CTX.box(w*0.46,0.14,0.16, ridgeMat, 0, h-0.04, 0));
    R.add(CTX.box(0.16,0.24,0.18, ridgeMat,  w*0.23, h-0.01, 0));
    R.add(CTX.box(0.16,0.24,0.18, ridgeMat, -w*0.23, h-0.01, 0));
    const cs=[[w/2,d/2],[-w/2,d/2],[w/2,-d/2],[-w/2,-d/2]];
    for(let i=0;i<cs.length;i++){
      const cx=cs[i][0], cz=cs[i][1]; const piv=CTX.group();
      piv.position.set(cx*0.86, fy+0.02, cz*0.86); piv.rotation.y = -Math.atan2(cz,cx);
      const flick=CTX.box(0.5,0.1,0.15, ridgeMat, 0.16, 0, 0); flick.rotation.z = 0.6; piv.add(flick); R.add(piv);
    }
    return R;
  }
  g.add(CTX.box(7.6,0.45,3.6, white, 0, 0.225, 0));
  g.add(CTX.box(7.0,0.4,3.1, mDark, 0, 0.65, 0));
  g.add(CTX.box(3.0,0.2,0.4, white, 0, 0.1, 1.95));
  g.add(CTX.box(2.6,0.2,0.35, white, 0, 0.3, 1.7));
  g.add(CTX.box(7,0.07,0.12, white, 0, 0.9, 1.6));
  for(let i=0;i<9;i++){ const x=-3.2+i*0.8; g.add(CTX.box(0.08,0.2,0.1, white, x, 0.79, 1.6)); }
  g.add(CTX.box(3.2,1.3,2.6, mLight, 0, 1.5, 0));
  g.add(CTX.box(1.9,0.95,2.3, mLight, -2.55, 1.325, 0));
  g.add(CTX.box(1.9,0.95,2.3, mLight,  2.55, 1.325, 0));
  g.add(CTX.box(3.3,0.18,2.7, goldR, 0, 2.1, 0));
  for(let i=0;i<5;i++){ const x=-1.2+i*0.6; g.add(CTX.cyl(0.13,0.14,1.3, mDark, x, 1.5, 1.42, 8)); g.add(CTX.box(0.3,0.1,0.3, goldR, x, 2.1, 1.42)); }
  for(const x of [-3.0,-2.55,-2.1, 2.1,2.55,3.0]) g.add(CTX.cyl(0.11,0.12,0.95, mDark, x, 1.325, 1.32, 8));
  g.add(CTX.box(0.9,1.95,0.1, red, 0, 1.08, 1.34));
  g.add(CTX.box(1.02,0.14,0.1, goldR, 0, 2.08, 1.34));
  for(const x of [-1.0,1.0]) g.add(CTX.box(0.34,0.6,0.05, win, x, 1.55, 1.33));
  for(const x of [-3.0,-2.1, 2.1,3.0]) g.add(CTX.box(0.3,0.55,0.05, win, x, 1.3, 1.23));
  const re1 = makeRoof(4.4,3.0,0.55, jade, goldR, jadeDk); re1.position.y = 2.15; g.add(re1);
  g.add(CTX.box(2.6,0.6,1.7, mLight, 0, 2.6, 0));
  const re2 = makeRoof(3.4,2.2,0.95, jade, goldR, jadeDk); re2.position.y = 2.9; g.add(re2);
  g.add(CTX.sph(0.15, goldR, 0, 3.95, 0));
  const wl = makeRoof(2.4,2.3,0.6, jade, goldR, jadeDk); wl.position.set(-2.55,1.8,0); g.add(wl);
  const wr = makeRoof(2.4,2.3,0.6, jade, goldR, jadeDk); wr.position.set( 2.55,1.8,0); g.add(wr);
  for(const x of [-2.4,-0.8,0.8,2.4]){
    g.add(CTX.box(0.5,0.3,0.5, white, x, 0.15, 4.5));
    g.add(CTX.box(0.28,2.9,0.28, pWhite, x, 1.55, 4.5));
    g.add(CTX.box(0.36,0.45,0.36, red, x, 1.2, 4.5));
  }
  g.add(CTX.box(5.5,0.34,0.36, red, 0, 2.8, 4.5));
  g.add(CTX.box(5.3,0.12,0.4, goldR, 0, 2.58, 4.5));
  g.add(CTX.box(2.0,0.34,0.36, red, 0, 3.2, 4.5));
  g.add(CTX.box(1.0,0.6,0.06, goldR, 0, 2.85, 4.7));
  g.add(CTX.box(0.86,0.46,0.06, red, 0, 2.85, 4.73));
  const pcr = makeRoof(2.4,0.95,0.5, jade, goldR, jadeDk); pcr.position.set(0,3.4,4.5); g.add(pcr);
  const psl = makeRoof(1.7,0.95,0.35, jade, goldR, jadeDk); psl.position.set(-1.6,2.95,4.5); g.add(psl);
  const psr = makeRoof(1.7,0.95,0.35, jade, goldR, jadeDk); psr.position.set( 1.6,2.95,4.5); g.add(psr);
  return g;
}

// ---------------------------------------------------------------------
//  LONGSHAN TEMPLE  +  BAO'AN / CONFUCIUS TEMPLE
// ---------------------------------------------------------------------
function buildLongshanTemple(CTX){
  const g = CTX.group();
  const M = {
    tile: CTX.toon('#5A665C'), terra: CTX.toon('#A85434'), ridge: CTX.toon('#6B5240'),
    red: CTX.toon('#C43530'), redDk: CTX.toon('#8E2A24'), stone: CTX.toon('#A5A29A'),
    stoneD: CTX.toon('#8B887F'), bronze: CTX.toon('#6B7C62'), gold: CTX.toon('#E0A800'),
    wood: CTX.toon('#7A583A'), water: CTX.toon('#6F9FB0'),
    lantern: CTX.toon('#D62828',{emissive:'#FF5C3C',emissiveIntensity:0.5}),
    jG: CTX.toon('#2E8B57'), jR: CTX.toon('#C0392B'), jB: CTX.toon('#2A6F97')
  };
  function jiannian(parent,w,ridgeY){
    const cols=[M.jG,M.gold,M.jR,M.jB]; const n=Math.max(5,Math.round(w*2.2));
    for(let i=0;i<n;i++){ const fx=(i/(n-1)-0.5)*w*0.86, c=cols[i%4];
      if(i%3===0) parent.add(CTX.sph(0.07+(i%2)*0.02,c,fx,ridgeY+0.18,0,7));
      else        parent.add(CTX.cone(0.06,0.16,c,fx,ridgeY+0.20,0,5)); }
    parent.add(CTX.sph(0.12,M.jG,-w*0.12,ridgeY+0.24,0,8));
    parent.add(CTX.sph(0.12,M.jR, w*0.12,ridgeY+0.24,0,8));
    parent.add(CTX.cone(0.10,0.22,M.gold,0,ridgeY+0.30,0,6));
  }
  function tail(parent,sx,w,ridgeY){
    const ex=sx*w/2;
    const up=CTX.cone(0.12,0.70,M.ridge,ex+sx*0.12,ridgeY+0.20,0,6); up.rotation.z=-sx*0.55; parent.add(up);
    const tipY=ridgeY+0.48;
    const f1=CTX.cone(0.055,0.46,M.ridge,ex+sx*0.40,tipY,0.13,6); f1.rotation.z=-sx*0.80; f1.rotation.x=-0.40; parent.add(f1);
    const f2=CTX.cone(0.055,0.46,M.ridge,ex+sx*0.40,tipY,-0.13,6); f2.rotation.z=-sx*0.80; f2.rotation.x=0.40; parent.add(f2);
    parent.add(CTX.sph(0.045,M.gold,ex+sx*0.55,tipY+0.16,0.15,6));
    parent.add(CTX.sph(0.045,M.gold,ex+sx*0.55,tipY+0.16,-0.15,6));
  }
  function swallowRoof(w,d,ridgeY,tile,flare){
    const r=CTX.group();
    const rise=Math.min(0.5,d*0.28), halfD=d/2;
    const slant=Math.sqrt(halfD*halfD+rise*rise), ang=Math.atan2(rise,halfD), th=0.1;
    const overW=w+0.5, overD=slant+0.18;
    const pz=CTX.box(overW,th,overD,tile,0,ridgeY-rise/2, halfD/2); pz.rotation.x= ang; r.add(pz);
    const pn=CTX.box(overW,th,overD,tile,0,ridgeY-rise/2,-halfD/2); pn.rotation.x=-ang; r.add(pn);
    r.add(CTX.box(w+0.6,0.16,0.20,M.ridge,0,ridgeY+0.02,0));
    r.add(CTX.box(w+0.62,0.06,0.26,M.gold,0,ridgeY+0.11,0));
    tail(r, 1,w+0.6,ridgeY); tail(r,-1,w+0.6,ridgeY); jiannian(r,w,ridgeY);
    if(flare){ for(const sx of [1,-1]) for(const sz of [1,-1]){
      const c=CTX.cone(0.08,0.34,M.ridge,sx*(w/2+0.1),ridgeY-rise+0.05,sz*(halfD+0.02),6);
      c.rotation.x=sz*0.6; c.rotation.z=-sx*0.5; r.add(c); } }
    return r;
  }
  function lanternRow(parent,z,y,count,spanX){
    for(let i=0;i<count;i++){ const x=(i/(count-1)-0.5)*spanX;
      parent.add(CTX.cyl(0.012,0.012,0.16,M.gold,x,y+0.10,z,5));
      const s=CTX.sph(0.10,M.lantern,x,y-0.04,z,8); s.scale.y=1.3; parent.add(s);
      parent.add(CTX.cyl(0.03,0.01,0.06,M.gold,x,y-0.20,z,5)); }
  }
  function dragonColumn(x,z,hh){
    const c=CTX.group(), seg=9, sh=hh/seg;
    for(let i=0;i<seg;i++){ const p=CTX.cyl(0.13,0.13,sh*1.05,M.bronze,x,0.16+sh/2+i*sh,z,6); p.rotation.y=i*0.45; c.add(p); }
    for(let i=0;i<seg*2;i++){ const a=i*0.7, yy=0.16+(i/(seg*2))*hh; c.add(CTX.sph(0.045,M.gold,x+Math.cos(a)*0.15,yy,z+Math.sin(a)*0.15,6)); }
    c.add(CTX.box(0.30,0.14,0.30,M.wood,x,0.16+hh+0.02,z)); return c;
  }
  function buildHall(w,d,colH,doubleEave){
    const h=CTX.group(), halfW=w/2, halfD=d/2;
    h.add(CTX.box(w+0.5,0.18,d+0.4,M.stone,0,-0.09,0));
    h.add(CTX.box(w+0.3,0.08,d+0.2,M.stoneD,0,0.00,0));
    h.add(CTX.box(w,colH*0.92,0.18,M.stone,0,colH*0.46,-halfD));
    h.add(CTX.box(0.18,colH*0.92,d,M.stone,-halfW,colH*0.46,0));
    h.add(CTX.box(0.18,colH*0.92,d,M.stone, halfW,colH*0.46,0));
    h.add(CTX.box(w*0.5,colH*0.72,0.06,M.stoneD,0,colH*0.46,-halfD+0.11));
    h.add(CTX.box(w*0.6,colH*0.88,0.08,M.redDk,0,colH*0.46,-halfD+0.12));
    const nx=Math.max(2,Math.round(w/1.3)+1);
    for(let i=0;i<nx;i++){ const x=(i/(nx-1)-0.5)*w*0.9;
      h.add(CTX.cyl(0.10,0.12,colH,M.red,x,colH/2,halfD-0.12,10));
      h.add(CTX.box(0.28,0.14,0.28,M.wood,x,colH+0.03,halfD-0.12)); }
    h.add(CTX.box(w+0.2,0.16,0.16,M.wood,0,colH+0.06,halfD-0.05));
    h.add(CTX.box(w+0.2,0.10,0.10,M.red,0,colH+0.18,halfD-0.05));
    const eaveY=colH+0.30;
    h.add(swallowRoof(w+0.4,d+0.6,eaveY,M.tile,true));
    if(doubleEave) h.add(swallowRoof(w-0.4,d-0.5,eaveY+0.66,M.terra,false));
    lanternRow(h,halfD+0.10,eaveY-0.05,Math.max(3,nx),w*0.8);
    return h;
  }
  g.add(CTX.box(5.0,0.10,6.0,M.stone,0,0.05,0));
  g.add(CTX.box(4.4,0.06,5.4,M.stoneD,0,0.11,0));
  for(const sx of [1,-1]){ g.add(CTX.box(0.16,0.70,6.0,M.stone,sx*2.45,0.45,0)); g.add(CTX.box(0.40,0.06,6.0,M.tile, sx*2.45,0.83,0)); }
  const front=buildHall(4.0,1.5,2.10,false); front.position.set(0,0.16, 2.00); g.add(front);
  const main =buildHall(3.4,2.0,2.35,true ); main .position.set(0,0.16, 0.00); g.add(main);
  const rear =buildHall(3.6,1.5,2.20,false); rear .position.set(0,0.16,-2.10); g.add(rear);
  g.add(dragonColumn(-0.70,2.85,1.50)); g.add(dragonColumn( 0.70,2.85,1.50));
  g.add(CTX.box(2.2,0.10,0.40,M.stoneD,0,0.10,3.00));
  g.add(CTX.box(2.6,0.06,0.40,M.stone, 0,0.04,3.25));
  g.add(CTX.box(2.4,0.12,0.80,M.stoneD,0,0.06,3.55));
  g.add(CTX.box(2.0,0.08,0.60,M.water, 0,0.12,3.55));
  g.add(CTX.box(2.0,0.18,0.12,M.water, 0,0.00,3.88));
  return g;
}

function buildBaoanTemple(CTX){
  const g = CTX.group();
  const M = {
    tile: CTX.toon('#5A665C'), terra: CTX.toon('#A85434'), ridge: CTX.toon('#6B5240'),
    red: CTX.toon('#C43530'), redDk: CTX.toon('#8E2A24'), stone: CTX.toon('#A5A29A'),
    stoneD: CTX.toon('#8B887F'), gold: CTX.toon('#E0A800'), wood: CTX.toon('#7A583A'),
    lantern: CTX.toon('#D62828',{emissive:'#FF5C3C',emissiveIntensity:0.5}),
    jG: CTX.toon('#2E8B57'), jR: CTX.toon('#C0392B'), jB: CTX.toon('#2A6F97')
  };
  function jiannian(parent,w,ridgeY){
    const cols=[M.jG,M.gold,M.jR,M.jB]; const n=Math.max(4,Math.round(w*1.7));
    for(let i=0;i<n;i++){ const fx=(i/(n-1)-0.5)*w*0.84, c=cols[i%4];
      if(i%2===0) parent.add(CTX.sph(0.06,c,fx,ridgeY+0.16,0,7));
      else        parent.add(CTX.cone(0.05,0.14,c,fx,ridgeY+0.18,0,5)); }
    parent.add(CTX.cone(0.09,0.20,M.gold,0,ridgeY+0.27,0,6));
  }
  function tail(parent,sx,w,ridgeY){
    const ex=sx*w/2;
    const up=CTX.cone(0.11,0.62,M.ridge,ex+sx*0.10,ridgeY+0.18,0,6); up.rotation.z=-sx*0.55; parent.add(up);
    const tipY=ridgeY+0.42;
    const f1=CTX.cone(0.05,0.40,M.ridge,ex+sx*0.36,tipY,0.12,6); f1.rotation.z=-sx*0.80; f1.rotation.x=-0.40; parent.add(f1);
    const f2=CTX.cone(0.05,0.40,M.ridge,ex+sx*0.36,tipY,-0.12,6); f2.rotation.z=-sx*0.80; f2.rotation.x=0.40; parent.add(f2);
    parent.add(CTX.sph(0.04,M.gold,ex+sx*0.50,tipY+0.14,0,6));
  }
  function swallowRoof(w,d,ridgeY,tile){
    const r=CTX.group();
    const rise=Math.min(0.46,d*0.28), halfD=d/2;
    const slant=Math.sqrt(halfD*halfD+rise*rise), ang=Math.atan2(rise,halfD), th=0.1;
    const pz=CTX.box(w+0.5,th,slant+0.18,tile,0,ridgeY-rise/2, halfD/2); pz.rotation.x= ang; r.add(pz);
    const pn=CTX.box(w+0.5,th,slant+0.18,tile,0,ridgeY-rise/2,-halfD/2); pn.rotation.x=-ang; r.add(pn);
    r.add(CTX.box(w+0.55,0.15,0.18,M.ridge,0,ridgeY+0.02,0));
    r.add(CTX.box(w+0.57,0.06,0.24,M.gold,0,ridgeY+0.10,0));
    tail(r,1,w+0.55,ridgeY); tail(r,-1,w+0.55,ridgeY); jiannian(r,w,ridgeY);
    return r;
  }
  function lanternRow(parent,z,y,count,spanX){
    for(let i=0;i<count;i++){ const x=(i/(count-1)-0.5)*spanX;
      parent.add(CTX.cyl(0.012,0.012,0.15,M.gold,x,y+0.10,z,5));
      const s=CTX.sph(0.10,M.lantern,x,y-0.04,z,8); s.scale.y=1.3; parent.add(s);
      parent.add(CTX.cyl(0.03,0.01,0.06,M.gold,x,y-0.19,z,5)); }
  }
  function buildHall(w,d,colH,withDoors){
    const h=CTX.group(), halfW=w/2, halfD=d/2;
    h.add(CTX.box(w+0.4,0.16,d+0.36,M.stone,0,-0.08,0));
    h.add(CTX.box(w+0.24,0.07,d+0.18,M.stoneD,0,0.00,0));
    h.add(CTX.box(w,colH*0.9,0.16,M.stone,0,colH*0.45,-halfD));
    h.add(CTX.box(0.16,colH*0.9,d,M.stone,-halfW,colH*0.45,0));
    h.add(CTX.box(0.16,colH*0.9,d,M.stone, halfW,colH*0.45,0));
    if(withDoors) h.add(CTX.box(w*0.55,colH*0.88,0.07,M.redDk,0,colH*0.46,-halfD+0.10));
    const nx=Math.max(2,Math.round(w/1.2)+1);
    for(let i=0;i<nx;i++){ const x=(i/(nx-1)-0.5)*w*0.88;
      h.add(CTX.cyl(0.095,0.11,colH,M.red,x,colH/2,halfD-0.11,10));
      h.add(CTX.box(0.24,0.12,0.24,M.wood,x,colH+0.02,halfD-0.11)); }
    h.add(CTX.box(w+0.18,0.14,0.14,M.wood,0,colH+0.05,halfD-0.04));
    h.add(CTX.box(w+0.18,0.09,0.09,M.red,0,colH+0.15,halfD-0.04));
    const eaveY=colH+0.28;
    h.add(swallowRoof(w+0.35,d+0.5,eaveY,M.tile));
    lanternRow(h,halfD+0.08,eaveY-0.05,2,w*0.55);
    return h;
  }
  g.add(CTX.box(3.5,0.09,4.0,M.stone,0,0.045,0));
  g.add(CTX.box(3.0,0.05,3.5,M.stoneD,0,0.10,0));
  const gate=buildHall(2.6,1.1,2.10,true ); gate.position.set(0,0.13, 1.35); g.add(gate);
  const main=buildHall(3.0,1.8,2.30,true ); main.position.set(0,0.13,-0.55); g.add(main);
  g.add(CTX.box(1.8,0.09,0.34,M.stoneD,0,0.09,2.05));
  g.add(CTX.box(2.1,0.05,0.34,M.stone, 0,0.04,2.28));
  return g;
}

// ---------------------------------------------------------------------
//  PRESIDENTIAL OFFICE  +  TAIPEI MAIN STATION
// ---------------------------------------------------------------------
function buildPresidentialOffice(CTX){
  const g = CTX.group();
  const brick = CTX.toon('#A14A33'), stone = CTX.toon('#EAE2D0'), slate = CTX.toon('#44464A'), glass = CTX.toon('#3a4a52');
  const k = Math.SQRT1_2;
  function hipRoof(cx, cz, halfX, halfZ, h, baseY){
    const grp = CTX.group();
    const pyr = CTX.cone(1, h, slate, 0, h/2, 0, 4); pyr.rotation.y = Math.PI/4; grp.add(pyr);
    grp.scale.set(halfX/k, 1, halfZ/k); grp.position.set(cx, baseY, cz); return grp;
  }
  function archWindow(x, y, z, ry){
    const w = CTX.group();
    w.add(CTX.box(0.60, 0.95, 0.05, stone, 0, 0.00, 0.00));
    w.add(CTX.box(0.42, 0.78, 0.12, glass, 0, -0.03, 0.04));
    const head = CTX.cyl(0.21, 0.21, 0.12, glass, 0, 0.36, 0.04, 8); head.rotation.x = Math.PI/2; w.add(head);
    w.position.set(x, y, z); w.rotation.y = ry || 0; return w;
  }
  function clock(x, y, z, ry){
    const c = CTX.group();
    const rim = CTX.cyl(0.30, 0.30, 0.05, slate, 0, 0, 0, 12); rim.rotation.x = Math.PI/2;
    const fce = CTX.cyl(0.24, 0.24, 0.06, glass, 0, 0, 0.03, 12); fce.rotation.x = Math.PI/2;
    c.add(rim); c.add(fce); c.position.set(x, y, z); c.rotation.y = ry || 0; return c;
  }
  g.add(CTX.box(8.70, 0.20, 4.20, slate, 0, 0.06, 0));
  g.add(CTX.box(8.50, 0.45, 4.00, stone, 0, 0.225, 0));
  g.add(CTX.box(8.00, 2.40, 3.50, brick, 0, 1.65, 0));
  [0.95, 1.50, 2.05, 2.60].forEach(by => g.add(CTX.box(8.14, 0.14, 3.64, stone, 0, by, 0)));
  g.add(CTX.box(8.35, 0.22, 3.85, stone, 0, 2.85, 0));
  g.add(CTX.box(7.70, 0.22, 3.20, slate, 0, 3.00, 0));
  [-3.0, 3.0].forEach(px => {
    g.add(CTX.box(1.90, 3.00, 3.60, brick, px, 1.95, 0));
    g.add(CTX.box(2.00, 0.14, 3.70, stone, px, 3.00, 0));
    g.add(CTX.box(2.05, 0.16, 3.78, stone, px, 3.45, 0));
    g.add(hipRoof(px, 0, 1.06, 1.92, 1.05, 3.45));
    g.add(CTX.cone(0.12, 0.45, slate, px, 4.60, 0, 6));
    g.add(archWindow(px, 1.45, 1.83, 0)); g.add(archWindow(px, 2.50, 1.83, 0));
  });
  g.add(CTX.box(2.00, 3.15, 2.30, brick, 0, 2.025, 0));
  g.add(CTX.box(2.14, 0.13, 2.44, stone, 0, 3.10, 0));
  g.add(CTX.box(2.20, 0.16, 2.50, stone, 0, 3.60, 0));
  g.add(CTX.box(1.70, 0.70, 2.00, stone, 0, 3.95, 0));
  g.add(clock(0, 3.95, 1.01, 0)); g.add(clock(0.86, 3.95, 0, Math.PI/2)); g.add(clock(-0.86, 3.95, 0, -Math.PI/2));
  g.add(CTX.box(1.40, 0.60, 1.60, brick, 0, 4.60, 0));
  g.add(CTX.box(1.55, 0.12, 1.75, stone, 0, 4.90, 0));
  g.add(CTX.cyl(0.62, 0.70, 0.45, stone, 0, 5.125, 0, 8));
  g.add(CTX.cone(0.78, 0.90, slate, 0, 5.80, 0, 8));
  g.add(CTX.cone(0.09, 0.40, slate, 0, 6.45, 0, 6));
  g.add(CTX.sph(0.08, slate, 0, 6.70, 0, 10));
  [-1.0, -0.4, 0.4, 1.0].forEach(cx => {
    g.add(CTX.box(0.34, 0.12, 0.34, stone, cx, 0.50, 2.10));
    g.add(CTX.cyl(0.15, 0.17, 1.85, stone, cx, 1.42, 2.10, 10));
    g.add(CTX.box(0.34, 0.14, 0.34, stone, cx, 2.35, 2.10));
  });
  g.add(CTX.box(2.70, 0.30, 0.75, stone, 0, 2.55, 2.10));
  g.add(CTX.box(2.85, 0.16, 0.85, stone, 0, 2.74, 2.10));
  g.add(CTX.box(3.00, 0.18, 0.70, stone, 0, 0.45, 2.35));
  g.add(CTX.box(2.60, 0.18, 0.50, stone, 0, 0.62, 2.50));
  g.add(CTX.box(1.45, 1.75, 0.06, stone, 0, 1.32, 1.755));
  const dFrame = CTX.cyl(0.72, 0.72, 0.06, stone, 0, 2.18, 1.755, 12); dFrame.rotation.x = Math.PI/2; g.add(dFrame);
  g.add(CTX.box(1.20, 1.70, 0.12, glass, 0, 1.30, 1.770));
  const dTop = CTX.cyl(0.60, 0.60, 0.12, glass, 0, 2.15, 1.770, 8); dTop.rotation.x = Math.PI/2; g.add(dTop);
  const rowY = [1.25, 2.15];
  [-3.45, -2.70, -1.95, 1.95, 2.70, 3.45].forEach(x => rowY.forEach(y => g.add(archWindow(x, y, 1.83, 0))));
  [-3.45, -2.70, -1.95, -1.0, 0, 1.0, 1.95, 2.70, 3.45].forEach(x => rowY.forEach(y => g.add(archWindow(x, y, -1.83, Math.PI))));
  [-4.03, 4.03].forEach(sx => [-1.0, 0, 1.0].forEach(z => rowY.forEach(y => g.add(archWindow(sx, y, z, sx > 0 ? Math.PI/2 : -Math.PI/2)))));
  return g;
}

function buildMainStation(CTX){
  const g = CTX.group();
  const brick = CTX.toon('#9C5B43'), trim = CTX.toon('#C9A07E'), roofG = CTX.toon('#2F7D5B');
  const ridge = CTX.toon('#245E45'), glw = CTX.toon('#6E8794'), base = CTX.toon('#8E8C86');
  const k = Math.SQRT1_2;
  function mkWin(x, y, z, ry){
    const w = CTX.group();
    w.add(CTX.box(0.56, 0.56, 0.05, trim, 0, 0, 0));
    w.add(CTX.box(0.42, 0.42, 0.12, glw,  0, 0, 0.03));
    w.position.set(x, y, z); w.rotation.y = ry || 0; g.add(w);
  }
  function upEave(cx, cz){
    const p = CTX.group(); p.position.set(cx, 3.18, cz); p.rotation.y = Math.atan2(-cz, cx);
    const arm = CTX.box(1.50, 0.16, 0.50, ridge, 0.65, 0, 0); arm.rotation.z = 0.52; p.add(arm); return p;
  }
  g.add(CTX.box(5.60, 0.50, 4.60, base, 0, 0.25, 0));
  g.add(CTX.box(6.00, 2.60, 5.00, brick, 0, 1.80, 0));
  [0.70, 1.70, 2.95].forEach(by => g.add(CTX.box(6.12, 0.16, 5.12, trim, 0, by, 0)));
  const rows = [1.20, 2.35];
  [-2.30, -1.45, 1.45, 2.30].forEach(x => rows.forEach(y => mkWin(x, y, 2.53, 0)));
  [-2.30, -1.45, -0.55, 0.55, 1.45, 2.30].forEach(x => rows.forEach(y => mkWin(x, y, -2.53, Math.PI)));
  [-3.03, 3.03].forEach(sx => [-1.70, -0.85, 0, 0.85, 1.70].forEach(z => rows.forEach(y => mkWin(sx, y, z, sx > 0 ? Math.PI/2 : -Math.PI/2))));
  g.add(CTX.box(1.50, 1.95, 0.08, trim, 0, 1.475, 2.50));
  const aT = CTX.cyl(0.75, 0.75, 0.08, trim, 0, 2.45, 2.50, 14); aT.rotation.x = Math.PI/2; g.add(aT);
  g.add(CTX.box(1.15, 1.85, 0.20, glw, 0, 1.45, 2.54));
  const aO = CTX.cyl(0.58, 0.58, 0.20, glw, 0, 2.45, 2.54, 14); aO.rotation.x = Math.PI/2; g.add(aO);
  g.add(CTX.box(1.90, 0.22, 0.50, base, 0, 0.60, 2.72));
  g.add(CTX.box(1.55, 0.22, 0.35, base, 0, 0.77, 2.82));
  g.add(CTX.box(7.70, 0.20, 0.14, ridge, 0, 3.15, 3.35));
  g.add(CTX.box(7.70, 0.20, 0.14, ridge, 0, 3.15, -3.35));
  g.add(CTX.box(0.14, 0.20, 6.70, ridge, 3.85, 3.15, 0));
  g.add(CTX.box(0.14, 0.20, 6.70, ridge, -3.85, 3.15, 0));
  const roof = CTX.group();
  const pyr = CTX.cone(1, 1.70, roofG, 0, 0.85, 0, 4); pyr.rotation.y = Math.PI/4; roof.add(pyr);
  roof.scale.set(3.85 / k, 1, 3.35 / k); roof.position.y = 3.10; g.add(roof);
  g.add(CTX.box(3.20, 0.34, 0.60, ridge, 0, 4.60, 0));
  g.add(CTX.cone(0.16, 0.50, ridge, 1.55, 4.88, 0, 4));
  g.add(CTX.cone(0.16, 0.50, ridge, -1.55, 4.88, 0, 4));
  [[3.55, 2.95], [-3.55, 2.95], [3.55, -2.95], [-3.55, -2.95]].forEach(c => g.add(upEave(c[0], c[1])));
  return g;
}

// ---------------------------------------------------------------------
//  SUN YAT-SEN MEMORIAL HALL  +  CITY HALL  +  TAIPEI ARENA
// ---------------------------------------------------------------------
function buildSYSHall(CTX){
  // Sun Yat-sen Memorial Hall: one great steep yellow-tiled hip roof with upturned
  // corners over a cream body braced by massive red corner piers — sits on a broad
  // two-step stone podium. (The old model was a huge flat pancake floating on sticks.)
  const T = CTX.THREE; const g = CTX.group(); const A = m => (g.add(m), m);
  const stone = CTX.toon('#BCB4A2'), stoneD = CTX.toon('#948F82'), cream = CTX.toon('#EAE0C8');
  const pier = CTX.toon('#A6382E'), dark = CTX.toon('#3E3A33'), glass = CTX.toon('#46585C');
  const roofTop = CTX.toon('#E8B23A'), roofHi = CTX.toon('#F2CE5E'), roofSh = CTX.toon('#C9912A');
  const S2 = Math.SQRT2;
  // podium
  A(CTX.box(6.2, 0.32, 6.2, stone,  0, 0.16, 0));
  A(CTX.box(5.4, 0.30, 5.4, stoneD, 0, 0.47, 0));
  for (let i = 0; i < 5; i++) A(CTX.box(2.7 - i*0.08, 0.062, 0.30, stone, 0, 0.031 + i*0.062, 3.35 - i*0.26));
  const podTop = 0.62;
  // body + four huge red corner piers
  const bodyW = 3.9, bodyH = 1.95;
  A(CTX.box(bodyW, bodyH, bodyW, cream, 0, podTop + bodyH/2, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    A(CTX.box(0.60, bodyH + 0.22, 0.60, pier, sx*(bodyW/2 - 0.02), podTop + (bodyH + 0.22)/2, sz*(bodyW/2 - 0.02)));
  // front porch: red columns + glass entrance under a beam
  for (const x of [-1.25, -0.62, 0.62, 1.25]) A(CTX.cyl(0.10, 0.115, bodyH, pier, x, podTop + bodyH/2, bodyW/2 + 0.34, 10));
  A(CTX.box(2.95, 0.18, 0.85, roofSh, 0, podTop + bodyH + 0.02, bodyW/2 + 0.12));
  A(CTX.box(1.75, 1.95, 0.08, glass, 0, podTop + 0.99, bodyW/2 + 0.03));
  A(CTX.box(1.95, 0.10, 0.10, dark,  0, podTop + 1.98, bodyW/2 + 0.04));
  // side + rear window bands
  for (const s of [-1, 1]) A(CTX.box(0.06, 0.9, 2.4, glass, s*(bodyW/2 + 0.01), podTop + 1.05, 0));
  A(CTX.box(2.4, 0.9, 0.06, glass, 0, podTop + 1.05, -(bodyW/2 + 0.01)));
  // entablature ring
  A(CTX.box(bodyW + 0.5, 0.30, bodyW + 0.5, roofSh, 0, podTop + bodyH + 0.15, 0));
  // the great hip roof: steep pyramid + thick eave plate + upturned corner beams
  const eaveY = podTop + bodyH + 0.30, W = 5.5, H = 1.65;
  const pyr = CTX.cone(1, H, roofTop, 0, eaveY + H/2, 0, 4);
  pyr.rotation.y = Math.PI/4; pyr.scale.set(W/S2, 1, W/S2); A(pyr);
  const eave = CTX.cone(1, 0.20, roofSh, 0, eaveY - 0.02, 0, 4);
  eave.rotation.y = Math.PI/4; eave.scale.set((W + 0.5)/S2, 1, (W + 0.5)/S2); A(eave);
  // ridge crown + finial
  A(CTX.box(0.55, 0.22, 0.55, roofSh, 0, eaveY + H + 0.06, 0));
  A(CTX.cone(0.20, 0.48, roofHi, 0, eaveY + H + 0.38, 0, 8));
  // upturned corners
  const cR = (W + 0.4)/2, t = 0.62, st = Math.sin(t), ct = Math.cos(t), L = 0.62;
  for (const [sx, sz] of [[1,1],[-1,1],[1,-1],[-1,-1]]){
    const cp = CTX.group();
    cp.position.set(sx*cR, eaveY + 0.02, sz*cR); cp.rotation.y = Math.atan2(sx, sz);
    const beam = CTX.box(0.36, 0.20, 1.15, roofTop, 0, L*st, L*ct*0.5); beam.rotation.x = -t; cp.add(beam);
    cp.add(CTX.cone(0.15, 0.5, roofHi, 0, 2*L*st + 0.22, L*ct, 8));
    g.add(cp);
  }
  return g;
}
function buildCityHall(CTX){
  const T = CTX.THREE; const g = CTX.group(); const A = m => (g.add(m), m);
  const glass = CTX.toon('#6E8CA0'), glassD = CTX.toon('#3F5360'), frame = CTX.toon('#C3C7CB'), plazaM = CTX.toon('#cfcabb'), metal = CTX.toon('#8A9196');
  A(CTX.box(6.6, 0.14, 3.0, plazaM, 0, 0.07, 1.7));
  A(CTX.box(6.2, 0.20, 2.6, frame, 0, 0.10, -0.1));
  const panel = (w, h, cx, cy, cz) => {
    const cols = Math.max(2, Math.round(w / 0.38)), rows = Math.max(2, Math.round(h / 0.50));
    for (let i = 0; i <= cols; i++){ const x = cx - w/2 + (w * i / cols); g.add(CTX.box(0.05, h, 0.03, glassD, x, cy, cz + 0.006)); }
    for (let j = 0; j <= rows; j++){ const y = cy - h/2 + (h * j / rows); g.add(CTX.box(w, 0.05, 0.03, glassD, cx, y, cz + 0.006)); }
  };
  const bands = (w, d, cx, y0, y1) => {                       // wrap-around floor slabs
    for (let y = y0 + 0.42; y < y1 - 0.08; y += 0.42) A(CTX.box(w + 0.04, 0.06, d + 0.04, frame, cx, y, 0));
  };
  const tower = (s) => { const x0 = s * 1.9;
    A(CTX.box(1.9, 2.00, 1.7, glass, x0, 1.20, 0)); A(CTX.box(2.0, 0.12, 1.8, frame, x0, 2.20, 0)); panel(1.7, 1.8, x0, 1.20, 0.85); bands(1.9, 1.7, x0, 0.20, 2.20);
    A(CTX.box(1.5, 1.10, 1.4, glass, x0, 2.75, 0)); A(CTX.box(1.6, 0.10, 1.5, frame, x0, 3.30, 0)); panel(1.3, 0.9, x0, 2.75, 0.70); bands(1.5, 1.4, x0, 2.26, 3.30);
    A(CTX.box(1.1, 0.55, 1.05, glass, x0, 3.575, 0)); A(CTX.box(1.2, 0.10, 1.15, frame, x0, 3.85, 0)); panel(0.9, 0.45, x0, 3.575, 0.525);
  };
  tower(1); tower(-1);
  A(CTX.box(2.6, 2.25, 1.5, glass, 0, 1.225, 0)); A(CTX.box(2.8, 0.12, 1.6, frame, 0, 2.35, 0)); panel(2.3, 2.0, 0, 1.20, 0.75);
  A(CTX.box(3.0, 0.12, 0.7, frame, 0, 2.35, 0.9)); A(CTX.box(1.5, 2.05, 0.10, glassD, 0, 1.10, 0.76)); A(CTX.box(2.0, 0.14, 0.5, plazaM, 0, 0.10, 0.95));
  for (let s = -1; s <= 1; s += 2){ A(CTX.cyl(0.035, 0.035, 1.5, metal, s * 2.6, 0.85, 2.6, 8)); A(CTX.sph(0.06, metal, s * 2.6, 1.62, 2.6, 8)); }
  return g;
}
function buildArena(CTX){
  const T = CTX.THREE; const g = CTX.group(); const A = m => (g.add(m), m);
  const drumM = CTX.toon('#D6D2C6'), domeM = CTX.toon('#9FB0B8'), bandM = CTX.toon('#B7B3A8'), darkM = CTX.toon('#5A5650');
  const signM = CTX.toon('#e23a2e', { emissive:'#e23a2e', emissiveIntensity:0.4 }), baseM = CTX.toon('#9AA0A0');
  const ov = 1.12, ovalize = m => (m.scale.x = ov, m);
  A(ovalize(CTX.cyl(2.10, 2.20, 0.25, baseM, 0, 0.125, 0, 20)));
  A(ovalize(CTX.cyl(1.85, 1.90, 1.35, drumM, 0, 0.925, 0, 20)));
  const topY = 1.60;
  A(ovalize(CTX.cyl(1.88, 1.88, 0.16, bandM, 0, 0.60, 0, 20)));
  A(ovalize(CTX.cyl(1.90, 1.90, 0.18, bandM, 0, 1.50, 0, 20)));
  A(ovalize(CTX.cyl(1.89, 1.89, 0.16, signM, 0, 1.20, 0, 20)));
  for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; const x = Math.cos(a) * 1.9 * ov, z = Math.sin(a) * 1.9;
    const s = CTX.box(0.12, 0.7, 0.05, i % 2 ? signM : bandM, x, 0.95, z); s.rotation.y = Math.PI/2 - a; A(s); }
  A(ovalize(CTX.cyl(1.92, 1.92, 0.12, bandM, 0, topY, 0, 20)));
  const dome = CTX.mesh(CTX.faceted(new T.SphereGeometry(1.90, 18, 10)), domeM, 0, topY, 0); dome.scale.set(ov, 0.32, 1.0); A(dome);
  A(CTX.sph(0.12, signM, 0, 2.30, 0, 10));
  A(CTX.box(1.8, 0.12, 0.6, bandM, 0, 1.42, 1.90)); A(CTX.box(1.5, 0.34, 0.10, signM, 0, 1.43, 1.92)); A(CTX.box(1.3, 1.25, 0.12, darkM, 0, 0.76, 1.88));
  return g;
}

// ---------------------------------------------------------------------
//  MIRAMAR FERRIS WHEEL (animated)  +  MAOKONG GONDOLA KIT
// ---------------------------------------------------------------------
function buildFerrisWheel(CTX){
  const T = CTX.THREE; const g = CTX.group();
  const mallMat = CTX.toon('#B9B2A6'), roofMat = CTX.toon('#A7A096');
  const signMat = CTX.toon('#27D8E6',{emissive:'#27D8E6',emissiveIntensity:0.5});
  const legMat = CTX.toon('#C8CDD2'), steelMat = CTX.toon('#9DA3A8'), cabBody = CTX.toon('#E8ECEF'), glassMat = CTX.toon('#BFE9F2');
  const rainbow = [
    CTX.toon('#FF2D2D',{emissive:'#FF2D2D',emissiveIntensity:0.45}),
    CTX.toon('#FF9F1C',{emissive:'#FF9F1C',emissiveIntensity:0.45}),
    CTX.toon('#FFE74C',{emissive:'#FFE74C',emissiveIntensity:0.40}),
    CTX.toon('#3DDC97',{emissive:'#3DDC97',emissiveIntensity:0.45}),
    CTX.toon('#3A86FF',{emissive:'#3A86FF',emissiveIntensity:0.45}),
    CTX.toon('#C77DFF',{emissive:'#C77DFF',emissiveIntensity:0.45})
  ];
  const rimMat = rainbow[0];
  // Miramar mall podium: banded shopping-centre block instead of a bare crate —
  // glass ribbons each floor, recessed entrance, roof parapet, one neon fascia strip
  const glassRib = CTX.toon('#7FB2C2'), doorMat = CTX.toon('#31424C'), trimMat = CTX.toon('#D8D4CA');
  g.add(CTX.box(5.2, 0.35, 4.2, trimMat, 0, 0.175, 0));                     // plinth
  g.add(CTX.box(5, 2.0, 4, mallMat, 0, 1.35, 0));
  for (const yy of [0.9, 1.55]){                                            // wrap-around glass ribbons
    g.add(CTX.box(5.04, 0.34, 3.9, glassRib, 0, yy, 0));
    g.add(CTX.box(4.9, 0.34, 4.04, glassRib, 0, yy, 0));
  }
  g.add(CTX.box(5.1, 0.16, 4.1, trimMat, 0, 2.32, 0));                      // cornice
  g.add(CTX.box(4.7, 0.18, 3.7, roofMat, 0, 2.44, 0));                      // parapet deck
  g.add(CTX.box(1.6, 1.85, 0.14, doorMat, 0, 0.96, 2.0));                   // human-scale entrance glazing
  g.add(CTX.box(1.9, 0.12, 0.55, trimMat, 0, 1.94, 2.2));                   // entrance canopy
  g.add(CTX.box(3.8, 0.30, 0.08, signMat, 0, 1.98, 2.04));                  // neon fascia
  g.add(CTX.box(0.26, 1.2, 0.08, signMat, -2.3, 1.35, 2.04));
  g.add(CTX.box(0.26, 1.2, 0.08, signMat,  2.3, 1.35, 2.04));
  const R = 2.5, hubY = 5.35, wheelZ = -1.0;   // hub high enough that cabins clear the roof deck
  function strut(mat, ax,ay,az, bx,by,bz, t){
    const Av = new T.Vector3(ax,ay,az), B = new T.Vector3(bx,by,bz); const d = new T.Vector3().subVectors(B,Av); const Ln = d.length();
    const m = CTX.box(t, Ln, t, mat, (ax+bx)/2, (ay+by)/2, (az+bz)/2);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), d.clone().normalize()); return m;
  }
  const zf = wheelZ + 0.5, zb = wheelZ - 0.5, baseX = 2.0;
  [zf, zb].forEach(function(z){
    g.add(strut(legMat, -baseX, 2.2, z, 0, hubY, z, 0.16));
    g.add(strut(legMat,  baseX, 2.2, z, 0, hubY, z, 0.16));
    g.add(CTX.box(0.34, 0.12, 0.34, legMat, -baseX, 2.24, z));
    g.add(CTX.box(0.34, 0.12, 0.34, legMat,  baseX, 2.24, z));
  });
  const axle = CTX.cyl(0.1, 0.1, 1.15, steelMat, 0, hubY, wheelZ, 10); axle.rotation.x = Math.PI / 2; g.add(axle);
  const wheel = CTX.group();
  const hub = CTX.cyl(0.3, 0.3, 0.5, steelMat, 0, 0, 0, 12); hub.rotation.x = Math.PI / 2; wheel.add(hub);
  [-0.16, 0.16].forEach(function(z){ const geo = CTX.faceted(new T.TorusGeometry(R, 0.08, 8, 40)); wheel.add(CTX.mesh(geo, rimMat, 0, 0, z)); });
  const N = 16;
  for (let i = 0; i < N; i++){
    const a = i / N * Math.PI * 2; const px = Math.cos(a) * R, py = Math.sin(a) * R;
    const sp = CTX.box(0.05, R, 0.05, rainbow[i % rainbow.length], Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0); sp.rotation.z = a - Math.PI / 2; wheel.add(sp);
    const cab = CTX.group();
    cab.add(CTX.box(0.42, 0.44, 0.32, cabBody, 0, 0, 0));
    cab.add(CTX.box(0.44, 0.16, 0.34, glassMat, 0, 0.04, 0));
    cab.add(CTX.box(0.44, 0.07, 0.34, rainbow[i % rainbow.length], 0, 0.24, 0));
    cab.position.set(px, py, 0); wheel.add(cab);
  }
  wheel.position.set(0, hubY, wheelZ); wheel.userData.tpSpin = 0.35; g.add(wheel);
  return g;
}
function buildGondolaPylon(CTX){
  const g = CTX.group();
  const steelMat = CTX.toon('#9DA3A8'), darkMat = CTX.toon('#6E747A');
  g.add(CTX.box(0.55, 0.12, 0.55, darkMat, 0, 0.06, 0));
  g.add(CTX.box(0.4, 0.1, 0.4, steelMat, 0, 0.17, 0));
  g.add(CTX.cyl(0.07, 0.17, 2.5, steelMat, 0, 1.42, 0, 6));
  g.add(CTX.box(0.3, 0.06, 0.3, darkMat, 0, 1.4, 0));
  g.add(CTX.box(0.95, 0.07, 0.12, steelMat, 0, 2.5, 0));
  g.add(CTX.box(0.75, 0.07, 0.12, steelMat, 0, 2.68, 0));
  g.add(CTX.cyl(0.03, 0.03, 0.1, darkMat, -0.45, 2.56, 0, 6));
  g.add(CTX.cyl(0.03, 0.03, 0.1, darkMat,  0.45, 2.56, 0, 6));
  g.add(CTX.cone(0.1, 0.2, steelMat, 0, 2.85, 0, 6));
  return g;
}
function buildGondolaCabin(CTX){
  const g = CTX.group();
  const bodyMat = CTX.toon('#EFEADF'), frameMat = CTX.toon('#9E2B25'), glassMat = CTX.toon('#7FB7C9'), hangMat = CTX.toon('#8A8F94');
  g.add(CTX.box(1.25, 1.25, 1.05, bodyMat, 0, 0, 0));
  g.add(CTX.box(1.33, 0.62, 1.09, glassMat, 0, 0.14, 0));
  g.add(CTX.box(1.40, 0.16, 1.12, frameMat, 0, -0.60, 0));
  g.add(CTX.box(1.40, 0.14, 1.12, frameMat, 0,  0.57, 0));
  [[-0.64,-0.52],[0.64,-0.52],[-0.64,0.52],[0.64,0.52]].forEach(function(p){ g.add(CTX.box(0.08, 1.25, 0.08, frameMat, p[0], 0, p[1])); });
  const roof = CTX.sph(0.70, bodyMat, 0, 0.68, 0, 14); roof.scale.set(1, 0.45, 0.86); g.add(roof);
  g.add(CTX.box(0.08, 0.72, 0.08, hangMat, 0, 0.94, 0));
  g.add(CTX.box(0.22, 0.07, 0.14, hangMat, 0, 1.29, 0));
  return g;
}

// ---------------------------------------------------------------------
//  NIGHT MARKET (Raohe/Shilin) — self-illuminating emissive lane
// ---------------------------------------------------------------------
function buildNightMarket(CTX) {
  const g = CTX.group();
  const matRed = CTX.toon('#B41E1E'), matBeam = CTX.toon('#8E1818'), matStone = CTX.toon('#3A3A42');
  const matRoofGreen = CTX.toon('#2E8B57'), matRoofGold = CTX.toon('#E0B33A'), matRoofBlue = CTX.toon('#2A6BB0');
  const matOrnament = CTX.toon('#E8C24A', { emissive:'#E0B33A', emissiveIntensity:0.5 });
  const matPlaque = CTX.toon('#F0CB54', { emissive:'#E0B33A', emissiveIntensity:0.9 });
  const matStall = CTX.toon('#5B4636'), matCounter = CTX.toon('#C9A24B', { emissive:'#FFC24A', emissiveIntensity:0.35 });
  const canopies = [ CTX.toon('#EFEFE6'), CTX.toon('#2C6FB5'), CTX.toon('#C8302B') ];
  const sign = [   // muted family — the market glows, but doesn't shout across the city
    CTX.toon('#C24438', { emissive:'#C24438', emissiveIntensity:0.5 }),
    CTX.toon('#B84A77', { emissive:'#B84A77', emissiveIntensity:0.5 }),
    CTX.toon('#3AA8AD', { emissive:'#3AA8AD', emissiveIntensity:0.5 }),
    CTX.toon('#D6B23A', { emissive:'#D6B23A', emissiveIntensity:0.45 }),
    CTX.toon('#4A9B4A', { emissive:'#4A9B4A', emissiveIntensity:0.45 }),
    CTX.toon('#C97A2E', { emissive:'#C97A2E', emissiveIntensity:0.5 }),
  ];
  const matLantern = CTX.toon('#D81E1E', { emissive:'#FF5C3C', emissiveIntensity:0.75 });
  const matLanternCap = CTX.toon('#E0B33A', { emissive:'#E0B33A', emissiveIntensity:0.4 });
  const matLine = CTX.toon('#15151A');
  const matTempleWall = CTX.toon('#B5232A'), matTempleRoof = CTX.toon('#2E8B57');
  const matTempleTrim = CTX.toon('#E0B33A', { emissive:'#E0B33A', emissiveIntensity:0.45 });
  const matDoor = CTX.toon('#2A1410', { emissive:'#FFB23A', emissiveIntensity:0.3 });
  const matGround = CTX.toon('#2A2A30', { emissive:'#14121E', emissiveIntensity:0.25 });
  const hsh = (k) => { const s = Math.sin(k * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function swoopRoof(w, depth, mat) {
    const r = CTX.group(); const t = 0.08;
    const f = CTX.box(w, t, depth * 0.62, mat, 0, 0, -depth * 0.22); f.rotation.x = -0.55;
    const b = CTX.box(w, t, depth * 0.62, mat, 0, 0,  depth * 0.22); b.rotation.x =  0.55;
    const ridge = CTX.box(w * 1.03, 0.13, 0.18, matOrnament, 0, 0.18, 0); r.add(f, b, ridge);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
      const tip = CTX.box(0.34, 0.06, 0.34, mat, c[0] * w * 0.5, -0.1, c[1] * depth * 0.5);
      tip.rotation.x = c[1] * 0.9; tip.rotation.z = c[0] * 0.3; r.add(tip);
    });
    r.add(CTX.cone(0.1, 0.34, matOrnament, -w * 0.52, 0.28, 0, 6));
    r.add(CTX.cone(0.1, 0.34, matOrnament,  w * 0.52, 0.28, 0, 6));
    for (let i = 0; i < 4; i++) r.add(CTX.cone(0.05, 0.15, matOrnament, -w * 0.28 + i * (w * 0.19), 0.27, 0, 6));
    return r;
  }
  function buildGate() {
    const G = CTX.group();
    [-1.55, 1.55].forEach(cx => {
      G.add(CTX.box(0.26, 2.6, 0.26, matRed,  cx, 1.3, 0.0));
      G.add(CTX.box(0.22, 2.5, 0.22, matRed,  cx, 1.25, 0.55));
      G.add(CTX.box(0.44, 0.3, 0.44, matStone, cx, 0.15, 0.0));
      G.add(CTX.box(0.4, 0.28, 0.4, matStone, cx, 0.14, 0.55));
      G.add(CTX.box(0.34, 0.18, 0.34, matBeam, cx, 2.4, 0.0));
    });
    G.add(CTX.box(3.5, 0.22, 0.2, matBeam, 0, 2.5, 0.0));
    G.add(CTX.box(3.4, 0.18, 0.18, matBeam, 0, 2.5, 0.55));
    G.add(CTX.box(0.18, 0.4, 0.6, matBeam, -1.4, 2.5, 0.28));
    G.add(CTX.box(0.18, 0.4, 0.6, matBeam,  1.4, 2.5, 0.28));
    G.add(CTX.box(1.3, 0.5, 0.12, matPlaque, 0, 2.18, -0.07));
    G.add(CTX.box(1.4, 0.6, 0.06, matBeam,   0, 2.18, -0.02));
    const r1 = swoopRoof(3.6, 1.15, matRoofGreen); r1.position.set(0, 2.62, 0.25);
    const r2 = swoopRoof(2.7, 0.98, matRoofGold);  r2.position.set(0, 2.98, 0.25);
    const r3 = swoopRoof(1.7, 0.82, matRoofBlue);  r3.position.set(0, 3.3,  0.25);
    G.add(r1, r2, r3); return G;
  }
  function buildStalls() {
    const S = CTX.group();
    for (let side = 0; side < 2; side++) {
      const sx = side === 0 ? -1.5 : 1.5, inward = side === 0 ? 1 : -1;
      for (let i = 0; i < 6; i++) {
        const z = 3.0 - i * 1.2, idx = side * 6 + i;
        S.add(CTX.box(0.7, 0.9, 1.0, matStall, sx + inward * 0.05, 0.45, z));
        S.add(CTX.box(0.74, 0.08, 1.04, matCounter, sx + inward * 0.12, 0.92, z));
        S.add(CTX.box(0.06, 2.0, 0.06, matStall, sx + inward * 0.0, 1.5, z - 0.4));
        S.add(CTX.box(0.06, 2.0, 0.06, matStall, sx + inward * 0.0, 1.5, z + 0.4));
        const can = CTX.box(1.0, 0.06, 1.15, canopies[idx % 3], sx + inward * 0.28, 1.18, z); can.rotation.z = inward * 0.42; S.add(can);
        S.add(CTX.box(0.05, 0.3, 1.15, matStall, sx + inward * 0.0, 1.05, z));
        let yy = 1.32; const n = 5 + (idx % 3);
        for (let k = 0; k < n; k++) {
          const h1 = 0.16 + hsh(idx * 7 + k) * 0.18, wz = 0.42 + hsh(idx * 3 + k * 2) * 0.5;
          const zoff = (hsh(idx + k * 5) - 0.5) * 0.5, xoff = hsh(idx * 2 + k) * 0.2, col = sign[(idx + k) % 6];
          let panel;
          if (k % 3 === 2) panel = CTX.box(wz * 0.75, h1, 0.05, col, sx + inward * (0.32 + xoff), yy + h1 / 2, z + zoff);
          else panel = CTX.box(0.05, h1, wz, col, sx + inward * (0.16 + xoff), yy + h1 / 2, z + zoff);
          S.add(panel); yy += h1 + 0.06;
        }
      }
    }
    return S;
  }
  function buildLanterns() {
    const L = CTX.group();
    for (let row = 0; row < 8; row++) {
      const z = 3.5 - row * 1.0;
      L.add(CTX.box(3.2, 0.03, 0.03, matLine, 0, 2.46, z));
      const count = 4;
      for (let j = 0; j < count; j++) {
        const x = -1.2 + j * (2.4 / (count - 1)) + (hsh(row * 5 + j) - 0.5) * 0.1;
        L.add(CTX.box(0.015, 0.12, 0.015, matLine, x, 2.38, z));
        L.add(CTX.cyl(0.09, 0.09, 0.2, matLantern, x, 2.22, z, 10));
        L.add(CTX.cyl(0.05, 0.09, 0.04, matLanternCap, x, 2.33, z, 10));
        L.add(CTX.cyl(0.09, 0.05, 0.04, matLanternCap, x, 2.11, z, 10));
        L.add(CTX.box(0.02, 0.07, 0.02, matLanternCap, x, 2.04, z));
      }
    }
    return L;
  }
  function buildTemple() {
    const Tg = CTX.group(); const zc = 0;
    Tg.add(CTX.box(3.0, 0.2, 1.6, matStone, 0, 0.1, zc));
    Tg.add(CTX.box(2.6, 2.2, 1.2, matTempleWall, 0, 1.30, zc));
    Tg.add(CTX.box(0.85, 1.95, 0.12, matDoor, 0, 1.08, zc - 0.62));
    Tg.add(CTX.box(1.02, 2.08, 0.08, matTempleTrim, 0, 1.14, zc - 0.6));
    Tg.add(CTX.box(2.66, 0.14, 1.26, matTempleTrim, 0, 2.36, zc));
    const roof = swoopRoof(3.2, 1.55, matTempleRoof); roof.position.set(0, 2.56, zc); Tg.add(roof);
    const tipL = CTX.cone(0.12, 0.55, matTempleTrim, -1.62, 2.88, zc, 6); tipL.rotation.z =  0.4;
    const tipR = CTX.cone(0.12, 0.55, matTempleTrim,  1.62, 2.88, zc, 6); tipR.rotation.z = -0.4;
    Tg.add(tipL, tipR);
    [-0.9, 0.9].forEach(x => {
      Tg.add(CTX.box(0.02, 0.3, 0.02, matLine, x, 2.12, zc - 0.6));
      Tg.add(CTX.cyl(0.1, 0.1, 0.24, matLantern, x, 1.85, zc - 0.6, 10));
      Tg.add(CTX.cyl(0.1, 0.06, 0.05, matLanternCap, x, 1.71, zc - 0.6, 10));
      Tg.add(CTX.cyl(0.06, 0.1, 0.05, matLanternCap, x, 1.99, zc - 0.6, 10));
    });
    Tg.position.set(4.1,0,-2.35);
    Tg.rotation.y=Math.PI/2;                 // temple door faces the market aisle
    return Tg;
  }
  // Centre the market on its origin. Both ends stay open and the temple sits to
  // the side, so the central 2-unit aisle is a real through-route.
  const frontGate=buildGate(); frontGate.position.z=4.35; g.add(frontGate);
  const rearGate=buildGate(); rearGate.scale.setScalar(0.72); rearGate.position.z=-4.35; rearGate.rotation.y=Math.PI; g.add(rearGate);
  g.add(buildStalls()); g.add(buildLanterns()); g.add(buildTemple());
  return g;
}

// ---------------------------------------------------------------------
//  TAIPEI SHOPS — small street-corner storefronts that make the city feel
//  lived-in: the convenience stores on every block, a boba stand, a morning
//  breakfast shop. Same local-space contract as the monuments (origin at
//  base-centre on the ground, +Y up, FRONT faces +Z). Built small (~2 units).
// ---------------------------------------------------------------------

// 7-ELEVEN — the corner store that's quite literally everywhere in Taipei
function buildSevenEleven(CTX){
  const T = CTX.THREE; const g = CTX.group(); const A = m => (g.add(m), m);

  // ---- palette (each material once, reused) -------------------------------
  const cream   = CTX.toon('#F4F1E8');
  const creamD  = CTX.toon('#DCD6C6');
  const glass   = CTX.toon('#FFE4A8', { emissive:'#FFC862', emissiveIntensity:0.5 });   // warm interior glow
  const inGlow  = CTX.toon('#FFE9C2', { emissive:'#FFD98A', emissiveIntensity:0.55 });   // lit back wall
  const mull    = CTX.toon('#2B3036');
  const frameM  = CTX.toon('#C6CACE');
  const white   = CTX.toon('#FBFAF4', { emissive:'#FFFFFF', emissiveIntensity:0.15 });   // sign field
  const green   = CTX.toon('#159A4B', { emissive:'#1BC25E', emissiveIntensity:0.7 });
  const orange  = CTX.toon('#F47C1B', { emissive:'#FF8E2A', emissiveIntensity:0.7 });
  const red     = CTX.toon('#E23B2E', { emissive:'#FF4A3A', emissiveIntensity:0.7 });
  const roofM   = CTX.toon('#C4BFB1');
  const parM    = CTX.toon('#E8E4D8');
  const metal   = CTX.toon('#9AA0A0');
  const darkM   = CTX.toon('#4C5054');
  const steelM  = CTX.toon('#BCC0C4');
  const binG    = CTX.toon('#2C8049');
  const binB    = CTX.toon('#2A6BB0');
  const bollard = CTX.toon('#D8352A');
  const shelfM  = CTX.toon('#D9CBA8');
  const tire    = CTX.toon('#1A1A1E');

  // ---- cream shell: U of solid walls (front + front-left corner are glass) -
  A(CTX.box(2.40, 1.55, 0.18, cream, 0, 0.775, -0.91));   // back wall
  A(CTX.box(0.18, 1.55, 2.00, cream, 1.11, 0.775,  0.00)); // right wall (full depth -> only one glass corner)
  A(CTX.box(0.18, 1.55, 1.00, cream, -1.11, 0.775, -0.50)); // left wall, back half only

  // ---- lit interior (read through the glass) ------------------------------
  A(CTX.box(2.10, 0.04, 1.92, creamD, 0, 0.02, -0.02));    // floor
  A(CTX.box(2.00, 1.30, 0.04, inGlow, 0, 0.72, -0.80));    // glowing back wall
  A(CTX.box(0.24, 0.92, 1.20, shelfM, -0.82, 0.46, -0.30)); // shelf rows
  A(CTX.box(0.24, 0.92, 1.20, shelfM,  0.82, 0.46, -0.30));
  A(CTX.box(0.42, 0.66, 1.00, shelfM, 0, 0.33, -0.05));     // centre gondola
  [[-0.12,green],[ -0.04,orange],[0.05,red],[0.13,binB]].forEach((p,i)=>
    A(CTX.box(0.1,0.12,0.7, p[1], p[0], 0.72, -0.05)));     // product blocks on gondola

  // ---- front plate-glass storefront (+Z) + wrapped left corner (-X) --------
  A(CTX.box(2.34, 1.10, 0.06, glass, 0, 0.60, 0.95));       // front glazing
  A(CTX.box(0.06, 1.10, 0.95, glass, -1.18, 0.60, 0.48));   // corner glazing
  // mullions on the front
  [-1.05,-0.6,0.6,1.05].forEach(x => A(CTX.box(0.04,1.10,0.03, mull, x, 0.60, 0.99)));
  A(CTX.box(2.34, 0.05, 0.03, mull,  0, 1.10, 0.99));        // front transom
  A(CTX.box(2.40, 0.10, 0.07, frameM, 0, 0.06, 0.97));       // front sill
  // mullions on the wrapped corner
  [0.18,0.62].forEach(z => A(CTX.box(0.03,1.10,0.04, mull, -1.21, 0.60, z)));
  A(CTX.box(0.03, 0.05, 0.95, mull, -1.21, 1.10, 0.48));     // corner transom
  A(CTX.box(0.08, 0.10, 0.95, frameM, -1.18, 0.06, 0.48));   // corner sill
  A(CTX.box(0.07, 1.16, 0.07, frameM, -1.18, 0.58, 0.95));   // vertical corner post

  // ---- sliding auto-doors (centred on front) ------------------------------
  A(CTX.box(1.06, 1.46, 0.05, frameM, 0, 0.76, 0.97));
  A(CTX.box(0.98, 1.38, 0.04, glass,  0, 0.74, 0.995));
  A(CTX.box(0.03, 1.38, 0.05, mull,   0, 0.74, 1.01));       // centre seam
  [-0.11,0.11].forEach(x => A(CTX.box(0.02,0.42,0.05, darkM, x, 0.72, 1.02))); // handles
  A(CTX.box(1.10, 0.03, 0.40, mull, 0, 0.015, 1.18));        // entry mat

  // ---- canopy lip below the sign band -------------------------------------
  A(CTX.box(2.50, 0.06, 0.18, creamD, 0, 1.16, 1.04));
  A(CTX.box(0.18, 0.06, 1.00, creamD, -1.27, 1.16, 0.47));

  // ---- THE SIGNATURE: green/orange/red tri-stripe fascia ------------------
  // front field + stripes (y 1.15..1.55)
  A(CTX.box(2.46, 0.40, 0.10, white, 0, 1.35, 0.96));
  A(CTX.box(2.46, 0.09, 0.04, green,  0, 1.46, 1.02));
  A(CTX.box(2.46, 0.09, 0.04, orange, 0, 1.35, 1.02));
  A(CTX.box(2.46, 0.09, 0.04, red,    0, 1.24, 1.02));
  // wrap the band onto the corner so it reads from the side street
  A(CTX.box(0.10, 0.40, 1.00, white, -1.20, 1.35, 0.47));
  A(CTX.box(0.04, 0.09, 1.00, green,  -1.26, 1.46, 0.47));
  A(CTX.box(0.04, 0.09, 1.00, orange, -1.26, 1.35, 0.47));
  A(CTX.box(0.04, 0.09, 1.00, red,    -1.26, 1.24, 0.47));

  // ---- flat roof, parapet, deck -------------------------------------------
  A(CTX.box(2.50, 0.14, 0.12, parM, 0, 1.62, 0.96));
  A(CTX.box(2.50, 0.14, 0.20, parM, 0, 1.62, -0.92));
  A(CTX.box(0.14, 0.14, 2.10, parM, -1.19, 1.62, 0));
  A(CTX.box(0.14, 0.14, 2.10, parM,  1.19, 1.62, 0));
  A(CTX.box(2.30, 0.06, 1.92, roofM, 0, 1.56, -0.02));       // deck (top at 1.59)

  // ---- rooftop machinery --------------------------------------------------
  A(CTX.box(0.44, 0.26, 0.36, metal, 0.55, 1.72, 0.10));     // AC condenser 1
  A(CTX.cyl(0.12, 0.12, 0.04, darkM, 0.55, 1.85, 0.10, 12));
  A(CTX.box(0.34, 0.22, 0.30, metal, 0.62, 1.70, -0.55));    // AC condenser 2
  A(CTX.cyl(0.10, 0.10, 0.04, darkM, 0.62, 1.81, -0.55, 12));
  A(CTX.cyl(0.05, 0.05, 0.30, metal, 0.15, 1.74, -0.78, 8)); // vent pipe
  // stainless water tank
  A(CTX.box(0.34, 0.04, 0.34, darkM, -0.55, 1.61, -0.50));
  A(CTX.cyl(0.24, 0.26, 0.40, steelM, -0.55, 1.83, -0.50, 12));
  A(CTX.cyl(0.245,0.245,0.03, darkM, -0.55, 1.92, -0.50, 12));
  const dome = CTX.sph(0.24, steelM, -0.55, 2.03, -0.50, 10); dome.scale.set(1,0.5,1); A(dome);

  // ---- projecting rooftop blade sign (double-sided, reads down the street) -
  A(CTX.cyl(0.035, 0.035, 0.40, metal, -1.05, 1.78, 0.60, 8));
  A(CTX.box(0.12, 0.40, 0.70, white, -1.05, 2.00, 0.60));
  [-0.065, 0.065].forEach(o => {           // stripes on both broad faces (+X / -X)
    A(CTX.box(0.04, 0.10, 0.70, green,  -1.05 + o, 2.11, 0.60));
    A(CTX.box(0.04, 0.10, 0.70, orange, -1.05 + o, 2.00, 0.60));
    A(CTX.box(0.04, 0.10, 0.70, red,    -1.05 + o, 1.89, 0.60));
  });

  // ---- street life near the door ------------------------------------------
  // ice-cream / freezer chest (right of door)
  A(CTX.box(0.62, 0.42, 0.36, creamD, 0.80, 0.21, 1.26));
  A(CTX.box(0.54, 0.06, 0.30, glass,  0.80, 0.45, 1.26));
  A(CTX.box(0.62, 0.10, 0.02, red,    0.80, 0.12, 1.45));
  // recycle bins (left of door)
  A(CTX.cyl(0.13, 0.11, 0.40, binG, -0.78, 0.20, 1.24, 10));
  A(CTX.cyl(0.14, 0.14, 0.05, darkM, -0.78, 0.42, 1.24, 10));
  A(CTX.cyl(0.13, 0.11, 0.40, binB, -1.02, 0.20, 1.30, 10));
  A(CTX.cyl(0.14, 0.14, 0.05, darkM, -1.02, 0.42, 1.30, 10));
  // red bollards along the kerb
  [-1.05, -0.62, 0.62, 1.05].forEach(x => {
    A(CTX.cyl(0.06, 0.075, 0.30, bollard, x, 0.15, 1.12, 8));
    A(CTX.cyl(0.062,0.062,0.05, white,    x, 0.25, 1.12, 8));
    A(CTX.sph(0.06, bollard, x, 0.31, 1.12, 8));
  });
  // cheap parked scooter hint (front-right kerb)
  A(CTX.box(0.66, 0.16, 0.20, binB, 1.02, 0.30, 1.62));
  A(CTX.box(0.26, 0.10, 0.18, darkM, 1.14, 0.42, 1.62));
  A(CTX.box(0.08, 0.40, 0.08, darkM, 0.70, 0.50, 1.62));
  A(CTX.box(0.08, 0.06, 0.32, darkM, 0.70, 0.68, 1.62));
  A(CTX.cyl(0.05, 0.05, 0.05, white, 0.66, 0.50, 1.62, 8));
  [0.72, 1.34].forEach(x => { const w = CTX.cyl(0.13,0.13,0.07, tire, x, 0.13, 1.62, 12); w.rotation.x = Math.PI/2; A(w); });

  return g;
}

// FAMILYMART (全家) — the green/blue rival on the next corner, with eat-in seating
function buildFamilyMart(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);

  // --- palette (each material allocated once) ---
  const wallM      = CTX.toon('#F4F1E8');                                   // cream-white body
  const roofM      = CTX.toon('#D7D2C5');                                   // roof slab / parapet
  const glassM     = CTX.toon('#FFD98F', { emissive:'#FFC25A', emissiveIntensity:0.5 });  // warm interior glow
  const doorGlassM = CTX.toon('#BFE6E6', { emissive:'#D6F0F0', emissiveIntensity:0.3 });  // cooler auto-door glass
  const mullionM   = CTX.toon('#33373B');                                   // dark mullions / frames
  const greenM     = CTX.toon('#19A64A', { emissive:'#13A043', emissiveIntensity:0.6 });  // FamilyMart green band
  const blueM      = CTX.toon('#0C63B6', { emissive:'#0A5BAC', emissiveIntensity:0.6 });  // FamilyMart blue band
  const signWhiteM = CTX.toon('#FCFBF6', { emissive:'#FFFFFF', emissiveIntensity:0.14 }); // glowing white sign field
  const metalM     = CTX.toon('#9097A0');                                   // poles / AC / legs
  const tankM      = CTX.toon('#C7CCD2');                                   // stainless water tank
  const baseTrimM  = CTX.toon('#565B60');                                   // kickplate / mat
  const counterM   = CTX.toon('#CBAE80');                                   // eat-in counter wood
  const stoolM     = CTX.toon('#D44A3B');                                   // pop-of-colour stool seats

  // ===== building mass (white box: supplies back + side walls) =====
  A(CTX.box(2.40, 1.50, 1.90, wallM, 0, 0.75, -0.05));     // front solid face sits at z=0.90
  A(CTX.box(2.54, 0.10, 2.06, roofM, 0, 1.55, -0.05));     // flat roof slab (overhang)
  // slim corner pilasters framing the storefront
  A(CTX.box(0.16, 1.42, 0.10, wallM, -1.13, 0.71, 0.94));
  A(CTX.box(0.16, 1.42, 0.10, wallM,  1.13, 0.71, 0.94));

  // ===== plate-glass storefront across the FRONT (+Z) =====
  A(CTX.box(2.42, 0.12, 0.10, baseTrimM, 0, 0.06, 0.96));  // kickplate under glass
  // mullion grid for one window (à la buildCityHall panel)
  const winFrame = (w, h, cx, cy, cz) => {
    const cols = Math.max(2, Math.round(w / 0.34));
    for (let i = 0; i <= cols; i++) A(CTX.box(0.04, h, 0.03, mullionM, cx - w/2 + w*i/cols, cy, cz + 0.02));
    A(CTX.box(w, 0.04, 0.03, mullionM, cx, cy - h/2, cz + 0.02));
    A(CTX.box(w, 0.04, 0.03, mullionM, cx, cy + h/2, cz + 0.02));
    A(CTX.box(w, 0.04, 0.03, mullionM, cx, cy,       cz + 0.02));  // mid transom
  };
  A(CTX.box(0.66, 1.00, 0.05, glassM, -0.70, 0.62, 0.96)); winFrame(0.66, 1.00, -0.70, 0.62, 0.96); // left window
  A(CTX.box(0.66, 1.00, 0.05, glassM,  0.70, 0.62, 0.96)); winFrame(0.66, 1.00,  0.70, 0.62, 0.96); // right window

  // ----- sliding glass auto-doors (centred) -----
  A(CTX.box(0.33, 1.38, 0.05, doorGlassM, -0.18, 0.74, 1.00));   // left leaf
  A(CTX.box(0.33, 1.38, 0.05, doorGlassM,  0.18, 0.74, 1.00));   // right leaf
  A(CTX.box(0.04, 1.38, 0.06, mullionM, 0,     0.74, 1.01));     // centre meeting stile
  A(CTX.box(0.05, 1.42, 0.07, mullionM, -0.37, 0.74, 1.00));     // left jamb
  A(CTX.box(0.05, 1.42, 0.07, mullionM,  0.37, 0.74, 1.00));     // right jamb
  A(CTX.box(0.82, 0.16, 0.10, mullionM, 0, 1.49, 1.00));         // door header
  A(CTX.box(0.70, 0.02, 0.34, baseTrimM, 0, 0.01, 1.13));        // welcome mat

  // ===== signature sign band / fascia (white field + GREEN & BLUE glowing stripes) =====
  A(CTX.box(2.42, 0.36, 0.10, signWhiteM, 0, 1.33, 0.97));   // white fascia field (front)
  A(CTX.box(2.46, 0.10, 0.05, greenM, 0, 1.43, 1.00));       // upper green band
  A(CTX.box(2.46, 0.10, 0.05, blueM,  0, 1.21, 1.00));       // lower blue band
  // wrap the band around BOTH sides for street recognisability
  for (const sx of [-1, 1]) {
    A(CTX.box(0.10, 0.36, 1.95, signWhiteM, sx * 1.205, 1.33, -0.05));
    A(CTX.box(0.05, 0.10, 1.99, greenM,     sx * 1.235, 1.43, -0.05));
    A(CTX.box(0.05, 0.10, 1.99, blueM,      sx * 1.235, 1.21, -0.05));
  }

  // ===== projecting rooftop pylon sign (double-sided: stripes pass through) =====
  A(CTX.cyl(0.045, 0.05, 0.42, metalM, 0.85, 1.81, 0.70));      // short post above front corner
  A(CTX.box(0.46, 0.50, 0.08, signWhiteM, 0.85, 2.27, 0.70));   // white sign box
  A(CTX.box(0.50, 0.11, 0.14, greenM, 0.85, 2.39, 0.70));       // green band (protrudes both faces)
  A(CTX.box(0.50, 0.11, 0.14, blueM,  0.85, 2.15, 0.70));       // blue band
  A(CTX.box(0.50, 0.05, 0.10, mullionM, 0.85, 2.50, 0.70));     // cap
  // perpendicular blade sign on the left wall (reads down the street, double-sided)
  A(CTX.box(0.12, 0.06, 0.06, metalM,    -1.26, 1.35, 0.30));
  A(CTX.box(0.08, 0.40, 0.46, signWhiteM,-1.34, 1.25, 0.30));
  A(CTX.box(0.13, 0.10, 0.50, greenM,    -1.34, 1.35, 0.30));
  A(CTX.box(0.13, 0.10, 0.50, blueM,     -1.34, 1.15, 0.30));

  // ===== flat roof: low parapet + AC condensers + water tank =====
  A(CTX.box(2.52, 0.16, 0.08, roofM, 0, 1.68,  0.92));   // parapet front
  A(CTX.box(2.52, 0.16, 0.08, roofM, 0, 1.68, -1.02));   // parapet back
  A(CTX.box(0.08, 0.16, 2.02, roofM, -1.22, 1.68, -0.05));
  A(CTX.box(0.08, 0.16, 2.02, roofM,  1.22, 1.68, -0.05));
  // AC condensers
  A(CTX.box(0.52, 0.32, 0.46, metalM, -0.55, 1.78, -0.35));
  A(CTX.cyl(0.16, 0.16, 0.03, baseTrimM, -0.55, 1.95, -0.35));
  A(CTX.sph(0.04, mullionM, -0.55, 1.96, -0.35, 8));
  A(CTX.box(0.34, 0.24, 0.30, metalM, -0.18, 1.74, -0.72));
  // stainless rooftop water tank (Taiwan 水塔) on little legs
  for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18])
    A(CTX.cyl(0.03, 0.03, 0.18, metalM, 0.55 + dx, 1.69, -0.55 + dz));
  A(CTX.cyl(0.28, 0.28, 0.42, tankM, 0.55, 1.99, -0.55));
  A(CTX.cyl(0.20, 0.28, 0.08, tankM, 0.55, 2.24, -0.55));
  A(CTX.cyl(0.025, 0.025, 0.12, metalM, 0.55, 2.34, -0.55));

  // ===== eat-in window counter + bar stools (right side of the front) =====
  A(CTX.box(0.74, 0.05, 0.22, counterM, 0.68, 0.82, 1.12));   // counter ledge
  A(CTX.box(0.03, 0.70, 0.03, metalM, 0.40, 0.46, 1.18));     // brackets
  A(CTX.box(0.03, 0.70, 0.03, metalM, 0.96, 0.46, 1.18));
  const stool = (x, z, h) => {
    A(CTX.cyl(0.045, 0.055, h, metalM, x, h/2, z));
    A(CTX.cyl(0.12, 0.12, 0.06, stoolM, x, h + 0.03, z));
  };
  stool(0.40, 1.40, 0.62); stool(0.68, 1.40, 0.62); stool(0.96, 1.40, 0.62);

  // ===== small outdoor table + 2 stools (left side) =====
  A(CTX.cyl(0.24, 0.24, 0.05, counterM, -0.92, 0.60, 1.50));  // table top
  A(CTX.cyl(0.05, 0.05, 0.55, metalM, -0.92, 0.30, 1.50));    // pedestal
  A(CTX.cyl(0.15, 0.15, 0.04, metalM, -0.92, 0.04, 1.50));    // foot
  stool(-1.08, 1.46, 0.42); stool(-0.92, 1.78, 0.42);

  // ===== recycle/trash bins by the door (green + blue lids) =====
  A(CTX.box(0.20, 0.32, 0.20, metalM, -0.55, 0.18, 1.13)); A(CTX.box(0.22, 0.05, 0.22, greenM, -0.55, 0.36, 1.13));
  A(CTX.box(0.20, 0.32, 0.20, metalM, -0.78, 0.18, 1.13)); A(CTX.box(0.22, 0.05, 0.22, blueM,  -0.78, 0.36, 1.13));

  return g;
}

// BUBBLE-TEA STAND (珍奶) — boba was invented in Taiwan; a tiny takeout kiosk
function buildBobaShop(CTX){
  const g = CTX.group();

  // --- palette: 50嵐-style cream body + deep green, milk-tea accents ---
  const matBody    = CTX.toon('#F2E7CE');                                            // warm cream kiosk body
  const matGreen   = CTX.toon('#15894A');                                            // deep brand green
  const matGreenDk = CTX.toon('#0F6A39');                                            // darker green trim
  const matGreenLt = CTX.toon('#1BB85E', { emissive:'#1BC766', emissiveIntensity:0.5 }); // glowing sign band
  const matCounter = CTX.toon('#C99A5E');                                            // wood service counter
  const matDark    = CTX.toon('#16211C', { emissive:'#3A2A12', emissiveIntensity:0.35 }); // lit window interior
  const matMenu    = CTX.toon('#FFF4DC', { emissive:'#FFE7AE', emissiveIntensity:0.7 });  // menu lightbox
  const matLogo    = CTX.toon('#F6F0E2', { emissive:'#FFF1C9', emissiveIntensity:0.4 });
  const matMilkTea = CTX.toon('#D9A86A', { emissive:'#E2B074', emissiveIntensity:0.55 }); // cup fill glow
  const matCupTop  = CTX.toon('#F6F0E2', { emissive:'#F4ECCF', emissiveIntensity:0.45 }); // lid / rim
  const matPearl   = CTX.toon('#241410', { emissive:'#160B06', emissiveIntensity:0.15 }); // tapioca pearls
  const matStraw   = CTX.toon('#FF5277', { emissive:'#FF6E8C', emissiveIntensity:0.5 });  // jaunty straw
  const matBulb    = CTX.toon('#FFE6A8', { emissive:'#FFCF7A', emissiveIntensity:0.95 });
  const matLine    = CTX.toon('#1A1A1E');
  const matMetal   = CTX.toon('#8FA39A');
  const menuItems  = [
    CTX.toon('#1E9E57', { emissive:'#1E9E57', emissiveIntensity:0.55 }),
    CTX.toon('#C77B3E', { emissive:'#C77B3E', emissiveIntensity:0.55 }),
    CTX.toon('#F26D9C', { emissive:'#F26D9C', emissiveIntensity:0.55 }),
    CTX.toon('#3FA0C7', { emissive:'#3FA0C7', emissiveIntensity:0.55 }),
  ];

  // =================== KIOSK SHELL (front / service window faces +Z) ===================
  g.add(CTX.box(1.8, 0.12, 1.35, matGreenDk, 0, 0.06, 0));            // green base plinth
  g.add(CTX.box(1.7, 1.5, 0.12, matBody, 0, 0.87, -0.55));            // back wall
  g.add(CTX.box(0.12, 1.5, 1.1, matBody, -0.79, 0.87, 0.0));          // left wall
  g.add(CTX.box(0.12, 1.5, 1.1, matBody,  0.79, 0.87, 0.0));          // right wall
  g.add(CTX.box(1.9, 0.14, 1.3, matGreen, 0, 1.69, -0.02));           // roof slab (overhangs front)

  // dark recessed service-window interior (reads as a lit opening above the counter)
  g.add(CTX.box(1.15, 0.5, 0.06, matDark, 0.25, 1.25, -0.45));

  // --- front lower wall under the window (counter base) ---
  g.add(CTX.box(1.2, 0.65, 0.12, matGreen, 0.25, 0.445, 0.48));
  g.add(CTX.box(1.2, 0.16, 0.04, matBody, 0.25, 0.64, 0.55));         // cream brand stripe
  // service counter top (waist-high, juts forward)
  g.add(CTX.box(1.34, 0.1, 0.44, matCounter, 0.25, 0.82, 0.5));

  // --- left solid front panel holding the illuminated MENU board ---
  g.add(CTX.box(0.5, 1.5, 0.12, matBody, -0.6, 0.87, 0.48));
  g.add(CTX.box(0.48, 1.2, 0.05, matGreenDk, -0.6, 0.95, 0.53));      // menu frame
  g.add(CTX.box(0.42, 1.12, 0.05, matMenu, -0.6, 0.95, 0.565));       // glowing lightbox
  for(let r=0; r<5; r++){                                             // little colored menu items
    const yy = 1.36 - r*0.18;
    g.add(CTX.box(0.3, 0.07, 0.03, menuItems[r % menuItems.length], -0.6, yy, 0.6));
    g.add(CTX.box(0.06, 0.07, 0.03, matLine, -0.43, yy, 0.6));        // price tick
  }

  // --- header sign band + logo plate over the window ---
  g.add(CTX.box(1.7, 0.22, 0.16, matGreenLt, 0, 1.55, 0.46));
  g.add(CTX.box(0.66, 0.16, 0.04, matLogo, 0.1, 1.55, 0.55));
  g.add(CTX.sph(0.045, matPearl, -0.02, 1.55, 0.59));                 // two boba "logo" dots
  g.add(CTX.sph(0.045, matPearl,  0.22, 1.55, 0.59));

  // =================== STRIPED AWNING over the window ===================
  (function(){
    const A = CTX.group();
    const xs = [];
    for(let x=-0.82; x<=0.82; x+=0.205) xs.push(x);
    xs.forEach((x,i)=>{
      const col = (i % 2 === 0) ? matGreen : matBody;
      A.add(CTX.box(0.21, 0.05, 0.5, col, x, 0, 0.25));               // stripe
      A.add(CTX.box(0.19, 0.13, 0.04, col, x, -0.05, 0.5));           // scalloped valance
    });
    A.add(CTX.box(1.86, 0.05, 0.06, matGreenDk, 0, 0.02, 0.5));       // front trim bar
    A.position.set(0, 1.6, 0.5);
    A.rotation.x = 0.42;                                              // slope down toward +Z front
    g.add(A);
  })();

  // =================== HERO: giant bubble-tea-cup sign on top ===================
  (function(){
    const C = CTX.group();
    C.add(CTX.cyl(0.07, 0.08, 0.16, matGreen, 0, 0.08, 0));           // stand
    C.add(CTX.cyl(0.27, 0.25, 0.16, matPearl, 0, 0.24, 0, 16));       // dark pearl layer at cup bottom
    [[-0.15,0.06],[0,0.13],[0.15,0.06],[-0.08,0.15],[0.08,0.15],[0.2,-0.04],[-0.2,-0.04]]
      .forEach(p => C.add(CTX.sph(0.055, matPearl, p[0], 0.2, p[1])));// bobbly tapioca pearls
    C.add(CTX.cyl(0.33, 0.27, 0.5, matMilkTea, 0, 0.57, 0, 18));      // milk-tea fill (wider at top)
    C.add(CTX.cyl(0.34, 0.34, 0.04, matCupTop, 0, 0.82, 0, 18));      // rim highlight
    C.add(CTX.cyl(0.30, 0.36, 0.1, matCupTop, 0, 0.88, 0, 18));       // lid rim (overhang)
    C.add(CTX.cyl(0.09, 0.30, 0.2, matCupTop, 0, 1.03, 0, 18));       // domed lid
    const straw = CTX.cyl(0.04, 0.04, 0.6, matStraw, 0.05, 1.25, 0.04);
    straw.rotation.set(0.3, 0, 0.32);                                 // poke out at a jaunty angle
    C.add(straw);
    C.position.set(0, 1.76, -0.05);                                   // mounted on the roof, centered
    g.add(C);
  })();

  // =================== COUNTER LIFE ===================
  // stacked cups (a little nested tower)
  for(let k=0; k<3; k++) g.add(CTX.cyl(0.055, 0.05, 0.13, matCupTop, -0.1, 1.13 + k*0.04, 0.42, 10));
  for(let k=0; k<2; k++) g.add(CTX.cyl(0.05, 0.045, 0.12, matCupTop, 0.66, 1.12 + k*0.04, 0.4, 10));
  // sealing-machine hint
  g.add(CTX.box(0.2, 0.26, 0.2, matMetal, 0.4, 1.2, 0.4));
  g.add(CTX.box(0.22, 0.05, 0.22, matGreen, 0.4, 1.35, 0.4));
  const lever = CTX.box(0.04, 0.16, 0.04, matMetal, 0.4, 1.42, 0.47); lever.rotation.x = -0.4; g.add(lever);
  g.add(CTX.sph(0.022, matBulb, 0.47, 1.3, 0.51));                    // indicator light
  // pendant lights over the counter
  [-0.12, 0.55].forEach(x => {
    g.add(CTX.box(0.015, 0.16, 0.015, matLine, x, 1.36, 0.5));
    g.add(CTX.sph(0.05, matBulb, x, 1.26, 0.5));
  });

  // =================== two little waiting stools out front ===================
  [[-0.48, 0.84], [0.5, 0.8]].forEach(s => {
    const [x,z] = s;
    g.add(CTX.cyl(0.1, 0.12, 0.03, matMetal, x, 0.03, z, 12));        // foot
    g.add(CTX.cyl(0.04, 0.05, 0.34, matMetal, x, 0.2, z, 10));        // post
    g.add(CTX.cyl(0.13, 0.13, 0.05, matGreen, x, 0.4, z, 14));        // seat
  });

  return g;
}

// TAIWANESE BREAKFAST SHOP (早餐店) — soy milk, egg crepes, steamer baskets
function buildBreakfastShop(CTX){
  const g = CTX.group();
  // --- palette (each toon created once, reused) ---
  const matWall   = CTX.toon('#ECE4D0');                                   // cream tiled shop wall
  const matWallB  = CTX.toon('#DCD2BA');                                   // side wall (slightly darker)
  const matRoof   = CTX.toon('#7E8B96');                                   // bluish corrugated roof
  const matSteel  = CTX.toon('#C2C8D0');                                   // stainless counter / urn
  const matSteelT = CTX.toon('#DCE0E6');                                   // bright steel top edge
  const matDark   = CTX.toon('#26262B');                                   // dark steel / iron
  const matGrid   = CTX.toon('#1F1F24');                                   // griddle slab
  const matRed    = CTX.toon('#E11818', { emissive:'#FF2E1E', emissiveIntensity:0.6 });  // sign red field
  const matYellow = CTX.toon('#FFD21A', { emissive:'#FFDD3A', emissiveIntensity:0.6 });  // sign yellow trim/text
  const matAwn    = CTX.toon('#CB2020');                                   // red awning
  const matValance= CTX.toon('#F4F0E6');                                   // white scallop valance
  const matBulb   = CTX.toon('#FFF1C2', { emissive:'#FFE39A', emissiveIntensity:1.0 });  // warm bulbs
  const matCrepe  = CTX.toon('#F0DEAF');                                   // egg-crepe rounds
  const matSteam  = CTX.toon('#FAFAFA', { emissive:'#FFFFFF', emissiveIntensity:0.18 }); // steam puffs
  const matBamboo = CTX.toon('#C79A55');                                   // steamer basket
  const matBamboR = CTX.toon('#A87B3C');                                   // basket rim
  const matLid    = CTX.toon('#D9B477');                                   // steamer lid
  const matCup    = CTX.toon('#F2F2EC');                                   // paper cup
  const matBoard  = CTX.toon('#23291F');                                   // chalkboard / menu
  const matChalk  = CTX.toon('#EFE7C8', { emissive:'#FFE39A', emissiveIntensity:0.25 }); // chalk lines
  const matKetch  = CTX.toon('#D8302A');                                   // ketchup squeeze bottle
  const matMayo   = CTX.toon('#F4EFDD');                                   // mayo squeeze bottle
  const matStoolR = CTX.toon('#D8392A');                                   // red plastic stool
  const matStoolB = CTX.toon('#2A78C8');                                   // blue plastic stool
  const matStoolO = CTX.toon('#E8902A');                                   // orange plastic stool
  const matTable  = CTX.toon('#E0D8C0');                                   // plastic table top
  const matFrame  = CTX.toon('#3A3A40');                                   // A-frame / table legs

  // =========================================================
  //  SHELL — back + side walls (open front faces +Z), roof
  // =========================================================
  g.add(CTX.box(2.04, 1.62, 0.10, matWall, 0, 0.81, -0.72));               // back wall
  g.add(CTX.box(0.10, 1.62, 1.30, matWallB, -1.00, 0.81, -0.12));          // left wall
  g.add(CTX.box(0.10, 1.62, 1.30, matWallB,  1.00, 0.81, -0.12));          // right wall
  g.add(CTX.box(2.12, 0.10, 1.50, matRoof, 0, 1.66, -0.16));               // flat roof slab
  g.add(CTX.box(2.00, 0.14, 0.14, matDark, 0, 1.60, 0.46));                // header beam over the open front

  // =========================================================
  //  SIGN FASCIA — the red+yellow glowing breakfast-shop band
  // =========================================================
  g.add(CTX.box(2.20, 0.40, 0.12, matRed,    0, 1.80, 0.50));              // red field
  g.add(CTX.box(2.26, 0.08, 0.15, matYellow, 0, 2.02, 0.50));              // yellow top bar
  g.add(CTX.box(2.26, 0.07, 0.15, matYellow, 0, 1.59, 0.50));             // yellow bottom bar
  for(let i=0;i<4;i++){                                                    // glowing yellow "characters" on the red field
    g.add(CTX.box(0.22, 0.26, 0.05, matYellow, -0.66 + i*0.44, 1.80, 0.58));
  }

  // =========================================================
  //  AWNING — sloped red canopy with white scalloped valance
  // =========================================================
  const awn = CTX.box(2.16, 0.05, 0.58, matAwn, 0, 1.50, 0.84); awn.rotation.set(-0.22,0,0); g.add(awn);
  for(let i=0;i<9;i++){                                                    // scallop valance hanging at the front edge
    const sc = CTX.cone(0.10, 0.14, matValance, -0.96 + i*0.24, 1.40, 1.10, 6);
    sc.rotation.set(Math.PI,0,0); g.add(sc);
  }
  for(const x of [-0.55, 0.0, 0.55]) g.add(CTX.sph(0.08, matBulb, x, 1.33, 0.66));  // warm bulbs under the awning

  // =========================================================
  //  FRONT COUNTER — long stainless steel cooking counter
  // =========================================================
  g.add(CTX.box(2.00, 0.72, 0.40, matSteel,  0, 0.37, 0.52));              // counter body
  g.add(CTX.box(2.06, 0.07, 0.46, matSteelT, 0, 0.76, 0.52));              // counter top
  g.add(CTX.box(2.00, 0.10, 0.04, matDark,   0, 0.30, 0.73));              // toe kick line
  const TOP = 0.805;                                                       // working surface height

  // --- flat-top GRIDDLE with egg-crepes + steam (left of counter) ---
  g.add(CTX.box(0.92, 0.06, 0.40, matGrid, -0.45, TOP, 0.52));            // dark steel griddle slab
  const crepe = [[-0.66,0.46],[-0.45,0.58],[-0.30,0.44],[-0.52,0.62]];
  for(const c of crepe) g.add(CTX.cyl(0.10, 0.10, 0.025, matCrepe, c[0], TOP+0.04, c[1], 10));
  const puffs = [[-0.50,0.50,1.12,0.06],[-0.40,0.56,1.22,0.08],[-0.55,0.46,1.30,0.05],[-0.36,0.50,1.36,0.045]];
  for(const p of puffs) g.add(CTX.sph(p[3], matSteam, p[0], p[2], p[1]));

  // --- squeeze bottles by the griddle ---
  g.add(CTX.cyl(0.035,0.05,0.13, matKetch, -0.05, TOP+0.065, 0.58, 8));
  g.add(CTX.cone(0.03,0.05, matKetch, -0.05, TOP+0.155, 0.58, 8));
  g.add(CTX.cyl(0.035,0.05,0.13, matMayo,  0.04, TOP+0.065, 0.62, 8));
  g.add(CTX.cone(0.03,0.05, matMayo,  0.04, TOP+0.155, 0.62, 8));

  // --- stacked STEAMER baskets with a steam wisp (center-right) ---
  const sx = 0.40;
  for(let i=0;i<3;i++){
    const y = TOP + 0.07 + i*0.13;
    g.add(CTX.cyl(0.23, 0.23, 0.12, matBamboo, sx, y, 0.46, 16));
    g.add(CTX.cyl(0.235,0.235,0.03, matBamboR, sx, y+0.06, 0.46, 16));
  }
  g.add(CTX.cyl(0.23, 0.20, 0.07, matLid, sx, TOP+0.40, 0.46, 16));        // domed lid on top
  g.add(CTX.cyl(0.04, 0.05, 0.03, matBamboR, sx, TOP+0.45, 0.46, 8));      // lid knob
  for(const p of [[0.0,1.50,0.07],[-0.06,1.58,0.055],[0.05,1.64,0.045]])
    g.add(CTX.sph(p[2], matSteam, sx+p[0], p[1], 0.46));

  // --- tall SOY-MILK urn / drink dispenser with a tap (right end) ---
  const ux = 0.85;
  g.add(CTX.cyl(0.16, 0.17, 0.50, matSteel, ux, TOP+0.25, 0.46, 16));      // urn body
  g.add(CTX.cyl(0.15, 0.16, 0.05, matSteelT, ux, TOP+0.50, 0.46, 16));     // rim
  g.add(CTX.cone(0.15, 0.12, matLid, ux, TOP+0.58, 0.46, 16));             // domed lid
  g.add(CTX.cyl(0.02, 0.02, 0.05, matDark, ux, TOP+0.66, 0.46, 6));        // lid handle
  g.add(CTX.box(0.05, 0.05, 0.06, matDark, ux, TOP+0.10, 0.62));           // tap body
  g.add(CTX.box(0.025, 0.07, 0.025, matDark, ux, TOP+0.05, 0.64));         // tap spout
  g.add(CTX.cyl(0.05, 0.045, 0.08, matCup, ux, TOP+0.04, 0.66, 10));       // cup under the tap

  // =========================================================
  //  KITCHEN BACK WALL — shelf, jars, chalkboard menu, utensils
  // =========================================================
  g.add(CTX.box(1.9, 0.05, 0.20, matSteelT, 0, 1.02, -0.62));             // back shelf
  for(let i=0;i<5;i++) g.add(CTX.cyl(0.06,0.06,0.14, matCup, -0.55 + i*0.28, 1.11, -0.62, 9));  // stacked cups/jars
  // chalkboard menu
  g.add(CTX.box(0.62, 0.46, 0.03, matBoard, 0.5, 1.34, -0.65));
  g.add(CTX.box(0.66, 0.05, 0.05, matYellow, 0.5, 1.58, -0.64));          // yellow menu frame top
  for(let i=0;i<4;i++) g.add(CTX.box(0.40, 0.03, 0.02, matChalk, 0.5, 1.46 - i*0.10, -0.63));   // chalk price lines
  // hanging utensils across the open front
  g.add(CTX.box(1.6, 0.02, 0.02, matDark, -0.2, 1.50, 0.40));             // hanging rod
  g.add(CTX.cyl(0.012,0.012,0.22, matDark, -0.7, 1.38, 0.40, 6));          // ladle handle
  g.add(CTX.sph(0.05, matSteel, -0.7, 1.25, 0.40, 8));                     // ladle bowl
  g.add(CTX.box(0.10, 0.02, 0.18, matDark, -0.45, 1.40, 0.40));            // spatula head
  g.add(CTX.cyl(0.012,0.012,0.18, matDark, -0.45, 1.42, 0.40, 6));         // spatula handle

  // =========================================================
  //  SIDEWALK — A-frame menu sign, plastic stools + tiny table
  // =========================================================
  // folding A-frame sign (two angled emissive boards)
  const af = CTX.group();
  const b1 = CTX.box(0.56, 0.74, 0.04, matYellow, 0, 0.42, 0.12);  b1.rotation.set( 0.30,0,0);
  const b2 = CTX.box(0.56, 0.74, 0.04, matYellow, 0, 0.42,-0.12);  b2.rotation.set(-0.30,0,0);
  af.add(b1, b2);
  af.add(CTX.box(0.60, 0.05, 0.05, matFrame, 0, 0.77, 0));                 // hinge cap
  for(let i=0;i<3;i++) af.add(CTX.box(0.40, 0.04, 0.02, matBoard, 0, 0.58 - i*0.13, 0.24));  // menu lines on the front face
  af.position.set(-0.78, 0, 1.32);
  g.add(af);

  // plastic stool maker
  function stool(x, z, col){
    const s = CTX.group();
    s.add(CTX.cyl(0.135, 0.115, 0.24, col, 0, 0.13, 0, 12));               // molded body
    s.add(CTX.cyl(0.16, 0.155, 0.045, col, 0, 0.26, 0, 12));               // seat lip
    s.position.set(x, 0, z);
    return s;
  }
  // tiny table
  const tbl = CTX.group();
  tbl.add(CTX.cyl(0.30, 0.30, 0.04, matTable, 0, 0.46, 0, 14));            // round top
  tbl.add(CTX.cyl(0.04, 0.04, 0.46, matFrame, 0, 0.23, 0, 8));            // post
  tbl.add(CTX.cyl(0.16, 0.16, 0.03, matFrame, 0, 0.02, 0, 10));           // foot
  tbl.position.set(0.60, 0, 1.42);
  g.add(tbl);
  g.add(stool(0.35, 1.18, matStoolR));
  g.add(stool(0.88, 1.20, matStoolB));
  g.add(stool(0.62, 1.70, matStoolO));

  return g;
}

export {
  buildTaipei101, buildCKSComplex, buildGrandHotel, buildPalaceMuseum,
  buildLongshanTemple, buildBaoanTemple, buildPresidentialOffice, buildMainStation,
  buildSYSHall, buildCityHall, buildArena,
  buildFerrisWheel, buildGondolaPylon, buildGondolaCabin, buildNightMarket,
  buildSevenEleven, buildFamilyMart, buildBobaShop, buildBreakfastShop
};
