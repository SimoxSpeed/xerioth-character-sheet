import { useMemo, useState } from 'react'
import { ATTRIBUTES, type AttributeKey } from '../../../../game/data/attributes'
import { BASE_DAILY_POINTS } from '../../../../game/data/training'
import { dailyTrainingPoints, daysToComplete, skillNextCost } from '../../../../game/rules'
import { AdvancementControl } from '../../../../components/AdvancementControl'
import { TeacherIcon, TrainingIcon } from '../../../../components/icons'
import {
  attributeValues,
  skillLevels as getSkillLevels,
  useUpdatePower,
  useUpdateSkill,
  type CharacterSheet,
} from '../../api'
import { MASTER_OPTIONS, sheetPowerSections, skillDisplayName } from '../sheetHelpers'
import styles from './TrainingTab.module.less'

/** Una cosa che si sta allenando: capacità o potere. */
interface Trainee {
  id: string
  table: 'skill' | 'power'
  name: string
  group: string
  attribute: AttributeKey
  level: number | null
  advancement: number
}

/** Allenamento: punti al giorno, maestro (solo qui) e stima dei giorni per ogni capacità e potere. */
export function TrainingTab({ sheet }: { sheet: CharacterSheet }) {
  const attributes = attributeValues(sheet)
  const supportLevels = getSkillLevels(sheet)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('')
  /** Maestro scelto per ogni elemento (id → livello del maestro). */
  const [teachers, setTeachers] = useState<Record<string, number>>({})

  const sections = sheetPowerSections(sheet)
  const trainees = useMemo<Trainee[]>(() => {
    const skills = sheet.character_skills
      .filter((s) => !s.is_maxed && skillNextCost(s.level) !== null)
      .map((s) => ({
        id: s.id,
        table: 'skill' as const,
        name: skillDisplayName(s),
        group: 'Capacità',
        attribute: s.attribute,
        level: s.level,
        advancement: s.advancement,
      }))
    const powers = sheet.character_powers
      .filter((p) => !p.is_maxed && skillNextCost(p.level) !== null)
      .map((p) => {
        const section = sections.find((s) => s.kind === p.kind)
        return {
          id: p.id,
          table: 'power' as const,
          name: p.name,
          group: section?.label ?? 'Poteri',
          // Miracoli e poteri si allenano sulla caratteristica della classe (Intelligenza).
          attribute: section?.attribute ?? ('intelligenza' as AttributeKey),
          level: p.level,
          advancement: p.advancement,
        }
      })
    return [...skills, ...powers]
  }, [sheet.character_skills, sheet.character_powers, sections])

  const groups = [...new Set(trainees.map((t) => t.group))]
  const query = search.trim().toLowerCase()
  const visible = trainees.filter((t) => (!group || t.group === group) && (!query || t.name.toLowerCase().includes(query)))

  // Riepilogo per disciplina (senza maestro e senza modificatore, che dipendono da cosa si allena).
  const mental = dailyTrainingPoints({ trainedAttribute: 'intelligenza', attributes, supportLevels })
  const physical = dailyTrainingPoints({ trainedAttribute: 'costituzione', attributes, supportLevels })

  return (
    <section className={styles.tab}>
      <div className={styles.summary}>
        <DisciplineCard title="Discipline mentali" hint="Intelligenza, Fascino, Freddezza · miracoli e poteri" breakdown={mental} />
        <DisciplineCard title="Discipline fisiche" hint="Costituzione, Abilità, Riflessi" breakdown={physical} />
      </div>

      <div className={styles.toolbar}>
        <input
          className="input"
          type="search"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca cosa allenare"
        />
        <select className="select" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filtra per tipo">
          <option value="">Tutto</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cosa alleni</th>
              <th>Car.</th>
              <th>
                <TeacherIcon aria-hidden /> Maestro
              </th>
              <th className={styles.num}>Punti/giorno</th>
              <th>Avanzamento</th>
              <th className={styles.num}>Mancano</th>
              <th className={styles.num}>Giorni</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <TraineeRow
                key={t.id}
                sheet={sheet}
                trainee={t}
                teacher={teachers[t.id] ?? 0}
                onTeacher={(level) => setTeachers((prev) => ({ ...prev, [t.id]: level }))}
                daily={
                  dailyTrainingPoints({
                    trainedAttribute: t.attribute,
                    attributes,
                    supportLevels,
                    masterLevel: teachers[t.id] ?? 0,
                  }).total
                }
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className={`muted ${styles.empty}`}>Niente da allenare.</p>}
      </div>
    </section>
  )
}

function DisciplineCard({
  title,
  hint,
  breakdown,
}: {
  title: string
  hint: string
  breakdown: ReturnType<typeof dailyTrainingPoints>
}) {
  const base = breakdown.total - breakdown.modifier
  return (
    <div className="card">
      <h2 className={styles.cardTitle}>
        <TrainingIcon aria-hidden /> {title}
      </h2>
      <p className={styles.hint}>{hint}</p>
      <ul className={styles.breakdown}>
        <li>
          <span>Base</span>
          <span>{BASE_DAILY_POINTS}</span>
        </li>
        {breakdown.supports.map((s) => (
          <li key={s.key} className={s.points === 0 ? styles.zero : undefined}>
            <span>{s.name}</span>
            <span>
              {s.points}
              {s.booster > 0 && ` + ${s.booster} booster`}
            </span>
          </li>
        ))}
        <li className={styles.total}>
          <span>Totale</span>
          <span>{base} + modificatore + maestro</span>
        </li>
      </ul>
    </div>
  )
}

function TraineeRow({
  sheet,
  trainee,
  teacher,
  onTeacher,
  daily,
}: {
  sheet: CharacterSheet
  trainee: Trainee
  teacher: number
  onTeacher: (level: number) => void
  daily: number
}) {
  const updateSkill = useUpdateSkill(sheet.id)
  const updatePower = useUpdatePower(sheet.id)
  const nextCost = skillNextCost(trainee.level)
  const remaining = nextCost === null ? null : Math.max(0, nextCost - trainee.advancement)
  const days = remaining === null ? null : daysToComplete(remaining, daily)

  function setAdvancement(advancement: number) {
    if (trainee.table === 'skill') updateSkill.mutate({ id: trainee.id, patch: { advancement } })
    else updatePower.mutate({ id: trainee.id, patch: { advancement } })
  }

  return (
    <tr>
      <td>
        <span className={styles.name}>{trainee.name}</span>
        <span className={styles.group}>
          {trainee.group} · liv. {trainee.level ?? 'NA'}
        </span>
      </td>
      <td>
        <span className={styles.attrBadge} title={ATTRIBUTES[trainee.attribute].label}>
          {ATTRIBUTES[trainee.attribute].short}
        </span>
      </td>
      <td>
        <select
          className={styles.teacher}
          value={teacher}
          onChange={(e) => onTeacher(Number(e.target.value))}
          aria-label={`Maestro per ${trainee.name}`}
        >
          {MASTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === 0 ? 'Nessuno' : o.label.replace('Maestro ', '')}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.num}>{daily}</td>
      <td className={styles.progressCell}>
        <AdvancementControl
          name={trainee.name}
          value={trainee.advancement}
          max={nextCost}
          suggested={daily}
          onChange={setAdvancement}
        />
      </td>
      <td className={styles.num}>{remaining?.toLocaleString('it-IT') ?? '—'}</td>
      <td className={styles.num}>{days === null ? '—' : `≈ ${days}`}</td>
    </tr>
  )
}
