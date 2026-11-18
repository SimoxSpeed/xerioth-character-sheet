// Catalogo caricato. CatalogGate lo imposta prima di mostrare l'app, quindi dentro l'app
// c'è sempre: le funzioni di etichetta (labels.ts…) lo leggono senza passarlo a mano.
import { createContext, useContext } from 'react'
import type { Catalog } from '../../game/catalog'

let current: Catalog | null = null

export function setCatalog(catalog: Catalog) {
  current = catalog
}

/** Il catalogo caricato. Fuori da CatalogGate è un errore di programmazione. */
export function getCatalog(): Catalog {
  if (!current) throw new Error('Catalogo non ancora caricato')
  return current
}

export const CatalogContext = createContext<Catalog | null>(null)

/** Il catalogo per i componenti (dentro CatalogGate). */
export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext)
  if (!catalog) throw new Error('useCatalog fuori da CatalogGate')
  return catalog
}
