// Las fotos del bucket "productos" que ya nadie usa: de productos borrados, fotos quitadas al editar, logos reemplazados o
// subidas que nunca se guardaron. Sin imports con alias, para que lo use también scripts/fotos-sueltas.mts.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

type Cliente = SupabaseClient<Database>;

export const BUCKET = "productos";
/** Lo subido hace menos que esto se deja: puede ser de un producto que se está creando. */
export const GRACIA_MS = 24 * 60 * 60 * 1000;

/** Una foto de producto o un logo dentro de la carpeta de un negocio. */
const RUTA_DE_FOTO = /^[0-9a-f-]{36}\/(logo-)?[\w-]+\.(webp|jpe?g|png)$/;

export type Archivo = { ruta: string; tamano: number; creado: Date };

/** Todas las filas de una tabla, de a mil (la API no da más de una vez). */
async function todas<T>(supabase: Cliente, tabla: string, columnas: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    // Las tablas se piden por nombre: no todas están en los tipos ni existen en cada base
    const { data, error } = await (supabase as unknown as SupabaseClient).from(tabla).select(columnas).range(desde, desde + 999);
    if (error) {
      // Una tabla que todavía no existe (falta su SQL) no tiene rutas
      if (error.code === "42P01" || error.code === "PGRST205") return filas;
      throw error;
    }
    filas.push(...(data as T[]));
    if (data.length < 1000) return filas;
  }
}

async function listar(supabase: Cliente, carpeta: string) {
  const items = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(carpeta, { limit: 1000, offset: desde, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    items.push(...data);
    if (data.length < 1000) return items;
  }
}

/** Todo lo que hay en el bucket: una carpeta por negocio (las carpetas vienen sin id). */
export async function archivosDelBucket(supabase: Cliente): Promise<Archivo[]> {
  const archivos: Archivo[] = [];
  for (const carpeta of await listar(supabase, "")) {
    if (carpeta.id) continue;
    for (const a of await listar(supabase, carpeta.name)) {
      if (!a.id) continue;
      archivos.push({
        ruta: `${carpeta.name}/${a.name}`,
        tamano: Number((a.metadata as { size?: number } | null)?.size ?? 0),
        creado: new Date(a.created_at ?? 0),
      });
    }
  }
  return archivos;
}

/** Cuenta como usada cualquier ruta de producto.fotos, negocio.logo, pago.comprobante, importacion.archivo o galeria.ruta. */
export async function rutasUsadas(supabase: Cliente): Promise<Set<string>> {
  const [productos, negocios, pagos, importaciones, galeria] = await Promise.all([
    todas<{ fotos: string[] | null }>(supabase, "producto", "fotos"),
    todas<{ logo: string | null }>(supabase, "negocio", "logo"),
    todas<{ comprobante: string | null }>(supabase, "pago", "comprobante"),
    todas<{ archivo: string | null }>(supabase, "importacion", "archivo"),
    todas<{ ruta: string | null }>(supabase, "galeria", "ruta"),
  ]);
  return new Set(
    [...productos.flatMap((p) => p.fotos ?? []), ...negocios.map((n) => n.logo), ...pagos.map((p) => p.comprobante), ...importaciones.map((i) => i.archivo), ...galeria.map((g) => g.ruta)].filter(
      (r): r is string => !!r,
    ),
  );
}

/** Los archivos del bucket que nadie usa. `graciaMs` deja los recientes aparte. */
export async function encontrarSueltas(supabase: Cliente, graciaMs = GRACIA_MS, ahora = Date.now()) {
  const [archivos, usadas] = await Promise.all([archivosDelBucket(supabase), rutasUsadas(supabase)]);
  const sinUsar = archivos.filter((a) => !usadas.has(a.ruta));
  return {
    archivos,
    sinUsar,
    sueltas: sinUsar.filter((a) => ahora - a.creado.getTime() > graciaMs),
    recientes: sinUsar.filter((a) => ahora - a.creado.getTime() <= graciaMs),
  };
}

/** Borra esas rutas del bucket, de a cien. Devuelve cuántas se borraron. */
export async function borrarRutas(supabase: Cliente, rutas: string[]): Promise<number> {
  let borradas = 0;
  for (let i = 0; i < rutas.length; i += 100) {
    const tanda = rutas.slice(i, i + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(tanda);
    if (!error) borradas += tanda.length;
  }
  return borradas;
}

/**
 * Para cuando una foto o un logo deja de usarse (se quitó al editar, se borró el producto, se cambió el logo): la borra del
 * bucket salvo que otro producto o logo todavía la use (las variantes comparten las fotos del producto). Nunca falla: limpiar
 * no puede impedir que se guarde lo que la persona hizo; lo que quede, lo recoge la limpieza diaria.
 */
export async function borrarSiNadieLasUsa(supabase: Cliente, rutas: readonly (string | null | undefined)[]): Promise<void> {
  try {
    const candidatas = [...new Set(rutas.filter((r): r is string => !!r && RUTA_DE_FOTO.test(r)))];
    if (!candidatas.length) return;
    const [enProductos, enLogos] = await Promise.all([
      supabase.from("producto").select("fotos").overlaps("fotos", candidatas),
      supabase.from("negocio").select("logo").in("logo", candidatas),
    ]);
    // Si no se puede comprobar si siguen en uso, no se borra nada
    if (enProductos.error || enLogos.error) return;
    const usadas = new Set([...enProductos.data.flatMap((p) => p.fotos ?? []), ...enLogos.data.map((n) => n.logo)]);
    await borrarRutas(supabase, candidatas.filter((r) => !usadas.has(r)));
  } catch {
    // Se recoge en la limpieza diaria
  }
}
