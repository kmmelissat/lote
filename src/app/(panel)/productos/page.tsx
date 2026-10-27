import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
      <EmptyState texto={textos.productos.vacioTexto} />
    </>
  );
}
