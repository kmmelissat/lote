import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Monito } from "@/components/ui/Monito";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  explorarCategorias,
  explorarProductos,
  explorarTiendas,
  ORDENES_EXPLORAR,
  type OrdenExplorar,
} from "@/features/catalog/explorar";
import { colorDeMarca } from "@/features/catalog/marca";
import { LogoTienda } from "@/features/catalog/ui/MarcaTienda";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { leerDolares } from "@/domain";

const t = textos.explorar;

export const metadata: Metadata = {
  title: { absolute: t.tituloPagina },
  description: t.descripcion,
  alternates: { canonical: "/explorar" },
  openGraph: { title: t.tituloPagina, description: t.descripcion, url: "/explorar", type: "website" },
};

const POR_PAGINA = 24;

type Vista = "productos" | "tiendas";
type Filtros = { vista: Vista; busqueda: string; categoria: string; orden: OrdenExplorar; min: string; max: string; pagina?: number };

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

const campo = "h-10 w-full rounded-[12px] border-2 border-borde-control bg-white px-3 text-sm focus:border-teal";

export default function ExplorarPage({ searchParams }: PageProps<"/explorar">) {
  return <Contenido searchParams={searchParams} />;
}

/** Dólares escritos por la persona → número, o undefined si está vacío o no es válido. */
function dolares(texto: string): number | undefined {
  const c = leerDolares(texto);
  return c === null ? undefined : c / 100;
}

async function Contenido({ searchParams }: Pick<PageProps<"/explorar">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const texto = (k: string) => (typeof params[k] === "string" ? (params[k] as string).slice(0, 80) : "");
  const vista: Vista = texto("vista") === "tiendas" ? "tiendas" : "productos";
  const busqueda = texto("q").trim();
  const categoria = texto("categoria").trim();
  const orden = (ORDENES_EXPLORAR as readonly string[]).includes(texto("orden")) ? (texto("orden") as OrdenExplorar) : "recientes";
  const min = texto("min").trim();
  const max = texto("max").trim();
  const pagina = Math.max(1, Math.floor(Number(texto("pagina"))) || 1);
  const f: Filtros = { vista, busqueda, categoria, orden, min, max };

  const supabase = createPublicClient();
  const [categorias, tiendas, productos] = await Promise.all([
    explorarCategorias(supabase),
    // En productos las tiendas son una fila de acceso rápido; en tiendas, el contenido principal
    explorarTiendas(supabase, vista === "tiendas" ? busqueda || undefined : undefined, vista === "tiendas" ? categoria || undefined : undefined),
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
  const vacio = vista === "tiendas" ? tiendas.length === 0 : visibles.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        datos={{ "@context": "https://schema.org", "@type": "CollectionPage", name: t.titulo, description: t.descripcion, url: `${urlSitio}/explorar` }}
      />

      <section className="relative overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-limon p-5 shadow-dura md:p-7">
        <Monito nombre="asoma" className="absolute -bottom-2 right-4 hidden w-32 text-rosa sm:block md:right-10" />
        <div className="relative flex max-w-2xl flex-col gap-3">
          <h1 className="text-2xl font-bold leading-tight md:text-4xl">{t.encabezado}</h1>
          <form action="/explorar" role="search" className="flex gap-2">
            {vista !== "productos" && <input type="hidden" name="vista" value={vista} />}
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <input
              type="search"
              name="q"
              defaultValue={busqueda}
              aria-label={t.buscar}
              placeholder={t.buscarPlaceholder}
              className="h-12 min-w-0 flex-1 rounded-full border-2 border-teal-oscuro bg-white px-5 text-base"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-full border-2 border-teal-oscuro bg-mango px-6 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
            >
              {t.buscarBoton}
            </button>
          </form>
        </div>
      </section>

      <nav aria-label={t.vistas}>
        <ul className="flex gap-2">
          {(["productos", "tiendas"] as const).map((v) => (
            <li key={v}>
              <Link href={enlace({ ...f, vista: v, pagina: 1 })} aria-current={v === vista ? "page" : undefined} className={chip(v === vista)}>
                {t[v]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {vista === "productos" && tiendas.length > 0 && !filtrando && (
        <section aria-labelledby="tiendas-fila" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 id="tiendas-fila" className="font-bold">
              {t.tiendasParaRecorrer}
            </h2>
            <Link href={enlace({ ...f, vista: "tiendas" })} className="text-sm font-bold text-teal underline">
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
                  <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-9 !rounded-full" />
                  <span className="text-sm font-bold">{tienda.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={vista === "productos" ? "grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]" : ""}>
        {vista === "productos" && (
          <aside aria-label={t.filtros} className="flex flex-col gap-5 rounded-[24px] border-2 border-teal-oscuro bg-white p-4 lg:sticky lg:top-4">
            {categorias.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="font-bold">{t.categorias}</h2>
                <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  <li>
                    <Link
                      href={enlace({ ...f, categoria: "", pagina: 1 })}
                      aria-current={!categoria ? "true" : undefined}
                      className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${!categoria ? "bg-limon font-bold" : "hover:bg-teal-fondo"}`}
                    >
                      {t.todo}
                    </Link>
                  </li>
                  {categorias.map((c) => (
                    <li key={c.categoria}>
                      <Link
                        href={enlace({ ...f, categoria: c.categoria, pagina: 1 })}
                        aria-current={categoria === c.categoria ? "true" : undefined}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm ${categoria === c.categoria ? "bg-limon font-bold" : "hover:bg-teal-fondo"}`}
                      >
                        {c.categoria}
                        <span className="text-xs text-texto-2">{c.productos}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <form action="/explorar" className="flex flex-col gap-4">
              {busqueda && <input type="hidden" name="q" value={busqueda} />}
              {categoria && <input type="hidden" name="categoria" value={categoria} />}
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 font-bold">{t.precio}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs text-texto-2">
                    {t.precioMin}
                    <input name="min" inputMode="decimal" defaultValue={min} placeholder="$0" className={campo} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-texto-2">
                    {t.precioMax}
                    <input name="max" inputMode="decimal" defaultValue={max} placeholder="$100" className={campo} />
                  </label>
                </div>
              </fieldset>
              <label className="flex flex-col gap-1.5">
                <span className="font-bold">{t.ordenar}</span>
                <select name="orden" defaultValue={orden} className={campo}>
                  {ORDENES_EXPLORAR.map((o) => (
                    <option key={o} value={o}>
                      {t.ordenes[o]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango px-5 text-sm font-bold">
                {t.aplicar}
              </button>
              {filtrando && (
                <Link href="/explorar" className="text-center text-sm font-bold text-teal underline">
                  {t.limpiar}
                </Link>
              )}
            </form>
          </aside>
        )}

        <div className="flex min-w-0 flex-col gap-4">
          {vacio ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-white px-6 py-12 text-center">
              <Monito nombre="caja" className="w-20 text-teal/50" />
              <h2 className="text-lg font-bold">{filtrando ? t.sinResultadosTitulo : t.sinTiendasTitulo}</h2>
              <p className="max-w-sm text-texto-2">{filtrando ? t.sinResultadosTexto : t.sinTiendasTexto}</p>
              {filtrando && (
                <Link href="/explorar" className={chip(false)}>
                  {t.limpiar}
                </Link>
              )}
            </div>
          ) : vista === "tiendas" ? (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tiendas.map((tienda) => (
                <li key={tienda.slug}>
                  <Link
                    href={`/c/${tienda.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-white transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
                  >
                    <div aria-hidden="true" className="grid h-28 grid-cols-3" style={{ backgroundColor: colorDeMarca(tienda.color).hex }}>
                      {tienda.fotos.slice(0, 3).map((foto) => (
                        <span key={foto} className="relative border-r-2 border-teal-oscuro last:border-r-0">
                          <Image src={urlFoto(foto)} alt="" fill sizes="(min-width: 1024px) 130px, 25vw" className="object-cover" />
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="-mt-10 flex items-end justify-between gap-3">
                        <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-14 border-4 border-white ring-2 ring-teal-oscuro" />
                        <span className="mb-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">{t.piezas(tienda.piezas)}</span>
                      </div>
                      <h2 className="text-xl font-bold leading-tight">{tienda.nombre}</h2>
                      {tienda.descripcion && <p className="line-clamp-2 text-texto-2">{tienda.descripcion}</p>}
                      {tienda.categorias.length > 0 && (
                        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                          {tienda.categorias.slice(0, 4).map((c) => (
                            <li key={c} className="rounded-full bg-fondo px-2.5 py-0.5 text-xs">
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
              <p className="text-sm text-texto-2">{t.resultadosPagina(visibles.length)}</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
                {visibles.map((p) => (
                  <li key={`${p.tiendaSlug}-${p.codigo}`}>
                    <Link
                      href={`/c/${p.tiendaSlug}/${p.codigo}`}
                      className="group flex h-full flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-white p-2 pb-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-teal-fondo">
                        {p.foto ? (
                          <Image src={urlFoto(p.foto)} alt={p.nombre} fill sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw" className="object-cover" />
                        ) : (
                          <span aria-hidden="true" className="flex size-full items-center justify-center">
                            <Monito nombre="caja" className="w-1/3 text-teal/40" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-1 px-2">
                        <p className="line-clamp-2 font-bold leading-tight">{p.nombre}</p>
                        <p className="text-xl font-bold tabular-nums">
                          {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : t.desde(formatearDolares(p.precioMinimo))}
                        </p>
                        <p className="text-sm text-texto-2">{t.de(p.tiendaNombre)}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip estado="disponible" texto={textos.productos.quedan(p.disponibles)} />
                          {p.opciones > 1 && <span className="text-sm text-texto-2">{t.nOpciones(p.opciones)}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {(pagina > 1 || hayMas) && (
                <nav aria-label={t.productos} className="flex items-center justify-between gap-3">
                  {pagina > 1 ? (
                    <Link href={enlace({ ...f, pagina: pagina - 1 })} className={chip(false)}>
                      {t.anterior}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-texto-2">{t.pagina(pagina)}</span>
                  {hayMas ? (
                    <Link href={enlace({ ...f, pagina: pagina + 1 })} className={chip(false)}>
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
