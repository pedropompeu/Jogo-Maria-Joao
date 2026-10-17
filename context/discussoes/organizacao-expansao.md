---
tipo: contexto
projeto: jogo-da-maria
descricao: Organização do repositório e priorização dos vetores de expansão — produto, técnica, método e distribuição.
estado: aberta
criado: 2026-10-17
relacionado:
  - context/decisoes.md
  - context/achados.md
  - context/arquitetura.md
---

# Organização e expansão — o que crescer depois do F5 {#organizacao-expansao}

> Discussão **em aberto**. Quando fechar: o fato migra pra `decisoes.md`, esta página vira
> `estado: fechada` e ganha, no topo, o link pra decisão. O arquivo **não se apaga** — é
> onde vive o raciocínio que a decisão comprimiu.

## A pergunta {#pergunta}

Como organizar o repositório (código + memória) e em que ordem atacar os vetores de
expansão — João jogável, loja de cosméticos, fases 21+, coop local, método de playtest,
distribuição?

- [2026-10-17] (i) **Não bloqueia o jogo publicado:** a build atual segue estável e
  jogável. Bloqueia só o *próximo* ciclo: sem ordem decidida, cada melhoria compete com
  as outras sem critério.

## O que já se sabe {#sabido}

- [2026-10-17] (e) `git status` — a governança inteira (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `context/`, `fontes/`, `lint.py`) estava fora do versionamento → [[achados#abertos]] AUD-09.
- [2026-10-17] (e) Pós-F5 a memória ficou dessincronizada (achado aberto já corrigido, plano com checkboxes vazios, `handoff/`/`.cursorrules` citados mas inexistentes) → [[achados#abertos]] AUD-10.
- [2026-10-17] (e) F0–F5 entregues e commitados (`98361a9`…`39fb720` + `7592d76`): 20 fases, progressão por desbloqueio, controles perdoadores, a11y da F4 e sistema de ícones offline.
- [2026-10-10] (d) Decisões de gameplay fechadas em [[decisoes#jogo]] — 20 fases, progressão suave, sistemas mantidos, UI com brilho.
- [2026-10-17] (d) Pedro autorizou o Sprint 0 de organização e os testes/CI antes de expandir conteúdo — ver [[decisoes#qualidade]].

## Como o projeto está organizado hoje {#organizacao}

> Resumo operacional para planejar melhorias — o detalhe verificado mora em
> [[arquitetura#mapa]] e [[produto#jogo]].

- [2026-10-17] (i) **Runtime do jogo:** `index.html` (HUD + overlays + bootstrap PWA) → `game.js` (loop, física, save, economia, UI) → `characters.js` (desenho de personagens/inimigos) → `icons.js` (sistema de ícones offline) → `levels-data.js` (as 20 fases) → `style.css` + `brand/design-tokens.css` (tema).
- [2026-10-17] (i) **Memória e governança:** `context/` roteado por `context/index.md`, `fontes/` (material bruto, intocável), `lint.py`; protocolo em `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`.
- [2026-10-17] (i) **Verificação:** `npm test` (smoke headless + validador de fases) e `python lint.py`; o CI (`.github/workflows/ci.yml`) roda os três em push/PR.
- [2026-10-17] (i) **Deploy:** Netlify (`netlify.toml`), PWA cache-first (`sw.js`) com regra rígida de bump do `CACHE`.

### Regras práticas que toda melhoria herda {#regras-praticas}

- [2026-10-17] (i) Mudou arquivo cacheado? Bump do `CACHE` em `sw.js` no mesmo commit.
- [2026-10-17] (i) Fase nova? Atualizar a contagem no `tools/validate-levels.mjs`, no `README.md`, no texto de vitória (`index.html`) e em `PHASE_ICONS` (`icons.js`).
- [2026-10-17] (i) UI/overlay novo? Seguir os padrões de a11y conquistados na F4 (`role=dialog`, foco no overlay, `aria-live`).
- [2026-10-17] (i) Save novo? Sempre via `sGet/sSet` (nunca `localStorage` direto) — o smoke cobre o cenário de storage bloqueado.
- [2026-10-17] (i) Regra de jogo nova (economia, progressão, HP)? Validação prévia `(d)` com Pedro, como manda a autonomia assistida.

## Opções {#opcoes}

### Eixo 1 — Produto (jogo)

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| João jogável (select de personagem) | O título é "da Maria **e do João**"; o irmão vira protagonista | Exige arte/animação própria; balance de fases | ~4h (d) |
| Loja de cosméticos com moedas | Moeda deixa de ser só placar; keys de cosméticos já previstas (`unicornCosmetics`) | Muda o loop de recompensa; precisa playtest | ~6h (d) |
| Fases 21+ (novo mundo) | Pipeline destravado pelo `levels-data.js` modular; validador já protege | Nenhum risco técnico — só decisão de escopo | ~2h/mundo (d) |
| Coop local 2P | Alto valor para irmãos; mesmo teclado | Redesenho de câmera/HUD; risco de escopo | ~10h+ (d) |
| Fantasma (ghost) local do speedrun | Sem backend; reusa o save local | Gravação por frame é a parte chata | ~3h (i) |
| Cutscenes leves entre mundos | Storytelling com os artistas do próprio canvas | Sem função mecânica; é corte puro | ~3h (d) |

### Eixo 2 — Técnica

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| Smoke + validador de fases + CI | Feito em 2026-10-17: rede de proteção antes do próximo conteúdo | Cobre só headless; sem browser real | ✅ feito |
| Fatiar `game.js` em módulos | 2.279 linhas hoje; ES modules já estão em uso | Refatoração grande; pode atrasar conteúdo | ~6h (d) |
| Save versionado + export/import | Protege o progresso da Maria quando a loja chegar | Só compensa junto da loja | ~2h (i) |
| Bump automático do SW | Elimina o stale eterno por esquecimento de bump | Overengineering até haver release frequente | ~2h (i) |
| E2E em browser real (Playwright) | Pega o que headless não pega (layout, toque) | Dependência externa nova → exige (d) | ~4h (d) |

### Eixo 3 — Método (memória)

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| Playtest real vira `fontes/` | Reação crua das crianças vira `(e)` auditável; a pasta foi feita pra isso | Exige sessão com as crianças | ~1h (i) |
| Roadmap visível com prioridade | Achado não é melhoria; falta onde mora "o que vem depois" | Mais um arquivo na convenção → validar formato com Pedro | ~1h (d) |
| Ritual pós-entrega (sincronizar memória) | Impede reincidência do AUD-10 | Depende de disciplina; pode virar cerimônia | ~0h (i) |

### Eixo 4 — Distribuição

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| Card com QR para presentear | Material físico do jogo; charme de presente | Sem impacto no jogo em si | ~1h (i) |
| "Correio da Maria" (Netlify Forms) | Feedback sem backend novo | Moderação manual; recado de criança pede cuidado com privacidade | ~2h (d) |
| Lighthouse mobile no CI | O alvo real é tablet fraco | Ruído se rodar a cada push | ~2h (i) |
| Domínio próprio | Presente completo; independe do subdomínio | Custo anual + DNS | (d) |

## Onde cada vetor mexe {#detalhe}

- [2026-10-17] (i) **João jogável** — `characters.js` (novo desenho `ch_drawJoao`), `game.js` (select na tela inicial, key `unicornChar`, spawn/draw do player), `index.html`/`style.css` (UI do select). Depende de: nada. Pronto quando: a fase 1 é zerável com cada personagem.
- [2026-10-17] (i) **Loja de cosméticos** — `game.js` (preços, gasto de moedas, aplicar cosmético no desenho), overlay novo, `style.css`. Depende de: save versionado (abaixo) para não quebrar a progressão existente. Pronto quando: comprar → recarregar → cosmético permanece.
- [2026-10-17] (i) **Fases 21+** — `levels-data.js`, contagem no validador, `README.md`, texto de vitória e `PHASE_ICONS`. Depende de: nada — o validador já protege o schema. Custo: ~2h/mundo.
- [2026-10-17] (i) **Coop local 2P** — `game.js` (input duplo, câmera, HP por jogador), `index.html` (HUD dividido), `characters.js` (2º player). Depende de: decisão de escopo — é o vetor de maior risco.
- [2026-10-17] (i) **Fantasma do speedrun** — `game.js` (gravação amostrada de posição no save local + render translúcido). Depende de: nada; validar o tamanho no `localStorage` (amostrar a cada N quadros).
- [2026-10-17] (i) **Cutscenes leves** — `game.js` (estado de cena novo + botão pular), `characters.js` (poses). Depende de: nada.
- [2026-10-17] (i) **Save versionado (pré-requisito da loja)** — `game.js` (key `unicornSaveVersion` + migração de progresso). Depende de: nada; destrava loja e export/import.
- [2026-10-17] (i) **Playtest vira fonte** — reações cruas em `fontes/YYYY-MM-DD-....md`, citadas como `(e)` aqui. Depende de: sessão com as crianças.
- [2026-10-17] (i) **Correio da Maria** — formulário Netlify Forms (sem backend novo); privacidade de criança pede formulário sem dados pessoais. Depende de: decisão `(d)`.

## Sequência sugerida {#sequencia}

> Sugestão da IA `(i)` — a ordem final é decisão de Pedro `(d)`.

- [2026-10-17] (i) **Onda 1 (já feita):** organização da memória + testes/CI. Sem `(d)` pendente, sem risco.
- [2026-10-17] (i) **Onda 2 (fundação + valor emocional):** João jogável → save versionado → loja de cosméticos. O João não bloqueia nada e é o item barato de alto impacto; a loja precisa do save versionado antes.
- [2026-10-17] (i) **Onda 3 (conteúdo):** fases 21+ (~2h/mundo), aproveitando que validador e pipeline já protegem.
- [2026-10-17] (i) **Onda 4 (apostas grandes):** coop local, fantasma e cutscenes — só depois de playtest real alimentar as preferências.
- [2026-10-17] (i) **Transversal a todas as ondas:** playtest real vira `fontes/` e memória sincronizada no fim de cada ciclo (ritual do Eixo 3).

## Default adotado enquanto não fecha {#default}

- [2026-10-17] (d) **Sprint 0 + testes/CI autorizados e executados** — memória versionada
  (`384afe8`), achados sincronizados, smoke + validador + GitHub Actions no ar. Nada do
  Eixo 1 (produto) começa sem decisão do Pedro. `revisar: 2026-11-17`.
- [2026-10-17] (d) **Escopo desta fase:** apenas documentação (organização + melhorias) —
  nenhuma melhoria de produto será implementada até a ordem ser definida.
