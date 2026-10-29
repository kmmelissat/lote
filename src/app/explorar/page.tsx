import type { Metadata } from "next";
import { PaginaExplorar } from "@/features/catalog/ui/PaginaExplorar";
import { textos } from "@/lib/textos";

const t = textos.explorar;

/** El título y la descripción cambian con la categoría; lo que es una búsqueda o un filtro de precio no se indexa (son páginas sueltas). */
export async function generateMetadata({ searchParams }: PageProps<"/explorar">): Promise<Metadata> {
  const params = await searchParams;
  const texto = (k: string) => (typeof params[k] === "string" ? (params[k] as string).trim().slice(0, 80) : "");
  const categoria = texto("categoria");
  const esFiltro = Boolean(texto("q") || texto("min") || texto("max") || texto("orden") || texto("vista") || texto("pagina"));
  const titulo = categoria ? t.tituloCategoria(categoria) : t.tituloPagina;
  const descripcion = categoria ? t.descripcionCategoria(categoria) : t.descripcion;
  const url = categoria ? `/explorar?categoria=${encodeURIComponent(categoria)}` : "/explorar";
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url },
    robots: esFiltro ? { index: false, follow: true } : undefined,
    openGraph: { title: titulo, description: descripcion, url, type: "website" },
  };
}

export default function ExplorarPage({ searchParams }: PageProps<"/explorar">) {
  return <PaginaExplorar searchParams={searchParams} />;
}
