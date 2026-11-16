import { useState, type FormEvent } from 'react'
import { forcedSuccessDie, powerSuccessTarget, rollBonus, type PowerSection } from '../../../../game/rules'
import { Dialog } from '../../../../components/Dialog'
import { attributeValues, useAddPower, useUpdatePower, type CharacterSheet, type PowerRow } from '../../api'
import styles from './PowerDialog.module.less'

interface Props {
  sheet: CharacterSheet
  section: PowerSection
  /** Solo il Master fissa il dado riuscita. */
  isMaster: boolean
  open: boolean
  /** Modifica di un potere esistente; se assente si aggiunge. */
  power?: PowerRow
  onClose: () => void
}

export function PowerDialog({ sheet, section, isMaster, open, power, onClose }: Props) {
  const singular = section.singular.toLowerCase()
  const title = power ? `Modifica ${singular}` : `Nuovo ${singular}`

  return (
    <Dialog open={open} onClose={onClose} title={title} width={680}>
      <PowerForm
        // nuova chiave → stato del form ripartito da capo
        key={power?.id ?? 'new'}
        sheet={sheet}
        section={section}
        isMaster={isMaster}
        power={power}
        onDone={onClose}
      />
    </Dialog>
  )
}

const toText = (n: number | null | undefined) => (n == null ? '' : String(n))
const toNumber = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.trunc(Number(s)) || 0))

function PowerForm({
  sheet,
  section,
  isMaster,
  power,
  onDone,
}: {
  sheet: CharacterSheet
  section: PowerSection
  isMaster: boolean
  power?: PowerRow
  onDone: () => void
}) {
  const add = useAddPower(sheet.id)
  const update = useUpdatePower(sheet.id)
  const [name, setName] = useState(power?.name ?? '')
  const [level, setLevel] = useState(power ? toText(power.level) : '0')
  const [acquisition, setAcquisition] = useState(toText(power?.acquisition_level))
  const [range, setRange] = useState(power?.range ?? '')
  const [area, setArea] = useState(power?.area ?? '')
  const [castTime, setCastTime] = useState(power?.cast_time ?? '')
  const [cost, setCost] = useState(power?.cost ?? '')
  const [duration, setDuration] = useState(power?.duration ?? '')
  const [grantedBy, setGrantedBy] = useState(power?.granted_by ?? '')
  const [isSpecial, setIsSpecial] = useState(power?.is_special ?? false)
  const [successDie, setSuccessDie] = useState(toText(power?.success_die))
  const [description, setDescription] = useState(power?.description ?? '')

  const pending = add.isPending || update.isPending
  const error = add.error ?? update.error

  // Riuscita: il Master sceglie il dado e si salva il totale di questo momento
  // (dado + caratteristica + modificatore + livello). Livello 0 = sempre dado 20.
  const levelValue = toNumber(level)
  const forcedDie = forcedSuccessDie(levelValue)
  const chosenDie = forcedDie ?? (successDie.trim() === '' ? null : Math.min(20, toNumber(successDie) ?? 0))
  const dieChanged = chosenDie !== (power?.success_die ?? null) || (chosenDie !== null && power?.success_target == null)
  const newTarget =
    chosenDie === null ? null : powerSuccessTarget(chosenDie, rollBonus(attributeValues(sheet)[section.attribute], levelValue))
  const shownTarget = dieChanged ? newTarget : (power?.success_target ?? null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const acquisitionLevel = toNumber(acquisition)
    const fields = {
      kind: section.kind,
      name: name.trim(),
      level: toNumber(level),
      acquisition_level: acquisitionLevel === null ? null : Math.min(10, Math.max(1, acquisitionLevel)),
      range: range.trim(),
      area: area.trim(),
      cast_time: castTime.trim(),
      cost: cost.trim(),
      duration: duration.trim(),
      granted_by: grantedBy.trim() || null,
      is_special: isSpecial,
      description: description.trim(),
      // Dado e riuscita li manda solo il Master (il database rifiuta gli altri), e solo se il dado cambia:
      // la riuscita già fissata non si ricalcola.
      ...(isMaster && dieChanged ? { success_die: chosenDie, success_target: newTarget } : {}),
    }
    if (power) await update.mutateAsync({ id: power.id, patch: fields })
    else await add.mutateAsync(fields)
    onDone()
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label className={`field ${styles.wide}`}>
          <span>Nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
      </div>

      <div className={styles.row}>
        <label className="field">
          <span>Livello (vuoto = NA)</span>
          <input className="input" type="number" min={0} value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
        <label className="field">
          <span>Acquisizione (1–10)</span>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={acquisition}
            onChange={(e) => setAcquisition(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Costo</span>
          <input
            className="input"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="ND"
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className="field">
          <span>Raggio</span>
          <input className="input" value={range} onChange={(e) => setRange(e.target.value)} placeholder="Tocco, 10 metri…" />
        </label>
        <label className="field">
          <span>Area</span>
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
        </label>
      </div>

      <div className={styles.row}>
        <label className="field">
          <span>Tempo di lancio</span>
          <input className="input" value={castTime} onChange={(e) => setCastTime(e.target.value)} placeholder="secondi" />
        </label>
        <label className="field">
          <span>Durata</span>
          <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
        <label className="field">
          <span>Concesso da</span>
          <input
            className="input"
            value={grantedBy}
            onChange={(e) => setGrantedBy(e.target.value)}
            placeholder="es. Vortex"
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.check}>
          <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} />
          Potere speciale
        </label>
      </div>

      {isMaster && (
        <div className={styles.row}>
          <label className="field">
            <span>Dado riuscita</span>
            <input
              className="input"
              type="number"
              min={0}
              max={20}
              value={forcedDie ?? successDie}
              disabled={forcedDie !== null}
              onChange={(e) => setSuccessDie(e.target.value)}
              placeholder="—"
            />
          </label>
          <div className="field">
            <span>Riuscita</span>
            <output className={styles.target}>{shownTarget ?? '—'}</output>
          </div>
        </div>
      )}

      <label className="field">
        <span>Descrizione</span>
        <textarea className="textarea" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      {error && <p className="error-box">Errore: {error.message}</p>}

      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Annulla
        </button>
        <button className="btn btn--primary" type="submit" disabled={!name.trim() || pending}>
          {power ? 'Salva' : 'Aggiungi'}
        </button>
      </div>
    </form>
  )
}
