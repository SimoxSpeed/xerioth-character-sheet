import { useState, type FormEvent } from 'react'
import { Dialog } from '../../components/Dialog'
import { AskIcon } from '../../components/icons'
import { useUser } from '../auth/AuthProvider'
import { latestThreadFor, useCharacterThreads, useCreateThread, type ThreadTarget } from './api'
import { StatusBadge, ThreadConversation } from './ThreadConversation'
import styles from './Threads.module.less'

interface TargetProps {
  characterId: string
  ownerId: string
  targetType: ThreadTarget
  targetId: string | null
  /** Titolo proposto per una nuova domanda, es. "Capacità: Furtività". */
  defaultTitle: string
}

/** Icona "domanda" su un elemento della scheda: apre la domanda esistente o ne crea una nuova. */
export function AskMasterButton(props: TargetProps) {
  const [open, setOpen] = useState(false)
  const { data: threads } = useCharacterThreads(props.characterId)
  const thread = latestThreadFor(threads, props.targetType, props.targetId)
  const toneClass = thread?.status === 'open' ? styles.askOpen : thread?.status === 'answered' ? styles.askAnswered : ''

  return (
    <>
      <button
        type="button"
        className={`btn btn--ghost btn--square ${styles.ask} ${toneClass}`}
        onClick={() => setOpen(true)}
        title={thread ? `Domanda al Master: ${thread.title}` : 'Fai una domanda al Master'}
        aria-label={`Domanda al Master su ${props.defaultTitle}`}
      >
        <AskIcon aria-hidden />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={thread?.title ?? 'Domanda al Master'} width={640}>
        <ThreadPanel {...props} />
      </Dialog>
    </>
  )
}

/** Conversazione esistente su un elemento, oppure modulo per una nuova domanda. */
export function ThreadPanel({
  characterId,
  ownerId,
  targetType,
  targetId,
  defaultTitle,
  defaultBody,
  submitLabel,
}: TargetProps & { defaultBody?: string; submitLabel?: string }) {
  const user = useUser()
  const { data: threads } = useCharacterThreads(characterId)
  const thread = latestThreadFor(threads, targetType, targetId)
  const [startNew, setStartNew] = useState(false)

  if (thread && !startNew) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <StatusBadge status={thread.status} />
          {thread.status === 'closed' && user.id === ownerId && (
            <button type="button" className="btn btn--small" onClick={() => setStartNew(true)}>
              Nuova domanda
            </button>
          )}
        </div>
        <ThreadConversation thread={thread} ownerId={ownerId} viewerId={user.id} />
      </div>
    )
  }

  return (
    <NewThreadForm
      characterId={characterId}
      targetType={targetType}
      targetId={targetId}
      defaultTitle={defaultTitle}
      defaultBody={defaultBody}
      submitLabel={submitLabel}
      onCreated={() => setStartNew(false)}
    />
  )
}

export function NewThreadForm({
  characterId,
  targetType,
  targetId,
  defaultTitle,
  defaultBody = '',
  submitLabel = 'Invia al Master',
  onCreated,
}: {
  characterId: string
  targetType: ThreadTarget
  targetId: string | null
  defaultTitle: string
  defaultBody?: string
  submitLabel?: string
  onCreated?: (threadId: string) => void
}) {
  const create = useCreateThread()
  const [title, setTitle] = useState(defaultTitle)
  const [body, setBody] = useState(defaultBody)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const id = await create.mutateAsync({ characterId, targetType, targetId, title, body })
    onCreated?.(id)
  }

  return (
    <form className={styles.newThread} onSubmit={onSubmit}>
      <label className="field">
        <span>Oggetto</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="field">
        <span>Messaggio</span>
        <textarea
          className="textarea"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          autoFocus
        />
      </label>
      {create.error && <p className="error-box">Errore: {create.error.message}</p>}
      <div className={styles.replyActions}>
        <button className="btn btn--primary" type="submit" disabled={!title.trim() || !body.trim() || create.isPending}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
