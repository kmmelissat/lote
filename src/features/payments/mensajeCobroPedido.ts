import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pedido } from "@/features/orders/repositorio";
import type { Database } from "@/lib/supabase/database.types";
import { textos } from "@/lib/textos";
import { armarMensajeCobro } from "./mensajeCobro";
import { listarMetodos } from "./repositorio";

/** El mensaje de cobro de un pedido, con los datos de pago activos del negocio. Lo usan el panel y el asistente. */
export async function mensajeDeCobro(
  supabase: SupabaseClient<Database>,
  negocioId: string,
  pedido: Pedido,
  ahora: Date,
): Promise<string> {
  const [metodos, { data: negocio }] = await Promise.all([
    listarMetodos(supabase, negocioId),
    supabase.from("negocio").select("nombre").eq("id", negocioId).single(),
  ]);
  return armarMensajeCobro({
    negocio: negocio?.nombre ?? textos.nombre,
    cliente: pedido.cliente,
    items: pedido.items,
    envio: pedido.envioCobrado,
    total: pedido.total,
    saldo: pedido.saldo,
    metodos: metodos.filter((m) => m.activo && m.tipo !== "contra_entrega"),
    venceEn: pedido.venceEn,
    ahora,
  });
}
