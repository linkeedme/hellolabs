/**
 * Hello Labs — Formatacao (moeda, data, telefone, CPF/CNPJ)
 */

// Moeda brasileira
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100) // valores armazenados em centavos
}

// Valor monetario direto (Prisma Decimal — ja em reais, nao centavos)
export function formatMoney(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

// Moeda sem centavos (para exibicao simplificada)
export function formatCurrencyShort(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100)
}

// Data curta: 23/02/2026
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

// Data e hora: 23/02/2026 14:30
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Data relativa: "ha 2 horas", "ontem"
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `ha ${diffMin}min`
  if (diffHours < 24) return `ha ${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `ha ${diffDays} dias`
  return formatDate(d)
}

// Telefone: (11) 99999-9999
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

// CPF: 123.456.789-00
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// CNPJ: 12.345.678/0001-00
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  )
}

// CPF ou CNPJ (auto-detect)
export function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '')
  return digits.length <= 11 ? formatCPF(digits) : formatCNPJ(digits)
}

// CRO: CRO-SP 12345
export function formatCRO(cro: string, state: string): string {
  return `CRO-${state.toUpperCase()} ${cro}`
}

// Porcentagem
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Numero abreviado: 1.2K, 3.5M
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}
