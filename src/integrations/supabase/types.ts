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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_content: string | null
          component_name: string | null
          config: Json | null
          course_id: string
          created_at: string | null
          custom_focus: string | null
          difficulty: string | null
          goal: string | null
          id: string
          length: string | null
          status: string | null
          steps: Json | null
          sub_component_name: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          activity_content?: string | null
          component_name?: string | null
          config?: Json | null
          course_id: string
          created_at?: string | null
          custom_focus?: string | null
          difficulty?: string | null
          goal?: string | null
          id?: string
          length?: string | null
          status?: string | null
          steps?: Json | null
          sub_component_name?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          activity_content?: string | null
          component_name?: string | null
          config?: Json | null
          course_id?: string
          created_at?: string | null
          custom_focus?: string | null
          difficulty?: string | null
          goal?: string | null
          id?: string
          length?: string | null
          status?: string | null
          steps?: Json | null
          sub_component_name?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_assessments: {
        Row: {
          activity_run_id: string
          assessment_data: Json
          chat_context: Json
          completed_at: string
          course_id: string
          cra_table: Json
          created_at: string
          id: string
          recommendations: Json | null
          soft_table: Json
          student_feedback: string | null
          student_id: string
          teacher_feedback: string | null
        }
        Insert: {
          activity_run_id: string
          assessment_data: Json
          chat_context: Json
          completed_at?: string
          course_id: string
          cra_table: Json
          created_at?: string
          id?: string
          recommendations?: Json | null
          soft_table: Json
          student_feedback?: string | null
          student_id: string
          teacher_feedback?: string | null
        }
        Update: {
          activity_run_id?: string
          assessment_data?: Json
          chat_context?: Json
          completed_at?: string
          course_id?: string
          cra_table?: Json
          created_at?: string
          id?: string
          recommendations?: Json | null
          soft_table?: Json
          student_feedback?: string | null
          student_id?: string
          teacher_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_assessments_activity_run_id_fkey"
            columns: ["activity_run_id"]
            isOneToOne: false
            referencedRelation: "activity_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_assignments: {
        Row: {
          activity_id: string
          assigned_at: string | null
          assigned_by: string
          due_date: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          activity_id: string
          assigned_at?: string | null
          assigned_by: string
          due_date?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          activity_id?: string
          assigned_at?: string | null
          assigned_by?: string
          due_date?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_assignments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_runs: {
        Row: {
          activity_id: string
          completed_at: string | null
          id: string
          messages: Json | null
          relaxation_time_ms: number | null
          response_time_ms: number | null
          started_at: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string | null
          id?: string
          messages?: Json | null
          relaxation_time_ms?: number | null
          response_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string | null
          id?: string
          messages?: Json | null
          relaxation_time_ms?: number | null
          response_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_runs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_runs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_files: {
        Row: {
          course_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          course_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          course_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cra_table: Json | null
          created_at: string | null
          description: string | null
          grade_level: string
          id: string
          status: string | null
          subcategory: string | null
          subject: string
          teacher_id: string
          teacher_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cra_table?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level: string
          id?: string
          status?: string | null
          subcategory?: string | null
          subject: string
          teacher_id: string
          teacher_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cra_table?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          status?: string | null
          subcategory?: string | null
          subject?: string
          teacher_id?: string
          teacher_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cra_snapshots: {
        Row: {
          ac_commentary: string | null
          area: string
          cl_percent: number
          course_id: string
          created_at: string | null
          id: string
          ks_component: string
          student_id: string
        }
        Insert: {
          ac_commentary?: string | null
          area: string
          cl_percent: number
          course_id: string
          created_at?: string | null
          id?: string
          ks_component: string
          student_id: string
        }
        Update: {
          ac_commentary?: string | null
          area?: string
          cl_percent?: number
          course_id?: string
          created_at?: string | null
          id?: string
          ks_component?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cra_snapshots_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cra_snapshots_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          profile_picture_url: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          profile_picture_url?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          profile_picture_url?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sra_snapshots: {
        Row: {
          commentary: string | null
          course_id: string
          created_at: string | null
          d_score: number
          dimension: string
          id: string
          level_percent: number
          m_score: number
          progression: string
          student_id: string
        }
        Insert: {
          commentary?: string | null
          course_id: string
          created_at?: string | null
          d_score: number
          dimension: string
          id?: string
          level_percent: number
          m_score: number
          progression: string
          student_id: string
        }
        Update: {
          commentary?: string | null
          course_id?: string
          created_at?: string | null
          d_score?: number
          dimension?: string
          id?: string
          level_percent?: number
          m_score?: number
          progression?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sra_snapshots_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sra_snapshots_student_id_fkey"
            columns: ["student_id"]
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      secure_update_profile: {
        Args: { p_full_name?: string; p_profile_picture_url?: string }
        Returns: undefined
      }
      user_can_view_course: {
        Args: { course_id: string; user_id: string }
        Returns: boolean
      }
      user_is_course_teacher: {
        Args: { course_id: string; user_id: string }
        Returns: boolean
      }
      user_is_enrolled_in_course: {
        Args: { course_id: string; user_id: string }
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
