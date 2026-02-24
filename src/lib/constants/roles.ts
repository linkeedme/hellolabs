/**
 * Hello Labs — Roles e Permissoes
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TECHNICIAN: 'TECHNICIAN',
  FINANCE: 'FINANCE',
  DRIVER: 'DRIVER',
  DENTIST: 'DENTIST',
} as const

export type RoleKey = keyof typeof ROLES

export const ROLE_LABELS: Record<RoleKey, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Tecnico',
  FINANCE: 'Financeiro',
  DRIVER: 'Entregador',
  DENTIST: 'Dentista',
}

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  ADMIN: 'Acesso total ao sistema. Gerencia tudo.',
  SUPERVISOR: 'Gerencia casos, equipe e producao. Sem acesso a configuracoes.',
  TECHNICIAN: 'Visualiza e atualiza etapas dos casos atribuidos.',
  FINANCE: 'Gerencia OS, cobrancas, pagamentos e relatorios financeiros.',
  DRIVER: 'Visualiza rotas de entrega e confirma entregas.',
  DENTIST: 'Acessa o portal para acompanhar casos e aprovar trabalhos.',
}

// Roles internos do laboratorio (excluindo dentista)
export const LAB_ROLES: RoleKey[] = ['ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'FINANCE', 'DRIVER']

// Roles que podem gerenciar casos
export const CASE_MANAGER_ROLES: RoleKey[] = ['ADMIN', 'SUPERVISOR']

// Roles que podem ver financeiro
export const FINANCE_ROLES: RoleKey[] = ['ADMIN', 'FINANCE']

// Hierarquia de permissoes (maior = mais permissoes)
export const ROLE_HIERARCHY: Record<RoleKey, number> = {
  ADMIN: 100,
  SUPERVISOR: 80,
  FINANCE: 60,
  TECHNICIAN: 40,
  DRIVER: 20,
  DENTIST: 10,
}

export function hasPermission(userRole: RoleKey, requiredRole: RoleKey): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
