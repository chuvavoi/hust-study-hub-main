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
  public: {
    Tables: {
      ad_watch_sessions: {
        Row: {
          book_id: string
          created_at: string
          granted_until: string
          id: string
          pages_granted: number
          token: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          granted_until: string
          id?: string
          pages_granted?: number
          token: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          granted_until?: string
          id?: string
          pages_granted?: number
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_watch_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_pages: {
        Row: {
          book_id: string
          content: string
          id: string
          page_number: number
        }
        Insert: {
          book_id: string
          content: string
          id?: string
          page_number: number
        }
        Update: {
          book_id?: string
          content?: string
          id?: string
          page_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          course_codes: string[]
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          physical_stock: number
          price: number
          school: Database["public"]["Enums"]["hust_school"]
          title: string
          total_pages: number
          type: Database["public"]["Enums"]["book_type"]
        }
        Insert: {
          author: string
          course_codes?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          physical_stock?: number
          price?: number
          school?: Database["public"]["Enums"]["hust_school"]
          title: string
          total_pages?: number
          type?: Database["public"]["Enums"]["book_type"]
        }
        Update: {
          author?: string
          course_codes?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          physical_stock?: number
          price?: number
          school?: Database["public"]["Enums"]["hust_school"]
          title?: string
          total_pages?: number
          type?: Database["public"]["Enums"]["book_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          school: Database["public"]["Enums"]["hust_school"]
          student_email: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          school?: Database["public"]["Enums"]["hust_school"]
          student_email?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          school?: Database["public"]["Enums"]["hust_school"]
          student_email?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          book_id: string
          created_at: string
          end_date: string | null
          id: string
          pickup_location: string | null
          qr_code: string | null
          start_date: string
          status: Database["public"]["Enums"]["rental_status"]
          type: Database["public"]["Enums"]["rental_type"]
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          pickup_location?: string | null
          qr_code?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rental_status"]
          type: Database["public"]["Enums"]["rental_type"]
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          pickup_location?: string | null
          qr_code?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rental_status"]
          type?: Database["public"]["Enums"]["rental_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
      book_type: "online" | "offline" | "both"
      hust_school:
        | "SoICT"
        | "SEEE"
        | "SME"
        | "SET"
        | "SChEM"
        | "SMSE"
        | "SBME"
        | "SAME"
        | "FoMath"
        | "FoPhysics"
        | "SEE"
        | "Other"
      rental_status:
        | "active"
        | "expired"
        | "pending_pickup"
        | "picked_up"
        | "cancelled"
      rental_type: "online" | "offline"
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
      book_type: ["online", "offline", "both"],
      hust_school: [
        "SoICT",
        "SEEE",
        "SME",
        "SET",
        "SChEM",
        "SMSE",
        "SBME",
        "SAME",
        "FoMath",
        "FoPhysics",
        "SEE",
        "Other",
      ],
      rental_status: [
        "active",
        "expired",
        "pending_pickup",
        "picked_up",
        "cancelled",
      ],
      rental_type: ["online", "offline"],
    },
  },
} as const
