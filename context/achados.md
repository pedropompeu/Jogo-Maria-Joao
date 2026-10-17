---
tipo: contexto
projeto: memoria-de-projeto
descricao: Bugs, furos e dívidas encontrados, com severidade, local, reprodução e fix.
estado: estavel
criado: 2026-09-12
relacionado:
  - context/arquitetura.md
---

# Achados

> Lista de riscos técnicos, bugs e dívidas conhecidas. Deve ser lida **antes de dizer que algo está pronto** ou antes de modificar componentes críticos.

## Formato obrigatório {#formato}

- [2026-09-12] (d) **Achado sem reprodução é opinião.** Todo achado leva severidade, localização, reprodução e fix recomendado.
- [2026-09-12] (d) **A severidade se justifica em consequência, não em categoria.** A consequência prática para o usuário/negócio precede o jargão técnico.

```markdown
### [ID] Título curto, em consequência, não em jargão

- **Severidade:** crítico | alto | médio | baixo — e a frase que a justifica em consequência
- **Onde:** caminho/do/arquivo.ext:123
- **Reprodução:** os passos exatos. Se estático, especificar o motivo
- **Por que importa:** o que acontece na prática com o usuário ou sistema
- **Fix recomendado:** o que fazer, com custo aproximado
- **Estado:** aberto | reportado | corrigido | verificado
```

- [2026-09-12] (i) Registrar achados com impacto direto impede que correções cosméticas passem na frente de falhas funcionais.

## O que NÃO é achado {#nao-achado}

> Comportamento declarado como intencional, decisão já tomada e limitação conhecida de ambiente. Registrar aqui evita reabrir discussões já resolvidas.

- [2026-09-12] (d) Comportamentos esperados e tradeoffs documentados em [[decisoes#infraestrutura]] não constituem achados.

## Abertos {#abertos}

### [AUD-01] 10 fases prontas nunca chegam ao jogador

- **Severidade:** alto — metade do conteúdo produzido (fases 11-20) é inalcançável; edição futura em só um arquivo gera divergência silenciosa
- **Onde:** `levels-data.js:6` (`export const LEVELS`, 20 fases) vs `game.js:35` (`const LEVELS` inline, 10 fases); `index.html:156-157`
- **Reprodução:** estático — `grep -c 'portal:\[' game.js` → 10; `grep -c 'portal:\[' levels-data.js` → 20; `grep levels-data index.html` → vazio. `levels-data.js` usa `export` (ES module) mas `index.html` só carrega scripts clássicos sem `type=module`, então o arquivo é dead code por construção
- **Por que importa:** trabalho de design (commit `7e2d43a`) parado; `game.js:20`, `game.js:1380`, `index.html:99` assumem 10 fases; jogador nunca vê Lava/Tundra/Guardião
- **Fix recomendado:** decidir um caminho (a) importar `levels-data.js` como módulo e remover `LEVELS` inline, ou (b) deletar `levels-data.js` se as 10 extras foram descartadas. Custo: ~1h + teste de regressão das fases 0-9
- **Estado:** corrigido
- [2026-10-10] (i) Corrigido em F5/T5.1: `game.js` importa `LEVELS` de `levels-data.js` (`type=module`); inline de 333 linhas removido; fases 0-9 verificadas byte-idênticas; contagens (achievement, win, README) em 20; SW `v9` inclui o módulo. Playtest: grid com 20, progressão, fases 11 e 20 jogáveis, zero erros de console.
- [2026-10-10] (i) Auditoria estática 2026-10-10 `evidencia` [[arquitetura#mapa]].

### [AUD-02] Offline quebra o tema e update trava em versão velha

- **Severidade:** alto — criança sem internet abre o jogo sem CSS (tela quebrada) ou fica presa em build antigo para sempre
- **Onde:** `sw.js:2-11` (`ASSETS`), `sw.js:29-35` (cache-first sem revalidação), `index.html:15,156-157` (`?v=4.1/1.0/4.5`), `style.css:1`
- **Reprodução:** estático — `ASSETS` não lista `brand/design-tokens.css` (carregado via `@import`) nem normaliza query string: `caches.match('./game.js')` nunca acerta `game.js?v=4.5`. `CACHE='unicorn-v7'` só troca com bump manual; sem bump, `activate` nunca limpa e cliente fica stale
- **Por que importa:** PWA é promessa central do README ("funciona offline"); hoje o primeiro load offline após update perde todo o tema (44 `var(--...)` indefinidas)
- **Fix recomendado:** incluir `brand/design-tokens.css` no `ASSETS`, usar `ignoreSearch:true` ou versionar via nome de arquivo, e adotar stale-while-revalidate ou bump automatizado. Custo: ~2h
- **Estado:** corrigido
- [2026-10-10] (i) Corrigido em F0/T0.3 (`sw.js`): `design-tokens.css` no `ASSETS`, `ignoreSearch:true` no `fetch`, bump `unicorn-v7→v8`. `node --check` OK; offline real ainda pede 1 teste manual no celular.
- [2026-10-10] (i) Auditoria estática 2026-10-10 `evidencia` [[arquitetura#integracoes]].

### [AUD-03] Jogo morre em aba privada / storage bloqueado (iOS)

- **Severidade:** médio — em Safari privado ou com cookies bloqueados o jogo trava na tela inicial em vez de jogar sem save
- **Onde:** `game.js:17` (`unicornDiff`), `game.js:369` (`unicornBest`), `game.js:2054` (`unicornMute`), `game.js:2115,2121` (`JSON.parse` sem try), mais 8 escritas sem `try/catch` (`game.js:543,1351,1360,1366,2117,2124,2461,2535`)
- **Reprodução:** estático — só `unicornUnlocked/Stars/Ach/Metrics` têm leitura protegida; abrir com `localStorage` lançando (modo privado iOS) estoura na linha 17 antes do loop
- **Por que importa:** público-alvo (crianças em tablet escolar/familiar) cai exatamente nesse cenário; `QuotaExceededError` também derruba o save de recorde
- **Fix recomendado:** wrapper `safeGet/safeSet` com try/catch + fallback em memória. Custo: ~1h
- **Estado:** corrigido
- [2026-10-10] (i) Auditoria estática 2026-10-10.
- [2026-10-10] (i) Corrigido em F0/T0.1 (`game.js:10-29`): `sGet/sSet/sGetJSON` com fallback em memória; 15 chamadas migradas. Prova: harness `/tmp/opencode/f0-smoke.js` — HEAD trava (`SecurityError`), fix passa init + 8 frames. `evidencia` [[decisoes#jogo]].

### [AUD-04] Teclado e leitor de tela ficam para fora do jogo

- **Severidade:** alto — criança que usa zoom, teclado ou leitor não consegue jogar nem navegar nos menus; controles touch são `div` sem semântica
- **Onde:** `index.html:5` (`user-scalable=no`), `index.html:52,55,60` (`div.touch-btn`), `index.html:47` (canvas sem label), overlays `index.html:67-134` sem `role=dialog`, `style.css` sem `:focus` visível
- **Reprodução:** estático + manual — tentar jogar só com teclado (Tab não alcança d-pad), ativar zoom no mobile (bloqueado), inspecionar `bindBtn` em `game.js:2325-2346` (só `touchstart/end`, sem `click/keydown`)
- **Por que importa:** falha WCAG 1.4.4 (zoom) e 2.1/4.1 (nome/papel/valor); jogo infantil tem obrigação ampliada de acessibilidade
- **Fix recomendado:** remover `user-scalable=no`, trocar `div` por `<button>`, adicionar `role=dialog` + foco programático + `aria-live` no HUD/toast, estilo `:focus` real. Custo: ~3h
- **Estado:** corrigido
- [2026-10-17] (i) Fechado: F4 (`ec8015c`) entregou `<button>` com `aria-label` (`index.html:52-62`), zoom liberado (`index.html:5`), `role=dialog`/`aria-modal` nos 8 overlays, `:focus-visible` (`style.css:6`) e `aria-live` em `#goSub`/toast; foco programático no primeiro botão do overlay via `show()` (`game.js:2025`). Verificado por leitura em 2026-10-17.
- [2026-10-10] (i) Auditoria estática 2026-10-10.

### [AUD-05] Morte por tempo pode travar em loop e portal final sem guarda

- **Severidade:** médio — jogador vê a morte se arrastar (timer negativo, dano repetido) e duplo-clique no "Próxima Fase" quebra o jogo
- **Onde:** `game.js:1320-1328` (`updateTimer` re-chama `takeDamage` após morte), `game.js:1143` (early-return de `invT` pula kill por estrela), `game.js:2499-2503` (`nextLvlBtn` sem bound-check)
- **Reprodução:** (a) deixar o timer zerar — `gs` continua `playing` ~60f e `takeDamage(MAX_HP,'time')` é re-chamado; (b) com estrela + invencibilidade atravessar inimigo sem stompar; (c) duplo-clique rápido em "Próxima Fase" na última fase → `TypeError` em `showLevelPreview`
- **Por que importa:** quebra a sensação de justiça do jogo (morte confusa) e crash visível no fluxo mais comemorado (zerar a fase)
- **Fix recomendado:** guarda `gs!=='playing'` no timer + `dieT` único, checar `starTimer` antes do early-return, bound-check em `nextLvlBtn`. Custo: ~2h
- **Estado:** corrigido
- [2026-10-10] (i) Corrigido em F0/T0.2 (`game.js`): `takeDamage` idempotente (`if(p.dead) return`), `updateTimer` com guarda + clamp em 0, estrela mata sob `invT`, `nextLvlBtn` + `showLevelPreview` com bound-check. Playtest no navegador sem erros de console.
- [2026-10-10] (i) Auditoria estática 2026-10-10.

### [AUD-06] Deploy sem config: `.netlify` versionado com path local

- **Severidade:** médio — deploy reproduz path da máquina do Pedro e headers PWA (cache do `sw.js`) nunca são aplicados
- **Onde:** `.netlify/netlify.toml` (`publish="/home/usuario/Dev/Jogo-da-Maria"`), ausência de `netlify.toml` na raiz, `.gitignore` sem `.netlify/`
- **Reprodução:** estático — `cat .netlify/netlify.toml`; `ls netlify.toml` → inexistente; `git status --short` mostra `context/`, `lint.py` etc. untracked mas `.netlify/` versionado por acidente
- **Por que importa:** build Netlify pode publicar diretório errado; `sw.js` sem `Cache-Control: no-cache` agrava AUD-02 (stale eterno)
- **Fix recomendado:** criar `netlify.toml` na raiz (`publish="."`, headers para `sw.js`/`manifest`), adicionar `.netlify/` ao `.gitignore`. Custo: ~30min
- **Estado:** corrigido
- [2026-10-10] (i) Corrigido em F0/T0.4: `netlify.toml` criado (`publish="."`, `sw.js → no-cache`, manifest tipado); `.netlify/` ignorado. Falta confirmar no próximo deploy.
- [2026-10-10] (i) Auditoria estática 2026-10-10 `evidencia` [[arquitetura#integracoes]].

### [AUD-07] Memória do projeto descreve o template, não o jogo

- **Severidade:** médio — toda IA nova recebe mapa errado (só `context/`+`lint.py`) e nenhuma regra do jogo; decisões de produto do jogo não estão registradas
- **Onde:** `context/arquitetura.md:25-46`, `context/produto.md:16-20`, `context/decisoes.md:29-38`
- **Reprodução:** estático — ler os três arquivos: nenhum cita `game.js`, fases, PWA, brand Cósmica Kawaii (`BRAND.md`), ou commits (`7e2d43a`, `b928cb3`)
- **Por que importa:** governança (AUTONOMIA ASSISTIDA) opera sobre descrição falsa; risco de IA "redecidir" o já decidido (ex: deletar fases extras, trocar stack)
- **Fix recomendado:** atualizar `arquitetura.md#mapa` com o jogo real + registrar decisões de produto (10 vs 20 fases, desbloqueio total, boss 2HP) em `decisoes.md`. Custo: ~1h (parcialmente feito nesta auditoria)
- **Estado:** corrigido
- [2026-10-17] (i) Fechado em 2026-10-17: `arquitetura.md#mapa` descreve o jogo verificado, `decisoes.md#jogo` registra as decisões de produto e `produto.md#jogo` ganhou a visão do jogo. `evidencia` [[arquitetura#mapa]].
- [2026-10-10] (i) Auditoria estática 2026-10-10 `bloqueia` [[arquitetura#mapa]].

### [AUD-08] Chefão com 2HP mas dica promete 3 pisadas

- **Severidade:** baixo — inconsistência texto-vs-código no clímax do jogo; hoje o boss morre "cedo demais" para quem lê a dica
- **Onde:** `game.js:723` (`initBoss` `hp:2,maxHp:2`) vs `game.js:391` (`DEATH_TIPS.boss` "3 pisadas")
- **Reprodução:** estático + jogar fase Castelo Arco-Íris até o boss (2 stomps matam; dica de morte fala em 3)
- **Por que importa:** quebra confiança da criança no momento de maior tensão; commit `b928cb3` reduziu dificuldade para ~6 anos mas não atualizou o texto
- **Fix recomendado:** alinhar texto a 2 pisadas (ou HP a 3, com validação do Pedro por ser regra de negócio). Custo: ~10min
- **Estado:** corrigido
- [2026-10-10] (i) Corrigido em F2/T2.3: texto alinhado a 2 pisadas (mantém o balance `b928cb3` p/ crianças). Boss HP segue 2.
- [2026-10-10] (i) Auditoria estática 2026-10-10.

### [AUD-09] Governança inteira fora do git — um `git clean` apagaria a memória

- **Severidade:** alto — o ativo que sustenta o método (protocolo de IAs, decisões, achados) existia só no disco local; clone em outra máquina ou limpeza de worktree perderia tudo, e nenhuma IA nova receberia o roteamento
- **Onde:** `git status` — `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `context/`, `fontes/`, `lint.py` como `??` (untracked)
- **Reprodução:** estático — `git status --short` em 2026-10-17 listava os 12 arquivos como não rastreados e `git log -- context/` não retornava nada
- **Por que importa:** perda total de memória sem chance de recuperação; toda sessão de IA dependia do disco físico do Pedro estar intacto
- **Fix recomendado:** commitar a memória. Custo: ~10min
- **Estado:** corrigido
- [2026-10-17] (i) Corrigido no commit `384afe8` (`chore: add project memory system`); `git log -- context/` agora responde.

### [AUD-10] Pós-F5 a memória descrevia um projeto que não existe mais

- **Severidade:** médio — IA lendo a memória em 2026-10-17 trataria AUD-04 como pendente (retrabalho), procuraria `handoff/` e `.cursorrules` inexistentes e veria o plano F0–F5 como não executado
- **Onde:** `context/achados.md` (AUD-04/AUD-07 abertos, já resolvidos por F4/F5), `context/arquitetura.md:49-54` (fatos do `handoff/`, `handoff.md` e `.cursorrules`), `context/discussoes/gameplay-mobile.md` (checkboxes T0.1–T5.3 vazios)
- **Reprodução:** estático — `ls handoff handoff.md .cursorrules` → inexistentes; comparar checkboxes com os commits `98361a9`…`7592d76`
- **Por que importa:** correções ficam invisíveis (risco de reabrir o resolvido) e instruções apontam para arquivos fantasma
- **Fix recomendado:** sincronizar os três arquivos com a realidade verificada. Custo: ~1h
- **Estado:** corrigido
- [2026-10-17] (i) Sincronizado em 2026-10-17: AUD-04/AUD-07 fechados com evidência de código, fatos do `handoff`/`.cursorrules` superseded em [[arquitetura#disco]], plano F0–F5 marcado com os commits. `evidencia` [[arquitetura#mapa]].

## Fechados {#fechados}

*Nenhum achado arquivado.*
