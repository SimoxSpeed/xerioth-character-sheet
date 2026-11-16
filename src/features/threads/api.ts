import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Database, Tables } from '../../lib/database.types'

export type ThreadTarget = Database['public']['Enums']['thread_target']
export type ThreadStatus = Database['public']['Enums']['thread_status']

export type ThreadMessage = Pick<Tables<'thread_messages'>, 'id' | 'author_id' | 'body' | 'created_at'> & {
  author: { display_name: string } | null
}

export type Thread = Tables<'master_threads'> & { thread_messages: ThreadMessage[] }

export const THREAD_STATUS: Record<ThreadStatus, { label: string; tone: 'waiting' | 'answered' | 'closed' }> = {
  open: { label: 'In attesa del Master', tone: 'waiting' },
  answered: { label: 'Risposta ricevuta', tone: 'answered' },
  closed: { label: 'Chiusa', tone: 'closed' },
}

export const THREAD_TARGET_LABELS: Record<ThreadTarget, string> = {
  character: 'Personaggio',
  attribute: 'Caratteristica',
  skill: 'Capacità',
  power: 'Potere',
  item: 'Oggetto',
  journal: 'Diario',
}

const SELECT = '*, thread_messages(id, author_id, body, created_at, author:profiles(display_name))'

export const threadKeys = {
  character: (characterId: string) => ['threads', 'character', characterId] as const,
  campaign: (campaignId: string) => ['threads', 'campaign', campaignId] as const,
}

/** Aggiornamento in tempo reale delle domande di un personaggio: da chiamare una volta per pagina. */
export function useCharacterThreadsRealtime(characterId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`threads-${characterId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_threads', filter: `character_id=eq.${characterId}` }, () =>
        queryClient.invalidateQueries({ queryKey: threadKeys.character(characterId) }),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thread_messages' }, () =>
        queryClient.invalidateQueries({ queryKey: threadKeys.character(characterId) }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [characterId, queryClient])
}

/** Tutte le domande di un personaggio, le più recenti prima. */
export function useCharacterThreads(characterId: string) {
  return useQuery({
    queryKey: threadKeys.character(characterId),
    queryFn: async (): Promise<Thread[]> =>
      unwrap(
        await supabase
          .from('master_threads')
          .select(SELECT)
          .eq('character_id', characterId)
          .order('last_message_at', { ascending: false })
          .order('created_at', { referencedTable: 'thread_messages' }),
      ) as Thread[],
  })
}

export type CampaignThread = Thread & {
  character: { id: string; name: string; campaign_id: string; owner_id: string } | null
}

/** Aggiornamento in tempo reale delle domande della campagna: da chiamare una volta per pagina. */
export function useCampaignThreadsRealtime(campaignId: string | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!campaignId) return
    const channel = supabase
      .channel(`campaign-threads-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_threads' }, () =>
        queryClient.invalidateQueries({ queryKey: threadKeys.campaign(campaignId) }),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thread_messages' }, () =>
        queryClient.invalidateQueries({ queryKey: threadKeys.campaign(campaignId) }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [campaignId, queryClient])
}

/** Domande di tutta la campagna (per il Master: RLS mostra solo ciò che può vedere). */
export function useCampaignThreads(campaignId: string | undefined) {
  return useQuery({
    enabled: !!campaignId,
    queryKey: threadKeys.campaign(campaignId ?? ''),
    queryFn: async (): Promise<CampaignThread[]> =>
      unwrap(
        await supabase
          .from('master_threads')
          .select(`${SELECT}, character:characters!inner(id, name, campaign_id, owner_id)`)
          .eq('character.campaign_id', campaignId!)
          .order('last_message_at', { ascending: false })
          .order('created_at', { referencedTable: 'thread_messages' }),
      ) as CampaignThread[],
  })
}

function useInvalidateThreads() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['threads'] })
}

export interface NewThreadInput {
  characterId: string
  targetType: ThreadTarget
  targetId: string | null
  title: string
  body: string
}

export function useCreateThread() {
  const invalidate = useInvalidateThreads()
  return useMutation({
    mutationFn: async (input: NewThreadInput): Promise<string> => {
      const { data: thread, error } = await supabase
        .from('master_threads')
        .insert({
          character_id: input.characterId,
          target_type: input.targetType,
          target_id: input.targetId,
          title: input.title.trim(),
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      unwrap(await supabase.from('thread_messages').insert({ thread_id: thread.id, body: input.body.trim() }))
      return thread.id
    },
    onSettled: invalidate,
  })
}

export function usePostMessage() {
  const invalidate = useInvalidateThreads()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) =>
      unwrap(await supabase.from('thread_messages').insert({ thread_id: threadId, body: body.trim() })),
    onSettled: invalidate,
  })
}

export function useSetThreadStatus() {
  const invalidate = useInvalidateThreads()
  return useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: ThreadStatus }) =>
      unwrap(await supabase.from('master_threads').update({ status }).eq('id', threadId)),
    onSettled: invalidate,
  })
}

/** Domanda più recente su un elemento della scheda. */
export function latestThreadFor(threads: Thread[] | undefined, targetType: ThreadTarget, targetId: string | null) {
  return threads?.find((t) => t.target_type === targetType && (t.target_id ?? null) === targetId)
}
