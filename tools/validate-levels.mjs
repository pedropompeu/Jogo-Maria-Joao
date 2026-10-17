// tools/validate-levels.mjs — validador estático das fases (sem dependências).
// Roda no CI: pega erro de conteúdo que só apareceria durante o playtest —
// spawn dentro de parede, portal flutuando no vazio, tipo de inimigo
// inexistente, plataforma móvel sem parâmetros etc.
// Sai com código 1 se houver erro; avisos não derrubam.

import { LEVELS } from '../levels-data.js';

const EXPECTED_LEVELS = 20;
const PLAT_TYPES = new Set(['static', 'moving', 'cloud', 'crumble']);
const ENEMY_TYPES = new Set(['slime', 'bat', 'spike', 'bee']);
const POWERUP_TYPES = new Set(['star', 'speed', 'shield', 'magnet']);
const PLAYER_W = 44, PLAYER_H = 52, PORTAL_W = 52, PORTAL_H = 72;

const errors = [];
const warnings = [];
const fail = (lvl, msg) => errors.push(`Fase ${lvl}: ${msg}`);
const warn = (lvl, msg) => warnings.push(`Fase ${lvl}: ${msg}`);

const overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Existe plataforma cujo topo está na janela [y, y+tol] cobrindo o x?
const surfacesUnder = (plats, x, y, tol = 120) =>
  plats.some(([px, py, pw]) => x >= px && x <= px + pw && py >= y && py <= y + tol);

const isPair = e => Array.isArray(e) && e.length === 2 && e.every(Number.isFinite);

if (LEVELS.length !== EXPECTED_LEVELS) {
  fail('-', `esperava ${EXPECTED_LEVELS} fases, encontrei ${LEVELS.length} ` +
    `(se a mudança é intencional, atualize README/SW/winScreen e este validador)`);
}

LEVELS.forEach((L, i) => {
  const n = i + 1;

  if (!L || typeof L !== 'object') return fail(n, 'fase inválida');
  for (const f of ['name', 'emoji', 'theme', 'tip']) {
    if (typeof L[f] !== 'string' || !L[f]) fail(n, `campo \`${f}\` ausente ou vazio`);
  }
  for (const f of ['time', 'lw', 'gY']) {
    if (!Number.isFinite(L[f]) || L[f] <= 0) fail(n, `campo \`${f}\` inválido (${L[f]})`);
  }
  if (!Array.isArray(L.plats) || L.plats.length === 0) return fail(n, 'sem plataformas');

  // ── plataformas
  L.plats.forEach((p, j) => {
    if (!Array.isArray(p) || p.length < 5) return fail(n, `plataforma ${j} malformada`);
    const [x, y, w, h, type, dx, range] = p;
    if (![x, y, w, h].every(Number.isFinite)) fail(n, `plataforma ${j} com geometria inválida`);
    if (w <= 0 || h <= 0) fail(n, `plataforma ${j} com w/h <= 0`);
    if (!PLAT_TYPES.has(type)) fail(n, `plataforma ${j} com tipo desconhecido: ${type}`);
    if (type === 'moving' && (!Number.isFinite(dx) || !Number.isFinite(range) || dx === 0 || range <= 0)) {
      fail(n, `plataforma ${j} 'moving' sem dx/range válidos`);
    }
  });

  // ── spawn
  if (!isPair(L.start)) {
    fail(n, 'start ausente ou inválido');
  } else {
    const [sx, sy] = L.start;
    if (sx < 0 || sx > L.lw) fail(n, `start fora dos limites (x=${sx}, lw=${L.lw})`);
    const box = { x: sx, y: sy, w: PLAYER_W, h: PLAYER_H };
    L.plats.filter(p => p[4] === 'static').forEach(([px, py, pw, ph], j) => {
      if (overlap(box, { x: px, y: py, w: pw, h: ph }) && py < sy + PLAYER_H - 2) {
        fail(n, `start dentro de parede (plataforma ${j} em [${px},${py}])`);
      }
    });
    if (!surfacesUnder(L.plats, sx, sy + PLAYER_H)) warn(n, 'nenhuma superfície logo abaixo do start (queda longa?)');
  }

  // ── portal e boss
  // O portal pode afundar na plataforma de pouso (padrão de design em Nuvens/
  // Caverna/Templo); o que não pode é ficar sem nenhuma plataforma por perto.
  if (L.hasBoss && !Number.isFinite(L.bossX)) warn(n, 'fase com boss sem bossX (usa default 3500)');
  if (!isPair(L.portal)) {
    fail(n, 'portal ausente ou inválido');
  } else {
    const [px, py] = L.portal;
    if (px < 0 || px > L.lw) fail(n, `portal fora dos limites (x=${px}, lw=${L.lw})`);
    const cx = px + PORTAL_W / 2;
    if (!surfacesUnder(L.plats, cx, py - 40, 240)) {
      warn(n, 'portal sem plataforma por perto (confirme que dá para alcançar)');
    }
  }

  // ── inimigos
  // Nota: o motor não aplica gravidade a inimigos — `null` em y significa
  // "voa na altura do plano do chão" (gY-38), inclusive sobre vãos
  // (spikes da Caverna). Não exigir plataforma embaixo evita falso positivo.
  (L.enemies || []).forEach((e, j) => {
    if (!Array.isArray(e) || e.length < 3) return fail(n, `inimigo ${j} malformado`);
    const [ex, , type] = e;
    if (!Number.isFinite(ex)) fail(n, `inimigo ${j} sem x`);
    if (ex < 0 || ex > L.lw) fail(n, `inimigo ${j} fora dos limites (x=${ex}, lw=${L.lw})`);
    if (!ENEMY_TYPES.has(type)) fail(n, `inimigo ${j} com tipo desconhecido: ${type}`);
  });

  // ── coletáveis
  (L.coins || []).forEach((c, j) => {
    if (!isPair(c)) return fail(n, `moeda ${j} malformada`);
    if (c[0] < 0 || c[0] > L.lw || c[1] < 0 || c[1] > L.gY) fail(n, `moeda ${j} fora do mapa (${c})`);
  });
  (L.hearts || []).forEach((h, j) => {
    if (!isPair(h)) return fail(n, `coração ${j} malformado`);
    if (h[0] < 0 || h[0] > L.lw || h[1] < 0 || h[1] > L.gY) fail(n, `coração ${j} fora do mapa (${h})`);
  });

  // ── checkpoints
  (L.cps || []).forEach((c, j) => {
    if (!isPair(c)) return fail(n, `checkpoint ${j} malformado`);
    const onSurface = L.plats.some(([px, py, pw]) =>
      c[0] >= px && c[0] <= px + pw && Math.abs(py - c[1]) <= 8);
    if (!onSurface) warn(n, `checkpoint ${j} (${c}) não está sobre uma plataforma`);
  });

  // ── power-ups e hazards
  (L.powerups || []).forEach((u, j) => {
    if (!Array.isArray(u) || u.length < 3) return fail(n, `power-up ${j} malformado`);
    if (!POWERUP_TYPES.has(u[2])) fail(n, `power-up ${j} com tipo desconhecido: ${u[2]}`);
    if (!Number.isFinite(u[0]) || !Number.isFinite(u[1]) || u[0] < 0 || u[0] > L.lw) fail(n, `power-up ${j} fora do mapa`);
  });
  (L.hazards || []).forEach((h, j) => {
    if (!Array.isArray(h) || h.length < 5 || !h.slice(0, 4).every(Number.isFinite)) {
      return fail(n, `hazard ${j} malformado`);
    }
    if (h[2] <= 0 || h[3] <= 0) fail(n, `hazard ${j} com w/h <= 0`);
  });
});

for (const w of warnings) console.log(`⚠  ${w}`);
for (const e of errors) console.error(`✗  ${e}`);

if (errors.length) {
  console.error(`\nvalidate-levels: ${errors.length} erro(s), ${warnings.length} aviso(s)`);
  process.exit(1);
}
console.log(`✓ validate-levels ok — ${LEVELS.length} fases válidas, ${warnings.length} aviso(s)`);
