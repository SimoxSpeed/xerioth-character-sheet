import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { RESOURCES, type ResourceKey } from '../../game/data/classes'
import { DIE_LABELS, coinLabel, rollValuesText, currentHp, maxHp } from '../../game/rules'
import { ProgressBar } from '../../components/ProgressBar'
import { useUser } from '../auth/AuthProvider'
import { useIsMaster, useMemberships } from '../campaigns/api'
import { CampaignAdmin } from '../campaigns/CampaignAdmin'
import { classesLabel } from '../characters/labels'
import { useCatalog } from '../catalog/store'
import { SLOT_LABELS } from '../characters/sheet/sheetHelpers'
import { OUTCOME_LABELS, useCampaignRolls, useDiceRealtime } from '../dice/api'
import { THREAD_TARGET_LABELS, useCampaignThreads, useCampaignThreadsRealtime, type CampaignThread } from '../threads/api'
import { StatusBadge, ThreadConversation } from '../threads/ThreadConversation'
import { formatDateTime } from '../../lib/format'
import { useParty, type PartyMember } from './api'
import styles from './MasterPanelPage.module.less'
import { BackIcon, CollapseIcon, ExpandIcon, ForwardIcon, HiddenIcon } from '../../components/icons'

export function MasterPanelPage() {
  const { campaignId = '' } = useParams()
  const { data: memberships, isPending } = useMemberships()
  const isMaster = useIsMaster(campaignId)
  useCampaignThreadsRealtime(isMaster ? campaignId : undefined)
  useDiceRealtime(isMaster ? campaignId : undefined)

  if (isPending) return <p className="muted">Caricamento…</p>
  if (!isMaster) return <p className="error-box">Il pannello è riservato al Master della campagna.</p>

  const campaign = memberships?.find((m) => m.campaign.id === campaignId)?.campaign

  return (
    <div className={styles.page}>
      <Link to="/" className="muted">
        <BackIcon aria-hidden /> Campagne
      </Link>
      <h1 className={styles.title}>Pannello Master · {campaign?.name}</h1>

      <div className={styles.columns}>
        <PendingQuestions campaignId={campaignId} />
        <GroupRolls campaignId={campaignId} />
      </div>

      {campaign && <CampaignAdmin campaign={campaign} />}

      <Party campaignId={campaignId} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function PendingQuestions({ campaignId }: { campaignId: string }) {
  const { data: threads, isPending, error } = useCampaignThreads(campaignId)
  const [showAnswered, setShowAnswered] = useState(false)
  const visible = (threads ?? []).filter((t) => t.status === 'open' || (showAnswered && t.status === 'answered'))

  return (
    <section className="card">
      <header className={styles.sectionHeader}>
        <h2>
          Domande in attesa <span className={styles.count}>{threads?.filter((t) => t.status === 'open').length ?? 0}</span>
        </h2>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showAnswered} onChange={(e) => setShowAnswered(e.target.checked)} />
          mostra anche quelle con risposta
        </label>
      </header>
      {isPending && <p className="muted">Caricamento…</p>}
      {error && <p className="error-box">{error.message}</p>}
      {!isPending && visible.length === 0 && <p className="muted">Nessuna domanda in attesa.</p>}
      <ul className={styles.list}>
        {visible.map((thread) => (
          <QuestionItem key={thread.id} thread={thread} />
        ))}
      </ul>
    </section>
  )
}

function QuestionItem({ thread }: { thread: CampaignThread }) {
  const user = useUser()
  const [open, setOpen] = useState(false)
  const last = thread.thread_messages.at(-1)
  const character = thread.character

  return (
    <li className={styles.question}>
      <button type="button" className={styles.questionHeader} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? <CollapseIcon className={styles.chevron} aria-hidden /> : <ExpandIcon className={styles.chevron} aria-hidden />}
        <span className={styles.questionMain}>
          <strong>{thread.title}</strong>
          <span className={styles.meta}>
            {character?.name} · {THREAD_TARGET_LABELS[thread.target_type]} · {formatDateTime(thread.last_message_at)}
          </span>
          {!open && last && <span className={styles.preview}>{last.body.slice(0, 160)}</span>}
        </span>
        <StatusBadge status={thread.status} />
      </button>
      {open && character && (
        <div className={styles.questionBody}>
          <ThreadConversation thread={thread} ownerId={character.owner_id} viewerId={user.id} />
          <Link to={`/personaggi/${character.id}?scheda=domande`} className={styles.sheetLink}>
            Apri la scheda di {character.name} <ForwardIcon aria-hidden />
          </Link>
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------

function GroupRolls({ campaignId }: { campaignId: string }) {
  const { data: rolls, isPending, error } = useCampaignRolls(campaignId)

  return (
    <section className="card">
      <header className={styles.sectionHeader}>
        <h2>Tiri del gruppo</h2>
        <span className={styles.live}>in diretta</span>
      </header>
      {isPending && <p className="muted">Caricamento…</p>}
      {error && <p className="error-box">{error.message}</p>}
      {rolls?.length === 0 && <p className="muted">Ancora nessun tiro.</p>}
      <ul className={styles.rolls}>
        {rolls?.map((roll) => (
          <li key={roll.id} className={roll.hidden ? styles.hiddenRoll : undefined}>
            <span className={styles.rollTotal}>{roll.die === 'coin' ? coinLabel(roll.results[0] ?? 1) : (roll.total ?? '·')}</span>
            <span className={styles.questionMain}>
              <strong>
                {roll.character?.name}: {roll.label || DIE_LABELS[roll.die]}
              </strong>
              <span className={styles.meta}>
                {rollValuesText(roll.die, roll.results, (roll.details as { power?: boolean } | null)?.power === true)} ·{' '}
                {formatDateTime(roll.created_at)}
                {roll.hidden && (
                  <>
                    {' · '}
                    <HiddenIcon aria-hidden /> nascosto
                  </>
                )}
              </span>
            </span>
            {roll.outcome && (
              <span className={roll.outcome === 'success' ? styles.success : styles.failure}>
                {OUTCOME_LABELS[roll.outcome]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------

function Party({ campaignId }: { campaignId: string }) {
  const { data: party, isPending, error } = useParty(campaignId)
  return (
    <section>
      <h2 className={styles.partyTitle}>Personaggi</h2>
      {isPending && <p className="muted">Caricamento…</p>}
      {error && <p className="error-box">{error.message}</p>}
      <ul className={styles.party}>
        {party?.map((member) => (
          <PartyCard key={member.id} member={member} />
        ))}
      </ul>
    </section>
  )
}

function PartyCard({ member }: { member: PartyMember }) {
  const catalog = useCatalog()
  const costituzione = member.character_attributes.find((a) => a.attribute === 'costituzione')?.value ?? 10
  const forzaLevel = member.character_skills.find((s) => s.skill_key === 'forza')?.level ?? 0
  const hpMax = maxHp({
    costituzione,
    forzaLevel,
    hpCoefficient: catalog.race(member.race_key)?.hpCoefficient,
    hpBonus: member.hp_bonus,
  })
  const hp = hpMax === null ? null : currentHp(hpMax, member.temp_hp, member.damage_taken)

  return (
    <li className={`card ${styles.member}`}>
      <header>
        <Link to={`/personaggi/${member.id}`}>
          <strong>{member.name}</strong>
        </Link>
        <span className={styles.meta}>
          {classesLabel(member.character_classes)} · Liv. {member.level}
          {member.owner && ` · ${member.owner.display_name}`}
        </span>
      </header>

      <div className={styles.stat}>
        <span className={styles.statLabel}>PF</span>
        <span className={styles.statValue}>
          {hp ?? '—'} / {hpMax ?? '—'}
          {member.temp_hp > 0 && <span className={styles.meta}> (+{member.temp_hp} temp.)</span>}
        </span>
        {hpMax !== null && hp !== null && <ProgressBar label={`PF di ${member.name}`} value={hp} max={hpMax} tone="hp" />}
      </div>

      {member.character_resources.map((r) => {
        const def = RESOURCES[r.resource_key as ResourceKey]
        const max = r.max ?? def?.cap ?? null
        return (
          <div key={r.resource_key} className={styles.stat}>
            <span className={styles.statLabel}>{def?.label ?? r.resource_key}</span>
            <span className={styles.statValue}>
              {r.current}
              {max !== null && ` / ${max}`}
            </span>
            {max !== null && <ProgressBar label={def?.label ?? r.resource_key} value={r.current} max={max} tone="info" />}
          </div>
        )
      })}

      <div className={styles.equipped}>
        <span className={styles.statLabel}>Equipaggiato</span>
        {member.character_items.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          <ul>
            {member.character_items.map((i) => (
              <li key={i.id} title={i.description || undefined}>
                <span className={styles.slot}>{i.slot ? SLOT_LABELS[i.slot] : 'Altro'}</span> {i.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
