import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ProbarMenu } from "@/components/nav/ProbarMenu";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.nav.vistas.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.nav.vistas.titulo} descripcion={textos.nav.vistas.texto} />
      <ProbarMenu />
    </>
  );
}
