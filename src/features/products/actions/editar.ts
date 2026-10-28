"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain/index";
import { actualizarProducto, obtenerProducto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;
const te = textos.productos.editar;

export type EstadoEditar = {
  errores?: Partial<Record<"nombre" | "precio" | "general", string>>;
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
  if (Object.keys(errores).length) return { errores };

  // La autorización real la hace RLS (solo gestiona quien es dueña o administradora).
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: te.errorPermiso } };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return { errores: { general: te.errorGeneral } };

  const ok = await actualizarProducto(supabase, producto.id, {
    nombre,
    precio: precio!,
    descripcion: texto("descripcion") || null,
    categoria: texto("categoria") || null,
    marca: texto("marca") || null,
    condicion: texto("condicion") === "usado" ? "usado" : "nuevo",
  });
  if (!ok) return { errores: { general: te.errorGeneral } };

  revalidatePath("/", "layout");
  redirect(`/productos/${codigo}`);
}
