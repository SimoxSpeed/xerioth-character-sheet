// Verifiche con i numeri reali della scheda di Omnia Tenem e del foglio "Xerioth Master".
import { describe, expect, it } from 'vitest'
import {
  attributeCostToReach,
  attributeModifier,
  attributeNextCost,
  availableUnlocks,
  boosterMultiplier,
  castCost,
  cumulativeXpForLevel,
  currentHp,
  dailyTrainingPoints,
  daysToComplete,
  experienceStatus,
  manaPoints,
  maxHp,
  quickCastPercent,
  rollDie,
  skillCumulativeCost,
  skillNextCost,
} from './index'

describe('caratteristiche', () => {
  it('modificatore come nella scheda di Omnia', () => {
    expect(attributeModifier(23)).toBe(4) // Intelligenza
    expect(attributeModifier(18)).toBe(2) // Riflessi
    expect(attributeModifier(15)).toBe(1) // Abilità
    expect(attributeModifier(14)).toBe(1) // Freddezza
    expect(attributeModifier(13)).toBe(1) // Costituzione
    expect(attributeModifier(11)).toBe(0) // Fascino
  })

  it('modificatore ai bordi della tabella del Master', () => {
    expect(attributeModifier(5)).toBe(0) // sotto 9 → 0
    expect(attributeModifier(12)).toBe(0)
    expect(attributeModifier(46)).toBe(12)
    expect(attributeModifier(48)).toBe(12)
  })

  it('booster', () => {
    expect(boosterMultiplier(0)).toBe(1)
    expect(boosterMultiplier(1)).toBe(1)
    expect(boosterMultiplier(2)).toBe(2)
    expect(boosterMultiplier(5)).toBe(3)
    expect(boosterMultiplier(9)).toBe(3)
    expect(boosterMultiplier(10)).toBe(4)
  })

  it('costo per arrivare al valore N', () => {
    expect(attributeCostToReach('intelligenza', 24)).toBe(1230)
    expect(attributeCostToReach('abilita', 16)).toBe(605)
    expect(attributeNextCost('intelligenza', 23)).toBe(1230)
    expect(attributeNextCost('riflessi', 30)).toBeNull() // fuori tabella
  })
})

describe('punti ferita', () => {
  it('Omnia: (13 + 1 + 0) × 7 + 100 = 198; 198 − 44 = 154', () => {
    const max = maxHp({ costituzione: 13, forzaLevel: 0, raceKey: 'umano', hpBonus: 100 })
    expect(max).toBe(198)
    expect(currentHp(198, 0, 44)).toBe(154)
  })

  it('esempio del foglio del Master: (16 + 2 + 9) × 7 = 189', () => {
    expect(maxHp({ costituzione: 16, forzaLevel: 9, raceKey: 'umano', hpBonus: 0 })).toBe(189)
  })

  it('razza senza coefficiente → null', () => {
    expect(maxHp({ costituzione: 13, forzaLevel: 0, raceKey: 'mezzelfo', hpBonus: 0 })).toBeNull()
  })
})

describe('capacità e incantesimi', () => {
  it('Teologia liv. 9: successivo 1180, somma 4050', () => {
    expect(skillNextCost(9)).toBe(1180)
    expect(skillCumulativeCost(9)).toBe(4050)
  })

  it('Spada liv. 1: successivo 100, somma 110', () => {
    expect(skillNextCost(1)).toBe(100)
    expect(skillCumulativeCost(1)).toBe(110)
  })

  it('non appresa (NA): il livello 0 costa 35', () => {
    expect(skillNextCost(null)).toBe(35)
    expect(skillCumulativeCost(null)).toBe(0)
  })

  it('al massimo: nessun costo successivo', () => {
    expect(skillNextCost(4, true)).toBeNull()
  })
})

describe('esperienza', () => {
  it('Omnia: 48.258 totali al livello 23 → 6.858 nel livello', () => {
    expect(cumulativeXpForLevel(23)).toBe(41400)
    const status = experienceStatus(48258, 23)
    expect(status.inLevel).toBe(6858)
    expect(status.nextLevelCost).toBe(3000)
    expect(status.canLevelUp).toBe(true)
  })
})

describe('mana', () => {
  it('esempio del foglio: 21 + 9 + 33 + 296 + 64 = 423', () => {
    expect(manaPoints({ intelligenza: 21, spellCount: 11, spellLevelSum: 28, casterLevel: 8 })).toBe(423)
  })

  it('costo di lancio: acquisizione 3, livello attuale 2 → 25', () => {
    expect(castCost(2, 3)).toBe(25)
    expect(castCost(0, 1)).toBe(5)
    expect(castCost(10, 10)).toBe(500)
    expect(castCost(null, 3)).toBeNull()
  })

  it('Lancio Rapido: 30% + 5% per livello oltre il primo', () => {
    expect(quickCastPercent(1)).toBe(30)
    expect(quickCastPercent(3)).toBe(40)
    expect(quickCastPercent(null)).toBe(0)
  })
})

describe('allenamento', () => {
  it('esempio del foglio del Master: 23 punti al giorno', () => {
    // Studio 4, Concentrazione 4, Resilienza 4, maestro liv. 2, caratteristica 15 (mod 1).
    const attributes = {
      abilita: 15,
      costituzione: 13,
      intelligenza: 15,
      riflessi: 13,
      freddezza: 13,
      fascino: 13,
    }
    const result = dailyTrainingPoints({
      trainedAttribute: 'intelligenza',
      attributes,
      supportLevels: { studio: 4, concentrazione: 4, resilienza: 4 },
      masterLevel: 2,
    })
    expect(result.total).toBe(23)
  })

  it('le capacità fisiche non contano per le discipline mentali', () => {
    const attributes = { abilita: 10, costituzione: 10, intelligenza: 10, riflessi: 10, freddezza: 10, fascino: 10 }
    const result = dailyTrainingPoints({
      trainedAttribute: 'intelligenza',
      attributes,
      supportLevels: { destrezza: 4, resistenza_fatica: 4 },
    })
    expect(result.total).toBe(2)
  })

  it('giorni stimati', () => {
    expect(daysToComplete(520 - 483, 23)).toBe(2) // Ubiquità di Omnia
    expect(daysToComplete(10, 0)).toBeNull()
  })

  it('sblocco automatico delle capacità di supporto', () => {
    const attributes = { abilita: 15, costituzione: 13, intelligenza: 23, riflessi: 18, freddezza: 14, fascino: 11 }
    expect(availableUnlocks({ characterLevel: 23, attributes, skillLevels: {} })).toEqual([
      'concentrazione',
      'destrezza',
      'resistenza_fatica',
    ])
    expect(
      availableUnlocks({
        characterLevel: 23,
        attributes,
        skillLevels: { concentrazione: 4, destrezza: 4, resistenza_fatica: 4 },
      }),
    ).toEqual(['resilienza'])
  })
})

describe('tiri', () => {
  it('i dadi restano nei limiti', () => {
    expect(rollDie('d20', () => 0)).toBe(1)
    expect(rollDie('d20', () => 0.9999)).toBe(20)
    expect(rollDie('d4', () => 0.9999)).toBe(4)
    expect(rollDie('coin', () => 0.6)).toBe(2)
  })
})
