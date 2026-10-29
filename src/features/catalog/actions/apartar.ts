"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apartarDesdeVitrina, comprarDesdeVitrina, type ErrorApartar } from "../repositorio";
import { esDepartamento } from "@/lib/departamentos";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.apartar;

export type EstadoApartar = { error?: string; valores?: { nombre?: string; contacto?: string } };

const TEXTO_ERROR: Record<ErrorApartar, string> = {
  datos_invalidos: t.errorDatos,
  entrega_invalida: textos.vitrina.compra.errorEntrega,
  metodo_invalido: textos.vitrina.compra.errorMetodo,
  sin_disponibilidad: t.errorSinDisponibilidad,
  limite_apartados: t.errorLimite,
  limite_compras: t.errorLimiteCompras,
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

/** El WhatsApp se escribe sin el +503; acá se le pone. Si viene un contacto completo (de otra pantalla), se respeta. */
function contactoDe(formData: FormData): string {
  const telefono = String(formData.get("telefono") ?? "").replace(/[^\d]/g, "");
  if (telefono) return `+503 ${telefono}`;
  return String(formData.get("contacto") ?? "").trim();
}

export async function apartarProducto(
  slug: string,
  codigo: number,
  _anterior: EstadoApartar,
  formData: FormData,
): Promise<EstadoApartar> {
  // Un campo escondido que una persona no ve: si viene con algo, es un robot y no se crea nada
  if (String(formData.get("sitio_web") ?? "").trim()) return { error: t.errorGeneral };
  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = contactoDe(formData);
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


const METODOS = ["transferencia", "billetera", "efectivo", "contra_entrega"] as const;

/** Comprar: lo mismo que apartar, más cómo se recibe (recoger o envío con dirección) y cómo se piensa pagar. */
export async function comprarProducto(
  slug: string,
  codigo: number,
  _anterior: EstadoApartar,
  formData: FormData,
): Promise<EstadoApartar> {
  // Un campo escondido que una persona no ve: si viene con algo, es un robot y no se crea nada
  if (String(formData.get("sitio_web") ?? "").trim()) return { error: t.errorGeneral };
  const texto = (k: string) => String(formData.get(k) ?? "").trim();
  const nombre = texto("nombre");
  const contacto = contactoDe(formData);
  const cantidad = Number(texto("cantidad") || "1");
  const entrega = texto("entrega") === "retiro" ? "retiro" : "envio";
  const departamento = texto("departamento");
  const metodo = METODOS.find((m) => m === texto("metodo"));
  const valores = { nombre, contacto };

  if (!nombre || contacto.length < 3 || !Number.isInteger(cantidad) || cantidad < 1 || !metodo) {
    return { error: t.errorDatos, valores };
  }
  if (entrega === "envio" && (!esDepartamento(departamento) || !texto("direccion"))) {
    return { error: textos.vitrina.compra.errorEntrega, valores };
  }

  const r = await comprarDesdeVitrina(createPublicClient(), {
    slug,
    codigo,
    nombre,
    contacto,
    cantidad,
    aceptaWhatsapp: formData.get("acepta") === "on",
    huella: await huellaDelDispositivo(),
    entrega,
    departamento: entrega === "envio" ? departamento : "",
    municipio: entrega === "envio" ? texto("municipio") : "",
    direccion: entrega === "envio" ? texto("direccion") : "",
    referencia: entrega === "envio" ? texto("referencia") : "",
    metodo,
  });
  if (!r.ok) return { error: TEXTO_ERROR[r.error], valores };

  redirect(`/c/${slug}/apartado/${r.pedidoId}`);
}
