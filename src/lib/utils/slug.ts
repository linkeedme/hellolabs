/**
 * Hello Labs — Geracao de slug
 */

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-') // espacos -> hifens
    .replace(/-+/g, '-') // hifens duplicados
    .replace(/^-|-$/g, '') // hifens no inicio/fim
    .slice(0, 50)
}

export function generateUniqueSlug(name: string): string {
  const base = generateSlug(name)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}
