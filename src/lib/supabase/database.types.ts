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
      accion: {
        Row: {
          canal: string
          creada_en: string
          id: string
          intencion: string
          mensaje_id: string
          negocio_id: string
          parametros: Json | null
          respuesta: string | null
          resultado: Json | null
          revertida: boolean
          usuario_id: string | null
        }
        Insert: {
          canal?: string
          creada_en?: string
          id?: string
          intencion: string
          mensaje_id: string
          negocio_id: string
          parametros?: Json | null
          respuesta?: string | null
          resultado?: Json | null
          revertida?: boolean
          usuario_id?: string | null
        }
        Update: {
          canal?: string
          creada_en?: string
          id?: string
          intencion?: string
          mensaje_id?: string
          negocio_id?: string
          parametros?: Json | null
          respuesta?: string | null
          resultado?: Json | null
          revertida?: boolean
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accion_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      aviso: {
        Row: {
          clave: string
          creado_en: string
          enviado_en: string | null
          estado: string
          id: string
          intentos: number
          mensaje_externo: string | null
          motivo: string | null
          negocio_id: string
          parametros: Json
          programado_para: string
          telefono: string
          tipo: string
        }
        Insert: {
          clave: string
          creado_en?: string
          enviado_en?: string | null
          estado?: string
          id?: string
          intentos?: number
          mensaje_externo?: string | null
          motivo?: string | null
          negocio_id: string
          parametros?: Json
          programado_para?: string
          telefono: string
          tipo: string
        }
        Update: {
          clave?: string
          creado_en?: string
          enviado_en?: string | null
          estado?: string
          id?: string
          intentos?: number
          mensaje_externo?: string | null
          motivo?: string | null
          negocio_id?: string
          parametros?: Json
          programado_para?: string
          telefono?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aviso_tipo_fkey"
            columns: ["tipo"]
            isOneToOne: false
            referencedRelation: "plantilla_whatsapp"
            referencedColumns: ["nombre"]
          },
        ]
      }
      cliente: {
        Row: {
          acepta_whatsapp: boolean
          contacto: string | null
          creado_en: string
          id: string
          negocio_id: string
          nombre: string
          notas: string | null
        }
        Insert: {
          acepta_whatsapp?: boolean
          contacto?: string | null
          creado_en?: string
          id?: string
          negocio_id: string
          nombre: string
          notas?: string | null
        }
        Update: {
          acepta_whatsapp?: boolean
          contacto?: string | null
          creado_en?: string
          id?: string
          negocio_id?: string
          nombre?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
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
      envio: {
        Row: {
          actualizado_en: string
          costo_real: number
          departamento: string | null
          direccion: string | null
          guia: string | null
          modo: string
          municipio: string | null
          negocio_id: string
          nombre: string | null
          paga: string
          paquetera: string | null
          pedido_id: string
          referencia: string | null
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          costo_real?: number
          departamento?: string | null
          direccion?: string | null
          guia?: string | null
          modo: string
          municipio?: string | null
          negocio_id: string
          nombre?: string | null
          paga?: string
          paquetera?: string | null
          pedido_id: string
          referencia?: string | null
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          costo_real?: number
          departamento?: string | null
          direccion?: string | null
          guia?: string | null
          modo?: string
          municipio?: string | null
          negocio_id?: string
          nombre?: string | null
          paga?: string
          paquetera?: string | null
          pedido_id?: string
          referencia?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envio_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: true
            referencedRelation: "pedido"
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
      importacion: {
        Row: {
          archivo: string | null
          creado_en: string
          filas_creadas: number
          id: string
          mapeo: Json | null
          negocio_id: string
          revertida: boolean
          usuario_id: string | null
        }
        Insert: {
          archivo?: string | null
          creado_en?: string
          filas_creadas?: number
          id?: string
          mapeo?: Json | null
          negocio_id: string
          revertida?: boolean
          usuario_id?: string | null
        }
        Update: {
          archivo?: string | null
          creado_en?: string
          filas_creadas?: number
          id?: string
          mapeo?: Json | null
          negocio_id?: string
          revertida?: boolean
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "importacion_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      intento_publico: {
        Row: {
          creado_en: string
          huella: string
          id: number
        }
        Insert: {
          creado_en?: string
          huella: string
          id?: never
        }
        Update: {
          creado_en?: string
          huella?: string
          id?: never
        }
        Relationships: []
      }
      metodo_pago_negocio: {
        Row: {
          activo: boolean
          datos: string | null
          id: string
          negocio_id: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          datos?: string | null
          id?: string
          negocio_id: string
          tipo: string
        }
        Update: {
          activo?: boolean
          datos?: string | null
          id?: string
          negocio_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "metodo_pago_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
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
          siguiente_pedido: number
          slug: string
          tarifa_envio_defecto: number
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
          siguiente_pedido?: number
          slug: string
          tarifa_envio_defecto?: number
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
          siguiente_pedido?: number
          slug?: string
          tarifa_envio_defecto?: number
          umbral_poco_stock?: number
          usuario_instagram?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      pago: {
        Row: {
          comprobante: string | null
          creado_en: string
          fecha: string
          id: string
          metodo: string
          monto: number
          negocio_id: string
          pedido_id: string
          usuario_id: string | null
        }
        Insert: {
          comprobante?: string | null
          creado_en?: string
          fecha?: string
          id?: string
          metodo: string
          monto: number
          negocio_id: string
          pedido_id: string
          usuario_id?: string | null
        }
        Update: {
          comprobante?: string | null
          creado_en?: string
          fecha?: string
          id?: string
          metodo?: string
          monto?: number
          negocio_id?: string
          pedido_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pago_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido: {
        Row: {
          atendido_por: string | null
          canal: string
          cliente_id: string | null
          codigo: number
          contra_entrega: boolean
          creado_en: string
          descuento: number
          envio_absorbido: number
          envio_cobrado: number
          estado: string
          id: string
          negocio_id: string
          origen: string
          saldo: number
          total: number
          vence_en: string | null
        }
        Insert: {
          atendido_por?: string | null
          canal: string
          cliente_id?: string | null
          codigo: number
          contra_entrega?: boolean
          creado_en?: string
          descuento?: number
          envio_absorbido?: number
          envio_cobrado?: number
          estado?: string
          id?: string
          negocio_id: string
          origen?: string
          saldo?: number
          total?: number
          vence_en?: string | null
        }
        Update: {
          atendido_por?: string | null
          canal?: string
          cliente_id?: string | null
          codigo?: number
          contra_entrega?: boolean
          creado_en?: string
          descuento?: number
          envio_absorbido?: number
          envio_cobrado?: number
          estado?: string
          id?: string
          negocio_id?: string
          origen?: string
          saldo?: number
          total?: number
          vence_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      gasto: {
        Row: {
          categoria: string
          creado_en: string
          creado_por: string | null
          fecha: string
          id: string
          monto: number
          negocio_id: string
          nota: string | null
          pedido_id: string | null
          recurrente: boolean
        }
        Insert: {
          categoria: string
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          id?: string
          monto: number
          negocio_id: string
          nota?: string | null
          pedido_id?: string | null
          recurrente?: boolean
        }
        Update: {
          categoria?: string
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          id?: string
          monto?: number
          negocio_id?: string
          nota?: string | null
          pedido_id?: string | null
          recurrente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gasto_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_item: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          id: string
          negocio_id: string
          pedido_id: string
          precio_final: number
          producto_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          id?: string
          negocio_id: string
          pedido_id: string
          precio_final: number
          producto_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          id?: string
          negocio_id?: string
          pedido_id?: string
          precio_final?: number
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_item_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_item_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_item_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
        ]
      }
      plantilla_whatsapp: {
        Row: {
          actualizada_en: string
          estado_aprobacion: string
          nombre: string
        }
        Insert: {
          actualizada_en?: string
          estado_aprobacion?: string
          nombre: string
        }
        Update: {
          actualizada_en?: string
          estado_aprobacion?: string
          nombre?: string
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
          importacion_id: string | null
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
          importacion_id?: string | null
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
          importacion_id?: string | null
          marca?: string | null
          negocio_id?: string
          nombre?: string
          nota_condicion?: string | null
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "producto_importacion_id_fkey"
            columns: ["importacion_id"]
            isOneToOne: false
            referencedRelation: "importacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifa_envio: {
        Row: {
          departamento: string
          negocio_id: string
          precio: number
        }
        Insert: {
          departamento: string
          negocio_id: string
          precio: number
        }
        Update: {
          departamento?: string
          negocio_id?: string
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifa_envio_negocio_id_fkey"
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
      unidades_del_negocio: {
        Args: { p_negocio: string }
        Returns: { cantidad: number; apartadas: number; vendidas: number }[]
      }
      cambiar_estado_pedido: {
        Args: { p_estado: string; p_pedido: string }
        Returns: undefined
      }
      crear_negocio: {
        Args: { p_nombre: string; p_slug: string; p_usuario_instagram?: string }
        Returns: string
      }
      cerrar_accion: {
        Args: { p_accion: string; p_respuesta: string; p_resultado: Json }
        Returns: undefined
      }
      deshacer_accion: { Args: { p_accion: string }; Returns: string }
      iniciar_accion: {
        Args: {
          p_canal: string
          p_intencion: string
          p_mensaje_id: string
          p_negocio: string
          p_parametros: Json
        }
        Returns: Json
      }
      registrar_guia: {
        Args: { p_guia: string; p_paquetera: string; p_pedido: string }
        Returns: undefined
      }
      apartar_desde_vitrina: {
        Args: {
          p_acepta_whatsapp: boolean
          p_cantidad: number
          p_codigo: number
          p_contacto: string
          p_huella: string
          p_nombre: string
          p_slug: string
        }
        Returns: Json
      }
      crear_pedido_interno: {
        Args: {
          p_acepta_whatsapp?: boolean
          p_canal: string
          p_cliente: string
          p_contacto: string
          p_items: Json
          p_metodo: string
          p_negocio: string
          p_origen: string
          p_tipo: string
          p_usuario: string
        }
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
      disponibles_de: { Args: { p_producto: string }; Returns: number }
      es_duena: { Args: { p_negocio: string }; Returns: boolean }
      es_miembro: { Args: { p_negocio: string }; Returns: boolean }
      guardar_envio: {
        Args: {
          p_absorbido: number
          p_cobrado: number
          p_costo: number
          p_departamento: string
          p_direccion: string
          p_guia: string
          p_modo: string
          p_municipio: string
          p_nombre: string
          p_paga: string
          p_paquetera: string
          p_pedido: string
          p_referencia: string
          p_telefono: string
        }
        Returns: undefined
      }
      importar_productos: {
        Args: {
          p_archivo: string
          p_filas: Json
          p_mapeo: Json
          p_negocio: string
        }
        Returns: string
      }
      marcar_contra_entrega: {
        Args: { p_pedido: string; p_valor: boolean }
        Returns: undefined
      }
      puede_gestionar: { Args: { p_negocio: string }; Returns: boolean }
      puede_vender: { Args: { p_negocio: string }; Returns: boolean }
      quien_tiene_apartado: { Args: { p_producto: string }; Returns: string }
      registrar_pago: {
        Args: { p_fecha?: string; p_metodo: string; p_monto: number; p_pedido: string }
        Returns: undefined
      }
      registrar_pedido: {
        Args: {
          p_canal: string
          p_cliente: string
          p_items: Json
          p_metodo?: string
          p_negocio: string
          p_tipo: string
        }
        Returns: string
      }
      registrar_gasto: {
        Args: {
          p_categoria: string
          p_fecha?: string
          p_monto: number
          p_negocio: string
          p_nota?: string
          p_pedido?: string
        }
        Returns: string
      }
      cerrar_aviso: {
        Args: {
          p_aviso: string
          p_espera?: string
          p_estado: string
          p_mensaje_externo?: string
          p_motivo?: string
          p_reintentar?: boolean
        }
        Returns: undefined
      }
      encolar_aviso: {
        Args: {
          p_clave: string
          p_negocio: string
          p_parametros: Json
          p_programado_para?: string
          p_telefono: string
          p_tipo: string
        }
        Returns: string
      }
      tomar_avisos: {
        Args: { p_limite?: number }
        Returns: {
          id: string
          negocio_id: string
          parametros: Json
          plantilla_aprobada: boolean
          programado_para: string
          telefono: string
          tipo: string
        }[]
      }
      generar_avisos_del_tiempo: {
        Args: { p_horas_frio?: number }
        Returns: number
      }
      encolar_aviso_servicio: {
        Args: {
          p_clave: string
          p_negocio: string
          p_parametros: Json
          p_programado_para?: string
          p_telefono: string
          p_tipo: string
        }
        Returns: string
      }
      ventas_del_periodo_servicio: {
        Args: { p_desde: string; p_hasta: string; p_negocio: string }
        Returns: {
          cantidad: number
          costo_unitario: number | null
          descuento: number
          envio_absorbido: number
          nombre: string
          pedido_id: string
          precio_final: number
          producto_id: string
        }[]
      }
      eliminar_gasto: { Args: { p_gasto: string }; Returns: undefined }
      ventas_del_periodo: {
        Args: { p_desde: string; p_hasta: string; p_negocio: string }
        Returns: {
          cantidad: number
          costo_unitario: number | null
          descuento: number
          envio_absorbido: number
          nombre: string
          pedido_id: string
          precio_final: number
          producto_id: string
        }[]
      }
      reponer_producto: {
        Args: { p_llegan: number; p_nuevo_costo?: number; p_producto: string }
        Returns: undefined
      }
      vencer_apartados: { Args: never; Returns: number }
      verificar_retencion_pedido: { Args: { p_pedido: string }; Returns: undefined }
      rol_en: { Args: { p_negocio: string }; Returns: string }
      vitrina_apartado: {
        Args: { p_pedido: string; p_slug: string }
        Returns: {
          codigo: number
          estado: string
          items: Json
          metodos: Json
          negocio: string
          saldo: number
          total: number
          vence_en: string
        }[]
      }
      vitrina_negocio: {
        Args: { p_slug: string }
        Returns: {
          apartar_desde_vitrina: boolean
          color: string
          logo: string
          nombre: string
          plazo_apartado_horas: number
          usuario_instagram: string
          whatsapp: string
        }[]
      }
      vitrina_productos: {
        Args: { p_codigo?: number; p_slug: string }
        Returns: {
          apartado: boolean
          categoria: string
          codigo: number
          condicion: string
          descripcion: string
          disponibles: number
          fotos: string[]
          marca: string
          nombre: string
          precio: number
        }[]
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
