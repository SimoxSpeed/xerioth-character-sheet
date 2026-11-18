import { ATTRIBUTES, type AttributeKey } from '../data/attributes'
import type { Requirement } from '../catalog'

export interface RequirementContext {
  attributes: Record<AttributeKey, number>
  /** Livelli delle capacità possedute per skill_key (null = non appresa). */
  skillLevels: Partial<Record<string, number | null>>
  /** Nomi dei poteri posseduti (miracoli/incantesimi/poteri mentali). */
  powerNames: string[]
  /** Nome leggibile di una capacità (dal catalogo); senza, si mostra la chiave. */
  skillName?: (key: string) => string | undefined
}

export interface RequirementCheck {
  requirement: Requirement
  /** true = soddisfatto, false = mancante, null = non verificabile (nota libera). */
  met: boolean | null
  label: string
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function checkRequirement(requirement: Requirement, ctx: RequirementContext): RequirementCheck {
  switch (requirement.type) {
    case 'attribute': {
      const value = ctx.attributes[requirement.attribute]
      return {
        requirement,
        met: value >= requirement.min,
        label: `${ATTRIBUTES[requirement.attribute].label} ${requirement.min} (hai ${value})`,
      }
    }
    case 'skill': {
      const level = ctx.skillLevels[requirement.skill] ?? null
      const name = ctx.skillName?.(requirement.skill) ?? requirement.skill
      return {
        requirement,
        met: level !== null && level >= requirement.min,
        label: `${name} ${requirement.min} (${level === null ? 'non posseduta' : `hai ${level}`})`,
      }
    }
    case 'power': {
      const has = ctx.powerNames.some((n) => normalize(n) === normalize(requirement.name))
      return { requirement, met: has, label: `Incantesimo "${requirement.name}"` }
    }
    case 'note':
      return { requirement, met: null, label: requirement.text }
  }
}

export function checkRequirements(requirements: Requirement[], ctx: RequirementContext) {
  const checks = requirements.map((r) => checkRequirement(r, ctx))
  return {
    checks,
    /** Tutti i requisiti verificabili sono soddisfatti (le note non bloccano). */
    allMet: checks.every((c) => c.met !== false),
  }
}
