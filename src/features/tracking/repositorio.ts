import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type Seguimiento = {
  negocio: string;
  slug: string;
  codigo: number;
  estado: EstadoPedido;
  creadoEn: Date;
  /** `codigo` solo viene después de correr ficha_producto.sql: sirve para dejar una reseña de cada producto */
  items: { nombre: string; cantidad: number; codigo?: number }[];
  modo: "retiro" | "propio" | "paquetera" | null;
  paquetera: string | null;
  guia: string | null;
};

/** Lo que un cliente puede ver de su pedido con el enlace. No lleva datos personales ni precios. */
export async function obtenerSeguimiento(supabase: Cliente, pedidoId: string): Promise<Seguimiento | null> {
  const { data, error } = await supabase.rpc("seguimiento_pedido", { p_pedido: pedidoId });
  if (error) throw error;
  const s = data[0];
  if (!s) return null;
  return {
    negocio: s.negocio,
    slug: s.slug,
    codigo: s.codigo,
    estado: s.estado as EstadoPedido,
    creadoEn: new Date(s.creado_en),
    items: s.items as { nombre: string; cantidad: number; codigo?: number }[],
    // La base restringe estos valores con un check.
    modo: s.modo as Seguimiento["modo"],
    paquetera: s.paquetera,
    guia: s.guia,
  };
}
