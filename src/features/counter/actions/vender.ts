"use server";

import { revalidatePath } from "next/cache";
import { limpiarCodigoDeBarras } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import {
  METODOS_MOSTRADOR,
  asignarCodigoDeBarras,
  guardarContactoDeVenta,
  productoPorBarras,
  venderEnMostrador,
  type ErrorMostrador,
  type MetodoMostrador,
  type ProductoMostrador,
} from "../repositorio";
import { esUuid } from "@/lib/uuid";

const t = textos.mostrador;

const MAXIMO_LINEAS = 50;

function textoDeError(e: ErrorMostrador): string {
  switch (e.tipo) {
    case "sin_disponibilidad":
      return e.quien
        ? t.errores.yaApartado(e.quien)
        : t.errores.sinDisponibilidad;
    case "sin_permiso":
      return t.errores.permiso;
    case "descuento_invalido":
      return textos.comun.descuento.invalido;
    default:
      return t.errores.general;
  }
}

export type EntradaVenta = {
  items: { productoId: string; cantidad: number }[];
  /** En centavos, ya calculado en pantalla; la base verifica que no pase de lo vendido */
  descuento: number;
  metodo: string;
  /** Opcional: a quién se le vendió y cómo contactarla (ya normalizado) */
  cliente?: string;
  telefono?: string;
  usuario?: string;
  correo?: string;
  acepta?: boolean;
};

export type ResultadoVenta =
  | { ok: true; codigo: number; contactoFallo?: boolean }
  | { ok: false; error: string };

/** Cobra una venta de mostrador: pedido entregado y pagado. Los precios y la disponibilidad los decide la base. */
export async function cobrarVenta(
  entrada: EntradaVenta,
): Promise<ResultadoVenta> {
  const metodo = METODOS_MOSTRADOR.includes(entrada.metodo as MetodoMostrador)
    ? (entrada.metodo as MetodoMostrador)
    : null;
  const items = Array.isArray(entrada.items) ? entrada.items : [];
  const valido =
    metodo &&
    items.length >= 1 &&
    items.length <= MAXIMO_LINEAS &&
    items.every(
      (i) =>
        esUuid(String(i?.productoId)) &&
        Number.isInteger(i?.cantidad) &&
        i.cantidad >= 1,
    ) &&
    Number.isInteger(entrada.descuento) &&
    entrada.descuento >= 0;
  if (!valido) return { ok: false, error: t.errores.sinProductos };

  const { supabase, negocio } = await negocioActual();
  const r = await venderEnMostrador(supabase, negocio.id, {
    items: items.map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
    })),
    descuento: entrada.descuento,
    metodo,
    cliente: typeof entrada.cliente === "string" ? entrada.cliente.trim().slice(0, 120) : undefined,
  });
  if (!r.ok) return { ok: false, error: textoDeError(r.error) };

  // El contacto va aparte de la venta: si no se pudo guardar, la venta igual quedó cobrada
  const limpio = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const contactos = { telefono: limpio(entrada.telefono, 30), usuario: limpio(entrada.usuario, 60), correo: limpio(entrada.correo, 120) };
  const hayContacto = Boolean(contactos.telefono || contactos.usuario || contactos.correo);
  const contactoFallo = hayContacto && !(await guardarContactoDeVenta(supabase, r.id, { ...contactos, aceptaWhatsapp: entrada.acepta === true }));

  revalidatePath("/", "layout");
  return { ok: true, codigo: r.codigo, ...(contactoFallo ? { contactoFallo } : {}) };
}

/** Busca un producto por su código de barras cuando no está entre los que ya cargó la pantalla. */
export async function buscarPorCodigoDeBarras(
  texto: string,
): Promise<ProductoMostrador | null> {
  const codigo = limpiarCodigoDeBarras(texto);
  if (!codigo) return null;
  const { supabase, negocio } = await negocioActual();
  return productoPorBarras(supabase, negocio.id, codigo);
}

export type ResultadoAsociar = { ok: true } | { ok: false; error: string };

/** Asocia (o quita, con null) el código de barras de un producto. Es editar el producto: solo dueña y administradora. */
export async function asociarCodigoDeBarras(
  productoId: string,
  texto: string | null,
): Promise<ResultadoAsociar> {
  const f = textos.mostrador.ficha;
  const codigo = texto === null ? null : limpiarCodigoDeBarras(texto);
  if (!esUuid(productoId) || (texto !== null && !codigo))
    return { ok: false, error: f.invalido };

  const { supabase } = await negocioActual();
  const r = await asignarCodigoDeBarras(supabase, productoId, codigo);
  if (!r.ok) {
    if (r.error.tipo === "codigo_repetido")
      return { ok: false, error: t.barras.repetido };
    if (r.error.tipo === "sin_permiso")
      return { ok: false, error: t.barras.soloGestion };
    return { ok: false, error: t.errores.general };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
