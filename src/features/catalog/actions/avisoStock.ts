"use server";

import { contactoDe, huellaDelDispositivo } from "../dispositivo";
import { pedirAvisoStock } from "../repositorio";
import { createServiceClient } from "@/lib/supabase/servicio";
import { textos } from "@/lib/textos";

const t = textos.vitrina.aviso;

export type EstadoAviso = { error?: string; listo?: boolean };

/** "Avisame cuando haya": el nombre y el WhatsApp de quien espera un producto agotado. */
export async function pedirAviso(slug: string, codigo: number, _anterior: EstadoAviso, formData: FormData): Promise<EstadoAviso> {
  // Un campo escondido que una persona no ve: si viene con algo, es un robot
  if (String(formData.get("sitio_web") ?? "").trim()) return { error: t.errorGeneral };
  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = contactoDe(formData);
  if (!nombre || contacto.length < 3) return { error: t.errorDatos };

  const r = await pedirAvisoStock(createServiceClient(), { slug, codigo, nombre, contacto, huella: await huellaDelDispositivo() });
  if (r.ok) return { listo: true };
  return { error: r.error === "hay_stock" ? t.errorHayStock : r.error === "demasiados_intentos" ? t.errorIntentos : r.error === "datos_invalidos" ? t.errorDatos : t.errorGeneral };
}
