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
