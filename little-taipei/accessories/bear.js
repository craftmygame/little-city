// Formosan black bear plushie (台灣黑熊) — a charm hanging off a diagonal
// cross-body strap (over the RIGHT shoulder, down to the left hip).
// Attached at the torso origin: the strap wraps the whole torso and the bear
// dangles by its paw where the strap crosses the left-front of the tee.
import * as THREE from 'three';

export const attach = { node: 'torso', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 };

const CHARCOAL = '#33302c'; // warm near-black plush fur
const TAN = '#c9a06a';      // muzzle
const CREAM = '#efe6d0';    // chest V patch
const NOSE = '#1f1d1a';     // nose tip

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

  // over the RIGHT shoulder, down to the left hip
  g.add(makeStrap(toon, faceted, true));

  // the bear dangles as a charm where the strap crosses the left-chest,
  // hanging in front of the tee so it never clips the swinging thighs
  const group = new THREE.Group();
  group.position.set(-0.10, 0.23, 0.26);
  group.rotation.y = -0.3;
  group.scale.setScalar(0.72);
  g.add(group);

  const fur = toon(CHARCOAL);
  const muzzleMat = toon(TAN);
  const creamMat = toon(CREAM);
  const noseMat = toon(NOSE);

  function add(geo, mat, x, y, z) {
    const mesh = new THREE.Mesh(faceted(geo), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  // --- Short cord loop tying the paw to the tee (the charm's hanger).
  const cord = add(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), toon('#3d4a55'), 0, 0.02, -0.015);
  cord.rotation.x = -0.5;

  // --- Raised paw, pinched at the cord (origin). Top stays at y <= 0.02.
  const paw = add(new THREE.SphereGeometry(0.03, 8, 8), fur, 0, -0.012, 0.005);

  // --- Stubby raised arm: paw down to the body's shoulder (passes beside the head).
  const pawAt = new THREE.Vector3(0, -0.012, 0.005);
  const shoulder = new THREE.Vector3(-0.05, -0.145, 0.03);
  const armDir = pawAt.clone().sub(shoulder);
  const armLen = armDir.length();
  const arm = add(
    new THREE.CylinderGeometry(0.02, 0.028, armLen + 0.01, 8, 1),
    fur,
    (pawAt.x + shoulder.x) / 2,
    (pawAt.y + shoulder.y) / 2,
    (pawAt.z + shoulder.z) / 2
  );
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir.normalize());

  // --- Head, tucked just below and beside the raised paw.
  add(new THREE.SphereGeometry(0.085, 9, 8), fur, 0.02, -0.07, 0.03);

  // --- Round ears on top of the head.
  const earL = add(new THREE.SphereGeometry(0.028, 8, 8), fur, -0.038, -0.015, 0.02);
  earL.scale.set(1, 1, 0.7);
  const earR = add(new THREE.SphereGeometry(0.028, 8, 8), fur, 0.078, -0.015, 0.02);
  earR.scale.set(1, 1, 0.7);

  // --- Tan muzzle on the head's front, with a tiny dark nose.
  const muzzle = add(new THREE.SphereGeometry(0.032, 8, 8), muzzleMat, 0.02, -0.09, 0.105);
  muzzle.scale.set(1.1, 0.8, 0.9);
  add(new THREE.SphereGeometry(0.011, 8, 6), noseMat, 0.02, -0.082, 0.132);

  // --- Round huggable body, squashed a touch.
  const body = add(new THREE.SphereGeometry(0.105, 9, 8), fur, 0, -0.19, 0.035);
  body.scale.set(1, 0.9, 0.95);

  // --- Signature cream V / crescent chest patch: flattened half-torus opening upward.
  const chest = add(
    new THREE.TorusGeometry(0.045, 0.012, 8, 10, Math.PI),
    creamMat,
    0,
    -0.146,
    0.121
  );
  chest.rotation.set(-0.45, 0, Math.PI); // flip arc to a V, lean it onto the belly
  chest.scale.set(1, 1, 0.4);

  // --- Free (dangling) arm on the other flank.
  const armR = add(new THREE.SphereGeometry(0.034, 8, 8), fur, 0.09, -0.17, 0.035);
  armR.scale.set(0.85, 1.6, 0.85);

  // --- Two stubby legs at the body's bottom, poking forward like a sat plush.
  const legL = add(new THREE.SphereGeometry(0.04, 8, 8), fur, -0.055, -0.263, 0.075);
  legL.scale.set(1, 0.85, 1.1);
  const legR = add(new THREE.SphereGeometry(0.04, 8, 8), fur, 0.055, -0.263, 0.075);
  legR.scale.set(1, 0.85, 1.1);

  return g;
}
