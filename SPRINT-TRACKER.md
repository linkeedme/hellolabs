# Hello Doctor LAB — Sprint Tracker

> Acompanhamento de progresso dos sprints de desenvolvimento.
> Atualizado a cada sprint concluido.

---

## Legenda
- ✅ Concluido
- 🔄 Em andamento
- ⬜ Pendente

---

## Sprints Concluidos (Foundation)

| Sprint | Descricao | Status | Testes | Arquivos |
|--------|-----------|--------|--------|----------|
| 1 | Auth + Multi-tenant + RBAC + Clients + Templates | ✅ | 112 | ~16 |
| 2 | Cases + Kanban + STL Viewer | ✅ | 112 | 16 |
| 3 | Financial (SO, Invoice, Payment, Credit) + Notifications | ✅ | 180 | 18 |
| 4 | Inventory + Equipment + Calendar + Deliveries + Portal + Dashboard | ✅ | 336 | ~40 |
| 5 | Clients + Team + Settings + Branch + PriceTable + AuditLog | ✅ | 411 | ~27 |

**Total Foundation**: 5 sprints, 411 testes, 16 routers, 37 models, 27 pages

---

## Sprints Restantes (MVP Completo)

### Sprint 6 — STL Viewer + File Sharing (Dentista ↔ Lab)
**Status**: ⬜ Pendente | **Estimativa**: 3 dias | **Arquivos**: ~11

- [ ] Helper de signed URLs (Supabase Storage)
- [ ] Endpoint `case.getFileUrl` (signed URL por fileId)
- [ ] Endpoint `portal.uploadFile` (dentista sobe arquivos)
- [ ] Endpoint `portal.getFileUrl` (dentista acessa URLs)
- [ ] Componente upload no portal do dentista
- [ ] STL viewer no portal (reutiliza viewer existente)
- [ ] Melhorias no viewer: reset camera, fullscreen, info do modelo
- [ ] File gallery (preview imagens, viewer STL inline, download)
- [ ] Signed URLs integrados nas paginas de caso (app + portal)
- [ ] Notificacao ao lab quando dentista sobe arquivo
- [ ] Testes

---

### Sprint 7 — PDF Generation + QR Codes
**Status**: ⬜ Pendente | **Estimativa**: 3 dias | **Arquivos**: ~14

- [ ] Estilos e header compartilhado para PDFs
- [ ] PDF: Ordem de Servico (SO)
- [ ] PDF: Fatura/Cobranca (Invoice)
- [ ] PDF: Recibo de Pagamento
- [ ] PDF: Comprovante de Entrega
- [ ] PDF: Etiqueta de Caso com QR Code
- [ ] Helper de geracao QR code
- [ ] API route `/api/pdf/[type]`
- [ ] Botoes de download PDF nas telas existentes
- [ ] Testes

---

### Sprint 8 — Email Integration (Resend)
**Status**: ⬜ Pendente | **Estimativa**: 2 dias | **Arquivos**: ~14

- [ ] Cliente Resend singleton
- [ ] Helper generico `sendEmail()`
- [ ] Template: Boas-vindas
- [ ] Template: Cobranca enviada
- [ ] Template: Lembrete de pagamento
- [ ] Template: Caso avancou de etapa
- [ ] Template: Caso entregue
- [ ] Template: Convite para dentista
- [ ] Template: Novo arquivo recebido (STL/foto)
- [ ] Integrar envio de email nos routers existentes
- [ ] Testes

---

### Sprint 9 — Prosthesis Types Update
**Status**: ⬜ Pendente | **Estimativa**: 2 dias | **Arquivos**: ~6

- [ ] Atualizar 20 tipos com etapas detalhadas do PRD
- [ ] Migration para atualizar templates no banco
- [ ] Icones por tipo no Kanban
- [ ] Barra SLA colorida (verde/amarelo/vermelho)
- [ ] Timeline de etapas mais visual no caso
- [ ] Componente de impressao de etiqueta

---

### Sprint 10 — Financial Reports + Exports
**Status**: ⬜ Pendente | **Estimativa**: 3 dias | **Arquivos**: ~12

- [ ] Sub-router de relatorios financeiros
- [ ] Extrato por cliente
- [ ] DRE simplificado
- [ ] Aging de recebiveis (7/15/30/60 dias)
- [ ] Ticket medio (por cliente, tipo, periodo)
- [ ] Export CSV
- [ ] Export PDF dos relatorios
- [ ] Fluxo de caixa: grafico 12 meses + previsao
- [ ] Testes

---

### Sprint 11 — Inadimplencia + Lembretes
**Status**: ⬜ Pendente | **Estimativa**: 2 dias | **Arquivos**: ~13

- [ ] Lista de inadimplencia com semaforo
- [ ] Dialog para enviar lembrete
- [ ] 3 templates de mensagem (cordial, firme, urgente)
- [ ] Historico de lembretes por fatura
- [ ] Alerta ao criar caso para cliente inadimplente
- [ ] Card inadimplencia no dashboard
- [ ] Testes

---

### Sprint 12 — Portal do Dentista + Dashboard
**Status**: ⬜ Pendente | **Estimativa**: 2 dias | **Arquivos**: ~10

- [ ] Portal: pagina de cobranças do dentista
- [ ] Portal: pagina de ordens de servico
- [ ] Dashboard: donut chart casos por status
- [ ] Dashboard: entregas do dia (concluidas/total)
- [ ] Dashboard: casos com SLA vencido
- [ ] Dashboard: faturamento previsto vs recebido

---

### Sprint 13 — Calendar Automations + Delivery Upgrades
**Status**: ⬜ Pendente | **Estimativa**: 2 dias | **Arquivos**: ~7

- [ ] Eventos automaticos: SLA do caso → CalendarEvent
- [ ] Eventos automaticos: manutencao equipamento → CalendarEvent
- [ ] Upload foto comprovante de entrega
- [ ] Recibo de entrega em PDF
- [ ] Icones por tipo de evento no calendario
- [ ] Filtro por tipo de evento

---

### Sprint 14 — PWA + Rebranding + Polish
**Status**: ⬜ Pendente | **Estimativa**: 3 dias | **Arquivos**: ~9

- [ ] PWA manifest.json
- [ ] Service worker basico
- [ ] Icones PWA (192x192, 512x512)
- [ ] Meta tags PWA no layout
- [ ] Rebranding: sidebar → "Hello Doctor LAB"
- [ ] Rebranding: login/signup
- [ ] Rebranding: emails e PDFs
- [ ] Polish: UI inconsistencies

---

## Resumo Geral

| Metrica | Valor |
|---------|-------|
| Sprints concluidos | 5/14 |
| Sprints restantes | 9 |
| Dias estimados | ~22 |
| Arquivos estimados | ~96 novos/modificados |
| Testes atuais | 411 |
| Routers atuais | 16 |
| Models atuais | 37 |
| Pages atuais | 27 |

---

## Changelog

| Data | Sprint | Notas |
|------|--------|-------|
| 2026-02-25 | — | Plano criado. Sprints 1–5 concluidos. |
