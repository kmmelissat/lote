import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { textos } from "@/lib/textos";
import { ImportarCsv } from "@/features/import/ui/ImportarCsv";
import { listarCategorias } from "@/features/products/repositorio";
import { negocioActual } from "@/lib/negocio";

export const metadata: Metadata = { title: textos.productos.importar.titulo };

export default async function ImportarPage() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();
  const categorias = await listarCategorias(supabase, negocio.id);
  return (
    <>
      <PageHeader
        titulo={textos.productos.importar.titulo}
        descripcion={textos.productos.importar.descripcion}
        volver={{ href: "/productos", etiqueta: textos.productos.volver }}
      />
      <ImportarCsv negocioId={negocio.id} categorias={categorias} />
    </>
  );
}
