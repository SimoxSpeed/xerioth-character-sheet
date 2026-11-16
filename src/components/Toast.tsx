import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CloseIcon, UndoIcon } from './icons'
import styles from './Toast.module.less'

interface ToastInput {
  message: string
  /** Se presente, il messaggio mostra "Annulla". */
  undo?: () => void
}

interface ToastItem extends ToastInput {
  id: number
}

const ToastContext = createContext<(toast: ToastInput) => void>(() => {})

/** Mostra un messaggio breve in basso, con "Annulla" opzionale. */
export function useToast() {
  return useContext(ToastContext)
}

const DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null)
  const nextId = useRef(1)

  const show = useCallback((input: ToastInput) => {
    setToast({ ...input, id: nextId.current++ })
  }, [])
  const dismiss = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} aria-live="polite">
        {toast && <Toast key={toast.id} toast={toast} onDone={dismiss} />}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, DURATION)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div className={styles.toast} role="status">
      <span className={styles.message}>{toast.message}</span>
      {toast.undo && (
        <button
          type="button"
          className={styles.undo}
          onClick={() => {
            toast.undo?.()
            onDone()
          }}
        >
          <UndoIcon aria-hidden /> Annulla
        </button>
      )}
      <button type="button" className={styles.close} onClick={onDone} aria-label="Chiudi">
        <CloseIcon aria-hidden />
      </button>
    </div>
  )
}
