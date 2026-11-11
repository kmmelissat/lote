import type { Metadata } from "next";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Chat } from "@/features/assistant/ui/Chat";

export const metadata: Metadata = { title: textos.asistente.titulo, description: textos.asistente.descripcion };

export default function AsistentePage({ searchParams }: PageProps<"/asistente">) {
  return <ChatDelNegocio searchParams={searchParams} />;
}

async function ChatDelNegocio({ searchParams }: Pick<PageProps<"/asistente">, "searchParams">) {
  const q = (await searchParams).q;
  // Hasta 300 caracteres: es una pregunta, no un documento
  const pregunta = typeof q === "string" ? q.slice(0, 300) : undefined;
  const { negocio } = await negocioActual();
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[24px] max-md:bottom-20 md:rounded-[32px]">
      <Chat negocioId={negocio.id} preguntaInicial={pregunta} />
    </div>
  );
}
