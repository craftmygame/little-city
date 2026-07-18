/**
 * Public building catalog.
 *
 * Keep this small barrel stable: the city definition references these exported
 * builder names, while contributors can work in the focused files below.
 */
export * from './buildings/landmarks.js';
export * from './buildings/markets.js';
export * from './buildings/shops.js';
export * from './buildings/transit.js';
