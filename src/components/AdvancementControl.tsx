import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { AddIcon, CloseIcon, MinusIcon } from './icons'
import { NumberField } from './NumberField'
import { ProgressBar } from './ProgressBar'
import styles from './AdvancementControl.module.less'

interface Props {
  /** Nome di ciò che avanza, per i testi accessibili. */
  name: string
  value: number
  /** Punti per il livello successivo (null = fuori tabella). */
  max: number | null
  isMaxed?: boolean
  onChange: (value: number) => void
  /** Proposta per il campo "quanti punti" (es. i punti di allenamento al giorno). */
  suggested?: number
}

/** Barra di avanzamento con il pulsante per aggiungere o togliere punti. */
export function AdvancementControl({ name, value, max, isMaxed = false, onChange, suggested }: Props) {
  const [adjusting, setAdjusting] = useState(false)

  return (
    <div className={styles.control}>
      <ProgressBar label={`Avanzamento ${name}`} value={value} max={isMaxed ? value || 1 : max} />
      {adjusting ? (
        <AdjustForm
          name={name}
          suggested={suggested}
          onApply={(delta) => onChange(Math.max(0, value + delta))}
          onClose={() => setAdjusting(false)}
        />
      ) : (
        <div className={styles.row}>
          <span className={styles.text}>
            <NumberField
              label={`Avanzamento ${name}`}
              value={value}
              min={0}
              onCommit={(v) => onChange(v ?? 0)}
              disabled={isMaxed}
            />
            {' / '}
            {isMaxed ? 'MAX' : (max?.toLocaleString('it-IT') ?? '—')}
          </span>
          {!isMaxed && <AdjustButton name={name} onClick={() => setAdjusting(true)} />}
        </div>
      )}
    </div>
  )
}

/** Pulsante +/− che apre il campo per aggiungere o togliere punti. */
export function AdjustButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`btn btn--ghost ${styles.adjustButton}`}
      onClick={onClick}
      title="Aggiungi o togli"
      aria-label={`Aggiungi o togli ${name}`}
    >
      <MinusIcon aria-hidden />
      <AddIcon aria-hidden />
    </button>
  )
}

/** Campo "quanti punti" con togli / aggiungi / annulla. `onApply` riceve la variazione con segno. */
export function AdjustForm({
  name,
  suggested,
  onApply,
  onClose,
}: {
  name: string
  suggested?: number
  onApply: (delta: number) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState(suggested ? String(suggested) : '')

  function apply(sign: 1 | -1) {
    const n = Math.abs(Math.round(Number(amount.replace(',', '.'))))
    if (!n) return
    onApply(sign * n)
    onClose()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    apply(1)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
    }
  }

  return (
    <form className={styles.adjust} onSubmit={onSubmit} onKeyDown={onKeyDown}>
      <input
        className={styles.amount}
        inputMode="numeric"
        placeholder={suggested ? String(suggested) : 'punti'}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label={`Punti da aggiungere o togliere a ${name}`}
        autoFocus
      />
      <button type="button" className="btn btn--ghost btn--square" onClick={() => apply(-1)} title="Togli" aria-label="Togli">
        <MinusIcon aria-hidden />
      </button>
      <button type="submit" className="btn btn--primary btn--square" title="Aggiungi" aria-label="Aggiungi">
        <AddIcon aria-hidden />
      </button>
      <button type="button" className="btn btn--ghost btn--square" onClick={onClose} title="Annulla" aria-label="Annulla">
        <CloseIcon aria-hidden />
      </button>
    </form>
  )
}
