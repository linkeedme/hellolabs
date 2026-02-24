/**
 * Hello Labs — 20 Tipos de Protese com Metadados
 */

export interface ProsthesisType {
  id: string
  name: string
  category: 'FIXED' | 'REMOVABLE' | 'IMPLANT' | 'ORTHODONTIC' | 'OTHER'
  description: string
  defaultStages: string[]
  estimatedDays: number // SLA padrao em dias uteis
  icon: string // nome do icone Lucide
}

export const PROSTHESIS_CATEGORIES = {
  FIXED: 'Protese Fixa',
  REMOVABLE: 'Protese Removivel',
  IMPLANT: 'Sobre Implante',
  ORTHODONTIC: 'Ortodontia',
  OTHER: 'Outros',
} as const

export const PROSTHESIS_TYPES: ProsthesisType[] = [
  // ═══ PROTESE FIXA ═══
  {
    id: 'coroa-metalocermica',
    name: 'Coroa Metaloceramica',
    category: 'FIXED',
    description: 'Coroa com infraestrutura metalica e cobertura ceramica.',
    defaultStages: ['Modelo de gesso', 'Enceramento', 'Fundicao', 'Oxidacao', 'Aplicacao opaco', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
    estimatedDays: 7,
    icon: 'Crown',
  },
  {
    id: 'coroa-zirconia',
    name: 'Coroa em Zirconia',
    category: 'FIXED',
    description: 'Coroa monolitica ou com cobertura em zirconia.',
    defaultStages: ['Escaneamento', 'CAD design', 'Fresagem', 'Sinterizacao', 'Maquiagem/Cutback', 'Glazeamento', 'Acabamento'],
    estimatedDays: 5,
    icon: 'Crown',
  },
  {
    id: 'coroa-dissilicato',
    name: 'Coroa em Dissilicato de Litio',
    category: 'FIXED',
    description: 'Coroa em e.max ou similar (IPS e.max, Celtra).',
    defaultStages: ['Escaneamento', 'CAD design', 'Injecao/Fresagem', 'Cristalizacao', 'Maquiagem', 'Glazeamento', 'Acabamento'],
    estimatedDays: 5,
    icon: 'Crown',
  },
  {
    id: 'faceta',
    name: 'Faceta/Laminado',
    category: 'FIXED',
    description: 'Laminados ceramicos (dissilicato ou feldspato).',
    defaultStages: ['Modelo de gesso', 'Enceramento diagnostico', 'Escaneamento', 'CAD design', 'Injecao/Fresagem', 'Ajuste', 'Glazeamento', 'Acabamento'],
    estimatedDays: 7,
    icon: 'Layers',
  },
  {
    id: 'inlay-onlay',
    name: 'Inlay/Onlay',
    category: 'FIXED',
    description: 'Restauracoes indiretas parciais.',
    defaultStages: ['Modelo de gesso', 'Escaneamento', 'CAD design', 'Fresagem/Injecao', 'Ajuste', 'Glazeamento', 'Acabamento'],
    estimatedDays: 5,
    icon: 'Box',
  },
  {
    id: 'ponte-fixa',
    name: 'Ponte Fixa',
    category: 'FIXED',
    description: 'Protese fixa de multiplos elementos.',
    defaultStages: ['Modelo de gesso', 'Enceramento', 'Fundicao/Fresagem', 'Prova de metal/zirconia', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
    estimatedDays: 10,
    icon: 'Link',
  },
  {
    id: 'nucleo-metalico',
    name: 'Nucleo Metalico Fundido',
    category: 'FIXED',
    description: 'Retentores intra-radiculares fundidos.',
    defaultStages: ['Modelo de gesso', 'Enceramento', 'Inclusao', 'Fundicao', 'Desinclusao', 'Acabamento'],
    estimatedDays: 3,
    icon: 'Anchor',
  },

  // ═══ PROTESE REMOVIVEL ═══
  {
    id: 'ppr',
    name: 'Protese Parcial Removivel (PPR)',
    category: 'REMOVABLE',
    description: 'PPR com estrutura metalica (Roach, etc).',
    defaultStages: ['Modelo de gesso', 'Delineamento', 'Duplicacao', 'Enceramento', 'Inclusao', 'Fundicao', 'Desinclusao', 'Prova estrutura', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
    estimatedDays: 12,
    icon: 'FlipHorizontal',
  },
  {
    id: 'protese-total',
    name: 'Protese Total',
    category: 'REMOVABLE',
    description: 'Protese total superior ou inferior.',
    defaultStages: ['Modelo de gesso', 'Base de prova', 'Plano de cera', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
    estimatedDays: 10,
    icon: 'Smile',
  },
  {
    id: 'protese-flexivel',
    name: 'Protese Flexivel',
    category: 'REMOVABLE',
    description: 'PPR em nylon flexivel (Flexite, Deflex).',
    defaultStages: ['Modelo de gesso', 'Montagem dentes', 'Injecao', 'Acabamento/Polimento'],
    estimatedDays: 5,
    icon: 'Wind',
  },
  {
    id: 'provisorio',
    name: 'Provisorio',
    category: 'REMOVABLE',
    description: 'Provisorio em resina acrilica ou bisacril.',
    defaultStages: ['Modelo de gesso', 'Enceramento', 'Acrilizacao', 'Acabamento'],
    estimatedDays: 2,
    icon: 'Clock',
  },

  // ═══ SOBRE IMPLANTE ═══
  {
    id: 'protocolo',
    name: 'Protocolo (Barra Implante)',
    category: 'IMPLANT',
    description: 'Protese tipo protocolo sobre implantes (All-on-4, All-on-6).',
    defaultStages: ['Modelo de gesso', 'Escaneamento', 'CAD barra', 'Fresagem barra', 'Prova barra', 'Montagem dentes', 'Prova funcional', 'Acrilizacao', 'Acabamento/Polimento'],
    estimatedDays: 15,
    icon: 'Gauge',
  },
  {
    id: 'coroa-implante',
    name: 'Coroa sobre Implante',
    category: 'IMPLANT',
    description: 'Coroa unitaria sobre implante (cimentada ou parafusada).',
    defaultStages: ['Modelo de gesso', 'Escaneamento', 'CAD design', 'Fresagem', 'Aplicacao ceramica', 'Glazeamento', 'Acabamento'],
    estimatedDays: 7,
    icon: 'CircleDot',
  },
  {
    id: 'overdenture',
    name: 'Overdenture',
    category: 'IMPLANT',
    description: 'Protese removivel sobre implantes com attachment.',
    defaultStages: ['Modelo de gesso', 'Base de prova', 'Montagem dentes', 'Prova funcional', 'Captura attachments', 'Acrilizacao', 'Acabamento/Polimento'],
    estimatedDays: 10,
    icon: 'Magnet',
  },
  {
    id: 'pilar-personalizado',
    name: 'Pilar Personalizado (UCLA)',
    category: 'IMPLANT',
    description: 'Pilar em titano ou zirconia fresado.',
    defaultStages: ['Escaneamento', 'CAD design', 'Fresagem', 'Acabamento'],
    estimatedDays: 3,
    icon: 'Cylinder',
  },

  // ═══ ORTODONTIA ═══
  {
    id: 'alinhador',
    name: 'Alinhador Transparente',
    category: 'ORTHODONTIC',
    description: 'Alinhadores termoformados (clear aligners).',
    defaultStages: ['Escaneamento', 'Planejamento digital', 'Impressao 3D modelos', 'Termoformacao', 'Recorte', 'Polimento', 'Kit montagem'],
    estimatedDays: 5,
    icon: 'AlignCenter',
  },
  {
    id: 'contencao',
    name: 'Contencao',
    category: 'ORTHODONTIC',
    description: 'Contencao fixa ou removivel.',
    defaultStages: ['Modelo de gesso', 'Dobra do fio/Acrilizacao', 'Acabamento'],
    estimatedDays: 3,
    icon: 'Lock',
  },
  {
    id: 'placa-miorrelaxante',
    name: 'Placa Miorrelaxante',
    category: 'ORTHODONTIC',
    description: 'Placa de mordida em acrilico.',
    defaultStages: ['Modelo de gesso', 'Montagem ASA', 'Acrilizacao', 'Ajuste oclusal', 'Polimento'],
    estimatedDays: 5,
    icon: 'Shield',
  },

  // ═══ OUTROS ═══
  {
    id: 'modelo-estudo',
    name: 'Modelo de Estudo',
    category: 'OTHER',
    description: 'Modelo em gesso ou impresso 3D para planejamento.',
    defaultStages: ['Vazamento/Impressao', 'Recorte/Base', 'Acabamento'],
    estimatedDays: 2,
    icon: 'Cuboid',
  },
  {
    id: 'guia-cirurgico',
    name: 'Guia Cirurgico',
    category: 'OTHER',
    description: 'Guia para colocacao de implantes.',
    defaultStages: ['Escaneamento', 'Planejamento digital', 'CAD design', 'Impressao 3D', 'Acabamento'],
    estimatedDays: 5,
    icon: 'Crosshair',
  },
]

export function getProsthesisTypeById(id: string): ProsthesisType | undefined {
  return PROSTHESIS_TYPES.find((t) => t.id === id)
}

export function getProsthesisTypesByCategory(category: ProsthesisType['category']): ProsthesisType[] {
  return PROSTHESIS_TYPES.filter((t) => t.category === category)
}
