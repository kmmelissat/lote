import Link from "next/link";
import type { Route } from "next";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";
import {
  ORDENES_EXPLORAR,
  type OrdenExplorar,
  type ProductoExplorar,
  type TiendaExplorar,
} from "../explorar";
import { SeccionCalle } from "./CalleTiendas";
import { BarraFiltros } from "./BarraFiltros";
import { FilaActivos } from "./FilaActivos";
import {
  chip,
  enlaceExplorar,
  type Filtros,
  type Vista,
} from "./enlacesExplorar";
import { Paginacion } from "./Paginacion";
import { TarjetaProducto, type MarcaDeTienda } from "./TarjetaProducto";
import { TarjetaTienda } from "./TarjetaTienda";

const t = textos.explorar;

const chipRapido = (activo: boolean) =>
  `inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 md:h-9 text-sm font-bold text-teal-oscuro transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro ${
    activo ? "border-teal-oscuro bg-limon" : "border-[#b9c7c9] bg-white hover:bg-teal-fondo/50"
  }`;

/** La barra de resultados y la grilla: productos, tiendas o el vacío. */
export function CuerpoExplorar({
  vista,
  total,
  visibles,
  limpiar,
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
  limpiar: Route | null;
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
  // Los accesos rápidos son los filtros de precio, envío y oferta que ya existen, en un toque
  const hasta = (tope: string) => ({ ...f, min: "", max: tope, pagina: 1 });
  const rapidos = [
    { texto: t.rapidos.hasta10, activo: !f.min && f.max === "10", enlace: enlaceExplorar(f.max === "10" && !f.min ? { ...hasta(""), max: "" } : hasta("10")) },
    { texto: t.rapidos.hasta25, activo: !f.min && f.max === "25", enlace: enlaceExplorar(f.max === "25" && !f.min ? { ...hasta(""), max: "" } : hasta("25")) },
    { texto: t.panel.envioGratis, activo: f.gratis, enlace: enlaceExplorar({ ...f, gratis: !f.gratis, pagina: 1 }) },
    { texto: t.rapidos.enOferta, activo: f.oferta, enlace: enlaceExplorar({ ...f, oferta: !f.oferta, pagina: 1 }) },
  ];

  const ordenar = (
    <details key={`orden-${orden}`} className="relative">
      <summary className={`${chip(false)} ${filtrando ? "" : "border-2 border-teal-oscuro"} cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden`}>
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
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {vista === "productos" && (
        <section
          id="todos"
          aria-label={t.filtros}
          className="flex scroll-mt-4 flex-col gap-3"
        >
          {!filtrando && <h2 className="font-logo text-[22px] font-bold leading-tight">{t.todosTitulo}</h2>}
          {filtrando ? (
            // Categoría y búsqueda: UNA sola fila (filtros puestos, accesos rápidos, limpiar, cuántos hay y orden)
            <FilaActivos
              f={f}
              limpiar={limpiar}
              derecha={
                <>
                  <p className="text-sm text-texto-2">{t.resultados(total ?? visibles.length)}</p>
                  {ordenar}
                </>
              }
            />
          ) : (
            <BarraFiltros
              f={f}
              limpiar={limpiar}
              rapidos={rapidos.map((r) => (
                <Link key={r.texto} {...r.enlace} aria-pressed={r.activo} className={chipRapido(r.activo)}>
                  {r.texto}
                </Link>
              ))}
              derecha={
                <>
                  <p className="whitespace-nowrap text-sm text-texto-2">{t.resultados(total ?? visibles.length)}</p>
                  {ordenar}
                </>
              }
            />
          )}
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
            <ul className={`grid grid-cols-2 gap-3 md:gap-[18px] md:grid-cols-3 ${filtrando ? "xl:grid-cols-4 2xl:grid-cols-5" : "xl:grid-cols-6 2xl:grid-cols-7"}`}>
              {visibles.map((p, i) => (
                <li key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
                  <TarjetaProducto
                    p={p}
                    marca={marcaDe(p)}
                    eager={!portada && i < 5}
                  />
                </li>
              ))}
              {/* Al final de la última página: una invitación para quien vende, que además tapa el hueco de la fila */}
              {!hayMas && (
                <li className="h-full" style={{ order: 1000 }}>
                  <Link
                    href="/login"
                    className="relative flex h-full min-h-64 flex-col justify-end gap-2 overflow-hidden rounded-[24px] border border-dashed border-teal-oscuro bg-rosa-palido p-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-solid hover:shadow-dura"
                  >
                    <LotitoMas
                      nombre="saluda"
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
