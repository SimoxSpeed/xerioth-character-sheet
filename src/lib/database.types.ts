// File GENERATO da Supabase (generate_typescript_types). Non modificare a mano:
// rigeneralo dopo ogni migrazione.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campaign_invites: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          single_use: boolean
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          single_use?: boolean
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          single_use?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "campaign_invites_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_join_requests: {
        Row: {
          campaign_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          invite_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["join_request_status"]
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          invite_id: string
          role: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["join_request_status"]
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          invite_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["join_request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_join_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_join_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_join_requests_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "campaign_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_attributes: {
        Row: {
          advancement: number
          attribute: Database["public"]["Enums"]["attribute_key"]
          character_id: string
          created_at: string
          updated_at: string
          value: number
        }
        Insert: {
          advancement?: number
          attribute: Database["public"]["Enums"]["attribute_key"]
          character_id: string
          created_at?: string
          updated_at?: string
          value?: number
        }
        Update: {
          advancement?: number
          attribute?: Database["public"]["Enums"]["attribute_key"]
          character_id?: string
          created_at?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_attributes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_classes: {
        Row: {
          character_id: string
          class_key: string
          created_at: string
          deity_key: string | null
          id: string
          patron: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          character_id: string
          class_key: string
          created_at?: string
          deity_key?: string | null
          id?: string
          patron?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          class_key?: string
          created_at?: string
          deity_key?: string | null
          id?: string
          patron?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_classes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          character_id: string
          charges_remaining: number | null
          charges_total: number | null
          created_at: string
          description: string
          equipped: boolean
          id: string
          name: string
          quantity: number
          slot: Database["public"]["Enums"]["item_slot"] | null
          sort_order: number
          updated_at: string
          value: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          character_id: string
          charges_remaining?: number | null
          charges_total?: number | null
          created_at?: string
          description?: string
          equipped?: boolean
          id?: string
          name: string
          quantity?: number
          slot?: Database["public"]["Enums"]["item_slot"] | null
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          character_id?: string
          charges_remaining?: number | null
          charges_total?: number | null
          created_at?: string
          description?: string
          equipped?: boolean
          id?: string
          name?: string
          quantity?: number
          slot?: Database["public"]["Enums"]["item_slot"] | null
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_powers: {
        Row: {
          acquisition_level: number | null
          advancement: number
          area: string
          cast_time: string
          character_id: string
          cost: string
          created_at: string
          description: string
          duration: string
          granted_by: string | null
          id: string
          is_maxed: boolean
          is_special: boolean
          kind: Database["public"]["Enums"]["power_kind"]
          level: number | null
          name: string
          range: string
          sort_order: number
          success_die: number | null
          success_target: number | null
          updated_at: string
        }
        Insert: {
          acquisition_level?: number | null
          advancement?: number
          area?: string
          cast_time?: string
          character_id: string
          cost?: string
          created_at?: string
          description?: string
          duration?: string
          granted_by?: string | null
          id?: string
          is_maxed?: boolean
          is_special?: boolean
          kind: Database["public"]["Enums"]["power_kind"]
          level?: number | null
          name: string
          range?: string
          sort_order?: number
          success_die?: number | null
          success_target?: number | null
          updated_at?: string
        }
        Update: {
          acquisition_level?: number | null
          advancement?: number
          area?: string
          cast_time?: string
          character_id?: string
          cost?: string
          created_at?: string
          description?: string
          duration?: string
          granted_by?: string | null
          id?: string
          is_maxed?: boolean
          is_special?: boolean
          kind?: Database["public"]["Enums"]["power_kind"]
          level?: number | null
          name?: string
          range?: string
          sort_order?: number
          success_die?: number | null
          success_target?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_powers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_resources: {
        Row: {
          character_id: string
          created_at: string
          current: number
          max: number | null
          resource_key: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          current?: number
          max?: number | null
          resource_key: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          current?: number
          max?: number | null
          resource_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_resources_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skills: {
        Row: {
          advancement: number
          attribute: Database["public"]["Enums"]["attribute_key"]
          character_id: string
          created_at: string
          custom_name: string | null
          description: string | null
          id: string
          is_maxed: boolean
          level: number | null
          skill_key: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          advancement?: number
          attribute: Database["public"]["Enums"]["attribute_key"]
          character_id: string
          created_at?: string
          custom_name?: string | null
          description?: string | null
          id?: string
          is_maxed?: boolean
          level?: number | null
          skill_key?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          advancement?: number
          attribute?: Database["public"]["Enums"]["attribute_key"]
          character_id?: string
          created_at?: string
          custom_name?: string | null
          description?: string | null
          id?: string
          is_maxed?: boolean
          level?: number | null
          skill_key?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_xp_entries: {
        Row: {
          amount: number
          character_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          amount: number
          character_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Update: {
          amount?: number
          character_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_xp_entries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_xp_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          alignment_key: string | null
          background: string
          campaign_id: string
          created_at: string
          damage_taken: number
          eyes: string
          fate_points: number
          gold: number
          hair: string
          height_cm: number | null
          hp_bonus: number
          id: string
          level: number
          madness_points: number
          name: string
          owner_id: string
          portrait_url: string | null
          race_key: string | null
          skin: string
          temp_hp: number
          updated_at: string
          weight_kg: number | null
          xp_total: number
        }
        Insert: {
          age?: number | null
          alignment_key?: string | null
          background?: string
          campaign_id: string
          created_at?: string
          damage_taken?: number
          eyes?: string
          fate_points?: number
          gold?: number
          hair?: string
          height_cm?: number | null
          hp_bonus?: number
          id?: string
          level?: number
          madness_points?: number
          name: string
          owner_id: string
          portrait_url?: string | null
          race_key?: string | null
          skin?: string
          temp_hp?: number
          updated_at?: string
          weight_kg?: number | null
          xp_total?: number
        }
        Update: {
          age?: number | null
          alignment_key?: string | null
          background?: string
          campaign_id?: string
          created_at?: string
          damage_taken?: number
          eyes?: string
          fate_points?: number
          gold?: number
          hair?: string
          height_cm?: number | null
          hp_bonus?: number
          id?: string
          level?: number
          madness_points?: number
          name?: string
          owner_id?: string
          portrait_url?: string | null
          race_key?: string | null
          skin?: string
          temp_hp?: number
          updated_at?: string
          weight_kg?: number | null
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dice_roll_feed: {
        Row: {
          campaign_id: string
          character_id: string
          character_name: string
          created_at: string
          die: Database["public"]["Enums"]["die_kind"]
          hidden: boolean
          outcome: Database["public"]["Enums"]["roll_outcome"] | null
          roll_id: string
          total: number | null
        }
        Insert: {
          campaign_id: string
          character_id: string
          character_name: string
          created_at: string
          die: Database["public"]["Enums"]["die_kind"]
          hidden?: boolean
          outcome?: Database["public"]["Enums"]["roll_outcome"] | null
          roll_id: string
          total?: number | null
        }
        Update: {
          campaign_id?: string
          character_id?: string
          character_name?: string
          created_at?: string
          die?: Database["public"]["Enums"]["die_kind"]
          hidden?: boolean
          outcome?: Database["public"]["Enums"]["roll_outcome"] | null
          roll_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dice_roll_feed_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_roll_feed_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_roll_feed_roll_id_fkey"
            columns: ["roll_id"]
            isOneToOne: true
            referencedRelation: "dice_rolls"
            referencedColumns: ["id"]
          },
        ]
      }
      dice_rolls: {
        Row: {
          campaign_id: string
          character_id: string
          created_at: string
          details: Json
          die: Database["public"]["Enums"]["die_kind"]
          hidden: boolean
          id: string
          label: string
          outcome: Database["public"]["Enums"]["roll_outcome"] | null
          results: number[]
          roller_id: string
          total: number | null
        }
        Insert: {
          campaign_id: string
          character_id: string
          created_at?: string
          details?: Json
          die?: Database["public"]["Enums"]["die_kind"]
          hidden?: boolean
          id?: string
          label?: string
          outcome?: Database["public"]["Enums"]["roll_outcome"] | null
          results: number[]
          roller_id?: string
          total?: number | null
        }
        Update: {
          campaign_id?: string
          character_id?: string
          created_at?: string
          details?: Json
          die?: Database["public"]["Enums"]["die_kind"]
          hidden?: boolean
          id?: string
          label?: string
          outcome?: Database["public"]["Enums"]["roll_outcome"] | null
          results?: number[]
          roller_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dice_rolls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_rolls_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_rolls_roller_id_fkey"
            columns: ["roller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          addressed_to: string | null
          body: string
          chapter: string | null
          character_id: string
          created_at: string
          done: boolean
          id: string
          kind: Database["public"]["Enums"]["journal_kind"]
          search: unknown
          sort_order: number
          tags: string[]
          title: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["journal_visibility"]
        }
        Insert: {
          addressed_to?: string | null
          body?: string
          chapter?: string | null
          character_id: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["journal_kind"]
          search?: unknown
          sort_order?: number
          tags?: string[]
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["journal_visibility"]
        }
        Update: {
          addressed_to?: string | null
          body?: string
          chapter?: string | null
          character_id?: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["journal_kind"]
          search?: unknown
          sort_order?: number
          tags?: string[]
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["journal_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_threads: {
        Row: {
          character_id: string
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          status: Database["public"]["Enums"]["thread_status"]
          target_id: string | null
          target_type: Database["public"]["Enums"]["thread_target"]
          title: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["thread_status"]
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["thread_target"]
          title: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["thread_status"]
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["thread_target"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_threads_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      thread_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "master_threads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_campaign: {
        Args: { p_description?: string; p_name: string }
        Returns: string
      }
      decide_join_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: undefined
      }
      invite_info: {
        Args: { p_invite_id: string }
        Returns: {
          campaign_id: string
          campaign_name: string
          is_member: boolean
          request_status: Database["public"]["Enums"]["join_request_status"]
          role: Database["public"]["Enums"]["member_role"]
          status: string
        }[]
      }
      request_to_join: { Args: { p_invite_id: string }; Returns: undefined }
    }
    Enums: {
      attribute_key:
        | "abilita"
        | "costituzione"
        | "intelligenza"
        | "riflessi"
        | "freddezza"
        | "fascino"
      die_kind: "d20" | "d4" | "coin" | "d6" | "d8" | "d10" | "d12" | "d100"
      item_category: "usable" | "equipment"
      item_slot: "weapon" | "armor"
      join_request_status: "pending" | "accepted" | "rejected"
      journal_kind:
        | "prayer"
        | "note"
        | "todo"
        | "purchase"
        | "communication"
        | "conversation"
        | "story"
        | "lore"
        | "npc"
      journal_visibility: "private" | "master"
      member_role: "player" | "master"
      power_kind: "miracle" | "spell" | "mental"
      roll_outcome: "success" | "failure" | "critical_failure"
      thread_status: "open" | "answered" | "closed"
      thread_target:
        | "character"
        | "attribute"
        | "skill"
        | "power"
        | "item"
        | "journal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attribute_key: [
        "abilita",
        "costituzione",
        "intelligenza",
        "riflessi",
        "freddezza",
        "fascino",
      ],
      die_kind: ["d20", "d4", "coin", "d6", "d8", "d10", "d12", "d100"],
      item_category: ["usable", "equipment"],
      item_slot: ["weapon", "armor"],
      join_request_status: ["pending", "accepted", "rejected"],
      journal_kind: [
        "prayer",
        "note",
        "todo",
        "purchase",
        "communication",
        "conversation",
        "story",
        "lore",
        "npc",
      ],
      journal_visibility: ["private", "master"],
      member_role: ["player", "master"],
      power_kind: ["miracle", "spell", "mental"],
      roll_outcome: ["success", "failure", "critical_failure"],
      thread_status: ["open", "answered", "closed"],
      thread_target: [
        "character",
        "attribute",
        "skill",
        "power",
        "item",
        "journal",
      ],
    },
  },
} as const
