import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerTarifas } from "@/features/shipping/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { TarifasForm } from "./TarifasForm";

const t = textos.ajustes.envios;

export const metadata: Metadata = { title: t.titulo };

export default function EnviosPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Suspense>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  return <TarifasForm tarifas={await obtenerTarifas(supabase, negocio.id)} />;
}
