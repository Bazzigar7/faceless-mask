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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asset_usage: {
        Row: {
          asset_id: string | null
          id: string
          session_id: string | null
          trigger_phrase: string | null
          triggered_at: string | null
        }
        Insert: {
          asset_id?: string | null
          id?: string
          session_id?: string | null
          trigger_phrase?: string | null
          triggered_at?: string | null
        }
        Update: {
          asset_id?: string | null
          id?: string
          session_id?: string | null
          trigger_phrase?: string | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_usage_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_usage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          added_by: string | null
          alt_text: string | null
          created_at: string | null
          id: string
          storage_path: string | null
          tags: string[] | null
          type: string
          url: string | null
        }
        Insert: {
          added_by?: string | null
          alt_text?: string | null
          created_at?: string | null
          id?: string
          storage_path?: string | null
          tags?: string[] | null
          type: string
          url?: string | null
        }
        Update: {
          added_by?: string | null
          alt_text?: string | null
          created_at?: string | null
          id?: string
          storage_path?: string | null
          tags?: string[] | null
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          college_id: string | null
          created_at: string | null
          current_strength: number | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
        }
        Insert: {
          college_id?: string | null
          created_at?: string | null
          current_strength?: number | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
        }
        Update: {
          college_id?: string | null
          created_at?: string | null
          current_strength?: number | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          city: string | null
          contact_dean: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          city?: string | null
          contact_dean?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          city?: string | null
          contact_dean?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          brief: Json | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          highlight_moments: Json | null
          id: string
          session_number: number | null
          summary: string | null
          topic: string
          track_id: string | null
          transcript: string | null
        }
        Insert: {
          brief?: Json | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          highlight_moments?: Json | null
          id?: string
          session_number?: number | null
          summary?: string | null
          topic: string
          track_id?: string | null
          transcript?: string | null
        }
        Update: {
          brief?: Json | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          highlight_moments?: Json | null
          id?: string
          session_number?: number | null
          summary?: string | null
          topic?: string
          track_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          total_sessions: number | null
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          total_sessions?: number | null
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          total_sessions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      turns: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
