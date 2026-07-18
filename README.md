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

1. **Pick something small:** a missing landmark, a road or park correction, or a building that
   could look more real.
2. **Edit the city data** in [`little-taipei/city/taipei.js`](little-taipei/city/taipei.js). Roads,
   parks, transit, landmarks and shops all use named, validated records with real kilometre
   coordinates relative to Taipei 101.
3. **Change building geometry** in the focused files under
   [`little-taipei/buildings/`](little-taipei/buildings/). Each `build…(CTX)` function returns a
   local-space group with its base at the origin, `+Y` up, and its entrance facing `+Z`.
   [`little-taipei/CONTRIBUTING.md`](little-taipei/CONTRIBUTING.md) has copyable recipes.
4. **Let an agent do it.** Open the repo in Claude Code or Codex and prompt:
   > Follow `little-taipei/CONTRIBUTING.md`. Add the **Dragon Mountain / a new landmark** in the
   > appropriate `buildings/` file, place it in `city/taipei.js`, run `npm run check`, then serve
   > the city and confirm it renders without console errors.
5. **Open a PR** with a screenshot. One landmark per PR is perfect.

## License

See [LICENSE](LICENSE). Contributions are accepted under that license.

*Built with [three.js](https://threejs.org) · multiplayer by [Antics](https://antics.gg).* 🌏
