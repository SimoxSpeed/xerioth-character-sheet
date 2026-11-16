import { describe, expect, it } from 'vitest'
import { powerSuccessTarget, rerollMarginText, resolvePowerRoll, rollBonus, successDieText } from './dice'

// Ruba tempo di Omnia: liv. 4, dado riuscita 6.
const rubaTempo = { successDie: 6, level: 4, isMaxed: false }

describe('tiro di un potere', () => {
  it('riesce se il d20 raggiunge il dado riuscita', () => {
    expect(resolvePowerRoll(rubaTempo, 6)).toBe('success')
    expect(resolvePowerRoll(rubaTempo, 15)).toBe('success')
  })

  it('sotto il dado riuscita chiede il ritiro', () => {
    expect(resolvePowerRoll(rubaTempo, 5)).toBe('pending')
  })

  it('ritiro ≤ 2 × livello riesce, oltre fallisce davvero', () => {
    expect(resolvePowerRoll(rubaTempo, 3, 8)).toBe('saved')
    expect(resolvePowerRoll(rubaTempo, 3, 9)).toBe('failed')
    expect(rerollMarginText(4, false)).toBe('Riesce con 1–8, da 9 a 20 fallisce.')
  })

  it('al massimo si salva fino a 19, un 20 al ritiro fallisce sempre', () => {
    expect(resolvePowerRoll({ ...rubaTempo, isMaxed: true }, 1, 19)).toBe('saved')
    expect(resolvePowerRoll({ ...rubaTempo, isMaxed: true }, 1, 20)).toBe('failed')
  })

  it('livello 0 o NA: il ritiro fallisce comunque', () => {
    expect(resolvePowerRoll({ successDie: 20, level: 0, isMaxed: false }, 12, 1)).toBe('failed')
    expect(resolvePowerRoll({ successDie: 8, level: null, isMaxed: false }, 2, 1)).toBe('failed')
  })

  it('dado riuscita 0 (Visione): riesce sempre', () => {
    expect(resolvePowerRoll({ successDie: 0, level: 10, isMaxed: false }, 1)).toBe('success')
    expect(successDieText(0)).toBe('riesce sempre')
    expect(successDieText(17)).toBe('dal 17 in su')
    expect(successDieText(20)).toBe('solo con 20')
  })
})

describe('totale del tiro', () => {
  it('capacità e poteri: caratteristica + modificatore + livello (+ d20)', () => {
    // Abilità 15 (mod +1), Spada liv. 1
    expect(rollBonus(15, 1)).toBe(17)
    // Intelligenza 23 (mod +4), liv. 9
    expect(rollBonus(23, 9)).toBe(36)
  })

  it('caratteristica: niente livello; NA vale 0', () => {
    expect(rollBonus(13, null)).toBe(14)
    expect(rollBonus(null, 4)).toBe(4)
  })

  it('riuscita = dado + caratteristica + modificatore + livello (foglio "Dadi riuscita")', () => {
    // Corrosione: liv. 0, Intelligenza 20 (mod +3), dado 20 → 43
    expect(powerSuccessTarget(20, rollBonus(20, 0))).toBe(43)
    // Distruggere non morto minore: liv. 1, dado 8 → 32
    expect(powerSuccessTarget(8, rollBonus(20, 1))).toBe(32)
  })

  it('il potere riesce se il totale raggiunge la riuscita', () => {
    // bonus 12, dado 17 → riuscita 29: serve un totale di 29 (d20 ≥ 17)
    expect(resolvePowerRoll({ successDie: 17, level: 4, isMaxed: false, bonus: 12 }, 17)).toBe('success')
    expect(resolvePowerRoll({ successDie: 17, level: 4, isMaxed: false, bonus: 12 }, 16)).toBe('pending')
    // il ritiro resta sul d20 naturale (≤ 2 × livello)
    expect(resolvePowerRoll({ successDie: 17, level: 4, isMaxed: false, bonus: 12 }, 4, 8)).toBe('saved')
  })
})
