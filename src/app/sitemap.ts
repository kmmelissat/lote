import type { MetadataRoute } from "next";
import { explorarRubros, rutaRubro } from "@/features/catalog/explorar";
import { listarProductosParaMapa } from "@/features/catalog/repositorio";
import { paginasDelMapa } from "@/features/catalog/seo";

import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";

// Se recalcula cada hora: las tiendas y los productos nuevos aparecen sin volver a desplegar.
export const revalidate = 3600;

const fijas: MetadataRoute.Sitemap = [
  { url: urlSitio, changeFrequency: "monthly", priority: 1 },
  { url: `${urlSitio}/marketplace`, changeFrequency: "daily", priority: 0.8 },
  { url: `${urlSitio}/marketplace/tiendas`, changeFrequency: "daily", priority: 0.7 },
  { url: `${urlSitio}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${urlSitio}/terminos`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${urlSitio}/ayuda`, changeFrequency: "monthly", priority: 0.4 },
];

/**
 * La landing, la ayuda, la privacidad, las categorías de Explorar y, de cada tienda con piezas a la vista, su vitrina y
 * cada producto (las variantes de un mismo producto van una sola vez). Si algo falla, quedan las fijas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const publico = createPublicClient();
    const productos = await listarProductosParaMapa(publico);
    const paginas = paginasDelMapa(productos).map(({ tienda, codigo, fecha }): MetadataRoute.Sitemap[number] =>
      codigo === null
        ? { url: `${urlSitio}/c/${tienda}`, changeFrequency: "daily", priority: 0.7 }
        : { url: `${urlSitio}/c/${tienda}/${codigo}`, lastModified: fecha ?? undefined, changeFrequency: "daily", priority: 0.5 },
    );
    const categorias = (await explorarRubros(publico).catch(() => [])).map(
      (r) => ({
        url: `${urlSitio}${rutaRubro(r.id)}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }),
    );
    return [...fijas, ...categorias, ...paginas];
  } catch {
    return fijas;
  }
}
