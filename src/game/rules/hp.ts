import { findRace } from '../data/races'
import { attributeModifier } from './attributes'

export interface MaxHpInput {
  costituzione: number
  /** Livello della capacità "Forza" (0 se non appresa). */
  forzaLevel: number
  raceKey: string | null
  /** Bonus fissi da oggetti (es. Bracciale Vita +100). */
  hpBonus: number
}

/**
 * PF massimi = (Costituzione + mod. Costituzione + livello Forza) × coefficiente razza + bonus.
 * null se la razza non ha un coefficiente definito.
 */
export function maxHp({ costituzione, forzaLevel, raceKey, hpBonus }: MaxHpInput): number | null {
  const coefficient = findRace(raceKey)?.hpCoefficient
  if (coefficient == null) return null
  return (costituzione + attributeModifier(costituzione) + forzaLevel) * coefficient + hpBonus
}

/** PF attuali = massimi + temporanei − danni ricevuti. */
export function currentHp(max: number, tempHp: number, damageTaken: number): number {
  return max + tempHp - damageTaken
}
