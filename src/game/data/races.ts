// Razze — fonti: Omnia › Razze e Classi; Xerioth Master › Avanzamenti (coefficienti PF)

export interface Race {
  key: string
  name: string
  /** Coefficiente per il calcolo dei PF; null se non definito nel foglio del Master. */
  hpCoefficient: number | null
}

export const RACES: readonly Race[] = [
  { key: 'umano', name: 'Umano', hpCoefficient: 7 },
  { key: 'elfo_grigio', name: 'Elfo grigio', hpCoefficient: 6 },
  { key: 'elfo_bianco', name: 'Elfo bianco', hpCoefficient: 6 },
  { key: 'elfo_nero', name: 'Elfo nero', hpCoefficient: 6 },
  { key: 'elfo_oscuro', name: 'Elfo oscuro', hpCoefficient: 6 },
  { key: 'elfo_dei_deserti', name: 'Elfo dei deserti', hpCoefficient: 6 },
  { key: 'elfo_marino', name: 'Elfo marino', hpCoefficient: 6 },
  { key: 'mezzelfo', name: 'Mezzelfo', hpCoefficient: null },
  { key: 'nano', name: 'Nano', hpCoefficient: 8 },
  { key: 'minotauro', name: 'Minotauro', hpCoefficient: 9 },
  { key: 'orco', name: 'Orco', hpCoefficient: 9 },
  { key: 'mezzorco', name: 'Mezzorco', hpCoefficient: null },
  { key: 'halfling', name: 'Halfling', hpCoefficient: 6 },
  { key: 'vampiro', name: 'Vampiro di Morgoroth', hpCoefficient: 7 },
  { key: 'goblin', name: 'Goblin', hpCoefficient: 7 },
  { key: 'satiro', name: 'Satiro', hpCoefficient: 6 },
  { key: 'troll', name: 'Troll', hpCoefficient: 9 },
  { key: 'tiefling', name: 'Tiefling', hpCoefficient: 6 },
  { key: 'leodon', name: 'Leodon', hpCoefficient: 8 },
]

export function findRace(key: string | null | undefined): Race | undefined {
  return RACES.find((r) => r.key === key)
}
