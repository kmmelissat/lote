import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { obtenerTarifas } from "@/features/shipping/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { TarifasForm } from "@/features/shipping/ui/TarifasForm";

const t = textos.ajustes.envios;

export const metadata: Metadata = { title: t.titulo };

export default function EnviosPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/ajustes", etiqueta: t.volver }} />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <EmptyState titulo={t.soloDuenaTitulo} texto={t.soloDuena} />;
  return <TarifasForm tarifas={await obtenerTarifas(supabase, negocio.id)} />;
}
