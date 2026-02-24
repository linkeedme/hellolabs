/**
 * Hello Labs — Portal do Dentista Router
 * Cases list, case detail, approve/reject, comments
 * All queries filtered by the dentist's linked Client.
 */
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { dentistProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  portalCaseListSchema,
  portalApproveSchema,
  portalCommentSchema,
} from '@/lib/validators/portal'
import { z } from 'zod'

/** Helper: get the Client linked to the current dentist user */
async function getDentistClient(tenantId: string, userId: string) {
  const client = await rawDb.client.findFirst({
    where: { tenantId, userId, status: 'ACTIVE' },
    select: { id: true, name: true },
  })

  if (!client) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Nenhum cadastro de cliente vinculado ao seu usuario.',
    })
  }

  return client
}

export const portalRouter = createTRPCRouter({
  // ── List dentist's cases ────────────────────────────────────────
  cases: dentistProcedure
    .input(portalCaseListSchema)
    .query(async ({ ctx, input }) => {
      const client = await getDentistClient(ctx.tenantId, ctx.user.id)

      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
        clientId: client.id,
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.search) {
        where.OR = [
          { patientName: { contains: input.search, mode: 'insensitive' } },
          { prosthesisType: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [cases, total] = await Promise.all([
        rawDb.case.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          select: {
            id: true,
            caseNumber: true,
            patientName: true,
            prosthesisType: true,
            status: true,
            slaDate: true,
            priority: true,
            createdAt: true,
          },
        }),
        rawDb.case.count({ where }),
      ])

      return {
        items: cases,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // ── Case detail with stages, comments, files ────────────────────
  caseDetail: dentistProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await getDentistClient(ctx.tenantId, ctx.user.id)

      const caseData = await rawDb.case.findFirst({
        where: {
          id: input.caseId,
          tenantId: ctx.tenantId,
          clientId: client.id,
        },
        include: {
          stages: {
            orderBy: { stageOrder: 'asc' },
            select: {
              id: true,
              stageName: true,
              stageOrder: true,
              status: true,
              startedAt: true,
              completedAt: true,
            },
          },
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          files: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileUrl: true,
              createdAt: true,
            },
          },
        },
      })

      if (!caseData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Caso nao encontrado.',
        })
      }

      return {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        patientName: caseData.patientName,
        patientDob: caseData.patientDob,
        prosthesisType: caseData.prosthesisType,
        subtype: caseData.subtype,
        modality: caseData.modality,
        teeth: caseData.teeth,
        shade: caseData.shade,
        status: caseData.status,
        slaDate: caseData.slaDate,
        priority: caseData.priority,
        notes: caseData.notes,
        receivedAt: caseData.receivedAt,
        deliveredAt: caseData.deliveredAt,
        createdAt: caseData.createdAt,
        stages: caseData.stages,
        comments: caseData.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          userName: c.user.name,
          userAvatar: c.user.avatarUrl,
        })),
        files: caseData.files,
      }
    }),

  // ── Approve or reject a case ────────────────────────────────────
  approve: dentistProcedure
    .input(portalApproveSchema)
    .mutation(async ({ ctx, input }) => {
      const client = await getDentistClient(ctx.tenantId, ctx.user.id)

      const caseData = await rawDb.case.findFirst({
        where: {
          id: input.caseId,
          tenantId: ctx.tenantId,
          clientId: client.id,
          status: 'WAITING_APPROVAL',
        },
      })

      if (!caseData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Caso nao encontrado ou nao esta aguardando aprovacao.',
        })
      }

      const newStatus = input.action === 'approve' ? 'APPROVED' : 'IN_PRODUCTION'

      await rawDb.$transaction(async (tx) => {
        await tx.case.update({
          where: { id: input.caseId },
          data: { status: newStatus },
        })

        // Add comment if notes provided
        if (input.notes) {
          await tx.caseComment.create({
            data: {
              caseId: input.caseId,
              userId: ctx.user.id,
              content: input.notes,
              isInternal: false,
            },
          })
        }

        // Create notification for the lab team
        await tx.notification.create({
          data: {
            tenantId: ctx.tenantId,
            userId: ctx.user.id,
            type: 'CASE_UPDATE',
            title: input.action === 'approve'
              ? `Caso #${caseData.caseNumber} aprovado`
              : `Caso #${caseData.caseNumber} rejeitado`,
            message: input.notes || (input.action === 'approve'
              ? 'O dentista aprovou o caso.'
              : 'O dentista rejeitou o caso. Verifique os comentarios.'),
            refId: caseData.id,
            refType: 'CASE',
          },
        })
      })

      return { success: true, newStatus }
    }),

  // ── Add comment to a case ───────────────────────────────────────
  addComment: dentistProcedure
    .input(portalCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const client = await getDentistClient(ctx.tenantId, ctx.user.id)

      // Verify case belongs to this dentist's client
      const caseData = await rawDb.case.findFirst({
        where: {
          id: input.caseId,
          tenantId: ctx.tenantId,
          clientId: client.id,
        },
        select: { id: true, caseNumber: true },
      })

      if (!caseData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Caso nao encontrado.',
        })
      }

      const comment = await rawDb.caseComment.create({
        data: {
          caseId: input.caseId,
          userId: ctx.user.id,
          content: input.content,
          isInternal: false,
        },
      })

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
      }
    }),
})
