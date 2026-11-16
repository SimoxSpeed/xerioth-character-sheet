import styles from './ProgressBar.module.less'

interface ProgressBarProps {
  value: number
  max: number | null
  /** Testo accessibile, es. "Avanzamento Intelligenza". */
  label: string
  tone?: 'accent' | 'hp' | 'info' | 'xp' | 'custom'
  /** Testo mostrato al passaggio del mouse. */
  title?: string
}

export function ProgressBar({ value, max, label, tone = 'accent', title }: ProgressBarProps) {
  const ratio = max && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max ?? undefined}
      aria-valuenow={value}
      title={title}
    >
      <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}
