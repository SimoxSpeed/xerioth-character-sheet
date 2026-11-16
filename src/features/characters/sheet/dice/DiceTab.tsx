import { DIE_LABELS, coinLabel, rollValuesText } from '../../../../game/rules'
import { HiddenIcon } from '../../../../components/icons'
import { FreeRoller } from '../../../dice/DiceRoller'
import { OUTCOME_LABELS, useCampaignFeed, useCharacterRolls, type DiceRoll, type FeedRoll, type RollOutcome } from '../../../dice/api'
import { formatDateTime } from '../../../../lib/format'
import type { CharacterSheet } from '../../api'
import styles from './DiceTab.module.less'

export function DiceTab({ sheet }: { sheet: CharacterSheet }) {
  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <section className="card">
          <h2 className={styles.title}>Tiro libero</h2>
          <FreeRoller sheet={sheet} />
        </section>
      </div>

      <section className="card">
        <h2 className={styles.title}>Tiri di {sheet.name}</h2>
        <CharacterHistory characterId={sheet.id} />
      </section>

      <section className="card">
        <h2 className={styles.title}>Tiri del gruppo</h2>
        <GroupFeed campaignId={sheet.campaign_id} />
      </section>
    </div>
  )
}

export function OutcomeBadge({ outcome }: { outcome: RollOutcome | null }) {
  if (!outcome) return null
  return <span className={styles[outcome === 'success' ? 'success' : 'failure']}>{OUTCOME_LABELS[outcome]}</span>
}

function dieText(roll: Pick<DiceRoll, 'die' | 'results' | 'details'>): string {
  const details = roll.details as { power?: boolean } | null
  return rollValuesText(roll.die, roll.results, details?.power === true)
}

function CharacterHistory({ characterId }: { characterId: string }) {
  const { data: rolls, isPending, error } = useCharacterRolls(characterId)

  if (isPending) return <p className="muted">Caricamento…</p>
  if (error) return <p className="error-box">{error.message}</p>
  if (rolls.length === 0) return <p className="muted">Nessun tiro.</p>

  return (
    <ul className={styles.list}>
      {rolls.map((roll) => (
        <li key={roll.id} className={styles.row}>
          <span className={styles.total}>{roll.die === 'coin' ? coinLabel(roll.results[0] ?? 1) : (roll.total ?? roll.results.at(-1) ?? '—')}</span>
          <span className={styles.main}>
            <strong>{roll.label || DIE_LABELS[roll.die]}</strong>
            <span className={styles.meta}>
              {dieText(roll)} · {formatDateTime(roll.created_at)}
              {roll.hidden && (
                <>
                  {' · '}
                  <HiddenIcon aria-label="nascosto" />
                </>
              )}
            </span>
          </span>
          {/* Esito solo dei poteri (automatico): capacità e caratteristiche non hanno classe difficoltà */}
          {roll.die === 'd20' && <OutcomeBadge outcome={roll.outcome} />}
        </li>
      ))}
    </ul>
  )
}

export function GroupFeed({ campaignId }: { campaignId: string }) {
  const { data: feed, isPending, error } = useCampaignFeed(campaignId)

  if (isPending) return <p className="muted">Caricamento…</p>
  if (error) return <p className="error-box">{error.message}</p>
  if (feed.length === 0) return <p className="muted">Ancora nessun tiro nella campagna.</p>

  return (
    <ul className={styles.list}>
      {feed.map((roll: FeedRoll) => (
        <li key={roll.roll_id} className={styles.row}>
          <span className={styles.total}>{roll.total ?? '·'}</span>
          <span className={styles.main}>
            <strong>{roll.character_name}</strong>
            <span className={styles.meta}>
              {DIE_LABELS[roll.die]} · {formatDateTime(roll.created_at)}
            </span>
          </span>
          {roll.die === 'd20' && <OutcomeBadge outcome={roll.outcome} />}
        </li>
      ))}
    </ul>
  )
}
