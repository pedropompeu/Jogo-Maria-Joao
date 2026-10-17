import { LEVELS } from './levels-data.js';
(function () {

// ─── SETUP ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const CW = 1000, CH = 600;
const isMobile = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
const EF = s => `${s}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",serif`;

// ─── SAFE STORAGE ────────────────────────────────────────────────────────────
// F0 (AUD-03): localStorage lança em aba privada iOS / cookies bloqueados.
// sGet/sSet tentam localStorage e caem para memória — o jogo nunca trava,
// só perde persistência entre sessões nesse cenário.
const _memStore = Object.create(null);
function sGet(k) {
  try { const v = localStorage.getItem(k); if (v !== null) return v; } catch(e){}
  return Object.prototype.hasOwnProperty.call(_memStore, k) ? _memStore[k] : null;
}
function sSet(k, v) {
  v = String(v);
  try { localStorage.setItem(k, v); return; } catch(e){}
  try { _memStore[k] = v; } catch(_){}
}
function sGetJSON(k, fb) {
  const raw = sGet(k);
  if (raw == null) return fb;
  try { const v = JSON.parse(raw); return (v === null || v === undefined) ? fb : v; }
  catch(e){ return fb; }
}

// ─── CONFIG ────────────────────────────────────────────────────────────────
const G = 0.55, JUMP_V = -13.5, DJ_V = -11, SPD = 4.5;
// F1: janelas de perdão do pulo (em frames @60fps) + corte de altura variável
const JBUF = 7, COYO = 6, JUMP_CUT = -4.5;
const MAX_HP = 5, INV_T = 90, STOMP_V = -10, CLOUD_V = -16;
const BASE_HP = 3; // HP ao iniciar cada fase

// ─── PROGRESSION / SETTINGS ────────────────────────────────────────────────
let difficulty    = sGet('unicornDiff') || 'normal';
let speedrunMode  = false;
let speedrunMs    = 0;
// F5/T5.2: progressão suave — só a 1ª fase aberta; o resto desbloqueia ao completar.
let unlockedLevels = sGetJSON('unicornUnlocked', null) || [true, ...Array(LEVELS.length-1).fill(false)];
let levelStars    = sGetJSON('unicornStars', []);
let _earnedAch    = sGetJSON('unicornAch', []);
let hurtFlash     = 0;
let lvlDamageCount = 0;
let totalStomps   = 0;

// ─── INPUT ─────────────────────────────────────────────────────────────────
const keys = { left:false, right:false, jump:false };
let jumpEdge = false; // single-frame edge trigger
let jumpBuf = 0, coyoteT = 0; // F1: buffer de pulo + coyote time (frames @60fps)

// F1: altura variável — soltar o pulo corta a subida (toque curto = pulo curto)
function cutJump() {
  if (typeof p !== 'undefined' && p.vy < JUMP_CUT) p.vy = JUMP_CUT;
}

// ─── LEVEL DATA ────────────────────────────────────────────────────────────
// F5: fonte única em levels-data.js (20 fases) via ES module. Sem cópia inline.

// ─── GAME STATE ────────────────────────────────────────────────────────────
let gs = 'start'; // start|playing|paused|lvlDone|gameOver|win
let prePauseGs = null;
let lvlIdx = 0, score = 0;
let best = (+sGet('unicornBest')) || 0;
let lvlTimer = 0;

// ─── MÉTRICAS GLOBAIS ──────────────────────────────────────────────────────
const _metrics = sGetJSON('unicornMetrics', {});
function metricAdd(key, val=1) {
  _metrics[key] = (_metrics[key]||0) + val;
  sSet('unicornMetrics', JSON.stringify(_metrics));
}
let lastTime = 0;
let _timerAccMs = 0;
let lastDeathCause = 'enemy';

const DEATH_TIPS = {
  fall:         'Cuidado nas bordas! O salto duplo te ajuda a cobrir distâncias maiores.',
  hazard:       'As armadilhas de espinho são fixas — pule por cima delas!',
  enemy_slime:  'Os slimes patrulham o chão. Pule em cima deles para vencê-los!',
  enemy_bat:    'Os morcegos voam em padrões. Espere o momento certo para passar!',
  enemy_spike:  'As bolas de espinho são rápidas. Use o salto duplo para desviar!',
  enemy_bee:    'As abelhas mergulham quando você está abaixo delas — não fique parado!',
  fireball:     'Desvie das bolas de fogo do dragão! Um escudo pode te proteger.',
  time:         'O tempo esgotou! Tente avançar mais rápido pela fase.',
  boss:         'O dragão leva 2 pisadas na cabeça. Pule nele pelo alto!',
};

// live objects
let plats=[], enems=[], coins=[], hearts=[], cps=[], portal=null, parts=[];
let pups=[], floatTexts=[], fireballs=[], hazards=[];
let boss=null;

// checkpoint save slots (per cp index)
let cpSave = [null, null];

// camera
let camX = 0;

// screen shake
let shakeAmp=0, shakeDur=0;
function addShake(a,d){ shakeAmp=Math.max(shakeAmp,a); shakeDur=Math.max(shakeDur,d); }

// player
let p = {};
function resetP(x, y, hp) {
  p = { x, y, w:44, h:52, vx:0, vy:0,
        onG:false, djAvail:false,
        hp: hp ?? BASE_HP, invT:0, facing:1,
        ft:0, frame:0, dead:false, dieT:0,
        starTimer:0, speedTimer:0, magnetTimer:0, hasShield:false,
        combo:0, comboTimer:0,
        landSquash:0, wasOnG:false };
}

// ─── LOAD LEVEL ────────────────────────────────────────────────────────────
function loadLvl(idx, fromCp) {
  const L = LEVELS[idx];
  plats = L.plats.map(([x,y,w,h,type,dx,range]) => ({
    x0:x, x, y0:y, y, w, h, type,
    dx:dx||0, range:range||0, t:0,
    cTimer:0, crumbling:false, gone:false,
  }));
  const gY = L.gY;
  enems = L.enemies.map(([ex,ey,type]) => ({
    x:ex, y: ey!=null ? ey : gY-38,
    w: type==='spike'?32:36, h: type==='bat'?26:type==='slime'?30:32,
    type, vx: type==='spike'?2.8:1.3, vy:0,
    alive:true, dir:1,
    t:Math.random()*Math.PI*2,
    oy: ey!=null ? ey : gY-38,
  }));
  coins  = L.coins.map(([x,y])=>({x,y,col:false}));
  hearts = L.hearts.map(([x,y])=>({x,y,col:false}));
  cps    = (L.cps||[]).map(([x,y],i)=>({x,y,active:false,id:i}));
  pups   = (L.powerups||[]).map(([x,y,type])=>({x,y,type,col:false}));
  portal   = L.hasBoss ? null : {x:L.portal[0], y:L.portal[1], w:52, h:72, t:0};
  boss     = L.hasBoss ? initBoss(L) : null;
  hazards  = (L.hazards||[]).map(([x,y,w,h,type])=>({x,y,w,h,type}));
  if(speedrunMode) enems=[];
  playMusic(idx);
  parts  = []; floatTexts=[]; fireballs=[];
  cpSave = (L.cps||[]).map(()=>null);
  camX   = 0;
  jumpBuf = 0; coyoteT = 0; // F1: sem pulo herdado da fase anterior
  lvlDamageCount = 0;
  totalStomps = 0;

  if (fromCp) {
    const sv = fromCp;
    resetP(sv.x, sv.y, sv.hp);
    score = sv.score;
    // restore which cps were already active
    if (sv.cpIdx > 0) cps.forEach(c=>{ if(c.id<sv.cpIdx) c.active=true; });
    // restore cp saves
    cpSave = sv.cpSave.slice();
    camX = Math.max(0, sv.x - CW/3);
    // restore coins/hearts collected state
    sv.coinsCol.forEach((col,i)=>{ if(coins[i]) coins[i].col=col; });
    sv.heartsCol.forEach((col,i)=>{ if(hearts[i]) hearts[i].col=col; });
    lvlTimer = sv.time;
  } else {
    const startHP = difficulty==='easy' ? 4 : difficulty==='hard' ? 2 : BASE_HP;
    resetP(L.start[0], L.start[1], startHP);
    lvlTimer = L.time;
  }

  ui('lvlDisp', idx+1);
  ui('timeDisp', lvlTimer);
  ui('livesDisp', p.hp);
  ui('scoreDisp', score);
  ui('bestDisp', best);
}

function saveCheckpoint(cpObj) {
  const save = {
    x: p.x, y: p.y, hp: p.hp, score,
    cpIdx: cpObj.id,
    cpSave: cpSave.slice(),
    time: lvlTimer,
    coinsCol: coins.map(c=>c.col),
    heartsCol: hearts.map(h=>h.col),
  };
  cpSave[cpObj.id] = save;
}
function getBestSave() {
  for (let i=cpSave.length-1;i>=0;i--) if(cpSave[i]) return cpSave[i];
  return null;
}

// ─── PARTICLES ─────────────────────────────────────────────────────────────
function spawnParticles(x, y, color, n=8, spread=40) {
  for (let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2, sp=1+Math.random()*3;
    parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,
      life:1, color, size:3+Math.random()*4});
  }
}
function spawnStars(x, y) {
  const cols=['#ffee00','#ff88ff','#88ffff','#ffffff'];
  spawnParticles(x,y,cols[Math.floor(Math.random()*cols.length)],12,50);
}

function spawnDust(x, y, plType) {
  const col = plType==='cloud' ? '#ffffff' : plType==='crumble' ? '#cc9944' : '#ccbbaa';
  for(let i=0;i<6;i++){
    const a = Math.PI + (Math.random()-0.5)*1.2;
    const sp = 0.8+Math.random()*2;
    parts.push({x:x+(Math.random()-0.5)*20, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-0.5,
      life:0.8, color:col, size:4+Math.random()*4});
  }
}

function updateParticles(dt) {
  for(let i=parts.length-1;i>=0;i--) {
    const p=parts[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=0.12*dt; p.life-=0.03*dt;
    if(p.life<=0) parts.splice(i,1);
  }
}

// ─── ACHIEVEMENTS ──────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // F6: icon = chave do icons.js, ou 1 caractere seguro (★⚡❤ renderizam em toda fonte)
  {id:'first_stomp', icon:'footprint', title:'Primeira Pisada!',     desc:'Pise em cima de um inimigo'},
  {id:'combo5',      icon:'flame',     title:'Combo Impressionante!',desc:'Faça um combo de x5 ou mais'},
  {id:'collector',   icon:'★',         title:'Caçadora de Moedas!',  desc:'Colete todas as moedas da fase'},
  {id:'speedster',   icon:'⚡',         title:'Raio da Maria!',       desc:'Complete fase com 60s+ sobrando'},
  {id:'no_damage',   icon:'shield',    title:'Intocável!',           desc:'Complete fase sem levar dano'},
  {id:'boss_slayer', icon:'dragon',    title:'Domadora de Dragões!', desc:'Derrote o chefe'},
  {id:'heart_saver', icon:'❤',         title:'Cheia de Amor!',       desc:'Colete todos os corações da fase'},
  {id:'all20',       icon:'rainbow',   title:'Aventura Completa!',   desc:'Complete todas as 20 fases'},
];
let _achieveQueue = [];
let _achieveTO   = null;
function checkAchievement(id) {
  if(_earnedAch.includes(id)) return;
  const ach=ACHIEVEMENTS.find(a=>a.id===id); if(!ach) return;
  _earnedAch.push(id);
  sSet('unicornAch', JSON.stringify(_earnedAch));
  _achieveQueue.push(ach);
  if(_achieveTO===null) _showNextAchieve();
}
function _showNextAchieve() {
  if(!_achieveQueue.length){ _achieveTO=null; return; }
  const ach=_achieveQueue.shift();
  const el=document.getElementById('achieveToast');
  el.innerHTML=`${ach.icon.length===1?ach.icon:icon(ach.icon)} Conquista: ${ach.title}`;
  el.classList.add('show');
  _achieveTO=setTimeout(()=>{
    el.classList.remove('show');
    _achieveTO=setTimeout(_showNextAchieve,500);
  },3000);
}

// ─── HAZARDS ───────────────────────────────────────────────────────────────
function drawHazards() {
  if(!hazards.length) return;
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const hz of hazards) {
    if(hz.type==='spike') {
      const n=Math.max(1,Math.floor(hz.w/11));
      const sw=hz.w/n;
      for(let i=0;i<n;i++){
        const sx=hz.x+i*sw+sw/2;
        // danger pulse — vermelho pulsando = armadilha fixa
        const pulse = 0.2 + 0.18*Math.sin(t*5 + i*0.8);
        ctx.fillStyle=`rgba(220,20,20,${pulse})`;
        ctx.beginPath(); ctx.arc(sx,hz.y+hz.h*0.5,sw*0.9,0,Math.PI*2); ctx.fill();
        // spike triangle
        ctx.fillStyle='#cc1111';
        ctx.beginPath(); ctx.moveTo(sx,hz.y); ctx.lineTo(sx-sw*0.42,hz.y+hz.h); ctx.lineTo(sx+sw*0.42,hz.y+hz.h); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ff5555';
        ctx.beginPath(); ctx.moveTo(sx,hz.y+2); ctx.lineTo(sx-sw*0.2,hz.y+hz.h*0.5); ctx.lineTo(sx+sw*0.2,hz.y+hz.h*0.5); ctx.closePath(); ctx.fill();
      }
    } else {
      const g=ctx.createLinearGradient(hz.x,hz.y,hz.x,hz.y+hz.h);
      g.addColorStop(0,'#ff5500'); g.addColorStop(1,'#aa1100');
      ctx.fillStyle=g; ctx.fillRect(hz.x,hz.y,hz.w,hz.h);
      ctx.fillStyle='#ff8800';
      for(let i=0;i<3;i++){
        const bx=hz.x+hz.w*(0.2+i*0.3);
        ctx.beginPath(); ctx.arc(bx,hz.y+4+Math.sin(t*4+i)*3,3,0,Math.PI*2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ─── SOUND ─────────────────────────────────────────────────────────────────
let _ac = null;
function ac() {
  if (!_ac) _ac = new (window.AudioContext||window.webkitAudioContext)();
  return _ac;
}
function tone(freq, type, vol, dur, freqEnd) {
  try {
    const c=ac(), o=c.createOscillator(), g=c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type=type; o.frequency.setValueAtTime(freq, c.currentTime);
    if(freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime+dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+dur);
    o.start(); o.stop(c.currentTime+dur);
  } catch(e){}
}
function noise(vol, dur, cutoff=400) {
  try {
    const c=ac(), buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const src=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
    src.buffer=buf; f.type='lowpass'; f.frequency.value=cutoff;
    src.connect(f); f.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    src.start();
  } catch(e){}
}
const SFX = {
  jump()    { tone(320,'sine',0.22,0.14,640); },
  djump()   { tone(480,'sine',0.18,0.08,960); setTimeout(()=>tone(720,'sine',0.12,0.08,1440),60); },
  coin(semis=0) { const f=1047*Math.pow(2,semis/12); tone(f,'sine',0.15,0.12,f*1.5); },
  land()    { noise(0.1,0.06,160); tone(95,'sine',0.07,0.08,40); },
  stomp()   { noise(0.4,0.1,280); tone(160,'sine',0.2,0.12,60); },
  hurt()    { tone(220,'sawtooth',0.25,0.18,110); noise(0.3,0.15,200); },
  shield()  { tone(660,'sine',0.2,0.06); tone(880,'sine',0.15,0.06); tone(1100,'sine',0.1,0.1); },
  star()    { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.18,0.1),i*60)); },
  speed()   { tone(392,'square',0.1,0.05,784); setTimeout(()=>tone(784,'sine',0.15,0.1,1568),50); },
  cp()      { [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.2,0.15),i*80)); },
  lvlDone() { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,'triangle',0.22,0.2),i*90)); },
  bosshit() { noise(0.5,0.15,500); tone(80,'sine',0.3,0.2,40); },
  bossdie() { [262,330,392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'triangle',0.25,0.3),i*70)); },
  portalin(){ [784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.15,0.15),i*50)); },
  gameover(){ [523,494,440,392,330].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',0.2,0.25),i*100)); },
  magnet()  { [880,1320,880].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.15,0.1),i*60)); },
  drip()    { const f=1200+Math.random()*600; tone(f,'sine',0.06,0.04,f*0.6); setTimeout(()=>noise(0.03,0.06,300),50); },
  wave()    { noise(0.05,1.1,700); },
  wind()    { noise(0.03,1.4,1600); },
};

// ─── FLOAT TEXTS ───────────────────────────────────────────────────────────
function spawnFloat(x, y, text, color='#ffee00', life=1) {
  floatTexts.push({x, y, text, color, life, vy:-1.8, size:22});
}
function updateFloatTexts(dt) {
  for(let i=floatTexts.length-1;i>=0;i--) {
    const f=floatTexts[i];
    f.y+=f.vy*dt; f.vy*=Math.pow(0.95,dt); f.life-=0.025*dt;
    if(f.life<=0) floatTexts.splice(i,1);
  }
}
function drawFloatTexts() {
  ctx.save(); ctx.translate(-camX,0);
  ctx.textAlign='center'; ctx.lineCap='round';
  for(const f of floatTexts) {
    ctx.globalAlpha=f.life;
    ctx.font=`bold ${f.size}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle=f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha=1; ctx.restore();
}

// ─── POWER-UPS ─────────────────────────────────────────────────────────────
// F3: placa de estreia — 1ª vez que cada power-up entra na tela, explica o
// que faz (1x por aventura). Criança aprende vendo, sem ler manual.
const PUP_HELP = { // F6: só palavras — emoji no canvas vira tofu sem fonte colorida
  star:  'Invencível!',
  speed: 'Turbo veloz!',
  shield:'Bloqueia 1 dano!',
  magnet:'Puxa as moedas!',
};
let _seenPup = {};
function updatePups(dt) {
  for(const pu of pups) {
    if(pu.col) continue;
    if(!_seenPup[pu.type] && pu.x>camX-40 && pu.x<camX+CW+40) {
      _seenPup[pu.type]=true;
      spawnFloat(pu.x, pu.y-46, PUP_HELP[pu.type]||pu.type, '#ffffff', 4);
    }
    if(overlap(p.x,p.y,p.w,p.h, pu.x-14,pu.y-14,28,28)) {
      pu.col=true;
      if(pu.type==='star')   { p.starTimer=480;   SFX.star();   spawnFloat(pu.x,pu.y,'★ Estrela!','#ffe066'); spawnStars(pu.x,pu.y); }
      if(pu.type==='speed')  { p.speedTimer=360;  SFX.speed();  spawnFloat(pu.x,pu.y,'>> Turbo!','#44ffcc');  spawnParticles(pu.x,pu.y,'#44ffcc',12); }
      if(pu.type==='shield') { p.hasShield=true;   SFX.shield(); spawnFloat(pu.x,pu.y,'[S] Escudo!','#88aaff'); spawnParticles(pu.x,pu.y,'#88aaff',12); }
      if(pu.type==='magnet') { p.magnetTimer=300;  SFX.magnet(); spawnFloat(pu.x,pu.y,'Ímã!','#ff88ff'); spawnParticles(pu.x,pu.y,'#ff88ff',14); }
    }
  }
  if(p.starTimer>0)   { p.starTimer-=dt;   if(p.starTimer<0)   p.starTimer=0; }
  if(p.speedTimer>0)  { p.speedTimer-=dt;  if(p.speedTimer<0)  p.speedTimer=0; }
  if(p.magnetTimer>0) { p.magnetTimer-=dt; if(p.magnetTimer<0) p.magnetTimer=0;
    // atrai moedas num raio de 140px
    for(const c of coins) {
      if(c.col) continue;
      const dx=p.x+p.w/2-(c.x), dy=p.y+p.h/2-(c.y);
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<140 && d>1){ c.x+=dx/d*5*dt; c.y+=dy/d*5*dt; }
    }
  }
  if(p.comboTimer>0) { p.comboTimer-=dt; if(p.comboTimer<=0){ p.comboTimer=0; p.combo=0; } }
}
function drawPups() {
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const pu of pups) {
    if(pu.col) continue;
    const bob=Math.sin(t*3+pu.x*0.01)*4;
    // glow
    const gl=ctx.createRadialGradient(pu.x,pu.y+bob,2,pu.x,pu.y+bob,20);
    const glCol = pu.type==='star'?'#ffe066':pu.type==='speed'?'#44ffcc':'#88aaff';
    gl.addColorStop(0,glCol+'aa'); gl.addColorStop(1,glCol+'00');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(pu.x,pu.y+bob,20,0,Math.PI*2); ctx.fill();
    // icon
    ctx.save(); ctx.translate(pu.x, pu.y+bob);
    if(pu.type==='star')    drawStar(0, 0, 11, '#ffe066');
    else if(pu.type==='speed')  drawMushroom(0, 0, 10);
    else if(pu.type==='magnet') drawMagnet(0, 0, 11);
    else                        drawShield(0, 0, 10, '#88aaff');
    ctx.restore();
    // rotating ring
    ctx.strokeStyle=glCol; ctx.lineWidth=2; ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.arc(pu.x,pu.y+bob,16, t*2, t*2+Math.PI*1.5); ctx.stroke();
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

// ─── BOSS ──────────────────────────────────────────────────────────────────
function initBoss(L) {
  const bx = L.bossX || 3500;
  return {
    x:bx, y: L.gY-100, w:80, h:100,
    vx:1.2, hp:2, maxHp:2,
    state:'patrol',
    stateT:0, attackT:160, invT:0,
    facing:1, t:0, deadT:0,
    minX:bx-300, maxX:bx+280,
  };
}
function updateBoss(dt) {
  if(!boss) return;
  boss.t += dt;
  if(boss.state==='dead') {
    boss.deadT += dt;
    if(boss.deadT>=80 && boss.deadT-dt<80) {
      const L=LEVELS[lvlIdx];
      portal={x:L.portal[0],y:L.portal[1],w:52,h:72,t:0};
      SFX.portalin();
      spawnFloat(L.portal[0]+26, L.portal[1]-30,'* Portal aberto!','#ff88ff');
    }
    return;
  }
  if(boss.invT>0) boss.invT-=dt;

  if(boss.state==='stunned') {
    boss.stateT-=dt;
    if(boss.stateT<=0) boss.state='patrol';
    return;
  }

  // patrol
  boss.x += boss.vx*boss.facing*dt;
  boss.facing = boss.x<boss.minX?1:boss.x+boss.w>boss.maxX?-1:boss.facing;

  // shoot fireballs — 1 tiro a cada 3s (fixo)
  boss.attackT-=dt;
  if(boss.attackT<=0) {
    boss.attackT = 180;
    spawnFireball();
  }

  // player stomp on boss
  if(boss.invT<=0 && overlap(p.x,p.y,p.w,p.h, boss.x,boss.y,boss.w,boss.h)) {
    const prevBottom = p.y+p.h - p.vy*dt;
    if(p.vy>0 && prevBottom<boss.y+20) {
      hitBoss();
    } else if(p.invT<=0 && p.starTimer<=0) {
      takeDamage(1, 'boss');
    }
  }
}
function spawnFireball() {
  if(!boss||boss.state==='dead') return;
  const dir = p.x > boss.x ? 1 : -1;
  const spread = (Math.random()-0.5)*60;
  fireballs.push({
    x: boss.x+boss.w/2, y: boss.y+40,
    vx: dir*3.5, vy:(p.y-boss.y-40)/200+spread*0.01,
    t:0, alive:true
  });
}
function updateFireballs(dt) {
  for(let i=fireballs.length-1;i>=0;i--) {
    const fb=fireballs[i];
    if(!fb.alive){fireballs.splice(i,1);continue;}
    fb.x+=fb.vx*dt; fb.y+=fb.vy*dt; fb.t+=dt;
    if(fb.x<-100||fb.x>LEVELS[lvlIdx].lw+100||fb.t>240){fireballs.splice(i,1);continue;}
    if(p.invT<=0&&p.starTimer<=0&&overlap(p.x,p.y,p.w,p.h, fb.x-10,fb.y-10,20,20)){
      if(p.hasShield){ p.hasShield=false; SFX.shield(); spawnFloat(p.x+22,p.y,'[S]','#88aaff'); }
      else takeDamage(1, 'fireball');
      fb.alive=false;
    }
  }
}
function hitBoss() {
  boss.hp--;
  SFX.bosshit(); addShake(6,18);
  p.vy=STOMP_V;
  spawnStars(boss.x+boss.w/2, boss.y);
  boss.invT=90;
  boss.state='stunned'; boss.stateT=55;
  spawnFloat(boss.x+40, boss.y-10, boss.hp>0?'-1 HP!':'Nocaute!','#ff4466');
  if(boss.hp<=0) {
    boss.state='dead';
    SFX.bossdie(); addShake(12,40);
    for(let i=0;i<5;i++) setTimeout(()=>spawnStars(
      boss.x+Math.random()*boss.w, boss.y+Math.random()*boss.h),i*100);
    score+=500; ui('scoreDisp',score);
    spawnFloat(boss.x+40,boss.y-30,'+500 pts','#ffe066');
    checkAchievement('boss_slayer');
  }
}
function drawBoss() {
  if(!boss) return;
  const t=boss.t/60;
  ctx.save(); ctx.translate(-camX,0);

  if(boss.state==='dead') {
    // dissolve
    ctx.globalAlpha=Math.max(0, 1-boss.deadT/60);
  }

  const bx=boss.x, by=boss.y;
  const stun=boss.state==='stunned';
  const flip=boss.facing<0?-1:1;
  ctx.save();
  ctx.translate(bx+boss.w/2, by+boss.h/2);
  ctx.scale(flip,1);
  const cx=0,cy=0;

  if(stun){ ctx.filter='brightness(3)'; }

  // shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(cx,cy+boss.h/2+4,38,8,0,0,Math.PI*2); ctx.fill();

  // wings
  const wf=Math.sin(t*8)*18;
  ctx.fillStyle='#44ddcc88';
  ctx.beginPath(); ctx.moveTo(cx-10,cy-15);
  ctx.quadraticCurveTo(cx-60,cy-30-wf,cx-50,cy+20);
  ctx.quadraticCurveTo(cx-25,cy,cx-10,cy-5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx+10,cy-15);
  ctx.quadraticCurveTo(cx+60,cy-30-wf,cx+50,cy+20);
  ctx.quadraticCurveTo(cx+25,cy,cx+10,cy-5); ctx.fill();

  // body
  const bodyG=ctx.createRadialGradient(cx-8,cy-8,5,cx,cy,44);
  bodyG.addColorStop(0,'#88eedd'); bodyG.addColorStop(0.5,'#44bbcc'); bodyG.addColorStop(1,'#226688');
  ctx.fillStyle=bodyG;
  ctx.beginPath(); ctx.ellipse(cx,cy+10,32,38,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#33aaaa'; ctx.lineWidth=2; ctx.stroke();
  // belly
  ctx.fillStyle='rgba(200,255,240,0.3)';
  ctx.beginPath(); ctx.ellipse(cx+6,cy+14,18,22,0,0,Math.PI*2); ctx.fill();

  // spikes on back
  ctx.fillStyle='#55ccbb';
  for(let i=0;i<4;i++){
    const sx=cx-12+i*8, sy=cy-32-Math.abs(Math.sin(t*3+i))*5;
    ctx.beginPath(); ctx.moveTo(sx-5,cy-28); ctx.lineTo(sx,sy); ctx.lineTo(sx+5,cy-28); ctx.fill();
  }

  // head
  const hdG=ctx.createRadialGradient(cx-5,cy-36,4,cx,cy-30,22);
  hdG.addColorStop(0,'#aaffee'); hdG.addColorStop(1,'#44bbcc');
  ctx.fillStyle=hdG;
  ctx.beginPath(); ctx.arc(cx,cy-30,22,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#33aaaa'; ctx.lineWidth=1.5; ctx.stroke();

  // horns on head
  ctx.fillStyle='#ffcc44';
  ctx.beginPath(); ctx.moveTo(cx-8,cy-48); ctx.lineTo(cx-13,cy-64); ctx.lineTo(cx-3,cy-50); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx+8,cy-48); ctx.lineTo(cx+13,cy-64); ctx.lineTo(cx+3,cy-50); ctx.fill();

  // big eyes
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.ellipse(cx-8,cy-32,8,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+8,cy-32,8,7,0,0,Math.PI*2); ctx.fill();
  const eyeCol=stun?'#ffaaaa':'#ff6644';
  ctx.fillStyle=eyeCol;
  ctx.beginPath(); ctx.arc(cx-8,cy-32,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+8,cy-32,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(cx-6,cy-34,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+10,cy-34,2,0,Math.PI*2); ctx.fill();

  // mouth (angry or stunned)
  ctx.strokeStyle='#226688'; ctx.lineWidth=2; ctx.lineCap='round';
  if(stun){
    ctx.beginPath(); ctx.arc(cx,cy-22,5,0,Math.PI); ctx.stroke();
    // X eyes to show dizziness
    ctx.strokeStyle='#ff4466'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx-11,cy-37); ctx.lineTo(cx-5,cy-31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-5,cy-37); ctx.lineTo(cx-11,cy-31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+5,cy-37); ctx.lineTo(cx+11,cy-31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+11,cy-37); ctx.lineTo(cx+5,cy-31); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx-8,cy-20); ctx.lineTo(cx-4,cy-16); ctx.lineTo(cx+4,cy-16); ctx.lineTo(cx+8,cy-20); ctx.stroke();
  }

  ctx.filter='none';
  ctx.restore();

  // HP bar
  const barW=100, barX=bx+boss.w/2-barW/2, barY=by-28;
  ctx.fillStyle='rgba(0,0,0,0.5)';
  roundRectCtx(barX-2,barY-2,barW+4,18,6);
  ctx.fillStyle='#ff4444';
  roundRectCtx(barX,barY,barW,14,5);
  const hpFrac=boss.hp/boss.maxHp;
  ctx.fillStyle=hpFrac>0.6?'#44ff88':hpFrac>0.3?'#ffee44':'#ff4444';
  if(hpFrac>0) roundRectCtx(barX,barY,barW*hpFrac,14,5);
  ctx.fillStyle='white'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
  ctx.fillText(`${boss.hp}/${boss.maxHp}`,barX+barW/2,barY+11);

  ctx.globalAlpha=1;
  ctx.restore();
}
function roundRectCtx(x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill();
}
function drawFireballs() {
  if(!fireballs.length) return;
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const fb of fireballs) {
    const glow=ctx.createRadialGradient(fb.x,fb.y,2,fb.x,fb.y,14);
    glow.addColorStop(0,'#ffffff'); glow.addColorStop(0.3,'#ffcc44'); glow.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(fb.x,fb.y,14,0,Math.PI*2); ctx.fill();
    // inner core
    ctx.fillStyle='#ff8800';
    ctx.beginPath(); ctx.arc(fb.x,fb.y,6,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ─── SHAPE HELPERS (emoji-free drawing) ────────────────────────────────────
function drawHeart(cx, cy, size, color) {
  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx, cy - s * 0.5, cx - s, cy - s * 0.5, cx - s, cy + s * 0.05);
  ctx.bezierCurveTo(cx - s, cy + s * 0.6, cx, cy + s * 1.1, cx, cy + s * 1.25);
  ctx.bezierCurveTo(cx, cy + s * 1.1, cx + s, cy + s * 0.6, cx + s, cy + s * 0.05);
  ctx.bezierCurveTo(cx + s, cy - s * 0.5, cx, cy - s * 0.5, cx, cy + s * 0.35);
  ctx.closePath();
  ctx.fill();
}
function drawShield(cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.8, cy - size * 0.5);
  ctx.lineTo(cx + size * 0.8, cy + size * 0.1);
  ctx.quadraticCurveTo(cx + size * 0.8, cy + size, cx, cy + size * 1.1);
  ctx.quadraticCurveTo(cx - size * 0.8, cy + size, cx - size * 0.8, cy + size * 0.1);
  ctx.lineTo(cx - size * 0.8, cy - size * 0.5);
  ctx.closePath();
  ctx.fill();
}
function drawStar(cx, cy, outer, color) {
  const inner = outer * 0.42;
  ctx.fillStyle = color;
  ctx.beginPath();
  for(let i = 0; i < 5; i++) {
    const ao = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const ai = ao + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(ao) * outer, cy + Math.sin(ao) * outer);
    ctx.lineTo(cx + Math.cos(ai) * inner, cy + Math.sin(ai) * inner);
  }
  ctx.closePath();
  ctx.fill();
}
function drawMushroom(cx, cy, size) {
  // cap
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(cx, cy, size, Math.PI, 0);
  ctx.fill();
  // white dots
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(cx - size*0.3, cy - size*0.3, size*0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + size*0.3, cy - size*0.3, size*0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy - size*0.5, size*0.15, 0, Math.PI*2); ctx.fill();
  // stem
  ctx.fillStyle = '#ffccaa';
  ctx.fillRect(cx - size*0.35, cy, size*0.7, size*0.55);
}

function drawMagnet(cx, cy, size) {
  const s = size;
  ctx.strokeStyle = '#ff44cc'; ctx.lineWidth = s * 0.45;
  ctx.lineCap = 'round';
  // U shape
  ctx.beginPath();
  ctx.arc(cx, cy, s*0.72, Math.PI, 0, false);
  ctx.stroke();
  // poles
  ctx.strokeStyle = '#ff4444';
  ctx.beginPath(); ctx.moveTo(cx - s*0.72, cy); ctx.lineTo(cx - s*0.72, cy + s*0.7); ctx.stroke();
  ctx.strokeStyle = '#4488ff';
  ctx.beginPath(); ctx.moveTo(cx + s*0.72, cy); ctx.lineTo(cx + s*0.72, cy + s*0.7); ctx.stroke();
}

// ─── PHYSICS & COLLISION ───────────────────────────────────────────────────
function overlap(ax,ay,aw,ah, bx,by,bw,bh) {
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}

function updatePlayer(dt) {
  if (p.dead) { p.dieT-=dt; if(p.dieT<=0) triggerDeath(); return; }

  const L = LEVELS[lvlIdx];

  // powerup timers & effects
  updatePups(dt);

  // horizontal input
  const spd = p.speedTimer>0 ? SPD*1.8 : SPD;
  if (keys.left)  { p.vx=-spd; p.facing=-1; }
  else if (keys.right) { p.vx=spd; p.facing=1; }
  else p.vx=0;

  // landSquash decay (rápido para não parecer achatado)
  if(p.landSquash > 0) p.landSquash = Math.max(0, p.landSquash - 0.16 * dt);

  // speed trail
  if(p.speedTimer>0 && (keys.left||keys.right)) {
    spawnParticles(p.x+(p.facing<0?p.w:0),p.y+p.h*0.6,'#44ffcc',3);
    spawnParticles(p.x+(p.facing<0?p.w:0),p.y+p.h*0.8,'#88ffee',2);
  }

  // star rainbow trail
  if(p.starTimer>0)
    spawnParticles(p.x+p.w/2,p.y+p.h/2,`hsl(${(performance.now()/5)%360},100%,70%)`,3);

  // jump — F1: buffer (~120ms) + coyote (~100ms). O aperto vale mesmo se o
  // chão chegou / saiu há poucos frames — essencial no touch impreciso.
  if (jumpEdge) { jumpBuf = JBUF; jumpEdge = false; }
  else if (jumpBuf > 0) jumpBuf -= dt;
  if (jumpBuf > 0) {
    if (p.onG || coyoteT > 0) {
      p.vy=JUMP_V; p.onG=false; coyoteT=0; p.djAvail=true; SFX.jump(); jumpBuf=0;
    }
    else if (p.djAvail) { p.vy=DJ_V; p.djAvail=false; SFX.djump();
      spawnParticles(p.x+p.w/2,p.y+p.h,'#cc88ff',6); jumpBuf=0; }
  }

  const lvlG = LEVELS[lvlIdx].gravity || G;
  p.vy = Math.min(p.vy + lvlG * dt, 18);
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // clamp left
  if (p.x < 0) p.x=0;
  // fell off bottom → perde 1 vida e respawna no checkpoint ou início da fase
  if (p.y > CH+100) { fallDeath(); return; }

  p.onG = false;

  // platform collision
  for (const pl of plats) {
    if (pl.gone) continue;
    if (!overlap(p.x,p.y,p.w,p.h, pl.x,pl.y,pl.w,pl.h)) continue;

    const prevBottom = p.y+p.h - p.vy;
    const prevTop    = p.y     - p.vy;

    if (p.vy>=0 && prevBottom<=pl.y+4) {
      // land on top — poeira ao pousar
      const wasAir = !p.onG;
      p.y  = pl.y - p.h;
      p.vy = 0; p.onG=true; p.djAvail=false;
      if (wasAir) {
        spawnDust(p.x+p.w/2, p.y+p.h, pl.type);
        p.landSquash = 1.0;
        SFX.land();
      }
      if (pl.type==='cloud') { p.vy=CLOUD_V; p.onG=false; p.djAvail=true;
        spawnParticles(p.x+p.w/2,p.y+p.h,'#ffffff',6); }
      if (pl.type==='crumble' && !pl.crumbling) { pl.crumbling=true; pl.cTimer=55; }
    } else if (p.vy<0 && prevTop>=pl.y+pl.h-4) {
      p.y = pl.y+pl.h; p.vy=0;
    } else if (p.vx>0) { p.x=pl.x-p.w; p.vx=0; }
    else if (p.vx<0)  { p.x=pl.x+pl.w; p.vx=0; }
  }

  // F1: coyote time — recém-saído do chão ainda pode pular por ~100ms
  if (p.onG) coyoteT = COYO;
  else coyoteT = Math.max(0, coyoteT - dt);

  // portal
  if (portal && overlap(p.x,p.y,p.w,p.h, portal.x,portal.y,portal.w,portal.h)) {
    completeLevel(); return;
  }

  // checkpoints
  for (const cp of cps) {
    if (!cp.active && overlap(p.x,p.y,p.w,p.h, cp.x-10,cp.y-80,40,80)) {
      cp.active=true; saveCheckpoint(cp); SFX.cp();
      spawnStars(cp.x+10, cp.y-40);
      spawnFloat(cp.x+10, cp.y-55, 'OK! Checkpoint!', '#aaff88');
    }
  }

  // coins
  for (const c of coins) {
    if (!c.col && overlap(p.x,p.y,p.w,p.h, c.x-10,c.y-10,20,20)) {
      c.col=true; score+=10;
      SFX.coin(Math.floor(coins.filter(c=>c.col).length % 7));
      spawnParticles(c.x,c.y,'#ffe066',7);
      spawnFloat(c.x, c.y-10, '+10', '#ffe066');
      ui('scoreDisp',score);
    }
  }

  // hearts
  for (const h of hearts) {
    if (!h.col && overlap(p.x,p.y,p.w,p.h, h.x-14,h.y-14,28,28)) {
      h.col=true;
      p.hp = Math.min(MAX_HP, p.hp + 1);
      ui('livesDisp', p.hp);
      SFX.coin();
      spawnParticles(h.x, h.y, '#ff4466', 12);
      spawnFloat(h.x, h.y-14, '+1 Vida!', '#ff4466');
    }
  }

  // hazard collision
  if(p.invT<=0 && p.starTimer<=0) {
    for(const hz of hazards) {
      if(overlap(p.x,p.y,p.w,p.h, hz.x,hz.y,hz.w,hz.h)) {
        if(p.hasShield){ p.hasShield=false; SFX.shield(); spawnFloat(p.x+22,p.y,'[S]','#88aaff'); p.invT=INV_T; }
        else takeDamage(1, 'hazard');
        break;
      }
    }
  }

  // enemy collision
  // F0 (AUD-05): estrela mata mesmo sob invencibilidade — só pula se NÃO há estrela.
  const starActive = p.starTimer>0;
  if (p.invT>0 && !starActive) { p.invT-=dt; return; }
  for (const e of enems) {
    if (!e.alive) continue;
    // F2: hitbox perdoadora — 80% largura / 85% altura do sprite, base alinhada.
    // O desenho continua igual; só o "corpo que machuca" encolhe.
    const hbW=e.w*0.8, hbH=e.h*0.85, hbX=e.x+(e.w-hbW)/2, hbY=e.y+(e.h-hbH);
    if (!overlap(p.x,p.y,p.w,p.h, hbX,hbY,hbW,hbH)) continue;
    const prevBottom = p.y+p.h - p.vy*dt;
    if (starActive || (p.vy>0 && prevBottom < e.y+10)) {
      stompEnemy(e);
    } else {
      if(p.hasShield){ p.hasShield=false; SFX.shield(); spawnFloat(p.x+22,p.y,'Bloqueado!','#88aaff'); p.invT=INV_T; }
      else takeDamage(1, 'enemy_' + e.type);
    }
  }

  if(p.invT>0) p.invT-=dt;
}

function stompEnemy(e) {
  e.alive=false;
  p.combo++; p.comboTimer=120;
  totalStomps++;
  metricAdd('stomps');
  const pts = 50 * p.combo;
  score+=pts; ui('scoreDisp',score);
  SFX.stomp();
  addShake(4,8);
  if(p.starTimer<=0) p.vy=STOMP_V;
  spawnStars(e.x+e.w/2, e.y);
  spawnParticles(e.x+e.w/2, e.y+e.h/2, '#44ff88', 10);
  spawnFloat(e.x+e.w/2, e.y-10,
    p.combo>1 ? `x${p.combo} COMBO! +${pts}` : `+${pts}`,
    p.combo>2?'#ff44ff':p.combo>1?'#ffcc44':'#ffe066');
  if(totalStomps===1) checkAchievement('first_stomp');
  if(p.combo>=5) checkAchievement('combo5');
}

function takeDamage(dmg, cause='enemy') {
  if(p.dead) return; // F0 (AUD-05): morte única — sem reset de dieT nem dano em cascata
  lastDeathCause = cause;
  p.hp = Math.max(0, p.hp-dmg);
  ui('livesDisp', p.hp);
  SFX.hurt(); addShake(8,20);
  hurtFlash = 18;
  lvlDamageCount++;
  p.combo=0;
  spawnParticles(p.x+p.w/2, p.y+p.h/2,'#ff4466',12);
  spawnFloat(p.x+p.w/2, p.y-10, 'Ai!', '#ff4466');
  if (p.hp<=0) { p.dead=true; p.dieT=60; }
  else { p.invT=INV_T; p.vy=-8; }
}

function fallDeath() {
  lastDeathCause = 'fall';
  p.hp = Math.max(0, p.hp-1);
  ui('livesDisp', p.hp);
  SFX.hurt(); addShake(8,20);
  p.combo=0;
  if (p.hp<=0) {
    p.dead=true; p.dieT=60;
  } else {
    respawnAtCheckpoint();
    spawnParticles(p.x+p.w/2, p.y+p.h/2,'#ff4466',14);
    spawnFloat(p.x+22, p.y-10, 'Ai!', '#ff4466');
    p.invT=INV_T;
  }
}

function respawnAtCheckpoint() {
  const sv = getBestSave();
  if (sv) {
    p.x=sv.x; p.y=sv.y;
    spawnFloat(p.x+22, p.y-20, '★ Checkpoint!', '#aaff88');
  } else {
    const L=LEVELS[lvlIdx];
    p.x=L.start[0]; p.y=L.start[1];
  }
  p.vx=0; p.vy=0;
  camX = Math.max(0, p.x - CW/3);
}

function triggerDeath() {
  stopTimer(); SFX.gameover();
  gs='gameOver';
  metricAdd('deaths');
  const sv = getBestSave();
  document.getElementById('goSub').innerHTML=`Quase! Fase ${lvlIdx+1} — ${score} pontos ${icon('unicorn')}`;
  const tip = DEATH_TIPS[lastDeathCause] || LEVELS[lvlIdx].tip;
  document.getElementById('goTip').textContent = tip;
  const contBtn = document.getElementById('continueBtn');
  contBtn.style.display = sv ? 'block' : 'none';
  contBtn.onclick = () => { hide('gameOverScreen'); continueFromCp(sv); };
  // "recomeçar" agora reinicia a FASE atual (não o jogo todo)
  document.getElementById('restartBtn').innerHTML = `${icon('unicorn')} Recomeçar esta fase`;
  show('gameOverScreen');
}

function continueFromCp(sv) {
  loadLvl(lvlIdx, sv);
  startTimer();
  gs='playing';
}

// ─── PLATFORM UPDATE ───────────────────────────────────────────────────────
function updatePlatforms(dt) {
  for (const pl of plats) {
    if (pl.type==='moving') {
      pl.t += pl.dx * dt;
      pl.x = pl.x0 + Math.sin(pl.t * 0.02) * pl.range;
    }
    if (pl.type==='crumble' && pl.crumbling && !pl.gone) {
      pl.cTimer -= dt;
      if (pl.cTimer<=0) { pl.gone=true; setTimeout(()=>{pl.gone=false;pl.crumbling=false;pl.cTimer=0;},3000); }
    }
  }
}

// ─── ENEMY UPDATE ──────────────────────────────────────────────────────────
function updateEnemies(dt) {
  const L=LEVELS[lvlIdx];
  const diffMult = difficulty==='easy' ? 0.6 : difficulty==='hard' ? 1.6 : 1.0;
  for (const e of enems) {
    if (!e.alive) continue;
    e.t += 0.05 * dt;
    if (e.type==='slime') {
      e.x += e.vx*e.dir*diffMult*dt;
      // patrol: reverse on edges / walls
      let onFloor=false;
      for (const pl of plats) {
        if(pl.gone) continue;
        if (e.x+e.w > pl.x && e.x < pl.x+pl.w &&
            Math.abs((e.y+e.h)-pl.y)<6) { onFloor=true; break; }
      }
      // also reverse if about to walk off
      let aheadX = e.dir>0 ? e.x+e.w+4 : e.x-4;
      let aheadOnFloor=false;
      for (const pl of plats) {
        if(pl.gone) continue;
        if (aheadX > pl.x && aheadX < pl.x+pl.w &&
            Math.abs((e.y+e.h)-pl.y)<8) { aheadOnFloor=true; break; }
      }
      if (!aheadOnFloor || e.x<5 || e.x+e.w>L.lw-5) e.dir*=-1;
    } else if (e.type==='bat') {
      e.x += e.vx*e.dir*diffMult*dt;
      e.y  = e.oy + Math.sin(e.t)*40;
      if (e.x<80 || e.x+e.w>L.lw-80) e.dir*=-1;
    } else if (e.type==='spike') {
      e.x += e.vx*e.dir*diffMult*dt;
      if (e.x<5 || e.x+e.w>L.lw-5) e.dir*=-1;
    } else if (e.type==='bee') {
      // patrulha horizontal no ar; mergulha quando player está próximo abaixo
      e.x += e.vx*e.dir*diffMult*dt;
      if (e.x<80 || e.x+e.w>L.lw-80) e.dir*=-1;
      const dx = Math.abs((e.x+e.w/2)-(p.x+p.w/2));
      const dy = (p.y+p.h/2)-(e.y+e.h/2);
      if(!e.diving && dx<120 && dy>0 && dy<300) {
        e.diving=true; e.diveVy=3*diffMult; e.oy=e.y;
      }
      if(e.diving) {
        e.y += e.diveVy*dt;
        if(e.y > e.oy+160 || e.y < e.oy-20) { e.diving=false; e.diveVy=0; e.y=e.oy; }
      } else {
        e.y = e.oy + Math.sin(e.t*2)*18;
      }
    }
  }
}

// ─── CAMERA ────────────────────────────────────────────────────────────────
function updateCamera(dt) {
  const L=LEVELS[lvlIdx];
  const target = p.x - CW/3;
  camX += (target-camX) * (1 - Math.pow(0.88, dt));
  camX = Math.max(0, Math.min(camX, L.lw-CW));
}

// ─── TIMER ─────────────────────────────────────────────────────────────────
function startTimer() { _timerAccMs = 0; }
function stopTimer()  { _timerAccMs = 0; }
function updateTimer(rawDt) {
  if(speedrunMode) return;
  if(p.dead || gs!=='playing') return; // F0 (AUD-05): sem dano repetido após a morte
  _timerAccMs += rawDt;
  if(_timerAccMs >= 1000) {
    _timerAccMs -= 1000;
    lvlTimer--;
    if(lvlTimer <= 0) { lvlTimer = 0; ui('timeDisp', 0); takeDamage(MAX_HP, 'time'); return; }
    ui('timeDisp', lvlTimer);
  }
}

// ─── LEVEL COMPLETE ────────────────────────────────────────────────────────
function calcStars(idx) {
  const L=LEVELS[idx];
  const coinRatio = L.coins.length>0 ? coins.filter(c=>c.col).length/L.coins.length : 1;
  const timeRatio = L.time>0 ? lvlTimer/L.time : 0;
  let s=1;
  if(coinRatio>=0.6) s++;
  if(timeRatio>=0.35 && lvlDamageCount<=1) s++;
  return s;
}
function starsHtml(n) {
  return ['⭐','⭐','⭐'].map((s,i)=>`<span style="opacity:${i<n?1:0.2};filter:${i<n?'':'grayscale(1)'}">${s}</span>`).join('');
}

function completeLevel() {
  stopTimer();
  metricAdd('levelsCompleted');
  metricAdd('coinsTotal', coins.filter(c=>c.col).length);
  metricAdd('timePlayedSec', LEVELS[lvlIdx].time - lvlTimer);
  score += lvlTimer*5;
  if(score>best){ best=score; sSet('unicornBest',best); }
  ui('scoreDisp',score); ui('bestDisp',best);
  SFX.lvlDone(); addShake(5,20);
  spawnStars(portal.x+26, portal.y+36);

  // stars
  const stars = calcStars(lvlIdx);
  if(!levelStars[lvlIdx] || stars > levelStars[lvlIdx]) {
    levelStars[lvlIdx]=stars;
    sSet('unicornStars', JSON.stringify(levelStars));
  }

  // unlock next level
  if(lvlIdx+1 < LEVELS.length && !unlockedLevels[lvlIdx+1]) {
    unlockedLevels[lvlIdx+1]=true;
    sSet('unicornUnlocked', JSON.stringify(unlockedLevels));
  }

  // per-level record
  const isNewBest = saveLvlBest(lvlIdx, lvlTimer);
  // cosmetics unlock
  if(lvlIdx>=2) unlockCosmetic('wings');
  if(lvlIdx>=4) unlockCosmetic('crown');

  // achievements
  if(lvlDamageCount===0) checkAchievement('no_damage');
  if(lvlTimer>=60) checkAchievement('speedster');
  if(hearts.every(h=>h.col)) checkAchievement('heart_saver');
  if(coins.every(c=>c.col)) checkAchievement('collector');
  if(lvlIdx===LEVELS.length-1) checkAchievement('all20');

  if (lvlIdx>=LEVELS.length-1) {
    gs='win'; stopMusic();
    startCelebration();
    document.getElementById('winSub').innerHTML=`${icon('unicorn')} INCRÍVEL! Pontuação final: ${score} ⭐`;
    show('winScreen');
  } else {
    gs='lvlDone';
    const L=LEVELS[lvlIdx];
    document.getElementById('lvlTitle').innerHTML=`${phaseIcon(lvlIdx)} ${L.name} Completa! ${icon('party')}`;
    document.getElementById('lvlStarsRow').innerHTML = starsHtml(stars);
    const bonusStr = `+${lvlTimer*5} bônus de tempo!${isNewBest?' ★ Novo recorde!':''}`;
    document.getElementById('lvlSub').textContent=bonusStr;
    const nextL=LEVELS[lvlIdx+1];
    document.getElementById('lvlChallenge').innerHTML=
      nextL ? `Próxima: ${phaseIcon(lvlIdx+1)} ${nextL.name}<br>${nextL.tip}` : '';
    show('levelScreen');
  }
}

// ─── DRAWING ───────────────────────────────────────────────────────────────
// backgrounds per theme
const BG_THEMES = {
  meadow:   drawMeadowBg,
  forest:   drawForestBg,
  sky:      drawSkyBg,
  cave:     drawCaveBg,
  castle:   drawCastleBg,
  beach:    drawBeachBg,
  candy:    drawCandyBg,
  moon:     drawMoonBg,
  paradise: drawParadiseBg,
};

function drawBg() {
  const L=LEVELS[lvlIdx];
  const fn=BG_THEMES[L.theme];
  if(fn) fn(L);
}

function drawMeadowBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#87CEEB'); g.addColorStop(1,'#d4f0ff');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // clouds
  ctx.fillStyle='rgba(255,255,255,0.8)';
  for(let i=0;i<6;i++){
    const cx=((i*280-camX*0.3)%( CW+200)+CW+200)%(CW+200)-100;
    drawCloud(cx,60+i*30,80+i*20);
  }
  // hills
  ctx.fillStyle='#8fcc6a';
  for(let i=0;i<5;i++){
    const hx=i*700-(camX*0.6)%(3500);
    ctx.beginPath(); ctx.arc(hx,CH-20,220,0,Math.PI); ctx.fill();
  }
}
function drawForestBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#2d5016'); g.addColorStop(1,'#1a3a0a');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  ctx.fillStyle='#1a2e0a';
  for(let i=0;i<8;i++){
    const tx=(i*450-(camX*0.4)%3600+3600)%3600-200;
    ctx.fillRect(tx,CH-200,28,200);
    ctx.beginPath(); ctx.moveTo(tx+14,CH-450); ctx.lineTo(tx-50,CH-200); ctx.lineTo(tx+78,CH-200); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx+14,CH-380); ctx.lineTo(tx-40,CH-160); ctx.lineTo(tx+68,CH-160); ctx.fill();
  }
  // fireflies
  const t=performance.now()/1000;
  ctx.fillStyle='#ccff66';
  for(let i=0;i<12;i++){
    const fx=(i*280+(camX*0.1))%CW;
    const fy=100+i*30+Math.sin(t*1.5+i)*20;
    ctx.globalAlpha=0.5+0.5*Math.sin(t*3+i);
    ctx.beginPath(); ctx.arc(fx,fy,2,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}
function drawSkyBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#7ec8e3'); g.addColorStop(1,'#f0f9ff');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // big fluffy clouds
  ctx.fillStyle='rgba(255,255,255,0.9)';
  for(let i=0;i<8;i++){
    const cx=((i*310-camX*0.25)%(CW+400)+CW+400)%(CW+400)-150;
    drawCloud(cx,30+i*40,100+i*15);
  }
  // birds
  ctx.strokeStyle='#444'; ctx.lineWidth=1.5;
  const t=performance.now()/1000;
  for(let i=0;i<5;i++){
    const bx=((i*250+t*40-(camX*0.2))%(CW+300)+CW+300)%(CW+300)-150;
    const by=50+i*25+Math.sin(t*2+i)*10;
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo(bx+10,by-5,bx+20,by);
    ctx.moveTo(bx+20,by); ctx.quadraticCurveTo(bx+30,by-5,bx+40,by); ctx.stroke();
  }
}
function drawCaveBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#150025'); g.addColorStop(1,'#0d001a');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // crystals
  const cols=['#aa44ff','#6644ff','#4488ff','#44ffcc'];
  for(let i=0;i<15;i++){
    const cx=((i*260-camX*0.5)%(CW+500)+CW+500)%(CW+500)-200;
    const ch=40+i%5*20;
    ctx.fillStyle=cols[i%cols.length]+'44';
    ctx.beginPath(); ctx.moveTo(cx,CH); ctx.lineTo(cx-15,CH-ch); ctx.lineTo(cx+15,CH-ch); ctx.fill();
    ctx.fillStyle=cols[i%cols.length]+'88';
    ctx.beginPath(); ctx.moveTo(cx,CH-ch-10); ctx.lineTo(cx-15,CH-ch); ctx.lineTo(cx+15,CH-ch); ctx.fill();
  }
  // stalactites top
  ctx.fillStyle='#2a0050';
  for(let i=0;i<12;i++){
    const sx=((i*300-camX*0.6)%(CW+400)+CW+400)%(CW+400)-180;
    ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx-20,60+i%4*20); ctx.lineTo(sx+20,60+i%4*20); ctx.closePath(); ctx.fill();
  }
}
function drawCastleBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#4a0080'); g.addColorStop(0.5,'#800040'); g.addColorStop(1,'#200010');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // rainbow arc
  const t=performance.now()/3000;
  const rcols=['#ff000044','#ff880044','#ffff0044','#00ff0044','#0088ff44','#8800ff44'];
  for(let i=0;i<rcols.length;i++){
    ctx.strokeStyle=rcols[i]; ctx.lineWidth=12; ctx.globalAlpha=0.4;
    ctx.beginPath(); ctx.arc(CW/2,CH+100,280+i*30,Math.PI,0); ctx.stroke();
  }
  ctx.globalAlpha=1;
  // stars
  const t2=performance.now()/1000;
  ctx.fillStyle='white';
  for(let i=0;i<30;i++){
    const sx=(i*137)%CW, sy=(i*97)%200;
    ctx.globalAlpha=0.3+0.7*((Math.sin(t2*1.5+i)+1)/2);
    ctx.beginPath(); ctx.arc(sx,sy,1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawBeachBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#87CEEB'); g.addColorStop(0.6,'#FFF4E0'); g.addColorStop(1,'#F4A460');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // ocean waves
  const t=performance.now()/1000;
  for(let i=0;i<3;i++){
    ctx.fillStyle=`rgba(64,164,223,${0.3-i*0.08})`;
    ctx.beginPath(); ctx.moveTo(0,CH-60+i*12);
    for(let x=0;x<=CW;x+=40){
      ctx.lineTo(x, CH-60+i*12+Math.sin((x/80+t*1.5+i))*8);
    }
    ctx.lineTo(CW,CH); ctx.lineTo(0,CH); ctx.fill();
  }
  // palm trees
  ctx.fillStyle='#8B5E3C';
  for(let i=0;i<4;i++){
    const tx=((i*480-camX*0.3)%(CW+400)+CW+400)%(CW+400)-180;
    ctx.fillRect(tx,CH-200,14,200);
    ctx.fillStyle='#228B22';
    for(let j=0;j<5;j++){
      const la=j/5*Math.PI*1.4-0.3+Math.sin(t+i)*0.1;
      ctx.save(); ctx.translate(tx+7,CH-200);
      ctx.rotate(la-Math.PI/2);
      ctx.beginPath(); ctx.ellipse(40,0,40,10,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle='#8B5E3C';
  }
  // sun
  ctx.fillStyle='#FFD700'; ctx.globalAlpha=0.8;
  ctx.beginPath(); ctx.arc(880,80,45,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
}
function drawCandyBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#FFB3DE'); g.addColorStop(0.5,'#FFD6F5'); g.addColorStop(1,'#FFC8E8');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  const t=performance.now()/1000;
  // candy canes
  const ccols=['#ff4466','#ff88bb'];
  for(let i=0;i<6;i++){
    const cx=((i*350-camX*0.3)%(CW+400)+CW+400)%(CW+400)-150;
    for(let s=0;s<8;s++){
      ctx.fillStyle=ccols[s%2];
      ctx.fillRect(cx+s*8,CH-180,8,180);
    }
    ctx.strokeStyle='#ff4466'; ctx.lineWidth=16;
    ctx.beginPath(); ctx.arc(cx+40,CH-180,40,Math.PI,0); ctx.stroke();
  }
  // floating candy (drawn shapes instead of emoji)
  const candyCols=['#ff4466','#ff88ff','#ff66aa','#ffaacc'];
  for(let i=0;i<8;i++){
    const fx=((i*200+t*15)%(CW+200)+CW+200)%(CW+200)-100;
    const fy=80+i*25+Math.sin(t*2+i)*15;
    ctx.globalAlpha=0.5;
    ctx.fillStyle=candyCols[i%4];
    ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(fx-2, fy-2, 3, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}
function drawMoonBg(L) {
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#000010'); g.addColorStop(0.7,'#0A0A2A'); g.addColorStop(1,'#1A1050');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  const t=performance.now()/1000;
  // stars (many)
  for(let i=0;i<60;i++){
    const sx=(i*163+7)%CW, sy=(i*97+11)%(CH*0.7);
    ctx.globalAlpha=0.4+0.6*((Math.sin(t*0.8+i)+1)/2);
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(sx,sy,0.8+i%3*0.5,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  // earth in background
  const eg=ctx.createRadialGradient(820,120,10,820,120,90);
  eg.addColorStop(0,'#44aaff'); eg.addColorStop(0.5,'#2266cc'); eg.addColorStop(1,'#113388');
  ctx.fillStyle=eg;
  ctx.beginPath(); ctx.arc(820,120,90,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#44aa44';
  ctx.beginPath(); ctx.ellipse(790,100,30,20,0.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(840,130,25,15,-0.3,0,Math.PI*2); ctx.fill();
  // moon craters on ground
  ctx.fillStyle='rgba(255,255,255,0.04)';
  for(let i=0;i<10;i++){
    const cx=((i*320-camX*0.5)%(CW+400)+CW+400)%(CW+400)-150;
    ctx.beginPath(); ctx.arc(cx,CH-30,20+i%4*15,0,Math.PI*2); ctx.fill();
  }
}
function drawParadiseBg(L) {
  const t=performance.now()/1000;
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,`hsl(${t*20%360},80%,75%)`);
  g.addColorStop(0.5,`hsl(${(t*20+120)%360},80%,80%)`);
  g.addColorStop(1,`hsl(${(t*20+240)%360},80%,85%)`);
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  // rainbow arcs
  const rcols=['#ff0000','#ff8800','#ffff00','#00ff00','#0088ff','#8800ff'];
  for(let i=0;i<rcols.length;i++){
    ctx.strokeStyle=rcols[i]; ctx.lineWidth=10; ctx.globalAlpha=0.35;
    ctx.beginPath(); ctx.arc(CW/2,CH+120,300+i*22,Math.PI,0); ctx.stroke();
  }
  ctx.globalAlpha=1;
  // sparkle clouds
  ctx.fillStyle='rgba(255,255,255,0.7)';
  for(let i=0;i<6;i++){
    const cx=((i*260-camX*0.25)%(CW+300)+CW+300)%(CW+300)-120;
    drawCloud(cx,50+i*28,70+i*10);
  }
  // floating stars
  for(let i=0;i<12;i++){
    const fx=((i*180+t*20)%(CW+200)+CW+200)%(CW+200)-100;
    const fy=150+i*18+Math.sin(t*2+i)*20;
    ctx.globalAlpha=0.6+0.4*Math.sin(t*3+i);
    drawStar(fx, fy, 6, '#fffacc');
  }
  ctx.globalAlpha=1;
}

function drawCloud(x,y,r) {
  ctx.beginPath(); ctx.arc(x,y,r*0.5,0,Math.PI*2);
  ctx.arc(x+r*0.4,y-r*0.2,r*0.4,0,Math.PI*2);
  ctx.arc(x+r*0.8,y,r*0.45,0,Math.PI*2);
  ctx.arc(x+r*0.4,y+r*0.2,r*0.35,0,Math.PI*2);
  ctx.fill();
}

// Platform drawing
const PLAT_THEMES = {
  meadow: (p)=>{ fillRound(p,'#5cb85c','#3a8a3a'); drawGrass(p); },
  forest: (p)=>{ fillRound(p,'#7a4520','#5a2e10'); drawBark(p); },
  sky:    (p,type)=>{ if(type==='cloud') drawCloudPlat(p); else { fillRound(p,'#f0e0b0','#c8963c'); ctx.strokeStyle='#ffe8a0'; ctx.lineWidth=2; roundRect(p.x,p.y,p.w,p.h,6); ctx.stroke(); } },
  cave:   (p,type)=>{ if(type==='crumble') drawCrystal(p); else fillRound(p,'#440066','#220044'); },
  beach:  (p,type)=>{ const g2=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h); g2.addColorStop(0,'#F4D03F'); g2.addColorStop(1,'#D4A017'); fillRound(p,null,null,g2); ctx.fillStyle='#C8A015'; for(let i=0;i<p.w/16;i++){ctx.beginPath();ctx.arc(p.x+8+i*16,p.y+2,3,0,Math.PI*2);ctx.fill();} },
  candy:  (p,type)=>{ if(type==='cloud') drawCloudPlat(p); else { const hue=(p.x/8)%360; const g2=ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y); g2.addColorStop(0,`hsl(${hue},90%,65%)`); g2.addColorStop(0.5,`hsl(${(hue+60)%360},90%,70%)`); g2.addColorStop(1,`hsl(${(hue+120)%360},90%,65%)`); fillRound(p,null,'rgba(0,0,0,0.2)',g2); ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; roundRect(p.x,p.y,p.w,p.h,6); ctx.stroke(); }},
  moon:   (p,type)=>{ fillRound(p,'#888','#555'); ctx.fillStyle='rgba(0,0,0,0.2)'; for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(p.x+20+i*(p.w/2-20),p.y+10,5+i*3,0,Math.PI*2);ctx.fill();} },
  paradise:(p,type)=>{ if(type==='cloud') drawCloudPlat(p); else if(type==='crumble') drawCrystal(p); else { const t2=performance.now()/1000; const hue=(t2*40+p.x/10)%360; const g2=ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y+p.h); g2.addColorStop(0,'#FFD700'); g2.addColorStop(0.5,`hsl(${hue},100%,70%)`); g2.addColorStop(1,'#FFD700'); fillRound(p,null,null,g2); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; roundRect(p.x,p.y,p.w,p.h,6); ctx.stroke(); }},
  castle: (p,type)=>{
    if(type==='cloud') drawCloudPlat(p);
    else if(type==='crumble') drawCrystal(p);
    else {
      const g2=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
      g2.addColorStop(0,'#ffd700'); g2.addColorStop(1,'#b8860b');
      ctx.fillStyle=g2; fillRound(p,null,null,g2);
    }
  },
};
function fillRound(pl,fill,shadow,grad) {
  ctx.fillStyle=shadow||'#00000033';
  roundRect(pl.x+2,pl.y+3,pl.w,pl.h,6);
  ctx.fillStyle=grad||fill;
  roundRect(pl.x,pl.y,pl.w,pl.h,6);
}
function roundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  ctx.fill();
}
function drawGrass(pl) {
  ctx.fillStyle='#78d478';
  for(let i=0;i<pl.w/12;i++){
    const gx=pl.x+i*12+4;
    ctx.beginPath(); ctx.arc(gx,pl.y,5,Math.PI,0); ctx.fill();
  }
}
function drawBark(pl) {
  ctx.strokeStyle='#3a1a0544'; ctx.lineWidth=2;
  for(let i=0;i<4;i++){
    const lx=pl.x+8+i*(pl.w/4);
    ctx.beginPath(); ctx.moveTo(lx,pl.y); ctx.lineTo(lx+4,pl.y+pl.h); ctx.stroke();
  }
}
function drawCloudPlat(pl) {
  const t = performance.now()/1000;
  const shake = pl.crumbling ? Math.sin(t*30)*2 : 0;
  const ox = pl.x + shake;

  // sombra suave
  ctx.fillStyle = 'rgba(180,120,220,0.18)';
  ctx.beginPath();
  ctx.arc(ox+20,    pl.y+12, 17, 0, Math.PI*2);
  ctx.arc(ox+pl.w/2,pl.y+8,  21, 0, Math.PI*2);
  ctx.arc(ox+pl.w-20,pl.y+12,17, 0, Math.PI*2);
  ctx.fillRect(ox, pl.y+10, pl.w, 18); ctx.fill();

  // corpo rosa-lavanda para contrastar com o fundo
  const cg = ctx.createLinearGradient(ox, pl.y, ox, pl.y+pl.h+8);
  cg.addColorStop(0, '#f0aaff');
  cg.addColorStop(1, '#d88cf0');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(ox+20,    pl.y+8,  16, 0, Math.PI*2);
  ctx.arc(ox+pl.w/2,pl.y+4,  20, 0, Math.PI*2);
  ctx.arc(ox+pl.w-20,pl.y+8, 16, 0, Math.PI*2);
  ctx.fillRect(ox, pl.y+8, pl.w, 14); ctx.fill();

  // borda colorida que torna a plataforma óbvia
  ctx.strokeStyle = '#cc66ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox+20,    pl.y+8,  16, Math.PI, 0);
  ctx.arc(ox+pl.w/2,pl.y+4,  20, Math.PI, 0);
  ctx.arc(ox+pl.w-20,pl.y+8, 16, Math.PI, 0);
  ctx.stroke();

  // bolinhas decorativas brancas no topo
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.arc(ox+18+i*(pl.w/3-10), pl.y+4, 4, 0, Math.PI*2);
    ctx.fill();
  }
}
function drawCrystal(pl) {
  const t=performance.now()/1000;
  const alpha=pl.gone?0:pl.crumbling?0.4+0.3*Math.sin(t*20):1;
  ctx.globalAlpha=alpha;
  const g2=ctx.createLinearGradient(pl.x,pl.y,pl.x+pl.w,pl.y+pl.h);
  g2.addColorStop(0,'#cc88ff'); g2.addColorStop(1,'#6644ff');
  ctx.fillStyle=g2;
  ctx.strokeStyle='#ffffff44'; ctx.lineWidth=1;
  roundRect(pl.x,pl.y,pl.w,pl.h,4);
  ctx.stroke();
  ctx.globalAlpha=1;
}

function drawPlatforms() {
  const L=LEVELS[lvlIdx];
  const theme=L.theme;
  for(const pl of plats) {
    if(pl.gone) continue;
    ctx.save();
    ctx.translate(-camX,0);
    const fn=PLAT_THEMES[theme];
    if(fn) fn(pl,pl.type); else fillRound(pl,'#888','#555');
    ctx.restore();
  }
}

// portal
function drawPortal() {
  if(!portal) return;
  const t=performance.now()/1000;
  portal.t=t;
  const allCoins = coins.length > 0 && coins.every(c=>c.col);
  const pulse = allCoins ? 1.4 + 0.3*Math.sin(t*6) : 1;
  ctx.save(); ctx.translate(-camX,0);
  // extra glow when all coins collected
  if(allCoins) {
    ctx.globalAlpha=0.25+0.15*Math.sin(t*4);
    ctx.fillStyle=`hsl(${(t*80)%360},100%,70%)`;
    ctx.beginPath();
    ctx.ellipse(portal.x+portal.w/2, portal.y+portal.h/2, portal.w/2+22, portal.h/2+22, 0,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
  }
  // glow rings
  const cols = allCoins ? ['#ffee00','#ff88ff','#00ffcc'] : ['#ff00ff','#8800ff','#00ccff'];
  for(let i=0;i<3;i++){
    ctx.globalAlpha=0.3+0.2*Math.sin(t*3+i);
    ctx.strokeStyle=cols[i]; ctx.lineWidth=(4+i*2)*pulse;
    ctx.beginPath();
    ctx.ellipse(portal.x+portal.w/2, portal.y+portal.h/2, (portal.w/2+i*4)*pulse, (portal.h/2+i*4)*pulse, 0,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.globalAlpha=1;
  // inner fill
  const g=ctx.createRadialGradient(portal.x+26,portal.y+36,5,portal.x+26,portal.y+36,30);
  g.addColorStop(0,'#ffffff'); g.addColorStop(0.3,allCoins?'#ffee44':'#cc44ff'); g.addColorStop(1,'#44007700');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.ellipse(portal.x+portal.w/2,portal.y+portal.h/2, portal.w/2,portal.h/2,0,0,Math.PI*2);
  ctx.fill();
  // door symbol
  const dx=portal.x+portal.w/2, dy=portal.y+portal.h/2;
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2;
  ctx.strokeRect(dx-10, dy-18, 20, 34);
  ctx.fillStyle='#ffee44';
  ctx.beginPath(); ctx.arc(dx+5, dy-2, 3, 0, Math.PI*2); ctx.fill();
  // star above portal when all collected
  if(allCoins) {
    ctx.globalAlpha=0.7+0.3*Math.sin(t*5);
    drawStar(dx, portal.y-16, 10, '#ffee44');
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

// checkpoints
function drawCheckpoints() {
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const cp of cps) {
    // pole
    ctx.fillStyle='#cccccc';
    ctx.fillRect(cp.x,cp.y-80,6,80);
    // flag
    if(cp.active) {
      // ciano pulsante = lugar seguro
      const cpPulse = 0.25 + 0.2*Math.sin(t*3);
      ctx.fillStyle=`rgba(68,255,200,${cpPulse})`;
      ctx.beginPath(); ctx.arc(cp.x+3, cp.y-40, 20, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffee00';
      const wave=Math.sin(t*4)*8;
      ctx.beginPath();
      ctx.moveTo(cp.x+6,cp.y-80);
      ctx.lineTo(cp.x+36+wave,cp.y-68);
      ctx.lineTo(cp.x+6,cp.y-56);
      ctx.closePath(); ctx.fill();
      drawStar(cp.x+8, cp.y-88, 8, '#44ffcc');
    } else {
      ctx.fillStyle='#aaaaaa';
      ctx.fillRect(cp.x+6,cp.y-80,30,24);
    }
  }
  ctx.restore();
}

// collectibles
function drawCoins() {
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const c of coins) {
    if(c.col) continue;
    const bob=Math.sin(t*3+c.x*0.01)*3;
    // coin glow
    ctx.fillStyle='#ffe066aa';
    ctx.beginPath(); ctx.arc(c.x,c.y+bob,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffe066';
    ctx.beginPath(); ctx.arc(c.x,c.y+bob,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffcc00';
    ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('★',c.x,c.y+bob+4);
  }
  ctx.restore();
}

function drawHearts() {
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const h of hearts) {
    if(h.col) continue;
    const bob=Math.sin(t*2.5+h.x*0.01)*4;
    // glow
    ctx.fillStyle='#ff446644';
    ctx.beginPath(); ctx.arc(h.x, h.y+bob, 16, 0, Math.PI*2); ctx.fill();
    ctx.save();
    ctx.translate(h.x, h.y+bob - 4);
    drawHeart(0, 0, 9, '#ff4466');
    // highlight
    ctx.fillStyle='rgba(255,180,180,0.5)';
    ctx.beginPath(); ctx.ellipse(-3, -2, 4, 3, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// enemies
function drawEnemies() {
  const t=performance.now()/1000;
  ctx.save(); ctx.translate(-camX,0);
  for(const e of enems) {
    if(!e.alive) continue;
    ctx.save();
    if(e.type==='slime') drawSlime(e,t);
    else if(e.type==='bat') drawBat(e,t);
    else if(e.type==='bee') drawBee(e,t);
    else drawSpike(e,t);
    ctx.restore();
  }
  ctx.restore();
}

function drawSlime(e,t) { ch_drawSlime(ctx,e,t); }

function drawBat(e,t) { ch_drawBat(ctx,e,t); }

function drawBee(e,t) { ch_drawBee(ctx,e,t); }

function drawSpike(e,t) { ch_drawSpike(ctx,e,t); }

// ── Leg helper — delega para characters.js ──────────────────────────────────
function drawLeg(bx, by, swing, topCol, hoofCol) {
  ch_drawLeg(ctx, bx, by, swing, topCol, hoofCol);
}

// player unicorn — delega para characters.js
function drawPlayer() {
  ch_drawUnicorn(ctx, p, camX, keys, cosmetics, gs === 'win');
}

// particles
function drawParticles() {
  ctx.save(); ctx.translate(-camX,0);
  for(const p of parts) {
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

// HP display in canvas
function drawHUD() {
  // corações dinâmicos: até 5
  if(p.hp <= 0) {
    // broken heart (X)
    ctx.strokeStyle='#884466'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(14,CH-26); ctx.lineTo(22,CH-18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22,CH-26); ctx.lineTo(14,CH-18); ctx.stroke();
  } else {
    for(let i=0; i<Math.min(p.hp, MAX_HP); i++) {
      drawHeart(18 + i*26, CH-22, 8, '#ff4466');
    }
  }

  // active power-up timers
  let puX = 12;
  if(p.starTimer>0){
    const frac=p.starTimer/480;
    drawTimerBar(puX, CH-50, 60, 8, frac,'#ffe066','star');
    puX+=72;
  }
  if(p.speedTimer>0){
    const frac=p.speedTimer/360;
    drawTimerBar(puX, CH-50, 60, 8, frac,'#44ffcc','speed');
    puX+=72;
  }
  if(p.magnetTimer>0){
    const frac=p.magnetTimer/300;
    drawTimerBar(puX, CH-50, 60, 8, frac,'#ff88ff','magnet');
    puX+=72;
  }
  if(p.hasShield){
    ctx.save(); ctx.translate(puX+11, CH-44);
    drawShield(0, 0, 10, '#88aaff');
    ctx.restore(); puX+=32;
  }

  // combo display
  if(p.combo>1){
    ctx.font=`bold ${18+Math.min(p.combo,6)*2}px sans-serif`;
    ctx.textAlign='center';
    const hue=(performance.now()/5)%360;
    ctx.fillStyle=`hsl(${hue},100%,65%)`;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=3;
    ctx.strokeText(`x${p.combo} COMBO`, CW/2, 48);
    ctx.fillText(`x${p.combo} COMBO`, CW/2, 48);
  }

  // speedrun timer
  if(speedrunMode) {
    const s=(speedrunMs/1000).toFixed(2);
    ctx.font='bold 18px monospace'; ctx.textAlign='center';
    ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=3;
    ctx.strokeText(`REC: ${s}s`, CW/2, 30);
    ctx.fillStyle='#44ffcc'; ctx.fillText(`REC: ${s}s`, CW/2, 30);
  }

  // phase name
  const L=LEVELS[lvlIdx];
  ctx.font='bold 14px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.textAlign='right';
  ctx.fillText(L.name, CW-10, CH-14);

  // ── HUD inline (mobile only) ──────────────────────────────────────────────
  // F4: minimal — ⭐ moedas e ❤️ vidas grandes; fase/recorde moram no pause/stats.
  if(!isMobile) return;
  const barH = 40;
  ctx.fillStyle='rgba(0,0,0,0.45)';
  roundRectCtx(6, 6, CW-12, barH, 10);

  ctx.textBaseline='middle';
  const cy = 6 + barH/2;
  ctx.textAlign='left';
  ctx.fillStyle='#ffe066';
  ctx.font='bold 20px sans-serif';
  ctx.fillText(`★ ${score}`, 14, cy);
  // F6: reloginho desenhado — ⏱️ no canvas vira tofu sem fonte emoji
  ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(158, cy, 8, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(158, cy); ctx.lineTo(158, cy-5);
  ctx.moveTo(158, cy); ctx.lineTo(162, cy+2); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.font='bold 15px sans-serif';
  const timeStr = speedrunMode ? ((speedrunMs/1000).toFixed(1)+'s') : (lvlTimer+'s');
  ctx.fillText(timeStr, 170, cy);
  // lives as big hearts on the right
  const nHp = Math.min(p.hp, MAX_HP);
  const hpX = CW - 14 - hudRightReserve - nHp * 26;
  for(let i=0; i<nHp; i++) {
    drawHeart(hpX + i*26, cy, 9, '#ff4466');
  }
  ctx.textBaseline='alphabetic';
}
function drawTimerBar(x,y,w,h,frac,col,icon){
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(x,y,w,h);
  ctx.fillStyle=col; ctx.fillRect(x,y,w*frac,h);
  if(icon==='star') { drawStar(x+6, y-7, 6, '#ffe066'); }
  else if(icon==='speed') { ctx.fillStyle='#44ffcc'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left'; ctx.fillText('>>', x, y-2); }
  else if(icon==='shield') { ctx.save(); ctx.translate(x+6,y-7); drawShield(0,0,6,'#88aaff'); ctx.restore(); }
}

// ─── MUSIC ─────────────────────────────────────────────────────────────────
const N={c4:262,d4:294,e4:330,f4:349,g4:392,a4:440,b4:494,
         c5:523,d5:587,e5:659,f5:698,g5:784,a5:880,b5:988,c6:1047,
         cs5:554,ds5:622,fs5:740,gs5:831,r:0};
const MELODIES=[
  {bpm:130,notes:[N.e5,N.g5,N.a5,N.g5,N.e5,N.d5,N.c5,N.d5,N.e5,N.e5,N.d5,N.d5,N.c5,N.g4,N.a4,N.c5]},
  {bpm:110,notes:[N.a5,N.c5,N.e5,N.d5,N.c5,N.b4,N.a4,N.b4,N.c5,N.e5,N.g5,N.e5,N.d5,N.c5,N.a4,N.r]},
  {bpm:100,notes:[N.f5,N.g5,N.a5,N.c6,N.a5,N.g5,N.f5,N.g5,N.a5,N.a5,N.g5,N.f5,N.e5,N.f5,N.g5,N.r]},
  {bpm:120,notes:[N.d5,N.r,N.f5,N.e5,N.d5,N.c5,N.a4,N.b4,N.c5,N.d5,N.e5,N.c5,N.d5,N.r,N.a4,N.r]},
  {bpm:140,notes:[N.g5,N.b5,N.d6,N.b5,N.g5,N.a5,N.b5,N.g5,N.c6,N.b5,N.a5,N.g5,N.fs5,N.g5,N.a5,N.r]},
  {bpm:125,notes:[N.g5,N.b5,N.d6,N.b5,N.g5,N.a5,N.b5,N.a5,N.g5,N.e5,N.d5,N.e5,N.g5,N.a5,N.b5,N.g5]},
  {bpm:145,notes:[N.e5,N.gs5,N.b5,N.gs5,N.e5,N.fs5,N.gs5,N.e5,N.b5,N.a5,N.gs5,N.fs5,N.e5,N.r,N.b4,N.e5]},
  {bpm:80, notes:[N.c5,N.r,N.e5,N.r,N.g5,N.e5,N.c5,N.r,N.d5,N.r,N.f5,N.r,N.a5,N.f5,N.d5,N.r]},
  {bpm:160,notes:[N.c6,N.b5,N.a5,N.g5,N.f5,N.g5,N.a5,N.c6,N.d6,N.c6,N.b5,N.a5,N.g5,N.a5,N.b5,N.g5]},
  {bpm:150,notes:[N.c6,N.b5,N.a5,N.b5,N.c6,N.c6,N.b5,N.c6,N.b5,N.a5,N.g5,N.a5,N.b5,N.c6,N.b5,N.r]},
];
let _musicNodes=[], _musicTO=null, _curMelody=null;
let musicMuted = sGet('unicornMute')==='1';
let _lastMusicIdx = 0;
let _ambientTO = null;
const AMBIENT_MAP = {
  3: ()=>{ SFX.wind(); },  // nuvens
  4: ()=>{ SFX.drip(); },  // caverna
  6: ()=>{ SFX.wave(); },  // praia
  8: ()=>{ SFX.wind(); },  // lua
};
function playAmbient(idx) {
  clearTimeout(_ambientTO);
  if(musicMuted) return;
  const fn = AMBIENT_MAP[idx];
  if(!fn) return;
  const delay = 4000 + Math.random() * 6000;
  _ambientTO = setTimeout(()=>{ if(gs==='playing'){ fn(); playAmbient(idx); } }, delay);
}
function playMusic(idx) {
  _lastMusicIdx = idx;
  stopMusic();
  if(musicMuted) return;
  _curMelody=MELODIES[Math.min(idx,MELODIES.length-1)];
  _schedMusic();
  playAmbient(idx);
}
function stopMusic() {
  clearTimeout(_musicTO);
  clearTimeout(_ambientTO);
  _musicNodes.forEach(n=>{ try{n.stop();}catch(e){} });
  _musicNodes=[]; _curMelody=null;
}
function _schedMusic() {
  if(!_curMelody) return;
  try {
    const c=ac(), bd=60/_curMelody.bpm;
    let t=c.currentTime+0.05;
    for(const freq of _curMelody.notes) {
      if(freq>0) {
        // melody voice
        const o=c.createOscillator(),g=c.createGain();
        o.connect(g);g.connect(c.destination);
        o.type='square'; o.frequency.value=freq;
        g.gain.setValueAtTime(0.055,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+bd*0.88);
        o.start(t); o.stop(t+bd); _musicNodes.push(o);
        // bass (octave below, softer)
        const ob=c.createOscillator(),gb=c.createGain();
        ob.connect(gb);gb.connect(c.destination);
        ob.type='triangle'; ob.frequency.value=freq/2;
        gb.gain.setValueAtTime(0.025,t);
        gb.gain.exponentialRampToValueAtTime(0.001,t+bd*0.5);
        ob.start(t); ob.stop(t+bd); _musicNodes.push(ob);
      }
      t+=bd;
    }
    const total=_curMelody.notes.length*bd*1000;
    _musicTO=setTimeout(_schedMusic, total-80);
  }catch(e){}
}

// ─── COSMETICS ─────────────────────────────────────────────────────────────
let cosmetics = sGetJSON('unicornCosmetics', {});
function unlockCosmetic(k) {
  if(!cosmetics[k]){ cosmetics[k]=true; sSet('unicornCosmetics',JSON.stringify(cosmetics)); }
}

// ─── PER-LEVEL RECORDS ─────────────────────────────────────────────────────
let lvlBests = sGetJSON('unicornLvlBests', []);
function saveLvlBest(idx, time) {
  const prev=lvlBests[idx]||0;
  if(time>prev){ lvlBests[idx]=time; sSet('unicornLvlBests',JSON.stringify(lvlBests)); return true; }
  return false;
}

// ─── CONFETTI / CELEBRATION ────────────────────────────────────────────────
let confetti=[];
function spawnConfetti(n=120) {
  const cols=['#ff4466','#ffcc44','#44ff88','#4488ff','#ff44ff','#44ffcc','#ffffff'];
  for(let i=0;i<n;i++) confetti.push({
    x:Math.random()*CW, y:-20+Math.random()*-80,
    vx:(Math.random()-0.5)*5, vy:2+Math.random()*4,
    rot:Math.random()*Math.PI*2, vrot:(Math.random()-0.5)*0.15,
    w:8+Math.random()*8, h:4+Math.random()*5,
    color:cols[Math.floor(Math.random()*cols.length)], life:1
  });
}
function updateConfetti() {
  for(let i=confetti.length-1;i>=0;i--){
    const c=confetti[i];
    c.x+=c.vx; c.y+=c.vy; c.rot+=c.vrot; c.vy+=0.08; c.life-=0.004;
    if(c.y>CH+20||c.life<=0) confetti.splice(i,1);
  }
}
function drawConfetti() {
  for(const c of confetti){
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.rot);
    ctx.globalAlpha=c.life;
    ctx.fillStyle=c.color;
    ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
// fireworks for win screen
let fireworks=[];
function spawnFirework(x,y) {
  const cols=['#ff4466','#ffcc44','#44ffcc','#ff88ff','#88aaff','#ffffff'];
  const col=cols[Math.floor(Math.random()*cols.length)];
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2, sp=3+Math.random()*5;
    fireworks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      color:col,life:1,size:3+Math.random()*3});
  }
}
function updateFireworks() {
  for(let i=fireworks.length-1;i>=0;i--){
    const f=fireworks[i];
    f.x+=f.vx; f.y+=f.vy; f.vy+=0.12; f.life-=0.025;
    if(f.life<=0) fireworks.splice(i,1);
  }
}
function drawFireworks() {
  for(const f of fireworks){
    ctx.globalAlpha=f.life;
    ctx.fillStyle=f.color;
    ctx.beginPath(); ctx.arc(f.x,f.y,f.size,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}
let fwInterval=null;
function startCelebration() {
  spawnConfetti(200);
  clearInterval(fwInterval);
  fwInterval=setInterval(()=>{
    spawnFirework(100+Math.random()*(CW-200), 80+Math.random()*200);
    spawnConfetti(30);
  },600);
}
function stopCelebration() { clearInterval(fwInterval); fwInterval=null; confetti=[]; fireworks=[]; }

// ─── ANIMATED START BACKGROUND ─────────────────────────────────────────────
let menuUnicornX = CW + 60;
let menuUnicornDir = -1; // -1 = trotting in, 0 = idle
function drawMenuScene() {
  drawMeadowBg({});
  const t = performance.now() / 1000;

  if (menuUnicornDir === -1) {
    menuUnicornX -= 3;
    if (menuUnicornX < CW / 2 - 22) { menuUnicornDir = 0; menuUnicornX = CW / 2 - 22; }
  }

  // Save and override player state to draw unicorn at menu position
  const _camX = camX;
  const _px = p.x, _py = p.y, _pf = p.facing, _pg = p.onG, _pvy = p.vy;
  const _pls = p.landSquash || 0, _pinv = p.invT;

  camX = 0;
  p.x = menuUnicornX;
  p.y = CH - 172;
  p.facing = 1;
  p.onG = menuUnicornDir === 0;
  p.vy = 0;
  p.landSquash = 0;
  p.invT = 0;

  drawPlayer();

  camX = _camX;
  p.x = _px; p.y = _py; p.facing = _pf; p.onG = _pg;
  p.vy = _pvy; p.landSquash = _pls; p.invT = _pinv;

  // Horn sparkles when idle
  if (menuUnicornDir === 0 && Math.random() < 0.3) {
    const hornX = menuUnicornX + 11 + 2, hornY = CH - 172 + 26 - 22 - 18 - 16;
    spawnParticles(hornX + (Math.random() - 0.5) * 12, hornY + Math.random() * 10,
      `hsl(${(t * 80) % 360}, 100%, 75%)`, 1);
  }
}

// ─── MAIN LOOP ─────────────────────────────────────────────────────────────
let raf;
function loop(ts) {
  raf=requestAnimationFrame(loop);
  const rawDt = lastTime ? Math.min(ts - lastTime, 50) : 16.667;
  lastTime = ts;
  const dt = rawDt / 16.667;
  ctx.clearRect(0,0,CW,CH);

  if(gs==='playing') {
    updatePlatforms(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateFireballs(dt);
    updateCamera(dt);
    updateParticles(dt);
    updateFloatTexts(dt);
    updateTimer(rawDt);
    if(speedrunMode) speedrunMs += rawDt;
    if(shakeDur>0){ shakeDur-=dt; } else shakeAmp=0;
    shakeAmp *= Math.pow(0.85, dt);
  }
  if(gs==='win') { updateConfetti(); updateFireworks(); }

  // apply screen shake
  const sx = shakeDur>0 ? (Math.random()*2-1)*shakeAmp : 0;
  const sy = shakeDur>0 ? (Math.random()*2-1)*shakeAmp : 0;
  ctx.save(); ctx.translate(sx,sy);

  if(gs==='start') {
    drawMenuScene();
  } else {
    drawBg();
    drawPlatforms();
    drawHazards();
    drawPortal();
    drawCheckpoints();
    drawCoins();
    drawHearts();
    drawPups();
    drawEnemies();
    drawBoss();
    drawFireballs();
    drawPlayer();
    drawParticles();
    drawFloatTexts();
    drawHUD();
    // hurt flash overlay (dt is in scope from loop)
    if(hurtFlash>0) {
      ctx.fillStyle=`rgba(255,0,0,${hurtFlash/18*0.32})`;
      ctx.fillRect(0,0,CW,CH);
      hurtFlash -= dt;
      if(hurtFlash<0) hurtFlash=0;
    }
  }

  if(gs==='win') { drawConfetti(); drawFireworks(); }

  ctx.restore();
  jumpEdge=false;
}

// ─── UI HELPERS ────────────────────────────────────────────────────────────
function ui(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }
// F4: diálogo abre com foco no CTA — teclado/leitor entram na tela certa
function show(id){ const el=document.getElementById(id); if(el){el.classList.remove('show');void el.offsetWidth;el.classList.add('show'); const btn=el.querySelector('.over-btn:not([style*="none"])'); if(btn && btn.offsetParent!==null) btn.focus({preventScroll:true});} }
function hide(id){ const el=document.getElementById(id); if(el) el.classList.remove('show'); }

// ─── INPUT HANDLERS ────────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.repeat) return;
  if(e.code==='KeyP'||e.code==='Escape') {
    if(gs==='playing') { gs='paused'; show('pauseScreen'); }
    else if(gs==='paused') { gs='playing'; hide('pauseScreen'); }
    return;
  }
  if(e.code==='ArrowLeft'||e.code==='KeyA') keys.left=true;
  if(e.code==='ArrowRight'||e.code==='KeyD') keys.right=true;
  if(e.code==='ArrowUp'||e.code==='Space'||e.code==='KeyW'){
    keys.jump=true; jumpEdge=true;
    if(gs==='start') startGame();
  }
  e.preventDefault && (e.code==='Space'||e.code.startsWith('Arrow')) && e.preventDefault();
});
document.addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA') keys.left=false;
  if(e.code==='ArrowRight'||e.code==='KeyD') keys.right=false;
  if(e.code==='ArrowUp'||e.code==='Space'||e.code==='KeyW') { keys.jump=false; cutJump(); }
});
document.addEventListener('blur',()=>{ keys.left=keys.right=keys.jump=false; });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) keys.left=keys.right=keys.jump=false; });

// mobile — F1: <button> + Pointer Events (touch+mouse+caneta, multitouch real
// via captura implícita do touch). Soltar o pulo corta a subida (cutJump).
function bindBtn(id,key,isJump){
  const el=document.getElementById(id); if(!el) return;
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    keys[key]=true;
    if(isJump) jumpEdge=true;
    el.classList.add('pressed');
    try { navigator.vibrate?.(20); } catch(_){}
  });
  const up=e=>{
    if(e.cancelable) e.preventDefault();
    keys[key]=false;
    el.classList.remove('pressed');
    if(isJump) cutJump();
  };
  el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',up);
  el.addEventListener('lostpointercapture',()=>{ keys[key]=false; el.classList.remove('pressed'); });
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
bindBtn('btnLeft','left',false);
bindBtn('btnRight','right',false);
bindBtn('btnJump','jump',true);

// fullscreen
function toggleFullscreen(){
  const el=document.documentElement;
  if(!document.fullscreenElement){
    // Em tela cheia o Android aceita travar em paisagem; fora dela o lock só rejeita.
    el.requestFullscreen?.()?.then(()=>screen.orientation?.lock?.('landscape').catch(()=>{})).catch(()=>{});
  }
  else document.exitFullscreen?.();
}
document.getElementById('fsBtn')?.addEventListener('click',toggleFullscreen);

// Botão de tela cheia do celular. Some onde não há o que fazer: iPhone (sem
// Fullscreen API) e app instalado (o manifest já abre em display:fullscreen).
const mobileFsBtn=document.getElementById('mobileFsBtn');
let hudRightReserve=0; // unidades do canvas que os corações do HUD mobile cedem ao botão
function updateHudRightReserve(){
  if(!isMobile || !mobileFsBtn || mobileFsBtn.hidden){ hudRightReserve=0; return; }
  const b=mobileFsBtn.getBoundingClientRect(), c=canvas.getBoundingClientRect();
  hudRightReserve = c.width ? Math.ceil((c.right-b.left)*CW/c.width) : 0;
}
if(mobileFsBtn){
  if(!document.fullscreenEnabled || window.matchMedia('(display-mode: fullscreen)').matches) mobileFsBtn.hidden=true;
  mobileFsBtn.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{
    mobileFsBtn.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false');
    mobileFsBtn.setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia');
    updateHudRightReserve();
  });
  window.addEventListener('resize',updateHudRightReserve);
  updateHudRightReserve();
}

// ─── GAME FLOW ─────────────────────────────────────────────────────────────
function startGame() {
  speedrunMode = document.getElementById('speedrunCheck')?.checked || false;
  speedrunMs = 0;
  hide('startScreen');
  stopCelebration();
  lvlIdx=0; score=0;
  _seenPup={}; // F3: placas de estreia reaparecem a cada nova aventura
  loadLvl(0);
  gs='playing';
  startTimer();
  try { screen.orientation?.lock('landscape-primary').catch(()=>{}); } catch(_){}
}

document.getElementById('startBtn')?.addEventListener('click', startGame);

// Pause handlers
document.getElementById('resumeBtn')?.addEventListener('click',()=>{
  gs='playing'; hide('pauseScreen');
});
document.getElementById('pauseRestartBtn')?.addEventListener('click',()=>{
  hide('pauseScreen');
  loadLvl(lvlIdx);
  gs='playing'; startTimer();
});

// Level select
function buildLevelGrid() {
  const grid=document.getElementById('levelGrid');
  if(!grid) return;
  grid.innerHTML='';
  LEVELS.forEach((L,i)=>{
    const btn=document.createElement('button');
    btn.className='ls-btn'+(i===lvlIdx?' ls-current':'');
    const st=levelStars[i]||0;
    const starStr='★'.repeat(st)+'☆'.repeat(3-st);
    const unlocked=!!unlockedLevels[i];
    btn.innerHTML=`<span class="ls-emoji">${unlocked?phaseIcon(i):icon('lock')}</span><span class="ls-name">${unlocked?L.name:'Bloqueado'}</span><span class="ls-stars" style="color:#ffe066">${starStr}</span>`;
    btn.disabled=!unlocked;
    if(unlocked) btn.addEventListener('click',()=>{
      ['levelSelectScreen','startScreen','levelScreen','winScreen',
       'gameOverScreen','pauseScreen','previewScreen','statsScreen'].forEach(hide);
      lvlIdx=i; score=0;
      loadLvl(i);
      gs='playing'; startTimer();
    });
    grid.appendChild(btn);
  });
}
document.getElementById('lsBtn')?.addEventListener('click',()=>{
  buildLevelGrid();
  show('levelSelectScreen');
});
document.getElementById('lsCloseBtn')?.addEventListener('click',()=>hide('levelSelectScreen'));

// ─── STATS SCREEN ──────────────────────────────────────────────────────────
function openStats() {
  const m = _metrics;
  const totalStars = levelStars.reduce((s,v)=>s+(v||0), 0);
  const maxStars   = LEVELS.length * 3;
  const phasesCompleted = Math.min(unlockedLevels.filter(Boolean).length - 1, LEVELS.length);

  const fmtTime = s => {
    const h = Math.floor(s/3600), m2 = Math.floor((s%3600)/60), sec = s%60;
    return h>0 ? `${h}h ${m2}m` : m2>0 ? `${m2}m ${sec}s` : `${sec}s`;
  };

  const stats = [
    { icon:'trophy', val: phasesCompleted + '/' + LEVELS.length, label:'Fases' },
    { icon:'★',      val: totalStars + '/' + maxStars,            label:'Estrelas' },
    { icon:'skull',  val: m.deaths||0,                            label:'Mortes' },
    { icon:'footprint', val: m.stomps||0,                         label:'Stomps' },
    { icon:'coin',   val: m.coinsTotal||0,                        label:'Moedas' },
    { icon:'clock',  val: fmtTime(m.timePlayedSec||0),            label:'Tempo' },
  ];

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = stats.map(s=>
    `<div class="stat-card">
      <div class="stat-icon">${s.icon.length===1?s.icon:icon(s.icon)}</div>
      <div class="stat-val">${s.val}</div>
      <div class="stat-label">${s.label}</div>
    </div>`
  ).join('');

  const starsEl = document.getElementById('statsStarsRow');
  starsEl.innerHTML = Array.from({length:maxStars}, (_,i)=>
    `<span style="font-size:.9rem;opacity:${i<totalStars?1:0.2}">${i<totalStars?'⭐':'☆'}</span>`
  ).join('');

  const prog = document.getElementById('statsProgress');
  const pct = Math.round(totalStars/maxStars*100);
  prog.innerHTML = `${pct}% completo — continue, Maria! ${icon('unicorn')}`;

  show('statsScreen');
}

document.getElementById('statsBtn')?.addEventListener('click', openStats);
document.getElementById('statsCloseBtn')?.addEventListener('click',()=>hide('statsScreen'));

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.classList.toggle('active', btn.dataset.diff===difficulty);
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    difficulty=btn.dataset.diff;
    sSet('unicornDiff',difficulty);
  });
});

// Share buttons
function shareText(text) {
  if(navigator.clipboard) {
    navigator.clipboard.writeText(text).then(()=>{
      spawnFloat(CW/2, CH/2,'Copiado ✓','#44ffcc');
    }).catch(()=>{ try{ prompt('Copie o resultado:',text); }catch(_){} });
  } else { try{ prompt('Copie o resultado:',text); }catch(_){} }
}
document.getElementById('shareLvlBtn')?.addEventListener('click',()=>{
  const st=levelStars[lvlIdx]||0;
  const L=LEVELS[lvlIdx];
  shareText(`🦄 Jogo da Maria\n${L.emoji} ${L.name}\n${'★'.repeat(st)}${'☆'.repeat(3-st)} • ${score} pontos\n#JogoDaMaria`);
});
document.getElementById('shareWinBtn')?.addEventListener('click',()=>{
  const allS=LEVELS.map((_,i)=>'★'.repeat(levelStars[i]||0)+'☆'.repeat(3-(levelStars[i]||0))).join(' ');
  shareText(`🦄 Venci o Jogo da Maria! 🏆\nPontuação: ${score}\n${allS}\n#JogoDaMaria`);
});

function showLevelPreview(idx) {
  const L = LEVELS[idx];
  if(!L) return; // F0 (AUD-05): sem fase além da última (winScreen cobre o final)
  const best = levelStars[idx] || 0;
  document.getElementById('previewTitle').innerHTML = `${phaseIcon(idx)} ${L.name}`;
  document.getElementById('previewStarsBest').innerHTML =
    [0,1,2].map(i=>`<span style="opacity:${i<best?1:0.25};filter:${i<best?'':'grayscale(1)'}">⭐</span>`).join('');
  const coinTarget = Math.ceil((L.coins?.length||0) * 0.6);
  const timeTarget = Math.ceil(L.time * 0.35);
  document.getElementById('previewObjectives').innerHTML =
    `<b>Como ganhar 3 estrelas:</b><br>` +
    `⭐ Chegue ao portal<br>` +
    `⭐⭐ Colete ${coinTarget} moedas<br>` +
    `⭐⭐⭐ Termine com +${timeTarget}s e no máx. 1 dano`;
  show('previewScreen');
}

document.getElementById('nextLvlBtn')?.addEventListener('click',()=>{
  hide('levelScreen');
  if(lvlIdx+1 >= LEVELS.length) return; // F0 (AUD-05): última fase termina em winScreen
  lvlIdx++;
  showLevelPreview(lvlIdx);
});

document.getElementById('previewStartBtn')?.addEventListener('click',()=>{
  hide('previewScreen');
  loadLvl(lvlIdx);
  gs='playing';
  startTimer();
});

document.getElementById('restartBtn')?.addEventListener('click',()=>{
  hide('gameOverScreen');
  // reinicia apenas a fase atual com HP cheio
  loadLvl(lvlIdx);
  gs='playing';
  startTimer();
});

document.getElementById('winRestartBtn')?.addEventListener('click',()=>{
  hide('winScreen');
  stopCelebration();
  lvlIdx=0; score=0;
  loadLvl(0);
  gs='playing';
  startTimer();
});

// ─── MUTE BUTTON ───────────────────────────────────────────────────────────
const muteBtn = document.getElementById('muteBtn');
function updateMuteBtn() { if(muteBtn) muteBtn.innerHTML = icon(musicMuted ? 'speakerOff' : 'speaker'); }
updateMuteBtn();
muteBtn?.addEventListener('click', ()=>{
  musicMuted = !musicMuted;
  sSet('unicornMute', musicMuted ? '1' : '0');
  updateMuteBtn();
  if(musicMuted) { stopMusic(); }
  else if(gs==='playing') { playMusic(_lastMusicIdx); }
});

// ─── INIT ──────────────────────────────────────────────────────────────────
ui('bestDisp', best);
loadLvl(0); // pre-load so bg shows on start screen
loop();
window.__gameBooted = true; // AUD-11: a guarda de boot do index.html confere este sinal

})();
