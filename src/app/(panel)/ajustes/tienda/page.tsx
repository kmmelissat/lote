import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerAjustesVitrina, obtenerIdentidad } from "@/features/catalog/repositorio";
import { idSeccion, TiendaForm } from "@/features/store-settings/ui/TiendaForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda;

export const metadata: Metadata = { title: t.titulo };

export default function TiendaAjustesPage({ searchParams }: PageProps<"/ajustes/tienda">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario searchParams={searchParams} />
    </>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/ajustes/tienda">, "searchParams">) {
  const seccion = idSeccion((await searchParams).seccion);
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  const [identidad, ajustes] = await Promise.all([obtenerIdentidad(supabase, negocio.id), obtenerAjustesVitrina(supabase, negocio.id)]);
  return <TiendaForm identidad={identidad} ajustes={ajustes} negocioId={negocio.id} seccion={seccion} />;
}
