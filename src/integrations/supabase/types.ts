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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          created_at: string
          cuit: string | null
          direccion: string | null
          email: string | null
          id: string
          limite_credito: number
          lista_precio: string
          localidad: string | null
          nombre: string
          notas: string | null
          provincia: string | null
          razon_social: string | null
          saldo: number
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number
          lista_precio?: string
          localidad?: string | null
          nombre: string
          notas?: string | null
          provincia?: string | null
          razon_social?: string | null
          saldo?: number
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number
          lista_precio?: string
          localidad?: string | null
          nombre?: string
          notas?: string | null
          provincia?: string | null
          razon_social?: string | null
          saldo?: number
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compra_items: {
        Row: {
          cantidad: number
          compra_id: string
          costo_unitario: number
          created_at: string
          id: string
          nombre_producto: string
          producto_id: string | null
          subtotal: number
        }
        Insert: {
          cantidad?: number
          compra_id: string
          costo_unitario?: number
          created_at?: string
          id?: string
          nombre_producto: string
          producto_id?: string | null
          subtotal?: number
        }
        Update: {
          cantidad?: number
          compra_id?: string
          costo_unitario?: number
          created_at?: string
          id?: string
          nombre_producto?: string
          producto_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          comprobante: string | null
          created_at: string
          estado: Database["public"]["Enums"]["compra_estado"]
          fecha: string
          id: string
          observaciones: string | null
          proveedor_id: string
          total: number
          updated_at: string
        }
        Insert: {
          comprobante?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["compra_estado"]
          fecha?: string
          id?: string
          observaciones?: string | null
          proveedor_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          comprobante?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["compra_estado"]
          fecha?: string
          id?: string
          observaciones?: string | null
          proveedor_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_cc: {
        Row: {
          cliente_id: string
          concepto: string
          created_at: string
          fecha: string
          id: string
          metodo_pago: string | null
          monto: number
          pedido_id: string | null
          referencia: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Insert: {
          cliente_id: string
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto: number
          pedido_id?: string | null
          referencia?: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Update: {
          cliente_id?: string
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          pedido_id?: string | null
          referencia?: string | null
          tipo?: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_cc_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_cc_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          nombre_producto: string
          pedido_id: string
          precio_unitario: number
          producto_id: string | null
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          nombre_producto: string
          pedido_id: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          nombre_producto?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          descuento: number
          estado: Database["public"]["Enums"]["pedido_estado"]
          fecha_entrega: string | null
          id: string
          numero: number
          observaciones: string | null
          subtotal: number
          total: number
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descuento?: number
          estado?: Database["public"]["Enums"]["pedido_estado"]
          fecha_entrega?: string | null
          id?: string
          numero?: number
          observaciones?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descuento?: number
          estado?: Database["public"]["Enums"]["pedido_estado"]
          fecha_entrega?: string | null
          id?: string
          numero?: number
          observaciones?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string | null
          codigo: string | null
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          iva: number
          marca: string | null
          nombre: string
          precio_costo: number
          precio_venta: number
          proveedor_id: string | null
          stock: number
          stock_minimo: number
          unidad: string
          unidades_por_bulto: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          iva?: number
          marca?: string | null
          nombre: string
          precio_costo?: number
          precio_venta?: number
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
          unidades_por_bulto?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          iva?: number
          marca?: string | null
          nombre?: string
          precio_costo?: number
          precio_venta?: number
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
          unidades_por_bulto?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cliente_fk"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          contacto: string | null
          created_at: string
          cuit: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          razon_social: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          razon_social?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          razon_social?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_pedido: {
        Args: { p_cliente_id: string; p_items: Json; p_observaciones?: string }
        Returns: {
          numero: number
          pedido_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_cliente_id: { Args: never; Returns: string }
      recibir_compra: { Args: { p_compra_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "cliente"
      compra_estado: "pendiente" | "recibida" | "cancelada"
      movimiento_tipo: "debe" | "haber"
      pedido_estado:
        | "borrador"
        | "pendiente"
        | "preparacion"
        | "entregado"
        | "cancelado"
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
      app_role: ["admin", "vendedor", "cliente"],
      compra_estado: ["pendiente", "recibida", "cancelada"],
      movimiento_tipo: ["debe", "haber"],
      pedido_estado: [
        "borrador",
        "pendiente",
        "preparacion",
        "entregado",
        "cancelado",
      ],
    },
  },
} as const
