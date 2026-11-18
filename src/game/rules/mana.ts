import { RESOURCES, type ResourceKey } from '../data/classes'
import { CAST_COST_TABLE, MANA_LEVEL_SUM_TABLE } from '../data/mana'
import { attributeModifier } from './attributes'

// Punti Mente (Mentalisti) e Anima (Incantatori, Druidi) si calcolano come i Punti Mana
// e usano la stessa tabella del costo di lancio.

/** true se la risorsa usa la formula dei Punti Mana e la tabella del costo di lancio. */
export function usesManaRules(resource: ResourceKey | null | undefined): boolean {
  return resource != null && RESOURCES[resource].computed === true
}

export interface ManaInput {
  intelligenza: number
  spellCount: number
  /** Somma dei livelli di tutti gli incantesimi. */
  spellLevelSum: number
  casterLevel: number
}

/** Valore T(somma livelli) della tabella; null oltre la tabella (somma > 61). */
export function manaLevelSumValue(sum: number): number | null {
  if (sum <= 0) return 0
  return MANA_LEVEL_SUM_TABLE[sum] ?? null
}

/**
 * Punti Mana = Int + mod² + incantesimi × 3 + T(somma livelli) + livello mago².
 * null se la somma dei livelli è fuori tabella.
 */
export function manaPoints({ intelligenza, spellCount, spellLevelSum, casterLevel }: ManaInput): number | null {
  const t = manaLevelSumValue(spellLevelSum)
  if (t === null) return null
  const mod = attributeModifier(intelligenza)
  return intelligenza + mod * mod + spellCount * 3 + t + casterLevel * casterLevel
}

/**
 * Costo di lancio (Mana o Punti Spirito) dalla tabella A108.
 * @param currentLevel "Bonus": livello attuale del potere (0–10)
 * @param acquisitionLevel "Livello": livello di acquisizione (1–10)
 */
export function castCost(currentLevel: number | null, acquisitionLevel: number | null): number | null {
  if (currentLevel === null || acquisitionLevel === null) return null
  return CAST_COST_TABLE[currentLevel]?.[acquisitionLevel - 1] ?? null
}

/** Lancio Rapido: −(30% + 5% per livello oltre il primo) sul tempo, +stessa % sul costo. */
export function quickCastPercent(quickCastLevel: number | null): number {
  if (!quickCastLevel || quickCastLevel < 1) return 0
  return 30 + 5 * (quickCastLevel - 1)
}
