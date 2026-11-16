import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ATTRIBUTES, ATTRIBUTE_KEYS, type AttributeKey } from '../../game/data/attributes'
import { ALIGNMENTS } from '../../game/data/alignments'
import { CLASSES, findClass } from '../../game/data/classes'
import { DEITIES } from '../../game/data/deities'
import { RACES } from '../../game/data/races'
import { attributeModifier } from '../../game/rules'
import { useUser } from '../auth/AuthProvider'
import { useMemberships } from '../campaigns/api'
import { useCreateCharacter } from './api'
import styles from './NewCharacterPage.module.less'
import { AddIcon, BackIcon } from '../../components/icons'

interface ClassDraft {
  classKey: string
  deityKey: string
  patron: string
}

export function NewCharacterPage() {
  const { campaignId = '' } = useParams()
  const user = useUser()
  const navigate = useNavigate()
  const { data: memberships } = useMemberships()
  const campaign = memberships?.find((m) => m.campaign.id === campaignId)?.campaign
  const create = useCreateCharacter()

  const [name, setName] = useState('')
  const [raceKey, setRaceKey] = useState('umano')
  const [alignmentKey, setAlignmentKey] = useState('')
  const [age, setAge] = useState('')
  const [level, setLevel] = useState('1')
  const [classes, setClasses] = useState<ClassDraft[]>([{ classKey: '', deityKey: '', patron: '' }])
  const [attributes, setAttributes] = useState<Record<AttributeKey, number>>(
    () => Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, 10])) as Record<AttributeKey, number>,
  )

  function updateClass(index: number, patch: Partial<ClassDraft>) {
    setClasses((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const id = await create.mutateAsync({
      campaignId,
      ownerId: user.id,
      name,
      raceKey: raceKey || null,
      alignmentKey: alignmentKey || null,
      age: age ? Number(age) : null,
      level: Math.max(0, Number(level) || 0),
      classes: classes
        .filter((c) => c.classKey)
        .map((c) => ({
          classKey: c.classKey,
          deityKey: findClass(c.classKey)?.requiresDeity ? c.deityKey || null : null,
          patron: c.patron || null,
        })),
      attributes,
    })
    navigate(`/personaggi/${id}`)
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <header>
        <Link to="/" className="muted">
          <BackIcon aria-hidden /> Torna ai personaggi
        </Link>
        <h1>Nuovo personaggio</h1>
        {campaign && <p className="muted">Campagna: {campaign.name}</p>}
      </header>

      <section className={`card ${styles.section}`}>
        <h2>Identità</h2>
        <div className={styles.grid}>
          <label className="field">
            <span>Nome</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <span>Razza</span>
            <select className="select" value={raceKey} onChange={(e) => setRaceKey(e.target.value)}>
              {RACES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Età</span>
            <input className="input" type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="field">
            <span>Allineamento</span>
            <select className="select" value={alignmentKey} onChange={(e) => setAlignmentKey(e.target.value)}>
              <option value="">—</option>
              {ALIGNMENTS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Livello</span>
            <input className="input" type="number" min={0} value={level} onChange={(e) => setLevel(e.target.value)} />
          </label>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2>Classi</h2>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => setClasses((list) => [...list, { classKey: '', deityKey: '', patron: '' }])}
          >
            <AddIcon aria-hidden /> Aggiungi classe
          </button>
        </div>
        <p className="muted">Le classi sono provvisorie: l’elenco definitivo arriverà più avanti.</p>
        {classes.map((c, index) => {
          const template = findClass(c.classKey)
          return (
            <div key={index} className={styles.classRow}>
              <label className="field">
                <span>Classe</span>
                <select
                  className="select"
                  value={c.classKey}
                  onChange={(e) => updateClass(index, { classKey: e.target.value })}
                >
                  <option value="">—</option>
                  {CLASSES.map((cls) => (
                    <option key={cls.key} value={cls.key}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </label>
              {template?.requiresDeity && (
                <>
                  <label className="field">
                    <span>Divinità</span>
                    <select
                      className="select"
                      value={c.deityKey}
                      onChange={(e) => updateClass(index, { deityKey: e.target.value })}
                      required
                    >
                      <option value="">—</option>
                      {DEITIES.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Patrono (facoltativo)</span>
                    <input
                      className="input"
                      placeholder="es. Vortex"
                      value={c.patron}
                      onChange={(e) => updateClass(index, { patron: e.target.value })}
                    />
                  </label>
                </>
              )}
              {classes.length > 1 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--danger btn--small"
                  onClick={() => setClasses((list) => list.filter((_, i) => i !== index))}
                >
                  Rimuovi
                </button>
              )}
            </div>
          )
        })}
      </section>

      <section className={`card ${styles.section}`}>
        <h2>Caratteristiche</h2>
        <div className={styles.attributes}>
          {ATTRIBUTE_KEYS.map((key) => (
            <label key={key} className="field">
              <span>{ATTRIBUTES[key].label}</span>
              <div className={styles.attributeInput}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={attributes[key]}
                  onChange={(e) => setAttributes((a) => ({ ...a, [key]: Number(e.target.value) || 0 }))}
                />
                <span className={styles.modifier}>+{attributeModifier(attributes[key])}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      {create.error && <p className="error-box">Errore: {create.error.message}</p>}

      <div className={styles.actions}>
        <Link to="/" className="btn btn--ghost">
          Annulla
        </Link>
        <button className="btn btn--primary" type="submit" disabled={create.isPending || !name.trim()}>
          {create.isPending ? 'Creazione…' : 'Crea personaggio'}
        </button>
      </div>
    </form>
  )
}
