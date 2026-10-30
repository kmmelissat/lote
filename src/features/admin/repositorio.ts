import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** ¿La sesión es de la admin de Lote? Lo decide la base (es_admin), no la app. */
export async function esAdmin(supabase: Cliente): Promise<boolean> {
  const { data } = await supabase.rpc("es_admin");
  return data === true;
}

export type ProductoAdmin = {
  productoId: string;
  tiendaSlug: string;
  tiendaNombre: string;
  codigo: number;
  nombre: string;
  foto: string | null;
  precio: Centavos;
  destacado: boolean;
  estrellas: number | null;
  resenas: number;
};

/** Lo que está en el Marketplace, los destacados primero. null si todavía falta su SQL. */
export async function productosAdmin(supabase: Cliente, busqueda?: string): Promise<ProductoAdmin[] | null> {
  const { data, error } = await supabase.rpc("admin_productos", { p_busqueda: busqueda?.trim() || undefined });
  if (error) return null;
  return data.map((p) => ({
    productoId: p.producto_id,
    tiendaSlug: p.tienda_slug,
    tiendaNombre: p.tienda_nombre,
    codigo: p.codigo,
    nombre: p.nombre,
    foto: p.foto,
    precio: aCentavos(p.precio),
    destacado: p.destacado,
    estrellas: p.estrellas,
    resenas: p.resenas,
  }));
}

export async function destacar(supabase: Cliente, productoId: string, si: boolean): Promise<boolean> {
  const { error } = await supabase.rpc("admin_destacar", { p_producto: productoId, p_destacar: si });
  return !error;
}
