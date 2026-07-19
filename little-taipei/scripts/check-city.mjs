import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as landmarkBuilders from '../taipei-landmarks.js';
import { TAIPEI_CITY } from '../city/taipei.js';
import { validateCity } from '../city/validate.js';

validateCity(TAIPEI_CITY, landmarkBuilders);

const totals = {
  landmarks: TAIPEI_CITY.landmarks.length,
  shops: TAIPEI_CITY.shops.length,
  roads: TAIPEI_CITY.roads.length,
  parks: TAIPEI_CITY.spaces.parks.length,
  waterways: TAIPEI_CITY.terrain.waterways.length,
};

console.log(`City definition valid: ${JSON.stringify(totals)}`);

// ---- drift report vs scripts/geo-truth.json --------------------------------
// Compares authored city coordinates (real km from Taipei 101) against the
// OSM ground truth. WARN-ONLY until the Phase 2 normalization lands —
// downtown is known-inflated ~x1.9, and this report is the migration
// worklist. --strict fails past zone tolerance; Phase 2 flips the default.
const STRICT = process.argv.includes('--strict');
const TRUTH_PATH = join(dirname(fileURLToPath(import.meta.url)), 'geo-truth.json');
if (!existsSync(TRUTH_PATH)) {
  console.log('drift report: scripts/geo-truth.json missing — run scripts/fetch-geo-truth.mjs');
} else {
  const truth = new Map(JSON.parse(readFileSync(TRUTH_PATH, 'utf8')).features.map(f => [f.id, f]));
  // Zone tolerances in km. C is backdrop — direction/mass only.
  const TOL = { A: 0.15, 'A-lite': 0.4, B: 0.4, C: 1.5 };

  const segDist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  const toPoly = (p, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segDist(p, pts[i], pts[i + 1])); return m; };
  const pathLen = pts => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };

  const rows = [];
  // point features: landmarks, mountains, parks
  const pointSources = [
    ...TAIPEI_CITY.landmarks.map(l => ({ id: l.id, at: l.at, what: 'landmark' })),
    ...TAIPEI_CITY.terrain.mountains.map(m => ({ id: m.id, at: m.at, what: 'mountain' })),
    ...TAIPEI_CITY.spaces.parks.map(p => ({ id: p.id, at: p.at, what: 'park' })),
  ];
  for (const s of pointSources) {
    const t = truth.get(s.id);
    if (!t || t.kind !== 'point') continue;
    const drift = Math.hypot(s.at[0] - t.at[0], s.at[1] - t.at[1]);
    const dGame = Math.hypot(...s.at), dTruth = Math.hypot(...t.at);
    const ratio = dTruth > 0.05 ? dGame / dTruth : 1;
    rows.push({ id: s.id, what: s.what, zone: t.zone, drift, ratio, note: `game [${s.at}] truth [${t.at}]` });
  }
  // line features: roads, rivers — drift is the worst game point's distance to
  // the true alignment (a shorter-than-real road on the true line passes);
  // coverage flags how much of the real length the game path spans.
  const lineSources = [
    ...TAIPEI_CITY.roads.map(r => ({ id: r.id, path: r.path, what: 'road' })),
    ...TAIPEI_CITY.terrain.waterways.map(w => ({ id: w.id, path: w.path, what: 'river' })),
  ];
  for (const s of lineSources) {
    const t = truth.get(s.id);
    if (!t || t.kind !== 'line') continue;
    const drift = Math.max(...s.path.map(p => toPoly(p, t.path)));
    const coverage = pathLen(s.path) / (pathLen(t.path) || 1);
    rows.push({ id: s.id, what: s.what, zone: t.zone, drift, ratio: coverage, note: `coverage ${(coverage * 100).toFixed(0)}% of real length` });
  }

  rows.sort((a, b) => b.drift - a.drift);
  const bad = rows.filter(r => r.drift > (TOL[r.zone] ?? 0.4));
  console.log(`\ndrift report vs geo-truth (${rows.length} matched, tolerance A ${TOL.A} / B ${TOL.B} km):`);
  for (const r of rows) {
    const flag = r.drift > (TOL[r.zone] ?? 0.4) ? ' <-- DRIFT' : '';
    console.log(`  ${r.drift.toFixed(2).padStart(5)} km  ${(r.zone || '?').padEnd(6)} ${r.what.padEnd(8)} ${r.id.padEnd(24)} x${r.ratio.toFixed(2)}  ${r.note}${flag}`);
  }
  const missing = [...truth.values()].filter(t => !rows.some(r => r.id === t.id) && t.kind === 'line');
  if (missing.length) console.log(`  not in city data yet: ${missing.map(m => m.id).join(', ')}`);
  if (bad.length) {
    console.log(`\n${bad.length} feature(s) beyond zone tolerance.`);
    if (STRICT) { console.error('drift check FAILED (strict). Pass --no-strict for warn-only.'); process.exit(1); }
  } else {
    console.log('drift check passed.');
  }
}
