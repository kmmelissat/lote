"use server";

import type { EstadoNuevo } from "./nuevo";
import { editarProducto } from "./editar";
import { editarGrupo } from "./editarGrupo";

/** Editar usa el mismo formulario que crear: según la pestaña, guarda un producto simple o uno con variantes. */
export async function guardarProducto(codigo: number, anterior: EstadoNuevo, formData: FormData): Promise<EstadoNuevo> {
  return formData.get("tipo") === "variantes" ? editarGrupo(codigo, anterior, formData) : editarProducto(codigo, anterior, formData);
}
