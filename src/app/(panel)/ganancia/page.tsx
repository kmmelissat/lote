import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.ganancia.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.ganancia.titulo} descripcion={textos.ganancia.descripcion} />
      <EmptyState texto={textos.ganancia.vacioTexto} />
    </>
  );
}
