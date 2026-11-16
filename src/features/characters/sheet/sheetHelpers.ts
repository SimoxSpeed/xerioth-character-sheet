// Funzioni e costanti condivise dalle sezioni della scheda (fuori dai componenti per l'HMR).
import { findSkill } from '../../../game/data/skills'
import { powerSections, type PowerSection } from '../../../game/rules'
import type { CharacterSheet, ItemRow, SkillRow } from '../api'

export const MASTER_OPTIONS = [
  { value: 0, label: 'Nessun maestro' },
  { value: 1, label: 'Maestro liv. 1 (+2)' },
  { value: 2, label: 'Maestro liv. 2 (+5)' },
  { value: 3, label: 'Maestro liv. 3 (+10)' },
  { value: 4, label: 'Maestro liv. 4 (+15)' },
]

export function skillDisplayName(skill: Pick<SkillRow, 'custom_name' | 'skill_key'>): string {
  return skill.custom_name || findSkill(skill.skill_key)?.name || skill.skill_key || 'Capacità'
}

/** Sezioni dei poteri del personaggio (in base alle classi e ai poteri già presenti). */
export function sheetPowerSections(sheet: CharacterSheet): PowerSection[] {
  return powerSections(
    sheet.character_classes.map((c) => c.class_key),
    sheet.character_powers.map((p) => p.kind),
  )
}

export const SLOT_LABELS: Record<NonNullable<ItemRow['slot']>, string> = { weapon: 'Arma', armor: 'Armatura' }
