import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarCategorias } from "@/features/products/repositorio";
import { LoteForm } from "@/features/products/ui/LoteForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.lote;

export const metadata: Metadata = { title: t.titulo };

export default function LotePage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();
  return <LoteForm negocioId={negocio.id} categorias={await listarCategorias(supabase, negocio.id)} />;
}
