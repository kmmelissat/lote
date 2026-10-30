// Fotos del bucket "productos" que ya nadie usa: de productos borrados, fotos quitadas al editar, logos
// reemplazados o de tiendas que ya no existen.
//
//   pnpm fotos-sueltas           solo las lista (no borra nada)
//   pnpm fotos-sueltas --borrar  las borra
//   pnpm fotos-sueltas --detalle cada archivo sin usar (también los recientes), con su tienda y fecha
//   pnpm fotos-sueltas --borrar --sin-espera
//                                también las de las últimas 24 h (solo si nadie está creando un producto)
//
// Cuenta como usada cualquier ruta que aparezca en producto.fotos, negocio.logo, pago.comprobante o
// importacion.archivo. Lo subido en las últimas 24 h se deja: puede ser de un producto que se está creando.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !llave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const supabase = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
const BUCKET = "productos";
const GRACIA_MS = process.argv.includes("--sin-espera") ? 0 : 24 * 60 * 60 * 1000;

type Archivo = { ruta: string; tamano: number; creado: Date };

/** Todas las filas de una tabla, de a mil (la API no da más de una vez). */
async function todas<T>(tabla: string, columnas: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select(columnas).range(desde, desde + 999);
    if (error) {
      // Una tabla que todavía no existe (falta su SQL) no tiene rutas
      if (error.code === "42P01" || error.code === "PGRST205") return filas;
      throw error;
    }
    filas.push(...(data as T[]));
    if (data.length < 1000) return filas;
  }
}

/** Lo que hay en una carpeta del bucket (o en la raíz), de a mil. */
async function listar(carpeta: string) {
  const items = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(carpeta, { limit: 1000, offset: desde, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    items.push(...data);
    if (data.length < 1000) return items;
  }
}

async function archivosDelBucket(): Promise<Archivo[]> {
  const archivos: Archivo[] = [];
  // Cada negocio tiene su carpeta (las carpetas vienen sin id)
  for (const carpeta of await listar("")) {
    if (carpeta.id) continue;
    for (const a of await listar(carpeta.name)) {
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

async function rutasUsadas(): Promise<Set<string>> {
  const [productos, negocios, pagos, importaciones] = await Promise.all([
    todas<{ fotos: string[] | null }>("producto", "fotos"),
    todas<{ logo: string | null }>("negocio", "logo"),
    todas<{ comprobante: string | null }>("pago", "comprobante"),
    todas<{ archivo: string | null }>("importacion", "archivo"),
  ]);
  return new Set(
    [...productos.flatMap((p) => p.fotos ?? []), ...negocios.map((n) => n.logo), ...pagos.map((p) => p.comprobante), ...importaciones.map((i) => i.archivo)].filter(
      (r): r is string => !!r,
    ),
  );
}

const mb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const [archivos, usadas, { data: negocios }] = await Promise.all([archivosDelBucket(), rutasUsadas(), supabase.from("negocio").select("id, nombre")]);
const nombreDe = new Map((negocios ?? []).map((n) => [n.id as string, n.nombre as string]));
const ahora = Date.now();
const sueltas = archivos.filter((a) => !usadas.has(a.ruta) && ahora - a.creado.getTime() > GRACIA_MS);
const recientes = archivos.filter((a) => !usadas.has(a.ruta) && ahora - a.creado.getTime() <= GRACIA_MS).length;

console.log(`En el bucket: ${archivos.length} archivos (${mb(archivos.reduce((n, a) => n + a.tamano, 0))}); en uso: ${archivos.length - sueltas.length - recientes}.`);
if (recientes) console.log(`Sin usar pero de las últimas 24 h (se dejan): ${recientes}.`);
if (process.argv.includes("--detalle")) {
  for (const a of archivos.filter((x) => !usadas.has(x.ruta))) {
    const reciente = ahora - a.creado.getTime() <= GRACIA_MS ? "  (reciente, se deja)" : "";
    console.log(`  ${(nombreDe.get(a.ruta.split("/")[0]) ?? "(tienda que ya no existe)").padEnd(22)} ${a.ruta.split("/")[1].padEnd(48)} ${a.creado.toLocaleString("es-SV")}  ${(a.tamano / 1024).toFixed(0)} KB${reciente}`);
  }
}
if (!sueltas.length) {
  console.log("No hay fotos sueltas.");
  process.exit(0);
}

// Agrupadas por tienda, para ver de dónde vienen
const porTienda = new Map<string, Archivo[]>();
for (const a of sueltas) {
  const carpeta = a.ruta.split("/")[0];
  porTienda.set(carpeta, [...(porTienda.get(carpeta) ?? []), a]);
}
console.log(`\nSueltas: ${sueltas.length} (${mb(sueltas.reduce((n, a) => n + a.tamano, 0))})`);
for (const [carpeta, lista] of [...porTienda.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const tienda = nombreDe.get(carpeta) ?? "(tienda que ya no existe)";
  console.log(`  ${tienda.padEnd(28)} ${String(lista.length).padStart(4)} fotos  ${mb(lista.reduce((n, a) => n + a.tamano, 0)).padStart(8)}`);
}

if (!process.argv.includes("--borrar")) {
  console.log("\nNo se borró nada. Para borrarlas: pnpm fotos-sueltas --borrar");
  process.exit(0);
}

let borradas = 0;
for (let i = 0; i < sueltas.length; i += 100) {
  const tanda = sueltas.slice(i, i + 100).map((a) => a.ruta);
  const { error } = await supabase.storage.from(BUCKET).remove(tanda);
  if (error) {
    console.error(`No se pudo borrar una tanda: ${error.message}`);
    continue;
  }
  borradas += tanda.length;
}
console.log(`\nBorradas: ${borradas}.`);
