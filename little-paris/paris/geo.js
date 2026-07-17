// =====================================================================
//  paris/geo.js — PARIS GEOGRAPHY ON A TINY PLANET
// ---------------------------------------------------------------------
//  The single source of truth for *where everything in Paris goes* on
//  the spherical planet. Everything is authored in real-world Paris
//  METER coordinates (east / north of Notre-Dame), then projected onto
//  the sphere with a geodesic exponential map.
//
//  Coordinate convention (all distances in METERS):
//     e  = metres EAST  of Notre-Dame  (negative = west)
//     n  = metres NORTH of Notre-Dame  (negative = south)
//  Notre-Dame (Île de la Cité) is the origin (0,0).
//
//  PUBLIC API used by content modules (see paris.html `ctx.geo`):
//     parisToDir(e,n)      -> THREE.Vector3 unit direction on the sphere
//     dirToParis(dir)      -> {e,n} metres (inverse projection / log map)
//     frameAt(dir)         -> {up,east,north} orthonormal tangent basis
//     terrainParis(dir)    -> height offset (units) for that direction
//     groundColor(dir)     -> THREE.Color for the planet vertex
//     isPark(e,n)          -> bool
//     roadMask(e,n)        -> 0..1 street intensity
//     seineDist2D(e,n)     -> metres to the Seine centreline
//     onIsland(e,n)        -> bool (Île de la Cité / Saint-Louis)
//     seineDepth(dir)      -> carved height or null (not over water)
//     LANDMARKS            -> { key: {e,n,name} }
//     SEINE_PTS            -> [[e,n],...] densified centreline (metres)
//     AVENUES              -> [{angle}] the 12 étoile avenues
//     R, K, CENTER, eastAxis, northAxis
// =====================================================================
import * as THREE from 'three';

export const R = 24;                        // planet radius (matches engine)

// metres -> radians. Scaled so the whole metropolis wraps the ENTIRE planet:
// Notre-Dame sits at the front pole and the outer ring of greater Paris
// (D_POLE ≈ 6.6 km — the Périphérique / the two Bois) maps to the antipode,
// the far "edge of Paris" back pole. So there is no empty side of the globe.
//   Notre-Dame↔Eiffel (4100 m) ≈ 112°, Arc ≈ 125°, Sacré-Cœur ≈ 104°.
export const D_POLE = 6600;                 // metres from Notre-Dame -> back pole
export const K = Math.PI / D_POLE;          // ≈ 4.76e-4 rad / metre

// Where Paris sits on the globe (Notre-Dame is here). Tilted toward camera.
export const CENTER = new THREE.Vector3(0, 0.34, 1).normalize();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
export const eastAxis  = new THREE.Vector3().crossVectors(WORLD_UP, CENTER).normalize();
export const northAxis = new THREE.Vector3().crossVectors(CENTER, eastAxis).normalize();

// ---------------------------------------------------------------------
//  PROJECTION  (geodesic exponential / log map)
// ---------------------------------------------------------------------
export function parisToDir(e, n){
  const t = eastAxis.clone().multiplyScalar(e * K).addScaledVector(northAxis, n * K);
  const r = t.length();                     // arc-angle (radians)
  if(r < 1e-9) return CENTER.clone();
  t.multiplyScalar(1 / r);
  return CENTER.clone().multiplyScalar(Math.cos(r)).addScaledVector(t, Math.sin(r)).normalize();
}
export function dirToParis(dir){
  const d = dir.clone().normalize();
  const cosr = THREE.MathUtils.clamp(d.dot(CENTER), -1, 1);
  const r = Math.acos(cosr);
  if(r < 1e-9) return { e: 0, n: 0 };
  const t = d.clone().addScaledVector(CENTER, -cosr);
  const tl = t.length();
  if(tl < 1e-9) return { e: 0, n: 0 };
  t.multiplyScalar(r / tl);                 // tangent vector scaled to arc-angle
  return { e: t.dot(eastAxis) / K, n: t.dot(northAxis) / K };
}
export function frameAt(dir){
  const up = dir.clone().normalize();
  let east = new THREE.Vector3().crossVectors(WORLD_UP, up);
  if(east.lengthSq() < 1e-6) east.copy(eastAxis);
  east.normalize();
  const north = new THREE.Vector3().crossVectors(up, east).normalize();
  return { up, east, north };
}

// ---------------------------------------------------------------------
//  LANDMARK COORDINATE TABLE  (metres E/N of Notre-Dame)
//  Derived from real lat/long; good enough to be unmistakably Paris.
// ---------------------------------------------------------------------
export const LANDMARKS = {
  notredame:    { e: 0,     n: 0,     name: 'Notre-Dame' },
  hoteldeville: { e: 250,   n: 150,   name: 'Hôtel de Ville' },
  louvre:       { e: -900,  n: 846,   name: 'Louvre' },
  tuileries:    { e: -1550, n: 1080,  name: 'Jardin des Tuileries' },
  concorde:     { e: -2100, n: 1400,  name: 'Place de la Concorde' },
  champsElysees:{ e: -3050, n: 1860,  name: 'Champs-Élysées' },
  arc:          { e: -4020, n: 2315,  name: 'Arc de Triomphe' },
  eiffel:       { e: -4060, n: 600,   name: 'Tour Eiffel' },
  champDeMars:  { e: -3950, n: 250,   name: 'Champ de Mars' },
  trocadero:    { e: -4480, n: 1080,  name: 'Trocadéro' },
  invalides:    { e: -2730, n: 470,   name: 'Les Invalides' },
  orsay:        { e: -1500, n: 560,   name: "Musée d'Orsay" },
  opera:        { e: -1340, n: 2115,  name: 'Opéra Garnier' },
  madeleine:    { e: -1980, n: 1760,  name: 'La Madeleine' },
  pantheon:     { e: -256,  n: -757,  name: 'Panthéon' },
  luxembourg:   { e: -780,  n: -980,  name: 'Jardin du Luxembourg' },
  montparnasse: { e: -2050, n: -1210, name: 'Tour Montparnasse' },
  sacrecoeur:   { e: -520,  n: 3750,  name: 'Sacré-Cœur' },
  moulinrouge:  { e: -1150, n: 3380,  name: 'Moulin Rouge' },
  bastille:     { e: 1414,  n: 60,    name: 'Bastille' },
  republique:   { e: 950,   n: 1480,  name: 'République' },
  ileStLouis:   { e: 520,   n: -120,  name: 'Île Saint-Louis' },
  saintsulpice: { e: -880,  n: -620,  name: 'Saint-Sulpice' },
  palaisroyal:  { e: -780,  n: 1080,  name: 'Palais-Royal' },
  // --- outer / greater Paris (fills the far side of the globe) ---
  perelachaise: { e: 2760,  n: 880,   name: 'Père-Lachaise' },
  bercy:        { e: 2600,  n: -1450, name: 'Bercy' },
  placeitalie:  { e: 250,   n: -2600, name: "Place d'Italie" },
  montsouris:   { e: -680,  n: -3500, name: 'Parc Montsouris' },
  butteschaumont:{ e: 1500, n: 3150,  name: 'Buttes-Chaumont' },
  citeu:        { e: -650,  n: -4400, name: 'Cité Universitaire' },
  //  NOTE: these four are pulled IN from their true distances. Near the back
  //  pole the projection converges (everything past ~6 km lands on the same
  //  point and overlaps), so the outer ring sits at 5.0–5.5 km on its REAL
  //  compass bearing instead — spread round the polar sea, never stacked.
  boisboulogne: { e: -5000, n: -450,  name: 'Bois de Boulogne' },
  boisvincennes:{ e: 4800,  n: -1900, name: 'Bois de Vincennes' },
  ladefense:    { e: -5000, n: 2050,  name: 'La Défense' },       // stays on the axe historique
  stadedefrance:{ e: 250,   n: 5150,  name: 'Stade de France' },
};
export function landmarkDir(key){ const L = LANDMARKS[key]; return parisToDir(L.e, L.n); }

// ---------------------------------------------------------------------
//  HILLS  (Paris is flat except for a few named rises; Montmartre is the
//  big one). amp in units, sigma in metres.
// ---------------------------------------------------------------------
const CITY = 1.0;                            // base city-ground height
const HILLS = [
  { p: 'sacrecoeur',  amp: 3.4, sigma: 760 },   // Montmartre (~130 m IRL)
  { p: 'pantheon',    amp: 0.9, sigma: 520 },   // Montagne Sainte-Geneviève
  { p: 'montparnasse',amp: 0.55,sigma: 640 },
  { p: 'trocadero',   amp: 0.85,sigma: 460 },   // Chaillot
  { p: 'republique',  amp: 0.5, sigma: 600 },   // Belleville approach
  { p: 'butteschaumont', amp: 0.8, sigma: 420 },// Buttes-Chaumont (NE rise)
  { p: 'placeitalie', amp: 0.45,sigma: 560 },   // Butte-aux-Cailles (13th)
];
const HILLS_R = HILLS.map(h => ({ amp: h.amp, sigma: h.sigma, e: LANDMARKS[h.p].e, n: LANDMARKS[h.p].n }));

// ---------------------------------------------------------------------
//  THE SEINE  — centreline waypoints W→E (metres), then densified.
//  Bows gently through the middle, wrapping Île de la Cité / Saint-Louis.
// ---------------------------------------------------------------------
//  WEST ARM redrawn 2026-07 to the REAL course: up past Bir-Hakeim, between
//  the Eiffel (left bank) and Trocadéro (right bank), north of Invalides &
//  Orsay, past the Louvre quays, then through the two islands and SE.
const SEINE_WAYPOINTS = [
  [-6250, -2000],[-5750, -1150],[-5250, -350],[-4850, 150],[-4550, 600],
  [-4200, 950],[-3589, 1236],[-2659, 1213],[-1999, 1024],[-1465, 757],
  [-908, 590],[-630, 412],[-360, 230],[-100, 60],[150, -60],
  [520, -190],[1000, -300],[1550, -560],[2150, -980],[2900, -1500],
  [3700, -1980],[4600, -2230],[5500, -2200],[6150, -2050],
];
function catmull(p0, p1, p2, p3, t){
  const t2 = t*t, t3 = t2*t;
  return 0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3);
}
export const SEINE_PTS = (() => {
  const wp = SEINE_WAYPOINTS, out = [];
  for(let i = 0; i < wp.length - 1; i++){
    const p0 = wp[Math.max(0, i-1)], p1 = wp[i], p2 = wp[i+1], p3 = wp[Math.min(wp.length-1, i+2)];
    const steps = 8;
    for(let s = 0; s < steps; s++){ const t = s/steps;
      out.push([catmull(p0[0],p1[0],p2[0],p3[0],t), catmull(p0[1],p1[1],p2[1],p3[1],t)]); }
  }
  out.push(wp[wp.length-1]);
  return out;
})();
const RIVER_HALF = 165;                      // half-width of the river (metres)
// The polar sea: past this radius the terrain dips underwater, so the far
// cap of the globe — where the projection converges and any metre-authored
// content would pile up — is open water. Both arms of the Seine empty here.
export const SEA_R = 5950;
// chart metres compress tangentially near the back pole (sin r / r), so the
// far reaches of the Seine are widened to keep the channel readable out there.
// Past the city edge the channel holds a steady ~0.95-unit WORLD half-width —
// narrower and the planet mesh (vertex spacing ~0.5 u) bridges it with
// uncarved triangles that read as phantom causeways.
export function riverHalfAt(e, n){
  const far = Math.hypot(e, n);
  const lin = RIVER_HALF * (1 + Math.max(0, (far - 4200) / 1800) * 1.6);
  if(far <= 4800) return lin;
  const r = far * K, f = Math.max(0.10, Math.sin(r) / r);
  return Math.max(lin, 0.95 / (K * R * f));
}
// A clearance margin authored in central chart metres, inflated so it keeps
// the same WORLD size near the back pole (tangential chart metres compress
// by sin(r)/r out there — a "70 m" setback shrinks to nothing at the pole).
export function chartMargin(m, e, n){
  const r = Math.hypot(e, n) * K;
  const f = r < 1e-6 ? 1 : Math.abs(Math.sin(r)) / r;
  return m / Math.max(0.06, f);
}

// ---------------------------------------------------------------------
//  BRIDGES — crossings where the riverbed is NOT carved: a land causeway
//  at city level spans the channel and a bridge mesh (landmarks-cite.js)
//  dresses it. `c` = crossing centre ON the centreline (metres), `t` =
//  unit river tangent there. The causeway strip runs perpendicular to t.
// ---------------------------------------------------------------------
export const BRIDGE_HALF_W = 40;             // half-width of the causeway ALONG the river (m)
const BRIDGE_HALF_LEN = 270;                 // half-length across the river (bank to bank)
export const BRIDGES = [
  { c: [-4300, 850],  t: [0.707, 0.707],  name: "Pont d'Iéna",         grand: false }, // Eiffel ↔ Trocadéro
  { c: [-2659, 1213], t: [1.0, -0.025],   name: 'Pont Alexandre III',  grand: true  }, // Champs ↔ Invalides
  { c: [-1999, 1024], t: [0.961, -0.275], name: 'Pont de la Concorde', grand: false },
  { c: [-908, 590],   t: [0.959, -0.287], name: 'Pont des Arts',       grand: false }, // by the Louvre
  { c: [-630, 412],   t: [0.835, -0.549], name: 'Pont Neuf',           grand: false }, // island west tip
  { c: [-190, 120],   t: [0.833, -0.553], name: 'Petit-Pont',          grand: false }, // rue de la Cité axis, both channels
  { c: [880, -270],   t: [0.973, -0.238], name: 'Pont de Sully',       grand: false }, // east of St-Louis
  { c: [2600, -1290], t: [0.824, -0.567], name: 'Pont de Bercy',       grand: false },
];
// is (e,n) on a bridge causeway strip? `margin` (m) widens the test — used by
// scatter placement so buildings/props keep their colliders off the walkway.
export function onBridge(e, n, margin = 0){
  for(const b of BRIDGES){
    const dx = e - b.c[0], dy = n - b.c[1];
    const along = Math.abs(dx * b.t[0] + dy * b.t[1]);          // along the river
    const across = Math.abs(-dx * b.t[1] + dy * b.t[0]);        // across the river
    if(along < BRIDGE_HALF_W + margin && across < BRIDGE_HALF_LEN + margin) return true;
  }
  return false;
}

// islands (land inside the river) — ellipse {cx,cy,rx,ry,rot}
const ISLANDS = [
  { cx: -240, cy: 134, rx: 530, ry: 110, rot: -0.6 },  // Île de la Cité (aligned to the new river axis)
  { cx: 520, cy: -150, rx: 320, ry: 92, rot: -0.28 },  // Île Saint-Louis
];
export function onIsland(e, n){
  for(const il of ISLANDS){
    const dx = e - il.cx, dy = n - il.cy, c = Math.cos(-il.rot), s = Math.sin(-il.rot);
    const x = dx*c - dy*s, y = dx*s + dy*c;
    if((x*x)/(il.rx*il.rx) + (y*y)/(il.ry*il.ry) <= 1) return true;
  }
  return false;
}
function segDist2(px, py, ax, ay, bx, by){
  const dx = bx-ax, dy = by-ay, l2 = dx*dx + dy*dy;
  let t = l2 > 0 ? ((px-ax)*dx + (py-ay)*dy)/l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t*dx, cy = ay + t*dy;
  return Math.hypot(px-cx, py-cy);
}
export function seineDist2D(e, n){
  let best = Infinity;
  for(let i = 0; i < SEINE_PTS.length - 1; i++){
    const a = SEINE_PTS[i], b = SEINE_PTS[i+1];
    const d = segDist2(e, n, a[0], a[1], b[0], b[1]);
    if(d < best) best = d;
  }
  return best;
}

// ---------------------------------------------------------------------
//  PARKS  — green spaces (ellipses in metre space)
// ---------------------------------------------------------------------
const PARKS = [
  { cx: -3950, cy: 250,  rx: 760, ry: 260, rot: 0.15 },   // Champ de Mars (Eiffel lawns)
  { cx: -4480, cy: 1180, rx: 360, ry: 300, rot: 0 },      // Trocadéro gardens
  { cx: -1550, cy: 1080, rx: 560, ry: 230, rot: 0.5 },    // Tuileries
  { cx: -780,  cy: -980, rx: 360, ry: 300, rot: 0 },      // Luxembourg
  { cx: -520,  cy: 3750, rx: 420, ry: 360, rot: 0 },      // Montmartre slopes
  { cx: -2730, cy: 470,  rx: 300, ry: 360, rot: 0 },      // Invalides esplanade
  { cx: 670,   cy: -1000,rx: 320, ry: 220, rot: 0.1 },    // Jardin des Plantes (Left Bank, SE)
  { cx: -3000, cy: 2940, rx: 260, ry: 230, rot: 0 },      // Parc Monceau (NW, off the Arc)
  // --- greater-Paris green belt (fills the outer globe) ---
  { cx: -5000, cy: -450, rx: 850, ry: 820, rot: 0.05 },   // Bois de Boulogne (huge, W — runs to the sea)
  { cx: 4800,  cy: -1900,rx: 880, ry: 780, rot: 0.0 },    // Bois de Vincennes (huge, E)
  { cx: 1500,  cy: 3150, rx: 360, ry: 300, rot: 0 },      // Buttes-Chaumont (NE)
  { cx: -680,  cy: -3500,rx: 320, ry: 270, rot: 0 },      // Parc Montsouris (S)
  { cx: 2760,  cy: 880,  rx: 380, ry: 320, rot: 0.1 },    // Père-Lachaise greenery (E)
];
export function isPark(e, n){
  for(const p of PARKS){
    const dx = e-p.cx, dy = n-p.cy, c = Math.cos(-p.rot), s = Math.sin(-p.rot);
    const x = dx*c - dy*s, y = dx*s + dy*c;
    if((x*x)/(p.rx*p.rx) + (y*y)/(p.ry*p.ry) <= 1) return true;
  }
  return false;
}
export const PARK_LIST = PARKS;

// ---------------------------------------------------------------------
//  STREETS  — the 12 avenues of l'Étoile + grand axes & boulevards.
//  roadMask(e,n) -> 0..1.  Used for ground colour + to keep buildings off
//  the roads.
// ---------------------------------------------------------------------
const ETOILE = LANDMARKS.arc;                // place de l'Étoile
// Anchor the 12-avenue star to the REAL axe historique: ray 0 runs down the
// Champs-Élysées toward Concorde, ray 6 up the Avenue de la Grande Armée.
const AXE_HIST = Math.atan2(LANDMARKS.concorde.n - ETOILE.n, LANDMARKS.concorde.e - ETOILE.e);
export const AVENUES = (() => {
  const out = [];
  for(let i = 0; i < 12; i++) out.push({ angle: AXE_HIST + (i/12)*Math.PI*2 });
  return out;
})();
// extra named boulevards / axes as polylines (metres)
const BOULEVARDS = [
  // Axe historique: Louvre → Concorde → Champs → Arc (the Champs-Élysées)
  [[-700,900],[-2100,1400],[-3050,1860],[-4020,2315]],
  // Rue de Rivoli (along the Louvre/Tuileries, roughly E-W)
  [[300,260],[-700,560],[-1550,900],[-2100,1400]],
  // Boulevard Saint-Germain (Left Bank arc)
  [[700,-360],[-200,-560],[-1100,-360],[-2200,260]],
  // Boulevard Saint-Michel / N-S Left Bank
  [[-560,120],[-700,-760],[-820,-1600]],
  // Grands Boulevards (Madeleine → Opéra → République → Bastille)
  [[-1980,1760],[-1340,2115],[-200,1900],[950,1480],[1414,60]],
  // Boulevard de Sébastopol (N-S Right Bank)
  [[200,160],[300,1100],[400,2000]],
];
function nearAvenue(e, n){
  // half-line from Étoile out to ~3200 m
  const dx = e - ETOILE.e, dy = n - ETOILE.n;
  const dist = Math.hypot(dx, dy);
  if(dist < 30) return 1;                    // the place itself
  if(dist > 4200) return 0;
  const ang = Math.atan2(dy, dx);
  let best = Infinity;
  for(const a of AVENUES){
    let d = Math.abs(((ang - a.angle + Math.PI*3) % (Math.PI*2)) - Math.PI);
    if(d < best) best = d;
  }
  const perp = best * dist;                  // perpendicular distance from ray (metres)
  return perp < 48 ? 1 - perp/48 : 0;        // generous camera-safe boulevards
}
// distance (m) to the nearest street centreline (étoile avenues + boulevards).
// Used by buildings.js to keep facades a camera-safe corridor apart.
export function roadDist2D(e, n){
  let best = Infinity;
  const dx = e - ETOILE.e, dy = n - ETOILE.n;
  const dist = Math.hypot(dx, dy);
  if(dist < 4200){
    const ang = Math.atan2(dy, dx);
    let bd = Infinity;
    for(const a of AVENUES){
      let d = Math.abs(((ang - a.angle + Math.PI*3) % (Math.PI*2)) - Math.PI);
      if(d < bd) bd = d;
    }
    best = Math.min(best, bd * dist);
  }
  for(const bl of BOULEVARDS){
    for(let i = 0; i < bl.length - 1; i++){
      const d = segDist2(e, n, bl[i][0], bl[i][1], bl[i+1][0], bl[i+1][1]);
      if(d < best) best = d;
    }
  }
  return best;
}
export const PERIPH_R = 4700;                 // Boulevard Périphérique ring radius (metres) — inside the outer landmark ring
export function roadMask(e, n){
  let m = nearAvenue(e, n);
  for(const bl of BOULEVARDS){
    for(let i = 0; i < bl.length - 1; i++){
      const d = segDist2(e, n, bl[i][0], bl[i][1], bl[i+1][0], bl[i+1][1]);
      if(d < 42) m = Math.max(m, 1 - d/42);
    }
  }
  // Boulevard Périphérique — the beltway circling the city near the back pole
  const rr = Math.abs(Math.hypot(e, n) - PERIPH_R);
  if(rr < 80) m = Math.max(m, 1 - rr/80);
  // quai roads hugging both banks of the Seine (band scales with river width)
  const rh = riverHalfAt(e, n);
  const sd = seineDist2D(e, n);
  if(sd > rh * 1.07 && sd < rh * 1.38 && !onIsland(e, n)) m = Math.max(m, 0.72 * (1 - Math.abs(sd - rh * 1.22) / (rh * 0.16)));
  // bridge decks read as pavement
  if(onBridge(e, n)) m = Math.max(m, 0.9);
  return m;
}

// ---------------------------------------------------------------------
//  TERRAIN  — height offset (units) for a unit direction.
// ---------------------------------------------------------------------
export function seineDepth(dir){
  const { e, n } = dirToParis(dir);
  const rh = riverHalfAt(e, n);
  const sd = seineDist2D(e, n);
  if(sd > rh) return null;
  if(onIsland(e, n)) return null;
  if(onBridge(e, n)) return null;            // bridge causeway — no carve, walk across
  const t = sd / rh;                         // 0 centre … 1 bank
  const floor = -0.55;
  return floor + (CITY - floor) * THREE.MathUtils.smoothstep(t, 0.62, 1.0);
}
export function terrainParis(dir){
  const { e, n } = dirToParis(dir);
  let h = CITY;
  for(const hl of HILLS_R){
    const dm = Math.hypot(e - hl.e, n - hl.n);
    h += hl.amp * Math.exp(-(dm*dm) / (2*hl.sigma*hl.sigma));
  }
  // very gentle suburban roll out past the built city (toward the back pole)
  const far = Math.hypot(e, n);
  if(far > 5000) h += Math.sin(e*0.0011) * Math.cos(n*0.0011) * 0.5;
  // the polar sea — the whole far cap slopes under the waterline
  if(far > SEA_R - 280){
    const s = THREE.MathUtils.smoothstep(far, SEA_R - 280, SEA_R + 200);
    h = Math.min(h, CITY - (CITY + 0.75) * s);
  }
  const rd = seineDepth(dir);
  if(rd !== null) h = Math.min(h, rd);
  return h;
}

// ---------------------------------------------------------------------
//  GROUND COLOUR  — limestone city, asphalt streets, green parks, gravel,
//  dark riverbed under the Seine.
// ---------------------------------------------------------------------
const COL = {
  stone:   new THREE.Color('#cfc7b3'),   // Paris limestone / pavement (cool cream, not sand)
  stoneA:  new THREE.Color('#d9d2c0'),
  stoneB:  new THREE.Color('#c1b9a5'),
  road:    new THREE.Color('#6d6a67'),   // asphalt
  cobble:  new THREE.Color('#8d8478'),
  park:    new THREE.Color('#8aa06c'),   // desaturated sage — calm abeto palette
  parkDk:  new THREE.Color('#71905a'),
  forest:  new THREE.Color('#5e7d4f'),   // the Bois — deeper woodland green
  gravel:  new THREE.Color('#c9bb98'),   // Tuileries / Luxembourg alleys
  bed:     new THREE.Color('#4e6a7c'),   // Seine riverbed (cool blue-slate under the water)
  quay:    new THREE.Color('#b3aa93'),   // stone embankment lip above the water
  suburb:  new THREE.Color('#b7b2a7'),   // outer arrondissements / banlieue (greyer)
};
const _BOIS = [[-5000, -450], [4800, -1900]];  // Bois centres -> forest-green tint
const _c = new THREE.Color();
function hash2(e, n){ const s = Math.sin(e*0.07 + n*0.13)*43758.5453; return s - Math.floor(s); }
export function groundColor(dir){
  const { e, n } = dirToParis(dir);
  const far = Math.hypot(e, n);
  // the polar sea: sandy shore ring, then seabed all the way to the back pole
  if(far > SEA_R + 40) return _c.copy(COL.bed);
  if(far > SEA_R - 140) return _c.copy(COL.gravel);
  const rh = riverHalfAt(e, n);
  const sd = seineDist2D(e, n);
  if(sd <= rh && !onIsland(e, n) && !onBridge(e, n)){
    // the carved bank above the waterline reads as a stone quay wall, not mud
    if(sd > rh * 0.78) return _c.copy(COL.quay);
    return _c.copy(COL.bed);
  }
  if(isPark(e, n)){
    const k = hash2(e, n);
    // the two Bois read as deeper woodland; city parks stay manicured green
    let inBois = false;
    for(const b of _BOIS){ if(Math.hypot(e-b[0], n-b[1]) < 1200){ inBois = true; break; } }
    if(inBois) return _c.copy(COL.forest).lerp(COL.parkDk, k*0.5);
    // gravel paths threaded through the green
    if(((Math.abs(e) % 140) < 16) && k > 0.4) return _c.copy(COL.gravel);
    return _c.copy(COL.park).lerp(COL.parkDk, k*0.8);
  }
  const rm = roadMask(e, n);
  if(rm > 0.45) return _c.copy(COL.road).lerp(COL.cobble, 0.25 + (1-rm)*0.4);
  const k = hash2(e, n);
  const stone = _c.copy(COL.stone).lerp(k > 0.5 ? COL.stoneA : COL.stoneB, Math.abs(k-0.5)*1.3);
  // outer arrondissements / banlieue pale toward a greyer concrete tone
  if(far > 4600) stone.lerp(COL.suburb, THREE.MathUtils.clamp((far-4600)/2400, 0, 0.62));
  return stone;
}
