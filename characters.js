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

// ── Eye by state (helper) ────────────────────────────────────────────────────
function _ch_eye(ctx, ex, ey, state, t) {
  const TAU = Math.PI * 2;

  if (state === 'hurt') {
    // × olhos machucados
    ctx.strokeStyle = '#cc2244'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex-5, ey-5); ctx.lineTo(ex+5, ey+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex+5, ey-5); ctx.lineTo(ex-5, ey+5); ctx.stroke();
    // lágrima
    ctx.fillStyle = '#88ccff';
    ctx.beginPath(); ctx.ellipse(ex+6, ey+7, 2, 3.5, 0.15, 0, TAU); ctx.fill();
    return;
  }

  if (state === 'win') {
    // ★ olho estrela
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a  = (i * TAU / 5) - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      const px = ex + Math.cos(a)  * 8;
      const py = ey + Math.sin(a)  * 8;
      const qx = ex + Math.cos(a2) * 4;
      const qy = ey + Math.sin(a2) * 4;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      ctx.lineTo(qx, qy);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,200,0.8)';
    ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, TAU); ctx.fill();
    return;
  }

  // piscar suave a cada 4.2s (idle / run)
  const bp = t % 4.2;
  if ((state === 'idle' || state === 'run') && bp > 4.05) {
    ctx.strokeStyle = '#8833aa'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ex, ey, 7, Math.PI, TAU); ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ex-5, ey); ctx.lineTo(ex-7, ey-4); ctx.stroke();
    return;
  }

  // olho kawaii normal — aumenta ao pular
  const sc = state === 'jump' ? 1.25 : 1;

  ctx.fillStyle = 'rgba(180,100,200,0.18)';
  ctx.beginPath(); ctx.ellipse(ex+1, ey+1, 9*sc, 8*sc, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.ellipse(ex, ey, 8.5*sc, 7.5*sc, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#cc88bb'; ctx.lineWidth = 1.2; ctx.stroke();
  const irG = ctx.createRadialGradient(ex-1.5, ey-1.5, 1, ex, ey, 6*sc);
  irG.addColorStop(0, '#cc88ff'); irG.addColorStop(0.4, '#8844ee'); irG.addColorStop(1, '#330077');
  ctx.fillStyle = irG;
  ctx.beginPath(); ctx.arc(ex, ey, 6*sc, 0, TAU); ctx.fill();
  ctx.fillStyle = '#110022';
  ctx.beginPath(); ctx.arc(ex+0.5, ey+0.5, state === 'jump' ? 4.5 : 3.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(ex+2.5, ey-2.5, 2.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(ex-1.5, ey+2, 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(200,150,255,0.35)';
  ctx.beginPath(); ctx.arc(ex, ey+3*sc, 4*sc, 0.1*Math.PI, 0.9*Math.PI); ctx.fill();

  // cílios — menos ao correr
  ctx.strokeStyle = '#8833aa'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  const lA = state === 'run' ? [-0.85,-0.42,-0.1] : [-1.1,-0.75,-0.42,-0.1, 0.18];
  const lL = state === 'run' ? [9, 11, 9]         : [10, 11.5, 12.5, 11.5, 9.5];
  for (let i = 0; i < lA.length; i++) {
    const ba = lA[i] - Math.PI / 2;
    const bx2 = ex + Math.cos(ba) * 7.5 * sc;
    const by2 = ey + Math.sin(ba) * 7.5 * sc;
    const tx2 = bx2 + Math.cos(ba-0.35) * lL[i];
    const ty2 = by2 + Math.sin(ba-0.35) * lL[i] - 1.5;
    const cpX = (bx2+tx2)/2 + Math.cos(ba-0.7)*3;
    const cpY = (by2+ty2)/2 + Math.sin(ba-0.7)*3;
    ctx.beginPath(); ctx.moveTo(bx2, by2);
    ctx.quadraticCurveTo(cpX, cpY, tx2, ty2); ctx.stroke();
  }
}

// ── Mouth by state (helper) ───────────────────────────────────────────────────
function _ch_mouth(ctx, hx, hy, state) {
  ctx.lineCap = 'round';
  if (state === 'hurt') {
    ctx.strokeStyle = '#cc3366'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx+9, hy+4);
    ctx.quadraticCurveTo(hx+14, hy+1.5, hx+19, hy+4); // boca triste
    ctx.stroke();
    return;
  }
  if (state === 'win') {
    ctx.strokeStyle = '#dd2266'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(hx+14, hy-2, 7, 0.05, Math.PI*0.95); ctx.stroke();
    ctx.fillStyle = 'white'; // dentinhos
    ctx.beginPath(); ctx.arc(hx+14, hy+2.5, 4.5, 0, Math.PI); ctx.fill();
    return;
  }
  if (state === 'jump') {
    ctx.fillStyle = '#cc3377'; // boca aberta "ooh!"
    ctx.beginPath(); ctx.ellipse(hx+14, hy, 4.5, 5.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffaabb';
    ctx.beginPath(); ctx.ellipse(hx+14, hy+1.5, 3, 3.5, 0, 0, Math.PI*2); ctx.fill();
    return;
  }
  if (state === 'run') {
    ctx.strokeStyle = '#dd4477'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(hx+14, hy-1, 5, 0.15, Math.PI*0.7); ctx.stroke();
    ctx.fillStyle = '#ff6699'; // linguinha
    ctx.beginPath(); ctx.ellipse(hx+17.5, hy+3, 2.5, 3, 0.2, 0, Math.PI*2); ctx.fill();
    return;
  }
  // idle — sorriso suave
  ctx.strokeStyle = '#dd4477'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(hx+14, hy-1, 5, 0.15, Math.PI*0.8); ctx.stroke();
}

// ── Unicorn (player) ─────────────────────────────────────────────────────────
function ch_drawUnicorn(ctx, p, camX, keys, cosmetics, isWin) {
  const t   = performance.now() / 1000;
  const TAU = Math.PI * 2;

  ctx.save(); ctx.translate(-camX, 0);

  if (p.invT > 0 && Math.floor(p.invT / 6) % 2 === 0) { ctx.restore(); return; }

  const state = isWin
    ? 'win'
    : p.invT > 0           ? 'hurt'
    : !p.onG               ? 'jump'
    : (keys.left||keys.right) ? 'run'
    : 'idle';

  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);

  // squash & stretch
  let _sx = p.facing, _sy = 1.05;
  if (p.landSquash > 0) {
    _sx = p.facing * (1 + 0.22 * p.landSquash);
    _sy = 0.85 + 0.2 * (1 - p.landSquash);
  } else if (!p.onG) {
    const spd = Math.min(Math.abs(p.vy) / 12, 1);
    _sx = p.facing * (1 - 0.12 * spd);
    _sy = 1.05 + 0.16 * spd;
  }
  ctx.scale(_sx, _sy);

  const cx = 0, cy = 0;
  const bob    = p.onG ? Math.sin(t * 2.8) * 1.8 : 0;
  const lp     = t * 13;
  const moving = keys.left || keys.right;

  // ── Aura ──────────────────────────────────────────────────────────────────
  {
    const ar = isWin ? 62 : 44;
    const aura = ctx.createRadialGradient(cx, cy-8, 6, cx, cy-8, ar);
    if (state === 'win') {
      aura.addColorStop(0,   `hsla(${(t*80)%360},100%,80%,0.45)`);
      aura.addColorStop(0.5, `hsla(${(t*80+120)%360},100%,70%,0.22)`);
      aura.addColorStop(1,   'rgba(255,200,255,0)');
    } else if (state === 'hurt') {
      aura.addColorStop(0, 'rgba(255,60,60,0.35)');
      aura.addColorStop(1, 'rgba(255,60,60,0)');
    } else {
      aura.addColorStop(0, 'rgba(255,160,255,0.28)');
      aura.addColorStop(1, 'rgba(200,80,255,0)');
    }
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(cx, cy-8, ar, ar+4, 0, 0, TAU); ctx.fill();
  }

  // ── Sombra no chão ────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.beginPath(); ctx.ellipse(cx, cy+27, 22, 5, 0, 0, TAU); ctx.fill();

  // ── Cauda ─────────────────────────────────────────────────────────────────
  const tailC = state === 'win'
    ? ['#ff1111','#ff8800','#ffee00','#00ee66','#0088ff','#cc00ff']
    : ['#ff55ff','#ff44cc','#ff8844','#ffcc44','#44ffdd','#88aaff'];
  const tSpd = state === 'run' ? 5.5 : state === 'win' ? 6.5 : 3.5;
  for (let i = 0; i < tailC.length; i++) {
    const w1 = Math.sin(t*tSpd       + i*0.75) * 11;
    const w2 = Math.sin(t*(tSpd-0.7) + i*1.2)  * 8;
    ctx.strokeStyle = tailC[i]; ctx.lineWidth = 5.5 - i*0.55; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx-18, cy+2+bob);
    ctx.bezierCurveTo(cx-34+w1, cy+8+i*2.5, cx-40+w2, cy+20+i*3, cx-32+w1*1.3, cy+32+i*4);
    ctx.stroke();
  }

  // ── Pernas traseiras ──────────────────────────────────────────────────────
  if (moving && p.onG) {
    ch_drawLeg(ctx, cx-14, cy+14+bob, lp+Math.PI, '#ffaadd','#ee88cc');
    ch_drawLeg(ctx, cx- 6, cy+14+bob, lp,         '#ffaadd','#ee88cc');
  } else {
    ch_drawLeg(ctx, cx-14, cy+14+bob, 0, '#ffaadd','#ee88cc');
    ch_drawLeg(ctx, cx- 6, cy+14+bob, 0, '#ffaadd','#ee88cc');
  }

  // ── Corpo ─────────────────────────────────────────────────────────────────
  const bodyG = ctx.createRadialGradient(cx-5, cy-2+bob, 3, cx, cy+6+bob, 26);
  if (state === 'hurt') {
    bodyG.addColorStop(0,'#ffe8e8'); bodyG.addColorStop(0.45,'#ffbbbb'); bodyG.addColorStop(1,'#ff8888');
  } else {
    bodyG.addColorStop(0,'#ffe8f8'); bodyG.addColorStop(0.45,'#ffbbee'); bodyG.addColorStop(1,'#ff88cc');
  }
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.ellipse(cx, cy+6+bob, 23, 18, -0.08, 0, TAU); ctx.fill();
  ctx.strokeStyle = state === 'hurt' ? '#ff4444' : '#ff77cc'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(cx+5, cy+1+bob, 13, 9, -0.2, 0, TAU); ctx.fill();

  // ── Pernas dianteiras ─────────────────────────────────────────────────────
  if (moving && p.onG) {
    ch_drawLeg(ctx, cx+ 6, cy+14+bob, lp+Math.PI*0.5, '#ffccee','#ff99dd');
    ch_drawLeg(ctx, cx+14, cy+14+bob, lp+Math.PI*1.5, '#ffccee','#ff99dd');
  } else if (!p.onG) {
    ch_drawLeg(ctx, cx+ 4, cy+10+bob, -0.6, '#ffccee','#ff99dd');
    ch_drawLeg(ctx, cx+14, cy+10+bob, -0.8, '#ffccee','#ff99dd');
  } else {
    ch_drawLeg(ctx, cx+ 6, cy+14+bob, 0, '#ffccee','#ff99dd');
    ch_drawLeg(ctx, cx+14, cy+14+bob, 0, '#ffccee','#ff99dd');
  }

  // ── Pescoço ───────────────────────────────────────────────────────────────
  const nkG = ctx.createLinearGradient(cx+4, cy-6+bob, cx+16, cy+8+bob);
  nkG.addColorStop(0,'#ffddee'); nkG.addColorStop(1,'#ffaadd');
  ctx.fillStyle = nkG;
  ctx.beginPath();
  ctx.moveTo(cx, cy-2+bob); ctx.lineTo(cx+14, cy-2+bob);
  ctx.quadraticCurveTo(cx+22, cy-22+bob, cx+18, cy-32+bob);
  ctx.quadraticCurveTo(cx+10, cy-24+bob, cx-2,  cy-8+bob);
  ctx.closePath(); ctx.fill();

  // ── Cabeça ────────────────────────────────────────────────────────────────
  const hx = cx+11, hy = cy-22+bob;
  const hdG = ctx.createRadialGradient(hx-5, hy-6, 3, hx, hy, 21);
  if (state === 'hurt') {
    hdG.addColorStop(0,'#fff5f5'); hdG.addColorStop(0.55,'#ffcccc'); hdG.addColorStop(1,'#ffaaaa');
  } else {
    hdG.addColorStop(0,'#fff5fc'); hdG.addColorStop(0.55,'#ffccee'); hdG.addColorStop(1,'#ffaadd');
  }
  ctx.fillStyle = hdG;
  ctx.beginPath(); ctx.arc(hx, hy, 20, 0, TAU); ctx.fill();
  ctx.strokeStyle = state === 'hurt' ? '#ff6666' : '#ff88cc'; ctx.lineWidth = 1.5; ctx.stroke();

  // ── Orelhas ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffbbee';
  ctx.beginPath();
  ctx.moveTo(hx-7, hy-14); ctx.lineTo(hx-13, hy-28); ctx.lineTo(hx-1, hy-16);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ff99cc'; ctx.lineWidth = 1; ctx.stroke();

  const droop = state === 'hurt' ? 4 : 0; // orelhinhas caídas quando machucada
  ctx.fillStyle = '#ff99dd';
  ctx.beginPath();
  ctx.moveTo(hx+2,  hy-15+droop);
  ctx.lineTo(hx-2,  hy-30+droop*0.5);
  ctx.lineTo(hx+12, hy-17+droop);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ff77bb'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#ffccee';
  ctx.beginPath();
  ctx.moveTo(hx+3,   hy-16+droop);
  ctx.lineTo(hx+0.5, hy-26+droop*0.5);
  ctx.lineTo(hx+10,  hy-18+droop);
  ctx.closePath(); ctx.fill();

  // ── Chifre ────────────────────────────────────────────────────────────────
  const hornX = hx+2, hornBase = hy-18, hornTip = hy-48;
  const hGlowR = state === 'win' ? 26 : 16;
  const hGlow  = ctx.createRadialGradient(hornX, hornBase-12, 2, hornX, hornBase-12, hGlowR);
  hGlow.addColorStop(0, state === 'win' ? 'rgba(255,255,80,0.8)' : 'rgba(255,220,80,0.55)');
  hGlow.addColorStop(1, 'rgba(255,220,80,0)');
  ctx.fillStyle = hGlow;
  ctx.beginPath(); ctx.arc(hornX, hornBase-12, hGlowR, 0, TAU); ctx.fill();

  const hBands = ['#ffe066','#ffcc33','#ff9944','#ff5599','#dd44ff','#6655ff','#44ccff'];
  for (let i = 0; i < hBands.length; i++) {
    const f0 = i/hBands.length, f1 = (i+1)/hBands.length;
    const y0 = hornBase - f0*(hornBase-hornTip), y1 = hornBase - f1*(hornBase-hornTip);
    const w0 = 6.5*(1-f0*0.88), w1 = 6.5*(1-f1*0.88);
    ctx.fillStyle = hBands[i];
    ctx.beginPath();
    ctx.moveTo(hornX-w0,y0); ctx.lineTo(hornX+w0,y0);
    ctx.lineTo(hornX+w1,y1); ctx.lineTo(hornX-w1,y1);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hornX-2, hornBase); ctx.lineTo(hornX-1, hornTip+5); ctx.stroke();

  const nSpark = state === 'win' ? 6 : 4;
  const st2    = t * (state === 'win' ? 8 : 5);
  for (let i = 0; i < nSpark; i++) {
    const sa = st2 + i * TAU / nSpark;
    const sr = (state === 'win' ? 9 : 6) + Math.sin(st2*1.3+i)*3;
    ctx.fillStyle = `hsl(${(st2*55+i*60)%360},100%,80%)`;
    ctx.globalAlpha = 0.6 + 0.4*Math.sin(st2*2+i);
    ctx.beginPath(); ctx.arc(hornX+Math.cos(sa)*sr, hornTip+Math.sin(sa)*3, 2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Juba ──────────────────────────────────────────────────────────────────
  const maneC = state === 'win'
    ? ['#ff1111','#ff8800','#ffee00','#00cc44','#0066ff','#cc00ff']
    : ['#ff33bb','#ff8844','#ffdd33','#44ffcc','#5599ff','#cc44ff'];
  const mSpd = state === 'run' ? 5.5 : 3.2;
  for (let i = 0; i < maneC.length; i++) {
    const mw  = Math.sin(t*mSpd        + i*0.85) * 8;
    const mw2 = Math.sin(t*(mSpd-0.8)  + i*1.3)  * 6;
    ctx.strokeStyle = maneC[i]; ctx.lineWidth = 5-i*0.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx-4-i*1.2, hy-16);
    ctx.bezierCurveTo(hx-12+mw, hy-4, hx-16+mw2, cy+4+bob, hx-12+mw*0.7, cy+12+bob+i*1.5);
    ctx.stroke();
  }

  // ── Focinho ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffeef8';
  ctx.beginPath(); ctx.ellipse(hx+14, hy-5, 9, 6.5, 0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffbbdd'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#ffaac8';
  ctx.beginPath(); ctx.ellipse(hx+12, hy-2.5, 2, 1.5, -0.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx+17, hy-2.5, 2, 1.5,  0.3, 0, TAU); ctx.fill();

  // ── Olho + Bochecha + Boca ────────────────────────────────────────────────
  _ch_eye(ctx, hx+13, hy-10, state, t);

  const blushA = state === 'win' ? 0.55 : state === 'hurt' ? 0.45 : 0.32;
  ctx.fillStyle = state === 'hurt'
    ? `rgba(255,60,60,${blushA})` : `rgba(255,110,155,${blushA})`;
  ctx.beginPath(); ctx.ellipse(hx+20, hy-1, 7, 4.5, 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,220,0.6)';
  ctx.beginPath(); ctx.arc(hx+18, hy+0.5, 1.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(hx+23, hy-1.5, 0.9, 0, TAU); ctx.fill();

  _ch_mouth(ctx, hx, hy, state);

  // ── Win: coraçõezinhos orbitando ──────────────────────────────────────────
  if (state === 'win') {
    const wt = t * 2.5;
    for (let i = 0; i < 4; i++) {
      const ang = wt + i * Math.PI / 2;
      const rx  = cx + Math.cos(ang) * 42;
      const ry  = cy - 14 + Math.sin(ang * 0.7) * 22;
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(wt+i);
      const hs = 5;
      ctx.fillStyle = i % 2 === 0 ? '#ff55cc' : '#ffdd44';
      ctx.save(); ctx.translate(rx, ry);
      ctx.beginPath();
      ctx.moveTo(0, hs*0.5);
      ctx.bezierCurveTo(-hs*1.4,-hs*0.3, -hs*1.4,-hs*1.2, 0,-hs*0.7);
      ctx.bezierCurveTo( hs*1.4,-hs*1.2,  hs*1.4,-hs*0.3, 0, hs*0.5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ── Cosméticos ────────────────────────────────────────────────────────────
  if (cosmetics.wings) {
    const wf = Math.sin(t*5)*14;
    ctx.fillStyle = 'rgba(200,160,255,0.75)';
    ctx.beginPath(); ctx.moveTo(cx-10,cy-5+bob);
    ctx.quadraticCurveTo(cx-55,cy-20-wf,cx-48,cy+14);
    ctx.quadraticCurveTo(cx-28,cy+2,cx-10,cy+2+bob); ctx.fill();
    ctx.strokeStyle = '#aa88ff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(240,200,255,0.5)';
    ctx.beginPath(); ctx.moveTo(cx-10,cy+2+bob);
    ctx.quadraticCurveTo(cx-42,cy+8-wf*0.5,cx-38,cy+28);
    ctx.quadraticCurveTo(cx-22,cy+18,cx-10,cy+12+bob); ctx.fill();
  }
  if (cosmetics.crown) {
    const cr_t = performance.now() / 1000;
    ctx.fillStyle = '#FFD700';
    const cx2 = hx+10, cy2 = hy-40+bob;
    ctx.beginPath();
    ctx.moveTo(cx2-14,cy2+4); ctx.lineTo(cx2-14,cy2-10);
    ctx.lineTo(cx2-8, cy2-4); ctx.lineTo(cx2,   cy2-14);
    ctx.lineTo(cx2+8, cy2-4); ctx.lineTo(cx2+14,cy2-10);
    ctx.lineTo(cx2+14,cy2+4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 1.5; ctx.stroke();
    ['#ff4466','#44ffcc','#ffee44'].forEach((c,i) => {
      ctx.fillStyle = c; ctx.beginPath();
      ctx.arc(cx2-8+i*8, cy2-2, 3, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 0.5 + 0.5*Math.abs(Math.sin(cr_t*3));
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.arc(cx2+2, cy2-16, 2, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
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
