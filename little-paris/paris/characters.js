// =====================================================================
//  paris/characters.js — NPC name/parcel pools, accessory decorator,
//  and a handful of charming STATIC Parisian street characters.
//
//  Builds against the shared `ctx` (see CONTEXT_API.md). Only THREE is
//  imported directly; everything else (toon/faceted/placeOnSurface/…)
//  comes off ctx. No await/fetch/CDN.
// =====================================================================
import * as THREE from 'three';

// ---------------------------------------------------------------------
//  POOLS  — consumed by the engine's quest system.
// ---------------------------------------------------------------------
export const NPC_NAMES = [
  'Amélie','Louis','Camille','Hugo','Margaux','Théo','Colette','Gaspard',
  'Élise','Antoine','Manon','Léon','Juliette','Rémi','Sylvie','Bruno',
  'Odette','Vincent','Brigitte','Pascal',
];

export const PARCELS = [
  'a fresh baguette','a box of macarons','a love letter','a wheel of brie',
  'a bottle of Bordeaux','a croissant','a bouquet of roses','a small painting',
  'a beret','a wedge of camembert','an éclair','an espresso','a vintage book',
  'a music box','a postcard from Montmartre','a tin of escargot',
  'a jar of Dijon mustard','a crêpe',
];

// ---------------------------------------------------------------------
//  small mesh helper
// ---------------------------------------------------------------------
function mesh(geo, mat){
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------
//  decorateNPC(ctx, group, opt) — add ONE cheap Parisian accessory.
//  Accessories parent to group.userData.parts.{head|torso|armR}; their
//  positions are LOCAL to that part. Fully guarded: never throws if a
//  part is missing.
// ---------------------------------------------------------------------
export function decorateNPC(ctx, group, opt = {}){
  try {
    const parts = group && group.userData && group.userData.parts;
    if(!parts) return null;
    const toon = ctx.toon, faceted = ctx.faceted, pick = ctx.pick;
    const { head, torso, armR } = parts;
    const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
      if(!parent) return null;
      const m = mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
    };

    const kind = opt.kind || pick(['beret','beret','flatcap','baguette','scarf','breton']);

    if(kind === 'beret' && head){
      const col = opt.color || pick(['#28324f','#9c2b2b','#22201f','#243b2e']);
      const m = toon(col), mD = toon(new THREE.Color(col).multiplyScalar(0.8));
      const b = new THREE.Group(); b.position.set(0, 0.50, -0.02);
      b.rotation.x = -0.12; b.rotation.z = 0.16; head.add(b);
      add(b, faceted(new THREE.CylinderGeometry(0.50, 0.44, 0.13, 16)), m, 0, 0.02, 0)
        .scale.set(1, 1, 1);
      add(b, faceted(new THREE.SphereGeometry(0.035, 8, 6)), mD, 0, 0.11, 0); // the cabillou stalk
      return b;
    }

    if(kind === 'flatcap' && head){
      const col = opt.color || pick(['#7a6a4f','#5a5750','#6a513a','#4a5560']);
      const m = toon(col), mD = toon(new THREE.Color(col).multiplyScalar(0.82));
      const c = new THREE.Group(); c.position.set(0, 0.40, -0.02); c.rotation.x = -0.08; head.add(c);
      const dome = add(c, faceted(new THREE.SphereGeometry(0.49, 14, 8, 0, Math.PI*2, 0, Math.PI*0.55)), m, 0, 0.02, 0);
      dome.scale.set(1.0, 0.62, 1.0);
      const bill = add(c, faceted(new THREE.CylinderGeometry(0.30, 0.30, 0.04, 14, 1, false, 0, Math.PI)), mD, 0, -0.01, 0.30);
      bill.rotation.x = 0.16; bill.scale.set(1.0, 1.0, 1.35);
      add(c, faceted(new THREE.SphereGeometry(0.03, 6, 5)), mD, 0, 0.11, 0);
      return c;
    }

    if(kind === 'baguette' && armR){
      const tan = toon('#d7a85e'), crust = toon('#b07e3c'), paper = toon('#efe9da');
      const b = new THREE.Group(); b.position.set(-0.04, -0.12, 0.06);
      b.rotation.x = 1.15; b.rotation.z = 0.12; armR.add(b);   // tucked under, tipped up-front
      add(b, faceted(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8)), tan, 0, 0, 0);
      add(b, faceted(new THREE.SphereGeometry(0.06, 8, 6)), crust, 0, 0.31, 0).scale.set(1, 0.7, 1);
      add(b, faceted(new THREE.SphereGeometry(0.06, 8, 6)), crust, 0, -0.31, 0).scale.set(1, 0.7, 1);
      add(b, faceted(new THREE.CylinderGeometry(0.063, 0.063, 0.16, 10)), paper, 0, -0.05, 0); // bakery wrap
      return b;
    }

    if(kind === 'scarf' && torso){
      const col = opt.color || pick(['#a83b3b','#3a5a8a','#d0a83a','#5e7a4a','#7a4a86']);
      const m = toon(col), mD = toon(new THREE.Color(col).multiplyScalar(0.82));
      const s = new THREE.Group(); s.position.set(0, 0.58, 0); torso.add(s);
      const loop = add(s, faceted(new THREE.TorusGeometry(0.19, 0.07, 8, 16)), m, 0, 0, 0);
      loop.rotation.x = Math.PI/2; loop.scale.set(1.06, 1.0, 0.85);
      add(s, faceted(new THREE.SphereGeometry(0.085, 8, 6)), m, 0.04, -0.04, 0.16); // knot
      const tail = add(s, faceted(new THREE.BoxGeometry(0.12, 0.34, 0.05)), mD, 0.06, -0.24, 0.16);
      tail.rotation.z = 0.12; tail.rotation.x = -0.1;
      return s;
    }

    if(kind === 'breton' && torso){
      const m = toon(opt.color || '#26324f');
      const g = new THREE.Group(); torso.add(g);
      for(const y of [0.18, 0.30, 0.42]){
        const ring = add(g, faceted(new THREE.TorusGeometry(0.40, 0.022, 6, 18)), m, 0, y, 0);
        ring.rotation.x = Math.PI/2; ring.scale.set(1.04, 1.0, 0.86);
      }
      return g;
    }
    return null;
  } catch(e){ /* never break the caller */ return null; }
}

// ---------------------------------------------------------------------
//  prop makers (small separate groups; base at y=0, +Y up, +Z front)
// ---------------------------------------------------------------------
function makeEasel(ctx){
  const toon = ctx.toon, faceted = ctx.faceted;
  const g = new THREE.Group();
  const wood = toon('#8a6a44'), woodD = toon('#6e5436');
  const legGeo = faceted(new THREE.CylinderGeometry(0.028, 0.038, 1.0, 6));
  const apex = new THREE.Vector3(0, 1.34, 0);
  const up = new THREE.Vector3(0, 1, 0);
  for(const [bx, bz] of [[-0.30, 0.18], [0.30, 0.18], [0.0, -0.42]]){
    const bottom = new THREE.Vector3(bx, 0, bz);
    const dir = apex.clone().sub(bottom);
    const len = dir.length(); dir.normalize();
    const leg = mesh(legGeo, wood);
    leg.position.copy(bottom).add(apex).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(up, dir);
    leg.scale.y = len;             // base geom is 1.0 tall
    g.add(leg);
  }
  const frame = mesh(faceted(new THREE.BoxGeometry(0.98, 0.78, 0.03)), woodD);
  frame.position.set(0, 1.0, 0.10); frame.rotation.x = 0.12; g.add(frame);
  const canvas = mesh(faceted(new THREE.BoxGeometry(0.86, 0.66, 0.04)), toon('#f3ede1'));
  canvas.position.set(0, 1.0, 0.12); canvas.rotation.x = 0.12; g.add(canvas);
  // a few painted dabs so it reads as a little artwork
  const dab1 = mesh(new THREE.BoxGeometry(0.5, 0.22, 0.01), toon('#7aa6d6'));
  dab1.position.set(-0.04, 1.06, 0.145); dab1.rotation.x = 0.12; g.add(dab1);
  const dab2 = mesh(new THREE.BoxGeometry(0.42, 0.16, 0.01), toon('#e0a24a'));
  dab2.position.set(0.06, 0.92, 0.146); dab2.rotation.x = 0.12; g.add(dab2);
  const shelf = mesh(faceted(new THREE.BoxGeometry(0.7, 0.05, 0.12)), woodD);
  shelf.position.set(0, 0.62, 0.16); g.add(shelf);
  return g;
}

function makeAccordion(ctx){
  const toon = ctx.toon, faceted = ctx.faceted;
  const g = new THREE.Group();
  const black = toon('#2a2a30'), red = toon('#9c2b2b'), redD = toon('#7a2020');
  const white = toon('#f2efe6');
  // two end boxes
  for(const sx of [-1, 1]){
    const end = mesh(faceted(new THREE.BoxGeometry(0.11, 0.30, 0.22)), black);
    end.position.set(sx * 0.20, 0, 0); g.add(end);
  }
  // keys on the right end
  for(let i = 0; i < 4; i++){
    const k = mesh(new THREE.BoxGeometry(0.03, 0.045, 0.04), white);
    k.position.set(0.20, 0.10 - i * 0.055, 0.12); g.add(k);
  }
  // bellows
  const bellows = mesh(faceted(new THREE.BoxGeometry(0.29, 0.26, 0.18)), red);
  bellows.position.set(0, 0, 0); g.add(bellows);
  for(let i = 0; i < 3; i++){
    const pleat = mesh(new THREE.BoxGeometry(0.30, 0.26, 0.02), redD);
    pleat.position.set(-0.08 + i * 0.08, 0, 0.10); g.add(pleat);
  }
  return g;
}

function makeFlowerCart(ctx){
  const toon = ctx.toon, faceted = ctx.faceted, pick = ctx.pick;
  const g = new THREE.Group();
  const wood = toon('#9c6b3f'), woodD = toon('#7a4f2c'), metal = toon('#4a4f55');
  const M = (geo, mat, x, y, z) => { const m = mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  M(faceted(new THREE.BoxGeometry(1.0, 0.30, 0.6)), wood, 0, 0.56, 0);          // tray
  const board = M(faceted(new THREE.BoxGeometry(1.0, 0.48, 0.05)), woodD, 0, 0.82, -0.28); board.rotation.x = -0.5;
  M(faceted(new THREE.BoxGeometry(0.09, 0.42, 0.09)), woodD, -0.42, 0.2, 0.2);   // legs
  M(faceted(new THREE.BoxGeometry(0.09, 0.42, 0.09)), woodD, 0.42, 0.2, 0.2);
  const wheelGeo = faceted(new THREE.CylinderGeometry(0.26, 0.26, 0.07, 14));
  for(const sx of [-1, 1]){
    const w = M(wheelGeo, metal, sx * 0.56, 0.26, 0.08); w.rotation.z = Math.PI/2;
    const hub = M(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 8), woodD, sx * 0.56, 0.26, 0.08); hub.rotation.z = Math.PI/2;
  }
  const bloomCols = ['#e0584a','#f0a868','#ef9bb3','#d8b24a','#b79ad6','#ffffff','#e8746b'];
  const stem = toon('#5e9a46');
  for(let i = 0; i < 5; i++){
    const x = -0.36 + i * 0.18, z = 0.06 + (i % 2) * 0.08;
    M(faceted(new THREE.CylinderGeometry(0.075, 0.05, 0.18, 8)), metal, x, 0.78, z);   // bucket
    M(faceted(new THREE.SphereGeometry(0.05, 6, 5)), stem, x, 0.86, z);                // greenery
    for(let b = 0; b < 3; b++){
      M(faceted(new THREE.SphereGeometry(0.052, 7, 6)), toon(pick(bloomCols)),
        x + (b - 1) * 0.05, 0.96 + (b % 2) * 0.045, z + (b - 1) * 0.02);
    }
  }
  return g;
}

// ---------------------------------------------------------------------
//  build(ctx) — scatter ~5 decorative Parisian characters around town.
//  These are NOT pushed into ctx.npcs (purely scenery).
// ---------------------------------------------------------------------
export function build(ctx){
  const { makeCharacter, placeOnSurface, planetGroup, parisToDir, rand, pick } = ctx;
  const SKINS = ['#ffd9b3','#f7c79a','#eab38a','#d39c73','#b87a4f','#8a5a37'];

  // place a finished scene-group (character + props) and reserve its spot
  const drop = (g, e, n, spin, label, rad) => {
    const dir = parisToDir(e, n);
    placeOnSurface(g, dir, 0, spin);
    planetGroup.add(g);
    if(label && ctx.makeLabel){ const t = ctx.makeLabel(label); t.position.y = 2.8; g.add(t); }
    try { ctx.addBlobShadow && ctx.addBlobShadow(g, 0.5); } catch(e2){}
    try { ctx.claim && ctx.claim(dir, rad); } catch(e2){}
    try { ctx.addCollider && ctx.addCollider(dir, rad * 0.7); } catch(e2){}
  };

  // 1) Montmartre street ARTIST behind a little easel ----------------
  try {
    const scene = new THREE.Group();
    const a = makeCharacter({ shirt: '#dfd8cc', pants: '#5a5750', cap: false, skin: pick(SKINS) });
    decorateNPC(ctx, a, { kind: 'beret', color: '#22201f' });
    const p = a.userData.parts;
    if(p){ p.armR.rotation.x = -0.85; p.armR.rotation.z = 0.18; p.armL.rotation.x = -0.4; }
    scene.add(a);
    const easel = makeEasel(ctx); easel.position.set(0.05, 0, 0.72); scene.add(easel);
    drop(scene, -600, 3640, Math.PI * 0.9, 'Artiste', 0.85);
  } catch(e){ console.error('[characters] artist', e); }

  // 2) ACCORDION player by the Seine ---------------------------------
  try {
    const scene = new THREE.Group();
    const a = makeCharacter({ shirt: '#7d2f3a', pants: '#3f4a5c', cap: false, skin: pick(SKINS) });
    decorateNPC(ctx, a, { kind: 'flatcap', color: '#3a3a40' });
    const p = a.userData.parts;
    if(p){ p.armL.rotation.x = -1.05; p.armR.rotation.x = -1.05; p.armL.rotation.z = 0.25; p.armR.rotation.z = -0.25; }
    const acc = makeAccordion(ctx);
    acc.position.set(0, 1.06, 0.46); acc.rotation.x = 0.12;
    if(p && p.torso) p.torso.add(acc); else scene.add(acc);
    scene.add(a);
    drop(scene, -1430, 990, Math.PI * 0.15, 'Musicien', 0.55);   // right-bank quay by the Tuileries
  } catch(e){ console.error('[characters] accordionist', e); }

  // 3) FLOWER SELLER with a cart near a plaza ------------------------
  try {
    const scene = new THREE.Group();
    const a = makeCharacter({ shirt: '#6fb0c9', pants: '#4a5a52', cap: false, skin: pick(SKINS) });
    decorateNPC(ctx, a, { kind: 'scarf', color: '#a83b3b' });
    scene.add(a);
    const cart = makeFlowerCart(ctx); cart.position.set(0, 0, 0.78); scene.add(cart);
    drop(scene, -1850, 1640, -Math.PI * 0.35, 'Fleuriste', 0.95);
  } catch(e){ console.error('[characters] flowerseller', e); }

  // 4) MIME on the Louvre plaza --------------------------------------
  try {
    const scene = new THREE.Group();
    const a = makeCharacter({ shirt: '#f2f2f2', pants: '#26262a', cap: false, skin: '#ffe7cf' });
    decorateNPC(ctx, a, { kind: 'breton', color: '#26262a' });
    decorateNPC(ctx, a, { kind: 'beret', color: '#22201f' });
    const p = a.userData.parts;
    if(p){ p.armL.rotation.x = -1.45; p.armR.rotation.x = -1.45; p.armL.rotation.z = 0.2; p.armR.rotation.z = -0.2; }
    scene.add(a);
    drop(scene, -820, 800, Math.PI * 0.5, 'Mime', 0.55);
  } catch(e){ console.error('[characters] mime', e); }

  // 5) a flâneur with a baguette in the Latin Quarter ----------------
  try {
    const scene = new THREE.Group();
    const a = makeCharacter({ shirt: '#7d8fd6', pants: '#7a6a58', cap: false, skin: pick(SKINS) });
    decorateNPC(ctx, a, { kind: 'baguette' });
    const p = a.userData.parts;
    if(p) p.armR.rotation.z = 0.22;   // clamp the loaf to the side
    scene.add(a);
    drop(scene, -330, -700, rand(0, Math.PI * 2), 'Monsieur', 0.5);
  } catch(e){ console.error('[characters] flaneur', e); }
}
