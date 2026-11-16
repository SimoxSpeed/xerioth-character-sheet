import { useMemo, useState } from 'react'
import { Markdown } from '../../../../components/Markdown'
import { AddIcon, DeleteIcon, EditIcon, ForwardIcon, SendIcon } from '../../../../components/icons'
import { useUser } from '../../../auth/AuthProvider'
import {
  JOURNAL_KINDS,
  JOURNAL_KIND_KEYS,
  useDeleteJournalEntry,
  useJournal,
  useSaveJournalEntry,
  type JournalEntry,
  type JournalKind,
} from '../../../journal/api'
import { latestThreadFor, useCharacterThreads, useCreateThread } from '../../../threads/api'
import { AskMasterButton } from '../../../threads/AskMasterButton'
import { StatusBadge, ThreadConversation } from '../../../threads/ThreadConversation'
import type { CharacterSheet } from '../../api'
import { JournalDialog } from './JournalDialog'
import styles from './JournalTab.module.less'

const NO_CHAPTER = 'Senza capitolo'

type DialogState = { mode: 'add' } | { mode: 'edit'; entry: JournalEntry } | null

export function JournalTab({ sheet }: { sheet: CharacterSheet }) {
  const user = useUser()
  const canEdit = user.id === sheet.owner_id
  const { data: entries, isPending, error } = useJournal(sheet.id)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<JournalKind | ''>('')
  const [chapter, setChapter] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)

  const chapters = useMemo(() => {
    const list: string[] = []
    for (const e of entries ?? []) {
      const c = e.chapter?.trim() || NO_CHAPTER
      if (!list.includes(c)) list.push(c)
    }
    return list
  }, [entries])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (entries ?? []).filter(
      (e) =>
        (!kind || e.kind === kind) &&
        (!chapter || (e.chapter?.trim() || NO_CHAPTER) === chapter) &&
        (!query ||
          [e.title, e.chapter, e.body, e.addressed_to, ...e.tags].some((t) => t?.toLowerCase().includes(query))),
    )
  }, [entries, search, kind, chapter])

  if (isPending) return <p className="muted">Caricamento diario…</p>
  if (error) return <p className="error-box">Diario non disponibile: {error.message}</p>

  const groups = chapters
    .map((c) => ({ chapter: c, entries: filtered.filter((e) => (e.chapter?.trim() || NO_CHAPTER) === c) }))
    .filter((g) => g.entries.length > 0)

  return (
    <section className={styles.tab}>
      <div className={styles.toolbar}>
        <input
          className="input"
          type="search"
          placeholder="Cerca nel diario…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca nel diario"
        />
        <select className="select" value={kind} onChange={(e) => setKind(e.target.value as JournalKind | '')} aria-label="Tipo">
          <option value="">Tutti i tipi</option>
          {JOURNAL_KIND_KEYS.map((k) => (
            <option key={k} value={k}>
              {JOURNAL_KINDS[k].label}
            </option>
          ))}
        </select>
        <select className="select" value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Capitolo">
          <option value="">Tutti i capitoli</option>
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {canEdit && (
          <button className="btn btn--primary" onClick={() => setDialog({ mode: 'add' })}>
            <AddIcon aria-hidden /> Nuova voce
          </button>
        )}
      </div>

      {!canEdit && (
        <p className="muted">Come Master vedi solo le voci che il giocatore ha reso visibili; il diario lo modifica solo il giocatore.</p>
      )}

      {groups.length === 0 && (
        <p className="muted">{(entries ?? []).length === 0 ? 'Il diario è vuoto.' : 'Nessuna voce corrisponde ai filtri.'}</p>
      )}

      {groups.map((group) => (
        <div key={group.chapter} className={styles.group}>
          <h2 className={styles.chapter}>{group.chapter}</h2>
          <ul className={styles.list}>
            {group.entries.map((entry) => (
              <JournalCard
                key={entry.id}
                sheet={sheet}
                entry={entry}
                canEdit={canEdit}
                onEdit={() => setDialog({ mode: 'edit', entry })}
              />
            ))}
          </ul>
        </div>
      ))}

      <JournalDialog
        characterId={sheet.id}
        open={dialog !== null}
        entry={dialog?.mode === 'edit' ? dialog.entry : undefined}
        chapters={chapters.filter((c) => c !== NO_CHAPTER)}
        defaultChapter={chapter && chapter !== NO_CHAPTER ? chapter : undefined}
        onClose={() => setDialog(null)}
      />
    </section>
  )
}

function JournalCard({
  sheet,
  entry,
  canEdit,
  onEdit,
}: {
  sheet: CharacterSheet
  entry: JournalEntry
  canEdit: boolean
  onEdit: () => void
}) {
  const save = useSaveJournalEntry(sheet.id)
  const remove = useDeleteJournalEntry(sheet.id)
  const [expanded, setExpanded] = useState(false)
  const info = JOURNAL_KINDS[entry.kind]
  const KindIcon = info.icon
  const isLong = entry.body.length > 600

  function confirmDelete() {
    if (window.confirm(`Eliminare la voce "${entry.title || info.label}"?`)) remove.mutate(entry.id)
  }

  return (
    <li className={`${styles.card} ${entry.done ? styles.done : ''}`}>
      <header className={styles.cardHeader}>
        {info.checkable && (
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={entry.done}
            disabled={!canEdit}
            onChange={(e) => save.mutate({ id: entry.id, fields: { done: e.target.checked } })}
            aria-label="Fatto"
          />
        )}
        <span className={styles.kind}>
          <KindIcon aria-hidden /> {info.label}
        </span>
        <h3 className={styles.title}>
          {entry.title || <span className="muted">Senza titolo</span>}
          {entry.addressed_to && (
            <span className={styles.addressed}>
              {' '}
              <ForwardIcon aria-label="a" /> {entry.addressed_to}
            </span>
          )}
        </h3>
        {entry.visibility === 'private' && (
          <span className={styles.private} title="Il Master non la vede">
            Privata
          </span>
        )}
        <span className={styles.actions}>
          {entry.kind !== 'prayer' && (
            <AskMasterButton
              characterId={sheet.id}
              ownerId={sheet.owner_id}
              targetType="journal"
              targetId={entry.id}
              defaultTitle={`Diario: ${entry.title || info.label}`}
            />
          )}
          {canEdit && (
            <>
              <button type="button" className="btn btn--ghost btn--square" onClick={onEdit} aria-label="Modifica" title="Modifica">
                <EditIcon aria-hidden />
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--square btn--danger"
                onClick={confirmDelete}
                aria-label="Elimina"
                title="Elimina"
              >
                <DeleteIcon aria-hidden />
              </button>
            </>
          )}
        </span>
      </header>

      {entry.body && (
        <div className={isLong && !expanded ? styles.bodyClamped : styles.body}>
          <Markdown>{entry.body}</Markdown>
        </div>
      )}
      {isLong && (
        <button type="button" className={styles.more} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Mostra meno' : 'Mostra tutto'}
        </button>
      )}
      {entry.tags.length > 0 && (
        <ul className={styles.tags}>
          {entry.tags.map((t) => (
            <li key={t}>#{t}</li>
          ))}
        </ul>
      )}

      {entry.kind === 'prayer' && <PrayerThread sheet={sheet} entry={entry} canEdit={canEdit} />}
    </li>
  )
}

/** Una preghiera si invia al Master come domanda: qui si vede la conversazione. */
function PrayerThread({ sheet, entry, canEdit }: { sheet: CharacterSheet; entry: JournalEntry; canEdit: boolean }) {
  const user = useUser()
  const { data: threads } = useCharacterThreads(sheet.id)
  const create = useCreateThread()
  const thread = latestThreadFor(threads, 'journal', entry.id)
  const [open, setOpen] = useState(false)

  if (!thread) {
    if (!canEdit) return null
    return (
      <div className={styles.prayer}>
        <button
          type="button"
          className="btn btn--small"
          disabled={!entry.body.trim() || create.isPending}
          onClick={() =>
            create.mutate({
              characterId: sheet.id,
              targetType: 'journal',
              targetId: entry.id,
              title: `Preghiera: ${entry.title || entry.addressed_to || 'senza titolo'}`,
              body: entry.body,
            })
          }
          title={entry.body.trim() ? 'Il testo della preghiera viene inviato al Master' : 'Scrivi prima il testo'}
        >
          <SendIcon aria-hidden /> Invia la preghiera al Master
        </button>
        {create.error && <p className="error-box">Errore: {create.error.message}</p>}
      </div>
    )
  }

  const replies = thread.thread_messages.length - 1
  return (
    <div className={styles.prayer}>
      <div className={styles.prayerHeader}>
        <StatusBadge status={thread.status} />
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Nascondi conversazione' : `Conversazione (${replies} ${replies === 1 ? 'risposta' : 'risposte'})`}
        </button>
      </div>
      {open && <ThreadConversation thread={thread} ownerId={sheet.owner_id} viewerId={user.id} />}
    </div>
  )
}
