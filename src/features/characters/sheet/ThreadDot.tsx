import { AskIcon } from '../../../components/icons'
import { latestThreadFor, useCharacterThreads, type ThreadTarget } from '../../threads/api'
import styles from './ThreadDot.module.less'

/** Segnale accanto a un elemento con una domanda al Master aperta o con risposta da leggere. */
export function ThreadDot({
  characterId,
  targetType,
  targetId,
}: {
  characterId: string
  targetType: ThreadTarget
  targetId: string
}) {
  const { data: threads } = useCharacterThreads(characterId)
  const thread = latestThreadFor(threads, targetType, targetId)
  if (!thread || thread.status === 'closed') return null
  return (
    <AskIcon
      className={thread.status === 'answered' ? styles.answered : styles.open}
      aria-label={thread.status === 'answered' ? 'Risposta del Master' : 'Domanda al Master'}
    />
  )
}
