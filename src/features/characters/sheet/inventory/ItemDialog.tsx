import { useState, type FormEvent } from 'react'
import { Dialog } from '../../../../components/Dialog'
import { useAddItem, useUpdateItem, type CharacterSheet, type ItemRow } from '../../api'
import styles from '../powers/PowerDialog.module.less'

interface Props {
  sheet: CharacterSheet
  open: boolean
  item?: ItemRow
  initialCategory?: ItemRow['category']
  onClose: () => void
}

export function ItemDialog({ sheet, open, item, initialCategory, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={item ? 'Modifica oggetto' : 'Nuovo oggetto'} width={640}>
      <ItemForm
        key={item?.id ?? `new-${initialCategory}`}
        sheet={sheet}
        item={item}
        initialCategory={item?.category ?? initialCategory ?? 'usable'}
        onDone={onClose}
      />
    </Dialog>
  )
}

const toText = (n: number | null | undefined) => (n == null ? '' : String(n))
const toNumber = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.trunc(Number(s)) || 0))

function ItemForm({
  sheet,
  item,
  initialCategory,
  onDone,
}: {
  sheet: CharacterSheet
  item?: ItemRow
  initialCategory: ItemRow['category']
  onDone: () => void
}) {
  const add = useAddItem(sheet.id)
  const update = useUpdateItem(sheet.id)
  const [category, setCategory] = useState(initialCategory)
  const [slot, setSlot] = useState<ItemRow['slot']>(item?.slot ?? null)
  const [equipped, setEquipped] = useState(item?.equipped ?? false)
  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(toText(item?.quantity ?? 1))
  const [remaining, setRemaining] = useState(toText(item?.charges_remaining))
  const [total, setTotal] = useState(toText(item?.charges_total))
  const [value, setValue] = useState(item?.value ?? '')
  const [description, setDescription] = useState(item?.description ?? '')

  const pending = add.isPending || update.isPending
  const error = add.error ?? update.error

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const isEquipment = category === 'equipment'
    const fields = {
      category,
      slot: isEquipment ? slot : null,
      equipped: isEquipment ? equipped : false,
      name: name.trim(),
      quantity: toNumber(quantity) ?? 0,
      charges_remaining: toNumber(remaining),
      charges_total: toNumber(total),
      value: value.trim() || null,
      description: description.trim(),
    }
    if (item) await update.mutateAsync({ id: item.id, patch: fields })
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
        <label className="field">
          <span>Categoria</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as ItemRow['category'])}>
            <option value="usable">Utilizzabile</option>
            <option value="equipment">Equipaggiamento</option>
          </select>
        </label>
      </div>

      {category === 'equipment' && (
        <div className={styles.row}>
          <label className="field">
            <span>Tipo</span>
            <select
              className="select"
              value={slot ?? ''}
              onChange={(e) => setSlot((e.target.value || null) as ItemRow['slot'])}
            >
              <option value="">Altro</option>
              <option value="weapon">Arma</option>
              <option value="armor">Armatura</option>
            </select>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={equipped} onChange={(e) => setEquipped(e.target.checked)} />
            In uso
          </label>
        </div>
      )}

      <div className={styles.row}>
        <label className="field">
          <span>Quantità</span>
          <input className="input" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="field">
          <span>Residue</span>
          <input className="input" type="number" min={0} value={remaining} onChange={(e) => setRemaining(e.target.value)} />
        </label>
        <label className="field">
          <span>Cariche totali</span>
          <input className="input" type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Valore</span>
        <input className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="es. 5.000 mo, ($$)" />
      </label>

      <label className="field">
        <span>Descrizione</span>
        <textarea className="textarea" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      {error && <p className="error-box">Errore: {error.message}</p>}

      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Annulla
        </button>
        <button className="btn btn--primary" type="submit" disabled={!name.trim() || pending}>
          {item ? 'Salva' : 'Aggiungi'}
        </button>
      </div>
    </form>
  )
}
