import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { textos } from "@/lib/textos";
import { ImportarCsv } from "@/features/import/ui/ImportarCsv";

export const metadata: Metadata = { title: textos.productos.importar.titulo };

export default function ImportarPage() {
  return (
    <>
      <PageHeader
        titulo={textos.productos.importar.titulo}
        descripcion={textos.productos.importar.descripcion}
      />
      <ImportarCsv />
    </>
  );
}
