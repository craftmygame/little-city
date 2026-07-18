import * as THREE from 'three';

export const attach = { node:'torso', pos:[0,0,0], rot:[0,0,0], scale:1 };

// Taipei EasyCard on a neck lanyard — two cords from the collar meet at a
// clip above a teal transit card resting on the chest. 5 meshes total.

const CORD_RADIUS = 0.012;
const CORD_COLOR = '#3d4a55';
const CARD_COLOR = '#2ba8a0';
const STRIPE_COLOR = '#f4f6f4';
const CLIP_COLOR = '#c9c2b2';

const CARD_POS = [0, 0.34, 0.28];
const CARD_TILT_X = -0.1;
const CARD_W = 0.15;
const CARD_H = 0.10;
const CARD_T = 0.02;

const CORD_MEET = new THREE.Vector3(0, 0.40, 0.27);

function roundedRectShape(w, h, r){
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function makeCord(toon, faceted, start, end){
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  dir.normalize();
  const geo = new THREE.CylinderGeometry(CORD_RADIUS, CORD_RADIUS, len, 6, 1);
  const mesh = new THREE.Mesh(faceted(geo), toon(CORD_COLOR));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.castShadow = true;
  return mesh;
}

export function make({toon, faceted}){
  const group = new THREE.Group();

  // Lanyard cords: from near the collar sides down/forward to the card top.
  const leftCord = makeCord(
    toon, faceted, new THREE.Vector3(-0.09, 0.60, 0.16), CORD_MEET,
  );
  const rightCord = makeCord(
    toon, faceted, new THREE.Vector3(0.09, 0.60, 0.16), CORD_MEET,
  );
  group.add(leftCord, rightCord);

  // Card assembly, tilted back a touch so it lies on the sloping chest.
  const cardGroup = new THREE.Group();
  cardGroup.position.set(CARD_POS[0], CARD_POS[1], CARD_POS[2]);
  cardGroup.rotation.x = CARD_TILT_X;

  const cardGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(CARD_W, CARD_H, 0.02),
    { depth: CARD_T, bevelEnabled: false, curveSegments: 3 },
  );
  cardGeo.translate(0, 0, -CARD_T / 2);
  const card = new THREE.Mesh(faceted(cardGeo), toon(CARD_COLOR));
  card.castShadow = true;
  cardGroup.add(card);

  // Thin white stripe across the card's middle (slightly thicker than the
  // card so it shows on both faces).
  const stripe = new THREE.Mesh(
    faceted(new THREE.BoxGeometry(CARD_W, 0.03, 0.022)),
    toon(STRIPE_COLOR),
  );
  stripe.castShadow = true;
  cardGroup.add(stripe);

  group.add(cardGroup);

  // Small clip where the cords meet the card top.
  const clip = new THREE.Mesh(
    faceted(new THREE.BoxGeometry(0.035, 0.03, 0.026)),
    toon(CLIP_COLOR),
  );
  clip.position.copy(CORD_MEET);
  clip.rotation.x = CARD_TILT_X;
  clip.castShadow = true;
  group.add(clip);

  return group;
}
