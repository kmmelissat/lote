import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type CategoriaGasto, type Centavos, type MetodoMovimiento } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** Un gasto que se repite cada mes: la plantilla, no cada gasto que sale de ella. */
export type GastoFijo = {
  id: string;
  nombre: string;
  categoria: CategoriaGasto;
  monto: Centavos;
  metodo: MetodoMovimiento | null;
  /** La cuenta de donde sale; null = cada mes la principal de su método */
  cuenta: string | null;
  /** Día del mes en que toca; en los meses más cortos cae el último día */
  dia: number;
  activo: boolean;
};

export type NuevoGastoFijo = Omit<GastoFijo, "id" | "activo" | "cuenta"> & { id?: string; cuenta?: string };

/**
 * Los gastos fijos del negocio, los activos primero. Si todavía no se corrió gastos_fijos.sql la tabla no existe:
 * la pantalla sigue funcionando sin ellos en vez de romperse.
 * Se pide `*` para que la cuenta llegue si ya se corrió cuentas.sql y no rompa si no.
 */
export async function listarGastosFijos(supabase: Cliente, negocioId: string): Promise<GastoFijo[]> {
  const { data, error } = await supabase
    .from("gasto_fijo")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("activo", { ascending: false })
    .order("dia_del_mes")
    .order("nombre");
  if (error) return [];
  return data.map((g) => {
    const metodo = g.metodo === "efectivo" || g.metodo === "transferencia" ? g.metodo : null;
    return {
      id: g.id,
      nombre: g.nombre,
      categoria: g.categoria as CategoriaGasto,
      monto: aCentavos(g.monto),
      metodo,
      cuenta: metodo ? (g.cuenta_id ?? null) : null,
      dia: g.dia_del_mes,
      activo: g.activo,
    };
  });
}

/** Crea el gasto fijo, o lo corrige si trae `id`. `hoy` es la fecha local: desde ahí cuenta. */
export async function guardarGastoFijo(supabase: Cliente, negocioId: string, g: NuevoGastoFijo, hoy: string): Promise<boolean> {
  const { error } = await supabase.rpc("guardar_gasto_fijo", {
    p_negocio: negocioId,
    p_id: g.id ?? null,
    p_nombre: g.nombre,
    p_categoria: g.categoria,
    p_monto: g.monto / 100,
    p_dia: g.dia,
    ...(g.metodo ? { p_metodo: g.metodo } : {}),
    p_hoy: hoy,
    ...(g.metodo && g.cuenta ? { p_cuenta: g.cuenta } : {}),
  });
  return !error;
}

export async function cambiarGastoFijoActivo(supabase: Cliente, id: string, activo: boolean, hoy: string): Promise<boolean> {
  const { error } = await supabase.rpc("cambiar_gasto_fijo_activo", { p_id: id, p_activo: activo, p_hoy: hoy });
  return !error;
}

export async function eliminarGastoFijo(supabase: Cliente, id: string): Promise<boolean> {
  const { error } = await supabase.rpc("eliminar_gasto_fijo", { p_id: id });
  return !error;
}

/**
 * Registra los gastos fijos que ya tocaron y todavía no están. Se llama antes de calcular la ganancia, así que no
 * puede romper la pantalla: sin la tabla, sin permiso o sin red, simplemente no registra nada.
 */
export async function aplicarGastosFijos(supabase: Cliente, negocioId: string, hoy: string): Promise<number> {
  const { data, error } = await supabase.rpc("aplicar_gastos_fijos", { p_negocio: negocioId, p_hoy: hoy });
  return error ? 0 : (data ?? 0);
}
