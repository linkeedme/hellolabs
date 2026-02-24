# Hello Labs — Design System
> Fonte unica de verdade para toda a identidade visual do sistema.
> Toda feature nova deve ser consistente com este documento.
> Atualizado por: Davi Torres | Ultima atualizacao: 23/02/2026

---

## 1. MARCA E IDENTIDADE

- **Nome:** Hello Labs
- **Dominio:** hellolabs.com.br
- **Tom de voz:** Profissional, confiavel, moderno, acessivel
- **Logo:** (a definir — aguardando assets de design)
  - Versoes: full (nome + icone), icon only, monocromatico

---

## 2. PALETA DE CORES

> Cores provisorias — serao atualizadas quando o design for enviado.
> Alterar em: `src/design-system/tokens.ts` → propaga no sistema inteiro.

### Cores da Marca
| Token | Hex | Uso |
|-------|-----|-----|
| `primary.DEFAULT` | `#0ea5e9` | Botoes primarios, links, elementos de destaque |
| `primary.50` | `#f0f9ff` | Background sutil de primary |
| `primary.100` | `#e0f2fe` | Hover background |
| `primary.200` | `#bae6fd` | Borders e focus rings |
| `primary.600` | `#0284c7` | Texto sobre backgrounds claros |
| `primary.700` | `#0369a1` | Hover de botoes primarios |
| `primary.900` | `#0c4a6e` | Texto escuro de primary |

### Cores Semanticas
| Token | Hex | Uso |
|-------|-----|-----|
| `success` | `#22c55e` | Caso entregue, pagamento recebido, SLA ok |
| `warning` | `#f59e0b` | SLA em risco (<24h), estoque baixo |
| `error` | `#ef4444` | SLA vencido, inadimplente, erro |
| `info` | `#3b82f6` | Informativo, notificacao neutra |

### Cores Neutras (Gray Scale)
| Token | Uso |
|-------|-----|
| `gray.50` | Background de pagina |
| `gray.100` | Background de cards, surfaces |
| `gray.200` | Borders, separators |
| `gray.300` | Borders de inputs |
| `gray.400` | Placeholder text |
| `gray.500` | Texto secundario, muted |
| `gray.600` | Texto de labels |
| `gray.700` | Texto principal em surfaces |
| `gray.800` | Titulos |
| `gray.900` | Texto principal |
| `gray.950` | Texto de maximo contraste |

### Dark Mode
- Inversao automatica de cores neutras
- Primary mantida com leve ajuste de luminosidade
- Semanticas mantidas com leve aumento de saturacao

---

## 3. TIPOGRAFIA

| Token | Valor | Uso |
|-------|-------|-----|
| `fontFamily.sans` | Inter, system-ui, sans-serif | Texto principal |
| `fontFamily.mono` | JetBrains Mono, monospace | Codigo, dados tecnicos |

### Escala Tipografica
| Nome | Tamanho | Line Height | Uso |
|------|---------|-------------|-----|
| `xs` | 12px / 0.75rem | 16px | Badges, helpers, footnotes |
| `sm` | 14px / 0.875rem | 20px | Labels, texto secundario, tabelas |
| `base` | 16px / 1rem | 24px | Texto principal, paragrafos |
| `lg` | 18px / 1.125rem | 28px | Subtitulos de secao |
| `xl` | 20px / 1.25rem | 28px | Titulos de card |
| `2xl` | 24px / 1.5rem | 32px | Titulos de pagina |
| `3xl` | 30px / 1.875rem | 36px | Titulos de secao principal |
| `4xl` | 36px / 2.25rem | 40px | Hero, numeros grandes (dashboard) |

### Pesos
| Nome | Valor | Uso |
|------|-------|-----|
| `regular` | 400 | Texto corrido |
| `medium` | 500 | Labels, menu items |
| `semibold` | 600 | Titulos de card, botoes |
| `bold` | 700 | Titulos de pagina, headers de tabela |

---

## 4. ESPACAMENTO

Escala baseada em 4px:

| Token | Valor | Uso |
|-------|-------|-----|
| `0` | 0px | Reset |
| `0.5` | 2px | Gaps minimos |
| `1` | 4px | Padding inline minimo |
| `1.5` | 6px | Padding de badges |
| `2` | 8px | Gap entre elementos inline |
| `3` | 12px | Padding de inputs |
| `4` | 16px | Padding de cards, gap padrao |
| `5` | 20px | Padding de sections |
| `6` | 24px | Gap entre cards |
| `8` | 32px | Padding de pagina (mobile) |
| `10` | 40px | Espacamento entre secoes |
| `12` | 48px | Padding de pagina (desktop) |
| `16` | 64px | Espacamentos grandes |
| `20` | 80px | Espacamento de hero |
| `24` | 96px | Espacamento maximo |

### Padroes de Padding
- **Page:** `px-4 md:px-6 lg:px-8` (16px → 24px → 32px)
- **Card:** `p-4 md:p-6` (16px → 24px)
- **Section dentro de card:** `p-4` (16px)
- **Input:** `px-3 py-2` (12px x 8px)
- **Button:** `px-4 py-2` (16px x 8px)
- **Badge:** `px-2.5 py-0.5` (10px x 2px)

---

## 5. BORDAS E SOMBRAS

### Border Radius
| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 4px | Badges, tags |
| `md` | 8px | Inputs, selects, buttons |
| `lg` | 12px | Cards, dialogs |
| `xl` | 16px | Modais, sheets |
| `full` | 9999px | Avatares, pills |

### Border Width
- Default: `1px` (border)
- Thick: `2px` (focus ring, tab indicador)

### Sombras
| Token | Uso |
|-------|-----|
| `sm` | Cards sutis, dropdowns |
| `md` | Cards elevados, popovers |
| `lg` | Modais, sheets |
| `xl` | Elementos flutuantes, overlays |

---

## 6. COMPONENTES — Regras Visuais

### Botoes
- **Primary:** Background primary, texto branco, hover primary.700
- **Secondary:** Background secondary, texto secondary-foreground
- **Outline:** Border + texto, sem background, hover com background sutil
- **Ghost:** Sem border, sem background, hover com background sutil
- **Destructive:** Background error, texto branco
- **Tamanhos:** sm (h-8), default (h-10), lg (h-12), icon (h-10 w-10)
- **Loading:** Spinner a esquerda, texto "Salvando..." ou similar

### Inputs
- **Default:** Border gray.300, focus ring primary.200, border primary.500
- **Error:** Border error, focus ring error/20
- **Disabled:** Background gray.100, cursor not-allowed
- **Label:** Sempre acima do input, font-medium, text-sm
- **Error message:** Abaixo do input, text-sm, text-error
- **Required:** Asterisco vermelho ao lado do label

### Cards
- **Default:** Background card, border, rounded-lg, shadow-sm
- **Interactive:** Hover shadow-md, cursor pointer
- **Kanban card:** Border-l-4 com cor por prioridade (normal=gray, urgente=warning, total=error)

### Tabelas
- **Header:** Background muted, font-semibold, text-sm
- **Row:** Border-b, hover background accent
- **Selected:** Background primary/5
- **Paginacao:** Bottom right, "1-10 de 50 resultados"

### Status Badges
| Status | Cor | Uso |
|--------|-----|-----|
| Ativo / Operacional | `success` (green) | Cliente ativo, equip. operacional |
| Em producao / Pendente | `info` (blue) | Caso em andamento |
| Urgente / SLA risco | `warning` (amber) | Caso urgente, SLA < 24h |
| Atrasado / Vencido | `error` (red) | SLA vencido, cobranca vencida |
| Inativo / Cancelado | `gray` | Cliente inativo, caso cancelado |
| Pago / Entregue | `success` (green) | Pagamento feito, caso entregue |

---

## 7. LAYOUTS

### Dimensoes Fixas
| Elemento | Dimensao |
|----------|----------|
| Sidebar (expandida) | 256px (w-64) |
| Sidebar (colapsada) | 64px (w-16) |
| Topbar | 64px (h-16) |
| Content max-width | 1280px |

### Grid System
- Base: CSS Grid ou Flex
- Colunas: 12 (conceitual, via Tailwind grid)
- Gap padrao: `gap-4` (16px) ou `gap-6` (24px)

### Breakpoints
| Nome | Valor | Uso |
|------|-------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop small |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop large |

### Layout Padrao
```
┌─────────────────────────────────────────────────┐
│                   TOPBAR (64px)                  │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ SIDEBAR  │          CONTENT AREA                 │
│ (256px)  │       (max-w-screen-xl)               │
│          │         px-4 md:px-6                   │
│          │         py-6                           │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

---

## 8. ICONES

- **Biblioteca:** Lucide React
- **Tamanho padrao:** 20px em menus, 16px inline com texto, 24px em botoes
- **Cor:** Herda do texto (`currentColor`)
- **Stroke width:** 2 (default do Lucide)

---

## 9. ANIMACOES E TRANSICOES

| Token | Duracao | Uso |
|-------|---------|-----|
| `fast` | 150ms | Hover, focus, toggle |
| `normal` | 200ms | Dropdown, popover, expand |
| `slow` | 300ms | Modal, sheet, page transition |

- **Easing:** `ease-in-out` (padrao)
- **Hover:** Scale nao usado (exceto icones de acao)
- **Focus:** Ring de 2px com primary/50
- **Active:** Ligeira reducao de opacidade
- **Page transition:** Fade in 200ms
- **Skeleton loading:** Pulse animation nos placeholders

---

## 10. PADROES DE UX

### Formularios
- Label acima do input, sempre visivel
- Erro abaixo do input, visivel apenas quando invalido
- Asterisco vermelho em campos obrigatorios
- Submit button alinhado a direita
- Cancel button a esquerda do submit (outline style)
- Autofocus no primeiro campo ao abrir form

### Tabelas de Dados
- Paginacao: 10, 25, 50 items por pagina
- Busca: Input no topo com debounce 300ms
- Filtros: Popover ou inline, com "Limpar filtros"
- Ordenacao: Click no header, seta indicando direcao
- Selecao: Checkbox na primeira coluna
- Acoes: Dropdown "..." na ultima coluna

### Modais / Dialogs
- Max-width: sm (384px), md (448px), lg (512px), xl (576px)
- Backdrop: blur + overlay escuro
- Close: Botao X no canto + ESC key
- Footer: Cancel (outline) + Confirm (primary)

### Confirmacao Destrutiva
- Dialog vermelho com texto claro do que sera deletado
- Botao "Excluir" destructive
- Input de confirmacao para acoes criticas (ex: deletar tenant)

### Toasts / Notificacoes
- Posicao: bottom-right
- Auto-dismiss: 5 segundos
- Undo disponivel quando aplicavel
- Tipos: success (verde), error (vermelho), info (azul), warning (amarelo)

### Loading States
- **Listas/tabelas:** Skeleton (3-5 linhas)
- **Paginas:** Skeleton do layout completo
- **Acoes (botao):** Spinner + texto "Salvando..."
- **Upload:** Progress bar com porcentagem

### Empty States
- Ilustracao ou icone centralizado
- Titulo descritivo ("Nenhum caso encontrado")
- Descricao opcional ("Crie seu primeiro caso para comecar")
- Botao de acao principal (CTA)

---

## 11. ACESSIBILIDADE

- **Contraste:** Minimo AA (4.5:1 texto normal, 3:1 texto grande)
- **Focus:** Outline visivel em TODOS os elementos interativos
- **Keyboard:** Navegacao completa por tab, enter, esc, arrows
- **Aria:** Labels em icones sem texto, roles em elementos customizados
- **Skip link:** "Pular para conteudo" no topo (visivel ao focar)
- **Responsivo:** Touch targets minimo 44x44px em mobile
- **Reducao de movimento:** Respeitar `prefers-reduced-motion`

---

## 12. COMO ATUALIZAR

1. Edite este arquivo (`DESIGN_SYSTEM.md`) com a mudanca visual
2. Atualize `src/design-system/tokens.ts` com os novos valores
3. Os tokens alimentam automaticamente:
   - `tailwind.config.ts` (classes utilitarias)
   - `src/app/globals.css` (CSS variables do shadcn/ui)
4. Acesse `/design-system` no app para validar visualmente
5. Todos os componentes herdam automaticamente as mudancas

**Regra:** Nunca hardcode cores, tamanhos ou espacamentos. Sempre use tokens.
