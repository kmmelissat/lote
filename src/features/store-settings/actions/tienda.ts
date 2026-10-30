"use server";

import { revalidatePath } from "next/cache";
import { colorDeMarca } from "@/features/catalog/marca";
import { guardarTienda as guardar } from "@/features/catalog/repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { leerTienda } from "../formulario";

const t = textos.ajustes.tienda;

export type EstadoTienda = { error?: string; listo?: boolean };

export async function guardarTienda(_anterior: EstadoTienda, formData: FormData): Promise<EstadoTienda> {
  const leido = leerTienda(formData);
  if (!leido.ok) return { error: leido.error };
  const d = leido.datos;

  // Solo la dueña puede guardar: lo exige la política de la base (es_duena).
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return { error: t.soloDuena };

  if (d.logo && !esRutaFoto(d.logo, negocio.id)) return { error: t.errorLogo };

  const ok = await guardar(supabase, negocio.id, {
    // Si no cambió, no se toca
    slug: d.slug === negocio.slug ? undefined : d.slug,
    nombre: d.nombre,
    descripcion: d.frase || null,
    logo: d.logo || null,
    color: colorDeMarca(d.color).hex,
    whatsapp: d.whatsapp || null,
    usuarioInstagram: d.instagram || null,
    usuarioFacebook: d.facebook || null,
    usuarioTiktok: d.tiktok || null,
    contextoIa: d.contexto || null,
    // La llave general queda prendida si se puede hacer al menos una de las dos
    apartarDesdeVitrina: d.comprar || d.apartar,
    permiteComprar: d.comprar,
    permiteApartar: d.apartar,
    plazoHoras: d.plazo,
    limitePorContacto: d.limite,
    umbralPocoStock: d.umbral,
    visibleEnExplorar: d.explorar,
    vitrinaActiva: d.vitrina,
    tieneLocal: d.local,
    tiempoEntrega: d.tiempo_entrega || null,
    politicaCambios: d.politica_cambios || null,
  });
  if (ok === "slug_repetido") return { error: t.slug.errorRepetida };
  if (ok !== "ok") return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: true };
}
