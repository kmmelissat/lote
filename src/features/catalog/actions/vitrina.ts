"use server";

import { revalidatePath } from "next/cache";
import { guardarAjustesVitrina } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.vitrina;

export type EstadoVitrina = { error?: string; listo?: boolean };

export async function guardarVitrina(_anterior: EstadoVitrina, formData: FormData): Promise<EstadoVitrina> {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const plazoHoras = Number(texto("plazo"));
  if (!Number.isInteger(plazoHoras) || plazoHoras < 1 || plazoHoras > 168) return { error: t.errorPlazo };

  const limitePorContacto = Number(texto("limite"));
  if (!Number.isInteger(limitePorContacto) || limitePorContacto < 1 || limitePorContacto > 20) {
    return { error: t.errorLimite };
  }

  const whatsapp = texto("whatsapp");
  const digitos = whatsapp.replace(/\D/g, "");
  if (whatsapp && (!/^\+?[\d\s-]+$/.test(whatsapp) || digitos.length < 8 || digitos.length > 15)) {
    return { error: t.errorWhatsapp };
  }

  const instagram = texto("instagram").replace(/^@/, "");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return { error: t.errorInstagram };

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };

  const ok = await guardarAjustesVitrina(supabase, negocio.id, {
    apartarDesdeVitrina: formData.get("apartar") === "on",
    plazoHoras,
    limitePorContacto,
    whatsapp: whatsapp || null,
    usuarioInstagram: instagram || null,
  });
  if (!ok) return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: true };
}
