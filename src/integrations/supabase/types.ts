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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          chatbot_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          results: Json | null
          start_date: string | null
          status: string
          success_metric: string
          test_type: string
          traffic_split: Json
          updated_at: string
          variants: Json
          workspace_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          results?: Json | null
          start_date?: string | null
          status?: string
          success_metric: string
          test_type: string
          traffic_split?: Json
          updated_at?: string
          variants?: Json
          workspace_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          results?: Json | null
          start_date?: string | null
          status?: string
          success_metric?: string
          test_type?: string
          traffic_split?: Json
          updated_at?: string
          variants?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          period_month: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          period_month: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          period_month?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          chatbot_id: string
          conversation_id: string | null
          created_at: string
          event_data: Json | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          visitor_id: string | null
        }
        Insert: {
          chatbot_id: string
          conversation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          visitor_id?: string | null
        }
        Update: {
          chatbot_id?: string
          conversation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_chatbots: {
        Row: {
          created_at: string
          did_agent_id: string | null
          did_client_key: string | null
          id: string
          is_active: boolean | null
          knowledge_base: string | null
          llm_model: string
          name: string
          presenter_id: string
          system_prompt: string | null
          updated_at: string
          user_id: string
          voice_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          did_agent_id?: string | null
          did_client_key?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string
          name: string
          presenter_id?: string
          system_prompt?: string | null
          updated_at?: string
          user_id: string
          voice_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          did_agent_id?: string | null
          did_client_key?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string
          name?: string
          presenter_id?: string
          system_prompt?: string | null
          updated_at?: string
          user_id?: string
          voice_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_chatbots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_conversations: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          messages: Json
          session_duration: number | null
          visitor_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          messages?: Json
          session_duration?: number | null
          visitor_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          messages?: Json
          session_duration?: number | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "avatar_chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_knowledge_sources: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          file_url: string | null
          id: string
          metadata: Json | null
          source_name: string
          source_type: Database["public"]["Enums"]["knowledge_source_type"]
          status: Database["public"]["Enums"]["knowledge_source_status"]
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_name: string
          source_type: Database["public"]["Enums"]["knowledge_source_type"]
          status?: Database["public"]["Enums"]["knowledge_source_status"]
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_name?: string
          source_type?: Database["public"]["Enums"]["knowledge_source_type"]
          status?: Database["public"]["Enums"]["knowledge_source_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_knowledge_sources_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "avatar_chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_messages: {
        Row: {
          buttons: Json | null
          chatbot_id: string
          collect_lead_info: boolean
          conditions: Json | null
          created_at: string
          id: string
          interactive_elements: Json | null
          message_key: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          next_message_key: string | null
          node_connections: Json | null
          node_position: Json | null
          updated_at: string
          video_autoplay: boolean | null
          video_chapters: Json | null
          video_controls: boolean | null
          video_duration: number | null
          video_layout: string | null
          video_thumbnail: string | null
          video_url: string | null
        }
        Insert: {
          buttons?: Json | null
          chatbot_id: string
          collect_lead_info?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          interactive_elements?: Json | null
          message_key: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          next_message_key?: string | null
          node_connections?: Json | null
          node_position?: Json | null
          updated_at?: string
          video_autoplay?: boolean | null
          video_chapters?: Json | null
          video_controls?: boolean | null
          video_duration?: number | null
          video_layout?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Update: {
          buttons?: Json | null
          chatbot_id?: string
          collect_lead_info?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          interactive_elements?: Json | null
          message_key?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          next_message_key?: string | null
          node_connections?: Json | null
          node_position?: Json | null
          updated_at?: string
          video_autoplay?: boolean | null
          video_chapters?: Json | null
          video_controls?: boolean | null
          video_duration?: number | null
          video_layout?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          industry_tags: string[] | null
          is_active: boolean
          name: string
          preview_image: string | null
          sample_videos: Json | null
          template_config: Json
          video_enabled: boolean | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          industry_tags?: string[] | null
          is_active?: boolean
          name: string
          preview_image?: string | null
          sample_videos?: Json | null
          template_config: Json
          video_enabled?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          industry_tags?: string[] | null
          is_active?: boolean
          name?: string
          preview_image?: string | null
          sample_videos?: Json | null
          template_config?: Json
          video_enabled?: boolean | null
        }
        Relationships: []
      }
      chatbots: {
        Row: {
          ai_enabled: boolean
          ai_model: string | null
          ai_prompt: string | null
          chatbot_type: string | null
          created_at: string
          created_by: string
          description: string | null
          fallback_message: string
          id: string
          name: string
          status: Database["public"]["Enums"]["chatbot_status"]
          updated_at: string
          video_config: Json | null
          video_type: string | null
          welcome_message: string
          widget_config: Json | null
          workspace_id: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_model?: string | null
          ai_prompt?: string | null
          chatbot_type?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          fallback_message?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["chatbot_status"]
          updated_at?: string
          video_config?: Json | null
          video_type?: string | null
          welcome_message?: string
          widget_config?: Json | null
          workspace_id: string
        }
        Update: {
          ai_enabled?: boolean
          ai_model?: string | null
          ai_prompt?: string | null
          chatbot_type?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          fallback_message?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["chatbot_status"]
          updated_at?: string
          video_config?: Json | null
          video_type?: string | null
          welcome_message?: string
          widget_config?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chatbots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          channel: string | null
          conversation_id: string
          created_at: string
          external_message_id: string | null
          id: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json | null
          platform_metadata: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Insert: {
          channel?: string | null
          conversation_id: string
          created_at?: string
          external_message_id?: string | null
          id?: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          platform_metadata?: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Update: {
          channel?: string | null
          conversation_id?: string
          created_at?: string
          external_message_id?: string | null
          id?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          platform_metadata?: Json | null
          sender?: Database["public"]["Enums"]["message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          channel: string | null
          chatbot_id: string
          ended_at: string | null
          id: string
          lead_captured: boolean
          started_at: string
          status: Database["public"]["Enums"]["conversation_status"]
          visitor_id: string
          visitor_info: Json | null
        }
        Insert: {
          assigned_agent_id?: string | null
          channel?: string | null
          chatbot_id: string
          ended_at?: string | null
          id?: string
          lead_captured?: boolean
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          visitor_id: string
          visitor_info?: Json | null
        }
        Update: {
          assigned_agent_id?: string | null
          channel?: string | null
          chatbot_id?: string
          ended_at?: string | null
          id?: string
          lead_captured?: boolean
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          visitor_id?: string
          visitor_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_funnels: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          steps: Json
          workspace_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          steps: Json
          workspace_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_funnels_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_funnels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active: boolean
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          additional_data: Json | null
          chatbot_id: string
          company: string | null
          conversation_id: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          value: number | null
          workspace_id: string
        }
        Insert: {
          additional_data?: Json | null
          chatbot_id: string
          company?: string | null
          conversation_id: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          value?: number | null
          workspace_id: string
        }
        Update: {
          additional_data?: Json | null
          chatbot_id?: string
          company?: string | null
          conversation_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          value?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          chatbot_id: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          timestamp: string
        }
        Insert: {
          chatbot_id: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          timestamp?: string
        }
        Update: {
          chatbot_id?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_notifications: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          message: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          message: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          chatbot_id: string | null
          conversation_id: string | null
          created_at: string
          id: number
          ip: string
        }
        Insert: {
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          ip: string
        }
        Update: {
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          ip?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          platform_notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_analytics: {
        Row: {
          chatbot_id: string
          completion_rate: number | null
          conversation_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_duration: number | null
          timestamp: string
          video_type: string
          video_url: string
          visitor_id: string | null
        }
        Insert: {
          chatbot_id: string
          completion_rate?: number | null
          conversation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_duration?: number | null
          timestamp?: string
          video_type: string
          video_url: string
          visitor_id?: string | null
        }
        Update: {
          chatbot_id?: string
          completion_rate?: number | null
          conversation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_duration?: number | null
          timestamp?: string
          video_type?: string
          video_url?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analytics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_heatmaps: {
        Row: {
          chatbot_id: string
          conversation_id: string | null
          created_at: string
          id: string
          interaction_data: Json
          video_url: string
          viewport_size: Json
          visitor_id: string | null
        }
        Insert: {
          chatbot_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          interaction_data: Json
          video_url: string
          viewport_size: Json
          visitor_id?: string | null
        }
        Update: {
          chatbot_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          interaction_data?: Json
          video_url?: string
          viewport_size?: Json
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_heatmaps_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_heatmaps_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_url: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ai_keys: {
        Row: {
          created_at: string
          openai_key: string
          openai_key_secret_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          openai_key: string
          openai_key_secret_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          openai_key?: string
          openai_key_secret_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ai_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_plan: {
        Row: {
          tier: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          tier?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          tier?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_plan_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          agency_name: string | null
          brand_color: string | null
          client_name: string | null
          created_at: string
          custom_domain: string | null
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string
          subscription_tier: string | null
          updated_at: string
          white_label_enabled: boolean | null
        }
        Insert: {
          agency_name?: string | null
          brand_color?: string | null
          client_name?: string | null
          created_at?: string
          custom_domain?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          subscription_tier?: string | null
          updated_at?: string
          white_label_enabled?: boolean | null
        }
        Update: {
          agency_name?: string | null
          brand_color?: string | null
          client_name?: string | null
          created_at?: string
          custom_domain?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          subscription_tier?: string | null
          updated_at?: string
          white_label_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_platform_owner_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      create_platform_owner: {
        Args: { email: string; full_name: string; password: string }
        Returns: string
      }
      delete_workspace_ai_key: {
        Args: { _workspace_id: string }
        Returns: undefined
      }
      get_avatar_widget_config: {
        Args: { _chatbot_id: string }
        Returns: {
          did_agent_id: string
          did_client_key: string
          id: string
          is_active: boolean
          name: string
          presenter_id: string
          voice_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_workspaces: {
        Args: { user_uuid: string }
        Returns: {
          workspace_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: { Args: { _workspace_id: string }; Returns: number }
      is_workspace_admin: {
        Args: { user_uuid: string; workspace_uuid: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { user_uuid: string; workspace_uuid: string }
        Returns: boolean
      }
      set_workspace_ai_key: {
        Args: { _key: string; _workspace_id: string }
        Returns: undefined
      }
      workspace_has_ai_key: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "platform_owner" | "user"
      chatbot_status: "draft" | "active" | "inactive"
      conversation_status: "active" | "ended" | "transferred_to_human"
      event_type:
        | "conversation_started"
        | "message_sent"
        | "lead_captured"
        | "bot_triggered"
      integration_type:
        | "zapier"
        | "hubspot"
        | "mailchimp"
        | "slack"
        | "facebook"
        | "whatsapp"
        | "email"
        | "facebook_messenger"
        | "whatsapp_business"
        | "webhook"
      knowledge_source_status: "processing" | "ready" | "error"
      knowledge_source_type: "text" | "file" | "url"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      message_sender: "bot" | "user" | "agent"
      message_type:
        | "text"
        | "image"
        | "file"
        | "form"
        | "button"
        | "youtube_video"
        | "uploaded_video"
        | "video_intro"
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
      app_role: ["platform_owner", "user"],
      chatbot_status: ["draft", "active", "inactive"],
      conversation_status: ["active", "ended", "transferred_to_human"],
      event_type: [
        "conversation_started",
        "message_sent",
        "lead_captured",
        "bot_triggered",
      ],
      integration_type: [
        "zapier",
        "hubspot",
        "mailchimp",
        "slack",
        "facebook",
        "whatsapp",
        "email",
        "facebook_messenger",
        "whatsapp_business",
        "webhook",
      ],
      knowledge_source_status: ["processing", "ready", "error"],
      knowledge_source_type: ["text", "file", "url"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      message_sender: ["bot", "user", "agent"],
      message_type: [
        "text",
        "image",
        "file",
        "form",
        "button",
        "youtube_video",
        "uploaded_video",
        "video_intro",
      ],
    },
  },
} as const
