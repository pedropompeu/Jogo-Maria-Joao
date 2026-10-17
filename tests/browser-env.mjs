// tests/browser-env.mjs — stub mínimo de browser para rodar o jogo no Node.
// Sem dependências: exercita game.js headless (init + fluxo real do jogador)
// e serve de rede de proteção no CI. Cobre as APIs que o jogo usa hoje;
// qualquer API nova que apareça derruba o teste com stack — de propósito.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Objeto permissivo: qualquer método existe e devolve outro permissivo;
// conversão numérica vira 0. Serve para CanvasRenderingContext2D, nós de
// áudio, gradientes etc. Evita stub gigante e frágil de API por API.
function permissive(label) {
  const target = function () {};
  return new Proxy(target, {
    get(t, prop) {
      if (prop === Symbol.toPrimitive || prop === 'valueOf') return () => 0;
      if (prop === Symbol.iterator) return undefined;
      if (prop === 'then') return undefined;
      if (prop in t) return t[prop];
      const child = permissive(`${label}.${String(prop)}`);
      t[prop] = child;
      return child;
    },
    set(t, prop, value) { t[prop] = value; return true; },
    apply() { return permissive(`${label}()`); },
  });
}

function styleStub() {
  return {
    setProperty(name, value) { this[name] = value; },
    removeProperty(name) { delete this[name]; },
    getPropertyValue(name) { return this[name] ?? ''; },
  };
}

class ElementStub {
  constructor(tag = 'div', id = '') {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.width = 1000;
    this.height = 600;
    this.textContent = '';
    this.innerHTML = '';
    this.checked = false;
    this.dataset = {};
    this.style = styleStub();
    this.children = [];
    this.offsetWidth = 100;
    this.offsetHeight = 40;
    this.offsetParent = {}; // truthy: exercita o caminho de focus de show()
    this._classes = new Set();
    this._listeners = Object.create(null);
    this._ctx = permissive(`ctx#${id || tag}`);
  }
  get classList() {
    const self = this;
    return {
      add: (...cs) => cs.forEach(c => self._classes.add(c)),
      remove: (...cs) => cs.forEach(c => self._classes.delete(c)),
      toggle: (c, force) => {
        const on = force === undefined ? !self._classes.has(c) : !!force;
        if (on) self._classes.add(c); else self._classes.delete(c);
        return on;
      },
      contains: c => self._classes.has(c),
    };
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._classes].join(' '); }
  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
  removeEventListener() {}
  dispatch(type, ev = {}) {
    (this._listeners[type] || []).forEach(fn =>
      fn({ preventDefault() {}, stopPropagation() {}, ...ev }));
    return this;
  }
  click() { return this.dispatch('click'); }
  querySelector() { return new ElementStub('button'); }
  querySelectorAll() { return []; }
  appendChild(child) { this.children.push(child); return child; }
  insertBefore(child) { this.children.push(child); return child; }
  removeChild() {}
  contains() { return false; }
  getContext() { return this._ctx; }
  focus() { this._focused = true; }
  blur() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0 }; }
  setAttribute(name, value) { this[name] = value; }
  getAttribute(name) { return this[name] ?? null; }
  setPointerCapture() {}
  releasePointerCapture() {}
  closest() { return null; }
}

// Instala os globais de browser e devolve os controles do teste.
export function installBrowserEnv({ throwStorage = false } = {}) {
  const registry = new Map();
  const frames = [];
  const store = new Map();

  const el = id => {
    if (!registry.has(id)) registry.set(id, new ElementStub('div', id));
    return registry.get(id);
  };

  const storage = {
    getItem(k) {
      if (throwStorage) throw new Error('SecurityError: localStorage bloqueado');
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      if (throwStorage) throw new Error('SecurityError: localStorage bloqueado');
      store.set(k, String(v));
    },
    removeItem(k) {
      if (throwStorage) throw new Error('SecurityError: localStorage bloqueado');
      store.delete(k);
    },
    clear() { store.clear(); },
  };

  const document = {
    getElementById: el,
    createElement: tag => new ElementStub(tag),
    querySelector: () => new ElementStub('div'),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    body: new ElementStub('body'),
    documentElement: new ElementStub('html'),
    hidden: false,
    visibilityState: 'visible',
    fonts: { ready: Promise.resolve() },
  };

  const g = globalThis;
  g.window = g;
  g.document = document;
  if (typeof g.navigator === 'undefined') g.navigator = {};
  Object.defineProperty(g, 'localStorage', { value: storage, configurable: true, writable: true });
  g.matchMedia = () => ({
    matches: false, media: '',
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
  g.requestAnimationFrame = cb => frames.push(cb);
  g.cancelAnimationFrame = () => {};
  class AudioContextStub { constructor() { return permissive('audio'); } }
  g.AudioContext = AudioContextStub;
  g.webkitAudioContext = AudioContextStub;
  g.prompt = () => null;
  g.alert = () => {};
  g.getComputedStyle = () => styleStub();
  g.innerWidth = 1280;
  g.innerHeight = 800;
  g.devicePixelRatio = 1;
  g.screen = { width: 1280, height: 800, orientation: { type: 'landscape-primary', addEventListener() {} } };
  if (typeof g.addEventListener === 'undefined') g.addEventListener = () => {};
  if (typeof g.removeEventListener === 'undefined') g.removeEventListener = () => {};

  return {
    el,
    document,
    storage,
    click: id => el(id).dispatch('click'),
    // Roda `count` quadros do requestAnimationFrame do jogo, em sequência.
    flushFrames(count = 1, step = 16.7) {
      let ts = 0;
      for (let i = 0; i < count; i++) {
        const cb = frames.shift();
        if (!cb) throw new Error(`quadro ${i}: o loop não agendou o próximo`);
        ts += step;
        cb(ts);
      }
    },
    pendingFrames: () => frames.length,
  };
}

// Carrega script clássico (characters.js, icons.js) como um <script> carregaria:
// declarações de função de topo viram globais.
export function loadClassicScript(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInThisContext(src, { filename: file });
}
