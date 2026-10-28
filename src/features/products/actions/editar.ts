"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain/index";
import { actualizarFichaDelGrupo, actualizarProducto, guardarVariante, listarGrupo, obtenerProducto } from "../repositorio";
import { nombreConVariante } from "../variantes";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;
const te = textos.productos.editar;

export type EstadoEditar = {
  errores?: Partial<Record<"nombre" | "precio" | "variante" | "general", string>>;
};

export async function editarProducto(
  codigo: number,
  _anterior: EstadoEditar,
  formData: FormData,
): Promise<EstadoEditar> {
  const texto = (k: string) => String(formData.get(k) ?? "").trim();
  const errores: NonNullable<EstadoEditar["errores"]> = {};

  const nombre = texto("nombre");
  if (!nombre) errores.nombre = t.errorNombre;
  const precio = leerDolares(texto("precio"));
  if (precio === null) errores.precio = t.errorPrecio;
  // En un producto con variantes el nombre es el base y cada variante tiene su etiqueta.
  const etiqueta = texto("variante");
  if (formData.has("variante") && (!etiqueta || etiqueta.length > 40)) errores.variante = textos.productos.form.errorVariantes.etiqueta;
  if (Object.keys(errores).length) return { errores };

  // La autorización real la hace RLS (solo gestiona quien es dueña o administradora).
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: te.errorPermiso } };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return { errores: { general: te.errorGeneral } };

  const ficha = {
    descripcion: texto("descripcion") || null,
    categoria: texto("categoria") || null,
    marca: texto("marca") || null,
    condicion: texto("condicion") === "usado" ? ("usado" as const) : ("nuevo" as const),
  };

  if (producto.grupo && producto.variante) {
    const miembros = await listarGrupo(supabase, negocio.id, producto.grupo, false);
    // Dos variantes no pueden llamarse igual.
    if (miembros.some((m) => m.id !== producto.id && m.variante?.toLowerCase() === etiqueta.toLowerCase())) {
      return { errores: { variante: textos.productos.form.errorVariantes.repetida } };
    }
    // El nombre base, la ficha y las fotos son de todas; el precio es solo de esta variante.
    const todas = miembros.map((m) => (m.id === producto.id ? { ...m, variante: etiqueta } : m));
    const okFicha = await actualizarFichaDelGrupo(supabase, todas, nombre, ficha, nombreConVariante);
    const okPrecio = await actualizarProducto(supabase, producto.id, { nombre: nombreConVariante(nombre, etiqueta), precio: precio!, ...ficha });
    const okVariante = await guardarVariante(supabase, producto.id, {
      grupo: producto.grupo,
      variante: etiqueta,
      nombre: nombreConVariante(nombre, etiqueta),
    });
    if (!okFicha || !okPrecio || !okVariante) return { errores: { general: te.errorGeneral } };
  } else {
    const ok = await actualizarProducto(supabase, producto.id, { nombre, precio: precio!, ...ficha });
    if (!ok) return { errores: { general: te.errorGeneral } };
  }

  revalidatePath("/", "layout");
  redirect(`/productos/${codigo}`);
}
