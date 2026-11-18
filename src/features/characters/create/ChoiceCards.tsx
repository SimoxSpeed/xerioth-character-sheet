import type { ReactNode } from 'react'
import { CheckIcon } from '../../../components/icons'
import styles from './ChoiceCards.module.less'

export interface Choice {
  key: string
  title: string
  /** Riga sotto il nome (motto, dominio…). */
  subtitle?: string
}

export interface ChoiceGroup {
  title?: string
  choices: Choice[]
}

interface Props {
  label: string
  groups: ChoiceGroup[]
  selectedKey: string
  onSelect: (key: string) => void
  /** Con true un secondo clic sulla scelta la toglie (scelte facoltative). */
  allowNone?: boolean
  /** Testo della scelta selezionata: a destra su schermo largo, sotto il riquadro su telefono. */
  detail?: ReactNode
}

/** Scelta a riquadri con il testo del manuale della voce selezionata. */
export function ChoiceCards({ label, groups, selectedKey, onSelect, allowNone = false, detail }: Props) {
  const hasSelection = groups.some((g) => g.choices.some((c) => c.key === selectedKey))

  return (
    <div className={styles.layout}>
      <div className={styles.groups} role="group" aria-label={label}>
        {groups.map((group, index) => (
          <section key={group.title ?? index} className={styles.group}>
            {group.title && <h3 className={styles.groupTitle}>{group.title}</h3>}
            <ul className={styles.list}>
              {group.choices.map((choice) => {
                const selected = choice.key === selectedKey
                return (
                  <li key={choice.key} className={styles.item}>
                    <button
                      type="button"
                      className={`${styles.card} ${selected ? styles.selected : ''}`}
                      aria-pressed={selected}
                      onClick={() => onSelect(selected && allowNone ? '' : choice.key)}
                    >
                      <span className={styles.title}>{choice.title}</span>
                      {choice.subtitle && <span className={styles.subtitle}>{choice.subtitle}</span>}
                      {selected && <CheckIcon className={styles.check} aria-hidden />}
                    </button>
                    {selected && detail && <div className={styles.inlineDetail}>{detail}</div>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      {hasSelection && detail && <aside className={styles.sideDetail}>{detail}</aside>}
    </div>
  )
}
