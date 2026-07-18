// Pastel Taipei scooter half-helmet — the rounded "jelly bean" lid every
// scooter rider in Taiwan wears — perched on top of the kid's fluffy hair.
//
// Head-local frame: skull ellipsoid centered (0, 0.20, 0) radii ~(0.44, 0.44, 0.43);
// hair crown reaches y~0.78, sides |x|~0.50, back z~-0.50; face lives at z>0.35,
// y 0.10–0.28 and must stay uncovered.
//
// The dome shell (radius 0.56, y squashed 0.85) is centered at (0, 0.34, -0.02)
// with a slight backward tilt, so its crown tops out near y~0.81 — clearing the
// y~0.78 hair — while the rim hugs outside the |x|~0.50 / z~-0.50 hair puff.

import * as THREE from 'three';

export const attach = { node: 'head', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 };

const MINT = '#a8d8c8';   // pastel mint shell
const MINT_DARK = '#6f9e8f';   // rim band
const CREAM = '#f6efdd';   // visor brim + vent
const STRAP = '#4b4650';   // chin-strap stubs

const DOME_R = 0.56;          // dome radius
const DOME_SQUASH = 0.85;     // vertical squash so it reads as a shallow shell
const DOME_THETA = Math.PI * 0.55; // keep the upper ~55% of the sphere
const TILT = -0.12;           // slight backward tip: front rim rides high off the face

export function make({ toon, faceted }) {
  const group = new THREE.Group();

  // --- tilted shell assembly: dome + rim band + vent ---
  const shell = new THREE.Group();
  shell.position.set(0, 0.34, -0.02);
  shell.rotation.x = TILT;
  group.add(shell);

  // Smooth jelly-bean dome.
  const domeGeo = new THREE.SphereGeometry(DOME_R, 14, 8, 0, Math.PI * 2, 0, DOME_THETA);
  domeGeo.scale(1, DOME_SQUASH, 1);
  const dome = new THREE.Mesh(faceted(domeGeo), toon(MINT));
  dome.castShadow = true;
  shell.add(dome);

  // Darker rim band tracing the dome's lower edge.
  const rimY = DOME_SQUASH * DOME_R * Math.cos(DOME_THETA); // ~ -0.074
  const rimR = DOME_R * Math.sin(DOME_THETA);               // ~ 0.553
  const rimGeo = new THREE.TorusGeometry(rimR, 0.04, 10, 14);
  const rim = new THREE.Mesh(faceted(rimGeo), toon(MINT_DARK));
  rim.position.y = rimY;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  shell.add(rim);

  // Tiny round vent bump on the crown.
  const ventGeo = new THREE.SphereGeometry(0.09, 10, 6);
  ventGeo.scale(1, 0.55, 1);
  const vent = new THREE.Mesh(faceted(ventGeo), toon(CREAM));
  vent.position.set(0, 0.46, 0);
  vent.castShadow = true;
  shell.add(vent);

  // --- stubby visor brim, front only, tucked under the rim band ---
  // Flattened ellipsoid: spans y 0.285–0.345 (never below y~0.28, so the eyes
  // at y 0.10–0.28 stay clear), lip pokes to z~0.66; its back half hides
  // inside the dome so no open edges show.
  const visorGeo = new THREE.SphereGeometry(1, 12, 6);
  visorGeo.scale(0.30, 0.03, 0.21);
  const visor = new THREE.Mesh(faceted(visorGeo), toon(CREAM));
  visor.position.set(0, 0.315, 0.45);
  visor.castShadow = true;
  group.add(visor);

  // --- chin-strap stubs, tight against the head sides ---
  const strapGeo = new THREE.BoxGeometry(0.04, 0.16, 0.08);
  const strapL = new THREE.Mesh(faceted(strapGeo), toon(STRAP));
  strapL.position.set(-0.43, 0.125, 0.04);
  strapL.rotation.z = 0.15; // lean top outward, following the skull curve
  strapL.castShadow = true;
  group.add(strapL);

  const strapR = new THREE.Mesh(faceted(strapGeo.clone()), toon(STRAP));
  strapR.position.set(0.43, 0.125, 0.04);
  strapR.rotation.z = -0.15;
  strapR.castShadow = true;
  group.add(strapR);

  return group;
}
