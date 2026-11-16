import { describe, expect, it } from 'vitest'
import { findSkill, SKILLS } from '../data/skills'
import { ATTRIBUTE_KEYS } from '../data/attributes'
import { checkRequirements } from './requirements'

// Omnia Tenem
const ctx = {
  attributes: { abilita: 15, costituzione: 13, intelligenza: 23, riflessi: 18, freddezza: 14, fascino: 11 },
  skillLevels: { muoversi_silenziosamente: 1, teologia: 9, pensiero_magico: 1 },
  powerNames: ['Corrosione', 'Ruba tempo'],
}

describe('requisiti delle capacità', () => {
  it('Furtività richiede Muoversi silenziosamente 3: Omnia ha 1 → mancante', () => {
    const { allMet, checks } = checkRequirements(findSkill('furtivita')!.requirements, ctx)
    expect(allMet).toBe(false)
    expect(checks[0]!.label).toBe('Muoversi silenziosamente 3 (hai 1)')
  })

  it('Memoria richiede Intelligenza 16: Omnia ha 23 → ok', () => {
    expect(checkRequirements(findSkill('memoria')!.requirements, ctx).allMet).toBe(true)
  })

  it('Verbo Magico richiede Pensiero magico: ok', () => {
    expect(checkRequirements(findSkill('verbo_magico')!.requirements, ctx).allMet).toBe(true)
  })

  it('Crea oggetti magici: Int 18 ok, incantesimo "Fondere incantesimi" mancante', () => {
    const { allMet, checks } = checkRequirements(findSkill('crea_oggetti_magici')!.requirements, ctx)
    expect(checks.map((c) => c.met)).toEqual([true, false])
    expect(allMet).toBe(false)
  })

  it('le note non bloccano', () => {
    const { allMet, checks } = checkRequirements(findSkill('armi_pesanti')!.requirements, ctx)
    expect(checks[0]!.met).toBeNull()
    expect(allMet).toBe(true)
  })

  it('catalogo coerente: chiavi uniche, requisiti verso capacità esistenti', () => {
    const keys = SKILLS.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const s of SKILLS) {
      expect(ATTRIBUTE_KEYS).toContain(s.attribute)
      for (const r of s.requirements) {
        if (r.type === 'skill') expect(findSkill(r.skill), `${s.key} → ${r.skill}`).toBeDefined()
      }
    }
  })
})
