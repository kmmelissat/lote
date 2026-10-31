import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerCliente } from "@/features/customers/repositorio";
import { FichaCliente } from "@/features/customers/ui/FichaCliente";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.clientes;

export const metadata: Metadata = { title: t.titulo };

export default function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  return <Ficha params={params} />;
}

async function Ficha({ params }: Pick<PageProps<"/clientes/[id]">, "params">) {
  const id = (await params).id;
  if (!esUuid(id)) notFound();

  const { supabase, negocio } = await negocioActual();
  const c = await obtenerCliente(supabase, negocio.id, id);
  if (!c) notFound();

  return (
    <>
      <PageHeader titulo={c.nombre} descripcion={t.pedidos(c.resumen.pedidos)} volver={{ href: "/clientes", etiqueta: t.volver }} />
      <FichaCliente cliente={c} negocio={negocio.nombre} />
    </>
  );
}
