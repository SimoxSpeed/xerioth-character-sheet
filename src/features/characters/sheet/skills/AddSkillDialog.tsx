import { useMemo, useState, type FormEvent } from 'react'
import { ATTRIBUTES, ATTRIBUTE_KEYS, type AttributeKey } from '../../../../game/data/attributes'
import type { SkillDefinition } from '../../../../game/catalog'
import { useCatalog } from '../../../catalog/store'
import { checkRequirements } from '../../../../game/rules'
import { Dialog } from '../../../../components/Dialog'
import { attributeValues, skillLevels, useAddSkill, type CharacterSheet } from '../../api'
import { saved, visibleError } from '../../../masterEdits/gate'
import styles from './AddSkillDialog.module.less'
import { CheckIcon, CloseIcon, InfoIcon } from '../../../../components/icons'

interface Props {
  sheet: CharacterSheet
  open: boolean
  onClose: () => void
}

type Mode = 'catalog' | 'custom'

export function AddSkillDialog({ sheet, open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('catalog')

  return (
    <Dialog open={open} onClose={onClose} title="Aggiungi capacità" width={760}>
      <div className={styles.modes} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'catalog'}
          className={mode === 'catalog' ? styles.modeActive : styles.mode}
          onClick={() => setMode('catalog')}
        >
          Dal catalogo
        </button>
        <button
          role="tab"
          aria-selected={mode === 'custom'}
          className={mode === 'custom' ? styles.modeActive : styles.mode}
          onClick={() => setMode('custom')}
        >
          Personalizzata
        </button>
      </div>
      {mode === 'catalog' ? <CatalogPicker sheet={sheet} /> : <CustomSkillForm sheet={sheet} onDone={onClose} />}
    </Dialog>
  )
}

function CatalogPicker({ sheet }: { sheet: CharacterSheet }) {
  const add = useAddSkill(sheet.id)
  const catalog = useCatalog()
  const [search, setSearch] = useState('')
  const [attributeFilter, setAttributeFilter] = useState<AttributeKey | ''>('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const attributes = attributeValues(sheet)
  const levels = skillLevels(sheet)
  const owned = new Set(sheet.character_skills.map((s) => s.skill_key).filter(Boolean))
  const powerNames = sheet.character_powers.map((p) => p.name)

  const entries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const skillName = (key: string) => catalog.skill(key)?.name
    return catalog.skills.filter((s) => !attributeFilter || s.attribute === attributeFilter)
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query))
      .map((s) => ({ skill: s, ...checkRequirements(s.requirements, { attributes, skillLevels: levels, powerNames, skillName }) }))
      .filter((e) => !onlyAvailable || (e.allMet && !owned.has(e.skill.key)))
  }, [catalog, search, attributeFilter, onlyAvailable, attributes, levels, powerNames, owned])

  function addSkill(skill: SkillDefinition) {
    add.mutate({ skillKey: skill.key, customName: null, attribute: skill.attribute, level: 0 })
  }

  return (
    <div className={styles.catalog}>
      <div className={styles.filters}>
        <input
          className="input"
          type="search"
          placeholder="Cerca nel catalogo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca nel catalogo"
          autoFocus
        />
        <select
          className="select"
          value={attributeFilter}
          onChange={(e) => setAttributeFilter(e.target.value as AttributeKey | '')}
          aria-label="Filtra per caratteristica"
        >
          <option value="">Tutte</option>
          {ATTRIBUTE_KEYS.map((k) => (
            <option key={k} value={k}>
              {ATTRIBUTES[k].label}
            </option>
          ))}
        </select>
        <label className={styles.check}>
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          Solo disponibili
        </label>
      </div>

      {visibleError(add.error) && <p className="error-box">Errore: {add.error?.message}</p>}

      <ul className={styles.list}>
        {entries.map(({ skill, checks, allMet }) => {
          const isOwned = owned.has(skill.key)
          return (
            <li key={skill.key} className={styles.entry}>
              <div className={styles.entryMain}>
                <div className={styles.entryTitle}>
                  <strong>{skill.name}</strong>
                  <span className={styles.attr}>{ATTRIBUTES[skill.attribute].short}</span>
                  <span className={styles.max}>max {skill.maxLevel}</span>
                </div>
                {skill.description && <p className={styles.description}>{skill.description}</p>}
                {checks.length > 0 && (
                  <ul className={styles.requirements}>
                    {checks.map((c, i) => (
                      <li key={i} className={c.met === false ? styles.reqMissing : c.met ? styles.reqMet : styles.reqNote}>
                        {c.met === false ? <CloseIcon aria-hidden /> : c.met ? <CheckIcon aria-hidden /> : <InfoIcon aria-hidden />}{' '}
                {c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                className={`btn btn--small ${allMet ? 'btn--primary' : ''}`}
                disabled={isOwned || add.isPending}
                onClick={() => addSkill(skill)}
                title={allMet ? 'Aggiungi a livello 0' : 'Requisiti non soddisfatti: puoi aggiungerla comunque se il Master è d’accordo'}
              >
                {isOwned ? 'Già presente' : allMet ? 'Aggiungi' : 'Aggiungi comunque'}
              </button>
            </li>
          )
        })}
      </ul>
      {entries.length === 0 && <p className="muted">Nessuna capacità trovata.</p>}
    </div>
  )
}

function CustomSkillForm({ sheet, onDone }: { sheet: CharacterSheet; onDone: () => void }) {
  const add = useAddSkill(sheet.id)
  const [name, setName] = useState('')
  const [attribute, setAttribute] = useState<AttributeKey>('abilita')
  const [level, setLevel] = useState('0')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const done = await saved(
      add.mutateAsync({
        skillKey: null,
        customName: name,
        attribute,
        level: level === '' ? null : Math.max(0, Number(level) || 0),
      }),
    )
    if (done) onDone()
  }

  return (
    <form className={styles.custom} onSubmit={onSubmit}>
      <p className="muted">
        Per capacità fuori catalogo o varianti, es. “Cavalcare (Viverna)”, “Lingua Elfica antica”.
      </p>
      <label className="field">
        <span>Nome</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <div className={styles.customRow}>
        <label className="field">
          <span>Caratteristica</span>
          <select className="select" value={attribute} onChange={(e) => setAttribute(e.target.value as AttributeKey)}>
            {ATTRIBUTE_KEYS.map((k) => (
              <option key={k} value={k}>
                {ATTRIBUTES[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Livello (vuoto = NA)</span>
          <input className="input" type="number" min={0} value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
      </div>
      {visibleError(add.error) && <p className="error-box">Errore: {add.error?.message}</p>}
      <div className={styles.customActions}>
        <button className="btn btn--primary" type="submit" disabled={!name.trim() || add.isPending}>
          Aggiungi
        </button>
      </div>
    </form>
  )
}
