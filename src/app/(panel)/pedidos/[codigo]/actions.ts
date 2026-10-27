"use server";

import { revalidatePath } from "next/cache";
import { leerDolares, type EstadoPedido } from "@/domain";
import {
  cambiarEstadoPedido,
  marcarContraEntrega,
  registrarPago,
  type ErrorPedido,
  type MetodoPago,
} from "@/features/orders/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const METODOS: MetodoPago[] = ["transferencia", "billetera", "efectivo"];

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

  revalidatePath("/", "layout");
  return {};
}

export type EstadoPago = { error?: string; listo?: string };

function textoDeError(e: ErrorPedido): string {
  const c = textos.pedidos.cobrar;
  switch (e.tipo) {
    case "monto_invalido":
      return c.errorMonto;
    case "sin_permiso":
      return c.errorPermiso;
    case "sin_disponibilidad":
      return e.quien ? textos.pedidos.form.yaApartado(e.quien) : textos.pedidos.form.sinUnidades;
    default:
      return c.errorGeneral;
  }
}

// Pago completo o abono. Que el monto no pase del saldo y el permiso los verifica registrar_pago.
export async function pagar(
  pedidoId: string,
  _anterior: EstadoPago,
  formData: FormData,
): Promise<EstadoPago> {
  const c = textos.pedidos.cobrar;
  const monto = leerDolares(String(formData.get("monto") ?? ""));
  const metodo = String(formData.get("metodo") ?? "") as MetodoPago;
  if (monto === null || monto <= 0 || !METODOS.includes(metodo)) return { error: c.errorMonto };

  const { supabase } = await negocioActual();
  const r = await registrarPago(supabase, pedidoId, monto, metodo);
  if (!r.ok) return { error: textoDeError(r.error) };

  revalidatePath("/", "layout");
  return { listo: c.listo };
}

export async function alternarContraEntrega(
  pedidoId: string,
  valor: boolean,
): Promise<{ error?: string }> {
  const { supabase } = await negocioActual();
  const r = await marcarContraEntrega(supabase, pedidoId, valor);
  if (!r.ok) return { error: textoDeError(r.error) };

  revalidatePath("/", "layout");
  return {};
}
