import type { LucideIcon } from './icons'
import { AddIcon, MinusIcon } from './icons'
import { NumberField } from './NumberField'
import styles from './Stepper.module.less'

interface StepperProps {
  label: string
  icon?: LucideIcon
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

/** Contatore con − / + e valore modificabile (Punti Follia, Punti Fato, …). */
export function Stepper({ label, icon: Icon, value, onChange, min = 0, max }: StepperProps) {
  return (
    <div className={styles.stepper}>
      <span className={styles.label}>
        {Icon && <Icon aria-hidden />} {label}
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          aria-label={`Diminuisci ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <MinusIcon aria-hidden />
        </button>
        <NumberField
          label={label}
          value={value}
          min={min}
          max={max}
          onCommit={(v) => onChange(v ?? min)}
          className={styles.value}
        />
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          aria-label={`Aumenta ${label}`}
          onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
          disabled={max !== undefined && value >= max}
        >
          <AddIcon aria-hidden />
        </button>
      </div>
    </div>
  )
}
