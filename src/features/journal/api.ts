import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Database, Tables, TablesUpdate } from '../../lib/database.types'
import {
  ConversationIcon,
  LoreIcon,
  MailIcon,
  NoteIcon,
  NpcIcon,
  PrayerIcon,
  PurchaseIcon,
  StoryIcon,
  TodoIcon,
  type LucideIcon,
} from '../../components/icons'

export type JournalEntry = Omit<Tables<'journal_entries'>, 'search'>
export type JournalKind = Database['public']['Enums']['journal_kind']

export const JOURNAL_KINDS: Record<JournalKind, { label: string; icon: LucideIcon; checkable?: boolean }> = {
  prayer: { label: 'Preghiera', icon: PrayerIcon },
  note: { label: 'Appunto', icon: NoteIcon },
  todo: { label: 'Cose da fare', icon: TodoIcon, checkable: true },
  purchase: { label: 'Acquisti', icon: PurchaseIcon, checkable: true },
  communication: { label: 'Comunicazione', icon: MailIcon },
  conversation: { label: 'Conversazione', icon: ConversationIcon },
  story: { label: 'Racconto', icon: StoryIcon },
  lore: { label: 'Conoscenze', icon: LoreIcon },
  npc: { label: 'Personaggio', icon: NpcIcon },
}

export const JOURNAL_KIND_KEYS = Object.keys(JOURNAL_KINDS) as JournalKind[]

const COLUMNS =
  'id, character_id, kind, chapter, title, body, addressed_to, tags, visibility, done, sort_order, created_at, updated_at'

export const journalKeys = {
  list: (characterId: string) => ['journal', characterId] as const,
}

/** Voci di diario (il Master vede solo quelle non private: lo garantisce il DB). */
export function useJournal(characterId: string) {
  return useQuery({
    queryKey: journalKeys.list(characterId),
    queryFn: async (): Promise<JournalEntry[]> =>
      unwrap(
        await supabase
          .from('journal_entries')
          .select(COLUMNS)
          .eq('character_id', characterId)
          .order('sort_order')
          .order('created_at'),
      ),
  })
}

export type JournalFields = Pick<
  TablesUpdate<'journal_entries'>,
  'kind' | 'chapter' | 'title' | 'body' | 'addressed_to' | 'tags' | 'visibility' | 'done'
>

export function useSaveJournalEntry(characterId: string) {
  const queryClient = useQueryClient()
  const key = journalKeys.list(characterId)
  return useMutation({
    mutationFn: async ({ id, fields }: { id?: string; fields: JournalFields }) => {
      if (id) {
        unwrap(await supabase.from('journal_entries').update(fields).eq('id', id))
        return
      }
      const entries = queryClient.getQueryData<JournalEntry[]>(key)
      const nextOrder = Math.max(0, ...(entries?.map((e) => e.sort_order) ?? [0])) + 1
      unwrap(
        await supabase
          .from('journal_entries')
          .insert({ ...fields, kind: fields.kind ?? 'note', character_id: characterId, sort_order: nextOrder }),
      )
    },
    // aggiornamento ottimistico per le modifiche (es. spunta "fatto")
    onMutate: async ({ id, fields }) => {
      if (!id) return {}
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<JournalEntry[]>(key)
      queryClient.setQueryData<JournalEntry[]>(key, (old) =>
        old?.map((e) => (e.id === id ? ({ ...e, ...fields } as JournalEntry) : e)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteJournalEntry(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('journal_entries').delete().eq('id', id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: journalKeys.list(characterId) }),
  })
}
