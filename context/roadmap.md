---
tipo: contexto
projeto: jogo-da-maria
descricao: O que vem depois, por onda e prioridade — só itens com decisão (d); achado não mora aqui.
estado: estavel
criado: 2026-10-17
relacionado:
  - context/decisoes.md
  - context/discussoes/organizacao-expansao.md
---

# Roadmap {#roadmap}

> **Ordem do que vem depois.** Cada item aponta pra decisão que o sustenta. Bug e dívida
> moram em [[achados]]; dúvida em aberto mora em [[organizacao-expansao]]. Item entregue
> não se apaga: ganha `✅` e o commit. Custos são estimativas do Pedro, negociáveis.

## Onda 1 — organização e rede de proteção {#onda-1}

- [2026-10-17] (e) ✅ Memória versionada (`384afe8`), smoke + validador + CI (`a93e038`). `justifica` [[decisoes#qualidade]].
- [2026-10-17] (e) ✅ Checagem de bump do cache do SW no CI (`tools/check-sw-cache.mjs`, commit pendente). `justifica` [[decisoes#expansao]].

## Onda 2 — os sobrinhos no jogo {#onda-2}

> Começa "depois que terminar todas as 20 primeiros" — a leitura dessa condição está em
> [[organizacao-expansao#aberto]]. A ordem interna entre os itens também não foi fixada.

- [2026-10-17] (d) **João e Maria montados no unicórnio.** Custo de referência ~4h. `justifica` [[decisoes#expansao]].
- [2026-10-17] (d) **Loja de itens novos por troca de pontos.** Custo de referência ~6h. Bloqueada pelo esquema de pontuação ([[organizacao-expansao#aberto]]). `justifica` [[decisoes#expansao]].

## Onda 3 — conteúdo {#onda-3}

- [2026-10-17] (d) **Mundo novo (fases 21+)**, depois da Onda 2 e "em outro momento". Custo de referência ~2h/mundo. `justifica` [[decisoes#expansao]].

## Backlog — sem onda {#backlog}

- [2026-10-17] (d) "Correio da Maria" (recados via Netlify Forms). `justifica` [[decisoes#expansao]].
- [2026-10-17] (d) Desafios para +16, como possibilidade. `justifica` [[produto#jogo]].
- [2026-10-17] (i) Itens do brainstorm ainda sem decisão: fantasma do speedrun, cutscenes leves, save versionado + export/import, fatiar `game.js`, card com QR, playtest real em `fontes/`. Ver [[organizacao-expansao#opcoes]].

## Fora do roadmap {#fora}

- [2026-10-17] (d) Coop local 2P — descartado. `justifica` [[decisoes#expansao]].
- [2026-10-17] (d) Domínio próprio — descartado; o subdomínio basta. `justifica` [[decisoes#expansao]].
- [2026-10-17] (d) Lighthouse e Playwright no CI — nenhuma dependência externa por enquanto. `justifica` [[decisoes#expansao]].
