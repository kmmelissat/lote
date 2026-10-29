import type { Metadata } from "next";
import { ConfirmacionPedido } from "@/features/catalog/ui/ConfirmacionPedido";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.vitrina.confirmacion.titulo, robots: { index: false, follow: false } };

export default function ApartadoPage({ params, searchParams }: PageProps<"/c/[negocio]/apartado/[id]">) {
  return <ConfirmacionPedido params={params} searchParams={searchParams} />;
}
