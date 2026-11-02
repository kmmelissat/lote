import type { SupabaseClient } from "@supabase/supabase-js";
import { LUGARES_DE_DINERO, type Centavos, type LugarDeDinero } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { registrarCompraMercaderia } from "./repositorio";

export const lugarDeCompra = (valor: string | undefined | null): LugarDeDinero | null =>
  LUGARES_DE_DINERO.find((l) => l === valor) ?? null;

/**
 * Lo que costó de verdad la mercadería: compra, envío, importación y otros. La mano de obra no sale de la caja:
 * es el tiempo de quien produce.
 */
export function plataDeCompra(costos: readonly { tipo: string; monto: Centavos }[], cantidad: number): Centavos {
  return costos.filter((c) => c.tipo !== "mano_obra").reduce((s, c) => s + c.monto, 0) * cantidad;
}

/**
 * Anota que se pagó una compra de mercadería, si la persona dijo de dónde salió el dinero. Nunca estorba lo que ya se guardó:
 * si falla, el producto igual quedó creado y el saldo se puede ajustar.
 */
export async function anotarCompra(
  supabase: SupabaseClient<Database>,
  negocioId: string,
  lugar: string | undefined | null,
  monto: Centavos,
  nota: string,
): Promise<void> {
  const donde = lugarDeCompra(lugar);
  if (!donde || monto <= 0) return;
  await registrarCompraMercaderia(supabase, negocioId, { monto, lugar: donde, nota: nota.slice(0, 120) });
}
