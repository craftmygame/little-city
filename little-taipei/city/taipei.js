/**
 * Little Taipei's editable city definition.
 *
 * Coordinates are real kilometres from Taipei 101:
 *   [east, north] — west/south values are negative.
 *
 * Most city contributions should only touch this file. Building geometry lives
 * in ../taipei-landmarks.js; rendering and gameplay live in ../main.js.
 */
export const TAIPEI_CITY = {
  id: 'taipei',
  name: 'Little Taipei',

  planet: {
    radius: 40.8,
    waterLevel: 0,
    basinHeight: 1.25,
    unitsPerKm: 7.14,
    spread: { factor: 1.9, innerKm: 4, outerKm: 11, farFactor: 0.321 },
  },

  terrain: {
    mountains: [
      // Yangmingshan / Datun / Qixingshan — north
      { id: 'datun', at: [-2, 11.5], height: 8.5, radiusKm: 5.0 },
      { id: 'qixingshan', at: [1.5, 12.5], height: 7.5, radiusKm: 4.2 },
      { id: 'yangmingshan-west', at: [-4.5, 10], height: 6.5, radiusKm: 4.0 },
      { id: 'yangmingshan-east', at: [4.5, 10.5], height: 6.0, radiusKm: 3.6 },
      { id: 'datun-north', at: [-0.5, 13.5], height: 7.4, radiusKm: 3.2 },

      // Maokong / Wenshan — south
      { id: 'maokong', at: [2.5, -7], height: 7.0, radiusKm: 4.6 },
      { id: 'erge', at: [6, -8.5], height: 6.0, radiusKm: 3.8 },
      { id: 'wenshan', at: [-0.5, -6.5], height: 5.5, radiusKm: 3.6 },
      { id: 'southwest-hills', at: [-3.5, -6], height: 4.5, radiusKm: 3.2 },
      { id: 'elephant-mountain', at: [1.3, -1.6], height: 2.4, radiusKm: 1.0 },

      // Four Beasts, Nangang, Neihu, and Guanyinshan
      { id: 'four-beasts', at: [5, -2.5], height: 3.8, radiusKm: 2.8 },
      { id: 'nangang-hills', at: [7.5, -0.5], height: 3.4, radiusKm: 3.0 },
      { id: 'neihu-north', at: [3.5, 7.5], height: 3.2, radiusKm: 2.8 },
      { id: 'neihu-east', at: [5.5, 5.5], height: 2.8, radiusKm: 2.4 },
      { id: 'guanyinshan', at: [-12, 6], height: 5.5, radiusKm: 3.4 },
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
      { id: 'datun-far-north', at: [-2, 15.5], height: 8.0, radiusKm: 5.0 },
      { id: 'north-coast-east', at: [2.5, 15], height: 7.0, radiusKm: 4.2 },
      { id: 'north-coast-west', at: [-6, 13.5], height: 6.0, radiusKm: 4.0 },
    ],

    gradedSites: [
      { id: 'palace-museum-site', at: [-1.6, 7.6], innerKm: 0.72, outerKm: 1.18, height: 3.15 },
      { id: 'shilin-market-site', at: [-4.4, 6.35], innerKm: 0.52, outerKm: 0.92, height: 1.45 },
    ],

    // NOTE — Xinyi district (the window between Guangfu S Rd, Songren Rd,
    // the Taipei Dome block and Xinyi Rd Sec 5) is authored from the real
    // street map, uniformly inflated ~×1.9 around Taipei 101 so the stylised
    // oversized landmark models keep the true block topology and bearings.

    waterways: [
      { id: 'tamsui-river', name: 'Tamsui River', halfWidthKm: 0.62, path: [[-7.2, -3], [-7.4, 0], [-7.8, 3], [-8.6, 6], [-10, 9.2], [-11, 10.3]] },
      { id: 'xindian-river', name: 'Xindian River', halfWidthKm: 0.42, path: [[-4.5, -7.5], [-5.2, -4.5], [-6.2, -2.5], [-7, -1], [-7.3, 0]] },
      { id: 'keelung-river', name: 'Keelung River', halfWidthKm: 0.45, path: [[7.5, -1.5], [5.5, 0.5], [3.5, 2.5], [1.5, 3.9], [-0.8, 4.5], [-3.3, 4.4], [-5.2, 3.7], [-7.3, 4.9], [-8.6, 6.0]] },
    ],
  },

  spaces: {
    parks: [
      { id: 'daan-forest-park', name: "Da'an Forest Park", at: [-2.9, -0.5], radiusKm: 1.15 },
      { id: 'yuanshan-park', name: 'Yuanshan Park', at: [-3.9, 5.0], radiusKm: 0.7 },
      // Zhongshan Park — the green block around Sun Yat-sen Memorial Hall,
      // bounded by Zhongxiao E Rd (N), Ren'ai Rd (S) and Guangfu S Rd (W).
      { id: 'zhongshan-park', name: 'Zhongshan Park', at: [-0.88, 1.2], radiusKm: 0.4 },
      // City Hall front plaza lawn, west of Taipei City Hall on the Ren'ai axis.
      { id: 'xinyi-green', name: 'Citizen Plaza', at: [-0.35, 0.95], radiusKm: 0.3 },
      { id: 'peace-park', name: '228 Peace Memorial Park', at: [-5.5, 1.0], radiusKm: 0.5 },
      { id: 'elephant-mountain-park', name: 'Elephant Mountain Trailhead', at: [1.2, -1.5], radiusKm: 0.7 },
      { id: 'dadaocheng-riverside', name: 'Dadaocheng Riverside Park', at: [-7.6, 3.8], radiusKm: 0.85 },
      { id: 'wanhua-riverside', name: 'Wanhua Riverside Park', at: [-7.9, -0.6], radiusKm: 0.85 },
      { id: 'dajia-riverside', name: 'Dajia Riverside Park', at: [-2.6, 4.4], radiusKm: 0.9 },
      { id: 'meiti-riverside', name: 'Meiti Riverside Park', at: [1.4, 3.4], radiusKm: 0.8 },
      { id: 'youth-park', name: 'Youth Park', at: [-6.9, -1.2], radiusKm: 0.55 },
      { id: 'guting-riverside', name: 'Guting Riverside Park', at: [-4.7, -2.2], radiusKm: 0.5 },
    ],
    ponds: [
      { id: 'daan-pond', at: [-2.9, -0.65], radius: 1.0 },
      { id: 'elephant-mountain-pond', at: [1.2, -1.6], radius: 0.5 },
      { id: 'zhongshan-pond', at: [-1.0, 1.02], radius: 0.5 },   // 翠湖, SW corner of Zhongshan Park
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
    { id: 'zhongxiao', name: 'Zhongxiao Road', widthKm: 0.34, path: [[-7.0, 1.0], [-4.8, 0.9], [-2.8, 1.0], [-1.7, 1.52], [0.55, 1.55], [2.2, 1.15], [4.2, 0.35]] },
    // Ren'ai Rd Sec 4 — dead-straight east–west axis along the south edge of
    // Zhongshan Park, ending at the Taipei City Hall front plaza (the real road
    // terminates there). Points [2] and [3] are the spawn + camera heading.
    { id: 'renai', name: "Ren'ai Boulevard", widthKm: 0.28, path: [[-6.4, -0.35], [-3.6, 0.3], [-1.45, 0.775], [-0.95, 0.785], [-0.45, 0.8]] },
    // Xinyi Rd Sec 5 — passes just south of the Taipei 101 block; the red MRT
    // line and the Taipei 101/World Trade Center station follow it.
    { id: 'xinyi-road', name: 'Xinyi Road', widthKm: 0.24, path: [[-6.6, -1.0], [-3.0, -1.0], [-1.6, -0.66], [-0.6, -0.62], [0.6, -0.62], [1.5, -0.7], [2.4, -1.0]] },
    { id: 'heping', name: 'Heping Road', widthKm: 0.22, path: [[-6.8, -1.9], [-3.0, -2.0], [0.0, -2.05], [2.0, -2.1]] },
    { id: 'nanjing', name: 'Nanjing Road', widthKm: 0.26, path: [[-6.2, 2.5], [-3.5, 2.6], [-1.0, 2.65], [1.6, 2.6], [3.2, 2.5]] },
    // Bade Rd — bows north around the Taipei Dome block (Civic Blvd corridor).
    { id: 'bade', name: 'Bade Road', widthKm: 0.22, path: [[-6.2, 1.7], [-3.0, 1.75], [-1.7, 2.5], [0.0, 2.5], [2.6, 2.3]] },
    { id: 'zhongshan', name: 'Zhongshan Road', widthKm: 0.30, path: [[-4.6, -2.2], [-4.5, 0.8], [-4.35, 3.0], [-4.2, 5.0]] },
    { id: 'dunhua', name: 'Dunhua Road', widthKm: 0.28, path: [[-1.0, -2.4], [-1.0, 0.0], [-1.0, 2.6], [-0.9, 4.2]] },
    { id: 'fuxing', name: 'Fuxing Road', widthKm: 0.22, path: [[-2.1, -2.4], [-2.05, 0.5], [-2.0, 2.7]] },
    { id: 'zhonghua', name: 'Zhonghua Road', widthKm: 0.22, path: [[-6.5, -2.6], [-6.4, -0.2], [-6.5, 1.8]] },
    // Keelung Rd — the NE–SW diagonal: crosses Zhongxiao at Taipei City Hall
    // station, skirts west of City Hall / Grand Hyatt / the 101 block, and meets
    // Xinyi Rd at the Taipei 101/World Trade Center station.
    { id: 'keelung-road', name: 'Keelung Road', widthKm: 0.26, path: [[1.0, 2.1], [0.28, 1.55], [-0.55, 1.02], [-0.8, 0.35], [-0.88, -0.62], [-1.1, -1.35]] },
    { id: 'roosevelt', name: 'Roosevelt Road', widthKm: 0.22, path: [[-5.0, -0.5], [-5.4, -2.2], [-5.8, -4.0]] },
    // Guangfu S Rd — western boundary of the district, along the Dome block and
    // Zhongshan Park.
    { id: 'guangfu-south', name: 'Guangfu S Road', widthKm: 0.2, path: [[-1.32, 2.3], [-1.3, 1.52], [-1.28, 0.78], [-1.26, -0.66]] },
    // Songren Rd — eastern boundary, past City Hall and Breeze Nan Shan.
    { id: 'songren', name: 'Songren Road', widthKm: 0.18, path: [[0.88, 2.1], [0.88, 1.55], [0.88, 0.5], [0.88, -0.62]] },
    // Songshou Rd — between the Grand Hyatt and the Taipei 101 block.
    { id: 'songshou', name: 'Songshou Road', widthKm: 0.16, path: [[-0.72, 0.56], [0.2, 0.56], [0.88, 0.56]] },
  ],

  transit: {
    metroLines: [
      // Red line follows Xinyi Rd through the district (Taipei 101/WTC station),
      // then bends south-east toward Xiangshan.
      { id: 'red', name: 'Tamsui–Xinyi Line', color: '#E3002C', path: [[-4, 6.2], [-4.5, 4], [-4.8, 2], [-4.5, 0.5], [-3, -0.5], [-1.6, -0.7], [-0.6, -0.66], [0.6, -0.66], [1.5, -0.74], [2.0, -1.1]] },
      // Blue line rides Zhongxiao E Rd (Taipei City Hall station at the Keelung
      // Rd crossing) before heading on toward Nangang.
      { id: 'blue', name: 'Bannan Line', color: '#0070BD', path: [[-6.6, 0.4], [-4.8, 0.5], [-2.8, 0.95], [-1.7, 1.48], [0.55, 1.51], [2.2, 1.12], [6, 1]] },
      { id: 'green', name: 'Songshan–Xindian Line', color: '#1DA742', path: [[-4.6, -4], [-4.3, -1], [-4.6, 0.4], [-3, 1.2], [-1, 2], [1.3, 1.9]] },
      { id: 'orange', name: 'Zhonghe–Xinlu Line', color: '#F8B61C', path: [[-3, -4], [-2.5, -1.2], [-2.8, 1], [-4, 3], [-5.6, 2.4]] },
      { id: 'brown', name: 'Wenhu Line', color: '#C48C31', path: [[1.2, -4.2], [-0.6, -1.2], [-1.4, 1.9], [-1.0, 4], [-0.7, 5.5]] },
    ],
    gondola: { from: [1.2, -4.2], to: [2.7, -7.8], pylons: 11, cabins: 5 },
  },

  landmarks: [
    { id: 'taipei-101', name: 'Taipei 101', builder: 'buildTaipei101', at: [0.0, 0.0], placement: { scale: 1.15, foot: 7.2, cols: [
      {x:-4.42,z:-2.6,r:.42},{x:-4.42,z:-1.3,r:.42},{x:-4.42,z:0,r:.42},{x:-4.42,z:1.3,r:.42},{x:-4.42,z:2.6,r:.42},
      {x:4.42,z:-2.6,r:.42},{x:4.42,z:-1.3,r:.42},{x:4.42,z:0,r:.42},{x:4.42,z:1.3,r:.42},{x:4.42,z:2.6,r:.42},
      {x:-3.6,z:-3.42,r:.42},{x:-2.4,z:-3.42,r:.42},{x:-1.2,z:-3.42,r:.42},{x:0,z:-3.42,r:.42},{x:1.2,z:-3.42,r:.42},{x:2.4,z:-3.42,r:.42},{x:3.6,z:-3.42,r:.42},
      {x:-3.15,z:3.42,r:1.3},{x:3.15,z:3.42,r:1.3},{x:-1.68,z:3.44,r:.15},{x:1.68,z:3.44,r:.15},{x:0,z:-2.10,r:1.2},{x:0,z:-.72,r:.65}
    ], claim: 4.8, extra: -0.08, labelY: 35, pin: true, base: '#d6d0c2' } },
    // City Hall faces west onto the Citizen Plaza where the Ren'ai axis ends.
    // Open civic lobby: colliders hug the walls, the centre door stays clear.
    { id: 'city-hall', name: 'Taipei City Hall', builder: 'buildCityHall', at: [0.08, 1.1], placement: { scale: 1.3, foot: 4.7, face: 90, cols: [{x:-2.5,z:0,r:2.1},{x:2.5,z:0,r:2.1},{x:0,z:-0.85,r:0.9},{x:-1.05,z:0.6,r:0.45},{x:1.05,z:0.6,r:0.45}], claim: 2.9, extra: -0.10, labelY: 7.2, base: '#cfcabe' } },
    // SYS Memorial Hall sits in Zhongshan Park; its gated plaza opens south to
    // Ren'ai Rd and the memorial chamber (statue inside) is walkable — the
    // collider circles trace the shell walls and gate piers, not the doorway.
    { id: 'sun-yat-sen-hall', name: 'Sun Yat-sen Hall', builder: 'buildSYSHall', at: [-0.92, 1.22], placement: { foot: 4.2, cols: [
      {x:-1.72,z:-0.8,r:.85},{x:-1.72,z:0.6,r:.85},{x:1.72,z:-0.8,r:.85},{x:1.72,z:0.6,r:.85},
      {x:-1.0,z:-1.75,r:.85},{x:0.9,z:-1.75,r:.85},{x:-1.42,z:1.75,r:.6},{x:1.42,z:1.75,r:.6},
      {x:0,z:-1.15,r:.6},{x:-2.35,z:5.0,r:0.42},{x:2.35,z:5.0,r:0.42}
    ], claim: 2.4, extra: -0.15, labelY: 5, base: '#d8d2c4' } },
    // Taipei Dome — grey saucer over a glazed arcade north of Zhongxiao E Rd.
    // The arcade opening faces the road; inside is the walkable ballpark, so
    // the colliders ring the drum and leave the entrance arc open.
    { id: 'taipei-dome', name: 'Taipei Dome', builder: 'buildTaipeiDome', at: [-0.85, 1.98], placement: { foot: 5.2, cols: [
      {x:2.55,z:2.62,r:1.05},{x:3.68,z:1.28,r:1.05},{x:3.95,z:-0.36,r:1.05},{x:3.29,z:-1.91,r:1.05},
      {x:1.86,z:-3.02,r:1.05},{x:0,z:-3.42,r:1.05},{x:-1.86,z:-3.02,r:1.05},{x:-3.29,z:-1.91,r:1.05},
      {x:-3.95,z:-0.36,r:1.05},{x:-3.68,z:1.28,r:1.05},{x:-2.55,z:2.62,r:1.05}
    ], claim: 3.4, extra: -0.10, labelY: 5.6, base: '#cfd0d4' } },
    // Grand Hyatt — cream stepped slab hotel north of Songshou Rd; the
    // porte-cochère leads into an open lobby.
    { id: 'grand-hyatt', name: 'Grand Hyatt Taipei', builder: 'buildGrandHyatt', at: [-0.3, 0.78], placement: { foot: 2.9, cols: [{x:-1.95,z:0,r:0.95},{x:1.95,z:0,r:0.95},{x:0,z:-1.15,r:0.8},{x:-0.5,z:-0.55,r:0.4},{x:-0.85,z:1.05,r:0.45},{x:0.85,z:1.05,r:0.45}], claim: 2.2, extra: -0.10, labelY: 5.6, base: '#d8d2c4' } },
    // Breeze Nan Shan tower — the tall rounded glass high-rise east of 101;
    // the podium atrium is walkable, entrance facing west toward the tower.
    { id: 'breeze-nanshan', name: 'Breeze Nan Shan', builder: 'buildBreezeNanShan', at: [0.66, 0.4], placement: { foot: 2.6, face: 90, cols: [{x:-1.3,z:-0.4,r:.75},{x:1.3,z:-0.4,r:.75},{x:0,z:-1.05,r:.8},{x:0,z:-0.35,r:.4},{x:-1.15,z:0.95,r:.4},{x:1.15,z:0.95,r:.4}], claim: 2.0, extra: -0.10, labelY: 13.5, base: '#cfcdc4' } },
    // Shin Kong Mitsukoshi Xinyi Place A11 — boxy department store with the big
    // LED billboard face; ground-floor shop hall is walkable.
    { id: 'mitsukoshi-a11', name: 'Mitsukoshi A11', builder: 'buildMitsukoshiA11', at: [0.45, 0.66], placement: { foot: 2.4, cols: [{x:-1.5,z:-0.4,r:.8},{x:1.5,z:-0.4,r:.8},{x:0,z:-1.15,r:.9},{x:-1.25,z:1.1,r:.45},{x:1.25,z:1.1,r:.45}], claim: 1.9, extra: -0.08, labelY: 4.6, base: '#cfcabe' } },
    { id: 'taipei-arena', name: 'Taipei Arena', builder: 'buildArena', at: [-1.5, 1.9], placement: { scale: 1.6, foot: 4.8, ar: 4.0, claim: 2.6, extra: -0.10, labelY: 6.1, base: '#cdc8bc' } },
    { id: 'raohe-night-market', name: 'Raohe Night Market', builder: 'buildNightMarket', at: [1.3, 1.9], placement: { foot: 6.6, cols: [
      {x:-1.5,z:3,r:.52},{x:-1.5,z:1.8,r:.52},{x:-1.5,z:.6,r:.52},{x:-1.5,z:-.6,r:.52},{x:-1.5,z:-1.8,r:.52},{x:-1.5,z:-3,r:.52},
      {x:1.5,z:3,r:.52},{x:1.5,z:1.8,r:.52},{x:1.5,z:.6,r:.52},{x:1.5,z:-.6,r:.52},{x:1.5,z:-1.8,r:.52},{x:1.5,z:-3,r:.52},
      {x:-1.55,z:4.35,r:.3},{x:1.55,z:4.35,r:.3},{x:-1.55,z:4.9,r:.28},{x:1.55,z:4.9,r:.28},{x:-1.12,z:-4.35,r:.24},{x:1.12,z:-4.35,r:.24},{x:4.1,z:-2.35,r:1.55}
    ], claim: 3.2, extra: -0.05, labelY: 4, face: 90, base: '#34343c' } },
    { id: 'cks-memorial', name: 'CKS Memorial Hall', builder: 'buildCKSComplex', at: [-4.3, 0.1], placement: { foot: 9.2, scale: 0.95, cols: [
      {x:-2.14,z:-6.2,r:.5},{x:-2.14,z:-5,r:.5},{x:-2.14,z:-3.8,r:.5},{x:2.14,z:-6.2,r:.5},{x:2.14,z:-5,r:.5},{x:2.14,z:-3.8,r:.5},
      {x:-1.6,z:-7.14,r:.5},{x:-.5,z:-7.14,r:.5},{x:.5,z:-7.14,r:.5},{x:1.6,z:-7.14,r:.5},{x:-1.5,z:-2.86,r:.7},{x:1.5,z:-2.86,r:.7},
      {x:-6,z:0,r:1.8},{x:6,z:0,r:1.8},{x:-3.7,z:6,r:.34},{x:-2.25,z:6,r:.34},{x:-1.18,z:6,r:.28},{x:1.18,z:6,r:.28},{x:2.25,z:6,r:.34},{x:3.7,z:6,r:.34}
    ], claim: 5.0, extra: -0.12, labelY: 10, face: -90, base: '#e7e2d5' } },
    { id: 'presidential-office', name: 'Presidential Office', builder: 'buildPresidentialOffice', at: [-5.3, 0.7], placement: { foot: 4.6, cols: [{x:-3,z:0,r:2.1},{x:0,z:0,r:2.1},{x:3,z:0,r:2.1}], claim: 2.4, extra: -0.15, labelY: 7.5, face: -90, base: '#d8d2c4' } },
    { id: 'main-station', name: 'Taipei Main Station', builder: 'buildMainStation', at: [-4.8, 1.55], placement: { foot: 4.0, ar: 3.5, claim: 2.4, extra: -0.15, labelY: 6, base: '#cfcabe' } },
    { id: 'longshan-temple', name: 'Longshan Temple', builder: 'buildLongshanTemple', at: [-6.05, 0.3], placement: { scale: 1.1, foot: 4.0, cols: [{x:0,z:2.2,r:2.3},{x:0,z:0,r:2.2},{x:0,z:-2.3,r:2.2},{x:-2.7,z:1.65,r:1.0},{x:-2.7,z:-1.65,r:1.0},{x:2.7,z:1.65,r:1.0},{x:2.7,z:-1.65,r:1.0}], claim: 2.0, extra: -0.10, labelY: 5.1, base: '#cdbfa1' } },
    { id: 'baoan-temple', name: 'Bao’an Temple', builder: 'buildBaoanTemple', at: [-5.3, 4.15], placement: { foot: 2.6, cols: [{x:0,z:1.35,r:1.5},{x:0,z:-0.55,r:1.8}], claim: 1.7, extra: -0.10, labelY: 4, base: '#cdbfa1' } },
    { id: 'grand-hotel', name: 'Grand Hotel', builder: 'buildGrandHotel', at: [-3.9, 5.1], placement: { scale: 1.35, foot: 7.3, cols: [{x:-4.7,z:0,r:2.7},{x:0,z:0,r:3.2},{x:4.7,z:0,r:2.7}], claim: 3.8, extra: -0.20, labelY: 9.5, base: '#daccb4' } },
    { id: 'shilin-night-market', name: 'Shilin Night Market', builder: 'buildNightMarket', at: [-4.4, 6.35], placement: { foot: 6.6, terrainPin: true, cols: [
      {x:-1.5,z:3,r:.52},{x:-1.5,z:1.8,r:.52},{x:-1.5,z:.6,r:.52},{x:-1.5,z:-.6,r:.52},{x:-1.5,z:-1.8,r:.52},{x:-1.5,z:-3,r:.52},
      {x:1.5,z:3,r:.52},{x:1.5,z:1.8,r:.52},{x:1.5,z:.6,r:.52},{x:1.5,z:-.6,r:.52},{x:1.5,z:-1.8,r:.52},{x:1.5,z:-3,r:.52},
      {x:-1.55,z:4.35,r:.3},{x:1.55,z:4.35,r:.3},{x:-1.12,z:-4.35,r:.24},{x:1.12,z:-4.35,r:.24},{x:4.1,z:-2.35,r:1.55}
    ], claim: 3.2, extra: -0.05, labelY: 4, base: '#34343c' } },
    { id: 'miramar-ferris-wheel', name: 'Miramar Ferris Wheel', builder: 'buildFerrisWheel', at: [-0.7, 5.45], placement: { scale: 1.15, foot: 3.9, ar: 3.3, claim: 2.3, extra: -0.10, labelY: 9.2, merge: false, base: '#cfcabe' } },
    { id: 'palace-museum', name: 'Palace Museum', builder: 'buildPalaceMuseum', at: [-1.6, 7.6], placement: { foot: 4.4, terrainPin: true, cols: [{x:0,z:0,r:3.0},{x:0,z:4.5,r:0.55},{x:-2.4,z:4.5,r:0.5},{x:2.4,z:4.5,r:0.5}], claim: 2.6, extra: -0.25, labelY: 6, base: '#ded6c2' } },
  ],

  shops: [
    { id: 'seven-eleven-xinyi', builder: 'buildSevenEleven', at: [0.8, -0.9], placement: { face: -25, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'seven-eleven-nangang', builder: 'buildSevenEleven', at: [3.4, 0.2], placement: { face: 200, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'seven-eleven-zhongshan', builder: 'buildSevenEleven', at: [-3.3, 1.2], placement: { face: 40, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'familymart-songshan', builder: 'buildFamilyMart', at: [-1.2, 1.7], placement: { face: 15, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'familymart-daan', builder: 'buildFamilyMart', at: [-2.0, -1.3], placement: { face: -60, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'familymart-neihu', builder: 'buildFamilyMart', at: [0.5, 3.0], placement: { face: 120, scale: 1.25, ar: 1.5, claim: 1.4, colH: 2.5, extra: -0.05, base: '#bdb7a8' } },
    { id: 'boba-xinyi', builder: 'buildBobaShop', at: [0.7, 1.4], placement: { face: -20, scale: 1.25, ar: 1.3, claim: 1.2, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'boba-zhongzheng', builder: 'buildBobaShop', at: [-3.7, -0.6], placement: { face: 70, scale: 1.25, ar: 1.3, claim: 1.2, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'breakfast-daan', builder: 'buildBreakfastShop', at: [-1.0, -2.3], placement: { face: 10, scale: 1.25, ar: 1.4, claim: 1.3, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
    { id: 'breakfast-zhongshan', builder: 'buildBreakfastShop', at: [-2.5, 2.7], placement: { face: 135, scale: 1.25, ar: 1.4, claim: 1.3, colH: 2.4, extra: -0.05, base: '#bdb7a8' } },
  ],
};
