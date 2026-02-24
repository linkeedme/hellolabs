/**
 * Hello Labs — Dashboard Router
 * Real-time stats, monthly cases chart, recent cases, alerts
 */
import { createTRPCRouter } from '../init'
import { tenantProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'

export const dashboardRouter = createTRPCRouter({
  stats: tenantProcedure
    .query(async ({ ctx }) => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const [activeCases, activeClients, monthlyRevenue, alertCount] = await Promise.all([
        // Active cases (not DELIVERED or CANCELLED)
        rawDb.case.count({
          where: {
            tenantId: ctx.tenantId,
            status: { notIn: ['DELIVERED', 'CANCELLED'] },
          },
        }),
        // Active clients
        rawDb.client.count({
          where: { tenantId: ctx.tenantId, status: 'ACTIVE' },
        }),
        // Monthly revenue (sum of service orders PAID this month)
        rawDb.serviceOrder.aggregate({
          _sum: { total: true },
          where: {
            tenantId: ctx.tenantId,
            status: 'PAID',
            paidAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        // Alert count: low stock + overdue SLA
        rawDb.product.count({
          where: {
            tenantId: ctx.tenantId,
            active: true,
            qtyMin: { gt: 0 },
          },
        }).then(async (totalWithMin) => {
          // Filter in JS since Prisma can't compare two columns
          const products = await rawDb.product.findMany({
            where: {
              tenantId: ctx.tenantId,
              active: true,
              qtyMin: { gt: 0 },
            },
            select: { qtyCurrent: true, qtyMin: true },
          })
          const lowStock = products.filter(p => Number(p.qtyCurrent) < Number(p.qtyMin)).length

          const overdueCases = await rawDb.case.count({
            where: {
              tenantId: ctx.tenantId,
              status: { notIn: ['DELIVERED', 'CANCELLED'] },
              slaDate: { lt: now },
            },
          })

          return lowStock + overdueCases
        }),
      ])

      return {
        activeCases,
        activeClients,
        monthlyRevenue: Number(monthlyRevenue._sum.total ?? 0),
        alertCount,
      }
    }),

  monthlyCases: tenantProcedure
    .query(async ({ ctx }) => {
      const now = new Date()
      const months: { mes: string; pedidos: number; faturamento: number }[] = []

      const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0)

        const [cases, revenue] = await Promise.all([
          rawDb.case.count({
            where: {
              tenantId: ctx.tenantId,
              createdAt: { gte: d, lte: endD },
            },
          }),
          rawDb.serviceOrder.aggregate({
            _sum: { total: true },
            where: {
              tenantId: ctx.tenantId,
              status: 'PAID',
              paidAt: { gte: d, lte: endD },
            },
          }),
        ])

        months.push({
          mes: MONTH_NAMES[d.getMonth()],
          pedidos: cases,
          faturamento: Number(revenue._sum.total ?? 0),
        })
      }

      return months
    }),

  recentCases: tenantProcedure
    .query(async ({ ctx }) => {
      const cases = await rawDb.case.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          client: { select: { name: true } },
        },
      })

      return cases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        prosthesisType: c.prosthesisType,
        status: c.status,
        createdAt: c.createdAt,
        clientName: c.client.name,
      }))
    }),

  lowStockAlerts: tenantProcedure
    .query(async ({ ctx }) => {
      const products = await rawDb.product.findMany({
        where: {
          tenantId: ctx.tenantId,
          active: true,
          qtyMin: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          qtyCurrent: true,
          qtyMin: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      })

      return products
        .filter(p => Number(p.qtyCurrent) < Number(p.qtyMin))
        .slice(0, 5)
    }),

  slaAlerts: tenantProcedure
    .query(async ({ ctx }) => {
      const now = new Date()
      const threeDaysLater = new Date()
      threeDaysLater.setDate(threeDaysLater.getDate() + 3)

      const cases = await rawDb.case.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] },
          slaDate: { lte: threeDaysLater },
        },
        orderBy: { slaDate: 'asc' },
        take: 5,
        include: {
          client: { select: { name: true } },
        },
      })

      return cases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        slaDate: c.slaDate,
        status: c.status,
        clientName: c.client.name,
        overdue: c.slaDate ? c.slaDate < now : false,
      }))
    }),
})
