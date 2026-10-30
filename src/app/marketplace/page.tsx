import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { PaginaExplorar } from "@/features/catalog/ui/PaginaExplorar";
import { textos } from "@/lib/textos";

const t = textos.explorar;

/** Lo que es una búsqueda o un filtro de precio no se indexa (son páginas sueltas). Las categorías tienen su propia ruta. */
export async function generateMetadata({ searchParams }: PageProps<"/marketplace">): Promise<Metadata> {
  const params = await searchParams;
  const texto = (k: string) => (typeof params[k] === "string" ? (params[k] as string).trim().slice(0, 80) : "");
  const esFiltro = Boolean(texto("q") || texto("min") || texto("max") || texto("orden") || texto("vista") || texto("pagina") || texto("categoria"));
  return {
    title: { absolute: t.tituloPagina },
    description: t.descripcion,
    alternates: { canonical: "/marketplace" },
    robots: esFiltro ? { index: false, follow: true } : undefined,
    openGraph: { title: t.tituloPagina, description: t.descripcion, url: "/marketplace", type: "website" },
  };
}

export default async function ExplorarPage({ searchParams }: PageProps<"/marketplace">) {
  // La dirección vieja de una categoría (?categoria=X sola) pasa a la nueva, sin parámetros
  const params = await searchParams;
  const claves = Object.keys(params);
  if (claves.length === 1 && typeof params.categoria === "string" && params.categoria.trim()) {
    permanentRedirect(`/marketplace/categoria/${encodeURIComponent(params.categoria.trim().slice(0, 80))}`);
  }
  return <PaginaExplorar searchParams={searchParams} />;
}
