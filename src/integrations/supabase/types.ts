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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      adaptive_ideas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module_id: string
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module_id: string
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          adapted_module_name: string | null
          adaptive_modules: Json | null
          category: string | null
          confusion_analysis_url: string | null
          confusion_data: Json | null
          created_at: string
          description: string | null
          english_audio_url: string | null
          english_video_url: string | null
          file_type: string | null
          file_url: string | null
          followup_questions_url: string | null
          id: string
          kpis: Json | null
          module_link: string | null
          objections: Json | null
          pdf_report_url: string | null
          perception: Json | null
          screenshot_url: string | null
          summary_text: string | null
          title: string
          trend: Json | null
          tweak_content_request: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          adapted_module_name?: string | null
          adaptive_modules?: Json | null
          category?: string | null
          confusion_analysis_url?: string | null
          confusion_data?: Json | null
          created_at?: string
          description?: string | null
          english_audio_url?: string | null
          english_video_url?: string | null
          file_type?: string | null
          file_url?: string | null
          followup_questions_url?: string | null
          id?: string
          kpis?: Json | null
          module_link?: string | null
          objections?: Json | null
          pdf_report_url?: string | null
          perception?: Json | null
          screenshot_url?: string | null
          summary_text?: string | null
          title: string
          trend?: Json | null
          tweak_content_request?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          adapted_module_name?: string | null
          adaptive_modules?: Json | null
          category?: string | null
          confusion_analysis_url?: string | null
          confusion_data?: Json | null
          created_at?: string
          description?: string | null
          english_audio_url?: string | null
          english_video_url?: string | null
          file_type?: string | null
          file_url?: string | null
          followup_questions_url?: string | null
          id?: string
          kpis?: Json | null
          module_link?: string | null
          objections?: Json | null
          pdf_report_url?: string | null
          perception?: Json | null
          screenshot_url?: string | null
          summary_text?: string | null
          title?: string
          trend?: Json | null
          tweak_content_request?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendation_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          recommendation_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          recommendation_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          recommendation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_files_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          content: string
          created_at: string
          id: string
          module_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          module_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          module_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          id: string
          module_id: string | null
          quantity: number | null
          request_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          module_id?: string | null
          quantity?: number | null
          request_type: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          module_id?: string | null
          quantity?: number | null
          request_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      tweak_requests: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          module_id: string | null
          notes: string | null
          question_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          notes?: string | null
          question_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          notes?: string | null
          question_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tweak_requests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweak_requests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tweakable_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tweakable_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          module_id: string | null
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id?: string | null
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id?: string | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      user_module_assignments: {
        Row: {
          assigned_at: string
          completed_at: string | null
          id: string
          module_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          module_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          module_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_module_assignments_module_id"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_admin: {
        Args: {
          user_email: string
          user_password: string
          user_username?: string
        }
        Returns: Json
      }
      is_admin_user: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
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
