// accessories/tanghulu.js — 糖葫蘆 candied strawberry skewer, held in the left hand.
// Origin is the palm center of a hand hanging at the kid's side (+Y up, +Z forward).
// The fist (sphere r ~0.078) grips the stick's lower third; candy rises above it.
import * as THREE from 'three';

export const attach = { node: 'handL', pos: [0, 0.01, 0.05], rot: [0.15, 0, 0], scale: 1 };

const STICK_RADIUS = 0.011;
const STICK_LENGTH = 0.36;
const STICK_CENTER_Y = 0.06; // stick spans y = -0.12 … 0.24: a little below the fist, most above
const SQUASH = 0.85;         // candies are slightly flattened spheres

// Bottom-to-top candy radii and center heights (nearly touching once squashed).
const CANDIES = [
  { r: 0.055, y: 0.128 },
  { r: 0.050, y: 0.214 },
  { r: 0.046, y: 0.292 },
];

export function make({ toon, faceted }) {
  const group = new THREE.Group();

  const woodMat = toon('#c9a06a');
  const candyMat = toon('#c93030');
  const glintMat = toon('#ffffff');
  const leafMat = toon('#6fae5c');

  const add = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(faceted(geo), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Thin wooden stick running vertically through the palm.
  add(
    new THREE.CylinderGeometry(STICK_RADIUS, STICK_RADIUS, STICK_LENGTH, 8),
    woodMat, 0, STICK_CENTER_Y, 0
  );

  // Three glossy candy-red strawberries skewered along the top half of the stick.
  for (const { r, y } of CANDIES) {
    add(new THREE.SphereGeometry(r, 9, 7).scale(1, SQUASH, 1), candyMat, 0, y, 0);

    // Tiny white dot on the upper-left of each candy to fake a glossy glint.
    add(
      new THREE.SphereGeometry(0.012, 8, 6),
      glintMat, -0.52 * r, y + 0.62 * r * SQUASH, 0.52 * r
    );
  }

  // Small leaf-green cone tucked at the top candy's crown.
  const top = CANDIES[CANDIES.length - 1];
  const leaf = add(
    new THREE.ConeGeometry(0.016, 0.03, 8),
    leafMat, 0.006, top.y + top.r * SQUASH + 0.008, 0.004
  );
  leaf.rotation.z = -0.35;

  return group;
}
