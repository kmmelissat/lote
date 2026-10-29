import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type EstadoResena = "pendiente" | "publicada" | "oculta";

export type ResenaPanel = {
  id: string;
  nombre: string;
  estrellas: number;
  texto: string | null;
  origen: "cliente" | "tienda";
  estado: EstadoResena;
  creadoEn: Date;
  /** Del producto del que opinan; null si es de la tienda en general */
  producto: { codigo: number; nombre: string } | null;
};

/** Todas las reseñas del negocio, las pendientes primero. Si todavía no existe la tabla (falta ficha_producto.sql), no hay ninguna. */
export async function listarResenas(supabase: Cliente, negocioId: string): Promise<ResenaPanel[]> {
  try {
    const { data, error } = await supabase
      .from("resena")
      .select("id, nombre, estrellas, texto, origen, estado, creado_en, producto(codigo, nombre)")
      .eq("negocio_id", negocioId)
      .order("creado_en", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    const orden: Record<string, number> = { pendiente: 0, publicada: 1, oculta: 2 };
    return data
      .map((r) => ({
        id: r.id,
        nombre: r.nombre,
        estrellas: r.estrellas,
        texto: r.texto,
        origen: (r.origen === "tienda" ? "tienda" : "cliente") as ResenaPanel["origen"],
        estado: (r.estado === "publicada" || r.estado === "oculta" ? r.estado : "pendiente") as EstadoResena,
        creadoEn: new Date(r.creado_en),
        producto: r.producto ? { codigo: r.producto.codigo, nombre: r.producto.nombre } : null,
      }))
      .sort((a, b) => orden[a.estado] - orden[b.estado]);
  } catch {
    return [];
  }
}

/** Cuántas reseñas esperan que la tienda las revise. */
export async function contarPendientes(supabase: Cliente, negocioId: string): Promise<number> {
  try {
    const { count } = await supabase.from("resena").select("id", { count: "exact", head: true }).eq("negocio_id", negocioId).eq("estado", "pendiente");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function moderarResena(supabase: Cliente, id: string, estado: "publicada" | "oculta"): Promise<boolean> {
  const { error } = await supabase.rpc("resena_moderar", { p_id: id, p_estado: estado });
  return !error;
}

export async function eliminarResena(supabase: Cliente, id: string): Promise<boolean> {
  const { error } = await supabase.rpc("resena_eliminar", { p_id: id });
  return !error;
}

export async function agregarResena(
  supabase: Cliente,
  negocioId: string,
  r: { codigo: number | null; nombre: string; estrellas: number; texto: string },
): Promise<boolean> {
  const { error } = await supabase.rpc("resena_agregar", {
    p_negocio: negocioId,
    p_codigo: r.codigo as number,
    p_nombre: r.nombre,
    p_estrellas: r.estrellas,
    p_texto: r.texto,
  });
  return !error;
}
