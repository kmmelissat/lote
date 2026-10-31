"use server";

import { revalidatePath } from "next/cache";
import { leerDolares, METODOS_DE_DINERO, type MetodoMovimiento } from "@/domain/index";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { estadoDelDinero, registrarConteo } from "../cuadre";

/** `guardados` cuenta los conteos guardados: la tarjeta lo usa para vaciar el campo. */
export type EstadoConteo = { error?: string; listo?: string; guardados?: number };

const t = textos.dinero.cuadre;

export async function guardarConteo(previo: EstadoConteo, datos: FormData): Promise<EstadoConteo> {
  const metodo = String(datos.get("metodo") ?? "");
  if (!METODOS_DE_DINERO.includes(metodo as MetodoMovimiento)) return { ...previo, error: t.errorMetodo, listo: undefined };

  // Contar cero es válido (no hay nada); un campo vacío o con letras no.
  const contado = leerDolares(String(datos.get("contado") ?? ""));
  if (contado === null) return { ...previo, error: t.errorMonto, listo: undefined };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: t.errorPermiso, listo: undefined };

  // Lo esperado lo calcula el servidor, nunca viene del formulario
  const estado = await estadoDelDinero(supabase, negocio.id);
  const ok = await registrarConteo(supabase, negocio.id, {
    metodo: metodo as MetodoMovimiento,
    contado,
    esperado: estado[metodo as MetodoMovimiento].deberia,
    nota: String(datos.get("nota") ?? "").trim().slice(0, 120) || undefined,
  });
  if (!ok) return { ...previo, error: t.errorGeneral, listo: undefined };

  revalidatePath("/", "layout");
  return { listo: t.listo, guardados: (previo.guardados ?? 0) + 1 };
}
