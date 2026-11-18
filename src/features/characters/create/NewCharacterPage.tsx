import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BackIcon, ForwardIcon } from '../../../components/icons'
import { useUser } from '../../auth/AuthProvider'
import { useMemberships } from '../../campaigns/api'
import { useCatalog } from '../../catalog/store'
import { useCreateCharacter } from '../api'
import { initialDraft, isStepComplete, STEPS, toInput, type CharacterDraft } from './draft'
import { StepAttributes } from './StepAttributes'
import { StepClass } from './StepClass'
import { StepIdentity } from './StepIdentity'
import styles from './NewCharacterPage.module.less'

/** Creazione personaggio in tre passi: Chi sei, Classe, Caratteristiche. */
export function NewCharacterPage() {
  const { campaignId = '' } = useParams()
  const user = useUser()
  const navigate = useNavigate()
  const catalog = useCatalog()
  const { data: memberships } = useMemberships()
  const campaign = memberships?.find((m) => m.campaign.id === campaignId)?.campaign
  const create = useCreateCharacter()

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CharacterDraft>(initialDraft)
  const update = (patch: Partial<CharacterDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const complete = STEPS.map((_, i) => isStepComplete(i, draft, catalog))
  /** Un passo si raggiunge se tutti quelli prima sono completi. */
  const reachable = (i: number) => complete.slice(0, i).every(Boolean)
  const isLast = step === STEPS.length - 1

  function go(next: number) {
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  async function submit() {
    const id = await create.mutateAsync(toInput(draft, catalog, campaignId, user.id))
    navigate(`/personaggi/${id}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className="muted">
          <BackIcon aria-hidden /> Torna ai personaggi
        </Link>
        <h1>Nuovo personaggio</h1>
        {campaign && <p className="muted">{campaign.name}</p>}
      </header>

      <ol className={styles.steps}>
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              className={`${styles.stepButton} ${i === step ? styles.current : ''} ${complete[i] && i < step ? styles.done : ''}`}
              aria-current={i === step ? 'step' : undefined}
              disabled={!reachable(i)}
              onClick={() => go(i)}
            >
              <span className={styles.stepNumber}>{i + 1}</span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <main className={styles.body}>
        {step === 0 && <StepIdentity draft={draft} update={update} />}
        {step === 1 && <StepClass draft={draft} update={update} />}
        {step === 2 && <StepAttributes draft={draft} update={update} />}
      </main>

      {create.error && <p className="error-box">{create.error.message}</p>}

      <footer className={styles.actions}>
        {step > 0 ? (
          <button type="button" className="btn btn--ghost" onClick={() => go(step - 1)}>
            <BackIcon aria-hidden /> Indietro
          </button>
        ) : (
          <Link to="/" className="btn btn--ghost">
            Annulla
          </Link>
        )}
        {isLast ? (
          <button type="button" className="btn btn--primary" onClick={submit} disabled={create.isPending || !complete.every(Boolean)}>
            {create.isPending ? 'Creazione…' : 'Crea personaggio'}
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => go(step + 1)} disabled={!complete[step]}>
            Avanti <ForwardIcon aria-hidden />
          </button>
        )}
      </footer>
    </div>
  )
}
