import { attributeModifier } from './attributes'

export interface MaxHpInput {
  costituzione: number
  /** Livello della capacità "Forza" (0 se non appresa). */
  forzaLevel: number
  /** Coefficiente della razza (catalogo races); null se non ancora definito. */
  hpCoefficient: number | null | undefined
  /** Bonus fissi da oggetti (es. Bracciale Vita +100). */
  hpBonus: number
}

/**
 * PF massimi = (Costituzione + mod. Costituzione + livello Forza) × coefficiente razza + bonus.
 * null se la razza non ha un coefficiente definito.
 */
export function maxHp({ costituzione, forzaLevel, hpCoefficient, hpBonus }: MaxHpInput): number | null {
  if (hpCoefficient == null) return null
  return (costituzione + attributeModifier(costituzione) + forzaLevel) * hpCoefficient + hpBonus
}

/** PF attuali = massimi + temporanei − danni ricevuti. */
export function currentHp(max: number, tempHp: number, damageTaken: number): number {
  return max + tempHp - damageTaken
}
