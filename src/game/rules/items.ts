export interface ConsumableLike {
  quantity: number
  charges_remaining: number | null
}

/**
 * Effetto del pulsante "Usa": scala una carica residua se l'oggetto ne ha,
 * altrimenti una unità. null se non c'è niente da consumare.
 */
export function consumeItemPatch(item: ConsumableLike): { charges_remaining: number } | { quantity: number } | null {
  if (item.charges_remaining !== null) {
    return item.charges_remaining > 0 ? { charges_remaining: item.charges_remaining - 1 } : null
  }
  return item.quantity > 0 ? { quantity: item.quantity - 1 } : null
}
