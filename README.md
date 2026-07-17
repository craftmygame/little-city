# 🌏 Little City

Real cities turned into tiny, explorable planets you can play in your browser — hand-built,
cel-shaded globes of night markets, temples, and boulevards. We're building one for **every city
in the world**, starting with **Taipei** 台北.

> 🧋 **Come help build your city.** Got some [Claude Code](https://claude.com/claude-code) or Codex
> tokens? Add a landmark, make a building more real, and send a PR. No 3D experience needed.

| City | Status | Play |
|------|--------|------|
| **Little Taipei** 台北 | 🟢 Playable · multiplayer on [Antics](https://antics.gg) | [`/little-taipei/`](little-taipei/) |
| **Little Paris** 🥐 | 🟢 Playable · modular contributor API | [`/little-paris/`](little-paris/) |
| **Your city** | ⚪ Waiting for you | [claim it →](../../issues/new) |

## Run it locally

Serve over HTTP (the games use native JS modules):

```bash
git clone https://github.com/craftmygame/little-city.git
cd little-city && python3 -m http.server 4173
```

Open `http://localhost:4173/little-taipei/`. Move with `WASD`, hop with `Space`, interact with `E`.

We deploy on [Antics](https://antics.gg) because it lets us add multiplayer — rooms, synced
players, emotes, leaderboards — with no server to run. The local build is solo mode; multiplayer
lights up in an Antics deployment.

## Contribute

The map is split into small, self-contained pieces — each one file, no Three.js expertise required.

1. **Pick something small:** a landmark, a more realistic building, some street life.
2. **Read the API:** [`little-paris/paris/CONTEXT_API.md`](little-paris/paris/CONTEXT_API.md).
   Each piece is one module that exports `build(ctx)` and only edits its own file.
3. **Let an agent build it.** Open the repo in Claude Code or Codex and prompt:
   > Read `little-paris/paris/CONTEXT_API.md`. Add a new landmark module for the **Louvre** —
   > one new file exporting `build(ctx)`, placed at its real position with a collider. Serve with
   > `python3 -m http.server` and confirm it renders without console errors.
4. **Open a PR** with a screenshot. One landmark per PR is perfect.

Adding a **whole new city**? Copy the `little-paris/` structure and open an issue so we can help scaffold it.

## License

See [LICENSE](LICENSE). Contributions are accepted under that license.

*Built with [three.js](https://threejs.org) · multiplayer by [Antics](https://antics.gg).* 🌏
