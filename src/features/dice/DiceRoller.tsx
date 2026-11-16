import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTES, type AttributeKey } from '../../game/data/attributes'
import {
  attributeModifier,
  DIE_LABELS,
  FREE_DICE,
  coinLabel,
  dieSides,
  powerSuccessTarget,
  resolvePowerRoll,
  rollBonus,
  rollDie,
  type DieKind,
  type PowerRollState,
} from '../../game/rules'
import { AddIcon, DiceIcon, HiddenIcon, MinusIcon, RerollIcon } from '../../components/icons'
import { attributeValues, type CharacterSheet } from '../characters/api'
import { OUTCOME_LABELS, useSaveRoll, useSetRollOutcome, type RollOutcome } from './api'
import styles from './DiceRoller.module.less'

/** Cosa si sta tirando: caratteristica, capacità o potere. Si tira sempre il d20. */
export interface RollTarget {
  label: string
  attribute: AttributeKey | null
  /** null = prova di sola caratteristica, oppure NA. */
  level: number | null
  isMaxed?: boolean
  /** Prova di sola caratteristica: il livello non c'è (e non si somma). */
  attributeOnly?: boolean
  /** Solo poteri/miracoli: hanno il dado riuscita e il "ritirare il fallimento". */
  power?: { successDie: number | null }
}

type Phase =
  | { step: 'ready' }
  | { step: 'reroll'; first: number }
  | { step: 'done'; rollId: string; results: number[]; state: PowerRollState | null; outcome: RollOutcome | null }

/**
 * Tiro d20 con i dati di riferimento (caratteristica, modificatore, livello) a vista.
 * Per i poteri l'esito è automatico: dado riuscita del Master e, se fallisce, ritiro.
 */
export function DiceRoller({
  sheet,
  target,
  autoRoll = false,
}: {
  sheet: CharacterSheet
  target: RollTarget
  /** Tira subito all'apertura (tocco su un valore della scheda). */
  autoRoll?: boolean
}) {
  const save = useSaveRoll()
  const setOutcome = useSetRollOutcome()
  const attributes = attributeValues(sheet)

  const [hidden, setHidden] = useState(false)
  const [physical, setPhysical] = useState('')
  const [phase, setPhase] = useState<Phase>({ step: 'ready' })

  const attribute = target.attribute
  const level = target.level
  const isMaxed = target.isMaxed ?? false
  const successDie = target.power?.successDie ?? null
  const automatic = successDie !== null
  const attributeValue = attribute ? attributes[attribute] : null
  const label = target.label
  // Totale = d20 + caratteristica + modificatore + livello (docs/01 §7)
  const bonus = rollBonus(attributeValue, level)

  const physicalInvalid = physical.trim() !== '' && parsePhysical(physical) === null

  function readValue(): number | null {
    return physical.trim() === '' ? rollDie('d20') : parsePhysical(physical)
  }

  async function persist(results: number[], state: PowerRollState | null) {
    const outcome: RollOutcome | null = state === null ? null : state === 'failed' ? 'failure' : 'success'
    const rollId = await save.mutateAsync({
      campaignId: sheet.campaign_id,
      characterId: sheet.id,
      label,
      die: 'd20',
      results,
      // Il totale è quello del primo d20; il ritiro dei poteri si legge al naturale
      total: (results[0] ?? 0) + bonus,
      outcome,
      hidden,
      details: {
        attribute,
        attribute_value: attributeValue,
        modifier: attributeValue === null ? null : attributeModifier(attributeValue),
        level,
        bonus,
        is_maxed: isMaxed,
        power: !!target.power,
        success_die: successDie,
        state,
        auto_outcome: state !== null,
        physical: physical.trim() !== '',
      },
    })
    setPhysical('')
    setPhase({ step: 'done', rollId, results, state, outcome })
  }

  async function onRoll() {
    const value = readValue()
    if (value === null) return
    if (successDie === null) return persist([value], null)
    const state = resolvePowerRoll({ successDie, level, isMaxed, bonus }, value)
    if (state === 'pending') {
      setPhysical('')
      setPhase({ step: 'reroll', first: value })
      return
    }
    await persist([value], state)
  }

  // Tiro immediato: una sola volta, anche con lo StrictMode.
  const autoRolled = useRef(false)
  useEffect(() => {
    if (!autoRoll || autoRolled.current) return
    autoRolled.current = true
    void onRoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRoll])

  async function onReroll(first: number) {
    const value = readValue()
    if (value === null || successDie === null) return
    await persist([first, value], resolvePowerRoll({ successDie, level, isMaxed, bonus }, first, value))
  }

  // Durante il tiro automatico non si mostra il pulsante "Tira" per un attimo.
  const waitingAuto = autoRoll && phase.step === 'ready' && (save.isPending || !autoRolled.current)

  return (
    <div className={styles.roller}>
      <dl className={styles.facts}>
        {attribute && <Fact label={ATTRIBUTES[attribute].label} value={attributeValue ?? '—'} />}
        {attributeValue !== null && <Fact label="Mod." value={`+${attributeModifier(attributeValue)}`} />}
        {!target.attributeOnly && <Fact label="Livello" value={level ?? 'NA'} extra={isMaxed ? 'MAX' : undefined} />}
        {target.power && <Fact label="Riuscita" value={successDie === null ? '—' : powerSuccessTarget(successDie, bonus)} />}
      </dl>

      {phase.step === 'done' ? (
        <RollResult
          phase={phase}
          bonus={bonus}
          automatic={automatic}
          pending={setOutcome.isPending}
          onOutcome={(outcome) => {
            setOutcome.mutate({ id: phase.rollId, outcome })
            setPhase({ ...phase, outcome })
          }}
          onAgain={() => setPhase({ step: 'ready' })}
        />
      ) : waitingAuto ? (
        <div className={styles.result}>
          <D20 value={0} tone="neutral" spinning />
        </div>
      ) : (
        <>
          {phase.step === 'reroll' && (
            <div className={styles.result}>
              <RollStage value={phase.first} total={phase.first + bonus} tone="failure" />
              <strong className={styles.failed}>Fallimento</strong>
            </div>
          )}

          <button
            type="button"
            className={`btn btn--primary ${styles.rollButton}`}
            disabled={save.isPending || physicalInvalid}
            onClick={() => (phase.step === 'reroll' ? onReroll(phase.first) : onRoll())}
          >
            {phase.step === 'reroll' ? <RerollIcon aria-hidden /> : <DiceIcon aria-hidden />}
            {phase.step === 'reroll' ? 'Ritira il fallimento!' : physical.trim() ? 'Registra' : 'Tira il d20'}
          </button>

          <div className={styles.options}>
            <label className={styles.inline}>
              Dado fisico
              <input
                className={`input ${styles.physical}`}
                type="number"
                min={1}
                max={20}
                value={physical}
                onChange={(e) => setPhysical(e.target.value)}
                placeholder="1–20"
                aria-label="Risultato del dado fisico"
                aria-invalid={physicalInvalid}
              />
            </label>
            {phase.step === 'ready' && (
              <label className={styles.inline}>
                <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
                <HiddenIcon aria-hidden /> Nascosto
              </label>
            )}
          </div>
        </>
      )}

      {save.error && <p className="error-box">{save.error.message}</p>}
    </div>
  )
}

/** Faccia del d20: i numeri "rotolano" per un attimo, poi si fermano sul risultato. */
function D20({
  value,
  tone,
  spinning = false,
  sides = 20,
  text,
  animate = true,
  onSettled,
}: {
  value: number
  tone: 'success' | 'failure' | 'neutral'
  spinning?: boolean
  /** Valori che "rotolano" durante l'animazione (1…sides). */
  sides?: number
  /** Testo al posto del numero (es. Sopra / Sotto). */
  text?: string
  /** false = già fermo sul risultato, senza rotolare. */
  animate?: boolean
  /** Chiamata quando il dado si ferma. */
  onSettled?: () => void
}) {
  const [shown, setShown] = useState(() => (animate ? 1 + Math.floor(Math.random() * sides) : value))
  const [rolling, setRolling] = useState(animate)
  const settledRef = useRef(onSettled)
  settledRef.current = onSettled

  useEffect(() => {
    if (!animate && !spinning) {
      setShown(value)
      setRolling(false)
      settledRef.current?.()
      return
    }
    setRolling(true)
    let ticks = 0
    const timer = window.setInterval(() => {
      ticks += 1
      if (!spinning && ticks >= 10) {
        window.clearInterval(timer)
        setShown(value)
        setRolling(false)
        settledRef.current?.()
      } else {
        setShown(1 + Math.floor(Math.random() * sides))
      }
    }, 45)
    return () => window.clearInterval(timer)
  }, [value, spinning, sides, animate])

  const toneClass = rolling
    ? styles.dieRolling
    : tone === 'success'
      ? styles.dieSuccess
      : tone === 'failure'
        ? styles.dieFailure
        : styles.dieNeutral
  const special = rolling || sides !== 20 ? '' : value === 20 ? styles.crit : value === 1 ? styles.fumble : ''

  return (
    <div className={`${styles.die} ${toneClass} ${special}`} role="img" aria-label={rolling ? 'Tiro in corso' : `Risultato ${value}`}>
      <svg viewBox="0 0 100 100" aria-hidden className={styles.dieShape}>
        <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" />
        <polygon points="50,22 76,66 24,66" className={styles.dieFacet} />
        <path d="M50 3 L50 22 M93 27 L76 66 M7 27 L24 66 M93 73 L76 66 M7 73 L24 66 M50 97 L50 66" className={styles.dieEdge} />
      </svg>
      <span className={`${styles.dieValue} ${!rolling && text ? styles.dieText : ''}`}>{!rolling && text ? text : shown}</span>
    </div>
  )
}

function Fact({ label, value, extra }: { label: string; value: string | number; extra?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value}
        {extra && <span className={styles.extra}>{extra}</span>}
      </dd>
    </div>
  )
}

function parsePhysical(text: string): number | null {
  const n = Math.trunc(Number(text))
  return n >= 1 && n <= 20 ? n : null
}

const STATE_TEXT: Record<Exclude<PowerRollState, 'pending'>, string> = {
  success: 'Successo',
  saved: 'Successo',
  failed: 'Fallimento',
}

/** Quanto resta visibile al centro il dado fermo, prima di spostarsi. */
const DIE_PAUSE_MS = 500

/**
 * Dado e totale: il d20 rotola al centro, resta fermo 0,5 s, poi scivola a sinistra e a destra
 * compare il totale (conta dal valore del dado fino al risultato).
 */
function RollStage({
  value,
  total,
  tone,
  animate = true,
}: {
  value: number
  total: number
  tone: 'success' | 'failure' | 'neutral'
  animate?: boolean
}) {
  const [landed, setLanded] = useState(false)
  const [settled, setSettled] = useState(false)

  // Il dado fermo resta al centro per un attimo, poi scivola a sinistra
  useEffect(() => {
    if (!landed) return
    const timer = window.setTimeout(() => setSettled(true), animate ? DIE_PAUSE_MS : 0)
    return () => window.clearTimeout(timer)
  }, [landed, animate])

  const toneClass = tone === 'success' ? styles.totalSuccess : tone === 'failure' ? styles.totalFailure : ''

  return (
    <div className={`${styles.stage} ${settled ? styles.stageSettled : ''}`}>
      <div className={styles.stageDie}>
        <D20 value={value} tone={tone} animate={animate} onSettled={() => setLanded(true)} />
      </div>
      <div className={`${styles.total} ${toneClass}`} aria-hidden={!settled}>
        <small>Totale</small>
        <CountUp from={animate ? value : total} to={total} run={settled} />
      </div>
    </div>
  )
}

/** Numero che sale fino al valore finale (breve, con frenata). */
function CountUp({ from, to, run }: { from: number; to: number; run: boolean }) {
  const [n, setN] = useState(from)

  useEffect(() => {
    if (!run) return
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 550)
      setN(Math.round(from + (to - from) * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [from, to, run])

  return <b>{n}</b>
}

function RollResult({
  phase,
  bonus,
  automatic,
  pending,
  onOutcome,
  onAgain,
}: {
  phase: Extract<Phase, { step: 'done' }>
  bonus: number
  automatic: boolean
  pending: boolean
  onOutcome: (outcome: RollOutcome | null) => void
  onAgain: () => void
}) {
  const [first, second] = phase.results
  const state = phase.state === 'pending' ? null : phase.state
  const tone =
    automatic && state
      ? state === 'failed'
        ? 'failure'
        : 'success'
      : phase.outcome === 'failure'
        ? 'failure'
        : phase.outcome === 'success'
          ? 'success'
          : 'neutral'

  return (
    <div className={styles.result}>
      {/* Con il ritiro il primo dado è già stato visto: si ripropone fermo */}
      <RollStage value={first ?? 0} total={(first ?? 0) + bonus} tone={tone} animate={second === undefined} />
      {second !== undefined && (
        <p className={styles.resultDetail}>
          <RerollIcon aria-hidden /> Ritiro {second}
        </p>
      )}

      {automatic && state ? (
        <p className={state === 'failed' ? styles.failed : styles.succeeded}>{STATE_TEXT[state]}</p>
      ) : (
        <div className={styles.outcomes} role="group" aria-label="Esito">
          {(['success', 'failure'] as const).map((o) => (
            <button
              key={o}
              type="button"
              className={`btn ${phase.outcome === o ? (o === 'success' ? styles.pickedSuccess : styles.pickedFailure) : ''}`}
              aria-pressed={phase.outcome === o}
              disabled={pending}
              onClick={() => onOutcome(phase.outcome === o ? null : o)}
            >
              {OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="btn btn--ghost" onClick={onAgain}>
        <DiceIcon aria-hidden /> Nuovo tiro
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * Tiro libero: qualsiasi dado classico, anche più d'uno (3d6).
 * Non è legato alla scheda: niente caratteristica, niente dado fisico, niente esito.
 */
export function FreeRoller({ sheet }: { sheet: CharacterSheet }) {
  const save = useSaveRoll()
  const [die, setDie] = useState<DieKind>('d20')
  const [count, setCount] = useState(1)
  const [hidden, setHidden] = useState(false)
  const [last, setLast] = useState<{ die: DieKind; results: number[]; n: number } | null>(null)

  const isCoin = die === 'coin'
  const dice = isCoin ? 1 : count
  const name = isCoin ? DIE_LABELS.coin : `${dice > 1 ? dice : ''}${DIE_LABELS[die]}`

  function roll() {
    const results = Array.from({ length: dice }, () => rollDie(die))
    setLast((l) => ({ die, results, n: (l?.n ?? 0) + 1 }))
    save.mutate({
      campaignId: sheet.campaign_id,
      characterId: sheet.id,
      label: name,
      die,
      results,
      total: isCoin ? null : results.reduce((a, b) => a + b, 0),
      outcome: null,
      hidden,
      details: {},
    })
  }

  const total = last ? last.results.reduce((a, b) => a + b, 0) : 0

  return (
    <div className={styles.roller}>
      <div className={styles.dicePicker} role="group" aria-label="Dado">
        {FREE_DICE.map((d) => (
          <button
            key={d}
            type="button"
            className={d === die ? styles.dieChipOn : styles.dieChip}
            aria-pressed={d === die}
            onClick={() => setDie(d)}
          >
            {DIE_LABELS[d]}
          </button>
        ))}
      </div>

      {last && (
        <div className={styles.result} aria-live="polite">
          <D20
            key={last.n}
            value={total}
            tone="neutral"
            sides={dieSides(last.die) * last.results.length}
            text={last.die === 'coin' ? coinLabel(last.results[0] ?? 1) : undefined}
          />
          {last.results.length > 1 && <p className={styles.resultDetail}>{last.results.join(' + ')}</p>}
        </div>
      )}

      <div className={styles.freeActions}>
        {!isCoin && (
          <span className={styles.count} role="group" aria-label="Quanti dadi">
            <button type="button" aria-label="Un dado in meno" disabled={count <= 1} onClick={() => setCount((c) => c - 1)}>
              <MinusIcon aria-hidden />
            </button>
            <b>{count}</b>
            <button type="button" aria-label="Un dado in più" disabled={count >= 20} onClick={() => setCount((c) => c + 1)}>
              <AddIcon aria-hidden />
            </button>
          </span>
        )}
        <button type="button" className={`btn btn--primary ${styles.rollButton}`} onClick={roll}>
          <DiceIcon aria-hidden /> Tira {name}
        </button>
      </div>

      <div className={styles.options}>
        <label className={styles.inline}>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          <HiddenIcon aria-hidden /> Nascosto
        </label>
      </div>

      {save.error && <p className="error-box">{save.error.message}</p>}
    </div>
  )
}
