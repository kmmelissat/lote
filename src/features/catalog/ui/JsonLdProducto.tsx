import { JsonLd } from "@/lib/jsonld";
import { urlFoto } from "@/lib/fotos";
import { urlSitio } from "@/lib/sitio";
import type { ProductoPublico, ResumenResenas } from "../repositorio";
import { ofertaDe } from "../seo";

/**
 * Lo que leen los buscadores del producto: nombre, fotos, precio y reseñas (para las estrellas en los resultados), y las
 * migas, así Google muestra "Tienda › Producto" en vez de la dirección.
 */
export function JsonLdProducto({
  producto: p,
  nombre,
  familia,
  url,
  tienda,
  resenas,
}: {
  producto: ProductoPublico;
  nombre: string;
  familia: ProductoPublico[];
  /** La dirección canónica del producto, completa */
  url: string;
  tienda: { nombre: string; slug: string };
  resenas: ResumenResenas;
}) {
  return (
    <>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: nombre,
          description: p.descripcion ?? undefined,
          image: p.fotos.map((f) => urlFoto(f)),
          sku: String(p.codigo),
          brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
          category: p.categoria ?? undefined,
          itemCondition: p.condicion === "usado" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
          offers: ofertaDe(familia, url, tienda.nombre),
          ...(resenas.total > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: resenas.promedio.toFixed(1),
                  reviewCount: resenas.total,
                },
                review: resenas.resenas.slice(0, 5).map((r) => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: r.nombre },
                  reviewRating: { "@type": "Rating", ratingValue: r.estrellas, bestRating: 5 },
                  reviewBody: r.texto ?? undefined,
                  datePublished: r.creadoEn.toISOString().slice(0, 10),
                })),
              }
            : {}),
        }}
      />
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: tienda.nombre, item: `${urlSitio}/c/${tienda.slug}` },
            { "@type": "ListItem", position: 2, name: nombre, item: url },
          ],
        }}
      />
    </>
  );
}
