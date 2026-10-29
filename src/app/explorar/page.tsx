import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { rutaCategoria } from "@/features/catalog/explorar";
import { PaginaExplorar } from "@/features/catalog/ui/PaginaExplorar";
import { textos } from "@/lib/textos";

const t = textos.explorar;

/** Lo que es una búsqueda o un filtro de precio no se indexa (son páginas sueltas). Las categorías tienen su propia ruta. */
export async function generateMetadata({ searchParams }: PageProps<"/explorar">): Promise<Metadata> {
  const params = await searchParams;
  const texto = (k: string) => (typeof params[k] === "string" ? (params[k] as string).trim().slice(0, 80) : "");
  const esFiltro = Boolean(texto("q") || texto("min") || texto("max") || texto("orden") || texto("vista") || texto("pagina") || texto("categoria"));
  return {
    title: { absolute: t.tituloPagina },
    description: t.descripcion,
    alternates: { canonical: "/explorar" },
    robots: esFiltro ? { index: false, follow: true } : undefined,
    openGraph: { title: t.tituloPagina, description: t.descripcion, url: "/explorar", type: "website" },
  };
}

export default async function ExplorarPage({ searchParams }: PageProps<"/explorar">) {
  // La dirección vieja de una categoría (?categoria=X sola) pasa a la nueva, sin parámetros
  const params = await searchParams;
  const claves = Object.keys(params);
  if (claves.length === 1 && typeof params.categoria === "string" && params.categoria.trim()) {
    permanentRedirect(rutaCategoria(params.categoria.trim().slice(0, 80)));
  }
  return <PaginaExplorar searchParams={searchParams} />;
}
