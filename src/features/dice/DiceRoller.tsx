import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTES, type AttributeKey } from '../../game/data/attributes'
import {
  attributeModifier,
  DIE_LABELS,
  FREE_DICE,
  dieSides,
  rerollSafeThreshold,
  resolvePowerRoll,
  rollBonus,
  rollDie,
  type DieKind,
  type PowerRollState,
} from '../../game/rules'
import { AddIcon, DiceIcon, HiddenIcon, MinusIcon, RerollIcon } from '../../components/icons'
import { attributeValues, type CharacterSheet } from '../characters/api'
import { useSaveRoll, type RollOutcome } from './api'
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
  /** Solo poteri/miracoli: riuscita fissata dal Master e "ritirare il fallimento". */
  power?: { successTarget: number | null }
}

type Phase =
  | { step: 'ready' }
  | { step: 'reroll'; n: number; first: number }
  | { step: 'done'; n: number; results: number[]; state: PowerRollState | null }

type Tone = 'success' | 'failure' | 'neutral'

/**
 * Tiro d20 con i dati di riferimento (caratteristica, modificatore, livello) a vista.
 * Nessun esito scritto: per i poteri parlano i colori (totale contro riuscita fissata, poi ritiro).
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
  const attributes = attributeValues(sheet)

  const [hidden, setHidden] = useState(false)
  const [physical, setPhysical] = useState('')
  const [phase, setPhase] = useState<Phase>({ step: 'ready' })
  const rolls = useRef(0)

  const attribute = target.attribute
  const level = target.level
  const isMaxed = target.isMaxed ?? false
  const successTarget = target.power?.successTarget ?? null
  const attributeValue = attribute ? attributes[attribute] : null
  const label = target.label
  // Totale = d20 + caratteristica + modificatore + livello (docs/01 §7)
  const bonus = rollBonus(attributeValue, level)
  const power = successTarget === null ? null : { target: successTarget, level, isMaxed, bonus }

  const physicalInvalid = physical.trim() !== '' && parsePhysical(physical) === null

  function readValue(): number | null {
    return physical.trim() === '' ? rollDie('d20') : parsePhysical(physical)
  }

  function persist(results: number[], state: PowerRollState | null) {
    const outcome: RollOutcome | null = state === null ? null : state === 'failed' ? 'failure' : 'success'
    save.mutate({
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
        success_target: successTarget,
        state,
        auto_outcome: state !== null,
        physical: physical.trim() !== '',
      },
    })
    setPhysical('')
  }

  function onRoll() {
    const value = readValue()
    if (value === null) return
    rolls.current += 1
    const n = rolls.current
    if (power === null) {
      setPhase({ step: 'done', n, results: [value], state: null })
      return persist([value], null)
    }
    const state = resolvePowerRoll(power, value)
    if (state === 'pending') {
      // Si salva solo a ritiro fatto, con entrambi i dadi
      setPhysical('')
      setPhase({ step: 'reroll', n, first: value })
      return
    }
    setPhase({ step: 'done', n, results: [value], state })
    persist([value], state)
  }

  function onReroll(first: number, n: number) {
    const value = readValue()
    if (value === null || power === null) return
    const state = resolvePowerRoll(power, first, value)
    setPhase({ step: 'done', n, results: [first, value], state })
    persist([first, value], state)
  }

  // Tiro immediato: una sola volta, anche con lo StrictMode.
  const autoRolled = useRef(false)
  useEffect(() => {
    if (!autoRoll || autoRolled.current) return
    autoRolled.current = true
    onRoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRoll])

  // Durante il tiro automatico non si mostra il pulsante "Tira" per un attimo.
  const waitingAuto = autoRoll && phase.step === 'ready' && !autoRolled.current

  const first = phase.step === 'reroll' ? phase.first : phase.step === 'done' ? phase.results[0] : undefined
  const second = phase.step === 'done' ? phase.results[1] : undefined
  const state = phase.step === 'done' ? phase.state : null
  // Il primo dado è rosso se ha chiesto il ritiro; il secondo dice l'esito vero
  const firstTone: Tone = power === null ? 'neutral' : phase.step === 'reroll' || second !== undefined || state === 'failed' ? 'failure' : 'success'
  const secondTone: Tone = state === 'saved' ? 'success' : 'failure'

  return (
    <div className={styles.roller}>
      <dl className={styles.facts}>
        {attribute && <Fact label={ATTRIBUTES[attribute].label} value={attributeValue ?? '—'} />}
        {attributeValue !== null && <Fact label="Mod." value={`+${attributeModifier(attributeValue)}`} />}
        {!target.attributeOnly && <Fact label="Livello" value={level ?? 'NA'} extra={isMaxed ? 'MAX' : undefined} />}
        {target.power && <Fact label="Riuscita" value={successTarget ?? '—'} />}
      </dl>

      {waitingAuto ? (
        <div className={styles.result}>
          <D20 value={0} tone="neutral" spinning />
        </div>
      ) : (
        first !== undefined &&
        phase.step !== 'ready' && (
          <div className={styles.result} aria-live="polite">
            {/* Stessa chiave tra "ritiro" e "fatto": il primo dado non ritira, sale per fare spazio */}
            <RollStage key={`first-${phase.n}`} value={first} total={first + bonus} tone={firstTone} />
            {second !== undefined && (
              <div className={styles.secondStage}>
                <div>
                  <RollStage
                    key={`second-${phase.n}`}
                    value={second}
                    total={rerollSafeThreshold(level, isMaxed)}
                    totalLabel="Limite"
                    tone={secondTone}
                  />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {phase.step === 'done' ? (
        <button type="button" className={`btn btn--ghost ${styles.againButton}`} onClick={() => setPhase({ step: 'ready' })}>
          <DiceIcon aria-hidden /> Nuovo tiro
        </button>
      ) : (
        !waitingAuto && (
          <>
            <button
              type="button"
              className={`btn btn--primary ${styles.rollButton}`}
              disabled={physicalInvalid}
              onClick={() => (phase.step === 'reroll' ? onReroll(phase.first, phase.n) : onRoll())}
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
        )
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
  animate = true,
  rollTicks = 10,
  small = false,
  onSettled,
}: {
  value: number
  tone: Tone
  spinning?: boolean
  /** Valori che "rotolano" durante l'animazione (1…sides). */
  sides?: number
  /** false = già fermo sul risultato, senza rotolare. */
  animate?: boolean
  /** Quanti scatti prima di fermarsi (più dadi: si fermano uno dopo l'altro). */
  rollTicks?: number
  /** Dado piccolo, per i tiri di più dadi. */
  small?: boolean
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
      if (!spinning && ticks >= rollTicks) {
        window.clearInterval(timer)
        setShown(value)
        setRolling(false)
        settledRef.current?.()
      } else {
        setShown(1 + Math.floor(Math.random() * sides))
      }
    }, 45)
    return () => window.clearInterval(timer)
  }, [value, spinning, sides, animate, rollTicks])

  const toneClass = rolling
    ? styles.dieRolling
    : tone === 'success'
      ? styles.dieSuccess
      : tone === 'failure'
        ? styles.dieFailure
        : styles.dieNeutral
  const special = rolling || sides !== 20 ? '' : value === 20 ? styles.crit : value === 1 ? styles.fumble : ''

  return (
    <div className={`${styles.die} ${small ? styles.dieSmall : ''} ${toneClass} ${special}`} role="img" aria-label={rolling ? 'Tiro in corso' : `Risultato ${value}`}>
      <svg viewBox="0 0 100 100" aria-hidden className={styles.dieShape}>
        <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" />
        <polygon points="50,22 76,66 24,66" className={styles.dieFacet} />
        <path d="M50 3 L50 22 M93 27 L76 66 M7 27 L24 66 M93 73 L76 66 M7 73 L24 66 M50 97 L50 66" className={styles.dieEdge} />
      </svg>
      <span className={styles.dieValue}>{shown}</span>
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
  totalLabel = 'Totale',
}: {
  value: number
  total: number
  tone: Tone
  /** Etichetta del numero a destra (il ritiro mostra il limite, 2 × livello). */
  totalLabel?: string
}) {
  const [landed, setLanded] = useState(false)
  const [settled, setSettled] = useState(false)

  // Il dado fermo resta al centro per un attimo, poi scivola a sinistra
  useEffect(() => {
    if (!landed) return
    const timer = window.setTimeout(() => setSettled(true), DIE_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [landed])

  const toneClass = tone === 'success' ? styles.totalSuccess : tone === 'failure' ? styles.totalFailure : ''
  const isTotal = totalLabel === 'Totale'

  return (
    <div className={`${styles.stage} ${settled ? styles.stageSettled : ''}`}>
      <div className={styles.stageDie}>
        <D20 value={value} tone={tone} onSettled={() => setLanded(true)} />
      </div>
      <div className={`${styles.total} ${toneClass}`} aria-hidden={!settled}>
        <small>{totalLabel}</small>
        <CountUp from={isTotal ? value : total} to={total} run={settled} />
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

/**
 * Più dadi: si tirano davvero tutti, ognuno rotola e si ferma uno dopo l'altro;
 * quando sono fermi tutti compare il totale, che sale fino alla somma.
 */
function MultiRoll({ results, sides }: { results: number[]; sides: number }) {
  const [settled, setSettled] = useState(0)
  const done = settled >= results.length
  const total = results.reduce((a, b) => a + b, 0)

  return (
    <div className={styles.multi}>
      <div className={styles.multiDice}>
        {results.map((value, i) => (
          <D20
            key={i}
            value={value}
            tone="neutral"
            sides={sides}
            small
            rollTicks={8 + i * 2}
            onSettled={() => setSettled((n) => n + 1)}
          />
        ))}
      </div>
      <div className={`${styles.multiTotal} ${done ? styles.multiTotalShown : ''}`} aria-hidden={!done}>
        <small>Totale</small>
        <CountUp from={0} to={total} run={done} />
      </div>
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

  const name = `${count > 1 ? count : ''}${DIE_LABELS[die]}`

  function roll() {
    const results = Array.from({ length: count }, () => rollDie(die))
    setLast((l) => ({ die, results, n: (l?.n ?? 0) + 1 }))
    save.mutate({
      campaignId: sheet.campaign_id,
      characterId: sheet.id,
      label: name,
      die,
      results,
      total: results.reduce((a, b) => a + b, 0),
      outcome: null,
      hidden,
      details: {},
    })
  }

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
          {last.results.length === 1 ? (
            <D20 key={last.n} value={last.results[0]!} tone="neutral" sides={dieSides(last.die)} />
          ) : (
            <MultiRoll key={last.n} results={last.results} sides={dieSides(last.die)} />
          )}
        </div>
      )}

      <div className={styles.freeActions}>
        <span className={styles.count} role="group" aria-label="Quanti dadi">
          <button type="button" aria-label="Un dado in meno" disabled={count <= 1} onClick={() => setCount((c) => c - 1)}>
            <MinusIcon aria-hidden />
          </button>
          <b>{count}</b>
          <button type="button" aria-label="Un dado in più" disabled={count >= 20} onClick={() => setCount((c) => c + 1)}>
            <AddIcon aria-hidden />
          </button>
        </span>
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
