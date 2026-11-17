import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Database, Tables } from '../../lib/database.types'
import { characterKeys } from '../characters/api'

export type EditTarget = Database['public']['Enums']['edit_target']

export type MasterEdit = Pick<
  Tables<'master_edits'>,
  | 'id'
  | 'target_type'
  | 'target_id'
  | 'target_label'
  | 'action'
  | 'field'
  | 'old_value'
  | 'new_value'
  | 'reason'
  | 'created_at'
  | 'updated_at'
  | 'dismissed_at'
> & {
  editor: { display_name: string } | null
}

export const masterEditKeys = {
  character: (characterId: string) => ['master-edits', characterId] as const,
}

/** Tutte le modifiche del Master a un personaggio, dalla più recente. */
export function useMasterEdits(characterId: string) {
  return useQuery({
    queryKey: masterEditKeys.character(characterId),
    queryFn: async (): Promise<MasterEdit[]> =>
      unwrap(
        await supabase
          .from('master_edits')
          .select(
            'id, target_type, target_id, target_label, action, field, old_value, new_value, reason, created_at, updated_at, dismissed_at, editor:profiles(display_name)',
          )
          .eq('character_id', characterId)
          .order('updated_at', { ascending: false }),
      ),
  })
}

/**
 * Tempo reale: una modifica del Master fa comparire subito il segno e il valore nuovo.
 * Da chiamare una volta per pagina.
 */
export function useMasterEditsRealtime(characterId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`master-edits-${characterId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_edits', filter: `character_id=eq.${characterId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: masterEditKeys.character(characterId) })
        void queryClient.invalidateQueries({ queryKey: characterKeys.sheet(characterId) })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [characterId, queryClient])
}

/** Il giocatore toglie il segno: la modifica resta nello storico. */
export function useDismissMasterEdits(characterId: string) {
  const queryClient = useQueryClient()
  const key = masterEditKeys.character(characterId)
  return useMutation({
    mutationFn: async (ids: string[]) => {
      unwrap(await supabase.rpc('dismiss_master_edits', { p_ids: ids }))
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<MasterEdit[]>(key)
      const now = new Date().toISOString()
      if (previous) {
        queryClient.setQueryData(
          key,
          previous.map((e) => (ids.includes(e.id) ? { ...e, dismissed_at: now } : e)),
        )
      }
      return { previous }
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ---------------------------------------------------------------------------
// Filtri
// ---------------------------------------------------------------------------

/** Quali modifiche segnalare in un punto della scheda. */
export interface EditFilter {
  type: EditTarget
  /** Elemento (id o chiave); assente = tutti gli elementi di quel tipo. */
  id?: string
  /** Solo questi campi. */
  fields?: readonly string[]
  /** Tutti i campi tranne questi. */
  exceptFields?: readonly string[]
}

export function matchesEdit(edit: MasterEdit, filter: EditFilter): boolean {
  if (edit.target_type !== filter.type) return false
  if (filter.id !== undefined && edit.target_id !== filter.id) return false
  if (filter.fields && !(edit.field && filter.fields.includes(edit.field))) return false
  if (filter.exceptFields && edit.field && filter.exceptFields.includes(edit.field)) return false
  return true
}

/** Modifiche con il segno ancora presente che corrispondono ad almeno un filtro. */
export function openEdits(edits: MasterEdit[] | undefined, filters: readonly EditFilter[]): MasterEdit[] {
  return (edits ?? []).filter((e) => e.dismissed_at === null && filters.some((f) => matchesEdit(e, f)))
}

/** Campi del personaggio con un segno proprio nell'intestazione. */
export const HP_FIELDS = ['damage_taken', 'temp_hp', 'hp_bonus'] as const
export const VITAL_FIELDS = [...HP_FIELDS, 'madness_points', 'fate_points', 'gold', 'level'] as const
