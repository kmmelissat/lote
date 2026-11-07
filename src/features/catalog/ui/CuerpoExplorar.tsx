import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";
import { ORDENES_EXPLORAR, type OrdenExplorar, type ProductoExplorar, type TiendaExplorar } from "../explorar";
import { SeccionCalle } from "./CalleTiendas";
import { chip, enlaceExplorar, type Filtros, type Vista } from "./enlacesExplorar";
import { Paginacion } from "./Paginacion";
import { TarjetaProducto, type MarcaDeTienda } from "./TarjetaProducto";
import { TarjetaTienda } from "./TarjetaTienda";

const t = textos.explorar;

/** La barra de resultados y la grilla: productos, tiendas o el vacío. */
export function CuerpoExplorar({
  vista,
  total,
  visibles,
  min,
  max,
  depto,
  gratis,
  oferta,
  activos,
  panel,
  orden,
  f,
  vacio,
  filtrando,
  tiendas,
  marcaDe,
  portada,
  hayMas,
  pagina,
  porPagina,
}: {
  vista: Vista;
  total: number | null;
  visibles: ProductoExplorar[];
  min: string;
  max: string;
  depto: string;
  gratis: boolean;
  oferta: boolean;
  activos: number;
  panel: ReactNode;
  orden: OrdenExplorar;
  f: Filtros;
  vacio: boolean;
  filtrando: boolean;
  tiendas: TiendaExplorar[];
  marcaDe: (p: { tiendaSlug: string }) => MarcaDeTienda;
  portada: boolean;
  hayMas: boolean;
  pagina: number;
  porPagina: number;
}) {
  return (
          <div className="flex min-w-0 flex-col gap-4">
            {vista === "productos" && (
              <section
                id="todos"
                aria-label={t.filtros}
                className="flex scroll-mt-4 flex-col gap-3"
              >
                {/* Cuántos hay, y a la derecha los filtros y el orden: menús chicos que se abren, no campos sueltos */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold">
                    {t.resultados(total ?? visibles.length)}
                  </p>
                  <div className="flex items-center gap-2">
                    <details
                      key={`filtros-${min}-${max}-${depto}-${gratis}-${oferta}`}
                      className="relative lg:hidden"
                    >
                      <summary
                        className={`${chip(activos > 0)} cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden`}
                      >
                        <Icon nombre="filtros" className="size-4" />
                        {t.filtros}
                        {activos > 0 && (
                          <span className="rounded-full bg-teal-oscuro px-2 text-xs text-white">
                            {activos}
                          </span>
                        )}
                      </summary>
                      <div className="fixed inset-x-3 bottom-3 z-40 max-h-[80dvh] overflow-y-auto rounded-[24px] border border-teal-oscuro bg-crema p-4 shadow-dura">
                        {panel}
                      </div>
                    </details>
                    <details key={`orden-${orden}`} className="relative">
                      <summary
                        className={`${chip(false)} cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden`}
                      >
                        {t.ordenActual(t.ordenes[orden])}
                        <Icon nombre="flecha" className="size-4" />
                      </summary>
                      <ul className="absolute right-0 z-20 mt-2 flex w-64 max-w-[calc(100vw-2rem)] flex-col rounded-[20px] border border-teal-oscuro bg-white p-2 shadow-dura max-md:fixed max-md:inset-x-4 max-md:top-auto max-md:w-auto">
                        {ORDENES_EXPLORAR.map((o) => (
                          <li key={o}>
                            <Link
                              {...enlaceExplorar({ ...f, orden: o, pagina: 1 })}
                              aria-current={o === orden ? "true" : undefined}
                              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-crema aria-[current=true]:bg-limon aria-[current=true]:font-bold"
                            >
                              {t.ordenes[o]}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              </section>
            )}

            <div className="flex min-w-0 flex-col gap-4">
              {vista === "tiendas" && (
                <Link
                  {...enlaceExplorar({ ...f, vista: "productos", pagina: 1 })}
                  className="inline-flex min-h-11 items-center self-start text-sm font-bold text-teal underline"
                >
                  ← {t.volverProductos}
                </Link>
              )}
              {vacio ? (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-teal-oscuro bg-white px-6 py-12 text-center">
                  <Monito nombre="caja" className="w-20 text-teal/50" />
                  <h2 className="text-lg font-bold">
                    {filtrando ? t.sinResultadosTitulo : t.sinTiendasTitulo}
                  </h2>
                  <p className="max-w-sm text-texto-2">
                    {filtrando ? t.sinResultadosTexto : t.sinTiendasTexto}
                  </p>
                  {filtrando && (
                    <Link href="/marketplace" className={chip(false)}>
                      {t.limpiar}
                    </Link>
                  )}
                </div>
              ) : vista === "tiendas" ? (
                <>
                  {/* Las tiendas como una calle de El Salvador: se toca una casita y se entra. Abajo, el detalle de cada una */}
                  <SeccionCalle tiendas={tiendas} />
                  <h2 className="mt-4 text-xl font-bold">{t.calle.todas}</h2>
                  <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {tiendas.map((tienda, i) => (
                      <li key={tienda.slug}>
                        <TarjetaTienda tienda={tienda} eager={i < 3} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-7">
                    {visibles.map((p, i) => (
                      <li
                        key={`${p.tiendaSlug}-${p.codigo}`}
                        className="h-full"
                      >
                        <TarjetaProducto
                          p={p}
                          marca={marcaDe(p)}
                          eager={!portada && i < 5}
                        />
                      </li>
                    ))}
                    {/* Al final de la última página: una invitación para quien vende, que además tapa el hueco de la fila */}
                    {!hayMas && (
                      <li className="h-full">
                        <Link
                          href="/login"
                          className="relative flex h-full min-h-64 flex-col justify-end gap-2 overflow-hidden rounded-[24px] border border-dashed border-teal-oscuro bg-rosa-palido p-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-solid hover:shadow-dura"
                        >
                          <LotitoMas nombre="saluda"
                            className="absolute right-4 top-4 w-20 md:w-24"
                          />
                          <p className="text-lg font-bold leading-tight">
                            {t.armaTitulo}
                          </p>
                          <p className="text-sm text-texto-2">{t.armaTexto}</p>
                          <span className="mt-1 inline-flex h-10 items-center self-start rounded-full border border-teal-oscuro bg-mango px-4 text-sm font-bold">
                            {t.armaBoton}
                          </span>
                        </Link>
                      </li>
                    )}
                  </ul>
                  <Paginacion
                    pagina={pagina}
                    porPagina={porPagina}
                    total={total}
                    hayMas={hayMas}
                    enlace={(n) => enlaceExplorar({ ...f, pagina: n }, true)}
                  />
                </>
              )}
            </div>
          </div>
  );
}
