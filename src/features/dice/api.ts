import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Database, Json, Tables } from '../../lib/database.types'

export type DiceRoll = Tables<'dice_rolls'>
export type FeedRoll = Tables<'dice_roll_feed'>
export type RollOutcome = Database['public']['Enums']['roll_outcome']

export const OUTCOME_LABELS: Record<RollOutcome, string> = {
  success: 'Successo',
  failure: 'Fallimento',
  critical_failure: 'Critico negativo',
}

export const diceKeys = {
  character: (characterId: string) => ['dice', 'character', characterId] as const,
  feed: (campaignId: string) => ['dice', 'feed', campaignId] as const,
  campaign: (campaignId: string) => ['dice', 'campaign', campaignId] as const,
}

/** Tiri completi del personaggio (visibili a chi tira e al Master). */
export function useCharacterRolls(characterId: string, limit = 50) {
  return useQuery({
    queryKey: diceKeys.character(characterId),
    queryFn: async (): Promise<DiceRoll[]> =>
      unwrap(
        await supabase
          .from('dice_rolls')
          .select('*')
          .eq('character_id', characterId)
          .order('created_at', { ascending: false })
          .limit(limit),
      ),
  })
}

/** Registro pubblico della campagna: personaggio, dado, totale, esito. */
export function useCampaignFeed(campaignId: string | undefined, limit = 30) {
  return useQuery({
    enabled: !!campaignId,
    queryKey: diceKeys.feed(campaignId ?? ''),
    queryFn: async (): Promise<FeedRoll[]> =>
      unwrap(
        await supabase
          .from('dice_roll_feed')
          .select('*')
          .eq('campaign_id', campaignId!)
          .order('created_at', { ascending: false })
          .limit(limit),
      ),
  })
}

/** Tiri completi di tutta la campagna (solo il Master li vede tutti). */
export function useCampaignRolls(campaignId: string | undefined, limit = 50) {
  return useQuery({
    enabled: !!campaignId,
    queryKey: diceKeys.campaign(campaignId ?? ''),
    queryFn: async (): Promise<(DiceRoll & { character: { name: string } | null })[]> =>
      unwrap(
        await supabase
          .from('dice_rolls')
          .select('*, character:characters(name)')
          .eq('campaign_id', campaignId!)
          .order('created_at', { ascending: false })
          .limit(limit),
      ),
  })
}

/** Aggiornamento in tempo reale di feed e tiri della campagna: una volta per pagina. */
export function useDiceRealtime(campaignId: string | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!campaignId) return
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dice'] })
    const channel = supabase
      .channel(`dice-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dice_roll_feed', filter: `campaign_id=eq.${campaignId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dice_rolls', filter: `campaign_id=eq.${campaignId}` }, invalidate)
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [campaignId, queryClient])
}

export interface NewRollInput {
  campaignId: string
  characterId: string
  label: string
  die: Database['public']['Enums']['die_kind']
  results: number[]
  total: number | null
  outcome: RollOutcome | null
  hidden: boolean
  details: Json
}

export function useSaveRoll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewRollInput): Promise<string> => {
      const { data, error } = await supabase
        .from('dice_rolls')
        .insert({
          campaign_id: input.campaignId,
          character_id: input.characterId,
          label: input.label,
          die: input.die,
          results: input.results,
          total: input.total,
          outcome: input.outcome,
          hidden: input.hidden,
          details: input.details,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return data.id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dice'] }),
  })
}
