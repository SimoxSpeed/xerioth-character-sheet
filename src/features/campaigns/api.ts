import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Tables } from '../../lib/database.types'
import { useUser } from '../auth/AuthProvider'

export type MemberRole = Tables<'campaign_members'>['role']

export interface Membership {
  role: MemberRole
  campaign: Tables<'campaigns'>
}

/** Campagne di cui l'utente fa parte, con il suo ruolo. */
export function useMemberships() {
  const user = useUser()
  return useQuery({
    queryKey: ['memberships', user.id],
    queryFn: async (): Promise<Membership[]> => {
      const rows = unwrap(
        await supabase
          .from('campaign_members')
          .select('role, campaign:campaigns(*)')
          .eq('user_id', user.id)
          .order('created_at'),
      )
      return rows.flatMap((r) => (r.campaign ? [{ role: r.role, campaign: r.campaign }] : []))
    },
  })
}

/** true se l'utente è Master della campagna indicata. */
export function useIsMaster(campaignId: string | undefined): boolean {
  const { data } = useMemberships()
  return !!campaignId && !!data?.some((m) => m.campaign.id === campaignId && m.role === 'master')
}
