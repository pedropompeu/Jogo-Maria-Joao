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

## Stack {#stack}

- [2026-09-12] (e) ← `lint.py` Python 3 para script de linting e validação de consistência.
- [2026-09-12] (e) ← `context/index.md` Documentação estruturada em Markdown puro com convenções tipadas.
- [2026-10-10] (e) ← `index.html,game.js` Jogo platformer HTML5 Canvas 2D + JS puro (IIFE, sem frameworks) + Web Audio procedural + PWA (Service Worker + Manifest). Verificado por leitura em disco 2026-10-10.
- [2026-10-10] (e) ← `BRAND.md,brand/design-tokens.css` Identidade "Cósmica Kawaii" (tokens CSS, 44 vars consumidas por `style.css`).

## O mapa {#mapa}

| Área | Onde mora | O que faz | Risco conhecido |
|---|---|---|---|
| Roteamento | `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` | Roteamento rápido para IAs em toda sessão | → [[achados#formato]] |
| Conhecimento | `context/` | Memória destilada consultada sob demanda | Desatualizada p/ o jogo até 2026-10-10 → [[achados#abertos]] AUD-07 |
| Camada Bruta | `fontes/` | Arquivos imutáveis de entrada externa | Risco de perda de rastreabilidade se editado diretamente |
| Linter | `lint.py` | Valida sintaxe, links, âncoras e procedência | N/A |
| Jogo (loop) | `game.js:2235-2295` | `requestAnimationFrame`, delta clamp 50ms, update+render no mesmo tick | Sem timestep fixo; física varia sob jank |
| Jogo (dados) | `game.js:35-363` (`LEVELS`, 10 fases) | Fases, plataformas, inimigos, moedas, checkpoints, power-ups, portal | Duplicado e divergente de `levels-data.js` (20 fases, órfão) → [[achados#abertos]] AUD-01 |
| Jogo (atores) | `characters.js` (globais `ch_*`) + `game.js:722-923,1259-1307` | Unicórnio, slime/bat/spike/bee, boss (2HP), fireballs | Boss 2HP vs dica "3 pisadas" → [[achados#abertos]] AUD-08 |
| Jogo (UI) | `index.html:19-139`, `style.css`, `brand/design-tokens.css` | HUD, 8 overlays, d-pad touch, rotate-overlay, toast | Semântica a11y ausente → [[achados#abertos]] AUD-04 |
| Jogo (save) | `game.js:17-22,369-376` (9 keys `unicorn*` em `localStorage`) | Dificuldade, desbloqueio, estrelas, recordes, mute, cosméticos | Leitura/escrita sem try em 5+ keys → [[achados#abertos]] AUD-03 |
| PWA/deploy | `sw.js` (`CACHE unicorn-v7`), `manifest.json`, `index.html:159-180`, `.netlify/` | Cache-first + fallback, instalabilidade, publish Netlify | Query `?v=` vs cache, `design-tokens.css` fora do cache, publish absoluto → [[achados#abertos]] AUD-02, AUD-06 |

## Estado do código em disco {#disco}

- [2026-09-12] (e) `handoff/` contém o kit/template original para referência ou réplica em outros repositórios.
- [2026-09-12] (e) `handoff.md` na raiz detalha a fundamentação teórica e lições aprendidas do sistema.

## Pontos de integração {#integracoes}

- [2026-09-12] (e) Ferramentas de IA suportadas nativamente: Claude Code CLI (`CLAUDE.md`), Antigravity / Gemini CLI (`GEMINI.md` e `AGENTS.md`), Cursor (`.cursorrules`).
