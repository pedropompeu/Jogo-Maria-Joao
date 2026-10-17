// tests/smoke.mjs — smoke test do jogo em Node, sem dependências.
// Uso: node tests/smoke.mjs            (storage normal)
//      SMOKE_THROW_STORAGE=1 node tests/smoke.mjs  (regressão AUD-03)
// Sai com código 1 se o jogo lançar exceção em init, no "Começar Aventura"
// ou nos primeiros quadros.

import assert from 'node:assert/strict';
import { installBrowserEnv, loadClassicScript } from './browser-env.mjs';

const blocked = process.env.SMOKE_THROW_STORAGE === '1';
const tag = blocked ? 'storage bloqueado' : 'storage normal';

const env = installBrowserEnv({ throwStorage: blocked });

loadClassicScript('characters.js');
loadClassicScript('icons.js');

const { LEVELS } = await import('../levels-data.js');
assert.equal(LEVELS.length, 20, 'o jogo deve ter exatamente 20 fases');

// Init completo roda aqui: loadLvl(0) + primeiro agendamento do loop.
await import('../game.js');

assert.equal(String(env.el('lvlDisp').textContent), '1', 'HUD mostra fase 1 após init');
assert.equal(String(env.el('livesDisp').textContent), '3', 'HUD mostra 3 vidas na dificuldade normal');
assert.equal(String(env.el('bestDisp').textContent), '0', 'recorde começa em 0');

// Primeiro fluxo real do jogador: Começar Aventura!
env.click('startBtn');
assert.ok(!env.el('startScreen').className.includes('show'), 'start screen fecha ao começar');

env.flushFrames(12);

const t = Number(env.el('timeDisp').textContent);
assert.ok(Number.isFinite(t) && t > 0 && t <= LEVELS[0].time,
  `timer rodando dentro do tempo da fase (timeDisp=${env.el('timeDisp').textContent})`);
// O jogador pode pegar a primeira moeda da fase 0 já nos primeiros quadros —
// o que importa é que o placar seja um número sadio, não um valor exato.
const score = Number(env.el('scoreDisp').textContent);
assert.ok(Number.isFinite(score) && score >= 0, `placar sadio (scoreDisp=${env.el('scoreDisp').textContent})`);
assert.equal(String(env.el('livesDisp').textContent), '3', 'vidas seguem em 3 após 12 quadros');
assert.ok(env.pendingFrames() >= 1, 'loop segue agendado após os quadros');

console.log(`✓ smoke ok [${tag}] — init, Começar Aventura e 12 quadros sem exceção`);
process.exit(0);
