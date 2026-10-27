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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      costo_producto: {
        Row: {
          id: string
          monto: number
          negocio_id: string
          por_unidad: boolean
          producto_id: string
          tipo: string
        }
        Insert: {
          id?: string
          monto: number
          negocio_id: string
          por_unidad?: boolean
          producto_id: string
          tipo: string
        }
        Update: {
          id?: string
          monto?: number
          negocio_id?: string
          por_unidad?: boolean
          producto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "costo_producto_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costo_producto_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
        ]
      }
      existencia: {
        Row: {
          cantidad: number
          negocio_id: string
          producto_id: string
          ubicacion_id: string
        }
        Insert: {
          cantidad?: number
          negocio_id: string
          producto_id: string
          ubicacion_id: string
        }
        Update: {
          cantidad?: number
          negocio_id?: string
          producto_id?: string
          ubicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "existencia_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "existencia_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "existencia_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicacion"
            referencedColumns: ["id"]
          },
        ]
      }
      miembro: {
        Row: {
          creado_en: string
          negocio_id: string
          numero_whatsapp: string | null
          rol: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          negocio_id: string
          numero_whatsapp?: string | null
          rol: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          negocio_id?: string
          numero_whatsapp?: string | null
          rol?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembro_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio: {
        Row: {
          apartar_desde_vitrina: boolean
          color: string | null
          creado_en: string
          id: string
          limite_apartados_por_contacto: number
          logo: string | null
          nombre: string
          plan: string
          plazo_apartado_horas: number
          siguiente_codigo: number
          slug: string
          umbral_poco_stock: number
          usuario_instagram: string | null
          whatsapp: string | null
        }
        Insert: {
          apartar_desde_vitrina?: boolean
          color?: string | null
          creado_en?: string
          id?: string
          limite_apartados_por_contacto?: number
          logo?: string | null
          nombre: string
          plan?: string
          plazo_apartado_horas?: number
          siguiente_codigo?: number
          slug: string
          umbral_poco_stock?: number
          usuario_instagram?: string | null
          whatsapp?: string | null
        }
        Update: {
          apartar_desde_vitrina?: boolean
          color?: string | null
          creado_en?: string
          id?: string
          limite_apartados_por_contacto?: number
          logo?: string | null
          nombre?: string
          plan?: string
          plazo_apartado_horas?: number
          siguiente_codigo?: number
          slug?: string
          umbral_poco_stock?: number
          usuario_instagram?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      producto: {
        Row: {
          categoria: string | null
          codigo: number
          codigo_barras: string | null
          condicion: string
          creado_en: string
          descripcion: string | null
          fotos: string[]
          id: string
          marca: string | null
          negocio_id: string
          nombre: string
          nota_condicion: string | null
          precio: number
        }
        Insert: {
          categoria?: string | null
          codigo: number
          codigo_barras?: string | null
          condicion?: string
          creado_en?: string
          descripcion?: string | null
          fotos?: string[]
          id?: string
          marca?: string | null
          negocio_id: string
          nombre: string
          nota_condicion?: string | null
          precio: number
        }
        Update: {
          categoria?: string | null
          codigo?: number
          codigo_barras?: string | null
          condicion?: string
          creado_en?: string
          descripcion?: string | null
          fotos?: string[]
          id?: string
          marca?: string | null
          negocio_id?: string
          nombre?: string
          nota_condicion?: string | null
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "producto_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      ubicacion: {
        Row: {
          es_principal: boolean
          id: string
          negocio_id: string
          nombre: string
          vendible_en_linea: boolean
        }
        Insert: {
          es_principal?: boolean
          id?: string
          negocio_id: string
          nombre: string
          vendible_en_linea?: boolean
        }
        Update: {
          es_principal?: boolean
          id?: string
          negocio_id?: string
          nombre?: string
          vendible_en_linea?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ubicacion_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_negocio: {
        Args: { p_nombre: string; p_slug: string; p_usuario_instagram?: string }
        Returns: string
      }
      crear_producto: {
        Args: {
          p_cantidad?: number
          p_categoria?: string
          p_condicion?: string
          p_costos?: Json
          p_descripcion?: string
          p_marca?: string
          p_negocio: string
          p_nombre: string
          p_precio: number
        }
        Returns: string
      }
      deshacer_importacion: { Args: { p_importacion: string }; Returns: number }
      importar_productos: {
        Args: { p_archivo: string; p_filas: Json; p_mapeo: Json; p_negocio: string }
        Returns: string
      }
      es_duena: { Args: { p_negocio: string }; Returns: boolean }
      es_miembro: { Args: { p_negocio: string }; Returns: boolean }
      puede_gestionar: { Args: { p_negocio: string }; Returns: boolean }
      reponer_producto: {
        Args: { p_llegan: number; p_nuevo_costo?: number; p_producto: string }
        Returns: undefined
      }
      rol_en: { Args: { p_negocio: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
