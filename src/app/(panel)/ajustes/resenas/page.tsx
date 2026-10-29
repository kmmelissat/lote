import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarProductos } from "@/features/products/repositorio";
import { contarPendientes, listarResenas } from "@/features/reviews/repositorio";
import { PanelResenas } from "@/features/reviews/ui/PanelResenas";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.resenas;

export const metadata: Metadata = { title: t.titulo };

export default function ResenasPage() {
  return <Contenido />;
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
        <p className="text-texto-2">{t.soloGestion}</p>
      </>
    );
  }
  const [resenas, pendientes, productos] = await Promise.all([
    listarResenas(supabase, negocio.id),
    contarPendientes(supabase, negocio.id),
    listarProductos(supabase, negocio.id, false),
  ]);
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={pendientes > 0 ? t.pendientes(pendientes) : t.descripcion} />
      <PanelResenas resenas={resenas} productos={productos.map((p) => ({ codigo: p.codigo, nombre: p.nombre }))} />
    </>
  );
}
