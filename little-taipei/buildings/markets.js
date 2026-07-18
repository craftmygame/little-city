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

export { buildNightMarket };
