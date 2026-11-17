import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Tables } from '../../lib/database.types'
import { useUser } from '../auth/AuthProvider'

export type MemberRole = Tables<'campaign_members'>['role']
export type JoinRequestStatus = Tables<'campaign_join_requests'>['status']

export const ROLE_LABELS: Record<MemberRole, string> = {
  player: 'Giocatore',
  master: 'Master',
}

export const campaignKeys = {
  memberships: (userId: string) => ['memberships', userId] as const,
  myRequests: (userId: string) => ['join-requests', 'mine', userId] as const,
  invite: (inviteId: string) => ['invite', inviteId] as const,
  invites: (campaignId: string) => ['invites', campaignId] as const,
  requests: (campaignId: string) => ['join-requests', 'campaign', campaignId] as const,
  members: (campaignId: string) => ['members', campaignId] as const,
}

export interface Membership {
  role: MemberRole
  campaign: Tables<'campaigns'>
}

/** Campagne di cui l'utente fa parte, con il suo ruolo. */
export function useMemberships() {
  const user = useUser()
  return useQuery({
    queryKey: campaignKeys.memberships(user.id),
    queryFn: async (): Promise<Membership[]> => {
      const rows = unwrap(
        await supabase
          .from('campaign_members')
          .select('role, campaign:campaigns(id, name, description, created_at, updated_at)')
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

// --- Campagne -----------------------------------------------------------------

/** Crea una campagna: chi la crea ne diventa Master. Restituisce l'id. */
export function useCreateCampaign() {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description: string }): Promise<string> =>
      unwrap(await supabase.rpc('create_campaign', { p_name: input.name, p_description: input.description })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.memberships(user.id) }),
  })
}

/** Nome e descrizione della campagna (solo il Master). */
export function useUpdateCampaign(campaignId: string) {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: { name: string; description: string }) => {
      unwrap(await supabase.from('campaigns').update(patch).eq('id', campaignId))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.memberships(user.id) }),
  })
}

// --- Inviti (lato di chi riceve il link) -------------------------------------------

export type InviteInfo = {
  campaignId: string
  campaignName: string
  role: MemberRole
  status: 'valid' | 'expired' | 'revoked' | 'used'
  isMember: boolean
  requestStatus: JoinRequestStatus | null
}

/** Dati dell'invito per chi ha il link; null se l'invito non esiste. */
export function useInviteInfo(inviteId: string) {
  return useQuery({
    queryKey: campaignKeys.invite(inviteId),
    queryFn: async (): Promise<InviteInfo | null> => {
      const rows = unwrap(await supabase.rpc('invite_info', { p_invite_id: inviteId }))
      const row = rows[0]
      if (!row) return null
      return {
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        role: row.role,
        status: row.status as InviteInfo['status'],
        isMember: row.is_member,
        requestStatus: (row.request_status as JoinRequestStatus | null) ?? null,
      }
    },
    retry: false,
  })
}

export function useRequestToJoin(inviteId: string) {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      unwrap(await supabase.rpc('request_to_join', { p_invite_id: inviteId }))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.invite(inviteId) })
      void queryClient.invalidateQueries({ queryKey: campaignKeys.myRequests(user.id) })
    },
  })
}

export interface MyRequest {
  id: string
  created_at: string
  campaign: { id: string; name: string } | null
}

/** Richieste di ingresso dell'utente ancora in attesa. */
export function useMyPendingRequests() {
  const user = useUser()
  return useQuery({
    queryKey: campaignKeys.myRequests(user.id),
    queryFn: async (): Promise<MyRequest[]> =>
      unwrap(
        await supabase
          .from('campaign_join_requests')
          .select('id, created_at, campaign:campaigns(id, name)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at'),
      ),
  })
}

// --- Inviti e membri (lato Master) -------------------------------------------------

export interface CampaignInvite {
  id: string
  role: MemberRole
  single_use: boolean
  created_at: string
  expires_at: string
  uses: number
}

/** Inviti attivi della campagna (non revocati, non scaduti). */
export function useCampaignInvites(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.invites(campaignId),
    queryFn: async (): Promise<CampaignInvite[]> => {
      const rows = unwrap(
        await supabase
          .from('campaign_invites')
          .select('id, role, single_use, created_at, expires_at, campaign_join_requests(count)')
          .eq('campaign_id', campaignId)
          .is('revoked_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
      )
      return rows.map(({ campaign_join_requests, ...invite }) => ({
        ...invite,
        uses: campaign_join_requests[0]?.count ?? 0,
      }))
    },
  })
}

export function useCreateInvite(campaignId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { role: MemberRole; singleUse: boolean }): Promise<string> => {
      const { data, error } = await supabase
        .from('campaign_invites')
        .insert({ campaign_id: campaignId, role: input.role, single_use: input.singleUse })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.invites(campaignId) }),
  })
}

export function useRevokeInvite(campaignId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      unwrap(await supabase.from('campaign_invites').update({ revoked_at: new Date().toISOString() }).eq('id', inviteId))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.invites(campaignId) }),
  })
}

export interface JoinRequest {
  id: string
  role: MemberRole
  created_at: string
  user: { display_name: string } | null
}

/** Richieste in attesa verso la campagna (solo il Master). */
export function useJoinRequests(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.requests(campaignId),
    queryFn: async (): Promise<JoinRequest[]> =>
      unwrap(
        await supabase
          .from('campaign_join_requests')
          .select('id, role, created_at, user:profiles!campaign_join_requests_user_id_fkey(display_name)')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .order('created_at'),
      ),
  })
}

export function useDecideJoinRequest(campaignId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { requestId: string; accept: boolean }) => {
      unwrap(await supabase.rpc('decide_join_request', { p_request_id: input.requestId, p_accept: input.accept }))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.requests(campaignId) })
      void queryClient.invalidateQueries({ queryKey: campaignKeys.members(campaignId) })
      void queryClient.invalidateQueries({ queryKey: campaignKeys.invites(campaignId) })
    },
  })
}

export interface CampaignMember {
  user_id: string
  role: MemberRole
  created_at: string
  profile: { display_name: string } | null
}

export function useCampaignMembers(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.members(campaignId),
    queryFn: async (): Promise<CampaignMember[]> =>
      unwrap(
        await supabase
          .from('campaign_members')
          .select('user_id, role, created_at, profile:profiles(display_name)')
          .eq('campaign_id', campaignId)
          .order('created_at'),
      ),
  })
}

/** Toglie un giocatore dalla campagna; i suoi personaggi restano. */
export function useRemoveMember(campaignId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      unwrap(await supabase.from('campaign_members').delete().eq('campaign_id', campaignId).eq('user_id', userId))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.members(campaignId) }),
  })
}
