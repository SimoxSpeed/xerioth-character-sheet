import { useState, type CSSProperties, type FormEvent } from 'react'
import type { experienceStatus } from '../../../game/rules'
import { Dialog } from '../../../components/Dialog'
import { NumberField } from '../../../components/NumberField'
import { ProgressBar } from '../../../components/ProgressBar'
import { AddIcon, HpIcon, LevelIcon, MinusIcon, XpIcon, type LucideIcon } from '../../../components/icons'
import type { CharacterSheet } from '../api'
import styles from './VitalDialogs.module.less'

const fmt = (n: number) => n.toLocaleString('it-IT')

/**
 * Campo "quanto" con due pulsanti grandi (Togli / Aggiungi, Danno / Cura…).
 * Invio = pulsante a destra.
 */
function AmountPad({
  minus,
  plus,
  onApply,
  autoFocus = true,
}: {
  minus: { label: string; tone?: string }
  plus: { label: string; tone?: string }
  onApply: (sign: 1 | -1, amount: number) => void
  autoFocus?: boolean
}) {
  const [amount, setAmount] = useState('')
  const n = Math.abs(Math.round(Number(amount.replace(/\./g, '').replace(',', '.'))))
  const valid = Number.isFinite(n) && n > 0

  function apply(sign: 1 | -1) {
    if (!valid) return
    onApply(sign, n)
    setAmount('')
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    apply(1)
  }

  return (
    <form className={styles.pad} onSubmit={onSubmit}>
      <button
        type="button"
        className={styles.padMinus}
        style={{ '--tone': minus.tone ?? 'var(--danger)' } as CSSProperties}
        disabled={!valid}
        onClick={() => apply(-1)}
      >
        <MinusIcon aria-hidden /> {minus.label}
      </button>
      <input
        className={styles.padInput}
        inputMode="numeric"
        placeholder="0"
        aria-label="Quantità"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus={autoFocus}
      />
      <button
        type="submit"
        className={styles.padPlus}
        style={{ '--tone': plus.tone ?? 'var(--success)' } as CSSProperties}
        disabled={!valid}
      >
        <AddIcon aria-hidden /> {plus.label}
      </button>
    </form>
  )
}

export function HpDialog({
  open,
  onClose,
  sheet,
  hp,
  hpMax,
  onChange,
  onSet,
}: {
  open: boolean
  onClose: () => void
  sheet: CharacterSheet
  hp: number
  hpMax: number | null
  onChange: (kind: 'damage' | 'heal', amount: number) => void
  onSet: (patch: Partial<Pick<CharacterSheet, 'damage_taken' | 'temp_hp' | 'hp_bonus'>>) => void
}) {
  const max = hpMax ?? 0
  return (
    <Dialog open={open} onClose={onClose} title="Punti Ferita" width={440}>
      <div className={styles.body} style={{ '--tone': 'var(--c-hp)' } as CSSProperties}>
        <div className={styles.big}>
          <HpIcon aria-hidden className={styles.bigIcon} />
          <strong className={hp <= 0 ? styles.down : undefined}>{fmt(hp)}</strong>
          <small>/ {fmt(max)}</small>
          {sheet.temp_hp > 0 && <span className={styles.temp}>+{fmt(sheet.temp_hp)}</span>}
        </div>
        <ProgressBar label="Punti ferita" value={Math.max(0, hp)} max={max + sheet.temp_hp} tone="hp" />

        <AmountPad
          minus={{ label: 'Danno', tone: 'var(--c-hp)' }}
          plus={{ label: 'Cura', tone: 'var(--success)' }}
          onApply={(sign, amount) => onChange(sign < 0 ? 'damage' : 'heal', amount)}
        />

        <dl className={styles.parts}>
          <div>
            <dt>Danni</dt>
            <dd>
              <NumberField label="Danni ricevuti" value={sheet.damage_taken} min={0} onCommit={(v) => onSet({ damage_taken: v ?? 0 })} />
            </dd>
          </div>
          <div>
            <dt>Temporanei</dt>
            <dd>
              <NumberField label="PF temporanei" value={sheet.temp_hp} min={0} onCommit={(v) => onSet({ temp_hp: v ?? 0 })} />
            </dd>
          </div>
          <div>
            <dt>Bonus</dt>
            <dd>
              <NumberField label="Bonus PF da oggetti" value={sheet.hp_bonus} onCommit={(v) => onSet({ hp_bonus: v ?? 0 })} />
            </dd>
          </div>
        </dl>
      </div>
    </Dialog>
  )
}

/** Contatore generico: Follia, Fato, monete d'oro, risorse di classe. */
export function CounterDialog({
  open,
  onClose,
  title,
  icon: Icon,
  color,
  value,
  onSet,
  max,
  maxPlaceholder,
  onSetMax,
  steppers = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  icon: LucideIcon
  color: string
  value: number
  onSet: (value: number) => void
  /** Massimo scritto (null = non scritto). Solo per le risorse. */
  max?: number | null
  maxPlaceholder?: string
  onSetMax?: (value: number | null) => void
  /** − / + di una unità. */
  steppers?: boolean
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} width={420}>
      <div className={styles.body} style={{ '--tone': color } as CSSProperties}>
        <div className={styles.big}>
          {steppers && (
            <button type="button" className={styles.step} onClick={() => onSet(value - 1)} disabled={value <= 0} aria-label={`Diminuisci ${title}`}>
              <MinusIcon aria-hidden />
            </button>
          )}
          <Icon aria-hidden className={styles.bigIcon} />
          <strong>
            <NumberField label={title} value={value} min={0} onCommit={(v) => onSet(v ?? 0)} />
          </strong>
          {onSetMax && (
            <small>
              /{' '}
              <NumberField label={`${title} massimi`} value={max ?? null} nullable placeholder={maxPlaceholder ?? '—'} onCommit={onSetMax} />
            </small>
          )}
          {steppers && (
            <button type="button" className={styles.step} onClick={() => onSet(value + 1)} aria-label={`Aumenta ${title}`}>
              <AddIcon aria-hidden />
            </button>
          )}
        </div>
        {onSetMax && (max ?? Number(maxPlaceholder)) > 0 && (
          <ProgressBar label={title} value={value} max={max ?? Number(maxPlaceholder)} tone="custom" />
        )}
        <AmountPad
          minus={{ label: 'Togli' }}
          plus={{ label: 'Aggiungi' }}
          autoFocus={!steppers || !!onSetMax}
          onApply={(sign, amount) => onSet(Math.max(0, value + sign * amount))}
        />
      </div>
    </Dialog>
  )
}

export function XpDialog({
  open,
  onClose,
  level,
  status,
  onLevel,
  onXp,
}: {
  open: boolean
  onClose: () => void
  level: number
  status: ReturnType<typeof experienceStatus>
  onLevel: (level: number) => void
  onXp: (delta: number) => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Livello ed esperienza" width={440}>
      <div className={styles.body} style={{ '--tone': 'var(--c-xp)' } as CSSProperties}>
        <div className={styles.big}>
          <button type="button" className={styles.step} onClick={() => onLevel(level - 1)} disabled={level <= 0} aria-label="Diminuisci livello">
            <MinusIcon aria-hidden />
          </button>
          <LevelIcon aria-hidden className={styles.bigIcon} />
          <small>Liv.</small>
          <strong>{level}</strong>
          <button type="button" className={styles.step} onClick={() => onLevel(level + 1)} aria-label="Aumenta livello">
            <AddIcon aria-hidden />
          </button>
        </div>
        {status.canLevelUp && <p className={styles.levelUp}>Livello!</p>}

        <div className={styles.xpLine}>
          <XpIcon aria-hidden />
          <strong>{fmt(status.inLevel)}</strong>
          <small>/ {fmt(status.nextLevelCost)}</small>
        </div>
        <ProgressBar label="Esperienza del livello" value={status.inLevel} max={status.nextLevelCost} tone="xp" />

        <AmountPad minus={{ label: 'Togli' }} plus={{ label: 'Aggiungi' }} onApply={(sign, amount) => onXp(sign * amount)} />
      </div>
    </Dialog>
  )
}
