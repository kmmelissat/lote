import type { MetadataRoute } from "next";
import { explorarRubros, rutaRubro } from "@/features/catalog/explorar";
import { listarProductosPublicos } from "@/features/catalog/repositorio";
import { codigosParaIndexar } from "@/features/catalog/seo";

import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { createServiceClient } from "@/lib/supabase/servicio";

// Se recalcula cada hora: las tiendas y los productos nuevos aparecen sin volver a desplegar.
export const revalidate = 3600;

const MAXIMO_TIENDAS = 200;

const fijas: MetadataRoute.Sitemap = [
  { url: urlSitio, changeFrequency: "monthly", priority: 1 },
  { url: `${urlSitio}/marketplace`, changeFrequency: "daily", priority: 0.8 },
  { url: `${urlSitio}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${urlSitio}/ayuda`, changeFrequency: "monthly", priority: 0.4 },
];

/**
 * La landing, la ayuda, la privacidad, las categorías de Explorar y, de cada tienda con piezas a la vista, su vitrina y
 * cada producto (las variantes de un mismo producto van una sola vez). Si algo falla, quedan las fijas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // La lista de tiendas no es pública (RLS): solo este mapa la lee, con la clave de servicio, y solo toma el enlace.
    const { data } = await createServiceClient()
      .from("negocio")
      .select("slug")
      .limit(MAXIMO_TIENDAS);
    const publico = createPublicClient();
    const paginas = await Promise.all(
      (data ?? []).map(async ({ slug }): Promise<MetadataRoute.Sitemap> => {
        const productos = await listarProductosPublicos(publico, slug);
        if (!productos.some((p) => p.disponibles > 0)) return [];
        // La fecha más nueva del grupo: así el buscador sabe cuándo volver
        const fechaDe = (codigo: number) =>
          productos.find((p) => p.codigo === codigo)?.creadoEn ?? undefined;
        return [
          {
            url: `${urlSitio}/c/${slug}`,
            changeFrequency: "daily",
            priority: 0.7,
          },
          ...codigosParaIndexar(productos).map((codigo) => ({
            url: `${urlSitio}/c/${slug}/${codigo}`,
            lastModified: fechaDe(codigo),
            changeFrequency: "daily" as const,
            priority: 0.5,
          })),
        ];
      }),
    );
    const categorias = (await explorarRubros(publico).catch(() => [])).map(
      (r) => ({
        url: `${urlSitio}${rutaRubro(r.id)}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }),
    );
    return [...fijas, ...categorias, ...paginas.flat()];
  } catch {
    return fijas;
  }
}
