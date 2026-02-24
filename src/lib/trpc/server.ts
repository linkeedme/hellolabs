/**
 * Hello Labs — tRPC Server Caller
 * Para uso em Server Components e Server Actions.
 */
import 'server-only'
import { createCallerFactory } from '@/server/trpc/init'
import { createTRPCContext } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/router'
import { headers } from 'next/headers'
import { cache } from 'react'

const createCaller = createCallerFactory(appRouter)

export const api = cache(async () => {
  const heads = new Headers(await headers())
  heads.set('x-trpc-source', 'rsc')

  return createCaller(
    await createTRPCContext({ headers: heads }),
  )
})
