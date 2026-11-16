import { useMemo, useState } from 'react'
import { consumeItemPatch } from '../../../../game/rules'
import { NumberField } from '../../../../components/NumberField'
import { useToast } from '../../../../components/Toast'
import {
  AddIcon,
  ArmorIcon,
  CollapseIcon,
  DeleteIcon,
  EditIcon,
  ExpandIcon,
  InventoryIcon,
  MinusIcon,
  WeaponIcon,
} from '../../../../components/icons'
import { useDeleteItem, useUpdateItem, type CharacterSheet, type ItemRow } from '../../api'
import { AskMasterButton } from '../../../threads/AskMasterButton'
import { SLOT_LABELS } from '../sheetHelpers'
import { ThreadDot } from '../ThreadDot'
import { ItemDialog } from './ItemDialog'
import styles from './InventoryTab.module.less'

type Filter = 'all' | 'usable' | 'equipment' | 'equipped'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tutto' },
  { key: 'equipped', label: 'In uso' },
  { key: 'equipment', label: 'Equipaggiamento' },
  { key: 'usable', label: 'Utilizzabili' },
]

type DialogState = { mode: 'add'; category: ItemRow['category'] } | { mode: 'edit'; item: ItemRow } | null

export function InventoryTab({ sheet }: { sheet: CharacterSheet }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [dialog, setDialog] = useState<DialogState>(null)

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sheet.character_items.filter(
      (i) =>
        (filter === 'all' || (filter === 'equipped' ? i.equipped : i.category === filter)) &&
        (!query ||
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          (i.value ?? '').toLowerCase().includes(query)),
    )
  }, [sheet.character_items, search, filter])

  const groups: { category: ItemRow['category']; title: string }[] = [
    { category: 'equipment', title: 'Equipaggiamento' },
    { category: 'usable', title: 'Oggetti utilizzabili' },
  ]

  return (
    <section className={styles.tab}>
      <div className={styles.toolbar}>
        <input
          className={`input ${styles.search}`}
          type="search"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca nell'inventario"
        />
        <div className={styles.chips} role="group" aria-label="Filtro">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? styles.chipActive : styles.chip}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {groups.map(({ category, title }) => {
        // In uso per primi.
        const rows = items.filter((i) => i.category === category).sort((a, b) => Number(b.equipped) - Number(a.equipped))
        if (rows.length === 0 && (filter === 'equipped' || (filter !== 'all' && filter !== category))) return null
        return (
          <div key={category} className={styles.group}>
            <header className={styles.groupHeader}>
              <h3>
                {title} <span className={styles.count}>{rows.length}</span>
              </h3>
              <button className="btn btn--primary" onClick={() => setDialog({ mode: 'add', category })}>
                <AddIcon aria-hidden /> Aggiungi
              </button>
            </header>
            <ul className={styles.list}>
              {rows.map((item) => (
                <ItemRowView key={item.id} sheet={sheet} item={item} onEdit={() => setDialog({ mode: 'edit', item })} />
              ))}
            </ul>
            {rows.length === 0 && <p className={`muted ${styles.empty}`}>—</p>}
          </div>
        )
      })}

      <ItemDialog
        sheet={sheet}
        open={dialog !== null}
        item={dialog?.mode === 'edit' ? dialog.item : undefined}
        initialCategory={dialog?.mode === 'add' ? dialog.category : undefined}
        onClose={() => setDialog(null)}
      />
    </section>
  )
}

function ItemRowView({ sheet, item, onEdit }: { sheet: CharacterSheet; item: ItemRow; onEdit: () => void }) {
  const update = useUpdateItem(sheet.id)
  const remove = useDeleteItem(sheet.id)
  const toast = useToast()
  const [expanded, setExpanded] = useState(false)
  const usePatch = consumeItemPatch(item)
  const depleted = item.quantity === 0 && !item.charges_remaining
  const SlotIcon = item.slot === 'armor' ? ArmorIcon : item.slot === 'weapon' ? WeaponIcon : InventoryIcon
  const hasCharges = item.charges_total !== null || item.charges_remaining !== null

  function use() {
    if (!usePatch) return
    const before = { quantity: item.quantity, charges_remaining: item.charges_remaining }
    update.mutate({ id: item.id, patch: usePatch })
    toast({ message: `${item.name}: usato`, undo: () => update.mutate({ id: item.id, patch: before }) })
  }

  function confirmDelete() {
    if (window.confirm(`Rimuovere "${item.name}"?`)) remove.mutate(item.id)
  }

  return (
    <li className={`${styles.item} ${depleted ? styles.depleted : ''} ${item.equipped ? styles.equippedItem : ''} ${expanded ? styles.itemOpen : ''}`}>
      <div className={styles.row}>
        <div className={styles.cells}>
          <span className={styles.nameCell}>
            <SlotIcon aria-hidden className={styles.slotIcon} />
            <span className={styles.name}>
              {item.name}
              <ThreadDot characterId={sheet.id} targetType="item" targetId={item.id} />
            </span>
            {item.slot && <span className={styles.slot}>{SLOT_LABELS[item.slot]}</span>}
          </span>

          {item.category === 'equipment' ? (
            <button
              type="button"
              className={item.equipped ? styles.equipOn : styles.equipOff}
              aria-pressed={item.equipped}
              onClick={() => update.mutate({ id: item.id, patch: { equipped: !item.equipped } })}
            >
              In uso
            </button>
          ) : (
            <span className={styles.equipOff} aria-hidden style={{ visibility: "hidden" }} />
          )}

          <span className={styles.qty} aria-label="Quantità">
            <button
              type="button"
              aria-label={`Diminuisci quantità ${item.name}`}
              disabled={item.quantity <= 0}
              onClick={() => update.mutate({ id: item.id, patch: { quantity: item.quantity - 1 } })}
            >
              <MinusIcon aria-hidden />
            </button>
            <NumberField
              label={`Quantità ${item.name}`}
              value={item.quantity}
              min={0}
              onCommit={(v) => update.mutate({ id: item.id, patch: { quantity: v ?? 0 } })}
            />
            <button
              type="button"
              aria-label={`Aumenta quantità ${item.name}`}
              onClick={() => update.mutate({ id: item.id, patch: { quantity: item.quantity + 1 } })}
            >
              <AddIcon aria-hidden />
            </button>
          </span>

          {/* Cariche: solo per gli oggetti che le hanno, sempre modificabili con un clic */}
          <span className={styles.charges} title="Cariche">
            {hasCharges && (
              <>
                <small>Cariche</small>
                <span>
                  <NumberField
                    label={`Residue ${item.name}`}
                    value={item.charges_remaining}
                    nullable
                    min={0}
                    onCommit={(v) => update.mutate({ id: item.id, patch: { charges_remaining: v } })}
                  />
                  /
                  <NumberField
                    label={`Cariche totali ${item.name}`}
                    value={item.charges_total}
                    nullable
                    min={0}
                    onCommit={(v) => update.mutate({ id: item.id, patch: { charges_total: v } })}
                  />
                </span>
              </>
            )}
          </span>

          <span className={styles.value}>{item.value || ''}</span>

          {/* Armi e armature non si "usano": solo oggetti utilizzabili o con cariche */}
          {item.category === 'usable' || hasCharges ? (
            <button type="button" className={styles.use} disabled={!usePatch} onClick={use}>
              Usa
            </button>
          ) : (
            <span className={styles.use} aria-hidden style={{ visibility: 'hidden' }} />
          )}
        </div>

        <button
          type="button"
          className={styles.expand}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Chiudi descrizione' : 'Descrizione'}
        >
          {expanded ? <CollapseIcon aria-hidden /> : <ExpandIcon aria-hidden />}
        </button>
      </div>

      {expanded && (
        <div className={styles.detail}>
          {item.description ? <p>{item.description}</p> : <p className="muted">—</p>}
          <div className={styles.detailFooter}>
            <AskMasterButton
              characterId={sheet.id}
              ownerId={sheet.owner_id}
              targetType="item"
              targetId={item.id}
              defaultTitle={`Oggetto: ${item.name}`}
            />
            <span className={styles.detailActions}>
              <button type="button" className="btn btn--ghost btn--small" onClick={onEdit}>
                <EditIcon aria-hidden /> Modifica
              </button>
              <button type="button" className="btn btn--ghost btn--small btn--danger" onClick={confirmDelete}>
                <DeleteIcon aria-hidden /> Elimina
              </button>
            </span>
          </div>
        </div>
      )}
    </li>
  )
}
