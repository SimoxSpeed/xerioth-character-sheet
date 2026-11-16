import { useState, type FormEvent } from 'react'
import { Markdown } from '../../components/Markdown'
import { formatDateTime } from '../../lib/format'
import { THREAD_STATUS, usePostMessage, useSetThreadStatus, type Thread } from './api'
import styles from './Threads.module.less'

export function StatusBadge({ status }: { status: Thread['status'] }) {
  const info = THREAD_STATUS[status]
  return <span className={`${styles.status} ${styles[info.tone]}`}>{info.label}</span>
}

/** Messaggi di una domanda, risposta e chiusura. `ownerId` = proprietario del personaggio. */
export function ThreadConversation({ thread, ownerId, viewerId }: { thread: Thread; ownerId: string; viewerId: string }) {
  const post = usePostMessage()
  const setStatus = useSetThreadStatus()
  const [reply, setReply] = useState('')
  const isOwner = viewerId === ownerId
  const error = post.error ?? setStatus.error

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!reply.trim()) return
    await post.mutateAsync({ threadId: thread.id, body: reply })
    setReply('')
  }

  return (
    <div className={styles.conversation}>
      <ol className={styles.messages}>
        {thread.thread_messages.map((m) => {
          const fromMaster = m.author_id !== ownerId
          const name = m.author?.display_name
          return (
            <li key={m.id} className={fromMaster ? styles.fromMaster : styles.fromPlayer}>
              <header>
                <strong>{fromMaster ? `Master${name ? ` · ${name}` : ''}` : (name ?? 'Giocatore')}</strong>
                <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
              </header>
              <Markdown>{m.body}</Markdown>
            </li>
          )
        })}
      </ol>

      <form className={styles.reply} onSubmit={onSubmit}>
        <textarea
          className="textarea"
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={isOwner ? 'Scrivi al Master…' : 'Rispondi al giocatore…'}
          aria-label="Messaggio"
        />
        {error && <p className="error-box">Errore: {error.message}</p>}
        <div className={styles.replyActions}>
          {isOwner && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() =>
                setStatus.mutate({ threadId: thread.id, status: thread.status === 'closed' ? 'open' : 'closed' })
              }
            >
              {thread.status === 'closed' ? 'Riapri' : 'Chiudi la domanda'}
            </button>
          )}
          <button className="btn btn--primary btn--small" type="submit" disabled={!reply.trim() || post.isPending}>
            Invia
          </button>
        </div>
      </form>
    </div>
  )
}
