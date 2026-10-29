import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import {
  explorarCategorias,
  explorarProductos,
  explorarTiendas,
  ORDENES_EXPLORAR,
  type OrdenExplorar,
} from "../explorar";
import { colorDeMarca } from "../marca";
import { LogoTienda } from "./MarcaTienda";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { leerDolares } from "@/domain";

const t = textos.explorar;

const POR_PAGINA = 24;
// Hasta cuántas unidades se muestra "Últimas N" en una tarjeta
const POCAS_UNIDADES = 5;
// Dónde va y cuánto se tuerce cada foto del encabezado, dentro de su caja
const STICKERS = [
  "left-0 top-0 -rotate-6",
  "right-0 top-1/2 -translate-y-1/2 rotate-3",
  "bottom-0 left-1/2 -translate-x-1/2 rotate-2 z-10",
] as const;

type Vista = "productos" | "tiendas";
type Filtros = {
  vista: Vista;
  busqueda: string;
  categoria: string;
  orden: OrdenExplorar;
  min: string;
  max: string;
  pagina?: number;
};

/** Arma la dirección de Explorar con los filtros que estén puestos (lo que está por defecto no se escribe). */
function enlace(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.vista !== "productos") p.set("vista", f.vista);
  if (f.busqueda) p.set("q", f.busqueda);
  if (f.categoria) p.set("categoria", f.categoria);
  if (f.orden !== "recientes") p.set("orden", f.orden);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const s = p.toString();
  return s ? `/explorar?${s}` : "/explorar";
}

const chip = (activo: boolean) =>
  `inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors ${
    activo ? "bg-mango" : "bg-white hover:bg-limon"
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
}: Pick<PageProps<"/explorar">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const texto = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string).slice(0, 80) : "";
  const vista: Vista = texto("vista") === "tiendas" ? "tiendas" : "productos";
  const busqueda = texto("q").trim();
  const categoria = texto("categoria").trim();
  const orden = (ORDENES_EXPLORAR as readonly string[]).includes(texto("orden"))
    ? (texto("orden") as OrdenExplorar)
    : "recientes";
  const min = texto("min").trim();
  const max = texto("max").trim();
  const pagina = Math.max(1, Math.floor(Number(texto("pagina"))) || 1);
  const f: Filtros = { vista, busqueda, categoria, orden, min, max };

  const supabase = createPublicClient();
  const [categorias, tiendas, productos] = await Promise.all([
    explorarCategorias(supabase),
    // En productos las tiendas son una fila de acceso rápido; en tiendas, el contenido principal
    explorarTiendas(
      supabase,
      vista === "tiendas" ? busqueda || undefined : undefined,
      vista === "tiendas" ? categoria || undefined : undefined,
    ),
    vista === "productos"
      ? // Uno de más, solo para saber si hay otra página
        explorarProductos(supabase, {
          busqueda: busqueda || undefined,
          categoria: categoria || undefined,
          limite: POR_PAGINA + 1,
          desde: (pagina - 1) * POR_PAGINA,
          orden,
          precioMin: dolares(min),
          precioMax: dolares(max),
        })
      : Promise.resolve([]),
  ]);
  const hayMas = productos.length > POR_PAGINA;
  const visibles = productos.slice(0, POR_PAGINA);
  const filtrando = Boolean(busqueda || categoria || min || max);
  const vacio =
    vista === "tiendas" ? tiendas.length === 0 : visibles.length === 0;
  const sugeridas = categorias.filter((c) => c.productos >= 2).slice(0, 4);
  const destacadas = [
    ...new Set([
      ...visibles.flatMap((p) => (p.foto ? [p.foto] : [])),
      ...tiendas.flatMap((x) => x.fotos),
    ]),
  ].slice(0, STICKERS.length);
  const precioActivo = Boolean(min || max);
  // El color y el logo de cada tienda, para que sus productos se distingan en la grilla
  const marcas = new Map(
    tiendas.map((x) => [
      x.slug,
      { color: colorDeMarca(x.color).hex, logo: x.logo },
    ]),
  );

  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.titulo,
          description: t.descripcion,
          url: `${urlSitio}/explorar`,
        }}
      />

      {/* El monito se asoma por detrás del borde de arriba, como en la landing */}
      <div className="relative pt-14 sm:mb-3">
        <Monito
          nombre="asoma"
          className="absolute left-6 top-0 z-0 w-28 text-rosa motion-safe:animate-asomar md:left-10"
        />
        <section className="relative z-10 rounded-[28px] border-2 border-teal-oscuro bg-teal px-5 py-6 text-crema shadow-[6px_6px_0_0_var(--color-rosa)] md:px-8 md:py-7">
          <div
            className={`relative flex max-w-2xl flex-col gap-4 ${destacadas.length ? "sm:mr-56 md:mr-72" : ""}`}
          >
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {t.encabezadoInicio}{" "}
              <span className="whitespace-nowrap bg-[linear-gradient(transparent_72%,var(--color-limon)_72%,var(--color-limon)_92%,transparent_92%)] [box-decoration-break:clone]">
                {t.encabezadoDestacado}
              </span>
            </h1>
            <form
              action="/explorar"
              role="search"
              className="flex h-13 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white py-1 pl-4 pr-1 text-teal-oscuro focus-within:ring-4 focus-within:ring-rosa/60"
            >
              {vista !== "productos" && (
                <input type="hidden" name="vista" value={vista} />
              )}
              {categoria && (
                <input type="hidden" name="categoria" value={categoria} />
              )}
              <Icon nombre="buscar" className="size-5 shrink-0 text-texto-2" />
              <input
                type="search"
                name="q"
                defaultValue={busqueda}
                aria-label={t.buscar}
                placeholder={t.buscarPlaceholder}
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2/70"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center rounded-full border-2 border-teal-oscuro bg-mango px-5 text-sm font-bold transition-transform duration-150 hover:-translate-y-0.5"
              >
                {t.buscarBoton}
              </button>
            </form>
            {/* En tiendas no hay fila de categorías: ahí se sugieren las que tienen más productos */}
            {vista === "tiendas" && sugeridas.length > 0 && !busqueda && (
              <ul
                aria-label={t.sugeridas}
                className="flex flex-wrap items-center gap-2"
              >
                <li className="text-sm font-bold text-crema/80">
                  {t.sugeridas}
                </li>
                {sugeridas.map((c) => (
                  <li key={c.categoria}>
                    <Link
                      href={enlace({
                        ...f,
                        categoria: c.categoria,
                        vista: "productos",
                        pagina: 1,
                      })}
                      className="inline-flex h-9 items-center rounded-full border-2 border-crema/40 px-4 text-sm font-bold text-crema hover:bg-crema hover:text-teal-oscuro"
                    >
                      {c.categoria}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Fotos de productos de verdad, pegadas como stickers: muestran de una lo que hay para ver */}
          {destacadas.length > 0 && (
            <ul
              aria-hidden="true"
              className="absolute -bottom-7 -top-7 right-6 hidden w-48 sm:block md:right-10 md:w-60"
            >
              {destacadas.map((foto, i) => (
                <li
                  key={foto}
                  className={`absolute size-24 overflow-hidden rounded-2xl border-[3px] border-white shadow-[4px_4px_0_0_var(--color-rosa)] md:size-28 ${STICKERS[i]}`}
                >
                  <Image
                    src={urlFoto(foto)}
                    alt=""
                    fill
                    loading="eager"
                    sizes="112px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {vista === "productos" && tiendas.length > 0 && !filtrando && (
        <section aria-labelledby="tiendas-fila" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 id="tiendas-fila" className="font-bold">
              {t.tiendasParaRecorrer}
            </h2>
            <Link
              href={enlace({ ...f, vista: "tiendas" })}
              className="inline-flex min-h-11 items-center text-sm font-bold text-teal underline"
            >
              {t.verTodasTiendas}
            </Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {tiendas.slice(0, 12).map((tienda) => (
              <li key={tienda.slug} className="shrink-0">
                <Link
                  href={`/c/${tienda.slug}`}
                  className="flex items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white py-1.5 pl-1.5 pr-4 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica"
                >
                  <LogoTienda
                    logo={tienda.logo}
                    nombre={tienda.nombre}
                    className="size-9 !rounded-full"
                  />
                  <span className="text-sm font-bold">{tienda.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4">
        {vista === "productos" && (
          <section aria-label={t.filtros} className="flex flex-col gap-3">
            {categorias.length > 0 && (
              <ul
                aria-label={t.categorias}
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
              >
                <li className="shrink-0">
                  <Link
                    href={enlace({ ...f, categoria: "", pagina: 1 })}
                    aria-current={!categoria ? "true" : undefined}
                    className={chip(!categoria)}
                  >
                    {t.todo}
                  </Link>
                </li>
                {categorias.map((c) => (
                  <li key={c.categoria} className="shrink-0">
                    <Link
                      href={enlace({ ...f, categoria: c.categoria, pagina: 1 })}
                      aria-current={
                        categoria === c.categoria ? "true" : undefined
                      }
                      className={chip(categoria === c.categoria)}
                    >
                      {c.categoria}
                      <span className="ml-2 text-xs font-medium opacity-70">
                        {c.productos}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Cuántos hay, y a la derecha los filtros y el orden: menús chicos que se abren, no campos sueltos */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold">
                {t.resultados(visibles.length)}
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
                    action="/explorar"
                    className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-3 rounded-[20px] border-2 border-teal-oscuro bg-white p-4 shadow-dura"
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
                          defaultValue={max}
                          placeholder="$100"
                          className={campo}
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {precioActivo ? (
                        <Link
                          href={enlace({ ...f, min: "", max: "", pagina: 1 })}
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
                  <ul className="absolute right-0 z-20 mt-2 flex w-64 flex-col rounded-[20px] border-2 border-teal-oscuro bg-white p-2 shadow-dura">
                    {ORDENES_EXPLORAR.map((o) => (
                      <li key={o}>
                        <Link
                          href={enlace({ ...f, orden: o, pagina: 1 })}
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
              href={enlace({ ...f, vista: "productos", pagina: 1 })}
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
                <Link href="/explorar" className={chip(false)}>
                  {t.limpiar}
                </Link>
              )}
            </div>
          ) : vista === "tiendas" ? (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tiendas.map((tienda, i) => (
                <li key={tienda.slug}>
                  <Link
                    href={`/c/${tienda.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-white transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
                  >
                    <div
                      aria-hidden="true"
                      className="grid h-28 grid-cols-3"
                      style={{
                        backgroundColor: colorDeMarca(tienda.color).hex,
                      }}
                    >
                      {tienda.fotos.slice(0, 3).map((foto) => (
                        <span
                          key={foto}
                          className="relative border-r-2 border-teal-oscuro last:border-r-0"
                        >
                          <Image
                            src={urlFoto(foto)}
                            alt=""
                            fill
                            loading={i < 3 ? "eager" : "lazy"}
                            sizes="(min-width: 1024px) 130px, 25vw"
                            className="object-cover"
                          />
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="-mt-10 flex items-end justify-between gap-3">
                        <LogoTienda
                          logo={tienda.logo}
                          nombre={tienda.nombre}
                          className="size-14 border-4 border-white ring-2 ring-teal-oscuro"
                        />
                        <span className="mb-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">
                          {t.piezas(tienda.piezas)}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold leading-tight">
                        {tienda.nombre}
                      </h2>
                      {tienda.descripcion && (
                        <p className="line-clamp-2 text-texto-2">
                          {tienda.descripcion}
                        </p>
                      )}
                      {tienda.categorias.length > 0 && (
                        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                          {tienda.categorias.slice(0, 4).map((c) => (
                            <li
                              key={c}
                              className="rounded-full bg-fondo px-2.5 py-0.5 text-xs"
                            >
                              {c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {visibles.map((p, i) => {
                  const marca = marcas.get(p.tiendaSlug) ?? {
                    color: colorDeMarca(null).hex,
                    logo: null,
                  };
                  return (
                    <li key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
                      <Link
                        href={`/c/${p.tiendaSlug}/${p.codigo}`}
                        style={{ "--tienda": marca.color } as CSSProperties}
                        className="group flex h-full flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-white p-2 pb-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[color-mix(in_srgb,var(--tienda)_12%,white)]">
                          {p.foto ? (
                            <Image
                              src={urlFoto(p.foto)}
                              alt={p.nombre}
                              fill
                              loading={i < 4 ? "eager" : "lazy"}
                              sizes="(min-width: 1024px) 270px, (min-width: 768px) 30vw, 50vw"
                              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex size-full items-center justify-center"
                            >
                              <Monito
                                nombre="caja"
                                className="w-1/3 text-[var(--tienda)] opacity-40"
                              />
                            </span>
                          )}
                          {p.categoria && (
                            <span className="absolute left-2 top-2 max-w-[75%] truncate rounded-full border-2 border-teal-oscuro bg-white px-2.5 py-0.5 text-xs font-bold">
                              {p.categoria}
                            </span>
                          )}
                          {/* Con mucho stock es ruido: solo se avisa cuando quedan pocas */}
                          {p.disponibles <= POCAS_UNIDADES && (
                            <span className="absolute bottom-2 left-2 -rotate-2 rounded-full border-2 border-teal-oscuro bg-rosa px-2.5 py-0.5 text-xs font-bold">
                              {t.ultimas(p.disponibles)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 px-2">
                          <p className="line-clamp-2 font-bold leading-tight">
                            {p.nombre}
                          </p>
                          <p className="flex items-baseline gap-1.5 tabular-nums">
                            {p.precioMinimo !== p.precioMaximo && (
                              <span className="text-xs font-bold text-texto-2">
                                {t.desdeEtiqueta}
                              </span>
                            )}
                            <span className="text-2xl font-extrabold leading-none tracking-tight">
                              {formatearDolares(p.precioMinimo)}
                            </span>
                          </p>
                          <p className="mt-auto flex min-w-0 items-center gap-2 pt-1 text-xs font-bold text-[var(--tienda)]">
                            <LogoTienda
                              logo={marca.logo}
                              nombre={p.tiendaNombre}
                              className="size-6 !rounded-full !bg-[var(--tienda)] !text-xs ring-2 ring-[var(--tienda)]"
                            />
                            <span className="truncate">{p.tiendaNombre}</span>
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
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
                      <span className="mt-1 inline-flex h-10 items-center self-start rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm font-bold">
                        {t.armaBoton}
                      </span>
                    </Link>
                  </li>
                )}
              </ul>
              {(pagina > 1 || hayMas) && (
                <nav
                  aria-label={t.productos}
                  className="flex items-center justify-between gap-3"
                >
                  {pagina > 1 ? (
                    <Link
                      href={enlace({ ...f, pagina: pagina - 1 })}
                      className={chip(false)}
                    >
                      {t.anterior}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-texto-2">
                    {t.pagina(pagina)}
                  </span>
                  {hayMas ? (
                    <Link
                      href={enlace({ ...f, pagina: pagina + 1 })}
                      className={chip(false)}
                    >
                      {t.siguiente}
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
