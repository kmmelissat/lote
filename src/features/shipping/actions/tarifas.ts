"use server";

import { revalidatePath } from "next/cache";
import { leerDolares } from "@/domain/index";
import { guardarTarifas } from "../repositorio";
import { DEPARTAMENTOS, leerZonas } from "@/lib/departamentos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.envios;

export type EstadoTarifas = { error?: string; listo?: boolean };

export async function guardarTarifasDeEnvio(
  _anterior: EstadoTarifas,
  formData: FormData,
): Promise<EstadoTarifas> {
  const textoDefecto = String(formData.get("defecto") ?? "").trim();
  const defecto = textoDefecto === "" ? 0 : leerDolares(textoDefecto);
  if (defecto === null) return { error: t.errorMonto };

  const porDepartamento: Record<string, number> = {};
  for (const [i, departamento] of DEPARTAMENTOS.entries()) {
    const texto = String(formData.get(`departamento_${i}`) ?? "").trim();
    if (texto === "") continue;
    const monto = leerDolares(texto);
    if (monto === null) return { error: t.errorMonto };
    porDepartamento[departamento] = monto;
  }

  const retiro = String(formData.get("retiro") ?? "").trim();
  if (retiro.length > 200) return { error: t.errorRetiro };

  // Las zonas viajan como JSON; "todo el país" es null. Solo se guardan departamentos y municipios reales.
  let zonas = null;
  if (formData.get("todo_el_pais") !== "on") {
    try {
      zonas = leerZonas(JSON.parse(String(formData.get("zonas") ?? "{}")));
    } catch {
      return { error: t.errorGeneral };
    }
    if (!zonas || !Object.keys(zonas).length) return { error: t.zonas.errorVacias };
  }

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };
  if (!(await guardarTarifas(supabase, negocio.id, { defecto, porDepartamento, retiro: retiro || null, zonas }))) {
    return { error: t.errorGeneral };
  }

  revalidatePath("/", "layout");
  return { listo: true };
}
