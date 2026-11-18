import { useMemo, useState } from 'react'
import { ATTRIBUTES, ATTRIBUTE_KEYS, type AttributeKey } from '../../../../game/data/attributes'
import { useCatalog } from '../../../catalog/store'
import { attributeModifier, skillNextCost } from '../../../../game/rules'
import { NumberField } from '../../../../components/NumberField'
import {
  AddIcon,
  GroupIcon,
  CollapseIcon,
  DeleteIcon,
  DiceIcon,
  ExpandIcon,
} from '../../../../components/icons'
import {
  attributeValues,
  useDeleteSkill,
  useUpdateSkill,
  type CharacterSheet,
  type SkillRow,
} from '../../api'
import { AskMasterButton } from '../../../threads/AskMasterButton'
import { skillDisplayName } from '../sheetHelpers'
import { useCanRoll, useRollTrigger } from '../sheetContext'
import { NoRoll, ProgressLine } from '../SheetBits'
import { ThreadDot } from '../ThreadDot'
import { EditMark } from '../EditMark'
import { AddSkillDialog } from './AddSkillDialog'
import styles from './SkillsTab.module.less'

/** Capacità raggruppate per caratteristica: tocco = tiro, livello e avanzamento sempre a vista. */
export function SkillsTab({ sheet }: { sheet: CharacterSheet }) {
  const [search, setSearch] = useState('')
  const [attributeFilter, setAttributeFilter] = useState<AttributeKey | ''>('')
  const [adding, setAdding] = useState(false)

  const attributes = attributeValues(sheet)

  const skills = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sheet.character_skills.filter(
      (s) =>
        (!attributeFilter || s.attribute === attributeFilter) &&
        (!query || skillDisplayName(s).toLowerCase().includes(query)),
    )
  }, [sheet.character_skills, search, attributeFilter])

  const [grouped, setGrouped] = useState(readGrouped)
  function toggleGrouped() {
    const next = !grouped
    setGrouped(next)
    try {
      localStorage.setItem(GROUPED_KEY, next ? '1' : '0')
    } catch {
      // Memoria del browser non disponibile: la scelta vale solo per questa visita.
    }
  }

  const groups = ATTRIBUTE_KEYS.map((key) => ({ key, skills: skills.filter((s) => s.attribute === key) })).filter(
    (g) => g.skills.length > 0,
  )

  // Senza gruppi: elenco unico in ordine alfabetico, diviso a metà fra le due colonne.
  const sorted = [...skills].sort((a, b) => skillDisplayName(a).localeCompare(skillDisplayName(b), 'it'))
  const half = Math.ceil(sorted.length / 2)
  const flatColumns = [sorted.slice(0, half), sorted.slice(half)]

  return (
    <section className={styles.tab}>
      <div className={styles.toolbar}>
        <input
          className={`input ${styles.search}`}
          type="search"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca capacità"
        />
        <div className={styles.chips} role="group" aria-label="Caratteristica">
          <button type="button" className={!attributeFilter ? styles.chipActive : styles.chip} onClick={() => setAttributeFilter('')}>
            Tutte
          </button>
          {ATTRIBUTE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={attributeFilter === k ? styles.chipActive : styles.chip}
              onClick={() => setAttributeFilter(attributeFilter === k ? '' : k)}
              title={ATTRIBUTES[k].label}
            >
              {ATTRIBUTES[k].short}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.groupToggle} ${grouped ? styles.groupToggleOn : ''}`}
          aria-pressed={grouped}
          onClick={toggleGrouped}
        >
          <GroupIcon aria-hidden /> Raggruppa
        </button>
        {/* Sempre visibile: aggiungere apre una finestra, non c'è rischio di tocchi accidentali */}
        <button className="btn btn--primary" onClick={() => setAdding(true)}>
          <AddIcon aria-hidden /> Aggiungi
        </button>
      </div>

      {/* Due colonne bilanciate (non "columns" CSS: ricalcolerebbe tutto a ogni passaggio del mouse) */}
      {!grouped && (
        <div className={styles.groups}>
          {flatColumns.map((column, i) => (
            <ul key={i} className={`${styles.list} ${styles.flatList}`}>
              {column.map((skill) => (
                <SkillItem key={skill.id} sheet={sheet} skill={skill} showAttribute />
              ))}
            </ul>
          ))}
        </div>
      )}

      {grouped && (
      <div className={styles.groups}>
        {splitColumns(groups).map((column, i) => (
          <div key={i} className={styles.column}>
            {column.map((group) => (
              <div key={group.key} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  <span>
                    {ATTRIBUTES[group.key].label}
                    <span className={styles.groupValue}>
                      {attributes[group.key]} <small>+{attributeModifier(attributes[group.key])}</small>
                    </span>
                  </span>
                </h3>
                <ul className={styles.list}>
                  {group.skills.map((skill) => (
                    <SkillItem key={skill.id} sheet={sheet} skill={skill} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      )}

      {skills.length === 0 && (
        <p className="muted">{sheet.character_skills.length === 0 ? 'Nessuna capacità.' : 'Nessun risultato.'}</p>
      )}

      <AddSkillDialog sheet={sheet} open={adding} onClose={() => setAdding(false)} />
    </section>
  )
}

const GROUPED_KEY = 'xerioth.capacita.raggruppa'

/** Scelta "Raggruppa" ricordata nel browser (predefinito: raggruppate). */
function readGrouped(): boolean {
  try {
    return localStorage.getItem(GROUPED_KEY) !== '0'
  } catch {
    return true
  }
}

/** Divide i gruppi in due colonne con circa lo stesso numero di righe (titoli compresi), in ordine. */
function splitColumns<T extends { skills: unknown[] }>(groups: T[]): [T[], T[]] {
  const weight = (g: T) => g.skills.length + 1.5
  const total = groups.reduce((s, g) => s + weight(g), 0)
  let acc = 0
  let cut = groups.length
  for (let i = 0; i < groups.length; i++) {
    const w = weight(groups[i]!)
    // Il gruppo va a sinistra se il suo centro cade nella prima metà.
    if (acc + w / 2 > total / 2) {
      cut = i
      break
    }
    acc += w
  }
  return [groups.slice(0, cut), groups.slice(cut)]
}

interface ItemProps {
  sheet: CharacterSheet
  skill: SkillRow
  /** Elenco senza gruppi: sigla della caratteristica accanto al nome. */
  showAttribute?: boolean
}

/**
 * Riga di una capacità, sempre modificabile come sulla carta:
 * clic sul livello = lo modifichi, clic sui punti = aggiungi/togli, clic sul resto = tiro.
 * MAX, caratteristica ed elimina stanno nel dettaglio (freccia a destra).
 */
function SkillItem({ sheet, skill, showAttribute = false }: ItemProps) {
  const update = useUpdateSkill(sheet.id)
  const remove = useDeleteSkill(sheet.id)
  const [expanded, setExpanded] = useState(false)

  const name = skillDisplayName(skill)
  const definition = useCatalog().skill(skill.skill_key)
  const description = skill.description || definition?.description || ''
  const nextCost = skillNextCost(skill.level, skill.is_maxed)
  const trigger = useRollTrigger({ label: name, attribute: skill.attribute, level: skill.level, isMaxed: skill.is_maxed })
  const canRoll = useCanRoll()


  const Chevron = expanded ? CollapseIcon : ExpandIcon

  function confirmDelete() {
    if (window.confirm(`Rimuovere "${name}"?`)) remove.mutate(skill.id)
  }

  const nameBlock = (
    <span className={styles.name}>
      {name}
      {showAttribute && (
        <span className={styles.attrTag} title={ATTRIBUTES[skill.attribute].label}>
          {ATTRIBUTES[skill.attribute].short}
        </span>
      )}
      <ThreadDot characterId={sheet.id} targetType="skill" targetId={skill.id} />
      <EditMark characterId={sheet.id} filters={[{ type: 'skill', id: skill.id }]} />
    </span>
  )

  return (
    <li className={`${styles.item} ${skill.is_maxed ? styles.maxed : ''} ${expanded ? styles.itemOpen : ''}`}>
      <div className={styles.row}>
        {/* Gerarchia: nome e livello in evidenza; avanzamento sottile sotto il nome; dado solo al passaggio */}
        <div
          className={`${styles.cells} ${styles.playCells} ${canRoll ? styles.rollable : ''}`}
          {...(canRoll && { role: 'button', tabIndex: 0, 'aria-label': `Tira ${name}` })}
          {...trigger}
        >
          <span className={styles.main}>
            {nameBlock}
            {/* Al MAX la scritta prende il posto della barra */}
            {skill.is_maxed ? (
              <span className={styles.maxLine}>MAX</span>
            ) : (
              <ProgressLine
                name={name}
                value={skill.advancement}
                max={nextCost}
                onChange={(v) => update.mutate({ id: skill.id, patch: { advancement: v } })}
              />
            )}
          </span>
          <DiceIcon aria-hidden className={canRoll ? styles.dice : `${styles.dice} ${styles.diceIdle}`} />
          {/* "Liv" sopra, il numero sotto: clic sul numero per modificarlo */}
          <span className={styles.levelPair}>
            <small>Liv</small>
            <NoRoll>
              <NumberField
                className={styles.levelValue}
                label={`Livello ${name}`}
                value={skill.level}
                nullable
                min={0}
                placeholder="NA"
                onCommit={(v) => update.mutate({ id: skill.id, patch: { level: v } })}
              />
            </NoRoll>
          </span>
        </div>
        <button
          type="button"
          className={styles.expand}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Chiudi descrizione' : 'Descrizione'}
        >
          <Chevron aria-hidden />
        </button>
      </div>

      {expanded && (
        <div className={styles.detail}>
          {description ? <p>{description}</p> : <p className="muted">—</p>}
          {/* Controlli della capacità: sempre disponibili, ma fuori dalla riga */}
          <div className={styles.detailFooter}>
            <span className={styles.meta}>{definition ? `Max ${definition.maxLevel}` : 'Personalizzata'}</span>
            <label className={styles.meta}>
              Caratteristica
              <select
                className={styles.inlineSelect}
                value={skill.attribute}
                onChange={(e) => update.mutate({ id: skill.id, patch: { attribute: e.target.value as AttributeKey } })}
              >
                {ATTRIBUTE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {ATTRIBUTES[k].label}
                  </option>
                ))}
              </select>
            </label>
            <span className={styles.detailActions}>
              <button
                type="button"
                className={`${styles.maxToggle} ${skill.is_maxed ? styles.maxToggleOn : ''}`}
                onClick={() => update.mutate({ id: skill.id, patch: { is_maxed: !skill.is_maxed } })}
                aria-pressed={skill.is_maxed}
              >
                MAX
              </button>
              <AskMasterButton
                characterId={sheet.id}
                ownerId={sheet.owner_id}
                targetType="skill"
                targetId={skill.id}
                defaultTitle={`Capacità: ${name}`}
              />
              <button
                type="button"
                className="btn btn--ghost btn--square btn--danger"
                onClick={confirmDelete}
                aria-label={`Elimina ${name}`}
                title="Elimina"
              >
                <DeleteIcon aria-hidden />
              </button>
            </span>
          </div>
        </div>
      )}
    </li>
  )
}
