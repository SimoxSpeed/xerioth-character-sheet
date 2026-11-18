// Risorse e tipi di potere: configurazione legata al codice (docs/02 §1.1).
// L'elenco delle classi, con risorsa e poteri di ciascuna, sta nel database (tabella classes).

export type PowerKind = 'miracle' | 'spell' | 'mental'
export type ResourceKey = 'spirito' | 'mana' | 'mente' | 'anima'

export interface ResourceDef {
  key: ResourceKey
  label: string
  /** Tetto massimo assoluto, se esiste (es. Punti Spirito: 600). */
  cap?: number
  /**
   * true per Punti Mana, Punti Mente e Anima: stesso calcolo del massimo (docs/01 §3)
   * e costo di lancio dalla tabella A108.
   */
  computed?: boolean
}

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  spirito: { key: 'spirito', label: 'Punti Spirito', cap: 600 },
  mana: { key: 'mana', label: 'Punti Mana', computed: true },
  mente: { key: 'mente', label: 'Punti Mente', computed: true },
  anima: { key: 'anima', label: 'Punti Anima', computed: true },
}

export const POWER_KINDS: Record<PowerKind, { label: string; singular: string }> = {
  miracle: { label: 'Miracoli', singular: 'Miracolo' },
  spell: { label: 'Incantesimi', singular: 'Incantesimo' },
  mental: { label: 'Poteri mentali', singular: 'Potere mentale' },
}
