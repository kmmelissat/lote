import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { textos } from "@/lib/textos";
import { Chat } from "./Chat";

export const metadata: Metadata = { title: textos.asistente.titulo };

export default function AsistentePage() {
  return (
    <>
      <PageHeader titulo={textos.asistente.titulo} descripcion={textos.asistente.descripcion} />
      <Chat />
    </>
  );
}
