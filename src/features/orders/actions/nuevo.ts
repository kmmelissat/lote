"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerPedido } from "../formulario";
import { registrarPedido, type ErrorPedido } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.pedidos.form;

export type EstadoNuevoPedido = {
  error?: string;
  valores?: { tipo?: string; cliente?: string; contacto?: string; acepta?: boolean; canal?: string };
};

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

export async function nuevoPedido(
  _anterior: EstadoNuevoPedido,
  formData: FormData,
): Promise<EstadoNuevoPedido> {
  const { tipo, cliente, canal, contacto, acepta, metodo, items } = leerPedido(formData);
  const valores = { tipo, cliente, contacto, acepta, canal };

  if (!items) return { error: t.errorProductos, valores };
  if (tipo === "apartado" && !cliente) return { error: t.errorCliente, valores };
  // Un contacto sin nombre no se guarda en ningún lado
  if (contacto && !cliente) return { error: t.errorContactoSinNombre, valores };

  // El permiso y la disponibilidad los decide la base; acá solo se resuelve el negocio.
  const { supabase, negocio } = await negocioActual();
  const r = await registrarPedido(supabase, negocio.id, {
    cliente,
    canal,
    tipo,
    items,
    metodo: tipo === "venta" ? metodo : undefined,
    contacto: contacto || undefined,
    aceptaWhatsapp: acepta,
  });
  if (!r.ok) return { error: textoDeError(r.error), valores };

  revalidatePath("/", "layout");
  redirect(`/pedidos/${r.codigo}`);
}
