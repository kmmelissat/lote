import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.pedidos.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.pedidos.titulo} descripcion={textos.pedidos.descripcion} />
      <EmptyState texto={textos.pedidos.vacioTexto} />
    </>
  );
}
