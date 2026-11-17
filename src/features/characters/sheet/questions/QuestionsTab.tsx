import { useState } from 'react'
import { useUser } from '../../../auth/AuthProvider'
import { THREAD_TARGET_LABELS, useCharacterThreads, type Thread, type ThreadStatus } from '../../../threads/api'
import { NewThreadForm } from '../../../threads/AskMasterButton'
import { StatusBadge, ThreadConversation } from '../../../threads/ThreadConversation'
import { formatDateTime } from '../../../../lib/format'
import { AddIcon, AskIcon, CollapseIcon, EditMarkIcon, ExpandIcon } from '../../../../components/icons'
import type { CharacterSheet } from '../../api'
import { useDismissMasterEdits, useMasterEdits, type MasterEdit } from '../../../masterEdits/api'
import { useIsOwner } from '../sheetContext'
import { EDIT_TARGET_LABELS, editChange, editFieldName, editTargetName } from '../../../masterEdits/labels'
import styles from './QuestionsTab.module.less'

type Filter = ThreadStatus | 'active' | 'edits'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Aperte' },
  { key: 'open', label: 'In attesa' },
  { key: 'answered', label: 'Con risposta' },
  { key: 'closed', label: 'Chiuse' },
  { key: 'edits', label: 'Modifiche del Master' },
]

/** Domande al Master del personaggio (comprese le preghiere) e storico delle modifiche del Master. */
export function QuestionsTab({ sheet }: { sheet: CharacterSheet }) {
  const { data: threads, isPending, error } = useCharacterThreads(sheet.id)
  const { data: edits } = useMasterEdits(sheet.id)
  const isOwner = useIsOwner()
  const [filter, setFilter] = useState<Filter>('active')
  const [asking, setAsking] = useState(false)

  if (isPending) return <p className="muted">Caricamento domande…</p>
  if (error) return <p className="error-box">Domande non disponibili: {error.message}</p>

  const visible = threads.filter((t) => (filter === 'active' ? t.status !== 'closed' : t.status === filter))

  // Stessi conteggi del badge della linguetta: al giocatore risposte e modifiche da vedere,
  // al Master le domande in attesa
  const badges: Partial<Record<Filter, number>> = isOwner
    ? {
        answered: threads.filter((t) => t.status === 'answered').length,
        edits: (edits ?? []).filter((e) => e.dismissed_at === null).length,
      }
    : { open: threads.filter((t) => t.status === 'open').length }

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
              {!!badges[f.key] && <span className={styles.badge}>{badges[f.key]}</span>}
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

      {filter === 'edits' ? (
        <MasterEditsHistory characterId={sheet.id} />
      ) : (
        <>
          <p className={styles.hint}>
            Puoi fare una domanda anche da ogni elemento della scheda con il pulsante <AskIcon aria-label="domanda" />.
          </p>
          <ThreadList sheet={sheet} threads={visible} />
        </>
      )}
    </section>
  )
}

function ThreadList({ sheet, threads }: { sheet: CharacterSheet; threads: Thread[] }) {
  if (threads.length === 0) return <p className="muted">Nessuna domanda.</p>
  return (
    <ul className={styles.list}>
      {threads.map((thread) => (
        <ThreadItem key={thread.id} sheet={sheet} thread={thread} />
      ))}
    </ul>
  )
}

/**
 * Storico delle modifiche del Master, raggruppate per salvataggio. Non si risponde e non si annulla;
 * il giocatore toglie da qui il segno delle modifiche che ha visto (anche di elementi eliminati).
 */
function MasterEditsHistory({ characterId }: { characterId: string }) {
  const { data: edits, isPending, error } = useMasterEdits(characterId)
  const dismiss = useDismissMasterEdits(characterId)
  const isOwner = useIsOwner()

  if (isPending) return <p className="muted">Caricamento…</p>
  if (error) return <p className="error-box">{error.message}</p>
  if (edits.length === 0) return <p className="muted">Nessuna modifica del Master.</p>

  // Le righe dello stesso salvataggio hanno lo stesso istante e lo stesso Master
  const groups: MasterEdit[][] = []
  for (const edit of edits) {
    const last = groups.at(-1)
    const head = last?.[0]
    if (head && head.updated_at === edit.updated_at && head.editor?.display_name === edit.editor?.display_name) last.push(edit)
    else groups.push([edit])
  }

  return (
    <ul className={styles.list}>
      {groups.map((group) => {
        const head = group[0]!
        const reasons = [...new Set(group.map((e) => e.reason).filter((r): r is string => !!r))]
        // Segni ancora presenti: li vede (e li toglie) solo il giocatore
        const marked = isOwner ? group.filter((e) => e.dismissed_at === null) : []
        return (
          <li key={head.id} className={marked.length > 0 ? `${styles.edit} ${styles.editMarked}` : styles.edit}>
            <div className={styles.editHeader}>
              <span className={styles.meta}>
                {head.editor?.display_name ?? 'Master'} · {formatDateTime(head.updated_at)}
              </span>
              {marked.length > 0 && (
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => dismiss.mutate(marked.map((e) => e.id))}
                  disabled={dismiss.isPending}
                >
                  Togli
                </button>
              )}
            </div>
            <ul className={styles.editRows}>
              {group.map((edit) => {
                const change = editChange(edit)
                return (
                  <li key={edit.id}>
                    {isOwner && edit.dismissed_at === null && <EditMarkIcon className={styles.editMarkIcon} aria-label="Da vedere" />}
                    <strong>{editTargetName(edit)}</strong>
                    {edit.target_type !== 'character' && ` (${EDIT_TARGET_LABELS[edit.target_type]})`} · {editFieldName(edit)}
                    {change && <span className={styles.editChange}>{change}</span>}
                  </li>
                )
              })}
            </ul>
            {reasons.map((r) => (
              <p key={r} className={styles.editReason}>
                {r}
              </p>
            ))}
          </li>
        )
      })}
    </ul>
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
