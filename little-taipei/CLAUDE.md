# Little Taipei — working notes

A tiny-planet Taipei browser game (Three.js). The city is split into three layers —
`city/taipei.js` (where/how big), `buildings/` (what things look like), and `main.js`
(rendering + gameplay). See [CONTRIBUTING.md](CONTRIBUTING.md) for the authoring model.

## Local dev

```bash
npm start        # serves at http://localhost:4173/
npm run check    # validates city data + syntax-checks main.js and taipei-landmarks.js
```

Run `npm run check` after every city-data change.

## Deploy to Antics

The game is hosted on [Antics](https://antics.gg). Deploy with:

```bash
npm run check    # always validate first
npm run deploy   # bundles the runtime files and uploads via antics-mcp
```

`npm run deploy` runs [`deploy-antics.mjs`](deploy-antics.mjs), which:

1. Reads the 10 runtime files the game needs at play time and bundles them into a
   path→content map:
   `index.html`, `styles.css`, `main.js`, `taipei-landmarks.js`,
   `buildings/{landmarks,markets,shops,transit}.js`, `city/{taipei,validate}.js`.
   (Everything else — plans, screenshots, `scripts/`, this file — is dev-only and is
   NOT uploaded. If you add a new runtime module, add it to the `FILES` array in
   `deploy-antics.mjs` or the game will 404 on it.)
2. Spawns `npx -y antics-mcp` and calls its `deploy_game` tool over stdio (JSON-RPC).
   The MCP server handles Antics auth itself, so no API keys or credential files are
   read by the script.
3. Prints the play URL, e.g. `https://antics.gg/g/<hash>`. That link redirects to a
   fresh `/r/<CODE>` room — share the room link so others join the same session.

Multiplayer uses the same-origin Antics SDK: `main.js` imports `/sdk/v1.js` and calls
`joinRoom({ name })` (keyless — no project key in code).

### Keyless vs. keyed

`npm run deploy` is **keyless**: the link stays live for 24h with 8-player rooms and no
persistent leaderboard. To make a deploy permanent (persistent leaderboards, 16-player
rooms), log in once and redeploy:

```bash
npx antics-cli login
npm run deploy
```

### Verify a deploy

Load the printed `https://antics.gg/g/<hash>` URL, press **BEGIN**, and confirm the game
spawns on Renai Road with Taipei 101 on the right and Sun Yat-sen Memorial Hall on the
left. The Antics header should show "1 playing", which confirms the SDK joined the room.
