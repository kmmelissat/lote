"use server";

import { revalidatePath } from "next/cache";
import { leerDolares, repartirEnvio, type EstadoPedido, type QuienPagaEnvio } from "@/domain";
import {
  cambiarEstadoPedido,
  METODOS_DE_COBRO,
  marcarContraEntrega,
  registrarPago,
  type ErrorPedido,
  type MetodoPago,
} from "@/features/orders/repositorio";
import { guardarEnvio, type ModoEntrega } from "@/features/shipping/repositorio";
import { esDepartamento } from "@/lib/departamentos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";


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
  if (monto === null || monto <= 0 || !METODOS_DE_COBRO.includes(metodo)) return { error: c.errorMonto };

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

export type EstadoEnvio = { error?: string; listo?: string };

const MODOS: ModoEntrega[] = ["retiro", "propio", "paquetera"];
const QUIENES: QuienPagaEnvio[] = ["cliente", "vendedora", "mitad"];

const textoDeErrorEnvio: Record<string, string> = {
  falta_direccion: textos.pedidos.envio.errorDireccion,
  costo_bloqueado: textos.pedidos.envio.errorCostoBloqueado,
  costo_invalido: textos.pedidos.envio.errorCostoInvalido,
  sin_permiso: textos.pedidos.envio.errorPermiso,
};

// Datos de envío del pedido. El reparto del costo lo calcula domain; la base verifica que sume
// y que el pedido todavía acepte cambiar el costo.
export async function guardarEnvioDelPedido(
  pedidoId: string,
  _anterior: EstadoEnvio,
  formData: FormData,
): Promise<EstadoEnvio> {
  const t = textos.pedidos.envio;
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const modo = texto("modo") as ModoEntrega;
  const paga = texto("paga") as QuienPagaEnvio;
  if (!MODOS.includes(modo) || !QUIENES.includes(paga)) return { error: t.errorGeneral };

  const departamento = texto("departamento");
  const direccion = texto("direccion");
  if (modo !== "retiro" && (!esDepartamento(departamento) || !direccion)) {
    return { error: t.errorDireccion };
  }

  const costo = modo === "retiro" || texto("costo") === "" ? 0 : leerDolares(texto("costo"));
  if (costo === null) return { error: t.errorCosto };
  const { cobrado, absorbido } = repartirEnvio(costo, paga);

  const { supabase } = await negocioActual();
  const r = await guardarEnvio(supabase, pedidoId, {
    modo,
    paquetera: texto("paquetera") || null,
    guia: texto("guia") || null,
    nombre: texto("nombre") || null,
    telefono: texto("telefono") || null,
    departamento: departamento || null,
    municipio: texto("municipio") || null,
    direccion: direccion || null,
    referencia: texto("referencia") || null,
    costo,
    paga,
    cobrado,
    absorbido,
  });
  if (!r.ok) return { error: textoDeErrorEnvio[r.error] ?? t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: t.guardado };
}
