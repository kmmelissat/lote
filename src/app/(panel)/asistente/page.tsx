import type { Metadata } from "next";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Chat } from "@/features/assistant/ui/Chat";

export const metadata: Metadata = { title: textos.asistente.titulo, description: textos.asistente.descripcion };

export default function AsistentePage() {
  return <ChatDelNegocio />;
}

async function ChatDelNegocio() {
  const { negocio } = await negocioActual();
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-112 w-full flex-col md:h-[calc(100dvh-3.5rem)]">
      <Chat negocioId={negocio.id} />
    </div>
  );
}
