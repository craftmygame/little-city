// accessories.js — Taiwan-flavoured accessory index.
// Each accessory lives in accessories/<name>.js with the contract:
//   export const attach = { node:'handL'|'handR'|'head'|'torso'|'neck', pos:[x,y,z], rot:[x,y,z], scale:1 };
//   export function make({toon, faceted}) -> THREE.Group   (authored so the attach origin is at 0,0,0)
// character.js looks accessories up here by name via opt.accessory.

import * as boba from './accessories/boba.js';
import * as easycard from './accessories/easycard.js';
import * as tanghulu from './accessories/tanghulu.js';
import * as bear from './accessories/bear.js';
import * as scooterHelmet from './accessories/scooter-helmet.js';

export const ACCESSORIES = {
  boba,
  easycard,
  tanghulu,
  bear,
  scooterHelmet,
};
