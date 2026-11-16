import { useState } from 'react'
import { useUser } from '../../../auth/AuthProvider'
import { THREAD_TARGET_LABELS, useCharacterThreads, type Thread, type ThreadStatus } from '../../../threads/api'
import { NewThreadForm } from '../../../threads/AskMasterButton'
import { StatusBadge, ThreadConversation } from '../../../threads/ThreadConversation'
import { formatDateTime } from '../../../../lib/format'
import { AddIcon, AskIcon, CollapseIcon, ExpandIcon } from '../../../../components/icons'
import type { CharacterSheet } from '../../api'
import styles from './QuestionsTab.module.less'

const FILTERS: { key: ThreadStatus | 'active'; label: string }[] = [
  { key: 'active', label: 'Aperte' },
  { key: 'open', label: 'In attesa' },
  { key: 'answered', label: 'Con risposta' },
  { key: 'closed', label: 'Chiuse' },
]

/** Domande al Master del personaggio (comprese le preghiere). */
export function QuestionsTab({ sheet }: { sheet: CharacterSheet }) {
  const { data: threads, isPending, error } = useCharacterThreads(sheet.id)
  const [filter, setFilter] = useState<ThreadStatus | 'active'>('active')
  const [asking, setAsking] = useState(false)

  if (isPending) return <p className="muted">Caricamento domande…</p>
  if (error) return <p className="error-box">Domande non disponibili: {error.message}</p>

  const visible = threads.filter((t) => (filter === 'active' ? t.status !== 'closed' : t.status === filter))

  return (
    <section className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filtro">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? styles.filterActive : styles.filter}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn btn--primary" onClick={() => setAsking((v) => !v)}>
          {asking ? 'Annulla' : (
            <>
              <AddIcon aria-hidden /> Nuova domanda
            </>
          )}
        </button>
      </div>

      {asking && (
        <div className="card">
          <NewThreadForm
            characterId={sheet.id}
            targetType="character"
            targetId={null}
            defaultTitle=""
            onCreated={() => {
              setAsking(false)
              setFilter('active')
            }}
          />
        </div>
      )}

      <p className={styles.hint}>
        Puoi fare una domanda anche da ogni elemento della scheda con il pulsante <AskIcon aria-label="domanda" />.
      </p>

      {visible.length === 0 ? (
        <p className="muted">Nessuna domanda.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((thread) => (
            <ThreadItem key={thread.id} sheet={sheet} thread={thread} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ThreadItem({ sheet, thread }: { sheet: CharacterSheet; thread: Thread }) {
  const user = useUser()
  const [open, setOpen] = useState(thread.status === 'answered' && user.id === sheet.owner_id)
  const last = thread.thread_messages.at(-1)

  return (
    <li className={styles.item}>
      <button type="button" className={styles.itemHeader} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? <CollapseIcon className={styles.chevron} aria-hidden /> : <ExpandIcon className={styles.chevron} aria-hidden />}
        <span className={styles.itemTitle}>
          <strong>{thread.title}</strong>
          <span className={styles.meta}>
            {THREAD_TARGET_LABELS[thread.target_type]} · {thread.thread_messages.length} messaggi · ultimo{' '}
            {formatDateTime(thread.last_message_at)}
          </span>
          {!open && last && <span className={styles.preview}>{last.body.slice(0, 140)}</span>}
        </span>
        <StatusBadge status={thread.status} />
      </button>
      {open && (
        <div className={styles.itemBody}>
          <ThreadConversation thread={thread} ownerId={sheet.owner_id} viewerId={user.id} />
        </div>
      )}
    </li>
  )
}
