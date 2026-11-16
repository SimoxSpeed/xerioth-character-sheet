import { useMemo, useState, type ReactNode } from 'react'
import {
  castCost,
  leadingNumber,
  powerSuccessTarget,
  quickCastPercent,
  rollBonus,
  scaleLeadingNumber,
  skillNextCost,
  type PowerSection,
} from '../../../../game/rules'
import { NumberField } from '../../../../components/NumberField'
import { AddIcon, CollapseIcon, DeleteIcon, DiceIcon, EditIcon, ExpandIcon, QuickCastIcon } from '../../../../components/icons'
import { useIsMaster } from '../../../campaigns/api'
import { attributeValues, skillLevel, useDeletePower, useUpdatePower, type CharacterSheet, type PowerRow } from '../../api'
import { AskMasterButton } from '../../../threads/AskMasterButton'
import { useRollTrigger } from '../sheetContext'
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
              isMaster={isMaster}
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
  isMaster: boolean
  /** Lancio Rapido attivo: percentuale da applicare (0 = spento). */
  quickPct: number
  onEdit: () => void
}

/**
 * Riga di un potere, sempre modificabile come sulla carta:
 * clic sul livello = lo modifichi, clic sui punti = aggiungi/togli, clic sul resto = tiro.
 * Acquisizione, MAX, modifica ed elimina stanno nel dettaglio (freccia a destra).
 */
function PowerCard({ sheet, power, section, isMaster, quickPct, onEdit }: CardProps) {
  const update = useUpdatePower(sheet.id)
  const remove = useDeletePower(sheet.id)
  const [expanded, setExpanded] = useState(false)

  // Costo: quello scritto ha la precedenza; la tabella A108 è un riferimento.
  const tableCost = castCost(power.level, power.acquisition_level)
  const writtenCost = power.cost.trim()
  const hasWrittenCost = writtenCost !== '' && writtenCost.toUpperCase() !== 'ND'
  const baseCost = hasWrittenCost ? writtenCost : tableCost !== null ? String(tableCost) : ''
  const costDiffers = hasWrittenCost && tableCost !== null && leadingNumber(writtenCost) !== tableCost

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
          power: { successDie: power.success_die },
        },
  )
  const rollable = power.level !== null

  // Raggio, area, durata: sempre a vista sotto il nome.
  const range = power.range.trim()
  const area = power.area.trim()
  const facts = [
    range && area && range === area ? { label: 'Raggio/Area', value: range } : null,
    range && range !== area ? { label: 'Raggio', value: range } : null,
    area && range !== area ? { label: 'Area', value: area } : null,
    power.duration.trim() ? { label: 'Durata', value: power.duration.trim() } : null,
  ].filter((f): f is { label: string; value: string } => f !== null)

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

  // Riuscita come sul foglio: dado del Master + caratteristica + modificatore + livello.
  // Solo il Master la modifica: scrive la riuscita, si salva il dado (riuscita − il resto).
  const bonus = rollBonus(attributeValues(sheet)[section.attribute], power.level)
  const successTarget = power.success_die === null ? null : powerSuccessTarget(power.success_die, bonus)
  const successValue = isMaster ? (
    <NoRoll>
      <NumberField
        className={styles.editable}
        label={`Riuscita ${power.name}`}
        value={successTarget}
        nullable
        min={bonus}
        max={bonus + 20}
        placeholder="—"
        onCommit={(v) => update.mutate({ id: power.id, patch: { success_die: v === null ? null : v - bonus } })}
      />
    </NoRoll>
  ) : (
    (successTarget ?? '—')
  )

  // Gerarchia: il nome in evidenza; i quattro numeri in colonna a destra con etichette minime;
  // raggio/area/durata e avanzamento quieti sotto il nome; dado solo al passaggio.
  const body = (
    <>
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.name}>{power.name}</span>
          {power.is_special && <span className={styles.badgeSpecial}>Speciale</span>}
          {power.granted_by && <span className={styles.badgeGranted}>{power.granted_by}</span>}
          <ThreadDot characterId={sheet.id} targetType="power" targetId={power.id} />
        </div>

        {facts.length > 0 && (
          <p className={styles.facts}>
            {facts.map((f) => (
              <span key={f.label}>
                {f.label} <b>{f.value}</b>
              </span>
            ))}
          </p>
        )}

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

      <div className={styles.stats}>
        <Stat label="Liv" strong>
          {levelValue}
        </Stat>
        <Stat label="Riuscita" muted={power.success_die === null}>
          {successValue}
        </Stat>
        <Stat label="Costo" quick={!!quickCost} title={costDiffers ? `Tabella: ${tableCost}` : undefined}>
          {shownCost}
        </Stat>
        <Stat label="Lancio" quick={!!quickTime}>
          {shownTime}
        </Stat>
      </div>

      {rollable && <DiceIcon aria-hidden className={styles.dice} />}
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
              {!hasWrittenCost && tableCost !== null && <> · Costo da tabella</>}
              {costDiffers && <> · Tabella: {tableCost}</>}
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

function Stat({
  label,
  strong,
  muted,
  quick,
  title,
  children,
}: {
  label: string
  strong?: boolean
  muted?: boolean
  quick?: boolean
  title?: string
  children: ReactNode
}) {
  return (
    <span
      className={`${styles.stat} ${strong ? styles.statStrong : ''} ${muted ? styles.statMuted : ''} ${quick ? styles.statQuick : ''}`}
      title={title}
    >
      <small>{label}</small>
      <b>{children}</b>
    </span>
  )
}
