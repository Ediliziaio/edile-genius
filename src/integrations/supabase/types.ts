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
      agent_reports: {
        Row: {
          audio_url: string | null
          avanzamento_percentuale: number | null
          cantiere_id: string | null
          company_id: string
          condizioni_meteo: string | null
          conversation_id: string | null
          date: string
          email_inviata: boolean | null
          email_inviata_at: string | null
          fonte: string | null
          foto_urls: string[] | null
          generated_at: string | null
          id: string
          instance_id: string
          lavori_eseguiti: string[] | null
          materiali_da_ordinare: string[] | null
          materiali_usati: string[] | null
          operai_presenti: Json | null
          operaio_id: string | null
          pdf_url: string | null
          previsione_domani: string | null
          problemi: string[] | null
          raw_data: Json
          report_html: string | null
          report_summary: string | null
          sent_to: Json | null
          status: string | null
          telegram_chat_id: string | null
          telegram_message_id: string | null
          trascrizione: string | null
        }
        Insert: {
          audio_url?: string | null
          avanzamento_percentuale?: number | null
          cantiere_id?: string | null
          company_id: string
          condizioni_meteo?: string | null
          conversation_id?: string | null
          date: string
          email_inviata?: boolean | null
          email_inviata_at?: string | null
          fonte?: string | null
          foto_urls?: string[] | null
          generated_at?: string | null
          id?: string
          instance_id: string
          lavori_eseguiti?: string[] | null
          materiali_da_ordinare?: string[] | null
          materiali_usati?: string[] | null
          operai_presenti?: Json | null
          operaio_id?: string | null
          pdf_url?: string | null
          previsione_domani?: string | null
          problemi?: string[] | null
          raw_data?: Json
          report_html?: string | null
          report_summary?: string | null
          sent_to?: Json | null
          status?: string | null
          telegram_chat_id?: string | null
          telegram_message_id?: string | null
          trascrizione?: string | null
        }
        Update: {
          audio_url?: string | null
          avanzamento_percentuale?: number | null
          cantiere_id?: string | null
          company_id?: string
          condizioni_meteo?: string | null
          conversation_id?: string | null
          date?: string
          email_inviata?: boolean | null
          email_inviata_at?: string | null
          fonte?: string | null
          foto_urls?: string[] | null
          generated_at?: string | null
          id?: string
          instance_id?: string
          lavori_eseguiti?: string[] | null
          materiali_da_ordinare?: string[] | null
          materiali_usati?: string[] | null
          operai_presenti?: Json | null
          operaio_id?: string | null
          pdf_url?: string | null
          previsione_domani?: string | null
          problemi?: string[] | null
          raw_data?: Json
          report_html?: string | null
          report_summary?: string | null
          sent_to?: Json | null
          status?: string | null
          telegram_chat_id?: string | null
          telegram_message_id?: string | null
          trascrizione?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "agent_template_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_operaio_id_fkey"
            columns: ["operaio_id"]
            isOneToOne: false
            referencedRelation: "cantiere_operai"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_instances: {
        Row: {
          agent_id: string | null
          company_id: string
          config_values: Json
          created_at: string | null
          created_by: string | null
          id: string
          last_report_url: string | null
          last_run_at: string | null
          n8n_workflow_active: boolean | null
          n8n_workflow_id: string | null
          name: string
          recipients: Json | null
          reports_generated: number | null
          responders: Json | null
          status: string | null
          template_id: string
          timezone: string | null
          trigger_days: string[] | null
          trigger_time: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id: string
          config_values?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_report_url?: string | null
          last_run_at?: string | null
          n8n_workflow_active?: boolean | null
          n8n_workflow_id?: string | null
          name: string
          recipients?: Json | null
          reports_generated?: number | null
          responders?: Json | null
          status?: string | null
          template_id: string
          timezone?: string | null
          trigger_days?: string[] | null
          trigger_time?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string
          config_values?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_report_url?: string | null
          last_run_at?: string | null
          n8n_workflow_active?: boolean | null
          n8n_workflow_id?: string | null
          name?: string
          recipients?: Json | null
          reports_generated?: number | null
          responders?: Json | null
          status?: string | null
          template_id?: string
          timezone?: string | null
          trigger_days?: string[] | null
          trigger_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_instances_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_template_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_template_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_template_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          category: string | null
          channel: string[] | null
          config_schema: Json
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_setup_min: number | null
          first_message_template: string | null
          icon: string | null
          id: string
          installs_count: number | null
          is_featured: boolean | null
          is_published: boolean | null
          n8n_workflow_json: Json | null
          name: string
          output_schema: Json | null
          preview_image_url: string | null
          prompt_template: string
          slug: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          channel?: string[] | null
          config_schema?: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_setup_min?: number | null
          first_message_template?: string | null
          icon?: string | null
          id?: string
          installs_count?: number | null
          is_featured?: boolean | null
          is_published?: boolean | null
          n8n_workflow_json?: Json | null
          name: string
          output_schema?: Json | null
          preview_image_url?: string | null
          prompt_template: string
          slug: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          channel?: string[] | null
          config_schema?: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_setup_min?: number | null
          first_message_template?: string | null
          icon?: string | null
          id?: string
          installs_count?: number | null
          is_featured?: boolean | null
          is_published?: boolean | null
          n8n_workflow_json?: Json | null
          name?: string
          output_schema?: Json | null
          preview_image_url?: string | null
          prompt_template?: string
          slug?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          additional_languages: string[] | null
          asr_keywords: string[] | null
          asr_quality: string | null
          avg_duration_sec: number | null
          blocked_topics: string | null
          built_in_tools: Json | null
          calls_month: number | null
          calls_qualified: number | null
          calls_total: number | null
          company_id: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dynamic_variables: Json | null
          el_agent_id: string | null
          el_phone_number_id: string | null
          el_voice_id: string | null
          el_webhook_secret: string | null
          evaluation_criteria: string | null
          evaluation_prompt: string | null
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
          monitoring_enabled: boolean | null
          name: string
          outbound_enabled: boolean | null
          phone_number_id: string | null
          pii_redaction: boolean | null
          post_call_prompt: string | null
          post_call_summary: boolean | null
          post_call_webhook_url: string | null
          sector: string | null
          silence_end_call_timeout: number | null
          silence_sec: number | null
          speculative_turn: boolean | null
          status: string | null
          system_prompt: string | null
          temperature: number | null
          transfer_number: string | null
          tts_model: string | null
          type: string | null
          updated_at: string | null
          use_case: string | null
          vad_enabled: boolean | null
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
          asr_keywords?: string[] | null
          asr_quality?: string | null
          avg_duration_sec?: number | null
          blocked_topics?: string | null
          built_in_tools?: Json | null
          calls_month?: number | null
          calls_qualified?: number | null
          calls_total?: number | null
          company_id: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_variables?: Json | null
          el_agent_id?: string | null
          el_phone_number_id?: string | null
          el_voice_id?: string | null
          el_webhook_secret?: string | null
          evaluation_criteria?: string | null
          evaluation_prompt?: string | null
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
          monitoring_enabled?: boolean | null
          name: string
          outbound_enabled?: boolean | null
          phone_number_id?: string | null
          pii_redaction?: boolean | null
          post_call_prompt?: string | null
          post_call_summary?: boolean | null
          post_call_webhook_url?: string | null
          sector?: string | null
          silence_end_call_timeout?: number | null
          silence_sec?: number | null
          speculative_turn?: boolean | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          transfer_number?: string | null
          tts_model?: string | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          vad_enabled?: boolean | null
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
          asr_keywords?: string[] | null
          asr_quality?: string | null
          avg_duration_sec?: number | null
          blocked_topics?: string | null
          built_in_tools?: Json | null
          calls_month?: number | null
          calls_qualified?: number | null
          calls_total?: number | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_variables?: Json | null
          el_agent_id?: string | null
          el_phone_number_id?: string | null
          el_voice_id?: string | null
          el_webhook_secret?: string | null
          evaluation_criteria?: string | null
          evaluation_prompt?: string | null
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
          monitoring_enabled?: boolean | null
          name?: string
          outbound_enabled?: boolean | null
          phone_number_id?: string | null
          pii_redaction?: boolean | null
          post_call_prompt?: string | null
          post_call_summary?: boolean | null
          post_call_webhook_url?: string | null
          sector?: string | null
          silence_end_call_timeout?: number | null
          silence_sec?: number | null
          speculative_turn?: boolean | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          transfer_number?: string | null
          tts_model?: string | null
          type?: string | null
          updated_at?: string | null
          use_case?: string | null
          vad_enabled?: boolean | null
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
          el_sync_at: string | null
          el_sync_status: string | null
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
          el_sync_at?: string | null
          el_sync_status?: string | null
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
          el_sync_at?: string | null
          el_sync_status?: string | null
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
          el_phone_number_id: string | null
          id: string
          inbound_enabled: boolean | null
          label: string | null
          monthly_cost: number | null
          out_of_hours_msg: string | null
          outbound_enabled: boolean | null
          phone_number: string
          provider: string | null
          provider_type: string | null
          status: string | null
          twilio_sid: string | null
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
          el_phone_number_id?: string | null
          id?: string
          inbound_enabled?: boolean | null
          label?: string | null
          monthly_cost?: number | null
          out_of_hours_msg?: string | null
          outbound_enabled?: boolean | null
          phone_number: string
          provider?: string | null
          provider_type?: string | null
          status?: string | null
          twilio_sid?: string | null
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
          el_phone_number_id?: string | null
          id?: string
          inbound_enabled?: boolean | null
          label?: string | null
          monthly_cost?: number | null
          out_of_hours_msg?: string | null
          outbound_enabled?: boolean | null
          phone_number?: string
          provider?: string | null
          provider_type?: string | null
          status?: string | null
          twilio_sid?: string | null
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
      alert_mancato_report: {
        Row: {
          cantiere_id: string
          company_id: string
          data_mancanza: string
          id: string
          inviato_a: Json | null
          inviato_at: string | null
          tipo_alert: string | null
        }
        Insert: {
          cantiere_id: string
          company_id: string
          data_mancanza: string
          id?: string
          inviato_a?: Json | null
          inviato_at?: string | null
          tipo_alert?: string | null
        }
        Update: {
          cantiere_id?: string
          company_id?: string
          data_mancanza?: string
          id?: string
          inviato_a?: Json | null
          inviato_at?: string | null
          tipo_alert?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_mancato_report_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_mancato_report_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          attempts: number
          campaign_id: string
          company_id: string
          contact_id: string
          conversation_id: string | null
          created_at: string | null
          error: string | null
          id: string
          last_call_at: string | null
          max_attempts: number
          next_retry_at: string | null
          outcome: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          campaign_id: string
          company_id: string
          contact_id: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          last_call_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          outcome?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          campaign_id?: string
          company_id?: string
          contact_id?: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          last_call_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          outcome?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      cantiere_operai: {
        Row: {
          attivo: boolean | null
          cantiere_id: string | null
          cognome: string | null
          company_id: string
          created_at: string | null
          id: string
          nome: string
          ruolo: string | null
          telefono: string | null
          telegram_user_id: string | null
          telegram_username: string | null
        }
        Insert: {
          attivo?: boolean | null
          cantiere_id?: string | null
          cognome?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          nome: string
          ruolo?: string | null
          telefono?: string | null
          telegram_user_id?: string | null
          telegram_username?: string | null
        }
        Update: {
          attivo?: boolean | null
          cantiere_id?: string | null
          cognome?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          ruolo?: string | null
          telefono?: string | null
          telegram_user_id?: string | null
          telegram_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cantiere_operai_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cantiere_operai_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cantieri: {
        Row: {
          alert_mancato_report_ore: number | null
          committente: string | null
          company_id: string
          created_at: string | null
          data_fine_prevista: string | null
          data_inizio: string | null
          email_report: string[] | null
          fine_turno_ora: string | null
          foto_url: string | null
          id: string
          indirizzo: string | null
          nome: string
          note: string | null
          reminder_ora: string | null
          responsabile: string | null
          stato: string | null
          telegram_chat_ids: string[] | null
        }
        Insert: {
          alert_mancato_report_ore?: number | null
          committente?: string | null
          company_id: string
          created_at?: string | null
          data_fine_prevista?: string | null
          data_inizio?: string | null
          email_report?: string[] | null
          fine_turno_ora?: string | null
          foto_url?: string | null
          id?: string
          indirizzo?: string | null
          nome: string
          note?: string | null
          reminder_ora?: string | null
          responsabile?: string | null
          stato?: string | null
          telegram_chat_ids?: string[] | null
        }
        Update: {
          alert_mancato_report_ore?: number | null
          committente?: string | null
          company_id?: string
          created_at?: string | null
          data_fine_prevista?: string | null
          data_inizio?: string | null
          email_report?: string[] | null
          fine_turno_ora?: string | null
          foto_url?: string | null
          id?: string
          indirizzo?: string | null
          nome?: string
          note?: string | null
          reminder_ora?: string | null
          responsabile?: string | null
          stato?: string | null
          telegram_chat_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cantieri_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      company_channels: {
        Row: {
          channel_type: string
          company_id: string
          created_at: string | null
          email_from: string | null
          email_provider: string | null
          id: string
          is_verified: boolean | null
          label: string | null
          telegram_bot_name: string | null
          telegram_bot_token: string | null
          verified_at: string | null
          whatsapp_number: string | null
          whatsapp_provider: string | null
          whatsapp_token: string | null
        }
        Insert: {
          channel_type: string
          company_id: string
          created_at?: string | null
          email_from?: string | null
          email_provider?: string | null
          id?: string
          is_verified?: boolean | null
          label?: string | null
          telegram_bot_name?: string | null
          telegram_bot_token?: string | null
          verified_at?: string | null
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
          whatsapp_token?: string | null
        }
        Update: {
          channel_type?: string
          company_id?: string
          created_at?: string | null
          email_from?: string | null
          email_provider?: string | null
          id?: string
          is_verified?: boolean | null
          label?: string | null
          telegram_bot_name?: string | null
          telegram_bot_token?: string | null
          verified_at?: string | null
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
          whatsapp_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_integrations: {
        Row: {
          api_key_encrypted: string | null
          company_id: string
          created_at: string | null
          field_mapping: Json
          id: string
          instance_url: string | null
          is_active: boolean
          last_sync_at: string | null
          last_sync_count: number | null
          last_sync_status: string | null
          provider: string
          status: string
          sync_settings: Json
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          company_id: string
          created_at?: string | null
          field_mapping?: Json
          id?: string
          instance_url?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_status?: string | null
          provider: string
          status?: string
          sync_settings?: Json
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          company_id?: string
          created_at?: string | null
          field_mapping?: Json
          id?: string
          instance_url?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_status?: string | null
          provider?: string
          status?: string
          sync_settings?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          cost_billed_eur: number | null
          direction: string | null
          duration_sec: number | null
          el_conv_id: string | null
          ended_at: string | null
          eval_notes: string | null
          eval_score: number | null
          id: string
          lead_created: boolean | null
          main_reason: string | null
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
          cost_billed_eur?: number | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          eval_notes?: string | null
          eval_score?: number | null
          id?: string
          lead_created?: boolean | null
          main_reason?: string | null
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
          cost_billed_eur?: number | null
          direction?: string | null
          duration_sec?: number | null
          el_conv_id?: string | null
          ended_at?: string | null
          eval_notes?: string | null
          eval_score?: number | null
          id?: string
          lead_created?: boolean | null
          main_reason?: string | null
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
      documenti_azienda: {
        Row: {
          alert_15g: boolean | null
          alert_30g: boolean | null
          alert_7g: boolean | null
          alert_scaduto: boolean | null
          company_id: string
          created_at: string | null
          data_emissione: string | null
          data_scadenza: string
          file_url: string | null
          id: string
          nome: string
          note: string | null
          numero_documento: string | null
          operaio_id: string | null
          stato: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          alert_15g?: boolean | null
          alert_30g?: boolean | null
          alert_7g?: boolean | null
          alert_scaduto?: boolean | null
          company_id: string
          created_at?: string | null
          data_emissione?: string | null
          data_scadenza: string
          file_url?: string | null
          id?: string
          nome: string
          note?: string | null
          numero_documento?: string | null
          operaio_id?: string | null
          stato?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          alert_15g?: boolean | null
          alert_30g?: boolean | null
          alert_7g?: boolean | null
          alert_scaduto?: boolean | null
          company_id?: string
          created_at?: string | null
          data_emissione?: string | null
          data_scadenza?: string
          file_url?: string | null
          id?: string
          nome?: string
          note?: string | null
          numero_documento?: string | null
          operaio_id?: string | null
          stato?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documenti_azienda_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_azienda_operaio_id_fkey"
            columns: ["operaio_id"]
            isOneToOne: false
            referencedRelation: "cantiere_operai"
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
      outbound_call_log: {
        Row: {
          agent_id: string | null
          company_id: string
          duration_sec: number | null
          el_call_id: string | null
          ended_at: string | null
          error_message: string | null
          from_number: string | null
          id: string
          phone_number_id: string | null
          started_at: string | null
          status: string | null
          to_number: string
        }
        Insert: {
          agent_id?: string | null
          company_id: string
          duration_sec?: number | null
          el_call_id?: string | null
          ended_at?: string | null
          error_message?: string | null
          from_number?: string | null
          id?: string
          phone_number_id?: string | null
          started_at?: string | null
          status?: string | null
          to_number: string
        }
        Update: {
          agent_id?: string | null
          company_id?: string
          duration_sec?: number | null
          el_call_id?: string | null
          ended_at?: string | null
          error_message?: string | null
          from_number?: string | null
          id?: string
          phone_number_id?: string | null
          started_at?: string | null
          status?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_call_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_call_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_call_log_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "ai_phone_numbers"
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
          n8n_api_key_set: boolean
          n8n_base_url: string | null
          n8n_configured: boolean
          n8n_tested_at: string | null
          n8n_workflows_count: number
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
          n8n_api_key_set?: boolean
          n8n_base_url?: string | null
          n8n_configured?: boolean
          n8n_tested_at?: string | null
          n8n_workflows_count?: number
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
          n8n_api_key_set?: boolean
          n8n_base_url?: string | null
          n8n_configured?: boolean
          n8n_tested_at?: string | null
          n8n_workflows_count?: number
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
      presenze_mensili: {
        Row: {
          anno: number
          cantiere_id: string | null
          company_id: string
          created_at: string | null
          id: string
          mese: number
          note: string | null
          operaio_id: string
          ore_giornaliere: Json
          ore_totali: number | null
          updated_at: string | null
        }
        Insert: {
          anno: number
          cantiere_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          mese: number
          note?: string | null
          operaio_id: string
          ore_giornaliere?: Json
          ore_totali?: number | null
          updated_at?: string | null
        }
        Update: {
          anno?: number
          cantiere_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          mese?: number
          note?: string | null
          operaio_id?: string
          ore_giornaliere?: Json
          ore_totali?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presenze_mensili_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenze_mensili_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenze_mensili_operaio_id_fkey"
            columns: ["operaio_id"]
            isOneToOne: false
            referencedRelation: "cantiere_operai"
            referencedColumns: ["id"]
          },
        ]
      }
      preventivi: {
        Row: {
          accettato_at: string | null
          accettato_online_at: string | null
          ai_elaborato: boolean | null
          audio_url: string | null
          cantiere_id: string | null
          clausole: string | null
          cliente_codice_fiscale: string | null
          cliente_email: string | null
          cliente_indirizzo: string | null
          cliente_nome: string | null
          cliente_piva: string | null
          cliente_telefono: string | null
          company_id: string
          condizioni: string | null
          condizioni_pagamento: string | null
          created_at: string | null
          created_by: string | null
          data_invio: string | null
          data_scadenza: string | null
          email_aperta_at: string | null
          firma_cliente_url: string | null
          firma_testo: string | null
          foto_copertina_url: string | null
          foto_sopralluogo_urls: string[] | null
          id: string
          imponibile: number | null
          intro: string | null
          intro_testo: string | null
          inviato_at: string | null
          inviato_via: string | null
          invio_email: string | null
          iva_importo: number | null
          iva_percentuale: number | null
          link_accettazione: string | null
          link_aperto_at: string | null
          link_aperto_count: number | null
          luogo_lavori: string | null
          note: string | null
          note_finali: string | null
          numero_preventivo: string
          oggetto: string | null
          parent_id: string | null
          pdf_generato_at: string | null
          pdf_url: string | null
          pdf_versione: number | null
          rifiutato_at: string | null
          rifiuto_motivo: string | null
          sconto_globale: number | null
          sconto_globale_importo: number | null
          sconto_globale_percentuale: number | null
          stato: string | null
          subtotale: number | null
          tempi_esecuzione: string | null
          template_id: string | null
          titolo: string | null
          totale: number | null
          totale_finale: number | null
          tracking_aperto_at: string | null
          tracking_aperto_count: number | null
          trascrizione: string | null
          updated_at: string | null
          validita_giorni: number | null
          versione: number | null
          voci: Json
        }
        Insert: {
          accettato_at?: string | null
          accettato_online_at?: string | null
          ai_elaborato?: boolean | null
          audio_url?: string | null
          cantiere_id?: string | null
          clausole?: string | null
          cliente_codice_fiscale?: string | null
          cliente_email?: string | null
          cliente_indirizzo?: string | null
          cliente_nome?: string | null
          cliente_piva?: string | null
          cliente_telefono?: string | null
          company_id: string
          condizioni?: string | null
          condizioni_pagamento?: string | null
          created_at?: string | null
          created_by?: string | null
          data_invio?: string | null
          data_scadenza?: string | null
          email_aperta_at?: string | null
          firma_cliente_url?: string | null
          firma_testo?: string | null
          foto_copertina_url?: string | null
          foto_sopralluogo_urls?: string[] | null
          id?: string
          imponibile?: number | null
          intro?: string | null
          intro_testo?: string | null
          inviato_at?: string | null
          inviato_via?: string | null
          invio_email?: string | null
          iva_importo?: number | null
          iva_percentuale?: number | null
          link_accettazione?: string | null
          link_aperto_at?: string | null
          link_aperto_count?: number | null
          luogo_lavori?: string | null
          note?: string | null
          note_finali?: string | null
          numero_preventivo: string
          oggetto?: string | null
          parent_id?: string | null
          pdf_generato_at?: string | null
          pdf_url?: string | null
          pdf_versione?: number | null
          rifiutato_at?: string | null
          rifiuto_motivo?: string | null
          sconto_globale?: number | null
          sconto_globale_importo?: number | null
          sconto_globale_percentuale?: number | null
          stato?: string | null
          subtotale?: number | null
          tempi_esecuzione?: string | null
          template_id?: string | null
          titolo?: string | null
          totale?: number | null
          totale_finale?: number | null
          tracking_aperto_at?: string | null
          tracking_aperto_count?: number | null
          trascrizione?: string | null
          updated_at?: string | null
          validita_giorni?: number | null
          versione?: number | null
          voci?: Json
        }
        Update: {
          accettato_at?: string | null
          accettato_online_at?: string | null
          ai_elaborato?: boolean | null
          audio_url?: string | null
          cantiere_id?: string | null
          clausole?: string | null
          cliente_codice_fiscale?: string | null
          cliente_email?: string | null
          cliente_indirizzo?: string | null
          cliente_nome?: string | null
          cliente_piva?: string | null
          cliente_telefono?: string | null
          company_id?: string
          condizioni?: string | null
          condizioni_pagamento?: string | null
          created_at?: string | null
          created_by?: string | null
          data_invio?: string | null
          data_scadenza?: string | null
          email_aperta_at?: string | null
          firma_cliente_url?: string | null
          firma_testo?: string | null
          foto_copertina_url?: string | null
          foto_sopralluogo_urls?: string[] | null
          id?: string
          imponibile?: number | null
          intro?: string | null
          intro_testo?: string | null
          inviato_at?: string | null
          inviato_via?: string | null
          invio_email?: string | null
          iva_importo?: number | null
          iva_percentuale?: number | null
          link_accettazione?: string | null
          link_aperto_at?: string | null
          link_aperto_count?: number | null
          luogo_lavori?: string | null
          note?: string | null
          note_finali?: string | null
          numero_preventivo?: string
          oggetto?: string | null
          parent_id?: string | null
          pdf_generato_at?: string | null
          pdf_url?: string | null
          pdf_versione?: number | null
          rifiutato_at?: string | null
          rifiuto_motivo?: string | null
          sconto_globale?: number | null
          sconto_globale_importo?: number | null
          sconto_globale_percentuale?: number | null
          stato?: string | null
          subtotale?: number | null
          tempi_esecuzione?: string | null
          template_id?: string | null
          titolo?: string | null
          totale?: number | null
          totale_finale?: number | null
          tracking_aperto_at?: string | null
          tracking_aperto_count?: number | null
          trascrizione?: string | null
          updated_at?: string | null
          validita_giorni?: number | null
          versione?: number | null
          voci?: Json
        }
        Relationships: [
          {
            foreignKeyName: "preventivi_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivi_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivi_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "preventivi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivi_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "preventivo_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      preventivo_templates: {
        Row: {
          attivo: boolean | null
          azienda_cf: string | null
          azienda_email: string | null
          azienda_indirizzo: string | null
          azienda_nome: string | null
          azienda_piva: string | null
          azienda_rea: string | null
          azienda_sito: string | null
          azienda_telefono: string | null
          clausole_default: string | null
          colore_primario: string | null
          colore_secondario: string | null
          company_id: string
          condizioni_default: string | null
          created_at: string | null
          firma_testo: string | null
          font: string | null
          id: string
          intestazione_azienda: string | null
          intro_default: string | null
          iva_default: number | null
          iva_inclusa_default: boolean | null
          logo_url: string | null
          nome: string
          note_finali: string | null
          oggetto_default: string | null
          piede_pagina: string | null
          show_condizioni: boolean | null
          show_firma: boolean | null
          show_foto_copertina: boolean | null
          show_foto_voci: boolean | null
          show_subtotali_categoria: boolean | null
          updated_at: string | null
          validita_giorni_default: number | null
          valuta: string | null
        }
        Insert: {
          attivo?: boolean | null
          azienda_cf?: string | null
          azienda_email?: string | null
          azienda_indirizzo?: string | null
          azienda_nome?: string | null
          azienda_piva?: string | null
          azienda_rea?: string | null
          azienda_sito?: string | null
          azienda_telefono?: string | null
          clausole_default?: string | null
          colore_primario?: string | null
          colore_secondario?: string | null
          company_id: string
          condizioni_default?: string | null
          created_at?: string | null
          firma_testo?: string | null
          font?: string | null
          id?: string
          intestazione_azienda?: string | null
          intro_default?: string | null
          iva_default?: number | null
          iva_inclusa_default?: boolean | null
          logo_url?: string | null
          nome?: string
          note_finali?: string | null
          oggetto_default?: string | null
          piede_pagina?: string | null
          show_condizioni?: boolean | null
          show_firma?: boolean | null
          show_foto_copertina?: boolean | null
          show_foto_voci?: boolean | null
          show_subtotali_categoria?: boolean | null
          updated_at?: string | null
          validita_giorni_default?: number | null
          valuta?: string | null
        }
        Update: {
          attivo?: boolean | null
          azienda_cf?: string | null
          azienda_email?: string | null
          azienda_indirizzo?: string | null
          azienda_nome?: string | null
          azienda_piva?: string | null
          azienda_rea?: string | null
          azienda_sito?: string | null
          azienda_telefono?: string | null
          clausole_default?: string | null
          colore_primario?: string | null
          colore_secondario?: string | null
          company_id?: string
          condizioni_default?: string | null
          created_at?: string | null
          firma_testo?: string | null
          font?: string | null
          id?: string
          intestazione_azienda?: string | null
          intro_default?: string | null
          iva_default?: number | null
          iva_inclusa_default?: boolean | null
          logo_url?: string | null
          nome?: string
          note_finali?: string | null
          oggetto_default?: string | null
          piede_pagina?: string | null
          show_condizioni?: boolean | null
          show_firma?: boolean | null
          show_foto_copertina?: boolean | null
          show_foto_voci?: boolean | null
          show_subtotali_categoria?: boolean | null
          updated_at?: string | null
          validita_giorni_default?: number | null
          valuta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preventivo_templates_company_id_fkey"
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
      render_credits: {
        Row: {
          balance: number | null
          company_id: string
          id: string
          total_purchased: number | null
          total_used: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          company_id: string
          id?: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          company_id?: string
          id?: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      render_gallery: {
        Row: {
          company_id: string
          config_summary: Json | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_favorite: boolean | null
          notes: string | null
          original_url: string
          render_url: string
          session_id: string
          share_token: string | null
          title: string | null
        }
        Insert: {
          company_id: string
          config_summary?: Json | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          original_url: string
          render_url: string
          session_id: string
          share_token?: string | null
          title?: string | null
        }
        Update: {
          company_id?: string
          config_summary?: Json | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          original_url?: string
          render_url?: string
          session_id?: string
          share_token?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_gallery_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_gallery_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_gallery_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_gallery_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "render_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      render_infissi_presets: {
        Row: {
          category: string
          color_hex: string | null
          colore_ncs: string | null
          colore_ral: string | null
          company_id: string | null
          created_at: string | null
          finitura: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          materiale_tipo: string | null
          name: string
          prompt_fragment: string
          sort_order: number | null
          value: string
        }
        Insert: {
          category: string
          color_hex?: string | null
          colore_ncs?: string | null
          colore_ral?: string | null
          company_id?: string | null
          created_at?: string | null
          finitura?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          materiale_tipo?: string | null
          name: string
          prompt_fragment: string
          sort_order?: number | null
          value: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          colore_ncs?: string | null
          colore_ral?: string | null
          company_id?: string | null
          created_at?: string | null
          finitura?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          materiale_tipo?: string | null
          name?: string
          prompt_fragment?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "render_infissi_presets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      render_provider_config: {
        Row: {
          api_endpoint: string | null
          cost_billed_per_render: number | null
          cost_real_per_render: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string
          markup_multiplier: number | null
          max_resolution: number | null
          model: string
          notes: string | null
          provider_key: string
          quality: string | null
          renders_generated: number | null
          timeout_sec: number | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          cost_billed_per_render?: number | null
          cost_real_per_render?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label: string
          markup_multiplier?: number | null
          max_resolution?: number | null
          model: string
          notes?: string | null
          provider_key: string
          quality?: string | null
          renders_generated?: number | null
          timeout_sec?: number | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          cost_billed_per_render?: number | null
          cost_real_per_render?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string
          markup_multiplier?: number | null
          max_resolution?: number | null
          model?: string
          notes?: string | null
          provider_key?: string
          quality?: string | null
          renders_generated?: number | null
          timeout_sec?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      render_sessions: {
        Row: {
          company_id: string
          config: Json
          config_snapshot: Json | null
          contact_id: string | null
          cost_billed: number | null
          cost_real: number | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          foto_analisi: Json | null
          id: string
          original_analysis: Json | null
          original_photo_url: string
          processing_completed_at: string | null
          processing_started_at: string | null
          prompt_blocks: Json | null
          prompt_char_count: number | null
          prompt_used: string | null
          prompt_version: string | null
          provider_key: string | null
          result_urls: Json | null
          selected_result_index: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          config?: Json
          config_snapshot?: Json | null
          contact_id?: string | null
          cost_billed?: number | null
          cost_real?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          foto_analisi?: Json | null
          id?: string
          original_analysis?: Json | null
          original_photo_url: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          prompt_blocks?: Json | null
          prompt_char_count?: number | null
          prompt_used?: string | null
          prompt_version?: string | null
          provider_key?: string | null
          result_urls?: Json | null
          selected_result_index?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          config?: Json
          config_snapshot?: Json | null
          contact_id?: string | null
          cost_billed?: number | null
          cost_real?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          foto_analisi?: Json | null
          id?: string
          original_analysis?: Json | null
          original_photo_url?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          prompt_blocks?: Json | null
          prompt_char_count?: number | null
          prompt_used?: string | null
          prompt_version?: string | null
          provider_key?: string | null
          result_urls?: Json | null
          selected_result_index?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sal_milestones: {
        Row: {
          alert_ritardo_inviato: boolean | null
          cantiere_id: string
          company_id: string
          created_at: string | null
          data_completamento: string | null
          data_prevista: string | null
          descrizione: string | null
          id: string
          nome: string
          ordine: number | null
          percentuale_attuale: number | null
          stato: string | null
          target_percentuale: number
          updated_at: string | null
        }
        Insert: {
          alert_ritardo_inviato?: boolean | null
          cantiere_id: string
          company_id: string
          created_at?: string | null
          data_completamento?: string | null
          data_prevista?: string | null
          descrizione?: string | null
          id?: string
          nome: string
          ordine?: number | null
          percentuale_attuale?: number | null
          stato?: string | null
          target_percentuale: number
          updated_at?: string | null
        }
        Update: {
          alert_ritardo_inviato?: boolean | null
          cantiere_id?: string
          company_id?: string
          created_at?: string | null
          data_completamento?: string | null
          data_prevista?: string | null
          descrizione?: string | null
          id?: string
          nome?: string
          ordine?: number | null
          percentuale_attuale?: number | null
          stato?: string | null
          target_percentuale?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sal_milestones_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sal_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_whatsapp_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_app_id: string
          meta_app_secret_encrypted: string
          meta_config_id: string | null
          subscription_price_monthly: number | null
          updated_at: string | null
          webhook_url: string
          webhook_verify_token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_app_id?: string
          meta_app_secret_encrypted?: string
          meta_config_id?: string | null
          subscription_price_monthly?: number | null
          updated_at?: string | null
          webhook_url?: string
          webhook_verify_token?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_app_id?: string
          meta_app_secret_encrypted?: string
          meta_config_id?: string | null
          subscription_price_monthly?: number | null
          updated_at?: string | null
          webhook_url?: string
          webhook_verify_token?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          attivo: boolean | null
          bot_token: string | null
          bot_username: string | null
          company_id: string
          created_at: string | null
          email_report_default: string[] | null
          id: string
          report_ora_invio: string | null
          webhook_secret: string | null
        }
        Insert: {
          attivo?: boolean | null
          bot_token?: string | null
          bot_username?: string | null
          company_id: string
          created_at?: string | null
          email_report_default?: string[] | null
          id?: string
          report_ora_invio?: string | null
          webhook_secret?: string | null
        }
        Update: {
          attivo?: boolean | null
          bot_token?: string | null
          bot_username?: string | null
          company_id?: string
          created_at?: string | null
          email_report_default?: string[] | null
          id?: string
          report_ora_invio?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sessions: {
        Row: {
          cantiere_id: string | null
          chat_id: string
          company_id: string | null
          created_at: string | null
          id: string
          operaio_id: string | null
          pending_foto_urls: string[] | null
          pending_report_data: Json | null
          stato: string | null
          ultimo_messaggio_at: string | null
        }
        Insert: {
          cantiere_id?: string | null
          chat_id: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          operaio_id?: string | null
          pending_foto_urls?: string[] | null
          pending_report_data?: Json | null
          stato?: string | null
          ultimo_messaggio_at?: string | null
        }
        Update: {
          cantiere_id?: string | null
          chat_id?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          operaio_id?: string | null
          pending_foto_urls?: string[] | null
          pending_report_data?: Json | null
          stato?: string | null
          ultimo_messaggio_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_sessions_cantiere_id_fkey"
            columns: ["cantiere_id"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_sessions_operaio_id_fkey"
            columns: ["operaio_id"]
            isOneToOne: false
            referencedRelation: "cantiere_operai"
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
      whatsapp_conversations: {
        Row: {
          ai_enabled: boolean | null
          assigned_user_id: string | null
          company_id: string
          contact_id: string | null
          contact_phone: string
          created_at: string | null
          id: string
          last_message_at: string | null
          phone_number_id: string
          status: string | null
          unread_count: number | null
          updated_at: string | null
          window_expires_at: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          assigned_user_id?: string | null
          company_id: string
          contact_id?: string | null
          contact_phone: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number_id: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          window_expires_at?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          assigned_user_id?: string | null
          company_id?: string
          contact_id?: string | null
          contact_phone?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number_id?: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          company_id: string
          contact_id: string | null
          content: Json
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          error_code: string | null
          error_message: string | null
          id: string
          meta_message_id: string | null
          phone_number_id: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          type: string
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          content?: Json
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          phone_number_id: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          content?: Json
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          phone_number_id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_phone_numbers: {
        Row: {
          certificate: string | null
          company_id: string
          created_at: string | null
          display_name: string
          display_phone_number: string
          id: string
          is_default: boolean | null
          messaging_limit_tier: string | null
          name_status: string | null
          phone_number_id: string
          quality_rating: string | null
          status: string | null
          updated_at: string | null
          verified_name: string | null
          waba_id: string
          webhook_verified: boolean | null
        }
        Insert: {
          certificate?: string | null
          company_id: string
          created_at?: string | null
          display_name: string
          display_phone_number: string
          id?: string
          is_default?: boolean | null
          messaging_limit_tier?: string | null
          name_status?: string | null
          phone_number_id: string
          quality_rating?: string | null
          status?: string | null
          updated_at?: string | null
          verified_name?: string | null
          waba_id: string
          webhook_verified?: boolean | null
        }
        Update: {
          certificate?: string | null
          company_id?: string
          created_at?: string | null
          display_name?: string
          display_phone_number?: string
          id?: string
          is_default?: boolean | null
          messaging_limit_tier?: string | null
          name_status?: string | null
          phone_number_id?: string
          quality_rating?: string | null
          status?: string | null
          updated_at?: string | null
          verified_name?: string | null
          waba_id?: string
          webhook_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_phone_numbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_subscriptions: {
        Row: {
          activated_at: string | null
          company_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          plan: string
          price_monthly: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price_monthly?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price_monthly?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          company_id: string
          components: Json
          created_at: string | null
          id: string
          language: string
          meta_template_id: string | null
          name: string
          phone_number_id: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_id: string
          components?: Json
          created_at?: string | null
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          phone_number_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          components?: Json
          created_at?: string | null
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          phone_number_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_phone_numbers"
            referencedColumns: ["phone_number_id"]
          },
        ]
      }
      whatsapp_waba_config: {
        Row: {
          access_token_encrypted: string | null
          business_id: string | null
          business_name: string | null
          company_id: string
          created_at: string | null
          id: string
          meta_verification_status: string | null
          meta_verified: boolean | null
          system_user_id: string | null
          token_refresh_error: string | null
          token_refreshed_at: string | null
          updated_at: string | null
          waba_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          business_id?: string | null
          business_name?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          meta_verification_status?: string | null
          meta_verified?: boolean | null
          system_user_id?: string | null
          token_refresh_error?: string | null
          token_refreshed_at?: string | null
          updated_at?: string | null
          waba_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          business_id?: string | null
          business_name?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          meta_verification_status?: string | null
          meta_verified?: boolean | null
          system_user_id?: string | null
          token_refresh_error?: string | null
          token_refreshed_at?: string | null
          updated_at?: string | null
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_waba_config_company_id_fkey"
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
      deduct_render_credit: {
        Args: { _company_id: string }
        Returns: undefined
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_installs_count: { Args: { tpl_id: string }; Returns: undefined }
      my_company: { Args: never; Returns: string }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
      topup_credits: {
        Args: { _amount_eur: number; _company_id: string }
        Returns: number
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
