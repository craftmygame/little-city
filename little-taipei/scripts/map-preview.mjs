#!/usr/bin/env node
/**
 * map-preview.mjs — render the city data top-down to SVG, with the OSM
 * geo-truth reference overlaid in magenta. The automated backbone of the
 * realism checks: bearings/topology mismatches jump out visually.
 *
 * Three framings (basin ~24 km, grid ~12 km, xinyi ~4 km across) x two modes:
 *   raw    — authored real km, truth as-is (post-Phase-2 these should align)
 *   spread — both layers pushed through the EXACT runtime spread transform
 *            from main.js (planet.spread), radii grown like the runtime does.
 *
 * Usage: node scripts/map-preview.mjs [--out plans/checks/2026-07-19]
 * No dependencies. Writes preview-<framing>-<mode>.svg to the out dir.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TAIPEI_CITY as CITY } from '../city/taipei.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.indexOf('--out');
const OUT_DIR = outArg > -1 ? process.argv[outArg + 1]
  : join(HERE, '..', 'plans', 'checks', new Date().toISOString().slice(0, 10));
mkdirSync(OUT_DIR, { recursive: true });

const TRUTH_PATH = join(HERE, 'geo-truth.json');
const TRUTH = existsSync(TRUTH_PATH) ? JSON.parse(readFileSync(TRUTH_PATH, 'utf8')).features : [];

// --- the runtime spread transform, copied EXACTLY from main.js -------------
const { factor: SPREAD, innerKm: SP_A0, outerKm: SP_A1, farFactor: SP_OUT, boost: SP_BOOST } = CITY.planet.spread;
function boostExtra(d) {
  if (!SP_BOOST) return 0;
  const { s0, z: [z1, z2, z3, z4], dip } = SP_BOOST, base = SPREAD;
  const S = u => u * u * u - u * u * u * u * 0.5;
  const e1 = s0 - base, e2 = dip - base;
  let E = 0, t = Math.min(d, z1); E += e1 * t;
  if (d > z1) { const L = z2 - z1, u = Math.min((d - z1) / L, 1); E += e1 * L * u + (e2 - e1) * L * S(u); }
  if (d > z2) { E += e2 * (Math.min(d, z3) - z2); }
  if (d > z3) { const L = z4 - z3, u = Math.min((d - z3) / L, 1); E += e2 * L * u + (0 - e2) * L * S(u); }
  return E;
}
const BOOST_TAIL = SP_BOOST ? boostExtra(SP_BOOST.z[3]) : 0;
function spreadDist(d) {
  const L = SP_A1 - SP_A0;
  let G;
  if (d <= SP_A0) G = 0;
  else if (d < SP_A1) { const u = (d - SP_A0) / L; G = L * (u * u * u - u * u * u * u * 0.5); }
  else G = L * 0.5 + (d - SP_A1);
  const boost = SP_BOOST && d < SP_BOOST.z[3] ? boostExtra(d) - BOOST_TAIL * (d / SP_BOOST.z[3]) : 0;
  return Math.min(SPREAD * d + (SP_OUT - SPREAD) * G + boost, 17.9);
}
function warpKm(x, y) { const d = Math.hypot(x, y); if (d < 1e-6) return { x: 0, y: 0 }; const k = spreadDist(d) / d; return { x: x * k, y: y * k }; }
const stretchAt = (x, y) => { const d = Math.hypot(x, y) || 1e-4; return spreadDist(d) / d; };

// --- framings --------------------------------------------------------------
// half = half-extent in km. Spread mode grows the same content window.
const FRAMINGS = [
  { id: 'basin', half: 12, spreadHalf: 18 },
  { id: 'grid', half: 6, spreadHalf: 11 },
  { id: 'xinyi', half: 2, spreadHalf: 3.9 },
];
const SIZE = 1100;

function makeSvg(framing, mode) {
  const spread = mode === 'spread';
  const half = spread ? framing.spreadHalf : framing.half;
  const S = SIZE / (2 * half);                       // px per km
  const px = ([x, y]) => [SIZE / 2 + x * S, SIZE / 2 - y * S];
  const P = pt => { if (!spread) return px(pt); const w = warpKm(pt[0], pt[1]); return px([w.x, w.y]); };
  const path = pts => 'M' + pts.map(p => P(p).map(v => v.toFixed(1)).join(',')).join(' L');
  const el = [];
  const emit = s => el.push(s);

  emit(`<rect width="${SIZE}" height="${SIZE}" fill="#f6f3ec"/>`);

  // districts (dashed grey circles) — radii grow like the runtime (cap 1.9)
  for (const d of CITY.districts) {
    const k = spread ? Math.min(stretchAt(...d.at), 1.9) : 1;
    const [cx, cy] = P(d.at);
    emit(`<circle cx="${cx}" cy="${cy}" r="${d.radiusKm * k * S}" fill="none" stroke="#c9c2b2" stroke-dasharray="6 5"/>`);
    if (framing.id !== 'xinyi') emit(`<text x="${cx}" y="${cy}" font-size="11" fill="#b6ad99" text-anchor="middle">${d.id}</text>`);
  }
  // mountains (brown circles, radius grows capped 1.55)
  for (const m of CITY.terrain.mountains) {
    const k = spread ? Math.min(stretchAt(...m.at), 1.55) : 1;
    const [cx, cy] = P(m.at);
    emit(`<circle cx="${cx}" cy="${cy}" r="${m.radiusKm * k * S}" fill="#c1a97e" fill-opacity="0.25" stroke="#a8895c"/>`);
    emit(`<circle cx="${cx}" cy="${cy}" r="2.5" fill="#8a6b3f"/>`);
  }
  // parks (green, radius grows capped 1.5)
  for (const p of CITY.spaces.parks) {
    const k = spread ? Math.min(stretchAt(...p.at), 1.5) : 1;
    const [cx, cy] = P(p.at);
    emit(`<circle cx="${cx}" cy="${cy}" r="${p.radiusKm * k * S}" fill="#79b55a" fill-opacity="0.45" stroke="#579a41"/>`);
  }
  // rivers (blue bands, physical width)
  for (const w of CITY.terrain.waterways)
    emit(`<path d="${path(w.path)}" fill="none" stroke="#5ec4cc" stroke-width="${Math.max(2 * w.halfWidthKm * S, 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  // roads (grey, physical width)
  for (const r of CITY.roads)
    emit(`<path d="${path(r.path)}" fill="none" stroke="#8e8878" stroke-width="${Math.max(r.widthKm * S, 1.5)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  // metro (thin colored)
  for (const m of CITY.transit.metroLines)
    emit(`<path d="${path(m.path)}" fill="none" stroke="${m.color}" stroke-width="1.6" stroke-opacity="0.85"/>`);
  // trails (dotted dark)
  for (const t of CITY.trails || [])
    emit(`<path d="${path(t.path)}" fill="none" stroke="#4a4438" stroke-width="1.4" stroke-dasharray="2 3"/>`);
  // landmarks (black dots + labels)
  for (const l of CITY.landmarks) {
    const [cx, cy] = P(l.at);
    emit(`<circle cx="${cx}" cy="${cy}" r="4" fill="#232019"/>`);
    if (framing.id !== 'basin') emit(`<text x="${cx + 6}" y="${cy - 4}" font-size="11" fill="#232019">${l.name}</text>`);
  }
  // shops (small dots)
  for (const s of CITY.shops) { const [cx, cy] = P(s.at); emit(`<circle cx="${cx}" cy="${cy}" r="2" fill="#6b6455"/>`); }

  // ---- geo-truth reference overlay (magenta) ----
  for (const f of TRUTH) {
    if (f.kind === 'line') {
      const dash = f.id.endsWith('-river') ? ' stroke-dasharray="8 5"' : '';
      emit(`<path d="${path(f.path)}" fill="none" stroke="#d81b9f" stroke-width="1.3" stroke-opacity="0.85"${dash}/>`);
    } else {
      const [cx, cy] = P(f.at);
      emit(`<path d="M${cx - 5},${cy - 5} L${cx + 5},${cy + 5} M${cx - 5},${cy + 5} L${cx + 5},${cy - 5}" stroke="#d81b9f" stroke-width="1.6"/>`);
      if (framing.id === 'xinyi' || (framing.id === 'grid' && f.zone !== 'B'))
        emit(`<text x="${cx + 6}" y="${cy + 12}" font-size="9" fill="#d81b9f">${f.id}</text>`);
    }
  }

  // scale bar (1 km) + legend
  emit(`<rect x="20" y="${SIZE - 34}" width="${S}" height="4" fill="#232019"/>`);
  emit(`<text x="20" y="${SIZE - 40}" font-size="12" fill="#232019">1 km ${spread ? '(authored, pre-spread)' : ''}</text>`);
  emit(`<text x="20" y="24" font-size="14" fill="#232019">${framing.id} / ${mode} — game data (grey/green) vs OSM geo-truth (magenta)</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">\n${el.join('\n')}\n</svg>\n`;
}

for (const framing of FRAMINGS) {
  for (const mode of ['raw', 'spread']) {
    const file = join(OUT_DIR, `preview-${framing.id}-${mode}.svg`);
    writeFileSync(file, makeSvg(framing, mode));
    console.log(`wrote ${file}`);
  }
}
if (!TRUTH.length) console.log('note: geo-truth.json missing — reference layer empty');
