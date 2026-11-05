import type { SupabaseClient } from "@supabase/supabase-js";
import { elegirCuenta, type Centavos } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { elegirTarjeta } from "./elegirCuenta";
import { cuentasDelNegocio, esCuentaDeSiempre, registrarCompraMercaderia, tarjetasDelNegocio } from "./repositorio";

/**
 * Lo que costó de verdad la mercadería: compra, envío, importación y otros. La mano de obra no sale de la caja:
 * es el tiempo de quien produce.
 */
export function plataDeCompra(costos: readonly { tipo: string; monto: Centavos }[], cantidad: number): Centavos {
  return costos.filter((c) => c.tipo !== "mano_obra").reduce((s, c) => s + c.monto, 0) * cantidad;
}

/**
 * Anota que se pagó una compra de mercadería, si la persona dijo de dónde salió el dinero (el id de una cuenta, el
 * lugar de siempre, que es la principal de ese tipo, o `tarjeta:<id>` si se pagó con una tarjeta). Nunca estorba lo que ya se guardó:
 * si falla, el producto igual quedó creado y el saldo se puede ajustar.
 */
export async function anotarCompra(
  supabase: SupabaseClient<Database>,
  negocioId: string,
  cuentaElegida: string | undefined | null,
  monto: Centavos,
  nota: string,
): Promise<void> {
  if (!cuentaElegida || monto <= 0) return;
  // Con tarjeta no sale de ninguna cuenta: sube lo que debés en la tarjeta
  if (cuentaElegida.startsWith("tarjeta:")) {
    const tarjeta = elegirTarjeta(await tarjetasDelNegocio(supabase, negocioId), cuentaElegida);
    if (tarjeta) await registrarCompraMercaderia(supabase, negocioId, { monto, tarjeta: tarjeta.id, nota: nota.slice(0, 120) });
    return;
  }
  const cuenta = elegirCuenta(await cuentasDelNegocio(supabase, negocioId), cuentaElegida);
  if (!cuenta) return;
  await registrarCompraMercaderia(supabase, negocioId, {
    monto,
    lugar: cuenta.tipo,
    cuenta: esCuentaDeSiempre(cuenta) ? undefined : cuenta.id,
    nota: nota.slice(0, 120),
  });
}
