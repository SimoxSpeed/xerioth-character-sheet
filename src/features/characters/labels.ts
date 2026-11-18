import { getCatalog } from '../catalog/store'

interface ClassLike {
  class_key: string
  deity_key: string | null
  element_key?: string | null
  patron: string | null
}

// Come nel manuale: "Elementalista dell'Aria", "Elementalista Puro".
const ELEMENT_SUFFIX: Record<string, string> = {
  aria: "dell'Aria",
  acqua: "dell'Acqua",
  fuoco: 'del Fuoco',
  terra: 'della Terra',
  puro: 'Puro',
}

/** "Sacerdote di Tarooth (Vortex)", "Elementalista del Fuoco", "Mentalista", … */
export function classLabel(c: ClassLike): string {
  const catalog = getCatalog()
  const name = catalog.klass(c.class_key)?.name ?? c.class_key
  const deity = catalog.deity(c.deity_key)?.name
  const element = c.element_key ? (ELEMENT_SUFFIX[c.element_key] ?? catalog.element(c.element_key)?.name) : undefined
  let label = deity ? `${name} di ${deity}` : name
  if (element) label += ` ${element}`
  if (c.patron) label += ` (${c.patron})`
  return label
}

export function classesLabel(classes: ClassLike[]): string {
  return classes.map(classLabel).join(' · ') || 'Nessuna classe'
}

export function raceLabel(key: string | null): string {
  return getCatalog().race(key)?.name ?? (key || 'Razza non indicata')
}
