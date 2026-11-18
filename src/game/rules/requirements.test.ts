import { describe, expect, it } from 'vitest'
import type { Requirement } from '../catalog'
import { checkRequirements } from './requirements'

// Requisiti come nel catalogo (tabella skills).
const REQUIREMENTS: Record<string, Requirement[]> = {
  furtivita: [{ type: 'skill', skill: 'muoversi_silenziosamente', min: 3 }],
  memoria: [{ type: 'attribute', attribute: 'intelligenza', min: 16 }],
  verbo_magico: [{ type: 'skill', skill: 'pensiero_magico', min: 1 }],
  crea_oggetti_magici: [
    { type: 'attribute', attribute: 'intelligenza', min: 18 },
    { type: 'power', name: 'Fondere incantesimi' },
  ],
  armi_pesanti: [{ type: 'note', text: 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)' }],
}
const NAMES: Record<string, string> = { muoversi_silenziosamente: 'Muoversi silenziosamente' }

// Omnia Tenem
const ctx = {
  attributes: { abilita: 15, costituzione: 13, intelligenza: 23, riflessi: 18, freddezza: 14, fascino: 11 },
  skillLevels: { muoversi_silenziosamente: 1, teologia: 9, pensiero_magico: 1 },
  powerNames: ['Corrosione', 'Ruba tempo'],
  skillName: (key: string) => NAMES[key],
}

describe('requisiti delle capacità', () => {
  it('Furtività richiede Muoversi silenziosamente 3: Omnia ha 1 → mancante', () => {
    const { allMet, checks } = checkRequirements(REQUIREMENTS.furtivita!, ctx)
    expect(allMet).toBe(false)
    expect(checks[0]!.label).toBe('Muoversi silenziosamente 3 (hai 1)')
  })

  it('senza il nome dal catalogo si mostra la chiave', () => {
    const { checks } = checkRequirements(REQUIREMENTS.furtivita!, { ...ctx, skillName: undefined })
    expect(checks[0]!.label).toBe('muoversi_silenziosamente 3 (hai 1)')
  })

  it('Memoria richiede Intelligenza 16: Omnia ha 23 → ok', () => {
    expect(checkRequirements(REQUIREMENTS.memoria!, ctx).allMet).toBe(true)
  })

  it('Verbo Magico richiede Pensiero magico: ok', () => {
    expect(checkRequirements(REQUIREMENTS.verbo_magico!, ctx).allMet).toBe(true)
  })

  it('Crea oggetti magici: Int 18 ok, incantesimo "Fondere incantesimi" mancante', () => {
    const { allMet, checks } = checkRequirements(REQUIREMENTS.crea_oggetti_magici!, ctx)
    expect(checks.map((c) => c.met)).toEqual([true, false])
    expect(allMet).toBe(false)
  })

  it('le note non bloccano', () => {
    const { allMet, checks } = checkRequirements(REQUIREMENTS.armi_pesanti!, ctx)
    expect(checks[0]!.met).toBeNull()
    expect(allMet).toBe(true)
  })
})
