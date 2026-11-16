// Costi di avanzamento — fonte: Xerioth Master › Avanzamenti (docs/01-regole-di-gioco.md §4, §5)

/**
 * Punti per raggiungere il livello L di una capacità / incantesimo / miracolo (indice = L, 0–20).
 * Da "non appresa" (NA) il livello 0 costa 35.
 */
export const SKILL_LEVEL_COSTS = [
  35, 75, 100, 190, 250, 380, 520, 670, 830, 1000, 1180, 1370, 1570, 1780, 2000, 2230, 2470, 2720, 2980, 3250, 3530,
] as const

/** Punti esperienza per ARRIVARE al livello N del personaggio (tabella A38: 1 → 700, 23 → 2900). */
export function characterLevelCost(level: number): number {
  return 600 + 100 * level
}
