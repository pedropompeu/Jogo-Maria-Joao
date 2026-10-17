'use strict';
// ─── characters.js — MagiaEstelar v2.0 ─────────────────────────────────────
// Unicorn + enemies: expressões por estado, antenas graciosas, olhos relha.
// Funções globais prefixadas com ch_ (chamadas de game.js via thin wrapper).
// Todas recebem `ctx` explicitamente — sem acesso a globals do IIFE.

// ── Leg helper ───────────────────────────────────────────────────────────────
function ch_drawLeg(ctx, bx, by, swing, topCol, hoofCol) {
  const s  = Math.sin(swing) * 7;
  const ex = bx + s * 0.5;
  const ey = by + 16;
  const lg = ctx.createLinearGradient(bx, by, ex, ey);
  lg.addColorStop(0, topCol); lg.addColorStop(1, hoofCol);
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(bx-4, by); ctx.lineTo(bx+4, by);
  ctx.lineTo(ex+3, ey); ctx.lineTo(ex-3, ey);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#cc77aa';
  ctx.beginPath(); ctx.ellipse(ex, ey+3, 4.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#aa5588';
  ctx.beginPath(); ctx.ellipse(ex, ey+3.5, 4.5, 1.5, 0, 0, Math.PI); ctx.fill();
}

// ── Unicorn (player) ─────────────────────────────────────────────────────────
// Boneco articulado só com código (esboço v16 aprovado por Pedro em 2026-10-17):
// cabeça grande de bebê, olhos 3/4 com brilho, contorno leve, chifre dourado em
// espiral e crina/rabo/franja de fios arco-íris com física de verdade — cada fio é
// uma corrente de pontos de comprimento fixo, presa na raiz, com inércia, ar e vento.
// Coordenadas locais: centro do corpo em (0,0), chão em y=+26 (= pé da hitbox).
const _chU = (() => {
const TAU = Math.PI * 2;
const OUT = '#a35680';   // contorno: ameixa clara, não mais quase preto
const OW = 1.1;          // espessura do contorno (antes 2)
const PAL = {
  body: '#ffc4e1', shade: '#f6a9d0', muzzle: '#ffe8f2', hoof: '#ff7eb3', earIn: '#ff9cc8',
  blush: 'rgba(255,110,165,0.5)', eye: '#3a1d4d', eyeLow: '#7a4fa8',
  mane: ['#ff8fa3', '#ffb26b', '#ffe07a', '#7ed9c6', '#86b4ff', '#b98cf0'],
  rainbow: ['#ff8a9a', '#ffb26b', '#ffe27a', '#9be07f', '#7fb6ff', '#b98cf0'],  // vermelho → violeta, em tom pastel
  gold: '#ffd44f', goldDark: '#d7951b',
};
const GROUND = 26;
const BX = 0;   // centro do corpo (antes -3): corpo e patas mais para frente, sob a cabeça

const inOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// cor do arco-íris para a posição s (0..1); fios vizinhos alternam um tom mais claro
// k > 0 clareia (rumo ao branco); k < 0 escurece (rumo à cor do contorno)
function tint(c, k) {
  const n = parseInt(c.slice(1), 16), o = k > 0 ? [255, 255, 255] : [163, 86, 128], a = Math.abs(k);
  const m = (v, w) => Math.round(v + (w - v) * a);
  return `rgb(${m(n >> 16, o[0])},${m((n >> 8) & 255, o[1])},${m(n & 255, o[2])})`;
}
function rainbowAt(s, i, k = 0) {
  const c = PAL.rainbow[Math.min(5, Math.floor(s * 6))];
  return tint(c, k + (i % 2 ? 0.3 : 0));
}
// estrelinha de brilho de 4 pontas, piscando
function sparkle(ctx, x, y, r) {
  if (r < 0.15) return;
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = 'rgba(215,149,27,0.7)'; ctx.lineWidth = 0.35; ctx.stroke();
}

// Fio de cabelo: largo na raiz, um pouco mais cheio no meio e afinando até a ponta,
// ao longo dos pontos simulados (h.pts). u0..u1 = trecho do fio (0 = raiz, 1 = ponta).
function hairPts(h, u0 = 0, u1 = 1, N = 14) {
  const P = h.pts, M = P.length - 1, pts = [];
  for (let k = 0; k <= N; k++) {
    const u = u0 + (u1 - u0) * k / N, f = u * M, i = Math.min(M - 1, Math.floor(f)), r = f - i;
    pts.push({ x: lerp(P[i].x, P[i + 1].x, r), y: lerp(P[i].y, P[i + 1].y, r),
      hw: h.w * 0.5 * Math.pow(1 - u, 0.6) * (0.9 + 0.3 * Math.sin(u * Math.PI)) });
  }
  pts.forEach((q, k) => {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(N, k + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    q.nx = -(b.y - a.y) / d; q.ny = (b.x - a.x) / d;
  });
  return pts;
}
function hairPath(ctx, h) {
  const pts = hairPts(h, 0, 1, 26);
  ctx.beginPath();
  pts.forEach((q, k) => k ? ctx.lineTo(q.x + q.nx * q.hw, q.y + q.ny * q.hw) : ctx.moveTo(q.x + q.nx * q.hw, q.y + q.ny * q.hw));
  for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k].x - pts[k].nx * pts[k].hw, pts[k].y - pts[k].ny * pts[k].hw);
  ctx.closePath();
}
// Mecha inteira: contorno de todos os fios primeiro (silhueta limpa), depois cada fio com sua cor,
// uma linha fininha separando os fios e um brilho no meio.
function hair(ctx, list, sc = 1) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const h of list) { hairPath(ctx, h); ctx.strokeStyle = OUT; ctx.lineWidth = OW * 2 * sc; ctx.stroke(); }
  for (const h of list) {
    hairPath(ctx, h); ctx.fillStyle = h.c; ctx.fill();
    ctx.strokeStyle = 'rgba(163,86,128,0.28)'; ctx.lineWidth = 0.5 * sc; ctx.stroke();
    if (h.back) continue;   // camada de trás: só cor, sem brilho (dá profundidade)
    const line = (u0, u1, a, wk) => {
      const q = hairPts(h, u0, u1, 6);
      ctx.beginPath(); q.forEach((pt, k) => k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = Math.max(0.5 * sc, h.w * wk); ctx.stroke();
    };
    line(0.1, 0.72, 0.5, 0.14);    // fio de luz ao longo do cabelo
    line(0.22, 0.36, 0.8, 0.4);    // faixa de brilho (todos os fios na mesma altura formam um "anel" de luz)
  }
}
// ---- Simulação do cabelo ----
// Cada fio vira SIM_N+1 pontos. O formato desenhado (a Bézier) é o "penteado": cada pedaço do fio
// tenta apontar para onde apontaria no penteado (firme perto da raiz, solto na ponta), mas tem peso,
// então chega atrasado quando a cabeça se mexe, passa do ponto e balança. O comprimento nunca muda.
const SIM_N = 10;
function createHairSim() { return { t: null, strands: {} }; }
const rand01 = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
function restPts(h, M) {
  const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = h.p, out = [];
  for (let k = 0; k <= SIM_N; k++) {
    const u = k / SIM_N, v = 1 - u;
    const x = v * v * v * x0 + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * x1;
    const y = v * v * v * y0 + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * y1;
    out.push({ x: M.a * x + M.c * y + M.e, y: M.b * x + M.d * y + M.f });
  }
  return out;
}
function stepStrand(s, R, P, rnd, E, tt, seed) {
  const h = E.h, N = R.length - 1, damp = Math.exp(-P.c * h), W = E.wind;
  const old = s.p, np = [{ x: R[0].x, y: R[0].y }];
  const v0 = { x: (R[0].x - old[0].x) / h, y: (R[0].y - old[0].y) / h };
  const F = old.map(() => ({ x: 0, y: 0 }));
  for (let k = 1; k <= N; k++) {
    const u = k / N, v = s.v[k], pv = k > 1 ? s.v[k - 1] : v0;
    // mola entre vizinhos: o pedaço quer ter a direção do penteado; puxa o filho e é puxado de volta (ação e reação)
    const K = P.k0 * (1 - u) * (1 - u) + P.k1 * rnd, Cr = Math.min(2 * P.z * Math.sqrt(K), 0.25 / h);   // limite: mais que isso o passo treme
    const ex = old[k].x - old[k - 1].x - (R[k].x - R[k - 1].x), ey = old[k].y - old[k - 1].y - (R[k].y - R[k - 1].y);
    const fx = -K * ex - Cr * (v.x - pv.x), fy = -K * ey - Cr * (v.y - pv.y);
    F[k].x += fx; F[k].y += fy; F[k - 1].x -= fx; F[k - 1].y -= fy;
    // ar: vento do andar + rajadinhas que mudam ao longo do fio (cada fio no seu ritmo)
    const gust = W.gust * u, cd = P.cd * (0.3 + 0.7 * u);
    F[k].x += cd * (W.x + gust * Math.sin(tt * 6.3 + seed * 1.9 - k * 0.8) - v.x);
    F[k].y += cd * 0.4 * (gust * 1.7 * Math.sin(tt * 8.7 + seed * 2.3 - k * 0.9) - v.y) + E.fall;   // no ar, cai junto com o corpo
  }
  for (let k = 1; k <= N; k++) {
    const v = s.v[k];
    v.x = (v.x + F[k].x * h) * damp; v.y = (v.y + F[k].y * h) * damp;
    np.push({ x: old[k].x + v.x * h, y: old[k].y + v.y * h });
  }
  // comprimento fixo: cada pedaço volta ao seu tamanho corrigindo as duas pontas (a raiz não se mexe);
  // a velocidade sai do deslocamento real, então a correção só tira energia, nunca põe.
  const Ls = [0];
  for (let k = 1; k <= N; k++) Ls.push(Math.hypot(R[k].x - R[k - 1].x, R[k].y - R[k - 1].y));
  for (let it = 0; it < 6; it++) {
    for (let k = 1; k <= N; k++) {
      const a = np[k - 1], b = np[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      const c = (d - Ls[k]) / d, wa = k > 1 ? 0.5 : 0, wb = 1 - wa;
      a.x += dx * c * wa; a.y += dy * c * wa; b.x -= dx * c * wb; b.y -= dy * c * wb;
    }
  }
  // dobra máxima: perto da raiz o fio quase não sai do penteado; a ponta pode virar bem mais.
  // Assim a crina não passa por cima da cabeça nem o rabo por cima da garupa.
  for (let k = 1; k <= N; k++) {
    const rx = R[k].x - R[k - 1].x, ry = R[k].y - R[k - 1].y;
    const dx = np[k].x - np[k - 1].x, dy = np[k].y - np[k - 1].y;
    const ang = Math.atan2(rx * dy - ry * dx, rx * dx + ry * dy), lim = P.b0 + P.b1 * (k / N);
    if (Math.abs(ang) > lim) {
      const a = Math.sign(ang) * lim, L = Ls[k] / (Math.hypot(rx, ry) || 1), cs = Math.cos(a), sn = Math.sin(a);
      const nx = np[k - 1].x + (rx * cs - ry * sn) * L, ny = np[k - 1].y + (rx * sn + ry * cs) * L;
      const ox = nx - np[k].x, oy = ny - np[k].y;
      for (let j = k; j <= N; j++) { np[j].x += ox; np[j].y += oy; }
    }
  }
  for (let k = 1; k <= N; k++) { s.v[k].x = (np[k].x - old[k].x) / h; s.v[k].y = (np[k].y - old[k].y) / h; }
  s.p = np;
}
function smoothPts(P, sub) {
  const out = [], N = P.length - 1, g = i => P[Math.max(0, Math.min(N, i))];
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  for (let k = 0; k < N; k++) {
    const p0 = g(k - 1), p1 = g(k), p2 = g(k + 1), p3 = g(k + 2);
    for (let j = 0; j < sub; j++) out.push({ x: cr(p0.x, p1.x, p2.x, p3.x, j / sub), y: cr(p0.y, p1.y, p2.y, p3.y, j / sub) });
  }
  out.push({ x: P[N].x, y: P[N].y });
  return out;
}
// Simula e desenha um grupo de fios. O espaço da simulação é o do começo do desenho (chão parado),
// então pulo, galope e balanço da cabeça chegam ao cabelo como movimento de verdade.
function simHair(ctx, E, list, P) {
  const M = E.M0i.multiply(ctx.getTransform());
  const sc = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c));
  for (const h of list) {
    const rest = restPts(h, M);
    let s = E.sim.strands[h.id];
    if (!s || E.reset) s = E.sim.strands[h.id] = { p: rest.map(o => ({ ...o })), v: rest.map(() => ({ x: 0, y: 0 })), r: rest };
    const rnd = 0.75 + 0.5 * rand01(h.seed);
    for (let j = 1; j <= E.n; j++) {
      const f = j / E.n;
      const R = s.r.map((o, k) => ({ x: lerp(o.x, rest[k].x, f), y: lerp(o.y, rest[k].y, f) }));
      stepStrand(s, R, P, rnd, E, E.t - E.dt * (1 - f), h.seed);
    }
    s.r = rest;
    h.pts = smoothPts(s.p, 3); h.w *= sc;
  }
  ctx.save(); ctx.setTransform(E.M0); hair(ctx, list, sc); ctx.restore();
  return sc;
}
function sparkleOn(ctx, E, list, id, u, r, sc) {
  const h = list.find(o => o.id === id); if (!h) return;
  const q = h.pts[Math.round(u * (h.pts.length - 1))];
  ctx.save(); ctx.setTransform(E.M0); sparkle(ctx, q.x, q.y, r * sc); ctx.restore();
}
// rigidez perto da raiz (k0) e na ponta (k1), amortecimento entre vizinhos (z), amortecimento geral (c),
// resistência do ar (cd) e dobra máxima de cada pedaço em radianos: b0 na raiz, b0 + b1 na ponta
const PHYS = { mane: { k0: 1100, k1: 100, z: 0.7, c: 1.2, cd: 3.4, b0: 0.35, b1: 1.1 }, tail: { k0: 900, k1: 80, z: 0.6, c: 1.1, cd: 3.6, b0: 0.4, b1: 1.2 }, fringe: { k0: 2600, k1: 420, z: 0.8, c: 2, cd: 1.5, b0: 0.3, b1: 0.6 } };

const qd = (a, b, c, s) => a * (1 - s) * (1 - s) + 2 * b * (1 - s) * s + c * s * s;

function blob(ctx, fill, draw) {
  ctx.beginPath(); draw(); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = OW; ctx.lineJoin = 'round'; ctx.stroke();
}

// Perna: coxa larga em cima afinando até o joelho, canela reta e casco.
// Ângulo 0 = reta para baixo; positivo = casco para trás. a1 = coxa, a2 = canela (absoluto).
const LEG_W = 7;
function legGeom(hx, hy, a1, a2, L1, L2, topW, legW = LEG_W) {
  const kx = hx - Math.sin(a1) * L1, ky = hy + Math.cos(a1) * L1;
  const fx = kx - Math.sin(a2) * L2, fy = ky + Math.cos(a2) * L2;
  return { hx, hy, kx, ky, fx, fy, a1, topW, legW };
}

// Desenha a perna em duas passadas: 'out' (contorno, por baixo de tudo) e 'fill' (cor por cima).
// Fazendo o contorno de corpo + patas antes de qualquer cor, as linhas internas somem e vira uma peça só.
function legShape(ctx, g, pass, color) {
  const px = Math.cos(g.a1), py = Math.sin(g.a1);
  const tw = g.topW / 2, kw = g.legW / 2;
  const thigh = () => {
    ctx.beginPath();
    ctx.moveTo(g.hx + px * tw, g.hy + py * tw); ctx.lineTo(g.kx + px * kw, g.ky + py * kw);
    ctx.lineTo(g.kx - px * kw, g.ky - py * kw); ctx.lineTo(g.hx - px * tw, g.hy - py * tw); ctx.closePath();
    ctx.moveTo(g.hx + tw, g.hy); ctx.arc(g.hx, g.hy, tw, 0, TAU);
    ctx.moveTo(g.kx + kw, g.ky); ctx.arc(g.kx, g.ky, kw, 0, TAU);
  };
  const shin = () => { ctx.beginPath(); ctx.moveTo(g.kx, g.ky); ctx.lineTo(g.fx, g.fy); };
  ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  if (pass === 'out') {
    thigh(); ctx.strokeStyle = OUT; ctx.lineWidth = OW * 2; ctx.stroke();
    shin(); ctx.lineWidth = g.legW + OW * 2; ctx.stroke();
  } else {
    thigh(); ctx.fillStyle = color; ctx.fill();
    shin(); ctx.strokeStyle = color; ctx.lineWidth = g.legW; ctx.stroke();
  }
}

// casco: trapézio com sola reta, pinça (frente) inclinada e talão (trás) quase reto
function hoof(ctx, g, ang) {
  ctx.save(); ctx.translate(g.fx, g.fy); ctx.rotate(ang);
  const h = g.legW / 2;
  blob(ctx, PAL.hoof, () => {
    ctx.moveTo(-h - 0.1, -0.6); ctx.lineTo(h + 0.1, -0.6);
    ctx.lineTo(h + 1.6, 4.4); ctx.lineTo(-h - 0.4, 4.4); ctx.closePath();
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(h - 0.6, 0.4); ctx.lineTo(h + 0.5, 3.4); ctx.stroke();
  ctx.restore();
}

function eye(ctx, x, y, rx, ry, open, lashes) {
  if (open < 0.25) {
    ctx.beginPath(); ctx.arc(x, y - ry * 0.2, rx * 0.95, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = PAL.eye; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
    return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(1, open);
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = PAL.eye; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, ry * 0.42, rx * 0.72, ry * 0.4, 0, 0, TAU); ctx.fillStyle = PAL.eyeLow; ctx.fill();
  ctx.beginPath(); ctx.arc(rx * 0.3, -ry * 0.38, rx * 0.42, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(-rx * 0.35, ry * 0.3, rx * 0.2, 0, TAU); ctx.fill();
  ctx.restore();
  if (lashes) {
    ctx.strokeStyle = PAL.eye; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = -0.95 + i * 0.32;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry * open);
      ctx.lineTo(x + Math.cos(a) * (rx + 2.4), y + Math.sin(a) * ry * open - 1.5);
      ctx.stroke();
    }
  }
}

// pose.legs: 4 x {hip, bend} na ordem [trás-longe, trás-perto, frente-longe, frente-perto]
function draw(ctx, pose, t, opts = {}) {
  const knees = !!opts.knees;
  const { bob = 0, tilt = 0, sx = 1, sy = 1, lift = 0, open = 1, sway = 1, pitch = 0 } = pose;
  const legs = pose.legs || [{}, {}, {}, {}];
  // relógio da simulação: avança pelo tempo que passou desde o último quadro (no máximo 0,05 s)
  const sim = opts.sim || createHairSim();
  let dt = sim.t == null ? -1 : t - sim.t;
  const reset = !(dt >= 0 && dt < 0.5);
  dt = reset ? 0 : Math.min(dt, 0.05);
  const n = Math.ceil(dt * 120); sim.t = t;
  const E = { sim, reset, n, dt, h: n ? dt / n : 0, t, wind: pose.wind || { x: 0, gust: 6 }, fall: pose.fall || 0, M0: opts.frame || ctx.getTransform() };
  E.M0i = E.M0.inverse();
  ctx.save();
  const sh = Math.max(0.35, 1 - lift / 60);
  ctx.fillStyle = 'rgba(60,0,60,0.14)';
  ctx.beginPath(); ctx.ellipse(-3, GROUND + 1, 27 * sh, 4 * sh, 0, 0, TAU); ctx.fill();

  ctx.translate(0, -lift);
  ctx.translate(0, GROUND); ctx.scale(sx * 1.22, sy * 1.22); ctx.translate(0, -GROUND);
  ctx.translate(0, -4); // pernas mais compridas: o corpo sobe um pouco
  ctx.translate(-3, 6); ctx.rotate(pitch); ctx.translate(3, -6);

  // rabo: sai do alto da garupa
  ctx.save(); ctx.translate(-8, -5);
  const tailStrands = (N, back) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1), w = 0;
      const rx = -14, ry = s * 5, o = back ? 1 + 3 * Math.sin(s * Math.PI * 0.85) : 0;                      // raiz no alto da garupa
      const tx = qd(-34 - o, -44 - o, -27 - o * 0.5, s) + w * 0.4, ty = qd(-2, 12, 25 + o * 0.5, s) + w * 0.5;
      out.push({ p: [rx, ry, rx - 10, ry - 8 + s * 4, tx + 7, ty - 10 + w * 0.3, tx, ty],
        w: (back ? 9 : 7.6) - s * 1.4, c: rainbowAt(s, i, back ? -0.16 : 0), back,
        id: 't' + (back ? 'b' : 'f') + i, seed: 100 + i * 3.1 + (back ? 0.7 : 0) });
    }
    return out.reverse();
  };
  simHair(ctx, E, tailStrands(6, true), PHYS.tail);
  const tailF = tailStrands(12, false), tsc = simHair(ctx, E, tailF, PHYS.tail);
  sparkleOn(ctx, E, tailF, 'tf2', 0.8, 3.2 * Math.max(0, Math.sin(t * 2.6 + 1.3)), tsc);
  sparkleOn(ctx, E, tailF, 'tf7', 0.75, 2.6 * Math.max(0, Math.sin(t * 2.6 + 3.9)), tsc);
  ctx.restore();

  // patas: [trás-longe, trás-perto, frente-longe, frente-perto]; as de trás saem da garupa, mais largas
  // [hx, hy, largura da coxa, largura da canela]: as de trás mais gordinhas, combinando com a bundinha
  const HIPS = [[-21, 7, 18.5, 10], [-16, 7, 18.5, 10], [10, 9, 9, 7], [15, 9, 9, 7]];
  const geo = [], hoofA = [];
  for (let i = 0; i < 4; i++) {
    const [hx, hy, topW, legW] = HIPS[i];
    const { hip = 0, bend = 0 } = legs[i];
    let a1, a2;
    if (knees) { a1 = hip - 0.06; a2 = hip + 0.06 + bend; }   // os quatro joelhos dobram para o mesmo lado
    else { a1 = a2 = hip + bend * 0.25; }
    const L1 = 9.2 + (9 - hy);                                // quadril mais alto -> coxa mais longa, casco no mesmo chão
    geo.push(legGeom(hx, hy + bob, a1, a2, L1, 7.4, topW, legW));
    // apoiado: casco de sola no chão; no ar: acompanha a canela (e vira para trás)
    hoofA.push(lerp(-pitch, a2 + bend * 0.5, Math.min(1, bend / 0.5)));
  }

  // patas do outro lado: atrás de tudo, um tom mais escuro
  for (const i of [0, 2]) { legShape(ctx, geo[i], 'out'); legShape(ctx, geo[i], 'fill', PAL.shade); hoof(ctx, geo[i], hoofA[i]); }

  // corpo + garupa + patas deste lado: contorno de tudo primeiro, depois a cor por cima (peça única)
  const body = () => { ctx.beginPath(); ctx.ellipse(BX - 2.5, 5 + bob, 23.5, 10.5, 0, 0, TAU); };
  const rump = () => { ctx.beginPath(); ctx.ellipse(-19, 2 + bob, 9.5, 9.5, 0, 0, TAU); };
  const chest = () => { ctx.beginPath(); ctx.ellipse(14, 5 + bob, 7.5, 8.5, 0, 0, TAU); };
  // pescoço: nasce no peito, sobe inclinado para frente (crista curva atrás, garganta na frente)
  const hb = bob * 1.3;
  const neck = () => {
    ctx.beginPath(); ctx.moveTo(2, 1 + bob);
    ctx.quadraticCurveTo(4, -13 + hb, 13, -21 + hb);
    ctx.lineTo(24, -15 + hb);
    ctx.quadraticCurveTo(20, -4 + bob, 21, 7 + bob); ctx.closePath();
  };
  ctx.strokeStyle = OUT; ctx.lineWidth = OW * 2;
  for (const sh of [body, rump, chest, neck]) { sh(); ctx.stroke(); }
  legShape(ctx, geo[1], 'out'); legShape(ctx, geo[3], 'out');
  ctx.fillStyle = PAL.body;
  for (const sh of [body, rump, chest, neck]) { sh(); ctx.fill(); }
  legShape(ctx, geo[1], 'fill', PAL.body); legShape(ctx, geo[3], 'fill', PAL.body);

  // sombra da barriga
  ctx.save(); body(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(BX - 2.5, 14 + bob, 24.5, 6, 0, 0, TAU); ctx.fillStyle = PAL.shade; ctx.fill();
  ctx.restore();
  // garupa: brilho redondo em cima e a dobrinha da bundinha embaixo
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-19, 2 + bob, 6.4, 1.1 * Math.PI, 1.45 * Math.PI); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(-19, 2 + bob, 9.5, 0.2 * Math.PI, 0.5 * Math.PI); ctx.stroke();
  ctx.globalAlpha = 1;
  // coraçãozinho na garupa
  ctx.save(); ctx.translate(-7, -1);
  ctx.fillStyle = '#ff8fbd';
  ctx.beginPath(); ctx.arc(-13, 5 + bob, 1.6, 0, TAU); ctx.arc(-10.6, 5 + bob, 1.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-15.3, 5.6 + bob); ctx.lineTo(-11.8, 9 + bob); ctx.lineTo(-8.3, 5.6 + bob); ctx.fill();
  ctx.restore();
  hoof(ctx, geo[1], hoofA[1]); hoof(ctx, geo[3], hoofA[3]);
  const cos = opts.cosmetics || {};
  if (cos.wings) wings(ctx, t, bob);

  ctx.save();
  ctx.translate(18, -23 + bob * 1.3); ctx.rotate(tilt); ctx.scale(0.88, 0.88);

  // crina: fios saindo do alto da cabeça e descendo pela crista do pescoço, vermelho em cima até violeta embaixo
  const maneStrands = (N, back) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1), w = 0;
      const o = back ? 1 + 4 * Math.sin(s * Math.PI * 0.85) : 0;
      const rx = qd(5, -15, -6, s), ry = qd(-15, -15, 13, s);         // raízes (escondidas sob a cabeça)
      const tx = qd(-28 - o, -41 - o, -24 - o * 0.6, s) + w * (0.6 + s), ty = qd(-3, 15, 38 + o * 0.4, s);
      out.push({ p: [rx, ry, rx - 13, ry - 6, tx + 7, ty - 11 + w * 0.3, tx, ty],
        w: (back ? 11.5 : 9.6) - s * 2.4, c: rainbowAt(s, i, back ? -0.16 : 0), back,
        id: 'm' + (back ? 'b' : 'f') + i, seed: i * 2.7 + (back ? 0.5 : 0) });
    }
    return out.reverse();   // os de cima por último: o vermelho fica por cima, na borda
  };
  simHair(ctx, E, maneStrands(7, true), PHYS.mane);     // camada de trás, mais escura: dá volume
  const maneF = maneStrands(14, false), msc = simHair(ctx, E, maneF, PHYS.mane);
  sparkleOn(ctx, E, maneF, 'mf2', 0.7, 3.4 * Math.max(0, Math.sin(t * 2.2)), msc);
  sparkleOn(ctx, E, maneF, 'mf6', 0.75, 3 * Math.max(0, Math.sin(t * 2.2 + 2.2)), msc);
  sparkleOn(ctx, E, maneF, 'mf10', 0.7, 2.6 * Math.max(0, Math.sin(t * 2.2 + 4.3)), msc);

  blob(ctx, PAL.body, () => ctx.ellipse(0, 0, 17, 16, 0, 0, TAU));

  blob(ctx, PAL.body, () => { ctx.moveTo(-11, -9); ctx.quadraticCurveTo(-12, -24, -5, -27); ctx.quadraticCurveTo(-1, -20, -1, -14); });
  ctx.beginPath(); ctx.moveTo(-9, -12); ctx.quadraticCurveTo(-9.5, -21, -5.5, -23.5); ctx.quadraticCurveTo(-3, -18, -3.5, -14);
  ctx.fillStyle = PAL.earIn; ctx.fill();

  blob(ctx, PAL.muzzle, () => ctx.ellipse(10, 9, 8, 6, -0.1, 0, TAU));
  ctx.fillStyle = '#e07aa5';
  ctx.beginPath(); ctx.ellipse(8, 7.8, 1.1, 1.5, 0.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13.5, 7.3, 1.1, 1.5, -0.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(10.8, 10.5, 2.8, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.stroke();

  ctx.fillStyle = PAL.blush;
  ctx.beginPath(); ctx.ellipse(-7, 5, 3.8, 2.4, 0, 0, TAU); ctx.fill();

  eye(ctx, -3, -3.5, 4.3, 5.8, open, true);
  eye(ctx, 8.5, -4, 4.9, 6.4, open, true);

  // franja: fios saindo de baixo do chifre, três para trás e dois para a frente (não cobrem os olhos)
  const fw = 0;
  simHair(ctx, E, [
    { p: [2, -15, -6, -26, -15, -18, -18 + fw, -1], w: 7.2, c: PAL.rainbow[5] },
    { p: [2, -15, -4, -25, -11, -17, -12.5 + fw, -7.5], w: 6.8, c: PAL.rainbow[4] },
    { p: [3, -15, -1, -24, -5, -17, -6 + fw, -10.5], w: 6.2, c: PAL.rainbow[3] },
    { p: [3, -15, 2, -24, 0, -17, 0 + fw, -11.5], w: 5.6, c: PAL.rainbow[2] },
    { p: [5, -15, 10, -22, 12, -16, 11.5 + fw, -11], w: 5.6, c: PAL.rainbow[1] },
    { p: [4, -15, 6, -24, 8, -17, 7.5 + fw, -12], w: 6, c: PAL.rainbow[0] },
  ].map((h, k) => ({ ...h, id: 'fr' + k, seed: 200 + k * 1.3 })), PHYS.fringe);

  if (cos.crown) crown(ctx, t);
  ctx.save(); ctx.translate(4, -15); ctx.rotate(0.16);
  blob(ctx, PAL.gold, () => { ctx.moveTo(-6, 0); ctx.lineTo(0, -22); ctx.lineTo(6, 0); ctx.quadraticCurveTo(0, 2.5, -6, 0); });
  ctx.strokeStyle = PAL.goldDark; ctx.lineWidth = 0.9;
  for (let i = 0; i < 3; i++) {
    const y = -4 - i * 5.3, hw = 5.2 * (1 - (i * 5.3 + 4) / 22);
    ctx.beginPath(); ctx.moveTo(-hw, y + 1.4); ctx.lineTo(hw, y - 1.4); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2.6, -2.5); ctx.lineTo(-0.6, -15); ctx.stroke();
  ctx.restore();

  ctx.restore();
  if (opts.win) hearts(ctx, t);
  ctx.restore();
}

// Um passo de uma pata: apoio (casco no chão, vai para trás) e balanço (levanta, dobra e volta à frente).
function step(p, stance, A, B) {
  if (p < stance) return { hip: lerp(-A * 1.25, A * 0.75, p / stance), bend: 0 };
  const s = (p - stance) / (1 - stance);
  return { hip: lerp(A * 0.75, -A * 1.25, inOutSine(s)), bend: Math.sin(s * Math.PI) * B };
}

// Pata no galope: apoio curto e forte; no ar dobra bem e no fim estica para "alcançar" o chão.
function gallopLeg(p, front) {
  const stance = 0.3, A = front ? 0.55 : 0.5;
  if (p < stance) return { hip: lerp(-A * 1.2, A * 0.85, p / stance), bend: 0 };
  const s = (p - stance) / (1 - stance);
  const fold = Math.sin(Math.min(1, s / 0.75) * Math.PI);    // dobra cedo e estica antes de pousar
  return { hip: lerp(A * 0.85, -A * 1.2, inOutSine(s)), bend: fold * (front ? 1.9 : 1.5) };
}

// asas (cosmético): saem das costas, por cima do corpo e atrás da cabeça
function wings(ctx, t, bob) {
  const wf = Math.sin(t * 5) * 9;
  ctx.save(); ctx.translate(-4, -5 + bob); ctx.scale(0.7, 0.7);
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-45, -15 - wf, -38, 19);
  ctx.quadraticCurveTo(-18, 7, 0, 7); ctx.closePath();
  ctx.fillStyle = 'rgba(200,160,255,0.8)'; ctx.fill();
  ctx.strokeStyle = '#aa88ff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 7);
  ctx.quadraticCurveTo(-32, 13 - wf * 0.5, -28, 33);
  ctx.quadraticCurveTo(-12, 23, 0, 17); ctx.closePath();
  ctx.fillStyle = 'rgba(240,200,255,0.6)'; ctx.fill();
  ctx.restore();
}

// coroa (cosmético): no alto da cabeça, o chifre sai do meio dela
function crown(ctx, t) {
  ctx.save(); ctx.translate(3, -14); ctx.scale(0.62, 0.62);
  blob(ctx, '#FFD700', () => {
    ctx.moveTo(-14, 0); ctx.lineTo(-14, -14); ctx.lineTo(-8, -8); ctx.lineTo(0, -18);
    ctx.lineTo(8, -8); ctx.lineTo(14, -14); ctx.lineTo(14, 0); ctx.closePath();
  });
  ['#ff4466', '#44ffcc', '#ffee44'].forEach((c, i) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-8 + i * 8, -5, 2.6, 0, TAU); ctx.fill();
  });
  ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
  sparkle(ctx, 12, -18, 3.5);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// vitória: coraçõezinhos orbitando o corpo
function hearts(ctx, t) {
  const wt = t * 2.5, hs = 4;
  for (let i = 0; i < 4; i++) {
    const ang = wt + i * Math.PI / 2;
    ctx.save(); ctx.translate(Math.cos(ang) * 36, -16 + Math.sin(ang * 0.7) * 18);
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(wt + i);
    ctx.fillStyle = i % 2 === 0 ? '#ff55cc' : '#ffdd44';
    ctx.beginPath(); ctx.moveTo(0, hs * 0.5);
    ctx.bezierCurveTo(-hs * 1.4, -hs * 0.3, -hs * 1.4, -hs * 1.2, 0, -hs * 0.7);
    ctx.bezierCurveTo(hs * 1.4, -hs * 1.2, hs * 1.4, -hs * 0.3, 0, hs * 0.5);
    ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function blinkAt(t) { const b = t % 3.6; return b < 0.14 ? Math.abs(b - 0.07) / 0.07 : 1; }

// parado: respira; correndo: galope (tu-tu-tu-dum, depois as quatro patas no ar), o corpo
// balança como cavalinho de balanço
function groundPose(moving, t) {
  if (!moving) return { bob: Math.sin(t * 2.6) * 1.2, tilt: Math.sin(t * 1.3) * 0.04 };
  const T = 0.56, u = (t % T) / T;
  const legs = [0, 0.09, 0.3, 0.4].map((o, i) => gallopLeg((u - o + 1) % 1, i >= 2));
  const air = u > 0.7 ? Math.sin((u - 0.7) / 0.3 * Math.PI) : 0;
  return { lift: air * 7, pitch: -0.11 * Math.cos((u - 0.12) * TAU), tilt: 0.05 * Math.cos((u - 0.12) * TAU), legs };
}

// no ar: estica com a velocidade, cabeça para cima subindo e para baixo caindo, patas encolhidas
// (vy em px por quadro de 60 fps, como em game.js; air = segundos fora do chão)
function airPose(vy, air) {
  const spd = Math.min(Math.abs(vy) / 12, 1), st = 1 + 0.15 * spd, k = Math.min(1, air / 0.12);
  return { sx: 1 / Math.sqrt(st), sy: st, tilt: (vy < 0 ? -0.12 : 0.1) * spd,
    legs: [{ hip: 0.5 * k, bend: 1.2 * k }, { hip: 0.35 * k, bend: 1.2 * k },
           { hip: -0.6 * k, bend: 1.6 * k }, { hip: -0.75 * k, bend: 1.6 * k }] };
}

return { draw, createHairSim, groundPose, airPose, blinkAt };
})();

// Estado de animação por jogador (o objeto `p` muda a cada resetP, então o cabelo recomeça junto)
const _ch_unicornAnim = new WeakMap();
// Fração do movimento real que o cabelo sente: no galope (4.5 px/quadro) dá o mesmo vento
// de ~190 px/s do esboço aprovado; o pulo do jogo é bem mais alto que o do esboço, então
// o vertical entra mais fraco para o cabelo não chicotear.
const _CH_HAIR_KX = 0.7, _CH_HAIR_KY = 0.45;

function ch_drawUnicorn(ctx, p, camX, keys, cosmetics, isWin, grav = 0.55) {
  const t = performance.now() / 1000;
  let a = _ch_unicornAnim.get(p);
  if (!a) { a = { sim: _chU.createHairSim(), t, air: 0, ax: null, ay: null }; _ch_unicornAnim.set(p, a); }
  const dt = Math.max(0, Math.min(0.1, t - a.t)); a.t = t;
  a.air = p.onG ? 0 : a.air + dt;

  if (p.invT > 0 && Math.floor(p.invT / 6) % 2 === 0) return;   // pisca depois de levar dano

  // âncora: centro do corpo, com os cascos no pé da hitbox
  const ax = p.x + p.w / 2, ay = p.y + p.h - 26;
  // teletransporte (respawn, checkpoint, cena do menu): o cabelo recomeça no penteado
  if (a.ax != null && Math.hypot(ax - a.ax, ay - a.ay) > 80) a.sim = _chU.createHairSim();
  a.ax = ax; a.ay = ay;

  // parede segura vx em 0: fica parado em vez de galopar no lugar
  const moving = p.onG && Math.abs(p.vx) > 0.1;
  const pose = p.onG ? _chU.groundPose(moving, t) : _chU.airPose(p.vy, a.air);
  pose.open = p.invT > 0 ? 0 : _chU.blinkAt(t);                 // machucado: olhinhos apertados
  const ls = p.landSquash || 0;
  pose.sx = (pose.sx || 1) * (1 + 0.18 * ls);
  pose.sy = (pose.sy || 1) * (1 - 0.22 * ls);
  // vento parado (o movimento de verdade faz o resto); no ar o cabelo cai junto com o corpo
  pose.wind = { x: 0, gust: !p.onG ? 8 : moving ? 55 : 7 };
  pose.fall = !p.onG && p.vy < 18 ? _CH_HAIR_KY * grav * 3600 : 0;

  ctx.save();
  ctx.translate(-camX, 0);
  ctx.translate((1 - _CH_HAIR_KX) * ax, (1 - _CH_HAIR_KY) * ay);
  const frame = ctx.getTransform();   // espaço da simulação do cabelo
  ctx.translate(_CH_HAIR_KX * ax, _CH_HAIR_KY * ay);
  if (p.facing < 0) ctx.scale(-1, 1);
  _chU.draw(ctx, pose, t, { knees: true, sim: a.sim, frame, cosmetics: cosmetics || {}, win: isWin });
  ctx.restore();
}

// ── Slime — olhos bobos (cross-eyed) ─────────────────────────────────────────
function ch_drawSlime(ctx, e, t) {
  const bob = Math.sin(t*4 + e.x*0.1) * 2;
  const TAU = Math.PI * 2;
  // pulso de perigo
  ctx.fillStyle = `rgba(255,40,40,${0.13+0.10*Math.sin(t*4)})`;
  ctx.beginPath(); ctx.arc(e.x+18, e.y+18+bob, 28, 0, TAU); ctx.fill();
  // corpo
  ctx.fillStyle = '#44cc88';
  ctx.beginPath(); ctx.ellipse(e.x+18, e.y+18+bob, 18, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#66ffaa';
  ctx.beginPath(); ctx.ellipse(e.x+13, e.y+10+bob, 6, 5, 0, 0, TAU); ctx.fill();
  // olhos bobos — vesgo (pupilas olhando uma para a outra)
  const eyeWander = Math.sin(t*1.8) * 1.2;
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(e.x+12, e.y+15+bob, 5.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x+24, e.y+15+bob, 5.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#222'; // pupila esquerda olhando para direita
  ctx.beginPath(); ctx.arc(e.x+14+eyeWander, e.y+16+bob, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#222'; // pupila direita olhando para esquerda
  ctx.beginPath(); ctx.arc(e.x+22-eyeWander, e.y+16+bob, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(e.x+15.5, e.y+14.5+bob, 1.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x+23.5, e.y+14.5+bob, 1.2, 0, TAU); ctx.fill();
  // boca escancarada com dentes
  ctx.fillStyle = '#331100';
  ctx.beginPath(); ctx.arc(e.x+18, e.y+22+bob, 8, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillRect(e.x+11.5, e.y+22+bob, 3.5, 4);
  ctx.fillRect(e.x+16,   e.y+22+bob, 3.5, 4);
  ctx.fillRect(e.x+20.5, e.y+22+bob, 3.5, 4);
  // linguinha
  ctx.fillStyle = '#ff5566';
  ctx.beginPath(); ctx.ellipse(e.x+18, e.y+27+bob, 3.5, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff9aaa';
  ctx.beginPath(); ctx.ellipse(e.x+18, e.y+25.5+bob, 3, 1.5, 0, 0, TAU); ctx.fill();
  // bochechas
  ctx.fillStyle = '#ff669944';
  ctx.beginPath(); ctx.arc(e.x+8,  e.y+19+bob, 4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x+28, e.y+19+bob, 4, 0, TAU); ctx.fill();
}

// ── Bat — olhos fechadinhos (sleepy) ─────────────────────────────────────────
function ch_drawBat(ctx, e, t) {
  const TAU = Math.PI * 2;
  // pulso de perigo
  ctx.fillStyle = `rgba(255,40,40,${0.12+0.10*Math.sin(t*5)})`;
  ctx.beginPath(); ctx.arc(e.x+18, e.y+14, 32, 0, TAU); ctx.fill();
  const flap = Math.sin(t*10) * 15;
  const flip = e.dir < 0 ? -1 : 1;
  ctx.save(); ctx.scale(flip, 1); const bx = flip * e.x;
  // asas
  ctx.fillStyle = '#aa44cc';
  ctx.beginPath(); ctx.moveTo(bx+18, e.y+14);
  ctx.quadraticCurveTo(bx, e.y+flap, bx-10, e.y+25);
  ctx.quadraticCurveTo(bx+8, e.y+20, bx+18, e.y+22); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx+18, e.y+14);
  ctx.quadraticCurveTo(bx+36, e.y+flap, bx+46, e.y+25);
  ctx.quadraticCurveTo(bx+28, e.y+20, bx+18, e.y+22); ctx.fill();
  // corpo
  ctx.fillStyle = '#882299';
  ctx.beginPath(); ctx.arc(bx+18, e.y+14, 12, 0, TAU); ctx.fill();
  // olhinhos fechados (sonolentos) ~~
  ctx.strokeStyle = '#cc88ee'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx+10, e.y+13);
  ctx.quadraticCurveTo(bx+12, e.y+9.5, bx+16, e.y+13);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx+20, e.y+13);
  ctx.quadraticCurveTo(bx+22, e.y+9.5, bx+26, e.y+13);
  ctx.stroke();
  // zzzz sonecas flutuando
  ctx.save();
  const zOff = Math.sin(t * 1.5) * 3;
  ctx.fillStyle = 'rgba(200,160,255,0.9)';
  ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('z', bx+29, e.y+4 - zOff);
  ctx.font = 'bold 7px sans-serif';
  ctx.fillText('z', bx+33, e.y - 1 - zOff * 1.3);
  ctx.textAlign = 'left';
  ctx.restore();
  // orelhas
  ctx.fillStyle = '#aa44cc';
  ctx.beginPath(); ctx.moveTo(bx+10,e.y+4); ctx.lineTo(bx+6,e.y-6);  ctx.lineTo(bx+14,e.y+2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx+26,e.y+4); ctx.lineTo(bx+30,e.y-6); ctx.lineTo(bx+22,e.y+2); ctx.fill();
  ctx.restore();
}

// ── Bee — antenas graciosas ───────────────────────────────────────────────────
function ch_drawBee(ctx, e, t) {
  const cx  = e.x + e.w/2, cy = e.y + e.h/2;
  const TAU = Math.PI * 2;
  // pulso de perigo
  ctx.fillStyle = `rgba(255,220,0,${0.15+0.12*Math.sin(t*6)})`;
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, TAU); ctx.fill();
  // asas batendo
  const flap = Math.sin(t*14) * 0.4;
  ctx.globalAlpha = 0.7; ctx.fillStyle = '#cceeff';
  ctx.save(); ctx.translate(cx, cy-4);
  ctx.rotate(-0.3+flap);
  ctx.beginPath(); ctx.ellipse(-14,-8, 14,7, 0.4, 0, TAU); ctx.fill();
  ctx.rotate(0.6-flap*2);
  ctx.beginPath(); ctx.ellipse(14,-8, 14,7,-0.4, 0, TAU); ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
  // corpo com listras — usando clip para não vazar
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, 12, 9, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.ellipse(cx, cy, 12, 9, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#333';
    ctx.fillRect(cx-11+i*7, cy-9+i, 5, 18-i*2);
  }
  ctx.restore();
  // cabeça
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.arc(cx+10, cy-1, 8, 0, TAU); ctx.fill();
  // antenas graciosas — linhas curvas elegantes com bolinhas coloridas
  ctx.strokeStyle = '#886600'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  // antena esquerda
  ctx.beginPath();
  ctx.moveTo(cx+7, cy-7);
  ctx.quadraticCurveTo(cx+2, cy-20, cx-2, cy-25);
  ctx.stroke();
  // antena direita
  ctx.beginPath();
  ctx.moveTo(cx+13, cy-8);
  ctx.quadraticCurveTo(cx+18, cy-21, cx+22, cy-25);
  ctx.stroke();
  // bolinha pulsante no topo de cada antena
  const tc1 = `hsl(${(t*70)%360},100%,60%)`;
  const tc2 = `hsl(${(t*70+180)%360},100%,60%)`;
  const pulse = 1 + 0.2*Math.sin(t*6);
  ctx.fillStyle = tc1;
  ctx.beginPath(); ctx.arc(cx-2, cy-25, 3*pulse, 0, TAU); ctx.fill();
  ctx.fillStyle = tc2;
  ctx.beginPath(); ctx.arc(cx+22, cy-25, 3*pulse, 0, TAU); ctx.fill();
  // olho refinado com cílio elegante
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx+13, cy-3, 2.8, 0, TAU); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(cx+14, cy-4, 1.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#554400'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx+11, cy-5.5); ctx.lineTo(cx+9,  cy-9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+14, cy-5.8); ctx.lineTo(cx+13, cy-10); ctx.stroke();
  // ferrão
  ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx-12, cy); ctx.lineTo(cx-19, cy+3); ctx.stroke();
  // indicador de mergulho
  if (e.diving) {
    ctx.strokeStyle = 'rgba(255,80,0,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy+10); ctx.lineTo(cx, cy+22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-5,cy+18); ctx.lineTo(cx,cy+24); ctx.lineTo(cx+5,cy+18); ctx.stroke();
  }
}

// ── Spike (mantido, com adição mínima) ───────────────────────────────────────
function ch_drawSpike(ctx, e, t) {
  const TAU = Math.PI * 2;
  ctx.fillStyle = `rgba(255,40,40,${0.18+0.15*Math.sin(t*6)})`;
  ctx.beginPath(); ctx.arc(e.x+16, e.y+16, 30, 0, TAU); ctx.fill();
  const rot = t * 3 * e.dir;
  ctx.save(); ctx.translate(e.x+16, e.y+16); ctx.rotate(rot);
  ctx.fillStyle = '#cc2222';
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff4444';
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(-5,-22); ctx.lineTo(5,-22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.arc(-4, -4, 5, 0, TAU); ctx.fill();
  ctx.restore();
}
