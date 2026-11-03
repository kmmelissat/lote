import type { Metadata } from "next";
import { PantallaMovimientos } from "../../_pantallas/PantallaMovimientos";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.gestion.movimientos };

export default function Page({ searchParams }: PageProps<"/gestion/movimientos">) {
  return <PantallaMovimientos searchParams={searchParams} seccion="gestion" />;
}
