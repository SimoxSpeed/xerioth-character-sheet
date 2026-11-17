import { useState, type CSSProperties, type ReactNode } from 'react'
import { RESOURCES, type ResourceKey } from '../../../game/data/classes'
import { findAlignment } from '../../../game/data/alignments'
import { currentHp, experienceStatus, maxHp } from '../../../game/rules'
import { NumberField } from '../../../components/NumberField'
import { TextField } from '../../../components/TextField'
import { ProgressBar } from '../../../components/ProgressBar'
import { useToast } from '../../../components/Toast'
import {
  AddIcon,
  CollapseIcon,
  ExpandIcon,
  FateIcon,
  GoldIcon,
  HpIcon,
  LevelIcon,
  MadnessIcon,
  MinusIcon,
  RESOURCE_ICONS,
  SpiritIcon,
  XpIcon,
  type LucideIcon,
} from '../../../components/icons'
import {
  attributeValues,
  skillLevel,
  useAddXp,
  useUpdateCharacter,
  useUpdateResource,
  xpTotal,
  type CharacterSheet,
} from '../api'
import { classesLabel, raceLabel } from '../labels'
import { CounterDialog, HpDialog, XpDialog, type HpFlash } from './VitalDialogs'
import { EditMark } from './EditMark'
import { HP_FIELDS, VITAL_FIELDS, type EditFilter } from '../../masterEdits/api'
import styles from './SheetHeader.module.less'
import flashStyles from './HpFlash.module.less'

type Editor = 'hp' | 'xp' | 'madness' | 'fate' | 'gold' | { resource: string } | null

// Dove compare il segno delle modifiche del Master nell'intestazione
const IDENTITY_EDITS: EditFilter[] = [{ type: 'character', exceptFields: VITAL_FIELDS }, { type: 'class' }]
const LEVEL_EDITS: EditFilter[] = [{ type: 'character', fields: ['level'] }, { type: 'xp' }]
const HP_EDITS: EditFilter[] = [{ type: 'character', fields: HP_FIELDS }]
const fieldEdits = (field: string): EditFilter[] => [{ type: 'character', fields: [field] }]
const resourceEdits = (key: string): EditFilter[] => [{ type: 'resource', id: key }]

const fmt = (n: number) => n.toLocaleString('it-IT')
const tone = (color: string) => ({ '--tone': color }) as CSSProperties

/** Colore di ogni risorsa di classe (variabili del tema). */
const RESOURCE_COLORS: Record<string, string> = {
  spirito: 'var(--c-spirit)',
  mana: 'var(--c-mana)',
  mente: 'var(--c-mind)',
  anima: 'var(--c-soul)',
}


/**
 * Intestazione fissa della scheda (la pagina non scorre).
 * Desktop: targhetta con tutti i dati e parametri vitali su una fila.
 * Telefono: fascia compatta con nome, livello e parametri vitali; i dettagli si aprono col nome.
 */
export function SheetHeader({ sheet }: { sheet: CharacterSheet }) {
  const update = useUpdateCharacter(sheet.id)
  const updateResource = useUpdateResource(sheet.id)
  const addXp = useAddXp(sheet.id)
  const toast = useToast()
  const [editor, setEditor] = useState<Editor>(null)
  const [hpFlash, setHpFlash] = useState<HpFlash | null>(null)
  const [details, setDetails] = useState(false)

  const attributes = attributeValues(sheet)
  const hpMax = maxHp({
    costituzione: attributes.costituzione,
    forzaLevel: skillLevel(sheet, 'forza') ?? 0,
    raceKey: sheet.race_key,
    hpBonus: sheet.hp_bonus,
  })
  const hp = currentHp(hpMax ?? 0, sheet.temp_hp, sheet.damage_taken)
  const total = xpTotal(sheet)
  const xp = experienceStatus(total, sheet.level)
  const alignment = findAlignment(sheet.alignment_key)

  /** Cambia un valore e propone "Annulla" con il valore precedente. */
  function track(label: string, from: number, to: number, apply: (v: number) => void) {
    if (from === to) return
    apply(to)
    toast({ message: `${label} ${fmt(from)} → ${fmt(to)}`, undo: () => apply(from) })
  }

  const setMadness = (v: number) => track('Follia', sheet.madness_points, Math.max(0, v), (x) => update.mutate({ madness_points: x }))
  const setFate = (v: number) => track('Fato', sheet.fate_points, Math.max(0, v), (x) => update.mutate({ fate_points: x }))
  const setGold = (v: number) => track('Oro', sheet.gold, Math.max(0, v), (x) => update.mutate({ gold: x }))

  function changeHp(kind: 'damage' | 'heal', amount: number) {
    const before = { temp_hp: sheet.temp_hp, damage_taken: sheet.damage_taken }
    let after: typeof before
    if (kind === 'damage') {
      // I danni consumano prima i PF temporanei.
      const fromTemp = Math.min(sheet.temp_hp, amount)
      after = { temp_hp: sheet.temp_hp - fromTemp, damage_taken: sheet.damage_taken + (amount - fromTemp) }
    } else {
      after = { temp_hp: sheet.temp_hp, damage_taken: Math.max(0, sheet.damage_taken - amount) }
    }
    const max = hpMax ?? 0
    update.mutate(after)
    setHpFlash((f) => ({ kind, n: (f?.n ?? 0) + 1 }))
    toast({
      message: `PF ${fmt(currentHp(max, before.temp_hp, before.damage_taken))} → ${fmt(currentHp(max, after.temp_hp, after.damage_taken))}`,
      undo: () => update.mutate(before),
    })
  }

  /** PF scritti a mano: la differenza diventa danno o cura. */
  function setHp(value: number) {
    const delta = value - hp
    if (delta < 0) changeHp('damage', -delta)
    else if (delta > 0) changeHp('heal', delta)
  }

  function changeXp(delta: number) {
    const safe = Math.max(delta, -total)
    if (!safe) return
    addXp.mutate(safe)
    toast({ message: `Esperienza ${safe > 0 ? '+' : ''}${fmt(safe)}`, undo: () => addXp.mutate(-safe) })
  }

  const resources = sheet.character_resources.map((r) => {
    const def = RESOURCES[r.resource_key as ResourceKey]
    return {
      key: r.resource_key,
      label: def?.label ?? r.resource_key,
      short: (def?.label ?? r.resource_key).replace(/^Punti /, ''),
      current: r.current,
      max: r.max ?? def?.cap ?? null,
      rawMax: r.max,
      cap: def?.cap,
      icon: RESOURCE_ICONS[r.resource_key] ?? SpiritIcon,
      color: RESOURCE_COLORS[r.resource_key] ?? 'var(--c-spirit)',
    }
  })
  const openResource = editor && typeof editor === 'object' ? resources.find((r) => r.key === editor.resource) : undefined
  const flashClass = hpFlash ? (hpFlash.kind === 'damage' ? flashStyles.flashDamage : flashStyles.flashHeal) : ''

  // --- Pezzi condivisi tra desktop e telefono -----------------------------------
  const portrait = (className: string | undefined) => (
    <div className={className} aria-hidden>
      {sheet.portrait_url ? <img src={sheet.portrait_url} alt="" /> : sheet.name.charAt(0)}
    </div>
  )

  const lineage = (
    <p className={styles.lineage}>
      <span>{classesLabel(sheet.character_classes)}</span>
      <span>{raceLabel(sheet.race_key)}</span>
      <span>{alignment?.name ?? '—'}</span>
    </p>
  )

  // Aspetto: sempre modificabile con un clic, come scrivere a matita sulla scheda
  const looks = (
    <dl className={styles.looks}>
      <Look label="Età">
        <NumberField label="Età" value={sheet.age} nullable min={0} onCommit={(v) => update.mutate({ age: v })} />
      </Look>
      <Look label="Altezza">
        <NumberField label="Altezza (cm)" value={sheet.height_cm} nullable min={1} onCommit={(v) => update.mutate({ height_cm: v })} />
        <small>cm</small>
      </Look>
      <Look label="Peso">
        <NumberField label="Peso (kg)" value={sheet.weight_kg} nullable min={1} onCommit={(v) => update.mutate({ weight_kg: v })} />
        <small>kg</small>
      </Look>
      <Look label="Occhi">
        <TextField label="Occhi" value={sheet.eyes ?? ''} onCommit={(v) => update.mutate({ eyes: v })} />
      </Look>
      <Look label="Pelle">
        <TextField label="Pelle" value={sheet.skin ?? ''} onCommit={(v) => update.mutate({ skin: v })} />
      </Look>
      <Look label="Capelli">
        <TextField label="Capelli" value={sheet.hair ?? ''} onCommit={(v) => update.mutate({ hair: v })} />
      </Look>
    </dl>
  )

  const levelRow = (
    <button type="button" className={styles.levelRow} onClick={() => setEditor('xp')} title="Livello ed esperienza">
      <span className={styles.level}>
        <LevelIcon aria-hidden />
        <small>Liv.</small>
        <strong>{sheet.level}</strong>
        <EditMark characterId={sheet.id} filters={LEVEL_EDITS} />
      </span>
      <span className={styles.xpTrack}>
        <ProgressBar label="Esperienza del livello" value={xp.inLevel} max={xp.nextLevelCost} tone="xp" />
      </span>
      <span className={styles.xpText}>
        <XpIcon aria-hidden />
        {fmt(xp.inLevel)}
        <small>/ {fmt(xp.nextLevelCost)}</small>
      </span>
      {xp.canLevelUp && <span className={styles.levelUp}>Livello!</span>}
    </button>
  )

  const DetailsChevron = details ? CollapseIcon : ExpandIcon

  return (
    <>
      {/* ---------- Desktop / tablet ---------- */}
      <header className={styles.header}>
        <div className={styles.nameplate}>
          {portrait(styles.portrait)}
          <div className={styles.identity}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{sheet.name}</h1>
              <EditMark characterId={sheet.id} filters={IDENTITY_EDITS} />
            </div>
            {lineage}
            {looks}
            {levelRow}
          </div>
        </div>

        <div className={styles.vitals}>
          <button type="button" className={`${styles.tile} ${styles.hpTile}`} style={tone('var(--c-hp)')} onClick={() => setEditor('hp')}>
            <span className={styles.tileLabel}>
              <HpIcon aria-hidden /> Punti Ferita
              <EditMark characterId={sheet.id} filters={HP_EDITS} />
            </span>
            <span key={hpFlash?.n ?? 0} className={`${styles.hpValue} ${flashClass}`}>
              <strong className={hp <= 0 ? styles.down : undefined}>{fmt(hp)}</strong>
              <small>/ {fmt(hpMax ?? 0)}</small>
              {sheet.temp_hp > 0 && <span className={styles.temp}>+{fmt(sheet.temp_hp)}</span>}
            </span>
            <ProgressBar label="Punti ferita" value={Math.max(0, hp)} max={(hpMax ?? 0) + sheet.temp_hp} tone="hp" />
            <span className={styles.hpParts}>
              <span>
                Danni <b>{fmt(sheet.damage_taken)}</b>
              </span>
              <span>
                Temp. <b>{fmt(sheet.temp_hp)}</b>
              </span>
              <span>
                Bonus <b>{fmt(sheet.hp_bonus)}</b>
              </span>
            </span>
          </button>

          {resources.map((r) => (
            <button key={r.key} type="button" className={styles.tile} style={tone(r.color)} onClick={() => setEditor({ resource: r.key })}>
              <span className={styles.tileLabel}>
                <r.icon aria-hidden /> {r.short}
                <EditMark characterId={sheet.id} filters={resourceEdits(r.key)} />
              </span>
              <span className={styles.tileValue}>
                <strong>{fmt(r.current)}</strong>
                {r.max !== null && <small>/ {fmt(r.max)}</small>}
              </span>
              {r.max !== null && <ProgressBar label={r.label} value={r.current} max={r.max} tone="custom" />}
            </button>
          ))}

          <CounterTile
            label="Follia"
            icon={MadnessIcon}
            color="var(--c-madness)"
            value={sheet.madness_points}
            onOpen={() => setEditor('madness')}
            onChange={setMadness}
            mark={<EditMark characterId={sheet.id} filters={fieldEdits('madness_points')} />}
          />
          <CounterTile
            label="Fato"
            icon={FateIcon}
            color="var(--c-fate)"
            value={sheet.fate_points}
            onOpen={() => setEditor('fate')}
            onChange={setFate}
            mark={<EditMark characterId={sheet.id} filters={fieldEdits('fate_points')} />}
          />

          <button type="button" className={styles.tile} style={tone('var(--c-gold)')} onClick={() => setEditor('gold')}>
            <span className={styles.tileLabel}>
              <GoldIcon aria-hidden /> Oro
              <EditMark characterId={sheet.id} filters={fieldEdits('gold')} />
            </span>
            <span className={styles.tileValue}>
              <strong>{fmt(sheet.gold)}</strong>
            </span>
          </button>
        </div>
      </header>

      {/* ---------- Telefono: fascia compatta ---------- */}
      <header className={styles.band}>
        <div className={styles.bandTop}>
          <button type="button" className={styles.bandId} onClick={() => setDetails((v) => !v)} aria-expanded={details}>
            {portrait(styles.bandPortrait)}
            <span className={styles.bandText}>
              <span className={styles.bandName}>
                {sheet.name}
                <EditMark characterId={sheet.id} filters={IDENTITY_EDITS} />
              </span>
              <span className={styles.bandLevel}>
                <LevelIcon aria-hidden /> {sheet.level}
                <EditMark characterId={sheet.id} filters={LEVEL_EDITS} />
                <span className={styles.bandXp}>
                  <ProgressBar label="Esperienza del livello" value={xp.inLevel} max={xp.nextLevelCost} tone="xp" />
                </span>
                {xp.canLevelUp && <span className={styles.levelUp}>Livello!</span>}
              </span>
            </span>
            <DetailsChevron aria-hidden className={styles.bandChevron} />
          </button>
        </div>

        <button type="button" className={styles.bandHp} style={tone('var(--c-hp)')} onClick={() => setEditor('hp')}>
          <HpIcon aria-hidden />
          <span key={hpFlash?.n ?? 0} className={`${styles.bandHpValue} ${flashClass}`}>
            <strong className={hp <= 0 ? styles.down : undefined}>{fmt(hp)}</strong>
            <small>/ {fmt(hpMax ?? 0)}</small>
            {sheet.temp_hp > 0 && <span className={styles.temp}>+{fmt(sheet.temp_hp)}</span>}
            <EditMark characterId={sheet.id} filters={HP_EDITS} />
          </span>
          <span className={styles.bandHpBar}>
            <ProgressBar label="Punti ferita" value={Math.max(0, hp)} max={(hpMax ?? 0) + sheet.temp_hp} tone="hp" />
          </span>
        </button>

        <div className={styles.bandChips}>
          {resources.map((r) => (
            <Chip key={r.key} icon={r.icon} color={r.color} label={r.label} onClick={() => setEditor({ resource: r.key })}>
              {fmt(r.current)}
              <EditMark characterId={sheet.id} filters={resourceEdits(r.key)} />
            </Chip>
          ))}
          <Chip icon={MadnessIcon} color="var(--c-madness)" label="Follia" onClick={() => setEditor('madness')}>
            {sheet.madness_points}
            <EditMark characterId={sheet.id} filters={fieldEdits('madness_points')} />
          </Chip>
          <Chip icon={FateIcon} color="var(--c-fate)" label="Fato" onClick={() => setEditor('fate')}>
            {sheet.fate_points}
            <EditMark characterId={sheet.id} filters={fieldEdits('fate_points')} />
          </Chip>
          <Chip icon={GoldIcon} color="var(--c-gold)" label="Monete d’oro" onClick={() => setEditor('gold')}>
            {fmt(sheet.gold)}
            <EditMark characterId={sheet.id} filters={fieldEdits('gold')} />
          </Chip>
        </div>

        {details && (
          <div className={styles.bandDetails}>
            {lineage}
            {looks}
            {levelRow}
          </div>
        )}
      </header>

      {/* ---------- Finestre di modifica ---------- */}
      <HpDialog
        open={editor === 'hp'}
        onClose={() => setEditor(null)}
        sheet={sheet}
        hp={hp}
        hpMax={hpMax}
        flash={hpFlash}
        onChange={changeHp}
        onSetHp={setHp}
        onSet={(patch) => update.mutate(patch)}
      />
      <XpDialog
        open={editor === 'xp'}
        onClose={() => setEditor(null)}
        level={sheet.level}
        status={xp}
        onLevel={(level) => track('Livello', sheet.level, Math.max(0, level), (x) => update.mutate({ level: x }))}
        onXp={changeXp}
      />
      <CounterDialog
        open={editor === 'madness'}
        onClose={() => setEditor(null)}
        title="Punti Follia"
        icon={MadnessIcon}
        color="var(--c-madness)"
        value={sheet.madness_points}
        onSet={setMadness}
      />
      <CounterDialog
        open={editor === 'fate'}
        onClose={() => setEditor(null)}
        title="Punti Fato"
        icon={FateIcon}
        color="var(--c-fate)"
        value={sheet.fate_points}
        onSet={setFate}
      />
      <CounterDialog
        open={editor === 'gold'}
        onClose={() => setEditor(null)}
        title="Monete d’oro"
        icon={GoldIcon}
        color="var(--c-gold)"
        value={sheet.gold}
        onSet={setGold}
        steppers={false}
      />
      {openResource && (
        <CounterDialog
          open
          onClose={() => setEditor(null)}
          title={openResource.label}
          icon={openResource.icon}
          color={openResource.color}
          value={openResource.current}
          max={openResource.rawMax}
          maxPlaceholder={openResource.cap ? String(openResource.cap) : undefined}
          onSet={(v) =>
            track(openResource.short, openResource.current, Math.max(0, v), (x) =>
              updateResource.mutate({ resourceKey: openResource.key, current: x }),
            )
          }
          onSetMax={(v) => updateResource.mutate({ resourceKey: openResource.key, max: v })}
        />
      )}
    </>
  )
}

function Look({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.look}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Contatore dell'intestazione (Follia, Fato): − e + sempre a portata, tocco sul numero per la finestra. */
function CounterTile({
  label,
  icon: Icon,
  color,
  value,
  onOpen,
  onChange,
  mark,
}: {
  label: string
  icon: LucideIcon
  color: string
  value: number
  onOpen: () => void
  onChange: (value: number) => void
  /** Segno delle modifiche del Master. */
  mark?: ReactNode
}) {
  return (
    <div className={`${styles.tile} ${styles.counterTile}`} style={tone(color)}>
      <button type="button" className={styles.tileOpen} onClick={onOpen}>
        <span className={styles.tileLabel}>
          <Icon aria-hidden /> {label}
          {mark}
        </span>
        <span className={styles.tileValue}>
          <strong>{value}</strong>
        </span>
      </button>
      <div className={styles.counterButtons}>
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`Aumenta ${label}`}>
          <AddIcon aria-hidden />
        </button>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 0} aria-label={`Diminuisci ${label}`}>
          <MinusIcon aria-hidden />
        </button>
      </div>
    </div>
  )
}

function Chip({
  icon: Icon,
  color,
  label,
  onClick,
  children,
}: {
  icon: LucideIcon
  color: string
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={styles.chip} style={tone(color)} onClick={onClick} title={label} aria-label={label}>
      <Icon aria-hidden />
      <span>{children}</span>
    </button>
  )
}
