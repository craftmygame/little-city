// character.js — Little Taipei runner kids: the look AND the motion, in one file.
//
// Style target: flat cel-shaded street kids — big soft mop of hair, tiny dark
// eyes, oversized tee, baggy cropped shorts, white socks, chunky sneakers.
// (Inspired by hand-drawn Taipei street illustration: minimal faces, fluffy hair.)
//
// Authoring rules:
//   - base at y = 0, +Y up, character faces +Z
//   - source rig is ~2.4u tall; main.js scales by CHARACTER_VISUAL_SCALE
//   - facial features are solved AGAINST the skull ellipsoid (facePoint below),
//     so eyes/mouth always sit flush on the face — never floating in front of it.
//
// Exports: palettes, makeCharacter(opt), createCharacterAnimator(char, opt).

import * as THREE from 'three';
import { ACCESSORIES } from './accessories.js';

/* ---------------- palettes (muted street-wear tones) ---------------- */
export const SKIN   = ['#ffd9b3', '#f7c79a', '#eab38a', '#d39c73', '#b87a4f', '#8a5a37'];
export const HAIRC  = ['#2b2523', '#1f2126', '#3a2a1d', '#4a3423', '#5c4030', '#8a6a45', '#d9d2c7'];
export const SHIRTS = ['#c9433e', '#3f9bd8', '#f2eee3', '#e9c06a', '#7fb069', '#b79ad6', '#ef9bb3', '#5a7fa0'];
export const PANTSC = ['#33363b', '#b3a284', '#5c6b80', '#4a5a52', '#8a6243', '#615b72'];
export const CAPS   = ['#b56a63', '#5a7fa0', '#6a9678', '#c2a05a', '#8a7fb0', '#4a5160'];
export const HAIRSTYLES = ['fluffy', 'wavy', 'bob', 'short', 'mohawk-classic', 'mohawk-radial-five', 'mohawk-radial-extended'];
export const CHARACTER_VISUAL_SCALE = 0.72;   // 2.42u source rig → ~1.75u human ruler

/* ---------------- toon material helpers (self-contained) ------------- */
function toonGradient(steps){
  const data = new Uint8Array(steps);
  for(let i=0;i<steps;i++) data[i] = Math.min(255, Math.round(60 + (i/(steps-1))*195));
  const t = new THREE.DataTexture(data, steps,1, THREE.RedFormat);
  t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t;
}
const GRAD = toonGradient(4);
const GRAD_SOFT = toonGradient(7);   // gentler banding — anime skin wants soft shading
function toon(color, opts={}){
  return new THREE.MeshToonMaterial(Object.assign({ color:new THREE.Color(color), gradientMap:GRAD }, opts));
}
function toonSoft(color){ return new THREE.MeshToonMaterial({ color:new THREE.Color(color), gradientMap:GRAD_SOFT }); }
function faceted(geo){ const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; }
function shade(color, f){ return '#'+new THREE.Color(color).multiplyScalar(f).getHexString(); }

/* ---------------- manga eyes: hand-drawn decals, not geometry ----------
   Drawn once on canvas and shrink-wrapped onto a thin shell that follows
   the skull, so nothing pokes out of the silhouette in profile — the eye
   curves with the head like it's painted on. Three expressions, swapped
   by the animator for a cozy face: open / blink / happy (^ ^). */
const _eyeTexCache={};
export function mangaEyeTexture(style,mirror){
  const key=style+(mirror?'L':'R');
  if(_eyeTexCache[key]) return _eyeTexCache[key];
  const cv=document.createElement('canvas'); cv.width=96; cv.height=128; const cx=cv.getContext('2d');
  if(mirror){ cx.translate(96,0); cx.scale(-1,1); }
  if(style==='blink'){
    cx.strokeStyle='#221b18'; cx.lineWidth=10; cx.lineCap='round';
    cx.beginPath(); cx.arc(48,52,27,Math.PI*0.18,Math.PI*0.82); cx.stroke();   // soft lowered lid
  } else if(style==='happy'){
    cx.strokeStyle='#221b18'; cx.lineWidth=10; cx.lineCap='round';
    cx.beginPath(); cx.arc(48,92,26,Math.PI*1.15,Math.PI*1.85); cx.stroke();   // ^ ^ squint
  } else {
    cx.fillStyle='#221b18';
    cx.beginPath(); cx.ellipse(48,72,29,44,0,0,Math.PI*2); cx.fill();          // eye body
    cx.beginPath(); cx.ellipse(48,44,34,18,0,Math.PI,0); cx.fill();            // upper lash cap
    cx.fillStyle='#ffffff';
    cx.beginPath(); cx.ellipse(35,50,12,15,-0.15,0,Math.PI*2); cx.fill();      // big catch-light (inner-top)
    cx.beginPath(); cx.ellipse(60,96,7,8,0,0,Math.PI*2); cx.fill();            // small sparkle (outer-bottom)
  }
  const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  _eyeTexCache[key]=tex; return tex;
}
function mangaEyeMaterial(mirror){
  return new THREE.MeshBasicMaterial({ map:mangaEyeTexture('open',mirror), transparent:true, alphaTest:0.1 });
}

/* ================================================================== *
 *  CHARACTER FACTORY
 * ================================================================== */
export function makeCharacter(opt = {}){
  const rng   = opt.rng || Math.random;
  const pk    = (arr)=> arr[Math.floor(rng()*arr.length)];
  const skin  = opt.skin  || pk(SKIN);
  const hairC = opt.hair  || pk(HAIRC);
  const shirt = opt.shirt || pk(SHIRTS);
  const pants = opt.pants || pk(PANTSC);
  const hairStyle = (typeof opt.hairStyle==='string') ? opt.hairStyle : pk(HAIRSTYLES);
  const capC  = (typeof opt.cap === 'string') ? opt.cap : pk(CAPS);
  const wantCap = opt.cap !== false && opt.cap !== undefined;
  const phones = !!opt.headphones;
  const shoeDark = opt.shoe ? opt.shoe==='dark' : rng()<0.5;
  const raglan = (opt.raglan!==undefined) ? !!opt.raglan : rng()<0.45;   // cream shoulders + sleeves

  const mSkin=toonSoft(skin), mShirt=toon(shirt), mShirtDk=toon(shade(shirt,0.85)), mPants=toon(pants), mPantsDk=toon(shade(pants,0.85));
  const mHair=toon(hairC), mCollar=toon('#f2ecdf');
  const mShoe = toon(shoeDark ? '#2e3033' : '#f2efe6');
  const mSole = toon(shoeDark ? '#e8e4d8' : '#3a3d40');
  const mSock=toon('#f5f2e8'), mMouth=toon('#7c4a41'), mNose=toonSoft(shade(skin,0.94));

  const add=(parent,geo,mat,x=0,y=0,z=0)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m; };

  const g=new THREE.Group();
  // physics/presentation root stays rigid — everything expressive lives under motionRoot
  const motionRoot=new THREE.Group(); g.add(motionRoot);
  const pelvis=new THREE.Group(); pelvis.position.y=1.16; motionRoot.add(pelvis);
  const torso=new THREE.Group(); pelvis.add(torso);

  /* ---- oversized tee: boxy, drapes over the shorts ----
     raglan option: shoulders (chest lid) + sleeves in cream, body in shirt colour,
     like the video kid's white-shouldered blue tee */
  const mYoke = raglan ? toon('#f2eee3') : mShirt;
  const tee=add(torso,faceted(new THREE.CylinderGeometry(0.295,0.35,0.60,14)),mShirt,0,0.29,0); tee.scale.z=0.78;
  const chest=add(torso,new THREE.SphereGeometry(0.30,18,13),mYoke,0,0.55,0); chest.scale.set(1.03,0.48,0.75);
  const hem=add(torso,faceted(new THREE.CylinderGeometry(0.352,0.348,0.06,14)),mShirtDk,0,0.005,0); hem.scale.z=0.78;
  const collar=add(torso,faceted(new THREE.TorusGeometry(0.115,0.032,8,16)),mCollar,0,0.635,0.0); collar.rotation.x=Math.PI/2; collar.scale.set(1.0,0.84,0.72);

  /* ---- neck + head ---- */
  const neck=new THREE.Group(); neck.position.y=0.70; torso.add(neck);
  add(neck,faceted(new THREE.CylinderGeometry(0.085,0.10,0.14,10)),mSkin,0,0.02,0);
  const head=new THREE.Group(); head.position.y=0.105; head.scale.setScalar(0.62); neck.add(head);

  // skull ellipsoid — soft anime child face: SMOOTH shading (no facets on skin)
  const skull=add(head,new THREE.SphereGeometry(0.46,26,20),mSkin,0,0.20,0); skull.scale.set(0.95,0.95,0.93);
  const jaw=add(head,new THREE.SphereGeometry(0.30,20,14),mSkin,0,0.015,0.02); jaw.scale.set(1.0,0.72,0.88);
  for(const sx of [-1,1]){ const ear=add(head,new THREE.SphereGeometry(0.06,10,8),mSkin,sx*0.42,0.145,0.06); ear.scale.set(0.45,0.85,0.7); }

  /* ---- face: every feature is solved onto the skull surface ---- */
  // skull ellipsoid: center (0, 0.20, 0), radii = 0.46 * skull scale
  const FR={x:0.46*0.95, y:0.46*0.95, z:0.46*0.93}, FCY=0.20;   // must track skull.scale
  const facePoint=(x,y,inset)=>{                     // z on the skull surface at (x, y)
    const nx=x/FR.x, ny=(y-FCY)/FR.y;
    return FR.z*Math.sqrt(Math.max(0.02, 1-nx*nx-ny*ny)) - inset;
  };
  const faceNormal=(x,y,z)=> new THREE.Vector3(x/(FR.x*FR.x), (y-FCY)/(FR.y*FR.y), z/(FR.z*FR.z)).normalize();
  const onFace=(geo,mat,x,y,inset,sx,sy,sz)=>{       // embedded so it always touches, oriented to the surface
    const z=facePoint(x,y,inset);
    const m=add(head,geo,mat,x,y,z);
    m.scale.set(sx,sy,sz);
    // align local +Z with the surface normal — purely local math (lookAt wants
    // WORLD coords and silently mis-aims children of a deep, scaled rig)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), faceNormal(x,y,z));
    return m;
  };

  // manga eyes — drawn decals shrink-wrapped on a shell just above the skin.
  // Sphere-patch shells share the skull's centre/scale so they hug the head
  // and wrap the silhouette in profile instead of vanishing edge-on.
  const eyeShell=(sx)=>{
    const phiC=Math.PI/2+sx*0.355, thetaC=1.617;      // ±20° off face centre, just under the equator
    const geo=new THREE.SphereGeometry(0.46,10,10, phiC-0.15,0.30, thetaC-0.20,0.40);
    const m=new THREE.Mesh(geo,mangaEyeMaterial(sx<0));
    m.position.set(0,FCY,0); m.scale.set(0.95,0.95,0.93).multiplyScalar(1.012);
    head.add(m); return m;
  };
  const eyeL=eyeShell(-1), eyeR=eyeShell(1);
  // soft nose bump
  onFace(new THREE.SphereGeometry(0.030,9,7),mNose, 0,0.105, 0.012, 1.0,0.75,0.6);
  // small quiet mouth — nearly flat so the profile stays clean
  onFace(new THREE.SphereGeometry(0.034,10,7),mMouth, 0,0.035, 0.006, 1.0,0.55,0.22);

  buildHair(head,hairStyle,mHair,add,wantCap,rng);

  if(wantCap){
    const cap=new THREE.Group(); cap.position.set(0,0.40,-0.02); cap.rotation.x=-0.10; head.add(cap);
    const dome=add(cap,faceted(new THREE.SphereGeometry(0.50,16,10,0,Math.PI*2,0,Math.PI*0.52)),toon(capC),0,0,0); dome.scale.set(1.0,0.88,1.0);
    const band=add(cap,faceted(new THREE.TorusGeometry(0.475,0.05,8,18)),toon(shade(capC,0.82)),0,-0.02,0); band.rotation.x=Math.PI/2; band.scale.set(1.0,1.0,0.96);
    const brim=add(cap,faceted(new THREE.CylinderGeometry(0.32,0.32,0.05,16,1,false,0,Math.PI)),toon(shade(capC,0.82)),0,-0.035,0.33); brim.rotation.x=0.18; brim.scale.set(1.05,1.0,1.45);
    add(cap,faceted(new THREE.SphereGeometry(0.05,8,6)),toon(capC),0,0.23,0);
  }

  if(phones){
    const hp=new THREE.Group(); head.add(hp);
    const mBand=toon('#efe9db'), mPad=toon('#f5f1e6'), mCupRim=toon('#c9c2b2');
    const band=add(hp,faceted(new THREE.TorusGeometry(0.50,0.045,8,20,Math.PI)),mBand,0,0.22,0.01);
    band.rotation.z=0; band.scale.set(0.96,1.02,1);
    for(const sx of [-1,1]){
      const cup=add(hp,faceted(new THREE.CylinderGeometry(0.135,0.145,0.085,12)),mPad,sx*0.46,0.16,0.02);
      cup.rotation.z=Math.PI/2;
      const rim=add(hp,faceted(new THREE.CylinderGeometry(0.115,0.115,0.03,12)),mCupRim,sx*0.51,0.16,0.02);
      rim.rotation.z=Math.PI/2;
    }
  }

  /* ---- arms: boxy short sleeves, thin kid arms ---- */
  function makeArm(side){
    const shoulder=new THREE.Group(); shoulder.position.set(side*0.305,0.50,0); shoulder.rotation.z=side*0.06; torso.add(shoulder);
    // static cap over the joint so the rotating sleeve rim never pokes out of the tee
    add(torso,new THREE.SphereGeometry(0.118,12,9),mYoke,side*0.305,0.50,0);
    const sleeve=add(shoulder,faceted(new THREE.CylinderGeometry(0.105,0.122,0.26,10)),mYoke,0,-0.11,0);
    add(shoulder,faceted(new THREE.CylinderGeometry(0.122,0.118,0.035,10)),raglan?toon('#ddd8c8'):mShirtDk,0,-0.235,0);
    add(shoulder,faceted(new THREE.CapsuleGeometry(0.060,0.10,4,8)),mSkin,0,-0.29,0);
    const elbow=new THREE.Group(); elbow.position.set(0,-0.355,0); shoulder.add(elbow);
    add(elbow,new THREE.SphereGeometry(0.062,10,8),mSkin,0,-0.005,0);          // elbow cap — bridges the joint when bent
    add(elbow,faceted(new THREE.CapsuleGeometry(0.057,0.21,4,8)),mSkin,0,-0.15,0);
    const hand=new THREE.Group(); hand.position.set(0,-0.34,0.012); elbow.add(hand);
    const handMesh=add(hand,faceted(new THREE.SphereGeometry(0.078,10,8)),mSkin); handMesh.scale.set(0.85,1.05,0.80);
    // held items mount here; the animator counter-rotates it against the arm
    // chain so a cup/skewer stays upright instead of tipping with the forearm
    const grip=new THREE.Group(); hand.add(grip);
    return {shoulder,elbow,hand,grip};
  }
  const leftArm=makeArm(-1), rightArm=makeArm(+1);

  /* ---- legs: baggy cropped shorts, thin calves, chunky sneakers ---- */
  function makeLeg(side){
    const hip=new THREE.Group(); hip.position.set(side*0.14,0.02,0); pelvis.add(hip);
    const shorts=add(hip,faceted(new THREE.CapsuleGeometry(0.128,0.28,5,9)),mPants,0,-0.21,0); shorts.scale.set(1.0,1.0,0.88);
    add(hip,faceted(new THREE.CylinderGeometry(0.118,0.128,0.055,10)),mPantsDk,0,-0.455,0).scale.z=0.88;
    // cargo pocket flap on the outer thigh
    const pocket=add(hip,faceted(new THREE.BoxGeometry(0.035,0.15,0.13)),mPants,side*0.125,-0.27,0.01); pocket.rotation.z=-side*0.06;
    add(hip,faceted(new THREE.BoxGeometry(0.040,0.045,0.135)),mPantsDk,side*0.126,-0.215,0.01).rotation.z=-side*0.06;
    // thigh — fills the shorts→knee stretch so the leg never breaks apart
    add(hip,new THREE.CapsuleGeometry(0.068,0.20,4,8),mSkin,0,-0.44,0);
    const knee=new THREE.Group(); knee.position.set(0,-0.55,0); hip.add(knee);
    add(knee,new THREE.SphereGeometry(0.070,10,8),mSkin,0,-0.005,0);           // knee cap — keeps the joint solid when bent
    add(knee,faceted(new THREE.CapsuleGeometry(0.060,0.25,4,8)),mSkin,0,-0.165,0);
    const sock=add(knee,faceted(new THREE.CylinderGeometry(0.068,0.063,0.14,9)),mSock,0,-0.40,0); sock.scale.z=0.92;
    const ankle=new THREE.Group(); ankle.position.set(0,-0.50,0); knee.add(ankle);
    const foot=new THREE.Group(); foot.position.set(0,-0.045,0.025); ankle.add(foot);
    const heel=add(foot,faceted(new THREE.SphereGeometry(0.115,14,10)),mShoe,0,0.005,-0.02); heel.scale.set(0.94,0.62,1.0);
    const heelSole=add(foot,faceted(new THREE.SphereGeometry(0.117,14,9,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45)),mSole,0,-0.040,-0.01); heelSole.scale.set(0.98,0.55,1.05);
    const toe=new THREE.Group(); toe.position.z=0.08; foot.add(toe);
    const toeMesh=add(toe,faceted(new THREE.SphereGeometry(0.114,14,10)),mShoe,0,-0.004,0.068); toeMesh.scale.set(0.98,0.56,1.30);
    const toeSole=add(toe,faceted(new THREE.SphereGeometry(0.116,14,9,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45)),mSole,0,-0.044,0.068); toeSole.scale.set(1.02,0.50,1.32);
    return {hip,knee,ankle,foot,toe};
  }
  const leftLeg=makeLeg(-1), rightLeg=makeLeg(+1);

  /* ---- Taiwan accessory (see accessories.js) ---- */
  if(opt.accessory && ACCESSORIES[opt.accessory]){
    const spec=ACCESSORIES[opt.accessory];
    const nodeMap={handL:leftArm.grip,handR:rightArm.grip,head,torso,neck};
    const mount=nodeMap[spec.attach.node];
    if(mount){
      const item=spec.make({toon,faceted});
      const [px,py,pz]=spec.attach.pos||[0,0,0], [rx,ry,rz]=spec.attach.rot||[0,0,0];
      item.position.set(px,py,pz); item.rotation.set(rx,ry,rz);
      if(spec.attach.scale) item.scale.setScalar(spec.attach.scale);
      mount.add(item);
    }
  }

  // presentation children (name tags, speech, emotes) live on an unscaled root
  const root=new THREE.Group();
  g.scale.setScalar(CHARACTER_VISUAL_SCALE);
  root.add(g);
  root.userData.parts={
    visual:g,motionRoot,pelvis,torso,chest:torso,neck,head,
    shoulderL:leftArm.shoulder,shoulderR:rightArm.shoulder,
    elbowL:leftArm.elbow,elbowR:rightArm.elbow,handL:leftArm.hand,handR:rightArm.hand,
    hipL:leftLeg.hip,hipR:rightLeg.hip,kneeL:leftLeg.knee,kneeR:rightLeg.knee,
    ankleL:leftLeg.ankle,ankleR:rightLeg.ankle,footL:leftLeg.foot,footR:rightLeg.foot,
    toeL:leftLeg.toe,toeR:rightLeg.toe,eyeL,eyeR,gripL:leftArm.grip,gripR:rightArm.grip,
    armL:leftArm.shoulder,armR:rightArm.shoulder,legL:leftLeg.hip,legR:rightLeg.hip
  };
  return root;
}

/* ================================================================== *
 *  HAIR — big soft masses of overlapping lobes, hugging the skull.
 *  Skull: r 0.46 at (0, 0.20, 0). Eyes at y 0.205 — fringes stop above
 *  ~0.28 except deliberate sweeps that graze ONE eye.
 * ================================================================== */
function buildHair(head, style, mHair, add, hasCap, rng){
  const hg=new THREE.Group(); head.add(hg);
  const lobe=(x,y,z,r,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{
    const m=add(hg,faceted(new THREE.SphereGeometry(r,11,9)),mHair,x,y,z);
    m.scale.set(sx,sy,sz); m.rotation.set(rx,ry,rz); return m;
  };
  const sweep = rng()<0.5 ? 1 : -1;   // which eye the fringe drifts toward

  const spike=(root,tip,r=0.085)=>{
    const a=new THREE.Vector3(...root), b=new THREE.Vector3(...tip), delta=b.clone().sub(a);
    const mesh=add(hg,faceted(new THREE.ConeGeometry(r,delta.length(),6)),mHair);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    return mesh;
  };

  const radialTowers=(variant='classic')=>{
    // Reference: a tall, narrow, swept-back strip. The base is deliberately
    // thin, then overlapping cones form a single continuous ridge.
    let towers;
    if(variant==='extended'){
      // A true head-following profile arc: approximately 11 o'clock at the
      // forehead, over 12, and down to 3 o'clock at the rear of the skull.
      // This deliberately replaces the original shallow, straight root line.
      const heights=[0.62,0.80,0.94,0.81,0.63,0.58,0.53,0.4725];
      const leans=[0.16,0.10,0,-0.10,-0.18,-0.25,-0.32,-0.38];
      const radii=[0.145,0.145,0.145,0.145,0.145,0.134,0.121,0.10875];
      towers=heights.map((h,i)=>{
        const angle=THREE.MathUtils.lerp(Math.PI/3,Math.PI,i/7);
        // Preserve the normal for the final cone orientation. Its tip is
        // projected straight out from the skull—not nudged toward global up.
        return [0.42*Math.cos(angle),0.20+0.42*Math.sin(angle),h,leans[i],radii[i],Math.cos(angle),Math.sin(angle)];
      });
    } else {
      // The classic uses a straight capsule ridge under its upward-biased
      // cones. Radial styles own their curved hairline entirely through their
      // cone roots; carrying this ridge into radial-five creates a loose tuft.
      if(variant==='classic'){
        const ridge=add(hg,faceted(new THREE.CapsuleGeometry(0.13,0.48,4,8)),mHair,0,0.47,0);
        ridge.rotation.x=Math.PI/2;
      }
      towers=[[0.29,0.47,0.62,0.16,0.145],[0.16,0.47,0.80,0.10,0.145],[0.02,0.47,0.94,0,0.145],[-0.13,0.47,0.81,-0.10,0.145],[-0.27,0.47,0.63,-0.18,0.145]];
      if(variant==='radial-five'){
        // Use the first five anchors from the extended style's head-following
        // arc. This makes the hairline continuous instead of moving only its
        // leading cone and leaving the next four behind it.
        towers=towers.map((tower,i)=>{
          const angle=Math.PI/3+i*(2*Math.PI/21); // same step as extended's eight roots
          tower[0]=0.42*Math.cos(angle);
          tower[1]=0.20+0.42*Math.sin(angle);
          return tower;
        });
        // Derive each direction from its actual base point on the skull
        // instead of +Y.
        towers=towers.map(([z,y,h,lean,r])=>{
          const normal=new THREE.Vector3(0,y-0.20,z).normalize();
          return [z,y,h,lean,r,normal.z,normal.y];
        });
      }
    }
    for(const [z,y,h,lean,r,nz,ny] of towers){
      const tip=variant!=='classic'
        ? [0,y+h*ny,z+h*nz]             // uncompromising radial cone geometry
        : [0,y+h,z+lean];
      spike([0,y,z],tip,r);
    }
    return hg;
  };

  if(style==='mohawk-classic'){
    return radialTowers('classic');
  }

  if(style==='mohawk-radial-five'){
    return radialTowers('radial-five');
  }

  if(style==='mohawk-radial-extended'){
    return radialTowers('extended');
  }

  // base crown + nape — shared by every style: hair hugs the whole skull back
  lobe(0,0.34,-0.05, 0.44, 1.06,0.96,1.02);                       // crown dome
  lobe(0,0.12,-0.20, 0.36, 1.16,1.12,0.78);                       // back of head, down to the nape

  if(style==='short'){
    // neat crop: shallow fringe high on the forehead, ears out
    lobe(0,0.42,0.16, 0.30, 1.28,0.62,0.80);
    lobe(sweep*0.16,0.40,0.30, 0.16, 1.3,0.55,0.62, 0.35,0,-sweep*0.15);
    lobe(-sweep*0.20,0.41,0.27, 0.13, 1.15,0.5,0.6, 0.3,0,sweep*0.2);
    for(const sx of [-1,1]) lobe(sx*0.38,0.24,0.02, 0.15, 0.62,0.95,0.85);
    return hg;
  }
  if(style==='bob'){
    // chin-length curtains + straight full fringe
    for(const sx of [-1,1]) lobe(sx*0.36,0.02,0.00, 0.21, 0.78,1.45,0.95);
    lobe(0,0.02,-0.26, 0.30, 1.18,1.30,0.72);
    if(!hasCap){
      lobe(0,0.38,0.26, 0.24, 1.42,0.55,0.62, 0.30);
      lobe(sweep*0.19,0.34,0.30, 0.14, 1.2,0.55,0.55, 0.35,0,-sweep*0.25);
      lobe(-sweep*0.17,0.35,0.30, 0.12, 1.1,0.5,0.55, 0.35,0,sweep*0.2);
    }
    return hg;
  }
  if(style==='wavy'){
    // chunky wavy mass — irregular lobes all around, curls at the nape
    lobe(0,0.46,0.06, 0.27, 1.25,0.85,1.05, 0.15);
    lobe(sweep*0.24,0.44,-0.08, 0.20, 1.1,0.9,1.1, 0,0,sweep*0.4);
    lobe(-sweep*0.26,0.42,0.02, 0.18, 1.05,0.85,1.0, 0,0,-sweep*0.3);
    for(const sx of [-1,1]){
      lobe(sx*0.40,0.22,-0.04, 0.17, 0.72,1.15,0.95);
      lobe(sx*0.34,0.02,-0.16, 0.14, 0.9,1.0,0.9, 0,0,sx*0.5);   // nape curls
    }
    lobe(0,-0.02,-0.24, 0.17, 1.3,0.9,0.8);
    if(!hasCap){
      // scalloped fringe — three lobes, bottom edge ~y 0.28, both eyes clear
      lobe(0,0.345,0.30, 0.16, 1.3,0.62,0.60, 0.35);
      lobe(sweep*0.23,0.335,0.26, 0.15, 1.1,0.6,0.58, 0.35,0,-sweep*0.3);
      lobe(-sweep*0.23,0.345,0.26, 0.14, 1.05,0.58,0.56, 0.35,0,sweep*0.3);
    }
    return hg;
  }
  // 'fluffy' (default) — the big soft mop: heavy fringe draped low, grazing one eye
  lobe(0,0.44,0.08, 0.31, 1.20,0.92,1.08, 0.1);
  lobe(sweep*0.26,0.42,-0.10, 0.20, 1.0,0.95,1.15, 0,0,sweep*0.35);
  for(const sx of [-1,1]) lobe(sx*0.40,0.20,-0.02, 0.19, 0.72,1.25,0.95);
  lobe(0,0.06,-0.24, 0.22, 1.28,1.0,0.72);
  // scalloped wavy nape — irregular lobes give the back edge its hand-drawn wave
  lobe(0.16,-0.02,-0.28, 0.11, 1.1,0.9,0.75, 0,0,0.45);
  lobe(-0.14,-0.03,-0.29, 0.10, 1.05,0.85,0.7, 0,0,-0.4);
  lobe(0.30,0.04,-0.22, 0.09, 0.9,1.0,0.8, 0,0,0.7);
  lobe(-0.31,0.03,-0.21, 0.09, 0.9,1.0,0.8, 0,0,-0.65);
  if(!hasCap){
    // main fringe mass — covers the forehead, bottom edge ~y 0.28
    lobe(0,0.395,0.30, 0.24, 1.55,0.50,0.55, 0.32);
    // the sweep lobe — dips over one eye like the reference kid
    lobe(sweep*0.16,0.315,0.32, 0.14, 1.25,0.60,0.50, 0.35,0,-sweep*0.35);
    // shorter counterpart, higher on the other side
    lobe(-sweep*0.20,0.355,0.30, 0.12, 1.10,0.55,0.50, 0.32,0,sweep*0.25);
    // side locks in front of the ears, framing the face
    for(const sx of [-1,1]) lobe(sx*0.36,0.15,0.15, 0.13, 0.55,1.15,0.70, 0,0,sx*0.10);
  }
  return hg;
}

/* ================================================================== *
 *  CHARACTER MOTION — articulated poses + responsive state layers
 *  (ported from main.js; same signal contract: update(dt, {speed,
 *   grounded, direction, turnRate, distance, phase, landed, verticalSpeed}))
 * ================================================================== */
const MOTION_DEG=Math.PI/180, MOTION_TAU=Math.PI*2;
export const MOTION={
  cycleSeconds:0.56,
  strideDistance:2.2,
  upperLeg:0.55,
  lowerLeg:0.50,
  stanceEnd:0.42,
  startSeconds:0.15,
  stopSeconds:0.20,
  landSeconds:0.24,
  // One leg over eight authored gait poses. The other samples half a cycle on.
  hip:[-42,-22,4,28,31,10,-24,-44].map(v=>v*MOTION_DEG),
  // swing-phase knee flexion pushed high (~96°) so the heel kicks up behind, like the video run
  knee:[18,24,18,40,78,96,58,24].map(v=>v*MOTION_DEG),
  ankle:[-9,-1,7,17,7,-5,-9,-12].map(v=>v*MOTION_DEG),
  toe:[0,0,-3,-20,-8,0,0,0].map(v=>v*MOTION_DEG),
  arm:[34,20,-6,-28,-33,-13,20,37].map(v=>v*MOTION_DEG),
  elbow:[82,76,74,80,89,94,88,82].map(v=>v*MOTION_DEG),
  pelvisY:[0,-0.034,0.014,0.045,0,-0.034,0.014,0.045],
  pelvisX:[-0.006,-0.008,-0.003,0.003,0.006,0.008,0.003,-0.003],
  pelvisRoll:[-0.8,-1.0,-0.4,0.4,0.8,1.0,0.4,-0.4].map(v=>v*MOTION_DEG),
  pelvisYaw:[2,1.4,0,-1.4,-2,-1.4,0,1.4].map(v=>v*MOTION_DEG)
};
function motionSmooth(t){ t=THREE.MathUtils.clamp(t,0,1); return t*t*(3-2*t); }
function motionDamp(a,b,rate,dt){ return a+(b-a)*(1-Math.exp(-rate*dt)); }
function motionSample(values,phase){
  const n=values.length, wrapped=((phase%1)+1)%1, x=wrapped*n;
  const i=Math.floor(x)%n, t=x-Math.floor(x), t2=t*t, t3=t2*t;
  const p0=values[(i+n-1)%n], p1=values[i], p2=values[(i+1)%n], p3=values[(i+2)%n];
  return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
}
function motionSpring(s,target,dt,stiffness=72,damping=13,limit=0.24){
  s.v+=(target-s.x)*stiffness*dt;
  s.v*=Math.exp(-damping*dt);
  s.x=THREE.MathUtils.clamp(s.x+s.v*dt,-limit,limit);
  return s.x;
}
function motionSeed(value){
  if(typeof value==='number') return value>>>0;
  const str=String(value==null?'runner':value); let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}
export function createCharacterAnimator(character,opt={}){
  const p=character&&character.userData&&character.userData.parts;
  if(!p||!p.motionRoot||!p.kneeL||!p.elbowL) return {phase:0,mode:'idle',update:()=>{}};
  const maxSpeed=Math.max(0.1,opt.maxSpeed||3), intensity=opt.intensity==null?1:opt.intensity;
  const strideDistance=Math.max(0.5,opt.strideDistance||MOTION.strideDistance);
  let rng=motionSeed(opt.seed), phase=(opt.phase||0), mode='idle', stateTime=0;
  let moveDirection=1, desiredDirection=1;
  let filteredSpeed=0, filteredTurn=0, filteredAccel=0, previousSpeed=0;
  let stopFrom=phase, stopAt=phase, contactSlot=Math.floor(phase/Math.PI);
  let wasGrounded=true, idleTime=(rng%1000)/100, idleTimer=3.2, gestureTime=99, gestureDir=1;
  let idleSideTarget=(rng&1)?1:-1, idleSide=idleSideTarget;
  const headYaw={x:0,v:0}, bodyYaw={x:0,v:0};
  const nodes=[p.motionRoot,p.pelvis,p.torso,p.neck,p.shoulderL,p.shoulderR,p.elbowL,p.elbowR,p.hipL,p.hipR,p.kneeL,p.kneeR,p.ankleL,p.ankleR,p.footL,p.footR,p.toeL,p.toeR].filter(Boolean);
  const rests=nodes.map(node=>({node,pos:node.position.clone(),rot:node.rotation.clone()}));
  const restByNode=new Map(rests.map(r=>[r.node,r]));
  const plantL={active:false,age:0,anchor:new THREE.Vector3()}, plantR={active:false,age:0,anchor:new THREE.Vector3()};
  const ikPoint=new THREE.Vector3();
  const random=()=>{ rng=(Math.imul(rng,1664525)+1013904223)>>>0; return rng/4294967296; };
  idleTimer=3+random()*4;
  // cozy face: relaxed blinks, and every so often a happy ^ ^ squint
  let eyeStyle='open', blinkIn=1.5+random()*3, blinkHold=0, happyIn=5+random()*9, happyHold=0;
  function setEyes(style){
    if(style===eyeStyle||!p.eyeL||!p.eyeR) return; eyeStyle=style;
    p.eyeL.material.map=mangaEyeTexture(style,true);
    p.eyeR.material.map=mangaEyeTexture(style,false);
  }
  function updateFace(dt){
    if(!p.eyeL||!p.eyeR) return;
    if(happyHold>0){ happyHold-=dt; setEyes('happy'); if(happyHold<=0) happyIn=6+random()*10; return; }
    if(blinkHold>0){ blinkHold-=dt; setEyes('blink'); return; }
    setEyes('open');
    happyIn-=dt; blinkIn-=dt;
    if(happyIn<=0 && mode==='idle') happyHold=0.9+random()*0.5;      // linger warmly while resting
    else if(blinkIn<=0){ blinkHold=0.11; blinkIn=2+random()*3.5; }
  }
  function restore(){ for(const r of rests){ r.node.position.copy(r.pos); r.node.rotation.copy(r.rot); } }
  function enter(next){
    if(mode===next) return;
    mode=next; stateTime=0;
    if(next==='stop'){
      stopFrom=phase;
      stopAt=Math.round(phase/Math.PI)*Math.PI;
    }
  }
  function solvePlantedFoot(hip,knee,ankle,plant,legPhase,groundedNow,gaitBlend,dtStep){
    if(!hip||!knee||!ankle) return;
    const lp=((legPhase%1)+1)%1;
    const locomotion=groundedNow&&(mode==='start'||mode==='run'||mode==='stop'||mode==='reverse')&&gaitBlend>0.06;
    const inStance=locomotion&&lp<MOTION.stanceEnd;
    if(!inStance){ plant.active=false; plant.age=0; return; }
    // Capture the ankle in world space on contact, then solve the two rigid leg
    // segments back to that point while the character root travels over it.
    character.updateWorldMatrix(true,true);
    if(!plant.active){
      ankle.getWorldPosition(plant.anchor);
      plant.active=true; plant.age=0;
      return;
    }
    plant.age+=dtStep;
    ikPoint.copy(plant.anchor);
    p.pelvis.worldToLocal(ikPoint);
    ikPoint.sub(hip.position);
    const upper=MOTION.upperLeg, lower=MOTION.lowerLeg;
    const rawDistance=Math.hypot(ikPoint.y,ikPoint.z);
    const distance=THREE.MathUtils.clamp(rawDistance,Math.abs(upper-lower)+0.025,upper+lower-0.002);
    const kneeTarget=Math.acos(THREE.MathUtils.clamp((distance*distance-upper*upper-lower*lower)/(2*upper*lower),-1,1));
    const targetAngle=Math.atan2(-ikPoint.z,-ikPoint.y);
    const hipOffset=Math.atan2(lower*Math.sin(kneeTarget),upper+lower*Math.cos(kneeTarget));
    const hipTarget=targetAngle-hipOffset;
    const exitStart=MOTION.stanceEnd-0.025;
    const release=lp>exitStart?1-motionSmooth((lp-exitStart)/(MOTION.stanceEnd-exitStart)):1;
    const stopReleaseStart=MOTION.stopSeconds*0.55;
    const stopHold=mode==='stop'?1-motionSmooth((stateTime-stopReleaseStart)/(MOTION.stopSeconds-stopReleaseStart)):1;
    const weight=motionSmooth(plant.age/0.014)*release*stopHold*Math.min(1,gaitBlend*1.35);
    const hipRest=restByNode.get(hip).rot.x, kneeRest=restByNode.get(knee).rot.x, ankleRest=restByNode.get(ankle).rot.x;
    // Keep the whole shoe level while planted (no heel-rock skating).
    const levelFoot=-(hipTarget+kneeTarget);
    hip.rotation.x=THREE.MathUtils.lerp(hip.rotation.x,hipRest+hipTarget,weight);
    knee.rotation.x=THREE.MathUtils.lerp(knee.rotation.x,kneeRest+kneeTarget,weight);
    ankle.rotation.x=THREE.MathUtils.lerp(ankle.rotation.x,ankleRest+levelFoot,weight);
  }
  const api={phase,mode,speed:0};
  api.update=(dt,signal={})=>{
    dt=Math.min(Math.max(dt||0,0),0.05); if(dt<=0) return api;
    const rawSpeed=Math.max(0,signal.speed||0), grounded=signal.grounded!==false;
    const moving=grounded&&rawSpeed>maxSpeed*0.012;
    const signalDirection=signal.direction<0?-1:1;
    if(moving&&signalDirection!==desiredDirection){
      desiredDirection=signalDirection;
      if(mode==='run'||mode==='start') enter('reverse');
    } else if(!moving) desiredDirection=signalDirection;
    stateTime+=dt; idleTime+=dt;
    if(!grounded){ if(mode!=='air') enter('air'); }
    else if(signal.landed||(!wasGrounded&&grounded)) enter('land');
    else if(mode==='air') enter('land');
    else if(mode==='idle'&&moving) enter('start');
    else if(mode==='start'&&stateTime>=MOTION.startSeconds) enter('run');
    else if(mode==='run'&&!moving) enter('stop');
    else if(mode==='reverse'&&!moving) enter('stop');
    else if(mode==='reverse'&&stateTime>=0.22){ moveDirection=desiredDirection; enter('run'); }
    else if(mode==='stop'&&moving) enter('start');
    else if(mode==='stop'&&stateTime>=MOTION.stopSeconds) enter('idle');
    else if(mode==='land'&&stateTime>=MOTION.landSeconds) enter(moving?'run':'idle');
    wasGrounded=grounded;

    const targetSpeed=THREE.MathUtils.clamp(rawSpeed/maxSpeed,0,1.25);
    filteredSpeed=motionDamp(filteredSpeed,targetSpeed,moving?11:7,dt);
    const accel=(filteredSpeed-previousSpeed)/Math.max(dt,1e-4); previousSpeed=filteredSpeed;
    filteredAccel=motionDamp(filteredAccel,accel,9,dt);
    filteredTurn=motionDamp(filteredTurn,signal.turnRate||0,10,dt);
    const distance=Math.max(0,signal.distance||0);
    if(mode==='start'&&stateTime<dt*1.5) moveDirection=desiredDirection;
    const reverseProgress=mode==='reverse'?Math.min(1,stateTime/0.22):1;
    const phaseDirection=mode==='reverse'&&reverseProgress<0.5?moveDirection:desiredDirection;
    if(moving&&distance>0) phase+=phaseDirection*distance/strideDistance*MOTION_TAU;
    if(Number.isFinite(signal.phase)){
      const error=Math.atan2(Math.sin(signal.phase-phase),Math.cos(signal.phase-phase));
      phase+=error*(1-Math.exp(-dt*5));
    }
    if(mode==='stop'){
      const plant=motionSmooth(Math.min(1,stateTime/0.18));
      phase=THREE.MathUtils.lerp(stopFrom,stopAt,plant);
    }
    const nextSlot=Math.floor((phase+1e-4)/Math.PI);
    if(nextSlot!==contactSlot&&moving){ contactSlot=nextSlot; if(opt.onStep) opt.onStep(nextSlot&1); }

    let gaitWeight=0;
    if(mode==='start') gaitWeight=motionSmooth(stateTime/MOTION.startSeconds);
    else if(mode==='run') gaitWeight=1;
    else if(mode==='stop') gaitWeight=1-motionSmooth(stateTime/MOTION.stopSeconds);
    else if(mode==='reverse') gaitWeight=Math.abs(reverseProgress*2-1);
    gaitWeight*=THREE.MathUtils.lerp(0.18,1,motionSmooth(THREE.MathUtils.clamp(filteredSpeed,0,1)))*intensity;
    const idleWeight=(mode==='idle'?1:((mode==='start'||mode==='stop'||mode==='reverse')?1-gaitWeight:0));
    const turnN=THREE.MathUtils.clamp(filteredTurn/2.6,-1,1);

    if(mode==='idle'){
      idleTimer-=dt;
      if(idleTimer<=0){
        gestureTime=0; gestureDir=random()<0.5?-1:1;
        if(random()<0.18) idleSideTarget*=-1;
        idleTimer=3+random()*4.2;
      }
    }
    gestureTime+=dt;
    idleSide=motionDamp(idleSide,idleSideTarget,1.55,dt);
    const gesture=gestureTime<1.55?Math.sin(Math.PI*gestureTime/1.55):0;
    const breath=Math.sin(idleTime*1.65+(rng&255)*0.01);

    restore();
    const u=phase/MOTION_TAU;
    const hipL=motionSample(MOTION.hip,u), hipR=motionSample(MOTION.hip,u+0.5);
    const kneeL=motionSample(MOTION.knee,u), kneeR=motionSample(MOTION.knee,u+0.5);
    const ankleL=motionSample(MOTION.ankle,u), ankleR=motionSample(MOTION.ankle,u+0.5);
    const armL=motionSample(MOTION.arm,u), armR=motionSample(MOTION.arm,u+0.5);
    p.hipL.rotation.x+=hipL*gaitWeight; p.hipR.rotation.x+=hipR*gaitWeight;
    p.kneeL.rotation.x+=kneeL*gaitWeight; p.kneeR.rotation.x+=kneeR*gaitWeight;
    p.ankleL.rotation.x+=ankleL*gaitWeight; p.ankleR.rotation.x+=ankleR*gaitWeight;
    if(p.toeL) p.toeL.rotation.x+=motionSample(MOTION.toe,u)*gaitWeight;
    if(p.toeR) p.toeR.rotation.x+=motionSample(MOTION.toe,u+0.5)*gaitWeight;
    p.shoulderL.rotation.x+=armL*gaitWeight; p.shoulderR.rotation.x+=armR*gaitWeight*0.88;
    p.shoulderL.rotation.y-=motionSample(MOTION.pelvisYaw,u)*0.16*gaitWeight;
    p.shoulderR.rotation.y-=motionSample(MOTION.pelvisYaw,u+0.5)*0.13*gaitWeight;
    p.elbowL.rotation.x-=MOTION_DEG*18*idleWeight+motionSample(MOTION.elbow,u)*gaitWeight;
    p.elbowR.rotation.x-=MOTION_DEG*16*idleWeight+motionSample(MOTION.elbow,u+0.5)*gaitWeight*0.94;

    p.pelvis.position.y+=motionSample(MOTION.pelvisY,u)*gaitWeight;
    p.pelvis.position.x+=motionSample(MOTION.pelvisX,u)*gaitWeight;
    p.pelvis.rotation.z+=motionSample(MOTION.pelvisRoll,u)*gaitWeight-turnN*MOTION_DEG*4.2*gaitWeight;
    p.pelvis.rotation.y+=motionSample(MOTION.pelvisYaw,u)*gaitWeight;
    p.motionRoot.rotation.y+=motionSpring(bodyYaw,-turnN*0.11,dt,72,14,0.14);
    const chestPitch=(0.075+0.065*THREE.MathUtils.clamp(filteredSpeed,0,1)+THREE.MathUtils.clamp(filteredAccel*0.012,-0.025,0.04))*gaitWeight;
    p.torso.rotation.x+=chestPitch;
    p.torso.rotation.y-=motionSample(MOTION.pelvisYaw,u)*0.76*gaitWeight+turnN*MOTION_DEG*3.5;
    p.torso.rotation.z-=motionSample(MOTION.pelvisRoll,u)*0.55*gaitWeight;

    // A held, weight-bearing idle pose with occasional glances and transfers.
    const leftRelax=(idleSide+1)*0.5, rightRelax=(1-idleSide)*0.5;
    p.pelvis.position.x+=idleSide*0.050*idleWeight;
    p.pelvis.position.y+=(0.004+breath*0.003)*idleWeight;
    p.pelvis.rotation.z-=idleSide*MOTION_DEG*3.1*idleWeight;
    p.torso.position.y+=(0.005+breath*0.004)*idleWeight;
    p.torso.rotation.z+=idleSide*MOTION_DEG*3.7*idleWeight;
    p.torso.rotation.x+=MOTION_DEG*(1.7+breath*0.32)*idleWeight;
    p.hipL.rotation.z-=MOTION_DEG*5.5*leftRelax*idleWeight;
    p.hipR.rotation.z+=MOTION_DEG*5.5*rightRelax*idleWeight;
    p.hipL.rotation.y-=MOTION_DEG*9*leftRelax*idleWeight;
    p.hipR.rotation.y+=MOTION_DEG*9*rightRelax*idleWeight;
    p.kneeL.rotation.x+=MOTION_DEG*16*leftRelax*idleWeight;
    p.kneeR.rotation.x+=MOTION_DEG*16*rightRelax*idleWeight;
    p.ankleL.rotation.x-=MOTION_DEG*5*leftRelax*idleWeight;
    p.ankleR.rotation.x-=MOTION_DEG*5*rightRelax*idleWeight;
    if(p.footL) p.footL.rotation.y-=MOTION_DEG*(5+7*leftRelax)*idleWeight;
    if(p.footR) p.footR.rotation.y+=MOTION_DEG*(5+7*rightRelax)*idleWeight;
    p.shoulderL.rotation.z-=MOTION_DEG*2.2*rightRelax*idleWeight;
    p.shoulderR.rotation.z+=MOTION_DEG*2.2*leftRelax*idleWeight;

    const anticipation=mode==='start'?Math.sin(Math.PI*Math.min(1,stateTime/MOTION.startSeconds)):0;
    const settle=mode==='stop'?Math.sin(Math.PI*Math.min(1,stateTime/MOTION.stopSeconds)):0;
    const reverseTransfer=mode==='reverse'?Math.sin(Math.PI*reverseProgress):0;
    const landing=mode==='land'?Math.sin(Math.PI*Math.min(1,stateTime/MOTION.landSeconds)):0;
    p.pelvis.position.y-=0.042*anticipation+0.025*settle+0.045*reverseTransfer+0.075*landing;
    p.torso.rotation.x+=0.11*anticipation+0.07*settle+0.08*reverseTransfer+0.08*landing;
    p.kneeL.rotation.x+=0.12*anticipation+0.13*reverseTransfer+0.34*landing;
    p.kneeR.rotation.x+=0.12*anticipation+0.13*reverseTransfer+0.34*landing;
    if(mode==='air'){
      const rise=THREE.MathUtils.clamp((signal.verticalSpeed||0)/9,-1,1);
      p.hipL.rotation.x-=0.10+rise*0.04; p.hipR.rotation.x-=0.04-rise*0.04;
      p.kneeL.rotation.x+=0.52; p.kneeR.rotation.x+=0.44;
      p.shoulderL.rotation.x-=0.20; p.shoulderR.rotation.x-=0.20;
      p.elbowL.rotation.x-=0.35; p.elbowR.rotation.x-=0.35;
    }

    // held items stay upright: counter-rotate the grip against the whole arm
    // chain (85% — the remaining sway keeps it feeling hand-held, not gimballed)
    if(p.gripL) p.gripL.rotation.x=-(p.shoulderL.rotation.x+p.elbowL.rotation.x)*0.85;
    if(p.gripR) p.gripR.rotation.x=-(p.shoulderR.rotation.x+p.elbowR.rotation.x)*0.85;

    solvePlantedFoot(p.hipL,p.kneeL,p.ankleL,plantL,u,grounded,gaitWeight,dt);
    solvePlantedFoot(p.hipR,p.kneeR,p.ankleR,plantR,u+0.5,grounded,gaitWeight,dt);

    const headTarget=-turnN*0.09+gestureDir*0.16*gesture*idleWeight;
    p.neck.rotation.y+=motionSpring(headYaw,headTarget,dt,62,12,0.19);
    p.neck.rotation.x-=chestPitch*0.34;
    p.neck.rotation.z-=idleSide*MOTION_DEG*1.5*idleWeight;
    updateFace(dt);
    api.phase=phase; api.mode=mode; api.speed=filteredSpeed;
    return api;
  };
  return api;
}
