# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hello Labs (`hellolabs.com.br`) — Multi-tenant SaaS for dental prosthetics lab management in Brazil. Portuguese-language UI (pt-BR).

## Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build (Turbopack)
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to database (no migration)
npm run db:migrate   # Create and apply migration
npm run db:seed      # Seed database (tsx prisma/seed.ts)
npm run db:studio    # Open Prisma Studio GUI
```

Run a single test file: `npx vitest run src/lib/validators/financial.test.ts`

## Stack

Next.js 16 + React 19 + TypeScript 5 + Prisma v7 + Supabase Auth + tRPC v11 + Zod v4 + Tailwind v4 + shadcn/ui + Recharts v3

## Architecture

### Prisma v7 (Critical)

Two Prisma clients in `src/server/db/client.ts`:
- **`db`** — Extended with tenant middleware (auto-filters by `tenantId` via AsyncLocalStorage). Has TypeScript issues with `Exact<>` types — **do NOT use in tRPC routers**.
- **`rawDb`** — Plain PrismaClient. **Use this in all tRPC routers and services.**

Prisma v7 requires `@prisma/adapter-pg` + `PrismaPg` adapter. Connection config is in `prisma.config.ts`, NOT in `schema.prisma`.

`$transaction` callback type is `Omit<PrismaClient, ...>` — cast with `tx as typeof rawDb` when passing to helpers like `createAuditLog()`.

System tables (no `tenant_id`): `Tenant`, `User`, `ProsthesisTemplate`, `ProsthesisTemplateStage`.

### tRPC

**Context** (`src/server/trpc/init.ts`): Extracts user from Supabase, loads tenant + role from `TenantUser`.

**Procedure hierarchy** (`src/server/trpc/procedures.ts`):
```
publicProcedure
└─ protectedProcedure (auth required)
   └─ tenantProcedure (auth + active tenant)
      ├─ adminProcedure (ADMIN)
      ├─ supervisorProcedure (ADMIN, SUPERVISOR)
      ├─ financeProcedure (ADMIN, FINANCE)
      ├─ driverProcedure (ADMIN, SUPERVISOR, DRIVER)
      └─ dentistProcedure (DENTIST)
```

**Root router** (`src/server/trpc/router.ts`): Key `clients` not `client` (reserved word in tRPC v11).

**Router pattern**: All routers use `rawDb`, validate inputs with Zod, throw `TRPCError`, use `TenantSequence.upsert` for auto-increment (case_number, order_number, invoice_number).

### Auth Flow

Supabase Auth (email+password) → `middleware.ts` protects routes → tRPC procedures enforce RBAC. Public routes: `/login`, `/signup`, `/forgot-password`, `/invite`. Admin routes: `/settings`, `/team`.

### Tenant Isolation

AsyncLocalStorage in `tenantContext` stores `tenantId`. The `db` client auto-filters queries. Routers use `rawDb` + explicit `tenantId: ctx.tenantId` in `where` clauses.

### Client vs Server Components

Most pages are Client Components (`'use client'`). Server data fetching uses `api()` (tRPC server caller from `src/lib/trpc/server.ts`). Event handlers cannot be passed from Server to Client Components — use `actionHref` pattern instead.

## Key Patterns

### Zod Validators

- Domain schemas in `src/lib/validators/[domain].ts`
- Reusable schemas in `src/lib/validators/common.ts` (pagination, CPF, CNPJ, phone, CEP)
- Use `z.nativeEnum(PrismaEnum)` for Prisma enums, NOT `z.enum([...])`
- Use `z.input<typeof schema>` for react-hook-form types (avoids resolver type mismatch)
- `z.coerce.date()` watch values need `instanceof Date` guard before calling `format()`

### Money Formatting

Prisma stores `Decimal(10,2)` in **reais** (not centavos):
- `formatMoney(value)` — for Prisma Decimal values (does NOT divide by 100)
- `formatCurrency(centavos)` — for values in centavos (divides by 100)

### Forms

React Hook Form + `zodResolver` + dialog-based (not separate pages). Dynamic arrays use `useFieldArray`.

### Notifications

Polling every 30s via `refetchInterval` (not Supabase Realtime). Helper `createNotification()` in `src/server/trpc/helpers/create-notification.ts` uses `Pick<PrismaClient, ...>` type to work inside `$transaction`.

### Testing

Vitest unit tests for validators and utils. Pattern: `src/lib/validators/[domain].test.ts`. 180 tests across 7 files.

### UI Components

shadcn/ui (`src/components/ui/`), Lucide React icons, Sonner toasts, Recharts for charts. Recharts v3 Tooltip `formatter` param can be `undefined` — use `Number(value)`.

## Configuration Gotchas

- `next.config.ts` needs both `turbopack: {}` AND `webpack` config (webpack handles `.glsl` for three.js)
- Tailwind v4 — CSS-first config, design tokens in `src/design-system/tokens.ts`
- superjson transformer in tRPC for Date/Decimal serialization
- React Query defaults: `staleTime: 30s`, `refetchOnWindowFocus: false`
