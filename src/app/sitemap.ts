import type { MetadataRoute } from "next";
import { listarProductosPublicos } from "@/features/catalog/repositorio";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { createServiceClient } from "@/lib/supabase/servicio";

// Se recalcula cada hora: las tiendas y los productos nuevos aparecen sin volver a desplegar.
export const revalidate = 3600;

const MAXIMO_TIENDAS = 200;

const fijas: MetadataRoute.Sitemap = [
  { url: urlSitio, changeFrequency: "monthly", priority: 1 },
  { url: `${urlSitio}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
];

/** La landing, la privacidad y, de cada tienda con piezas a la vista, su vitrina y cada producto. Si algo falla, quedan las fijas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // La lista de tiendas no es pública (RLS): solo este mapa la lee, con la clave de servicio, y solo toma el enlace.
    const { data } = await createServiceClient().from("negocio").select("slug").limit(MAXIMO_TIENDAS);
    const publico = createPublicClient();
    const paginas = await Promise.all(
      (data ?? []).map(async ({ slug }): Promise<MetadataRoute.Sitemap> => {
        const productos = (await listarProductosPublicos(publico, slug)).filter((p) => p.disponibles > 0);
        if (!productos.length) return [];
        return [
          { url: `${urlSitio}/c/${slug}`, changeFrequency: "daily", priority: 0.7 },
          ...productos.map((p) => ({ url: `${urlSitio}/c/${slug}/${p.codigo}`, changeFrequency: "daily" as const, priority: 0.5 })),
        ];
      }),
    );
    return [...fijas, ...paginas.flat()];
  } catch {
    return fijas;
  }
}
