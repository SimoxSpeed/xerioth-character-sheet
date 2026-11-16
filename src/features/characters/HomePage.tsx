import { Link } from 'react-router'
import { useUser } from '../auth/AuthProvider'
import { useCharacters } from './api'
import { useMemberships, type Membership } from '../campaigns/api'
import { classesLabel, raceLabel } from './labels'
import styles from './HomePage.module.less'
import { AddIcon } from '../../components/icons'

export function HomePage() {
  const { data: memberships, isPending, error } = useMemberships()

  if (isPending) return <p className="muted">Caricamento…</p>
  if (error) return <p className="error-box">Errore: {error.message}</p>

  if (memberships.length === 0) {
    return (
      <section className={`card ${styles.empty}`}>
        <h1>Benvenuto</h1>
        <p>
          Non fai ancora parte di nessuna campagna. Chiedi al Master di aggiungerti: per ora l’iscrizione alle
          campagne si fa dal database.
        </p>
      </section>
    )
  }

  return (
    <div className={styles.page}>
      {memberships.map((m) => (
        <CampaignSection key={m.campaign.id} membership={m} />
      ))}
    </div>
  )
}

function CampaignSection({ membership }: { membership: Membership }) {
  const user = useUser()
  const { campaign, role } = membership
  const { data: characters, isPending, error } = useCharacters(campaign.id)
  const isMaster = role === 'master'

  return (
    <section className={styles.campaign}>
      <header className={styles.campaignHeader}>
        <div>
          <h1>{campaign.name}</h1>
          <p className="muted">
            {isMaster ? 'Sei il Master: vedi tutti i personaggi.' : 'I tuoi personaggi'}
            {campaign.description && ` — ${campaign.description}`}
          </p>
        </div>
        <div className={styles.headerActions}>
          {isMaster && (
            <Link to={`/campagne/${campaign.id}/master`} className="btn">
              Pannello Master
            </Link>
          )}
          <Link to={`/campagne/${campaign.id}/nuovo-personaggio`} className="btn btn--primary">
            <AddIcon aria-hidden /> Nuovo personaggio
          </Link>
        </div>
      </header>

      {isPending && <p className="muted">Caricamento personaggi…</p>}
      {error && <p className="error-box">Errore: {error.message}</p>}
      {characters && characters.length === 0 && <p className="muted">Nessun personaggio, per ora.</p>}

      <ul className={styles.grid}>
        {characters?.map((c) => (
          <li key={c.id}>
            <Link to={`/personaggi/${c.id}`} className={styles.characterCard}>
              <div className={styles.portrait} aria-hidden>
                {c.portrait_url ? <img src={c.portrait_url} alt="" /> : c.name.charAt(0)}
              </div>
              <div className={styles.characterInfo}>
                <strong>{c.name}</strong>
                <span className="muted">
                  {raceLabel(c.race_key)} · Liv. {c.level}
                </span>
                <span className={styles.classes}>{classesLabel(c.character_classes)}</span>
                {isMaster && c.owner_id !== user.id && (
                  <span className={styles.owner}>Giocatore: {c.owner?.display_name ?? '—'}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
