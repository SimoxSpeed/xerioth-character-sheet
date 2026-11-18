// Bozza del personaggio durante la creazione a passi (docs/03 › Creazione personaggio).
import { ATTRIBUTE_KEYS, type AttributeKey } from '../../../game/data/attributes'
import type { ResourceKey } from '../../../game/data/classes'
import type { Catalog } from '../../../game/catalog'
import type { NewCharacterInput } from '../api'

export interface ClassDraft {
  classKey: string
  deityKey: string
  elementKey: string
  patron: string
}

export interface CharacterDraft {
  name: string
  raceKey: string
  alignmentKey: string
  age: string
  heightCm: string
  weightKg: string
  eyes: string
  skin: string
  hair: string
  classes: ClassDraft[]
  careerKey: string
  level: number
  attributes: Record<AttributeKey, number>
}

export const STEPS = ['Chi sei', 'Classe', 'Caratteristiche'] as const

export const emptyClass = (): ClassDraft => ({ classKey: '', deityKey: '', elementKey: '', patron: '' })

export function initialDraft(): CharacterDraft {
  return {
    name: '',
    raceKey: '',
    alignmentKey: '',
    age: '',
    heightCm: '',
    weightKg: '',
    eyes: '',
    skin: '',
    hair: '',
    classes: [emptyClass()],
    careerKey: '',
    level: 1,
    attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, 10])) as Record<AttributeKey, number>,
  }
}

/** Una classe è completa con la classe scelta e, se servono, divinità ed elemento. */
export function isClassComplete(c: ClassDraft, catalog: Catalog): boolean {
  const cls = catalog.klass(c.classKey)
  if (!cls) return false
  if (cls.requiresDeity && !c.deityKey) return false
  if (cls.requiresElement && !c.elementKey) return false
  return true
}

/** Il passo `step` (0-based) è completo: si può andare avanti. */
export function isStepComplete(step: number, draft: CharacterDraft, catalog: Catalog): boolean {
  switch (step) {
    case 0:
      return draft.name.trim() !== '' && !!catalog.race(draft.raceKey)
    case 1:
      return draft.classes.length > 0 && draft.classes.every((c) => isClassComplete(c, catalog))
    default:
      return true
  }
}

/** Risorse che avrà la scheda (Spirito, Mana, Mente, Anima), senza doppioni. */
export function draftResources(draft: CharacterDraft, catalog: Catalog): ResourceKey[] {
  const keys = draft.classes.map((c) => catalog.klass(c.classKey)?.resourceKey).filter((r): r is ResourceKey => !!r)
  return [...new Set(keys)]
}

const optionalNumber = (text: string) => {
  const value = Number(text)
  return text.trim() === '' || !Number.isFinite(value) || value <= 0 ? null : Math.round(value)
}

export function toInput(draft: CharacterDraft, catalog: Catalog, campaignId: string, ownerId: string): NewCharacterInput {
  const classes = draft.classes.map((c) => {
    const cls = catalog.klass(c.classKey)
    return {
      classKey: c.classKey,
      deityKey: cls?.requiresDeity ? c.deityKey || null : null,
      elementKey: cls?.requiresElement ? c.elementKey || null : null,
      patron: cls?.requiresDeity ? c.patron.trim() || null : null,
    }
  })
  if (draft.careerKey) classes.push({ classKey: draft.careerKey, deityKey: null, elementKey: null, patron: null })

  return {
    campaignId,
    ownerId,
    name: draft.name,
    raceKey: draft.raceKey || null,
    alignmentKey: draft.alignmentKey || null,
    age: draft.age.trim() === '' ? null : Math.max(0, Math.round(Number(draft.age)) || 0),
    heightCm: optionalNumber(draft.heightCm),
    weightKg: optionalNumber(draft.weightKg),
    eyes: draft.eyes,
    skin: draft.skin,
    hair: draft.hair,
    level: Math.max(0, draft.level),
    classes,
    attributes: draft.attributes,
  }
}
