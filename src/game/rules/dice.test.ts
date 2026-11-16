import { describe, expect, it } from 'vitest'
import { forcedSuccessDie, powerSuccessTarget, rerollSafeThreshold, resolvePowerRoll, rollBonus } from './dice'

// Ruba tempo di Omnia: liv. 4, riuscita fissata 30 (dado 6 con Intelligenza 20).
const rubaTempo = { target: 30, level: 4, isMaxed: false }

describe('tiro di un potere', () => {
  it('riesce se il totale raggiunge la riuscita fissata', () => {
    // Oggi Intelligenza 23 (mod +4), liv. 4 → bonus 31: riesce già con 1
    expect(resolvePowerRoll({ ...rubaTempo, bonus: 31 }, 1)).toBe('success')
    // Con bonus 24 serve un d20 ≥ 6
    expect(resolvePowerRoll({ ...rubaTempo, bonus: 24 }, 6)).toBe('success')
    expect(resolvePowerRoll({ ...rubaTempo, bonus: 24 }, 5)).toBe('pending')
  })

  it('ritiro ≤ 2 × livello riesce, oltre fallisce davvero', () => {
    expect(resolvePowerRoll({ ...rubaTempo, bonus: 24 }, 3, 8)).toBe('saved')
    expect(resolvePowerRoll({ ...rubaTempo, bonus: 24 }, 3, 9)).toBe('failed')
    expect(rerollSafeThreshold(4, false)).toBe(8)
  })

  it('al massimo si salva fino a 19, un 20 al ritiro fallisce sempre', () => {
    expect(resolvePowerRoll({ ...rubaTempo, isMaxed: true }, 1, 19)).toBe('saved')
    expect(resolvePowerRoll({ ...rubaTempo, isMaxed: true }, 1, 20)).toBe('failed')
  })

  it('livello 0 o NA: il ritiro fallisce comunque', () => {
    expect(resolvePowerRoll({ target: 43, level: 0, isMaxed: false, bonus: 23 }, 12, 1)).toBe('failed')
    expect(resolvePowerRoll({ target: 40, level: null, isMaxed: false, bonus: 23 }, 2, 1)).toBe('failed')
  })
})

describe('riuscita fissata dal Master', () => {
  it('riuscita = dado + caratteristica + modificatore + livello del momento (foglio "Dadi riuscita")', () => {
    // Corrosione: liv. 0, Intelligenza 20 (mod +3), dado 20 → 43
    expect(powerSuccessTarget(20, rollBonus(20, 0))).toBe(43)
    // Distruggere non morto minore: liv. 1, dado 8 → 32
    expect(powerSuccessTarget(8, rollBonus(20, 1))).toBe(32)
  })

  it('a livello 0 il dado è sempre 20; altrimenti lo sceglie il Master', () => {
    expect(forcedSuccessDie(0)).toBe(20)
    expect(forcedSuccessDie(1)).toBeNull()
    expect(forcedSuccessDie(null)).toBeNull()
  })

  it('alzando la caratteristica dopo, il potere riesce più facilmente', () => {
    // Corrosione fissata a 43 con Intelligenza 20: con 23 (bonus 27) basta un 16
    expect(resolvePowerRoll({ target: 43, level: 0, isMaxed: false, bonus: rollBonus(23, 0) }, 16)).toBe('success')
    expect(resolvePowerRoll({ target: 43, level: 0, isMaxed: false, bonus: rollBonus(23, 0) }, 15)).toBe('pending')
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
})
