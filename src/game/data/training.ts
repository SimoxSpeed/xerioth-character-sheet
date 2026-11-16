// Allenamento — fonte: Xerioth Master › Avanzamenti (docs/01-regole-di-gioco.md §6)

import type { AttributeKey } from './attributes'

export type Discipline = 'mental' | 'physical'

export interface SupportSkill {
  /** Chiave della capacità (skill_key nella scheda). */
  key: string
  name: string
  disciplines: Discipline[]
  /** Caratteristiche tra cui si prende la più alta per il booster (a livello 4). */
  boosterFrom: AttributeKey[]
}

export const SUPPORT_SKILLS: readonly SupportSkill[] = [
  { key: 'studio', name: 'Studio', disciplines: ['mental'], boosterFrom: ['intelligenza', 'fascino'] },
  { key: 'concentrazione', name: 'Concentrazione', disciplines: ['mental'], boosterFrom: ['intelligenza', 'fascino'] },
  { key: 'destrezza', name: 'Destrezza', disciplines: ['physical'], boosterFrom: ['riflessi', 'costituzione', 'abilita'] },
  {
    key: 'resistenza_fatica',
    name: 'Resistenza alla Fatica',
    disciplines: ['physical'],
    boosterFrom: ['riflessi', 'costituzione', 'abilita'],
  },
  {
    key: 'resilienza',
    name: 'Resilienza',
    disciplines: ['mental', 'physical'],
    boosterFrom: ['abilita', 'costituzione', 'intelligenza', 'riflessi', 'fascino'], // tutte tranne Freddezza
  },
]

/** Punti giornalieri dati da una capacità di supporto, per livello (0–4). */
export const SUPPORT_POINTS_BY_LEVEL = [0, 1, 1, 2, 4] as const

/** Punti giornalieri del maestro, per livello (0 = nessun maestro). */
export const MASTER_POINTS_BY_LEVEL = [0, 2, 5, 10, 15] as const

export const BASE_DAILY_POINTS = 2
