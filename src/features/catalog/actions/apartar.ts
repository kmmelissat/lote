"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import type { z } from "zod";
import { rastrearServidor } from "@/lib/analiticaServidor";
import { reconocerDispositivo } from "../compradorDispositivo";
import { contactoDe, huellaDelDispositivo } from "../dispositivo";
import { apartarSchema, camposDe, comprarCarritoSchema, comprarSchema, esRobot, leerFormulario } from "../formularios";
import {
  apartarDesdeVitrina,
  comprarCarritoDesdeVitrina,
  comprarDesdeVitrina,
  obtenerNegocioPublico,
  type ErrorApartar,
} from "../repositorio";
import { ruta } from "@/lib/ruta";
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

type Resultado = { ok: true; pedidoId: string } | { ok: false; error: ErrorApartar };

/**
 * Lo que comparten apartar, comprar y comprar el carrito: descartar robots, revisar los datos, ver que la tienda deje
 * hacerlo, crear el pedido y llevar a la persona a su seguimiento. Cada acción pone solo su esquema y su llamada.
 */
async function procesarPedido<S extends z.ZodType>(
  formData: FormData,
  { slug, que, esquema, tipo, destino = (id) => ruta(`/p/${id}`), crear }: {
    slug: string;
    que: "comprar" | "apartar";
    esquema: S;
    /** Para la analítica: "apartado", "compra" o "carrito" */
    tipo: string;
    destino?: (pedidoId: string) => Route;
    crear: (datos: z.output<S>, huella: string) => Promise<Resultado>;
  },
): Promise<EstadoApartar> {
  if (esRobot(formData)) return { error: t.errorGeneral };
  const campos = camposDelFormulario(formData);
  const valores = { nombre: campos.nombre?.trim(), contacto: campos.contacto };

  const r = leerFormulario(esquema, campos);
  if (!r.ok) return { error: r.error, errores: r.errores, valores };
  if (!(await permite(slug, que))) return { error: t.errorApagado, valores };

  const resultado = await crear(r.datos, await huellaDelDispositivo());
  if (!resultado.ok) return { error: TEXTO_ERROR[resultado.error], valores };

  await reconocerDispositivo(resultado.pedidoId, campos.correo ?? "");
  await rastrearServidor("pedido_vitrina_creado", null, { tipo, slug });
  redirect(destino(resultado.pedidoId));
}

export async function apartarProducto(slug: string, codigo: number, _anterior: EstadoApartar, formData: FormData): Promise<EstadoApartar> {
  return procesarPedido(formData, {
    slug,
    que: "apartar",
    esquema: apartarSchema,
    tipo: "apartado",
    crear: (d, huella) =>
      apartarDesdeVitrina(createServiceClient(), { slug, codigo, nombre: d.nombre, contacto: d.contacto, cantidad: d.cantidad, aceptaWhatsapp: true, huella }),
  });
}

/** Comprar: lo mismo que apartar, más cómo se recibe (recoger o envío con dirección) y cómo se piensa pagar. */
export async function comprarProducto(slug: string, codigo: number, _anterior: EstadoApartar, formData: FormData): Promise<EstadoApartar> {
  return procesarPedido(formData, {
    slug,
    que: "comprar",
    esquema: comprarSchema,
    tipo: "compra",
    crear: (d, huella) =>
      comprarDesdeVitrina(createServiceClient(), {
        slug,
        codigo,
        nombre: d.nombre,
        contacto: d.contacto,
        cantidad: d.cantidad,
        aceptaWhatsapp: true,
        huella,
        entrega: d.entrega,
        ...datosDeEntrega(d),
        metodo: d.metodo,
      }),
  });
}

/** Comprar el carrito: varios productos en un solo pedido, con los mismos datos de entrega y pago que una compra. */
export async function comprarCarrito(slug: string, _anterior: EstadoApartar, formData: FormData): Promise<EstadoApartar> {
  return procesarPedido(formData, {
    slug,
    que: "comprar",
    esquema: comprarCarritoSchema,
    tipo: "carrito",
    // ?carrito=1: la pantalla de confirmación vacía el carrito del navegador
    destino: (id) => ruta(`/p/${id}?carrito=1`),
    crear: (d, huella) =>
      comprarCarritoDesdeVitrina(createServiceClient(), {
        slug,
        items: d.items,
        nombre: d.nombre,
        contacto: d.contacto,
        aceptaWhatsapp: true,
        huella,
        entrega: d.entrega,
        ...datosDeEntrega(d),
        metodo: d.metodo,
      }),
  });
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
