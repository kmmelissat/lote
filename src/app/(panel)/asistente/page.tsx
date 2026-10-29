import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Chat } from "@/features/assistant/ui/Chat";

export const metadata: Metadata = { title: textos.asistente.titulo };

export default function AsistentePage() {
  return (
    <>
      <PageHeader titulo={textos.asistente.titulo} descripcion={textos.asistente.descripcion} />
      <ChatDelNegocio />
    </>
  );
}

async function ChatDelNegocio() {
  const { negocio } = await negocioActual();
  return <div className="h-[calc(100dvh-14rem)] min-h-96 md:h-[calc(100dvh-16rem)]"><Chat negocioId={negocio.id} /></div>;
}
