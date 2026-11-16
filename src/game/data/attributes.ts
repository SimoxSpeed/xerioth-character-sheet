// Caratteristiche — fonte: Xerioth Master › Avanzamenti (docs/01-regole-di-gioco.md §1)

export const ATTRIBUTE_KEYS = [
  'abilita',
  'costituzione',
  'intelligenza',
  'riflessi',
  'freddezza',
  'fascino',
] as const

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number]

export const ATTRIBUTES: Record<AttributeKey, { label: string; short: string; discipline: 'mental' | 'physical' }> = {
  abilita: { label: 'Abilità', short: 'ABI', discipline: 'physical' },
  costituzione: { label: 'Costituzione', short: 'COS', discipline: 'physical' },
  intelligenza: { label: 'Intelligenza', short: 'INT', discipline: 'mental' },
  riflessi: { label: 'Riflessi', short: 'RIF', discipline: 'physical' },
  freddezza: { label: 'Freddezza', short: 'FRE', discipline: 'mental' },
  fascino: { label: 'Fascino', short: 'FAS', discipline: 'mental' },
}

/** Moltiplicatore booster indicizzato per modificatore (0–12). */
export const BOOSTER_BY_MODIFIER = [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4] as const

/** Punti per ARRIVARE al valore N (chiave = N), per caratteristica. Valori 4–30. */
export const ATTRIBUTE_COSTS: Record<AttributeKey, Readonly<Record<number, number>>> = buildAttributeCosts([
  // N,  Abilità, Costituzione, Fascino, Freddezza, Intelligenza, Riflessi
  [4, 60, 30, 30, 20, 50, 75],
  [5, 90, 45, 45, 45, 75, 110],
  [6, 120, 60, 60, 70, 100, 145],
  [7, 150, 75, 75, 85, 125, 180],
  [8, 185, 95, 95, 100, 150, 220],
  [9, 220, 120, 120, 120, 175, 260],
  [10, 260, 145, 145, 145, 210, 305],
  [11, 300, 170, 170, 170, 245, 350],
  [12, 350, 205, 205, 205, 290, 405],
  [13, 400, 240, 240, 240, 335, 460],
  [14, 450, 275, 275, 275, 380, 515],
  [15, 500, 310, 310, 310, 425, 570],
  [16, 605, 345, 345, 345, 470, 625],
  [17, 660, 390, 390, 380, 525, 690],
  [18, 725, 445, 445, 420, 590, 765],
  [19, 800, 520, 520, 460, 675, 840],
  [20, 870, 595, 595, 500, 930, 915],
  [21, 940, 670, 670, 540, 1015, 990],
  [22, 1010, 745, 745, 590, 1070, 1070],
  [23, 1080, 825, 825, 640, 1150, 1150],
  [24, 1160, 905, 905, 690, 1230, 1230],
  [25, 1240, 985, 985, 740, 1310, 1310],
  [26, 1320, 1065, 1065, 790, 1390, 1395],
  [27, 1400, 1145, 1145, 840, 1475, 1480],
  [28, 1490, 1225, 1225, 900, 1560, 1565],
  [29, 1580, 1310, 1310, 960, 1645, 1655],
  [30, 1670, 1395, 1395, 1020, 1735, 1745],
])

function buildAttributeCosts(rows: number[][]): Record<AttributeKey, Record<number, number>> {
  // Ordine delle colonne nel foglio del Master.
  const columns: AttributeKey[] = ['abilita', 'costituzione', 'fascino', 'freddezza', 'intelligenza', 'riflessi']
  const result = Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, {}])) as Record<AttributeKey, Record<number, number>>
  for (const [n, ...costs] of rows) {
    columns.forEach((key, i) => {
      result[key][n!] = costs[i]!
    })
  }
  return result
}
