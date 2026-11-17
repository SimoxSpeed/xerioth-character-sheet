import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Dialog } from '../../components/Dialog'
import { ForwardIcon } from '../../components/icons'
import { openEdits, useMasterEdits } from './api'
import { EditCancelled, ReasonGateContext, type EditPreview, type ReasonGate } from './gate'
import styles from './ReasonGateProvider.module.less'

interface ReasonRequest {
  id: number
  prefill: string
  changes: EditPreview[]
  resolve: (reason: string | null) => void
  reject: (error: Error) => void
}

/**
 * Sulla scheda di un giocatore aperta dal Master, ogni salvataggio chiede prima la motivazione
 * (facoltativa). Se lo stesso valore ha già una modifica segnalata, la motivazione è già compilata.
 */
export function ReasonGateProvider({
  characterId,
  enabled,
  children,
}: {
  characterId: string
  enabled: boolean
  children: ReactNode
}) {
  const { data: edits } = useMasterEdits(characterId)
  const editsRef = useRef(edits)
  editsRef.current = edits

  // Una richiesta alla volta; le altre aspettano in coda
  const [current, setCurrent] = useState<ReasonRequest | null>(null)
  const currentRef = useRef<ReasonRequest | null>(null)
  const queue = useRef<ReasonRequest[]>([])
  const nextId = useRef(0)

  const show = useCallback((request: ReasonRequest | null) => {
    currentRef.current = request
    setCurrent(request)
  }, [])

  const gate = useCallback<ReasonGate>(
    ({ filters, changes }) => {
      // Nessun valore cambia davvero: niente da registrare, niente da chiedere
      if (!enabled || changes.length === 0) return Promise.resolve(null)
      return new Promise<string | null>((resolve, reject) => {
        const previous = openEdits(editsRef.current, filters).find((e) => e.action === 'update' && e.reason)
        const request = { id: nextId.current++, prefill: previous?.reason ?? '', changes, resolve, reject }
        if (currentRef.current) queue.current.push(request)
        else show(request)
      })
    },
    [enabled, show],
  )

  function finish(reason: string | null | undefined) {
    const request = currentRef.current
    if (!request) return
    if (reason === undefined) request.reject(new EditCancelled())
    else request.resolve(reason)
    show(queue.current.shift() ?? null)
  }

  return (
    <ReasonGateContext.Provider value={gate}>
      {children}
      {enabled && (
        <Dialog open={current !== null} onClose={() => finish(undefined)} title="Motivazione" width={420}>
          {current && (
            <ReasonForm
              key={current.id}
              prefill={current.prefill}
              changes={current.changes}
              onSave={finish}
              onCancel={() => finish(undefined)}
            />
          )}
        </Dialog>
      )}
    </ReasonGateContext.Provider>
  )
}

function ReasonForm({
  prefill,
  changes,
  onSave,
  onCancel,
}: {
  prefill: string
  changes: EditPreview[]
  onSave: (reason: string | null) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState(prefill)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSave(reason.trim() || null)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Cosa cambia: elemento · campo, prima → dopo */}
      <ul className={styles.changes}>
        {changes.map((c, i) => (
          <li key={i}>
            <span className={styles.what}>
              {c.target && <strong>{c.target}</strong>}
              {c.target && ' · '}
              {c.field}
            </span>
            {(c.before !== null || c.after !== null) && (
              <span className={styles.change}>
                <span className={styles.before}>{c.before}</span>
                <ForwardIcon aria-label="diventa" />
                <span className={styles.after}>{c.after}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <textarea
        className="textarea"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Motivazione"
        data-autofocus
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            onSave(reason.trim() || null)
          }
        }}
      />
      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn btn--primary">
          Salva
        </button>
      </div>
    </form>
  )
}
