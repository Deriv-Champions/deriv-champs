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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_config: {
        Row: {
          ad_trigger_keywords: string[] | null
          agent_name: string
          created_at: string
          faqs: Json | null
          id: string
          initial_menu: Json | null
          lead_qualification_prompt: string | null
          onboarding_quiz: Json | null
          response_style: string | null
          system_prompt: string
          tone_voice: string | null
          updated_at: string
          welcome_instructions: string | null
        }
        Insert: {
          ad_trigger_keywords?: string[] | null
          agent_name?: string
          created_at?: string
          faqs?: Json | null
          id?: string
          initial_menu?: Json | null
          lead_qualification_prompt?: string | null
          onboarding_quiz?: Json | null
          response_style?: string | null
          system_prompt?: string
          tone_voice?: string | null
          updated_at?: string
          welcome_instructions?: string | null
        }
        Update: {
          ad_trigger_keywords?: string[] | null
          agent_name?: string
          created_at?: string
          faqs?: Json | null
          id?: string
          initial_menu?: Json | null
          lead_qualification_prompt?: string | null
          onboarding_quiz?: Json | null
          response_style?: string | null
          system_prompt?: string
          tone_voice?: string | null
          updated_at?: string
          welcome_instructions?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_online: boolean | null
          last_name: string
          message: string | null
          phone: string
          programme_id: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_online?: boolean | null
          last_name: string
          message?: string | null
          phone: string
          programme_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_online?: boolean | null
          last_name?: string
          message?: string | null
          phone?: string
          programme_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          status: string
          updated_at: string
          whatsapp_name: string | null
          whatsapp_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          whatsapp_name?: string | null
          whatsapp_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          whatsapp_name?: string | null
          whatsapp_phone?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          id: string
          pdf_path: string | null
          pdf_url: string | null
          report_date: string
          stats: Json | null
          title: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          pdf_path?: string | null
          pdf_url?: string | null
          report_date: string
          stats?: Json | null
          title: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          pdf_path?: string | null
          pdf_url?: string | null
          report_date?: string
          stats?: Json | null
          title?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          conversation_id: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          extracted_data: Json | null
          id: string
          lead_score: number | null
          name: string | null
          notes: string | null
          status: string
          training_interest: string | null
          updated_at: string
          whatsapp_phone: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          extracted_data?: Json | null
          id?: string
          lead_score?: number | null
          name?: string | null
          notes?: string | null
          status?: string
          training_interest?: string | null
          updated_at?: string
          whatsapp_phone: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          extracted_data?: Json | null
          id?: string
          lead_score?: number | null
          name?: string | null
          notes?: string | null
          status?: string
          training_interest?: string | null
          updated_at?: string
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
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
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          benefits: Json | null
          created_at: string | null
          curriculum: Json | null
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          level: string | null
          price: string | null
          spots: number | null
          spots_left: number | null
          status: string | null
          subtitle: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          curriculum?: Json | null
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          price?: string | null
          spots?: number | null
          spots_left?: number | null
          status?: string | null
          subtitle?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          curriculum?: Json | null
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          price?: string | null
          spots?: number | null
          spots_left?: number | null
          status?: string | null
          subtitle?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_requests: {
        Row: {
          created_at: string | null
          email: string | null
          experience: string | null
          first_name: string
          id: string
          interest: string | null
          last_name: string
          message: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          experience?: string | null
          first_name: string
          id?: string
          interest?: string | null
          last_name: string
          message?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          experience?: string | null
          first_name?: string
          id?: string
          interest?: string | null
          last_name?: string
          message?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
