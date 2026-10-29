"use server";

import { revalidatePath } from "next/cache";
import { costoPromedio, leerDolares } from "@/domain/index";
import { obtenerProducto, reponerProducto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.reponer;

export type EstadoReponer = {
  errores?: { llegan?: string; costo?: string; general?: string };
  listo?: string;
};

export async function reponer(
  codigo: number,
  _anterior: EstadoReponer,
  formData: FormData,
): Promise<EstadoReponer> {
  const llegan = Number(String(formData.get("llegan") ?? "").trim());
  if (!Number.isInteger(llegan) || llegan < 1) return { errores: { llegan: t.errorCantidad } };

  const textoCosto = String(formData.get("costo") ?? "").trim();
  const costoNuevo = textoCosto ? leerDolares(textoCosto) : null;
  if (textoCosto && costoNuevo === null) return { errores: { costo: t.errorCosto } };

  // La autorización real la hace reponer_producto en la base.
  const { supabase, negocio } = await negocioActual();
  const producto = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!producto) return { errores: { general: t.errorGeneral } };

  // Con costo previo se promedia entre lo que hay y lo que llega. Sin costo previo no hay
  // con qué promediar, así que queda el costo de lo nuevo. Sin costo nuevo, el costo no cambia.
  let nuevoCosto: number | null = costoNuevo;
  if (costoNuevo !== null && producto.costoUnitario != null) {
    nuevoCosto = costoPromedio(producto.cantidad - producto.vendidas, producto.costoUnitario, llegan, costoNuevo);
  }

  const resultado = await reponerProducto(supabase, producto.id, llegan, nuevoCosto);
  if (resultado === "sin_permiso") return { errores: { general: t.errorPermiso } };
  if (resultado !== "ok") return { errores: { general: t.errorGeneral } };
  revalidatePath("/", "layout");
  return { listo: t.listo(llegan) };
}

/** Reponer desde la ventana del detalle: la variante a la que llegan unidades viene en el formulario. */
export async function reponerElegido(anterior: EstadoReponer, formData: FormData): Promise<EstadoReponer> {
  const codigo = Number(formData.get("codigo"));
  if (!Number.isInteger(codigo)) return { errores: { general: t.errorGeneral } };
  return reponer(codigo, anterior, formData);
}
