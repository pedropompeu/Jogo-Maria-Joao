---
tipo: contexto
projeto: memoria-de-projeto
descricao: Log de decisões fechadas, com data, razão e o que cada uma fecha.
estado: estavel
criado: 2026-09-12
---

# Decisões

> **Ler antes de reabrir qualquer discussão.** Este arquivo existe pra não decidir duas
> vezes — e, mais importante, pra que a alternativa descartada continue registrada com o
> motivo pelo qual caiu.
>
> Decisão que ainda está sendo tomada **não mora aqui**: mora em [`discussoes/`](discussoes/).

## Método e Governança {#metodo}

- [2026-09-12] (d) **Autonomia assistida para as IAs.**
  **Por quê:** Acelera o desenvolvimento diário permitindo que as IAs implementem detalhes técnicos de código e documentem com `(i)`, enquanto Pedro Pompeu retém a validação `(d)` de arquitetura, regras de negócio e inclusão de dependências.
  **Fecha:** Incertezas sobre até onde a IA pode ir sem autorização prévia.
  **Descartado:** Autonomia cega (onde a IA altera arquitetura sem aviso) e microgerenciamento restritivo (onde a IA precisa de aprovação para qualquer linha de código).

- [2026-09-12] (d) **Padrão de Commits: Conventional Commits em inglês e sem co-autoria.**
  **Por quê:** Padroniza o histórico do Git no padrão internacional (`feat:`, `fix:`, `chore:`, `refactor:`) e mantém autoria limpa sem a linha `Co-Authored-By`.
  **Fecha:** Formatação e idioma de mensagens de commit para todas as IAs.
  **Descartado:** Commits em português ou mensagens livres despadronizadas.

## Sistema e Arquitetura {#infraestrutura}

- [2026-09-12] (d) **Adoção da memória de projeto versionada em arquivos (`context/` e `fontes/`).**
  **Por quê:** Garante persistência contextual de longo prazo entre diferentes sessões e ferramentas de IA (Claude, Antigravity, Cursor) sem inflar a janela de contexto e com rastro de auditoria.
  **Fecha:** Elimina a necessidade de reexplicar decisões e arquitetura a cada nova sessão de IA.
  **Descartado:** Prompts monolíticos gigantescos e dependência de memória proprietária volátil.

## Jogo: gameplay mobile-first 8-14 anos {#jogo}

- [2026-10-10] (d) **20 fases via `levels-data.js` como módulo.**
  **Por quê:** Metade do conteúdo já está pronto e parado; dobrar as fases resolve AUD-01 de vez e dá longevidade para 8-14 anos.
  **Fecha:** Destino das fases 11-20 (Lava, Tundra, Guardião). `[[gameplay-mobile#opcoes]]`.
  **Descartado:** Manter 10 fases e descartar as extras (desperdiçava trabalho pronto).
- [2026-10-10] (d) **Progressão suave por desbloqueio.**
  **Por quê:** Crianças de 8-14 anos valorizam conquista; "Bloqueado" do level-select passa a fazer sentido. Troca o default `Array(10).fill(true)` por progressão real.
  **Fecha:** Tudo-aberto vs progressão. `[[gameplay-mobile#opcoes]]`.
  **Descartado:** Tudo desbloqueado (zerava o senso de conquista).
- [2026-10-10] (d) **Manter todos os sistemas (4 power-ups, 3 dificuldades, speedrun).**
  **Por quê:** Nada se joga fora; a simplicidade virá de tutorial e controles melhores, não de corte de conteúdo.
  **Fecha:** Enxugar vs manter. `[[gameplay-mobile#opcoes]]`.
  **Descartado:** Simplificar para estrela+escudo e esconder speedrun.
- [2026-10-10] (d) **UI/UX com mais cor e brilho, herói unicórnio em destaque; fases mantêm variedade.**
  **Por quê:** O unicórnio é o protagonista da marca (`BRAND.md` §05); o "gostoso" vem do brilho/celebração na interface, não de reescurecer as fases que as crianças amam.
  **Fecha:** Fases claras vs moldura cósmica. `[[gameplay-mobile#opcoes]]`.
  **Descartado:** Reescurecer todas as fases (retrabalho de arte, perda de variedade).

- [2026-09-12] (d) **Foco híbrido: produtos próprios da holding e demandas sob medida para clientes.**
  **Por quê:** O ecossistema engloba tanto plataformas proprietárias (ViaXen, PomPay, NarraVox) quanto soluções sob demanda para clientes, exigindo rigor técnico e separação clara de escopos.
  **Fecha:** Modelo operacional do repositório e da orquestração de IAs.
  **Descartado:** Tratar todos os repositórios como projetos descartáveis de cliente ou exclusivamente internos.

## Qualidade e Ferramentas {#qualidade}

- [2026-10-17] (d) **Testes e CI sem dependências externas, antes de expandir conteúdo.**
  **Por quê:** A rede de proteção precisa rodar sozinha a cada mudança: smoke headless do jogo (init, Começar Aventura, quadros e cenário de storage bloqueado), validador estático das 20 fases e CI no GitHub Actions rodando também `python lint.py`. Implementado sem npm deps — o projeto segue sem build e sem instalação.
  **Fecha:** Como validar mudança de código e de fase a partir de agora. `[[organizacao-expansao#opcoes]]` (Eixo 2).
  **Descartado:** E2E em browser real (Playwright etc.) neste momento — dependeria de biblioteca externa e de nova validação; o smoke headless cobre o essencial até lá.

## Expansão pós-F5 {#expansao}

> Fechadas na revisão do brainstorm [[organizacao-expansao]]. Respostas cruas em
> `fontes/2026-10-17-pedro-decisoes-onda-2.md`; a ordem por onda mora em [[roadmap]].

- [2026-10-17] (d) **O João entra como "João e Maria montados no unicórnio".**
  **Por quê:** escolha do Pedro; preserva o herói unicórnio fixado em [[decisoes#jogo]].
  **Fecha:** a forma do "João jogável" do Eixo 1. `[[organizacao-expansao#opcoes]]`.
  **Descartado:** personagem humano jogável, segundo unicórnio do João, adiar até o playtest.
- [2026-10-17] (d) **Asas e coroa continuam ganhas por progresso; a loja vende só itens novos, por troca de pontos.**
  **Por quê:** ninguém perde o que já ganhou (`game.js:1100-1101`). O esquema de pontuação para resgatar itens ainda está por desenhar → [[organizacao-expansao#aberto]].
  **Fecha:** a relação entre loja e cosméticos existentes.
  **Descartado:** vender asas e coroa na loja; ficar sem loja.
- [2026-10-17] (d) **Coop local para 2 jogadores descartado.**
  **Por quê:** escolha do Pedro; motivo não declarado. A revisão tinha apontado o conflito entre "mesmo teclado" e o público mobile-first.
  **Fecha:** Eixo 1, coop. `[[organizacao-expansao#opcoes]]`.
  **Descartado:** coop no tablet com dois d-pads, coop só no computador, manter em backlog.
- [2026-10-17] (d) **Público segue 8 a 14 anos; desafios para +16 são uma possibilidade.** Ver [[produto#jogo]].
  **Fecha:** a dúvida levantada pelo balance de `b928cb3` (~6 anos) — não muda a faixa.
  **Descartado:** ampliar para 6 a 14 anos.
- [2026-10-17] (d) **Um mundo novo (fases 21+) abre depois da Onda 2, "em outro momento".** As 20 fases de [[decisoes#jogo]] seguem sendo o jogo atual.
  **Fecha:** se a contagem de 20 é teto — não é.
  **Descartado:** não abrir mundo novo; abrir já na Onda 2.
- [2026-10-17] (d) **Onda 2 começa "depois que terminar todas as 20 primeiros".** A leitura dessa condição está em aberto → [[organizacao-expansao#aberto]].
  **Fecha:** a Onda 2 não começa pelo playtest nem pelas fases 21+.
  **Descartado:** playtest → João → loja; João → loja direto; fases 21+ e checagem do SW primeiro.
- [2026-10-17] (d) **Os custos marcados `(d)` no brainstorm são do Pedro, mas são estimativas negociáveis, não regras.**
  **Fecha:** a procedência das tabelas de [[organizacao-expansao#opcoes]].
  **Descartado:** rebaixar os custos para `(i)`.
- [2026-10-17] (d) **Checagem de bump do cache do SW no CI, sem dependência.** Implementada em `tools/check-sw-cache.mjs` + `tools/sw-cache.lock.json`.
  **Por quê:** esquecer o bump do `CACHE` foi a origem do AUD-02 ([[achados#abertos]]).
  **Fecha:** Eixo 2, "bump automático do SW" — vira checagem, não automação.
  **Descartado:** bump automático; adiar até haver releases frequentes.
- [2026-10-17] (d) **Nenhuma dependência externa no CI por enquanto.** Reafirma [[decisoes#qualidade]].
  **Fecha:** Lighthouse mobile e Playwright no CI.
  **Descartado:** Lighthouse, Playwright ou ambos agora.
- [2026-10-17] (d) **Roadmap visível em `context/roadmap.md`, com prioridade por onda.** → [[roadmap]].
  **Fecha:** Eixo 3, "onde mora o que vem depois".
  **Descartado:** deixar a discussão aberta cumprir esse papel.
- [2026-10-17] (d) **"Correio da Maria" fica em backlog.**
  **Fecha:** Eixo 4, feedback via Netlify Forms — por ora.
  **Descartado:** fazer agora; descartar.
- [2026-10-17] (d) **Sem domínio próprio: o subdomínio `sobrinhosdotiopedro.netlify.app` basta.**
  **Fecha:** Eixo 4, domínio.
  **Descartado:** comprar domínio agora ou depois.
