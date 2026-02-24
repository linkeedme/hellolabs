/**
 * Hello Labs — Root Router tRPC
 * Agrega todos os sub-routers.
 */
import { createTRPCRouter } from './init'
import { authRouter } from './routers/auth.router'
import { tenantRouter } from './routers/tenant.router'
import { clientRouter } from './routers/client.router'
import { teamRouter } from './routers/team.router'
import { caseRouter } from './routers/case.router'
import { financialRouter } from './routers/financial.router'
import { notificationRouter } from './routers/notification.router'
import { inventoryRouter } from './routers/inventory.router'
import { equipmentRouter } from './routers/equipment.router'
import { calendarRouter } from './routers/calendar.router'
import { deliveryRouter } from './routers/delivery.router'
import { dashboardRouter } from './routers/dashboard.router'
import { portalRouter } from './routers/portal.router'
import { branchRouter } from './routers/branch.router'
import { priceTableRouter } from './routers/price-table.router'
import { auditRouter } from './routers/audit.router'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  tenant: tenantRouter,
  clients: clientRouter,
  team: teamRouter,
  case: caseRouter,
  financial: financialRouter,
  notification: notificationRouter,
  inventory: inventoryRouter,
  equipment: equipmentRouter,
  calendar: calendarRouter,
  delivery: deliveryRouter,
  dashboard: dashboardRouter,
  portal: portalRouter,
  branch: branchRouter,
  priceTable: priceTableRouter,
  audit: auditRouter,
})

export type AppRouter = typeof appRouter
