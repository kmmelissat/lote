"use server";

import { dejarResena } from "@/features/catalog/repositorio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.resenas.cliente;

export type EstadoDejar = { error?: string; listo?: boolean };

/** Quien compró deja su reseña desde el seguimiento de su pedido. Queda pendiente hasta que la tienda la publica. */
export async function dejarMiResena(pedido: string, codigo: number, _anterior: EstadoDejar, formData: FormData): Promise<EstadoDejar> {
  const estrellas = Number(String(formData.get("estrellas") ?? ""));
  const texto = String(formData.get("texto") ?? "").trim();
  if (!esUuid(pedido) || !Number.isInteger(codigo) || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5 || texto.length > 500) {
    return { error: t.errorDatos };
  }
  const r = await dejarResena(createPublicClient(), { pedido, codigo, estrellas, texto });
  if (r.ok) return { listo: true };
  if (r.error === "ya_opino") return { listo: true };
  if (r.error === "no_entregado") return { error: t.errorNoEntregado };
  return { error: t.errorGeneral };
}
