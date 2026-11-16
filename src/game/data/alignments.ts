// Allineamenti — fonte: Xerioth Master › Allineamenti.
// Le descrizioni complete andranno nel Compendio.

export interface Alignment {
  key: string
  code: string
  name: string
  archetype: string
}

export const ALIGNMENTS: readonly Alignment[] = [
  { key: 'legale_buono', code: 'LB', name: 'Legale Buono', archetype: 'il Crociato' },
  { key: 'neutrale_buono', code: 'NB', name: 'Neutrale Buono', archetype: 'il Benefattore' },
  { key: 'caotico_buono', code: 'CB', name: 'Caotico Buono', archetype: 'il Ribelle' },
  { key: 'legale_neutrale', code: 'LN', name: 'Legale Neutrale', archetype: 'il Giudice' },
  { key: 'neutrale_puro', code: 'N', name: 'Neutrale Puro', archetype: "l'Equilibrato" },
  { key: 'caotico_neutrale', code: 'CN', name: 'Caotico Neutrale', archetype: 'il Cinico' },
  { key: 'legale_malvagio', code: 'LM', name: 'Legale Malvagio', archetype: 'il Dominatore' },
  { key: 'neutrale_malvagio', code: 'NM', name: 'Neutrale Malvagio', archetype: "l'Opportunista" },
  { key: 'caotico_malvagio', code: 'CM', name: 'Caotico Malvagio', archetype: 'il Distruttore' },
]

export function findAlignment(key: string | null | undefined): Alignment | undefined {
  return ALIGNMENTS.find((a) => a.key === key)
}
