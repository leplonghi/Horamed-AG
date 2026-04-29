#!/usr/bin/env node
// Fails fast if required env vars are missing before vite build bakes in empty strings.
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// Load .env and .env.production like Vite does
function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, 'utf-8').split('\n');
  return Object.fromEntries(
    lines
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => l.split('=').map((p, i) => (i === 0 ? p : l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, ''))))
      .filter(([k]) => k)
  );
}

const env = {
  ...parseEnvFile(resolve(root, '.env')),
  ...parseEnvFile(resolve(root, '.env.production')),
  ...process.env,
};

const missing = REQUIRED.filter(k => !env[k]);

if (missing.length > 0) {
  console.error('\n\x1b[31m✕ Build aborted: missing required environment variables:\x1b[0m');
  missing.forEach(k => console.error(`  \x1b[33m${k}\x1b[0m`));
  console.error('\n\x1b[36mFix: copy .env.production from the main repo to this directory before building.\x1b[0m\n');
  process.exit(1);
}

console.log('\x1b[32m✓ Environment variables OK\x1b[0m');
