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
          calls_this_month: number | null
          calls_total: number | null
          company_id: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          elevenlabs_agent_id: string | null
          elevenlabs_voice_id: string | null
          first_message: string | null
          id: string
          language: string | null
          last_call_at: string | null
          name: string
          sector: string | null
          status: string | null
          system_prompt: string | null
          type: string | null
          use_case: string | null
        }
        Insert: {
          avg_duration_sec?: number | null
          calls_this_month?: number | null
          calls_total?: number | null
          company_id: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          first_message?: string | null
          id?: string
          language?: string | null
          last_call_at?: string | null
          name: string
          sector?: string | null
          status?: string | null
          system_prompt?: string | null
          type?: string | null
          use_case?: string | null
        }
        Update: {
          avg_duration_sec?: number | null
          calls_this_month?: number | null
          calls_total?: number | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          first_message?: string | null
          id?: string
          language?: string | null
          last_call_at?: string | null
          name?: string
          sector?: string | null
          status?: string | null
          system_prompt?: string | null
          type?: string | null
          use_case?: string | null
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
      companies: {
        Row: {
          created_at: string | null
          created_by: string | null
          elevenlabs_api_key: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          sector: string | null
          settings: Json | null
          slug: string
          status: string | null
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          elevenlabs_api_key?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          sector?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          elevenlabs_api_key?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          sector?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string
          caller_number: string | null
          company_id: string
          duration_sec: number | null
          elevenlabs_conv_id: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          outcome: string | null
          started_at: string | null
          status: string | null
          transcript: Json | null
        }
        Insert: {
          agent_id: string
          caller_number?: string | null
          company_id: string
          duration_sec?: number | null
          elevenlabs_conv_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          started_at?: string | null
          status?: string | null
          transcript?: Json | null
        }
        Update: {
          agent_id?: string
          caller_number?: string | null
          company_id?: string
          duration_sec?: number | null
          elevenlabs_conv_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          started_at?: string | null
          status?: string | null
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
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
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
