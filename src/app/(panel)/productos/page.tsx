import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { MenuAcciones } from "@/components/ui/MenuAcciones";
import { ButtonLink } from "@/components/ui/Button";
import { EnlacePunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { esFalta, esFiltroEstado, esOrden, FILTROS_ESTADO, type Falta, type Orden } from "@/features/products/filtro";
import { categoriasEnUso, listarProductos } from "@/features/products/repositorio";
import { productosQueNoSeMueven } from "@/features/profit/parados";
import { DineroParado } from "@/features/profit/ui/PiezasCuadre";
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
            <>
              {/* En celular: lo principal ancho y lo demás guardado en el menú "⋯" */}
              <div className="flex w-full items-center gap-2 md:hidden">
                <EnlacePunch href="/productos/nuevo" variante="primario" className="flex-1">
                  <Icon nombre="mas" className="size-4" />
                  {textos.productos.agregar}
                </EnlacePunch>
                <MenuAcciones
                  etiqueta={textos.productos.buscar.masAcciones}
                  acciones={[
                    { etiqueta: textos.productos.importar.boton, icono: "hoja", href: "/productos/importar" },
                    { etiqueta: textos.promociones.entrada, icono: "etiqueta", href: "/productos/promociones" },
                  ]}
                />
              </div>
              <div className="hidden flex-wrap items-center gap-2 md:flex">
                <EnlacePunch href="/productos/importar">
                  <Icon nombre="hoja" className="size-4" />
                  {textos.productos.importar.boton}
                </EnlacePunch>
                <EnlacePunch href="/productos/promociones">
                  <Icon nombre="etiqueta" className="size-4" />
                  {textos.promociones.entrada}
                </EnlacePunch>
                <EnlacePunch href="/productos/nuevo" variante="primario">
                  <Icon nombre="mas" className="size-4" />
                  {textos.productos.agregar}
                </EnlacePunch>
              </div>
            </>
          ) : undefined
        }
      />
      {(sinCategoria > 0 || (parados && parados.filas.length > 0)) && (
        <div className="mb-4 flex flex-col gap-3">
          {sinCategoria > 0 && <AcomodarCategorias sinCategoria={sinCategoria} />}
          {parados && parados.filas.length > 0 && (
            <DineroParado
              id="parados"
              abierto={abrirParados}
              fotos={Object.fromEntries(todos.map((p) => [p.id, p.fotos[0]]))}
              productos={parados.filas}
              total={parados.total}
              pctDelInventario={parados.pctDelInventario}
              inventario={parados.inventario}
              dias={parados.dias}
              sinCosto={parados.sinCosto}
            />
          )}
        </div>
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
