import type { Route } from "next";
import { conBusqueda } from "@/lib/ruta";
import type { OrdenExplorar } from "../explorar";
import { rutaRubro } from "../explorar";
import { esRubro, rubroDeCategoria } from "../rubros";

export type Vista = "productos" | "tiendas";
export type Filtros = {
  vista: Vista;
  busqueda: string;
  /** El rubro elegido ("ropa", "comida"…), o vacío */
  categoria: string;
  /** Una categoría del catálogo dentro de ese rubro ("Brochas y esponjas"), o vacío */
  sub: string;
  orden: OrdenExplorar;
  min: string;
  max: string;
  /** Solo tiendas que entregan en este departamento, o vacío */
  depto: string;
  gratis: boolean;
  oferta: boolean;
  pagina?: number;
};

/**
 * Arma la dirección de Explorar con los filtros que estén puestos (lo que está por defecto no se escribe).
 * El rubro va en la ruta; búsqueda, precio, orden y página van como parámetros.
 */
export function enlace(f: Filtros): Route {
  const p = new URLSearchParams();
  const enRuta = f.vista === "productos" && esRubro(f.categoria);
  if (f.vista !== "productos") p.set("vista", f.vista);
  if (f.busqueda) p.set("q", f.busqueda);
  if (f.categoria && !enRuta) p.set("categoria", f.categoria);
  // Solo vale dentro de su rubro: al cambiar de rubro se descarta sola
  if (f.sub && rubroDeCategoria(f.sub) === f.categoria) p.set("sub", f.sub);
  if (f.orden !== "recientes") p.set("orden", f.orden);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.depto) p.set("depto", f.depto);
  if (f.gratis) p.set("gratis", "1");
  if (f.oferta) p.set("oferta", "1");
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const base = enRuta && esRubro(f.categoria) ? rutaRubro(f.categoria) : "/marketplace";
  return conBusqueda(base, p);
}

/**
 * El enlace y su rel: lo que lleva parámetros (filtros, orden, páginas) no lo siguen los buscadores. Cambiar un filtro no sube la página
 * (`scroll: false`): quien está mirando las categorías se queda donde está. Solo cambiar de página de resultados vuelve arriba (`alInicio`).
 */
export function enlaceExplorar(f: Filtros, alInicio = false): { href: Route; rel?: string; scroll?: false } {
  const href = enlace(f);
  const base = href.includes("?") ? { href, rel: "nofollow" } : { href };
  return alInicio ? base : { ...base, scroll: false };
}

export const chip = (activo: boolean) =>
  `inline-flex h-10 items-center rounded-full border border-teal-oscuro px-4 text-sm font-bold transition-colors ${
    activo ? "bg-mango" : "bg-crema hover:bg-limon"
  }`;
