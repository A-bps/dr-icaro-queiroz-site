# Direção de arte — "O traço"

## Ideia
Todo o trabalho do Dr. Ícaro começa com um gesto: a linha frontal desenhada à mão, no rosto do paciente. O site usa esse traço como assinatura visual: uma linha fina, irregular como uma linha capilar natural, que se desenha conforme a rolagem e costura os capítulos. O resto fica quieto: fotografia grande, tipografia forte, muito espaço.

## Paleta (derivada da identidade original: marinho + ouro, mais o cinza de estúdio das fotos)
| Nome | Hex | Uso |
|---|---|---|
| Tinta | `#0F1C2E` | Texto principal, fundos escuros (hero, o dia da cirurgia, rodapé) |
| Estúdio | `#E4E2DD` | Fundo dominante; é o cinza do fundo dos retratos, então as fotos "saem" da página |
| Papel | `#F3F2EE` | Superfícies claras alternadas |
| Pedra | `#4D5058` | Texto secundário (contraste 6:1 sobre Estúdio) |
| Latão | `#C2A04A` / `#765C12` | O traço e detalhes. Claro só sobre Tinta; escuro para texto sobre fundos claros |

Sem azul hospitalar, sem gradiente decorativo, sem glass. Raio de borda 2px em controles, 0 em fotos.

## Tipografia
- **Newsreader** (serif de texto com eixo óptico) em tamanhos display, peso 300–400: precisão e voz humana.
- **Schibsted Grotesk** para corpo, navegação e dados: grotesca firme, legível.
- Escala de razão 1.333, títulos com `text-wrap: balance`, corpo até ~64ch.

## Layout
Grade de 12 colunas assimétrica. Títulos ancorados à esquerda ocupando 7–8 colunas; fotos sangram até a borda do lado oposto. Alternância de densidade: capítulo de texto aberto → capítulo de imagem dominante → capítulo de dados. Numeração só onde existe sequência real (as 5 etapas do dia e a linha do tempo do pós-operatório).

## Movimento (cada um com função)
- Hero: entrada única orquestrada (título por linhas, retrato revelado por clip-path, traço desenhado).
- Traço: clip-path sincronizado ao scroll na seção "Naturalidade".
- O dia da cirurgia: seção fixada com rolagem horizontal e barra de progresso (desktop).
- Fotos: parallax sutil (≤8%) e revelação por clip-path.
- Contadores só com números reais (300, 10, 79).
- Linha do tempo do pós-operatório preenchida conforme a rolagem.
- `prefers-reduced-motion`: tudo estático, Lenis desligado.

## Autocrítica anti-template
Primeiro rascunho caía em "hero escuro + números grandes em faixa + cards de serviço". Trocado por: números integrados ao capítulo "O dia inteiro é seu" como frases tipográficas; serviços em lista editorial com divisórias em vez de cards; nenhum rótulo em caixa alta acima dos títulos.
