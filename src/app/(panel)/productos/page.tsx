import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { esFiltroEstado, FILTROS_ESTADO } from "@/features/products/filtro";
import { listarProductos } from "@/features/products/repositorio";
import { ListaProductos as ListaProductosVista } from "@/features/products/ui/ListaProductos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page({ searchParams }: PageProps<"/productos">) {
  return (
    <>
      <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
      <ListaProductos searchParams={searchParams} />
    </>
  );
}

async function ListaProductos({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const params = await searchParams;
  const texto = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const estado = esFiltroEstado(String(params.estado)) ? (String(params.estado) as (typeof FILTROS_ESTADO)[number]) : "todos";

  const { supabase, negocio } = await negocioActual();
  const todos = await listarProductos(supabase, negocio.id, negocio.puedeGestionar);
  if (!todos.length) {
    return (
      <EmptyState
        titulo={textos.productos.vacioTitulo}
        texto={textos.productos.vacioTexto}
        accion={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/productos/importar" variante="secundario">
              {textos.productos.importar.boton}
            </ButtonLink>
            <ButtonLink href="/productos/nuevo">{textos.productos.agregar}</ButtonLink>
          </div>
        }
      />
    );
  }

  return (
    <ListaProductosVista
      productos={todos.map((p) => ({ ...p, desglose: undefined }))}
      umbral={negocio.umbralPocoStock}
      textoInicial={texto}
      estadoInicial={estado}
    />
  );
}
