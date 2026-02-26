/**
 * Hello Labs — Case Router
 * Gestao de casos de protese (CRUD, Kanban, etapas, comentarios, arquivos)
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { CaseStatus, StageStatus } from '@prisma/client'
import { createTRPCRouter } from '../init'
import { tenantProcedure, supervisorProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  caseCreateSchema,
  caseUpdateSchema,
  caseListSchema,
  caseKanbanSchema,
  moveStageSchema,
  updateStatusSchema,
  commentSchema,
  fileMetadataSchema,
  deliverSchema,
  cancelSchema,
} from '@/lib/validators/case'
import { getProsthesisTypeById } from '@/lib/constants/prosthesis-types'
import { getSignedUrl, getSignedUrls } from '@/lib/storage/signed-url'

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

// Helper: add business days (skip weekends)
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

export const caseRouter = createTRPCRouter({
  // ═══ LIST — Listagem paginada com filtros ═══
  list: tenantProcedure
    .input(caseListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.status) where.status = input.status
      if (input.clientId) where.clientId = input.clientId
      if (input.priority) where.priority = input.priority
      if (input.prosthesisType) where.prosthesisType = input.prosthesisType
      if (input.assignedTo) where.assignedTo = input.assignedTo

      if (input.search) {
        where.OR = [
          { patientName: { contains: input.search, mode: 'insensitive' } },
          { caseNumber: isNaN(Number(input.search)) ? undefined : Number(input.search) },
        ].filter(Boolean)
      }

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        }
      }

      const [items, total] = await Promise.all([
        rawDb.case.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            client: { select: { id: true, name: true } },
            stages: { select: { id: true, status: true }, orderBy: { stageOrder: 'asc' } },
            _count: { select: { files: true, comments: true } },
          },
        }),
        rawDb.case.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // ═══ KANBAN — Todos os casos ativos (sem paginacao) ═══
  kanban: tenantProcedure
    .input(caseKanbanSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
        status: {
          in: [
            CaseStatus.RECEIVED,
            CaseStatus.IN_PRODUCTION,
            CaseStatus.WAITING_APPROVAL,
            CaseStatus.APPROVED,
            CaseStatus.READY_FOR_DELIVERY,
          ],
        },
      }

      if (input.clientId) where.clientId = input.clientId
      if (input.priority) where.priority = input.priority
      if (input.prosthesisType) where.prosthesisType = input.prosthesisType
      if (input.assignedTo) where.assignedTo = input.assignedTo

      if (input.search) {
        where.OR = [
          { patientName: { contains: input.search, mode: 'insensitive' } },
          { caseNumber: isNaN(Number(input.search)) ? undefined : Number(input.search) },
        ].filter(Boolean)
      }

      return rawDb.case.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { slaDate: 'asc' }, { createdAt: 'asc' }],
        include: {
          client: { select: { id: true, name: true } },
          stages: {
            select: { id: true, stageName: true, status: true, stageOrder: true },
            orderBy: { stageOrder: 'asc' },
          },
        },
      })
    }),

  // ═══ GET BY ID — Caso completo ═══
  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caseData = await rawDb.case.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          stages: { orderBy: { stageOrder: 'asc' } },
          files: { orderBy: { createdAt: 'desc' } },
          comments: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      })

      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      return caseData
    }),

  // ═══ CREATE — Novo caso com etapas do template ═══
  create: supervisorProcedure
    .input(caseCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const prosthesisType = getProsthesisTypeById(input.prosthesisType)
      if (!prosthesisType) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tipo de protese invalido.' })
      }

      // Verify client belongs to tenant
      const client = await rawDb.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.tenantId },
      })
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente nao encontrado.' })
      }

      // Auto-calculate SLA if not provided
      const slaDate = input.slaDate ?? addBusinessDays(new Date(), prosthesisType.estimatedDays)

      const result = await rawDb.$transaction(async (tx) => {
        // Atomic increment of case number
        const seq = await tx.tenantSequence.upsert({
          where: {
            tenantId_sequenceType: {
              tenantId: ctx.tenantId,
              sequenceType: 'case_number',
            },
          },
          update: { currentValue: { increment: 1 } },
          create: {
            tenantId: ctx.tenantId,
            sequenceType: 'case_number',
            currentValue: 1,
          },
        })

        // Create the case
        const newCase = await tx.case.create({
          data: {
            tenantId: ctx.tenantId,
            clientId: input.clientId,
            branchId: input.branchId ?? null,
            caseNumber: seq.currentValue,
            patientName: input.patientName,
            patientDob: input.patientDob ?? null,
            prosthesisType: input.prosthesisType,
            subtype: input.subtype ?? null,
            modality: input.modality,
            teeth: input.teeth,
            shade: input.shade ?? null,
            priority: input.priority,
            slaDate,
            assignedTo: input.assignedTo ?? null,
            osValue: input.osValue ?? null,
            materialCost: input.materialCost ?? null,
            notes: input.notes ?? null,
            status: CaseStatus.RECEIVED,
          },
        })

        // Create stages from prosthesis type template
        await tx.caseStage.createMany({
          data: prosthesisType.defaultStages.map((stageName, index) => ({
            caseId: newCase.id,
            stageName,
            stageOrder: index + 1,
            status: StageStatus.PENDING,
          })),
        })

        // Audit log
        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'Case',
          entityId: newCase.id,
          action: 'CREATED',
          payloadAfter: {
            caseNumber: newCase.caseNumber,
            patientName: newCase.patientName,
            prosthesisType: newCase.prosthesisType,
            clientId: newCase.clientId,
          },
        })

        return newCase
      })

      return result
    }),

  // ═══ UPDATE — Atualizar campos do caso ═══
  update: supervisorProcedure
    .input(caseUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await rawDb.case.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const updated = await rawDb.case.update({
        where: { id },
        data,
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Case',
        entityId: id,
        action: 'UPDATED',
        payloadBefore: existing,
        payloadAfter: updated,
      })

      return updated
    }),

  // ═══ UPDATE STATUS — Para drag do Kanban ═══
  updateStatus: supervisorProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.case.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const updated = await rawDb.case.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Case',
        entityId: input.id,
        action: 'STATUS_CHANGED',
        payloadBefore: { status: existing.status },
        payloadAfter: { status: input.status },
      })

      return updated
    }),

  // ═══ MOVE STAGE — Iniciar/Concluir/Pular etapa ═══
  moveStage: tenantProcedure
    .input(moveStageSchema)
    .mutation(async ({ ctx, input }) => {
      const caseData = await rawDb.case.findFirst({
        where: { id: input.caseId, tenantId: ctx.tenantId },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      })

      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const stage = caseData.stages.find((s) => s.id === input.stageId)
      if (!stage) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa nao encontrada.' })
      }

      const now = new Date()

      await rawDb.$transaction(async (tx) => {
        if (input.action === 'start') {
          await tx.caseStage.update({
            where: { id: stage.id },
            data: {
              status: StageStatus.IN_PROGRESS,
              startedAt: now,
              notes: input.notes ?? stage.notes,
            },
          })

          // If case is RECEIVED, move to IN_PRODUCTION
          if (caseData.status === CaseStatus.RECEIVED) {
            await tx.case.update({
              where: { id: caseData.id },
              data: { status: CaseStatus.IN_PRODUCTION },
            })
          }
        } else if (input.action === 'complete') {
          await tx.caseStage.update({
            where: { id: stage.id },
            data: {
              status: StageStatus.COMPLETED,
              completedAt: now,
              notes: input.notes ?? stage.notes,
            },
          })

          // Check if ALL stages are completed or skipped
          const allStagesDone = caseData.stages.every((s) =>
            s.id === stage.id
              ? true // this one just completed
              : s.status === StageStatus.COMPLETED || s.status === StageStatus.SKIPPED,
          )

          if (allStagesDone) {
            await tx.case.update({
              where: { id: caseData.id },
              data: { status: CaseStatus.READY_FOR_DELIVERY },
            })
          }
        } else if (input.action === 'skip') {
          await tx.caseStage.update({
            where: { id: stage.id },
            data: {
              status: StageStatus.SKIPPED,
              notes: input.notes ?? stage.notes,
            },
          })

          // Same check — all stages done?
          const allStagesDone = caseData.stages.every((s) =>
            s.id === stage.id
              ? true
              : s.status === StageStatus.COMPLETED || s.status === StageStatus.SKIPPED,
          )

          if (allStagesDone) {
            await tx.case.update({
              where: { id: caseData.id },
              data: { status: CaseStatus.READY_FOR_DELIVERY },
            })
          }
        }

        await createAuditLog(tx as typeof rawDb, {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          entity: 'CaseStage',
          entityId: stage.id,
          action: `STAGE_${input.action.toUpperCase()}`,
          payloadBefore: { status: stage.status },
          payloadAfter: { action: input.action, stageName: stage.stageName },
        })
      })

      return { success: true }
    }),

  // ═══ ADD COMMENT ═══
  addComment: tenantProcedure
    .input(commentSchema)
    .mutation(async ({ ctx, input }) => {
      const caseData = await rawDb.case.findFirst({
        where: { id: input.caseId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      return rawDb.caseComment.create({
        data: {
          caseId: input.caseId,
          userId: ctx.user.id,
          content: input.content,
          isInternal: input.isInternal,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
    }),

  // ═══ UPLOAD FILE — Salvar metadata do arquivo ═══
  uploadFile: tenantProcedure
    .input(fileMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      const caseData = await rawDb.case.findFirst({
        where: { id: input.caseId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      // Get next version number for this file type
      const lastFile = await rawDb.caseFile.findFirst({
        where: { caseId: input.caseId, fileType: input.fileType },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      return rawDb.caseFile.create({
        data: {
          caseId: input.caseId,
          uploadedBy: ctx.user.id,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileName: input.fileName,
          fileSize: input.fileSize ?? null,
          version: (lastFile?.version ?? 0) + 1,
        },
      })
    }),

  // ═══ DELIVER — Marcar como entregue ═══
  deliver: supervisorProcedure
    .input(deliverSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.case.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const now = new Date()

      const updated = await rawDb.case.update({
        where: { id: input.id },
        data: {
          status: CaseStatus.DELIVERED,
          deliveredAt: now,
          deliveryMethod: input.deliveryMethod,
        },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Case',
        entityId: input.id,
        action: 'DELIVERED',
        payloadBefore: { status: existing.status },
        payloadAfter: { status: 'DELIVERED', deliveryMethod: input.deliveryMethod, deliveredAt: now },
      })

      return updated
    }),

  // ═══ CANCEL — Cancelar caso ═══
  cancel: supervisorProcedure
    .input(cancelSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.case.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const updated = await rawDb.case.update({
        where: { id: input.id },
        data: { status: CaseStatus.CANCELLED },
      })

      await createAuditLog(rawDb, {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        entity: 'Case',
        entityId: input.id,
        action: 'CANCELLED',
        payloadBefore: { status: existing.status },
        payloadAfter: { status: 'CANCELLED', reason: input.reason },
      })

      return updated
    }),

  // ═══ GET FILE SIGNED URL ═══
  getFileUrl: tenantProcedure
    .input(z.object({ fileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const file = await rawDb.caseFile.findFirst({
        where: { id: input.fileId },
        include: { case: { select: { tenantId: true } } },
      })

      if (!file || file.case.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo nao encontrado.' })
      }

      const signedUrl = await getSignedUrl(file.fileUrl)
      return { signedUrl, fileName: file.fileName, fileType: file.fileType }
    }),

  // ═══ GET ALL FILE SIGNED URLS FOR A CASE ═══
  getFileUrls: tenantProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caseData = await rawDb.case.findFirst({
        where: { id: input.caseId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Caso nao encontrado.' })
      }

      const files = await rawDb.caseFile.findMany({
        where: { caseId: input.caseId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileUrl: true,
          fileSize: true,
          version: true,
          createdAt: true,
          uploader: { select: { id: true, name: true } },
        },
      })

      if (files.length === 0) return []

      const urlMap = await getSignedUrls(files.map((f) => f.fileUrl))

      return files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        version: f.version,
        createdAt: f.createdAt,
        uploadedBy: f.uploader?.name ?? 'Desconhecido',
        signedUrl: urlMap.get(f.fileUrl) ?? null,
      }))
    }),

  // ═══ GET AUDIT LOG ═══
  getAuditLog: tenantProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return rawDb.auditLog.findMany({
        where: {
          tenantId: ctx.tenantId,
          entity: { in: ['Case', 'CaseStage'] },
          entityId: input.caseId,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true } },
        },
      })
    }),
})
