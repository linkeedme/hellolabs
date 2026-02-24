/**
 * Hello Labs — Inventory Router
 * Products, Lots, Stock Movements, Suppliers
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { createTRPCRouter } from '../init'
import { tenantProcedure, supervisorProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { createNotificationsForTenantUsers } from '../helpers/create-notification'
import {
  productCreateSchema,
  productUpdateSchema,
  productListSchema,
  lotCreateSchema,
  movementCreateSchema,
  movementListSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
  supplierListSchema,
  supplierProductLinkSchema,
} from '@/lib/validators/inventory'

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
// PRODUCT SUB-ROUTER
// ═══════════════════════════════════════════════

const productRouter = createTRPCRouter({
  list: tenantProcedure
    .input(productListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.active !== undefined) where.active = input.active
      if (input.category) where.category = input.category

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { brand: { contains: input.search, mode: 'insensitive' } },
          { sku: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [items, total] = await Promise.all([
        rawDb.product.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            _count: { select: { movements: true, lots: true } },
          },
        }),
        rawDb.product.count({ where }),
      ])

      // Filter belowMin in JS (Prisma can't compare two columns)
      let filtered = items
      if (input.belowMin) {
        filtered = items.filter((p) => Number(p.qtyCurrent) < Number(p.qtyMin))
      }

      return {
        items: filtered,
        total: input.belowMin ? filtered.length : total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil((input.belowMin ? filtered.length : total) / input.perPage),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const product = await rawDb.product.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          lots: {
            orderBy: { expiryDate: 'asc' },
          },
          suppliers: {
            include: {
              supplier: { select: { id: true, name: true } },
            },
          },
          _count: { select: { movements: true } },
        },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      return product
    }),

  create: supervisorProcedure
    .input(productCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const product = await rawDb.product.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          category: input.category,
          brand: input.brand ?? null,
          unit: input.unit,
          sku: input.sku ?? null,
          barcode: input.barcode ?? null,
          qtyMin: new Prisma.Decimal(input.qtyMin.toString()),
          qtyIdeal: new Prisma.Decimal(input.qtyIdeal.toString()),
          hasExpiry: input.hasExpiry,
          notes: input.notes ?? null,
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Product',
        entityId: product.id,
        action: 'CREATED',
        payloadAfter: product,
      })

      return product
    }),

  update: supervisorProcedure
    .input(productUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.product.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      const { id, ...data } = input
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.category !== undefined) updateData.category = data.category
      if (data.brand !== undefined) updateData.brand = data.brand ?? null
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.sku !== undefined) updateData.sku = data.sku ?? null
      if (data.barcode !== undefined) updateData.barcode = data.barcode ?? null
      if (data.qtyMin !== undefined) updateData.qtyMin = new Prisma.Decimal(data.qtyMin.toString())
      if (data.qtyIdeal !== undefined) updateData.qtyIdeal = new Prisma.Decimal(data.qtyIdeal.toString())
      if (data.hasExpiry !== undefined) updateData.hasExpiry = data.hasExpiry
      if (data.notes !== undefined) updateData.notes = data.notes ?? null

      const updated = await rawDb.product.update({
        where: { id },
        data: updateData,
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Product',
        entityId: id,
        action: 'UPDATED',
        payloadBefore: existing,
        payloadAfter: updated,
      })

      return updated
    }),

  archive: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.product.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      const updated = await rawDb.product.update({
        where: { id: input.id },
        data: { active: false },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Product',
        entityId: input.id,
        action: 'ARCHIVED',
        payloadBefore: { active: true },
      })

      return updated
    }),
})

// ═══════════════════════════════════════════════
// LOT SUB-ROUTER
// ═══════════════════════════════════════════════

const lotRouter = createTRPCRouter({
  listByProduct: tenantProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify product belongs to tenant
      const product = await rawDb.product.findFirst({
        where: { id: input.productId, tenantId: ctx.tenantId },
        select: { id: true },
      })
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      return rawDb.productLot.findMany({
        where: { productId: input.productId },
        orderBy: { expiryDate: 'asc' },
      })
    }),

  create: supervisorProcedure
    .input(lotCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify product belongs to tenant
      const product = await rawDb.product.findFirst({
        where: { id: input.productId, tenantId: ctx.tenantId },
        select: { id: true },
      })
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      const lot = await rawDb.productLot.create({
        data: {
          productId: input.productId,
          lotNumber: input.lotNumber,
          expiryDate: input.expiryDate ?? null,
          qty: new Prisma.Decimal(input.qty.toString()),
        },
      })

      return lot
    }),
})

// ═══════════════════════════════════════════════
// MOVEMENT SUB-ROUTER
// ═══════════════════════════════════════════════

const movementRouter = createTRPCRouter({
  list: tenantProcedure
    .input(movementListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.productId) where.productId = input.productId
      if (input.type) where.type = input.type

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        }
      }

      const [items, total] = await Promise.all([
        rawDb.stockMovement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            product: { select: { id: true, name: true, unit: true } },
            lot: { select: { id: true, lotNumber: true } },
            supplier: { select: { id: true, name: true } },
            case: { select: { id: true, caseNumber: true, patientName: true } },
            creator: { select: { id: true, name: true } },
          },
        }),
        rawDb.stockMovement.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  create: supervisorProcedure
    .input(movementCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify product belongs to tenant
      const product = await rawDb.product.findFirst({
        where: { id: input.productId, tenantId: ctx.tenantId },
      })
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })
      }

      const currentQty = Number(product.qtyCurrent)
      const movementQty = input.qty

      // Validate sufficient stock for consumption/negative adjustments
      if (
        (input.type === 'CONSUMPTION' || input.type === 'ADJUSTMENT_NEGATIVE') &&
        movementQty > currentQty
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Estoque insuficiente. Disponivel: ${currentQty} ${product.unit}.`,
        })
      }

      const result = await rawDb.$transaction(async (tx) => {
        // Create movement record
        const movement = await tx.stockMovement.create({
          data: {
            tenantId: ctx.tenantId,
            productId: input.productId,
            lotId: input.lotId ?? null,
            type: input.type,
            qty: new Prisma.Decimal(movementQty.toString()),
            caseId: input.caseId ?? null,
            supplierId: input.supplierId ?? null,
            unitCost: input.unitCost != null ? new Prisma.Decimal(input.unitCost.toString()) : null,
            invoiceNumber: input.invoiceNumber ?? null,
            notes: input.notes ?? null,
            createdBy: ctx.user.id,
          },
        })

        // Calculate new quantity
        let newQty: number
        const updateData: Record<string, unknown> = {}

        switch (input.type) {
          case 'PURCHASE':
          case 'ADJUSTMENT_POSITIVE':
          case 'RETURN':
            newQty = currentQty + movementQty
            break
          case 'CONSUMPTION':
          case 'ADJUSTMENT_NEGATIVE':
          case 'TRANSFER':
            newQty = currentQty - movementQty
            break
          default:
            newQty = currentQty
        }

        updateData.qtyCurrent = new Prisma.Decimal(Math.max(0, newQty).toString())

        // Update cost average for purchases
        if (input.type === 'PURCHASE' && input.unitCost != null && input.unitCost > 0) {
          const oldAvg = Number(product.costAvg)
          if (currentQty === 0) {
            updateData.costAvg = new Prisma.Decimal(input.unitCost.toString())
          } else {
            const newAvg = ((oldAvg * currentQty) + (input.unitCost * movementQty)) / (currentQty + movementQty)
            updateData.costAvg = new Prisma.Decimal(newAvg.toFixed(2))
          }
        }

        await tx.product.update({
          where: { id: input.productId },
          data: updateData,
        })

        // Update lot quantity if specified
        if (input.lotId) {
          const lotQtyDelta = (input.type === 'PURCHASE' || input.type === 'ADJUSTMENT_POSITIVE' || input.type === 'RETURN')
            ? movementQty
            : -movementQty

          await tx.productLot.update({
            where: { id: input.lotId },
            data: {
              qty: { increment: new Prisma.Decimal(lotQtyDelta.toString()) },
            },
          })
        }

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'StockMovement',
          entityId: movement.id,
          action: 'CREATED',
          payloadAfter: {
            productId: input.productId,
            type: input.type,
            qty: movementQty,
            newQty,
          },
        })

        return { movement, newQty }
      })

      // Check if stock fell below minimum — notify team
      if (Number(result.newQty) < Number(product.qtyMin) && Number(product.qtyMin) > 0) {
        await createNotificationsForTenantUsers(rawDb, {
          tenantId: ctx.tenantId,
          excludeUserId: ctx.user.id,
          type: 'LOW_STOCK',
          title: 'Estoque baixo',
          message: `${product.name} esta com estoque abaixo do minimo (${result.newQty} ${product.unit}).`,
          refId: product.id,
          refType: 'Product',
        })
      }

      return result.movement
    }),
})

// ═══════════════════════════════════════════════
// SUPPLIER SUB-ROUTER
// ═══════════════════════════════════════════════

const supplierRouter = createTRPCRouter({
  list: tenantProcedure
    .input(supplierListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.active !== undefined) where.active = input.active

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { cnpj: { contains: input.search } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [items, total] = await Promise.all([
        rawDb.supplier.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            _count: { select: { products: true, movements: true } },
          },
        }),
        rawDb.supplier.count({ where }),
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
      const supplier = await rawDb.supplier.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          products: {
            include: {
              product: { select: { id: true, name: true, category: true } },
            },
          },
          _count: { select: { movements: true } },
        },
      })

      if (!supplier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fornecedor nao encontrado.' })
      }

      return supplier
    }),

  create: supervisorProcedure
    .input(supplierCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const supplier = await rawDb.supplier.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          cnpj: input.cnpj ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          contactName: input.contactName ?? null,
          website: input.website ?? null,
          leadDays: input.leadDays ?? null,
          paymentTerms: input.paymentTerms ?? null,
          rating: input.rating ?? null,
          notes: input.notes ?? null,
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Supplier',
        entityId: supplier.id,
        action: 'CREATED',
        payloadAfter: supplier,
      })

      return supplier
    }),

  update: supervisorProcedure
    .input(supplierUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.supplier.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fornecedor nao encontrado.' })
      }

      const { id, ...data } = input
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.cnpj !== undefined) updateData.cnpj = data.cnpj ?? null
      if (data.email !== undefined) updateData.email = data.email ?? null
      if (data.phone !== undefined) updateData.phone = data.phone ?? null
      if (data.contactName !== undefined) updateData.contactName = data.contactName ?? null
      if (data.website !== undefined) updateData.website = data.website ?? null
      if (data.leadDays !== undefined) updateData.leadDays = data.leadDays ?? null
      if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms ?? null
      if (data.rating !== undefined) updateData.rating = data.rating ?? null
      if (data.notes !== undefined) updateData.notes = data.notes ?? null

      const updated = await rawDb.supplier.update({
        where: { id },
        data: updateData,
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Supplier',
        entityId: id,
        action: 'UPDATED',
        payloadBefore: existing,
        payloadAfter: updated,
      })

      return updated
    }),

  archive: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.supplier.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fornecedor nao encontrado.' })
      }

      await rawDb.supplier.update({
        where: { id: input.id },
        data: { active: false },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Supplier',
        entityId: input.id,
        action: 'ARCHIVED',
      })

      return { success: true }
    }),

  linkProduct: supervisorProcedure
    .input(supplierProductLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify both belong to tenant
      const [supplier, product] = await Promise.all([
        rawDb.supplier.findFirst({ where: { id: input.supplierId, tenantId: ctx.tenantId }, select: { id: true } }),
        rawDb.product.findFirst({ where: { id: input.productId, tenantId: ctx.tenantId }, select: { id: true } }),
      ])
      if (!supplier) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fornecedor nao encontrado.' })
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto nao encontrado.' })

      // Upsert to avoid duplicate errors
      const link = await rawDb.supplierProduct.upsert({
        where: {
          supplierId_productId: {
            supplierId: input.supplierId,
            productId: input.productId,
          },
        },
        create: {
          supplierId: input.supplierId,
          productId: input.productId,
        },
        update: {},
      })

      return link
    }),

  unlinkProduct: supervisorProcedure
    .input(supplierProductLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify supplier belongs to tenant
      const supplier = await rawDb.supplier.findFirst({
        where: { id: input.supplierId, tenantId: ctx.tenantId },
        select: { id: true },
      })
      if (!supplier) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fornecedor nao encontrado.' })

      await rawDb.supplierProduct.deleteMany({
        where: {
          supplierId: input.supplierId,
          productId: input.productId,
        },
      })

      return { success: true }
    }),
})

// ═══════════════════════════════════════════════
// INVENTORY ROUTER (EXPORTED)
// ═══════════════════════════════════════════════

export const inventoryRouter = createTRPCRouter({
  product: productRouter,
  lot: lotRouter,
  movement: movementRouter,
  supplier: supplierRouter,

  // Alerts: products below minimum stock
  alerts: tenantProcedure.query(async ({ ctx }) => {
    const products = await rawDb.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        qtyCurrent: true,
        qtyMin: true,
      },
      orderBy: { name: 'asc' },
    })

    // Filter in JS since Prisma can't compare two columns
    return products.filter((p) => Number(p.qtyCurrent) < Number(p.qtyMin))
  }),
})
