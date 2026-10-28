import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerIdentidad } from "@/features/catalog/repositorio";
import { TiendaForm } from "@/features/catalog/ui/TiendaForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda;

export const metadata: Metadata = { title: t.titulo };

export default function TiendaAjustesPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  return <TiendaForm identidad={await obtenerIdentidad(supabase, negocio.id)} negocioId={negocio.id} />;
}
