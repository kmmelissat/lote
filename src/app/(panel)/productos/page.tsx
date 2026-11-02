import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { esFalta, esFiltroEstado, esOrden, FILTROS_ESTADO, type Falta, type Orden } from "@/features/products/filtro";
import { categoriasEnUso, listarProductos } from "@/features/products/repositorio";
import { productosQueNoSeMueven } from "@/features/profit/parados";
import { DineroParado } from "@/features/profit/ui/PiezasCuadre";
import { formatearDolares } from "@/lib/formato";
import { AcomodarCategorias } from "@/features/products/ui/AcomodarCategorias";
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
  const abrirParados = params.parados === "1";
  const { supabase, negocio } = await negocioActual();
  const [todos, categorias] = await Promise.all([
    listarProductos(supabase, negocio.id, negocio.puedeGestionar),
    categoriasEnUso(supabase, negocio.id),
  ]);
  if (!todos.length) {
    return (
      <>
        <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
        <EmptyState
          monito="celular"
          titulo={textos.productos.vacioTitulo}
          texto={textos.productos.vacioTextoImportar}
          accion={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/productos/importar" variante="mango" icono="hoja">
                {textos.productos.importar.botonVacio}
              </ButtonLink>
              <ButtonLink href="/productos/nuevo" variante="secundario" icono="mas">
                {textos.productos.agregar}
              </ButtonLink>
            </div>
          }
        />
      </>
    );
  }

  // Productos que todavía no tienen una categoría del catálogo (una por producto, no por variante)
  const sinCategoria = negocio.puedeGestionar ? new Set(todos.filter((p) => !p.categoria).map((p) => p.grupo ?? p.id)).size : 0;

  // Solo quien ve los costos: sin ellos no se sabe cuánto dinero hay parado
  const parados = negocio.puedeGestionar ? await productosQueNoSeMueven(supabase, negocio.id, todos) : null;

  return (
    <>
      <PageHeader
        titulo={textos.productos.titulo}
        descripcion={textos.productos.descripcion}
        accion={
          negocio.puedeGestionar ? (
            <div className="flex flex-wrap items-center gap-2">
              <ButtonLink href="/productos/importar" variante="secundario" icono="hoja">
                {textos.productos.importar.boton}
              </ButtonLink>
              <ButtonLink href="/productos/promociones" variante="secundario" icono="etiqueta">
                {textos.promociones.entrada}
              </ButtonLink>
              <ButtonLink href="/productos/nuevo" variante="mango" icono="mas">
                {textos.productos.agregar}
              </ButtonLink>
            </div>
          ) : undefined
        }
      />
      {sinCategoria > 0 && <AcomodarCategorias sinCategoria={sinCategoria} />}
      {parados && parados.filas.length > 0 && (
        <details id="parados" open={abrirParados} className="group rounded-[24px] border-2 border-teal-oscuro/30 bg-superficie">
          <summary className="flex min-h-12 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 font-bold md:px-5">
            <span>{textos.dinero.cuadre.paradoTitulo}</span>
            <span className="text-sm font-normal text-texto-2">
              {textos.dinero.cuadre.paradoResumen(parados.filas.length, formatearDolares(parados.total))}
            </span>
          </summary>
          <div className="p-2 pt-0 md:p-3 md:pt-0">
            <DineroParado
              fotos={Object.fromEntries(todos.map((p) => [p.id, p.fotos[0]]))}
              productos={parados.filas}
              total={parados.total}
              pctDelInventario={parados.pctDelInventario}
              inventario={parados.inventario}
              dias={parados.dias}
              sinCosto={parados.sinCosto}
            />
          </div>
        </details>
      )}
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
      />
    </>
  );
}
