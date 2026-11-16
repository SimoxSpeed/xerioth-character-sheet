// Tiri di dado (docs/01-regole-di-gioco.md §7)
import { attributeModifier } from './attributes'

/** 'coin' (Sopra o Sotto) non si tira più: resta per i tiri già nello storico. */
export type DieKind = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'coin'

/** Facce di ogni dado (la moneta vale 1 = Sopra, 2 = Sotto). */
const SIDES: Record<DieKind, number> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100, coin: 2 }

export const DIE_LABELS: Record<DieKind, string> = {
  d4: 'd4',
  d6: 'd6',
  d8: 'd8',
  d10: 'd10',
  d12: 'd12',
  d20: 'd20',
  d100: 'd100',
  coin: 'Sopra o Sotto',
}

/** Dadi del tiro libero, nell'ordine in cui si mostrano. */
export const FREE_DICE: DieKind[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']

/** Valore massimo di un dado. */
export function dieSides(die: DieKind): number {
  return SIDES[die]
}

export function coinLabel(value: number): string {
  return value === 1 ? 'Sopra' : 'Sotto'
}

export function rollDie(die: DieKind, random: () => number = Math.random): number {
  return Math.floor(random() * dieSides(die)) + 1
}

// ---------------------------------------------------------------------------
// Totale di un tiro della scheda (docs/01-regole-di-gioco.md §7)

/**
 * Quanto si somma al d20: caratteristica + suo modificatore + livello.
 * Per le prove di sola caratteristica il livello è null (non si somma); NA vale 0.
 */
export function rollBonus(attributeValue: number | null, level: number | null): number {
  const attribute = attributeValue ?? 0
  return attribute + (attributeValue === null ? 0 : attributeModifier(attributeValue)) + (level ?? 0)
}

// ---------------------------------------------------------------------------
// Poteri e miracoli: riuscita fissata dal Master

/** Un potere a livello 0 parte solo con dado 20. */
export const LEVEL_ZERO_SUCCESS_DIE = 20

/** Dado imposto dalla regola (livello 0 → 20); null = lo sceglie il Master. */
export function forcedSuccessDie(level: number | null): number | null {
  return level === 0 ? LEVEL_ZERO_SUCCESS_DIE : null
}

/**
 * Riuscita da fissare (foglio "Dadi riuscita"): dado scelto dal Master
 * + caratteristica + modificatore + livello di quel momento. Es. Corrosione: 20 + 20 + 3 + 0 = 43.
 * Si salva il totale: alzando dopo caratteristica o livello il potere riesce più facilmente.
 */
export function powerSuccessTarget(successDie: number, bonus: number): number {
  return successDie + bonus
}

/** Il potere riesce se il totale del tiro raggiunge la riuscita. */
export function meetsSuccessTarget(total: number, target: number): boolean {
  return total >= target
}

/** Ritirare il fallimento: si salva con un ritiro ≤ 2 × livello (al massimo: fino a 19). */
export function rerollSafeThreshold(level: number | null, isMaxed: boolean): number {
  if (isMaxed) return 19
  return Math.min(19, 2 * (level ?? 0))
}

/** Esito del ritiro: true = fallimento vero. Un 20 fallisce sempre. */
export function isRerollFailure(reroll: number, level: number | null, isMaxed: boolean): boolean {
  if (reroll === 20) return true
  return reroll > rerollSafeThreshold(level, isMaxed)
}

/**
 * - `success`: il totale (d20 + caratteristica + modificatore + livello) raggiunge la riuscita fissata;
 * - `pending`: fallito, serve il ritiro;
 * - `saved`: ritiro (d20 naturale) ≤ 2 × livello, il potere riesce;
 * - `failed`: fallimento vero.
 */
export type PowerRollState = 'success' | 'pending' | 'saved' | 'failed'

export function resolvePowerRoll(
  power: { target: number; level: number | null; isMaxed: boolean; /** Si somma al primo d20. */ bonus?: number },
  roll: number,
  reroll?: number,
): PowerRollState {
  if (meetsSuccessTarget(roll + (power.bonus ?? 0), power.target)) return 'success'
  if (reroll === undefined) return 'pending'
  return isRerollFailure(reroll, power.level, power.isMaxed) ? 'failed' : 'saved'
}

/** "d20 7, ritiro 3" (poteri) oppure "3d6 2 + 5 + 1" (tiro libero). */
export function rollValuesText(die: DieKind, results: number[], reroll: boolean): string {
  const values = results.map((v) => (die === 'coin' ? coinLabel(v) : String(v)))
  if (reroll) return `${DIE_LABELS[die]} ${values.join(', ritiro ')}`
  const prefix = results.length > 1 ? `${results.length}${DIE_LABELS[die]}` : DIE_LABELS[die]
  return `${prefix} ${values.join(' + ')}`
}
