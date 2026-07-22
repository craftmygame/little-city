import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as LM from './taipei-landmarks.js';   // Taipei landmark models (local-space builders)
import { TAIPEI_CITY as CITY } from './city/taipei.js';
import { validateCity } from './city/validate.js';
// The runner kids (look + motion + Taiwan accessories) live in their own module now.
import { makeCharacter, createCharacterAnimator, MOTION,
         SKIN, HAIRC, SHIRTS, PANTSC, CAPS, HAIRSTYLES, AUTO_HAIRSTYLES } from './character.js';
const MOTION_TAU = Math.PI * 2;
// generic exponential damping (used by the player-speed filter in the game loop)
const motionDamp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));

validateCity(CITY, LM);

/* ============================================================= *
 *  TINY PLANET TAIPEI — a Three.js cel-shaded neighbourhood-runner game  *
 * ============================================================= */

// ---- seeded RNG (deterministic world, shared across players) ----
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const SEED = 1337;
let rng = mulberry32(SEED);
const rand=(a=1,b)=> b===undefined ? rng()*a : a+rng()*(b-a);
const randi=(a,b)=> Math.floor(rand(a,b+1));
const pick=(arr)=> arr[Math.floor(rng()*arr.length)];

// ---------------------------------------------------------------
//  EMOJI (Twemoji) — consistent, beautiful glyphs everywhere
// ---------------------------------------------------------------
const EMOJI_BASE='https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/';
const EMOJI_PNG=EMOJI_BASE+'72x72/';
function emojiCode(e){ const cps=[]; for(const ch of e){ const c=ch.codePointAt(0); if(c!==0xFE0F) cps.push(c.toString(16)); } return cps.join('-'); }
function emojiUrl(e){ return EMOJI_PNG+emojiCode(e)+'.png'; }
const _emojiImgCache=new Map();
function loadEmojiImg(e){ if(_emojiImgCache.has(e)) return _emojiImgCache.get(e); const img=new Image(); img.crossOrigin='anonymous'; img.src=emojiUrl(e); _emojiImgCache.set(e,img); return img; }
function tw(el){ try{ if(window.twemoji && el) twemoji.parse(el,{base:EMOJI_BASE,folder:'72x72',ext:'.png'}); }catch(err){} }
['👋','😀','❤️','👍','🎉','😮','😎','🙏','⭐','💛','😊','😄','📬','🥹','📦','📮','✋','🔊','🔇','❓','🔗','🏆','🌄','👽','🛸','🐱'].forEach(loadEmojiImg);

// ---------------------------------------------------------------
//  RENDERER / SCENE / CAMERA
// ---------------------------------------------------------------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches?1.5:2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;      // flat cel look: blob shadows only (big perf win)
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const SKY = new THREE.Color('#a9d3ce');            // calm Taipei teal-blue — the one sky colour
const SKY_LOW = new THREE.Color('#efe6d0');        // warm cream low band (fog colour = this)
scene.background = SKY;
scene.fog = new THREE.Fog(SKY_LOW, 42, 175);       // street-depth cueing (char-relative, not planet)

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 1020);
camera.position.set(0, 40, 0);

// flat painted cel sky — two flat bands, one crisp horizon edge, no sun, no gradients.
// The band follows the PLAYER's local up (uUp) so the horizon reads right anywhere
// on the globe, not just at the +Y city-centre pole.
let skyUniforms=null;
{
  const skyGeo = new THREE.SphereGeometry(442, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{ low:{value:SKY_LOW.clone()}, high:{value:SKY.clone()}, uUp:{value:new THREE.Vector3(0,1,0)} },
    vertexShader:`varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec3 vDir; uniform vec3 low,high,uUp;
      void main(){ float h=dot(normalize(vDir),normalize(uUp))*0.5+0.5;
        vec3 col=mix(low,high,smoothstep(0.535,0.555,h));   // one crisp painted band edge
        gl_FragColor=vec4(col,1.0); }`
  });
  skyUniforms = skyMat.uniforms;
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

// ---------------------------------------------------------------
//  LIGHTS  (rebalanced for the no-shadow-map cel look)
// ---------------------------------------------------------------
const hemi = new THREE.HemisphereLight('#e6f1ec', '#a8b89c', 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4d6', 1.7);
sun.position.set(60, 80, 30);
scene.add(sun);
scene.add(new THREE.AmbientLight('#ffffff', 0.22));

// ---------------------------------------------------------------
//  TOON MATERIAL HELPERS
// ---------------------------------------------------------------
function toonGradient(steps){
  const data = new Uint8Array(steps);
  for(let i=0;i<steps;i++) data[i] = Math.min(255, Math.round(60 + (i/(steps-1))*195));
  const t = new THREE.DataTexture(data, steps,1, THREE.RedFormat);
  t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t;
}
const GRAD = toonGradient(4);
const GRAD_SOFT = toonGradient(7);   // smoother banding for the planet ground
function toon(color, opts={}){
  const o = Object.assign({}, opts); delete o.flatShading;   // MeshToonMaterial has no flatShading
  return new THREE.MeshToonMaterial(Object.assign({ color:new THREE.Color(color), gradientMap:GRAD }, o));
}
// flat/faceted look without a material flag: non-indexed geometry => per-face normals
function faceted(geo){ const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; }
// bake a multi-mesh group into a few merged meshes (one per material) for perf — huge draw-call/traversal win
function bakeMerge(root){
  root.updateMatrixWorld(true);
  const groups=new Map();
  root.traverse(o=>{ if(!o.isMesh) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    if(!geo.attributes.normal) geo.computeVertexNormals();
    for(const a of Object.keys(geo.attributes)) if(a!=='position' && a!=='normal') geo.deleteAttribute(a);
    if(!groups.has(o.material)) groups.set(o.material,[]); groups.get(o.material).push(geo);
  });
  const out=new THREE.Group();
  for(const [mat,geos] of groups){ const merged=mergeGeometries(geos,false); if(!merged) continue;
    const mesh=new THREE.Mesh(merged,mat); mesh.castShadow=true; mesh.receiveShadow=true; out.add(mesh); }
  return out;
}

// ---------------------------------------------------------------
//  PLANET
// ---------------------------------------------------------------
const R = CITY.planet.radius;
const WATER = CITY.planet.waterLevel;
const planetGroup = new THREE.Group();
scene.add(planetGroup);
const colliders=[];                 // {dir:unit Vector3, ar:angular radius} solid obstacles
const houseSmokers=[];              // {pos, up} chimney smoke emitters
const windMats=[];                  // leaf shader uniforms for tree sway

// =====================================================================
//  TAIPEI MAP — local tangent frame + basin / mountains / rivers
//  The "city centre" pole sits at +Y. (xkm,ykm) are real km offsets from
//  Taipei 101 (+X east, +Y north). KM converts km -> planet surface units.
// =====================================================================
const CITY_UP    = new THREE.Vector3(0,1,0);
const CITY_EAST  = new THREE.Vector3(-1,0,0);  // -X tangent = East, so (E,N,UP) is right-handed
                                               // and the city renders true to the real map
                                               // instead of mirror-imaged (E×N must equal UP).
const CITY_NORTH = new THREE.Vector3(0,0,1);   // +Z tangent  = North
const KM = parseFloat(new URLSearchParams(location.search).get('km')) || CITY.planet.unitsPerKm;
const BASIN = CITY.planet.basinHeight;

// (east km, north km) -> unit sphere direction (azimuthal-equidistant)
function mapDir(xkm, ykm){
  const e = xkm*KM, n = ykm*KM, dist = Math.hypot(e,n);
  if(dist < 1e-6) return CITY_UP.clone();
  const theta = dist / R;
  const t = new THREE.Vector3().addScaledVector(CITY_EAST, e/dist).addScaledVector(CITY_NORTH, n/dist);
  return CITY_UP.clone().multiplyScalar(Math.cos(theta)).addScaledVector(t, Math.sin(theta)).normalize();
}
// unit direction -> {x,y} km + surface distance (units) from city centre
const _m1=new THREE.Vector3();
function dirToMap(dir){
  const d=_m1.copy(dir).normalize();
  const cosT=THREE.MathUtils.clamp(d.dot(CITY_UP),-1,1);
  const theta=Math.acos(cosT);
  const tx=d.dot(CITY_EAST), tz=d.dot(CITY_NORTH);
  const tl=Math.hypot(tx,tz), arc=theta*R;
  if(tl<1e-6) return {x:0,y:0,dist:arc};
  return { x:(arc*(tx/tl))/KM, y:(arc*(tz/tl))/KM, dist:arc };
}
function segDist(px,py, ax,ay, bx,by){
  const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy;
  let t = l2>0 ? ((px-ax)*dx+(py-ay)*dy)/l2 : 0; t=Math.max(0,Math.min(1,t));
  return Math.hypot(px-(ax+t*dx), py-(ay+t*dy));
}
function polyDist(px,py, pts){ let m=1e9; for(let i=0;i<pts.length-1;i++){ const d=segDist(px,py,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]); if(d<m)m=d; } return m; }

// --- globe spread: real Taipei packs every monument within ~8 km of 101, but the
// planet has ~18 km of arc from the city pole to the far pole (π·R/KM ≈ 17.95).
// spreadDist() stretches authored real-km distances — a uniform ×SPREAD across the
// whole monument zone (so bearings AND relative geometry stay true), easing off
// through SP_A0..SP_A1 so the outer ranges + sea land just before the far pole.
// Applied ONCE to authored layout data (landmark/district/river/road positions);
// local sizes — road widths, park radii, the street fabric — stay physical.
const { factor:SPREAD, innerKm:SP_A0, outerKm:SP_A1, farFactor:SP_OUT, boost:SP_BOOST } = CITY.planet.spread;
// Optional inner boost (Phase 2 normalization): city data is now true real km,
// so the extra ×~1.9 the Xinyi core used to carry in its data lives here
// instead. The boost integrates a slope profile s0 → dip → base across
// z[0..3] real km whose total extra area is ZERO at z[3] — beyond it the
// spread is bit-identical to the pre-normalization curve.
function boostExtra(d){
  if(!SP_BOOST) return 0;
  const {s0, z:[z1,z2,z3,z4], dip}=SP_BOOST, base=SPREAD;
  const S=u=>u*u*u-u*u*u*u*0.5;                       // ∫ smoothstep
  const e1=s0-base, e2=dip-base;
  let E=0, t=Math.min(d,z1); E+=e1*t;
  if(d>z1){ const L=z2-z1,u=Math.min((d-z1)/L,1); E+=e1*L*u+(e2-e1)*L*S(u); }
  if(d>z2){ E+=e2*(Math.min(d,z3)-z2); }
  if(d>z3){ const L=z4-z3,u=Math.min((d-z3)/L,1); E+=e2*L*u+(0-e2)*L*S(u); }
  return E;
}
const BOOST_TAIL = SP_BOOST ? boostExtra(SP_BOOST.z[3]) : 0;   // force exact 0 past z4
function spreadDist(d){
  const L=SP_A1-SP_A0;
  let G;                                              // ∫₀^d smoothstep((t-SP_A0)/L) dt
  if(d<=SP_A0) G=0;
  else if(d<SP_A1){ const u=(d-SP_A0)/L; G=L*(u*u*u - u*u*u*u*0.5); }
  else G=L*0.5 + (d-SP_A1);
  const boost = SP_BOOST && d < SP_BOOST.z[3] ? boostExtra(d) - BOOST_TAIL*(d/SP_BOOST.z[3]) : 0;
  return Math.min(SPREAD*d + (SP_OUT-SPREAD)*G + boost, 17.9);
}
function warpKm(x,y){ const d=Math.hypot(x,y); if(d<1e-6) return {x:0,y:0}; const k=spreadDist(d)/d; return {x:x*k, y:y*k}; }
function warpPts(pts){ return pts.map(([x,y])=>{ const w=warpKm(x,y); return [w.x,w.y]; }); }

// Mutable runtime copies; contributor-facing data stays in city/taipei.js.
const MOUNTAINS = CITY.terrain.mountains.map(({at:[x,y], height:h, radiusKm:r})=>({x,y,h,r}));
const GRADED_SITES = CITY.terrain.gradedSites.map(({at:[x,y], innerKm:inner, outerKm:outer, height:target})=>{
  const w=warpKm(x,y); return {x:w.x,y:w.y,inner,outer,target};
});
const RIVERS = CITY.terrain.waterways.map(({halfWidthKm:w,path:pts})=>({w,pts:pts.map(point=>point.slice())}));
function riverCarve(x,y){ let c=0; for(let i=0;i<RIVERS.length;i++){ const d=polyDist(x,y,RIVERS[i].pts); c=Math.max(c, 1-THREE.MathUtils.smoothstep(d,0,RIVERS[i].w*2.0)); } return c; }
// (the sea is now the antipodal ocean cap in terrain() — beyond the outer ranges the
//  far pole is open water, with a bay dipping in from the NW where the Tamsui exits)

function terrain(dir){
  const m=dirToMap(dir);
  let h=BASIN;
  // compactly-supported mountain bumps — zero beyond M.r so the basin stays dead flat
  for(let i=0;i<MOUNTAINS.length;i++){ const M=MOUNTAINS[i]; const dx=m.x-M.x, dy=m.y-M.y; const d=Math.hypot(dx,dy);
    if(d<M.r){ const t=1-THREE.MathUtils.smoothstep(d,0,M.r); h += M.h*t*t; } }
  // outer highland rim: past the spread-out suburbs the Greater-Taipei ranges ring
  // the far pole (the named bumps above carry the real ranges; this fills the gaps).
  // Both the rim and the ocean edge pull aside toward the NW bearing, opening a bay
  // where the Tamsui exits to the strait.
  let bay=0;
  if(m.dist>75){ const dk=Math.hypot(m.x,m.y); if(dk>1e-3) bay=Math.max(0,(-0.66*m.x+0.75*m.y)/dk); bay*=bay; }
  const rim=THREE.MathUtils.smoothstep(m.dist, 110, 120)*(1-THREE.MathUtils.smoothstep(m.dist, 120, 126));
  h += rim*5.0*(1-0.75*bay);
  const c=riverCarve(m.x,m.y);                                 // gentle river valley (stays above sea level)
  if(c>0) h=THREE.MathUtils.lerp(h, 0.82, c*0.92);
  const cap=THREE.MathUtils.smoothstep(m.dist, 119-9*bay, 125-5*bay);   // antipodal ocean
  if(cap>0) h=THREE.MathUtils.lerp(h, -2.4, cap);
  for(const s of GRADED_SITES){
    const d=Math.hypot(m.x-s.x,m.y-s.y);
    if(d<s.outer){ const w=1-THREE.MathUtils.smoothstep(d,s.inner,s.outer); h=THREE.MathUtils.lerp(h,s.target,w); }
  }
  // landmark ground pads (registered below, before the planet mesh samples this):
  // inside a footprint the ground follows the landmark's tangent PLANE — altitude
  // rises d²/2R to cancel the globe's curvature — then eases back to the terrain.
  for(let i=0;i<PADS.length;i++){ const p=PADS[i];
    const du=Math.hypot(m.x-p.x,m.y-p.y)*KM;                     // surface units from the pad centre
    if(du<p.outer){
      const plane=p.h0 + du*du/(2*(R+p.h0));                     // the centre's tangent plane
      let w=1-THREE.MathUtils.smoothstep(du,p.inner,p.outer);
      if(c>0.12) w*=1-THREE.MathUtils.smoothstep(c,0.12,0.45);   // never pave a river shut
      const t=THREE.MathUtils.lerp(h,plane,w);
      if(t>h) h=t;                                               // pads only ever raise ground
    }
  }
  return h;
}
function groundR(dir){ return R + Math.max(terrain(dir), WATER-0.6); }

// build planet mesh (icosphere) with displacement + Taipei land-use vertex colors
const COL = {
  sea:new THREE.Color('#3f9fb0'), seabed:new THREE.Color('#62b6bc'), river:new THREE.Color('#5ec4cc'),
  urban:new THREE.Color('#c6bfae'), urban2:new THREE.Color('#b3ab9a'),   // warm pale pavement — streets read, not mud
  park:new THREE.Color('#76b85a'), park2:new THREE.Color('#5fa84e'),
  forest:new THREE.Color('#4f8f48'), forest2:new THREE.Color('#3a6b38'),
  rock:new THREE.Color('#9b988a'), sand:new THREE.Color('#e0d3aa')
};
const PARKS = CITY.spaces.parks.map(({at:[x,y],radiusKm:r})=>({x,y,r}));
function parkWeight(x,y){ let w=0; for(let i=0;i<PARKS.length;i++){ const p=PARKS[i]; const d=Math.hypot(x-p.x,y-p.y); w=Math.max(w, 1-THREE.MathUtils.smoothstep(d,0,p.r)); } return w; }

const DISTRICTS = CITY.districts.map(({at:[x,y],radiusKm:r,density:d})=>({x,y,r,d}));
function cityDensity(x,y){ let w=0; for(let i=0;i<DISTRICTS.length;i++){ const D=DISTRICTS[i]; const d=Math.hypot(x-D.x,y-D.y); w=Math.max(w, D.d*(1-THREE.MathUtils.smoothstep(d,D.r*0.5,D.r))); } return w; }

const BLVD = CITY.roads.map(({id,name,widthKm:w,path:pts})=>({id,name,w,pts:pts.map(point=>point.slice())}));
function roadDist(x,y){ let m=1e9; for(let i=0;i<BLVD.length;i++){ const d=polyDist(x,y,BLVD[i].pts); if(d<m)m=d; } return m; }

// ---- SPREAD the authored real-km layout around the whole globe (see spreadDist).
// Positions move outward keeping their true bearings; widths/radii of local
// features stay physical. Mountain radii grow with the local stretch (capped) so
// the ranges stay contiguous. LANDMARKS/SHOPS/MRT/gondola/spawn warp at their
// own build sites. Runs ONCE, before the planet mesh samples terrain().
for(const M of MOUNTAINS){ const d=Math.hypot(M.x,M.y)||1e-4; const w=warpKm(M.x,M.y);
  M.x=w.x; M.y=w.y; M.r*=Math.min(spreadDist(d)/d, 1.55); }
for(const Rv of RIVERS) Rv.pts=warpPts(Rv.pts);
// parks + district fields scale WITH the spread (a district's reach must grow as its
// neighbours move away, or the city separates into pin-prick hamlets); park growth is
// gentler, and district reach is clamped so no urban field climbs the far rim.
for(const p of PARKS){ const d=Math.hypot(p.x,p.y)||1e-4; const w=warpKm(p.x,p.y);
  p.x=w.x; p.y=w.y; p.r*=Math.min(spreadDist(d)/d, 1.5); }
for(const D of DISTRICTS){ const d=Math.hypot(D.x,D.y)||1e-4; const w=warpKm(D.x,D.y);
  D.x=w.x; D.y=w.y;
  const dW=Math.hypot(w.x,w.y);
  D.r=Math.min(D.r*Math.min(spreadDist(d)/d, 1.9), Math.max(0.9,(16.0-dW)/0.55)); }
for(const Rd of BLVD) Rd.pts=warpPts(Rd.pts);

// ---- landmark ground pads. Landmark positions are final here (warp + de-clump
// use pure geometry, no terrain), so terrain() can rise to meet every building
// BEFORE the planet mesh samples it. A flat-authored base touches a sphere only
// at its centre: the edges of a W-wide footprint would hang ≈W²/8R in the air
// (waist-high under the CKS gate). Instead of bending models or hiding the gap
// under fake foundations, the ground itself lifts to the model's tangent plane
// across the footprint and eases back to the basin beyond it. Player, planet
// mesh, roads and props all read the same terrain(), so the whole world agrees
// on the new grade — for every current and future landmark.
const LANDMARKS = CITY.landmarks.map(({builder,at:[x,y],name,placement})=>[
  LM[builder], x, y, {...placement,label:name}
]);
// De-clump: even after the globe spread, the Xinyi cluster (101 / City Hall / SYS)
// packs monuments closer than their model footprints. Nudge any pair whose
// footprints overlap apart along their connecting line — keeping each landmark's
// real bearing from the rest. Distances are measured as TRUE surface arcs (the
// flat-km chart under-measures east–west gaps far from the pole). Taipei 101
// stays pinned at the city-centre pole so the whole layout doesn't drift.
const SEP = parseFloat(new URLSearchParams(location.search).get('sep')) || 1.05;  // target gap = SEP*(foot_i+foot_j)
function declump(list){
  const p = list.map(L=>({x:L[1], y:L[2], r:(L[3].foot||L[3].ar)}));   // footprint radius in world units
  const authored=p.map(q=>({x:q.x,y:q.y}));
  const pin = list.findIndex(L=>L[3].pin);
  for(let it=0; it<240; it++){
    const dirs=p.map(q=>mapDir(q.x,q.y));
    const fx=p.map(()=>0), fy=p.map(()=>0);
    for(let i=0;i<p.length;i++) for(let j=i+1;j<p.length;j++){
      const arc=dirs[i].angleTo(dirs[j])*R;                            // true surface distance (units)
      const need=(p[i].r+p[j].r)*SEP;
      if(arc<need){
        const dx=p[j].x-p[i].x, dy=p[j].y-p[i].y, d=Math.hypot(dx,dy)||1e-4;
        const k=(need-arc)/KM*0.5/d;                                   // km push along the connecting line
        fx[i]-=dx*k; fy[i]-=dy*k; fx[j]+=dx*k; fy[j]+=dy*k;
      }
    }
    for(let i=0;i<p.length;i++){ p[i].x+=fx[i]; p[i].y+=fy[i]; }
    if(pin>=0){ const ox=p[pin].x, oy=p[pin].y; for(const q of p){ q.x-=ox; q.y-=oy; } }  // re-anchor Taipei 101
  }
  // Keep hilltop landmarks centred on the terrain terraces already sampled
  // into the planet mesh; nearby footprint changes must not push them off-grade.
  list.forEach((L,i)=>{ if(L[3].terrainPin){ p[i].x=authored[i].x; p[i].y=authored[i].y; } });
  list.forEach((L,i)=>{ L[1]=p[i].x; L[2]=p[i].y; });
}
for(const L of LANDMARKS){ const w=warpKm(L[1],L[2]); L[1]=w.x; L[2]=w.y; }   // real km → globe-spread km
declump(LANDMARKS);
const PADS=[];
PADS.push(...LANDMARKS.map(([,x,y,opts])=>{                // h0 sampled with PADS still empty: pads never stack
  const sc=opts.scale||1;
  let reach=opts.foot||opts.ar||2;                         // plateau must cover the farthest wall/pier
  for(const c of opts.cols||[]) reach=Math.max(reach,(Math.hypot(c.x,c.z)+c.r)*sc);
  const inner=reach+0.5, h0=terrain(mapDir(x,y));
  const drop=inner*inner/(2*(R+h0));                       // plateau-edge height above the basin
  return {x, y, inner, outer:inner+Math.max(1.8,drop*3.2), h0,
          col:new THREE.Color(typeof opts.base==='string'?opts.base:'#dcd6c8')};
}));
// paving weight/colour of the strongest pad at a map point (for planet-mesh tint)
function padPave(m){
  let w=0, col=null;
  for(let i=0;i<PADS.length;i++){ const p=PADS[i];
    const du=Math.hypot(m.x-p.x,m.y-p.y)*KM;
    const wi=1-THREE.MathUtils.smoothstep(du, p.inner, p.outer-0.9);  // paving stops short of the grass bank
    if(wi>w){ w=wi; col=p.col; }
  }
  return w>0.02?{w,col}:null;
}

let planetMesh;
{
  const geo = new THREE.IcosahedronGeometry(R, 48);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count*3);
  const tmp=new THREE.Vector3(), c=new THREE.Color(), c2=new THREE.Color();
  for(let i=0;i<pos.count;i++){
    tmp.set(pos.getX(i),pos.getY(i),pos.getZ(i)).normalize();
    const h = terrain(tmp);
    const r = R + Math.max(h, WATER-0.6);
    pos.setXYZ(i, tmp.x*r, tmp.y*r, tmp.z*r);
    const m=dirToMap(tmp);
    const rc=riverCarve(m.x,m.y), pw=parkWeight(m.x,m.y);
    if(h < WATER+0.06){ const dep=THREE.MathUtils.clamp((WATER-h)/1.6,0,1); c.copy(COL.seabed).lerp(COL.sea,dep); }
    else if(rc>0.42 && h<2.0){ c.copy(COL.river); }                       // river water
    else if(h < 2.0){
      if(pw>0.45) c.copy(COL.park).lerp(COL.park2,(Math.sin(tmp.x*40+tmp.z*30)*0.5+0.5)*0.55);
      else { c.copy(COL.urban).lerp(COL.urban2,(Math.sin(tmp.x*55)*Math.sin(tmp.z*55)*0.5+0.5));
             // the spread opens real country between districts — grass it, so each
             // town reads as its own patch on the globe instead of one beige shell
             const open=1-THREE.MathUtils.smoothstep(cityDensity(m.x,m.y),0.06,0.26);
             if(open>0){ c2.copy(COL.park).lerp(COL.park2,(Math.sin(tmp.x*40+tmp.z*30)*0.5+0.5)*0.55); c.lerp(c2,open*0.9); }
             if(h<WATER+0.5) c.lerp(COL.sand,0.55); }                     // coast / riverbank
    }
    else if(h < 5.0){ c.copy(COL.forest).lerp(COL.forest2, THREE.MathUtils.clamp((h-2.0)/3.0,0,1)); }
    else { c.copy(COL.forest2).lerp(COL.rock, THREE.MathUtils.clamp((h-5.0)/3.0,0,1)); }
    // landmark pads read as paved plazas: tint the raised ground itself
    if(h>WATER+0.3 && rc<0.42){ const pp=padPave(m); if(pp) c.lerp(pp.col, pp.w*0.85); }
    colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  const mat = toon('#ffffff', { vertexColors:true, gradientMap:GRAD_SOFT });
  planetMesh = new THREE.Mesh(geo, mat);
  planetMesh.castShadow = true; planetMesh.receiveShadow = true;
  planetGroup.add(planetMesh);
}
// ocean shell (translucent toon sphere at sea level)
{
  const oGeo = new THREE.IcosahedronGeometry(R + WATER + 0.18, 40);
  const oMat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uTime:{value:0},
      cShallow:{value:new THREE.Color('#8fe0dd')}, cMid:{value:new THREE.Color('#5ac3c6')}, cDeep:{value:new THREE.Color('#2f9bb0')},
      cFoam:{value:new THREE.Color('#eafbf9')}, cSky:{value:new THREE.Color('#bfe9e2')},
      uOpacity:{value:0.9}, uSunDir:{value:new THREE.Vector3(0.5,0.8,0.35).normalize()} },
    vertexShader:`uniform float uTime; varying vec3 vWorldPos; varying vec3 vWorldNrm; varying vec3 vObjDir;
      float ripple(vec3 d,float t){ float w1=sin(d.x*9.0+d.z*7.0+t*0.85); float w2=sin(d.z*13.0-d.y*5.0+t*0.55+1.7); return w1*0.032+w2*0.020; }
      void main(){ vec3 nObj=normalize(position); vObjDir=nObj; float h=ripple(nObj,uTime); vec3 dispPos=position+nObj*h;
        vec3 ta=normalize(cross(nObj,vec3(0.0,1.0,0.0)+1e-4)); vec3 tb=normalize(cross(nObj,ta)); float e=0.06;
        float hA=ripple(normalize(nObj+ta*e),uTime); float hB=ripple(normalize(nObj+tb*e),uTime);
        vec3 perturbed=normalize(nObj-ta*(hA-h)*6.0-tb*(hB-h)*6.0);
        vec4 wp=modelMatrix*vec4(dispPos,1.0); vWorldPos=wp.xyz; vWorldNrm=normalize(mat3(modelMatrix)*perturbed);
        gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader:`uniform float uTime; uniform vec3 cShallow,cMid,cDeep,cFoam,cSky; uniform float uOpacity; uniform vec3 uSunDir;
      varying vec3 vWorldPos; varying vec3 vWorldNrm; varying vec3 vObjDir;
      float band(float x,float steps){ return floor(x*steps)/steps; }
      void main(){ vec3 N=normalize(vWorldNrm); vec3 V=normalize(cameraPosition-vWorldPos);
        float fres=clamp(1.0-max(dot(N,V),0.0),0.0,1.0);
        float depthT=band(1.0-fres,4.0); vec3 col=mix(cDeep,cMid,smoothstep(0.0,0.55,depthT)); col=mix(col,cShallow,smoothstep(0.5,1.0,depthT));
        float up=band(clamp(N.y*0.5+0.5,0.0,1.0),4.0); col=mix(col,cSky,up*0.12);
        vec3 H=normalize(uSunDir+V); float spec=pow(max(dot(N,H),0.0),24.0);
        float shimmer=0.5+0.5*sin(uTime*0.6+vWorldPos.x*1.5+vWorldPos.z*1.3); spec*=0.6+0.4*shimmer;
        float specBand=step(0.35,spec)*0.6+step(0.7,spec)*0.4; col=mix(col,cFoam,specBand*0.6);
        float foam=band(smoothstep(0.62,0.9,fres),3.0); foam*=0.75+0.25*sin(uTime*0.9+vObjDir.x*18.0+vObjDir.z*16.0); col=mix(col,cFoam,clamp(foam,0.0,1.0)*0.85);
        float alpha=uOpacity*(0.86+0.14*fres); gl_FragColor=vec4(pow(max(col,0.0),vec3(2.2)),alpha); }`
  });
  windMats.push(oMat.uniforms);
  const ocean = new THREE.Mesh(oGeo, oMat); ocean.renderOrder = 1; ocean.frustumCulled = false;
  planetGroup.add(ocean);
}

// ---------------------------------------------------------------
//  ORIENT-TO-SURFACE HELPER
// ---------------------------------------------------------------
const UPY = new THREE.Vector3(0,1,0);
function placeOnSurface(obj, dir, extra=0, spin=0){
  dir = dir.clone().normalize();
  obj.position.copy(dir).multiplyScalar(groundR(dir)+extra);
  obj.quaternion.setFromUnitVectors(UPY, dir);
  if(spin) obj.rotateY(spin);
}
// place at `dir`, oriented so the object's local +Z faces along the surface
// toward `faceDir` (a world vector). Used to aim the shophouse fronts at their street.
function placeFacing(obj, dir, faceDir, extra=0){
  dir = dir.clone().normalize();
  obj.position.copy(dir).multiplyScalar(groundR(dir)+extra);
  const up = dir;
  let fwd = faceDir.clone().addScaledVector(up, -faceDir.dot(up));
  if(fwd.lengthSq() < 1e-6){ fwd.set(0,0,1).addScaledVector(up,-up.z); }
  fwd.normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
}
// A flat-bottomed object placed by placeOnSurface only touches the globe at its centre
// point: its base is a chord, so on a curved/sloping spot the footprint's downhill corners
// float above the ground. footingSink() returns how far to drop that flat base (a buried
// "foundation skirt") so no corner floats — i.e. the gap from the base plane down to the
// LOWEST ground under a footprint of horizontal half-extent `reach` (units).
const _fsN=new THREE.Vector3(), _fsE=new THREE.Vector3(), _fsT=new THREE.Vector3(), _fsD=new THREE.Vector3();
function footingSink(dir, reach){
  const gr=groundR(dir);
  _fsN.set(0,0,1).addScaledVector(dir,-dir.z);                 // a tangent at dir
  if(_fsN.lengthSq()<1e-6){ _fsN.set(1,0,0).addScaledVector(dir,-dir.x); }
  _fsN.normalize();
  _fsE.crossVectors(_fsN,dir).normalize();
  const flatR=Math.hypot(gr,reach);                            // radial dist of a flat-base corner
  let drop=0;
  for(let a=0;a<8;a++){ const th=a/8*Math.PI*2;
    _fsT.copy(_fsE).multiplyScalar(Math.cos(th)*reach).addScaledVector(_fsN,Math.sin(th)*reach);
    _fsD.copy(dir).multiplyScalar(gr).add(_fsT).normalize();
    const g=flatR-groundR(_fsD);                               // >0: this corner floats above ground
    if(g>drop) drop=g;
  }
  return drop;
}
function isLand(dir){ return terrain(dir) > WATER+0.5; }
// open water the player must not walk onto: the sea/bay and the river channels (beaches & banks stay walkable)
function isWater(dir){ const h=terrain(dir); if(h < WATER+0.12) return true;
  const m=dirToMap(dir); return riverCarve(m.x,m.y) > 0.5 && h < 1.7; }
function fibSphere(n,i){ const ga=Math.PI*(3-Math.sqrt(5)); const y=1-(i/(n-1))*2; const r=Math.sqrt(1-y*y); const t=ga*i; return new THREE.Vector3(Math.cos(t)*r, y, Math.sin(t)*r); }
// ---- flat blob shadows (cel look — replaces shadow maps) ----
const blobShadowGeo=new THREE.CircleGeometry(0.5,18); blobShadowGeo.rotateX(-Math.PI/2); blobShadowGeo.translate(0,0.03,0);
const blobShadowMat=new THREE.MeshBasicMaterial({color:'#20302c',transparent:true,opacity:0.16,depthWrite:false});
function addBlobShadow(group, r=0.55){ const m=new THREE.Mesh(blobShadowGeo,blobShadowMat); m.scale.set(r/0.5,1,r/0.5); group.add(m); return m; }
// shared occupancy so props/NPCs/cat/campfire never overlap inappropriately
const occupied=[];
function freeSpot(dir, rad){ for(let i=0;i<occupied.length;i++){ if(dir.angleTo(occupied[i].dir) < (rad+occupied[i].rad)/R) return false; } return true; }
function claim(dir, rad){ occupied.push({dir:dir.clone(), rad}); }

// ---------------------------------------------------------------
//  PROPS: trees, rocks (instanced) + houses
// ---------------------------------------------------------------
function buildTrees(){
  const windInject = (sh, amount, twist)=>{
    sh.uniforms.uTime={value:0}; windMats.push(sh.uniforms);
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\n'+
      ' vec3 _ip=vec3(instanceMatrix[3].x,instanceMatrix[3].y,instanceMatrix[3].z);\n'+
      ' float _ph=uTime*1.25 + _ip.x*0.5 + _ip.z*0.5;\n'+
      ' float _sw=clamp(position.y,0.0,4.0)*'+amount.toFixed(3)+';\n'+
      ' transformed.x += sin(_ph)*_sw;\n'+
      ' transformed.z += cos(_ph*0.9)*_sw*0.85;\n'+
      ' transformed.x += sin(_ph*0.5)*'+twist.toFixed(3)+';\n'+
      '#endif'); };
  const trunkGeo = faceted(new THREE.CylinderGeometry(0.10,0.17,1.0,6)); trunkGeo.translate(0,0.5,0);
  const blobGeo  = faceted(new THREE.IcosahedronGeometry(0.6,1));
  const coneGeo  = faceted(new THREE.ConeGeometry(0.62,1.15,7)); coneGeo.translate(0,0.30,0);
  const trunkMat = toon('#8a6243');
  const leafMat = toon('#ffffff'); const pineMat = toon('#ffffff');
  leafMat.onBeforeCompile = (sh)=> windInject(sh, 0.022, 0.020);
  pineMat.onBeforeCompile = (sh)=> windInject(sh, 0.012, 0.010);
  const slots=[]; const N=620;
  for(let i=0;i<N;i++){
    const d=fibSphere(N,i); d.x+=rand(-0.05,0.05); d.y+=rand(-0.05,0.05); d.z+=rand(-0.05,0.05); d.normalize();
    const h=terrain(d);
    if(h>WATER+0.7 && h<3.0 && rng()<0.5 && freeSpot(d,0.45)){ claim(d,0.45);
      let arch; const r=rng();
      if(h>2.1) arch = r<0.62 ? 1 : (r<0.85 ? 0 : 2);
      else      arch = r<0.52 ? 0 : (r<0.78 ? 2 : 1);
      slots.push({d, arch}); }
  }
  const COUNT=slots.length;
  let nBlob=0, nCone=0;
  for(const s of slots){ if(s.arch===0) nBlob+=3; else if(s.arch===1) nCone+=3; else nBlob+=2; }
  const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,COUNT);
  const blobs=new THREE.InstancedMesh(blobGeo,leafMat,Math.max(1,nBlob));
  const cones=new THREE.InstancedMesh(coneGeo,pineMat,Math.max(1,nCone));
  trunks.castShadow=blobs.castShadow=cones.castShadow=true; trunks.receiveShadow=blobs.receiveShadow=cones.receiveShadow=true;
  const dummy=new THREE.Object3D();
  const greens=['#6fb85a','#5aa84b','#7cc06a','#519a45','#83c66e'];
  const pineCols=['#519a45','#4f8f48','#5aa84b','#458a3e'];
  const cc=new THREE.Color();
  const blobColArr=new Float32Array(Math.max(1,nBlob)*3); const coneColArr=new Float32Array(Math.max(1,nCone)*3);
  let bi=0, ci=0;
  for(let i=0;i<COUNT;i++){
    const {d, arch}=slots[i];
    if(arch===1){
      const s=rand(0.7,1.05); const th=rand(2.0,2.8)*s;
      placeOnSurface(dummy,d,0,rand(0,6.28)); dummy.scale.set(s*0.8, th, s*0.8); dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix); colliders.push({dir:d.clone(), ar:(0.24*s)/R});
      const cg=pick(pineCols); const base=th*0.55;
      for(let k=0;k<3;k++){ placeOnSurface(dummy, d, base + k*0.62*s, rand(0,6.28));
        const cs=s*(1.25 - k*0.30); dummy.scale.set(cs, cs*1.25, cs); dummy.updateMatrix(); cones.setMatrixAt(ci, dummy.matrix);
        cc.set(cg).offsetHSL(0, rand(-0.03,0.03), rand(-0.05,0.04)); coneColArr[ci*3]=cc.r; coneColArr[ci*3+1]=cc.g; coneColArr[ci*3+2]=cc.b; ci++; }
    } else {
      const bush = arch===2; const s = bush ? rand(0.5,0.72) : rand(0.66,1.05); const th=(bush?rand(0.5,0.8):rand(1.0,1.55))*s;
      placeOnSurface(dummy,d,0,rand(0,6.28)); dummy.scale.set(s, th, s); dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix); colliders.push({dir:d.clone(), ar:(0.28*s)/R});
      const cg=pick(greens); const tiers=bush?2:3; const base=th+0.18*s; const step=bush?0.30:0.40;
      for(let k=0;k<tiers;k++){ placeOnSurface(dummy, d, base + k*step*s, rand(0,6.28));
        const ls=s*((bush?1.05:1.0) - k*0.20); dummy.scale.set(ls, ls*(bush?0.92:1.0), ls); dummy.updateMatrix(); blobs.setMatrixAt(bi, dummy.matrix);
        cc.set(cg).offsetHSL(0, rand(-0.03,0.03), rand(-0.05,0.05)); blobColArr[bi*3]=cc.r; blobColArr[bi*3+1]=cc.g; blobColArr[bi*3+2]=cc.b; bi++; }
    }
  }
  blobs.instanceColor=new THREE.InstancedBufferAttribute(blobColArr,3); blobs.instanceColor.needsUpdate=true;
  cones.instanceColor=new THREE.InstancedBufferAttribute(coneColArr,3); cones.instanceColor.needsUpdate=true;
  planetGroup.add(trunks); planetGroup.add(blobs); planetGroup.add(cones);
}
/* buildTrees(): replaced by buildMountainGreenery() — forests live on the hills, not the city */
function buildGroundCover(){
  const dummy=new THREE.Object3D(); const cc=new THREE.Color();
  const grassWeight=(d)=>{ const h=terrain(d); if(h<=WATER+0.55 || h>=3.2) return 0; let w=1;
    w *= THREE.MathUtils.smoothstep(h, WATER+0.55, WATER+1.3); w *= 1 - THREE.MathUtils.smoothstep(h, 2.4, 3.2); return w; };
  const ta=new THREE.Vector3(), tb=new THREE.Vector3(), refUp=new THREE.Vector3(0,1,0);
  const flatness=(d)=>{ let t1=new THREE.Vector3().crossVectors(d, refUp); if(t1.lengthSq()<1e-4) t1.set(1,0,0); t1.normalize();
    const t2=new THREE.Vector3().crossVectors(d,t1).normalize(); const e=0.04, h0=terrain(d);
    ta.copy(d).addScaledVector(t1,e).normalize(); tb.copy(d).addScaledVector(t2,e).normalize();
    const g=Math.abs(terrain(ta)-h0)+Math.abs(terrain(tb)-h0); return THREE.MathUtils.clamp(1 - g*3.5, 0, 1); };
  const grassWind=(sh)=>{ sh.uniforms.uTime={value:0}; windMats.push(sh.uniforms);
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec3 _ip=vec3(instanceMatrix[3].x,instanceMatrix[3].y,instanceMatrix[3].z);\n float _ph=uTime*1.7 + _ip.x*0.9 + _ip.z*0.9;\n float _b=clamp(position.y,0.0,1.0);\n transformed.x += sin(_ph)*0.05*_b; transformed.z += cos(_ph*0.8)*0.04*_b;\n#endif'); };
  { const blade=()=>{ const g=new THREE.BufferGeometry(); const v=[]; const w=0.085, hh=0.30;
      for(let q=0;q<3;q++){ const a=q*Math.PI/3; const dx=Math.cos(a)*w, dz=Math.sin(a)*w;
        v.push(-dx,0,-dz,  dx,0,dz,  dx*0.25+Math.cos(a+1.2)*0.04, hh, dz*0.25+Math.sin(a+1.2)*0.04); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(v,3)); g.computeVertexNormals(); return g; };
    const geo=blade(); const mat=toon('#ffffff',{side:THREE.DoubleSide}); mat.onBeforeCompile=grassWind;
    const TARGET=8700, N=12200; const greens=['#6fb85a','#5aa84b','#7cc06a','#519a45','#83c66e','#74bd61']; const picks=[];
    for(let i=0;i<N && picks.length<TARGET;i++){ const d=fibSphere(N,i); d.x+=rand(-0.02,0.02); d.y+=rand(-0.02,0.02); d.z+=rand(-0.02,0.02); d.normalize();
      const w=grassWeight(d); if(w<=0) continue; const dens=w*(0.45+0.55*flatness(d)); if(rng()<dens) picks.push(d); }
    const C=picks.length; const inst=new THREE.InstancedMesh(geo,mat,C); inst.castShadow=false; inst.receiveShadow=true;
    const colArr=new Float32Array(C*3);
    for(let i=0;i<C;i++){ const d=picks[i]; const s=rand(0.75,1.5); placeOnSurface(dummy,d,-0.02,rand(0,6.28)); dummy.scale.set(s,rand(0.8,1.35)*s,s); dummy.updateMatrix(); inst.setMatrixAt(i,dummy.matrix);
      cc.set(pick(greens)).offsetHSL(0,rand(-0.04,0.04),rand(-0.06,0.05)); colArr[i*3]=cc.r; colArr[i*3+1]=cc.g; colArr[i*3+2]=cc.b; }
    inst.instanceColor=new THREE.InstancedBufferAttribute(colArr,3); planetGroup.add(inst); }
  { const stemGeo=faceted(new THREE.CylinderGeometry(0.012,0.018,0.22,4)); stemGeo.translate(0,0.11,0);
    const headGeo=faceted(new THREE.IcosahedronGeometry(0.07,0));
    const stemMat=toon('#5aa84b'); stemMat.onBeforeCompile=grassWind; const headMat=toon('#ffffff'); headMat.onBeforeCompile=grassWind;
    const TARGET=1740, N=9300; const flowers=['#fdfdf5','#ffd86b','#ff9ec2','#c9a8ff','#fdfdf5','#ffd86b']; const picks=[];
    for(let i=0;i<N && picks.length<TARGET;i++){ const d=fibSphere(N,i+0.61); const w=grassWeight(d); if(w<=0) continue; if(rng()<w*0.32*flatness(d)) picks.push(d); }
    const C=picks.length; const stems=new THREE.InstancedMesh(stemGeo,stemMat,C); const heads=new THREE.InstancedMesh(headGeo,headMat,C);
    stems.castShadow=heads.castShadow=false; const colArr=new Float32Array(C*3);
    for(let i=0;i<C;i++){ const d=picks[i]; const s=rand(0.7,1.25); const spin=rand(0,6.28);
      placeOnSurface(dummy,d,-0.01,spin); dummy.scale.set(s,s,s); dummy.updateMatrix(); stems.setMatrixAt(i,dummy.matrix);
      placeOnSurface(dummy,d,0.22*s,spin); dummy.scale.set(s,s*0.8,s); dummy.updateMatrix(); heads.setMatrixAt(i,dummy.matrix);
      cc.set(pick(flowers)).offsetHSL(0,rand(-0.02,0.02),rand(-0.03,0.03)); colArr[i*3]=cc.r; colArr[i*3+1]=cc.g; colArr[i*3+2]=cc.b; }
    heads.instanceColor=new THREE.InstancedBufferAttribute(colArr,3); planetGroup.add(stems); planetGroup.add(heads); }
  { const g=faceted(new THREE.DodecahedronGeometry(0.08,0)); const mat=toon('#ffffff');
    const TARGET=1450, N=6960; const stoneCols=['#b8b3a4','#a8a293','#c4bca8','#9b9384','#b0a48c']; const picks=[];
    for(let i=0;i<N && picks.length<TARGET;i++){ const d=fibSphere(N,i+0.13); const h=terrain(d); if(h<=WATER+0.2 || h>=3.4) continue; if(rng()<0.4) picks.push(d); }
    const C=picks.length; const inst=new THREE.InstancedMesh(g,mat,C); inst.castShadow=true; inst.receiveShadow=true; const colArr=new Float32Array(C*3);
    for(let i=0;i<C;i++){ const d=picks[i]; const s=rand(0.5,1.4); placeOnSurface(dummy,d,s*0.03,rand(0,6.28)); dummy.scale.set(s,s*rand(0.55,0.85),s); dummy.updateMatrix(); inst.setMatrixAt(i,dummy.matrix);
      cc.set(pick(stoneCols)).offsetHSL(0,rand(-0.02,0.02),rand(-0.05,0.05)); colArr[i*3]=cc.r; colArr[i*3+1]=cc.g; colArr[i*3+2]=cc.b; }
    inst.instanceColor=new THREE.InstancedBufferAttribute(colArr,3); planetGroup.add(inst); }
}

function buildRocks(){
  const geo=faceted(new THREE.DodecahedronGeometry(0.5,0));
  const mat=toon('#9b988a');
  const slots=[]; const N=260;
  for(let i=0;i<N;i++){ const d=fibSphere(N,i+0.5); const h=terrain(d); if(h>WATER+0.4 && rng()<0.4 && freeSpot(d,0.4)){ slots.push(d); claim(d,0.4); } }
  const inst=new THREE.InstancedMesh(geo,mat,slots.length); inst.castShadow=inst.receiveShadow=true;
  const dummy=new THREE.Object3D();
  slots.forEach((d,i)=>{ const s=rand(0.5,1.8); placeOnSurface(dummy,d,s*0.18,rand(0,6.28)); dummy.scale.set(s,s*rand(0.6,1),s); dummy.updateMatrix(); inst.setMatrixAt(i,dummy.matrix); if(s>0.7) colliders.push({dir:d.clone(), ar:(s*0.45)/R}); });
  planetGroup.add(inst);
}
/* buildRocks(): the Taipei basin is dense city, not scattered boulders */

// ---- cozy houses: 4 archetypes, shared helpers ----
const HGEO = { box:new THREE.BoxGeometry(1,1,1), cyl:new THREE.CylinderGeometry(1,1,1,10), sph:new THREE.SphereGeometry(1,10,8) };
function hPart(geo,mat,w,h,d,x,y,z){ const m=new THREE.Mesh(geo,mat); if(w!==undefined) m.scale.set(w,h,d); if(x!==undefined) m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m; }
function hBox(mat,w,h,d,x,y,z){ return hPart(HGEO.box,mat,w,h,d,x,y,z); }
function hCyl(mat,r,h,x,y,z){ return hPart(HGEO.cyl,mat,r,h,r,x,y,z); }
function hSph(mat,s,x,y,z){ return hPart(HGEO.sph,mat,s,s,s,x,y,z); }
function hGableRoof(mat,width,height,length){
  const w=width/2,h=height,l=length/2;
  const v=[[-w,0,l],[w,0,l],[0,h,l],[-w,0,-l],[w,0,-l],[0,h,-l]];
  const tris=[[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4]];
  const pos=[]; for(const t of tris) for(const idx of t) pos.push(...v[idx]);
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(faceted(g),mat); m.castShadow=true; m.receiveShadow=true; m.userData.apexH=h; m.userData.halfW=w; return m;
}
function hLayShingles(g,roof,eaveY,mat){ const hw=roof.userData.halfW, rise=roof.userData.apexH; const slope=Math.hypot(hw,rise);
  const rows=Math.max(2,Math.round(slope/0.24)); const ang=Math.atan2(rise,hw);
  for(const sx of [-1,1]){ for(let r=1;r<rows;r++){ const f=r/rows; const px=sx*hw*(1-f); const py=eaveY+rise*f+0.015;
    const slat=hBox(mat,0.05,0.018,hw*1.6,px,py,0); slat.rotation.z=sx*ang; g.add(slat); } } }
function hWindow(w,h,glow){ const grp=new THREE.Group(); const fm=MAT.wood; const gm=glow?MAT.glassGlow:MAT.glass; const t=0.07,d=0.10;
  grp.add(hBox(gm,w,h,0.04,0,0,d*0.4)); grp.add(hBox(fm,w+t*2,t,d,0,h/2+t/2,d/2)); grp.add(hBox(fm,w+t*2,t,d,0,-h/2-t/2,d/2));
  grp.add(hBox(fm,t,h+t*2,d,-w/2-t/2,0,d/2)); grp.add(hBox(fm,t,h+t*2,d,w/2+t/2,0,d/2));
  grp.add(hBox(fm,w,t*0.55,d*0.8,0,0,d*0.55)); grp.add(hBox(fm,t*0.55,h,d*0.8,0,0,d*0.55));
  grp.add(hBox(MAT.stone,w+t*3,0.06,d*1.3,0,-h/2-t,d*0.45)); return grp; }
function hDoor(w,h){ const grp=new THREE.Group(); grp.add(hBox(MAT.door,w,h,0.12,0,h/2,0.06)); const t=0.08;
  grp.add(hBox(MAT.wood,w+t*2,t,0.16,0,h+t/2,0.05)); grp.add(hBox(MAT.wood,t,h+t,0.16,-w/2-t/2,h/2,0.05)); grp.add(hBox(MAT.wood,t,h+t,0.16,w/2+t/2,h/2,0.05));
  grp.add(hBox(MAT.doorPanel,w*0.6,h*0.26,0.04,0,h*0.72,0.13)); grp.add(hBox(MAT.doorPanel,w*0.6,h*0.26,0.04,0,h*0.36,0.13));
  grp.add(hSph(MAT.brass,0.06,w*0.32,h*0.45,0.15)); grp.add(hBox(MAT.stone,w*1.7,0.12,0.4,0,0.06,0.22)); return grp; }
function hChimney(x,y,z,height){ const grp=new THREE.Group(); const w=0.42,d=0.42,h=height;
  grp.add(hBox(MAT.brick,w,h,d,0,h/2,0)); grp.add(hBox(MAT.brickDark,w*1.05,0.06,d*1.05,0,h*0.35,0)); grp.add(hBox(MAT.brickDark,w*1.05,0.06,d*1.05,0,h*0.7,0));
  grp.add(hBox(MAT.stone,w*1.18,0.12,d*1.18,0,h+0.06,0)); grp.add(hCyl(MAT.terracotta,0.12,0.34,0,h+0.24,0));
  grp.position.set(x,y,z); return { grp, topLocal:new THREE.Vector3(x,y+h+0.42,z) }; }
function hFlowerBox(x,y,z){ const grp=new THREE.Group(); grp.add(hBox(MAT.wood,0.66,0.16,0.18,0,0,0)); grp.add(hBox(MAT.soil,0.6,0.1,0.13,0,0.06,0));
  const cols=[MAT.flowerA,MAT.flowerB,MAT.flowerC]; for(let i=0;i<5;i++){ const fx=-0.24+i*0.12; grp.add(hCyl(MAT.leaf,0.02,0.16,fx,0.16,0)); grp.add(hSph(pick(cols),0.07,fx,0.26,0)); }
  grp.position.set(x,y,z); return grp; }
function hBarrel(x,y,z){ const grp=new THREE.Group(); grp.add(hCyl(MAT.wood,0.26,0.46,0,0.23,0)); grp.add(hCyl(MAT.brickDark,0.275,0.05,0,0.12,0)); grp.add(hCyl(MAT.brickDark,0.275,0.05,0,0.34,0)); grp.add(hCyl(MAT.water,0.22,0.02,0,0.45,0)); grp.position.set(x,y,z); return grp; }
function hLantern(x,y,z){ const grp=new THREE.Group(); grp.add(hBox(MAT.iron,0.05,0.05,0.34,0,0,-0.15)); grp.add(hCyl(MAT.iron,0.015,0.16,0,-0.1,0));
  grp.add(hBox(MAT.glassGlow,0.14,0.18,0.14,0,-0.27,0)); grp.add(hBox(MAT.iron,0.17,0.04,0.17,0,-0.37,0)); grp.add(hBox(MAT.iron,0.16,0.04,0.16,0,-0.17,0)); grp.position.set(x,y,z); return grp; }
function hMat(x,y,z){ return hBox(MAT.mat,0.7,0.04,0.38,x,y,z); }
function hFenceGate(x,y,z,span){ const grp=new THREE.Group(); const n=Math.max(3,Math.round(span/0.28));
  for(let i=0;i<=n;i++){ const px=-span/2+(span/n)*i; if(Math.abs(px)<span*0.16) continue; grp.add(hBox(MAT.fence,0.06,0.4,0.06,px,0.2,0)); }
  grp.add(hBox(MAT.fence,span,0.05,0.05,0,0.12,0)); grp.add(hBox(MAT.fence,span,0.05,0.05,0,0.3,0));
  grp.add(hBox(MAT.fence,0.07,0.46,0.07,-span*0.16,0.23,0)); grp.add(hBox(MAT.fence,0.07,0.46,0.07,span*0.16,0.23,0)); grp.position.set(x,y,z); return grp; }
function hIvy(x,z,halfW,height){ const grp=new THREE.Group(); const n=randi(10,16); for(let i=0;i<n;i++){ const lx=rand(-halfW,halfW); const ly=rand(0,height); const s=rand(0.09,0.17); grp.add(hSph(pick([MAT.leaf,MAT.leafDark]),s,lx,ly,z+rand(0,0.05))); } grp.position.set(x,0,0); return grp; }
function hAwning(x,y,z,w){ const grp=new THREE.Group(); const depth=0.5,drop=0.2; const stripes=Math.max(4,Math.round(w/0.26)); const sw=w/stripes;
  for(let i=0;i<stripes;i++){ const mat=(i%2===0)?MAT.awningA:MAT.awningB; const sx=-w/2+sw*(i+0.5); const top=hBox(mat,sw*0.98,0.04,depth,sx,0,depth/2); top.rotation.x=-0.5; grp.add(top); grp.add(hBox(mat,sw*0.98,drop,0.04,sx,-drop/2-0.05,depth*0.92)); }
  grp.position.set(x,y,z); return grp; }
function hHangingSign(x,y,z){ const grp=new THREE.Group(); grp.add(hBox(MAT.iron,0.05,0.05,0.5,0,0,0.25)); grp.add(hBox(MAT.iron,0.05,0.05,0.05,0,0,0.5));
  grp.add(hCyl(MAT.iron,0.012,0.12,0,-0.1,0.34)); grp.add(hCyl(MAT.iron,0.012,0.12,0,-0.1,0.5)); grp.add(hBox(MAT.sign,0.5,0.34,0.05,0,-0.32,0.42));
  grp.add(hBox(MAT.signInk,0.3,0.05,0.02,0,-0.28,0.46)); grp.add(hBox(MAT.signInk,0.34,0.05,0.02,0,-0.38,0.46)); grp.position.set(x,y,z); return grp; }
function hAddCozyDetails(g,frontZ,w,doorX,wallTopY,glowPos){
  if(rng()<0.85 && doorX!==null) g.add(hMat(doorX,0.02,frontZ+0.32));
  if(glowPos && rng()<0.6) g.add(hFlowerBox(glowPos.x,glowPos.y-0.36,frontZ+0.12));
  if(rng()<0.5) g.add(hBarrel(-w/2+0.3,0,frontZ-0.1));
  if(rng()<0.55 && doorX!==null) g.add(hLantern(doorX+0.55,wallTopY*0.7+0.4,frontZ+0.12));
  if(rng()<0.45) g.add(hIvy(rand(-w*0.2,w*0.2),frontZ+0.04,w*0.25,wallTopY*0.85));
  if(rng()<0.38) g.add(hFenceGate(0,0,frontZ+0.7,Math.min(w*1.05,3.3)));
}
let MAT=null;
function hInitMats(){ if(MAT) return; MAT={ wood:toon(0x8a6243), door:toon(0x7a4a3a), doorPanel:toon(0x8a5644), stone:toon(0xb9b2a4), brick:toon(0xb86a52), brickDark:toon(0x8f4e3c), terracotta:toon(0xe7b9a0), glass:toon(0xbfe3e0), glassGlow:toon(0xfff0c4,{emissive:0xffcf7a,emissiveIntensity:0.9}), brass:toon(0xd9b66a), iron:toon(0x3a3f47), soil:toon(0x5a4636), leaf:toon(0x5a6b52), leafDark:toon(0x47583f), flowerA:toon(0xdfa0a0), flowerB:toon(0xe9c97e), flowerC:toon(0xbf8fb5), water:toon(0x6f9fb0), mat:toon(0xc08a5a), fence:toon(0xe7ddc8), awningA:toon(0xdfa0a0), awningB:toon(0xf1e7d2), sign:toon(0xe9c97e), signInk:toon(0x4a4f5c) }; }
const HWALLS=[0xf1e7d2,0xe7b9a0,0xcdd9c0,0xe9c97e,0xdfa0a0]; const HROOFS=[0x4a4f5c,0x7a4a3a,0x5a6b52,0x37414b];
function hCottage(){ const g=new THREE.Group(); const wallMat=toon(pick(HWALLS)); const roofMat=toon(pick(HROOFS));
  const w=rand(2.0,2.5),d=rand(1.7,2.0),h=rand(1.05,1.25); const frontZ=d/2;
  g.add(hBox(MAT.stone,w*1.02,0.16,d*1.02,0,0.08,0)); g.add(hBox(wallMat,w,h,d,0,h/2,0));
  const rise=rand(0.95,1.1); const roof=hGableRoof(roofMat,w+0.5,rise,d+0.5); roof.position.y=h; g.add(roof);
  g.add(hBox(MAT.wood,0.12,0.1,d+0.5,0,h+rise,0)); for(const sx of [-1,1]) g.add(hBox(MAT.wood,0.06,0.08,d+0.52,sx*((w+0.5)/2),h+0.02,0));
  if(rng()<0.7) hLayShingles(g,roof,h,roofMat);
  const door=hDoor(0.62,1.0); const doorX=rand(-0.2,0.2); door.position.set(doorX,0,frontZ); g.add(door);
  const glowSide=pick([-1,1]); let glowPos=null;
  for(const sx of [-1,1]){ const wx=sx*(w*0.3); const glow=sx===glowSide; const win=hWindow(0.5,0.55,glow); win.position.set(wx,h*0.58,frontZ); g.add(win); if(glow) glowPos={x:wx,y:h*0.58}; }
  const sideWin=hWindow(0.45,0.5,rng()<0.3); sideWin.rotation.y=Math.PI/2; sideWin.position.set(w/2,h*0.58,rand(-0.3,0.3)); g.add(sideWin);
  const cx=(w*0.28)*pick([-1,1]); const {grp:chim,topLocal}=hChimney(cx,h+rise*0.45,rand(-0.3,0.3),rand(0.55,0.8)); g.add(chim); g.userData.chimney=topLocal;
  hAddCozyDetails(g,frontZ,w,doorX,h,glowPos); return g; }
function hTownhouse(){ const g=new THREE.Group(); const wallMat=toon(pick(HWALLS)); const roofMat=toon(pick(HROOFS));
  const w=rand(1.5,1.9),d=rand(1.4,1.7),h=rand(2.1,2.5); const frontZ=d/2;
  g.add(hBox(MAT.stone,w*1.03,0.18,d*1.03,0,0.09,0)); g.add(hBox(wallMat,w,h,d,0,h/2,0)); g.add(hBox(MAT.wood,w*1.02,0.1,d*1.02,0,h*0.5,0));
  for(const sx of [-1,1]) g.add(hBox(MAT.stone,0.12,h,0.12,sx*(w/2),h/2,frontZ-0.02));
  const rise=rand(0.6,0.78); const roof=hGableRoof(roofMat,w+0.4,rise,d+0.4); roof.position.y=h; g.add(roof); g.add(hBox(MAT.wood,0.1,0.09,d+0.4,0,h+rise,0));
  if(rng()<0.6) hLayShingles(g,roof,h,roofMat);
  const door=hDoor(0.6,1.05); door.position.set(w*0.22,0,frontZ); g.add(door); const doorX=w*0.22;
  let glowPos=null; { const win=hWindow(0.46,0.6,true); win.position.set(-w*0.28,h*0.28,frontZ); g.add(win); glowPos={x:-w*0.28,y:h*0.28}; }
  for(const sx of [-1,1]){ const glow=rng()<0.5; const win=hWindow(0.42,0.52,glow); win.position.set(sx*w*0.27,h*0.74,frontZ); g.add(win); if(glow && !glowPos) glowPos={x:sx*w*0.27,y:h*0.74}; }
  for(const sz of [-0.3,0.35]){ const sw=hWindow(0.36,0.46,rng()<0.25); sw.rotation.y=Math.PI/2; sw.position.set(w/2,h*0.74,sz); g.add(sw); }
  const cx=(w*0.22)*pick([-1,1]); const {grp:chim,topLocal}=hChimney(cx,h+rise*0.4,rand(-0.2,0.2),rand(0.7,0.95)); g.add(chim); g.userData.chimney=topLocal;
  hAddCozyDetails(g,frontZ,w,doorX,h,glowPos); return g; }
function hShop(){ const g=new THREE.Group(); const wallMat=toon(pick(HWALLS)); const roofMat=toon(pick(HROOFS));
  const w=rand(2.0,2.4),d=rand(1.6,1.9),h=rand(1.6,1.9); const frontZ=d/2;
  g.add(hBox(MAT.stone,w*1.02,0.16,d*1.02,0,0.08,0)); g.add(hBox(wallMat,w,h,d,0,h/2,0));
  const rise=rand(0.7,0.88); const roof=hGableRoof(roofMat,w+0.45,rise,d+0.45); roof.position.y=h; g.add(roof); g.add(hBox(MAT.wood,0.1,0.09,d+0.45,0,h+rise,0));
  if(rng()<0.6) hLayShingles(g,roof,h,roofMat);
  const shopWin=hWindow(1.0,0.9,true); shopWin.position.set(-w*0.22,h*0.5,frontZ); g.add(shopWin); const glowPos={x:-w*0.22,y:h*0.5};
  const door=hDoor(0.6,1.1); const doorX=w*0.3; door.position.set(doorX,0,frontZ); g.add(door);
  g.add(hAwning(-w*0.1,h*0.78,frontZ,w*0.9)); g.add(hHangingSign(w/2-0.08,h*0.88,frontZ));
  const up=hWindow(0.42,0.42,rng()<0.6); up.position.set(w*0.28,h*0.84,frontZ); g.add(up);
  const {grp:chim,topLocal}=hChimney(-w*0.3,h+rise*0.4,0,rand(0.55,0.75)); g.add(chim); g.userData.chimney=topLocal;
  hAddCozyDetails(g,frontZ,w,doorX,h,glowPos); if(rng()<0.7) g.add(hBarrel(-w/2+0.35,0,frontZ+0.25)); return g; }
function hAframe(){ const g=new THREE.Group(); const roofMat=toon(pick(HROOFS)); const faceMat=toon(pick(HWALLS));
  const w=rand(1.7,2.0),d=rand(2.0,2.4),h=rand(2.2,2.6); const frontZ=d/2;
  g.add(hBox(MAT.stone,w*1.02,0.16,d,0,0.08,0)); g.add(hBox(faceMat,w*0.5,0.7,d*0.98,0,0.35,0));
  const roof=hGableRoof(roofMat,w+0.3,h,d+0.4); g.add(roof); g.add(hBox(MAT.wood,0.1,0.1,d+0.4,0,h,0));
  if(rng()<0.7) hLayShingles(g,roof,0,roofMat);
  const face=hGableRoof(faceMat,w+0.26,h-0.04,0.06); face.position.set(0,0.0,frontZ+0.02); g.add(face);
  g.add(hBox(MAT.wood,w*0.9,0.1,0.08,0,h*0.42,frontZ+0.06)); g.add(hBox(MAT.wood,0.1,h*0.72,0.08,0,h*0.36,frontZ+0.06));
  const door=hDoor(0.6,1.0); door.position.set(0,0,frontZ+0.05); g.add(door);
  const loft=hWindow(0.55,0.55,true); loft.position.set(0,h*0.62,frontZ+0.05); g.add(loft); const glowPos={x:0,y:h*0.62};
  for(const sx of [-1,1]){ const sw=hWindow(0.3,0.34,rng()<0.4); sw.position.set(sx*w*0.2,0.42,frontZ+0.05); g.add(sw); }
  const {grp:chim,topLocal}=hChimney(w*0.42,0.0,-d*0.1,h*0.78); g.add(chim); g.userData.chimney=topLocal;
  hAddCozyDetails(g,frontZ,w,null,h*0.5,glowPos); if(rng()<0.7) g.add(hMat(0,0.02,frontZ+0.42)); return g; }
function makeHouse(){ hInitMats(); const g=pick([hCottage,hTownhouse,hShop,hAframe])(); if(!g.userData.chimney) g.userData.chimney=new THREE.Vector3(0,2,0); return g; }
function buildHouses(){
  let n=0, tries=0;
  while(n<16 && tries<800){ tries++;
    const d=new THREE.Vector3(rng()*2-1,rng()*2-1,rng()*2-1).normalize();
    const h=terrain(d); if(h>WATER+0.8 && h<2.6 && freeSpot(d,1.9)){ const house=makeHouse(); placeOnSurface(house,d,0,rand(0,6.28)); planetGroup.add(house); claim(d,1.9); colliders.push({dir:d.clone(), ar:1.3/R});
      house.updateWorldMatrix(true,false); houseSmokers.push({pos:house.localToWorld(house.userData.chimney.clone()), up:d.clone()});
      const merged=bakeMerge(house); planetGroup.remove(house); planetGroup.add(merged); n++; }
  }
}
/* buildHouses(): replaced by buildCityBlocks() */

// flat hand-shaped cloud cutouts — coplanar circle puffs with a flat bottom,
// standing like theatre flats; the ink-outline pass draws their silhouettes
const clouds=new THREE.Group(); planetGroup.add(clouds);
{
  const NCL=16;
  const cloudMat=new THREE.MeshBasicMaterial({color:'#f6f2e6',side:THREE.DoubleSide,fog:false});
  const makeCloudGeo=()=>{
    const parts=[];
    const puffs=randi(3,5);
    let x=-(puffs-1)*0.42;
    for(let k=0;k<puffs;k++){
      const r=rand(0.5,1.0)*(1-Math.abs(k-(puffs-1)/2)/(puffs));   // taller in the middle
      const c=new THREE.CircleGeometry(0.55+r*0.55,14);
      c.translate(x, 0.28+r*0.32, 0);
      parts.push(c); x+=rand(0.72,0.95);
    }
    const base=new THREE.PlaneGeometry(x+0.7, 0.6); base.translate((x-(puffs-1)*0.42)/2-0.35, 0.3, 0.001);
    parts.push(base);
    return mergeGeometries(parts,false);
  };
  for(let i=0;i<NCL;i++){
    // the spread city wraps most of the globe now, so clouds ring the far pole —
    // over the outer ranges + antipodal sea, never looming over a street view
    const th=rand(2.66,3.05), ph=rand(0,6.283);
    const d=new THREE.Vector3().copy(CITY_UP).multiplyScalar(Math.cos(th))
      .addScaledVector(CITY_EAST, Math.sin(th)*Math.cos(ph))
      .addScaledVector(CITY_NORTH, Math.sin(th)*Math.sin(ph));
    const c=new THREE.Mesh(makeCloudGeo(), cloudMat);
    placeOnSurface(c,d,rand(14,22),rand(0,6.28)); c.scale.setScalar(rand(1.2,2.0)); clouds.add(c);
  }
}

// ---- cozy village props ----
const C_WOOD='#8a6243',C_WOODD='#6f4e35',C_METAL='#6b7280',C_RED='#e0584a',C_PAPER='#f3ead2',C_LEAF='#5fa84e',C_STONE='#9aa0a6',C_STONED='#7c8288',C_GLASS='#fff3c4';
function makePost(h=1.0,r=0.06,color=C_WOOD){ const post=new THREE.Mesh(faceted(new THREE.CylinderGeometry(r*0.85,r,h,7)),toon(color)); post.position.y=h/2; post.castShadow=true; return post; }
function makeMailbox(){ const g=new THREE.Group(); const postH=1.0; g.add(makePost(postH,0.06,C_WOOD));
  const boxG=new THREE.Group(); boxG.position.y=postH+0.02; g.add(boxG);
  const body=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.34,0.26,0.5)),toon(C_RED)); body.position.y=0.13; body.castShadow=true; boxG.add(body);
  const roof=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.17,0.17,0.5,12,1,false,0,Math.PI)),toon(C_RED)); roof.rotation.z=Math.PI/2; roof.position.y=0.26; roof.castShadow=true; boxG.add(roof);
  const face=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.165,0.165,0.04,12,1,false,0,Math.PI)),toon('#cf4d40')); face.rotation.set(Math.PI/2,0,Math.PI/2); face.position.set(0,0.26,0.25); boxG.add(face);
  const slot=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.18,0.005),toon('#5a3530')); slot.position.set(0,0.18,0.252); boxG.add(slot);
  const flagPivot=new THREE.Group(); flagPivot.position.set(-0.18,0.13,0.0); boxG.add(flagPivot);
  const flagPole=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,6),toon(C_METAL)); flagPole.position.y=0.08; flagPivot.add(flagPole);
  const flag=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.02,0.1,0.1)),toon('#f0c040')); flag.position.set(0,0.13,0.05); flagPivot.add(flag); flagPivot.rotation.x=-0.5;
  return { obj:g, ar:0.34 }; }
function makeLampPost(){ const g=new THREE.Group(); const h=2.0;
  const base=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.16,0.2,0.16,8)),toon(C_METAL)); base.position.y=0.08; base.castShadow=true; g.add(base);
  const pole=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.05,0.065,h,8)),toon('#5b626b')); pole.position.y=h/2+0.1; pole.castShadow=true; g.add(pole);
  const head=new THREE.Group(); head.position.y=h+0.1; g.add(head);
  const cap=new THREE.Mesh(faceted(new THREE.ConeGeometry(0.2,0.18,8)),toon('#4b515a')); cap.position.y=0.24; cap.castShadow=true; head.add(cap);
  { const fin=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.05,8,6)),toon('#4b515a')); fin.position.y=0.36; head.add(fin); }
  const glass=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.13,0.15,0.26,8)),toon(C_GLASS,{emissive:C_GLASS,emissiveIntensity:0.9})); head.add(glass);
  const frame=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.14,0.16,0.05,8)),toon('#4b515a')); frame.position.y=-0.14; head.add(frame);
  return { obj:g, ar:0.2 }; }   /* emissive glass only — no PointLight (perf) */
function makeSignpost(){ const g=new THREE.Group(); const h=1.5; g.add(makePost(h,0.055,C_WOOD));
  const cap=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.07,8,6)),toon(C_WOODD)); cap.position.y=h; g.add(cap);
  const dirs=[{y:h-0.18,rot:0.4,flip:1,col:'#caa15c'},{y:h-0.5,rot:-0.9,flip:-1,col:'#b98a4a'},{y:h-0.82,rot:1.7,flip:1,col:'#caa15c'}];
  for(const dd of dirs){ const arrow=new THREE.Group(); arrow.position.y=dd.y; arrow.rotation.y=dd.rot; g.add(arrow);
    const plank=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.46,0.14,0.04)),toon(dd.col)); plank.position.x=dd.flip*0.2; plank.castShadow=true; arrow.add(plank);
    const tip=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.0,0.1,0.14,4)),toon(dd.col)); tip.rotation.set(0,Math.PI/4,dd.flip>0?-Math.PI/2:Math.PI/2); tip.scale.set(1,1.3,0.28); tip.position.x=dd.flip*0.42; arrow.add(tip); }
  return { obj:g, ar:0.24 }; }
function makeWell(){ const g=new THREE.Group();
  const ring=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.62,0.7,0.7,12)),toon(C_STONE)); ring.position.y=0.35; ring.castShadow=true; g.add(ring);
  const rim=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.66,0.66,0.14,12)),toon(C_STONED)); rim.position.y=0.72; g.add(rim);
  const water=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.02,12),toon('#3a6b78')); water.position.y=0.6; g.add(water);
  for(const s of [-1,1]){ const p=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.05,0.06,1.0,7)),toon(C_WOOD)); p.position.set(s*0.5,1.2,0); p.castShadow=true; g.add(p); }
  const roller=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.06,0.06,0.95,8)),toon(C_WOODD)); roller.rotation.z=Math.PI/2; roller.position.y=1.55; g.add(roller);
  const bucket=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.11,0.09,0.18,8)),toon(C_WOOD)); bucket.position.set(0.2,1.3,0); bucket.castShadow=true; g.add(bucket);
  const roof=new THREE.Mesh(faceted(new THREE.ConeGeometry(0.95,0.55,4)),toon(C_RED)); roof.rotation.y=Math.PI/4; roof.position.y=1.95; roof.castShadow=true; g.add(roof);
  return { obj:g, ar:0.7 }; }
function makeCrate(size=0.5){ const g=new THREE.Group(); const body=new THREE.Mesh(faceted(new THREE.BoxGeometry(size,size,size)),toon(C_WOOD)); body.position.y=size/2; body.castShadow=true; g.add(body);
  const e=size/2+0.005; const barMat=toon(C_WOODD);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const v=new THREE.Mesh(new THREE.BoxGeometry(0.04,size,0.04),barMat); v.position.set(sx*e,size/2,sz*e); g.add(v); }
  return { obj:g, ar:size*0.75 }; }
function makeBarrel(){ const g=new THREE.Group(); const body=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.26,0.22,0.6,10)),toon(C_WOOD)); body.position.y=0.3; body.castShadow=true; g.add(body);
  for(const y of [0.12,0.3,0.48]){ const hoop=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.275,0.275,0.04,10)),toon(C_METAL)); hoop.position.y=y; g.add(hoop); }
  return { obj:g, ar:0.28 }; }
function makeBench(){ const g=new THREE.Group(); const seatMat=toon(C_WOOD);
  for(let i=0;i<3;i++){ const plank=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.96,0.05,0.12)),seatMat); plank.position.set(0,0.42,-0.16+i*0.14); plank.castShadow=true; g.add(plank); }
  for(let i=0;i<2;i++){ const plank=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.96,0.1,0.04)),seatMat); plank.position.set(0,0.62+i*0.13,-0.22); plank.castShadow=true; g.add(plank); }
  for(const sx of [-1,1]){ const leg=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.07,0.42,0.4)),toon(C_WOODD)); leg.position.set(sx*0.4,0.21,-0.05); leg.castShadow=true; g.add(leg);
    const up=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.06,0.5,0.06)),toon(C_WOODD)); up.position.set(sx*0.4,0.62,-0.22); g.add(up); }
  return { obj:g, ar:0.5 }; }
function makeFence(){ const g=new THREE.Group(); const railMat=toon(C_PAPER); const len=1.1;
  for(const y of [0.22,0.46]){ const rail=new THREE.Mesh(faceted(new THREE.BoxGeometry(len,0.06,0.05)),railMat); rail.position.y=y; rail.castShadow=true; g.add(rail); }
  const n=5; for(let i=0;i<n;i++){ const x=-len/2+0.08+(i/(n-1))*(len-0.16);
    const pk=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.08,0.6,0.04)),railMat); pk.position.set(x,0.3,0); pk.castShadow=true; g.add(pk);
    const tip=new THREE.Mesh(faceted(new THREE.ConeGeometry(0.057,0.1,4)),railMat); tip.rotation.y=Math.PI/4; tip.position.set(x,0.65,0); g.add(tip); }
  return { obj:g, ar:0.55, thin:true }; }
function makeFlowerPot(){ const g=new THREE.Group();
  const pot=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.16,0.12,0.22,9)),toon('#c8744a')); pot.position.y=0.11; pot.castShadow=true; g.add(pot);
  const lip=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.18,0.17,0.05,9)),toon('#b5663f')); lip.position.y=0.21; g.add(lip);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(0.155,0.155,0.03,9),toon('#5a4636')); soil.position.y=0.225; g.add(soil);
  const bush=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.16,8,6)),toon(C_LEAF)); bush.scale.set(1,0.8,1); bush.position.y=0.32; bush.castShadow=true; g.add(bush);
  const fc=['#ffffff','#f7e9a0','#f4b8c0']; for(let i=0;i<4;i++){ const a=(i/4)*Math.PI*2+rand(0,1);
    const fl=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.045,6,5)),toon(pick(fc))); fl.position.set(Math.cos(a)*0.1,0.36+rand(0,0.05),Math.sin(a)*0.1); g.add(fl); }
  return { obj:g, ar:0.18 }; }
function buildScatterProps(){
  const onGrass=(d)=>{ const t=terrain(d); return t>=0.8 && t<=2.6; };
  function placeSolid(maker,dir,opts={}){ const { obj, ar, thin }=maker(); const spin=opts.spin!=null?opts.spin:rand(0,Math.PI*2);
    placeOnSurface(obj,dir,opts.extra||0,spin); planetGroup.add(obj); const car=(thin?ar*0.6:ar)*(opts.colliderScale||0.92);
    colliders.push({ dir:dir.clone(), ar:car/R }); claim(dir,ar); return obj; }   // ar is world-space → convert to angular radius
  function placeSoft(maker,dir,opts={}){ const { obj, ar }=maker(); placeOnSurface(obj,dir,opts.extra||0,opts.spin!=null?opts.spin:rand(0,Math.PI*2)); planetGroup.add(obj); claim(dir,ar); return obj; }
  function findSpot(r,tries=60){ for(let i=0;i<tries;i++){ const d=fibSphere(800,randi(0,799)); if(!onGrass(d)) continue; if(freeSpot(d,r)) return d; } return null; }
  function scatter(count,maker,clearance,soft=false,opts={}){ for(let i=0;i<count;i++){ const d=findSpot(clearance); if(!d) continue; (soft?placeSoft:placeSolid)(maker,d,opts); } }
  scatter(9,makeMailbox,0.9); scatter(12,makeLampPost,1.0); scatter(6,makeSignpost,0.9); scatter(3,makeWell,1.6);
  scatter(6,makeBench,1.0); scatter(12,()=>makeCrate(rand(0.42,0.56)),0.8); scatter(9,makeBarrel,0.7);
  for(let r=0;r<6;r++){ const start=findSpot(1.2); if(!start) continue; let dir=start.clone(); const up=dir.clone();
    let tangent=new THREE.Vector3(0,1,0).cross(up); if(tangent.lengthSq()<1e-4) tangent=new THREE.Vector3(1,0,0).cross(up); tangent.normalize();
    const segs=randi(3,5); const step=1.1/R;
    for(let i=0;i<segs;i++){ if(!onGrass(dir) || !freeSpot(dir,0.5)) break;
      const { obj, ar }=makeFence(); const n=dir.clone().normalize(); let ref=new THREE.Vector3(0,1,0).cross(n); if(ref.lengthSq()<1e-4) ref=new THREE.Vector3(1,0,0).cross(n); ref.normalize();
      const refY=n.clone().cross(ref).normalize(); const spin=Math.atan2(tangent.dot(refY),tangent.dot(ref));
      placeOnSurface(obj,dir,0,spin); planetGroup.add(obj); colliders.push({ dir:dir.clone(), ar:(ar*0.4)/R }); claim(dir,0.55);
      const axis=dir.clone().cross(tangent).normalize(); dir=dir.clone().applyAxisAngle(axis,step).normalize(); tangent.sub(dir.clone().multiplyScalar(tangent.dot(dir))).normalize(); }
  }
  scatter(23,makeFlowerPot,0.5,true);
}
// =====================================================================
//  TAIPEI WORLD  — the city itself: landmarks, blocks, rivers, roads,
//  MRT, parks, mountain forests and the Maokong gondola.
// =====================================================================

// --- CTX: the helper contract the landmark builders are written against
function _lmMesh(geo, col, x=0,y=0,z=0){ const mat=(col&&col.isMaterial)?col:toon(col); const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m; }
const CTX = {
  THREE, toon, faceted,
  mesh:_lmMesh,
  box:(w,h,d,c,x=0,y=0,z=0)=>_lmMesh(faceted(new THREE.BoxGeometry(w,h,d)),c,x,y,z),
  cyl:(rt,rb,h,c,x=0,y=0,z=0,seg=14)=>_lmMesh(faceted(new THREE.CylinderGeometry(rt,rb,h,seg)),c,x,y,z),
  cone:(r,h,c,x=0,y=0,z=0,seg=8)=>_lmMesh(faceted(new THREE.ConeGeometry(r,h,seg)),c,x,y,z),
  sph:(r,c,x=0,y=0,z=0,seg=12)=>_lmMesh(faceted(new THREE.SphereGeometry(r,seg,Math.max(6,Math.floor(seg*0.7)))),c,x,y,z),
  group:(...kids)=>{ const g=new THREE.Group(); for(const k of kids) if(k) g.add(k); return g; }
};

// --- animated landmark parts (Ferris wheel etc.) — host spins them on local Z
const spinners=[];
function hasSpin(o){ let f=false; o.traverse(n=>{ if(n.userData&&n.userData.tpSpin) f=true; }); return f; }
function collectSpinners(o){ o.traverse(n=>{ if(n.userData&&n.userData.tpSpin) spinners.push({m:n,s:n.userData.tpSpin}); }); }

// --- floating name label above a landmark
const landmarkLabels=[], _lblV=new THREE.Vector3();
function addLandmarkLabel(obj, text, y){ const sp=makeLabel(text); sp.position.y=y; sp.scale.set(3.4,0.82,1); obj.add(sp); landmarkLabels.push(sp); }

// --- orient + drop a local-space model onto the planet surface at (xkm,ykm)
function placeLandmark(builder, xkm, ykm, opts={}){
  const grp = builder(CTX);
  if(opts.scale){ grp.scale.setScalar(opts.scale); grp.updateMatrixWorld(true); }
  let out = (opts.merge!==false && !hasSpin(grp)) ? bakeMerge(grp) : grp;
  const dir = mapDir(xkm,ykm), up = dir.clone();
  let fwd = (opts.faceNorth?CITY_NORTH:CITY_NORTH.clone().multiplyScalar(-1)).clone();   // front (+Z) faces downtown by default
  fwd.addScaledVector(up,-fwd.dot(up));
  if(fwd.lengthSq()<1e-6){ fwd.copy(CITY_EAST); fwd.addScaledVector(up,-CITY_EAST.dot(up)); }
  fwd.normalize();
  const right=new THREE.Vector3().crossVectors(up,fwd).normalize();
  fwd.crossVectors(right,up).normalize();
  out.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,fwd));
  // negative: with the right-handed (E,N,UP) frame, +Y rotation turns south→east,
  // so negate to keep `face` meaning clockwise compass degrees (90 = front→west)
  if(opts.face) out.rotateY(-opts.face*Math.PI/180);
  out.position.copy(dir).multiplyScalar(groundR(dir)+(opts.extra||0));
  // Keep architecture level: bending vertices to the globe bows roofs and door
  // heads. The landmark's ground pad (registered in PADS before the planet mesh
  // was built) raises the terrain to this model's tangent plane instead, so the
  // flat base rests on genuinely flat, plaza-tinted ground — nothing bent,
  // buried, or bolted on. groundR here already includes the pad.
  planetGroup.add(out);
  // colliders: either a list of local-space circles (walkable compounds — the player can
  // wander plazas and slip between piers) or one circle of radius opts.ar around the centre
  if(opts.cols){
    const sc=opts.scale||1;
    for(const c of opts.cols){
      const off=new THREE.Vector3(c.x*sc,0,c.z*sc).applyQuaternion(out.quaternion);
      const cd=dir.clone().multiplyScalar(groundR(dir)).add(off).normalize();
      colliders.push({dir:cd, ar:(c.r*sc)/R, h:opts.colH});   // h undefined → treated tall (camera blocker)
    }
  } else if(opts.ar) colliders.push({dir:dir.clone(), ar:(opts.ar*(opts.scale||1))/R, h:opts.colH});
  // claim the whole footprint (not just the old small claim) so props/NPCs never
  // spawn on a compound's roof or plaza
  claim(dir, Math.max(opts.claim||opts.ar||1.5, (opts.foot||0)*0.85));
  collectSpinners(out);
  if(opts.label) addLandmarkLabel(out, opts.label, opts.labelY||4);
  return {obj:out, dir};
}

// --- a flat ribbon (river / road / MRT line) laid along the surface
function _densify(pts, sub){ if(sub<=1) return pts.slice(); const out=[]; for(let i=0;i<pts.length-1;i++){ for(let s=0;s<sub;s++){ const t=s/sub; out.push([pts[i][0]+(pts[i+1][0]-pts[i][0])*t, pts[i][1]+(pts[i+1][1]-pts[i][1])*t]); } } out.push(pts[pts.length-1]); return out; }
function surfaceRibbon(rawPts, widthKm, color, yOff, opts={}){
  const pts=_densify(rawPts, opts.subdiv||4), half=widthKm*KM*0.5, geoPos=[];
  let pL=null, pR=null;
  for(let i=0;i<pts.length;i++){
    const dir=mapDir(pts[i][0],pts[i][1]);
    const a=Math.max(0,i-1), b=Math.min(pts.length-1,i+1);
    const tang=mapDir(pts[b][0],pts[b][1]).sub(mapDir(pts[a][0],pts[a][1]));
    const up=dir.clone(); tang.addScaledVector(up,-tang.dot(up)); if(tang.lengthSq()<1e-9) tang.copy(CITY_EAST); tang.normalize();
    const right=new THREE.Vector3().crossVectors(up,tang).normalize();
    const base=dir.clone().multiplyScalar(groundR(dir)+yOff);
    const L=base.clone().addScaledVector(right,-half), Rr=base.clone().addScaledVector(right,half);
    if(pL){ geoPos.push(pL.x,pL.y,pL.z, pR.x,pR.y,pR.z, L.x,L.y,L.z, pR.x,pR.y,pR.z, Rr.x,Rr.y,Rr.z, L.x,L.y,L.z); }
    pL=L; pR=Rr;
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(geoPos,3)); g.computeVertexNormals();
  const mat=opts.mat||toon(color,opts.toonOpts||{});
  mat.side=THREE.DoubleSide;   // ribbon winding depends on map chirality — keep both faces
  const mesh=new THREE.Mesh(g,mat); mesh.receiveShadow=true; if(opts.renderOrder)mesh.renderOrder=opts.renderOrder;
  planetGroup.add(mesh); return mesh;
}
function cylBetween(a,b,r,mat){ const d=b.clone().sub(a), len=d.length(); const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),mat); m.position.copy(a).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.clone().normalize()); m.castShadow=true; return m; }

// --- the three rivers
function buildRivers(){
  const mat=toon('#5ec4cc');
  for(const Rv of RIVERS) surfaceRibbon(Rv.pts, Rv.w*2.4, null, 0.05, {mat, subdiv:5});
}
// --- major avenues
function buildRoads(){
  const mat=toon('#7e7a72'), lineMat=toon('#e9e4d6'), walkMat=toon('#cfc8b6');
  for(const Rd of BLVD){
    surfaceRibbon(Rd.pts, Rd.w+0.11, null, 0.028, {mat:walkMat, subdiv:5}); // pale sidewalk apron each side
    surfaceRibbon(Rd.pts, Rd.w, null, 0.06, {mat, subdiv:5});            // the asphalt (clear of the apron: no z-fight)
    surfaceRibbon(Rd.pts, 0.03, null, 0.10, {mat:lineMat, subdiv:6});    // faint centre line
  }
}
// --- river bridges: arched decks OVER the water (roads/rivers hug terrain,
//     so a crossing needs its own representation). Deck rises from each bank
//     with a low arch — high enough mid-span that a wading player passes
//     beneath. Purely visual: the riverbed below stays walkable as before.
const BRIDGES=(CITY.bridges||[]).map(({id,name,widthKm:w,path:pts})=>({id,name,w,pts:warpPts(pts)}));
function buildBridges(){
  const deckMat=toon('#9a958a'), railMat=toon('#6d6a60'), pierMat=toon('#7e7a72');
  for(const B of BRIDGES){
    const pts=_densify(B.pts, 8), half=B.w*KM*0.5;
    const a=pts[0], b=pts[pts.length-1];
    const hA=terrain(mapDir(a[0],a[1])), hB=terrain(mapDir(b[0],b[1]));
    const bank=Math.max(hA,hB), rise=1.5;
    const deckH=t=>bank+0.12+rise*Math.sin(Math.PI*THREE.MathUtils.clamp(t,0,1));
    const geoPos=[]; let pL=null,pR=null; const rails=[[],[]];
    for(let i=0;i<pts.length;i++){
      const t=i/(pts.length-1);
      const dir=mapDir(pts[i][0],pts[i][1]);
      const iA=Math.max(0,i-1), iB=Math.min(pts.length-1,i+1);
      const tang=mapDir(pts[iB][0],pts[iB][1]).sub(mapDir(pts[iA][0],pts[iA][1]));
      const up=dir.clone(); tang.addScaledVector(up,-tang.dot(up)); if(tang.lengthSq()<1e-9) tang.copy(CITY_EAST); tang.normalize();
      const right=new THREE.Vector3().crossVectors(up,tang).normalize();
      const base=dir.clone().multiplyScalar(R+deckH(t));
      const L=base.clone().addScaledVector(right,-half), Rr=base.clone().addScaledVector(right,half);
      rails[0].push(L.clone().addScaledVector(up,0.34)); rails[1].push(Rr.clone().addScaledVector(up,0.34));
      if(pL){ geoPos.push(pL.x,pL.y,pL.z, pR.x,pR.y,pR.z, L.x,L.y,L.z, pR.x,pR.y,pR.z, Rr.x,Rr.y,Rr.z, L.x,L.y,L.z); }
      pL=L; pR=Rr;
      // piers: mid-span samples drop a leg to the riverbed
      if(i>0 && i<pts.length-1 && i%3===0){
        const g=groundR(dir);
        planetGroup.add(cylBetween(dir.clone().multiplyScalar(g-0.2), base.clone(), 0.16, pierMat));
      }
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(geoPos,3)); g.computeVertexNormals();
    const mat=deckMat.clone(); mat.side=THREE.DoubleSide;
    const mesh=new THREE.Mesh(g,mat); mesh.castShadow=true; mesh.receiveShadow=true; planetGroup.add(mesh);
    for(const rail of rails) for(let i=0;i<rail.length-1;i++) planetGroup.add(cylBetween(rail[i],rail[i+1],0.05,railMat));
  }
}
// --- Songshan Airport: runway strip + apron (the void itself is enforced in
//     buildCityBlocks via RUNWAY_CLEAR). Local widths stay physical, like roads.
const RUNWAY = CITY.airfield ? warpPts(CITY.airfield.runway.path) : null;
function buildAirfield(){
  if(!RUNWAY) return;
  const w=CITY.airfield.runway.widthKm;
  surfaceRibbon(RUNWAY, w+0.05, null, 0.024, {mat:toon('#b9b4a6'), subdiv:4});  // mown verge
  surfaceRibbon(RUNWAY, w, null, 0.05, {mat:toon('#5d5c58'), subdiv:4});        // asphalt
  surfaceRibbon(RUNWAY, 0.012, null, 0.08, {mat:toon('#e9e4d6'), subdiv:5});    // centreline
}
// --- MRT lines (official colours)
function buildMRT(){
  for(const line of CITY.transit.metroLines){
    const pts=warpPts(line.path);
    const mat=toon(line.color,{emissive:line.color,emissiveIntensity:0.12});
    surfaceRibbon(pts, 0.045, null, 0.14, {mat, renderOrder:2, subdiv:5});
  }
}

// --- TAIPEI SHOPHOUSE FABRIC — full-height eye-level blocks (merged for perf).
//     Taipei's real fabric at street scale: 4–6 storey tiled walk-ups with a
//     covered qilou arcade at ground level, shopfronts with muted signature
//     palettes, vertical signboards, white mullion crosses + AC boxes + window
//     grilles on the eye-level floors, simplified upper floors, and the rooftop
//     signature (parapet + stainless water tank + stair bulkhead + add-on shed).
//     Glass towers only in Xinyi around 101. Camera-wide corridors along the
//     avenues, a protected vista wedge spawn → 101, and a cleared spawn plaza.
// Start directly on the already-warped Ren'ai Boulevard ribbon, west of Xinyi.
// Using its authored path vertex guarantees the player sits on asphalt (and away
// from Elephant Mountain); the next vertex supplies the eastbound camera heading.
const SPAWN_ROAD = BLVD[1].pts;
const SPAWN_KM = {x:SPAWN_ROAD[2][0], y:SPAWN_ROAD[2][1]};
const SPAWN_AHEAD_KM = {x:SPAWN_ROAD[3][0], y:SPAWN_ROAD[3][1]};
function buildCityBlocks(){
  // ---- shared materials (fixed set across every block) ----
  const TILE=['#e4ded0','#d9cfc0','#cfd4c8','#d8cbc2','#c9c2b4','#dcd2b8','#d3c6ab','#c7cfc6','#d9b8ad'].map(c=>toon(c));
  const GLASS=['#7FA6B5','#8FA9A0','#93A3B8'].map(c=>toon(c));
  const TRIM  = toon('#efe8d6');                    // sills / string courses / arcade columns
  const PANE  = toon('#3f4b56');                    // eye-band window glass
  const PANE_SOFT = toon('#6a7680');                // upper floors — lighter, simpler
  const MULL  = toon('#eae3d0');                    // white mullion crosses
  const GRILLE= toon('#565c64');                    // iron window grilles
  const ACBOX = toon('#e6e4dc');                    // air-con units
  const SLAB  = toon('#9c968a');                    // concrete floor bands / parapet
  const TANK  = toon('#c2c8cc');                    // stainless water tank
  const TANKD = toon('#9aa2a8');
  const ROLL  = toon('#aab0b4');                    // metal roll-up doors
  const ROLLD = toon('#878d92');
  const SHED  = toon('#b7aa96');                    // rooftop add-on shack
  const SIGNB = toon('#20262c');                    // dark sign board behind painted lettering
  // muted Taipei shopfront palette — fascia + optional awning stripe pair
  const SHOPFRONTS=[
    { fascia: toon('#2e6e52'), stripe:[toon('#3a7d5f'), toon('#e9e2cf')], seven:true },  // convenience green
    { fascia: toon('#8a6b4e'), stripe:[toon('#9a7a5a'), toon('#efe8d6')] },              // boba tan
    { fascia: toon('#71413a'), stripe:null },                                            // beef-noodle oxblood
    { fascia: toon('#3d5a49'), stripe:[toon('#4a6b57'), toon('#e9e2cf')], cross:true },  // pharmacy pine
    { fascia: toon('#39465c'), stripe:[toon('#46566e'), toon('#d8d2c0')] },              // electronics navy
    { fascia: toon('#9b7d46'), stripe:null },                                            // breakfast-shop ochre
    { fascia: toon('#8f4a3c'), stripe:[toon('#a05a4a'), toon('#e9e2cf')], lantern:true },// temple-goods terracotta
  ];
  const SEVEN_O = toon('#c26a2e');                  // the single muted accent dash on convenience fascias
  const CROSSW  = toon('#e9e2cf');
  const LANT    = toon('#b34434', { emissive:'#8a2f24', emissiveIntensity:0.25 });       // muted lantern red
  // vertical signboards: muted family, ~1 in 6 gets the warm red
  const VSIGNS=['#7a4a42','#3f5c50','#44546b','#8a6f3e','#5c4a6b','#a34434'].map(c=>toon(c));
  const VDASH = toon('#e9e2cf');                    // pale dashes that read as painted characters

  const solidBox=(g,mat,w,h,d,x,y,z)=>{ const m=new THREE.Mesh(faceted(new THREE.BoxGeometry(w,h,d)),mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; m.receiveShadow=true; g.add(m); return m; };
  const solidCyl=(g,mat,rt,rb,h,seg,x,y,z)=>{ const m=new THREE.Mesh(faceted(new THREE.CylinderGeometry(rt,rb,h,seg)),mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; g.add(m); return m; };

  // =====================================================================
  //  ONE SHOPHOUSE BLOCK (local model: base y=0, +Y up, +Z = front)
  // =====================================================================
  function buildShophouse(opts){
    const g=new THREE.Group();
    const facade=pick(TILE);
    const W=opts.W||rand(2.6,3.6);         // facade width along the street
    const D=opts.D||rand(2.0,2.6);         // enough depth for a convincing street wall
    const T=opts.floors||randi(5,6);       // total floors incl. arcade ground floor
    const gH=rand(2.00,2.20);              // full-height qilou arcade / shop entrance
    const fH=rand(1.45,1.60);              // avatar spans less than two storeys, not three
    const upper=T-1;
    const bodyH=gH+upper*fH;
    const winH=fH*0.6;
    const hw=W/2, hd=D/2;
    const sink=opts.sink||0;

    // masonry body — the ground floor is recessed on both long faces (the qilou
    // arcade): a narrower core carries the tower, the 1st floor projects over it
    const AR=0.40;                                             // arcade depth
    solidBox(g,facade, W, bodyH-gH+sink*0, D, 0, gH+(bodyH-gH)/2, 0);            // upper body (full depth)
    solidBox(g,facade, W, gH+sink, D-AR*2, 0, (gH-sink)/2, 0);                   // recessed ground core (buried skirt)
    solidBox(g,TRIM, W+0.07, 0.10, D+0.07, 0, 0.05, 0);                          // socle
    solidBox(g,SLAB, W+0.05, 0.07, D+0.05, 0, gH, 0);                            // arcade ceiling slab edge

    const bays=Math.max(3,Math.min(6,Math.round(W/0.5)));
    const cellW=W/bays;
    const winW=Math.min(cellW*0.5,0.32);

    // ---- upper-floor window grid on a long face -----------------------
    function windowGrid(sign, dressed){
      const fz=sign*hd;
      const outZ=fz+sign*0.02, panZ=fz+sign*0.006;
      for(let f=1;f<=upper;f++){
        const cy=gH+(f-0.5)*fH;
        const eye=f<=2;                    // eye-level detail band: 1st + 2nd floor
        solidBox(g,TRIM, W+0.03, 0.04, 0.05, 0, cy-winH/2-0.02, outZ);           // sill course
        for(let b=0;b<bays;b++){
          const bx=-hw+(b+0.5)*cellW;
          solidBox(g, eye?PANE:PANE_SOFT, winW, winH, 0.04, bx, cy, panZ);
          if(eye){
            solidBox(g,MULL, 0.024, winH, 0.05, bx, cy, fz+sign*0.014);          // white mullion cross
            solidBox(g,MULL, winW, 0.024, 0.05, bx, cy+winH*0.18, fz+sign*0.014);
            if(dressed && (b+f)%3===0){                                          // iron window grille
              solidBox(g,GRILLE, winW+0.05, 0.02, 0.10, bx, cy-winH/2+0.02, fz+sign*0.05);
              solidBox(g,GRILLE, winW+0.05, 0.02, 0.10, bx, cy+winH/2-0.02, fz+sign*0.05);
              solidBox(g,GRILLE, 0.02, winH, 0.10, bx-winW/2, cy, fz+sign*0.05);
              solidBox(g,GRILLE, 0.02, winH, 0.10, bx+winW/2, cy, fz+sign*0.05);
            } else if(dressed && (b*2+f)%4===1){                                 // AC unit under the window
              solidBox(g,ACBOX, winW*0.6, 0.10, 0.10, bx+winW*0.3, cy-winH/2-0.09, fz+sign*0.05);
            }
          }
        }
      }
    }

    // ---- qilou arcade + shopfront on a long face -----------------------
    function shopfront(sign, dress){
      const fz=sign*hd;                    // outer building line (columns stand here)
      const wz=sign*(hd-AR);               // recessed shop wall
      const outZ=fz+sign*0.02;
      // arcade columns at the bay lines
      for(let b=0;b<=bays;b++){
        const bx=-hw+b*cellW;
        solidBox(g,TRIM, 0.10, gH, 0.10, bx, gH/2, fz-sign*0.05);
      }
      const shop=dress?pick(SHOPFRONTS):null;
      const doorAt=dress?randi(0,bays-1):-1;
      const rollAt=dress&&rng()<0.5?randi(0,bays-1):-1;                          // one shut roll-up door
      for(let i=0;i<bays;i++){
        const cx=-hw+(i+0.5)*cellW;
        const openW=cellW*0.8, openH=gH*0.74;
        if(i===rollAt && i!==doorAt){
          solidBox(g,ROLL, openW, openH, 0.05, cx, 0.10+openH/2, wz+sign*0.006); // corrugated roll-up
          for(let s=1;s<4;s++) solidBox(g,ROLLD, openW, 0.015, 0.055, cx, 0.10+openH*s/4, wz+sign*0.006);
        } else if(i===doorAt && shop){
          solidBox(g,shop.fascia, openW*0.55, gH*0.8, 0.05, cx, 0.12+gH*0.4, wz+sign*0.006); // panelled door
          solidBox(g,PANE, openW*0.34, gH*0.3, 0.04, cx, 0.12+gH*0.58, wz+sign*0.012);       // transom light
        } else {
          solidBox(g,PANE, openW, openH, 0.05, cx, 0.12+openH/2, wz+sign*0.006);             // vitrine
          solidBox(g,MULL, openW, 0.022, 0.04, cx, 0.12+openH*0.62, wz+sign*0.012);          // transom bar
          if(shop) solidBox(g,shop.fascia, openW, openH*0.2, 0.05, cx, 0.12+openH*0.1, wz+sign*0.010); // stallriser
        }
      }
      if(!dress||!shop) return;
      // fascia band across the arcade + dark sign board with painted dashes
      solidBox(g,shop.fascia, W*0.99, 0.14, 0.07, 0, gH-0.05, outZ);
      solidBox(g,SIGNB, W*0.5, 0.08, 0.02, 0, gH-0.05, fz+sign*0.06);
      const nL=randi(3,5);
      for(let k=0;k<nL;k++) solidBox(g,VDASH, 0.05, 0.03, 0.014, -W*0.19+k*W*0.095, gH-0.05, fz+sign*0.068);
      if(shop.seven) solidBox(g,SEVEN_O, 0.12, 0.08, 0.02, W*0.34, gH-0.05, fz+sign*0.062);  // orange dash
      if(shop.cross){ solidBox(g,CROSSW,0.05,0.16,0.02, W*0.34, gH+0.12, fz+sign*0.06);      // pharmacy cross
                      solidBox(g,CROSSW,0.16,0.05,0.02, W*0.34, gH+0.12, fz+sign*0.06); }
      if(shop.lantern){ for(const lx of [-W*0.3, W*0.3]){                                    // paired lanterns
        solidCyl(g,LANT, 0.07,0.07,0.12, 8, lx, gH-0.18, fz+sign*0.10); } }
      // striped canvas awning over some vitrines
      if(shop.stripe && rng()<0.7){
        const aw=W*0.6, stripes=Math.max(4,Math.round(aw/0.22)), swd=aw/stripes;
        for(let k=0;k<stripes;k++){
          const sm=shop.stripe[k%2];
          const top=solidBox(g,sm, swd*0.96, 0.03, 0.30, -aw/2+(k+0.5)*swd, gH*0.82, fz+sign*0.16);
          top.rotation.x=sign*0.5;
          solidBox(g,sm, swd*0.96, 0.09, 0.03, -aw/2+(k+0.5)*swd, gH*0.82-0.10, fz+sign*0.30);
        }
      }
      // vertical signboard climbing floors 1–3 (the Taipei street signature)
      if(rng()<0.85){
        const sx=(rng()<0.5?-1:1)*hw*rand(0.55,0.8);
        const sh=Math.min(upper*fH*0.72, rand(1.0,1.5));
        const scy=gH+sh/2+0.12;
        const vm=pick(VSIGNS);
        solidBox(g,vm, 0.17, sh, 0.06, sx, scy, fz+sign*0.10);
        const nd=Math.max(3,Math.round(sh/0.24));
        for(let k=0;k<nd;k++) solidBox(g,VDASH, 0.09, 0.07, 0.014, sx, scy-sh/2+ (k+0.5)*(sh/nd), fz+sign*0.135);
      }
      // hanging shop sign on a bracket at 1st-floor height
      if(rng()<0.4){
        const sx=-hw*0.45;
        solidBox(g,GRILLE, 0.03,0.03,0.26, sx, gH+fH*0.85, fz+sign*0.13);
        solidBox(g,shop.fascia, 0.22,0.15,0.02, sx, gH+fH*0.85-0.13, fz+sign*0.24);
      }
    }

    // ---- small add-on balconies on the 2nd floor (some blocks) ---------
    function balcony(sign){
      const fz=sign*hd, f=2;
      const cy=gH+(f-0.5)*fH, slabY=cy-winH/2-0.05;
      const bx=(rng()<0.5?-1:1)*hw*0.3, bw2=cellW*1.4;
      solidBox(g,SLAB, bw2, 0.05, 0.22, bx, slabY, fz+sign*0.11);
      solidBox(g,GRILLE, bw2, 0.02, 0.02, bx, slabY+0.18, fz+sign*0.21);
      const nb=Math.round(bw2/0.1);
      for(let i=0;i<=nb;i++) solidBox(g,GRILLE, 0.012, 0.18, 0.012, bx-bw2/2+i*(bw2/nb), slabY+0.09, fz+sign*0.21);
      if(rng()<0.6){ const pot=solidCyl(g,toon('#c8744a'),0.05,0.04,0.08,7, bx-bw2*0.3, slabY+0.07, fz+sign*0.16);
        const bush=new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(0.07,0)),toon('#7d9668')); bush.position.set(bx-bw2*0.3, slabY+0.16, sign*(hd+0.16)); bush.castShadow=true; g.add(bush); }
    }

    // ---- short ends: simple pane columns -------------------------------
    for(const sx of [-1,1]){
      const px=sx*hw+sx*0.005;
      const ecols=Math.max(2,Math.round(D/0.7));
      for(let f=1;f<=upper;f++){
        const cy=gH+(f-0.5)*fH;
        for(let c=0;c<ecols;c++){
          const bz=-hd+(c+0.5)*(D/ecols);
          solidBox(g,PANE_SOFT, 0.04, winH, winW*0.9, px, cy, bz);
        }
      }
    }

    // both long faces read as street facades — dress BOTH
    windowGrid( 1,true); windowGrid(-1,true);
    shopfront( 1,true);  shopfront(-1,true);
    if(rng()<0.5) balcony(1);
    if(rng()<0.5) balcony(-1);

    // ---- Taipei roofline: parapet + water tank + stair bulkhead + shed --
    solidBox(g,SLAB, W+0.08, 0.09, D+0.08, 0, bodyH+0.02, 0);                    // parapet cap
    solidBox(g,SLAB, W+0.02, 0.14, 0.05, 0, bodyH+0.07, hd);                     // front parapet lip
    solidBox(g,SLAB, W+0.02, 0.14, 0.05, 0, bodyH+0.07, -hd);
    if(rng()<0.85){                                                              // upright stainless tank on legs
      const tx=rand(-0.25,0.25)*W, tz=rand(-0.2,0.2)*D;
      for(const lx of [-0.07,0.07]) for(const lz of [-0.07,0.07]) solidBox(g,TANKD,0.03,0.14,0.03, tx+lx, bodyH+0.11, tz+lz);
      solidCyl(g,TANK, 0.11,0.11,0.22, 9, tx, bodyH+0.30, tz);
      solidCyl(g,TANKD,0.12,0.12,0.03, 9, tx, bodyH+0.42, tz);
    }
    if(rng()<0.7){                                                               // stair bulkhead
      const bx=rand(-0.2,0.2)*W;
      solidBox(g,facade, 0.34, 0.26, 0.30, bx, bodyH+0.15, rand(-0.15,0.15)*D);
      solidBox(g,SLAB, 0.38, 0.04, 0.34, bx, bodyH+0.29, 0);
    }
    if(rng()<0.35){                                                              // add-on rooftop shack
      solidBox(g,SHED, W*0.4, 0.22, D*0.4, -W*0.2, bodyH+0.13, -D*0.1);
      solidBox(g,ROLLD, W*0.42, 0.03, D*0.44, -W*0.2, bodyH+0.25, -D*0.1);
    }
    if(rng()<0.4) solidBox(g,GRILLE, 0.015, 0.4, 0.015, rand(-0.3,0.3)*W, bodyH+0.3, rand(-0.3,0.3)*D); // antenna

    g.userData.W=W; g.userData.D=D; g.userData.bodyH=bodyH;
    return g;
  }

  // ---- glass tower (Xinyi only) ---------------------------------------
  function buildTower(opts={}){
    const g=new THREE.Group();
    const bh=opts.bh||rand(14.0,20.0), bw=opts.W||rand(1.8,2.6), bd=opts.D||rand(1.6,2.4);
    const facade=pick(GLASS);
    solidBox(g,TRIM, bw+0.2, 0.14, bd+0.2, 0, 0.07, 0);
    solidBox(g,facade, bw, bh, bd, 0, bh/2, 0);
    const nb=Math.min(16,Math.floor(bh/0.68));
    for(let i=1;i<=nb;i++) solidBox(g,SLAB, bw*1.03, 0.05, bd*1.03, 0, (i/(nb+1))*bh, 0);
    solidBox(g,SLAB, bw*0.55, 0.14, bd*0.55, 0, bh+0.08, 0);
    solidBox(g,PANE, bw*0.8, 1.05, 0.05, 0, 0.62, bd/2+0.01);  // glass lobby
    g.userData.W=bw; g.userData.D=bd; g.userData.bodyH=bh;
    return g;
  }

  // ---- placement --------------------------------------------------------
  const ROAD_CLEAR=0.40;                    // km from avenue centreline → road + pavement + facade breathing room
  const FACADE_GAP=0.48;                    // world units beyond the true rectangular footprint
  // protected vista wedge: spawn → Taipei 101 (nothing tall in the sightline)
  const VISTA=(()=>{ const dx=SPAWN_AHEAD_KM.x-SPAWN_KM.x, dy=SPAWN_AHEAD_KM.y-SPAWN_KM.y, L=Math.hypot(dx,dy);
    return { ox:SPAWN_KM.x-dx/L*0.14, oy:SPAWN_KM.y-dy/L*0.14, tx:dx/L, ty:dy/L, len:Math.min(1.8,L+0.38), half:0.20 }; })();
  const inVista=(x,y)=>{ const dx=x-VISTA.ox, dy=y-VISTA.oy;
    const along=dx*VISTA.tx+dy*VISTA.ty;
    if(along<0||along>VISTA.len) return false;
    return Math.abs(-dx*VISTA.ty+dy*VISTA.tx)<VISTA.half; };
  // second protected wedge: spawn → Taipei 101 itself. Since Phase 2 the real
  // Ren'ai geometry no longer points the street wedge anywhere near 101's
  // bearing, so without this a procedural block can blot the tower out of the
  // opening shot (the anchor CLAUDE.md protects).
  const VISTA101=(()=>{ const dx=-SPAWN_KM.x, dy=-SPAWN_KM.y, L=Math.hypot(dx,dy)||1e-4;
    return { tx:dx/L, ty:dy/L, len:Math.min(2.6,L), half:0.34 }; })();
  const inVista101=(x,y)=>{ const dx=x-SPAWN_KM.x, dy=y-SPAWN_KM.y;
    const along=dx*VISTA101.tx+dy*VISTA101.ty;
    if(along<0.06||along>VISTA101.len) return false;
    return Math.abs(-dx*VISTA101.ty+dy*VISTA101.tx)<VISTA101.half; };
  // Compact camera pocket BEHIND the spawn heading. The authored street camera is
  // ~5u back and no longer orbits, so the previous 9u-wide clearing was unnecessary.
  const inCamOrbit=(x,y)=>{ const dx=x-SPAWN_KM.x, dy=y-SPAWN_KM.y;
    const along=-(dx*VISTA.tx+dy*VISTA.ty);                 // + = behind the spawn
    if(along<-0.08||along>0.78) return false;
    return Math.abs(-dx*VISTA.ty+dy*VISTA.tx)<0.28; };
  const PUBLIC_APPROACHES=LANDMARKS.filter(L=>/Taipei 101|CKS|Night Market/.test(L[3].label||''));
  const inPublicApproach=(x,y)=>{
    for(const L of PUBLIC_APPROACHES){
      const face=(L[3].face||0)*Math.PI/180;
      const fx=-Math.sin(face), fy=-Math.cos(face);          // landmark local +Z / public front
      const dx=(x-L[1])*KM, dy=(y-L[2])*KM;
      const along=dx*fx+dy*fy, cross=Math.abs(-dx*fy+dy*fx), foot=L[3].foot||4;
      const civic=/Taipei 101|CKS/.test(L[3].label||''), half=civic?5.5:3.8, reach=civic?10.0:6.0;
      // Half-width includes the future block's own ~2u footprint, not only the
      // player's centreline; otherwise a facade just outside the strip still
      // overhangs and blocks the public route.
      if(along>foot*0.48 && along<foot+reach && cross<half) return true;
    }
    return false;
  };

  const cityG=new THREE.Group();
  let placed=0;
  const MAXB=520;
  // two passes: gather candidates over the whole spread map, then place densest-
  // first — if MAXB caps the build it thins the open suburbs, never the downtowns
  const cand=[];
  // Authored first-frame walls: seed ordinary blocks along both sides of the
  // Keelung Road / 101 axis, then let the normal terrain + claim checks decide
  // which ones fit around existing landmarks.
  const sideX=-VISTA.ty, sideY=VISTA.tx;
  for(const along of [-0.28,0.12,0.52]) for(const side of [-1,1]){
    cand.push({
      x:SPAWN_KM.x+VISTA.tx*along+sideX*side*0.42,
      y:SPAWN_KM.y+VISTA.ty*along+sideY*side*0.42,
      den:2,
      priority:1
    });
  }
  for(let gx=-17.2; gx<=15.201; gx+=0.36){
    for(let gy=-15.6; gy<=15.201; gy+=0.36){
      const x=gx+rand(-0.11,0.11), y=gy+rand(-0.11,0.11);
      const den=cityDensity(x,y);
      if(rng() > den*0.9 + 0.10) continue;        // density-driven: packed downtown, open elsewhere
      cand.push({x,y,den});
    }
  }
  cand.sort((a,b)=>(b.priority||0)-(a.priority||0) || b.den-a.den);
  for(let ci=0; ci<cand.length && placed<MAXB; ci++){
    { const {x,y,den,priority}=cand[ci];
      if(roadDist(x,y) < ROAD_CLEAR) continue;    // leave a camera-wide corridor along every avenue
      if(RUNWAY && polyDist(x,y,RUNWAY) < 0.36) continue;   // Songshan runway void + apron stays open
      if(inVista(x,y)) continue;                  // protect the spawn street view
      if(inVista101(x,y)) continue;               // …and the spawn → 101 sightline itself
      if(Math.hypot(x-SPAWN_KM.x,y-SPAWN_KM.y) < 0.30) continue;  // immediate player clearance only
      if(inCamOrbit(x,y)) continue;               // camera swing-room behind the spawn heading
      if(inPublicApproach(x,y)) continue;          // keep major public thresholds connected to their streets
      const dir=mapDir(x,y), h=terrain(dir);
      if(h>2.15 || h<WATER+0.5) continue;
      if(riverCarve(x,y)>0.28 || parkWeight(x,y)>0.5) continue;
      const d101=Math.hypot(x,y);
      const tower = !priority && d101<3.4 && rng()<0.2; // framing walls stay ordinary Taipei fabric
      const floors = d101<6.6 ? randi(5,6) : d101<13 ? randi(4,5) : randi(3,5);
      const W=tower?rand(1.8,2.6):rand(2.6,3.6);
      const D=tower?rand(1.6,2.4):rand(2.0,2.6);
      const reach=Math.hypot(W,D)*0.5;       // corners, not just the short collider axis
      const claimR=reach+FACADE_GAP;
      if(!freeSpot(dir,claimR)) continue;
      // face the nearest avenue (roads are the streets the camera walks)
      const e=0.05, rd=roadDist(x,y);
      const gxd=roadDist(x+e,y)-roadDist(x-e,y), gyd=roadDist(x,y+e)-roadDist(x,y-e);
      let fx,fy;
      if(rd<0.9 && Math.hypot(gxd,gyd)>1e-4){ fx=-gxd; fy=-gyd; }
      else { const cell=Math.floor((x+100)/0.9)*3+Math.floor((y+100)/0.9)*5, k=((cell%4)+4)%4;
        fx=k===0?1:k===2?-1:0; fy=k===1?1:k===3?-1:0; }
      const fl=Math.hypot(fx,fy); fx/=fl; fy/=fl;
      const faceDir=mapDir(x+fx*0.05,y+fy*0.05).sub(dir);
      const sink=Math.min(footingSink(dir,reach)+0.08, 0.85);
      const block=tower?buildTower({W,D}):buildShophouse({floors,sink,W,D});
      // A buried masonry skirt follows the measured corner drop. It is hidden
      // on flat plots and becomes a plausible retaining foundation on a grade.
      solidBox(block,SLAB,W+0.12,sink+0.14,D+0.12,0,0.05-sink/2,0);
      placeFacing(block,dir,faceDir,-0.02);
      cityG.add(block);
      claim(dir,claimR);
      colliders.push({
        dir:dir.clone(),
        ar:(reach+0.10)/R,
        h:block.userData.bodyH+(tower?0.8:0.55)
      });
      placed++;
    }
  }
  planetGroup.add(bakeMerge(cityG));
  window.__blocksPlaced=placed;
  console.log('[build] city blocks:', placed, placed>=MAXB?'(MAXB cap hit)':'');
  return placed;
}

// --- STREET LAYER: kerbside trees + street lights down selected avenues.
//     The furnishing strip is inside the pale sidewalk apron, never on asphalt.
//     Broad roads get occasional trees; lights use a wider set of main streets.
//     Both alternate sides and leave junctions, landmarks and the spawn view open.
function kerbPoints(stepKm, offExtraKm){
  const pts=[];
  for(let ri=0;ri<BLVD.length;ri++){
    const Rd=BLVD[ri];
    const off=Rd.w/2 + 0.045 + (offExtraKm||0);          // just past the kerb
    for(let i=0;i<Rd.pts.length-1;i++){
      const a=Rd.pts[i], b=Rd.pts[i+1];
      const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy);
      const tx=dx/len, ty=dy/len, px=-ty, py=tx;
      let slot=0;
      for(let d=stepKm*0.5; d<len; d+=stepKm,slot++){
        for(const side of [-1,1]){
          const x=a[0]+tx*d+px*off*side, y=a[1]+ty*d+py*off*side;
          pts.push({x,y,side,tx,ty,road:Rd,roadIndex:ri,segmentIndex:i,slot});
        }
      }
    }
  }
  return pts;
}
// A segment offset alone is not safe near a bend or crossing: a point that is
// beside one street can still be in another street's carriageway. Require the
// final point to sit in its source sidewalk and outside every road's asphalt.
function isSidewalkFurniturePoint(p, roadMarginKm){
  const sourceDist=polyDist(p.x,p.y,p.road.pts);
  if(sourceDist < p.road.w/2+roadMarginKm || sourceDist > p.road.w/2+0.055) return false;
  for(const Rd of BLVD){
    if(polyDist(p.x,p.y,Rd.pts) < Rd.w/2+roadMarginKm) return false;
  }
  return true;
}
function buildStreetLayer(){
  const dummy=new THREE.Object3D(), tmpCol=new THREE.Color();
  // ---- young street trees: crown begins above head height, ~3u overall ----
  const slots=[];
  for(const p of kerbPoints(1.05,-0.006)){
    if(p.road.w<0.24) continue;                         // boulevard planting, not every side street
    const keepSide=((p.roadIndex+p.segmentIndex+p.slot)&1) ? 1 : -1;
    if(p.side!==keepSide || rng()<0.18) continue;        // one alternating kerb, with natural gaps
    if(!isSidewalkFurniturePoint(p,0.018)) continue;     // includes junction clearance
    const dir=mapDir(p.x,p.y), h=terrain(dir);
    if(h<WATER+0.55 || h>2.1) continue;
    if(riverCarve(p.x,p.y)>0.3) continue;
    if(Math.hypot(p.x-SPAWN_KM.x,p.y-SPAWN_KM.y)<0.72) continue;
    const s=rand(0.90,1.08), clear=1.25+s*0.18;          // reserve breathing room around the crown
    if(!freeSpot(dir,clear)) continue;
    slots.push({dir,s,clear});
    claim(dir,clear);                                    // reserve now so selected canopies cannot overlap
  }
  const N=slots.length;
  window.__streetTrees=N;
  if(N){
    // The lowest crown lobe starts at ~2.09u. Let the visible trunk overlap it
    // slightly: the former 1.82u trunk left a literal floating-crown gap.
    const trunkGeo=faceted(new THREE.CylinderGeometry(0.10,0.15,2.16,7)); trunkGeo.translate(0,1.08,0);
    const canopyGeo=(()=>{                                // layered blob silhouette (merged, still instanced)
      const a=new THREE.IcosahedronGeometry(0.52,1); a.scale(1.14,0.82,1.14); a.translate(0,2.52,0);
      const b=new THREE.IcosahedronGeometry(0.42,1); b.scale(1.06,0.82,1.06); b.translate(0.20,2.84,0.06);
      const c=new THREE.IcosahedronGeometry(0.34,1); c.scale(1.0,0.78,1.0); c.translate(-0.27,2.72,-0.08);
      return faceted(mergeGeometries([a,b,c],false));
    })();
    const trunks=new THREE.InstancedMesh(trunkGeo, toon('#76604a'), N);
    const canopies=new THREE.InstancedMesh(canopyGeo, toon('#ffffff'), N);
    trunks.frustumCulled=canopies.frustumCulled=false;
    const colArr=new Float32Array(N*3);
    const greens=['#7d9668','#89a071','#718c5e','#95ac80','#677f55'];   // desaturated sage family
    for(let i=0;i<N;i++){
      const {dir,s}=slots[i];
      placeOnSurface(dummy,dir,0,rand(0,6.28)); dummy.scale.set(s,s*rand(0.94,1.12),s); dummy.updateMatrix();
      trunks.setMatrixAt(i,dummy.matrix); canopies.setMatrixAt(i,dummy.matrix);
      tmpCol.set(pick(greens)).offsetHSL(0,rand(-0.03,0.03),rand(-0.05,0.05));
      colArr[i*3]=tmpCol.r; colArr[i*3+1]=tmpCol.g; colArr[i*3+2]=tmpCol.b;
    }
    canopies.instanceColor=new THREE.InstancedBufferAttribute(colArr,3);
    planetGroup.add(trunks); planetGroup.add(canopies);
    // flat shadow discs ground the street trees (shadow maps are off)
    const shadGeo=faceted(new THREE.CircleGeometry(0.5,12)); shadGeo.rotateX(-Math.PI/2); shadGeo.translate(0,0.03,0);
    const shads=new THREE.InstancedMesh(shadGeo, new THREE.MeshBasicMaterial({color:'#20302c',transparent:true,opacity:0.14,depthWrite:false}), N);
    shads.frustumCulled=false;
    for(let i=0;i<N;i++){ placeOnSurface(dummy,slots[i].dir,0,0); dummy.scale.set(slots[i].s*1.35,1,slots[i].s*1.35); dummy.updateMatrix(); shads.setMatrixAt(i,dummy.matrix); }
    planetGroup.add(shads);
  }
  // ---- Taipei street lights: comfortably above people, sparse and alternating ----
  const lamps=new THREE.Group();
  const poleM=toon('#7c828a'), headM=toon('#fff0c4',{emissive:'#ffcf7a',emissiveIntensity:0.9});
  let lampCount=0;
  for(const p of kerbPoints(1.55,-0.003)){
    if(p.road.w<0.22) continue;                          // no blanket lighting on tiny local streets
    const keepSide=((p.roadIndex+p.segmentIndex+p.slot)&1) ? -1 : 1;
    if(p.side!==keepSide) continue;                      // one pole per interval, alternating kerbs
    if(!isSidewalkFurniturePoint(p,0.016)) continue;      // never place a pole in a crossing road
    const dir=mapDir(p.x,p.y), h=terrain(dir);
    if(h<WATER+0.55 || h>2.1) continue;
    if(riverCarve(p.x,p.y)>0.3) continue;
    if(Math.hypot(p.x-SPAWN_KM.x,p.y-SPAWN_KM.y)<0.58) continue;
    if(!freeSpot(dir,0.42)) continue;
    const g=new THREE.Group();
    const pole=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.045,0.07,3.55,8)),poleM); pole.position.y=1.775; pole.castShadow=true; g.add(pole);
    const arm=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.03,0.038,0.90,7)),poleM);
    arm.position.set(0,3.49,0.41); arm.rotation.x=Math.PI/2-0.16; g.add(arm);
    const head=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.14,0.07,0.36)),headM); head.position.set(0,3.63,0.80); g.add(head);
    // aim the arm out over the roadway
    const toRoad=mapDir(p.x - p.side*(-p.ty)*0.05, p.y - p.side*(p.tx)*0.05).sub(dir);
    placeFacing(g,dir,toRoad,0);
    lamps.add(g);
    claim(dir,0.42);
    lampCount++;
  }
  window.__streetLights=lampCount;
  if(lampCount) planetGroup.add(bakeMerge(lamps));
}
// --- CITY FLAVOUR: the street-level details that make it feel like Taipei —
//     parked scooter clusters, YouBike stands, the green+red mailbox pair,
//     MRT entrances, a paved spawn plaza, temple incense and one musical
//     garbage truck. All kerb-biased (eye-level dressing), all muted palette.
let garbageTruckPos=null, youBikeStationSites=[];
function reserveYouBikeStations(){
  // A small authored network on dry park edges and low-density sidewalk
  // shoulders. Each station sits outside its road with enough centreline offset
  // for the road half-width, the model's full road-facing depth (1.25u), and
  // breathing room. Riverside sites are deliberately excluded: a river-carve
  // check catches visually grassy samples that still belong to a water channel.
  const sites=[
    // One station at Da'an; the western pair are in separate neighbourhoods.
    {road:'xinyi-road',segment:0,side:1,ts:[0.94,0.90,0.98]},
    {road:'zhongshan',segment:0,side:-1,ts:[0.25,0.18,0.32],minPark:0,maxDensity:0.55},
    {road:'roosevelt',segment:0,side:-1,ts:[0.45,0.38,0.52],minPark:0,maxDensity:0.55},
    // A quieter sidewalk bay along 228 Peace Memorial Park.
    {road:'zhongxiao',segment:0,side:1,ts:[0.55,0.52,0.58]},
    // Dry inland edge near the Elephant Mountain trailhead.
    {road:'heping',segment:2,side:1,ts:[0.50,0.46,0.54],minPark:0.05},
    // Four low-density neighbourhood shoulders, well away from waterways.
    {road:'heping',segment:2,side:-1,ts:[0.85,0.78,0.70],minPark:0,maxDensity:0.15},
    {road:'xinyi-road',segment:5,side:-1,ts:[0.85,0.78,0.92],minPark:0,maxDensity:0.48},
    {road:'dunhua',segment:2,side:-1,ts:[0.25,0.18,0.32],minPark:0,maxDensity:0.18},
    {road:'fuxing',segment:1,side:-1,ts:[0.85,0.78,0.92],minPark:0,maxDensity:0.42},
  ];
  for(const site of sites){
    const Rd=BLVD.find(r=>r.id===site.road); if(!Rd) continue;
    const a=Rd.pts[site.segment], b=Rd.pts[site.segment+1];
    const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy);
    const nx=-dy/len*site.side, ny=dx/len*site.side, off=Rd.w/2+(1.25+0.35)/KM;
    for(const t of site.ts){
      const rx=a[0]+dx*t, ry=a[1]+dy*t, x=rx+nx*off, y=ry+ny*off;
      const dir=mapDir(x,y), h=terrain(dir);
      if(h<WATER+0.55 || h>2.1 || isWater(dir) || riverCarve(x,y)>0.12) continue;
      if(parkWeight(x,y)<(site.minPark??0.30) || cityDensity(x,y)>(site.maxDensity??1)) continue;
      if(youBikeStationSites.some(other=>dir.angleTo(other.dir)*R<10)) continue;
      if(!freeSpot(dir,1.58)) continue;
      youBikeStationSites.push({dir,roadDir:mapDir(rx,ry)});
      claim(dir,1.58);                                    // reserve before trees/kerb props scatter
      break;
    }
  }
  window.__youBikeStations=youBikeStationSites.length;
}
function buildCityFlavour(){
  const mDark=toon('#2e3236'), mSeat=toon('#3a3e42'), mChrome=toon('#c9cdd1');
  const mGreen=toon('#2e6e52'), mRed=toon('#a34434'), mMrt=toon('#31567F');
  const mBikeWhite=toon('#eef0e9'), mBikeYellow=toon('#f5b700'), mBikeGreen=toon('#36a57b');
  const mBikeMetal=toon('#9ea5a8'), mBasket=toon('#555b5e');
  const mRack=toon('#7c828a'), mPave=toon('#cfc8b6'), mPaveD=toon('#b8b09c');
  const mGlow=toon('#fff0c4',{emissive:'#ffcf7a',emissiveIntensity:0.6});
  const SCOOTS=['#8a9096','#b8b3a6','#6f7d8c','#a06a5a','#5a7d6f'].map(c=>toon(c));
  const sBox=(g,mat,w,h,d,x,y,z)=>{ const m=new THREE.Mesh(faceted(new THREE.BoxGeometry(w,h,d)),mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; g.add(m); return m; };
  const sCyl=(g,mat,rt,rb,h,seg,x,y,z)=>{ const m=new THREE.Mesh(faceted(new THREE.CylinderGeometry(rt,rb,h,seg)),mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; g.add(m); return m; };
  const sRod=(g,mat,r,a,b,seg=6)=>{ const av=new THREE.Vector3(...a), d=new THREE.Vector3(...b).sub(av), len=d.length();
    const m=sCyl(g,mat,r,r,len,seg,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.multiplyScalar(1/len)); return m; };
  const wheel=(g,r,x,y,z)=>{ const m=new THREE.Mesh(faceted(new THREE.CylinderGeometry(r,r,0.045,9)),mDark); m.rotation.z=Math.PI/2; m.position.set(x,y,z); m.castShadow=true; g.add(m); return m; };

  function makeScooter(){
    const g=new THREE.Group(); const body=pick(SCOOTS);
    sBox(g,body,0.16,0.09,0.40,0,0.20,0);                 // deck
    sBox(g,mSeat,0.16,0.08,0.22,0,0.30,-0.09);            // seat
    sBox(g,body,0.15,0.24,0.05,0,0.28,0.17);              // front shield
    sCyl(g,mChrome,0.014,0.014,0.16,5,0,0.45,0.16);       // column
    sBox(g,mDark,0.20,0.03,0.04,0,0.53,0.15);             // handlebar
    wheel(g,0.075,0,0.075,0.22); wheel(g,0.075,0,0.075,-0.17);
    return g;
  }
  function makeScooterRow(n){
    const g=new THREE.Group();
    for(let i=0;i<n;i++){ const s=makeScooter(); s.position.x=(i-(n-1)/2)*0.26; s.rotation.y=rand(-0.12,0.12); g.add(s); }
    return { obj:g, ar:0.16+n*0.13, h:0.8 };
  }
  function makeYouBike(){
    const g=new THREE.Group();
    // Full-size YouBike 2.0 proportions beside the ~1.75u-tall player. The old
    // 0.31u-high bikes read as toys; these use 0.68u wheels, a 0.95u saddle and
    // 1.08u handlebars, close to a real upright city bike.
    const HUB_Y=0.35, WHEEL_R=0.34, REAR_Z=-0.64, FRONT_Z=0.64;
    const addBikeWheel=(b,z)=>{
      const tire=new THREE.Mesh(faceted(new THREE.TorusGeometry(WHEEL_R,0.035,6,16)),mDark);
      tire.rotation.y=Math.PI/2; tire.position.set(0,HUB_Y,z); tire.castShadow=true; b.add(tire);
      const rim=new THREE.Mesh(faceted(new THREE.TorusGeometry(0.295,0.012,5,16)),mBikeMetal);
      rim.rotation.y=Math.PI/2; rim.position.set(0,HUB_Y,z); rim.castShadow=true; b.add(rim);
      for(let j=0;j<8;j++){ const a=j/8*Math.PI*2;
        sRod(b,mBikeMetal,0.005,[0,HUB_Y,z],[0,HUB_Y+Math.cos(a)*0.285,z+Math.sin(a)*0.285],4); }
      const axle=sCyl(b,mChrome,0.025,0.025,0.14,6,0,HUB_Y,z); axle.rotation.z=Math.PI/2;
      const fender=new THREE.Mesh(faceted(new THREE.TorusGeometry(0.375,0.021,5,12,Math.PI)),mBikeYellow);
      fender.rotation.y=Math.PI/2; fender.position.set(0,HUB_Y,z); fender.castShadow=true; b.add(fender);
    };
    const addBasket=(b)=>{
      // Open rails keep the basket legible without turning it into a heavy box.
      sBox(b,mBasket,0.44,0.018,0.28,0,0.66,0.75);
      for(const y of [0.68,0.79,0.90]) for(const z of [0.61,0.89]) sBox(b,mBasket,0.48,0.015,0.015,0,y,z);
      for(const x of [-0.23,0.23]){
        sBox(b,mBasket,0.015,0.24,0.015,x,0.79,0.89);
        sBox(b,mBasket,0.015,0.015,0.30,x,0.90,0.75);
      }
      for(const x of [-0.15,0,0.15]) sBox(b,mBasket,0.012,0.23,0.012,x,0.79,0.89);
    };

    // Low ground rail and one compact white/yellow dock per bicycle.
    sBox(g,mRack,1.72,0.055,0.08,0,0.08,1.06);
    for(let i=0;i<3;i++){
      const x=(i-1)*0.62, b=new THREE.Group(); b.position.x=x; g.add(b);
      addBikeWheel(b,REAR_Z); addBikeWheel(b,FRONT_Z);

      // White step-through frame, twin fork, seat post and upright bars.
      sRod(b,mBikeWhite,0.045,[0,0.39,-0.08],[0,0.58,0.43],7);  // down tube
      sRod(b,mBikeWhite,0.035,[0,HUB_Y,REAR_Z],[0,0.76,-0.28],6);
      sRod(b,mBikeWhite,0.034,[0,0.76,-0.28],[0,0.39,-0.08],6);
      sRod(b,mBikeWhite,0.028,[0,HUB_Y,REAR_Z],[0,0.39,-0.08],5);
      sRod(b,mBikeWhite,0.030,[0,0.64,-0.26],[0,0.56,0.40],6);  // low step-through rail
      sRod(b,mBikeWhite,0.038,[0,0.55,0.42],[0,0.86,0.48],7);  // head tube
      for(const fx of [-0.035,0.035]) sRod(b,mBikeWhite,0.022,[fx,0.58,0.44],[fx,HUB_Y,FRONT_Z],5);
      sRod(b,mChrome,0.022,[0,0.75,-0.28],[0,0.94,-0.30],6);
      sBox(b,mSeat,0.20,0.055,0.27,0,0.96,-0.31);
      sRod(b,mChrome,0.021,[0,0.84,0.48],[0,1.04,0.50],6);
      sRod(b,mChrome,0.018,[-0.24,1.06,0.50],[0.24,1.06,0.50],6);
      sRod(b,mDark,0.023,[-0.24,1.06,0.50],[-0.15,1.06,0.50],6);
      sRod(b,mDark,0.023,[0.15,1.06,0.50],[0.24,1.06,0.50],6);

      // YouBike's yellow rear skirt/chain guard and turquoise brand accent.
      for(const sx of [-1,1]){
        const skirt=new THREE.Mesh(faceted(new THREE.CircleGeometry(0.305,12,0,Math.PI)),mBikeYellow);
        skirt.rotation.y=sx*Math.PI/2; skirt.position.set(sx*0.052,HUB_Y,REAR_Z); skirt.castShadow=true; b.add(skirt);
      }
      sRod(b,mBikeYellow,0.060,[0,HUB_Y,REAR_Z],[0,0.39,-0.08],8);
      const crank=sCyl(b,mBikeYellow,0.105,0.105,0.09,10,0,0.39,-0.08); crank.rotation.z=Math.PI/2;
      sRod(b,mBikeGreen,0.014,[0.060,0.60,-0.71],[0.060,0.54,-0.67],5);
      sRod(b,mBikeGreen,0.014,[0.060,0.54,-0.67],[0.060,0.60,-0.63],5);
      addBasket(b);

      sBox(g,mBikeWhite,0.24,0.045,0.42,x,0.035,1.04);    // dock foot
      sBox(g,mBikeWhite,0.13,0.48,0.13,x,0.29,1.07);      // dock post
      sBox(g,mBikeYellow,0.15,0.16,0.055,x,0.48,1.005);   // yellow reader/lock face
      sBox(g,mBikeGreen,0.10,0.030,0.060,x,0.49,0.972);   // availability light
    }
    return { obj:g, ar:1.5, h:1.2 };
  }
  function makeMailboxPair(){
    const g=new THREE.Group();
    let px=-0.14;
    for(const mat of [mGreen,mRed]){
      sBox(g,mat,0.20,0.42,0.20,px,0.35,0);               // body on legs
      const top=sBox(g,mat,0.21,0.10,0.21,px,0.60,0); top.rotation.x=0.18;  // slanted cap
      sBox(g,mDark,0.12,0.02,0.02,px,0.48,0.105);         // slot
      sBox(g,mRack,0.03,0.14,0.03,px-0.07,0.07,0.06); sBox(g,mRack,0.03,0.14,0.03,px+0.07,0.07,-0.06);
      px+=0.28;
    }
    return { obj:g, ar:0.4, h:0.9 };
  }
  function makeMRTEntrance(){
    const g=new THREE.Group();
    sBox(g,mDark,0.9,0.05,1.25,0,0.03,0);                 // stairwell mouth
    for(let i=0;i<4;i++) sBox(g,toon('#3a3a3d'),0.72,0.04,0.2,0,0.05,0.42-i*0.2);   // steps down
    for(const sx of [-1,1]){                              // see-through railings (never block the camera)
      sBox(g,mChrome,0.03,0.04,1.25,sx*0.47,0.42,0);
      for(let i=0;i<5;i++) sCyl(g,mChrome,0.012,0.012,0.4,5,sx*0.47,0.22,-0.5+i*0.25);
    }
    for(const sx of [-1,1]) for(const sz of [-1,1]) sCyl(g,mChrome,0.02,0.025,0.72,6,sx*0.42,0.36,sz*0.55);
    sBox(g,toon('#bfe3e0',{transparent:true,opacity:0.55}),1.05,0.04,1.4,0,0.74,0); // glass canopy
    sBox(g,mMrt,1.05,0.05,0.06,0,0.72,0.7);
    sBox(g,mMrt,0.34,0.3,0.06,0,0.95,0.68);               // blue station sign
    sBox(g,mGlow,0.2,0.18,0.03,0,0.95,0.72);              // lit panel
    return { obj:g, ar:0.85, h:1.5 };
  }
  function makeGarbageTruck(){
    const g=new THREE.Group(); const Y=toon('#c9a13b'), YD=toon('#a8842e');
    sBox(g,Y,0.5,0.4,0.42,0,0.42,0.44);                   // cab
    sBox(g,toon('#3f4b56'),0.44,0.16,0.05,0,0.52,0.66);   // windshield
    sBox(g,Y,0.56,0.55,0.85,0,0.5,-0.24);                 // bin body
    sBox(g,YD,0.58,0.08,0.87,0,0.80,-0.24);               // lid
    wheel(g,0.11,-0.26,0.11,0.42); wheel(g,0.11,0.26,0.11,0.42);
    wheel(g,0.11,-0.26,0.11,-0.42); wheel(g,0.11,0.26,0.11,-0.42);
    return { obj:g, ar:0.85, h:1.1 };
  }

  // ---- kerb placement helper -----------------------------------------
  const spots=kerbPoints(0.9,0.012);
  function takeKerb(minR){
    for(let t=0;t<80;t++){
      const p=spots[randi(0,spots.length-1)];
      const dir=mapDir(p.x,p.y), h=terrain(dir);
      if(h<WATER+0.55 || h>2.1) continue;
      if(riverCarve(p.x,p.y)>0.3) continue;
      if(Math.hypot(p.x-SPAWN_KM.x,p.y-SPAWN_KM.y)<0.5) continue;
      if(!freeSpot(dir,minR)) continue;
      return { dir, p };
    }
    return null;
  }
  function placeKerb(res, at, faceRoad){
    const { obj, ar, h }=res;
    const toRoad=mapDir(at.p.x + at.p.side*at.p.ty*0.05, at.p.y - at.p.side*at.p.tx*0.05).sub(at.dir);
    if(faceRoad) placeFacing(obj, at.dir, toRoad, 0);
    else placeOnSurface(obj, at.dir, 0, rand(0,6.28));
    planetGroup.add(bakeMerge(obj));
    colliders.push({dir:at.dir.clone(), ar:(ar*0.8)/R, h});
    claim(at.dir, ar*1.05);
  }
  for(let i=0;i<16;i++){ const at=takeKerb(1.0); if(at) placeKerb(makeScooterRow(randi(3,6)), at, true); }
  for(let i=0;i<6;i++){ const at=takeKerb(0.6); if(at) placeKerb(makeMailboxPair(), at, true); }
  for(let i=0;i<6;i++){ const at=takeKerb(1.1); if(at) placeKerb(makeMRTEntrance(), at, true); }

  // Only the authored dry, quiet stations: no procedural copies, and none
  // in the spawn plaza or any carriageway.
  for(const {dir,roadDir} of youBikeStationSites){
    const res=makeYouBike();
    placeFacing(res.obj,dir,roadDir.clone().sub(dir),0); planetGroup.add(bakeMerge(res.obj));
    colliders.push({dir:dir.clone(),ar:(res.ar*0.8)/R,h:res.h});
  }

  // ---- authored MRT stations (real km): Taipei City Hall on Zhongxiao E Rd,
  //      Taipei 101/World Trade Center on Xinyi Rd at Keelung Rd.
  for(const [ax,ay,tx,ty] of [
    [0.02,1.31, 0.02,1.55],      // Taipei City Hall stn — south kerb exit
    [-0.12,1.79, -0.12,1.55],    // Taipei City Hall stn — north kerb exit
    [-0.66,-0.43, -0.7,-0.62],   // Taipei 101/WTC stn — Xinyi Rd north kerb
  ]){
    const w=warpKm(ax,ay);
    const dir=mapDir(w.x,w.y);
    if(!freeSpot(dir,0.9)) continue;
    const res=makeMRTEntrance();
    const wt=warpKm(tx,ty);
    placeFacing(res.obj, dir, mapDir(wt.x,wt.y).sub(dir), 0);
    planetGroup.add(bakeMerge(res.obj));
    colliders.push({dir:dir.clone(), ar:(res.ar*0.8)/R, h:res.h});
    claim(dir, res.ar*1.05);
  }
  { const at=takeKerb(1.2); if(at){ placeKerb(makeGarbageTruck(), at, false);
      garbageTruckPos=at.dir.clone().multiplyScalar(groundR(at.dir)); } }

  // ---- spawn street dressing ---------------------------------------------
  {
    const sDir=mapDir(SPAWN_KM.x,SPAWN_KM.y);
    // Dressing stays off the vista axis and low enough to never block the camera.
    // The former disc + ring made the spawn read as a podium on a model railway;
    // the continuous road surface now runs directly beneath the player.
    const vl=Math.hypot(SPAWN_KM.x,SPAWN_KM.y), ux=-SPAWN_KM.x/vl, uy=-SPAWN_KM.y/vl;   // spawn → 101
    for(const [bx,by,maker] of [[uy,-ux,()=>makeScooterRow(5)],[(uy-ux)*0.71,(-ux-uy)*0.71,makeMailboxPair]]){
      const px=SPAWN_KM.x+bx*0.30, py=SPAWN_KM.y+by*0.30;
      const dir=mapDir(px,py), res=maker(); if(!freeSpot(dir,res.ar)) continue;
      placeFacing(res.obj, dir, sDir.clone().sub(dir), 0); planetGroup.add(bakeMerge(res.obj));
      colliders.push({dir:dir.clone(), ar:(res.ar*0.8)/R, h:res.h}); claim(dir,res.ar);
    }
  }

  // ---- temple incense: gentle smoke over the temple courtyards ---------
  for(const key of ['Longshan','Bao’an']){
    const L=LANDMARKS.find(l=>(l[3].label||'').includes(key));
    if(!L) continue;
    const dir=mapDir(L[1],L[2]);
    houseSmokers.push({pos:dir.clone().multiplyScalar(groundR(dir)+2.3*(L[3].scale||1)), up:dir.clone()});
  }
}
function buildMountainGreenery(){
  const trunkGeo=faceted(new THREE.CylinderGeometry(0.05,0.08,0.5,5)); trunkGeo.translate(0,0.25,0);
  const coneGeo=faceted(new THREE.ConeGeometry(0.32,0.95,6)); coneGeo.translate(0,0.55,0);
  const trunkMat=toon('#6b4a33');
  const N=4800, slots=[];
  for(let i=0;i<N;i++){
    const d=fibSphere(N,i), h=terrain(d), m=dirToMap(d);
    let keep=false;
    if(h>2.55 && h<6.6) keep=rng()<0.34;
    else if(h>WATER+0.5 && h<2.0 && parkWeight(m.x,m.y)>0.5) keep=rng()<0.20;
    if(!keep || riverCarve(m.x,m.y)>0.24 || roadDist(m.x,m.y)<0.24) continue;
    const s=rand(0.72,1.15), clear=0.48+s*0.30;            // reserve the cone canopy, not the trunk
    if(!freeSpot(d,clear)) continue;                       // landmarks, shops, blocks, and prior trees
    slots.push({d,s}); claim(d,clear);
  }
  const C=slots.length;
  window.__mountainTrees=C;
  const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,C), cones=new THREE.InstancedMesh(coneGeo,toon('#ffffff'),C);
  trunks.castShadow=cones.castShadow=true; trunks.receiveShadow=cones.receiveShadow=true;
  const dummy=new THREE.Object3D(), cc=new THREE.Color(), colArr=new Float32Array(C*3);
  const greens=['#4f8f48','#3c6e3a','#5fa84e','#458a3e','#69b257'];
  for(let i=0;i<C;i++){ const {d,s}=slots[i];
    placeOnSurface(dummy,d,0,rand(0,6.28)); dummy.scale.set(s,s*rand(0.9,1.4),s); dummy.updateMatrix();
    trunks.setMatrixAt(i,dummy.matrix); cones.setMatrixAt(i,dummy.matrix);
    cc.set(pick(greens)).offsetHSL(0,rand(-0.03,0.03),rand(-0.05,0.05)); colArr[i*3]=cc.r;colArr[i*3+1]=cc.g;colArr[i*3+2]=cc.b; }
  cones.instanceColor=new THREE.InstancedBufferAttribute(colArr,3);
  planetGroup.add(trunks); planetGroup.add(cones);
}

// --- Da'an Forest Park pond + a few park ponds
function buildParkPonds(){
  for(const pondDefinition of CITY.spaces.ponds){
    const w=warpKm(...pondDefinition.at), dir=mapDir(w.x,w.y);
    const geo=new THREE.CircleGeometry(pondDefinition.radius,28); geo.rotateX(-Math.PI/2);
    const pond=new THREE.Mesh(geo, toon('#5aa6c0')); pond.receiveShadow=true;
    placeOnSurface(pond,dir,0.06,0); planetGroup.add(pond);
  }
}

// --- Maokong gondola: pylons up the south mountain + cabins gliding on the cable
const gondola={cabins:[], tops:[], segLen:[], len:0};
function buildGondola(){
  const definition=CITY.transit.gondola;
  const _lo=warpKm(...definition.from), _up=warpKm(...definition.to);
  const lower=[_lo.x,_lo.y], upper=[_up.x,_up.y], NP=definition.pylons;
  for(let i=0;i<=NP;i++){ const t=i/NP, x=lower[0]+(upper[0]-lower[0])*t, y=lower[1]+(upper[1]-lower[1])*t;
    const dir=mapDir(x,y), p=LM.buildGondolaPylon(CTX); p.scale.setScalar(1.35); placeOnSurface(p,dir,0,0); planetGroup.add(p);
    gondola.tops.push(dir.clone().multiplyScalar(groundR(dir)+3.75)); }
  const cableMat=toon('#3a3d40');
  for(let i=0;i<gondola.tops.length-1;i++){ const a=gondola.tops[i], b=gondola.tops[i+1];
    planetGroup.add(cylBetween(a,b,0.02,cableMat)); const l=a.distanceTo(b); gondola.segLen.push(l); gondola.len+=l; }
  for(let i=0;i<definition.cabins;i++){ const cab=LM.buildGondolaCabin(CTX); planetGroup.add(cab); gondola.cabins.push({obj:cab, s:i/definition.cabins}); }
}
function _pointAlong(frac){ let d=frac*gondola.len; for(let i=0;i<gondola.segLen.length;i++){ if(d<=gondola.segLen[i]){ return gondola.tops[i].clone().lerp(gondola.tops[i+1], d/gondola.segLen[i]); } d-=gondola.segLen[i]; } return gondola.tops[gondola.tops.length-1].clone(); }
function updateGondola(dt){ for(const c of gondola.cabins){ c.s=(c.s+dt*0.03)%1; const p=_pointAlong(c.s), up=p.clone().normalize();
  c.obj.position.copy(p).addScaledVector(up,-1.29); c.obj.quaternion.setFromUnitVectors(UPY, up); } }

// --- Xiangshan (Elephant Mountain) trail: the street stairs SE of Xinyi Rd
//     switchbacking up the city-facing face — hairpins on the flanks, the
//     wooden photographers' deck at the middle bend, then the last flights to
//     the summit platform with the classic Taipei 101 view. The climb is the
//     analytic mountainside the player already walks on — treads, handrails
//     and both platforms are dressing draped along CITY.trails data, so no
//     new physics.
let xiangshanDeckPos=null, xiangshanDeckSeen=false;
let xiangshanSummitPos=null, xiangshanSummitSeen=false;
function buildXiangshanTrail(){
  const trailDefinition=(CITY.trails||[]).find(t=>t.id==='xiangshan-trail');
  if(!trailDefinition) return;
  const pts=warpPts(trailDefinition.path);
  // even arc-length resample so the treads land at a steady stride — the tight
  // stride lays ~600 small steps over the switchback climb, the real
  // endless-staircase count
  const stepKm=0.035/KM, samples=[];
  for(let i=0;i<pts.length-1;i++){
    const [ax,ay]=pts[i], [bx,by]=pts[i+1];
    const len=Math.hypot(bx-ax,by-ay), n=Math.max(1,Math.round(len/stepKm));
    for(let s=0;s<n;s++) samples.push({x:ax+(bx-ax)*s/n, y:ay+(by-ay)*s/n, tx:(bx-ax)/len, ty:(by-ay)/len});
  }
  // the flight pauses at the deck terrace and stops short of the summit platform
  const end=pts[pts.length-1];
  const deckPt=warpKm(...trailDefinition.deckAt);
  const unitsTo=(s,px,py)=>Math.hypot(px-s.x,py-s.y)*KM;
  // dirt shoulder under the flight + the short paved approach from Xinyi Rd
  surfaceRibbon(pts, 0.26, null, 0.03, {mat:toon('#a1977f'), subdiv:6});
  surfaceRibbon(warpPts([[1.784,-0.032], trailDefinition.path[0]]), 0.11, null, 0.045, {mat:toon('#cfc8b6'), subdiv:4});
  const treadGeo=faceted(new THREE.BoxGeometry(1.35,0.3,0.3));
  const treadMats=[toon('#b6b0a2'), toon('#a8a294')];
  const railMat=toon('#2e6e52');                     // the trail's green metal rails
  const stairsG=new THREE.Group();
  let run=[[],[]]; const railRuns=[run];             // rails break at the deck gap
  let treadCount=0;
  for(let i=0;i<samples.length;i++){ const s=samples[i];
    if(unitsTo(s,end[0],end[1])<1.35 || unitsTo(s,deckPt.x,deckPt.y)<1.35){
      if(run[0].length){ run=[[],[]]; railRuns.push(run); }   // platform takes over
      continue;
    }
    const d=mapDir(s.x,s.y);
    const fwd=mapDir(s.x+s.tx*0.01,s.y+s.ty*0.01).sub(d);
    const tread=new THREE.Mesh(treadGeo,treadMats[treadCount++%2]);
    placeFacing(tread,d,fwd,-0.06);                  // 0.3-thick slab: top sits ~0.09 proud
    stairsG.add(tread);
    if(i%20===0){                                    // every ~0.7 units: claim + handrail posts
      claim(d,1.15);                                 // keep blocks, props and forest off the flight
      const up=d.clone(), f=fwd.clone().addScaledVector(up,-fwd.dot(up)).normalize();
      const right=new THREE.Vector3().crossVectors(up,f).normalize();
      for(const side of [0,1]){
        const pd=up.clone().multiplyScalar(groundR(d)).addScaledVector(right, side?0.80:-0.80).normalize();
        const base=pd.clone().multiplyScalar(groundR(pd)+0.02);
        stairsG.add(cylBetween(base, base.clone().addScaledVector(pd,0.88), 0.035, railMat));
        run[side].push(base.clone().addScaledVector(pd,0.86));
      }
    }
  }
  for(const rr of railRuns) for(const side of [0,1]) for(let i=0;i<rr[side].length-1;i++)
    stairsG.add(cylBetween(rr[side][i], rr[side][i+1], 0.028, railMat));
  planetGroup.add(bakeMerge(stairsG));
  // world-space collider from a group-local circle (pier, boulders)
  const worldCol=(anchor,grp,lx,lz,r,h)=>{ const off=new THREE.Vector3(lx,0,lz).applyQuaternion(grp.quaternion);
    const cd=anchor.clone().multiplyScalar(groundR(anchor)).add(off).normalize();
    colliders.push({dir:cd, ar:r/R, h}); };
  // trailhead marker at the first step, front toward the street
  const d0=mapDir(samples[0].x,samples[0].y);
  const streetward=mapDir(samples[0].x-samples[0].tx*0.02, samples[0].y-samples[0].ty*0.02).sub(d0);
  const trailheadObj=LM.buildXiangshanTrailhead(CTX);   // painted panel: keep unmerged (bakeMerge drops UVs)
  placeFacing(trailheadObj,d0,streetward,0);
  planetGroup.add(trailheadObj);
  worldCol(d0,trailheadObj,-1.5,0,0.62,2.0);
  claim(d0,2.2);
  // stage 1 — the wooden photographers' deck on its mid-slope terrace, and
  // stage 2 — the summit platform at the trail's end; both face the city pole,
  // straight at 101, with their open back edge on the stair side
  const dd=mapDir(deckPt.x,deckPt.y);
  const deckObj=LM.buildXiangshanLookout(CTX);
  placeFacing(deckObj,dd,CITY_UP,0);
  planetGroup.add(deckObj);
  claim(dd,2.8);
  xiangshanDeckPos=dd.clone().multiplyScalar(groundR(dd));
  const dl=mapDir(end[0],end[1]);
  const summitObj=LM.buildXiangshanSummit(CTX);
  placeFacing(summitObj,dl,CITY_UP,0);
  planetGroup.add(summitObj);
  addLandmarkLabel(summitObj,'象山 Xiangshan',4.6);   // high enough to clear the 101 sightline from the platform
  claim(dl,2.6);
  xiangshanSummitPos=dl.clone().multiplyScalar(groundR(dl));
  // Forest the massif — the real trail climbs through dense green, and the
  // deck photo has treetops in the foreground. Covers the whole Four Beasts
  // group (Xiangshan plus the Thumb/Lion/Leopard/Tiger ridge running SE), so
  // the extended range reads as one wooded mass. The claims above keep the
  // flights, marker and terraces clear; tree claims also crowd procedural
  // blocks off the lower slopes before buildCityBlocks runs.
  const massifIds=['elephant-mountain','thumb-mountain','lion-leopard-ridge','tiger-mountain'];
  const trunkGeo=faceted(new THREE.CylinderGeometry(0.05,0.08,0.5,5)); trunkGeo.translate(0,0.25,0);
  const coneGeo=faceted(new THREE.ConeGeometry(0.32,0.95,6)); coneGeo.translate(0,0.55,0);
  const trunkMat=toon('#6b4a33'), coneMats=['#4f8f48','#3c6e3a','#5fa84e','#458a3e'].map(c=>toon(c));
  const forest=new THREE.Group();
  // photo line from the deck toward 101 (map origin): a corridor kept clear of
  // treetops so the deck terrace actually gets its skyline shot
  const deckLen=Math.hypot(deckPt.x,deckPt.y), ox=-deckPt.x/deckLen, oy=-deckPt.y/deckLen;
  for(const id of massifIds){
    const mi=CITY.terrain.mountains.findIndex(m=>m.id===id);
    if(mi<0) continue;
    const M=MOUNTAINS[mi];
    const attempts=Math.round(310*M.r*M.r);      // same planting density on every bump
    for(let i=0;i<attempts;i++){
      const a=rng()*Math.PI*2, rr=Math.sqrt(rng())*M.r*0.97;
      const wx=M.x+Math.cos(a)*rr, wy=M.y+Math.sin(a)*rr;
      const d=mapDir(wx,wy);
      const h=terrain(d);
      if(h<1.32 || h>12.2) continue;             // hillside band: above the streets, below the rocky caps
      const vx=wx-deckPt.x, vy=wy-deckPt.y;
      const along=vx*ox+vy*oy, across=Math.abs(vx*oy-vy*ox);
      if(along>-0.05 && along<0.9 && across<0.16) continue;   // the deck's 101 photo line
      if(!freeSpot(d,0.6)) continue;
      claim(d,0.55);
      const tree=new THREE.Group();
      tree.add(new THREE.Mesh(trunkGeo,trunkMat));
      tree.add(new THREE.Mesh(coneGeo,coneMats[i%coneMats.length]));
      const s=rand(0.8,1.3);
      placeOnSurface(tree,d,0,rand(0,6.28)); tree.scale.set(s,s*rand(0.9,1.4),s);
      forest.add(tree);
    }
  }
  planetGroup.add(bakeMerge(forest));
}

// LANDMARKS (with warp + de-clump) now resolves up top, before the planet mesh
// samples terrain(), so every landmark's ground pad is baked into the world.
function placeAllLandmarks(){
  for(const [builder,x,y,opts] of LANDMARKS){
    const placed = placeLandmark(builder, x, y, opts);
    if(opts.pin) buildObservatory(placed, opts.scale||1);   // Taipei 101 carries the pin
  }
}

// --- Taipei 101 observatory: the one hero vertical. Elevator door in the
//     atrium → fade → teleport to a walkable deck high on the tower (its own
//     ground override + an invisible glass ring) → elevator back down.
//     One-off machinery by design — nothing here generalizes.
const OBS={ ready:false, mode:false, dir:null, floorR:0, maxAng:0, upPos:null, downPos:null };
function buildObservatory(anchor, sc){
  const dir=anchor.dir.clone();
  // deck floor caps the crown (local y≈25.9 × scale) — only the slim spire
  // passes through it, like the real 91F outdoor deck
  const deckR = groundR(dir) + 25.9*sc + 0.10;
  const deck=new THREE.Group();
  const silver=toon('#9AA3A8'), glassM=toon('#7FB0AC',{emissive:'#3E5E60',emissiveIntensity:0.15});
  const goldM=toon('#D0A23C',{emissive:'#7A5E1F',emissiveIntensity:0.3});
  const SQ=Math.PI/4, DR=2.05;
  const floor=new THREE.Mesh(faceted(new THREE.CylinderGeometry(DR,DR,0.16,4)),silver);
  floor.rotation.y=SQ; deck.add(floor);
  // glass parapet — 4 panels + corner posts on the square deck's edges
  for(let k=0;k<4;k++){
    const a=k*Math.PI/2;
    const p=new THREE.Mesh(faceted(new THREE.BoxGeometry(2.6,0.85,0.06)),glassM);
    p.position.set(Math.sin(a)*1.42,0.5,Math.cos(a)*1.42); p.rotation.y=a; deck.add(p);
    const post=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.1,0.95,0.1)),silver);
    const b=a+Math.PI/4; post.position.set(Math.sin(b)*1.95,0.55,Math.cos(b)*1.95); deck.add(post);
  }
  // the famous tuned-mass damper, cradled mid-deck
  const damper=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.48,14,10)),goldM);
  damper.position.set(1.0,0.92,0.55); deck.add(damper);
  const cradle=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.3,0.42,0.5,8)),silver);
  cradle.position.set(1.0,0.32,0.55); deck.add(cradle);
  // elevator hut + door back down
  const hut=new THREE.Mesh(faceted(new THREE.BoxGeometry(1.15,1.75,0.7)),silver);
  hut.position.set(0,0.95,-1.55); deck.add(hut);
  const dDoor=new THREE.Mesh(faceted(new THREE.BoxGeometry(0.8,1.45,0.08)),goldM);
  dDoor.position.set(0,0.82,-1.16); deck.add(dDoor);
  deck.quaternion.copy(anchor.obj.quaternion);
  deck.position.copy(dir).multiplyScalar(deckR);
  planetGroup.add(deck);
  OBS.ready=true; OBS.dir=dir; OBS.floorR=deckR+0.08; OBS.maxAng=(DR-0.32)/R;
  OBS.upPos=anchor.obj.localToWorld(new THREE.Vector3(0,1.0*sc,-0.9*sc));   // atrium door (bakeMerge folds scale)
  OBS.downPos=deck.localToWorld(new THREE.Vector3(0,0.9,-1.1));
}
let obsNear=null;   // 'up' | 'down' while the prompt shows
const fadeEl=(()=>{ const d=document.createElement('div');
  d.style.cssText='position:fixed;inset:0;background:#0b0e10;opacity:0;transition:opacity .35s;pointer-events:none;z-index:40';
  document.body.appendChild(d); return d; })();
function rideObservatory(up){
  fadeEl.style.opacity='1';
  setTimeout(()=>{
    if(up){ OBS.mode=true;
      const east=new THREE.Vector3().crossVectors(OBS.dir,CITY_NORTH).normalize();
      surfDir.copy(OBS.dir).applyAxisAngle(east, 0.9/R).normalize();   // arrive beside, not inside, the spire
      alt=0; vVel=0; }
    else { OBS.mode=false; surfDir.copy(OBS.upPos).normalize(); alt=0; vVel=0; }
    heading.copy(CITY_NORTH).addScaledVector(surfDir,-CITY_NORTH.dot(surfDir)).normalize();
    setTimeout(()=>{ fadeEl.style.opacity='0'; }, 120);
  }, 380);
}

// --- the little shops that make Taipei feel lived-in: a convenience store on
//     every block (7-Eleven + FamilyMart), a boba stand, a morning breakfast
//     shop. Small storefronts scattered through the flat basin, near the roads.
//     [builder, xkm, ykm, opts] — one flagship of each brand carries a label.
const SHOPS = CITY.shops.map(({builder,at:[x,y],placement})=>[
  LM[builder], x, y, {...placement}
]);
function placeShops(){
  for(const S of SHOPS){ const w=warpKm(S[1],S[2]); S[1]=w.x; S[2]=w.y; }   // real km → globe-spread km
  // landmarks now sit at their real map spots, so a fixed shop coord can land inside
  // one — nudge each shop in growing rings until it finds clear, walkable ground.
  for(const [builder,x,y,opts] of SHOPS){
    let px=x, py=y, found=freeSpot(mapDir(x,y), opts.claim||1.1);
    for(let ring=1; ring<=4 && !found; ring++){
      for(let a=0; a<8 && !found; a++){
        const th=a/8*Math.PI*2 + ring*0.4, cx=x+Math.cos(th)*ring*0.28, cy=y+Math.sin(th)*ring*0.28;
        const d=mapDir(cx,cy), h=terrain(d);
        if(h<WATER+0.6 || h>2.1) continue;
        if(riverCarve(cx,cy)>0.28) continue;
        if(!freeSpot(d, opts.claim||1.1)) continue;
        px=cx; py=cy; found=true;
      }
    }
    placeLandmark(builder, px, py, opts);
  }
}

function buildTaipeiWorld(){
  buildRivers(); buildRoads(); buildBridges(); buildAirfield(); buildMRT();
  placeAllLandmarks();
  placeShops();
  buildXiangshanTrail();     // claims the stair corridor before blocks & forest scatter
  reserveYouBikeStations();
  buildCityBlocks();
  buildStreetLayer();
  buildCityFlavour();
  buildMountainGreenery();
  buildParkPonds();
  buildGondola();
}
buildTaipeiWorld();

// ---------------------------------------------------------------
//  CHARACTER FACTORY + MOTION — moved to ./character.js
//  (makeCharacter, createCharacterAnimator, MOTION, palettes are imported at top).
//  Taiwan accessories live in ./accessories.js + ./accessories/*.js.
// ---------------------------------------------------------------

// ---------------------------------------------------------------
//  3D UI: speech bubbles & name tags (canvas sprites) + easing
// ---------------------------------------------------------------
const easeOutBack=(t)=>{ const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };
const easeOutCubic=(t)=>1-Math.pow(1-t,3);
const easeInOutQuad=(t)=> t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function roundRect(cx,x,y,w,h,r){ cx.beginPath(); cx.moveTo(x+r,y); cx.arcTo(x+w,y,x+w,y+h,r); cx.arcTo(x+w,y+h,x,y+h,r); cx.arcTo(x,y+h,x,y,r); cx.arcTo(x,y,x+w,y,r); cx.closePath(); }
function makeBubble(text, opts={}){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=256; const cx=cv.getContext('2d');
  cx.font='600 44px Fredoka, system-ui, sans-serif';
  const words=String(text).split(' '); const lines=[]; let line='';
  for(const w of words){ const t=line?line+' '+w:w; if(cx.measureText(t).width>cv.width-90 && line){ lines.push(line); line=w; } else line=t; }
  if(line) lines.push(line);
  const emo = opts.emoji ? _emojiImgCache.get(opts.emoji) : null;
  const emoOk = emo && emo.complete && emo.naturalWidth>0;
  const lh=52, emoH = opts.emoji?66:0, bw=cv.width-30, bh=lines.length*lh+emoH+34, bx=15, by=(cv.height-bh)/2-16;
  cx.fillStyle=opts.bg||'rgba(255,255,255,0.97)'; cx.strokeStyle='#1d332e'; cx.lineWidth=7;
  roundRect(cx,bx,by,bw,bh,30); cx.fill(); cx.stroke();
  cx.beginPath(); cx.moveTo(cv.width/2-20,by+bh-3); cx.lineTo(cv.width/2,by+bh+28); cx.lineTo(cv.width/2+20,by+bh-3); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle=opts.color||'#2e3b3a'; cx.textAlign='center'; cx.textBaseline='middle';
  cx.font='600 44px Fredoka, system-ui, sans-serif';
  lines.forEach((l,i)=> cx.fillText(l, cv.width/2, by+18+i*lh+lh/2));
  if(opts.emoji && emoOk) cx.drawImage(emo, cv.width/2-29, by+18+lines.length*lh, 58,58);
  const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));
  sp.renderOrder=10; sp.scale.set(3.4,1.7,1); return sp;
}
const speechBubbles=[];
function showSpeech(group, text, dur=3, opts={}){
  if(group.userData._speech){ group.remove(group.userData._speech); const i=speechBubbles.findIndex(s=>s.sp===group.userData._speech); if(i>=0) speechBubbles.splice(i,1); }
  const sp=makeBubble(text,opts); sp.position.y=(opts.y||2.35); sp.scale.set(0,0,1); group.add(sp);
  group.userData._speech=sp; speechBubbles.push({sp,group,t:0,dur});
}
function updateSpeech(dt){
  for(let i=speechBubbles.length-1;i>=0;i--){ const b=speechBubbles[i]; b.t+=dt;
    const pop=Math.min(1,b.t/0.18); const s=easeOutBack(pop);
    b.sp.scale.set(3.4*s,1.7*s,1);
    if(b.t>b.dur){ const k=Math.max(0,1-(b.t-b.dur)/0.4); b.sp.material.opacity=k;
      if(k<=0){ b.group.remove(b.sp); if(b.group.userData._speech===b.sp) b.group.userData._speech=null; speechBubbles.splice(i,1); } }
  }
}
function makeLabel(text){
  const cv=document.createElement('canvas'); cv.width=300; cv.height=72; const cx=cv.getContext('2d');
  cx.font='600 38px Fredoka, system-ui, sans-serif'; const w=cx.measureText(text).width; const bw=Math.min(cv.width-8,w+48), bx=(cv.width-bw)/2;
  cx.fillStyle='rgba(29,51,46,0.52)'; roundRect(cx,bx,14,bw,44,22); cx.fill();
  cx.fillStyle='rgba(255,255,255,0.95)'; cx.textAlign='center'; cx.textBaseline='middle'; cx.font='600 38px Fredoka, system-ui, sans-serif';
  cx.fillText(text, cv.width/2, 37);
  const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));
  sp.renderOrder=9; sp.scale.set(1.5,0.36,1); return sp;   // small + soft for close-up viewing
}

// ---------------------------------------------------------------
//  PLAYER
// ---------------------------------------------------------------
const player = new THREE.Group(); scene.add(player);
// There is deliberately no placeholder avatar. The final, name-derived appearance is
// created once at BEGIN, before gameplay is revealed, then reproduced by remote clients
// from the same broadcast name. A placeholder here would be visible through the
// translucent intro and make the final avatar look like a post-join colour swap.
let myAppearance=null;
let myOverrides=null;           // {hairStyle,hair,shirt,accessory} — the four editable fields
let myAppearanceCode='';        // encoded broadcast code for myOverrides
let avatar=null;
let playerAnimator=null;
function localMotionSeed(ap){ return [ap.shirt,ap.pants,ap.skin,ap.hair,ap.hairStyle].join('|'); }
function setLocalAppearance(ap){
  const previousPhase=playerAnimator?playerAnimator.phase:walkPhase;
  myAppearance=ap;
  if(avatar) player.remove(avatar);
  avatar=makeCharacter(ap); player.add(avatar);
  playerAnimator=createCharacterAnimator(avatar,{seed:localMotionSeed(ap),maxSpeed:MOVE,phase:previousPhase,onStep:sfxStep});
}
// grounded blob shadow — stays on the street during jumps, shrinks with height
const playerShadow=new THREE.Mesh(blobShadowGeo, new THREE.MeshBasicMaterial({color:'#20302c',transparent:true,opacity:0.18,depthWrite:false}));
playerShadow.scale.set(0.86,1,0.86); playerShadow.visible=false; scene.add(playerShadow);
// little Taiwanese takeout bag carried (the red-&-white striped 塑膠袋, tied at the top; hidden until carrying)
const parcel = new THREE.Group();
{
  const WHITE='#f4f1e6', REDB='#e0584a', REDD='#c2473b', STRAW='#5ec1c4';
  const bagMat=toon(WHITE), redMat=toon(REDB), redDMat=toon(REDD);
  // bag body — tapered (wider at the base), low-poly
  const body=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.205,0.245,0.40,7)),bagMat); body.position.y=-0.02; body.castShadow=true; parcel.add(body);
  // the signature red stripes wrapping the bag
  for(const sy of [-0.12,0.02,0.15]){ const rr=0.247 - (sy+0.20)/0.40*0.04;
    const stripe=new THREE.Mesh(faceted(new THREE.CylinderGeometry(rr+0.006,rr+0.006,0.05,7)), sy===0.02?redMat:redDMat); stripe.position.y=sy; body.add(stripe); }
  // gathered neck + tied twist
  const neck=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.10,0.205,0.11,7)),bagMat); neck.position.y=0.23; parcel.add(neck);
  const knot=new THREE.Mesh(faceted(new THREE.SphereGeometry(0.075,8,6)),bagMat); knot.scale.set(1.1,0.66,1.1); knot.position.y=0.30; knot.castShadow=true; parcel.add(knot);
  // two tied handle loops sticking up
  const loopGeo=faceted(new THREE.SphereGeometry(0.075,8,6));
  for(const s of [-1,1]){ const loop=new THREE.Mesh(loopGeo,bagMat); loop.scale.set(0.42,1.25,0.55); loop.position.set(s*0.07,0.40,0); loop.rotation.z=s*0.5; loop.castShadow=true; parcel.add(loop); }
  // a little drink straw poking out (the classic Taiwan drink-in-a-bag)
  const straw=new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.016,0.016,0.34,5)),toon(STRAW)); straw.position.set(-0.10,0.40,0.04); straw.rotation.set(0.12,0,0.36); straw.castShadow=true; parcel.add(straw);
  parcel.scale.setScalar(0.78); parcel.position.set(0,1.02,0.34); parcel.visible=false; player.add(parcel);
}

// player surface state
let surfDir = new THREE.Vector3(0,1,0);             // where on the planet
let heading = new THREE.Vector3(0,0,1);             // tangent forward
let alt=0, vVel=0, grounded=true;
let walkPhase=0, curSpeed=0;
const MOVE=3.9, TURN=2.6, GRAV=24.5, JUMP=9.0, FEET=0.0;
const _playerPrevDir=new THREE.Vector3(), _playerMovePrev=new THREE.Vector3(), _playerMoveRight=new THREE.Vector3();
const _playerPrevHeading=new THREE.Vector3(), _playerTurnCross=new THREE.Vector3();
// start at the Xinyi downtown edge, just SE of Taipei 101, on open city ground
// (SPAWN_KM also drives the cleared plaza + protected vista in buildCityBlocks)
surfDir.copy(mapDir(SPAWN_KM.x,SPAWN_KM.y)).normalize();
claim(surfDir.clone(), 0.6);   // keep buildings off the spawn point
// face east along Ren'ai Boulevard; the camera inherits the avenue's corridor
// instead of cutting diagonally across its street walls toward the city pole.
const spawnAheadDir=mapDir(SPAWN_AHEAD_KM.x,SPAWN_AHEAD_KM.y);
heading.copy(spawnAheadDir).addScaledVector(surfDir,-spawnAheadDir.dot(surfDir)).normalize();
// seat the player on the surface immediately (before the loop's first updatePlayer) so the
// first quest's "nearest NPC" onboarding sort measures from the real spawn, not the origin
player.position.copy(surfDir).multiplyScalar(groundR(surfDir)+FEET);

const PLAYER_AR = 0.32/R;
const MAXPUSH = 0.05;   // max angular correction per pushOut (≈1.2u) — bigger than one walk-step, so normal slides are unaffected
// push the player OUT of an obstacle by exactly the overlap depth (stable; never snaps/flings)
function pushOut(cdir, minAng){
  const dot=THREE.MathUtils.clamp(surfDir.dot(cdir),-1,1);
  const ang=Math.acos(dot);
  if(ang>=minAng-1e-4) return false;
  let t=surfDir.clone().addScaledVector(cdir,-dot);            // tangent at cdir toward the player
  if(t.lengthSq()<1e-9){ t.copy(heading); t.addScaledVector(surfDir,-t.dot(surfDir)); if(t.lengthSq()<1e-9) return false; }
  t.normalize();
  const axis=new THREE.Vector3().crossVectors(cdir,t).normalize();
  const corr=Math.min(minAng-ang, MAXPUSH);                    // clamp: even a deep penetration eases out, never teleports
  surfDir.applyAxisAngle(axis, corr).normalize();              // move out by the penetration, keep tangential position
  return true;
}
const NPC_CAP=0.42/R+PLAYER_AR, NPC_COS=Math.cos(NPC_CAP+0.05);
function resolveCollisions(){
  for(let iter=0; iter<4; iter++){
    let any=false;
    for(let j=0;j<colliders.length;j++){ const c=colliders[j];
      const lim=c.ar+PLAYER_AR; if(c._cap!==lim){ c._cap=lim; c._cos=Math.cos(lim+0.05); }   // adaptive broad-phase: safe for any cap size
      if(surfDir.dot(c.dir)<c._cos) continue; if(pushOut(c.dir, lim)) any=true; }
    for(let j=0;j<npcs.length;j++){ const cd=npcs[j].dir; if(surfDir.dot(cd)<NPC_COS) continue; if(pushOut(cd, NPC_CAP)) any=true; }
    if(!any) break;
  }
  heading.addScaledVector(surfDir,-heading.dot(surfDir)).normalize();
}
function updatePlayer(dt){
  const up = surfDir;
  _playerPrevDir.copy(surfDir); _playerPrevHeading.copy(heading);
  // re-orthogonalize heading
  heading.addScaledVector(up, -heading.dot(up)).normalize();
  // turn
  if(inputTurn) heading.applyAxisAngle(up, -inputTurn*TURN*dt);
  // move along surface
  const sp = inputMove*MOVE;
  if(sp!==0){
    _playerMovePrev.copy(surfDir);
    _playerMoveRight.crossVectors(up,heading).normalize();
    const ang = (sp*dt)/R;
    surfDir.applyAxisAngle(_playerMoveRight, ang).normalize();
    if(!OBS.mode && isWater(surfDir)) surfDir.copy(_playerMovePrev);   // can't walk onto water — stop at the shoreline
    heading.addScaledVector(surfDir, -heading.dot(surfDir)).normalize();
  }
  if(OBS.mode){
    // observatory deck: glass ring — clamp inside the parapet instead of
    // resolving ground colliders (those belong to the street 28 units below)
    const ang=surfDir.angleTo(OBS.dir);
    if(ang>OBS.maxAng){
      const axis=new THREE.Vector3().crossVectors(surfDir,OBS.dir);
      if(axis.lengthSq()>1e-10){ axis.normalize(); surfDir.applyAxisAngle(axis, ang-OBS.maxAng).normalize(); }
      heading.addScaledVector(surfDir,-heading.dot(surfDir)).normalize();
    }
  } else resolveCollisions();          // slide around solid props & NPCs
  const travelDistance=Math.abs(sp)>0.01?_playerPrevDir.angleTo(surfDir)*R:0;
  const actualSpeed=Math.min(MOVE*1.25,travelDistance/Math.max(dt,1e-4));
  curSpeed=motionDamp(curSpeed,actualSpeed,8,dt);
  const turnDelta=Math.atan2(_playerTurnCross.crossVectors(_playerPrevHeading,heading).dot(surfDir),THREE.MathUtils.clamp(_playerPrevHeading.dot(heading),-1,1));
  const actualTurnRate=turnDelta/Math.max(dt,1e-4);
  // jump / gravity
  const wasGrounded=grounded;
  vVel -= GRAV*dt; alt += vVel*dt;
  if(alt<=0){ if(!wasGrounded){ doSquash(1.06,0.94); puff(player.position); sfxLand(); } alt=0; vVel=0; grounded=true; } else grounded=false;
  const gR = OBS.mode ? OBS.floorR : groundR(surfDir);
  player.position.copy(surfDir).multiplyScalar(gR+alt+FEET);
  // blob shadow stays glued to the street
  playerShadow.position.copy(surfDir).multiplyScalar(gR);
  playerShadow.quaternion.setFromUnitVectors(UPY, surfDir);
  const shk=1/(1+alt*0.7);
  playerShadow.scale.set(0.86*shk,1,0.86*shk);
  playerShadow.material.opacity=0.18*shk;
  // orient
  const right=new THREE.Vector3().crossVectors(surfDir,heading).normalize();
  const m=new THREE.Matrix4().makeBasis(right,surfDir,heading);
  player.quaternion.setFromRotationMatrix(m);
  // Pose animation follows resolved displacement and actual heading change.
  if(playerAnimator){
    const motion=playerAnimator.update(dt,{distance:travelDistance,speed:actualSpeed,direction:sp<0?-1:1,turnRate:actualTurnRate,grounded,landed:!wasGrounded&&grounded,verticalSpeed:vVel});
    walkPhase=motion.phase;
  }
  // squash / stretch
  if(squashT>=0){ squashT+=dt; const k=Math.min(1,squashT/0.2), e=1-easeOutCubic(k);
    avatar.scale.set(1+(squashSX-1)*e, 1+(squashSY-1)*e, 1+(squashSX-1)*e); if(k>=1){ squashT=-1; avatar.scale.set(1,1,1);} }
}

// ---------------------------------------------------------------
//  NPCs + QUEST SYSTEM
// ---------------------------------------------------------------
const NPC_SHIRTS=['#e07a5f','#81b29a','#f2cc8f','#9d8189','#6d9dc5','#b08968','#c98bb9','#79b473'];
const NPC_NAMES=['Mei','Jun','Hsin','Wei','Yu','Ling','Chen','Ting','Hao','Xin','Fang','Lei','Pei','An','Bao','Jia'];
const npcs=[];
function buildNPCs(){
  let placed=0, tries=0, idx=0;
  while(placed<17 && tries<4000){ tries++;
    const d=fibSphere(200, (placed*9+tries)%200 ).clone();
    d.x+=rand(-0.06,0.06); d.y+=rand(-0.06,0.06); d.z+=rand(-0.06,0.06); d.normalize();
    const h=terrain(d); if(h<WATER+0.8 || h>2.4 || isWater(d)) continue;   // never spawn on the sea or in a river channel
    // spread out
    if(!freeSpot(d,0.85)) continue;
    const name=NPC_NAMES[idx%NPC_NAMES.length];
    // half the neighbours go capless (hair shows), the rest wear a muted cap — no double hats
    // neighbours carry Taiwan accessories too (seeded pick() → same on every client)
    const npcAcc=pick(['boba','easycard','tanghulu','bear','scooterHelmet',null,null]);
    const npcHelmet=npcAcc==='scooterHelmet';
    const g=makeCharacter({shirt:NPC_SHIRTS[idx%NPC_SHIRTS.length],
      cap: npcHelmet?false:(idx%2===0?false:pick(['#b56a63','#c2a05a','#6a9678','#5a7fa0','#cccccc','#b08968'])),
      skin:pick(SKIN), raglan:pick([true,false]), accessory:npcAcc});
    placeOnSurface(g,d,0,rand(0,6.28)); planetGroup.add(g);
    const mark=makeMarker(); mark.visible=false; g.add(mark); mark.position.y=2.85;
    const tag=makeLabel(name); tag.position.y=2.05; tag.visible=false; g.add(tag);
    const blob=addBlobShadow(g,0.5);
    const baseFwd=new THREE.Vector3(1,0,0); baseFwd.addScaledVector(d,-baseFwd.dot(d)); if(baseFwd.lengthSq()<1e-4) baseFwd.set(0,0,1); baseFwd.normalize();
    const npcPhase=rand(0,MOTION_TAU);
    npcs.push({group:g, dir:d.clone(), home:d.clone(), target:d.clone(), wT:rand(2,10), phase:npcPhase, baseFwd, lastFacing:baseFwd.clone(), name, mark, tag, blob,
      anim:createCharacterAnimator(g,{seed:name+'|'+idx,maxSpeed:1.8,intensity:0.78,phase:npcPhase}), busy:false, faceTarget:null, reactT:null});
    claim(d,0.85); idx++; placed++;
  }
}
function makeMarker(){
  const grp=new THREE.Group();
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.26,16,12), toon('#ffd36b',{emissive:new THREE.Color('#caa23a'),emissiveIntensity:0.3}));
  grp.add(ball);
  const bang=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.22,0.02), toon('#5a3d12')); bang.position.y=0.04; grp.add(bang);
  const dot=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.02), toon('#5a3d12')); dot.position.y=-0.13; grp.add(dot);
  grp.userData.ball=ball;
  return grp;
}
buildNPCs();

// quest state
let score=0;
let carrying=false;
let sender=null, recipient=null, pendingRecipient=null, questItem='a snack', firstQuest=true;
// what neighbours ask you to run across town — Taipei street food, market goods & little daily-life things
const PARCELS=['a cup of bubble tea','a box of pineapple cakes','a bowl of beef noodle soup','a basket of xiaolongbao','a portion of stinky tofu','a mango shaved ice','a hot scallion pancake','a tin of Maokong oolong','a temple luck charm','a gua-bao bun','a bag of warm soy milk','a bag of dried mango','a Pingxi sky lantern','a hot wheel cake','an oyster omelette','a fresh egg tart','an EasyCard top-up','a box of sun cakes','a pork pepper bun','a bag of salt-&-pepper chicken','a cup of winter-melon tea','a bowl of grass jelly','a bag of lu-wei','a bag of fresh wax apples'];
const objText=document.getElementById('objText');
const objIcon=document.querySelector('#objective .pin');
const objEl=document.getElementById('objective');
const cap=(s)=>s.charAt(0).toUpperCase()+s.slice(1);

function newQuest(){
  carrying=false; parcel.visible=false; parcelPopT=-1; parcel.scale.setScalar(0.78);
  const free=npcs.filter(n=>!n.busy);
  if(firstQuest){ free.sort((a,b)=>player.position.distanceTo(a.group.position)-player.position.distanceTo(b.group.position)); sender=free[0]; firstQuest=false; }
  else sender=pick(free);
  sender.busy=true; sender.mark.visible=true;
  const free2=npcs.filter(n=>n!==sender && !n.busy);
  pendingRecipient=pick(free2); questItem=pick(PARCELS); recipient=null;
  objIcon.textContent='🧺';
  objText.textContent=`${sender.name} has ${questItem} ready — go grab it!`;
  tw(objEl);
  syncQuestToRoom();
}
function pickUp(){
  carrying=true; parcel.visible=true; parcelPopT=0; doSquash(1.12,0.9);
  sender.mark.visible=false; sender.busy=false;
  showSpeech(sender.group, 'Thanks! 謝謝', 2.2, {emoji:'💛'});
  recipient=pendingRecipient; recipient.busy=true; recipient.mark.visible=true;
  objIcon.textContent='🛵';
  objText.textContent=`Run ${questItem} over to ${recipient.name}!`;
  tw(objEl);
  sfxPickup(); toast('🧺 '+cap(questItem));
  syncQuestToRoom();
}
function deliver(){
  const rg=recipient.group, rpos=rg.position.clone(), rUp=rpos.clone().normalize();
  recipient.mark.visible=false; recipient.busy=false;
  carrying=false; parcel.visible=false; parcelPopT=-1;
  recipient.faceTarget=player.position.clone(); recipient.reactT=0;       // turn & hop
  const handPos=player.localToWorld(new THREE.Vector3(0,1.02,0.34));
  const _rg=rg;
  const th=pick(THANKS);
  tossParcel(handPos, rpos.clone().addScaledVector(rUp,1.1), ()=>{ shockwave(rpos,'#ffe49a'); burst(rpos); sfxCatch(); showSpeech(_rg, th[0], 2.6, {emoji:th[1]}); });
  score++; const sv=document.getElementById('scoreVal'); sv.textContent=score; sv.classList.remove('pop'); void sv.offsetWidth; sv.classList.add('pop');
  camKick=0.7; sfxDeliver(); toast('🥡 Nice run! +1');
  if(room) trySubmitScore();
  setTimeout(newQuest, 700);
  recipient=null; sender=null;
}

// interaction check
let nearTarget=null, _wasNear=false;
function checkInteract(){
  // the observatory elevator outranks quest prompts while you stand at a door
  obsNear=null;
  if(OBS.ready){
    if(!OBS.mode && player.position.distanceTo(OBS.upPos)<2.3){
      obsNear='up'; nearTarget=null; showPrompt('ride up — observatory'); _wasNear=false; return;
    }
    if(OBS.mode && player.position.distanceTo(OBS.downPos)<1.7){
      obsNear='down'; nearTarget=null; showPrompt('ride back down'); _wasNear=false; return;
    }
  }
  const target = carrying ? recipient : sender;
  nearTarget=null;
  if(!target) { hidePrompt(); _wasNear=false; return; }
  const d = player.position.distanceTo(target.group.position);
  const near = d < 3.4;
  if(near){ nearTarget=target; showPrompt(carrying?`hand it over`:`grab it`);
    if(!_wasNear && !carrying && pendingRecipient) showSpeech(target.group, `Could you run ${questItem} over to ${pendingRecipient.name}?`, 6);
  } else hidePrompt();
  _wasNear=near;
}
function doInteract(){
  if(obsNear){ rideObservatory(obsNear==='up'); obsNear=null; hidePrompt(); return; }
  if(!nearTarget) return;
  if(carrying && nearTarget===recipient) deliver();
  else if(!carrying && nearTarget===sender) pickUp();
}
const NPC_SPEED=1.8;                       // gentle stroll (player is 8) — cozy, never frantic
const _na=new THREE.Vector3(), _nt=new THREE.Vector3();
// pick a roaming target out on the grass, near home, clear of solid props & water
function npcWanderTarget(n){
  for(let i=0;i<14;i++){
    const up=n.dir;
    _nt.set(rand(-1,1),rand(-1,1),rand(-1,1)); _nt.addScaledVector(up,-_nt.dot(up));
    if(_nt.lengthSq()<1e-4) continue; _nt.normalize();
    const axis=_na.crossVectors(up,_nt).normalize();
    const cand=n.dir.clone().applyAxisAngle(axis, rand(0.07,0.24)).normalize();   // step 1.7–5.8u away
    const h=terrain(cand);
    if(h<WATER+0.7 || h>2.5 || isWater(cand)) continue;         // keep to the green: off the sea AND river channels, off peaks
    if(cand.angleTo(n.home) > 0.5) continue;                    // don't roam more than ~12u from home
    let blocked=false;
    for(let j=0;j<colliders.length;j++){ const c=colliders[j]; if(c.ar<0.02) continue; if(cand.angleTo(c.dir) < c.ar+0.04){ blocked=true; break; } }
    if(blocked) continue;
    return cand;
  }
  return n.home.clone();
}
function updateNpcLife(dt){
  const t=performance.now()*0.001;
  for(const n of npcs){
    let travelDistance=0;
    const quest = (n===sender || n===recipient);
    if(!quest){
      if(n.pause>0){ n.pause-=dt; n.moving=false; }
      else {
        const toT=n.dir.angleTo(n.target);
        if(toT<0.02){ n.target=npcWanderTarget(n); n.pause=rand(0.9,4.0); n.moving=false; }   // arrived → rest, then pick a new spot
        else {
          const step=Math.min(toT, (NPC_SPEED*dt)/R);
          const axis=_na.crossVectors(n.dir,n.target).normalize();
          const nd=n.dir.clone().applyAxisAngle(axis, step).normalize();
          if(isWater(nd)){ n.target=npcWanderTarget(n); n.pause=rand(0.6,2.0); n.moving=false; }  // shoreline ahead → turn back, pick a new spot
          else {
            n.dir.copy(nd);
            travelDistance=step*R;
            n.baseFwd.copy(n.target).addScaledVector(n.dir,-n.target.dot(n.dir));   // face the way we're walking
            if(n.baseFwd.lengthSq()>1e-6) n.baseFwd.normalize();
            n.moving=true;
          }
        }
      }
    } else { n.moving=false; }
    const up=n.dir;
    let hop=0;
    if(n.reactT!=null){ n.reactT+=dt; hop+=Math.sin(Math.min(1,n.reactT/0.5)*Math.PI)*0.32; if(n.reactT>0.62){ n.reactT=null; n.faceTarget=null; } }
    n.group.position.copy(up).multiplyScalar(groundR(up)+hop);
    if(n.blob) n.blob.position.y=-hop;   // shadow stays on the pavement while they hop
    let fwd = n.faceTarget ? n.faceTarget.clone().sub(n.group.position) : n.baseFwd.clone();
    fwd.addScaledVector(up,-fwd.dot(up)); if(fwd.lengthSq()<1e-4) fwd.copy(n.baseFwd); fwd.normalize();
    const right=new THREE.Vector3().crossVectors(up,fwd).normalize();
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,fwd));
    n.group.quaternion.slerp(q, Math.min(1,dt*6));
    const turnDelta=Math.atan2(_na.crossVectors(n.lastFacing,fwd).dot(up),THREE.MathUtils.clamp(n.lastFacing.dot(fwd),-1,1));
    n.lastFacing.copy(fwd);
    n.anim.update(dt,{distance:travelDistance,speed:travelDistance/Math.max(dt,1e-4),turnRate:turnDelta/Math.max(dt,1e-4),grounded:true});
    if(n.mark.visible){ n.mark.position.y=2.85+Math.sin(t*2+n.phase)*0.18; n.mark.rotation.y+=dt*2; }
    const dd=player.position.distanceTo(n.group.position);
    n.tag.visible = dd<11 && started; if(n.tag.visible) n.tag.material.opacity=THREE.MathUtils.clamp((11-dd)/4,0,1);
  }
}

// confetti burst
const bursts=[];
function burst(pos){
  const grp=new THREE.Group(); scene.add(grp);
  const cols=['#ffd36b','#e9785b','#81b29a','#6d9dc5','#f2cc8f'];
  for(let i=0;i<18;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.16),toon(pick(cols)));
    m.position.copy(pos); const up=pos.clone().normalize();
    const v=up.clone().multiplyScalar(rand(4,8)); v.x+=rand(-4,4);v.y+=rand(-4,4);v.z+=rand(-4,4);
    m.userData.v=v; grp.add(m); }
  grp.userData.t=0; bursts.push(grp);
}
function updateBursts(dt){
  for(let i=bursts.length-1;i>=0;i--){ const g=bursts[i]; g.userData.t+=dt;
    g.children.forEach(m=>{ const up=m.position.clone().normalize(); m.userData.v.addScaledVector(up,-26*dt); m.position.addScaledVector(m.userData.v,dt); m.rotation.x+=dt*6;m.rotation.y+=dt*5; });
    if(g.userData.t>1.4){ scene.remove(g); bursts.splice(i,1); }
  }
}

// ---- JUICE: rings, parcel toss, squash, dust, camera kick ----
let camKick=0, parcelPopT=-1, squashT=-1, squashSX=1, squashSY=1, gtCool=4;
function doSquash(sx,sy){ squashT=0; squashSX=sx; squashSY=sy; }
const dotTex=(()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64; const cx=cv.getContext('2d');
  // flat-filled circle (cel FX — no radial gradient)
  cx.fillStyle='rgba(255,255,255,0.95)'; cx.beginPath(); cx.arc(32,32,28,0,Math.PI*2); cx.fill();
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t; })();
const rings=[];
function shockwave(pos,color='#ffffff'){
  const m=new THREE.Mesh(new THREE.RingGeometry(0.3,0.55,32), new THREE.MeshBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false}));
  const up=pos.clone().normalize(); m.position.copy(pos).addScaledVector(up,0.15);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),up); scene.add(m); rings.push({m,t:0});
}
function updateRings(dt){ for(let i=rings.length-1;i>=0;i--){ const r=rings[i]; r.t+=dt; const k=r.t/0.55; const s=0.3+easeOutCubic(Math.min(1,k))*5.2;
  r.m.scale.set(s,s,s); r.m.material.opacity=Math.max(0,0.85*(1-k)); if(k>=1){ scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i,1);} } }
const tosses=[];
function tossParcel(from,to,onArrive){
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.34,0.34), toon('#d9a441'));
  m.add(new THREE.Mesh(new THREE.BoxGeometry(0.44,0.36,0.06), toon('#b5762a')));
  scene.add(m); tosses.push({m,from:from.clone(),to:to.clone(),t:0,dur:0.4,onArrive});
}
function updateTosses(dt){ for(let i=tosses.length-1;i>=0;i--){ const o=tosses[i]; o.t+=dt; const k=Math.min(1,o.t/o.dur);
  const p=o.from.clone().lerp(o.to,easeInOutQuad(k)); const up=p.clone().normalize(); p.addScaledVector(up,Math.sin(k*Math.PI)*2.4);
  o.m.position.copy(p); o.m.rotation.x+=dt*11; o.m.rotation.y+=dt*8;
  if(k>=1){ scene.remove(o.m); o.m.geometry.dispose(); tosses.splice(i,1); if(o.onArrive) o.onArrive(); } } }
const puffs=[];
function puff(pos){ const up=pos.clone().normalize(); const right=new THREE.Vector3(up.y,up.z,up.x).cross(up).normalize();
  for(let i=0;i<5;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,transparent:true,depthWrite:false,color:0xeef5f0}));
    sp.scale.setScalar(0.6); sp.position.copy(pos).addScaledVector(up,0.1); scene.add(sp);
    const a=rand(0,6.28); const v=right.clone().applyAxisAngle(up,a).multiplyScalar(rand(1.2,2.6)).addScaledVector(up,rand(0.5,1.5));
    puffs.push({sp,v,t:0}); } }
function updatePuffs(dt){ for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i]; p.t+=dt; const up=p.sp.position.clone().normalize();
  p.v.addScaledVector(up,-4*dt); p.sp.position.addScaledVector(p.v,dt); p.sp.scale.setScalar(0.6+p.t*1.6); p.sp.material.opacity=Math.max(0,0.7*(1-p.t/0.6));
  if(p.t>0.6){ scene.remove(p.sp); puffs.splice(i,1); } } }
const THANKS=[['Oh, for me? 謝謝!','💛'],['You’re the best!','⭐'],['多謝啦!','😊'],['Hot and fresh!','😄'],['Tell your mama thanks!','🙏'],['Right on time!','🎉'],['Been craving this!','😋'],['哇, so good!','🥹']];

// ---------------------------------------------------------------
//  AMBIENT LIFE & COZY SURPRISES (smoke, birds, cat, campfire, vista)
// ---------------------------------------------------------------
// chimney smoke
const smokes=[]; let smokeTimer=0;
function updateSmoke(dt){
  smokeTimer-=dt;
  if(smokeTimer<=0 && houseSmokers.length){ smokeTimer=0.5;
    const hs=houseSmokers[Math.floor(rng()*houseSmokers.length)];
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,transparent:true,depthWrite:false,color:0xd9d6cf,opacity:0}));
    sp.position.copy(hs.pos); sp.scale.setScalar(0.4); scene.add(sp);
    smokes.push({sp,up:hs.up,drift:new THREE.Vector3(rand(-0.18,0.18),0,rand(-0.18,0.18)),t:0});
  }
  for(let i=smokes.length-1;i>=0;i--){ const s=smokes[i]; s.t+=dt;
    s.sp.position.addScaledVector(s.up,dt*0.8).addScaledVector(s.drift,dt);
    s.sp.scale.setScalar(0.4+s.t*0.5); s.sp.material.opacity=Math.max(0,Math.sin(Math.min(1,s.t/2.6)*Math.PI)*0.4);
    if(s.t>2.6){ scene.remove(s.sp); smokes.splice(i,1);} }
}
// birds drifting overhead
const birds=[];
function buildBirds(){ const wMat=toon('#444452');
  for(let i=0;i<6;i++){ const nr=mulberry32(311+i*7); const g=new THREE.Group();
    const wing=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.05,0.22),wMat); g.add(wing);
    const axis=new THREE.Vector3(nr()*2-1,nr()*0.7-0.35,nr()*2-1).normalize();
    let perp=new THREE.Vector3(1,0,0); perp.addScaledVector(axis,-perp.dot(axis)); if(perp.lengthSq()<0.02) perp.set(0,0,1); perp.normalize();
    scene.add(g); birds.push({g,wing,axis,perp,ang:nr()*6.28,rad:R+6+nr()*8,speed:0.1+nr()*0.12,phase:nr()*6.28}); }
}
function updateBirds(dt){ const t=performance.now()*0.001;
  for(const b of birds){ b.ang+=b.speed*dt;
    const p=b.perp.clone().applyAxisAngle(b.axis,b.ang).multiplyScalar(b.rad); b.g.position.copy(p);
    const vel=new THREE.Vector3().crossVectors(b.axis,p).normalize(); const up=p.clone().normalize();
    b.g.up.copy(up); b.g.lookAt(p.clone().add(vel)); b.wing.rotation.z=Math.sin(t*9+b.phase)*0.7; }
}
buildBirds();
// a cat that adopts you
let cat=null;
function makeCat(){ const g=new THREE.Group(); const fur=toon('#e79a3a');
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.17,0.3,4,8),fur); body.rotation.z=Math.PI/2; body.position.y=0.26; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,10),fur); head.position.set(0.3,0.36,0); g.add(head);
  for(const sx of[-1,1]){ const ear=new THREE.Mesh(faceted(new THREE.ConeGeometry(0.08,0.13,4)),fur); ear.position.set(0.3,0.52,0.09*sx); g.add(ear); }
  const tail=new THREE.Mesh(new THREE.CapsuleGeometry(0.05,0.32,3,6),fur); tail.position.set(-0.3,0.42,0); tail.rotation.z=-0.7; g.add(tail);
  for(const sx of[-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.032,8,8),toon('#2b2b2b')); e.position.set(0.45,0.38,0.07*sx); g.add(e); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g;
}
(function placeCat(){ for(let i=0;i<600;i++){ const d=fibSphere(600,(i*11)%600); const h=terrain(d); if(h>WATER+0.9 && h<1.8 && freeSpot(d,0.5)){ const g=makeCat(); placeOnSurface(g,d,0,rand(0,6.28)); planetGroup.add(g); addBlobShadow(g,0.32); claim(d,0.5); cat={group:g,dir:d.clone(),following:false,moving:false,meowed:false}; break; } } })();
function updateCat(dt){ if(!cat) return; const t=performance.now()*0.001;
  const ang=cat.dir.angleTo(surfDir);
  if(ang<0.4){ if(!cat.following && !cat.meowed){ cat.meowed=true; sfxMeow(); spawnEmote('❤️',cat.group); } cat.following=true; }
  cat.moving=false;
  if(cat.following && ang>0.062){ cat.dir.lerp(surfDir,Math.min(1,dt*1.1)).normalize(); cat.moving=true; }
  const up=cat.dir; const hop=cat.moving?Math.abs(Math.sin(t*12))*0.06:0;
  cat.group.position.copy(up).multiplyScalar(groundR(up)+hop);
  // the cat model's head/eyes face local +X, so align +X with the direction to
  // the player (the +Z-forward basis the NPCs use would leave it facing sideways)
  let fwd=player.position.clone().sub(cat.group.position); fwd.addScaledVector(up,-fwd.dot(up));
  if(fwd.lengthSq()<1e-6){ fwd.copy(CITY_EAST); fwd.addScaledVector(up,-fwd.dot(up)); }
  fwd.normalize();
  const side=new THREE.Vector3().crossVectors(fwd,up).normalize();   // local +Z, completes a right-handed basis
  cat.group.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd,up,side)),Math.min(1,dt*8));
}
// cozy campfire (warm flicker + embers)
let campfire=null, fireLight=null; const embers=[];
(function buildCampfire(){ let spot=null;
  for(let i=0;i<800;i++){ const d=fibSphere(800,(i*13+5)%800); const h=terrain(d); if(h>WATER+1.0 && h<2.2 && freeSpot(d,1.0)){ spot=d.clone(); break; } }
  if(!spot) return;
  claim(spot,1.0);
  const g=new THREE.Group(); const logMat=toon('#6b4a33');
  for(let i=0;i<5;i++){ const log=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,0.8,6),logMat); const a=i/5*6.28; log.position.set(Math.cos(a)*0.16,0.16,Math.sin(a)*0.16); log.rotation.set(0.6*Math.cos(a),a,0.6*Math.sin(a)); log.castShadow=true; g.add(log); }
  for(let i=0;i<7;i++){ const s=new THREE.Mesh(faceted(new THREE.DodecahedronGeometry(0.12,0)),toon('#9b988a')); const a=i/7*6.28; s.position.set(Math.cos(a)*0.46,0.06,Math.sin(a)*0.46); s.castShadow=true; g.add(s); }
  const flames=[];
  for(let i=0;i<3;i++){ const f=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,transparent:true,depthWrite:false,color:i===0?0xffcf66:(i===1?0xff8c3a:0xffe39a),blending:THREE.AdditiveBlending})); f.position.y=0.34+i*0.1; g.add(f); flames.push(f); }
  fireLight=new THREE.PointLight('#ff9a3c',1.3,9,2.0); fireLight.position.y=0.55; g.add(fireLight);
  placeOnSurface(g,spot,0,0); planetGroup.add(g); colliders.push({dir:spot.clone(),ar:0.62/R,h:1.2});
  campfire={group:g,flames,spot};
})();
function updateCampfire(dt){ if(!campfire) return; const t=performance.now()*0.001;
  campfire.flames.forEach((f,i)=>{ const base=0.6-i*0.13; const s=base*(0.82+Math.sin(t*9+i*1.7)*0.2); f.scale.set(s*0.72,s,1); f.material.opacity=0.65+Math.sin(t*11+i)*0.22; });
  if(fireLight) fireLight.intensity=1.3+Math.sin(t*13)*0.35;
  if(rng()<0.35){ const e=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,transparent:true,depthWrite:false,color:0xffb24a,blending:THREE.AdditiveBlending}));
    e.scale.setScalar(0.1); const up=campfire.spot; e.position.copy(campfire.group.position).addScaledVector(up,0.4); scene.add(e);
    embers.push({sp:e,up,t:0,drift:new THREE.Vector3(rand(-0.25,0.25),0,rand(-0.25,0.25))}); }
  for(let i=embers.length-1;i>=0;i--){ const em=embers[i]; em.t+=dt; em.sp.position.addScaledVector(em.up,dt*0.6).addScaledVector(em.drift,dt);
    em.sp.material.opacity=Math.max(0,0.9*(1-em.t/1.6)); em.sp.scale.setScalar(0.1*(1-em.t/1.6)); if(em.t>1.6){ scene.remove(em.sp); embers.splice(i,1);} }
}
// vista "exhale" chime at a high peak
let vistaT=0, vistaDone=false;
function updateVista(dt){ const h=terrain(surfDir);
  if(h>3.2 && started){ vistaT+=dt; if(vistaT>1.4 && !vistaDone){ vistaDone=true; sfxVista(); toast('🌄 what a view'); } }
  else { vistaT=0; vistaDone=false; }
}

// ---------------------------------------------------------------
//  OBJECTIVE ARROW (HUD compass to current target)
// ---------------------------------------------------------------
const objArrow=document.getElementById('objArrow');
const ARROW_NEAR=24, ARROW_FAR=60;   // compass: solid within NEAR, fades out by FAR — beyond that you get no pointer and must explore to the right neighbourhood
function updateObjArrow(){
  const target = carrying ? recipient : sender;
  if(!target || !started){ objArrow.style.opacity=0; return; }
  if(nearTarget){ objArrow.style.opacity=0; return; }
  const dist = player.position.distanceTo(target.group.position);
  const op = 0.95 * (1 - THREE.MathUtils.smoothstep(dist, ARROW_NEAR, ARROW_FAR));
  if(op < 0.02){ objArrow.style.opacity=0; return; }   // too far — no guidance, go find them
  objArrow.style.opacity=op;
  // direction to target on tangent plane, relative to camera view
  const toT = target.group.position.clone().sub(player.position);
  const up=surfDir;
  toT.addScaledVector(up,-toT.dot(up)).normalize();
  // camera forward projected
  const camF=new THREE.Vector3(); camera.getWorldDirection(camF); camF.addScaledVector(up,-camF.dot(up)).normalize();
  const right=new THREE.Vector3().crossVectors(up,camF).normalize();
  const ang=Math.atan2(toT.dot(right), toT.dot(camF)); // 0 = ahead
  objArrow.style.transform=`translateX(-50%) rotate(${ang}rad)`;
}

// ---------------------------------------------------------------
//  CAMERA FOLLOW — hybrid: STREET (eye-level default) <-> MAP (overview)
//  Two stable ends; wheel past the end of one zone morphs to the other.
// ---------------------------------------------------------------
let camMode='map';                 // intro shows the planet; BEGIN drops to street level
let camBlend=1;                    // 0 = street … 1 = map (smoothed each frame)
let camYaw=0, camPitch=0.46;
let czOrbit = 0;   // turntable angle while the customizer is open
let streetDist=3.6, mapDist=21.0;                  // same screen framing around the human-scaled avatar
const STREET_MIN=3.05, STREET_MAX=4.90, MAP_MIN=13.0, MAP_MAX=38.0;
const camUp=new THREE.Vector3(0,1,0);
const camFollowHeading=heading.clone();
const camLook=player.position.clone().addScaledVector(surfDir,1.63);
let camAvoidYaw=0;                 // automatic shoulder slide around nearby facades
let camPull=1;                     // smoothed occlusion pull-in (fraction of desired dist)
const _camP=new THREE.Vector3(), _camSeg=new THREE.Vector3(), _camDir=new THREE.Vector3(), _camLookGoal=new THREE.Vector3();
const _camTestHeading=new THREE.Vector3(), _camCandidate=new THREE.Vector3();
const CAM_AVOID_ANGLES=[0,0.24,-0.24,0.48,-0.48,0.72,-0.72,0.96,-0.96,1.20,-1.20,1.44,-1.44];
// debug/verification override (bypasses zoom clamps): d<=8 targets street mode, else map
window.__cam=(d,p,y)=>{ if(d!=null){ if(d>8){ camMode='map'; mapDist=d; } else { camMode='street'; streetDist=d; } }
  if(p!=null)camPitch=p; if(y!=null)camYaw=y; return {camMode,streetDist,mapDist,camPitch,camYaw,camAvoidYaw}; };
window.__camMode=(m)=>{ if(m==='street'||m==='map'){ camMode=m; camPitch=(m==='map')?0.46:0.11; camYaw=0; } return camMode; };
// march the look→camera segment; report the first fraction blocked by city
// fabric (building-sized colliders / terrain) so the camera can pull in front
function camBlockT(from,to){
  _camSeg.copy(to).sub(from); const n=9;
  for(let i=2;i<=n;i++){ const t=i/n;
    _camP.copy(from).addScaledVector(_camSeg,t);
    const pr=_camP.length(); _camDir.copy(_camP).multiplyScalar(1/pr);
    const alt=pr-groundR(_camDir);
    if(alt>22.0) continue;                             // above the tallest procedural tower — clear
    if(alt<0.22) return Math.max(0.14,(i-1)/n-0.03);   // dipped into terrain/hill
    for(let j=0;j<colliders.length;j++){ const c=colliders[j];
      if(c.ar*R<0.55) continue;                        // only building-sized blockers
      if(alt >= (c.h!==undefined?c.h:5.0)) continue;   // ray passes over this blocker's silhouette
      if(c._camCos===undefined) c._camCos=Math.cos(c.ar+0.55/R);  // + wall margin: meshes overhang their collider
      if(_camDir.dot(c.dir)>c._camCos) return Math.max(0.14,(i-1)/n-0.03);
    }
  }
  return 1;
}
function updateCamera(dt){
  if(customizing){ return updateCustomizeCam(dt); }
  if(window.__freecam) return;   // debug/verification: hold a fixed framed view
  const up=surfDir;
  camKick=Math.max(0,camKick-dt*2.2);
  const tgt=camMode==='map'?1:0;
  camBlend+=(tgt-camBlend)*Math.min(1,dt*3.5); if(Math.abs(camBlend-tgt)<0.003) camBlend=tgt;
  const b=camBlend;
  const pitch=THREE.MathUtils.lerp(
    THREE.MathUtils.clamp(camPitch,0.02,0.38),        // street: near eye-level
    THREE.MathUtils.clamp(camPitch,0.25,1.25), b);    // map: classic drone
  const dist=THREE.MathUtils.lerp(streetDist,mapDist,b)-camKick;
  const fov=THREE.MathUtils.lerp(58,55,b);
  scene.fog.near=THREE.MathUtils.lerp(42,90,b);        // street: painted depth cueing
  scene.fog.far =THREE.MathUtils.lerp(175,300,b);      // map: the whole planet reads
  if(Math.abs(camera.fov-fov)>0.01){ camera.fov=fov; camera.updateProjectionMatrix(); }
  // The rig is input-locked but not static: heading trails the runner, the look
  // point has its own damping, and speed contributes a restrained look-ahead.
  camFollowHeading.lerp(heading, 1-Math.exp(-dt*5.5));
  camFollowHeading.addScaledVector(up,-camFollowHeading.dot(up));
  if(camFollowHeading.lengthSq()<1e-6) camFollowHeading.copy(heading);
  camFollowHeading.normalize();
  const lookH=THREE.MathUtils.lerp(1.63,1.5,b);        // above the head → runner anchors near the bottom edge
  _camLookGoal.copy(player.position).addScaledVector(up,lookH).addScaledVector(camFollowHeading,curSpeed*0.065*(1-b));
  camLook.lerp(_camLookGoal, 1-Math.exp(-dt*8.5));
  const look=camLook;
  const horiz=Math.cos(pitch)*dist, vert=Math.sin(pitch)*dist+THREE.MathUtils.lerp(1.44,1.6,b);
  // Prefer a clear trailing shoulder angle over collapsing the camera into a
  // close-up. A continuity penalty keeps the chosen side stable in alleys.
  let avoidTarget=0;
  if(b<0.85){
    let bestScore=-1e9;
    for(const a of CAM_AVOID_ANGLES){
      _camTestHeading.copy(camFollowHeading).applyAxisAngle(up,camYaw+a);
      _camCandidate.copy(player.position).addScaledVector(_camTestHeading,-horiz).addScaledVector(up,vert);
      const clear=camBlockT(look,_camCandidate);
      const score=clear-Math.abs(a)*0.012-Math.abs(a-camAvoidYaw)*0.008;
      if(score>bestScore){ bestScore=score; avoidTarget=a; }
    }
  }
  const avoidRate=Math.abs(avoidTarget)>Math.abs(camAvoidYaw)?7.0:2.6;
  camAvoidYaw+=(avoidTarget-camAvoidYaw)*(1-Math.exp(-dt*avoidRate));
  const camF=camFollowHeading.clone().applyAxisAngle(up,camYaw+camAvoidYaw);
  const desired=player.position.clone().addScaledVector(camF,-horiz).addScaledVector(up,vert);
  // occlusion: snap in front of a blocking facade fast, relax back out slowly
  let pull=1;
  if(b<0.85) pull=Math.max(camBlockT(look,desired), Math.min(1,1.22/Math.max(dist,0.01)));
  camPull += (pull<camPull) ? (pull-camPull)*Math.min(1,dt*14) : (pull-camPull)*Math.min(1,dt*2.4);
  if(camPull<0.999) desired.sub(look).multiplyScalar(camPull).add(look);
  camera.position.lerp(desired, 1-Math.exp(-dt*THREE.MathUtils.lerp(6.2,4.5,b)));
  camUp.lerp(up, 1-Math.exp(-dt*8)).normalize();
  camera.up.copy(camUp);
  camera.lookAt(look);
}

// A calm turntable framing the player from the front while the customizer is open.
function updateCustomizeCam(dt){
  const up = surfDir;
  czOrbit += dt * 0.35;                                   // slow orbit
  const dist = 3.4, pitch = 0.16, lookH = 1.5;
  // camFollowHeading trails the (idle) runner; +π puts the camera in front to show the face, then orbit.
  const camF = camFollowHeading.clone().applyAxisAngle(up, Math.PI + czOrbit);
  const horiz = Math.cos(pitch) * dist, vert = Math.sin(pitch) * dist + lookH;
  const look = player.position.clone().addScaledVector(up, lookH);
  const desired = player.position.clone().addScaledVector(camF, -horiz).addScaledVector(up, vert);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 6));   // ease in on open, orbit while open
  camUp.lerp(up, 1 - Math.exp(-dt * 8)).normalize(); camera.up.copy(camUp);
  camera.lookAt(look);
}

// ---------------------------------------------------------------
//  INPUT
// ---------------------------------------------------------------
let inputMove=0, inputTurn=0;          // -1..1
const keys={};
addEventListener('keydown',e=>{ keys[e.code]=true;
  if(e.code==='Space'){ e.preventDefault(); tryJump(); }
  if(e.code==='KeyE') doInteract();
  if(/^Digit[1-9]$/.test(e.code)){ const i=+e.code.slice(5)-1; if(EMOJIS[i]) doEmote(EMOJIS[i]); }
});
addEventListener('keyup',e=>{ keys[e.code]=false; });
function readKeys(){
  let m=0,t=0;
  if(keys.KeyW||keys.ArrowUp) m+=1;
  if(keys.KeyS||keys.ArrowDown) m-=1;
  if(keys.KeyA||keys.ArrowLeft) t-=1;
  if(keys.KeyD||keys.ArrowRight) t+=1;
  if(m||t){ inputMove=m; inputTurn=t; }
  else if(!touchActive){ inputMove=0; inputTurn=0; }
}
function tryJump(){ if(grounded && started && !customizing){ vVel=JUMP; grounded=false; doSquash(0.96,1.04); sfxJump(); } }

// Pointer movement only distinguishes a click from a drag. The street shot is
// intentionally authored like Abeto: yaw follows the runner and pitch is fixed.
let dragging=false, lastX=0,lastY=0, downX=0,downY=0, movedFar=false;
renderer.domElement.addEventListener('pointerdown',e=>{ if(e.target.closest('#touch')) return;
  document.body.classList.remove('menuOpen');
  dragging=true; lastX=e.clientX; lastY=e.clientY; downX=e.clientX; downY=e.clientY; movedFar=false; });
addEventListener('pointermove',e=>{ if(!dragging) return;
  lastX=e.clientX; lastY=e.clientY;
  if(Math.hypot(e.clientX-downX,e.clientY-downY)>6) movedFar=true; });
addEventListener('pointerup',e=>{ if(dragging && !movedFar && started && !e.target.closest('#touch,#emotes,.iconbtn,.bigbtn,#customize')) doInteract(); dragging=false; });
// wheel zoom — in-zone zoom, with a mode flip at the end of each zone
addEventListener('wheel',e=>{
  const d=e.deltaY*0.012;
  if(camMode==='street'){
    streetDist=THREE.MathUtils.clamp(streetDist+d,STREET_MIN,STREET_MAX);
    if(d>0 && streetDist>=STREET_MAX-1e-6){ camMode='map'; camPitch=0.46; mapDist=Math.max(MAP_MIN+2.0,Math.min(mapDist,MAP_MAX)); }
  } else {
    mapDist=THREE.MathUtils.clamp(mapDist+d,MAP_MIN,MAP_MAX);
    if(d<0 && mapDist<=MAP_MIN+1e-6){ camMode='street'; camPitch=0.11; camYaw=0; streetDist=STREET_MAX-0.86; }
  }
},{passive:true});

// touch joystick
const touchEl=document.getElementById('touch');
const joy=document.getElementById('joy'), knob=document.getElementById('joyKnob');
let touchActive=false, joyId=null, joyCx=0,joyCy=0;
function isTouch(){ return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; }
function setupTouch(){
  // Floating joystick: invisible until the thumb lands anywhere in the lower-left
  // zone, then it appears centred under the touch point (abeto-style clean screen).
  const zone=document.getElementById('joyZone');
  zone.addEventListener('pointerdown',e=>{ joyId=e.pointerId; joyCx=e.clientX; joyCy=e.clientY;
    const half=(joy.offsetWidth||120)/2;
    joy.style.left=(joyCx-half)+'px'; joy.style.top=(joyCy-half)+'px'; joy.classList.add('live');
    document.body.classList.remove('menuOpen');
    try{zone.setPointerCapture(e.pointerId);}catch(_){} touchActive=true; moveJoy(e); });
  zone.addEventListener('pointermove',e=>{ if(e.pointerId===joyId) moveJoy(e); });
  const end=e=>{ if(e.pointerId===joyId){ joyId=null; touchActive=false; inputMove=0; inputTurn=0; knob.style.transform='translate(-50%,-50%)'; joy.classList.remove('live'); } };
  zone.addEventListener('pointerup',end); zone.addEventListener('pointercancel',end);
  function moveJoy(e){ let dx=e.clientX-joyCx, dy=e.clientY-joyCy; const mag=Math.hypot(dx,dy)||1; const max=52; const cl=Math.min(mag,max);
    const nx=dx/mag*cl, ny=dy/mag*cl; knob.style.transform=`translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    inputMove=-ny/max; inputTurn=nx/max; }
  document.getElementById('btnJump').addEventListener('pointerdown',e=>{e.preventDefault();tryJump();});
  document.getElementById('btnAct').addEventListener('pointerdown',e=>{e.preventDefault();doInteract();});
  document.getElementById('btnEmote').addEventListener('pointerdown',e=>{e.preventDefault();toggleEmotes();});
  document.getElementById('btnMenu').addEventListener('click',()=>document.body.classList.toggle('menuOpen'));
}
setupTouch();

// prompt + toast helpers
const promptEl=document.getElementById('prompt'), promptTxt=document.getElementById('promptTxt'), promptKey=document.getElementById('promptKey');
let _lastPrompt='';
function showPrompt(t){ const key=isTouch()?'🤝':'E'; const sig=t+'|'+key; if(sig!==_lastPrompt){ promptTxt.textContent=t; promptKey.textContent=key; tw(promptEl); _lastPrompt=sig; } promptEl.classList.add('show'); document.getElementById('btnAct').classList.add('ready'); }
function hidePrompt(){ promptEl.classList.remove('show'); document.getElementById('btnAct').classList.remove('ready'); }
const toastEl=document.getElementById('toast');
let toastT=0;
function toast(t){ toastEl.textContent=t; tw(toastEl); toastT=1.4; toastEl.style.transition='none'; toastEl.style.opacity=1; toastEl.style.transform='translate(-50%,-50%) scale(1.1)';
  requestAnimationFrame(()=>{ toastEl.style.transition='all .9s cubic-bezier(.2,.8,.2,1)'; toastEl.style.transform='translate(-50%,-90%) scale(1)'; }); }
function updateToast(dt){ if(toastT>0){ toastT-=dt; if(toastT<=0){ toastEl.style.transition='opacity .4s'; toastEl.style.opacity=0; } } }

// ---------------------------------------------------------------
//  EMOTES
// ---------------------------------------------------------------
const EMOJIS=['👋','😊','💛','🧋','🥟','🎉','😋','🙏','🌟'];
const emoteBar=document.getElementById('emotes');
EMOJIS.forEach(em=>{ const b=document.createElement('button'); b.textContent=em; b.onclick=()=>{ doEmote(em); toggleEmotes(false); }; emoteBar.appendChild(b); });
let emotesOpen=false;
function toggleEmotes(force){ emotesOpen = force===undefined?!emotesOpen:force; emoteBar.style.display=emotesOpen?'flex':'none'; }
const liveEmotes=[];
const _texLoader=new THREE.TextureLoader(); _texLoader.setCrossOrigin('anonymous');
function emojiTexture(em){ const t=_texLoader.load(emojiUrl(em)); t.colorSpace=THREE.SRGBColorSpace; return t; }
function spawnEmote(em, atGroup){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:emojiTexture(em),transparent:true,depthWrite:false,depthTest:false}));
  sp.scale.setScalar(0); sp.renderOrder=11; atGroup.add(sp); sp.position.y=2.4;
  liveEmotes.push({sp,parent:atGroup,t:0});
}
function doEmote(em){ spawnEmote(em, player); if(room&&room.send) room.send('emote',{e:em}); }
function updateEmotes(dt){ for(let i=liveEmotes.length-1;i>=0;i--){ const o=liveEmotes[i]; o.t+=dt;
  o.sp.scale.setScalar(easeOutBack(Math.min(1,o.t/0.18))*1.4);
  o.sp.position.y=2.4+o.t*0.5; o.sp.material.opacity=Math.max(0,1-o.t/2.2);
  if(o.t>2.2){ o.parent.remove(o.sp); liveEmotes.splice(i,1); } } }

// ---------------------------------------------------------------
//  AUDIO (procedural lo-fi + sfx)  — starts after user gesture
// ---------------------------------------------------------------
let audioOn=true, actx=null, master=null, musicGain=null;
function initAudio(){
  if(actx) return; actx=new (window.AudioContext||window.webkitAudioContext)();
  master=actx.createGain(); master.gain.value=audioOn?0.5:0; master.connect(actx.destination);
  musicGain=actx.createGain(); musicGain.gain.value=0.16;
  // simple reverb
  const conv=actx.createConvolver(); const len=actx.sampleRate*1.8; const ib=actx.createBuffer(2,len,actx.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=ib.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
  conv.buffer=ib; const wet=actx.createGain(); wet.gain.value=0.35; conv.connect(wet); wet.connect(master);
  musicGain.connect(master); musicGain.connect(conv);
  startMusic(conv);
}
function startMusic(conv){
  const scale=[0,3,5,7,10,12,15]; const base=220; // A minor pentatonic-ish
  const pad=actx.createGain(); pad.gain.value=0.0; pad.connect(musicGain);
  let step=0;
  function note(){
    if(!actx) return;
    const t=actx.currentTime;
    // arpeggio
    const o=actx.createOscillator(); o.type='triangle';
    const semi=scale[step%scale.length]+ (step%14<7?0:-5);
    o.frequency.value=base*Math.pow(2,semi/12);
    const g=actx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.18,t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+0.9);
    const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400;
    o.connect(g); g.connect(lp); lp.connect(musicGain); o.start(t); o.stop(t+1.0);
    // soft bass every 4
    if(step%4===0){ const b=actx.createOscillator(); b.type='sine'; b.frequency.value=base*Math.pow(2,(scale[(step/2)%scale.length]-12)/12);
      const bg=actx.createGain(); bg.gain.setValueAtTime(0,t); bg.gain.linearRampToValueAtTime(0.16,t+0.03); bg.gain.exponentialRampToValueAtTime(0.001,t+1.4);
      b.connect(bg); bg.connect(musicGain); b.start(t); b.stop(t+1.5); }
    step++;
    setTimeout(note, 380);
  }
  note();
}
function blip(freq,dur=0.12,type='sine',vol=0.3){ if(!actx||!audioOn) return; const t=actx.currentTime;
  const o=actx.createOscillator(); o.type=type; o.frequency.setValueAtTime(freq,t);
  const g=actx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.02); }
function sfxJump(){ blip(520,0.12,'sine',0.2); }
function sfxPickup(){ blip(440,0.1,'triangle',0.26); setTimeout(()=>blip(660,0.12,'triangle',0.26),90); setTimeout(()=>blip(880,0.05,'sine',0.12),150); }
function sfxDeliver(){ [523,659,784,1047,1318].forEach((f,i)=>setTimeout(()=>blip(f,0.16,'triangle',0.26),i*70)); }
function sfxStep(){ if(!audioOn) return; blip(rand(190,235),0.04,'sine',0.045); }
function sfxLand(){ blip(150,0.1,'sine',0.15); }
function sfxCatch(){ blip(523,0.14,'triangle',0.24); setTimeout(()=>blip(131,0.18,'sine',0.14),20); }
function sfxMeow(){ if(!audioOn) return; blip(680,0.13,'triangle',0.12); setTimeout(()=>blip(500,0.2,'triangle',0.12),110); }
function sfxVista(){ [659,784,988,1175].forEach((f,i)=>setTimeout(()=>blip(f,0.32,'sine',0.16),i*150)); }
// the Taipei garbage-truck melody (Für Elise) — plays when you find the parked truck
function sfxGarbage(){ [659,622,659,622,659,494,587,523,440].forEach((f,i)=>setTimeout(()=>blip(f,0.24,'triangle',0.14),i*200)); }
document.getElementById('btnSound').addEventListener('click',()=>{ audioOn=!audioOn; if(master) master.gain.value=audioOn?0.5:0; const ic=document.querySelector('#btnSound .ic'); ic.textContent=audioOn?'🎶':'🔇'; tw(ic); });

// help button -> reopen intro-ish overlay (simple)
const helpOverlay=document.getElementById('helpOverlay');
document.getElementById('btnHelp').addEventListener('click',()=>{ helpOverlay.classList.add('show'); document.body.classList.remove('menuOpen'); });
document.getElementById('helpClose').addEventListener('click',()=>helpOverlay.classList.remove('show'));
document.getElementById('btnDress').addEventListener('click',()=>{ customizing ? closeCustomize() : openCustomize(); });
document.getElementById('czClose').addEventListener('click', closeCustomize);
helpOverlay.addEventListener('pointerdown',e=>{ if(e.target===helpOverlay) helpOverlay.classList.remove('show'); });
// the GitHub invite card retracts into a small pill once you've settled in
setTimeout(()=>{ const g=document.getElementById('githubHelp');
  g.classList.add('mini'); g.title='Help us make Taipei more realistic — improve a building and send a PR'; },12000);

// ---------------------------------------------------------------
//  MULTIPLAYER (Antics) — rooms, presence, emotes, live leaderboard
//  Loads /sdk/v1.js when deployed on Antics; stays solo otherwise.
// ---------------------------------------------------------------
let room=null, myName='Guest', lastScoreSubmit=0, startTime=0, sdkLib=null, roomConnectPromise=null;
const remote=new Map();  // id -> {group, parts, tag, parcel, target, wp, carry, score, name}
function syncQuestToRoom(){ /* per-player game; nothing shared */ }
async function initMultiplayer(){
  if(room) return room;
  if(roomConnectPromise) return roomConnectPromise;
  const note=document.getElementById('mpNote');
  roomConnectPromise=(async()=>{
    if(note) note.textContent='Joining your room…';
    try { sdkLib = await import('/sdk/v1.js'); }
    catch(e){ if(note) note.textContent='Solo mode — deploy to play with friends'; return null; }
    try { room = await sdkLib.joinRoom({ name: myName });
      if(note){ note.textContent='Online! Invite friends with the link below 🔗'; tw(note); }
      setupRoom();
      return room;
    } catch(e){ room=null; if(note) note.textContent='Solo mode'; return null; }
  })();
  return roomConnectPromise;
}
function isSelfPlayer(p){ return !!(p && room && room.me && p.id===room.me.id); }
function colorFromId(id){ let h=0; const s=String(id); for(let i=0;i<s.length;i++) h=(h*131+s.charCodeAt(i))%360; return new THREE.Color().setHSL(h/360,0.55,0.62).getStyle(); }
// one deterministic, palette-consistent look per display name — used for BOTH your own
// avatar (pinned at BEGIN, before the street reveal) and the avatar everyone else builds
// for you (keyed on your broadcast name), so what you see and what others see always match.
// every player carries one Taiwan accessory (or none). Order matters only for
// determinism — the same name always yields the same slot on every client.
const ID_ACCESSORIES=['boba','easycard','tanghulu','bear','scooterHelmet',null,null,null];
function appearanceFromName(name){
  const s=String(name);
  const hash=(salt)=>{ let h=2166136261>>>0; const str=salt+'|'+s; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; };
  const from=(arr,salt)=>arr[hash(salt)%arr.length];
  const accessory=ID_ACCESSORIES[hash('acc')%ID_ACCESSORIES.length];
  const helmet=accessory==='scooterHelmet';                 // a helmet is its own headgear…
  return { skin:from(SKIN,'sk'), hair:from(HAIRC,'ha'), hairStyle:from(AUTO_HAIRSTYLES,'hs'),
           shirt:from(SHIRTS,'sh'), pants:from(PANTSC,'pa'),
           cap: (!helmet && hash('capChance')%4===0) ? from(CAPS,'cp') : false,  // …so no cap under it
           raglan: hash('rag')%2===0,
           headphones: !helmet && hash('hp')%5===0,          // and no headphones under it
           accessory };
}
// The customizer's accessory choices (distinct, plus an explicit "none").
// Index space for the broadcast code's 4th field.
const ACCESSORY_CHOICES = ['boba','easycard','tanghulu','bear','scooterHelmet', null];

// Compact broadcast code for the four editable fields: dot-joined palette indices.
function encodeAppearanceCode(ov){
  const hs = Math.max(0, HAIRSTYLES.indexOf(ov.hairStyle));
  const hc = Math.max(0, HAIRC.indexOf(ov.hair));
  const sh = Math.max(0, SHIRTS.indexOf(ov.shirt));
  let ac = ACCESSORY_CHOICES.indexOf(ov.accessory ?? null); if(ac < 0) ac = ACCESSORY_CHOICES.length - 1;
  return [hs, hc, sh, ac].join('.');
}
function decodeAppearanceCode(code){
  if(typeof code !== 'string') return null;
  const p = code.split('.').map(n => parseInt(n, 10));
  if(p.length !== 4 || p.some(n => !Number.isFinite(n))) return null;
  return { hairStyle:HAIRSTYLES[p[0]], hair:HAIRC[p[1]], shirt:SHIRTS[p[2]], accessory:ACCESSORY_CHOICES[p[3]] };
}
// Full appearance for a peer/self: name-derived base with the editable fields overridden.
function resolveAppearance(name, code){
  const base = appearanceFromName(name);
  const ov = decodeAppearanceCode(code);
  if(ov){
    if(ov.hairStyle) base.hairStyle = ov.hairStyle;
    if(ov.hair)      base.hair      = ov.hair;
    if(ov.shirt)     base.shirt     = ov.shirt;
    base.accessory = ov.accessory || null;
    if(base.accessory === 'scooterHelmet'){ base.cap = false; base.headphones = false; } // no double headgear
  }
  return base;
}

const STYLE_LABELS = {
  fluffy:'Fluffy', wavy:'Wavy', bob:'Bob', short:'Short',
  'mohawk-classic':'Mohawk · classic', 'mohawk-radial-five':'Mohawk · radial 5', 'mohawk-radial-extended':'Mohawk · radial 8',
};
const ACCESSORY_LABELS = { boba:'🧋 Boba', easycard:'💳 EasyCard', tanghulu:'🍡 Tanghulu', bear:'🧸 Bear', scooterHelmet:'🛵 Helmet' };
let customizing = false;   // true while the panel is open (camera + input gating read this)

function applyLocalOverrides(){
  myAppearanceCode = encodeAppearanceCode(myOverrides);
  setLocalAppearance(resolveAppearance(myName, myAppearanceCode));
  buildCustomizePanel();   // reflect the new selection state
}

function buildCustomizePanel(){
  const body = document.getElementById('czBody');
  if(!body || !myOverrides) return;
  const section = (label) => { const h=document.createElement('div'); h.className='czLabel'; h.textContent=label;
                               const row=document.createElement('div'); row.className='czRow'; body.append(h,row); return row; };
  body.textContent = '';
  // hairstyle
  const rHair = section('Hairstyle');
  for(const s of HAIRSTYLES){ const b=document.createElement('button'); b.textContent=STYLE_LABELS[s]||s;
    if(s===myOverrides.hairStyle) b.classList.add('on');
    b.onclick=()=>{ myOverrides.hairStyle=s; applyLocalOverrides(); }; rHair.append(b); }
  // hair colour
  const rHC = section('Hair colour');
  for(const c of HAIRC){ const b=document.createElement('button'); b.className='czSwatch'; b.style.background=c;
    if(c===myOverrides.hair) b.classList.add('on');
    b.onclick=()=>{ myOverrides.hair=c; applyLocalOverrides(); }; rHC.append(b); }
  // shirt colour
  const rSh = section('Shirt colour');
  for(const c of SHIRTS){ const b=document.createElement('button'); b.className='czSwatch'; b.style.background=c;
    if(c===myOverrides.shirt) b.classList.add('on');
    b.onclick=()=>{ myOverrides.shirt=c; applyLocalOverrides(); }; rSh.append(b); }
  // accessory
  const rAcc = section('Accessory');
  for(const a of ACCESSORY_CHOICES){ const b=document.createElement('button'); b.textContent=a?ACCESSORY_LABELS[a]:'None';
    if((a||null)===(myOverrides.accessory||null)) b.classList.add('on');
    b.onclick=()=>{ myOverrides.accessory=a; applyLocalOverrides(); }; rAcc.append(b); }
  tw(body);   // twemojify the accessory emoji labels
}

function openCustomize(){ customizing=true; czOrbit=0;   // always start the turntable facing the character's front
  document.getElementById('customize').classList.add('show');
  document.getElementById('customize').setAttribute('aria-hidden','false'); document.body.classList.remove('menuOpen'); buildCustomizePanel(); }
function closeCustomize(){ customizing=false; document.getElementById('customize').classList.remove('show');
  document.getElementById('customize').setAttribute('aria-hidden','true'); }

function remoteParcelMesh(){ const g=new THREE.Group(); const w=toon('#f4f1e6'), r=toon('#c2473b');
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.205,0.245,0.40,7),w));
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.252,0.252,0.06,7),r); st.position.y=0.04; g.add(st);
  const k=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),w); k.scale.set(1.1,0.7,1.1); k.position.y=0.27; g.add(k);
  g.scale.setScalar(0.78); g.position.set(0,1.02,0.34); g.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return g; }
function ensureRemote(p,state){ if(remote.has(p.id)) return;
  const remoteName=String(state.n||p.name||'').trim();
  if(!remoteName) return; // wait for identity state instead of flashing a temporary Guest look
  const g=makeCharacter(resolveAppearance(remoteName, state.a));   // name-derived base + their broadcast overrides
  // snap to the real spawn position immediately so they don't fly in from the planet centre
  if(typeof state.x==='number'){ g.position.set(state.x,state.y,state.z); if(typeof state.qw==='number') g.quaternion.set(state.qx,state.qy,state.qz,state.qw); }
  scene.add(g);
  const tag=makeLabel(remoteName); tag.position.y=2.05; g.add(tag);
  addBlobShadow(g,0.38);
  const par=remoteParcelMesh(); par.visible=false; g.add(par);
  const initialPhase=Number.isFinite(state.wp)?state.wp:0;
  remote.set(p.id,{group:g, parts:g.userData.parts, tag, parcel:par,
    anim:createCharacterAnimator(g,{seed:p.id,maxSpeed:MOVE,intensity:0.96,phase:initialPhase}),
    target:{pos:g.position.clone(),quat:g.quaternion.clone(),phase:initialPhase,direction:state.ad<0?-1:1,
      grounded:state.ag==null?true:!!state.ag,verticalSpeed:Number.isFinite(state.av)?state.av:0}, wp:initialPhase,
    lastFacing:new THREE.Vector3(0,0,1).applyQuaternion(g.quaternion), motionForward:new THREE.Vector3(), motionUp:new THREE.Vector3(), motionCross:new THREE.Vector3(),
    carry:false, score:0, name:remoteName, appCode:(typeof state.a==='string'?state.a:'')});
}
// Restyle an existing remote in place when their broadcast look (code) changes.
// Rebuilds the avatar mesh + its attachments; preserves position, motion phase, carry, score, name.
function rebuildRemoteLook(id, r, code){
  const pos = r.group.position.clone(), quat = r.group.quaternion.clone(), phase = r.target.phase;
  scene.remove(r.group);
  const g = makeCharacter(resolveAppearance(r.name, code));
  g.position.copy(pos); g.quaternion.copy(quat); scene.add(g);
  const tag = makeLabel(r.name); tag.position.y = 2.05; g.add(tag);
  addBlobShadow(g, 0.38);
  const par = remoteParcelMesh(); par.visible = r.carry; g.add(par);
  r.group = g; r.parts = g.userData.parts; r.tag = tag; r.parcel = par;
  r.anim = createCharacterAnimator(g, { seed:id, maxSpeed:MOVE, intensity:0.96, phase });
  r.appCode = code;
}
function setRemoteName(r,name){ if(r.name===name) return; r.group.remove(r.tag); r.tag=makeLabel(name); r.tag.position.y=2.05; r.group.add(r.tag); r.name=name; }
function removeRemote(id){ const r=remote.get(id); if(!r) return; scene.remove(r.group); remote.delete(id); }
function setupRoom(){
  // our own look was already pinned from our name at BEGIN — nothing to re-skin on join
  const rl=document.getElementById('roomline'); rl.classList.add('on');
  rl.onclick=()=>{ if(room&&room.link&&navigator.clipboard) navigator.clipboard.writeText(room.link).then(()=>toast('🔗 link copied!')); };
  updatePlayerCount();
  room.onJoin(p=>{ if(!isSelfPlayer(p)) toast('✨ a runner arrived'); updatePlayerCount(); });
  room.onLeave(p=>{ removeRemote(p.id); toast('👋 a runner headed home'); updatePlayerCount(); refreshLeaderboard(); });
  room.onPlayerState((p,state)=>{ if(isSelfPlayer(p)){ return; } ensureRemote(p,state); const r=remote.get(p.id);
    if(r){ r.target.pos.set(state.x||0,state.y||0,state.z||0); r.target.quat.set(state.qx||0,state.qy||0,state.qz||0,state.qw==null?1:state.qw);
      if(Number.isFinite(state.wp)) r.target.phase=state.wp;
      if(Number.isFinite(state.ad)) r.target.direction=state.ad<0?-1:1;
      if(Number.isFinite(state.ag)) r.target.grounded=!!state.ag;
      if(Number.isFinite(state.av)) r.target.verticalSpeed=state.av;
      r.carry=!!state.c; if(state.n) setRemoteName(r,state.n); r.score=state.s||0;
      if(typeof state.a==='string' && state.a!==r.appCode) rebuildRemoteLook(p.id, r, state.a); } refreshLeaderboardThrottled(); });
  room.on('emote',(payload,from)=>{ const r=remote.get(from); if(r&&payload&&payload.e) spawnEmote(payload.e,r.group); });
  refreshLeaderboard();
}
function updatePlayerCount(){ const n=room? Math.max(1,room.players.length) : 1;
  const el=document.getElementById('playerCount'); if(el) el.textContent=n;
  const pp=document.getElementById('players'); if(pp) pp.classList.toggle('multi',n>1); }
let _lbT=0;
function refreshLeaderboardThrottled(){ const n=performance.now(); if(n-_lbT<1000) return; _lbT=n; refreshLeaderboard(); }
function refreshLeaderboard(){ if(!room) return;
  const list=[{name:myName,score:score,me:true}];
  for(const p of room.players){ if(isSelfPlayer(p)) continue; const s=p.state||{}; list.push({name:s.n||p.name||'Guest',score:s.s||0,me:false}); }
  list.sort((a,b)=>b.score-a.score);
  const ol=document.getElementById('lbList'); if(!ol) return; ol.innerHTML='';
  list.slice(0,8).forEach((e,i)=>{ const li=document.createElement('li'); if(e.me) li.className='me';
    const a=document.createElement('span'); a.className='nm'; a.textContent=`${i+1}. ${e.name}`;
    const b=document.createElement('span'); b.textContent=e.score; li.appendChild(a); li.appendChild(b); ol.appendChild(li); });
  document.getElementById('lb').style.display=lbOpen?'block':'none';   // hidden behind the 🏆 toggle
}
let lbOpen=false;
document.getElementById('btnLb').addEventListener('click',()=>{ lbOpen=!lbOpen;
  document.getElementById('lb').style.display=(lbOpen&&room)?'block':'none'; if(lbOpen) refreshLeaderboard(); });
function trySubmitScore(){ refreshLeaderboard();
  if(!room||!room.submitScore) return; const now=performance.now();
  if(now-startTime<10500 || now-lastScoreSubmit<3000) return; lastScoreSubmit=now;
  try{ room.submitScore(score).then(()=>refreshLeaderboard()).catch(()=>{}); }catch(e){} }

// ---------------------------------------------------------------
//  POST-PROCESS — ink outline (the signature Messenger cel look)
// ---------------------------------------------------------------
const _v2 = new THREE.Vector2();
let outlineRT;
function makeOutlineRT(){
  const ds = renderer.getDrawingBufferSize(_v2);
  const depth = new THREE.DepthTexture(ds.x, ds.y); depth.type = THREE.UnsignedIntType;
  outlineRT = new THREE.WebGLRenderTarget(ds.x, ds.y, { depthTexture:depth, depthBuffer:true, stencilBuffer:false,
    minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter });
}
makeOutlineRT();
const outlineMat = new THREE.ShaderMaterial({
  uniforms:{
    tColor:{value:null}, tDepth:{value:null}, uRes:{value:new THREE.Vector2()}, uProjInv:{value:new THREE.Matrix4()},
    uNear:{value:camera.near}, uFar:{value:camera.far},
    uThick:{value:1.35}, uDepthThr:{value:0.022}, uNormThr:{value:0.26}, uStrength:{value:0.82}, uColor:{value:new THREE.Color('#1d332e')}
  },
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`
    uniform sampler2D tColor, tDepth; uniform vec2 uRes; uniform mat4 uProjInv;
    uniform float uNear,uFar,uThick,uDepthThr,uNormThr,uStrength; uniform vec3 uColor;
    varying vec2 vUv;
    float rd(vec2 uv){ return texture2D(tDepth,uv).x; }
    float lin(float z){ float ndc=z*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear-ndc*(uFar-uNear)); }
    vec3 vpos(vec2 uv, float z){ vec4 c=vec4(uv*2.0-1.0, z*2.0-1.0, 1.0); vec4 v=uProjInv*c; return v.xyz/v.w; }
    vec3 l2s(vec3 c){ return mix(1.055*pow(max(c,0.0),vec3(0.41666))-0.055, c*12.92, step(c,vec3(0.0031308))); }
    void main(){
      vec2 px=uThick/uRes; vec3 col=texture2D(tColor,vUv).rgb;
      float z=rd(vUv), zr=rd(vUv+vec2(px.x,0.)), zl=rd(vUv-vec2(px.x,0.)), zu=rd(vUv+vec2(0.,px.y)), zd=rd(vUv-vec2(0.,px.y));
      float lc=lin(z);
      // silhouette: relative depth difference (scale-invariant)
      float dd=(abs(lc-lin(zr))+abs(lc-lin(zl))+abs(lc-lin(zu))+abs(lc-lin(zd)))/lc;
      float depthEdge=smoothstep(uDepthThr, uDepthThr*3.0, dd);
      // crease: reconstructed view-space normals
      vec3 p=vpos(vUv,z), pr=vpos(vUv+vec2(px.x,0.),zr), pl=vpos(vUv-vec2(px.x,0.),zl), pu=vpos(vUv+vec2(0.,px.y),zu), pd=vpos(vUv-vec2(0.,px.y),zd);
      vec3 n1=normalize(cross(pr-p,pu-p)); vec3 n2=normalize(cross(p-pl,p-pd));
      float normEdge=smoothstep(uNormThr, uNormThr+0.35, 1.0-max(0.0,dot(n1,n2)));
      float edge=max(depthEdge, normEdge);
      if(lc > uFar*0.85) edge=0.0;                 // leave the open sky clean
      vec3 outc=mix(col, uColor, edge*uStrength);
      gl_FragColor=vec4(l2s(outc),1.0);
    }`
});
const outlineQuad = new FullScreenQuad(outlineMat);
function renderFrame(){
  const ds = renderer.getDrawingBufferSize(_v2);
  if(outlineRT.width!==ds.x || outlineRT.height!==ds.y) outlineRT.setSize(ds.x, ds.y);
  outlineMat.uniforms.uRes.value.set(outlineRT.width, outlineRT.height);
  outlineMat.uniforms.uNear.value=camera.near; outlineMat.uniforms.uFar.value=camera.far;
  outlineMat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
  renderer.setRenderTarget(outlineRT);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  outlineMat.uniforms.tColor.value = outlineRT.texture;
  outlineMat.uniforms.tDepth.value = outlineRT.depthTexture;
  outlineQuad.render(renderer);
}
window.__outline = outlineMat.uniforms; // live tuning

// ---------------------------------------------------------------
//  MAIN LOOP
// ---------------------------------------------------------------
let started=false;
let _last=performance.now();
function animate(){
  requestAnimationFrame(animate);
  const _now=performance.now(); let dt=Math.min((_now-_last)/1000,0.05); _last=_now;
  if(started){
    if(customizing){ inputMove=0; inputTurn=0; }
    else { readKeys(); updatePlayer(dt); checkInteract(); }
  }
  updateCamera(dt);
  updateNpcLife(dt);
  updateSmoke(dt); updateBirds(dt); updateCat(dt); updateCampfire(dt); if(started) updateVista(dt);
  // garbage-truck easter egg: wander close and it sings Für Elise
  if(garbageTruckPos && started){ gtCool-=dt;
    if(gtCool<=0 && player.position.distanceTo(garbageTruckPos)<6){ gtCool=45; sfxGarbage(); toast('🎵 the garbage truck!'); } }
  // Xiangshan: celebrate each stage of the climb the first time you arrive.
  // Near either platform the climb owns its moment — mute the generic 🌄 toast.
  if(xiangshanDeckPos && started){
    const dDeck=player.position.distanceTo(xiangshanDeckPos);
    const dSummit=player.position.distanceTo(xiangshanSummitPos);
    if(dDeck<7 || dSummit<7) vistaDone=true;
    if(!xiangshanDeckSeen && dDeck<2.4){ xiangshanDeckSeen=true;
      toast('📸 the Taipei 101 view!');
      [523,659,784,1047].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'triangle',0.12),i*110)); }
    if(!xiangshanSummitSeen && dSummit<2.6){ xiangshanSummitSeen=true;
      toast('⛰️ 象山 summit — top of the climb!');
      [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'triangle',0.12),i*110)); }
  }
  for(let i=0;i<windMats.length;i++) windMats[i].uTime.value=performance.now()*0.001;
  for(let i=0;i<spinners.length;i++) spinners[i].m.rotateZ(spinners[i].s*dt);   // Ferris wheel etc.
  updateGondola(dt);                                                             // Maokong cable cars
  // fade landmark name tags with distance — nearby ones read clearly, the far-side
  // ones no longer bleed through the planet as label soup
  for(let i=0;i<landmarkLabels.length;i++){ const sp=landmarkLabels[i];
    sp.getWorldPosition(_lblV);
    const d=_lblV.distanceTo(camera.position);
    // Street labels disappear at close range, where depthTest:false text would
    // bleed through doors and neighbouring facades. Map view keeps the overview.
    const mapBand=1-THREE.MathUtils.smoothstep(d,34,58);
    sp.material.opacity=mapBand*THREE.MathUtils.smoothstep(camBlend,0.16,0.62);
    sp.visible=sp.material.opacity>0.02;
  }
  if(skyUniforms) skyUniforms.uUp.value.lerp(surfDir, Math.min(1,dt*4)).normalize();  // sky band follows local up
  if(parcelPopT>=0){ parcelPopT+=dt; const s=easeOutBack(Math.min(1,parcelPopT/0.25)); parcel.scale.setScalar(0.78*s); if(parcelPopT>=0.25) parcelPopT=-1; }
  parcel.rotation.y+=dt*1.5;
  clouds.rotation.y+=dt*0.006;    // whole cloud layer drifts slowly around the planet
  updateBursts(dt); updateRings(dt); updateTosses(dt); updatePuffs(dt); updateSpeech(dt); updateEmotes(dt); updateToast(dt); updateObjArrow();
  if(started){ syncRemotes(); updateRemotes(dt); netSend(dt); }
  renderFrame();
}
// poll every player's latest state each frame (Antics' canonical pattern) — robust vs missed callbacks
function syncRemotes(){
  if(!room || !room.players) return;
  const seen=new Set();
  for(const p of room.players){ if(isSelfPlayer(p)) continue; const s=p.state||{}; if(typeof s.x!=='number') continue;
    seen.add(p.id); ensureRemote(p,s); const r=remote.get(p.id); if(!r) continue;
    r.target.pos.set(s.x,s.y,s.z); if(typeof s.qw==='number') r.target.quat.set(s.qx,s.qy,s.qz,s.qw);
    if(Number.isFinite(s.wp)) r.target.phase=s.wp;
    if(Number.isFinite(s.ad)) r.target.direction=s.ad<0?-1:1;
    if(Number.isFinite(s.ag)) r.target.grounded=!!s.ag;
    if(Number.isFinite(s.av)) r.target.verticalSpeed=s.av;
    r.carry=!!s.c; if(s.n) setRemoteName(r,s.n); r.score=s.s||0;
  }
  for(const id of [...remote.keys()]){ if(!seen.has(id) && (!room.player || !room.player(id))) removeRemote(id); }
}
function updateRemotes(dt){ const k=Math.min(1, dt*16); remote.forEach(r=>{ if(!r.target) return;
  const far=r.group.position.distanceTo(r.target.pos);
  const ox=r.group.position.x, oy=r.group.position.y, oz=r.group.position.z;
  const teleported=far>6;
  if(teleported) r.group.position.copy(r.target.pos);            // teleport, don't fly across the planet
  else r.group.position.lerp(r.target.pos, k);
  r.group.quaternion.slerp(r.target.quat, k);
  const dx=r.group.position.x-ox, dy=r.group.position.y-oy, dz=r.group.position.z-oz;
  const travelDistance=teleported?0:Math.hypot(dx,dy,dz);
  r.motionForward.set(0,0,1).applyQuaternion(r.group.quaternion).normalize();
  r.motionUp.set(0,1,0).applyQuaternion(r.group.quaternion).normalize();
  const turnDelta=Math.atan2(r.motionCross.crossVectors(r.lastFacing,r.motionForward).dot(r.motionUp),THREE.MathUtils.clamp(r.lastFacing.dot(r.motionForward),-1,1));
  r.lastFacing.copy(r.motionForward);
  if(r.tag){ const dd=player.position.distanceTo(r.group.position);  // labels fade out with distance
    r.tag.material.opacity=THREE.MathUtils.clamp((15-dd)/5,0,1)*0.92; }
  const remoteSpeed=Math.min(MOVE*1.25,travelDistance/Math.max(dt,1e-4));
  const motion=r.anim.update(dt,{distance:travelDistance,speed:remoteSpeed,direction:r.target.direction,turnRate:turnDelta/Math.max(dt,1e-4),grounded:r.target.grounded,verticalSpeed:r.target.verticalSpeed,phase:r.target.phase});
  r.wp=motion.phase;
  if(r.parcel) r.parcel.visible=!!r.carry;
}); }
let netAcc=0;
function netSend(dt){ if(!room||!room.me) return; netAcc+=dt; if(netAcc<0.05) return; netAcc=0;
  room.me.setState({ x:+player.position.x.toFixed(2), y:+player.position.y.toFixed(2), z:+player.position.z.toFixed(2),
    qx:+player.quaternion.x.toFixed(3), qy:+player.quaternion.y.toFixed(3), qz:+player.quaternion.z.toFixed(3), qw:+player.quaternion.w.toFixed(3),
    c:carrying?1:0, n:myName, a:myAppearanceCode, s:score, ad:inputMove<0?-1:1, ag:grounded?1:0, av:+vVel.toFixed(2), wp:+(walkPhase%6.28).toFixed(2) }); }

// ---------------------------------------------------------------
//  BOOT
// ---------------------------------------------------------------
function resize(){ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches?1.5:2)); }
addEventListener('resize',resize);

renderer.compile(scene,camera);
document.getElementById('loader').style.display='none';
if(isTouch()){ touchEl.style.display='block';
  const k=document.querySelector('#intro .keys');
  if(k) k.innerHTML='<span>left thumb — walk</span><span>drag right side — look</span><span>✋ — interact</span>';
}
tw(document.body);                 // twemojify all static UI
animate();

const beginBtn=document.getElementById('beginBtn');
const SHOW_WELCOME_DURING_IMMERSION_QA=true;   // set false to skip the name screen while checking
beginBtn.addEventListener('click',()=>{
  myName=(document.getElementById('nameInput').value||'').trim().slice(0,14)||('Guest'+randi(1,99));
  const base0 = appearanceFromName(myName);         // name-derived starting look
  myOverrides = { hairStyle:base0.hairStyle, hair:base0.hair, shirt:base0.shirt, accessory:base0.accessory };
  myAppearanceCode = encodeAppearanceCode(myOverrides);
  setLocalAppearance(resolveAppearance(myName, myAppearanceCode));   // identical to base0, now driven by the codec
  playerShadow.visible=true;
  document.getElementById('intro').style.display='none';
  started=true; startTime=performance.now();
  initMultiplayer();               // join only after the player chooses a leaderboard/display name
  camMode='street'; camPitch=0.11; camYaw=0; // swoop into the locked, authored street shot
  initAudio();
  newQuest();
});
if(!SHOW_WELCOME_DURING_IMMERSION_QA) requestAnimationFrame(()=>beginBtn.click());

// debug/verification: frame a fixed view on a km map position (use with window.__freecam=true)
window.__freecam=false;
function lookAtKm(xkm,ykm,dist=14,height=7,yawDeg=0){
  const dir=mapDir(xkm,ykm), up=dir.clone();
  const target=dir.clone().multiplyScalar(groundR(dir)+2);
  let north=CITY_NORTH.clone(); north.addScaledVector(up,-north.dot(up)); if(north.lengthSq()<1e-6) north.copy(CITY_EAST); north.normalize();
  const east=new THREE.Vector3().crossVectors(north,up).normalize();
  const yaw=yawDeg*Math.PI/180;
  const horiz=north.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(east,Math.sin(yaw));
  const eye=target.clone().addScaledVector(horiz,-dist).addScaledVector(up,height);
  camera.position.copy(eye); camera.up.copy(up.clone()); camera.lookAt(target);
}
// expose for MP module + debugging
Object.assign(window, { __game:{ scene, camera, mapDir, groundR, lookAtKm, planetGroup, player, makeCharacter, makeMarker, get score(){return score;},
  setRoom:(r)=>{room=r;}, remote, get myName(){return myName;}, set myName(v){myName=v;}, get carrying(){return carrying;},
  spawnEmoteOn:(em,g)=>spawnEmote(em,g), updateRemotesMap:remote, getPlayer:()=>player, THREE,
  motionConfig:MOTION,
  motionState:()=>({mode:playerAnimator&&playerAnimator.mode,phase:playerAnimator&&+playerAnimator.phase.toFixed(3),speed:playerAnimator&&+playerAnimator.speed.toFixed(3),grounded,verticalSpeed:+vVel.toFixed(3)}),
  debug:()=>({carrying, score, near:nearTarget?nearTarget.name:null, obj:objText.textContent,
    senderDist: sender?+player.position.distanceTo(sender.group.position).toFixed(2):null,
    recipientDist: recipient?+player.position.distanceTo(recipient.group.position).toFixed(2):null }),
  teleportNear:(which)=>{ const t = which==='recipient'?recipient:sender; if(!t) return; surfDir.copy(t.dir).normalize();
    heading.copy(new THREE.Vector3(1,0,0)).sub(surfDir.clone().multiplyScalar(surfDir.x)).normalize(); alt=0; vVel=0; },
  colliders, planetR:R, playerAR:PLAYER_AR, getSurf:()=>surfDir.clone(), npcs,
  renderInfo:()=>({calls:renderer.info.render.calls, tris:renderer.info.render.triangles}),
  landmarks: LANDMARKS.map(L=>({label:L[3].label||'', x:L[1], y:L[2]})),   // post-declump km positions (debug)
  _setSurf:(x,y,z)=>{ surfDir.set(x,y,z).normalize(); heading.copy(new THREE.Vector3(1,0,0)).sub(surfDir.clone().multiplyScalar(surfDir.x)).normalize(); alt=0; vVel=0; },
  _setHeading:(x,y,z)=>{ heading.set(x,y,z); heading.addScaledVector(surfDir,-heading.dot(surfDir)).normalize(); },
  _forceStart:()=>{ started=true; },
  // verification helper: teleport the player just outside a landmark's footprint, facing it
  tpLandmark:(key)=>{ const L=LANDMARKS.find(l=>(l[3].label||'').toLowerCase().includes(String(key).toLowerCase())); if(!L) return false;
    const foot=(L[3].foot||L[3].ar||2);
    const offKm=(foot+2.4)/KM; // close enough to compare avatar with doors/steps in one frame
    const face=(L[3].face||0)*Math.PI/180;
    const frontX=-Math.sin(face), frontY=-Math.cos(face); // local +Z in the flat map tangent frame
    surfDir.copy(mapDir(L[1]+frontX*offKm, L[2]+frontY*offKm)).normalize();
    const at=mapDir(L[1],L[2]); heading.copy(at).addScaledVector(surfDir,-at.dot(surfDir));
    if(heading.lengthSq()<1e-6) heading.set(1,0,0); heading.normalize(); alt=0; vVel=0; return true; },
  minClearance:()=>{ let m=99; for(const c of colliders){ const a=surfDir.angleTo(c.dir)-(c.ar+PLAYER_AR); if(a<m)m=a; } for(const n of npcs){ const a=surfDir.angleTo(n.dir)-(0.5/R+PLAYER_AR); if(a<m)m=a; } return m*R; } } });
