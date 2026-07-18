// Bubble tea (boba) cup — slung on a diagonal cross-body strap (over the
// LEFT shoulder, down to the right hip) like a night-market drink carrier.
// Attached at the torso origin: the strap wraps the whole torso and the cup
// rides where the strap crosses the right-front, seated against the tee.
import * as THREE from 'three';

export const attach = { node: 'torso', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 };

// Cross-body strap that FOLLOWS the tee's tapered surface (a plain torus
// floats off the clothes): highest point tucks in at the neck-shoulder
// junction, the low side wraps snug under the opposite hip.
function makeStrap(toon, faceted, overRightShoulder) {
  const pts = [], N = 28;
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const y = 0.30 + (c > 0 ? 0.38 : 0.24) * c;            // high over the shoulder, snug under the hip
    const rb = 0.295 + 0.055 * (0.59 - y) / 0.60 + 0.015;  // tee taper + a hair of padding
    const k = 1 - 0.42 * Math.max(0, c) * Math.max(0, c);  // tuck toward the neck at the top
    pts.push(new THREE.Vector3(rb * k * c * (overRightShoulder ? 1 : -1), y, rb * 0.80 * s));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const m = new THREE.Mesh(faceted(new THREE.TubeGeometry(curve, 40, 0.02, 6, true)), toon('#3d4a55'));
  m.castShadow = true;
  return m;
}

export function make({ toon, faceted }) {
  const g = new THREE.Group();

  // over the LEFT shoulder, down to the right hip
  g.add(makeStrap(toon, faceted, false));

  // the cup rides where the strap crosses the right-front of the tee
  const cup = new THREE.Group();
  cup.position.set(0.23, 0.12, 0.23);
  cup.rotation.y = -0.35;
  g.add(cup);

  const add = (geo, color, x, y, z) => {
    const mesh = new THREE.Mesh(faceted(geo), toon(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    cup.add(mesh);
    return mesh;
  };

  // --- Cup body: milk tea, slightly narrower at the bottom, centered on the palm.
  const CUP_H = 0.19;
  const CUP_TOP_R = 0.075;
  const CUP_BOT_R = 0.06;
  add(new THREE.CylinderGeometry(CUP_TOP_R, CUP_BOT_R, CUP_H, 10), '#d9b98a', 0, 0, 0);

  // --- Darker band near the bottom, suggesting the pearl layer inside.
  add(new THREE.CylinderGeometry(0.066, 0.063, 0.05, 10), '#a9825a', 0, -0.066, 0);

  // --- Five boba pearls hugging the inside bottom edge, peeking through the band.
  const PEARL_R = 0.016;
  const PEARL_RING = 0.054;
  const PEARL_Y = -0.082;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    add(
      new THREE.SphereGeometry(PEARL_R, 8, 6),
      '#3a2a20',
      Math.cos(a) * PEARL_RING,
      PEARL_Y,
      Math.sin(a) * PEARL_RING
    );
  }

  // --- Lid: a slightly wider pale rim plus a shallow dome.
  const LID_R = 0.082;
  add(new THREE.CylinderGeometry(LID_R, LID_R, 0.016, 10), '#efe9dc', 0, 0.098, 0);
  const dome = add(
    new THREE.SphereGeometry(LID_R, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    '#efe9dc',
    0,
    0.106,
    0
  );
  dome.scale.y = 0.5; // shallow dome, apex ≈ y 0.147

  // --- Fat pastel straw poking from the lid at a slight tilt.
  const straw = add(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 8), '#7fc4b6', 0.012, 0.16, -0.008);
  straw.rotation.set(-0.12, 0, 0.18);

  // --- Holder band hugging the cup where the strap threads through it.
  const band = add(new THREE.TorusGeometry(0.072, 0.011, 6, 12), '#3d4a55', 0, 0.015, 0);
  band.rotation.x = Math.PI / 2;

  return g;
}
