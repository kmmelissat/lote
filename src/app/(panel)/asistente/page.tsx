import type { Metadata } from "next";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Chat } from "@/features/assistant/ui/Chat";
import { LoDeHoy } from "@/features/assistant/ui/LoDeHoy";

export const metadata: Metadata = { title: textos.asistente.titulo, description: textos.asistente.descripcion };

export default function AsistentePage() {
  return <ChatDelNegocio />;
}

async function ChatDelNegocio() {
  const { negocio } = await negocioActual();
  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-112 w-full flex-col gap-4 md:h-[calc(100dvh-3.5rem)] xl:grid xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-h-0 flex-1">
        <Chat negocioId={negocio.id} />
      </div>
      {/* Solo en pantalla ancha: en el celular el chat ocupa todo */}
      <div className="hidden min-h-0 xl:flex xl:flex-col">
        <LoDeHoy />
      </div>
    </div>
  );
}
