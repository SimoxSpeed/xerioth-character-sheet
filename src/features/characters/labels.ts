import { findClass } from '../../game/data/classes'
import { findDeity } from '../../game/data/deities'
import { findRace } from '../../game/data/races'

interface ClassLike {
  class_key: string
  deity_key: string | null
  patron: string | null
}

/** "Sacerdote di Tarooth (Vortex)", "Mentalista", … */
export function classLabel(c: ClassLike): string {
  const name = findClass(c.class_key)?.name ?? c.class_key
  const deity = findDeity(c.deity_key)?.name
  let label = deity ? `${name} di ${deity}` : name
  if (c.patron) label += ` (${c.patron})`
  return label
}

export function classesLabel(classes: ClassLike[]): string {
  return classes.map(classLabel).join(' · ') || 'Nessuna classe'
}

export function raceLabel(key: string | null): string {
  return findRace(key)?.name ?? (key || 'Razza non indicata')
}
