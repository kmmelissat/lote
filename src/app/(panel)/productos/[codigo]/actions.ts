"use server";

import { costoPromedio, leerDolares } from "@/domain";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import {
  guardarFotos,
  obtenerProducto,
  reponerProducto,
} from "@/features/products/repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.reponer;

export async function agregarFotos(
  codigo: number,
  rutas: string[],
): Promise<{ error?: string }> {
  const { supabase, negocio } = await negocioActual();
  const producto = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!producto || !negocio.puedeGestionar) return { error: textos.productos.fotos.errorGuardar };

  const nuevas = rutas.filter((r) => esRutaFoto(r, negocio.id));
  const fotos = [...new Set([...producto.fotos, ...nuevas])].slice(0, MAXIMO_FOTOS);
  const ok = await guardarFotos(supabase, producto.id, fotos);
  return ok ? {} : { error: textos.productos.fotos.errorGuardar };
}

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
    nuevoCosto = costoPromedio(producto.cantidad, producto.costoUnitario, llegan, costoNuevo);
  }

  const resultado = await reponerProducto(supabase, producto.id, llegan, nuevoCosto);
  if (resultado === "sin_permiso") return { errores: { general: t.errorPermiso } };
  if (resultado !== "ok") return { errores: { general: t.errorGeneral } };
  return { listo: t.listo(llegan) };
}
