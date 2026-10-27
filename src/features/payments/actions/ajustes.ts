"use server";

import { revalidatePath } from "next/cache";
import { guardarMetodos, TIPOS_METODO } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.pagos;

export type EstadoPagos = { error?: string; listo?: boolean };

export async function guardarDatosDePago(_anterior: EstadoPagos, formData: FormData): Promise<EstadoPagos> {
  const metodos = TIPOS_METODO.map((tipo) => ({
    tipo,
    activo: formData.get(`${tipo}_activo`) === "on",
    datos: String(formData.get(`${tipo}_datos`) ?? "").trim().slice(0, 500) || null,
  }));

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };
  if (!(await guardarMetodos(supabase, negocio.id, metodos))) return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: true };
}
