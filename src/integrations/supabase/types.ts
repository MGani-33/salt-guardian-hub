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
      system_applications: {
        Row: {
          app_name: string
          category: string | null
          current_version: string
          id: string
          latest_version: string | null
          size: string | null
          system_id: string
          update_available: boolean | null
          updated_at: string
        }
        Insert: {
          app_name: string
          category?: string | null
          current_version: string
          id?: string
          latest_version?: string | null
          size?: string | null
          system_id: string
          update_available?: boolean | null
          updated_at?: string
        }
        Update: {
          app_name?: string
          category?: string | null
          current_version?: string
          id?: string
          latest_version?: string | null
          size?: string | null
          system_id?: string
          update_available?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_applications_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_hardware: {
        Row: {
          cpu_cores: number | null
          cpu_frequency: string | null
          cpu_model: string | null
          cpu_threads: number | null
          gpu_memory: string | null
          gpu_model: string | null
          id: string
          memory_total: string | null
          memory_type: string | null
          memory_used: string | null
          system_id: string
          updated_at: string
        }
        Insert: {
          cpu_cores?: number | null
          cpu_frequency?: string | null
          cpu_model?: string | null
          cpu_threads?: number | null
          gpu_memory?: string | null
          gpu_model?: string | null
          id?: string
          memory_total?: string | null
          memory_type?: string | null
          memory_used?: string | null
          system_id: string
          updated_at?: string
        }
        Update: {
          cpu_cores?: number | null
          cpu_frequency?: string | null
          cpu_model?: string | null
          cpu_threads?: number | null
          gpu_memory?: string | null
          gpu_model?: string | null
          id?: string
          memory_total?: string | null
          memory_type?: string | null
          memory_used?: string | null
          system_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_hardware_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_network: {
        Row: {
          id: string
          interface_name: string
          ip_address: string | null
          mac_address: string | null
          speed: string | null
          status: string | null
          system_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          interface_name: string
          ip_address?: string | null
          mac_address?: string | null
          speed?: string | null
          status?: string | null
          system_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          interface_name?: string
          ip_address?: string | null
          mac_address?: string | null
          speed?: string | null
          status?: string | null
          system_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_network_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_services: {
        Row: {
          description: string | null
          id: string
          service_name: string
          status: string
          system_id: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          service_name: string
          status: string
          system_id: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          service_name?: string
          status?: string
          system_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_services_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_storage: {
        Row: {
          device: string
          id: string
          mount_point: string | null
          size: string | null
          system_id: string
          type: string | null
          updated_at: string
          used: string | null
        }
        Insert: {
          device: string
          id?: string
          mount_point?: string | null
          size?: string | null
          system_id: string
          type?: string | null
          updated_at?: string
          used?: string | null
        }
        Update: {
          device?: string
          id?: string
          mount_point?: string | null
          size?: string | null
          system_id?: string
          type?: string | null
          updated_at?: string
          used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_storage_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          created_at: string
          hostname: string
          id: string
          ip_address: string
          last_seen: string
          os_type: string | null
          os_version: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          ip_address: string
          last_seen?: string
          os_type?: string | null
          os_version?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          ip_address?: string
          last_seen?: string
          os_type?: string | null
          os_version?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
