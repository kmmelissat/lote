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
//
// La misma limpieza corre sola cada día en /api/cron/avisos (src/lib/fotosSueltas.ts); esto es para verla y hacerla a mano.

import { createClient } from "@supabase/supabase-js";
import { borrarRutas, encontrarSueltas, GRACIA_MS, type Archivo } from "../src/lib/fotosSueltas.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !llave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const supabase = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
const GRACIA = process.argv.includes("--sin-espera") ? 0 : GRACIA_MS;

const mb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const [{ archivos, sinUsar, sueltas, recientes }, { data: negocios }] = await Promise.all([
  encontrarSueltas(supabase as never, GRACIA),
  supabase.from("negocio").select("id, nombre"),
]);
const nombreDe = new Map((negocios ?? []).map((n) => [n.id as string, n.nombre as string]));
const ahora = Date.now();

console.log(`En el bucket: ${archivos.length} archivos (${mb(archivos.reduce((n, a) => n + a.tamano, 0))}); en uso: ${archivos.length - sinUsar.length}.`);
if (recientes.length) console.log(`Sin usar pero de las últimas 24 h (se dejan): ${recientes.length}.`);
if (process.argv.includes("--detalle")) {
  for (const a of sinUsar) {
    const reciente = ahora - a.creado.getTime() <= GRACIA ? "  (reciente, se deja)" : "";
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

console.log(`\nBorradas: ${await borrarRutas(supabase as never, sueltas.map((a) => a.ruta))}.`);
