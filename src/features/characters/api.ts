import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '../../lib/database.types'
import { ATTRIBUTE_KEYS, type AttributeKey } from '../../game/data/attributes'
import { findClass } from '../../game/data/classes'

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
            'id, name, level, race_key, owner_id, portrait_url, character_classes(class_key, deity_key, patron), owner:profiles(display_name)',
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
  level: number
  classes: { classKey: string; deityKey: string | null; patron: string | null }[]
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
              patron: c.patron?.trim() || null,
              sort_order: i,
            })),
          ),
        )
      }

      // Una riga risorsa per ogni risorsa di classe (Spirito, Mana, …).
      const resourceKeys = new Set(
        input.classes.map((c) => findClass(c.classKey)?.resource).filter((r): r is NonNullable<typeof r> => !!r),
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

function useSheetMutation<TVariables>(
  characterId: string,
  mutate: (vars: TVariables) => Promise<unknown>,
  applyOptimistic: (sheet: CharacterSheet, vars: TVariables) => CharacterSheet,
) {
  const queryClient = useQueryClient()
  const key = characterKeys.sheet(characterId)
  return useMutation({
    mutationFn: mutate,
    onMutate: async (vars: TVariables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CharacterSheet>(key)
      if (previous) queryClient.setQueryData(key, applyOptimistic(previous, vars))
      return { previous }
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
    async (patch: TablesUpdate<'characters'>) =>
      unwrap(await supabase.from('characters').update(patch).eq('id', characterId)),
    (sheet, patch) => ({ ...sheet, ...patch }) as CharacterSheet,
  )
}

export function useUpdateAttribute(characterId: string) {
  return useSheetMutation(
    characterId,
    async (vars: { attribute: AttributeKey; value?: number; advancement?: number }) => {
      const { attribute, ...patch } = vars
      unwrap(
        await supabase
          .from('character_attributes')
          .upsert({ character_id: characterId, attribute, ...patch }, { onConflict: 'character_id,attribute' }),
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
  )
}

export function useUpdateResource(characterId: string) {
  return useSheetMutation(
    characterId,
    async (vars: { resourceKey: string; current?: number; max?: number | null }) => {
      const { resourceKey, ...patch } = vars
      unwrap(
        await supabase
          .from('character_resources')
          .update(patch)
          .eq('character_id', characterId)
          .eq('resource_key', resourceKey),
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
    async ({ id, patch }: { id: string; patch: SkillPatch }) =>
      unwrap(await supabase.from('character_skills').update(patch).eq('id', id)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_skills: sheet.character_skills.map((s) => (s.id === id ? ({ ...s, ...patch } as SkillRow) : s)),
    }),
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
  return useMutation({
    mutationFn: async (input: NewSkillInput) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_skills.map((s) => s.sort_order) ?? [0])) + 1
      unwrap(
        await supabase.from('character_skills').insert({
          character_id: characterId,
          skill_key: input.skillKey,
          custom_name: input.customName?.trim() || null,
          attribute: input.attribute,
          level: input.level,
          sort_order: nextOrder,
        }),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: characterKeys.sheet(characterId) }),
  })
}

export function useDeleteSkill(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string) => unwrap(await supabase.from('character_skills').delete().eq('id', id)),
    (sheet, id) => ({ ...sheet, character_skills: sheet.character_skills.filter((s) => s.id !== id) }),
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
    async ({ id, patch }: { id: string; patch: PowerFields }) =>
      unwrap(await supabase.from('character_powers').update(patch).eq('id', id)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_powers: sheet.character_powers.map((p) => (p.id === id ? ({ ...p, ...patch } as PowerRow) : p)),
    }),
  )
}

export function useAddPower(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PowerFields & Pick<TablesInsert<'character_powers'>, 'kind' | 'name'>) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_powers.map((p) => p.sort_order) ?? [0])) + 1
      unwrap(
        await supabase
          .from('character_powers')
          .insert({ ...input, name: input.name.trim(), character_id: characterId, sort_order: nextOrder }),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: characterKeys.sheet(characterId) }),
  })
}

export function useDeletePower(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string) => unwrap(await supabase.from('character_powers').delete().eq('id', id)),
    (sheet, id) => ({ ...sheet, character_powers: sheet.character_powers.filter((p) => p.id !== id) }),
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
    async ({ id, patch }: { id: string; patch: ItemFields }) =>
      unwrap(await supabase.from('character_items').update(patch).eq('id', id)),
    (sheet, { id, patch }) => ({
      ...sheet,
      character_items: sheet.character_items.map((i) => (i.id === id ? ({ ...i, ...patch } as ItemRow) : i)),
    }),
  )
}

export function useAddItem(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ItemFields & Pick<TablesInsert<'character_items'>, 'category' | 'name'>) => {
      const sheet = queryClient.getQueryData<CharacterSheet>(characterKeys.sheet(characterId))
      const nextOrder = Math.max(0, ...(sheet?.character_items.map((i) => i.sort_order) ?? [0])) + 1
      unwrap(
        await supabase
          .from('character_items')
          .insert({ ...input, name: input.name.trim(), character_id: characterId, sort_order: nextOrder }),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: characterKeys.sheet(characterId) }),
  })
}

export function useDeleteItem(characterId: string) {
  return useSheetMutation(
    characterId,
    async (id: string) => unwrap(await supabase.from('character_items').delete().eq('id', id)),
    (sheet, id) => ({ ...sheet, character_items: sheet.character_items.filter((i) => i.id !== id) }),
  )
}

// ---------------------------------------------------------------------------
// Esperienza (registro in sola aggiunta)
// ---------------------------------------------------------------------------

/** Aggiunge una voce di esperienza (positiva o negativa). */
export function useAddXp(characterId: string) {
  return useSheetMutation(
    characterId,
    async (amount: number) => {
      if (!amount) return
      unwrap(await supabase.from('character_xp_entries').insert({ character_id: characterId, amount }))
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
  )
}
