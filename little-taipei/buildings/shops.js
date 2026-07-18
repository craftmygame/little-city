// ---------------------------------------------------------------------
//  TAIPEI SHOPS — small street-corner storefronts that make the city feel
//  lived-in: the convenience stores on every block, a boba stand, a morning
//  breakfast shop. Same local-space contract as the monuments (origin at
//  base-centre on the ground, +Y up, FRONT faces +Z). Most are compact;
//  walk-in stores keep human-scale doors and aisles.
// ---------------------------------------------------------------------

// 7-ELEVEN — a full, walk-in neighbourhood store rather than a display kiosk.
function buildSevenEleven(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const W=4.8, D=4.0, HW=W/2, HD=D/2, wallH=2.55, frontZ=HD;

  // ---- palette (each material once, reused) -------------------------------
  const cream   = CTX.toon('#F4F1E8');
  const creamD  = CTX.toon('#DCD6C6');
  const glass   = CTX.toon('#FFE4A8', { emissive:'#FFC862', emissiveIntensity:0.46 });
  const doorG   = CTX.toon('#BFE2DE', { emissive:'#D8F0EA', emissiveIntensity:0.26 });
  const inGlow  = CTX.toon('#FFE9C2', { emissive:'#FFD98A', emissiveIntensity:0.48 });
  const mull    = CTX.toon('#2B3036');
  const frameM  = CTX.toon('#C6CACE');
  const white   = CTX.toon('#FBFAF4', { emissive:'#FFFFFF', emissiveIntensity:0.15 });
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
  const shelfD  = CTX.toon('#9B8763');
  const tire    = CTX.toon('#1A1A1E');

  // ---- roomy shell, flat floor, and warm interior -------------------------
  A(CTX.box(W, wallH, 0.18, cream, 0, wallH/2, -HD+0.09));
  A(CTX.box(0.18, wallH, D, cream, -HW+0.09, wallH/2, 0));
  A(CTX.box(0.18, wallH, D, cream,  HW-0.09, wallH/2, 0));
  A(CTX.box(W-0.24, 0.06, D-0.24, creamD, 0, 0.03, 0));
  A(CTX.box(W-0.42, 1.82, 0.04, inGlow, 0, 1.04, -HD+0.20));

  // Refrigerators and shelves stay against the walls, leaving two broad aisles.
  A(CTX.box(2.30, 1.66, 0.36, steelM, -0.82, 0.86, -HD+0.38));
  for(const x of [-1.62,-1.08,-0.54,0]){
    A(CTX.box(0.04,1.50,0.03,mull,x,0.88,-HD+0.18));
    A(CTX.box(0.42,0.06,0.03,doorG,x+0.22,1.46,-HD+0.15));
  }
  A(CTX.box(0.38, 1.18, 2.30, shelfM, -HW+0.36, 0.59, -0.22));
  for(const y of [0.28,0.58,0.88,1.16]) A(CTX.box(0.45,0.05,2.30,shelfD,-HW+0.38,y,-0.22));

  // Low centre gondola: products are readable from outside without closing the aisle.
  A(CTX.box(0.62, 0.78, 1.56, shelfM, -0.75, 0.39, -0.36));
  for(const y of [0.22,0.48,0.74]) A(CTX.box(0.78,0.05,1.62,shelfD,-0.75,y,-0.36));
  const productCols=[green,orange,red,binB,white];
  for(let i=0;i<5;i++) for(const z of [-0.84,-0.42,0,0.36])
    A(CTX.box(0.11,0.15,0.16,productCols[i],-1.03+i*0.14,0.85,z));

  // Checkout sits in the back-right corner; the centre line from the door stays clear.
  A(CTX.box(1.42, 0.80, 0.62, shelfM, 1.36, 0.40, -1.22));
  A(CTX.box(1.52, 0.08, 0.70, shelfD, 1.36, 0.84, -1.22));
  A(CTX.box(0.30, 0.30, 0.24, darkM, 1.64, 1.03, -1.18));
  A(CTX.box(0.22, 0.05, 0.18, green, 1.64, 1.20, -1.17));
  A(CTX.cyl(0.08,0.08,0.24,orange,0.95,0.98,-1.17,10));

  // Ceiling light bars make the interior legible once the player is inside.
  for(const x of [-1.25,0,1.25]) A(CTX.box(0.72,0.04,0.18,white,x,2.45,-0.25));

  // ---- storefront: two window bays and a genuinely open 1.3u doorway -----
  for(const x of [-1.53,1.53]) A(CTX.box(1.70,1.64,0.06,glass,x,0.88,frontZ));
  for(const x of [-2.36,-1.53,-0.69,0.69,1.53,2.36]) A(CTX.box(0.05,1.72,0.05,mull,x,0.88,frontZ+0.04));
  for(const x of [-1.53,1.53]){
    A(CTX.box(1.70,0.05,0.04,mull,x,1.34,frontZ+0.05));
    A(CTX.box(1.70,0.10,0.08,frameM,x,0.06,frontZ+0.01));
  }
  A(CTX.box(1.42,0.12,0.10,mull,0,1.72,frontZ+0.03));
  for(const x of [-0.70,0.70]) A(CTX.box(0.06,1.72,0.08,frameM,x,0.86,frontZ+0.03));
  // The auto-door leaves are slid aside, so there is no mesh or collider across the portal.
  for(const x of [-0.97,0.97]){
    A(CTX.box(0.48,1.58,0.04,doorG,x,0.84,frontZ+0.08));
    A(CTX.box(0.04,1.58,0.05,mull,x+(x<0?0.22:-0.22),0.84,frontZ+0.11));
  }
  A(CTX.box(1.30,0.025,0.72,darkM,0,0.013,frontZ+0.30));

  // ---- wraparound signature fascia ---------------------------------------
  A(CTX.box(W+0.10,0.08,0.28,creamD,0,1.82,frontZ+0.10));
  A(CTX.box(W+0.04,0.58,0.10,white,0,2.13,frontZ+0.02));
  for(const [y,mat] of [[2.31,green],[2.13,orange],[1.95,red]]) A(CTX.box(W+0.06,0.12,0.04,mat,0,y,frontZ+0.08));
  for(const sx of [-1,1]){
    A(CTX.box(0.10,0.58,D,white,sx*HW,2.13,0));
    for(const [y,mat] of [[2.31,green],[2.13,orange],[1.95,red]]) A(CTX.box(0.04,0.12,D,mat,sx*(HW+0.06),y,0));
  }

  // ---- flat roof, parapet, and Taipei rooftop machinery ------------------
  A(CTX.box(W,0.08,D,roofM,0,2.55,0));
  A(CTX.box(W+0.12,0.16,0.12,parM,0,2.66, HD-0.06));
  A(CTX.box(W+0.12,0.16,0.12,parM,0,2.66,-HD+0.06));
  for(const sx of [-1,1]) A(CTX.box(0.12,0.16,D,parM,sx*(HW+0.02),2.66,0));
  A(CTX.box(0.62,0.34,0.48,metal,0.82,2.78,-0.18));
  A(CTX.cyl(0.17,0.17,0.04,darkM,0.82,2.96,-0.18,12));
  A(CTX.box(0.46,0.28,0.40,metal,1.45,2.75,-0.82));
  A(CTX.cyl(0.30,0.32,0.54,steelM,-0.86,2.96,-0.78,14));
  const dome=CTX.sph(0.30,steelM,-0.86,3.24,-0.78,12); dome.scale.set(1,0.48,1); A(dome);

  // Projecting blade sign reads down the side street.
  A(CTX.cyl(0.04,0.04,0.48,metal,-2.12,2.88,1.08,8));
  A(CTX.box(0.14,0.58,0.88,white,-2.12,3.20,1.08));
  for(const o of [-0.08,0.08]) for(const [y,mat] of [[3.38,green],[3.20,orange],[3.02,red]])
    A(CTX.box(0.04,0.13,0.88,mat,-2.12+o,y,1.08));

  // ---- street furniture is kept to the window bays, never the doorway ----
  A(CTX.box(0.86,0.54,0.44,creamD,1.64,0.27,2.34));
  A(CTX.box(0.76,0.07,0.36,glass,1.64,0.58,2.34));
  A(CTX.box(0.86,0.11,0.03,red,1.64,0.15,2.57));
  for(const [x,mat] of [[-1.48,binG],[-1.84,binB]]){
    A(CTX.cyl(0.17,0.15,0.50,mat,x,0.25,2.30,10));
    A(CTX.cyl(0.18,0.18,0.06,darkM,x,0.53,2.30,10));
  }
  for(const x of [-2.20,2.20]){
    A(CTX.cyl(0.07,0.085,0.38,bollard,x,0.19,2.22,8));
    A(CTX.cyl(0.072,0.072,0.06,white,x,0.30,2.22,8));
    A(CTX.sph(0.07,bollard,x,0.40,2.22,8));
  }

  // Park the scooter around the right-hand corner instead of across the doors.
  A(CTX.box(0.76,0.18,0.22,binB,2.82,0.31,0.62));
  A(CTX.box(0.30,0.11,0.20,darkM,2.94,0.44,0.62));
  A(CTX.box(0.08,0.46,0.08,darkM,2.50,0.53,0.62));
  A(CTX.box(0.08,0.06,0.38,darkM,2.50,0.74,0.62));
  A(CTX.cyl(0.06,0.06,0.05,white,2.46,0.55,0.62,8));
  for(const x of [2.50,3.15]){ const w=CTX.cyl(0.15,0.15,0.08,tire,x,0.15,0.62,12); w.rotation.x=Math.PI/2; A(w); }

  return g;
}

// FAMILYMART (全家) — a full walk-in store with its familiar eat-in counter.
function buildFamilyMart(CTX){
  const g = CTX.group(); const A = m => (g.add(m), m);
  const W=4.8, D=4.0, HW=W/2, HD=D/2, wallH=2.55, frontZ=HD;

  // ---- palette ------------------------------------------------------------
  const wallM      = CTX.toon('#F4F1E8');
  const wallDM     = CTX.toon('#D7D2C5');
  const glassM     = CTX.toon('#FFD98F', { emissive:'#FFC25A', emissiveIntensity:0.46 });
  const doorGlassM = CTX.toon('#BFE6E6', { emissive:'#D6F0F0', emissiveIntensity:0.3 });
  const interiorM  = CTX.toon('#FFF0C8', { emissive:'#FFD788', emissiveIntensity:0.42 });
  const mullionM   = CTX.toon('#33373B');
  const greenM     = CTX.toon('#19A64A', { emissive:'#13A043', emissiveIntensity:0.6 });
  const blueM      = CTX.toon('#0C63B6', { emissive:'#0A5BAC', emissiveIntensity:0.6 });
  const signWhiteM = CTX.toon('#FCFBF6', { emissive:'#FFFFFF', emissiveIntensity:0.14 });
  const metalM     = CTX.toon('#9097A0');
  const tankM      = CTX.toon('#C7CCD2');
  const baseTrimM  = CTX.toon('#565B60');
  const counterM   = CTX.toon('#CBAE80');
  const shelfM     = CTX.toon('#DDD1B5');
  const shelfDM    = CTX.toon('#9D8965');
  const stoolM     = CTX.toon('#D44A3B');

  // ---- roomy shell and thin walkable floor -------------------------------
  A(CTX.box(W,wallH,0.18,wallM,0,wallH/2,-HD+0.09));
  A(CTX.box(0.18,wallH,D,wallM,-HW+0.09,wallH/2,0));
  A(CTX.box(0.18,wallH,D,wallM, HW-0.09,wallH/2,0));
  A(CTX.box(W-0.24,0.06,D-0.24,wallDM,0,0.03,0));
  A(CTX.box(W-0.42,1.82,0.04,interiorM,0,1.04,-HD+0.20));

  // Chillers, grocery shelving, and a checkout frame two broad interior aisles.
  A(CTX.box(2.34,1.66,0.36,tankM,-0.78,0.86,-HD+0.38));
  for(const x of [-1.58,-1.04,-0.50,0.04]){
    A(CTX.box(0.04,1.50,0.03,mullionM,x,0.88,-HD+0.18));
    A(CTX.box(0.42,0.06,0.03,doorGlassM,x+0.22,1.46,-HD+0.15));
  }
  A(CTX.box(0.38,1.16,2.16,shelfM,HW-0.36,0.58,-0.30));
  for(const y of [0.28,0.57,0.86,1.14]) A(CTX.box(0.45,0.05,2.16,shelfDM,HW-0.38,y,-0.30));
  A(CTX.box(0.62,0.78,1.56,shelfM,0.72,0.39,-0.34));
  for(const y of [0.22,0.48,0.74]) A(CTX.box(0.78,0.05,1.62,shelfDM,0.72,y,-0.34));
  for(let i=0;i<5;i++) for(const z of [-0.82,-0.40,0.02,0.38])
    A(CTX.box(0.11,0.15,0.16,[greenM,blueM,stoolM,signWhiteM,counterM][i],0.44+i*0.14,0.85,z));

  // Checkout in the rear-left keeps the doorway sightline and right aisle clear.
  A(CTX.box(1.42,0.80,0.62,counterM,-1.34,0.40,-1.20));
  A(CTX.box(1.52,0.08,0.70,shelfDM,-1.34,0.84,-1.20));
  A(CTX.box(0.30,0.30,0.24,mullionM,-1.62,1.03,-1.16));
  A(CTX.box(0.22,0.05,0.18,greenM,-1.62,1.20,-1.15));
  for(const x of [-1.25,0,1.25]) A(CTX.box(0.72,0.04,0.18,signWhiteM,x,2.45,-0.25));

  // ---- front windows and a visibly open automatic doorway ----------------
  for(const x of [-1.53,1.53]) A(CTX.box(1.70,1.64,0.06,glassM,x,0.88,frontZ));
  for(const x of [-2.36,-1.53,-0.69,0.69,1.53,2.36]) A(CTX.box(0.05,1.72,0.05,mullionM,x,0.88,frontZ+0.04));
  for(const x of [-1.53,1.53]){
    A(CTX.box(1.70,0.05,0.04,mullionM,x,1.34,frontZ+0.05));
    A(CTX.box(1.70,0.10,0.08,baseTrimM,x,0.06,frontZ+0.01));
  }
  A(CTX.box(1.42,0.12,0.10,mullionM,0,1.72,frontZ+0.03));
  for(const x of [-0.70,0.70]) A(CTX.box(0.06,1.72,0.08,metalM,x,0.86,frontZ+0.03));
  for(const x of [-0.97,0.97]){
    A(CTX.box(0.48,1.58,0.04,doorGlassM,x,0.84,frontZ+0.08));
    A(CTX.box(0.04,1.58,0.05,mullionM,x+(x<0?0.22:-0.22),0.84,frontZ+0.11));
  }
  A(CTX.box(1.30,0.025,0.72,baseTrimM,0,0.013,frontZ+0.30));

  // ---- wraparound FamilyMart fascia --------------------------------------
  A(CTX.box(W+0.10,0.08,0.28,wallDM,0,1.82,frontZ+0.10));
  A(CTX.box(W+0.04,0.58,0.10,signWhiteM,0,2.13,frontZ+0.02));
  A(CTX.box(W+0.06,0.14,0.04,greenM,0,2.31,frontZ+0.08));
  A(CTX.box(W+0.06,0.14,0.04,blueM,0,1.95,frontZ+0.08));
  for(const sx of [-1,1]){
    A(CTX.box(0.10,0.58,D,signWhiteM,sx*HW,2.13,0));
    A(CTX.box(0.04,0.14,D,greenM,sx*(HW+0.06),2.31,0));
    A(CTX.box(0.04,0.14,D,blueM,sx*(HW+0.06),1.95,0));
  }

  // ---- roof equipment and projecting street sign ------------------------
  A(CTX.box(W,0.08,D,wallDM,0,2.55,0));
  A(CTX.box(W+0.12,0.16,0.12,wallDM,0,2.66, HD-0.06));
  A(CTX.box(W+0.12,0.16,0.12,wallDM,0,2.66,-HD+0.06));
  for(const sx of [-1,1]) A(CTX.box(0.12,0.16,D,wallDM,sx*(HW+0.02),2.66,0));
  A(CTX.box(0.62,0.34,0.48,metalM,-0.82,2.78,-0.20));
  A(CTX.cyl(0.17,0.17,0.04,baseTrimM,-0.82,2.96,-0.20,12));
  A(CTX.box(0.46,0.28,0.40,metalM,-1.45,2.75,-0.84));
  for(const dx of [-0.18,0.18]) for(const dz of [-0.18,0.18])
    A(CTX.cyl(0.03,0.03,0.18,metalM,0.88+dx,2.72,-0.78+dz,8));
  A(CTX.cyl(0.30,0.32,0.54,tankM,0.88,3.02,-0.78,14));
  A(CTX.cyl(0.22,0.30,0.09,tankM,0.88,3.33,-0.78,14));
  A(CTX.cyl(0.04,0.04,0.48,metalM,2.10,2.88,1.08,8));
  A(CTX.box(0.14,0.62,0.90,signWhiteM,2.10,3.20,1.08));
  for(const o of [-0.08,0.08]){
    A(CTX.box(0.04,0.15,0.90,greenM,2.10+o,3.37,1.08));
    A(CTX.box(0.04,0.15,0.90,blueM,2.10+o,3.03,1.08));
  }

  // ---- eat-in counter remains part of FamilyMart, now inside the window ---
  A(CTX.box(1.30,0.06,0.36,counterM,-1.45,0.84,1.42));
  for(const x of [-1.92,-1.45,-0.98]){
    A(CTX.cyl(0.05,0.06,0.60,metalM,x,0.31,0.94,10));
    A(CTX.cyl(0.14,0.14,0.06,stoolM,x,0.64,0.94,12));
  }

  // Exterior bins sit under the left window; the doorway and approach stay open.
  for(const [x,mat] of [[-1.50,greenM],[-1.84,blueM]]){
    A(CTX.box(0.26,0.44,0.26,metalM,x,0.22,2.30));
    A(CTX.box(0.29,0.06,0.29,mat,x,0.47,2.30));
  }

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

export { buildSevenEleven, buildFamilyMart, buildBobaShop, buildBreakfastShop };
