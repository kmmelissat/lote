"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain/index";
import { fotosValidas, TIPOS_COSTO } from "../leerFormulario";
import {
  actualizarFichaDelGrupo,
  actualizarProducto,
  ajustarExistencia,
  guardarFotos,
  guardarVariante,
  listarCategorias,
  listarGrupo,
  obtenerProducto,
  reemplazarCostos,
  type NuevoProducto,
} from "../repositorio";
import type { EstadoNuevo } from "./nuevo";
import { nombreConVariante } from "../variantes";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;
const te = textos.productos.editar;

export type EstadoEditar = EstadoNuevo;

/** Guarda todo lo del formulario de producto: ficha, fotos, cantidad y costos. Es el mismo formulario que para crear. */
export async function editarProducto(
  codigo: number,
  _anterior: EstadoNuevo,
  formData: FormData,
): Promise<EstadoNuevo> {
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")),
  ) as Record<string, string>;
  const texto = (k: string) => (valores[k] ?? "").trim();
  const errores: NonNullable<EstadoNuevo["errores"]> = {};

  const nombre = texto("nombre");
  if (!nombre) errores.nombre = t.errorNombre;
  const precio = leerDolares(texto("precio"));
  if (precio === null) errores.precio = t.errorPrecio;
  // En un producto con variantes el nombre es el base y cada variante tiene su etiqueta.
  const etiqueta = texto("variante");
  if ("variante" in valores && (!etiqueta || etiqueta.length > 40)) errores.variante = t.errorVariantes.etiqueta;

  const { supabase: clienteCategorias, negocio: negocioCategorias } = await negocioActual();
  const categoria = texto("categoria");
  if (categoria && !(await listarCategorias(clienteCategorias, negocioCategorias.id)).some((c) => c.toLowerCase() === categoria.toLowerCase())) {
    errores.categoria = t.categorias.errorNoExiste;
  }

  const cantidad = Number(texto("cantidad") || "NaN");
  if (!Number.isInteger(cantidad) || cantidad < 0) errores.cantidad = te.errorCantidad;

  const costos: NuevoProducto["costos"] = [];
  for (const tipo of TIPOS_COSTO) {
    const monto = texto(tipo);
    if (!monto) continue;
    const centavos = leerDolares(monto);
    if (centavos === null) errores[tipo] = t.errorCosto;
    else costos.push({ tipo, monto: centavos });
  }
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
    // El nombre base, la ficha y las fotos son de todas; el precio, el stock y el costo son solo de esta variante.
    const todas = miembros.map((m) => (m.id === producto.id ? { ...m, variante: etiqueta } : m));
    const okFicha = await actualizarFichaDelGrupo(supabase, todas, nombre, ficha, nombreConVariante);
    const okFotos = (await Promise.all(miembros.map((m) => guardarFotos(supabase, m.id, fotos)))).every(Boolean);
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

  revalidatePath("/", "layout");
  redirect(`/productos/${codigo}?guardado=${encodeURIComponent(nombre)}`);
}
