"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  METODOS_DE_COBRO,
  registrarPedido,
  type Canal,
  type ErrorPedido,
  type MetodoPago,
} from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.pedidos.form;

export type EstadoNuevoPedido = {
  error?: string;
  valores?: { tipo?: string; cliente?: string; canal?: string };
};

const CANALES: Canal[] = ["instagram", "whatsapp", "presencial", "vitrina"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function textoDeError(e: ErrorPedido): string {
  switch (e.tipo) {
    case "sin_disponibilidad":
      return e.quien ? t.yaApartado(e.quien) : t.sinUnidades;
    case "falta_cliente":
      return t.errorCliente;
    case "sin_permiso":
      return t.errorPermiso;
    default:
      return t.errorGeneral;
  }
}

function leerItems(json: string): { productoId: string; cantidad: number }[] | null {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    if (!Array.isArray(lista) || lista.length < 1 || lista.length > 20) return null;
    const items = lista.map((i) => ({ productoId: String(i?.productoId), cantidad: Number(i?.cantidad) }));
    return items.every((i) => UUID.test(i.productoId) && Number.isInteger(i.cantidad) && i.cantidad >= 1)
      ? items
      : null;
  } catch {
    return null;
  }
}

export async function nuevoPedido(
  _anterior: EstadoNuevoPedido,
  formData: FormData,
): Promise<EstadoNuevoPedido> {
  const tipo = formData.get("tipo") === "venta" ? "venta" : "apartado";
  const cliente = String(formData.get("cliente") ?? "").trim();
  const canalPedido = String(formData.get("canal") ?? "");
  const canal: Canal = CANALES.includes(canalPedido as Canal) ? (canalPedido as Canal) : "presencial";
  const valores = { tipo, cliente, canal };
  const metodoPedido = String(formData.get("metodo") ?? "");
  const metodo: MetodoPago | undefined = METODOS_DE_COBRO.includes(metodoPedido as MetodoPago)
    ? (metodoPedido as MetodoPago)
    : undefined;

  const items = leerItems(String(formData.get("items") ?? ""));
  if (!items) return { error: t.errorProductos, valores };
  if (tipo === "apartado" && !cliente) return { error: t.errorCliente, valores };

  // El permiso y la disponibilidad los decide la base; acá solo se resuelve el negocio.
  const { supabase, negocio } = await negocioActual();
  const r = await registrarPedido(supabase, negocio.id, {
    cliente,
    canal,
    tipo,
    items,
    metodo: tipo === "venta" ? metodo : undefined,
  });
  if (!r.ok) return { error: textoDeError(r.error), valores };

  revalidatePath("/", "layout");
  redirect(`/pedidos/${r.codigo}`);
}
