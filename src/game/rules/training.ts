import { ATTRIBUTES, type AttributeKey } from '../data/attributes'
import {
  BASE_DAILY_POINTS,
  MASTER_POINTS_BY_LEVEL,
  SUPPORT_POINTS_BY_LEVEL,
  SUPPORT_SKILLS,
  type Discipline,
} from '../data/training'
import { attributeModifier, boosterMultiplier } from './attributes'

export interface DailyPointsInput {
  /** Caratteristica di ciò che si allena (miracoli e poteri: intelligenza). */
  trainedAttribute: AttributeKey
  attributes: Record<AttributeKey, number>
  /** Livelli delle capacità di supporto, per skill_key (studio, concentrazione, …). */
  supportLevels: Partial<Record<string, number | null>>
  /** Livello del maestro (0 = nessuno). */
  masterLevel?: number
  otherBonus?: number
}

export interface DailyPointsBreakdown {
  total: number
  base: number
  supports: { key: string; name: string; points: number; booster: number }[]
  master: number
  modifier: number
  other: number
}

export function disciplineOf(attribute: AttributeKey): Discipline {
  return ATTRIBUTES[attribute].discipline
}

/**
 * Punti di allenamento al giorno (stima). Contano solo le capacità di supporto adatte alla
 * disciplina (mentale/fisica). A livello 4 si aggiunge il booster: modificatore × moltiplicatore
 * della caratteristica più alta tra quelle indicate per quella capacità.
 */
export function dailyTrainingPoints(input: DailyPointsInput): DailyPointsBreakdown {
  const discipline = disciplineOf(input.trainedAttribute)
  const supports = SUPPORT_SKILLS.filter((s) => s.disciplines.includes(discipline)).map((s) => {
    const level = Math.min(Math.max(input.supportLevels[s.key] ?? 0, 0), 4)
    const points = SUPPORT_POINTS_BY_LEVEL[level]!
    let booster = 0
    if (level === 4) {
      const best = Math.max(...s.boosterFrom.map((a) => input.attributes[a]))
      const mod = attributeModifier(best)
      booster = mod * boosterMultiplier(mod)
    }
    return { key: s.key, name: s.name, points, booster }
  })
  const master = MASTER_POINTS_BY_LEVEL[Math.min(Math.max(input.masterLevel ?? 0, 0), 4)]!
  const modifier = attributeModifier(input.attributes[input.trainedAttribute])
  const other = input.otherBonus ?? 0
  const total =
    BASE_DAILY_POINTS + supports.reduce((sum, s) => sum + s.points + s.booster, 0) + master + modifier + other
  return { total, base: BASE_DAILY_POINTS, supports, master, modifier, other }
}

/** Giorni stimati per accumulare `remaining` punti. */
export function daysToComplete(remaining: number, pointsPerDay: number): number | null {
  if (pointsPerDay <= 0) return null
  return Math.max(0, Math.ceil(remaining / pointsPerDay))
}

export interface UnlockInput {
  characterLevel: number
  attributes: Record<AttributeKey, number>
  skillLevels: Partial<Record<string, number | null>>
}

/** Capacità di supporto che si sbloccano da sole (da segnare a livello 1). */
export function availableUnlocks({ characterLevel, attributes, skillLevels }: UnlockInput): string[] {
  const has = (key: string) => (skillLevels[key] ?? null) !== null
  const unlocks: string[] = []
  const int = attributes.intelligenza
  if (!has('concentrazione') && characterLevel + int + attributeModifier(int) >= 30) unlocks.push('concentrazione')
  const physical = characterLevel + attributes.costituzione + attributes.abilita
  if (!has('destrezza') && physical >= 30) unlocks.push('destrezza')
  if (!has('resistenza_fatica') && physical >= 30) unlocks.push('resistenza_fatica')
  const resilienceSum = (skillLevels.concentrazione ?? 0) + (skillLevels.resistenza_fatica ?? 0)
  if (!has('resilienza') && resilienceSum >= 8) unlocks.push('resilienza')
  return unlocks
}
