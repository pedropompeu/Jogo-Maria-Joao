// tools/check-sw-cache.mjs — falha se um arquivo cacheado pelo SW mudou sem bump do CACHE.
// Sem dependências. O lock (tools/sw-cache.lock.json) guarda o CACHE e o sha256 de cada
// arquivo do ASSETS de sw.js. Mudou arquivo e o CACHE é o mesmo do lock → erro (AUD-02:
// cliente com SW instalado fica no stale eterno).
//
//   node tools/check-sw-cache.mjs            checa (CI)
//   node tools/check-sw-cache.mjs --update   regrava o lock depois do bump

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = join(ROOT, 'tools', 'sw-cache.lock.json');
const UPDATE = process.argv.includes('--update');

const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const cache = sw.match(/const\s+CACHE\s*=\s*['"]([^'"]+)['"]/)?.[1];
const assetsSrc = sw.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\]/)?.[1];
if (!cache || !assetsSrc) {
  console.error('✗  sw.js: não achei `const CACHE` ou `const ASSETS` — atualize este script junto');
  process.exit(1);
}

// './' é servido como index.html, que já está na lista.
const assets = [...assetsSrc.matchAll(/['"]\.\/([^'"]*)['"]/g)].map(m => m[1]).filter(Boolean);

const missing = assets.filter(a => !existsSync(join(ROOT, a)));
if (missing.length) {
  for (const a of missing) console.error(`✗  ASSETS lista ${a}, que não existe no disco`);
  process.exit(1);
}

const sha = p => createHash('sha256').update(readFileSync(join(ROOT, p))).digest('hex');
const current = Object.fromEntries(assets.sort().map(a => [a, sha(a)]));

const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : null;
const before = lock?.assets || {};
const changed = [...new Set([...Object.keys(before), ...Object.keys(current)])]
  .filter(a => before[a] !== current[a])
  .sort();

const write = () => {
  writeFileSync(LOCK, JSON.stringify({ cache, assets: current }, null, 2) + '\n');
  console.log(`✓ sw-cache: lock gravado com ${cache} (${assets.length} arquivos)`);
};

if (!lock) {
  if (UPDATE) { write(); process.exit(0); }
  console.error('✗  tools/sw-cache.lock.json não existe — rode `npm run sw:lock`');
  process.exit(1);
}

if (changed.length && cache === lock.cache) {
  for (const a of changed) console.error(`✗  ${a} mudou`);
  console.error(`\nsw-cache: ${changed.length} arquivo(s) cacheado(s) mudaram e o CACHE continua ` +
    `'${cache}'. Faça o bump em sw.js e depois rode \`npm run sw:lock\`.`);
  process.exit(1);
}

if (UPDATE) { write(); process.exit(0); }

if (cache !== lock.cache) {
  console.error(`✗  sw.js está em '${cache}', mas o lock está em '${lock.cache}' — rode \`npm run sw:lock\``);
  process.exit(1);
}

console.log(`✓ sw-cache ok — ${cache}, ${assets.length} arquivos sem mudança desde o último bump`);
