import { describe, it, expect } from 'vitest'
import { generateSlug, generateUniqueSlug } from './slug'

describe('generateSlug', () => {
  it('converte para lowercase', () => {
    expect(generateSlug('HELLO LABS')).toBe('hello-labs')
  })

  it('remove acentos', () => {
    expect(generateSlug('Prótese Dentária')).toBe('protese-dentaria')
  })

  it('substitui espacos por hifens', () => {
    expect(generateSlug('nome do lab')).toBe('nome-do-lab')
  })

  it('remove caracteres especiais', () => {
    expect(generateSlug('lab@#$teste!')).toBe('labteste')
  })

  it('remove hifens duplicados', () => {
    expect(generateSlug('lab - - teste')).toBe('lab-teste')
  })

  it('remove hifens no inicio e fim', () => {
    expect(generateSlug(' -lab teste- ')).toBe('lab-teste')
  })

  it('limita a 50 caracteres', () => {
    const longName = 'a'.repeat(100)
    expect(generateSlug(longName).length).toBeLessThanOrEqual(50)
  })

  it('trata parenteses e barras', () => {
    expect(generateSlug('Prótese Parcial Removível (PPR)')).toBe('protese-parcial-removivel-ppr')
  })
})

describe('generateUniqueSlug', () => {
  it('contem o slug base', () => {
    const slug = generateUniqueSlug('Meu Lab')
    expect(slug).toMatch(/^meu-lab-[a-z0-9]{4}$/)
  })

  it('gera slugs diferentes a cada chamada', () => {
    const a = generateUniqueSlug('Lab')
    const b = generateUniqueSlug('Lab')
    expect(a).not.toBe(b)
  })
})
