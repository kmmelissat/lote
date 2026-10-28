"use server";

import { revalidatePath } from "next/cache";
import { colorDeMarca, COLORES_MARCA } from "../marca";
import { guardarIdentidad } from "../repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda;

export type EstadoTienda = { error?: string; listo?: boolean };

export async function guardarTienda(_anterior: EstadoTienda, formData: FormData): Promise<EstadoTienda> {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const nombre = texto("nombre");
  if (!nombre || nombre.length > 60) return { error: t.errorNombre };

  const descripcion = texto("frase");
  if (descripcion.length > 120) return { error: t.errorFrase };

  const color = texto("color");
  if (!COLORES_MARCA.some((c) => c.hex === color)) return { error: t.errorColor };

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };

  const logo = texto("logo");
  if (logo && !esRutaFoto(logo, negocio.id)) return { error: t.errorLogo };

  const ok = await guardarIdentidad(supabase, negocio.id, {
    nombre,
    descripcion: descripcion || null,
    logo: logo || null,
    color: colorDeMarca(color).hex,
  });
  if (!ok) return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: true };
}
