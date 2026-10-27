import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{textos.productos.titulo}</h1>
      <EmptyState texto={textos.productos.vacioTexto} />
    </>
  );
}
