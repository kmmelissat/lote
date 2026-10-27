"use server";

import { revalidatePath } from "next/cache";
import type { EstadoPedido } from "@/domain";
import { cambiarEstadoPedido } from "@/features/orders/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const ESTADOS: EstadoPedido[] = ["pagado", "preparando", "enviado", "entregado", "cancelado"];

export async function cambiarEstado(
  pedidoId: string,
  estado: EstadoPedido,
): Promise<{ error?: string }> {
  const a = textos.pedidos.acciones;
  if (!ESTADOS.includes(estado)) return { error: a.errorGeneral };

  // Las transiciones válidas y el permiso los verifica cambiar_estado_pedido en la base.
  const { supabase } = await negocioActual();
  const r = await cambiarEstadoPedido(supabase, pedidoId, estado);
  if (!r.ok) {
    if (r.error.tipo === "sin_permiso") return { error: a.errorPermiso };
    if (r.error.tipo === "sin_disponibilidad") {
      return { error: r.error.quien ? textos.pedidos.form.yaApartado(r.error.quien) : textos.pedidos.form.sinUnidades };
    }
    return { error: a.errorGeneral };
  }

  revalidatePath("/", "layout");
  return {};
}
