import type { Metadata } from "next";
import { rutaRubro } from "@/features/catalog/explorar";
import { esRubro, nombreDeRubro } from "@/features/catalog/rubros";
import { PaginaExplorar } from "@/features/catalog/ui/PaginaExplorar";
import { textos } from "@/lib/textos";

const t = textos.explorar;

const categoriaDe = async (params: PageProps<"/marketplace/categoria/[nombre]">["params"]) =>
  decodeURIComponent((await params).nombre).trim().slice(0, 80);

/**
 * Cada rubro es una página propia, sin parámetros: la que se indexa. Con filtros encima, ya no.
 * Las direcciones viejas con el nombre de una categoría ("/marketplace/categoria/Blusas") llevan a su rubro.
 */
export async function generateMetadata({ params, searchParams }: PageProps<"/marketplace/categoria/[nombre]">): Promise<Metadata> {
  const pedida = await categoriaDe(params);
  if (!esRubro(pedida)) return { robots: { index: false, follow: true } };
  const nombre = nombreDeRubro(pedida);
  const conFiltros = Object.keys(await searchParams).length > 0;
  const titulo = t.tituloCategoria(nombre);
  const descripcion = t.descripcionCategoria(nombre);
  const url = rutaRubro(pedida);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url },
    robots: conFiltros ? { index: false, follow: true } : undefined,
    openGraph: { title: titulo, description: descripcion, url, type: "website" },
  };
}

export default async function CategoriaPage({ params, searchParams }: PageProps<"/marketplace/categoria/[nombre]">) {
  return <PaginaExplorar searchParams={searchParams} categoriaRuta={await categoriaDe(params)} />;
}
