import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { esFalta, esFiltroEstado, esOrden, FILTROS_ESTADO, type Falta, type Orden } from "@/features/products/filtro";
import { listarCategorias, listarProductos } from "@/features/products/repositorio";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { ListaProductos as ListaProductosVista } from "@/features/products/ui/ListaProductos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page({ searchParams }: PageProps<"/productos">) {
  return (
    <>
      <AvisoCreado />
      <ListaProductos searchParams={searchParams} />
    </>
  );
}

async function ListaProductos({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const params = await searchParams;
  const texto = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const estado = esFiltroEstado(String(params.estado)) ? (String(params.estado) as (typeof FILTROS_ESTADO)[number]) : "todos";

  const categoria = typeof params.categoria === "string" ? params.categoria.slice(0, 40) : "";
  const orden: Orden = esOrden(String(params.orden)) ? (String(params.orden) as Orden) : "recientes";
  const faltaPedida: Falta | undefined = esFalta(String(params.falta)) ? (String(params.falta) as Falta) : undefined;
  const { supabase, negocio } = await negocioActual();
  const [todos, categorias] = await Promise.all([
    listarProductos(supabase, negocio.id, negocio.puedeGestionar),
    listarCategorias(supabase, negocio.id),
  ]);
  if (!todos.length) {
    return (
      <>
        <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
        <EmptyState
          monito="celular"
          titulo={textos.productos.vacioTitulo}
          texto={textos.productos.vacioTexto}
          accion={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/productos/importar" variante="secundario" icono="hoja">
                {textos.productos.importar.boton}
              </ButtonLink>
              <ButtonLink href="/productos/nuevo" variante="mango" icono="mas">
                {textos.productos.agregar}
              </ButtonLink>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        titulo={textos.productos.titulo}
        descripcion={textos.productos.descripcion}
        accion={
          negocio.puedeGestionar ? (
            <ButtonLink href="/productos/nuevo" variante="mango" icono="mas">
              {textos.productos.agregar}
            </ButtonLink>
          ) : undefined
        }
      />
      <ListaProductosVista
        productos={todos.map((p) => ({ ...p, desglose: undefined }))}
        umbral={negocio.umbralPocoStock}
        textoInicial={texto}
        estadoInicial={estado}
        categorias={categorias}
        categoriaInicial={categorias.includes(categoria) ? categoria : ""}
        ordenInicial={orden}
        // "Sin costo" solo lo ve quien ve los costos
        faltaInicial={faltaPedida === "costo" && !negocio.puedeGestionar ? undefined : faltaPedida}
        puedeGestionar={negocio.puedeGestionar}
      />
    </>
  );
}
