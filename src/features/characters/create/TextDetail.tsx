import styles from './TextDetail.module.less'

export interface DetailField {
  label: string
  text: string
}

interface Props {
  title: string
  motto?: string
  intro?: string
  fields: DetailField[]
}

/** Testo del manuale per la scelta selezionata. I campi vuoti non compaiono. */
export function TextDetail({ title, motto, intro, fields }: Props) {
  const shown = fields.filter((f) => f.text.trim() !== '')
  return (
    <article className={styles.detail}>
      <h4 className={styles.title}>{title}</h4>
      {motto && <p className={styles.motto}>«{motto}»</p>}
      {intro && <p className={styles.intro}>{intro}</p>}
      {shown.length > 0 && (
        <dl className={styles.fields}>
          {shown.map((f, i) => (
            <div key={`${f.label}-${i}`} className={styles.field}>
              {f.label && <dt>{f.label}</dt>}
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}
