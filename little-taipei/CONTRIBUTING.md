# Contributing to Little Taipei

The city is intentionally split into three layers:

- [`city/taipei.js`](city/taipei.js) — where things are and how large they are.
- [`buildings/`](buildings/) — what landmarks and storefronts look like.
- [`main.js`](main.js) — rendering and gameplay. City contributions rarely need to change it.

Coordinates use `[eastKm, northKm]` relative to Taipei 101. Negative values mean west or south.
Run `npm run check` after every city-data change and `npm start` to review it at
<http://localhost:4173/>.

## Add or move a building

1. Build the local-space model in the relevant file under [`buildings/`](buildings/). A builder
   receives `CTX`, returns a `CTX.group()`, places its base at `y = 0`, uses `+Y` as up, and faces
   its public entrance toward `+Z`.
2. Export the builder from that file and from [`taipei-landmarks.js`](taipei-landmarks.js) if you
   created a new category file.
3. Add one object to `landmarks` or `shops` in [`city/taipei.js`](city/taipei.js):

```js
{
  id: 'example-library',
  name: 'Example Library',
  builder: 'buildExampleLibrary',
  at: [-2.4, 1.1],
  placement: { foot: 3.2, ar: 2.4, labelY: 5, face: 90, base: '#d8d2c4' },
}
```

Use `foot` for spacing, `ar` for a simple circular collision area, `face` for clockwise degrees,
and `labelY` for the floating-label height. Complex walkable compounds can use `cols`, as the
existing temple and market entries demonstrate.

## Add or change a road

Edit `roads` in [`city/taipei.js`](city/taipei.js). The runtime creates its sidewalk, asphalt,
centre line, building clearance, trees, and lights from one definition:

```js
{
  id: 'example-road',
  name: 'Example Road',
  widthKm: 0.22,
  path: [[-3.0, 1.0], [-1.0, 1.1], [1.5, 0.9]],
}
```

Keep path points in geographic order and use at least two points.

## Add or change an open space

Edit `spaces.parks` in [`city/taipei.js`](city/taipei.js):

```js
{ id: 'example-park', name: 'Example Park', at: [-1.2, -0.8], radiusKm: 0.45 }
```

Parks affect ground colour, procedural building density, and greenery. Add a matching entry to
`spaces.ponds` only when the park needs visible water.

## Before opening a PR

1. Run `npm run check`.
2. Run `npm start` and reload the game with the browser console open.
3. Confirm the welcome screen appears, press **BEGIN**, and visit the changed area.
4. Keep a PR focused on one place or one related group of city-data edits.
