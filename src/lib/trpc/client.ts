/**
 * Hello Labs — tRPC React Client
 * Para uso em Client Components.
 */
'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/trpc/router'

export const trpc = createTRPCReact<AppRouter>()
