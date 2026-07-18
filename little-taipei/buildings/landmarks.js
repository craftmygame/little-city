/* =====================================================================
 *  TAIPEI TINY PLANET — LANDMARK MODELS  (pure local-space builders)
 * ---------------------------------------------------------------------
 *  Every builder receives a CTX object and returns a THREE.Group built
 *  in LOCAL space: origin at the base-centre on the ground, +Y up, the
 *  building's FRONT facing +Z. No sphere/planet math lives here — the
 *  host (main.js) places each model onto the planet surface.
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
  g.add(CTX.box(9.20,0.08,7.30,lobbyFloor,0,0.04,0));                    // broad public floor, hugging the shell footprint
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
  // body as a U-shell (not a sealed cube): the memorial chamber is walkable
  const bodyW = 3.9, bodyH = 1.95;
  A(CTX.box(bodyW, bodyH, 0.24, cream, 0, podTop + bodyH/2, -(bodyW/2 - 0.12)));  // back wall
  A(CTX.box(0.24, bodyH, bodyW, cream, -(bodyW/2 - 0.12), podTop + bodyH/2, 0));  // side walls
  A(CTX.box(0.24, bodyH, bodyW, cream,  (bodyW/2 - 0.12), podTop + bodyH/2, 0));
  A(CTX.box(1.05, bodyH, 0.24, cream, -1.42, podTop + bodyH/2, bodyW/2 - 0.12));  // front wings
  A(CTX.box(1.05, bodyH, 0.24, cream,  1.42, podTop + bodyH/2, bodyW/2 - 0.12));
  A(CTX.box(bodyW, 0.36, bodyW, cream, 0, podTop + bodyH - 0.18, 0));             // ceiling slab spans the shell
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    A(CTX.box(0.60, bodyH + 0.22, 0.60, pier, sx*(bodyW/2 - 0.02), podTop + (bodyH + 0.22)/2, sz*(bodyW/2 - 0.02)));
  // the memorial chamber: statue of Sun Yat-sen facing the south doors
  const warm = CTX.toon('#f3e2b8', { emissive:'#e8c987', emissiveIntensity:0.35 });
  const bronze = CTX.toon('#6d5b3f'), carpet = CTX.toon('#a63a30');
  A(CTX.box(3.3, 0.05, 3.3, stoneD, 0, podTop + 0.025, 0));                       // chamber floor
  A(CTX.box(3.2, 1.45, 0.06, warm, 0, podTop + 0.85, -(bodyW/2 - 0.28)));         // lit memorial wall
  A(CTX.box(0.8, 0.035, 2.7, carpet, 0, podTop + 0.055, 0.45));                   // red carpet to the doors
  A(CTX.box(1.1, 0.5, 0.7, stone, 0, podTop + 0.25, -1.15));                      // pedestal
  A(CTX.box(0.62, 0.62, 0.4, bronze, 0, podTop + 0.81, -1.18));                   // seated figure
  A(CTX.box(0.5, 0.28, 0.42, bronze, 0, podTop + 0.62, -0.95));
  A(CTX.sph(0.17, bronze, 0, podTop + 1.24, -1.18, 8));
  // front porch: red columns + door jambs framing the open entrance
  for (const x of [-1.25, -0.62, 0.62, 1.25]) A(CTX.cyl(0.10, 0.115, bodyH, pier, x, podTop + bodyH/2, bodyW/2 + 0.34, 10));
  A(CTX.box(2.95, 0.18, 0.85, roofSh, 0, podTop + bodyH + 0.02, bodyW/2 + 0.12));
  A(CTX.box(0.14, 1.72, 0.14, dark, -0.92, podTop + 0.86, bodyW/2 - 0.06));
  A(CTX.box(0.14, 1.72, 0.14, dark,  0.92, podTop + 0.86, bodyW/2 - 0.06));
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
  // --- south entrance plaza toward Ren'ai Rd: broad pavers, paired stone gate
  //     piers, clipped hedges and a few palms (street-view: the wide forecourt
  //     with red kerb and flanking gate pillars).
  const hedge = CTX.toon('#4f7a4a'), palmG = CTX.toon('#4c8b4f'), palmT = CTX.toon('#8a7355');
  A(CTX.box(5.2, 0.05, 3.0, stone,  0, 0.025, 4.7));                  // plaza apron
  A(CTX.box(2.6, 0.06, 3.0, stoneD, 0, 0.055, 4.7));                  // central walk
  for (const sx of [-1, 1]){
    A(CTX.box(0.55, 1.25, 0.55, stone, sx*2.35, 0.62, 5.0));          // gate pier
    A(CTX.box(0.72, 0.10, 0.72, stoneD, sx*2.35, 1.30, 5.0));         // cap slab
    const cap = CTX.cone(0.52, 0.30, roofSh, sx*2.35, 1.50, 5.0, 4);  // little hip cap
    cap.rotation.y = Math.PI/4; A(cap);
    A(CTX.box(1.65, 0.28, 0.30, hedge, sx*1.95, 0.17, 4.0));          // clipped hedges
    A(CTX.box(0.30, 0.28, 1.30, hedge, sx*2.52, 0.17, 3.2));
  }
  for (const [px, pz] of [[-1.9, 5.9], [1.9, 5.9], [-2.6, 4.3]]){     // palms
    A(CTX.cyl(0.055, 0.075, 1.35, palmT, px, 0.68, pz, 6));
    const crown = CTX.sph(0.34, palmG, px, 1.45, pz, 7); crown.scale.y = 0.5; A(crown);
    A(CTX.cone(0.10, 0.34, palmG, px, 1.58, pz, 5));
  }
  return g;
}

// ---------------------------------------------------------------------
//  TAIPEI DOME — giant flattened silver saucer over a glazed retail
//  arcade (street view: tree-lined arcade with bronze shopfront band
//  facing Zhongxiao E Rd; "TAIPEI DOME" lettering on the roof rim).
// ---------------------------------------------------------------------
function buildTaipeiDome(CTX){
  const T = CTX.THREE; const g = CTX.group(); const A = m => (g.add(m), m);
  const plinth = CTX.toon('#cfd0d4'), pier = CTX.toon('#e8e9ea');
  const shopGlass = CTX.toon('#3b4148', { emissive:'#57503c', emissiveIntensity:0.18 });
  const fascia = CTX.toon('#8a7250'), drumM = CTX.toon('#dfe1e3'), band = CTX.toon('#f2f3f4');
  const roofM = CTX.toon('#9aa0a6', { side: T.DoubleSide }), roofHi = CTX.toon('#b9bec3');
  const sign = CTX.toon('#f4f5f6', { emissive:'#ffffff', emissiveIntensity:0.22 });
  const leafM = CTX.toon('#5f8a56'), trunkM = CTX.toon('#9a8a70');
  const grass = CTX.toon('#5da24f'), infield = CTX.toon('#c9a06a'), chalk = CTX.toon('#f2efe4');
  const seatM = CTX.toon('#3f6b7d', { side: T.DoubleSide }), seatD = CTX.toon('#35596a', { side: T.DoubleSide });
  const halo = CTX.toon('#fff3cf', { emissive:'#ffe9a8', emissiveIntensity:0.55, side: T.DoubleSide });
  const oval = (m) => (m.scale.x = 1.16, m);
  const GAP = 0.42;                          // entrance arc (rad), centred on +Z

  A(oval(CTX.cyl(3.75, 3.85, 0.16, plinth, 0, 0.08, 0, 24)));               // plinth
  // C-shaped glazed arcade drum — a REAL street opening faces +Z, so the
  // player can walk off Zhongxiao straight onto the field concourse.
  const drum = CTX.mesh(CTX.faceted(new T.CylinderGeometry(3.35, 3.4, 1.35, 24, 1, true, GAP, Math.PI*2 - GAP*2)), shopGlass, 0, 0.835, 0);
  oval(drum); A(drum);
  for (let i = 0; i < 20; i++){                                             // white piers (none across the doorway)
    const th = -Math.PI + i * (Math.PI * 2 / 20);
    if (Math.abs(th) < GAP + 0.12) continue;
    const p = CTX.box(0.16, 1.35, 0.16, pier, Math.sin(th) * 3.42 * 1.16, 0.835, Math.cos(th) * 3.42);
    p.rotation.y = th; A(p);
  }
  for (const s of [-1, 1])                                                  // portal jambs + lintel
    A(CTX.box(0.2, 1.35, 0.2, band, Math.sin(s * GAP) * 3.42 * 1.16, 0.835, Math.cos(s * GAP) * 3.42));
  A(CTX.box(3.3, 0.16, 0.22, band, 0, 1.45, 3.32));
  A(oval(CTX.cyl(3.48, 3.48, 0.2, fascia, 0, 1.61, 0, 24)));                // bronze sign band
  A(oval(CTX.cyl(3.3, 3.42, 0.62, drumM, 0, 2.02, 0, 24)));                 // white concourse band
  A(oval(CTX.cyl(3.5, 3.5, 0.12, band, 0, 2.39, 0, 24)));                   // rim ring
  // the saucer — top hemisphere only (double-sided), so inside you look up
  // into the grey bowl instead of clipping a sphere's belly
  const domeR = CTX.mesh(CTX.faceted(new T.SphereGeometry(3.62, 22, 9, 0, Math.PI*2, 0, Math.PI/2)), roofM, 0, 2.42, 0);
  domeR.scale.set(1.2, 0.5, 1.04); A(domeR);
  const cap = CTX.mesh(CTX.faceted(new T.SphereGeometry(2.0, 16, 6, 0, Math.PI*2, 0, Math.PI/2)), roofHi, 0, 3.36, 0);
  cap.scale.set(1.2, 0.36, 1.04); A(cap);
  const namep = CTX.box(2.3, 0.22, 0.08, sign, 0, 2.62, 3.5); namep.rotation.x = -0.42; A(namep);  // TAIPEI DOME strip
  A(CTX.sph(0.1, band, 0, 4.32, 0, 8));
  // --- inside: the ballpark — outfield, infield diamond, mound, seat bowl ---
  A(oval(CTX.cyl(2.85, 2.85, 0.05, grass, 0, 0.19, 0, 24)));
  const dia = CTX.box(1.5, 0.045, 1.5, infield, 0, 0.215, 0.9); dia.rotation.y = Math.PI/4; A(dia);
  A(CTX.cyl(0.2, 0.24, 0.05, infield, 0, 0.24, 0.9, 10));                   // mound
  for (const [bx, bz] of [[0, 1.66], [-0.74, 0.9], [0.74, 0.9], [0, 0.14]])
    A(CTX.box(0.14, 0.05, 0.14, chalk, bx, 0.245, bz));                     // plate + bases
  const bowl = CTX.mesh(CTX.faceted(new T.CylinderGeometry(3.08, 2.72, 0.62, 24, 1, true, GAP + 0.2, Math.PI*2 - (GAP + 0.2)*2)), seatM, 0, 0.55, 0);
  oval(bowl); A(bowl);
  const bowl2 = CTX.mesh(CTX.faceted(new T.CylinderGeometry(2.68, 2.46, 0.3, 24, 1, true, GAP + 0.35, Math.PI*2 - (GAP + 0.35)*2)), seatD, 0, 0.36, 0);
  oval(bowl2); A(bowl2);
  const ring = CTX.mesh(CTX.faceted(new T.CylinderGeometry(2.4, 2.4, 0.09, 24, 1, true)), halo, 0, 2.56, 0);
  oval(ring); A(ring);                                                      // floodlight halo over the field
  // arcade tree row along the front, clear of the doorway (street view)
  for (const tx of [-3.1, -2.0, 2.0, 3.1]){
    A(CTX.cyl(0.05, 0.07, 0.75, trunkM, tx, 0.38, 3.62, 6));
    const c1 = CTX.sph(0.38, leafM, tx, 0.98, 3.62, 7); c1.scale.y = 0.85; A(c1);
    A(CTX.sph(0.24, leafM, tx + 0.12, 1.26, 3.58, 6));
  }
  return g;
}

// ---------------------------------------------------------------------
//  GRAND HYATT TAIPEI — cream stepped slab hotel with banded windows
//  and a porte-cochère, north of Songshou Rd facing the 101 block.
// ---------------------------------------------------------------------
function buildGrandHyatt(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const cream = CTX.toon('#e8e0cc'), creamD = CTX.toon('#d6ccb4'), win = CTX.toon('#5a6b74');
  const trim = CTX.toon('#f0e9d8'), glass = CTX.toon('#7fa6b5'), dark = CTX.toon('#3f4b56');
  A(CTX.box(5.3, 0.22, 2.9, creamD, 0, 0.11, 0));                            // base
  const wing = (cx, w, h, y0) => {
    const b = y0 || 0.22;
    A(CTX.box(w, h, 2.3, cream, cx, b + h/2, 0));
    const rows = Math.floor(h / 0.52);
    for (let i = 1; i <= rows; i++) A(CTX.box(w + 0.04, 0.16, 2.2, win, cx, b + i*0.52 - 0.14, 0));
    A(CTX.box(w + 0.08, 0.10, 2.38, trim, cx, b + 0.02 + h, 0));
  };
  wing(0, 2.4, 3.4, 1.42); wing(-2.0, 1.6, 3.4); wing(2.0, 1.6, 3.4);        // centre rises over an open lobby
  // ground-floor lobby shell: back wall + side piers, the front stays open
  A(CTX.box(2.4, 1.2, 0.2, cream, 0, 0.82, -1.05));
  A(CTX.box(0.26, 1.2, 2.3, cream, -1.07, 0.82, 0));
  A(CTX.box(0.26, 1.2, 2.3, cream,  1.07, 0.82, 0));
  const glow = CTX.toon('#f6e7c4', { emissive:'#eccf8e', emissiveIntensity:0.4 });
  const gold = CTX.toon('#c9a44e');
  A(CTX.box(2.1, 0.04, 1.95, trim, 0, 0.24, 0));                             // marble lobby floor
  A(CTX.box(2.2, 1.1, 0.05, glow, 0, 0.79, -0.92));                          // warm lobby wall
  A(CTX.box(1.0, 0.42, 0.32, gold, -0.45, 0.45, -0.55));                     // reception desk
  A(CTX.box(0.3, 0.6, 0.3, creamD, 0.65, 0.52, -0.5));                       // luggage cart nook
  A(CTX.box(0.62, 1.0, 0.1, glass, -0.88, 0.74, 1.12));                      // glazing beside the doors
  A(CTX.box(0.62, 1.0, 0.1, glass,  0.88, 0.74, 1.12));
  A(CTX.box(1.9, 0.14, 1.15, trim, 0, 1.5, 1.7));                            // porte-cochère canopy
  for (const sx of [-0.8, 0.8]) A(CTX.cyl(0.06, 0.07, 1.3, creamD, sx, 0.85, 2.1, 8));
  A(CTX.box(1.1, 0.5, 0.9, creamD, 0, 5.05, -0.4));                          // rooftop plant
  return g;
}

// ---------------------------------------------------------------------
//  BREEZE NAN SHAN — the sleek rounded glass tower east of Taipei 101,
//  teal curtain wall over a low retail podium.
// ---------------------------------------------------------------------
function buildBreezeNanShan(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const glass = CTX.toon('#6fa3ad'), glassHi = CTX.toon('#8dbcc2'), slab = CTX.toon('#c9cdd0');
  const podM = CTX.toon('#d9d4c8'), podGlass = CTX.toon('#46585c'), crown = CTX.toon('#e8eaec');
  A(CTX.box(3.3, 0.18, 2.6, podM, 0, 0.09, 0));                              // podium plinth
  // retail podium as a shell — walk in through the front to the atrium
  A(CTX.box(3.0, 1.15, 0.24, podM, 0, 0.75, -1.03));                         // back
  A(CTX.box(0.24, 1.15, 2.3, podM, -1.38, 0.75, 0));                         // sides
  A(CTX.box(0.24, 1.15, 2.3, podM,  1.38, 0.75, 0));
  A(CTX.box(0.8, 1.15, 0.24, podM, -1.1, 0.75, 1.03));                       // front wings
  A(CTX.box(0.8, 1.15, 0.24, podM,  1.1, 0.75, 1.03));
  const shopGlow = CTX.toon('#eadfc2', { emissive:'#e0c98e', emissiveIntensity:0.4 });
  const shelf = CTX.toon('#b9a274');
  A(CTX.box(2.5, 0.04, 1.9, slab, 0, 0.2, 0));                               // atrium floor
  A(CTX.box(2.6, 0.95, 0.05, shopGlow, 0, 0.68, -0.9));                      // lit shop wall
  A(CTX.cyl(0.42, 0.46, 1.2, podM, 0, 0.78, -0.3, 10));                      // tower core
  A(CTX.box(0.6, 0.5, 0.3, shelf, -0.95, 0.45, -0.35));                      // boutique counters
  A(CTX.box(0.6, 0.5, 0.3, shelf,  0.95, 0.45, -0.35));
  A(CTX.box(0.55, 0.9, 0.1, podGlass, -1.0, 0.66, 1.14));                    // storefront glazing
  A(CTX.box(0.55, 0.9, 0.1, podGlass,  1.0, 0.66, 1.14));
  A(CTX.box(3.1, 0.1, 2.4, slab, 0, 1.38, 0));
  const H = 11.6, R0 = 1.05;                                                 // rounded tower shaft
  const shaft = CTX.cyl(R0, R0 + 0.06, H, glass, 0, 1.43 + H/2, 0, 12);
  shaft.scale.z = 0.82; A(shaft);
  for (let i = 1; i <= 13; i++){                                             // horizontal slab lines
    const ring = CTX.cyl(R0 + 0.045, R0 + 0.045, 0.05, slab, 0, 1.43 + (H * i / 14), 0, 12);
    ring.scale.z = 0.82; A(ring);
  }
  const face = CTX.box(0.7, H * 0.86, 0.06, glassHi, 0, 1.43 + H/2, 0.9);    // brighter front reveal
  A(face);
  const cr = CTX.cyl(0.72, R0, 0.85, crown, 0, 1.43 + H + 0.42, 0, 12);      // tapering crown
  cr.scale.z = 0.82; A(cr);
  A(CTX.cyl(0.5, 0.6, 0.3, slab, 0, 1.43 + H + 1.0, 0, 10));
  return g;
}

// ---------------------------------------------------------------------
//  SHIN KONG MITSUKOSHI XINYI PLACE A11 — boxy department store with the
//  big corner LED billboard and a stone-band facade.
// ---------------------------------------------------------------------
function buildMitsukoshiA11(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const stone = CTX.toon('#cbc2b0'), stoneD = CTX.toon('#b3a993'), glass = CTX.toon('#46585c');
  const led = CTX.toon('#20262c', { emissive:'#3a86ff', emissiveIntensity:0.28 });
  const ledDash = CTX.toon('#ffd166', { emissive:'#ffd166', emissiveIntensity:0.5 });
  const trim = CTX.toon('#e6e0d2'), redM = CTX.toon('#a33434');
  A(CTX.box(3.7, 0.16, 2.8, trim, 0, 0.08, 0));                              // plinth
  A(CTX.box(3.4, 1.56, 2.5, stone, 0, 1.88, 0));                             // upper floors over an open ground hall
  for (const y of [1.24, 1.6, 2.25]) A(CTX.box(3.46, 0.12, 2.56, stoneD, 0, y, 0));
  // ground-floor shell: shop hall behind the vitrines, door in the middle
  A(CTX.box(3.4, 1.1, 0.2, stone, 0, 0.71, -1.15));                          // back
  A(CTX.box(0.2, 1.1, 2.5, stone, -1.6, 0.71, 0));                           // sides
  A(CTX.box(0.2, 1.1, 2.5, stone,  1.6, 0.71, 0));
  A(CTX.box(0.9, 1.1, 0.2, stone, -1.25, 0.71, 1.15));                       // front wings
  A(CTX.box(0.9, 1.1, 0.2, stone,  1.25, 0.71, 1.15));
  const hallGlow = CTX.toon('#f2e6c8', { emissive:'#e6cf93', emissiveIntensity:0.4 });
  const counter = CTX.toon('#8a6b4e');
  A(CTX.box(2.9, 0.04, 2.1, trim, 0, 0.18, 0));                              // polished hall floor
  A(CTX.box(3.0, 0.9, 0.05, hallGlow, 0, 0.63, -1.02));                      // lit cosmetics wall
  A(CTX.box(0.5, 0.45, 1.2, counter, -0.9, 0.4, -0.2));                      // counters
  A(CTX.box(0.5, 0.45, 1.2, counter,  0.9, 0.4, -0.2));
  A(CTX.box(0.7, 0.62, 0.1, glass, -0.85, 0.5, 1.26));                       // street-level vitrines
  A(CTX.box(0.7, 0.62, 0.1, glass,  0.85, 0.5, 1.26));
  A(CTX.box(1.5, 1.15, 0.1, led, -0.75, 1.95, 1.27));                        // LED billboard
  for (let i = 0; i < 3; i++) A(CTX.box(0.9 - i*0.22, 0.07, 0.04, ledDash, -0.75, 1.62 + i*0.34, 1.33));
  A(CTX.box(0.7, 0.3, 0.08, redM, 1.05, 2.35, 1.27));                        // house sign
  A(CTX.box(3.5, 0.14, 2.6, trim, 0, 2.72, 0));                              // parapet
  A(CTX.box(1.2, 0.32, 0.9, stoneD, -0.6, 2.92, -0.5));                      // roof plant
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
  // central atrium floats over an open civic lobby (walk in from the plaza)
  A(CTX.box(2.6, 1.3, 1.5, glass, 0, 1.7, 0)); A(CTX.box(2.8, 0.12, 1.6, frame, 0, 2.35, 0)); panel(2.3, 1.1, 0, 1.70, 0.75);
  A(CTX.box(2.6, 1.05, 0.14, glassD, 0, 0.575, -0.68));                     // lobby back wall
  A(CTX.box(0.5, 1.05, 1.4, glassD, -1.05, 0.575, 0));                      // side stubs
  A(CTX.box(0.5, 1.05, 1.4, glassD,  1.05, 0.575, 0));
  const civGlow = CTX.toon('#eee6cd', { emissive:'#ddc98f', emissiveIntensity:0.35 });
  A(CTX.box(2.2, 0.04, 1.3, plazaM, 0, 0.12, 0));                           // lobby floor
  A(CTX.box(2.3, 0.9, 0.05, civGlow, 0, 0.6, -0.58));                       // lit information wall
  A(CTX.box(0.9, 0.4, 0.3, frame, -0.5, 0.32, -0.15));                      // info desk
  A(CTX.box(0.5, 1.0, 0.1, glassD, -0.78, 0.62, 0.74));                     // door-side glazing
  A(CTX.box(0.5, 1.0, 0.1, glassD,  0.78, 0.62, 0.74));
  A(CTX.box(3.0, 0.12, 0.7, frame, 0, 2.35, 0.9)); A(CTX.box(2.0, 0.14, 0.5, plazaM, 0, 0.10, 0.95));
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

// ---------------------------------------------------------------------
//  XIANGSHAN TRAILHEAD — the stone 象山步道 marker where the street stairs
//  enter the forest: masonry pier with the painted trail panel, a wooden
//  fingerpost, a flower strip and the black-bear greeter cutout.
//  (+Z faces the street; the host runs the stair treads through the middle.)
// ---------------------------------------------------------------------
function xiangshanPanelTexture(T){
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 176;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#edeee2'; cx.fillRect(0, 0, 128, 176);                      // aged plaster
  cx.strokeStyle = '#c9c5b2'; cx.lineWidth = 6; cx.strokeRect(3, 3, 122, 170); // worn border
  // 象山步道 stacked down the right, like the real marker
  cx.fillStyle = '#1f5c46'; cx.font = '700 34px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  ['象', '山', '步', '道'].forEach((ch, i) => cx.fillText(ch, 98, 30 + i * 40));
  // Taipei 101 sketch over a green ridge line
  cx.strokeStyle = '#7c8794'; cx.lineWidth = 4; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(34, 96); cx.lineTo(34, 34); cx.moveTo(46, 96); cx.lineTo(46, 34);
  cx.moveTo(40, 34); cx.lineTo(40, 18); cx.stroke();
  cx.lineWidth = 2.5;
  for (let y = 46; y <= 88; y += 14){ cx.beginPath(); cx.moveTo(31, y); cx.lineTo(49, y); cx.stroke(); }
  cx.strokeStyle = '#3f7d5c'; cx.lineWidth = 5;
  cx.beginPath(); cx.moveTo(8, 108); cx.quadraticCurveTo(34, 88, 56, 104); cx.quadraticCurveTo(72, 114, 84, 106); cx.stroke();
  // little grey elephant under the ridge
  cx.fillStyle = '#6a7178';
  cx.beginPath(); cx.ellipse(42, 142, 20, 13, 0, 0, Math.PI * 2); cx.fill();  // body
  cx.beginPath(); cx.arc(64, 136, 9, 0, Math.PI * 2); cx.fill();              // head
  cx.strokeStyle = '#6a7178'; cx.lineWidth = 4;
  cx.beginPath(); cx.moveTo(71, 138); cx.quadraticCurveTo(78, 146, 74, 154); cx.stroke(); // trunk
  cx.fillRect(30, 150, 6, 10); cx.fillRect(48, 150, 6, 10);                   // legs
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  tex.minFilter = T.LinearFilter; return tex;
}
function buildXiangshanTrailhead(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m); const T = CTX.THREE;
  const stone = CTX.toon('#9a958a'), stoneD = CTX.toon('#87837a'), cap = CTX.toon('#b0aa9c');
  const wood = CTX.toon('#7c5a3e'), woodD = CTX.toon('#5f4630'), soil = CTX.toon('#5a4636');
  // masonry pier left of the steps (as in the photo), coursed blocks + cap
  const px = -1.5;
  A(CTX.box(1.3, 0.18, 0.85, stoneD, px, 0.09, 0));
  for (let r = 0; r < 4; r++){
    const w = 1.16 - r * 0.03;
    A(CTX.box(w, 0.30, 0.66, r % 2 ? stoneD : stone, px + (r % 2 ? 0.02 : -0.02), 0.33 + r * 0.30, 0));
  }
  A(CTX.box(1.24, 0.12, 0.74, cap, px, 1.59, 0));
  // painted 象山步道 panel set into the street face
  const panel = new T.Mesh(new T.PlaneGeometry(0.78, 1.06),
    new T.MeshBasicMaterial({ map: xiangshanPanelTexture(T) }));
  panel.position.set(px, 0.92, 0.345); A(panel);
  // wooden fingerpost right of the steps, boards pointing up the trail
  A(CTX.cyl(0.05, 0.06, 1.9, woodD, 1.3, 0.95, 0, 8));
  const b1 = CTX.box(0.86, 0.2, 0.06, wood, 1.52, 1.66, 0); b1.rotation.y = -0.4; b1.rotation.z = 0.1; A(b1);
  const b2 = CTX.box(0.7, 0.18, 0.06, wood, 1.5, 1.36, 0.03); b2.rotation.y = -0.32; A(b2);
  // flower strip along the street edge
  A(CTX.box(1.1, 0.14, 0.34, soil, 1.65, 0.07, 0.62));
  const petals = ['#e0607a', '#f2cc8f', '#c98bb9', '#e07a5f'];
  for (let i = 0; i < 6; i++){
    const fx = 1.2 + i * 0.18;
    A(CTX.cyl(0.015, 0.02, 0.16, CTX.toon('#4f8f48'), fx, 0.2, 0.62, 5));
    A(CTX.sph(0.055, CTX.toon(petals[i % petals.length]), fx, 0.3, 0.62, 7));
  }
  return g;
}

// ---------------------------------------------------------------------
//  XIANGSHAN LOOKOUT — the wooden viewing deck at the top of the trail
//  (+Z faces Taipei 101) with the giant granite boulders beside it.
//  Deck floor stays thin and near y = 0: the player walks on the terrain.
// ---------------------------------------------------------------------
function buildXiangshanLookout(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const wood = CTX.toon('#8a6243'), woodL = CTX.toon('#9c7350'), woodD = CTX.toon('#5f4630');
  // low plank deck (7 boards over a frame slab)
  A(CTX.box(2.7, 0.06, 2.1, woodD, 0, 0.03, 0));
  for (let i = 0; i < 7; i++) A(CTX.box(0.35, 0.045, 2.02, i % 2 ? wood : woodL, -1.17 + i * 0.39, 0.082, 0));
  // railing on the view side + flanks; open at the back where the stairs arrive
  const postAt = [[-1.28, 0.98], [0, 0.98], [1.28, 0.98], [-1.28, 0.1], [1.28, 0.1], [-1.28, -0.78], [1.28, -0.78]];
  for (const [x, z] of postAt) A(CTX.box(0.09, 0.92, 0.09, woodD, x, 0.5, z));
  A(CTX.box(2.68, 0.08, 0.1, wood, 0, 0.94, 0.98));                           // front top rail
  A(CTX.box(2.68, 0.05, 0.07, wood, 0, 0.56, 0.98));                          // front mid rail
  for (const sx of [-1.28, 1.28]){
    const top = CTX.box(0.1, 0.08, 1.85, wood, sx, 0.94, 0.1); A(top);
    const mid = CTX.box(0.07, 0.05, 1.85, wood, sx, 0.56, 0.1); A(mid);
  }
  // coin-scope on the view rail — everyone lines up the same photo
  A(CTX.cyl(0.035, 0.05, 0.85, CTX.toon('#3a3f47'), 0.75, 0.42, 0.78, 8));
  const scope = CTX.box(0.3, 0.14, 0.2, CTX.toon('#c9cdd1'), 0.75, 0.92, 0.78); scope.rotation.x = -0.25; A(scope);
  return g;
}

// Stage two of the climb — the open summit platform above the wooden deck.
// Concrete pad with the trail's green metal railing, a survey pillar and the
// 象山 stele at the back corners; nothing on the view side blocks the panorama.
function buildXiangshanSummit(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const slab = CTX.toon('#a9a99c'), curb = CTX.toon('#94948a'), rail = CTX.toon('#2e6e52');
  A(CTX.box(2.6, 0.1, 2.0, slab, 0, 0.05, 0));
  // stone skirt sunk into the crest so the pad reads grounded, not floating
  A(CTX.box(2.76, 0.5, 2.16, curb, 0, -0.2, 0));
  // railing on the view side + flanks; open at the back where the stairs arrive
  const postAt = [[-1.24, 0.94], [-0.62, 0.94], [0, 0.94], [0.62, 0.94], [1.24, 0.94], [-1.24, 0.1], [1.24, 0.1], [-1.24, -0.74], [1.24, -0.74]];
  for (const [x, z] of postAt) A(CTX.cyl(0.035, 0.035, 0.82, rail, x, 0.41, z, 6));
  A(CTX.box(2.54, 0.06, 0.06, rail, 0, 0.84, 0.94));
  A(CTX.box(2.54, 0.045, 0.045, rail, 0, 0.5, 0.94));
  for (const sx of [-1.24, 1.24]){
    A(CTX.box(0.06, 0.06, 1.74, rail, sx, 0.84, 0.1));
    A(CTX.box(0.045, 0.045, 1.74, rail, sx, 0.5, 0.1));
  }
  // summit survey pillar + the 象山 stele, tucked at the back corners
  A(CTX.box(0.2, 0.5, 0.2, CTX.toon('#e8e6dd'), -1.02, 0.3, -0.72));
  const stele = CTX.box(0.42, 0.95, 0.16, CTX.toon('#6f6d63'), 1.0, 0.52, -0.7); stele.rotation.y = -0.35; A(stele);
  // wooden bench for the sunrise crowd, against the back edge
  A(CTX.box(0.9, 0.06, 0.3, CTX.toon('#8a6243'), -0.1, 0.42, -0.8));
  for (const bx of [-0.48, 0.28]) A(CTX.box(0.08, 0.36, 0.26, CTX.toon('#5f4630'), bx, 0.23, -0.8));
  return g;
}

export {
  buildTaipei101,
  buildTaipeiDome,
  buildGrandHyatt,
  buildBreezeNanShan,
  buildMitsukoshiA11,
  buildCKSComplex,
  buildGrandHotel,
  buildPalaceMuseum,
  buildLongshanTemple,
  buildBaoanTemple,
  buildPresidentialOffice,
  buildMainStation,
  buildSYSHall,
  buildCityHall,
  buildArena,
  buildFerrisWheel,
  buildXiangshanTrailhead,
  buildXiangshanLookout,
  buildXiangshanSummit,
};
