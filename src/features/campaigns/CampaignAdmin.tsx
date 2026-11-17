import { useEffect, useState, type FormEvent } from 'react'
import { useUser } from '../auth/AuthProvider'
import { formatDateTime } from '../../lib/format'
import { CheckIcon, CloseIcon, CopyIcon, InviteIcon, RemoveMemberIcon, RevokeIcon } from '../../components/icons'
import {
  ROLE_LABELS,
  useCampaignInvites,
  useCampaignMembers,
  useCreateInvite,
  useDecideJoinRequest,
  useJoinRequests,
  useRemoveMember,
  useRevokeInvite,
  useUpdateCampaign,
  type CampaignInvite,
  type MemberRole,
  type Membership,
} from './api'
import styles from './CampaignAdmin.module.less'

/** Sezioni del pannello Master: dati della campagna, richieste, membri, inviti. */
export function CampaignAdmin({ campaign }: { campaign: Membership['campaign'] }) {
  return (
    <div className={styles.columns}>
      <CampaignDetails campaign={campaign} />
      <Members campaignId={campaign.id} />
      <Invites campaignId={campaign.id} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function CampaignDetails({ campaign }: { campaign: Membership['campaign'] }) {
  const update = useUpdateCampaign(campaign.id)
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description)

  // Dopo il salvataggio (o un cambio da altrove) il form riparte dai valori salvati
  useEffect(() => {
    setName(campaign.name)
    setDescription(campaign.description)
  }, [campaign.name, campaign.description])

  const changed = name.trim() !== campaign.name || description.trim() !== campaign.description

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ name: name.trim(), description: description.trim() })
  }

  return (
    <form className={`card ${styles.section}`} onSubmit={handleSubmit}>
      <h2>Campagna</h2>
      <label className="field">
        <span>Nome</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="field">
        <span>Descrizione</span>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {update.error && <p className="error-box">{update.error.message}</p>}
      <div className={styles.actions}>
        <button className="btn btn--primary" type="submit" disabled={!changed || name.trim() === '' || update.isPending}>
          Salva
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------

function Members({ campaignId }: { campaignId: string }) {
  const user = useUser()
  const { data: requests } = useJoinRequests(campaignId)
  const { data: members, isPending, error } = useCampaignMembers(campaignId)
  const decide = useDecideJoinRequest(campaignId)
  const remove = useRemoveMember(campaignId)

  function confirmRemove(userId: string, name: string) {
    if (window.confirm(`Rimuovere ${name} dalla campagna? I suoi personaggi restano.`)) remove.mutate(userId)
  }

  return (
    <section className={`card ${styles.section}`}>
      {requests && requests.length > 0 && (
        <>
          <h2>
            Richieste <span className={styles.count}>{requests.length}</span>
          </h2>
          <ul className={styles.list}>
            {requests.map((r) => (
              <li key={r.id} className={styles.row}>
                <span className={styles.main}>
                  <strong>{r.user?.display_name ?? '—'}</strong>
                  <span className={styles.meta}>
                    {ROLE_LABELS[r.role]} · {formatDateTime(r.created_at)}
                  </span>
                </span>
                <span className={styles.rowActions}>
                  <button
                    className="btn btn--small btn--primary"
                    onClick={() => decide.mutate({ requestId: r.id, accept: true })}
                    disabled={decide.isPending}
                  >
                    <CheckIcon aria-hidden /> Accetta
                  </button>
                  <button
                    className="btn btn--small btn--danger"
                    onClick={() => decide.mutate({ requestId: r.id, accept: false })}
                    disabled={decide.isPending}
                  >
                    <CloseIcon aria-hidden /> Rifiuta
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {decide.error && <p className="error-box">{decide.error.message}</p>}
        </>
      )}

      <h2>
        Membri <span className={styles.count}>{members?.length ?? 0}</span>
      </h2>
      {isPending && <p className="muted">Caricamento…</p>}
      {error && <p className="error-box">{error.message}</p>}
      <ul className={styles.list}>
        {members?.map((m) => {
          const name = m.profile?.display_name ?? '—'
          const removable = m.role === 'player' && m.user_id !== user.id
          return (
            <li key={m.user_id} className={styles.row}>
              <span className={styles.main}>
                <strong>{name}</strong>
                <span className={m.role === 'master' ? styles.roleMaster : styles.meta}>{ROLE_LABELS[m.role]}</span>
              </span>
              {removable && (
                <button
                  className="btn btn--small btn--ghost btn--danger"
                  onClick={() => confirmRemove(m.user_id, name)}
                  disabled={remove.isPending}
                  aria-label={`Rimuovi ${name}`}
                  title="Rimuovi"
                >
                  <RemoveMemberIcon aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {remove.error && <p className="error-box">{remove.error.message}</p>}
    </section>
  )
}

// ---------------------------------------------------------------------------

function inviteUrl(id: string): string {
  return `${window.location.origin}/invito/${id}`
}

function Invites({ campaignId }: { campaignId: string }) {
  const { data: invites, isPending, error } = useCampaignInvites(campaignId)
  const create = useCreateInvite(campaignId)
  const [role, setRole] = useState<MemberRole>('player')
  const [singleUse, setSingleUse] = useState(true)
  const [created, setCreated] = useState<string | null>(null)

  async function handleCreate() {
    const id = await create.mutateAsync({ role, singleUse })
    setCreated(id)
  }

  return (
    <section className={`card ${styles.section}`}>
      <h2>Inviti</h2>

      <div className={styles.newInvite}>
        <Segmented
          label="Ruolo"
          value={role}
          options={[
            { value: 'player', label: 'Giocatore' },
            { value: 'master', label: 'Master' },
          ]}
          onChange={setRole}
        />
        <Segmented
          label="Tipo"
          value={singleUse ? 'single' : 'multi'}
          options={[
            { value: 'single', label: 'Monouso' },
            { value: 'multi', label: 'Riutilizzabile' },
          ]}
          onChange={(v) => setSingleUse(v === 'single')}
        />
        <button className="btn btn--primary" onClick={handleCreate} disabled={create.isPending}>
          <InviteIcon aria-hidden /> Nuovo invito
        </button>
      </div>
      {create.error && <p className="error-box">{create.error.message}</p>}

      {isPending && <p className="muted">Caricamento…</p>}
      {error && <p className="error-box">{error.message}</p>}
      {invites?.length === 0 && <p className="muted">Nessun invito attivo.</p>}
      <ul className={styles.list}>
        {invites?.map((invite) => (
          <InviteRow key={invite.id} campaignId={campaignId} invite={invite} highlighted={invite.id === created} />
        ))}
      </ul>
    </section>
  )
}

function InviteRow({ campaignId, invite, highlighted }: { campaignId: string; invite: CampaignInvite; highlighted: boolean }) {
  const revoke = useRevokeInvite(campaignId)
  const [copied, setCopied] = useState(false)
  const url = inviteUrl(invite.id)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function confirmRevoke() {
    if (window.confirm('Revocare questo invito?')) revoke.mutate(invite.id)
  }

  return (
    <li className={highlighted ? `${styles.row} ${styles.highlighted}` : styles.row}>
      <span className={styles.main}>
        <strong>
          {ROLE_LABELS[invite.role]} · {invite.single_use ? 'Monouso' : 'Riutilizzabile'}
        </strong>
        <span className={styles.meta}>
          Scade {formatDateTime(invite.expires_at)} · {invite.uses} {invite.uses === 1 ? 'utilizzo' : 'utilizzi'}
        </span>
        <input className={`input ${styles.url}`} value={url} readOnly onFocus={(e) => e.target.select()} aria-label="Link d'invito" />
      </span>
      <span className={styles.rowActions}>
        <button className="btn btn--small" onClick={copy} aria-label="Copia il link" title="Copia">
          {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        </button>
        <button
          className="btn btn--small btn--ghost btn--danger"
          onClick={confirmRevoke}
          disabled={revoke.isPending}
          aria-label="Revoca l'invito"
          title="Revoca"
        >
          <RevokeIcon aria-hidden />
        </button>
      </span>
    </li>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={o.value === value ? styles.segmentActive : styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
