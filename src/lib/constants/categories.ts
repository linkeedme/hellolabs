/**
 * Hello Labs — Categorias de Estoque e Equipamentos
 */

// ═══ CATEGORIAS DE ESTOQUE ═══

export const PRODUCT_CATEGORIES = [
  { id: 'ceramica', name: 'Ceramicas', icon: 'Palette' },
  { id: 'resina', name: 'Resinas Acrilicas', icon: 'Droplets' },
  { id: 'resina-3d', name: 'Resinas para Impressao 3D', icon: 'Printer' },
  { id: 'liga-metalica', name: 'Ligas Metalicas', icon: 'Gem' },
  { id: 'gesso', name: 'Gessos', icon: 'Mountain' },
  { id: 'revestimento', name: 'Revestimentos', icon: 'Shield' },
  { id: 'cera', name: 'Ceras', icon: 'Flame' },
  { id: 'abrasivo', name: 'Abrasivos e Polimento', icon: 'Disc' },
  { id: 'adesivo', name: 'Adesivos e Cimentos', icon: 'Sticky' },
  { id: 'dente-acrilico', name: 'Dentes Acrilicos', icon: 'Smile' },
  { id: 'disco-zirconia', name: 'Discos de Zirconia', icon: 'Circle' },
  { id: 'disco-pmma', name: 'Discos de PMMA', icon: 'Circle' },
  { id: 'disco-cera', name: 'Discos de Cera', icon: 'Circle' },
  { id: 'implante-componente', name: 'Componentes de Implante', icon: 'CircleDot' },
  { id: 'silicone', name: 'Silicones', icon: 'Waves' },
  { id: 'isolante', name: 'Isolantes', icon: 'ShieldOff' },
  { id: 'fio-ortodontico', name: 'Fios Ortodonticos', icon: 'Minus' },
  { id: 'outro', name: 'Outros Materiais', icon: 'Package' },
] as const

// ═══ CATEGORIAS DE EQUIPAMENTOS ═══

export const EQUIPMENT_CATEGORIES = [
  { id: 'forno-ceramica', name: 'Forno de Ceramica', icon: 'Flame' },
  { id: 'forno-sintering', name: 'Forno de Sinterizacao', icon: 'Flame' },
  { id: 'fresadora', name: 'Fresadora CAD/CAM', icon: 'Cog' },
  { id: 'impressora-3d', name: 'Impressora 3D', icon: 'Printer' },
  { id: 'scanner-intraoral', name: 'Scanner Intraoral', icon: 'Scan' },
  { id: 'scanner-bancada', name: 'Scanner de Bancada', icon: 'ScanLine' },
  { id: 'prensa-injecao', name: 'Prensa de Injecao', icon: 'ArrowDownToLine' },
  { id: 'fundidora', name: 'Fundidora', icon: 'Zap' },
  { id: 'polimeradora', name: 'Polimerizadora', icon: 'Lightbulb' },
  { id: 'jato-oxido', name: 'Jateador de Oxido', icon: 'Wind' },
  { id: 'recortador', name: 'Recortador de Gesso', icon: 'Scissors' },
  { id: 'compressor', name: 'Compressor', icon: 'Gauge' },
  { id: 'outro', name: 'Outro Equipamento', icon: 'Wrench' },
] as const

// ═══ UNIDADES DE MEDIDA ═══

export const UNITS = [
  { id: 'un', name: 'Unidade', abbr: 'un' },
  { id: 'g', name: 'Grama', abbr: 'g' },
  { id: 'kg', name: 'Quilograma', abbr: 'kg' },
  { id: 'ml', name: 'Mililitro', abbr: 'ml' },
  { id: 'l', name: 'Litro', abbr: 'L' },
  { id: 'cx', name: 'Caixa', abbr: 'cx' },
  { id: 'pct', name: 'Pacote', abbr: 'pct' },
  { id: 'rolo', name: 'Rolo', abbr: 'rolo' },
  { id: 'par', name: 'Par', abbr: 'par' },
  { id: 'kit', name: 'Kit', abbr: 'kit' },
] as const
