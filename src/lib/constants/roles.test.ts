import { describe, it, expect } from 'vitest'
import {
  ROLES,
  ROLE_LABELS,
  ROLE_HIERARCHY,
  LAB_ROLES,
  CASE_MANAGER_ROLES,
  FINANCE_ROLES,
  hasPermission,
} from './roles'

describe('ROLES', () => {
  it('tem 6 roles definidos', () => {
    expect(Object.keys(ROLES)).toHaveLength(6)
  })

  it('contem todos os roles esperados', () => {
    expect(ROLES.ADMIN).toBe('ADMIN')
    expect(ROLES.SUPERVISOR).toBe('SUPERVISOR')
    expect(ROLES.TECHNICIAN).toBe('TECHNICIAN')
    expect(ROLES.FINANCE).toBe('FINANCE')
    expect(ROLES.DRIVER).toBe('DRIVER')
    expect(ROLES.DENTIST).toBe('DENTIST')
  })
})

describe('ROLE_LABELS', () => {
  it('tem label para cada role', () => {
    for (const role of Object.keys(ROLES)) {
      expect(ROLE_LABELS[role as keyof typeof ROLES]).toBeDefined()
    }
  })

  it('labels estao em portugues', () => {
    expect(ROLE_LABELS.ADMIN).toBe('Administrador')
    expect(ROLE_LABELS.DENTIST).toBe('Dentista')
  })
})

describe('LAB_ROLES', () => {
  it('nao inclui DENTIST', () => {
    expect(LAB_ROLES).not.toContain('DENTIST')
  })

  it('inclui 5 roles internos', () => {
    expect(LAB_ROLES).toHaveLength(5)
  })
})

describe('CASE_MANAGER_ROLES', () => {
  it('inclui ADMIN e SUPERVISOR', () => {
    expect(CASE_MANAGER_ROLES).toContain('ADMIN')
    expect(CASE_MANAGER_ROLES).toContain('SUPERVISOR')
  })

  it('nao inclui TECHNICIAN', () => {
    expect(CASE_MANAGER_ROLES).not.toContain('TECHNICIAN')
  })
})

describe('FINANCE_ROLES', () => {
  it('inclui ADMIN e FINANCE', () => {
    expect(FINANCE_ROLES).toContain('ADMIN')
    expect(FINANCE_ROLES).toContain('FINANCE')
  })
})

describe('hasPermission', () => {
  it('ADMIN tem permissao sobre todos', () => {
    expect(hasPermission('ADMIN', 'ADMIN')).toBe(true)
    expect(hasPermission('ADMIN', 'SUPERVISOR')).toBe(true)
    expect(hasPermission('ADMIN', 'TECHNICIAN')).toBe(true)
    expect(hasPermission('ADMIN', 'DENTIST')).toBe(true)
  })

  it('SUPERVISOR tem permissao sobre abaixo na hierarquia', () => {
    expect(hasPermission('SUPERVISOR', 'TECHNICIAN')).toBe(true)
    expect(hasPermission('SUPERVISOR', 'DRIVER')).toBe(true)
  })

  it('SUPERVISOR nao tem permissao de ADMIN', () => {
    expect(hasPermission('SUPERVISOR', 'ADMIN')).toBe(false)
  })

  it('TECHNICIAN nao tem permissao de SUPERVISOR', () => {
    expect(hasPermission('TECHNICIAN', 'SUPERVISOR')).toBe(false)
  })

  it('DENTIST tem a menor permissao', () => {
    expect(hasPermission('DENTIST', 'DRIVER')).toBe(false)
    expect(hasPermission('DENTIST', 'DENTIST')).toBe(true)
  })

  it('hierarquia: ADMIN > SUPERVISOR > FINANCE > TECHNICIAN > DRIVER > DENTIST', () => {
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.SUPERVISOR)
    expect(ROLE_HIERARCHY.SUPERVISOR).toBeGreaterThan(ROLE_HIERARCHY.FINANCE)
    expect(ROLE_HIERARCHY.FINANCE).toBeGreaterThan(ROLE_HIERARCHY.TECHNICIAN)
    expect(ROLE_HIERARCHY.TECHNICIAN).toBeGreaterThan(ROLE_HIERARCHY.DRIVER)
    expect(ROLE_HIERARCHY.DRIVER).toBeGreaterThan(ROLE_HIERARCHY.DENTIST)
  })
})
