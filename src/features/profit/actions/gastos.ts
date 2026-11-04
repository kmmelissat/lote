"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIAS_GASTO, fechaLocalDe, leerDolares, METODOS_DE_DINERO, type CategoriaGasto, type MetodoMovimiento } from "@/domain/index";
import { registrarGasto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

/** `guardados` cuenta los gastos guardados: el formulario lo usa para vaciarse. */
export type EstadoGasto = { error?: string; listo?: string; guardados?: number };

const t = textos.ganancia.form;

// El permiso lo verifica registrar_gasto en la base; acá solo se valida lo que escribió la persona.
export async function agregarGasto(previo: EstadoGasto, datos: FormData): Promise<EstadoGasto> {
  const monto = leerDolares(String(datos.get("monto") ?? ""));
  if (monto === null || monto <= 0) return { ...previo, error: t.errorMonto, listo: undefined };

  const categoria = String(datos.get("categoria") ?? "");
  if (!CATEGORIAS_GASTO.includes(categoria as CategoriaGasto)) return { ...previo, error: t.errorCategoria, listo: undefined };

  // La fecha se puede cambiar (por defecto hoy), pero no puede ser futura.
  const hoy = fechaLocalDe(new Date());
  const fecha = String(datos.get("fecha") ?? "").trim() || hoy;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)) || fecha > hoy) {
    return { ...previo, error: t.errorFecha, listo: undefined };
  }

  // Vacío = sin método (se puede no saber); cualquier otra cosa que no sea un método de la lista es un error.
  const metodoDicho = String(datos.get("metodo") ?? "");
  if (metodoDicho && !METODOS_DE_DINERO.includes(metodoDicho as MetodoMovimiento)) {
    return { ...previo, error: t.errorMetodo, listo: undefined };
  }

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: t.errorPermiso, listo: undefined };

  const id = await registrarGasto(supabase, negocio.id, {
    categoria: categoria as CategoriaGasto,
    monto,
    fecha,
    nota: String(datos.get("nota") ?? "").trim() || undefined,
    metodo: (metodoDicho as MetodoMovimiento) || undefined,
  });
  if (!id) return { ...previo, error: t.errorGeneral, listo: undefined };

  revalidatePath("/", "layout");
  return { listo: t.listo, guardados: (previo.guardados ?? 0) + 1 };
}
