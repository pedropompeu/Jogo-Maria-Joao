'use strict';
// ─── icons.js — Ícones SVG à prova de tofu (F6) ──────────────────────────────
// Por que existe: nem todo aparelho tem fonte emoji colorida — onde falta,
// 🦄🏆📜 viram □ e o jogo parece quebrado. Estes SVGs inline renderizam em
// qualquer navegador, offline, sem CDN.
//
// Uso estático (index.html):  <i data-ico="trophy"></i>
//   → hidratado automaticamente no DOMContentLoaded.
// Uso dinâmico (game.js):     icon('trophy') → string <svg> pronta.
// Regra: texto copiado p/ WhatsApp (share) CONTINUA com emoji — lá renderiza.

// Paleta: rosa #ff6fb3 · ouro #ffe14d · violeta #7a5cff · menta #3ddcbc
//         azul #5aa9ff · ameixa #57204b (contornos) · coral #ff5b5b
const UNI_ICONS = {
  // ── fases ──
  star:   '<path d="M12 2.5l2.8 6 6.7.8-4.9 4.6 1.3 6.6-5.9-3.2-5.9 3.2 1.3-6.6L2.5 9.3l6.7-.8z" fill="#ffe14d" stroke="#a8641f" stroke-width="1.6" stroke-linejoin="round"/>',
  flower: '<g fill="#ffb3dd" stroke="#c2438f" stroke-width="1.4"><circle cx="12" cy="6.4" r="3.4"/><circle cx="17.3" cy="10.2" r="3.4"/><circle cx="15.3" cy="16.3" r="3.4"/><circle cx="8.7" cy="16.3" r="3.4"/><circle cx="6.7" cy="10.2" r="3.4"/></g><circle cx="12" cy="12" r="2.8" fill="#ffe14d" stroke="#a8641f" stroke-width="1.4"/>',
  leaf:   '<path d="M5 19C5 9.5 11.5 4 20 4c0 8.5-5.5 15-15 15z" fill="#6fe3a5" stroke="#2e8b57" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 19c4-5 8-9 13-13" stroke="#2e8b57" stroke-width="1.6"/>',
  cloud:  '<path d="M7 18.5a4.6 4.6 0 01-.7-9.14A6.2 6.2 0 0118.2 9a4.3 4.3 0 01-.7 9.5z" fill="#dff1ff" stroke="#5aa9ff" stroke-width="1.8" stroke-linejoin="round"/>',
  gem:    '<path d="M7 3.5h10L21 10l-9 10.5L3 10z" fill="#9be8ff" stroke="#3d7dd8" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 10h18M12 20.5L8.7 10l-1.7-6.5M12 20.5l3.3-10.5 1.7-6.5" stroke="#3d7dd8" stroke-width="1.2"/>',
  castle: '<rect x="4" y="11" width="16" height="10" rx="1" fill="#e8c9ff" stroke="#7a4bb0" stroke-width="1.8"/><path d="M6.5 11V5h3.4v6M14.1 11V5h3.4v6" fill="#e8c9ff" stroke="#7a4bb0" stroke-width="1.8" stroke-linejoin="round"/><path d="M10.4 21v-3.6a1.6 1.6 0 013.2 0V21" fill="#7a4bb0"/>',
  wave:   '<path d="M2 13.5c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" stroke="#5aa9ff" stroke-width="2.4"/><path d="M2 18.5c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" stroke="#5aa9ff" stroke-width="2.4" opacity=".55"/>',
  candy:  '<circle cx="12" cy="9" r="6.5" fill="#fff" stroke="#e0559f" stroke-width="1.8"/><path d="M12 9a3.6 3.6 0 013.6 3.6M12 9A5 5 0 007 9" stroke="#e0559f" stroke-width="1.6"/><path d="M12 15.5V22" stroke="#fff" stroke-width="2.6"/><path d="M12 15.5V22" stroke="#e0559f" stroke-width="1"/>',
  moon:   '<path d="M20 14.8A8.6 8.6 0 019.2 4 8.6 8.6 0 1020 14.8z" fill="#ffe9a8" stroke="#a8641f" stroke-width="1.8" stroke-linejoin="round"/>',
  rainbow:'<path d="M3 20a9 9 0 0118 0" stroke="#ff6fb3" stroke-width="2.4"/><path d="M6 20a6 6 0 0112 0" stroke="#ffe14d" stroke-width="2.4"/><path d="M9 20a3 3 0 016 0" stroke="#7cc7ff" stroke-width="2.4"/><circle cx="3.5" cy="19" r="1.8" fill="#dff1ff" stroke="#5aa9ff" stroke-width="1.2"/><circle cx="20.5" cy="19" r="1.8" fill="#dff1ff" stroke="#5aa9ff" stroke-width="1.2"/>',
  volcano:'<path d="M6.5 21l4-12h3l4 12z" fill="#8d5a3b" stroke="#57204b" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="12" cy="9" rx="2.6" ry="1.3" fill="#ff5b3d"/><path d="M12 10v5" stroke="#ff5b3d" stroke-width="2.2"/><circle cx="9" cy="4.5" r="1.3" fill="#bbb" opacity=".8"/><circle cx="14.5" cy="3" r="1" fill="#bbb" opacity=".8"/>',
  flame:  '<path d="M12 2c.8 4.2-4.5 6-4.5 11a4.5 4.5 0 009 0c0-1.8-.9-2.8-.9-2.8s2.6 1.2 2.6 4.8a6.2 6.2 0 01-12.4 0C5.8 8.5 12 7.5 12 2z" fill="#ff9a3d" stroke="#c2431f" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 21.5a3 3 0 003-3c0-1.9-1.9-2.9-3-4.9-1.1 2-3 3-3 4.9a3 3 0 003 3z" fill="#ffe14d"/>',
  palm:   '<path d="M10.5 21c0-5 1-9 4-12.5" stroke="#8d5a3b" stroke-width="2.4"/><path d="M14.5 8.5c-3-3-7-3-9.5-.8M14.5 8.5c3-3 6.5-2.5 8 0M14.5 8.5c.2-3 1.2-5 3-6.5" stroke="#2e9e5b" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="10" r="1.3" fill="#6b4226"/><circle cx="16" cy="10.5" r="1.3" fill="#6b4226"/>',
  paw:    '<ellipse cx="12" cy="15" rx="5" ry="4.2" fill="#ffb3dd" stroke="#a02040" stroke-width="1.8"/><circle cx="6" cy="9.5" r="1.9" fill="#ffb3dd" stroke="#a02040" stroke-width="1.4"/><circle cx="10.2" cy="7.2" r="1.9" fill="#ffb3dd" stroke="#a02040" stroke-width="1.4"/><circle cx="14.4" cy="7.2" r="1.9" fill="#ffb3dd" stroke="#a02040" stroke-width="1.4"/><circle cx="18" cy="9.5" r="1.9" fill="#ffb3dd" stroke="#a02040" stroke-width="1.4"/>',
  city:   '<rect x="2.5" y="12" width="5.5" height="9" fill="#bcd2ff" stroke="#3d5a99" stroke-width="1.6"/><rect x="9.25" y="6.5" width="5.5" height="14.5" fill="#d8e6ff" stroke="#3d5a99" stroke-width="1.6"/><rect x="16" y="13" width="5.5" height="8" fill="#bcd2ff" stroke="#3d5a99" stroke-width="1.6"/><path d="M10.8 10h.1M13.2 10h.1M10.8 13h.1M13.2 13h.1M10.8 16h.1M13.2 16h.1" stroke="#3d5a99" stroke-width="1.6"/>',
  tower:  '<path d="M12 2.5L6.5 21h11z" fill="#d9c2ff" stroke="#5b3d99" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.8 14h6.4M10.2 8.5h3.6" stroke="#5b3d99" stroke-width="1.6"/><circle cx="12" cy="2.5" r="1.2" fill="#ffe14d" stroke="#a8641f" stroke-width="1"/>',
  snow:   '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" stroke="#7cc7ff" stroke-width="2.2"/><circle cx="12" cy="12" r="1.6" fill="#fff" stroke="#7cc7ff" stroke-width="1.4"/>',
  ice:    '<rect x="5" y="5" width="14" height="14" rx="3.5" fill="#cdeeff" stroke="#3d7dd8" stroke-width="1.8"/><path d="M9.5 13.5L8 17M14 8l-2.5 5" stroke="#fff" stroke-width="1.8"/>',
  temple: '<path d="M12 2.5l9.5 6.5h-19z" fill="#f2d8a8" stroke="#8d5a3b" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 12v8M10.2 12v8M13.8 12v8M17.5 12v8M4 21.5h16" stroke="#8d5a3b" stroke-width="1.8"/>',
  eye:    '<path d="M2 12c3-4.6 6.4-6.6 10-6.6S19 7.4 22 12c-3 4.6-6.4 6.6-10 6.6S5 16.6 2 12z" fill="#fff" stroke="#57204b" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="4" fill="#7a5cff"/><circle cx="12" cy="12" r="2" fill="#2a0a2e"/><circle cx="13.6" cy="10.4" r="1.2" fill="#fff"/>',
  // ── interface ──
  unicorn:'<circle cx="9.5" cy="14" r="7" fill="#ffd6ea" stroke="#57204b" stroke-width="1.8"/><path d="M14.5 9.5L17 2l2.2 7.2z" fill="#ffe14d" stroke="#a8641f" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.5 9.5C3 13 4 17 6 19.5" stroke="#ff6fb3" stroke-width="2.4"/><circle cx="11" cy="14" r="1.4" fill="#57204b"/>',
  coin:   '<circle cx="12" cy="12" r="9" fill="#ffe14d" stroke="#a8641f" stroke-width="1.8"/><path d="M12 7.5a4.5 4.5 0 000 9" stroke="#a8641f" stroke-width="1.8"/><circle cx="15.5" cy="8.5" r="1.3" fill="#fff"/>',
  clock:  '<circle cx="12" cy="12" r="9" fill="#fff" stroke="#57204b" stroke-width="1.8"/><path d="M12 7v5.2l3.4 2" stroke="#57204b" stroke-width="1.8"/>',
  heart:  '<path d="M12 20.5S3 14.5 3 8.8A4.6 4.6 0 0112 6.2a4.6 4.6 0 019 2.6c0 5.7-9 11.7-9 11.7z" fill="#ff5b6e" stroke="#a02040" stroke-width="1.8" stroke-linejoin="round"/>',
  trophy: '<path d="M7 3.5h10V9a5 5 0 01-10 0z" fill="#ffe14d" stroke="#a8641f" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 5H4a3.2 3.2 0 003.4 5.4M17 5h3a3.2 3.2 0 01-3.4 5.4" stroke="#a8641f" stroke-width="1.8"/><path d="M12 14v3.5M8.5 21h7" stroke="#a8641f" stroke-width="1.8"/>',
  list:   '<rect x="4" y="3" width="16" height="18" rx="2.5" fill="#fff" stroke="#57204b" stroke-width="1.8"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5" stroke="#e0559f" stroke-width="1.8"/>',
  clipboard:'<rect x="5" y="4.5" width="14" height="17" rx="2" fill="#fff" stroke="#2288cc" stroke-width="1.8"/><rect x="9" y="2.5" width="6" height="4" rx="1.2" fill="#2288cc"/><path d="M9 12l2.2 2.2L15.5 10" stroke="#2288cc" stroke-width="1.8"/>',
  speaker:'<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" fill="#e0559f" stroke="#57204b" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.2a4 4 0 010 5.6M18.6 6.6a7.6 7.6 0 010 10.8" stroke="#57204b" stroke-width="1.8"/>',
  speakerOff:'<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" fill="#e0559f" stroke="#57204b" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.5l5.5 5.5M21.5 9.5L16 15" stroke="#c2433f" stroke-width="2"/>',
  lock:   '<rect x="5" y="11" width="14" height="9.5" rx="2" fill="#ffd166" stroke="#8d5a1f" stroke-width="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke="#8d5a1f" stroke-width="1.8"/><circle cx="12" cy="15.5" r="1.4" fill="#8d5a1f"/>',
  sparkles:'<path d="M11 3c.7 4.2 2.3 5.8 6.5 6.5-4.2.7-5.8 2.3-6.5 6.5-.7-4.2-2.3-5.8-6.5-6.5 4.2-.7 5.8-2.3 6.5-6.5z" fill="#ffe14d" stroke="#a8641f" stroke-width="1.4" stroke-linejoin="round"/><path d="M18.5 15.5c.4 2 1.1 2.7 3.1 3.1-2 .4-2.7 1.1-3.1 3.1-.4-2-1.1-2.7-3.1-3.1 2-.4 2.7-1.1 3.1-3.1z" fill="#fff" stroke="#e0559f" stroke-width="1.1" stroke-linejoin="round"/>',
  party:  '<path d="M5.5 21L14 8.5l-6.5-2.5z" fill="#ff6fb3" stroke="#57204b" stroke-width="1.8" stroke-linejoin="round"/><circle cx="17.5" cy="6" r="1.6" fill="#ffe14d"/><circle cx="20.5" cy="10.5" r="1.6" fill="#3ddcbc"/><circle cx="16" cy="12.5" r="1.6" fill="#7cc7ff"/>',
  flag:   '<path d="M6 21.5V3.5" stroke="#57204b" stroke-width="2"/><path d="M6 4h11.5L15 7.5 17.5 11H6" fill="#3ddcbc" stroke="#0e7a5f" stroke-width="1.8" stroke-linejoin="round"/>',
  skull:  '<circle cx="12" cy="10" r="7" fill="#fff" stroke="#57204b" stroke-width="1.8"/><rect x="8.3" y="13.5" width="7.4" height="5.5" rx="2" fill="#fff" stroke="#57204b" stroke-width="1.8"/><circle cx="9.3" cy="10" r="1.6" fill="#57204b"/><circle cx="14.7" cy="10" r="1.6" fill="#57204b"/><path d="M12 12.5l-1 2h2z" fill="#57204b"/>',
  footprint:'<ellipse cx="12" cy="15" rx="4.6" ry="5.4" fill="#c9a6ff" stroke="#5b3d99" stroke-width="1.8"/><circle cx="6.2" cy="9.5" r="1.7" fill="#c9a6ff" stroke="#5b3d99" stroke-width="1.3"/><circle cx="10" cy="7" r="1.7" fill="#c9a6ff" stroke="#5b3d99" stroke-width="1.3"/><circle cx="14" cy="7" r="1.7" fill="#c9a6ff" stroke="#5b3d99" stroke-width="1.3"/><circle cx="17.8" cy="9.5" r="1.7" fill="#c9a6ff" stroke="#5b3d99" stroke-width="1.3"/>',
  dragon: '<circle cx="12" cy="13.5" r="7" fill="#7ddb8a" stroke="#1f6e38" stroke-width="1.8"/><path d="M7.5 8L5 3.5l4.5 2M16.5 8l2.5-4.5-4.5 2" fill="#ffe14d" stroke="#a8641f" stroke-width="1.4" stroke-linejoin="round"/><circle cx="14.5" cy="13" r="1.5" fill="#1f6e38"/><circle cx="9" cy="16" r="1" fill="#1f6e38"/>',
  shield: '<path d="M12 2l8 3v6.2c0 4.8-3.4 8.3-8 10.8-4.6-2.5-8-6-8-10.8V5z" fill="#9fc2ff" stroke="#2b4f9e" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 12l2.4 2.4L15.7 9.5" stroke="#fff" stroke-width="2"/>',
  heartbreak:'<path d="M12 20.5S3 14.5 3 8.8A4.6 4.6 0 0112 6.2a4.6 4.6 0 019 2.6c0 5.7-9 11.7-9 11.7z" fill="#ff7b7b" stroke="#a02040" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7.5l-2.2 3 3 2.2-2.2 3 2.4 3.2" stroke="#a02040" stroke-width="1.6"/>',
  refresh:'<path d="M20 12a8 8 0 10-2.4 5.7" stroke="#57204b" stroke-width="2"/><path d="M20 16.5V12h-4.5" stroke="#57204b" stroke-width="2"/>',
  chart:  '<path d="M4 3.5V20.5h16" stroke="#57204b" stroke-width="1.8"/><rect x="7" y="12" width="3.4" height="6" rx="1" fill="#ff6fb3"/><rect x="11.5" y="8.5" width="3.4" height="9.5" rx="1" fill="#7a5cff"/><rect x="16" y="5" width="3.4" height="13" rx="1" fill="#3ddcbc"/>',
};

// Fase → ícone (o `emoji` continua no levels-data só p/ texto de compartilhar).
const PHASE_ICONS = ['star','flower','leaf','cloud','gem','castle','wave','candy','moon','rainbow','volcano','flame','palm','paw','city','tower','snow','ice','temple','eye'];

function icon(name, cls) {
  const body = UNI_ICONS[name] || UNI_ICONS.star;
  return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}
function phaseIcon(i) { return icon(PHASE_ICONS[i] || 'star'); }

// Hidrata <i data-ico="nome"></i> do HTML estático.
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ico]').forEach(function (el) {
    if (!el.dataset.icoDone) { el.innerHTML = icon(el.dataset.ico); el.dataset.icoDone = '1'; }
  });
}
document.addEventListener('DOMContentLoaded', function () { hydrateIcons(); });
