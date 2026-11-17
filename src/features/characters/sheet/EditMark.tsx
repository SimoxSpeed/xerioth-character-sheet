import { useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '../../../components/Dialog'
import { EditMarkIcon } from '../../../components/icons'
import { formatDateTime } from '../../../lib/format'
import { openEdits, useDismissMasterEdits, useMasterEdits, type EditFilter } from '../../masterEdits/api'
import { editChange, editFieldName, editTargetName } from '../../masterEdits/labels'
import { useIsOwner } from './sheetContext'
import styles from './EditMark.module.less'

const stop = (event: SyntheticEvent) => event.stopPropagation()

/**
 * Segno rosso accanto a un valore cambiato dal Master, finché il giocatore non lo toglie.
 * Lo vede solo il proprietario. Un clic mostra cosa è cambiato e perché.
 */
export function EditMark({ characterId, filters }: { characterId: string; filters: readonly EditFilter[] }) {
  const isOwner = useIsOwner()
  const { data: edits } = useMasterEdits(characterId)
  const dismiss = useDismissMasterEdits(characterId)
  const [open, setOpen] = useState(false)

  const pending = isOwner ? openEdits(edits, filters) : []
  if (pending.length === 0 && !open) return null

  function show(event: SyntheticEvent) {
    event.stopPropagation()
    event.preventDefault()
    setOpen(true)
  }

  return (
    // Il segno sta dentro righe e riquadri cliccabili: i suoi eventi non devono arrivare a loro
    <span className={styles.wrap} onClick={stop} onPointerDown={stop} onKeyDown={stop} onContextMenu={stop}>
      {pending.length > 0 && (
        <span
          role="button"
          tabIndex={0}
          className={styles.mark}
          aria-label="Modificato dal Master"
          title="Modificato dal Master"
          onClick={show}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') show(e)
          }}
        >
          <EditMarkIcon aria-hidden />
        </span>
      )}
      {createPortal(
        <span onClick={stop} onPointerDown={stop} onKeyDown={stop} onContextMenu={stop}>
          <Dialog open={open} onClose={() => setOpen(false)} title="Modificato dal Master" width={440}>
            <ul className={styles.list}>
              {pending.map((edit) => {
                const change = editChange(edit)
                return (
                  <li key={edit.id} className={styles.item}>
                    <span className={styles.what}>
                      <strong>{editTargetName(edit)}</strong> · {editFieldName(edit)}
                    </span>
                    {change && <span className={styles.change}>{change}</span>}
                    {edit.reason && <p className={styles.reason}>{edit.reason}</p>}
                    <span className={styles.meta}>
                      {edit.editor?.display_name ?? 'Master'} · {formatDateTime(edit.updated_at)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className={styles.actions}>
              <button
                className="btn btn--primary"
                onClick={() => {
                  dismiss.mutate(pending.map((e) => e.id))
                  setOpen(false)
                }}
              >
                Togli
              </button>
            </div>
          </Dialog>
        </span>,
        document.body,
      )}
    </span>
  )
}
