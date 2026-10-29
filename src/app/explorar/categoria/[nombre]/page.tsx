import type { Metadata } from "next";
import { rutaCategoria } from "@/features/catalog/explorar";
import { PaginaExplorar } from "@/features/catalog/ui/PaginaExplorar";
import { textos } from "@/lib/textos";

const t = textos.explorar;

const categoriaDe = async (params: PageProps<"/explorar/categoria/[nombre]">["params"]) =>
  decodeURIComponent((await params).nombre).trim().slice(0, 80);

/** Cada categoría es una página propia, sin parámetros: la que se indexa. Con filtros encima, ya no. */
export async function generateMetadata({ params, searchParams }: PageProps<"/explorar/categoria/[nombre]">): Promise<Metadata> {
  const categoria = await categoriaDe(params);
  const conFiltros = Object.keys(await searchParams).length > 0;
  const titulo = t.tituloCategoria(categoria);
  const descripcion = t.descripcionCategoria(categoria);
  const url = rutaCategoria(categoria);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url },
    robots: conFiltros ? { index: false, follow: true } : undefined,
    openGraph: { title: titulo, description: descripcion, url, type: "website" },
  };
}

export default async function CategoriaPage({ params, searchParams }: PageProps<"/explorar/categoria/[nombre]">) {
  return <PaginaExplorar searchParams={searchParams} categoriaRuta={await categoriaDe(params)} />;
}
