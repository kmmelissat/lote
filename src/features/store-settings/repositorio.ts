import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

// Lo que la dueña ve y cambia en Ajustes > Tienda. Lo que ve el público de la tienda está en catalog/repositorio.ts.

export type AjustesVitrina = {
  slug: string;
  /** La vitrina pública es opcional: apagada, /c/<tienda> no existe y no se aparece en Explorar */
  vitrinaActiva: boolean;
  /** Vende en persona desde un local: prende el Mostrador y la caja */
  tieneLocal: boolean;
  /** Qué hace el negocio: lo guarda guardarTienda; no se lee acá porque ya viene en negocioActual */
  actividad?: "compro_vendo" | "produzco" | "ambos";
  /** Lo que tarda la tienda en entregar ("Sale en 24 h"); vacío si no lo dice */
  tiempoEntrega: string | null;
  /** Cambios y devoluciones, en una frase */
  politicaCambios: string | null;
  apartarDesdeVitrina: boolean;
  /** Comprar y apartar desde la vitrina, cada uno por su lado. Con los dos apagados queda en modo catálogo. */
  permiteComprar: boolean;
  permiteApartar: boolean;
  plazoHoras: number;
  limitePorContacto: number;
  umbralPocoStock: number;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  /** Aparecer en Explorar, el escaparate con las vitrinas de todas las tiendas */
  visibleEnExplorar: boolean;
};

export async function obtenerAjustesVitrina(supabase: Cliente, negocioId: string): Promise<AjustesVitrina> {
  const { data, error } = await supabase
    .from("negocio")
    .select(
      "slug, apartar_desde_vitrina, plazo_apartado_horas, limite_apartados_por_contacto, umbral_poco_stock, whatsapp, usuario_instagram, visible_en_explorar, vitrina_activa, tiene_local, tiempo_entrega, politica_cambios, permite_comprar, permite_apartar",
    )
    .eq("id", negocioId)
    .single();
  if (error) throw error;
  return {
    slug: data.slug,
    vitrinaActiva: data.vitrina_activa,
    tieneLocal: data.tiene_local,
    tiempoEntrega: data.tiempo_entrega ?? null,
    politicaCambios: data.politica_cambios ?? null,
    visibleEnExplorar: data.visible_en_explorar,
    apartarDesdeVitrina: data.apartar_desde_vitrina,
    permiteComprar: data.apartar_desde_vitrina && data.permite_comprar,
    permiteApartar: data.apartar_desde_vitrina && data.permite_apartar,
    plazoHoras: data.plazo_apartado_horas,
    limitePorContacto: data.limite_apartados_por_contacto,
    umbralPocoStock: data.umbral_poco_stock,
    whatsapp: data.whatsapp,
    usuarioInstagram: data.usuario_instagram,
  };
}

export type IdentidadTienda = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo: string | null;
  color: string | null;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  usuarioFacebook: string | null;
  usuarioTiktok: string | null;
  banner: string | null;
  /** Lo que Lotito debe saber de la tienda cuando lee una foto */
  contextoIa: string | null;
};

export async function obtenerIdentidad(supabase: Cliente, negocioId: string): Promise<IdentidadTienda> {
  const { data, error } = await supabase
    .from("negocio")
    .select("nombre, slug, descripcion, logo, color, whatsapp, usuario_instagram, usuario_facebook, usuario_tiktok, banner, contexto_ia")
    .eq("id", negocioId)
    .single();
  if (error) throw error;
  return {
    nombre: data.nombre,
    slug: data.slug,
    descripcion: data.descripcion,
    logo: data.logo,
    color: data.color,
    whatsapp: data.whatsapp,
    usuarioInstagram: data.usuario_instagram,
    usuarioFacebook: data.usuario_facebook ?? null,
    usuarioTiktok: data.usuario_tiktok ?? null,
    banner: data.banner ?? null,
    contextoIa: data.contexto_ia,
  };
}

/** Solo el contexto para la IA; lo pide quien va a leer una foto. Vacío si no hay o no se pudo leer. */
export async function contextoDeLaTienda(supabase: Cliente, negocioId: string): Promise<string> {
  const { data } = await supabase.from("negocio").select("contexto_ia").eq("id", negocioId).single();
  return data?.contexto_ia?.trim() ?? "";
}

/** La marca y las reglas de la vitrina se guardan juntas, en un solo paso. Solo la dueña puede (lo exige RLS). */
export async function guardarTienda(
  supabase: Cliente,
  negocioId: string,
  a: Omit<IdentidadTienda, "slug"> & Omit<AjustesVitrina, "slug" | "whatsapp" | "usuarioInstagram"> & { slug?: string },
): Promise<"ok" | "slug_repetido" | "error"> {
  const { error } = await supabase
    .from("negocio")
    .update({
      // La dirección de la vitrina solo se toca si la persona la cambió
      ...(a.slug ? { slug: a.slug } : {}),
      nombre: a.nombre,
      descripcion: a.descripcion,
      logo: a.logo,
      color: a.color,
      whatsapp: a.whatsapp,
      usuario_instagram: a.usuarioInstagram,
      usuario_facebook: a.usuarioFacebook,
      usuario_tiktok: a.usuarioTiktok,
      banner: a.banner,
      contexto_ia: a.contextoIa,
      apartar_desde_vitrina: a.apartarDesdeVitrina,
      permite_comprar: a.permiteComprar,
      permite_apartar: a.permiteApartar,
      plazo_apartado_horas: a.plazoHoras,
      limite_apartados_por_contacto: a.limitePorContacto,
      umbral_poco_stock: a.umbralPocoStock,
      visible_en_explorar: a.visibleEnExplorar,
      vitrina_activa: a.vitrinaActiva,
      tiene_local: a.tieneLocal,
      tiempo_entrega: a.tiempoEntrega,
      politica_cambios: a.politicaCambios,
      // Qué hace el negocio: solo si viene
      ...(a.actividad ? { actividad: a.actividad } : {}),
    })
    .eq("id", negocioId);
  if (!error) return "ok";
  // La dirección ya la usa otra tienda
  return error.code === "23505" ? "slug_repetido" : "error";
}
