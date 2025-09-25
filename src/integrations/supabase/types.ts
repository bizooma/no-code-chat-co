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
      chatbot_messages: {
        Row: {
          buttons: Json | null
          chatbot_id: string
          collect_lead_info: boolean
          conditions: Json | null
          created_at: string
          id: string
          message_key: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          next_message_key: string | null
          updated_at: string
        }
        Insert: {
          buttons?: Json | null
          chatbot_id: string
          collect_lead_info?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          message_key: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          next_message_key?: string | null
          updated_at?: string
        }
        Update: {
          buttons?: Json | null
          chatbot_id?: string
          collect_lead_info?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          message_key?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          next_message_key?: string | null
          updated_at?: string
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
          is_active: boolean
          name: string
          preview_image: string | null
          template_config: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          preview_image?: string | null
          template_config: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image?: string | null
          template_config?: Json
        }
        Relationships: []
      }
      chatbots: {
        Row: {
          ai_enabled: boolean
          ai_model: string | null
          ai_prompt: string | null
          created_at: string
          created_by: string
          description: string | null
          fallback_message: string
          id: string
          name: string
          status: Database["public"]["Enums"]["chatbot_status"]
          updated_at: string
          welcome_message: string
          widget_config: Json | null
          workspace_id: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_model?: string | null
          ai_prompt?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          fallback_message?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["chatbot_status"]
          updated_at?: string
          welcome_message?: string
          widget_config?: Json | null
          workspace_id: string
        }
        Update: {
          ai_enabled?: boolean
          ai_model?: string | null
          ai_prompt?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          fallback_message?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["chatbot_status"]
          updated_at?: string
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
          conversation_id: string
          created_at: string
          id: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
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
      workspaces: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
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
      is_workspace_member: {
        Args: { user_uuid: string; workspace_uuid: string }
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
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      message_sender: "bot" | "user" | "agent"
      message_type: "text" | "image" | "file" | "form" | "button"
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
      ],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      message_sender: ["bot", "user", "agent"],
      message_type: ["text", "image", "file", "form", "button"],
    },
  },
} as const
