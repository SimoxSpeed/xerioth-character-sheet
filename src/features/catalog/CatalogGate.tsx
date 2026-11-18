import type { ReactNode } from 'react'
import { useCatalogQuery } from './api'
import { CatalogContext, setCatalog } from './store'

/** Mostra l'app solo quando i cataloghi (razze, classi, capacità…) sono arrivati. */
export function CatalogGate({ children }: { children: ReactNode }) {
  const { data, error, refetch } = useCatalogQuery()

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p className="error-box">{error.message}</p>
        <button className="btn" onClick={() => refetch()}>
          Riprova
        </button>
      </div>
    )
  }
  if (!data) return <p className="muted" style={{ padding: 24 }}>Caricamento…</p>

  setCatalog(data)
  return <CatalogContext.Provider value={data}>{children}</CatalogContext.Provider>
}
