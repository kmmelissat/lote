"use server";

import { dejarResena } from "@/features/catalog/repositorio";
import { createServiceClient } from "@/lib/supabase/servicio";
import { textos } from "@/lib/textos";
import { leerResenaDeCliente } from "../formularios";

const t = textos.resenas.cliente;

export type EstadoDejar = { error?: string; listo?: boolean };

/** Quien compró deja su reseña desde el seguimiento de su pedido. Queda pendiente hasta que la tienda la publica. */
export async function dejarMiResena(pedido: string, codigo: number, _anterior: EstadoDejar, formData: FormData): Promise<EstadoDejar> {
  const datos = leerResenaDeCliente(formData, pedido, codigo);
  if (!datos) return { error: t.errorDatos };
  const r = await dejarResena(createServiceClient(), datos);
  if (r.ok) return { listo: true };
  if (r.error === "ya_opino") return { listo: true };
  if (r.error === "no_entregado") return { error: t.errorNoEntregado };
  return { error: t.errorGeneral };
}
