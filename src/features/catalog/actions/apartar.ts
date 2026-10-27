"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apartarDesdeVitrina, type ErrorApartar } from "../repositorio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.apartar;

export type EstadoApartar = { error?: string; valores?: { nombre?: string; contacto?: string } };

const TEXTO_ERROR: Record<ErrorApartar, string> = {
  datos_invalidos: t.errorDatos,
  sin_disponibilidad: t.errorSinDisponibilidad,
  limite_apartados: t.errorLimite,
  demasiados_intentos: t.errorIntentos,
  apartado_apagado: t.errorApagado,
  no_existe: t.errorGeneral,
  desconocido: t.errorGeneral,
};

// Del dispositivo solo se guarda un hash del IP (con una clave propia), para limitar los intentos.
async function huellaDelDispositivo(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "sin-ip";
  return createHmac("sha256", process.env.HUELLA_SECRETO ?? "lote").update(ip).digest("hex").slice(0, 32);
}

export async function apartarProducto(
  slug: string,
  codigo: number,
  _anterior: EstadoApartar,
  formData: FormData,
): Promise<EstadoApartar> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const cantidad = Number(String(formData.get("cantidad") ?? "1").trim() || "1");
  const valores = { nombre, contacto };
  if (!nombre || contacto.length < 3 || !Number.isInteger(cantidad) || cantidad < 1) {
    return { error: t.errorDatos, valores };
  }

  const r = await apartarDesdeVitrina(createPublicClient(), {
    slug,
    codigo,
    nombre,
    contacto,
    cantidad,
    aceptaWhatsapp: formData.get("acepta") === "on",
    huella: await huellaDelDispositivo(),
  });
  if (!r.ok) return { error: TEXTO_ERROR[r.error], valores };

  redirect(`/c/${slug}/apartado/${r.pedidoId}`);
}
