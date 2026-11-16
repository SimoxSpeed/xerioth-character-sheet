import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './NumberField.module.less'

interface TextFieldProps {
  value: string
  onCommit: (value: string) => void
  label: string
  placeholder?: string
  disabled?: boolean
}

/** Testo breve modificabile "in linea" (Invio/uscita salva, Esc annulla). */
export function TextField({ value, onCommit, label, placeholder = '—', disabled }: TextFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) onCommit(trimmed)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.input}
        // Largo quanto il testo (come i numeri), senza spingere a capo il resto della riga
        style={{ width: `${Math.max(draft.length, 3) + 1}ch`, maxWidth: '100%', textAlign: 'left' }}
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <button
      type="button"
      className={styles.display}
      style={{ textAlign: 'left' }}
      onClick={() => {
        if (disabled) return
        setDraft(value)
        setEditing(true)
      }}
      title={`${label} — clic per modificare`}
      disabled={disabled}
    >
      {value || <span className="muted">{placeholder}</span>}
    </button>
  )
}
