import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { TipoMetodo } from "./mensajeCobro";

type Cliente = SupabaseClient<Database>;

export const TIPOS_METODO: TipoMetodo[] = ["transferencia", "billetera", "efectivo", "contra_entrega"];

export type MetodoPagoNegocio = { tipo: TipoMetodo; datos: string | null; activo: boolean };

export async function listarMetodos(supabase: Cliente, negocioId: string): Promise<MetodoPagoNegocio[]> {
  const { data, error } = await supabase
    .from("metodo_pago_negocio")
    .select("tipo, datos, activo")
    .eq("negocio_id", negocioId);
  if (error) throw error;
  return TIPOS_METODO.flatMap((tipo) => {
    const m = data.find((d) => d.tipo === tipo);
    return m ? [{ tipo, datos: m.datos, activo: m.activo }] : [];
  });
}

/** Solo la dueña puede guardar (lo exige RLS). Un método a la vez por tipo. */
export async function guardarMetodos(
  supabase: Cliente,
  negocioId: string,
  metodos: MetodoPagoNegocio[],
): Promise<boolean> {
  const { error } = await supabase.from("metodo_pago_negocio").upsert(
    metodos.map((m) => ({ negocio_id: negocioId, tipo: m.tipo, datos: m.datos, activo: m.activo })),
    { onConflict: "negocio_id,tipo" },
  );
  return !error;
}
