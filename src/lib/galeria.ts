import type { SupabaseClient } from "@supabase/supabase-js";

// Mi galería: las fotos que sube el negocio, registradas en la tabla `galeria` (supabase/galeria.sql). Si todavía no se
// corrió ese SQL, la tabla no existe: subir sigue funcionando, pero la galería avisa que falta (`SIN_TABLA`).
// La tabla se pide por nombre porque no está en los tipos generados.

/** El error con que falla listar cuando todavía no se corrió galeria.sql */
export const SIN_TABLA = "galeria_sin_tabla";

export type FotoDeGaleria = { ruta: string; creado: string };

const sinTabla = (code?: string) => code === "42P01" || code === "PGRST205";

/** Anota las fotos recién subidas. No falla: si no se pudo, la foto igual se usa donde se subió. */
export async function registrarEnGaleria(supabase: SupabaseClient, negocioId: string, rutas: string[]): Promise<void> {
  if (!rutas.length) return;
  await supabase
    .from("galeria")
    .upsert(rutas.map((ruta) => ({ negocio_id: negocioId, ruta })), { onConflict: "negocio_id,ruta", ignoreDuplicates: true });
}

/** Las fotos de la galería, las más nuevas primero. */
export async function listarGaleria(supabase: SupabaseClient, negocioId: string, limite = 500): Promise<FotoDeGaleria[]> {
  const { data, error } = await supabase
    .from("galeria")
    .select("ruta, creado_en")
    .eq("negocio_id", negocioId)
    .order("creado_en", { ascending: false })
    .limit(limite);
  if (error) {
    if (sinTabla(error.code)) throw new Error(SIN_TABLA);
    throw error;
  }
  return (data ?? []).map((f: { ruta: string; creado_en: string }) => ({ ruta: f.ruta, creado: f.creado_en }));
}

/** Cuántos productos (o variantes) usa cada ruta. */
export async function usosDeFotos(supabase: SupabaseClient, negocioId: string): Promise<Map<string, number>> {
  const { data } = await supabase.from("producto").select("fotos").eq("negocio_id", negocioId);
  const usos = new Map<string, number>();
  for (const p of (data ?? []) as { fotos: string[] | null }[]) for (const r of new Set(p.fotos ?? [])) usos.set(r, (usos.get(r) ?? 0) + 1);
  return usos;
}

/** Saca la foto de la galería y borra el archivo. Falso si algún producto la usa o no se pudo. */
export async function borrarDeGaleria(supabase: SupabaseClient, negocioId: string, ruta: string): Promise<boolean> {
  if ((await usosDeFotos(supabase, negocioId)).get(ruta)) return false;
  const { error } = await supabase.from("galeria").delete().eq("negocio_id", negocioId).eq("ruta", ruta);
  if (error) return false;
  await supabase.storage.from("productos").remove([ruta]);
  return true;
}
