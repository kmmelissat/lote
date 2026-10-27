import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.ajustes.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.ajustes.titulo} descripcion={textos.ajustes.descripcion} />
      <EmptyState texto={textos.ajustes.vacioTexto} />
    </>
  );
}
