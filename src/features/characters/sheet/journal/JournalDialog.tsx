import { useState, type FormEvent } from 'react'
import { Dialog } from '../../../../components/Dialog'
import {
  JOURNAL_KINDS,
  JOURNAL_KIND_KEYS,
  useSaveJournalEntry,
  type JournalEntry,
  type JournalKind,
} from '../../../journal/api'
import styles from '../powers/PowerDialog.module.less'

interface Props {
  characterId: string
  open: boolean
  entry?: JournalEntry
  chapters: string[]
  defaultChapter?: string
  onClose: () => void
}

export function JournalDialog({ characterId, open, entry, chapters, defaultChapter, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={entry ? 'Modifica voce' : 'Nuova voce di diario'} width={760}>
      <JournalForm
        key={entry?.id ?? 'new'}
        characterId={characterId}
        entry={entry}
        chapters={chapters}
        defaultChapter={defaultChapter}
        onDone={onClose}
      />
    </Dialog>
  )
}

const ADDRESSABLE: JournalKind[] = ['prayer', 'communication', 'conversation']

function JournalForm({
  characterId,
  entry,
  chapters,
  defaultChapter,
  onDone,
}: {
  characterId: string
  entry?: JournalEntry
  chapters: string[]
  defaultChapter?: string
  onDone: () => void
}) {
  const save = useSaveJournalEntry(characterId)
  const [kind, setKind] = useState<JournalKind>(entry?.kind ?? 'note')
  const [chapter, setChapter] = useState(entry?.chapter ?? defaultChapter ?? '')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [addressedTo, setAddressedTo] = useState(entry?.addressed_to ?? '')
  const [body, setBody] = useState(entry?.body ?? '')
  const [tags, setTags] = useState(entry?.tags.join(', ') ?? '')
  const [visibility, setVisibility] = useState(entry?.visibility ?? 'master')
  const [done, setDone] = useState(entry?.done ?? false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await save.mutateAsync({
      id: entry?.id,
      fields: {
        kind,
        chapter: chapter.trim() || null,
        title: title.trim() || null,
        addressed_to: ADDRESSABLE.includes(kind) ? addressedTo.trim() || null : null,
        body,
        tags: tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
        // una preghiera deve poterla leggere il Master
        visibility: kind === 'prayer' ? 'master' : visibility,
        done: JOURNAL_KINDS[kind].checkable ? done : false,
      },
    })
    onDone()
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label className="field">
          <span>Tipo</span>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as JournalKind)}>
            {JOURNAL_KIND_KEYS.map((k) => (
              <option key={k} value={k}>
                {JOURNAL_KINDS[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className={`field ${styles.wide}`}>
          <span>Capitolo</span>
          <input
            className="input"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            list="journal-chapters"
            placeholder="es. Capitolo 12 – Euphyr"
          />
          <datalist id="journal-chapters">
            {chapters.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      <div className={styles.row}>
        <label className={`field ${styles.wide}`}>
          <span>Titolo</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        {ADDRESSABLE.includes(kind) && (
          <label className="field">
            <span>{kind === 'prayer' ? 'Rivolta a' : 'Con / a'}</span>
            <input
              className="input"
              value={addressedTo}
              onChange={(e) => setAddressedTo(e.target.value)}
              placeholder={kind === 'prayer' ? 'es. Tarooth' : ''}
            />
          </label>
        )}
      </div>

      <label className="field">
        <span>Testo (markdown: **grassetto**, *corsivo*, - elenchi)</span>
        <textarea className="textarea" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>

      <div className={styles.row}>
        <label className={`field ${styles.wide}`}>
          <span>Etichette (separate da virgola)</span>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="es. Malek, reliquie" />
        </label>
        <label className="field">
          <span>Visibilità</span>
          <select
            className="select"
            value={kind === 'prayer' ? 'master' : visibility}
            disabled={kind === 'prayer'}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          >
            <option value="master">Visibile al Master</option>
            <option value="private">Privata</option>
          </select>
        </label>
      </div>

      {JOURNAL_KINDS[kind].checkable && (
        <label className={styles.check}>
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
          Fatto
        </label>
      )}

      {save.error && <p className="error-box">Errore: {save.error.message}</p>}

      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Annulla
        </button>
        <button className="btn btn--primary" type="submit" disabled={save.isPending || (!title.trim() && !body.trim())}>
          {entry ? 'Salva' : 'Aggiungi'}
        </button>
      </div>
    </form>
  )
}
