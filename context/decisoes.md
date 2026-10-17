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
- [2026-10-17] (d) **Unicórnio redesenhado como boneco articulado feito só em código (esboço v16 aprovado).**
  **Por quê:** Pedro pediu um unicórnio "mais belo e fofo" e escolheu, da referência, cabeção de bebê, olhões, contorno escuro, crina em mechas e chifre dourado (corpo segue rosa); depois guiou corpo alongado, pescoço equino, "bundinha", joelhos, cascos retos, galope de cavalo e crina/rabo em mechas arco-íris com movimento de cabelo — "perfeito, agora ficou com cara de cabelo". Ninguém vai sentar num editor de animação, e o projeto segue sem dependências. ← `fontes/2026-10-17-pedro-unicornio-v16.md`
  **Fecha:** Ferramenta de animação de personagem vs. desenho no código; visual do herói.
  **Descartado:** Rive/Spine/DragonBones (exigem alguém no editor); GSAP/anime.js (só deixam o movimento macio, e é dependência nova); PixiJS+Spine (reescreveria o render); manter o desenho antigo.
- [2026-10-17] (d) **Botões de toque com raio 1/3 maior: d-pad 72→96px, pulo 84→112px.**
  **Por quê:** pedido do Pedro ("aumentar em 1/3 o raio dos botões"). Ícones crescem na mesma proporção; o botão de tela cheia (44px) não é de jogabilidade e ficou igual.
  **Fecha:** tamanho dos botões de jogabilidade no celular.
  **Descartado:** —
- [2026-10-17] (i) **Cabelo do unicórnio simulado no espaço do mundo, sentindo só uma fração do movimento real (κx=0,7; κy=0,45).**
  **Por quê:** no esboço o vento vinha de um número fixo; no jogo o arrasto vem do deslocamento de verdade, e o pulo do jogo é bem mais alto que o do esboço — com κ=1 o cabelo chicoteia. A queda usa a gravidade da fase (`grav`), e um salto de mais de 80px (respawn, checkpoint, menu) recomeça o penteado.
  **Fecha:** como portar a física do esboço v16 para `ch_drawUnicorn`.
  **Descartado:** vento sintético por estado (cabelo não reage a parar de repente nem a cair de plataforma); κ=1 (chicote no pulo).
- [2026-10-17] (i) **Estados do jogo no boneco novo:** machucado = olhos apertados + o pisca-pisca que já existia; vitória = coraçõezinhos orbitando; cosméticos = asas nas costas e coroa sob o chifre; no menu o unicórnio entra galopando e vira de frente ao parar.
  **Por quê:** manter as expressões e a loja que existiam no desenho antigo ([[decisoes#expansao]]) sem inventar estado novo.
  **Fecha:** mapeamento estado → pose do herói.
  **Descartado:** expressões novas (fora do que foi pedido).

- [2026-09-12] (d) **Foco híbrido: produtos próprios da holding e demandas sob medida para clientes.**
  **Por quê:** O ecossistema engloba tanto plataformas proprietárias (ViaXen, PomPay, NarraVox) quanto soluções sob demanda para clientes, exigindo rigor técnico e separação clara de escopos.
  **Fecha:** Modelo operacional do repositório e da orquestração de IAs.
  **Descartado:** Tratar todos os repositórios como projetos descartáveis de cliente ou exclusivamente internos.

## Qualidade e Ferramentas {#qualidade}

- [2026-10-17] (d) **Testes e CI sem dependências externas, antes de expandir conteúdo.**
  **Por quê:** A rede de proteção precisa rodar sozinha a cada mudança: smoke headless do jogo (init, Começar Aventura, quadros e cenário de storage bloqueado), validador estático das 20 fases e CI no GitHub Actions rodando também `python lint.py`. Implementado sem npm deps — o projeto segue sem build e sem instalação.
  **Fecha:** Como validar mudança de código e de fase a partir de agora. `[[organizacao-expansao#opcoes]]` (Eixo 2).
  **Descartado:** E2E em browser real (Playwright etc.) neste momento — dependeria de biblioteca externa e de nova validação; o smoke headless cobre o essencial até lá.

- [2026-10-17] (i) **Resgate do SW de maio via regra do Netlify, sem mexer em estrutura do jogo.** `game.js?v=…` (só o `index.html` de maio pede assim) → `legacy/v7-reload.js`, que atualiza o SW e recarrega 1×.
  **Por quê:** o SW `unicorn-v7` serve o `index.html` velho de cache e não há como mudar código que já está no aparelho; o único ponto controlável é a resposta da rede. O Netlify não casa valor de query, só presença — por isso o `index.html` atual deixou de usar `?v=`.
  **Fecha:** AUD-11 em [[achados#abertos]].
  **Descartado:** mover `game.js` de caminho (mudança estrutural); só pedir para recarregar (cada criança cairia uma vez no menu morto).

- [2026-10-17] (i) **Botão de tela cheia do celular no canto superior direito (`#mobileFsBtn`), e os corações do HUD recuam para ele.** Pedido do Pedro ← `fontes/2026-10-17-pedro-tela-cheia.md`.
  **Por quê:** no toque o `#ui` inteiro some (e com ele o `#fsBtn`); o canto superior direito fica longe dos polegares (d-pad e pulo moram embaixo) e não cobre o título da tela inicial. O botão some sem Fullscreen API (iPhone) e no app instalado (o manifest já abre em `display: fullscreen`). Ao entrar em tela cheia, tenta travar em paisagem — o Android só aceita o lock nesse modo.
  **Fecha:** como a criança põe o jogo em tela cheia no navegador do celular.
  **Descartado:** entrar em tela cheia sozinho no "Começar Aventura!" (muda o fluxo sem pedido); botão embaixo, no meio dos controles (toque acidental no meio da fase).

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
- [2026-10-17 ~superseded 2026-10-17] (d) ~~**Onda 2 começa "depois que terminar todas as 20 primeiros".** A leitura dessa condição está em aberto → [[organizacao-expansao#aberto]].~~ → leitura fechada na decisão seguinte.
  **Fecha:** a Onda 2 não começa pelo playtest nem pelas fases 21+.
  **Descartado:** playtest → João → loja; João → loja direto; fases 21+ e checagem do SW primeiro.
- [2026-10-17] (d) **"Terminar as 20" é fechar as pendências das 20 fases existentes; só então a Onda 2 começa.** ← `fontes/2026-10-17-pedro-gatilho-onda-2.md`
  **Fecha:** o gatilho da Onda 2 em [[organizacao-expansao#aberto]].
  **Descartado:** esperar as crianças zerarem as 20 fases.
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
