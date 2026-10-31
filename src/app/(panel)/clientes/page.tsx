import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { esOrdenCliente, filtrarClientes, ordenarClientes, type OrdenCliente } from "@/features/customers/filtro";
import { listarClientes } from "@/features/customers/repositorio";
import { ListaClientes } from "@/features/customers/ui/ListaClientes";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.clientes;

export const metadata: Metadata = { title: t.titulo };

export default function Page({ searchParams }: PageProps<"/clientes">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Lista searchParams={searchParams} />
    </>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/clientes">, "searchParams">) {
  const params = await searchParams;
  const texto = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const soloConSaldo = params.saldo === "1";
  const orden: OrdenCliente = esOrdenCliente(String(params.orden)) ? (String(params.orden) as OrdenCliente) : "deben";

  const { supabase, negocio } = await negocioActual();
  const todos = await listarClientes(supabase, negocio.id);

  if (!todos.length) return <EmptyState monito="saluda" titulo={t.vacioTitulo} texto={t.vacioTexto} />;

  return (
    <ListaClientes
      todos={todos}
      clientes={ordenarClientes(filtrarClientes(todos, { texto, soloConSaldo }), orden)}
      texto={texto}
      soloConSaldo={soloConSaldo}
      orden={orden}
      negocio={negocio.nombre}
    />
  );
}
