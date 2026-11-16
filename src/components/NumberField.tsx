import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './NumberField.module.less'

interface NumberFieldProps {
  value: number | null
  onCommit: (value: number | null) => void
  /** Etichetta per screen reader / tooltip. */
  label: string
  min?: number
  max?: number
  /** Consente di svuotare il campo (→ null). */
  nullable?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Numero modificabile "in linea": si mostra come testo, al clic diventa un campo.
 * Invio o uscita dal campo salvano; Esc annulla.
 */
export function NumberField({
  value,
  onCommit,
  label,
  min,
  max,
  nullable = false,
  placeholder = '—',
  className,
  disabled,
}: NumberFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function start() {
    if (disabled) return
    setDraft(value === null ? '' : String(value))
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === '') {
      if (nullable && value !== null) onCommit(null)
      return
    }
    let parsed = Number(trimmed.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(parsed)) return
    parsed = Math.round(parsed)
    if (min !== undefined) parsed = Math.max(min, parsed)
    if (max !== undefined) parsed = Math.min(max, parsed)
    if (parsed !== value) onCommit(parsed)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`${styles.input} ${className ?? ''}`}
        inputMode="numeric"
        aria-label={label}
        value={draft}
        style={{ width: `${Math.max(draft.length, 1) + 0.5}ch` }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <button
      type="button"
      className={`${styles.display} ${className ?? ''}`}
      onClick={start}
      title={disabled ? label : `${label} — clic per modificare`}
      aria-label={`${label}: ${value ?? placeholder}`}
      disabled={disabled}
    >
      {value === null ? placeholder : value.toLocaleString('it-IT')}
    </button>
  )
}
