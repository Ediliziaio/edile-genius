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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          avg_duration_sec: number | null
          calls_month: number | null
          calls_qualified: number | null
          calls_total: number | null
          company_id: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          el_agent_id: string | null
          el_voice_id: string | null
          first_message: string | null
          id: string
          interrupt_enabled: boolean | null
          language: string | null
          last_call_at: string | null
          max_duration_sec: number | null
          name: string
          sector: string | null
          silence_sec: number | null
          status: string | null
          system_prompt: string | null
          temperature: number | null
          type: string | null
          updated_at: string | null
          use_case: string | null
          voice_name: string | null
        }
        Insert: {
          avg_duration_sec?: number | null
          calls_month?: number | null
          calls_qualified?: number | null
          calls_total?: number | null
          company_id: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          el_agent_id?: string | null
          el_voice_id?: string | null
          first_message?: string | null
          id?: string
          interrupt_enabled?: boolean | null
          language?: string | null
          last_call_at?: string | null
          max_duration_sec?: number | null
          name: string
          sector?: string | null
          silence_sec?: number | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          voice_name?: string | null
        }
        Update: {
          avg_duration_sec?: number | null
          calls_month?: number | null
          calls_qualified?: number | null
          calls_total?: number | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          el_agent_id?: string | null
          el_voice_id?: string | null
          first_message?: string | null
          id?: string
          interrupt_enabled?: boolean | null
          language?: string | null
          last_call_at?: string | null
          max_duration_sec?: number | null
          name?: string
          sector?: string | null
          silence_sec?: number | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agent_id: string | null
          appointments_set: number | null
          avg_duration: number | null
          call_days: string[] | null
          call_hour_limit: number | null
          call_window_end: string | null
          call_window_start: string | null
          company_id: string
          completed_at: string | null
          config: Json | null
          contact_list_id: string | null
          contacts_called: number | null
          contacts_qualified: number | null
          contacts_reached: number | null
          contacts_total: number | null
          created_at: string | null
          created_by: string | null
          custom_first_msg: string | null
          description: string | null
          id: string
          name: string
          retry_attempts: number | null
          retry_delay_min: number | null
          scheduled_at: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          appointments_set?: number | null
          avg_duration?: number | null
          call_days?: string[] | null
          call_hour_limit?: number | null
          call_window_end?: string | null
          call_window_start?: string | null
          company_id: string
          completed_at?: string | null
          config?: Json | null
          contact_list_id?: string | null
          contacts_called?: number | null
          contacts_qualified?: number | null
          contacts_reached?: number | null
          contacts_total?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_first_msg?: string | null
          description?: string | null
          id?: string
          name: string
          retry_attempts?: number | null
          retry_delay_min?: number | null
          scheduled_at?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          appointments_set?: number | null
          avg_duration?: number | null
          call_days?: string[] | null
          call_hour_limit?: number | null
          call_window_end?: string | null
          call_window_start?: string | null
          company_id?: string
          completed_at?: string | null
          config?: Json | null
          contact_list_id?: string | null
          contacts_called?: number | null
          contacts_qualified?: number | null
          contacts_reached?: number | null
          contacts_total?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_first_msg?: string | null
          description?: string | null
          id?: string
          name?: string
          retry_attempts?: number | null
          retry_delay_min?: number | null
          scheduled_at?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_contact_list_id_fkey"
            columns: ["contact_list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          calls_used_month: number
          city: string | null
          created_at: string | null
          created_by: string | null
          el_api_key: string | null
          id: string
          logo_url: string | null
          monthly_calls_limit: number
          name: string
          notes_internal: string | null
          phone: string | null
          plan: string | null
          sector: string | null
          settings: Json | null
          slug: string
          status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          calls_used_month?: number
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          el_api_key?: string | null
          id?: string
          logo_url?: string | null
          monthly_calls_limit?: number
          name: string
          notes_internal?: string | null
          phone?: string | null
          plan?: string | null
          sector?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          calls_used_month?: number
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          el_api_key?: string | null
          id?: string
          logo_url?: string | null
          monthly_calls_limit?: number
          name?: string
          notes_internal?: string | null
          phone?: string | null
          plan?: string | null
          sector?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contact_list_members: {
        Row: {
          added_at: string | null
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string | null
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string | null
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          color: string | null
          company_id: string
          contact_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          assigned_agent: string | null
          assigned_user: string | null
          call_attempts: number | null
          cap: string | null
          city: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          last_contact_at: string | null
          metadata: Json | null
          next_call_at: string | null
          notes: string | null
          phone: string | null
          phone_alt: string | null
          priority: string | null
          province: string | null
          sector: string | null
          source: string | null
          status: string
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_agent?: string | null
          assigned_user?: string | null
          call_attempts?: number | null
          cap?: string | null
          city?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          next_call_at?: string | null
          notes?: string | null
          phone?: string | null
          phone_alt?: string | null
          priority?: string | null
          province?: string | null
          sector?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_agent?: string | null
          assigned_user?: string | null
          call_attempts?: number | null
          cap?: string | null
          city?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          next_call_at?: string | null
          notes?: string | null
          phone?: string | null
          phone_alt?: string | null
          priority?: string | null
          province?: string | null
          sector?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_agent_fkey"
            columns: ["assigned_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          caller_number: string | null
          campaign_id: string | null
          company_id: string
          contact_id: string | null
          direction: string | null
          duration_sec: number | null
          el_conv_id: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          outcome: string | null
          phone_number: string | null
          sentiment: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          transcript: Json | null
        }
        Insert: {
          agent_id: string
          caller_number?: string | null
          campaign_id?: string | null
          company_id: string
          contact_id?: string | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          transcript?: Json | null
        }
        Update: {
          agent_id?: string
          caller_number?: string | null
          campaign_id?: string | null
          company_id?: string
          contact_id?: string | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_files: {
        Row: {
          agent_id: string
          company_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          agent_id: string
          company_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          agent_id?: string
          company_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          company_id: string
          contact_id: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          author_id: string
          company_id: string
          contact_id?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          author_id?: string
          company_id?: string
          contact_id?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_company: { Args: never; Returns: string }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "superadmin_user"
        | "company_admin"
        | "company_user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "superadmin",
        "superadmin_user",
        "company_admin",
        "company_user",
      ],
    },
  },
} as const
