"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerInfoExtra, tieneInfoExtra } from "../infoExtra";
import { categoriaNoExiste, fotosValidas, leerCostos, leerNombreYPrecio, valoresDe } from "../leerFormulario";
import {
  actualizarFichaDelGrupo,
  actualizarProducto,
  ajustarExistencia,
  guardarFotos,
  guardarInfoExtra,
  guardarVariante,
  listarGrupo,
  obtenerProducto,
  reemplazarCostos,
} from "../repositorio";
import type { EstadoNuevo } from "./nuevo";
import { nombreConVariante } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;
const te = textos.productos.editar;

/** Guarda todo lo del formulario de producto: ficha, fotos, cantidad y costos. Es el mismo formulario que para crear. */
export async function editarProducto(
  codigo: number,
  _anterior: EstadoNuevo,
  formData: FormData,
): Promise<EstadoNuevo> {
  const valores = valoresDe(formData);
  const texto = (k: string) => (valores[k] ?? "").trim();
  const { nombre, precio, errores: erroresBasicos } = leerNombreYPrecio(valores);
  const errores: NonNullable<EstadoNuevo["errores"]> = { ...erroresBasicos };
  // En un producto con variantes el nombre es el base y cada variante tiene su etiqueta.
  const etiqueta = texto("variante");
  if ("variante" in valores && (!etiqueta || etiqueta.length > 40)) errores.variante = t.errorVariantes.etiqueta;

  if (await categoriaNoExiste(texto("categoria"))) errores.categoria = t.categorias.errorNoExiste;

  const { info, errorPrecioAnterior } = leerInfoExtra(valores, precio);
  if (errorPrecioAnterior) errores.precio_anterior = t.precioAnterior.error;

  const cantidad = Number(texto("cantidad") || "NaN");
  if (!Number.isInteger(cantidad) || cantidad < 0) errores.cantidad = te.errorCantidad;

  const { costos, errores: erroresCostos } = leerCostos(valores);
  Object.assign(errores, erroresCostos);
  if (Object.keys(errores).length) return { errores, valores };

  // La autorización real la hace RLS (solo gestiona quien es dueña o administradora).
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: te.errorPermiso }, valores };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return { errores: { general: te.errorGeneral }, valores };

  // No se puede dejar menos unidades que las que ya están prometidas o vendidas.
  const comprometidas = producto.apartadas + producto.vendidas;
  if (cantidad < comprometidas) return { errores: { cantidad: te.errorCantidadMinima(comprometidas) }, valores };

  const ficha = {
    descripcion: texto("descripcion") || null,
    categoria: texto("categoria") || null,
    marca: texto("marca") || null,
    condicion: texto("condicion") === "usado" ? ("usado" as const) : ("nuevo" as const),
  };
  const fotos = fotosValidas(valores.fotos, negocio.id);
  const general = { errores: { general: te.errorGeneral }, valores };

  if (producto.grupo && producto.variante) {
    const miembros = await listarGrupo(supabase, negocio.id, producto.grupo, false);
    // Dos variantes no pueden llamarse igual.
    if (miembros.some((m) => m.id !== producto.id && m.variante?.toLowerCase() === etiqueta.toLowerCase())) {
      return { errores: { variante: t.errorVariantes.repetida }, valores };
    }
    // El nombre base y la ficha son de todas; el precio, el stock, el costo y las fotos son solo de esta variante.
    const todas = miembros.map((m) => (m.id === producto.id ? { ...m, variante: etiqueta } : m));
    const okFicha = await actualizarFichaDelGrupo(supabase, todas, nombre, ficha, nombreConVariante);
    const okFotos = await guardarFotos(supabase, producto.id, fotos);
    const okPrecio = await actualizarProducto(supabase, producto.id, { nombre: nombreConVariante(nombre, etiqueta), precio: precio!, ...ficha });
    const okVariante = await guardarVariante(supabase, producto.id, {
      grupo: producto.grupo,
      variante: etiqueta,
      nombre: nombreConVariante(nombre, etiqueta),
    });
    if (!okFicha || !okFotos || !okPrecio || !okVariante) return general;
  } else {
    const ok = await actualizarProducto(supabase, producto.id, { nombre, precio: precio!, ...ficha });
    if (!ok || !(await guardarFotos(supabase, producto.id, fotos))) return general;
  }

  if (cantidad !== producto.cantidad && (await ajustarExistencia(supabase, producto.id, cantidad)) !== "ok") return general;
  if (!(await reemplazarCostos(supabase, negocio.id, producto.id, costos))) return general;

  // Detalles, estado y precio de antes: los dos primeros son de todas las variantes; el precio, de esta.
  // Sin ficha_producto.sql esto falla: solo se avisa si la persona de verdad llenó algo.
  const todas = producto.grupo ? (await listarGrupo(supabase, negocio.id, producto.grupo, false)).map((m) => m.id) : [producto.id];
  const okInfo = await guardarInfoExtra(supabase, { todas, esta: producto.id }, info);
  if (!okInfo && tieneInfoExtra(info)) return general;

  revalidatePath("/", "layout");
  redirect(`/productos/${codigo}?guardado=${encodeURIComponent(nombre)}`);
}
