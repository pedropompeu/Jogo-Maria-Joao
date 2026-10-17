---
tipo: indice
projeto: memoria-de-projeto
descricao: Índice do material bruto — o que entrou, quando, de quem, e qual fato saiu dele.
estado: estavel
criado: 2026-09-12
---

# Índice — fontes (material bruto)

> **Esta pasta é intocável.** Nada aqui é editado, reescrito, resumido ou apagado — nunca,
> nem pra corrigir typo. É a fonte da verdade contra a qual o `context/` pode ser auditado.
> Só se **acrescenta**.

## Por que existe

Sem ela, um fato `(e)` guarda a **sua destilação** e o original some. Não dá pra voltar e
reler o que a pessoa escreveu — só a sua versão do que ela disse. Se as duas camadas
divergirem, **`fontes/` vence**.

| Camada | O que é | Quem escreve | Muda? |
|---|---|---|---|
| `fontes/` | material bruto: e-mail, spec, mensagem, contrato, PDF, transcript | ninguém — só chega | **nunca** |
| `context/` | conhecimento destilado, com data e procedência | você, e o modelo sob revisão | sempre |

## Convenções

- **Nome:** `YYYY-MM-DD-origem-assunto.ext`. A data é a de **recebimento**, não a de hoje.
  Extensão original preservada (`.md`, `.txt`, `.pdf`, `.eml`, `.png`).
- **Sem frontmatter, sem edição de cabeçalho.** O byte que chegou é o byte que fica.
  Metadado sobre a fonte mora **neste índice**, não dentro dela.
- **Colar cru.** A mensagem entra com a saudação, o typo e a assinatura. Cortar já é
  interpretar.
- **Um fato `(e)` aponta pra fonte** quando ela existe:
  `- [2026-09-12] (e) ← fontes/2026-09-12-origem-assunto.md O que veio...`
- **Fonte que ninguém cita é sinal, não erro** — pode ser material ainda não processado.
  O lint reporta como pendência de ingestão.

## O que entra

O que tem **palavra de outra pessoa** ou **número que alguém vai querer conferir**:
mensagem, descrição de vaga, e-mail de cliente, spec recebido, contrato, planilha entregue.

Não entra o que é seu output (rascunho de resposta, análise) — isso é `context/`, ou não é
nada.

**Duas exceções previstas:**

1. **Compilado de pesquisa** feito por você ou pelo modelo, desde que cada número venha com
   a URL de origem e **nenhuma interpretação**. A leitura mora no `context/`.
2. **`.txt` extraído** ao lado de um PDF ou `.docx`. É a única derivação permitida aqui
   dentro: binário não se pesquisa com grep e vira arquivo que ninguém abre. O binário
   segue sendo o original; o `.txt` é descartável e regerável.

## Conteúdo

| Arquivo | Recebido | De quem | O que é | Virou |
|---|---|---|---|---|
| `2026-10-17-pedro-decisoes-onda-2.md` | 2026-10-17 | Pedro Pompeu | Respostas coladas da página de decisões da revisão do brainstorm `organizacao-expansao` | `context/decisoes.md#expansao`, `context/roadmap.md`, `context/discussoes/organizacao-expansao.md#aberto` |
| `2026-10-17-pedro-bug-celular.md` | 2026-10-17 | Pedro Pompeu | Respostas no chat: playtest como condição, melhorar jogabilidade das 20 fases, bug no celular | `context/roadmap.md#onda-1`, `context/achados.md#abertos` (AUD-11) |
| `2026-10-17-pedro-gatilho-onda-2.md` | 2026-10-17 | Pedro Pompeu | Resposta no chat sobre o que é "terminar as 20" | `context/decisoes.md#expansao`, `context/roadmap.md#onda-1` |
| `2026-10-17-pedro-unicornio-v16.md` | 2026-10-17 | Pedro Pompeu | Mensagens do chat que guiaram o redesenho do unicórnio (esboços v1–v16 na aba visual) e o pedido de botões de toque maiores; a imagem de referência é de banco de imagens e ficou fora do repo | `context/decisoes.md#jogo`, `context/arquitetura.md#mapa` |
| `2026-10-17-pedro-tela-cheia.md` | 2026-10-17 | Pedro Pompeu | Resposta no chat: confirmação de que a correção do celular funcionou + pedido de botão de tela cheia | `context/achados.md#abertos` (AUD-11), `context/roadmap.md#onda-1`, `context/decisoes.md#qualidade` |
