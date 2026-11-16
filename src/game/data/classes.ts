// Template di classe (docs/02-database.md §1).
// ⏳ PROVVISORI: l'elenco definitivo delle classi verrà fornito più avanti.

import type { AttributeKey } from './attributes'

export type PowerKind = 'miracle' | 'spell' | 'mental'
export type ResourceKey = 'spirito' | 'mana' | 'mente' | 'anima'

export interface ResourceDef {
  key: ResourceKey
  label: string
  /** Tetto massimo assoluto, se esiste (es. Punti Spirito: 600). */
  cap?: number
  /** true se il massimo si calcola con una formula (Punti Mana). */
  computed?: boolean
}

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  spirito: { key: 'spirito', label: 'Punti Spirito', cap: 600 },
  mana: { key: 'mana', label: 'Punti Mana', computed: true },
  mente: { key: 'mente', label: 'Punti Mente' },
  anima: { key: 'anima', label: 'Punti Anima' },
}

export const POWER_KINDS: Record<PowerKind, { label: string; singular: string }> = {
  miracle: { label: 'Miracoli', singular: 'Miracolo' },
  spell: { label: 'Incantesimi', singular: 'Incantesimo' },
  mental: { label: 'Poteri mentali', singular: 'Potere mentale' },
}

export interface ClassPowers {
  kind: PowerKind
  /** Caratteristica usata per prove e allenamento dei poteri. */
  attribute: AttributeKey
  /** Nome della sezione per questa classe (es. "Miracoli", "Incantesimi di Fuoco"). Default: POWER_KINDS[kind].label */
  label?: string
  /** Nome del singolo potere (es. "Miracolo"). Default: POWER_KINDS[kind].singular */
  singular?: string
}

export interface ClassTemplate {
  key: string
  name: string
  /** "Sacerdote di …": si sceglie una divinità (e facoltativamente un patrono, es. un figlio del Dio). */
  requiresDeity?: boolean
  powers?: ClassPowers
  resource?: ResourceKey
}

export const CLASSES: readonly ClassTemplate[] = [
  {
    key: 'sacerdote',
    name: 'Sacerdote',
    requiresDeity: true,
    powers: { kind: 'miracle', attribute: 'intelligenza', label: 'Miracoli', singular: 'Miracolo' },
    resource: 'spirito',
  },
  {
    key: 'mago',
    name: 'Mago',
    powers: { kind: 'spell', attribute: 'intelligenza', label: 'Incantesimi', singular: 'Incantesimo' },
    resource: 'mana',
  },
  {
    key: 'mentalista',
    name: 'Mentalista',
    powers: { kind: 'mental', attribute: 'intelligenza', label: 'Poteri mentali', singular: 'Potere mentale' },
    resource: 'mente',
  },
  { key: 'assassino', name: 'Assassino' },
  { key: 'ladro', name: 'Ladro' },
  { key: 'guerriero', name: 'Guerriero' },
]

export function findClass(key: string | null | undefined): ClassTemplate | undefined {
  return CLASSES.find((c) => c.key === key)
}
