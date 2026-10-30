import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import {
  explorarDestacados,
  explorarOfertas,
  explorarProductos,
  explorarRubros,
  explorarTiendas,
  ORDENES_EXPLORAR,
  type OrdenExplorar,
  rutaRubro,
} from "../explorar";
import { esRubro } from "../rubros";
import { ejemplosDeBusqueda, rubroDeProducto } from "../portada";
import { AIRE, MESA } from "../mercadito";
import { colorDeMarca } from "../marca";
import { HeroMercadito } from "./HeroMercadito";
import { SeccionCalle } from "./CalleTiendas";
import { FilaProductos } from "./FilaProductos";
import { Paginacion } from "./Paginacion";
import { SobreExplorar } from "./SobreExplorar";
import { TarjetaProducto } from "./TarjetaProducto";
import { TarjetaTienda } from "./TarjetaTienda";
import { TarjetasRubro } from "./TarjetasRubro";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { leerDolares } from "@/domain";

const t = textos.explorar;

// 30 llena filas enteras con 5, 3 o 2 columnas
const POR_PAGINA = 30;
// Cuántos productos lleva cada fila de arriba (Destacados, Ofertas), y cuántos necesita para mostrarse:
// una fila con una o dos tarjetas se ve vacía
const POR_FILA = 10;
const MINIMO_FILA = 4;

type Vista = "productos" | "tiendas";
type Filtros = {
  vista: Vista;
  busqueda: string;
  /** El rubro elegido ("ropa", "comida"…), o vacío */
  categoria: string;
  orden: OrdenExplorar;
  min: string;
  max: string;
  pagina?: number;
};

/**
 * Arma la dirección de Explorar con los filtros que estén puestos (lo que está por defecto no se escribe).
 * El rubro va en la ruta; búsqueda, precio, orden y página van como parámetros.
 */
function enlace(f: Filtros): string {
  const p = new URLSearchParams();
  const enRuta = f.vista === "productos" && esRubro(f.categoria);
  if (f.vista !== "productos") p.set("vista", f.vista);
  if (f.busqueda) p.set("q", f.busqueda);
  if (f.categoria && !enRuta) p.set("categoria", f.categoria);
  if (f.orden !== "recientes") p.set("orden", f.orden);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const s = p.toString();
  const base = enRuta && esRubro(f.categoria) ? rutaRubro(f.categoria) : "/marketplace";
  return s ? `${base}?${s}` : base;
}

/** El enlace y su rel: lo que lleva parámetros (filtros, orden, páginas) no lo siguen los buscadores. */
function enlaceExplorar(f: Filtros): { href: string; rel?: string } {
  const href = enlace(f);
  return href.includes("?") ? { href, rel: "nofollow" } : { href };
}

const chip = (activo: boolean) =>
  `inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors ${
    activo ? "bg-mango" : "bg-crema hover:bg-limon"
  }`;

const campo =
  "h-10 w-full rounded-[12px] border-2 border-borde-control bg-white px-3 text-sm focus:border-teal";

/** Dólares escritos por la persona → número, o undefined si está vacío o no es válido. */
function dolares(texto: string): number | undefined {
  const c = leerDolares(texto);
  return c === null ? undefined : c / 100;
}

export async function PaginaExplorar({
  searchParams,
  categoriaRuta,
}: Pick<PageProps<"/marketplace">, "searchParams"> & {
  /** El rubro de /marketplace/categoria/<rubro>; manda sobre ?categoria= */
  categoriaRuta?: string;
}) {
  await connection();
  const params = await searchParams;
  const texto = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string).slice(0, 80) : "";
  const vista: Vista = texto("vista") === "tiendas" ? "tiendas" : "productos";
  const busqueda = texto("q").trim();
  const pedida = (categoriaRuta ?? texto("categoria")).slice(0, 80).trim();
  const categoria = esRubro(pedida) ? pedida : "";
  const orden = (ORDENES_EXPLORAR as readonly string[]).includes(texto("orden"))
    ? (texto("orden") as OrdenExplorar)
    : "recientes";
  const min = texto("min").trim();
  const max = texto("max").trim();
  const pagina = Math.max(1, Math.floor(Number(texto("pagina"))) || 1);
  const f: Filtros = { vista, busqueda, categoria, orden, min, max };

  const supabase = createPublicClient();
  const rubros = await explorarRubros(supabase);
  // Una dirección vieja con el nombre de una categoría ("Blusas") lleva a su rubro
  if (pedida && !categoria) {
    const deEsa = rubros.find((r) => r.categorias.some((c) => c.toLowerCase() === pedida.toLowerCase()));
    permanentRedirect(enlace({ ...f, categoria: deEsa?.id ?? "" }));
  }
  const rubro = rubros.find((r) => r.id === categoria);
  const nombreRubro = rubro?.nombre ?? "";
  // Las categorías de las tiendas que caen en el rubro elegido
  const claves = categoria ? (rubro?.claves ?? []) : undefined;
  const filtrando = Boolean(busqueda || categoria || min || max);
  // La portada (sin buscar ni filtrar) abre con filas que atraen: destacados, ofertas o lo nuevo
  const portada = vista === "productos" && !filtrando && pagina === 1;
  const [tiendas, { productos, total }, destacados, ofertas] = await Promise.all([
    // En productos las tiendas son una fila de acceso rápido; en tiendas, el contenido principal
    explorarTiendas(
      supabase,
      vista === "tiendas" ? busqueda || undefined : undefined,
      vista === "tiendas" ? claves : undefined,
    ),
    vista === "productos"
      ? // Uno de más, solo para saber si hay otra página
        explorarProductos(supabase, {
          busqueda: busqueda || undefined,
          claves,
          limite: POR_PAGINA + 1,
          desde: (pagina - 1) * POR_PAGINA,
          orden,
          precioMin: dolares(min),
          precioMax: dolares(max),
        })
      : Promise.resolve({ productos: [], total: null }),
    portada ? explorarDestacados(supabase, POR_FILA) : Promise.resolve([]),
    portada ? explorarOfertas(supabase, POR_FILA) : Promise.resolve([]),
  ]);
  const hayMas = productos.length > POR_PAGINA;
  const visibles = productos.slice(0, POR_PAGINA);
  const vacio =
    vista === "tiendas" ? tiendas.length === 0 : visibles.length === 0;
  const sugeridas = rubros.filter((r) => r.productos >= 2 && r.id !== "otros").slice(0, 4);
  const totalProductos = rubros.reduce((n, r) => n + r.productos, 0);

  // Ejemplos del buscador, de productos reales (destacados y ofertas primero): cambian en cada visita
  const ejemplos = ejemplosDeBusqueda([...destacados, ...ofertas, ...visibles], rubroDeProducto(rubros), 3);
  const precioActivo = Boolean(min || max);
  // El color y el logo de cada tienda, para que sus productos se distingan en la grilla
  const marcas = new Map(
    tiendas.map((x) => [
      x.slug,
      { color: colorDeMarca(x.color).hex, logo: x.logo },
    ]),
  );
  const marcaDe = (p: { tiendaSlug: string }) => marcas.get(p.tiendaSlug) ?? { color: colorDeMarca(null).hex, logo: null };

  // Las dos filas de la portada: lo que haya de destacados y ofertas; si falta alguna, lo nuevo
  const filas = [
    destacados.length >= MINIMO_FILA && { id: "destacados", titulo: t.destacadosTitulo, ayuda: t.destacadosAyuda, icono: "★", productos: destacados },
    ofertas.length >= MINIMO_FILA && { id: "ofertas", titulo: t.ofertasTitulo, ayuda: t.ofertasAyuda, icono: "%", productos: ofertas },
    { id: "nuevos", titulo: t.nuevosTitulo, ayuda: t.nuevosAyuda, icono: "✦", productos: visibles.slice(0, POR_FILA) },
  ]
    .filter((x) => x !== false)
    .slice(0, 2);
  const fila = (i: number) =>
    filas[i] && (
      <FilaProductos
        id={`fila-${filas[i].id}`}
        titulo={filas[i].titulo}
        ayuda={filas[i].ayuda}
        icono={<span className="text-lg font-extrabold leading-none">{filas[i].icono}</span>}
        productos={filas[i].productos}
        marcaDe={marcaDe}
        eager={i === 0}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.titulo,
          description: t.descripcion,
          url: `${urlSitio}/marketplace`,
        }}
      />

      <HeroMercadito
        productos={MESA}
        aire={AIRE}
        tiendas={tiendas.length}
        totalProductos={rubro ? rubro.productos : totalProductos}
        ejemplos={ejemplos}
        busqueda={busqueda}
        titulo={nombreRubro ? t.encabezadoRubro(nombreRubro) : undefined}
        ocultos={
          <>
            {vista !== "productos" && <input type="hidden" name="vista" value={vista} />}
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
          </>
        }
        extra={
          // En tiendas no hay fila de categorías: ahí se sugieren las que tienen más productos
          vista === "tiendas" && sugeridas.length > 0 && !busqueda ? (
            <ul aria-label={t.sugeridas} className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <li className="text-sm font-bold text-teal">{t.sugeridas}</li>
              {sugeridas.map((c) => (
                <li key={c.id}>
                  <Link
                    {...enlaceExplorar({ ...f, categoria: c.id, vista: "productos", pagina: 1 })}
                    className="inline-flex h-9 items-center rounded-full border-2 border-teal-oscuro bg-crema px-4 text-sm font-bold text-teal-oscuro hover:bg-limon"
                  >
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        {vista === "productos" && (
          <>
            {rubros.length > 0 && (
              <TarjetasRubro rubros={rubros} activo={categoria} enlace={(id) => enlaceExplorar({ ...f, categoria: id, pagina: 1 })} />
            )}
            {/* Portada: las dos filas que atraen, la calle con las tiendas y después todo */}
            {portada && (
              <div className="flex flex-col gap-8 py-2">
                {fila(0)}
                {fila(1)}
                {tiendas.length > 0 && <SeccionCalle tiendas={tiendas.slice(0, 20)} verTodas={enlaceExplorar({ ...f, vista: "tiendas" })} />}
              </div>
            )}
            {!filtrando && <h2 className="-mb-1 text-xl font-bold">{t.todosTitulo}</h2>}
            <section id="todos" aria-label={t.filtros} className="flex scroll-mt-4 flex-col gap-3">

            {/* Cuántos hay, y a la derecha los filtros y el orden: menús chicos que se abren, no campos sueltos */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold">
                {t.resultados(total ?? visibles.length)}
              </p>
              <div className="flex items-center gap-2">
                <details key={`filtros-${min}-${max}`} className="relative">
                  <summary
                    className={`${chip(precioActivo)} cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden`}
                  >
                    <Icon nombre="filtros" className="size-4" />
                    {t.filtros}
                    {precioActivo && (
                      <span className="rounded-full bg-teal-oscuro px-2 text-xs text-white">
                        1
                      </span>
                    )}
                  </summary>
                  <form
                    action="/marketplace"
                    className="absolute right-0 z-20 mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-[20px] border-2 border-teal-oscuro bg-white p-4 shadow-dura max-md:fixed max-md:inset-x-4 max-md:top-auto max-md:w-auto"
                  >
                    {busqueda && (
                      <input type="hidden" name="q" value={busqueda} />
                    )}
                    {categoria && (
                      <input type="hidden" name="categoria" value={categoria} />
                    )}
                    {orden !== "recientes" && (
                      <input type="hidden" name="orden" value={orden} />
                    )}
                    <p className="text-sm font-bold">{t.rangoPrecio}</p>
                    <div className="flex gap-2">
                      <label className="flex flex-1 flex-col gap-1 text-xs text-texto-2">
                        {t.precioMin}
                        <input
                          name="min"
                          inputMode="decimal"
                          pattern="\d*([.,]\d{0,2})?"
                          defaultValue={min}
                          placeholder="$0"
                          className={campo}
                        />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-xs text-texto-2">
                        {t.precioMax}
                        <input
                          name="max"
                          inputMode="decimal"
                          pattern="\d*([.,]\d{0,2})?"
                          defaultValue={max}
                          placeholder="$100"
                          className={campo}
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {precioActivo ? (
                        <Link
                          {...enlaceExplorar({
                            ...f,
                            min: "",
                            max: "",
                            pagina: 1,
                          })}
                          className="text-sm font-bold text-teal underline"
                        >
                          {t.limpiar}
                        </Link>
                      ) : (
                        <span />
                      )}
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro bg-mango px-5 text-sm font-bold"
                      >
                        {t.aplicar}
                      </button>
                    </div>
                  </form>
                </details>
                <details key={`orden-${orden}`} className="relative">
                  <summary
                    className={`${chip(false)} cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden`}
                  >
                    {t.ordenActual(t.ordenes[orden])}
                    <Icon nombre="flecha" className="size-4" />
                  </summary>
                  <ul className="absolute right-0 z-20 mt-2 flex w-64 max-w-[calc(100vw-2rem)] flex-col rounded-[20px] border-2 border-teal-oscuro bg-white p-2 shadow-dura max-md:fixed max-md:inset-x-4 max-md:top-auto max-md:w-auto">
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
          </>
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
            <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-white px-6 py-12 text-center">
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
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tiendas.map((tienda, i) => (
                <li key={tienda.slug}>
                  <TarjetaTienda tienda={tienda} eager={i < 3} />
                </li>
              ))}
            </ul>
            </>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibles.map((p, i) => (
                  <li key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
                    <TarjetaProducto p={p} marca={marcaDe(p)} eager={!portada && i < 5} />
                  </li>
                ))}
                {/* Al final de la última página: una invitación para quien vende, que además tapa el hueco de la fila */}
                {!hayMas && (
                  <li className="h-full">
                    <Link
                      href="/login"
                      className="relative flex h-full min-h-64 flex-col justify-end gap-2 overflow-hidden rounded-[24px] border-2 border-dashed border-teal-oscuro bg-rosa-palido p-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-solid hover:shadow-dura"
                    >
                      <Monito
                        nombre="saluda"
                        className="absolute right-4 top-4 w-20 text-rosa md:w-24"
                      />
                      <p className="text-lg font-bold leading-tight">
                        {t.armaTitulo}
                      </p>
                      <p className="text-sm text-texto-2">{t.armaTexto}</p>
                      <span className="mt-1 inline-flex h-10 items-center self-start rounded-full border-2 border-teal-oscuro bg-mango px-4 text-sm font-bold">
                        {t.armaBoton}
                      </span>
                    </Link>
                  </li>
                )}
              </ul>
              <Paginacion
                pagina={pagina}
                porPagina={POR_PAGINA}
                total={total}
                hayMas={hayMas}
                enlace={(n) => enlaceExplorar({ ...f, pagina: n })}
              />
            </>
          )}
        </div>
      </div>

      <SobreExplorar rubro={rubro} rubros={rubros} />
    </div>
  );
}
