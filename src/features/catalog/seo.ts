import { aDolares, type Centavos } from "@/domain";

type ConGrupo = { codigo: number; grupo: string | null };

/**
 * Las variantes de un producto son páginas casi iguales (cambia la talla o el color). Para los buscadores
 * todas apuntan a una sola: la de menor código del grupo. Sin grupo, la página es la suya.
 */
export function codigoCanonico(producto: ConGrupo, todos: readonly ConGrupo[]): number {
  if (!producto.grupo) return producto.codigo;
  return Math.min(producto.codigo, ...todos.filter((o) => o.grupo === producto.grupo).map((o) => o.codigo));
}

/** Una página por producto en el mapa del sitio: las variantes no se repiten. */
export function codigosParaIndexar(productos: readonly ConGrupo[]): number[] {
  return [...new Set(productos.map((p) => codigoCanonico(p, productos)))];
}

type Variante = { precio: Centavos; disponibles: number };

const DISPONIBLE = "https://schema.org/InStock";
const AGOTADO = "https://schema.org/OutOfStock";

/**
 * La oferta de schema.org: un precio si es uno solo, o un rango (AggregateOffer) cuando las variantes
 * cuestan distinto. Los precios van en dólares con dos decimales, como los pide Google.
 */
export function ofertaDe(familia: readonly Variante[], url: string, vendedor: string) {
  const precios = familia.map((v) => v.precio);
  const disponible = familia.some((v) => v.disponibles > 0);
  const comun = {
    url,
    priceCurrency: "USD",
    availability: disponible ? DISPONIBLE : AGOTADO,
    seller: { "@type": "Organization", name: vendedor },
  };
  const bajo = Math.min(...precios);
  const alto = Math.max(...precios);
  if (bajo === alto) return { "@type": "Offer", price: aDolares(bajo).toFixed(2), ...comun };
  return {
    "@type": "AggregateOffer",
    lowPrice: aDolares(bajo).toFixed(2),
    highPrice: aDolares(alto).toFixed(2),
    offerCount: familia.length,
    ...comun,
  };
}
