import type { AttributeKey } from '../data/attributes'
import { POWER_KINDS, findClass, type PowerKind, type ResourceKey } from '../data/classes'

/** Una sezione della scheda Poteri: un tipo di potere con l'etichetta scelta dalla classe. */
export interface PowerSection {
  kind: PowerKind
  /** Es. "Miracoli" (plurale, titolo di sezione). */
  label: string
  /** Es. "Miracolo". */
  singular: string
  /** Caratteristica per prove e allenamento. */
  attribute: AttributeKey
  /** Risorsa consumata dal lancio, se la classe ne ha una. */
  resource: ResourceKey | null
  /** Classi del personaggio che concedono questo tipo di potere. */
  classKeys: string[]
}

/**
 * Sezioni da mostrare: un tipo di potere per ogni classe che ne concede,
 * più eventuali tipi già presenti tra i poteri (es. classe cambiata o non in catalogo).
 * Ogni sezione è una scheda a sé ("Miracoli", "Incantesimi"…); due classi con lo stesso tipo
 * (es. due divinità) condividono la stessa scheda. L'etichetta viene dalla prima classe.
 */
export function powerSections(classKeys: readonly string[], existingKinds: readonly PowerKind[] = []): PowerSection[] {
  const sections = new Map<PowerKind, PowerSection>()
  for (const key of classKeys) {
    const template = findClass(key)
    const powers = template?.powers
    if (!powers) continue
    const existing = sections.get(powers.kind)
    if (existing) {
      existing.classKeys.push(key)
      continue
    }
    sections.set(powers.kind, {
      kind: powers.kind,
      label: powers.label ?? POWER_KINDS[powers.kind].label,
      singular: powers.singular ?? POWER_KINDS[powers.kind].singular,
      attribute: powers.attribute,
      resource: template.resource ?? null,
      classKeys: [key],
    })
  }
  for (const kind of existingKinds) {
    if (sections.has(kind)) continue
    sections.set(kind, {
      kind,
      label: POWER_KINDS[kind].label,
      singular: POWER_KINDS[kind].singular,
      attribute: 'intelligenza',
      resource: null,
      classKeys: [],
    })
  }
  return [...sections.values()]
}

/** Numero all'inizio di un testo ("100 / ora" → 100), null se non c'è. */
export function leadingNumber(text: string): number | null {
  const match = /^\s*(\d+(?:[.,]\d+)?)/.exec(text)
  return match ? Number(match[1]!.replace(',', '.')) : null
}

/**
 * Applica una variazione percentuale al numero iniziale di un testo, lasciando il resto
 * ("100 / ora", +30% → "130 / ora"). Restituisce null se il testo non inizia con un numero.
 */
export function scaleLeadingNumber(text: string, percent: number): string | null {
  const value = leadingNumber(text)
  if (value === null) return null
  const scaled = Math.round(value * (1 + percent / 100) * 10) / 10
  return text.replace(/^\s*\d+(?:[.,]\d+)?/, scaled.toLocaleString('it-IT'))
}
