import { useState, type ReactNode, type SyntheticEvent } from 'react'
import { AdjustForm } from '../../../components/AdvancementControl'
import { ProgressBar } from '../../../components/ProgressBar'
import styles from './SheetBits.module.less'

const stop = (event: SyntheticEvent) => event.stopPropagation()

/**
 * Contenitore per i campi modificabili dentro una riga "tirabile":
 * il clic modifica il valore, non fa partire il tiro.
 */
export function NoRoll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={className} onClick={stop} onPointerDown={stop} onContextMenu={stop} onKeyDown={stop}>
      {children}
    </span>
  )
}

/**
 * Avanzamento: linea sottile con i punti piccoli. Un clic sui punti apre il campo
 * per aggiungere o togliere punti (la scheda è sempre modificabile).
 */
export function ProgressLine({
  name,
  value,
  max,
  onChange,
  suggested,
}: {
  name: string
  value: number
  max: number | null
  onChange: (value: number) => void
  suggested?: number
}) {
  const [adjusting, setAdjusting] = useState(false)

  return (
    // Solo i punti (e il campo per aggiungerli) non tirano: la barra fa parte della riga
    <span className={styles.line}>
      <ProgressBar label={`Avanzamento ${name}`} value={value} max={max} />
      <NoRoll className={styles.pointsArea}>
        {adjusting ? (
          <AdjustForm
            name={name}
            suggested={suggested}
            onApply={(delta) => onChange(Math.max(0, value + delta))}
            onClose={() => setAdjusting(false)}
          />
        ) : (
          <button
            type="button"
            className={styles.points}
            onClick={() => setAdjusting(true)}
            title="Aggiungi o togli punti"
            aria-label={`Avanzamento ${name}: ${value} su ${max ?? '—'}. Aggiungi o togli punti`}
          >
            {value.toLocaleString('it-IT')} / {max?.toLocaleString('it-IT') ?? '—'}
          </button>
        )}
      </NoRoll>
    </span>
  )
}
