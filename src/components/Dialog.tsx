import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.less'
import { CloseIcon } from './icons'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Larghezza massima in px. */
  width?: number
}

/** Finestra modale basata su <dialog> (focus, Esc e sfondo gestiti dal browser). */
export function Dialog({ open, onClose, title, children, width = 720 }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      style={{ maxWidth: width }}
      onClose={onClose}
      onClick={(e) => {
        // clic sullo sfondo (fuori dal contenuto) chiude
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="dialog-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Chiudi">
            <CloseIcon aria-hidden />
          </button>
        </header>
        <div className={styles.body}>{open && children}</div>
      </div>
    </dialog>
  )
}
