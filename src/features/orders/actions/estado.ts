"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import type { EstadoPedido } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { marcarListoParaRecoger } from "@/features/shipping/repositorio";
import { cambiarEstadoPedido, METODOS_DE_COBRO, registrarPago, saldoDelPedido, type MetodoPago } from "../repositorio";

const ESTADOS: EstadoPedido[] = ["preparando", "enviado", "entregado", "cancelado"];

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

  await rastrearAccion("pedido_estado_cambiado", { estado });
  revalidatePath("/", "layout");
  return {};
}

/** Con paquetera: avisa que el pedido ya está empacado y la paquetera puede pasar a recogerlo. */
export async function marcarListo(pedidoId: string): Promise<{ error?: string }> {
  const a = textos.pedidos.acciones;
  const { supabase } = await negocioActual();
  const r = await marcarListoParaRecoger(supabase, pedidoId, true);
  if (!r.ok) return { error: r.error === "sin_permiso" ? a.errorPermiso : a.errorGeneral };
  await rastrearAccion("pedido_listo_para_recoger");
  revalidatePath("/", "layout");
  return {};
}

/** "Marcar pagado" desde la lista: registra el saldo completo con el método elegido. */
export async function pagarCompleto(pedidoId: string, metodo: string): Promise<{ error?: string }> {
  const c = textos.pedidos.cobrar;
  if (!METODOS_DE_COBRO.includes(metodo as MetodoPago)) return { error: c.errorGeneral };

  // El permiso y que el monto no pase del saldo los verifica registrar_pago en la base.
  const { supabase } = await negocioActual();
  const saldo = await saldoDelPedido(supabase, pedidoId);
  if (saldo === null || saldo <= 0) return { error: c.errorGeneral };
  const r = await registrarPago(supabase, pedidoId, saldo, metodo as MetodoPago);
  if (!r.ok) {
    if (r.error.tipo === "sin_permiso") return { error: c.errorPermiso };
    if (r.error.tipo === "sin_disponibilidad") {
      return { error: r.error.quien ? textos.pedidos.form.yaApartado(r.error.quien) : textos.pedidos.form.sinUnidades };
    }
    return { error: c.errorGeneral };
  }

  await rastrearAccion("pago_registrado", { metodo, tipo: "completo" });
  revalidatePath("/", "layout");
  return {};
}
