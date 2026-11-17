import { useMemo, useState, type ReactNode } from 'react'
import {
  castCost,
  quickCastPercent,
  scaleLeadingNumber,
  skillNextCost,
  type PowerSection,
} from '../../../../game/rules'
import { NumberField } from '../../../../components/NumberField'
import { AddIcon, CollapseIcon, DeleteIcon, DiceIcon, EditIcon, ExpandIcon, QuickCastIcon } from '../../../../components/icons'
import { useIsMaster } from '../../../campaigns/api'
import { skillLevel, useDeletePower, useUpdatePower, type CharacterSheet, type PowerRow } from '../../api'
import { AskMasterButton } from '../../../threads/AskMasterButton'
import { useCanRoll, useRollTrigger } from '../sheetContext'
import { NoRoll, ProgressLine } from '../SheetBits'
import { ThreadDot } from '../ThreadDot'
import { PowerDialog } from './PowerDialog'
import styles from './PowersTab.module.less'

type DialogState = { mode: 'add' } | { mode: 'edit'; power: PowerRow } | null

/** Una scheda per tipo di potere: "Miracoli", "Incantesimi"… */
export function PowersTab({ sheet, section }: { sheet: CharacterSheet; section: PowerSection }) {
  const isMaster = useIsMaster(sheet.campaign_id)
  const [search, setSearch] = useState('')
  const [quickCast, setQuickCast] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)

  const quickPct = quickCastPercent(skillLevel(sheet, 'lancio_rapido'))
  const activeQuickPct = quickCast ? quickPct : 0

  const all = useMemo(() => sheet.character_powers.filter((p) => p.kind === section.kind), [sheet.character_powers, section.kind])
  const powers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return all
    return all.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
  }, [all, search])

  return (
    <section className={styles.tab}>
      <div className={styles.toolbar}>
        <input
          className={`input ${styles.search}`}
          type="search"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Cerca ${section.label.toLowerCase()}`}
        />
        {quickPct > 0 && (
          <button
            type="button"
            className={`${styles.quickToggle} ${quickCast ? styles.quickToggleOn : ''}`}
            aria-pressed={quickCast}
            onClick={() => setQuickCast((v) => !v)}
          >
            <QuickCastIcon aria-hidden /> Lancio Rapido {quickPct}%
          </button>
        )}
        <button className="btn btn--primary" onClick={() => setDialog({ mode: 'add' })}>
          <AddIcon aria-hidden /> Aggiungi
        </button>
      </div>

      {powers.length === 0 ? (
        <p className="muted">{all.length === 0 ? `Nessun ${section.singular.toLowerCase()}.` : 'Nessun risultato.'}</p>
      ) : (
        <ul className={styles.list}>
          {powers.map((power) => (
            <PowerCard
              key={power.id}
              sheet={sheet}
              power={power}
              section={section}
              quickPct={activeQuickPct}
              onEdit={() => setDialog({ mode: 'edit', power })}
            />
          ))}
        </ul>
      )}

      <PowerDialog
        sheet={sheet}
        section={section}
        isMaster={isMaster}
        open={dialog !== null}
        power={dialog?.mode === 'edit' ? dialog.power : undefined}
        onClose={() => setDialog(null)}
      />
    </section>
  )
}

interface CardProps {
  sheet: CharacterSheet
  power: PowerRow
  section: PowerSection
  /** Lancio Rapido attivo: percentuale da applicare (0 = spento). */
  quickPct: number
  onEdit: () => void
}

/**
 * Riga di un potere, sempre modificabile come sulla carta:
 * clic sul livello = lo modifichi, clic sui punti = aggiungi/togli, clic sul resto = tiro.
 * Acquisizione, MAX, modifica ed elimina stanno nel dettaglio (freccia a destra).
 */
function PowerCard({ sheet, power, section, quickPct, onEdit }: CardProps) {
  const update = useUpdatePower(sheet.id)
  const remove = useDeletePower(sheet.id)
  const [expanded, setExpanded] = useState(false)

  // Costo: chi ha Punti Mana vede direttamente quello della tabella A108 (livello × acquisizione);
  // tutti gli altri (es. Sacerdoti, Punti Spirito) quello scritto, così com'è ("ND" compreso).
  const tableCost = section.resource === 'mana' ? castCost(power.level, power.acquisition_level) : null
  const baseCost = tableCost !== null ? String(tableCost) : power.cost.trim()

  // Lancio Rapido attivo: tempo ridotto e costo aumentato della stessa percentuale.
  const quickTime = quickPct > 0 ? scaleLeadingNumber(power.cast_time, -quickPct) : null
  const quickCost = quickPct > 0 ? scaleLeadingNumber(baseCost, quickPct) : null
  const shownCost = quickCost ?? (baseCost || '—')
  const shownTime = quickTime ?? (power.cast_time || '—')

  const nextCost = skillNextCost(power.level, power.is_maxed)
  const Chevron = expanded ? CollapseIcon : ExpandIcon

  const trigger = useRollTrigger(
    power.level === null
      ? null
      : {
          label: power.name,
          attribute: section.attribute,
          level: power.level,
          isMaxed: power.is_maxed,
          power: { successTarget: power.success_target },
        },
  )
  const canRoll = useCanRoll()
  const rollable = power.level !== null && canRoll

  // Raggio, area, durata: sempre a vista nel blocco Effetto ("—" se vuoti).
  // Raggio e area uguali: un valore solo che occupa entrambe le colonne.
  const range = power.range.trim()
  const area = power.area.trim()
  const duration = power.duration.trim()
  const sameRangeArea = range !== '' && range === area

  function confirmDelete() {
    if (window.confirm(`Eliminare "${power.name}"?`)) remove.mutate(power.id)
  }

  // Clic sul numero per modificarlo (senza far partire il tiro)
  const levelValue = (
    <NoRoll>
      <NumberField
        className={styles.editable}
        label={`Livello ${power.name}`}
        value={power.level}
        nullable
        min={0}
        placeholder="NA"
        onCommit={(v) => update.mutate({ id: power.id, patch: { level: v } })}
      />
    </NoRoll>
  )

  // Gerarchia: il nome in evidenza con l'avanzamento sotto; a destra tre blocchi
  // Tiro (evidenziato) · Lancio · Effetto; dado a sinistra del Tiro, solo al passaggio.
  // Riuscita: totale fissato dal Master (dado scelto nella modifica del potere), non si ricalcola.
  const body = (
    <>
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.name}>{power.name}</span>
          {power.is_special && <span className={styles.badgeSpecial}>Speciale</span>}
          {power.granted_by && <span className={styles.badgeGranted}>{power.granted_by}</span>}
          <ThreadDot characterId={sheet.id} targetType="power" targetId={power.id} />
        </div>

        {power.is_maxed ? (
          // Al MAX la scritta prende il posto della barra
          <span className={styles.maxLine}>MAX</span>
        ) : (
          <ProgressLine
            name={power.name}
            value={power.advancement}
            max={nextCost}
            onChange={(v) => update.mutate({ id: power.id, patch: { advancement: v } })}
          />
        )}
      </div>

      <DiceIcon aria-hidden className={rollable ? styles.dice : styles.diceIdle} />

      <div className={styles.blocks}>
        <div className={`${styles.block} ${styles.blockRoll}`}>
          <Stat label="Liv" strong>
            {levelValue}
          </Stat>
          <Stat label="Riuscita" muted={power.success_target === null}>
            {power.success_target ?? '—'}
          </Stat>
        </div>
        <div className={`${styles.block} ${styles.blockCast}`}>
          <Stat label="Costo" quick={!!quickCost} muted={shownCost === '—'} title={shownCost}>
            {shownCost}
          </Stat>
          <Stat label="Lancio" quick={!!quickTime} muted={shownTime === '—'} title={shownTime}>
            {shownTime}
          </Stat>
        </div>
        <div className={`${styles.block} ${styles.blockEffect}`}>
          {sameRangeArea ? (
            <Stat label="Raggio/Area" wide title={range}>
              {range}
            </Stat>
          ) : (
            <>
              <Stat label="Raggio" muted={!range} title={range || undefined}>
                {range || '—'}
              </Stat>
              <Stat label="Area" muted={!area} title={area || undefined}>
                {area || '—'}
              </Stat>
            </>
          )}
          <Stat label="Durata" muted={!duration} title={duration || undefined}>
            {duration || '—'}
          </Stat>
        </div>
      </div>
    </>
  )

  return (
    <li className={`${styles.item} ${expanded ? styles.itemOpen : ''}`}>
      <div className={styles.row}>
        {rollable ? (
          <div className={`${styles.grid} ${styles.rollable}`} role="button" tabIndex={0} aria-label={`Tira ${power.name}`} {...trigger}>
            {body}
          </div>
        ) : (
          <div className={styles.grid}>{body}</div>
        )}
        <button
          type="button"
          className={styles.expand}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Chiudi descrizione' : 'Descrizione'}
        >
          <Chevron aria-hidden />
        </button>
      </div>

      {expanded && (
        <div className={styles.detail}>
          {power.description ? <p>{power.description}</p> : <p className="muted">—</p>}
          {/* Controlli del potere: sempre disponibili, ma fuori dalla riga */}
          <div className={styles.detailFooter}>
            <label className={styles.acquisition}>
              Acquisizione
              <NumberField
                label={`Livello di acquisizione ${power.name}`}
                value={power.acquisition_level}
                nullable
                min={1}
                max={10}
                placeholder="—"
                onCommit={(v) => update.mutate({ id: power.id, patch: { acquisition_level: v } })}
              />
            </label>
            <span className={styles.meta}>
              {quickCost && <>Senza Lancio Rapido: {baseCost} / {power.cast_time || '—'}</>}
            </span>
            <span className={styles.detailActions}>
              <button
                type="button"
                className={`${styles.maxToggle} ${power.is_maxed ? styles.maxToggleOn : ''}`}
                onClick={() => update.mutate({ id: power.id, patch: { is_maxed: !power.is_maxed } })}
                aria-pressed={power.is_maxed}
              >
                MAX
              </button>
              <AskMasterButton
                characterId={sheet.id}
                ownerId={sheet.owner_id}
                targetType="power"
                targetId={power.id}
                defaultTitle={`${section.singular}: ${power.name}`}
              />
              <button type="button" className="btn btn--ghost btn--square" onClick={onEdit} title="Modifica" aria-label={`Modifica ${power.name}`}>
                <EditIcon aria-hidden />
              </button>
              <button type="button" className="btn btn--ghost btn--square btn--danger" onClick={confirmDelete} title="Elimina" aria-label={`Elimina ${power.name}`}>
                <DeleteIcon aria-hidden />
              </button>
            </span>
          </div>
        </div>
      )}
    </li>
  )
}

/** Un valore della riga: etichetta sopra, numero sotto. */
function Stat({
  label,
  strong,
  muted,
  quick,
  wide,
  title,
  children,
}: {
  label: string
  strong?: boolean
  muted?: boolean
  quick?: boolean
  /** Occupa due colonne del blocco (Raggio/Area uguali). */
  wide?: boolean
  title?: string
  children: ReactNode
}) {
  return (
    <span
      className={`${styles.stat} ${strong ? styles.statStrong : ''} ${muted ? styles.statMuted : ''} ${quick ? styles.statQuick : ''} ${wide ? styles.statWide : ''}`}
      title={title}
    >
      <small>{label}</small>
      <b>{children}</b>
    </span>
  )
}
