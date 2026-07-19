#!/usr/bin/env node
/**
 * fetch-geo-truth.mjs — dev-only ground-truth fetcher (network required).
 *
 * Queries the Overpass API for every named feature the realism plan cares
 * about (landmarks, arterial roads, rivers, bridges, peaks, the airport),
 * projects lat/lon to km-from-Taipei-101 (equirectangular around
 * 25.0337 N 121.5645 E), simplifies polylines, and writes
 * scripts/geo-truth.json. The JSON is committed; this script exists to
 * regenerate it. OSM data © OpenStreetMap contributors, ODbL.
 *
 * Usage: node scripts/fetch-geo-truth.mjs [--only id1,id2]
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'geo-truth.json');

// --- projection ------------------------------------------------------------
const LAT0 = 25.0337, LON0 = 121.5645;               // Taipei 101
const KM_LAT = 110.574;
const KM_LON = 111.320 * Math.cos(LAT0 * Math.PI / 180);
const proj = (lat, lon) => [
  +(((lon - LON0) * KM_LON).toFixed(3)),
  +(((lat - LAT0) * KM_LAT).toFixed(3)),
];

// --- feature manifest ------------------------------------------------------
// bbox: [south, west, north, east]. Default covers greater Taipei.
const TAIPEI = [24.93, 121.40, 25.22, 121.68];
// kind: point (landmark/peak/park…) | line (road/river/bridge/runway)
// names: exact-name candidates tried in order (points).
// regex : name regex (lines — OSM splits roads into per-section ways).
const FEATURES = [
  // ---- Zone A landmarks (13) ----
  { id: 'taipei-101', kind: 'point', zone: 'A', names: ['台北101', 'Taipei 101'] },
  { id: 'city-hall', kind: 'point', zone: 'A', names: ['臺北市政府', '台北市政府'] },
  { id: 'sun-yat-sen-hall', kind: 'point', zone: 'A', names: ['國立國父紀念館', '國父紀念館'] },
  { id: 'taipei-dome', kind: 'point', zone: 'A', names: ['臺北大巨蛋', '台北大巨蛋', 'Taipei Dome'] },
  { id: 'grand-hyatt', kind: 'point', zone: 'A', names: ['台北君悅酒店', '臺北君悅酒店', 'Grand Hyatt Taipei'] },
  { id: 'breeze-nanshan', kind: 'point', zone: 'A', names: ['台北南山廣場', '微風南山', 'Taipei Nan Shan Plaza'] },
  { id: 'mitsukoshi-a11', kind: 'point', zone: 'A', names: ['新光三越A11館', '信義新天地 (A11)', '新光三越信義新天地A11'] },
  { id: 'taipei-arena', kind: 'point', zone: 'A', names: ['臺北小巨蛋', '台北小巨蛋', 'Taipei Arena'] },
  { id: 'raohe-night-market', kind: 'point', zone: 'A', names: ['饒河街觀光夜市', '饒河街夜市', '饒河夜市'] },
  { id: 'cks-memorial', kind: 'point', zone: 'A', names: ['中正紀念堂'] },
  { id: 'presidential-office', kind: 'point', zone: 'A', names: ['總統府', '中華民國總統府'] },
  { id: 'main-station', kind: 'point', zone: 'A', names: ['臺北車站', '台北車站', 'Taipei Main Station'] },
  { id: 'longshan-temple', kind: 'point', zone: 'A', names: ['艋舺龍山寺', '龍山寺'], bbox: [25.02, 121.49, 25.05, 121.51] },
  // ---- Zone A-lite (5) ----
  { id: 'grand-hotel', kind: 'point', zone: 'A-lite', names: ['圓山大飯店', '圓山飯店', 'The Grand Hotel'] },
  { id: 'shilin-night-market', kind: 'point', zone: 'A-lite', names: ['士林夜市', '士林觀光夜市'], bbox: [25.07, 121.51, 25.10, 121.53] },
  { id: 'palace-museum', kind: 'point', zone: 'A-lite', names: ['國立故宮博物院', '故宮博物院'] },
  { id: 'miramar-ferris-wheel', kind: 'point', zone: 'A-lite', names: ['美麗華百樂園', 'Miramar Entertainment Park'] },
  { id: 'baoan-temple', kind: 'point', zone: 'A-lite', names: ['大龍峒保安宮', '保安宮'], bbox: [25.06, 121.50, 25.08, 121.52] },
  // ---- verification parks ----
  { id: 'daan-forest-park', kind: 'point', zone: 'B', names: ['大安森林公園'] },
  { id: 'peace-park', kind: 'point', zone: 'B', names: ['二二八和平紀念公園', '二二八和平公園'] },
  // ---- peaks (Phase 2 mountain anchors) ----
  { id: 'elephant-mountain', kind: 'point', zone: 'B', peak: true, names: ['象山'], bbox: [25.01, 121.55, 25.04, 121.58] },
  { id: 'thumb-mountain', kind: 'point', zone: 'B', peak: true, names: ['拇指山'], bbox: [25.00, 121.55, 25.04, 121.59] },
  { id: 'tiger-mountain', kind: 'point', zone: 'B', peak: true, names: ['虎山峰', '虎山'], bbox: [25.02, 121.57, 25.06, 121.60] },
  { id: 'qixingshan', kind: 'point', zone: 'C', peak: true, names: ['七星山主峰', '七星山'], bbox: [25.13, 121.52, 25.20, 121.60] },
  { id: 'datun', kind: 'point', zone: 'C', peak: true, names: ['大屯山主峰', '大屯山'], bbox: [25.13, 121.48, 25.20, 121.55] },
  { id: 'guanyinshan', kind: 'point', zone: 'C', peak: true, names: ['觀音山', '硬漢嶺'], bbox: [25.10, 121.39, 25.16, 121.45] },
  { id: 'maokong', kind: 'point', zone: 'C', names: ['貓空站', '貓空'], bbox: [24.94, 121.55, 25.00, 121.60] },
  // ---- existing 15 game roads ----
  { id: 'zhongxiao', kind: 'line', zone: 'B', regex: '^忠孝東路|^忠孝西路' },
  { id: 'renai', kind: 'line', zone: 'B', regex: '^仁愛路' },
  { id: 'xinyi-road', kind: 'line', zone: 'B', regex: '^信義路' },
  { id: 'heping', kind: 'line', zone: 'B', regex: '^和平東路|^和平西路' },
  { id: 'nanjing', kind: 'line', zone: 'B', regex: '^南京東路|^南京西路' },
  { id: 'bade', kind: 'line', zone: 'B', regex: '^八德路' },
  { id: 'zhongshan', kind: 'line', zone: 'B', regex: '^中山北路|^中山南路' },
  { id: 'dunhua', kind: 'line', zone: 'B', regex: '^敦化北路|^敦化南路' },
  { id: 'fuxing', kind: 'line', zone: 'B', regex: '^復興北路|^復興南路' },
  { id: 'zhonghua', kind: 'line', zone: 'B', regex: '^中華路', bbox: [25.02, 121.49, 25.06, 121.52] },
  { id: 'keelung-road', kind: 'line', zone: 'B', regex: '^基隆路' },
  { id: 'roosevelt', kind: 'line', zone: 'B', regex: '^羅斯福路' },
  { id: 'guangfu-south', kind: 'line', zone: 'B', regex: '^光復南路|^光復北路' },
  { id: 'songren', kind: 'line', zone: 'B', regex: '^松仁路' },
  { id: 'songshou', kind: 'line', zone: 'B', regex: '^松壽路' },
  // ---- full-grid arterials (Phase 3 targets) ----
  { id: 'civic-blvd', kind: 'line', zone: 'B', regex: '^市民大道' },
  { id: 'minquan', kind: 'line', zone: 'B', regex: '^民權東路|^民權西路' },
  { id: 'minsheng', kind: 'line', zone: 'B', regex: '^民生東路|^民生西路' },
  { id: 'xinsheng', kind: 'line', zone: 'B', regex: '^新生南路|^新生北路' },
  { id: 'jianguo', kind: 'line', zone: 'B', regex: '^建國南路|^建國北路' },
  { id: 'chengde', kind: 'line', zone: 'B', regex: '^承德路' },
  { id: 'wenlin', kind: 'line', zone: 'B', regex: '^文林路', bbox: [25.08, 121.50, 25.14, 121.54] },
  { id: 'shipai', kind: 'line', zone: 'B', regex: '^石牌路', bbox: [25.10, 121.50, 25.13, 121.54] },
  { id: 'zhongcheng', kind: 'line', zone: 'B', regex: '^忠誠路', bbox: [25.09, 121.52, 25.13, 121.55] },
  { id: 'neihu-road', kind: 'line', zone: 'B', regex: '^內湖路', bbox: [25.06, 121.54, 25.10, 121.60] },
  { id: 'chenggong-road', kind: 'line', zone: 'B', regex: '^成功路', bbox: [25.05, 121.57, 25.10, 121.62] },
  { id: 'nangang-road', kind: 'line', zone: 'B', regex: '^南港路', bbox: [25.04, 121.58, 25.07, 121.64] },
  { id: 'academia-road', kind: 'line', zone: 'B', regex: '^研究院路', bbox: [25.00, 121.58, 25.06, 121.63] },
  { id: 'chongxin', kind: 'line', zone: 'B', regex: '^重新路', bbox: [25.03, 121.45, 25.08, 121.51] },
  { id: 'wenhua-banqiao', kind: 'line', zone: 'B', regex: '^文化路', bbox: [24.99, 121.44, 25.04, 121.49] },
  { id: 'beixin', kind: 'line', zone: 'B', regex: '^北新路', bbox: [24.94, 121.52, 25.00, 121.55] },
  { id: 'yonghe-road', kind: 'line', zone: 'B', regex: '^永和路', bbox: [25.00, 121.50, 25.02, 121.53] },
  { id: 'jingping', kind: 'line', zone: 'B', regex: '^景平路', bbox: [24.98, 121.48, 25.01, 121.53] },
  { id: 'datong-xizhi', kind: 'line', zone: 'B', regex: '^大同路', bbox: [25.05, 121.61, 25.11, 121.68] },
  { id: 'sanmin-luzhou', kind: 'line', zone: 'B', regex: '^三民路', bbox: [25.07, 121.45, 25.10, 121.48] },
  { id: 'zhongzheng-xinzhuang', kind: 'line', zone: 'B', regex: '^中正路', bbox: [25.02, 121.41, 25.06, 121.46] },
  { id: 'zhongyang-tucheng', kind: 'line', zone: 'B', regex: '^中央路', bbox: [24.95, 121.42, 25.00, 121.46] },
  // ---- rivers ----
  { id: 'tamsui-river', kind: 'line', zone: 'B', river: true, regex: '^淡水河$', maxPts: 10 },
  { id: 'xindian-river', kind: 'line', zone: 'B', river: true, regex: '^新店溪$', maxPts: 10 },
  { id: 'keelung-river', kind: 'line', zone: 'B', river: true, regex: '^基隆河$', maxPts: 10 },
  // ---- bridges (Phase 3) ----
  { id: 'taipei-bridge', kind: 'line', zone: 'B', bridge: true, regex: '^台北大橋$|^台北橋$|^臺北橋$' },
  { id: 'zhongxiao-bridge', kind: 'line', zone: 'B', bridge: true, regex: '^忠孝橋$' },
  { id: 'dazhi-bridge', kind: 'line', zone: 'B', bridge: true, regex: '^大直橋$' },
  { id: 'minquan-bridge', kind: 'line', zone: 'B', bridge: true, regex: '^民權大橋$' },
  // ---- Songshan Airport (Phase 3) ----
  { id: 'songshan-airport', kind: 'point', zone: 'B', names: ['臺北松山機場', '台北松山機場', 'Taipei Songshan Airport'] },
  { id: 'songshan-runway', kind: 'line', zone: 'B', runway: true, bbox: [25.06, 121.53, 25.08, 121.57] },
];

// --- Overpass client -------------------------------------------------------
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function overpass(query, clientTimeout = 100000) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'little-taipei-geo-truth/1.0 (dev script)',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(clientTimeout),
      });
      if (res.status === 429 || res.status === 504) { await sleep(3000 * (attempt + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; process.stderr.write(`  retry ${attempt + 1} (${e.message})\n`); await sleep(2000 * (attempt + 1)); }
  }
  throw lastErr;
}
const bboxStr = b => `(${b.join(',')})`;

// --- geometry helpers ------------------------------------------------------
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function douglasPeucker(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxD = -1, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  const left = douglasPeucker(pts.slice(0, idx + 1), eps);
  const right = douglasPeucker(pts.slice(idx), eps);
  return left.slice(0, -1).concat(right);
}
function simplifyTo(pts, maxPts) {
  if (pts.length <= maxPts) return pts;
  let lo = 0.0005, hi = 8;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (douglasPeucker(pts, mid).length > maxPts) lo = mid; else hi = mid;
  }
  return douglasPeucker(pts, hi);
}
// Road point cloud -> centerline: sort along the principal axis, average bins.
// Handles dual carriageways / per-section splits without endpoint chaining.
function centerline(points, maxPts) {
  if (points.length < 2) return points;
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of points) { const dx = x - cx, dy = y - cy; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const ts = points.map(([x, y]) => (x - cx) * ux + (y - cy) * uy);
  const tMin = Math.min(...ts), tMax = Math.max(...ts);
  const span = tMax - tMin || 1e-6;
  const nBins = Math.max(2, Math.min(80, Math.round(span / 0.2)));
  const bins = Array.from({ length: nBins }, () => []);
  points.forEach((p, i) => {
    const b = Math.min(nBins - 1, Math.floor((ts[i] - tMin) / span * nBins));
    bins[b].push(p);
  });
  const line = bins.filter(b => b.length).map(b => [
    +(b.reduce((s, p) => s + p[0], 0) / b.length).toFixed(3),
    +(b.reduce((s, p) => s + p[1], 0) / b.length).toFixed(3),
  ]);
  return simplifyTo(line, maxPts);
}
// River ways -> one chained path (rivers meander; axis-sorting would destroy
// the bends). Greedy endpoint chaining from the longest segment.
function chainWays(ways, maxPts) {
  const segs = ways.map(w => w.geometry.map(g => proj(g.lat, g.lon)));
  if (!segs.length) return [];
  segs.sort((a, b) => pathLen(b) - pathLen(a));
  let chain = segs.shift();
  let grew = true;
  while (grew && segs.length) {
    grew = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const [h, t] = [chain[0], chain[chain.length - 1]];
      const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6;
      if (near(t, s[0])) { chain = chain.concat(s.slice(1)); }
      else if (near(t, s[s.length - 1])) { chain = chain.concat(s.slice(0, -1).reverse()); }
      else if (near(h, s[s.length - 1])) { chain = s.slice(0, -1).concat(chain); }
      else if (near(h, s[0])) { chain = s.slice(1).reverse().concat(chain); }
      else continue;
      segs.splice(i, 1); grew = true; break;
    }
  }
  return simplifyTo(chain, maxPts);
}
const pathLen = pts => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };

// --- bulk fetch: 4 batched queries instead of ~65 small ones ---------------
// Overpass indexes exact ["name"="…"] lookups (fast) but scans on regex, and
// rate-limits per IP — so we pull everything in a few big requests and do all
// per-feature matching locally.
const inBbox = (lat, lon, b) => lat >= b[0] && lon >= b[1] && lat <= b[2] && lon <= b[3];

async function bulkPoints(features) {
  const parts = [];
  for (const f of features) {
    const bbox = bboxStr(f.bbox || TAIPEI);
    for (const name of f.names) {
      const filter = f.peak ? `["natural"="peak"]["name"="${name}"]` : `["name"="${name}"]`;
      parts.push(`nwr${filter}${bbox};`);
    }
  }
  const els = [];
  for (let i = 0; i < parts.length; i += 12) {
    const chunk = parts.slice(i, i + 12);
    process.stderr.write(`  points chunk ${i / 12 + 1}/${Math.ceil(parts.length / 12)}…\n`);
    const data = await overpass(`[out:json][timeout:60];(${chunk.join('')});out center;`);
    els.push(...(data.elements || []).filter(e => (e.center?.lat ?? e.lat) != null));
    await sleep(1200);
  }
  return els;
}
function matchPoint(f, els) {
  const cands = els.filter(e => {
    const lat = e.center?.lat ?? e.lat, lon = e.center?.lon ?? e.lon;
    if (!f.names.includes(e.tags?.name)) return false;
    if (f.peak && e.tags?.natural !== 'peak') return false;
    return inBbox(lat, lon, f.bbox || TAIPEI);
  });
  if (!cands.length) return null;
  const score = e => {
    const t = e.tags || {};
    const real = t.building || t.aeroway || t.amenity || t.tourism || t.leisure || t.man_made || t.natural || t.historic || t.shop ? 10 : 0;
    const nameRank = f.names.length - f.names.indexOf(t.name);
    const typeW = e.type === 'relation' ? 2 : e.type === 'way' ? 1 : 0;
    return real * 10 + nameRank * 3 + typeW;
  };
  cands.sort((a, b) => score(b) - score(a));
  const e = cands[0];
  return { at: proj(e.center?.lat ?? e.lat, e.center?.lon ?? e.lon), osmName: e.tags?.name, osmType: `${e.type}/${e.id}` };
}
function matchLine(f, ways) {
  const rx = f.regex ? new RegExp(f.regex) : null;
  const mine = ways.filter(w => {
    if (rx && !rx.test(w.tags?.name || '')) return false;
    if (f.runway && w.tags?.aeroway !== 'runway') return false;
    const b = f.bbox || TAIPEI;
    return w.geometry.some(g => inBbox(g.lat, g.lon, b));
  });
  if (!mine.length) return null;
  const maxPts = f.maxPts || 8;
  let path;
  if (f.river) path = chainWays(mine, maxPts);
  else if (f.bridge || f.runway) {
    mine.sort((a, b) => pathLen(b.geometry.map(g => proj(g.lat, g.lon))) - pathLen(a.geometry.map(g => proj(g.lat, g.lon))));
    path = simplifyTo(mine[0].geometry.map(g => proj(g.lat, g.lon)), 4);
  } else {
    const cloud = mine.flatMap(w => w.geometry.map(g => proj(g.lat, g.lon)));
    path = centerline(cloud, maxPts);
  }
  if (!path || path.length < 2) return null;
  return { path, osmWays: mine.length };
}

// --- main ------------------------------------------------------------------
const points = FEATURES.filter(f => f.kind === 'point');
const roads = FEATURES.filter(f => f.kind === 'line' && !f.river && !f.bridge && !f.runway);
const rivers = FEATURES.filter(f => f.river);
const special = FEATURES.filter(f => f.bridge || f.runway);

process.stderr.write('bulk query 1/4: named points…\n');
const pointEls = await bulkPoints(points);
process.stderr.write(`  ${pointEls.length} elements\n`);
await sleep(1500);
process.stderr.write('bulk query 2/4: major named highways…\n');
const roadData = await overpass(`[out:json][timeout:180];way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]["name"]${bboxStr(TAIPEI)};out geom;`, 200000);
const roadWays = (roadData.elements || []).filter(w => w.geometry?.length);
process.stderr.write(`  ${roadWays.length} ways\n`);
await sleep(1500);
process.stderr.write('bulk query 3/4: rivers…\n');
const riverData = await overpass(`[out:json][timeout:90];way["waterway"="river"]["name"~"^(淡水河|新店溪|基隆河)$"]${bboxStr(TAIPEI)};out geom;`);
const riverWays = (riverData.elements || []).filter(w => w.geometry?.length);
process.stderr.write(`  ${riverWays.length} ways\n`);
await sleep(1500);
process.stderr.write('bulk query 4/4: bridges + runway…\n');
const specialData = await overpass(`[out:json][timeout:90];(way["bridge"]["name"~"^(台北橋|臺北橋|忠孝橋|大直橋|民權大橋)$"]${bboxStr(TAIPEI)};way["aeroway"="runway"](25.06,121.53,25.08,121.57););out geom;`);
const specialWays = (specialData.elements || []).filter(w => w.geometry?.length);
process.stderr.write(`  ${specialWays.length} ways\n`);

const results = [];
const failures = [];
for (const f of FEATURES) {
  let got = null;
  try {
    if (f.kind === 'point') got = matchPoint(f, pointEls);
    else if (f.river) got = matchLine(f, riverWays);
    else if (f.bridge || f.runway) got = matchLine(f, specialWays);
    else got = matchLine(f, roadWays);
  } catch (e) { process.stderr.write(`${f.id}: ERROR ${e.message}\n`); }
  if (!got) { failures.push(f.id); process.stderr.write(`${f.id}: MISSING\n`); }
  else {
    results.push({ id: f.id, kind: f.kind, zone: f.zone, ...got });
    process.stderr.write(`${f.id}: ${got.at ? `[${got.at}]` : `${got.path.length} pts`}\n`);
  }
}

writeFileSync(OUT, JSON.stringify({
  source: 'OpenStreetMap via Overpass API (ODbL)',
  origin: { lat: LAT0, lon: LON0, note: 'km east/north of Taipei 101, equirectangular' },
  features: results,
}, null, 1));
console.log(`\nwrote ${OUT}: ${results.length} features${failures.length ? `, FAILED: ${failures.join(', ')}` : ''}`);
process.exit(failures.length ? 1 : 0);
