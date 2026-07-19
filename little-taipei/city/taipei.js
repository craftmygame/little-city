/**
 * Little Taipei's editable city definition.
 *
 * Coordinates are TRUE real kilometres from Taipei 101 (OSM geo-truth):
 *   [east, north] — west/south values are negative.
 * Everything here matches scripts/geo-truth.json within its zone tolerance
 * (`npm run check` enforces this strictly). ALL rendered inflation lives in
 * the runtime spread transform (planet.spread, incl. the inner `boost` that
 * replaced the old hand-inflated Xinyi data) — never pre-inflate coordinates
 * in this file again. Zone C backdrop mountains are the one exception:
 * true bearing, compressed distance (the globe is only so big).
 *
 * Most city contributions should only touch this file. Building geometry lives
 * in ../taipei-landmarks.js; rendering and gameplay live in ../main.js.
 */
const WALK_IN_STORE_WALLS = [
  // Back wall.
  ...[-2.1,-1.4,-0.7,0,0.7,1.4,2.1].map(x=>({x,z:-1.91,r:0.22})),
  // Side walls.
  ...[-1.55,-0.78,0,0.78,1.55].flatMap(z=>[
    {x:-2.31,z,r:0.22}, {x:2.31,z,r:0.22},
  ]),
  // Front glass and jambs. The 1.8u gap between the middle pair is the door.
  ...[-2.1,-1.5,-0.9,0.9,1.5,2.1].map(x=>({x,z:1.98,r:0.22})),
];
const SEVEN_ELEVEN_PLACEMENT = {
  scale: 1.25,
  foot: 4.2,
  cols: WALK_IN_STORE_WALLS,
  claim: 3.4,
  colH: 3.6,
  // The larger flat floor is sunk slightly so its far corners meet the curved basin.
  extra: -0.15,
  base: '#bdb7a8',
};
const FAMILY_MART_PLACEMENT = {
  scale: 1.25,
  foot: 4.2,
  cols: WALK_IN_STORE_WALLS,
  // Procedural blocks are placed later and honor this larger reservation.
  claim: 4.6,
  colH: 3.6,
  extra: -0.15,
  base: '#bdb7a8',
};

export const TAIPEI_CITY = {
  id: 'taipei',
  name: 'Little Taipei',

  planet: {
    radius: 40.8,
    waterLevel: 0,
    basinHeight: 1.25,
    unitsPerKm: 7.14,
    // factor/innerKm/outerKm/farFactor: the classic globe spread (×1.9 downtown,
    // easing off so the outer ranges land before the far pole). boost: the Phase 2
    // normalization — slope s0 inside z[0] real km un-does the old ×1.9 data
    // inflation of the Xinyi core, dips to `dip` and rejoins the base curve at
    // z[3] with zero net offset, so everything beyond 2.4 km renders as before.
    spread: { factor: 1.9, innerKm: 4, outerKm: 11, farFactor: 0.321,
              boost: { s0: 3.61, z: [0.55, 1.15, 1.8, 2.4], dip: 0.7373 } },
  },

  terrain: {
    mountains: [
      // Yangmingshan / Datun / Qixingshan — north. Zone C backdrop: anchors sit
      // on the TRUE bearing from 101 (per geo-truth peaks) at a compressed
      // distance, so the skyline reads right without drowning in the far ocean.
      { id: 'datun', at: [-3.0, 11.28], height: 8.5, radiusKm: 5.0 },
      { id: 'qixingshan', at: [-0.87, 12.47], height: 7.5, radiusKm: 4.2 },
      { id: 'yangmingshan-west', at: [-5.5, 9.78], height: 6.5, radiusKm: 4.0 },
      { id: 'yangmingshan-east', at: [2.13, 10.47], height: 6.0, radiusKm: 3.6 },
      { id: 'datun-north', at: [-1.5, 13.28], height: 7.4, radiusKm: 3.2 },

      // Maokong / Wenshan — south
      { id: 'maokong', at: [2.38, -7.18], height: 7.0, radiusKm: 4.6 },
      { id: 'erge', at: [6, -8.5], height: 6.0, radiusKm: 3.8 },
      { id: 'wenshan', at: [-0.5, -6.5], height: 5.5, radiusKm: 3.6 },
      { id: 'southwest-hills', at: [-3.5, -6], height: 4.5, radiusKm: 3.2 },
      // The hero climb: a steep giant (summit ~12.7, ≈45% of 101's roof, like
      // the real 183 m vs 508 m). The ~600-step trail (trails below) switchbacks
      // up its city-facing north face.
      { id: 'elephant-mountain', at: [1.114, -0.792], height: 12.0, radiusKm: 1.0 },
      // …and the massif keeps going south-east, as on the map: Thumb Lookout
      // Mountain (拇指山, the real 320 m — taller than Xiangshan itself) behind
      // it, with the Lion/Leopard heads and Tiger Mountain (虎山) closing the
      // Four Beasts ridge toward Fude St. Scenery only — no trail climbs these.
      // (Phase 2: whole ensemble translated rigidly onto the true 象山 peak;
      // tiger snapped to its own geo-truth peak, which really is that close
      // to the Songshan streets.)
      { id: 'thumb-mountain', at: [1.764, -1.542], height: 14.0, radiusKm: 1.1 },
      { id: 'lion-leopard-ridge', at: [2.264, -1.042], height: 9.0, radiusKm: 0.8 },
      { id: 'tiger-mountain', at: [1.927, -0.265], height: 7.0, radiusKm: 0.65 },

      // Four Beasts foothills beyond, Nangang, Neihu, and Guanyinshan
      { id: 'four-beasts', at: [4.814, -1.692], height: 3.8, radiusKm: 2.8 },
      { id: 'nangang-hills', at: [7.5, -0.5], height: 3.4, radiusKm: 3.0 },
      { id: 'neihu-north', at: [3.5, 7.5], height: 3.2, radiusKm: 2.8 },
      { id: 'neihu-east', at: [5.5, 5.5], height: 2.8, radiusKm: 2.4 },
      { id: 'guanyinshan', at: [-10.4, 8.45], height: 5.5, radiusKm: 3.4 },
      { id: 'linkou', at: [-13, -1], height: 4.0, radiusKm: 4.0 },

      // Greater Taipei outer range
      { id: 'xueshan-west', at: [10, 0], height: 6.5, radiusKm: 4.5 },
      { id: 'xueshan-north', at: [12.5, 3.5], height: 6.0, radiusKm: 4.0 },
      { id: 'xueshan-south', at: [9.5, -4], height: 6.0, radiusKm: 4.0 },
      { id: 'shiding', at: [12, -3], height: 5.5, radiusKm: 3.6 },
      { id: 'wulai', at: [0, -12], height: 9.0, radiusKm: 5.5 },
      { id: 'wulai-east', at: [3.5, -13.5], height: 8.0, radiusKm: 4.6 },
      { id: 'wulai-west', at: [-3, -13], height: 7.5, radiusKm: 4.6 },
      { id: 'deep-xindian', at: [6, -11], height: 6.5, radiusKm: 4.0 },
      { id: 'tucheng', at: [-11, -8], height: 6.0, radiusKm: 4.2 },
      { id: 'sanxia', at: [-14, -5], height: 5.5, radiusKm: 4.0 },
      { id: 'tucheng-south', at: [-9.5, -10.5], height: 5.5, radiusKm: 3.8 },
      { id: 'wugu-west', at: [-15.5, 1.5], height: 5.0, radiusKm: 4.5 },
      { id: 'wugu-north', at: [-14, 4.5], height: 4.5, radiusKm: 4.0 },
      { id: 'datun-far-north', at: [-3.0, 15.28], height: 8.0, radiusKm: 5.0 },
      { id: 'north-coast-east', at: [0.13, 14.97], height: 7.0, radiusKm: 4.2 },
      { id: 'north-coast-west', at: [-7.0, 13.28], height: 6.0, radiusKm: 4.0 },
    ],

    gradedSites: [
      { id: 'palace-museum-site', at: [-1.585, 7.506], innerKm: 0.72, outerKm: 1.18, height: 3.15 },
      { id: 'shilin-market-site', at: [-3.985, 6.031], innerKm: 0.52, outerKm: 0.92, height: 1.45 },
      // Terraces on Elephant Mountain's climb (trails below). The deck and the
      // low landing sit exactly on switchback hairpins — the flat disc turns
      // the sharp bend into a rest platform; heights match the natural slope
      // at each spot so they read as ledges, not carved pits. Keep the deck
      // disc small: the next flight passes ~1u away and a wider blend would
      // warp its stairs.
      { id: 'xiangshan-landing-site', at: [0.98, -0.462], innerKm: 0.05, outerKm: 0.14, height: 5.5 },
      { id: 'xiangshan-deck-site', at: [1.352, -0.73], innerKm: 0.14, outerKm: 0.20, height: 8.6 },
      { id: 'xiangshan-summit-site', at: [1.124, -0.802], innerKm: 0.20, outerKm: 0.34, height: 12.7 },
    ],

    // NOTE — since the Phase 2 normalization the Xinyi core is authored in
    // true real km like everything else; the rendered enlargement it used to
    // carry in its data now lives in planet.spread.boost above.

    // River centrelines from geo-truth (OSM waterway ways, clipped to the
    // basin, widths near real: Tamsui ~0.6 km, the others ~0.45 km wide
    // rendered). The Tamsui hugs x≈-6 through Datong (the old hand path ran
    // ~1.7 km too far west) and the Keelung enters from the EAST at y≈+2 —
    // its old start south of Nangang was a genuine topology error.
    waterways: [
      { id: 'tamsui-river', name: 'Tamsui River', halfWidthKm: 0.30, path: [[-7.656, 1.176], [-5.991, 2.588], [-5.756, 4.003], [-6.081, 5.408], [-7.734, 7.042], [-10.363, 8.022], [-10.8, 10.0]] },
      { id: 'xindian-river', name: 'Xindian River', halfWidthKm: 0.22, path: [[-3.3, -9.8], [-4.434, -5.81], [-3.114, -3.272], [-5.051, -1.345], [-7.35, -2.507], [-7.656, 1.176]] },
      { id: 'keelung-river', name: 'Keelung River', halfWidthKm: 0.22, path: [[7.8, 3.69], [0.978, 1.997], [0.524, 4.645], [-3.85, 4.322], [-7.2, 8.855], [-10.5, 8.75]] },
    ],
  },

  spaces: {
    parks: [
      { id: 'daan-forest-park', name: "Da'an Forest Park", at: [-2.953, -0.446], radiusKm: 1.15 },
      { id: 'yuanshan-park', name: 'Yuanshan Park', at: [-3.85, 4.88], radiusKm: 0.7 },
      // Zhongshan Park — the green block around Sun Yat-sen Memorial Hall,
      // bounded by Zhongxiao E Rd (N), Ren'ai Rd (S) and Guangfu S Rd (W).
      { id: 'zhongshan-park', name: 'Zhongshan Park', at: [-0.42, 0.70], radiusKm: 0.4 },
      // City Hall front plaza lawn, west of Taipei City Hall on the Ren'ai axis.
      { id: 'xinyi-green', name: 'Citizen Plaza', at: [-0.24, 0.42], radiusKm: 0.3 },
      { id: 'peace-park', name: '228 Peace Memorial Park', at: [-4.97, 0.869], radiusKm: 0.5 },
      // Covers the whole Xiangshan face (the real slopes are the 樹蛙保育區
      // ecological zone): keeps procedural blocks off the mountain and lets the
      // hillside-forest scatter reach the lower slopes around the trail.
      { id: 'elephant-mountain-park', name: 'Elephant Mountain Trailhead', at: [1.064, -0.742], radiusKm: 1.25 },
      // Greens the rest of the Four Beasts massif (Thumb Lookout / Lion /
      // Leopard / Tiger) and keeps procedural blocks off its lower aprons.
      { id: 'four-beasts-ridge-park', name: 'Four Beasts Ridge', at: [2.114, -1.142], radiusKm: 1.35 },
      { id: 'dadaocheng-riverside', name: 'Dadaocheng Riverside Park', at: [-5.95, 2.6], radiusKm: 0.85 },
      { id: 'wanhua-riverside', name: 'Wanhua Riverside Park', at: [-7.4, 0.6], radiusKm: 0.85 },
      { id: 'dajia-riverside', name: 'Dajia Riverside Park', at: [-2.5, 4.15], radiusKm: 0.9 },
      { id: 'meiti-riverside', name: 'Meiti Riverside Park', at: [-0.9, 4.3], radiusKm: 0.8 },
      { id: 'youth-park', name: 'Youth Park', at: [-6.19, -1.29], radiusKm: 0.55 },
      { id: 'guting-riverside', name: 'Guting Riverside Park', at: [-4.9, -1.7], radiusKm: 0.5 },
    ],
    ponds: [
      { id: 'daan-pond', at: [-2.95, -0.6], radius: 1.0 },
      // At the mountain's north foot beside the trailhead approach — not on
      // the summit slope, where a flat water disc reads as a floating saucer.
      { id: 'elephant-mountain-pond', at: [1.36, -0.45], radius: 0.5 },
      { id: 'zhongshan-pond', at: [-0.54, 0.52], radius: 0.5 },   // 翠湖, SW corner of Zhongshan Park
    ],
  },

  districts: [
    { id: 'xinyi', at: [0.3, 0.2], radiusKm: 3.0, density: 1.00 },
    { id: 'daan', at: [-2.2, -0.6], radiusKm: 3.0, density: 0.82 },
    { id: 'zhongzheng', at: [-5.0, 0.9], radiusKm: 2.9, density: 0.95 },
    { id: 'wanhua', at: [-6.7, 0.2], radiusKm: 2.3, density: 0.88 },
    { id: 'zhongshan', at: [-3.7, 2.6], radiusKm: 2.5, density: 0.78 },
    { id: 'datong', at: [-5.2, 3.2], radiusKm: 2.1, density: 0.72 },
    { id: 'songshan', at: [1.8, 2.0], radiusKm: 2.5, density: 0.78 },
    { id: 'shilin', at: [-3.6, 6.0], radiusKm: 2.1, density: 0.66 },
    { id: 'neihu', at: [3.8, 4.2], radiusKm: 2.1, density: 0.55 },
    { id: 'nangang', at: [5.5, 0.5], radiusKm: 2.2, density: 0.50 },
    { id: 'gongguan-guting', at: [-5.2, -2.6], radiusKm: 2.0, density: 0.66 },
    { id: 'sanchong', at: [-7.8, 3.1], radiusKm: 2.6, density: 0.74 },
    { id: 'luzhou', at: [-9.2, 5.6], radiusKm: 2.4, density: 0.66 },
    { id: 'xinzhuang', at: [-10.3, 0.24], radiusKm: 2.2, density: 0.70 },
    { id: 'banqiao', at: [-9.6, -2.45], radiusKm: 2.4, density: 0.80 },
    { id: 'zhonghe', at: [-6.6, -3.8], radiusKm: 2.6, density: 0.74 },
    { id: 'yonghe', at: [-5.0, -2.7], radiusKm: 2.0, density: 0.70 },
    { id: 'tucheng-sanxia', at: [-9.4, -4.9], radiusKm: 2.0, density: 0.58 },
    { id: 'xindian', at: [-2.3, -7.2], radiusKm: 2.8, density: 0.66 },
    { id: 'xizhi', at: [7.8, 3.2], radiusKm: 2.4, density: 0.55 },
    { id: 'beitou', at: [-5.4, 8.7], radiusKm: 2.0, density: 0.58 },
    { id: 'tianmu', at: [-3.9, 8.2], radiusKm: 2.0, density: 0.55 },
  ],

  roads: [
    // Zhongxiao E Rd — through Xinyi it runs along the south face of the Taipei
    // Dome block and north of City Hall (Taipei City Hall MRT station sits on it).
    { id: 'zhongxiao', name: 'Zhongxiao Road', widthKm: 0.34, path: [[-5.765, 1.658], [-2.954, 0.913], [0.754, 0.748], [1.393, 0.815], [1.965, 1.464], [2.355, 1.691], [3.135, 1.886], [5.173, 2.147]] },
    // Ren'ai Rd Sec 4 — dead-straight east–west axis along the south edge of
    // Zhongshan Park, ending at the Taipei City Hall front plaza (the real road
    // terminates there). Points [2] and [3] are the spawn + camera heading.
    { id: 'renai', name: "Ren'ai Boulevard", widthKm: 0.28, path: [[-4.64, 0.61], [-2.5, 0.53], [-0.95, 0.45], [-0.5, 0.435], [-0.22, 0.427]] },
    // Xinyi Rd Sec 5 — passes just south of the Taipei 101 block; the red MRT
    // line and the Taipei 101/World Trade Center station follow it.
    { id: 'xinyi-road', name: 'Xinyi Road', widthKm: 0.24, path: [[-4.659, 0.522], [-3.824, 0.074], [-3.704, 0.034], [-3.466, 0.001], [0.706, -0.101], [0.915, -0.067], [1.069, 0.03], [1.322, 0.23]] },
    // Heping E Rd stops well west of the Four Beasts massif — its old stub to
    // [2.0, -2.1] would now climb Thumb Lookout Mountain's slope.
    { id: 'heping', name: 'Heping Road', widthKm: 0.22, path: [[-7.462, 0.203], [-6.151, 0.135], [-5.503, -0.395], [-4.571, -0.796], [-2.31, -0.869], [-1.376, -1.021], [-0.839, -1.411], [-0.214, -2.161]] },
    { id: 'nanjing', name: 'Nanjing Road', widthKm: 0.26, path: [[-5.507, 2.186], [-5.328, 2.23], [-5.107, 2.249], [-4.962, 2.23], [-4.352, 2.074], [-3.954, 2.037], [0.56, 1.946], [1.641, 2.544]] },
    // Bade Rd — bows north around the Taipei Dome block (Civic Blvd corridor).
    { id: 'bade', name: 'Bade Road', widthKm: 0.22, path: [[-3.488, 1.099], [-3.076, 1.219], [-2.715, 1.385], [-1.873, 1.588], [-0.65, 1.605], [0.726, 1.792], [1.358, 1.81], [1.768, 1.947]] },
    { id: 'zhongshan', name: 'Zhongshan Road', widthKm: 0.30, path: [[-4.822, 0.161], [-4.246, 1.996], [-4.25, 3.612], [-3.884, 4.551], [-4.047, 5.184], [-3.677, 6.788], [-3.934, 8.46], [-3.237, 9.963]] },
    { id: 'dunhua', name: 'Dunhua Road', widthKm: 0.28, path: [[-1.591, -1.378], [-1.583, -0.529], [-1.516, -0.323], [-1.582, -0.067], [-1.565, 0.701], [-1.567, 2.583], [-1.549, 2.691], [-1.453, 2.957]] },
    { id: 'fuxing', name: 'Fuxing Road', widthKm: 0.22, path: [[-2.133, -1.331], [-2.116, -0.557], [-2.179, -0.306], [-2.108, -0.065], [-2.105, 0.099], [-2.129, 0.263], [-2.098, 0.472], [-2.047, 2.881]] },
    { id: 'zhonghua', name: 'Zhonghua Road', widthKm: 0.22, path: [[-5.546, -0.954], [-5.858, -0.691], [-6.061, -0.434], [-6.074, -0.254], [-5.9, 0.127], [-5.824, 0.35], [-5.518, 1.51]] },
    // Keelung Rd — the NE–SW diagonal: crosses Zhongxiao at Taipei City Hall
    // station, skirts west of City Hall / Grand Hyatt / the 101 block, and meets
    // Xinyi Rd at the Taipei 101/World Trade Center station.
    { id: 'keelung-road', name: 'Keelung Road', widthKm: 0.26, path: [[-3.155, -2.71], [-2.946, -2.564], [-2.561, -2.384], [-2.237, -2.149], [-2.185, -1.964], [-0.832, -0.668], [-0.089, 0.635], [0.57, 1.885]] },
    { id: 'roosevelt', name: 'Roosevelt Road', widthKm: 0.22, path: [[-4.767, 0.049], [-3.955, -1.15], [-2.934, -2.208], [-2.723, -2.525], [-2.529, -3.635], [-2.58, -3.84], [-2.361, -4.198], [-2.458, -4.699]] },
    // Guangfu S Rd — western boundary of the district, along the Dome block and
    // Zhongshan Park.
    { id: 'guangfu-south', name: 'Guangfu S Road', widthKm: 0.2, path: [[-0.999, 3.119], [-0.895, 2.485], [-0.849, 2.299], [-0.762, 2.097], [-0.678, 1.934], [-0.678, 1.108], [-0.71, -0.119], [-0.707, -0.411]] },
    // Songren Rd — eastern boundary, past City Hall and Breeze Nan Shan.
    { id: 'songren', name: 'Songren Road', widthKm: 0.18, path: [[0.402, 0.771], [0.396, 0.587], [0.393, 0.32], [0.384, -0.206], [0.389, -0.424], [0.388, -0.61], [0.4, -0.794], [0.512, -1.014]] },
    // Songshou Rd — between the Grand Hyatt and the Taipei 101 block.
    { id: 'songshou', name: 'Songshou Road', widthKm: 0.16, path: [[-0.256, 0.247], [-0.106, 0.244], [0.12, 0.24], [0.333, 0.236]] },

    // ---- Phase 3: full arterial grid (paths from geo-truth; 2-4 per district).
    // wenlin came back as a 0.2 km stub from OSM - skipped; Shilin has
    // zhongshan + chengde + shipai through it already.
    { id: 'civic-blvd', name: 'Civic Boulevard', widthKm: 0.3, path: [[-6.023, 1.724], [-5.624, 1.859], [-3.004, 1.246], [-1.194, 1.183], [-0.401, 1.356], [0.015, 1.342], [0.633, 1.721], [1.237, 1.717]] },
    { id: 'minquan', name: 'Minquan Road', widthKm: 0.26, path: [[-5.319, 3.232], [-2.273, 3.172], [-1.34, 3.081], [0.198, 3.276], [2.202, 3.9], [3.057, 3.868], [3.413, 3.706], [3.649, 3.693]] },
    { id: 'minsheng', name: 'Minsheng Road', widthKm: 0.22, path: [[-5.496, 2.566], [-4.93, 2.577], [-4.117, 2.688], [-3.878, 2.692], [-2.746, 2.676], [-1.624, 2.651], [-1.025, 2.71], [0.37, 2.822]] },
    { id: 'xinsheng', name: 'Xinsheng Road', widthKm: 0.26, path: [[-3.69, 4.089], [-3.723, 2.165], [-3.627, 1.777], [-3.513, 1.611], [-3.19, 1.282], [-3.206, 0.012], [-2.99, -0.744], [-3.086, -1.543]] },
    { id: 'jianguo', name: 'Jianguo Road', widthKm: 0.26, path: [[-3.069, 3.732], [-2.848, 3.522], [-2.773, 3.343], [-2.809, 1.119], [-2.68, 0.495], [-2.691, -0.079], [-2.669, -0.285], [-2.712, -1.131]] },
    { id: 'chengde', name: 'Chengde Road', widthKm: 0.24, path: [[-6.482, 9.621], [-5.401, 8.525], [-5.243, 7.33], [-4.881, 6.378], [-4.381, 6.118], [-4.155, 5.733], [-4.623, 4.23], [-4.827, 1.745]] },
    { id: 'shipai', name: 'Shipai Road', widthKm: 0.2, path: [[-5.515, 8.743], [-4.974, 9.03], [-4.869, 9.186], [-4.755, 9.319], [-4.527, 9.402], [-4.314, 9.451], [-4.107, 9.766], [-3.931, 9.941]] },
    { id: 'zhongcheng', name: 'Zhongcheng Road', widthKm: 0.18, path: [[-3.872, 7.798], [-3.606, 7.931], [-3.485, 8.116], [-3.368, 8.706], [-3.253, 8.898], [-3.15, 9.031], [-3.028, 9.258]] },
    { id: 'neihu-road', name: 'Neihu Road', widthKm: 0.22, path: [[-0.522, 5.66], [1.452, 4.978], [1.667, 5.321], [1.843, 5.226], [2.038, 5.477], [2.456, 5.304], [2.845, 5.652]] },
    { id: 'chenggong-road', name: 'Chenggong Road', widthKm: 0.2, path: [[2.689, 3.054], [2.558, 5.073], [3.186, 4.955], [3.559, 4.955], [3.537, 5.229], [3.787, 5.3], [3.974, 5.458]] },
    { id: 'nangang-road', name: 'Nangang Road', widthKm: 0.24, path: [[1.948, 2.032], [2.143, 2.116], [2.536, 2.169], [2.939, 2.297], [3.747, 2.187], [4.813, 2.388], [5.541, 2.333]] },
    { id: 'academia-road', name: 'Academia Road', widthKm: 0.18, path: [[5.239, 1.071], [5.146, 1.265], [5.14, 1.475], [5.177, 1.672], [5.16, 1.873], [5.216, 2.103], [5.248, 2.311]] },
    { id: 'chongxin', name: 'Chongxin Road', widthKm: 0.24, path: [[-9.911, 0.933], [-9.586, 1.311], [-8.852, 1.582], [-7.886, 2.42], [-7.798, 2.561], [-7.254, 2.982], [-6.289, 3.324]] },
    { id: 'wenhua-banqiao', name: 'Wenhua Road', widthKm: 0.24, path: [[-10.745, -2.597], [-10.5, -2.297], [-9.906, -1.486], [-9.703, -1.131], [-9.436, -0.611], [-9.301, -0.424], [-8.795, 0.184], [-8.575, 0.256]] },
    { id: 'beixin', name: 'Beixin Road', widthKm: 0.24, path: [[-2.659, -8.219], [-2.347, -7.384], [-2.221, -6.981], [-2.182, -6.827], [-2.176, -6.442], [-2.183, -6.267], [-2.377, -5.442]] },
    { id: 'yonghe-road', name: 'Yonghe Road', widthKm: 0.2, path: [[-6.523, -3.389], [-5.24, -3.244], [-5.194, -3.1], [-5.143, -2.909], [-5.059, -2.668], [-5.017, -2.502], [-4.956, -2.275], [-4.899, -2.045]] },
    { id: 'jingping', name: 'Jingping Road', widthKm: 0.2, path: [[-6.848, -3.381], [-6.799, -3.619], [-6.607, -3.817], [-6.375, -4.199], [-6.173, -4.411], [-4.614, -4.636], [-4.263, -4.756], [-3.834, -4.821]] },
    { id: 'datong-xizhi', name: 'Datong Road', widthKm: 0.24, path: [[5.773, 2.346], [6.496, 2.248], [7.01, 2.62], [9.575, 3.729], [10.05, 4.098], [10.255, 4.646], [10.578, 4.85]] },
    { id: 'sanmin-luzhou', name: 'Sanmin Road', widthKm: 0.2, path: [[-10.419, 6.611], [-10.249, 6.439], [-10.085, 6.35], [-9.86, 6.272], [-9.699, 6.17], [-9.218, 5.745], [-9.046, 5.583], [-8.948, 5.385]] },
    { id: 'zhongzheng-xinzhuang', name: 'Zhongzheng Road', widthKm: 0.24, path: [[-15.533, -1.396], [-14.962, -1.044], [-14.658, -0.648], [-13.165, -0.136], [-11.528, 0.214], [-10.963, 0.09], [-10.598, 0.509]] },
    { id: 'zhongyang-tucheng', name: 'Zhongyang Road', widthKm: 0.22, path: [[-14.732, -8.241], [-14.371, -7.975], [-13.796, -7.698], [-13.064, -7.489], [-12.756, -7.237], [-12.384, -6.536], [-12.12, -5.453], [-11.606, -4.558]] },
  ],

  // River crossings, rendered as arched decks (deck over water) by main.js.
  // Paths from geo-truth bridge ways; cross-river districts visibly connect.
  bridges: [
    { id: 'taipei-bridge', name: 'Taipei Bridge', widthKm: 0.24, path: [[-6.217, 3.348], [-5.857, 3.311]] },
    { id: 'zhongxiao-bridge', name: 'Zhongxiao Bridge', widthKm: 0.26, path: [[-6.11, 1.83], [-6.17, 1.866], [-6.233, 1.905], [-6.831, 2.27]] },
    { id: 'dazhi-bridge', name: 'Dazhi Bridge', widthKm: 0.22, path: [[-2.031, 5.039], [-2.041, 4.571], [-2.04, 4.511], [-2.043, 4.347]] },
    { id: 'minquan-bridge', name: 'Minquan Bridge', widthKm: 0.22, path: [[0.669, 3.397], [1.055, 3.539], [1.154, 3.572], [1.31, 3.618]] },
  ],

  // Songshan Airport: the runway void is one of the real map's most
  // recognizable features. main.js renders the strip and keeps blocks off it.
  airfield: { runway: { id: 'songshan-runway', widthKm: 0.09, path: [[0.089, 3.919], [-1.079, 3.965], [-1.547, 3.982], [-2.508, 4.02]] } },

  transit: {
    metroLines: [
      // Red line follows Xinyi Rd through the district (Taipei 101/WTC station),
      // then bends south-east toward Xiangshan.
      { id: 'red', name: 'Tamsui–Xinyi Line', color: '#E3002C', path: [[-4, 6.2], [-4.5, 4], [-4.8, 2], [-4.5, 0.3], [-3, -0.15], [-1.6, -0.05], [-0.5, -0.07], [0.55, -0.10], [0.75, -0.16]] },
      // Blue line rides Zhongxiao E Rd (Taipei City Hall station at the Keelung
      // Rd crossing) before heading on toward Nangang.
      { id: 'blue', name: 'Bannan Line', color: '#0070BD', path: [[-6.6, 0.85], [-4.8, 1.0], [-2.8, 0.9], [-1.7, 0.82], [0.75, 0.75], [2.0, 1.5], [5.2, 2.15]] },
      { id: 'green', name: 'Songshan–Xindian Line', color: '#1DA742', path: [[-4.6, -4], [-4.3, -1], [-4.6, 0.4], [-3.4, 1.3], [-1, 1.95], [1.07, 1.88]] },
      { id: 'orange', name: 'Zhonghe–Xinlu Line', color: '#F8B61C', path: [[-3, -4], [-2.5, -1.2], [-2.8, 1], [-4, 3], [-5.6, 2.4]] },
      { id: 'brown', name: 'Wenhu Line', color: '#C48C31', path: [[1.2, -4.2], [-0.8, -1.3], [-2.1, 0.9], [-2.0, 2.5], [-0.9, 4], [-0.7, 5.5]] },
    ],
    gondola: { from: [1.2, -4.2], to: [2.7, -7.8], pylons: 11, cabins: 5 },
  },

  // Hiking trails the runtime drapes over the terrain as stone steps with
  // handrails. First path point = street-level trailhead, last = the summit
  // goal; `deckAt` names the mid-trail path point where the flight pauses at a
  // rest platform. Points are real km, like roads; the player climbs by simply
  // walking the mountainside underneath.
  trails: [
    // Xiangshan (Elephant Mountain) trail — from the lane SE of the Xinyi Rd
    // end (by Xiangshan MRT, as on the real map), then ~600 stone steps like
    // the real climb. As on the real mountain the stairs never circle the
    // peak: they switchback up the city-facing north face (a constant-grade
    // ladder bounced between two bearings, hairpins on the flanks), pausing
    // at the wooden photographers' deck about two-thirds up (deckAt — the
    // real deck is at ~120 m of 183 m), and topping out on the summit crown
    // with the full Taipei 101 panorama behind you the whole way up.
    { id: 'xiangshan-trail', name: 'Xiangshan Trail',
      deckAt: [1.352, -0.730],
      path: [[1.694, -0.212], [1.659, -0.248], [1.623, -0.286], [1.588, -0.322], [1.553, -0.358], [1.514, -0.392],
             [1.465, -0.395], [1.415, -0.390], [1.365, -0.384], [1.315, -0.379], [1.263, -0.377], [1.211, -0.380],
             [1.159, -0.387], [1.108, -0.399], [1.058, -0.417], [1.012, -0.441], [0.993, -0.460], [1.043, -0.458],
             [1.092, -0.463], [1.143, -0.475], [1.192, -0.495], [1.234, -0.521], [1.274, -0.555], [1.305, -0.594],
             [1.330, -0.638], [1.346, -0.688], [1.352, -0.730], [1.319, -0.680], [1.281, -0.644], [1.236, -0.617],
             [1.186, -0.603], [1.136, -0.601], [1.085, -0.613], [1.055, -0.632], [1.105, -0.631], [1.156, -0.642],
             [1.182, -0.676], [1.162, -0.722], [1.139, -0.769], [1.132, -0.785]] },
  ],

  landmarks: [
    { id: 'taipei-101', name: 'Taipei 101', builder: 'buildTaipei101', at: [0.0, 0.0], placement: { scale: 1.15, foot: 7.2, cols: [
      {x:-4.42,z:-2.6,r:.42},{x:-4.42,z:-1.3,r:.42},{x:-4.42,z:0,r:.42},{x:-4.42,z:1.3,r:.42},{x:-4.42,z:2.6,r:.42},
      {x:4.42,z:-2.6,r:.42},{x:4.42,z:-1.3,r:.42},{x:4.42,z:0,r:.42},{x:4.42,z:1.3,r:.42},{x:4.42,z:2.6,r:.42},
      {x:-3.6,z:-3.42,r:.42},{x:-2.4,z:-3.42,r:.42},{x:-1.2,z:-3.42,r:.42},{x:0,z:-3.42,r:.42},{x:1.2,z:-3.42,r:.42},{x:2.4,z:-3.42,r:.42},{x:3.6,z:-3.42,r:.42},
      {x:-3.15,z:3.42,r:1.3},{x:3.15,z:3.42,r:1.3},{x:-1.68,z:3.44,r:.15},{x:1.68,z:3.44,r:.15},{x:0,z:-2.10,r:1.2},{x:0,z:-.72,r:.65}
    ], claim: 4.8, extra: -0.08, labelY: 35, pin: true, base: '#d6d0c2' } },
    // City Hall faces west onto the Citizen Plaza where the Ren'ai axis ends.
    // Open civic lobby: colliders hug the walls, the centre door stays clear.
    { id: 'city-hall', name: 'Taipei City Hall', builder: 'buildCityHall', at: [-0.003, 0.422], placement: { scale: 1.3, foot: 4.7, face: 90, cols: [{x:-2.5,z:0,r:2.1},{x:2.5,z:0,r:2.1},{x:0,z:-0.85,r:0.9},{x:-1.05,z:0.6,r:0.45},{x:1.05,z:0.6,r:0.45}], claim: 2.9, extra: -0.10, labelY: 7.2, base: '#cfcabe' } },
    // SYS Memorial Hall sits in Zhongshan Park; its gated plaza opens south to
    // Ren'ai Rd and the memorial chamber (statue inside) is walkable — the
    // collider circles trace the shell walls and gate piers, not the doorway.
    { id: 'sun-yat-sen-hall', name: 'Sun Yat-sen Hall', builder: 'buildSYSHall', at: [-0.424, 0.698], placement: { foot: 4.2, cols: [
      {x:-1.72,z:-0.8,r:.85},{x:-1.72,z:0.6,r:.85},{x:1.72,z:-0.8,r:.85},{x:1.72,z:0.6,r:.85},
      {x:-1.0,z:-1.75,r:.85},{x:0.9,z:-1.75,r:.85},{x:-1.42,z:1.75,r:.6},{x:1.42,z:1.75,r:.6},
      {x:0,z:-1.15,r:.6},{x:-2.35,z:5.0,r:0.42},{x:2.35,z:5.0,r:0.42}
    ], claim: 2.4, extra: -0.15, labelY: 5, base: '#d8d2c4' } },
    // Taipei Dome — grey saucer over a glazed arcade north of Zhongxiao E Rd.
    // The arcade opening faces the road; inside is the walkable ballpark, so
    // the colliders ring the drum and leave the entrance arc open.
    { id: 'taipei-dome', name: 'Taipei Dome', builder: 'buildTaipeiDome', at: [-0.496, 0.961], placement: { foot: 5.2, cols: [
      {x:2.55,z:2.62,r:1.05},{x:3.68,z:1.28,r:1.05},{x:3.95,z:-0.36,r:1.05},{x:3.29,z:-1.91,r:1.05},
      {x:1.86,z:-3.02,r:1.05},{x:0,z:-3.42,r:1.05},{x:-1.86,z:-3.02,r:1.05},{x:-3.29,z:-1.91,r:1.05},
      {x:-3.95,z:-0.36,r:1.05},{x:-3.68,z:1.28,r:1.05},{x:-2.55,z:2.62,r:1.05}
    ], claim: 3.4, extra: -0.10, labelY: 5.6, base: '#cfd0d4' } },
    // Grand Hyatt — cream stepped slab hotel north of Songshou Rd; the
    // porte-cochère leads into an open lobby.
    { id: 'grand-hyatt', name: 'Grand Hyatt Taipei', builder: 'buildGrandHyatt', at: [-0.114, 0.17], placement: { foot: 2.9, cols: [{x:-1.95,z:0,r:0.95},{x:1.95,z:0,r:0.95},{x:0,z:-1.15,r:0.8},{x:-0.5,z:-0.55,r:0.4},{x:-0.85,z:1.05,r:0.45},{x:0.85,z:1.05,r:0.45}], claim: 2.2, extra: -0.10, labelY: 5.6, base: '#d8d2c4' } },
    // Breeze Nan Shan tower — the tall rounded glass high-rise east of 101;
    // the podium atrium is walkable, entrance facing west toward the tower.
    { id: 'breeze-nanshan', name: 'Breeze Nan Shan', builder: 'buildBreezeNanShan', at: [0.181, 0.076], placement: { foot: 2.6, face: 90, cols: [{x:-1.3,z:-0.4,r:.75},{x:1.3,z:-0.4,r:.75},{x:0,z:-1.05,r:.8},{x:0,z:-0.35,r:.4},{x:-1.15,z:0.95,r:.4},{x:1.15,z:0.95,r:.4}], claim: 2.0, extra: -0.10, labelY: 13.5, base: '#cfcdc4' } },
    // Shin Kong Mitsukoshi Xinyi Place A11 — boxy department store with the big
    // LED billboard face; ground-floor shop hall is walkable.
    { id: 'mitsukoshi-a11', name: 'Mitsukoshi A11', builder: 'buildMitsukoshiA11', at: [0.277, 0.322], placement: { foot: 2.4, cols: [{x:-1.5,z:-0.4,r:.8},{x:1.5,z:-0.4,r:.8},{x:0,z:-1.15,r:.9},{x:-1.25,z:1.1,r:.45},{x:1.25,z:1.1,r:.45}], claim: 1.9, extra: -0.08, labelY: 4.6, base: '#cfcabe' } },
    { id: 'taipei-arena', name: 'Taipei Arena', builder: 'buildArena', at: [-1.45, 1.882], placement: { scale: 1.6, foot: 4.8, ar: 4.0, claim: 2.6, extra: -0.10, labelY: 6.1, base: '#cdc8bc' } },
    { id: 'raohe-night-market', name: 'Raohe Night Market', builder: 'buildNightMarket', at: [1.066, 1.878], placement: { foot: 6.6, cols: [
      {x:-1.5,z:3,r:.52},{x:-1.5,z:1.8,r:.52},{x:-1.5,z:.6,r:.52},{x:-1.5,z:-.6,r:.52},{x:-1.5,z:-1.8,r:.52},{x:-1.5,z:-3,r:.52},
      {x:1.5,z:3,r:.52},{x:1.5,z:1.8,r:.52},{x:1.5,z:.6,r:.52},{x:1.5,z:-.6,r:.52},{x:1.5,z:-1.8,r:.52},{x:1.5,z:-3,r:.52},
      {x:-1.55,z:4.35,r:.3},{x:1.55,z:4.35,r:.3},{x:-1.55,z:4.9,r:.28},{x:1.55,z:4.9,r:.28},{x:-1.12,z:-4.35,r:.24},{x:1.12,z:-4.35,r:.24},{x:4.1,z:-2.35,r:1.55}
    ], claim: 3.2, extra: -0.05, labelY: 4, face: 90, base: '#34343c' } },
    { id: 'cks-memorial', name: 'CKS Memorial Hall', builder: 'buildCKSComplex', at: [-4.305, 0.104], placement: { foot: 9.2, scale: 0.95, cols: [
      {x:-2.14,z:-6.2,r:.5},{x:-2.14,z:-5,r:.5},{x:-2.14,z:-3.8,r:.5},{x:2.14,z:-6.2,r:.5},{x:2.14,z:-5,r:.5},{x:2.14,z:-3.8,r:.5},
      {x:-1.6,z:-7.14,r:.5},{x:-.5,z:-7.14,r:.5},{x:.5,z:-7.14,r:.5},{x:1.6,z:-7.14,r:.5},{x:-1.5,z:-2.86,r:.7},{x:1.5,z:-2.86,r:.7},
      {x:0,z:-6.55,r:.8},
      {x:-6,z:0,r:1.8},{x:6,z:0,r:1.8},{x:-3.7,z:6,r:.34},{x:-2.25,z:6,r:.34},{x:-1.18,z:6,r:.28},{x:1.18,z:6,r:.28},{x:2.25,z:6,r:.34},{x:3.7,z:6,r:.34}
    ], claim: 5.0, extra: -0.12, labelY: 10, face: -90, base: '#e7e2d5' } },
    { id: 'presidential-office', name: 'Presidential Office', builder: 'buildPresidentialOffice', at: [-5.298, 0.696], placement: { foot: 4.6, cols: [{x:-3,z:0,r:2.1},{x:0,z:0,r:2.1},{x:3,z:0,r:2.1}], claim: 2.4, extra: -0.15, labelY: 7.5, face: -90, base: '#d8d2c4' } },
    // Walk-in concourse: cols trace the shell walls; all four door gaps open.
    { id: 'main-station', name: 'Taipei Main Station', builder: 'buildMainStation', at: [-4.779, 1.55], placement: { foot: 4.0, cols: [
      {x:-1.9,z:2.5,r:.6},{x:1.9,z:2.5,r:.6},{x:-1.9,z:-2.5,r:.6},{x:1.9,z:-2.5,r:.6},
      {x:-2.89,z:1.6,r:.55},{x:-2.89,z:-1.6,r:.55},{x:2.89,z:1.6,r:.55},{x:2.89,z:-1.6,r:.55},
      {x:-2.75,z:2.35,r:.5},{x:2.75,z:2.35,r:.5},{x:-2.75,z:-2.35,r:.5},{x:2.75,z:-2.35,r:.5}
    ], claim: 2.4, extra: -0.15, labelY: 6, base: '#cfcabe' } },
    { id: 'longshan-temple', name: 'Longshan Temple', builder: 'buildLongshanTemple', at: [-6.518, 0.395], placement: { scale: 1.1, foot: 4.0, cols: [{x:0,z:2.2,r:2.3},{x:0,z:0,r:2.2},{x:0,z:-2.3,r:2.2},{x:-2.7,z:1.65,r:1.0},{x:-2.7,z:-1.65,r:1.0},{x:2.7,z:1.65,r:1.0},{x:2.7,z:-1.65,r:1.0}], claim: 2.0, extra: -0.10, labelY: 5.1, base: '#cdbfa1' } },
    { id: 'baoan-temple', name: 'Bao’an Temple', builder: 'buildBaoanTemple', at: [-4.937, 4.356], placement: { foot: 2.6, cols: [{x:0,z:1.35,r:1.5},{x:0,z:-0.55,r:1.8}], claim: 1.7, extra: -0.10, labelY: 4, base: '#cdbfa1' } },
    { id: 'grand-hotel', name: 'Grand Hotel', builder: 'buildGrandHotel', at: [-3.844, 4.979], placement: { scale: 1.35, foot: 7.3, cols: [{x:-4.7,z:0,r:2.7},{x:0,z:0,r:3.2},{x:4.7,z:0,r:2.7}], claim: 3.8, extra: -0.20, labelY: 9.5, base: '#daccb4' } },
    { id: 'shilin-night-market', name: 'Shilin Night Market', builder: 'buildNightMarket', at: [-3.985, 6.031], placement: { foot: 6.6, terrainPin: true, cols: [
      {x:-1.5,z:3,r:.52},{x:-1.5,z:1.8,r:.52},{x:-1.5,z:.6,r:.52},{x:-1.5,z:-.6,r:.52},{x:-1.5,z:-1.8,r:.52},{x:-1.5,z:-3,r:.52},
      {x:1.5,z:3,r:.52},{x:1.5,z:1.8,r:.52},{x:1.5,z:.6,r:.52},{x:1.5,z:-.6,r:.52},{x:1.5,z:-1.8,r:.52},{x:1.5,z:-3,r:.52},
      {x:-1.55,z:4.35,r:.3},{x:1.55,z:4.35,r:.3},{x:-1.12,z:-4.35,r:.24},{x:1.12,z:-4.35,r:.24},{x:4.1,z:-2.35,r:1.55}
    ], claim: 3.2, extra: -0.05, labelY: 4, base: '#34343c' } },
    { id: 'miramar-ferris-wheel', name: 'Miramar Ferris Wheel', builder: 'buildFerrisWheel', at: [-0.71, 5.483], placement: { scale: 1.15, foot: 3.9, ar: 3.3, claim: 2.3, extra: -0.10, labelY: 9.2, merge: false, base: '#cfcabe' } },
    { id: 'palace-museum', name: 'Palace Museum', builder: 'buildPalaceMuseum', at: [-1.585, 7.506], placement: { foot: 4.4, terrainPin: true, cols: [{x:0,z:0,r:3.0},{x:0,z:4.5,r:0.55},{x:-2.4,z:4.5,r:0.5},{x:2.4,z:4.5,r:0.5}], claim: 2.6, extra: -0.25, labelY: 6, base: '#ded6c2' } },
    // Songshan Airport terminal, south of the runway strip (airfield above).
    // terrainPin: the runway void must not let declump slide the building.
    { id: 'songshan-terminal', name: 'Songshan Airport', builder: 'buildAirportTerminal', at: [-1.15, 3.55], placement: { foot: 3.4, terrainPin: true, cols: [{x:-2.4,z:-0.2,r:0.75},{x:-1.2,z:-0.35,r:0.7},{x:0,z:-0.35,r:0.7},{x:1.2,z:-0.35,r:0.7},{x:2.0,z:-0.55,r:0.55}], claim: 2.6, extra: -0.08, labelY: 4.4, base: '#c9c4b6' } },
  ],

  shops: [
    // North of Xinyi Rd — off the Xiangshan-lookout → 101 sightline.
    // (Shops inside the old inflated Xinyi window were divided by ~1.9 in
    // Phase 2 so they keep their authored street relationships in real km.)
    { id: 'seven-eleven-xinyi', builder: 'buildSevenEleven', at: [0.18, -0.42], placement: { ...SEVEN_ELEVEN_PLACEMENT, face: -25 } },
    { id: 'seven-eleven-nangang', builder: 'buildSevenEleven', at: [3.4, 0.2], placement: { ...SEVEN_ELEVEN_PLACEMENT, face: 200 } },
    { id: 'seven-eleven-zhongshan', builder: 'buildSevenEleven', at: [-3.3, 1.2], placement: { ...SEVEN_ELEVEN_PLACEMENT, face: 40 } },
    { id: 'familymart-songshan', builder: 'buildFamilyMart', at: [-0.75, 0.80], placement: { ...FAMILY_MART_PLACEMENT, face: 15 } },
    { id: 'familymart-daan', builder: 'buildFamilyMart', at: [-2.0, -1.3], placement: { ...FAMILY_MART_PLACEMENT, face: -60 } },
    { id: 'familymart-neihu', builder: 'buildFamilyMart', at: [0.5, 3.0], placement: { ...FAMILY_MART_PLACEMENT, face: 120 } },
    { id: 'boba-xinyi', builder: 'buildBobaShop', at: [0.37, 0.74], placement: { face: -20, scale: 1.25, ar: 1.3, claim: 1.2, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'boba-zhongzheng', builder: 'buildBobaShop', at: [-3.7, -0.6], placement: { face: 70, scale: 1.25, ar: 1.3, claim: 1.2, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'breakfast-daan', builder: 'buildBreakfastShop', at: [-1.0, -2.3], placement: { face: 10, scale: 1.25, ar: 1.4, claim: 1.3, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'breakfast-zhongshan', builder: 'buildBreakfastShop', at: [-2.5, 2.7], placement: { face: 135, scale: 1.25, ar: 1.4, claim: 1.3, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
  ],
};
