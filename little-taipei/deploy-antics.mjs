import fs from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT = new URL('./', import.meta.url);

// Deploy under the "Tiny Planet Taipei 台北" project so the play URL is stable
// (updates in place), rooms hold 16 players, and leaderboards persist. Requires a
// one-time `npx antics-cli login`. Override with ANTICS_PROJECT= to target another
// project, or ANTICS_PROJECT=none for a throwaway keyless deploy.
const PROJECT_ENV = process.env.ANTICS_PROJECT;
const PROJECT_ID =
  PROJECT_ENV === 'none'
    ? undefined
    : PROJECT_ENV || '713da0a7-8a8f-4685-842d-8121c91953a8';

const FILES = [
  'index.html',
  'styles.css',
  'main.js',
  'taipei-landmarks.js',
  'character.js',
  'accessories.js',
  'accessories/boba.js',
  'accessories/easycard.js',
  'accessories/tanghulu.js',
  'accessories/bear.js',
  'accessories/scooter-helmet.js',
  'buildings/landmarks.js',
  'buildings/markets.js',
  'buildings/shops.js',
  'buildings/transit.js',
  'city/taipei.js',
  'city/validate.js',
];

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, ROOT), 'utf8');
}

const deployment = {
  name: 'Taipei',
  files: Object.fromEntries(FILES.map((file) => [file, read(file)])),
};

const child = spawn('npx', ['-y', 'antics-mcp'], {
  cwd: new URL('.', ROOT),
  stdio: ['pipe', 'pipe', 'inherit'],
});

let nextId = 1;
let stdout = '';
const pending = new Map();

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
  for (;;) {
    const newline = stdout.indexOf('\n');
    if (newline === -1) break;
    const line = stdout.slice(0, newline).trim();
    stdout = stdout.slice(newline + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    if (message.id == null || !pending.has(message.id)) continue;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});

child.on('exit', (code) => {
  if (code === 0 || pending.size === 0) return;
  const error = new Error(`antics-mcp exited with code ${code}`);
  for (const { reject } of pending.values()) reject(error);
  pending.clear();
});

function request(method, params = {}) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
}

function deploymentText(result) {
  return (result.content ?? [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n');
}

try {
  await request('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'claude-code', version: '1.0' },
  });
  notify('notifications/initialized');

  const { tools } = await request('tools/list');
  if (!tools.some((tool) => tool.name === 'deploy_game')) {
    throw new Error('Antics MCP did not expose deploy_game');
  }

  const bytes = Object.values(deployment.files).reduce(
    (total, content) => total + Buffer.byteLength(content),
    0,
  );
  const target = PROJECT_ID ? `project ${PROJECT_ID}` : 'keyless (24h)';
  console.log(`Deploying ${deployment.name} → ${target}: ${Object.keys(deployment.files).length} files, ${bytes} bytes`);
  const result = await request('tools/call', {
    name: 'deploy_game',
    arguments: PROJECT_ID
      ? { files: deployment.files, projectId: PROJECT_ID }
      : { files: deployment.files },
  });
  if (result.isError) throw new Error(`${deployment.name}: ${deploymentText(result)}`);
  console.log(`${deployment.name}: ${deploymentText(result)}`);
} finally {
  child.stdin.end();
}
