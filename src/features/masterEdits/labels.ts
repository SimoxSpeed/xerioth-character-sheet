import type { Json } from '../../lib/database.types'
import { findAlignment } from '../../game/data/alignments'
import { ATTRIBUTES, type AttributeKey } from '../../game/data/attributes'
import { findClass, RESOURCES, type ResourceKey } from '../../game/data/classes'
import { findDeity } from '../../game/data/deities'
import { findRace } from '../../game/data/races'
import { findSkill } from '../../game/data/skills'
import type { EditTarget, MasterEdit } from './api'

export const EDIT_TARGET_LABELS: Record<EditTarget, string> = {
  character: 'Personaggio',
  class: 'Classe',
  attribute: 'Caratteristica',
  resource: 'Risorsa',
  skill: 'Capacità',
  power: 'Potere',
  item: 'Oggetto',
  xp: 'Esperienza',
}

const FIELD_LABELS: Record<string, string> = {
  // Personaggio
  name: 'Nome',
  race_key: 'Razza',
  alignment_key: 'Allineamento',
  age: 'Età',
  height_cm: 'Altezza',
  weight_kg: 'Peso',
  eyes: 'Occhi',
  skin: 'Pelle',
  hair: 'Capelli',
  level: 'Livello',
  hp_bonus: 'Bonus PF',
  temp_hp: 'PF temporanei',
  damage_taken: 'Danni',
  madness_points: 'Follia',
  fate_points: 'Fato',
  gold: 'Oro',
  portrait_url: 'Ritratto',
  background: 'Storia',
  // Classi
  class_key: 'Classe',
  deity_key: 'Divinità',
  patron: 'Patrono',
  // Caratteristiche, risorse
  value: 'Valore',
  advancement: 'Avanzamento',
  current: 'Attuale',
  max: 'Massimo',
  // Capacità e poteri
  skill_key: 'Capacità',
  custom_name: 'Nome',
  attribute: 'Caratteristica',
  is_maxed: 'MAX',
  description: 'Descrizione',
  kind: 'Tipo',
  acquisition_level: 'Acquisizione',
  range: 'Raggio',
  area: 'Area',
  cast_time: 'Tempo di lancio',
  cost: 'Costo',
  duration: 'Durata',
  is_special: 'Speciale',
  success_die: 'Dado riuscita',
  success_target: 'Riuscita',
  granted_by: 'Concesso da',
  // Oggetti
  category: 'Categoria',
  slot: 'Tipo',
  equipped: 'In uso',
  quantity: 'Quantità',
  charges_remaining: 'Cariche',
  charges_total: 'Cariche totali',
}

export const ACTION_LABELS: Record<MasterEdit['action'], string> = {
  insert: 'Aggiunto',
  update: 'Modificato',
  delete: 'Eliminato',
}

/** Nome dell'elemento modificato ("Corrosione", "Costituzione", "Punti Spirito"…). */
export function editTargetName(edit: MasterEdit): string {
  const label = edit.target_label
  switch (edit.target_type) {
    case 'attribute':
      return ATTRIBUTES[label as AttributeKey]?.label ?? label
    case 'resource':
      return RESOURCES[label as ResourceKey]?.label ?? label
    case 'skill':
      return findSkill(label)?.name ?? label
    case 'class':
      return findClass(label)?.name ?? label
    case 'xp':
      return 'Esperienza'
    default:
      return label
  }
}

/** Nome leggibile di una colonna ("damage_taken" → "Danni"). */
export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

/** "Livello", "Danni", oppure l'azione per aggiunte ed eliminazioni. */
export function editFieldName(edit: MasterEdit): string {
  if (edit.action !== 'update' || !edit.field) return ACTION_LABELS[edit.action]
  return FIELD_LABELS[edit.field] ?? edit.field
}

/** Valore leggibile: chiavi tradotte, booleani in Sì/No, numeri all'italiana. */
export function editValue(field: string | null, value: Json | null): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sì' : 'No'
  if (typeof value === 'number') return value.toLocaleString('it-IT')
  if (typeof value !== 'string') return JSON.stringify(value)
  switch (field) {
    case 'race_key':
      return findRace(value)?.name ?? value
    case 'alignment_key':
      return findAlignment(value)?.name ?? value
    case 'attribute':
      return ATTRIBUTES[value as AttributeKey]?.label ?? value
    case 'class_key':
      return findClass(value)?.name ?? value
    case 'deity_key':
      return findDeity(value)?.name ?? value
    case 'skill_key':
      return findSkill(value)?.name ?? value
    default:
      return value.length > 120 ? `${value.slice(0, 120)}…` : value
  }
}

/** Una riga riassuntiva: "Danni 81 → 96", "Aggiunto", "Esperienza +500". */
export function editChange(edit: MasterEdit): string {
  if (edit.target_type === 'xp' && edit.action === 'insert' && typeof edit.new_value === 'number') {
    return `${edit.new_value > 0 ? '+' : ''}${edit.new_value.toLocaleString('it-IT')}`
  }
  if (edit.action !== 'update') return ''
  return `${editValue(edit.field, edit.old_value)} → ${editValue(edit.field, edit.new_value)}`
}
