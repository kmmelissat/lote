import type { Metadata } from "next";
import { DeudasDelPeriodo } from "@/features/gestion/ui/DeudasDelPeriodo";
import { PantallaMovimientos } from "@/features/profit/ui/PantallaMovimientos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.gestion.movimientos };

export default function Page({ searchParams }: PageProps<"/gestion/movimientos">) {
  return <PantallaMovimientos searchParams={searchParams} seccion="gestion" despues={(periodo) => <DeudasConNegocio periodo={periodo} />} />;
}

async function DeudasConNegocio({ periodo }: { periodo: Parameters<typeof DeudasDelPeriodo>[0]["periodo"] }) {
  const { supabase, negocio } = await negocioActual();
  return <DeudasDelPeriodo supabase={supabase} negocioId={negocio.id} periodo={periodo} />;
}
