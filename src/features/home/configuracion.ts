import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** Lo que ya está configurado y no se deduce de los productos ni de los pedidos. Solo lo pide quien gestiona. */
export type Configuracion = { tieneEnvios: boolean; tieneContacto: boolean };

export async function leerConfiguracion(supabase: Cliente, negocioId: string): Promise<Configuracion> {
  const [tarifas, negocio, facebook, tiktok] = await Promise.all([
    supabase.from("tarifa_envio").select("departamento", { count: "exact", head: true }).eq("negocio_id", negocioId),
    supabase.from("negocio").select("whatsapp, usuario_instagram, tarifa_envio_defecto, direccion_retiro").eq("id", negocioId).single(),
    // Aparte: sin facebook.sql ni tiktok.sql las columnas no existen y cuentan como vacías
    supabase.from("negocio").select("usuario_facebook").eq("id", negocioId).maybeSingle(),
    supabase.from("negocio").select("usuario_tiktok").eq("id", negocioId).maybeSingle(),
  ]);
  if (tarifas.error) throw tarifas.error;
  if (negocio.error) throw negocio.error;
  const n = negocio.data;
  return {
    tieneEnvios: (tarifas.count ?? 0) > 0 || n.tarifa_envio_defecto > 0 || Boolean(n.direccion_retiro),
    tieneContacto: Boolean(n.whatsapp || n.usuario_instagram || facebook.data?.usuario_facebook || tiktok.data?.usuario_tiktok),
  };
}
