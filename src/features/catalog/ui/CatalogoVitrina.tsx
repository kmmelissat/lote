"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { StatusChip } from "@/components/ui/StatusChip";
import type { TarjetaVitrina } from "../agruparVitrina";
import { urlFoto } from "@/lib/fotos";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.vitrina;

// Las tarjetas están rectas y alineadas; al pasar el mouse se inclinan un grado, como fotos pegadas a mano
const GIROS = ["hover:-rotate-1", "hover:rotate-1"];

// A partir de cuántos productos conviene poder buscar y ordenar
const MIN_PARA_BUSCAR = 8;
const MIN_PARA_ORDENAR = 4;

type Orden = "recientes" | "precio_asc" | "precio_desc";

/** Sin tildes y en minúsculas, para que "camara" encuentre "Cámara". */
const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** La grilla de la vitrina, con chips de categoría para filtrar. */
export function CatalogoVitrina({ slug, productos }: { slug: string; productos: TarjetaVitrina[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modelo, setModelo] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>("recientes");
  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria?.trim()).filter((c): c is string => !!c))].sort(),
    [productos],
  );
  // Los modelos de celular que hay en la tienda, de los más nuevos a los más viejos: es lo primero que busca quien compra una funda
  const modelos = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const p of productos) for (const m of p.modelos) vistos.set(m.toLowerCase(), vistos.get(m.toLowerCase()) ?? m);
    return [...vistos.values()].sort((a, b) => b.localeCompare(a, "es", { numeric: true }));
  }, [productos]);
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const visibles = productos
    .filter((p) => !categoria || p.categoria?.trim() === categoria)
    .filter((p) => !modelo || p.modelos.some((m) => m.toLowerCase() === modelo.toLowerCase()))
    // Cada palabra tiene que aparecer en el nombre o en la categoría: "iphone 16" encuentra "Case iPhone 16 Pro"
    .filter((p) => palabras.every((w) => normalizar(`${p.nombre} ${p.categoria ?? ""}`).includes(w)));
  const conBuscador = productos.length > MIN_PARA_BUSCAR;
  const conOrden = productos.length >= MIN_PARA_ORDENAR;
  // "Más nuevos" es el orden en que llegan; los precios se ordenan por el más bajo de cada tarjeta
  const ordenados = orden === "recientes" ? visibles : [...visibles].sort((a, b) => (orden === "precio_asc" ? a.precioMinimo - b.precioMinimo : b.precioMinimo - a.precioMinimo));

  const chip = (activo: boolean) =>
    `inline-flex h-10 max-md:min-h-11 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors ${
      activo ? "bg-teal-fondo text-teal" : "bg-crema hover:bg-limon"
    }`;

  return (
    <div className="flex flex-col gap-5">
      {(conBuscador || conOrden) && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                  className="h-12 w-full rounded-full border-2 border-teal-oscuro bg-white pl-12 pr-12 text-base placeholder:text-texto-2/70 focus:border-teal"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    aria-label={t.limpiarBusqueda}
                    className="absolute right-2 top-1/2 flex size-9 max-md:size-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-limon/50"
                  >
                    <Icon nombre="x" className="size-5" />
                  </button>
                )}
              </div>
            )}
            {conOrden && (
              <div className="sm:ml-auto sm:w-64">
                <ListaDesplegable
                  name="orden"
                  variante="campo"
                  valor={orden}
                  alCambiar={(v) => setOrden(v as Orden)}
                  opciones={(Object.keys(t.ordenes) as Orden[]).map((o) => ({ valor: o, etiqueta: t.ordenes[o] }))}
                  placeholder={t.ordenar}
                />
              </div>
            )}
          </div>
          <p role="status" className="min-h-5 text-sm text-texto-2">
            {busqueda || categoria || modelo ? t.nResultados(visibles.length) : ""}
          </p>
        </div>
      )}
      {modelos.length > 1 && (
        <ul aria-label={t.modelo} className="flex flex-wrap items-center gap-2">
          <li className="text-sm font-bold">{t.modelo}</li>
          <li>
            <button type="button" aria-pressed={modelo === null} onClick={() => setModelo(null)} className={chip(modelo === null)}>
              {t.todo}
            </button>
          </li>
          {modelos.map((m) => (
            <li key={m}>
              <button type="button" aria-pressed={modelo === m} onClick={() => setModelo(m)} className={chip(modelo === m)}>
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
      {categorias.length > 1 && (
        <ul aria-label={t.categorias} className="flex flex-wrap gap-2">
          <li>
            <button type="button" aria-pressed={categoria === null} onClick={() => setCategoria(null)} className={chip(categoria === null)}>
              {t.todo}
            </button>
          </li>
          {categorias.map((c) => (
            <li key={c}>
              <button type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={chip(categoria === c)}>
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      {ordenados.length === 0 ? (
        <p className="py-8 text-center text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {ordenados.map((p, i) => {
            const libre = p.disponibles > 0;
            return (
              <li key={p.codigo} className="h-full">
                <Link
                  href={`/c/${slug}/${p.codigo}`}
                  className={`group flex h-full flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-2 pb-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura ${GIROS[i % GIROS.length]}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-[18px] bg-teal-fondo">
                    {p.fotos[0] ? (
                      <Image
                        src={urlFoto(p.fotos[0])}
                        alt={p.nombre}
                        fill
                        loading={i < 4 ? "eager" : "lazy"}
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className={`object-cover ${libre ? "" : "opacity-70"}`}
                      />
                    ) : (
                      <span aria-hidden="true" className="flex size-full items-center justify-center">
                        <Monito nombre="caja" className="w-1/3 text-teal/40" />
                      </span>
                    )}
                    {!libre && (
                      <span className="absolute left-2 top-2 -rotate-6 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-xs font-bold text-teal-oscuro">
                        {p.apartado ? t.apartadoSticker : t.agotadoSticker}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-1 px-2">
                    <p className="line-clamp-2 font-bold leading-tight">{p.nombre}</p>
                    <p className="text-lg font-bold tabular-nums text-teal">
                      {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : t.desde(formatearDolares(p.precioMinimo))}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {libre && <StatusChip estado="disponible" texto={textos.productos.quedan(p.disponibles)} />}
                      {p.opciones > 1 && <span className="text-sm text-texto-2">{t.nOpciones(p.opciones)}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
