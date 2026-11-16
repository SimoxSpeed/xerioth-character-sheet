import { ATTRIBUTE_COSTS, BOOSTER_BY_MODIFIER, type AttributeKey } from '../data/attributes'

/** Modificatore: max(0, floor((valore − 10) / 3)). Sotto 9 vale 0. */
export function attributeModifier(value: number): number {
  return Math.max(0, Math.floor((value - 10) / 3))
}

/** Moltiplicatore booster di un modificatore (×1 … ×4). */
export function boosterMultiplier(modifier: number): number {
  const clamped = Math.min(Math.max(modifier, 0), BOOSTER_BY_MODIFIER.length - 1)
  return BOOSTER_BY_MODIFIER[clamped]!
}

/** Punti necessari per ARRIVARE al valore `target`; null se fuori tabella. */
export function attributeCostToReach(attribute: AttributeKey, target: number): number | null {
  return ATTRIBUTE_COSTS[attribute][target] ?? null
}

/** Punti necessari per passare dal valore attuale al successivo. */
export function attributeNextCost(attribute: AttributeKey, value: number): number | null {
  return attributeCostToReach(attribute, value + 1)
}
