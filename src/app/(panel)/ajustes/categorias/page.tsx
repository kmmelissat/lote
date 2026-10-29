import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarCategoriasConConteo } from "@/features/products/repositorio";
import { PanelCategorias } from "@/features/products/ui/PanelCategorias";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.categoriasPanel;

export const metadata: Metadata = { title: t.titulo };

export default function CategoriasPage() {
  return <Contenido />;
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      {negocio.puedeGestionar ? (
        <PanelCategorias categorias={await listarCategoriasConConteo(supabase, negocio.id)} />
      ) : (
        <p className="text-texto-2">{t.soloGestion}</p>
      )}
    </>
  );
}
