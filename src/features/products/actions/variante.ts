"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain/index";
import { crearProducto, guardarVariante, listarGrupo, obtenerProducto } from "../repositorio";
import { MAXIMO_VARIANTES } from "../variantes";
import { nombreBase, nombreConVariante } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.variantes;
const tf = textos.productos.form;

export type EstadoVariante = {
  errores?: Partial<Record<"etiquetaActual" | "etiqueta" | "cantidad" | "precio" | "costo" | "general", string>>;
};

const etiquetaValida = (e: string) => e.length >= 1 && e.length <= 40;

/**
 * Suma una variante a un producto. Si el producto todavía no tiene variantes, lo convierte: queda como la
 * primera (con la etiqueta que se le dé) y la nueva se crea al lado con su misma ficha y fotos.
 */
export async function agregarVariante(
  codigo: number,
  _anterior: EstadoVariante,
  formData: FormData,
): Promise<EstadoVariante> {
  const texto = (k: string) => String(formData.get(k) ?? "").trim();
  const errores: NonNullable<EstadoVariante["errores"]> = {};

  const etiqueta = texto("etiqueta");
  if (!etiquetaValida(etiqueta)) errores.etiqueta = tf.errorVariantes.etiqueta;

  const cantidad = Number(texto("cantidad") || "NaN");
  if (!Number.isInteger(cantidad) || cantidad < 1) errores.cantidad = tf.errorVariantes.cantidad;

  const precio = leerDolares(texto("precio"));
  if (precio === null) errores.precio = tf.errorPrecio;

  const textoCosto = texto("costo");
  const costo = textoCosto ? leerDolares(textoCosto) : null;
  if (textoCosto && costo === null) errores.costo = tf.errorCosto;

  const etiquetaActual = texto("etiquetaActual");
  if (formData.has("etiquetaActual") && !etiquetaValida(etiquetaActual)) errores.etiquetaActual = t.errorActual;
  if (Object.keys(errores).length) return { errores };

  // La autorización real la hace RLS (solo gestiona quien es dueña o administradora).
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: t.errorPermiso } };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return { errores: { general: t.errorGeneral } };

  const convierte = !producto.grupo || !producto.variante;
  const miembros = convierte ? [producto] : await listarGrupo(supabase, negocio.id, producto.grupo!, false);
  if (miembros.length >= MAXIMO_VARIANTES) return { errores: { general: t.errorLimite } };

  const base = convierte ? producto.nombre : nombreBase(producto.nombre, producto.variante);
  const existentes = convierte ? [etiquetaActual] : miembros.map((m) => m.variante ?? "");
  if (existentes.some((e) => e.toLowerCase() === etiqueta.toLowerCase())) {
    return { errores: { etiqueta: tf.errorVariantes.repetida } };
  }

  const grupo = convierte ? crypto.randomUUID() : producto.grupo!;
  // Convertir: primero esta queda como variante; si la nueva no se crea, se devuelve a como estaba.
  if (convierte) {
    const ok = await guardarVariante(supabase, producto.id, {
      grupo,
      variante: etiquetaActual,
      nombre: nombreConVariante(base, etiquetaActual),
    });
    if (!ok) return { errores: { general: t.errorGeneral } };
  }

  const nueva = await crearProducto(supabase, negocio.id, {
    nombre: nombreConVariante(base, etiqueta),
    precio: precio!,
    cantidad,
    descripcion: producto.descripcion ?? undefined,
    categoria: producto.categoria ?? undefined,
    marca: producto.marca ?? undefined,
    condicion: producto.condicion === "usado" ? "usado" : "nuevo",
    fotos: producto.fotos,
    costos: costo === null ? [] : [{ tipo: "compra", monto: costo }],
    grupo,
    variante: etiqueta,
  });

  if ("error" in nueva) {
    if (convierte) await guardarVariante(supabase, producto.id, { grupo: null, variante: null, nombre: producto.nombre });
    return { errores: { general: nueva.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral } };
  }

  revalidatePath("/", "layout");
  redirect(`/productos/${nueva.codigo}`);
}
