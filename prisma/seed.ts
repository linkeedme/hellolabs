/**
 * Hello Labs — Seed Data
 * 20 tipos de protese + etapas padrao de producao
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PROSTHESIS_TYPES = [
  {
    name: 'Coroa Metaloceramica',
    category: 'FIXED',
    defaultDays: 7,
    stages: ['Modelo de gesso', 'Enceramento', 'Fundicao', 'Oxidacao', 'Aplicacao opaco', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Coroa em Zirconia',
    category: 'FIXED',
    defaultDays: 5,
    stages: ['Escaneamento', 'CAD design', 'Fresagem', 'Sinterizacao', 'Maquiagem/Cutback', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Coroa em Dissilicato de Litio',
    category: 'FIXED',
    defaultDays: 5,
    stages: ['Escaneamento', 'CAD design', 'Injecao/Fresagem', 'Cristalizacao', 'Maquiagem', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Faceta/Laminado',
    category: 'FIXED',
    defaultDays: 7,
    stages: ['Modelo de gesso', 'Enceramento diagnostico', 'Escaneamento', 'CAD design', 'Injecao/Fresagem', 'Ajuste', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Inlay/Onlay',
    category: 'FIXED',
    defaultDays: 5,
    stages: ['Modelo de gesso', 'Escaneamento', 'CAD design', 'Fresagem/Injecao', 'Ajuste', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Ponte Fixa',
    category: 'FIXED',
    defaultDays: 10,
    stages: ['Modelo de gesso', 'Enceramento', 'Fundicao/Fresagem', 'Prova de metal/zirconia', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Nucleo Metalico Fundido',
    category: 'FIXED',
    defaultDays: 3,
    stages: ['Modelo de gesso', 'Enceramento', 'Inclusao', 'Fundicao', 'Desinclusao', 'Acabamento'],
  },
  {
    name: 'Protese Parcial Removivel (PPR)',
    category: 'REMOVABLE',
    defaultDays: 12,
    stages: ['Modelo de gesso', 'Delineamento', 'Duplicacao', 'Enceramento', 'Inclusao', 'Fundicao', 'Desinclusao', 'Prova estrutura', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
  },
  {
    name: 'Protese Total',
    category: 'REMOVABLE',
    defaultDays: 10,
    stages: ['Modelo de gesso', 'Base de prova', 'Plano de cera', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
  },
  {
    name: 'Protese Flexivel',
    category: 'REMOVABLE',
    defaultDays: 5,
    stages: ['Modelo de gesso', 'Montagem dentes', 'Injecao', 'Acabamento/Polimento'],
  },
  {
    name: 'Provisorio',
    category: 'REMOVABLE',
    defaultDays: 2,
    stages: ['Modelo de gesso', 'Enceramento', 'Acrilizacao', 'Acabamento'],
  },
  {
    name: 'Protocolo (Barra Implante)',
    category: 'IMPLANT',
    defaultDays: 15,
    stages: ['Modelo de gesso', 'Escaneamento', 'CAD barra', 'Fresagem barra', 'Prova barra', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
  },
  {
    name: 'Coroa sobre Implante',
    category: 'IMPLANT',
    defaultDays: 7,
    stages: ['Modelo de gesso', 'Escaneamento', 'CAD design', 'Fresagem', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
  },
  {
    name: 'Overdenture',
    category: 'IMPLANT',
    defaultDays: 10,
    stages: ['Modelo de gesso', 'Base de prova', 'Montagem dentes', 'Prova funcional', 'Captura attachments', 'Acrilizacao', 'Acabamento/Polimento'],
  },
  {
    name: 'Pilar Personalizado (UCLA)',
    category: 'IMPLANT',
    defaultDays: 3,
    stages: ['Escaneamento', 'CAD design', 'Fresagem', 'Acabamento'],
  },
  {
    name: 'Alinhador Transparente',
    category: 'ORTHODONTIC',
    defaultDays: 5,
    stages: ['Escaneamento', 'Planejamento digital', 'Impressao 3D modelos', 'Termoformacao', 'Recorte', 'Polimento', 'Kit montagem'],
  },
  {
    name: 'Contencao',
    category: 'ORTHODONTIC',
    defaultDays: 3,
    stages: ['Modelo de gesso', 'Dobra do fio/Acrilizacao', 'Acabamento'],
  },
  {
    name: 'Placa Miorrelaxante',
    category: 'ORTHODONTIC',
    defaultDays: 5,
    stages: ['Modelo de gesso', 'Montagem ASA', 'Acrilizacao', 'Ajuste oclusal', 'Polimento'],
  },
  {
    name: 'Modelo de Estudo',
    category: 'OTHER',
    defaultDays: 2,
    stages: ['Vazamento/Impressao', 'Recorte/Base', 'Acabamento'],
  },
  {
    name: 'Guia Cirurgico',
    category: 'OTHER',
    defaultDays: 5,
    stages: ['Escaneamento', 'Planejamento digital', 'CAD design', 'Impressao 3D', 'Acabamento'],
  },
]

async function main() {
  console.log('Seeding prosthesis templates...')

  for (const type of PROSTHESIS_TYPES) {
    const slug = type.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)

    const template = await prisma.prosthesisTemplate.create({
      data: {
        name: type.name,
        slug,
        category: type.category,
        active: true,
      },
    })

    // Create stages for this template
    for (let i = 0; i < type.stages.length; i++) {
      await prisma.prosthesisTemplateStage.create({
        data: {
          templateId: template.id,
          name: type.stages[i],
          order: i + 1,
        },
      })
    }

    console.log(`  ✓ ${type.name} (${type.stages.length} etapas)`)
  }

  console.log(`\nSeed completo! ${PROSTHESIS_TYPES.length} tipos de protese criados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
