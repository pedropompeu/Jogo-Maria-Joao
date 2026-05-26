# BRAND.md — Jogo da Maria
**Versão:** 1.0  
**Data:** 2026-05-24  
**Status:** aprovado por NOVA  
**Pipeline:** ARIA → MAXWELL + ECHO → NOVA  
**brand_status:** aprovado

---

## 01. Identidade da Marca

| Campo | Valor |
|---|---|
| **Nome do produto** | Jogo da Maria (e do João) |
| **Nome completo** | Unicórnio Mágico da Maria |
| **Tagline principal** | Magia nas mãos da Maria |
| **Conceito de marca** | Galáxia Encantada |
| **Posicionamento** | Magia cósmica feita com amor |
| **Símbolo** | 🦄 Unicórnio (protagonista, não ornamento) |

---

## 02. Conceito Visual — Galáxia Encantada

Um universo roxo-noturno onde partículas douradas dançam em torno de uma criatura luminosa. A interface parece flutuar no espaço — leve, brilhante, cheia de *wonder*.

A linguagem visual mistura o **cósmico** (profundidade, estrelas, escuridão absoluta) com o **encantado** (brilhos neon, arco-íris, emojis expressivos). O resultado é pessoal e artesanal — não-corporativo. Feito com amor por um tio para seus sobrinhos.

**Conceito rejeitado:** "Prado Arco-Íris" — descartado por excesso de genericidade em jogos infantis. O fundo claro e cores saturadas convencionais não criam a diferenciação nem o senso de aventura necessários.

---

## 03. Paleta de Cores

### Primitivos

| Token | Hex | Papel Semântico | Psicologia |
|---|---|---|---|
| `--primitive-void` | `#0d001a` | Fundo base | Vácuo espacial — âncora psicológica, cria profundidade infinita |
| `--primitive-cosmos` | `#2a0050` | Fundo secundário | Campo de energia — pertencimento ao mundo do jogo |
| `--primitive-magenta` | `#ff88ff` | Cor de marca | Alegria pura — sinalização de elementos interativos |
| `--primitive-pink-hot` | `#ee44cc` | CTA e ação | Energia e urgência positiva — convida ao clique |
| `--primitive-violet` | `#8833ff` | Profundidade | Mistério e progressão — usado em gradientes |
| `--primitive-gold` | `#ffe066` | Recompensa | Conquista e raridade — números e estrelas |
| `--primitive-lavender` | `#ccaaff` | Texto secundário | Suavidade — legível sem competir |
| `--primitive-ice` | `#ddc8ff` | Badges e superfícies | Delicadeza — frames de instrução |
| `--primitive-blue` | `#2288cc` | Ação social | Confiança — compartilhar e instalar |

### Gradientes de Marca

| Nome | Definição | Uso |
|---|---|---|
| `bg-cosmic` | `radial-gradient(ellipse at center, #2a0050 0%, #0d001a 100%)` | Fundo da página |
| `grad-cta` | `linear-gradient(135deg, #ee44cc, #8833ff)` | Botões primários |
| `grad-share` | `linear-gradient(135deg, #2288cc, #0055aa)` | Botões de partilha |
| `grad-overlay` | `linear-gradient(135deg, #2a0050ee, #0d001aee)` | Toast de achievements |
| `grad-install` | `linear-gradient(135deg, #ee44cc44, #8833ff44)` | Botão de instalação PWA |

### Superfícies (6 tipos)

| Nome | Valor | Uso |
|---|---|---|
| `surface-ghost` | `rgba(255,255,255,0.07)` | Cards neutros, stats, level select |
| `surface-raised` | `rgba(255,255,255,0.12)` | UI bar ativa, elementos em estado de atenção |
| `surface-brand` | `rgba(255,136,255,0.15)` | Fase atual selecionada |
| `surface-install` | `rgba(238,68,204,0.27)` (mix) | Botão PWA |
| `surface-disabled` | `rgba(255,255,255,0.05)` | Elementos bloqueados/desabilitados |
| `surface-focus` | `rgba(255,136,255,0.20)` | Hover interativo |

---

## 04. Tipografia

### Família

```
'Segoe UI', system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif
```

**Razão:** Fonte do sistema — zero latência de carregamento, suporte nativo a emojis coloridos (essenciais na UX do jogo), legibilidade em telas infantis, funciona em todos os dispositivos sem CDN.

### Hierarquia de Pesos

| Nível | Peso | Uso |
|---|---|---|
| Título de tela | `900` | Títulos de overlay (vitória, derrota, fase) |
| CTA e botões | `700` | Todos os botões clicáveis |
| UI labels | `600` | Barra de hud, counters |
| Texto longo | `400` | Instruções, descrições |

### Tamanhos Recomendados

| Contexto | Tamanho |
|---|---|
| Título principal | `clamp(1.6rem, 4vw, 2.6rem)` |
| Subtítulo / instrução | `clamp(0.9rem, 2vw, 1.15rem)` |
| UI compact | `13px` |
| Microcopy badges | `0.88rem` |
| Labels de card | `0.72rem` — uppercase + letter-spacing |

---

## 05. Símbolo e Ícone

**Símbolo principal:** 🦄 (unicórnio emoji)

O unicórnio é o **protagonista da marca**, não ornamento decorativo. Aparece:
- No título da tela de início como emoji de destaque
- Em mensagens de encorajamento ("o unicórnio acredita em você!")
- Em CTAs de recomeço ("🦄 Recomeçar do Início")
- Em notificações de sucesso

**Especificação do símbolo desenhado (se necessário em contexto futuro):**
- Corpo: branco luminoso com brilho interno suave
- Juba: gradient rosa (#ff88ff) → roxo (#8833ff)
- Chifre: dourado (#ffe066) com brilho no topo
- Olhos: grandes, expressivos, cor magenta
- Proporção: cartoon friendly, não realista

**Ícone da PWA:** já definido em `icons/icon-192.png` e `icons/icon-512.png`.

---

## 06. Glows e Sombras

| Nome | Valor | Uso |
|---|---|---|
| `glow-canvas` | `0 0 40px rgba(255,136,255,.40), 0 0 80px rgba(136,68,255,.20)` | Canvas do jogo |
| `glow-title` | `0 0 20px #ff44ff, 0 0 50px rgba(255,0,255,.27)` | Títulos de overlay |
| `glow-cta` | `0 4px 18px rgba(238,68,204,.40)` | Botões primários (rest) |
| `glow-cta-hover` | `0 6px 28px rgba(238,68,204,.60)` | Botões primários (hover) |
| `glow-toast` | `0 4px 20px rgba(255,68,255,.27)` | Toast de achievements |
| `glow-stars` | `drop-shadow(0 0 6px #ffee00)` | Estrelas de fase |

**Regra:** Nunca usar sombras pretas sólidas. Toda sombra deve ser um glow colorido.

---

## 07. Estados de Componentes

### Botão Primário (CTA)

| Estado | Comportamento |
|---|---|
| `default` | Gradient cta, glow-cta, border-radius pill |
| `hover` | `scale(1.06)` + glow-cta-hover |
| `active` | `scale(0.97)` |
| `focus` | `outline: 2px solid #ff88ff; outline-offset: 3px` |
| `disabled` | `opacity: 0.4; cursor: not-allowed; transform: none` |
| `loading` | Texto substituto + animação pulse-glow |
| `error` | Não aplicável (botões não têm estado de erro direto) |
| `success` | Não aplicável (feedback dado pela tela seguinte) |

### Card de Fase (Level Select)

| Estado | Comportamento |
|---|---|
| `default` | surface-ghost, border-brand |
| `hover` | surface-focus + `scale(1.04)` |
| `active` / `current` | border magenta + surface-brand |
| `disabled` (bloqueado) | `opacity: 0.4; cursor: not-allowed` |

### Botão Fantasma (ícone)

| Estado | Comportamento |
|---|---|
| `default` | Transparente |
| `hover` | `scale(1.2)` |
| `active` | `scale(0.9)` |

---

## 08. Voz da Marca

### 4 Traços de Personalidade

| Traço | Descrição |
|---|---|
| **Mágico ✨** | Tudo tem um toque especial — a linguagem transforma ações simples em eventos encantados |
| **Alegre 🌈** | Energia alta, celebração genuína — o jogo sorri para a criança |
| **Encorajador 💪** | Nunca julga, sempre incentiva — cada tentativa é progresso |
| **Pessoal 💖** | Feito com amor pelo Tio Pedro — não é um produto genérico, é um presente |

### Variações de Tom

| Contexto | Tom | Exemplo |
|---|---|---|
| Conquista | Celebrativo + surpresa | "🦄 INCRÍVEL! Você zerou tudo!" |
| Derrota | Acolhedor + motivador | "💔 Fim de Jogo! Mas você foi ótimo!" |
| Tutorial | Simples + empolgante | "Pule em cima dos slimes! 🌟" |
| Espera | Mágico + curioso | "Preparando a magia... ✨" |
| Erro técnico | Casual + descontraído | "Algo deu errado! Tenta de novo 🦄" |

---

## 09. Anti-patterns — O que Nunca Fazer

**Visual:**
1. Fundos brancos ou claros (quebra a imersão cósmica)
2. Cores frias dessaturadas (cinzas, azuis acinzentados)
3. Gradientes genéricos de app corporativo (azul→verde)
4. Fontes com serifa
5. Bordas duras sem border-radius
6. Sombras pretas sólidas (usar apenas glows coloridos)
7. Ícones monocromáticos sem personalidade
8. Layout com muito espaço branco/vazio (quebraria a atmosfera imersiva)

**Verbal:**
1. "Erro" isolado — sempre contextualizar com emoji + encorajamento
2. "Você falhou" — usar "Quase!"
3. "Tente novamente" no imperativo frio — usar "Recomeça a aventura!"
4. "Carregando..." — usar "Preparando a magia... ✨"
5. "Confirmar" como texto de botão — usar a ação concreta
6. Voz passiva: "A fase foi completada" → "Você completou a fase!"
7. Vocabulário adulto: "configuração", "parâmetros", "sessão"
8. Negação como primeira palavra: "Não é possível" → "Ainda não..."
9. Ponto final em botões e CTAs
10. Todas as letras maiúsculas sem emoji (grita sem delícia)

---

## 10. Hierarquia de Mensagem

| Nível | Propósito | Exemplo |
|---|---|---|
| **1 — Missão** | Identidade — o jogo é dela | "Unicórnio Mágico da Maria" |
| **2 — Aventura** | Proposta de valor | "Colete moedas, evite inimigos, passe todas as fases!" |
| **3 — Mecânica** | Orientação de gameplay | "← → Mover \| ↑ Pular (2x!) \| P Pausar" |
| **4 — Reforço** | Feedback de ação | "⭐⭐⭐ Perfeito! Você coletou tudo!" |

---

## 11. Biblioteca de Microcopy

| Contexto | Copy aprovado |
|---|---|
| CTA principal | 🌈 Começar Aventura! |
| CTA reiniciar | 🦄 Recomeçar do Início |
| CTA próxima fase | ➡️ Próxima Fase! |
| CTA pausar | ❙❙ Pausar |
| CTA retomar | ▶️ Continuar |
| Empty state (sem recorde) | Ainda não há recorde — seja o primeiro! |
| Error genérico | Algo deu errado! Tenta de novo 🦄 |
| Loading | Preparando a magia... ✨ |
| Success (fase completa) | 🎉 Fase Completa! |
| Game over | 💔 Fim de Jogo! |
| Vitória total | 🏆 VOCÊ VENCEU! |
| Instalação PWA | Instalar como app |
| Compartilhar | 📋 Compartilhar Resultado |
| Fase bloqueada | 🔒 Complete a fase anterior primeiro! |
| Pausa | ❙❙ Pausado |
| Reiniciar fase | 🔄 Reiniciar Fase |

---

## 12. Taglines

| Rank | Tagline | Rationale |
|---|---|---|
| **1** ⭐ | Magia nas mãos da Maria | Pessoal, afetivo, memorável — conecta identidade à criança |
| **2** | Uma aventura encantada feita com amor | Evoca o contexto emocional do Tio Pedro |
| **3** | Pule, colete, conquiste — o unicórnio precisa de você! | Mecânico + emocional |
| **4** | Onde cada fase é uma nova magia | Poético, reforça progressão |
| **5** | O jogo da Maria, João e todo mundo que ama magia | Inclusivo, expandível |

---

## 13. Arquivos Gerados

| Arquivo | Caminho | Descrição |
|---|---|---|
| `BRAND.md` | `/home/usuario/Dev/Jogo-da-Maria/BRAND.md` | Este documento |
| `design-tokens.css` | `/home/usuario/Dev/Jogo-da-Maria/brand/design-tokens.css` | 3 camadas de tokens CSS |
| `tailwind.config.ts` | `/home/usuario/Dev/Jogo-da-Maria/brand/tailwind.config.ts` | Configuração Tailwind completa |

---

## 14. Liberação

```
─ DELIVERY COMPLETE
BRAND.md v1.0 — status: aprovado por NOVA
Data: 2026-05-24
Conceito: Galáxia Encantada
Tagline aprovada: "Magia nas mãos da Maria"
Salvo em: /home/usuario/Dev/Jogo-da-Maria/BRAND.md
Eng. Frontend liberado para iniciar implementação.
```
