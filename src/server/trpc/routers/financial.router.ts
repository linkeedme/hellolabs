/**
 * Hello Labs — Financial Router
 * Service Orders, Invoices, Payments, Credits, Cash Flow & Reports
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { createTRPCRouter } from '../init'
import { tenantProcedure, financeProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { createNotification } from '../helpers/create-notification'
import {
  soCreateSchema,
  soUpdateSchema,
  soListSchema,
  soIssueSchema,
  soMarkPaidSchema,
  soCancelSchema,
  invoiceCreateSchema,
  invoiceListSchema,
  invoiceSendSchema,
  invoiceCancelSchema,
  invoiceSendReminderSchema,
  paymentCreateSchema,
  paymentListSchema,
  creditCreateSchema,
  creditListSchema,
  cashFlowSchema,
  revenueReportSchema,
} from '@/lib/validators/financial'

// Helper: create audit log entry
async function createAuditLog(
  tx: typeof rawDb,
  params: {
    tenantId: string
    userId: string
    entity: string
    entityId: string
    action: string
    payloadBefore?: unknown
    payloadAfter?: unknown
  },
) {
  await tx.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      payloadBefore: params.payloadBefore ? JSON.parse(JSON.stringify(params.payloadBefore)) : undefined,
      payloadAfter: params.payloadAfter ? JSON.parse(JSON.stringify(params.payloadAfter)) : undefined,
    },
  })
}

// ═══════════════════════════════════════════════
// SERVICE ORDER SUB-ROUTER
// ═══════════════════════════════════════════════

const soRouter = createTRPCRouter({
  list: tenantProcedure
    .input(soListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.status) where.status = input.status
      if (input.clientId) where.clientId = input.clientId

      if (input.search) {
        where.OR = [
          { orderNumber: isNaN(Number(input.search)) ? undefined : Number(input.search) },
          { case: { patientName: { contains: input.search, mode: 'insensitive' } } },
          { client: { name: { contains: input.search, mode: 'insensitive' } } },
        ].filter(Boolean)
      }

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        }
      }

      const [items, total] = await Promise.all([
        rawDb.serviceOrder.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            case: { select: { id: true, caseNumber: true, patientName: true } },
            client: { select: { id: true, name: true } },
            items: true,
            invoice: { select: { id: true, invoiceNumber: true, status: true } },
          },
        }),
        rawDb.serviceOrder.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const so = await rawDb.serviceOrder.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          case: { select: { id: true, caseNumber: true, patientName: true, prosthesisType: true } },
          client: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      })

      if (!so) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ordem de servico nao encontrada.' })
      }

      return so
    }),

  create: financeProcedure
    .input(soCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify case belongs to tenant
      const caseData = await rawDb.case.findFirst({
        where: { id: input.caseId, tenantId: ctx.tenantId },
        select: { id: true, clientId: true },
      })
      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const result = await rawDb.$transaction(async (tx) => {
        // Auto-increment order number
        const seq = await tx.tenantSequence.upsert({
          where: {
            tenantId_sequenceType: {
              tenantId: ctx.tenantId,
              sequenceType: 'order_number',
            },
          },
          update: { currentValue: { increment: 1 } },
          create: {
            tenantId: ctx.tenantId,
            sequenceType: 'order_number',
            currentValue: 1,
          },
        })

        // Calculate totals
        const subtotal = input.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        )
        const discount = input.discount ?? 0
        const total = Math.max(0, subtotal - discount)

        // Create service order with items
        const so = await tx.serviceOrder.create({
          data: {
            tenantId: ctx.tenantId,
            caseId: input.caseId,
            clientId: caseData.clientId,
            orderNumber: seq.currentValue,
            subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
            discount: new Prisma.Decimal(discount.toFixed(2)),
            total: new Prisma.Decimal(total.toFixed(2)),
            notes: input.notes ?? null,
            items: {
              create: input.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
                total: new Prisma.Decimal((item.quantity * item.unitPrice).toFixed(2)),
              })),
            },
          },
          include: { items: true },
        })

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'ServiceOrder',
          entityId: so.id,
          action: 'CREATED',
          payloadAfter: so,
        })

        return so
      })

      return result
    }),

  update: financeProcedure
    .input(soUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.serviceOrder.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { items: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS nao encontrada.' })
      }
      if (existing.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente OS em rascunho pode ser editada.' })
      }

      const result = await rawDb.$transaction(async (tx) => {
        // Delete existing items and recreate
        if (input.items) {
          await tx.serviceOrderItem.deleteMany({
            where: { serviceOrderId: input.id },
          })
        }

        const items = input.items ?? existing.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        }))

        const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        )
        const discount = input.discount ?? Number(existing.discount)
        const total = Math.max(0, subtotal - discount)

        const updated = await tx.serviceOrder.update({
          where: { id: input.id },
          data: {
            ...(input.caseId && { caseId: input.caseId }),
            subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
            discount: new Prisma.Decimal(discount.toFixed(2)),
            total: new Prisma.Decimal(total.toFixed(2)),
            notes: input.notes !== undefined ? input.notes ?? null : existing.notes,
            ...(input.items && {
              items: {
                create: input.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
                  total: new Prisma.Decimal((item.quantity * item.unitPrice).toFixed(2)),
                })),
              },
            }),
          },
          include: { items: true },
        })

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'ServiceOrder',
          entityId: input.id,
          action: 'UPDATED',
          payloadBefore: existing,
          payloadAfter: updated,
        })

        return updated
      })

      return result
    }),

  issue: financeProcedure
    .input(soIssueSchema)
    .mutation(async ({ ctx, input }) => {
      const so = await rawDb.serviceOrder.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!so) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS nao encontrada.' })
      }
      if (so.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente OS em rascunho pode ser emitida.' })
      }

      const updated = await rawDb.serviceOrder.update({
        where: { id: input.id },
        data: {
          status: 'ISSUED',
          issuedAt: new Date(),
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'ServiceOrder',
        entityId: input.id,
        action: 'ISSUED',
      })

      return updated
    }),

  cancel: financeProcedure
    .input(soCancelSchema)
    .mutation(async ({ ctx, input }) => {
      const so = await rawDb.serviceOrder.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!so) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS nao encontrada.' })
      }

      const updated = await rawDb.serviceOrder.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'ServiceOrder',
        entityId: input.id,
        action: 'CANCELLED',
        payloadBefore: { status: so.status },
      })

      return updated
    }),

  markPaid: financeProcedure
    .input(soMarkPaidSchema)
    .mutation(async ({ ctx, input }) => {
      const so = await rawDb.serviceOrder.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!so) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS nao encontrada.' })
      }
      if (so.status !== 'ISSUED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente OS emitida pode ser marcada como paga.' })
      }

      const updated = await rawDb.serviceOrder.update({
        where: { id: input.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'ServiceOrder',
        entityId: input.id,
        action: 'PAID',
      })

      return updated
    }),
})

// ═══════════════════════════════════════════════
// INVOICE SUB-ROUTER
// ═══════════════════════════════════════════════

const invoiceRouter = createTRPCRouter({
  list: tenantProcedure
    .input(invoiceListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.status) where.status = input.status
      if (input.clientId) where.clientId = input.clientId

      if (input.search) {
        where.OR = [
          { invoiceNumber: isNaN(Number(input.search)) ? undefined : Number(input.search) },
          { client: { name: { contains: input.search, mode: 'insensitive' } } },
        ].filter(Boolean)
      }

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        }
      }

      const [items, total] = await Promise.all([
        rawDb.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            client: { select: { id: true, name: true } },
            _count: { select: { serviceOrders: true, payments: true } },
          },
        }),
        rawDb.invoice.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await rawDb.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          serviceOrders: {
            include: {
              case: { select: { id: true, caseNumber: true, patientName: true } },
              items: true,
            },
          },
          payments: {
            orderBy: { paidAt: 'desc' },
          },
          reminders: {
            orderBy: { sentAt: 'desc' },
          },
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }

      return invoice
    }),

  create: financeProcedure
    .input(invoiceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify SOs belong to tenant and are ISSUED (not yet invoiced)
      const serviceOrders = await rawDb.serviceOrder.findMany({
        where: {
          id: { in: input.serviceOrderIds },
          tenantId: ctx.tenantId,
          clientId: input.clientId,
          status: 'ISSUED',
          invoiceId: null,
        },
      })

      if (serviceOrders.length !== input.serviceOrderIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Algumas OS nao foram encontradas, ja estao em outra cobranca, ou nao estao emitidas.',
        })
      }

      const result = await rawDb.$transaction(async (tx) => {
        // Auto-increment invoice number
        const seq = await tx.tenantSequence.upsert({
          where: {
            tenantId_sequenceType: {
              tenantId: ctx.tenantId,
              sequenceType: 'invoice_number',
            },
          },
          update: { currentValue: { increment: 1 } },
          create: {
            tenantId: ctx.tenantId,
            sequenceType: 'invoice_number',
            currentValue: 1,
          },
        })

        // Calculate total from SOs
        const total = serviceOrders.reduce(
          (sum, so) => sum + Number(so.total),
          0,
        )

        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            tenantId: ctx.tenantId,
            clientId: input.clientId,
            invoiceNumber: seq.currentValue,
            total: new Prisma.Decimal(total.toFixed(2)),
            dueDate: input.dueDate,
            notes: input.notes ?? null,
          },
        })

        // Link SOs to invoice
        await tx.serviceOrder.updateMany({
          where: { id: { in: input.serviceOrderIds } },
          data: { invoiceId: invoice.id },
        })

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'Invoice',
          entityId: invoice.id,
          action: 'CREATED',
          payloadAfter: { invoiceNumber: invoice.invoiceNumber, total, soCount: serviceOrders.length },
        })

        return invoice
      })

      return result
    }),

  send: financeProcedure
    .input(invoiceSendSchema)
    .mutation(async ({ ctx, input }) => {
      const invoice = await rawDb.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { client: { select: { id: true, name: true } } },
      })
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }
      if (invoice.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente cobranca em rascunho pode ser enviada.' })
      }

      const updated = await rawDb.invoice.update({
        where: { id: input.id },
        data: {
          status: 'SENT',
          issuedAt: new Date(),
        },
      })

      // Create notification for FINANCE/ADMIN users
      await createNotification(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        type: 'INVOICE_SENT',
        title: 'Cobranca enviada',
        message: `Cobranca #${invoice.invoiceNumber} enviada para ${invoice.client.name}.`,
        refId: invoice.id,
        refType: 'Invoice',
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Invoice',
        entityId: input.id,
        action: 'SENT',
      })

      return updated
    }),

  cancel: financeProcedure
    .input(invoiceCancelSchema)
    .mutation(async ({ ctx, input }) => {
      const invoice = await rawDb.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { serviceOrders: { select: { id: true } } },
      })
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }

      await rawDb.$transaction(async (tx) => {
        // Cancel invoice
        await tx.invoice.update({
          where: { id: input.id },
          data: { status: 'CANCELLED' },
        })

        // Unlink SOs from invoice
        if (invoice.serviceOrders.length > 0) {
          await tx.serviceOrder.updateMany({
            where: { invoiceId: input.id },
            data: { invoiceId: null },
          })
        }

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'Invoice',
          entityId: input.id,
          action: 'CANCELLED',
          payloadBefore: { status: invoice.status },
        })
      })

      return { success: true }
    }),

  sendReminder: financeProcedure
    .input(invoiceSendReminderSchema)
    .mutation(async ({ ctx, input }) => {
      const invoice = await rawDb.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { client: { select: { id: true, name: true } } },
      })
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }

      const reminder = await rawDb.paymentReminder.create({
        data: {
          invoiceId: input.id,
          channel: 'email',
          templateUsed: input.template,
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Invoice',
        entityId: input.id,
        action: 'REMINDER_SENT',
        payloadAfter: { template: input.template },
      })

      return reminder
    }),
})

// ═══════════════════════════════════════════════
// PAYMENT SUB-ROUTER
// ═══════════════════════════════════════════════

const paymentRouter = createTRPCRouter({
  register: financeProcedure
    .input(paymentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const invoice = await rawDb.invoice.findFirst({
        where: {
          id: input.invoiceId,
          tenantId: ctx.tenantId,
        },
      })
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }

      const remaining = Number(invoice.total) - Number(invoice.paidAmount)
      if (input.amount > remaining + 0.01) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Valor excede o saldo restante de R$ ${remaining.toFixed(2)}.`,
        })
      }

      const result = await rawDb.$transaction(async (tx) => {
        // Create payment
        const payment = await tx.payment.create({
          data: {
            invoiceId: input.invoiceId,
            amount: new Prisma.Decimal(input.amount.toFixed(2)),
            method: input.method,
            paidAt: input.paidAt ?? new Date(),
            notes: input.notes ?? null,
          },
        })

        // Update invoice paid amount
        const newPaidAmount = Number(invoice.paidAmount) + input.amount
        const isPaid = newPaidAmount >= Number(invoice.total) - 0.01

        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: {
            paidAmount: new Prisma.Decimal(newPaidAmount.toFixed(2)),
            status: isPaid ? 'PAID' : 'PARTIALLY_PAID',
            ...(isPaid && { paidAt: new Date() }),
          },
        })

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'Payment',
          entityId: payment.id,
          action: 'REGISTERED',
          payloadAfter: { amount: input.amount, method: input.method, invoiceId: input.invoiceId },
        })

        return payment
      })

      return result
    }),

  list: tenantProcedure
    .input(paymentListSchema)
    .query(async ({ ctx, input }) => {
      // Verify invoice belongs to tenant
      const invoice = await rawDb.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
        select: { id: true },
      })
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobranca nao encontrada.' })
      }

      return rawDb.payment.findMany({
        where: { invoiceId: input.invoiceId },
        orderBy: { paidAt: 'desc' },
      })
    }),
})

// ═══════════════════════════════════════════════
// CREDIT SUB-ROUTER
// ═══════════════════════════════════════════════

const creditRouter = createTRPCRouter({
  create: financeProcedure
    .input(creditCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await rawDb.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.tenantId },
        select: { id: true, name: true },
      })
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente nao encontrado.' })
      }

      const credit = await rawDb.clientCredit.create({
        data: {
          tenantId: ctx.tenantId,
          clientId: input.clientId,
          amount: new Prisma.Decimal(input.amount.toFixed(2)),
          reason: input.reason,
          createdBy: ctx.user.id,
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'ClientCredit',
        entityId: credit.id,
        action: 'CREATED',
        payloadAfter: { clientId: input.clientId, amount: input.amount, reason: input.reason },
      })

      return credit
    }),

  listByClient: tenantProcedure
    .input(creditListSchema)
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await rawDb.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.tenantId },
        select: { id: true },
      })
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente nao encontrado.' })
      }

      return rawDb.clientCredit.findMany({
        where: { clientId: input.clientId, tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
        },
      })
    }),
})

// ═══════════════════════════════════════════════
// CASH FLOW & REPORTS
// ═══════════════════════════════════════════════

export const financialRouter = createTRPCRouter({
  so: soRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  credit: creditRouter,

  // Cash flow: payments grouped by period
  cashFlow: financeProcedure
    .input(cashFlowSchema)
    .query(async ({ ctx, input }) => {
      const payments = await rawDb.payment.findMany({
        where: {
          invoice: { tenantId: ctx.tenantId },
          paidAt: {
            gte: input.dateFrom,
            lte: input.dateTo,
          },
        },
        orderBy: { paidAt: 'asc' },
        include: {
          invoice: {
            select: { clientId: true },
          },
        },
      })

      // Group by period
      const groups = new Map<string, { period: string; total: number; count: number }>()

      for (const payment of payments) {
        const date = new Date(payment.paidAt)
        let key: string

        if (input.groupBy === 'day') {
          key = date.toISOString().slice(0, 10)
        } else if (input.groupBy === 'week') {
          const dayOfWeek = date.getDay()
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - dayOfWeek)
          key = weekStart.toISOString().slice(0, 10)
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }

        const existing = groups.get(key) ?? { period: key, total: 0, count: 0 }
        existing.total += Number(payment.amount)
        existing.count += 1
        groups.set(key, existing)
      }

      // Calculate summary
      const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0)

      // Pending invoices (SENT, VIEWED, PARTIALLY_PAID)
      const pendingInvoices = await rawDb.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] },
        },
        select: { total: true, paidAmount: true, dueDate: true },
      })

      const totalPending = pendingInvoices.reduce(
        (sum, inv) => sum + Number(inv.total) - Number(inv.paidAmount),
        0,
      )

      const now = new Date()
      const totalOverdue = pendingInvoices
        .filter((inv) => new Date(inv.dueDate) < now)
        .reduce((sum, inv) => sum + Number(inv.total) - Number(inv.paidAmount), 0)

      return {
        data: Array.from(groups.values()),
        summary: {
          totalReceived,
          totalPending,
          totalOverdue,
        },
      }
    }),

  // Revenue by client (top 10)
  revenueByClient: financeProcedure
    .input(revenueReportSchema)
    .query(async ({ ctx, input }) => {
      const payments = await rawDb.payment.findMany({
        where: {
          invoice: { tenantId: ctx.tenantId },
          paidAt: {
            gte: input.dateFrom,
            lte: input.dateTo,
          },
        },
        include: {
          invoice: {
            select: {
              client: { select: { id: true, name: true } },
            },
          },
        },
      })

      const byClient = new Map<string, { clientId: string; clientName: string; total: number; count: number }>()

      for (const payment of payments) {
        const clientId = payment.invoice.client.id
        const existing = byClient.get(clientId) ?? {
          clientId,
          clientName: payment.invoice.client.name,
          total: 0,
          count: 0,
        }
        existing.total += Number(payment.amount)
        existing.count += 1
        byClient.set(clientId, existing)
      }

      const sorted = Array.from(byClient.values()).sort((a, b) => b.total - a.total)
      const totalRevenue = sorted.reduce((sum, c) => sum + c.total, 0)
      const avgTicket = sorted.length > 0 ? totalRevenue / sorted.reduce((sum, c) => sum + c.count, 0) : 0

      return {
        data: sorted.slice(0, 10),
        summary: {
          totalRevenue,
          avgTicket,
          clientCount: sorted.length,
        },
      }
    }),

  // Revenue by prosthesis type
  revenueByType: financeProcedure
    .input(revenueReportSchema)
    .query(async ({ ctx, input }) => {
      const serviceOrders = await rawDb.serviceOrder.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: 'PAID',
          paidAt: {
            gte: input.dateFrom,
            lte: input.dateTo,
          },
        },
        include: {
          case: { select: { prosthesisType: true } },
        },
      })

      const byType = new Map<string, { type: string; total: number; count: number }>()

      for (const so of serviceOrders) {
        const type = so.case.prosthesisType
        const existing = byType.get(type) ?? { type, total: 0, count: 0 }
        existing.total += Number(so.total)
        existing.count += 1
        byType.set(type, existing)
      }

      return Array.from(byType.values()).sort((a, b) => b.total - a.total)
    }),
})
