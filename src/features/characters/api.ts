import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Json, Tables, TablesInsert, TablesUpdate } from '../../lib/database.types'
import { ATTRIBUTES, ATTRIBUTE_KEYS, type AttributeKey } from '../../game/data/attributes'
import { RESOURCES, type ResourceKey } from '../../game/data/classes'
import { getCatalog } from '../catalog/store'
import { useReasonGate, withReason, type EditPreview, type EditPrompt } from '../masterEdits/gate'
import { ACTION_LABELS, editValue, fieldLabel } from '../masterEdits/labels'

export type CharacterRow = Tables<'characters'>
export type AttributeRow = Tables<'character_attributes'>
export type ClassRow = Tables<'character_classes'>
export type ResourceRow = Tables<'character_resources'>
export type SkillRow = Tables<'character_skills'>
export type PowerRow = Tables<'character_powers'>
export type ItemRow = Tables<'character_items'>
export type XpEntryRow = Tables<'character_xp_entries'>

export interface CharacterSheet extends CharacterRow {
  character_attributes: AttributeRow[]
  character_classes: ClassRow[]
  character_resources: ResourceRow[]
  character_skills: SkillRow[]
  character_powers: PowerRow[]
  character_items: ItemRow[]
  character_xp_entries: XpEntryRow[]
}

export const characterKeys = {
  list: (campaignId: string) => ['characters', 'list', campaignId] as const,
  sheet: (id: string) => ['characters', 'sheet', id] as const,
}

// ---------------------------------------------------------------------------
// Letture
// ---------------------------------------------------------------------------

export type CharacterListItem = Pick<CharacterRow, 'id' | 'name' | 'level' | 'race_key' | 'owner_id' | 'portrait_url'> & {
  character_classes: Pick<ClassRow, 'class_key' | 'deity_key' | 'patron'>[]
  owner: { display_name: string } | null
}

/** Personaggi visibili nella campagna (i propri; il Master li vede tutti). */
export function useCharacters(campaignId: string) {
  return useQuery({
    queryKey: characterKeys.list(campaignId),
    queryFn: async (): Promise<CharacterListItem[]> =>
      unwrap(
        await supabase
          .from('characters')
          .select(
            'id, name, level, race_key, owner_id, portrait_url, character_classes(class_key, deity_key, element_key, patron), owner:profiles(display_name)',
          )
          .eq('campaign_id', campaignId)
          .order('name'),
      ),
  })
}

export function useCharacterSheet(id: string) {
  return useQuery({
    queryKey: characterKeys.sheet(id),
    queryFn: async (): Promise<CharacterSheet> =>
      unwrap(
        await supabase
          .from('characters')
          .select(
            '*, character_attributes(*), character_classes(*), character_resources(*), character_skills(*), character_powers(*), character_items(*), character_xp_entries(*)',
          )
          .eq('id', id)
          .order('sort_order', { referencedTable: 'character_classes' })
          .order('sort_order', { referencedTable: 'character_skills' })
          .order('sort_order', { referencedTable: 'character_powers' })
          .order('sort_order', { referencedTable: 'character_items' })
          .order('created_at', { referencedTable: 'character_xp_entries' })
          .single(),
      ),
  })
}

/** Valori delle caratteristiche come oggetto (default 10 se mancante). */
export function attributeValues(sheet: CharacterSheet): Record<AttributeKey, number> {
  const values = Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, 10])) as Record<AttributeKey, number>
  for (const row of sheet.character_attributes) values[row.attribute] = row.value
  return values
}

/** Esperienza totale: sempre la somma delle voci del registro, mai un valore salvato. */
export function xpTotal(sheet: CharacterSheet): number {
  return sheet.character_xp_entries.reduce((sum, e) => sum + e.amount, 0)
}

/** Livello di una capacità per skill_key (null = non appresa / assente). */
export function skillLevel(sheet: CharacterSheet, key: string): number | null {
  return sheet.character_skills.find((s) => s.skill_key === key)?.level ?? null
}

/** Livelli delle capacità per skill_key (solo quelle collegate al catalogo). */
export function skillLevels(sheet: CharacterSheet): Record<string, number | null> {
  const levels: Record<string, number | null> = {}
  for (const s of sheet.character_skills) {
    if (s.skill_key) levels[s.skill_key] = s.level
  }
  return levels
}

// ---------------------------------------------------------------------------
// Creazione
// ---------------------------------------------------------------------------

export interface NewCharacterInput {
  campaignId: string
  ownerId: string
  name: string
  raceKey: string | null
  alignmentKey: string | null
  age: number | null
  heightCm: number | null
  weightKg: number | null
  eyes: string
  skin: string
  hair: string
  level: number
  classes: { classKey: string; deityKey: string | null; elementKey: string | null; patron: string | null }[]
  attributes: Record<AttributeKey, number>
}

export function useCreateCharacter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewCharacterInput): Promise<string> => {
      const { data: character, error } = await supabase
        .from('characters')
        .insert({
          campaign_id: input.campaignId,
          owner_id: input.ownerId,
          name: input.name.trim(),
          race_key: input.raceKey,
          alignment_key: input.alignmentKey,
          age: input.age,
          height_cm: input.heightCm,
          weight_kg: input.weightKg,
          eyes: input.eyes.trim(),
          skin: input.skin.trim(),
          hair: input.hair.trim(),
          level: input.level,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      const attributes: TablesInsert<'character_attributes'>[] = ATTRIBUTE_KEYS.map((key) => ({
        character_id: character.id,
        attribute: key,
        value: input.attributes[key],
      }))
      unwrap(await supabase.from('character_attributes').insert(attributes))

      if (input.classes.length > 0) {
        unwrap(
          await supabase.from('character_classes').insert(
            input.classes.map((c, i) => ({
              character_id: character.id,
              class_key: c.classKey,
              deity_key: c.deityKey,
              element_key: c.elementKey,
              patron: c.patron?.trim() || null,
              sort_order: i,
            })),
          ),
        )
      }

      // Una riga risorsa per ogni risorsa di classe (Spirito, Mana, …).
      const resourceKeys = new Set(
        input.classes.map((c) => getCatalog().klass(c.classKey)?.resourceKey).filter((r): r is ResourceKey => !!r),
      )
      if (resourceKeys.size > 0) {
        unwrap(
          await supabase
            .from('character_resources')
            .insert([...resourceKeys].map((key) => ({ character_id: character.id, resource_key: key }))),
        )
      }

      return character.id
    },
    onSuccess: (_id, input) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.list(input.campaignId) })
    },
  })
}

// ---------------------------------------------------------------------------
// Modifiche (aggiornamento ottimistico: la UI cambia subito)
// ---------------------------------------------------------------------------

/**
 * Cosa si modifica, letto dalla scheda prima della modifica: serve al Master per vedere
 * prima → dopo mentre scrive la motivazione, e per riproporre quella già scritta sullo stesso valore.
 */
type Describe<TVariables> = (vars: TVariables, sheet: CharacterSheet | undefined) => EditPrompt

/** Campi cambiati da un patch (le chiavi con valore definito). */
function patchFields(patch: object): string[] {
  return Object.entries(patch)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k)
}

/** Prima → dopo per ogni campo del patch che cambia davvero. */
function diffPreview(target: string, before: object | undefined, patch: object): EditPreview[] {
  const old = (before ?? {}) as Record<string, unknown>
  return Object.entries(patch)
    .filter(([k, v]) => v !== undefined && (old[k] ?? null) !== (v ?? null))
    .map(([k, v]) => ({
      target,
      field: fieldLabel(k),
      before: editValue(k, (old[k] ?? null) as Json),
      after: editValue(k, v as Json),
    }))
}

function actionPreview(target: string, action: 'insert' | 'delete'): EditPreview[] {
  return [{ target, field: ACTION_LABELS[action], before: null, after: null }]
}

const skillName = (s: Pick<SkillRow, 'custom_name' | 'skill_key'>) => s.custom_name || getCatalog().skill(s.skill_key)?.name || s.skill_key || ''

/**
 * Modifica della scheda. Prima di scrivere passa dal cancello della motivazione
 * (solo il Master sulla scheda di un giocatore); `reason` va allegata alla richiesta con `withReason`.
 */
function useSheetMutation<TVariables>(
  characterId: string,
  mutate: (vars: TVariables, reason: string | null) => Promise<unknown>,
  applyOptimistic: ((sheet: CharacterSheet, vars: TVariables) => CharacterSheet) | null,
  describe: Describe<TVariables>,
) {
  const queryClient = useQueryClient()
  const gate = useReasonGate()
  const key = characterKeys.sheet(characterId)
  // onMutate (scheda ancora com'era) viene eseguito prima di mutationFn: qui passa la descrizione
  // (in coda: due clic uguali e rapidi, es. "+1" due volte, hanno le stesse variabili)
  const prompts = useRef(new Map<TVariables, EditPrompt[]>())
  return useMutation({
    mutationFn: async (vars: TVariables) => {
      const queue = prompts.current.get(vars) ?? []
      const prompt = queue.shift() ?? { filters: [], changes: [] }
      if (queue.length === 0) prompts.current.delete(vars)
      return mutate(vars, await gate(prompt))
    },
    onMutate: async (vars: TVariables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CharacterSheet>(key)
      prompts.current.set(vars, [...(prompts.current.get(vars) ?? []), describe(vars, previous)])
      if (previous && applyOptimistic) queryClient.setQueryData(key, applyOptimistic(previous, vars))
      return { previous: applyOptimistic ? previous : undefined }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useUpdateCharacter(characterId: string) {
  return useSheetMutation(
    characterId,
    async (patch: TablesUpdate<'characters'>, reason) =>
      unwrap(await withReason(supabase.from('characters').update(patch).eq('id', characterId), reason)),
    (sheet, patch) => ({ ...sheet, ...patch }) as CharacterSheet,
    (patch, sheet) => ({
      filters: [{ type: 'character', fields: patchFields(patch) }],
      changes: diffPreview('', sheet, patch),
    }),
  )
}

export function useUpdateAttribute(characterId: string) {
  return useSheetMutation(
    characterId,
    async (vars: { attribute: AttributeKey; value?: number; advancement?: number }, reason) => {
      const { attribute, ...patch } = vars
      unwrap(
        await withReason(
          supabase
            .from('character_attributes')
            .upsert({ character_id: characterId, attribute, ...patch }, { onConflict: 'character_id,attribute' }),
          reason,
        ),
      )
    },
    (sheet, vars) => {
      const exists = sheet.character_attributes.some((a) => a.attribute === vars.attribute)
      const rows = exists
        ? sheet.character_attributes.map((a) => (a.attribute === vars.attribute ? { ...a, ...vars } : a))
        : [
            ...sheet.character_attributes,
            {
              character_id: characterId,
              attribute: vars.attribute,
              value: vars.value ?? 10,
              advancement: vars.advancement ?? 0,
              created_at: '',
              updated_at: '',
            },
          ]
      return { ...sheet, character_attributes: rows }
    },
    ({ attribute, ...patch }, sheet) => ({
      filters: [{ type: 'attribute', id: attribute, fields: patchFields(patch) }],
      changes: diffPreview(
        ATTRIBUTES[attribute].label,
        sheet?.character_attributes.find((a) => a.attribute === attribute),
        patch,
      ),
    }),
  )
}

export function useUpdateResource(characterId: string) {
  return useSheetMutation(
    characterId,
    async (vars: { resourceKey: string; current?: number; max?: number | null }, reason) => {
      const { resourceKey, ...patch } = vars
      unwrap(
        await withReason(
          supabase.from('character_resources').update(patch).eq('character_id', characterId).eq('resource_key', resourceKey),
          reason,
        ),
      )
    },
    (sheet, vars) => ({
      ...sheet,
      character_resources: sheet.character_resources.map((r) =>
        r.resource_key === vars.resourceKey
          ? { ...r, ...(vars.current !== undefined && { current: vars.current }), ...(vars.max !== undefined && { max: vars.max }) }
          : r,
      ),
    }),
    ({ resourceKey, ...patch }, sheet) => ({
      filters: [{ type: 'resource', id: resourceKey, fields: patchFields(patch) }],
      changes: diffPreview(
        RESOURCES[resourceKey as ResourceKey]?.label ?? resourceKey,
        sheet?.character_resources.find((r) => r.resource_key === resourceKey),
        patch,
      ),
    }),
  )
}

// ---------------------------------------------------------------------------
// Capacità
// ---------------------------------------------------------------------------

export type SkillPatch = Pick<
  TablesUpdate<'character_skills'>,
  'level' | 'advancement' | 'is_maxed' | 'attribute' | 'custom_name' | 'description'
>

export function useUpdateSkill(characterId: string) {
  return useSheetMutation(
    characterId,
    async ({ id, patch }: { id: string; patch: SkillPatch }, reason) =>
      unwrap(await withReason(supabase.from('character_skills').update(patch).eq('id', id), reason)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_skills: sheet.character_skills.map((s) => (s.id === id ? ({ ...s, ...patch } as SkillRow) : s)),
    }),
    ({ id, patch }, sheet) => {
      const skill = sheet?.character_skills.find((s) => s.id === id)
      return {
        filters: [{ type: 'skill', id, fields: patchFields(patch) }],
        changes: diffPreview(skill ? skillName(skill) : '', skill, patch),
      }
    },
  )
}

export interface NewSkillInput {
  skillKey: string | null
  customName: string | null
  attribute: AttributeKey
  level: number | null
}

export function useAddSkill(characterId: string) {
  const queryClient = useQueryClient()
  return useSheetMutation(
    characterId,
    async (input: NewSkillInput, reason) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_skills.map((s) => s.sort_order) ?? [0])) + 1
      unwrap(
        await withReason(
          supabase.from('character_skills').insert({
            character_id: characterId,
            skill_key: input.skillKey,
            custom_name: input.customName?.trim() || null,
            attribute: input.attribute,
            level: input.level,
            sort_order: nextOrder,
          }),
          reason,
        ),
      )
    },
    null,
    (input) => ({
      filters: [],
      changes: actionPreview(skillName({ custom_name: input.customName, skill_key: input.skillKey }), 'insert'),
    }),
  )
}

export function useDeleteSkill(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string, reason) => unwrap(await withReason(supabase.from('character_skills').delete().eq('id', id), reason)),
    (sheet, id) => ({ ...sheet, character_skills: sheet.character_skills.filter((s) => s.id !== id) }),
    (id, sheet) => {
      const skill = sheet?.character_skills.find((s) => s.id === id)
      return { filters: [], changes: actionPreview(skill ? skillName(skill) : '', 'delete') }
    },
  )
}

// ---------------------------------------------------------------------------
// Poteri (Miracoli / Incantesimi / Poteri mentali)
// ---------------------------------------------------------------------------

export type PowerFields = Pick<
  TablesUpdate<'character_powers'>,
  | 'kind'
  | 'name'
  | 'level'
  | 'is_maxed'
  | 'acquisition_level'
  | 'range'
  | 'area'
  | 'cast_time'
  | 'cost'
  | 'duration'
  | 'advancement'
  | 'is_special'
  | 'granted_by'
  | 'description'
  /** Solo il Master (lo impone un trigger nel database). */
  | 'success_die'
  | 'success_target'
>

export function useUpdatePower(characterId: string) {
  return useSheetMutation(
    characterId,
    async ({ id, patch }: { id: string; patch: PowerFields }, reason) =>
      unwrap(await withReason(supabase.from('character_powers').update(patch).eq('id', id), reason)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_powers: sheet.character_powers.map((p) => (p.id === id ? ({ ...p, ...patch } as PowerRow) : p)),
    }),
    ({ id, patch }, sheet) => {
      const power = sheet?.character_powers.find((p) => p.id === id)
      return {
        filters: [{ type: 'power', id, fields: patchFields(patch) }],
        changes: diffPreview(power?.name ?? '', power, patch),
      }
    },
  )
}

export function useAddPower(characterId: string) {
  const queryClient = useQueryClient()
  return useSheetMutation(
    characterId,
    async (input: PowerFields & Pick<TablesInsert<'character_powers'>, 'kind' | 'name'>, reason) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_powers.map((p) => p.sort_order) ?? [0])) + 1
      unwrap(
        await withReason(
          supabase
            .from('character_powers')
            .insert({ ...input, name: input.name.trim(), character_id: characterId, sort_order: nextOrder }),
          reason,
        ),
      )
    },
    null,
    (input) => ({ filters: [], changes: actionPreview(input.name.trim(), 'insert') }),
  )
}

export function useDeletePower(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string, reason) => unwrap(await withReason(supabase.from('character_powers').delete().eq('id', id), reason)),
    (sheet, id) => ({ ...sheet, character_powers: sheet.character_powers.filter((p) => p.id !== id) }),
    (id, sheet) => ({
      filters: [],
      changes: actionPreview(sheet?.character_powers.find((p) => p.id === id)?.name ?? '', 'delete'),
    }),
  )
}

// ---------------------------------------------------------------------------
// Inventario
// ---------------------------------------------------------------------------

export type ItemFields = Pick<
  TablesUpdate<'character_items'>,
  'category' | 'slot' | 'equipped' | 'name' | 'description' | 'quantity' | 'charges_remaining' | 'charges_total' | 'value'
>

export function useUpdateItem(characterId: string) {
  return useSheetMutation(
    characterId,
    async ({ id, patch }: { id: string; patch: ItemFields }, reason) =>
      unwrap(await withReason(supabase.from('character_items').update(patch).eq('id', id), reason)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_items: sheet.character_items.map((i) => (i.id === id ? ({ ...i, ...patch } as ItemRow) : i)),
    }),
    ({ id, patch }, sheet) => {
      const item = sheet?.character_items.find((i) => i.id === id)
      return {
        filters: [{ type: 'item', id, fields: patchFields(patch) }],
        changes: diffPreview(item?.name ?? '', item, patch),
      }
    },
  )
}

export function useAddItem(characterId: string) {
  const queryClient = useQueryClient()
  return useSheetMutation(
    characterId,
    async (input: ItemFields & Pick<TablesInsert<'character_items'>, 'category' | 'name'>, reason) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_items.map((i) => i.sort_order) ?? [0])) + 1
      unwrap(
        await withReason(
          supabase
            .from('character_items')
            .insert({ ...input, name: input.name.trim(), character_id: characterId, sort_order: nextOrder }),
          reason,
        ),
      )
    },
    null,
    (input) => ({ filters: [], changes: actionPreview(input.name.trim(), 'insert') }),
  )
}

export function useDeleteItem(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string, reason) => unwrap(await withReason(supabase.from('character_items').delete().eq('id', id), reason)),
    (sheet, id) => ({ ...sheet, character_items: sheet.character_items.filter((i) => i.id !== id) }),
    (id, sheet) => ({
      filters: [],
      changes: actionPreview(sheet?.character_items.find((i) => i.id === id)?.name ?? '', 'delete'),
    }),
  )
}

// ---------------------------------------------------------------------------
// Esperienza (registro in sola aggiunta)
// ---------------------------------------------------------------------------

/** Aggiunge una voce di esperienza (positiva o negativa). */
export function useAddXp(characterId: string) {
  return useSheetMutation(
    characterId,
    async (amount: number, reason) => {
      if (!amount) return
      unwrap(await withReason(supabase.from('character_xp_entries').insert({ character_id: characterId, amount }), reason))
    },
    (sheet, amount) =>
      amount
        ? {
            ...sheet,
            character_xp_entries: [
              ...sheet.character_xp_entries,
              {
                id: 'tmp-' + Date.now(),
                character_id: characterId,
                amount,
                note: '',
                created_by: null,
                created_at: new Date().toISOString(),
              },
            ],
          }
        : sheet,
    (amount, sheet) => {
      if (!amount) return { filters: [], changes: [] }
      const total = sheet ? xpTotal(sheet) : 0
      return {
        filters: [],
        changes: [{ target: '', field: 'Esperienza', before: editValue(null, total), after: editValue(null, total + amount) }],
      }
    },
  )
}
