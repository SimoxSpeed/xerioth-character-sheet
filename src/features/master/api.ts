import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Tables } from '../../lib/database.types'

export type PartyMember = Pick<
  Tables<'characters'>,
  'id' | 'name' | 'level' | 'race_key' | 'hp_bonus' | 'temp_hp' | 'damage_taken' | 'portrait_url'
> & {
  owner: { display_name: string } | null
  character_classes: Pick<Tables<'character_classes'>, 'class_key' | 'deity_key' | 'patron'>[]
  character_attributes: Pick<Tables<'character_attributes'>, 'attribute' | 'value'>[]
  character_skills: Pick<Tables<'character_skills'>, 'skill_key' | 'level'>[]
  character_resources: Pick<Tables<'character_resources'>, 'resource_key' | 'current' | 'max'>[]
  character_items: Pick<Tables<'character_items'>, 'id' | 'name' | 'slot' | 'description'>[]
}

/** Riepilogo dei personaggi della campagna per il pannello Master. */
export function useParty(campaignId: string) {
  return useQuery({
    queryKey: ['party', campaignId],
    queryFn: async (): Promise<PartyMember[]> =>
      unwrap(
        await supabase
          .from('characters')
          .select(
            `id, name, level, race_key, hp_bonus, temp_hp, damage_taken, portrait_url,
             owner:profiles(display_name),
             character_classes(class_key, deity_key, element_key, patron),
             character_attributes(attribute, value),
             character_skills(skill_key, level),
             character_resources(resource_key, current, max),
             character_items(id, name, slot, description)`,
          )
          .eq('campaign_id', campaignId)
          .eq('character_items.equipped', true)
          .order('name'),
      ),
  })
}
