import { useState } from 'react'
import { RESOURCES } from '../../../game/data/classes'
import type { ClassDefinition } from '../../../game/catalog'
import { AddIcon, CloseIcon } from '../../../components/icons'
import { useCatalog } from '../../catalog/store'
import { classLabel } from '../labels'
import { ChoiceCards, type ChoiceGroup } from './ChoiceCards'
import { TextDetail } from './TextDetail'
import { emptyClass, isClassComplete, type CharacterDraft, type ClassDraft } from './draft'
import styles from './StepClass.module.less'

interface Props {
  draft: CharacterDraft
  update: (patch: Partial<CharacterDraft>) => void
}

/** Passo 2: una o più classi (con elemento o divinità) e la carriera facoltativa. */
export function StepClass({ draft, update }: Props) {
  const catalog = useCatalog()
  const [active, setActive] = useState(0)
  const index = Math.min(active, draft.classes.length - 1)
  const current = draft.classes[index] ?? emptyClass()

  const classes = catalog.classes.filter((c) => c.kind === 'class')
  const careers = catalog.classes.filter((c) => c.kind === 'career')
  const career = catalog.klass(draft.careerKey)

  function setClass(patch: Partial<ClassDraft>) {
    update({ classes: draft.classes.map((c, i) => (i === index ? { ...c, ...patch } : c)) })
  }

  function addClass() {
    update({ classes: [...draft.classes, emptyClass()] })
    setActive(draft.classes.length)
  }

  function removeClass(i: number) {
    update({ classes: draft.classes.filter((_, j) => j !== i) })
    setActive((a) => (a >= i ? Math.max(0, a - 1) : a))
  }

  const classGroups: ChoiceGroup[] = [
    { title: 'Scuole di magia', choices: classes.filter((c) => !c.requiresDeity).map(toChoice) },
    { title: 'Sacerdoti', choices: classes.filter((c) => c.requiresDeity).map(toChoice) },
  ]

  return (
    <div className={styles.step}>
      {draft.classes.length > 1 && (
        <ul className={styles.slots} aria-label="Classi del personaggio">
          {draft.classes.map((c, i) => (
            <li key={i} className={`${styles.slot} ${i === index ? styles.activeSlot : ''}`}>
              <button type="button" className={styles.slotName} onClick={() => setActive(i)} aria-pressed={i === index}>
                {c.classKey ? classLabel({ class_key: c.classKey, deity_key: c.deityKey || null, element_key: c.elementKey || null, patron: c.patron || null }) : '—'}
                {!isClassComplete(c, catalog) && <span className={styles.incomplete} aria-hidden />}
              </button>
              <button type="button" className="btn btn--ghost btn--icon btn--small" aria-label="Rimuovi classe" onClick={() => removeClass(i)}>
                <CloseIcon aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className={styles.section}>
        <h2>Classe</h2>
        <ChoiceCards
          label="Classe"
          groups={classGroups}
          selectedKey={current.classKey}
          onSelect={(classKey) => setClass({ classKey, deityKey: '', elementKey: '', patron: '' })}
          detail={<ClassDetail cls={catalog.klass(current.classKey)} />}
        />
      </section>

      {catalog.klass(current.classKey)?.requiresElement && <ElementChoice value={current.elementKey} onChange={(elementKey) => setClass({ elementKey })} />}

      {catalog.klass(current.classKey)?.requiresDeity && (
        <>
          <DeityChoice value={current.deityKey} onChange={(deityKey) => setClass({ deityKey })} />
          <label className={`field ${styles.patron}`}>
            <span>Patrono</span>
            <input className="input" value={current.patron} onChange={(e) => setClass({ patron: e.target.value })} />
          </label>
        </>
      )}

      <div>
        <button type="button" className="btn" onClick={addClass} disabled={!isClassComplete(current, catalog)}>
          <AddIcon aria-hidden /> Aggiungi classe
        </button>
      </div>

      <section className={styles.section}>
        <h2>Carriera</h2>
        <ChoiceCards
          label="Carriera"
          groups={[{ choices: careers.map(toChoice) }]}
          selectedKey={draft.careerKey}
          onSelect={(careerKey) => update({ careerKey })}
          allowNone
          detail={<ClassDetail cls={career} />}
        />
      </section>
    </div>
  )
}

function toChoice(c: ClassDefinition) {
  return { key: c.key, title: c.name, subtitle: c.motto }
}

function ClassDetail({ cls }: { cls: ClassDefinition | undefined }) {
  if (!cls) return null
  return (
    <TextDetail
      title={cls.name}
      motto={cls.motto}
      intro={cls.summary}
      fields={[
        { label: 'Risorsa', text: cls.resourceKey ? RESOURCES[cls.resourceKey].label : '' },
        ...cls.sections.map((s) => ({ label: s.title, text: s.text })),
      ]}
    />
  )
}

function ElementChoice({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const catalog = useCatalog()
  const element = catalog.element(value)
  return (
    <section className={styles.section}>
      <h2>Elemento</h2>
      <ChoiceCards
        label="Elemento"
        groups={[{ choices: catalog.elements.map((e) => ({ key: e.key, title: e.name })) }]}
        selectedKey={value}
        onSelect={onChange}
        detail={
          element && (
            <TextDetail
              title={element.name}
              intro={element.nature}
              fields={[
                { label: 'Esempi di incantesimi', text: element.spellExamples },
                { label: 'Creature affini', text: element.creatures },
                { label: 'Opposto', text: catalog.element(element.oppositeKey)?.name ?? '' },
                { label: 'Divinità', text: catalog.deity(element.deityKey)?.name ?? '' },
              ]}
            />
          )
        }
      />
    </section>
  )
}

function DeityChoice({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const catalog = useCatalog()
  const deity = catalog.deity(value)
  return (
    <section className={styles.section}>
      <h2>Divinità</h2>
      <ChoiceCards
        label="Divinità"
        groups={[{ choices: catalog.deities.map((d) => ({ key: d.key, title: d.name, subtitle: d.motto || d.domain })) }]}
        selectedKey={value}
        onSelect={onChange}
        detail={
          deity && (
            <TextDetail
              title={deity.name}
              motto={deity.motto}
              intro={deity.domain}
              fields={[
                { label: 'La divinità', text: deity.lore },
                { label: 'Arma divina', text: deity.divineWeapon },
                { label: 'Esterni', text: deity.outsiders },
                { label: 'Esempi di miracoli', text: deity.miracleExamples },
              ]}
            />
          )
        }
      />
    </section>
  )
}
