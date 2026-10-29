"use server";

import { redirect } from "next/navigation";
import { contactoDe, huellaDelDispositivo } from "../dispositivo";
import { apartarSchema, camposDe, comprarCarritoSchema, comprarSchema, leerFormulario } from "../formularios";
import {
  apartarDesdeVitrina,
  comprarCarritoDesdeVitrina,
  comprarDesdeVitrina,
  obtenerNegocioPublico,
  type ErrorApartar,
} from "../repositorio";
import { createPublicClient } from "@/lib/supabase/publico";
import { createServiceClient } from "@/lib/supabase/servicio";
import { textos } from "@/lib/textos";

const t = textos.vitrina.apartar;

export type EstadoApartar = {
  error?: string;
  /** El mensaje de cada campo que está mal (por ejemplo `nombre`, `contacto`, `direccion`) */
  errores?: Record<string, string>;
  valores?: { nombre?: string; contacto?: string };
};

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

// Un campo escondido que una persona no ve: si viene con algo, es un robot y no se crea nada
const esRobot = (formData: FormData) => String(formData.get("sitio_web") ?? "").trim() !== "";

/**
 * Si la tienda deja hacer eso desde la vitrina. La base solo conoce la llave general (comprar o apartar);
 * cuál de las dos está prendida se revisa acá.
 */
async function permite(slug: string, que: "comprar" | "apartar"): Promise<boolean> {
  const negocio = await obtenerNegocioPublico(createPublicClient(), slug);
  return !!negocio && (que === "comprar" ? negocio.permiteComprar : negocio.permiteApartar);
}

/** Los campos del formulario, con el WhatsApp ya armado (+503 y el número). */
const camposDelFormulario = (formData: FormData): Record<string, string> => ({ ...camposDe(formData), contacto: contactoDe(formData) });

export async function apartarProducto(
  slug: string,
  codigo: number,
  _anterior: EstadoApartar,
  formData: FormData,
): Promise<EstadoApartar> {
  if (esRobot(formData)) return { error: t.errorGeneral };
  const campos = camposDelFormulario(formData);
  const valores = { nombre: campos.nombre?.trim(), contacto: campos.contacto };

  const r = leerFormulario(apartarSchema, campos);
  if (!r.ok) return { error: r.error, errores: r.errores, valores };
  if (!(await permite(slug, "apartar"))) return { error: t.errorApagado, valores };

  const resultado = await apartarDesdeVitrina(createServiceClient(), {
    slug,
    codigo,
    nombre: r.datos.nombre,
    contacto: r.datos.contacto,
    cantidad: r.datos.cantidad,
    aceptaWhatsapp: true,
    huella: await huellaDelDispositivo(),
  });
  if (!resultado.ok) return { error: TEXTO_ERROR[resultado.error], valores };

  redirect(`/c/${slug}/apartado/${resultado.pedidoId}`);
}

/** Comprar: lo mismo que apartar, más cómo se recibe (recoger o envío con dirección) y cómo se piensa pagar. */
export async function comprarProducto(
  slug: string,
  codigo: number,
  _anterior: EstadoApartar,
  formData: FormData,
): Promise<EstadoApartar> {
  if (esRobot(formData)) return { error: t.errorGeneral };
  const campos = camposDelFormulario(formData);
  const valores = { nombre: campos.nombre?.trim(), contacto: campos.contacto };

  const r = leerFormulario(comprarSchema, campos);
  if (!r.ok) return { error: r.error, errores: r.errores, valores };
  if (!(await permite(slug, "comprar"))) return { error: t.errorApagado, valores };
  const d = r.datos;

  const resultado = await comprarDesdeVitrina(createServiceClient(), {
    slug,
    codigo,
    nombre: d.nombre,
    contacto: d.contacto,
    cantidad: d.cantidad,
    aceptaWhatsapp: true,
    huella: await huellaDelDispositivo(),
    entrega: d.entrega,
    ...datosDeEntrega(d),
    metodo: d.metodo,
  });
  if (!resultado.ok) return { error: TEXTO_ERROR[resultado.error], valores };

  redirect(`/c/${slug}/apartado/${resultado.pedidoId}`);
}

/** Comprar el carrito: varios productos en un solo pedido, con los mismos datos de entrega y pago que una compra. */
export async function comprarCarrito(slug: string, _anterior: EstadoApartar, formData: FormData): Promise<EstadoApartar> {
  if (esRobot(formData)) return { error: t.errorGeneral };
  const campos = camposDelFormulario(formData);
  const valores = { nombre: campos.nombre?.trim(), contacto: campos.contacto };

  const r = leerFormulario(comprarCarritoSchema, campos);
  if (!r.ok) return { error: r.error, errores: r.errores, valores };
  if (!(await permite(slug, "comprar"))) return { error: t.errorApagado, valores };
  const d = r.datos;

  const resultado = await comprarCarritoDesdeVitrina(createServiceClient(), {
    slug,
    items: d.items,
    nombre: d.nombre,
    contacto: d.contacto,
    aceptaWhatsapp: true,
    huella: await huellaDelDispositivo(),
    entrega: d.entrega,
    ...datosDeEntrega(d),
    metodo: d.metodo,
  });
  if (!resultado.ok) return { error: TEXTO_ERROR[resultado.error], valores };

  // ?carrito=1: la pantalla de confirmación vacía el carrito del navegador
  redirect(`/c/${slug}/apartado/${resultado.pedidoId}?carrito=1`);
}

/** La dirección solo viaja si el pedido es con envío: recoger no deja dirección guardada. */
function datosDeEntrega(d: { entrega: "retiro" | "envio"; departamento: string; municipio: string; direccion: string; referencia: string }) {
  const conEnvio = d.entrega === "envio";
  return {
    departamento: conEnvio ? d.departamento : "",
    municipio: conEnvio ? d.municipio : "",
    direccion: conEnvio ? d.direccion : "",
    referencia: conEnvio ? d.referencia : "",
  };
}
