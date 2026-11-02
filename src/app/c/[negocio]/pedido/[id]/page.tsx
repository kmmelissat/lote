import type { Metadata } from "next";
import { ConfirmacionPedido } from "@/features/catalog/ui/ConfirmacionPedido";
import { textos } from "@/lib/textos";

// El título de la pestaña no dice "apartado": la misma página sirve para una compra y para un apartado, en cualquier etapa
export const metadata: Metadata = { title: textos.vitrina.confirmacion.tituloPagina, robots: { index: false, follow: false } };

export default function PedidoPage({ params, searchParams }: PageProps<"/c/[negocio]/pedido/[id]">) {
  return <ConfirmacionPedido params={params} searchParams={searchParams} />;
}
