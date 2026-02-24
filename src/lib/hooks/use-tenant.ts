'use client'

import { createContext, useContext } from 'react'

export interface TenantContextValue {
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantLogo: string | null
  role: string
  userId: string
  userName: string
  userEmail: string
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return ctx
}
