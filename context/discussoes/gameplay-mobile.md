---
tipo: contexto
projeto: jogo-da-maria
descricao: Plano de gameplay mobile-first para 8-14 anos, simples e gostoso de jogar.
estado: fechada
criado: 2026-10-10
relacionado:
  - context/decisoes.md
  - context/achados.md
  - context/arquitetura.md
---

# Gameplay mobile-first 8-14 anos — simples e gostoso {#gameplay-mobile}

> Discussão **fechada em 2026-10-10** → decisões em [[decisoes#jogo]]. O arquivo **não se
> apaga** — é onde vive o raciocínio que a decisão comprimiu.

## A pergunta {#pergunta}

Como deixar o jogo simples porém gostoso para crianças de 8 a 14 anos no celular,
sem quebrar a brand Galáxia Encantada nem o conteúdo já pronto?

- [2026-10-10] (i) **Bloqueia:** F1 (controles), F3 (simplificação), F5 (conteúdo) — sem as
  respostas do Pedro, a implementação pode ir na direção oposta ao gosto das crianças.
  F0 (higiene técnica) **não bloqueia nada** e pode andar em paralelo.

## O que já se sabe {#sabido}

- [2026-10-10] (e) ← `game.js:2325-2346` Controles touch são `div` com só `touchstart/end`,
  sem `click/keydown`, sem `role=button` → [[achados#abertos]] AUD-04.
- [2026-10-10] (e) ← `game.js:12-14,1048-1092` Física sem coyote time, sem jump buffer, sem
  altura variável de pulo; `jumpEdge` é descartado fora de `playing` (`game.js:2294`).
- [2026-10-10] (e) ← `index.html:5` `user-scalable=no` bloqueia zoom (WCAG 1.4.4).
- [2026-10-10] (e) ← `BRAND.md` Brand Galáxia Encantada aprovada; anti-pattern veta fundos
  claros — mas 6 das 10 fases jogáveis são claras (prado, praia, doces, nuvens).
  `tensiona` [[achados#abertos]] AUD-04.
- [2026-10-10] (e) ← auditoria 2026-10-10 Fases 11-20 prontas e inalcançáveis → [[achados#abertos]] AUD-01;
  desbloqueio total por default (`game.js:20`) vs level-select com "Bloqueado";
  boss 2HP vs dica "3 pisadas" → [[achados#abertos]] AUD-08.
- [2026-10-10] (d) Público-alvo: crianças de 8 a 14 anos, mobile primeiro.

## Opções {#opcoes}

### Conteúdo: 10 fases enxutas ou 20 completas?

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| A — 10 fases, polir game-feel | Foco total no "gostoso"; menos teste; fecha rápido | Desperdiça 10 fases prontas | ~0h conteúdo |
| B — 20 fases via `levels-data.js` como módulo (Recomendado) | Dobra o conteúdo; resolve AUD-01 de vez | Exige regressão das 10 atuais; balance das 10 novas | ~4h + playtest |

### Progressão: tudo aberto ou progressão por estrelas?

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| A — tudo desbloqueado (status quo) | Criança menor não trava; bom pra festa/escola | Zera senso de conquista (8-14 adoram desbloquear) | 0h |
| B — progressão suave (Recomendado) | Fase seguinte abre ao completar anterior; "Bloqueado" passa a fazer sentido; mantém modo livre via level-select após zerar | Criança pode travar numa fase | ~2h + estrela-guia |

### Sistemas: enxugar power-ups/dificuldades/speedrun?

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| A — manter tudo (4 power-ups, 3 dificuldades, speedrun) | Nada se joga fora | Tela inicial confusa p/ 8 anos; speedrun é nicho | 0h |
| B — simplificar (Recomendado) | Tutorial ensina 2 verbos (mover+pular); estrela+escudo como únicos power-ups nas 3 primeiras fases; speedrun vira "modo extra" após zerar | Rebalance das fases 4+ | ~3h |

### Fases claras vs moldura cósmica?

| Opção | A favor | Contra | Custo |
|---|---|---|---|
| A — reescurecer tudo | Fidelidade total à brand | Perde variedade que criança ama; retrabalho de arte | ~6h |
| B — moldura cósmica + fases variadas (Recomendado) | UI/HUD/overlays 100% Galáxia Encantada; fases mantêm identidade própria (prado, praia…) com céu noturno e borda glow | Exceção documentada ao anti-pattern | ~2h |

## Plano em tarefas {#plano}

### F0 — Higiene mobile (anda já, sem decisão) ~4h

- [x] T0.1 `safeGet/safeSet` p/ `localStorage` + fallback em memória → AUD-03
- [x] T0.2 Guarda de morte por tempo + bound-check `nextLvlBtn` → AUD-05
- [x] T0.3 SW: incluir `design-tokens.css`, `ignoreSearch:true`, bump documentado → AUD-02
- [x] T0.4 `netlify.toml` raiz + `.netlify/` no `.gitignore` → AUD-06

### F1 — Controles gostosos (precisa: tamanho e portrait?) ~5h

- [x] T1.1 `div.touch-btn` → `<button>`, `pointer events` (mouse+touch+caneta), multitouch real
- [x] T1.2 Jump buffer ~120ms + coyote time ~100ms + altura variável (soltar = pulo curto)
- [x] T1.3 Botão pular maior (lado direito, 84px), setas 72px, zona morta entre eles
- [x] T1.4 Remover `user-scalable=no`; zoom liberado fora do canvas

### F2 — Física perdoadora (autonomia técnica) ~3h

- [x] T2.1 Hitbox do inimigo 80% do sprite; stomp com tolerância +8px
- [x] T2.2 Escudo grátis na fase 2 (ensina sem punir); checkpoints a cada ~800px nas fases longas
- [x] T2.3 Alinhar boss 2HP × texto (aguarda decisão F5)

### F3 — Clareza sem corte (decidido: manter tudo) ~2h

- [x] T3.1 Tutorial em 3 gestos (anda → pula → stompa), sem parágrafo
- [x] T3.2 Placas visuais quando cada power-up estreia (em vez de restringir)
- [x] T3.3 Microcopy da tela inicial reorganizado (speedrun como opção secundária, sem remover)

### F4 — Brand no mobile (precisa: moldura cósmica?) ~3h

- [x] T4.1 Voz da marca nos overlays (microcopy `BRAND.md` §11: "Quase!", sem "falhou")
- [x] T4.2 `:focus` visível real (`outline` magenta) + `role=dialog` + `aria-live` HUD/toast
- [x] T4.3 HUD mobile minimal: moedas+vidas grandes, resto no pause

### F5 — Conteúdo (decidido: 20 fases + progressão) ~4-6h

- [x] T5.1 Importar `levels-data.js` como módulo, remover `LEVELS` inline (decidido)
- [x] T5.2 Progressão suave: próxima fase abre ao completar anterior (decidido)
- [ ] T5.3 Playtest mobile roteirizado (2 crianças 8-10, 2 de 11-14): zerar fase 1 sem ajuda? — **pendente de verdade**: o playtest de F5 foi técnico (fases 11 e 20 jogáveis, progressão, console limpo), não com crianças.

- [2026-10-17] (i) F0–F5 executados por completo: `98361a9` (F0) `791807c` (F1) `af66b9c` (F2) `b512118` (F3) `ec8015c` (F4) `39fb720` (F5) `7592d76` (ícones). Checkboxes marcados retroativamente em 2026-10-17 após verificação de código em disco.

## Default adotado enquanto não fecha {#default}

- [2026-10-10 ~superseded 2026-10-10] (d) ~~Vale o recomendado em cada tabela (B/B/B/B) para estimativa; nada de F1/F3/F5 é implementado antes do Pedro responder.~~ → Decidido por Pedro em 2026-10-10, ver [[decisoes#jogo]]: 20 fases via módulo + progressão suave + manter sistemas + UI com brilho focada no unicórnio. F0 liberada para execução imediata.
