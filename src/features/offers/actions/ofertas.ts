"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { hoyEnElSalvador, leerDescuento, precioDeOferta, type Descuento } from "@/domain";
import { listarGrupo, obtenerProducto } from "@/features/products/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { cancelarOferta, crearOferta, type ErrorOferta } from "../repositorio";

const t = textos.productos.oferta;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const textoDeError: Record<ErrorOferta, string> = {
  invalida: t.errorInvalida,
  existente: t.errorExistente,
  sin_permiso: t.errorPermiso,
  sin_sql: t.errorSql,
  desconocido: t.errorGeneral,
};

export type EntradaOferta = { tipo: Descuento["tipo"]; texto: string; desde: string; hasta: string };

/**
 * Programa una oferta para un producto, o para todas sus variantes con `todas`. El precio de cada una lo calcula
 * y vuelve a revisar la base; acá solo se leen las fechas y el descuento.
 */
export async function programarOferta(codigo: number, todas: boolean, entrada: EntradaOferta): Promise<{ error?: string }> {
  if (!Number.isInteger(codigo)) return { error: t.errorGeneral };
  const descuento = leerDescuento(entrada.tipo === "porcentaje" ? "porcentaje" : "monto", entrada.texto);
  if (!descuento || descuento === "invalido") return { error: t.errorDescuento };
  const { desde, hasta } = entrada;
  if (!FECHA.test(desde) || !FECHA.test(hasta) || hasta < desde || hasta < hoyEnElSalvador(new Date())) return { error: t.errorFechas };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return { error: t.errorGeneral };
  const productos = todas && producto.grupo ? await listarGrupo(supabase, negocio.id, producto.grupo, false) : [producto];
  // Mismo cálculo que la base, para avisar antes de ir a ella
  if (productos.some((p) => precioDeOferta(p.precio, descuento) === null)) return { error: t.errorInvalida };

  const r = await crearOferta(supabase, negocio.id, { productoIds: productos.map((p) => p.id), descuento, desde, hasta });
  if (!r.ok) return { error: textoDeError[r.error] };

  await rastrearAccion("oferta_programada", { todas });
  revalidatePath("/", "layout");
  return {};
}

export async function quitarOferta(lote: string): Promise<{ error?: string }> {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await cancelarOferta(supabase, negocio.id, lote);
  if (!r.ok) return { error: textoDeError[r.error] };

  await rastrearAccion("oferta_quitada");
  revalidatePath("/", "layout");
  return {};
}
