import { SKILL_LEVEL_COSTS, characterLevelCost } from '../data/progression'

/**
 * Punti per il livello successivo di una capacità/incantesimo.
 * `level` null = non appresa (NA) → il livello 0 costa 35. Se è al massimo o fuori tabella → null.
 */
export function skillNextCost(level: number | null, isMaxed = false): number | null {
  if (isMaxed) return null
  const next = level === null ? 0 : level + 1
  return SKILL_LEVEL_COSTS[next] ?? null
}

/** "Somma": punti cumulativi spesi per arrivare al livello attuale (NA → 0). */
export function skillCumulativeCost(level: number | null): number {
  if (level === null) return 0
  let sum = 0
  for (let l = 0; l <= level && l < SKILL_LEVEL_COSTS.length; l++) sum += SKILL_LEVEL_COSTS[l]!
  return sum
}

/** Esperienza totale necessaria per arrivare al livello del personaggio `level` (Σ costi da 1 a level). */
export function cumulativeXpForLevel(level: number): number {
  let sum = 0
  for (let l = 1; l <= level; l++) sum += characterLevelCost(l)
  return sum
}

export interface ExperienceStatus {
  /** Esperienza accumulata nel livello attuale. */
  inLevel: number
  /** Esperienza necessaria per il livello successivo. */
  nextLevelCost: number
  canLevelUp: boolean
}

export function experienceStatus(xpTotal: number, level: number): ExperienceStatus {
  const inLevel = xpTotal - cumulativeXpForLevel(level)
  const nextLevelCost = characterLevelCost(level + 1)
  return { inLevel, nextLevelCost, canLevelUp: inLevel >= nextLevelCost }
}
