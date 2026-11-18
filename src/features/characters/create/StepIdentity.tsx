import { useCatalog } from '../../catalog/store'
import { ChoiceCards } from './ChoiceCards'
import { TextDetail } from './TextDetail'
import type { CharacterDraft } from './draft'
import styles from './StepIdentity.module.less'

interface Props {
  draft: CharacterDraft
  update: (patch: Partial<CharacterDraft>) => void
}

const APPEARANCE: { key: 'age' | 'heightCm' | 'weightKg' | 'eyes' | 'skin' | 'hair'; label: string; numeric?: boolean }[] = [
  { key: 'age', label: 'Età', numeric: true },
  { key: 'heightCm', label: 'Altezza (cm)', numeric: true },
  { key: 'weightKg', label: 'Peso (kg)', numeric: true },
  { key: 'eyes', label: 'Occhi' },
  { key: 'skin', label: 'Pelle' },
  { key: 'hair', label: 'Capelli' },
]

// Griglia 3 × 3: righe Buono / Neutrale / Malvagio, colonne Legale / Neutrale / Caotico.
const ORDER_AXIS = ['Legale', 'Neutrale', 'Caotico']
const MORAL_AXIS = ['Buono', 'Neutrale', 'Malvagio']
const ALIGNMENT_GRID = [
  ['legale_buono', 'neutrale_buono', 'caotico_buono'],
  ['legale_neutrale', 'neutrale_puro', 'caotico_neutrale'],
  ['legale_malvagio', 'neutrale_malvagio', 'caotico_malvagio'],
]

/** Passo 1: nome, razza, aspetto, allineamento. */
export function StepIdentity({ draft, update }: Props) {
  const catalog = useCatalog()
  const race = catalog.race(draft.raceKey)
  const family = catalog.raceFamily(race?.familyKey)
  const alignment = catalog.alignment(draft.alignmentKey)

  const raceGroups = catalog.raceFamilies.map((f) => ({
    title: f.name,
    choices: catalog.races.filter((r) => r.familyKey === f.key).map((r) => ({ key: r.key, title: r.name })),
  }))

  return (
    <div className={styles.step}>
      <section className={styles.section}>
        <label className={`field ${styles.name}`}>
          <span>Nome</span>
          <input className="input" value={draft.name} onChange={(e) => update({ name: e.target.value })} autoFocus />
        </label>
      </section>

      <section className={styles.section}>
        <h2>Razza</h2>
        <ChoiceCards
          label="Razza"
          groups={raceGroups}
          selectedKey={draft.raceKey}
          onSelect={(raceKey) => update({ raceKey })}
          detail={
            race && (
              <TextDetail
                title={race.name}
                intro={family?.intro}
                fields={[
                  { label: 'Aspetto', text: race.appearance },
                  { label: 'Taglia e longevità', text: race.sizeLifespan },
                  { label: 'Allineamento tipico', text: race.typicalAlignment },
                  { label: 'Società e carattere', text: race.society },
                  { label: 'Tratti speciali', text: race.traits },
                  { label: 'Punti Ferita', text: race.hpCoefficient ? `× ${race.hpCoefficient}` : '' },
                ]}
              />
            )
          }
        />
      </section>

      <section className={styles.section}>
        <h2>Aspetto</h2>
        <div className={styles.appearance}>
          {APPEARANCE.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                className="input"
                type={f.numeric ? 'number' : 'text'}
                inputMode={f.numeric ? 'numeric' : undefined}
                min={f.numeric ? 0 : undefined}
                value={draft[f.key]}
                onChange={(e) => update({ [f.key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Allineamento</h2>
        <div className={styles.alignmentLayout}>
          <div className={styles.alignmentGrid} role="group" aria-label="Allineamento">
            <span />
            {ORDER_AXIS.map((axis) => (
              <span key={axis} className={styles.axis}>
                {axis}
              </span>
            ))}
            {ALIGNMENT_GRID.map((row, r) => (
              <AlignmentRow
                key={MORAL_AXIS[r]}
                moral={MORAL_AXIS[r]!}
                keys={row}
                selectedKey={draft.alignmentKey}
                onSelect={(alignmentKey) => update({ alignmentKey })}
              />
            ))}
          </div>
          {alignment && (
            <TextDetail
              title={`${alignment.name} (${alignment.code})`}
              motto={alignment.archetype}
              fields={[
                { label: '', text: alignment.description },
                { label: 'Esempio', text: alignment.example },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function AlignmentRow({
  moral,
  keys,
  selectedKey,
  onSelect,
}: {
  moral: string
  keys: string[]
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const catalog = useCatalog()
  return (
    <>
      <span className={styles.axis}>{moral}</span>
      {keys.map((key) => {
        const a = catalog.alignment(key)
        if (!a) return <span key={key} />
        const selected = key === selectedKey
        return (
          <button
            key={key}
            type="button"
            className={`${styles.alignment} ${selected ? styles.selected : ''}`}
            aria-pressed={selected}
            title={a.name}
            onClick={() => onSelect(selected ? '' : key)}
          >
            <strong>{a.code}</strong>
            <small>{a.name}</small>
          </button>
        )
      })}
    </>
  )
}
