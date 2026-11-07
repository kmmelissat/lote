"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { normalizarTexto } from "@/domain";
import type { TarjetaVitrina } from "../agruparVitrina";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { textos } from "@/lib/textos";
import { TarjetaDeVitrina } from "./TarjetaDeVitrina";

const t = textos.vitrina;

// A partir de cuántos productos conviene poder buscar y ordenar
const MIN_PARA_BUSCAR = 8;
const MIN_PARA_ORDENAR = 4;

// Rangos de precio de la barra lateral (por el precio más bajo de cada tarjeta)
const RANGOS = [
  { id: "bajo", min: 0, max: 5 },
  { id: "medio", min: 5, max: 10 },
  { id: "alto", min: 10, max: Infinity },
] as const;

type Orden = "recientes" | "precio_asc" | "precio_desc";

/** Sin tildes y en minúsculas, para que "camara" encuentre "Cámara". */
/** La grilla de la vitrina, con chips de categoría para filtrar. */
export function CatalogoVitrina({
  slug,
  productos,
  umbral,
  envio,
  puedeComprar,
  enPromocion = [],
}: {
  slug: string;
  /** Códigos de los productos que cubre alguna promoción vigente */
  enPromocion?: number[];
  productos: TarjetaVitrina[];
  umbral: number;
  /** Lo que cuesta y tarda el envío de la tienda, para cada tarjeta */
  envio: string | null;
  puedeComprar: boolean;
}) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modelo, setModelo] = useState<string | null>(null);
  const [rango, setRango] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>("recientes");
  const categorias = useMemo(
    () =>
      [
        ...new Set(
          productos
            .map((p) => p.categoria?.trim())
            .filter((c): c is string => !!c),
        ),
      ].sort(),
    [productos],
  );
  // Los modelos de celular que hay en la tienda, de los más nuevos a los más viejos: es lo primero que busca quien compra una funda
  const modelos = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const p of productos)
      for (const m of p.modelos)
        vistos.set(m.toLowerCase(), vistos.get(m.toLowerCase()) ?? m);
    return [...vistos.values()].sort((a, b) =>
      b.localeCompare(a, "es", { numeric: true }),
    );
  }, [productos]);
  const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
  const visibles = productos
    .filter((p) => !categoria || p.categoria?.trim() === categoria)
    .filter((p) => {
      const r = RANGOS.find((x) => x.id === rango);
      return !r || (p.precioMinimo >= r.min && p.precioMinimo < r.max);
    })
    .filter(
      (p) =>
        !modelo ||
        p.modelos.some((m) => m.toLowerCase() === modelo.toLowerCase()),
    )
    // Cada palabra tiene que aparecer en el nombre o en la categoría: "iphone 16" encuentra "Case iPhone 16 Pro"
    .filter((p) =>
      palabras.every((w) =>
        normalizarTexto(`${p.nombre} ${p.categoria ?? ""}`).includes(w),
      ),
    );
  const conBuscador = productos.length > MIN_PARA_BUSCAR;
  const conOrden = productos.length >= MIN_PARA_ORDENAR;
  // "Más nuevos" es el orden en que llegan; los precios se ordenan por el más bajo de cada tarjeta
  const ordenados =
    orden === "recientes"
      ? visibles
      : [...visibles].sort((a, b) =>
          orden === "precio_asc"
            ? a.precioMinimo - b.precioMinimo
            : b.precioMinimo - a.precioMinimo,
        );

  const chip = (activo: boolean) =>
    `inline-flex h-10 max-md:min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors ${
      activo ? "border-teal-oscuro bg-teal-oscuro text-white" : "border-teal-oscuro/25 bg-superficie hover:bg-teal-fondo"
    }`;
  const cuenta = (c: string) => productos.filter((p) => p.categoria?.trim() === c).length;
  const hayFiltros = categorias.length > 1 || modelos.length > 1 || conOrden;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {(conBuscador || hayFiltros) && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {conBuscador && (
            <div className="relative flex-1">
              <label htmlFor="buscar-vitrina" className="sr-only">
                {t.buscar}
              </label>
              <Icon nombre="buscar" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-2" />
              <input
                id="buscar-vitrina"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t.buscarPlaceholder}
                autoComplete="off"
                className="h-12 w-full rounded-full border border-teal-oscuro/25 bg-superficie pl-12 pr-12 text-base placeholder:text-texto-2/70 focus:border-teal"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  aria-label={t.limpiarBusqueda}
                  className="absolute right-2 top-1/2 flex size-9 max-md:size-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-teal-fondo"
                >
                  <Icon nombre="x" className="size-5" />
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
            {modelos.length > 1 && (
              <div className="w-full sm:w-56">
                <ListaDesplegable
                  variante="pildora"
                  className="!h-12 !border !border-teal-oscuro/25"
                  valor={modelo ?? ""}
                  alCambiar={(v) => setModelo(v || null)}
                  placeholder={t.modelo}
                  opciones={[
                    { valor: "", etiqueta: t.todo, etiquetaBoton: `${t.modelo}: ${t.todo}` },
                    ...modelos.map((m) => ({ valor: m, etiqueta: m, etiquetaBoton: `${t.modelo}: ${m}` })),
                  ]}
                />
              </div>
            )}
            {conOrden && (
              <div className="w-full sm:w-52">
                <ListaDesplegable
                  variante="pildora"
                  className="!h-12 !border !border-teal-oscuro/25"
                  valor={rango ?? ""}
                  alCambiar={(v) => setRango(v || null)}
                  placeholder={t.precio}
                  opciones={[
                    { valor: "", etiqueta: t.todo, etiquetaBoton: `${t.precio}: ${t.todo}` },
                    ...RANGOS.map((r) => ({ valor: r.id, etiqueta: t.rangos[r.id], etiquetaBoton: `${t.precio}: ${t.rangos[r.id]}` })),
                  ]}
                />
              </div>
            )}
            {conOrden && (
              <div className="col-span-2 w-full sm:col-span-1 sm:w-60">
                <ListaDesplegable
                  name="orden"
                  variante="pildora"
                  className="!h-12 !border !border-teal-oscuro/25"
                  valor={orden}
                  alCambiar={(v) => setOrden(v as Orden)}
                  opciones={(Object.keys(t.ordenes) as Orden[]).map((o) => ({ valor: o, etiqueta: t.ordenes[o], etiquetaBoton: `${t.ordenar}: ${t.ordenes[o]}` }))}
                  placeholder={t.ordenar}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {categorias.length > 1 && (
        <ul aria-label={t.categorias} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <li>
            <button type="button" aria-pressed={categoria === null} onClick={() => setCategoria(null)} className={chip(categoria === null)}>
              {t.todo} · {productos.length}
            </button>
          </li>
          {categorias.map((c) => (
            <li key={c}>
              <button type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={chip(categoria === c)}>
                {c} · {cuenta(c)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="text-sm text-texto-2 empty:hidden">
        {busqueda || categoria || modelo || rango ? t.nResultados(visibles.length) : ""}
      </p>

      {ordenados.length === 0 ? (
        <p className="py-8 text-center text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {ordenados.map((p, i) => (
            <li key={p.codigo} className="h-full min-w-0">
              <TarjetaDeVitrina
                slug={slug}
                p={p}
                umbral={umbral}
                envio={envio}
                puedeComprar={puedeComprar}
                prioridad={i < 4}
                promo={[p.codigo, ...p.variantes.map((v) => v.codigo)].some((c) => enPromocion.includes(c))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
