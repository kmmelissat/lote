import type { Metadata } from "next";
import { PaginaTiendas } from "@/features/catalog/ui/PaginaTiendas";
import { textos } from "@/lib/textos";

const t = textos.explorar.tiendasPagina;

/** Una búsqueda por nombre no se indexa; la lista y sus categorías sí. */
export async function generateMetadata({ searchParams }: PageProps<"/marketplace/tiendas">): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: { absolute: t.titulo },
    description: t.descripcion,
    alternates: { canonical: "/marketplace/tiendas" },
    robots: typeof q === "string" && q.trim() ? { index: false, follow: true } : undefined,
    openGraph: { title: t.titulo, description: t.descripcion, url: "/marketplace/tiendas", type: "website" },
  };
}

export default function TiendasPage({ searchParams }: PageProps<"/marketplace/tiendas">) {
  return <PaginaTiendas searchParams={searchParams} />;
}
