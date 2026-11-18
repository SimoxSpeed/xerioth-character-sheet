// Cataloghi del manuale (docs/02 §1). I dati stanno nel database; qui ci sono solo i tipi
// e le ricerche per chiave, così le regole restano funzioni pure e testabili.

import type { AttributeKey } from './data/attributes'
import type { PowerKind, ResourceKey } from './data/classes'

export type Requirement =
  | { type: 'attribute'; attribute: AttributeKey; min: number }
  | { type: 'skill'; skill: string; min: number }
  | { type: 'power'; name: string }
  | { type: 'note'; text: string }

export interface RaceFamily {
  key: string
  name: string
  /** Testo comune alla famiglia (es. "Tutti gli elfi sono leggeri…"). */
  intro: string
}

export interface Race {
  key: string
  name: string
  familyKey: string
  /** Coefficiente per il calcolo dei PF; null finché il Master non lo dà. */
  hpCoefficient: number | null
  appearance: string
  sizeLifespan: string
  typicalAlignment: string
  society: string
  traits: string
}

/** Una riga con etichetta della tab del manuale ("Descrizione Generale", "Capacità collegate"…). */
export interface TextSection {
  title: string
  text: string
}

export interface ClassPowers {
  kind: PowerKind
  /** Nome della sezione della scheda (es. "Miracoli"). */
  label: string
  /** Nome del singolo potere (es. "Miracolo"). */
  singular: string
  /** Caratteristica usata per prove e allenamento dei poteri. */
  attribute: AttributeKey
}

export interface ClassDefinition {
  key: string
  name: string
  kind: 'class' | 'career'
  motto: string
  summary: string
  sections: TextSection[]
  resourceKey: ResourceKey | null
  powers: ClassPowers | null
  /** "Sacerdote di …": si sceglie una divinità (e facoltativamente un patrono). */
  requiresDeity: boolean
  /** Elementalista: si sceglie l'elemento. */
  requiresElement: boolean
}

export interface Element {
  key: string
  name: string
  nature: string
  spellExamples: string
  creatures: string
  oppositeKey: string | null
  deityKey: string | null
}

export interface Deity {
  key: string
  name: string
  motto: string
  domain: string
  lore: string
  divineWeapon: string
  outsiders: string
  miracleExamples: string
}

export interface Alignment {
  key: string
  code: string
  name: string
  archetype: string
  description: string
  example: string
}

export interface SkillDefinition {
  key: string
  name: string
  attribute: AttributeKey
  /** Solo indicativo: il MAX reale lo comunica il Master (interruttore nella scheda). */
  maxLevel: number
  description: string
  requirements: Requirement[]
}

export interface Weapon {
  key: string
  name: string
  category: string
  skillKey: string | null
  requirement: string
  note: string
}

export interface Armor {
  key: string
  name: string
  armorType: string
  description: string
  requirement: string
  note: string
}

export interface CatalogData {
  raceFamilies: RaceFamily[]
  races: Race[]
  classes: ClassDefinition[]
  elements: Element[]
  deities: Deity[]
  alignments: Alignment[]
  skills: SkillDefinition[]
  weapons: Weapon[]
  armors: Armor[]
}

type Lookup<T> = (key: string | null | undefined) => T | undefined

export interface Catalog extends CatalogData {
  race: Lookup<Race>
  raceFamily: Lookup<RaceFamily>
  klass: Lookup<ClassDefinition>
  element: Lookup<Element>
  deity: Lookup<Deity>
  alignment: Lookup<Alignment>
  skill: Lookup<SkillDefinition>
}

function lookup<T extends { key: string }>(list: readonly T[]): Lookup<T> {
  const index = new Map(list.map((item) => [item.key, item]))
  return (key) => (key ? index.get(key) : undefined)
}

/** Catalogo con le ricerche per chiave. Le liste restano nell'ordine del manuale. */
export function createCatalog(data: CatalogData): Catalog {
  return {
    ...data,
    race: lookup(data.races),
    raceFamily: lookup(data.raceFamilies),
    klass: lookup(data.classes),
    element: lookup(data.elements),
    deity: lookup(data.deities),
    alignment: lookup(data.alignments),
    skill: lookup(data.skills),
  }
}
