import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { textos } from "@/lib/textos";
import { ImportarCsv } from "@/features/import/ui/ImportarCsv";
import { negocioActual } from "@/lib/negocio";

export const metadata: Metadata = { title: textos.productos.importar.titulo };

export default async function ImportarPage() {
  const { negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();
  return (
    <>
      <PageHeader
        titulo={textos.productos.importar.titulo}
        descripcion={textos.productos.importar.descripcion}
        volver={{ href: "/productos", etiqueta: textos.productos.volver }}
      />
      <ImportarCsv />
    </>
  );
}
