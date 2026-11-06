"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { hoyEnElSalvador, leerDolares, type AhorroPromocion, type LineaPromocion } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";
import { nombrePorDefecto } from "../descripcion";
import {
  calcularPromociones,
  cambiarPromocion,
  crearPromocion,
  eliminarPromocion,
  type ErrorPromocion,
  type TipoPromocion,
} from "../repositorio";

const t = textos.promociones;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LINEAS = 30;

const textoDeError: Record<ErrorPromocion, string> = {
  invalida: t.errorInvalida,
  sin_permiso: t.errorPermiso,
  sin_sql: t.sinSql,
  desconocido: t.errorGeneral,
};

export type EntradaPromocion = {
  tipo: TipoPromocion;
  nombre: string;
  productos: { productoId: string; cantidad: number }[];
  /** Lo escrito en dólares; solo en un pack */
  precioPack: string;
  lleva: number;
  paga: number;
  desde: string;
  hasta: string;
};

export async function nuevaPromocion(entrada: EntradaPromocion): Promise<{ error?: string }> {
  const tipo: TipoPromocion = entrada.tipo === "llevas_pagas" ? "llevas_pagas" : "pack";
  const productos = Array.isArray(entrada.productos) ? entrada.productos : [];
  const validos =
    productos.length > 0 &&
    productos.length <= MAX_LINEAS &&
    productos.every((p) => esUuid(p.productoId) && Number.isInteger(p.cantidad) && p.cantidad >= 1 && p.cantidad <= 20) &&
    new Set(productos.map((p) => p.productoId)).size === productos.length;
  if (!validos || (tipo === "pack" && productos.length < 2)) return { error: tipo === "pack" ? t.errorProductosPack : t.errorProductosLlevasPagas };

  const nombre = entrada.nombre.trim() || nombrePorDefecto(tipo, entrada.lleva, entrada.paga);
  if (nombre.length > 60) return { error: t.errorNombre };

  const desde = entrada.desde || undefined;
  const hasta = entrada.hasta || undefined;
  if ((desde && !FECHA.test(desde)) || (hasta && !FECHA.test(hasta)) || (desde && hasta && hasta < desde) || (hasta && hasta < hoyEnElSalvador(new Date()))) {
    return { error: t.errorFechas };
  }

  let precioPack: number | undefined;
  if (tipo === "pack") {
    const leido = leerDolares(entrada.precioPack);
    if (leido === null || leido <= 0) return { error: t.errorPrecioPack };
    precioPack = leido;
  } else if (!Number.isInteger(entrada.lleva) || !Number.isInteger(entrada.paga) || entrada.lleva < 2 || entrada.lleva > 10 || entrada.paga < 1 || entrada.paga >= entrada.lleva) {
    return { error: t.errorLleva };
  }

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await crearPromocion(supabase, negocio.id, {
    tipo,
    nombre,
    productos: tipo === "pack" ? productos : productos.map((p) => ({ ...p, cantidad: 1 })),
    precioPack,
    ...(tipo === "llevas_pagas" ? { lleva: entrada.lleva, paga: entrada.paga } : {}),
    desde,
    hasta,
  });
  if (!r.ok) return { error: r.error === "invalida" && tipo === "pack" ? t.errorPackNoAbarata : textoDeError[r.error] };

  await rastrearAccion("promocion_creada");
  revalidatePath("/", "layout");
  return {};
}

export async function encenderPromocion(id: string, activa: boolean): Promise<{ error?: string }> {
  if (!esUuid(id)) return { error: t.errorGeneral };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await cambiarPromocion(supabase, negocio.id, id, activa === true);
  if (!r.ok) return { error: textoDeError[r.error] };
  await rastrearAccion("promocion_cambiada", { activa });
  revalidatePath("/", "layout");
  return {};
}

export async function borrarPromocion(id: string): Promise<{ error?: string }> {
  if (!esUuid(id)) return { error: t.errorGeneral };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await eliminarPromocion(supabase, negocio.id, id);
  if (!r.ok) return { error: textoDeError[r.error] };
  await rastrearAccion("promocion_borrada");
  revalidatePath("/", "layout");
  return {};
}

/** El ahorro de las líneas que se están armando en el panel (pedido nuevo o Mostrador). Sin permiso o con datos raros, nada. */
export async function calcularAhorro(lineas: LineaPromocion[]): Promise<AhorroPromocion[]> {
  const validas = Array.isArray(lineas)
    ? lineas.filter((l) => esUuid(l?.productoId) && Number.isInteger(l?.cantidad) && l.cantidad >= 1 && l.cantidad <= 999).slice(0, MAX_LINEAS)
    : [];
  if (!validas.length) return [];
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeVender) return [];
  return calcularPromociones(supabase, negocio.id, validas);
}
