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
