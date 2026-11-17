import { Link, useParams } from 'react-router'
import { ForwardIcon, InviteIcon } from '../../components/icons'
import { ROLE_LABELS, useInviteInfo, useRequestToJoin, type InviteInfo } from './api'
import styles from './InvitePage.module.less'

const INVALID_LABELS: Record<Exclude<InviteInfo['status'], 'valid'>, string> = {
  expired: 'Invito scaduto',
  revoked: 'Invito revocato',
  used: 'Invito già usato',
}

/** Link d'invito: chi lo apre chiede di entrare nella campagna; decide il Master. */
export function InvitePage() {
  const { inviteId = '' } = useParams()
  const { data: invite, isPending, error } = useInviteInfo(inviteId)

  if (isPending) return <p className="muted">Caricamento…</p>

  // Un id non valido fa fallire la chiamata: per l'utente è un invito inesistente
  if (error || !invite) {
    return (
      <section className={`card ${styles.card}`}>
        <h1>Invito non valido</h1>
      </section>
    )
  }

  return (
    <section className={`card ${styles.card}`}>
      <p className={styles.kicker}>Invito · {ROLE_LABELS[invite.role]}</p>
      <h1>{invite.campaignName}</h1>
      <InviteAction inviteId={inviteId} invite={invite} />
    </section>
  )
}

function InviteAction({ inviteId, invite }: { inviteId: string; invite: InviteInfo }) {
  const request = useRequestToJoin(inviteId)

  if (invite.isMember) {
    return (
      <Link to="/" className="btn btn--primary">
        Vai alla campagna <ForwardIcon aria-hidden />
      </Link>
    )
  }
  if (invite.requestStatus === 'pending') return <p className={styles.state}>In attesa</p>
  if (invite.requestStatus === 'rejected') return <p className={styles.stateRejected}>Richiesta rifiutata</p>
  if (invite.status !== 'valid') return <p className={styles.stateRejected}>{INVALID_LABELS[invite.status]}</p>

  return (
    <>
      <button className="btn btn--primary" onClick={() => request.mutate()} disabled={request.isPending}>
        <InviteIcon aria-hidden /> Chiedi di entrare
      </button>
      {request.error && <p className="error-box">{request.error.message}</p>}
    </>
  )
}
