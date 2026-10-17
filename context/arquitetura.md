---
tipo: contexto
projeto: memoria-de-projeto
descricao: Stack e o mapa da estrutura do projeto verificado por leitura em disco.
estado: estavel
criado: 2026-09-12
relacionado:
  - context/achados.md
---

# Arquitetura

> Documentação técnica da estrutura do repositório, validada diretamente contra os arquivos em disco.

## Baseline declarada vs. verificada {#baseline}

- [2026-09-12] (e) ← `lint.py` Estrutura de memória validada pelo linter local sem erros.

| Componente | Declarado | Verificado? | Real |
|---|---|---|---|
| Módulos de Contexto | `context/` | ✅ | 4 arquivos centrais (`index`, `arquitetura`, `achados`, `decisoes`) + `discussoes/` |
| Camada de Fontes Brutas | `fontes/` | ✅ | `fontes/index.md` presente e preparado |
| Script de Verificação | `lint.py` | ✅ | Operacional com Python 3 |
| Verificação automatizada | — | ✅ | `tests/` (smoke headless), `tools/validate-levels.mjs` (fases) e `.github/workflows/ci.yml` — introduzidos 2026-10-17 |

## Stack {#stack}

- [2026-09-12] (e) ← `lint.py` Python 3 para script de linting e validação de consistência.
- [2026-09-12] (e) ← `context/index.md` Documentação estruturada em Markdown puro com convenções tipadas.
- [2026-10-10] (e) ← `index.html,game.js` Jogo platformer HTML5 Canvas 2D + JS puro (IIFE, sem frameworks) + Web Audio procedural + PWA (Service Worker + Manifest). Verificado por leitura em disco 2026-10-10.
- [2026-10-10] (e) ← `BRAND.md,brand/design-tokens.css` Identidade "Cósmica Kawaii" (tokens CSS, 44 vars consumidas por `style.css`).
- [2026-10-17] (e) ← `package.json` Node ≥20 apenas para tooling (`"type":"module"` + scripts `test`/`lint`); zero dependências npm — o jogo continua sem build.

## O mapa {#mapa}

| Área | Onde mora | O que faz | Risco conhecido |
|---|---|---|---|
| Roteamento | `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` | Roteamento rápido para IAs em toda sessão | → [[achados#formato]] |
| Conhecimento | `context/` | Memória destilada consultada sob demanda | Sincronizada com o jogo em 2026-10-17 (AUD-07 fechado); re-sincronizar ao fim de cada entrega |
| Camada Bruta | `fontes/` | Arquivos imutáveis de entrada externa | Risco de perda de rastreabilidade se editado diretamente |
| Linter | `lint.py` | Valida sintaxe, links, âncoras e procedência | N/A |
| Testes | `tests/smoke.mjs`, `tests/browser-env.mjs` | Roda o jogo headless no Node: init, Começar Aventura, 12 quadros; cenário de storage bloqueado | Stub pode ficar defasado se API nova de browser entrar — falha alto, e é esse o objetivo |
| Validador de fases | `tools/validate-levels.mjs` | Checa as 20 fases: schema, tipos, spawn, portal, boss, coletáveis | Regras do motor mudam → atualizar o validador junto |
| CI | `.github/workflows/ci.yml` | `lint.py` + validador + smoke (2 cenários) em push/PR | Só roda no GitHub; local = `npm test` |
| Jogo (loop) | `game.js:1961` (`function loop`) | `requestAnimationFrame`, delta clamp 50ms, update+render no mesmo tick | Sem timestep fixo; física varia sob jank |
| Jogo (dados) | `levels-data.js` (20 fases; único `LEVELS`) | Fases, plataformas, inimigos, moedas, checkpoints, power-ups, portal, hazards | Mudança de fase deve passar no validador; nova fase = subir a contagem no validador e no `README` |
| Jogo (atores) | `characters.js` (globais `ch_*`) + `game.js` (`resetP:110`, `initBoss:437`, `updatePlayer:734`) | Unicórnio, slime/bat/spike/bee, boss (2HP), fireballs | Inimigos não têm gravidade: `y=null` = voa no plano do chão (gY−38), inclusive sobre vãos — documentado no validador |
| Jogo (UI) | `index.html:19-139`, `style.css`, `brand/design-tokens.css` | HUD, 8 overlays, d-pad touch, rotate-overlay, toast | a11y aplicada em F4 (AUD-04 fechado 2026-10-17); manter `:focus`/`aria-live` ao mexer |
| Jogo (save) | `game.js:13-29` (`sGet/sSet/sGetJSON`) + 9 keys `unicorn*` em `localStorage` | Dificuldade, desbloqueio, estrelas, recordes, mute, cosméticos (`unicornCosmetics`) | Sempre usar `sGet/sSet` (fallback em memória) — AUD-03 é regressão coberta pelo smoke |
| PWA/deploy | `sw.js` (`CACHE unicorn-v10`), `manifest.json`, `index.html:156-182`, `netlify.toml` | Cache-first + fallback, instalabilidade, publish Netlify | Toda mudança em arquivo cacheado exige bump do `CACHE` (regra no topo de `sw.js`) |

## Estado do código em disco {#disco}

- [2026-09-12 ~superseded 2026-10-17] (e) ~~`handoff/` contém o kit/template original para referência ou réplica em outros repositórios.~~ → verificado em 2026-10-17: `handoff/` não existe no disco; o kit vive no histórico do git. `evidencia` [[achados#abertos]] AUD-10.
- [2026-09-12 ~superseded 2026-10-17] (e) ~~`handoff.md` na raiz detalha a fundamentação teórica e lições aprendidas do sistema.~~ → verificado em 2026-10-17: `handoff.md` não existe no disco.
- [2026-10-17] (e) `git status --short` na primeira auditoria de 2026-10-17: a memória inteira estava untracked → commitada em `384afe8` ([[achados#abertos]] AUD-09).

## Pontos de integração {#integracoes}

- [2026-09-12 ~superseded 2026-10-17] (e) ~~Ferramentas de IA suportadas nativamente: Claude Code CLI (`CLAUDE.md`), Antigravity / Gemini CLI (`GEMINI.md` e `AGENTS.md`), Cursor (`.cursorrules`).~~ → verificado em 2026-10-17: `.cursorrules` não existe no disco; o roteamento atual é `CLAUDE.md`, `GEMINI.md` e `AGENTS.md`.

## Como verificar {#verificacao}

- [2026-10-17] (i) ← `package.json` Verificação local: `python lint.py` (memória), `npm test` (smoke + validador, sem instalar nada) e `SMOKE_THROW_STORAGE=1 node tests/smoke.mjs` (regressão AUD-03). O CI roda tudo em push/PR.
