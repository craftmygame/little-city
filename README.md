# 🌏 Little Taipei 台北

Taipei, turned into a tiny explorable planet you can play in your browser — a hand-built,
cel-shaded globe of night markets, temples, Taipei 101, and the river, placed by real bearing and
distance so it *feels* like the city. It's the first of many: we want to build a little planet for
**every city in the world**, and we're starting here.

> 🧋 **Come help make Taipei more real.** Got some [Claude Code](https://claude.com/claude-code) or
> Codex tokens? Add a landmark, improve a building, and send a PR. No 3D experience needed.

## Run it locally

Serve over HTTP (the game uses native JS modules):

```bash
git clone https://github.com/craftmygame/little-city.git
cd little-city && python3 -m http.server 4173
```

Open `http://localhost:4173/little-taipei/`. Move with `WASD`, hop with `Space`, interact with `E`.

We deploy on [Antics](https://antics.gg) because it lets us add multiplayer — rooms, synced
players, emotes, leaderboards — with no server to run. The local build is solo mode; multiplayer
lights up in an Antics deployment.

## Contribute

The city is made of small, self-contained landmark models — a great fit for an AI agent and an
easy first PR.

1. **Pick something small:** a missing landmark, or a building that could look more real.
2. **Write a builder** in [`little-taipei/taipei-landmarks.js`](little-taipei/taipei-landmarks.js).
   Each one is a `build…(CTX)` function that returns a local-space `THREE.Group` (base at origin,
   `+Y` up, front facing `+Z`) using the `CTX` helpers — `box`, `cyl`, `cone`, `sph`, `toon`, `group`.
3. **Place it** in `little-taipei/index.html` with `placeLandmark(LM.buildYourThing, xkm, ykm, …)`,
   where `xkm`/`ykm` are real kilometres east/north of Taipei 101.
4. **Let an agent do it.** Open the repo in Claude Code or Codex and prompt:
   > Look at how landmarks are built in `little-taipei/taipei-landmarks.js` and placed with
   > `placeLandmark(...)` in `little-taipei/index.html`. Add the **Dragon Mountain / a new
   > landmark** the same way, at its real km offset from Taipei 101, then serve with
   > `python3 -m http.server` and confirm it renders without console errors.
5. **Open a PR** with a screenshot. One landmark per PR is perfect.

## License

See [LICENSE](LICENSE). Contributions are accepted under that license.

*Built with [three.js](https://threejs.org) · multiplayer by [Antics](https://antics.gg).* 🌏
