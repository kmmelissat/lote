"use server";

import { revalidatePath } from "next/cache";
import { colorDeMarca, COLORES_MARCA, LIMITE_CONTEXTO } from "../marca";
import { guardarTienda as guardar } from "../repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda;
const v = textos.ajustes.vitrina;

export type EstadoTienda = { error?: string; listo?: boolean };

export async function guardarTienda(_anterior: EstadoTienda, formData: FormData): Promise<EstadoTienda> {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const nombre = texto("nombre");
  if (!nombre || nombre.length > 60) return { error: t.errorNombre };

  const descripcion = texto("frase");
  if (descripcion.length > 120) return { error: t.errorFrase };

  const whatsapp = texto("whatsapp");
  const digitos = whatsapp.replace(/\D/g, "");
  if (whatsapp && (!/^\+?[\d\s-]+$/.test(whatsapp) || digitos.length < 8 || digitos.length > 15)) {
    return { error: t.errorWhatsapp };
  }

  const instagram = texto("instagram").replace(/^@/, "");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return { error: t.errorInstagram };

  const contextoIa = texto("contexto");
  if (contextoIa.length > LIMITE_CONTEXTO) return { error: t.errorContexto };

  // Las reglas de la vitrina
  const plazoHoras = Number(texto("plazo"));
  if (!Number.isInteger(plazoHoras) || plazoHoras < 1 || plazoHoras > 168) return { error: v.errorPlazo };
  const limitePorContacto = Number(texto("limite"));
  if (!Number.isInteger(limitePorContacto) || limitePorContacto < 1 || limitePorContacto > 20) return { error: v.errorLimite };
  const umbralPocoStock = Number(texto("umbral"));
  if (!Number.isInteger(umbralPocoStock) || umbralPocoStock < 0 || umbralPocoStock > 50) return { error: v.errorUmbral };

  const vitrinaActiva = formData.get("vitrina") === "on";

  const color = texto("color");
  if (!COLORES_MARCA.some((c) => c.hex === color)) return { error: t.errorColor };

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };

  const logo = texto("logo");
  if (logo && !esRutaFoto(logo, negocio.id)) return { error: t.errorLogo };

  const ok = await guardar(supabase, negocio.id, {
    nombre,
    descripcion: descripcion || null,
    logo: logo || null,
    color: colorDeMarca(color).hex,
    whatsapp: whatsapp || null,
    usuarioInstagram: instagram || null,
    contextoIa: contextoIa || null,
    apartarDesdeVitrina: formData.get("apartar") === "on",
    plazoHoras,
    limitePorContacto,
    umbralPocoStock,
    // Sin vitrina no se puede aparecer en Explorar
    visibleEnExplorar: vitrinaActiva && formData.get("explorar") === "on",
    vitrinaActiva,
  });
  if (!ok) return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: true };
}
