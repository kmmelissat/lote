import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Chat } from "@/features/assistant/ui/Chat";

export const metadata: Metadata = { title: textos.asistente.titulo };

export default function AsistentePage() {
  return (
    <>
      <PageHeader titulo={textos.asistente.titulo} descripcion={textos.asistente.descripcion} />
      <Suspense>
        <ChatDelNegocio />
      </Suspense>
    </>
  );
}

async function ChatDelNegocio() {
  const { negocio } = await negocioActual();
  return <Chat negocioId={negocio.id} />;
}
