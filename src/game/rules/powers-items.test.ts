import { describe, expect, it } from 'vitest'
import {
  castCost,
  leadingNumber,
  powerSections,
  quickCastPercent,
  scaleLeadingNumber,
  consumeItemPatch,
} from '.'
import type { ClassDefinition } from '../catalog'

type ClassStub = Pick<ClassDefinition, 'key' | 'powers' | 'resourceKey'>
const sacerdote: ClassStub = {
  key: 'sacerdote',
  resourceKey: 'spirito',
  powers: { kind: 'miracle', label: 'Miracoli', singular: 'Miracolo', attribute: 'intelligenza' },
}
const mentalista: ClassStub = {
  key: 'mentalista',
  resourceKey: 'mente',
  powers: { kind: 'mental', label: 'Poteri mentali', singular: 'Potere mentale', attribute: 'intelligenza' },
}
const assassino: ClassStub = { key: 'assassino', resourceKey: null, powers: null }

describe('sezioni dei poteri', () => {
  it('Sacerdote → una sezione "Miracoli" con Punti Spirito', () => {
    const sections = powerSections([sacerdote])
    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({ kind: 'miracle', label: 'Miracoli', resource: 'spirito' })
  })

  it('classe senza poteri → nessuna sezione', () => {
    expect(powerSections([assassino])).toEqual([])
  })

  it('multiclasse → una sezione (scheda) per classe con poteri', () => {
    const sections = powerSections([mentalista, sacerdote])
    expect(sections.map((s) => s.label)).toEqual(['Poteri mentali', 'Miracoli'])
  })

  it('due classi con miracoli (due divinità) → una sola scheda Miracoli', () => {
    const sections = powerSections([sacerdote, sacerdote])
    expect(sections).toHaveLength(1)
    expect(sections[0]!.classKeys).toHaveLength(2)
  })

  it('tipi già presenti senza classe → sezione con etichetta di default', () => {
    const sections = powerSections([assassino], ['spell'])
    expect(sections).toEqual([expect.objectContaining({ kind: 'spell', label: 'Incantesimi', classKeys: [] })])
  })
})

describe('costo e Lancio Rapido', () => {
  it('Ruba tempo (acquisizione 10, liv. 4): costo da tabella', () => {
    expect(castCost(4, 10)).not.toBeNull()
    expect(castCost(2, 3)).toBe(25)
  })

  it('numero iniziale di un testo', () => {
    expect(leadingNumber('100 / ora')).toBe(100)
    expect(leadingNumber('ND')).toBeNull()
    expect(leadingNumber('2,5')).toBe(2.5)
  })

  it('Lancio Rapido liv. 2: −35% tempo, +35% costo', () => {
    const pct = quickCastPercent(2)
    expect(pct).toBe(35)
    expect(scaleLeadingNumber('10', -pct)).toBe('6,5')
    expect(scaleLeadingNumber('100 / ora', pct)).toBe('135 / ora')
    expect(scaleLeadingNumber('Tarooth', pct)).toBeNull()
  })
})

describe('inventario: pulsante Usa', () => {
  it('scala prima le cariche residue', () => {
    expect(consumeItemPatch({ quantity: 4, charges_remaining: 11 })).toEqual({ charges_remaining: 10 })
  })
  it('senza cariche scala la quantità', () => {
    expect(consumeItemPatch({ quantity: 5, charges_remaining: null })).toEqual({ quantity: 4 })
  })
  it('niente da consumare', () => {
    expect(consumeItemPatch({ quantity: 2, charges_remaining: 0 })).toBeNull()
    expect(consumeItemPatch({ quantity: 0, charges_remaining: null })).toBeNull()
  })
})
