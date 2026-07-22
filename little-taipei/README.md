# Little Taipei 🧋

A tiny-planet Taipei browser game (Three.js). You're the neighbourhood runner —
carry bubble tea and xiaolongbao between neighbours, from the night markets to
Taipei 101.

```bash
npm start        # serves at http://localhost:4173/
npm run check    # validate city data + syntax-check the runtime JS
npm run deploy   # bundle + upload to Antics (see CLAUDE.md for details)
```

How the city is authored (layers, landmarks, ground pads): [CONTRIBUTING.md](CONTRIBUTING.md).
Working notes and deploy specifics: [CLAUDE.md](CLAUDE.md).

## Dev URL flags

All camera flags share the `cam` prefix. They are dev-only: none of them are
reachable from the shipped UI, and plain URLs always get the default rig —
locked follow with the comfort tuning built in (capped auto-follow spin,
hop-stable frame, no speed look-ahead or delivery punch-ins).

| Flag | Values | Does |
|---|---|---|
| `?cam=` | `locked` (default) · `pitch-look` · `yaw-look` · `less-freelook` · `freelook` | Pick a camera control prototype — who steers the camera |
| `?cam-preview` | — | Show the bottom-left **Camera rig · dev** strip to switch modes live (buttons rewrite the URL, so test states are shareable) |

Example — full lab: `http://localhost:4173/?cam-preview&cam=pitch-look`

Console helpers (DevTools): `__cameraControls('freelook')`,
`__cam(dist, pitch, yaw)`, `__camMode('map')`, plus the `__game` handle.
Background: [plans/camera-prototype-plan.md](plans/camera-prototype-plan.md).
