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
          additional_languages: string[] | null
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
          evaluation_criteria: string | null
          first_message: string | null
          id: string
          interrupt_enabled: boolean | null
          language: string | null
          last_call_at: string | null
          llm_backup_enabled: boolean | null
          llm_backup_model: string | null
          llm_max_tokens: number | null
          llm_model: string | null
          llm_temperature: number | null
          max_duration_sec: number | null
          name: string
          phone_number_id: string | null
          post_call_prompt: string | null
          post_call_summary: boolean | null
          sector: string | null
          silence_sec: number | null
          status: string | null
          system_prompt: string | null
          temperature: number | null
          tts_model: string | null
          type: string | null
          updated_at: string | null
          use_case: string | null
          voice_name: string | null
          voice_similarity: number | null
          voice_speed: number | null
          voice_stability: number | null
          voicemail_detection: boolean | null
          voicemail_message: string | null
          webhook_url: string | null
        }
        Insert: {
          additional_languages?: string[] | null
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
          evaluation_criteria?: string | null
          first_message?: string | null
          id?: string
          interrupt_enabled?: boolean | null
          language?: string | null
          last_call_at?: string | null
          llm_backup_enabled?: boolean | null
          llm_backup_model?: string | null
          llm_max_tokens?: number | null
          llm_model?: string | null
          llm_temperature?: number | null
          max_duration_sec?: number | null
          name: string
          phone_number_id?: string | null
          post_call_prompt?: string | null
          post_call_summary?: boolean | null
          sector?: string | null
          silence_sec?: number | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          tts_model?: string | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          voice_name?: string | null
          voice_similarity?: number | null
          voice_speed?: number | null
          voice_stability?: number | null
          voicemail_detection?: boolean | null
          voicemail_message?: string | null
          webhook_url?: string | null
        }
        Update: {
          additional_languages?: string[] | null
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
          evaluation_criteria?: string | null
          first_message?: string | null
          id?: string
          interrupt_enabled?: boolean | null
          language?: string | null
          last_call_at?: string | null
          llm_backup_enabled?: boolean | null
          llm_backup_model?: string | null
          llm_max_tokens?: number | null
          llm_model?: string | null
          llm_temperature?: number | null
          max_duration_sec?: number | null
          name?: string
          phone_number_id?: string | null
          post_call_prompt?: string | null
          post_call_summary?: boolean | null
          sector?: string | null
          silence_sec?: number | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          tts_model?: string | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          voice_name?: string | null
          voice_similarity?: number | null
          voice_speed?: number | null
          voice_stability?: number | null
          voicemail_detection?: boolean | null
          voicemail_message?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "ai_phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_tools: {
        Row: {
          agent_id: string
          company_id: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          company_id: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          company_id?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_tools_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_workflows: {
        Row: {
          agent_id: string
          company_id: string
          created_at: string | null
          edges: Json | null
          id: string
          is_active: boolean | null
          name: string
          nodes: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          company_id: string
          created_at?: string | null
          edges?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          nodes?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          company_id?: string
          created_at?: string | null
          edges?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          nodes?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_workflows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_audit_log: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_packages: {
        Row: {
          badge: string | null
          created_at: string | null
          id: string
          is_active: boolean
          minutes: number
          name: string
          price_eur: number
          price_per_min: number | null
          sort_order: number
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          minutes: number
          name: string
          price_eur: number
          price_per_min?: number | null
          sort_order?: number
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          minutes?: number
          name?: string
          price_eur?: number
          price_per_min?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      ai_credit_purchases: {
        Row: {
          amount_eur: number
          company_id: string
          cost_per_min: number
          id: string
          minutes_added: number
          package_id: string | null
          payment_ref: string | null
          purchased_at: string | null
          purchased_by: string | null
        }
        Insert: {
          amount_eur: number
          company_id: string
          cost_per_min: number
          id?: string
          minutes_added: number
          package_id?: string | null
          payment_ref?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
        }
        Update: {
          amount_eur?: number
          company_id?: string
          cost_per_min?: number
          id?: string
          minutes_added?: number
          package_id?: string | null
          payment_ref?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ai_credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_topups: {
        Row: {
          amount_eur: number
          company_id: string
          created_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_method: string | null
          payment_ref: string | null
          processed_at: string | null
          status: string
          triggered_by: string | null
          type: string
        }
        Insert: {
          amount_eur: number
          company_id: string
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          processed_at?: string | null
          status?: string
          triggered_by?: string | null
          type?: string
        }
        Update: {
          amount_eur?: number
          company_id?: string
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          processed_at?: string | null
          status?: string
          triggered_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_topups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_usage: {
        Row: {
          agent_id: string | null
          balance_after: number
          balance_before: number
          call_direction: string | null
          company_id: string
          conversation_id: string | null
          cost_billed_per_min: number
          cost_billed_total: number
          cost_real_per_min: number
          cost_real_total: number
          created_at: string | null
          duration_min: number
          duration_sec: number
          id: string
          llm_model: string
          margin_total: number
          tts_model: string
        }
        Insert: {
          agent_id?: string | null
          balance_after: number
          balance_before: number
          call_direction?: string | null
          company_id: string
          conversation_id?: string | null
          cost_billed_per_min: number
          cost_billed_total: number
          cost_real_per_min: number
          cost_real_total: number
          created_at?: string | null
          duration_min: number
          duration_sec: number
          id?: string
          llm_model: string
          margin_total: number
          tts_model: string
        }
        Update: {
          agent_id?: string | null
          balance_after?: number
          balance_before?: number
          call_direction?: string | null
          company_id?: string
          conversation_id?: string | null
          cost_billed_per_min?: number
          cost_billed_total?: number
          cost_real_per_min?: number
          cost_real_total?: number
          created_at?: string | null
          duration_min?: number
          duration_sec?: number
          id?: string
          llm_model?: string
          margin_total?: number
          tts_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credits: {
        Row: {
          alert_email_sent_at: string | null
          alert_threshold_eur: number | null
          alert_threshold_pct: number
          auto_recharge_amount: number | null
          auto_recharge_enabled: boolean | null
          auto_recharge_method: string | null
          auto_recharge_payment_ref: string | null
          auto_recharge_threshold: number | null
          balance_eur: number | null
          blocked_at: string | null
          blocked_reason: string | null
          calls_blocked: boolean | null
          company_id: string
          id: string
          minutes_purchased: number
          minutes_reserved: number
          minutes_used: number
          total_recharged_eur: number | null
          total_spent_eur: number | null
          updated_at: string | null
        }
        Insert: {
          alert_email_sent_at?: string | null
          alert_threshold_eur?: number | null
          alert_threshold_pct?: number
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_method?: string | null
          auto_recharge_payment_ref?: string | null
          auto_recharge_threshold?: number | null
          balance_eur?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          calls_blocked?: boolean | null
          company_id: string
          id?: string
          minutes_purchased?: number
          minutes_reserved?: number
          minutes_used?: number
          total_recharged_eur?: number | null
          total_spent_eur?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_email_sent_at?: string | null
          alert_threshold_eur?: number | null
          alert_threshold_pct?: number
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_method?: string | null
          auto_recharge_payment_ref?: string | null
          auto_recharge_threshold?: number | null
          balance_eur?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          calls_blocked?: boolean | null
          company_id?: string
          id?: string
          minutes_purchased?: number
          minutes_reserved?: number
          minutes_used?: number
          total_recharged_eur?: number | null
          total_spent_eur?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_docs: {
        Row: {
          agent_id: string | null
          company_id: string
          content_preview: string | null
          created_at: string | null
          created_by: string | null
          el_doc_id: string | null
          file_path: string | null
          id: string
          name: string
          size_bytes: number | null
          source_url: string | null
          status: string | null
          type: string
        }
        Insert: {
          agent_id?: string | null
          company_id: string
          content_preview?: string | null
          created_at?: string | null
          created_by?: string | null
          el_doc_id?: string | null
          file_path?: string | null
          id?: string
          name: string
          size_bytes?: number | null
          source_url?: string | null
          status?: string | null
          type?: string
        }
        Update: {
          agent_id?: string | null
          company_id?: string
          content_preview?: string | null
          created_at?: string | null
          created_by?: string | null
          el_doc_id?: string | null
          file_path?: string | null
          id?: string
          name?: string
          size_bytes?: number | null
          source_url?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_docs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_docs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_phone_numbers: {
        Row: {
          active_days: string[] | null
          active_hours_end: string | null
          active_hours_start: string | null
          agent_id: string | null
          company_id: string
          country_code: string | null
          created_at: string | null
          el_phone_id: string | null
          id: string
          label: string | null
          monthly_cost: number | null
          out_of_hours_msg: string | null
          phone_number: string
          provider: string | null
          status: string | null
          updated_at: string | null
          voicemail_enabled: boolean | null
        }
        Insert: {
          active_days?: string[] | null
          active_hours_end?: string | null
          active_hours_start?: string | null
          agent_id?: string | null
          company_id: string
          country_code?: string | null
          created_at?: string | null
          el_phone_id?: string | null
          id?: string
          label?: string | null
          monthly_cost?: number | null
          out_of_hours_msg?: string | null
          phone_number: string
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          voicemail_enabled?: boolean | null
        }
        Update: {
          active_days?: string[] | null
          active_hours_end?: string | null
          active_hours_start?: string | null
          agent_id?: string | null
          company_id?: string
          country_code?: string | null
          created_at?: string | null
          el_phone_id?: string | null
          id?: string
          label?: string | null
          monthly_cost?: number | null
          out_of_hours_msg?: string | null
          phone_number?: string
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          voicemail_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_phone_numbers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_phone_numbers_company_id_fkey"
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
          appointment_created: boolean | null
          caller_number: string | null
          campaign_id: string | null
          collected_data: Json | null
          company_id: string
          contact_id: string | null
          direction: string | null
          duration_sec: number | null
          el_conv_id: string | null
          ended_at: string | null
          eval_notes: string | null
          eval_score: number | null
          id: string
          lead_created: boolean | null
          metadata: Json | null
          minutes_billed: number | null
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
          appointment_created?: boolean | null
          caller_number?: string | null
          campaign_id?: string | null
          collected_data?: Json | null
          company_id: string
          contact_id?: string | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          eval_notes?: string | null
          eval_score?: number | null
          id?: string
          lead_created?: boolean | null
          metadata?: Json | null
          minutes_billed?: number | null
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
          appointment_created?: boolean | null
          caller_number?: string | null
          campaign_id?: string | null
          collected_data?: Json | null
          company_id?: string
          contact_id?: string | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          eval_notes?: string | null
          eval_score?: number | null
          id?: string
          lead_created?: boolean | null
          metadata?: Json | null
          minutes_billed?: number | null
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
      platform_config: {
        Row: {
          cost_per_min_billed: number | null
          cost_per_min_real: number
          credit_markup: number
          el_api_key_configured: boolean
          el_api_key_tested_at: string | null
          el_default_llm: string
          el_default_voice_id: string | null
          el_voices_count: number | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cost_per_min_billed?: number | null
          cost_per_min_real?: number
          credit_markup?: number
          el_api_key_configured?: boolean
          el_api_key_tested_at?: string | null
          el_default_llm?: string
          el_default_voice_id?: string | null
          el_voices_count?: number | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cost_per_min_billed?: number | null
          cost_per_min_real?: number
          credit_markup?: number
          el_api_key_configured?: boolean
          el_api_key_tested_at?: string | null
          el_default_llm?: string
          el_default_voice_id?: string | null
          el_voices_count?: number | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_pricing: {
        Row: {
          cost_billed_per_min: number
          cost_real_per_min: number
          id: string
          is_active: boolean | null
          label: string | null
          llm_model: string
          markup_multiplier: number
          tts_model: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cost_billed_per_min: number
          cost_real_per_min: number
          id?: string
          is_active?: boolean | null
          label?: string | null
          llm_model: string
          markup_multiplier?: number
          tts_model: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cost_billed_per_min?: number
          cost_real_per_min?: number
          id?: string
          is_active?: boolean | null
          label?: string | null
          llm_model?: string
          markup_multiplier?: number
          tts_model?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string | null
          events: string[]
          id: string
          is_active: boolean
          secret: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      monthly_billing_summary: {
        Row: {
          agents_used: number | null
          avg_cost_per_min: number | null
          company_id: string | null
          company_name: string | null
          conversations_count: number | null
          month: string | null
          total_cost_billed_eur: number | null
          total_cost_real_eur: number | null
          total_margin_eur: number | null
          total_minutes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
