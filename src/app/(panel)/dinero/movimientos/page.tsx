import type { Metadata } from "next";
import { PantallaMovimientos } from "@/features/profit/ui/PantallaMovimientos";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.dinero.movimientosTitulo };

export default function Page({ searchParams }: PageProps<"/dinero/movimientos">) {
  return <PantallaMovimientos searchParams={searchParams} seccion="dinero" />;
}
