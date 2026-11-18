import { ATTRIBUTES, ATTRIBUTE_KEYS } from '../../../game/data/attributes'
import { RESOURCES } from '../../../game/data/classes'
import { attributeModifier, maxHp } from '../../../game/rules'
import { HpIcon, LevelIcon, RESOURCE_ICONS } from '../../../components/icons'
import { Stepper } from '../../../components/Stepper'
import { useCatalog } from '../../catalog/store'
import { draftResources, type CharacterDraft } from './draft'
import styles from './StepAttributes.module.less'

interface Props {
  draft: CharacterDraft
  update: (patch: Partial<CharacterDraft>) => void
}

/** Passo 3: caratteristiche, livello e riepilogo di PF e risorse. */
export function StepAttributes({ draft, update }: Props) {
  const catalog = useCatalog()
  const hpMax = maxHp({
    costituzione: draft.attributes.costituzione,
    forzaLevel: 0,
    hpCoefficient: catalog.race(draft.raceKey)?.hpCoefficient,
    hpBonus: 0,
  })
  const resources = draftResources(draft, catalog)

  return (
    <div className={styles.step}>
      <section className={styles.attributes} aria-label="Caratteristiche">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = draft.attributes[key]
          return (
            <div key={key} className={styles.attribute}>
              <Stepper
                label={ATTRIBUTES[key].label}
                value={value}
                min={0}
                onChange={(v) => update({ attributes: { ...draft.attributes, [key]: v } })}
              />
              <span className={styles.modifier}>+{attributeModifier(value)}</span>
            </div>
          )
        })}
      </section>

      <section className={styles.summary}>
        <div className={styles.attribute}>
          <Stepper label="Livello" icon={LevelIcon} value={draft.level} min={0} onChange={(level) => update({ level })} />
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            <HpIcon aria-hidden /> PF massimi
          </span>
          <strong className={styles.hp}>{hpMax ?? '—'}</strong>
        </div>
        {resources.map((key) => {
          const Icon = RESOURCE_ICONS[key]
          return (
            <div key={key} className={styles.stat}>
              <span className={styles.statLabel}>
                {Icon && <Icon aria-hidden />} {RESOURCES[key].label}
              </span>
            </div>
          )
        })}
      </section>
    </div>
  )
}
