import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { PegarChat } from "@/features/assistant/ui/PegarChat";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.chatCliente.titulo };

export default function PegarChatPage() {
  return (
    <>
      <PageHeader titulo={textos.chatCliente.titulo} descripcion={textos.chatCliente.subtitulo} />
      <PegarChat />
    </>
  );
}
