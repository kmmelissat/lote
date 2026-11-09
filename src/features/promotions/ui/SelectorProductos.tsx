"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { filtrarGrupos, nombreDeOpcion, type GrupoDeProductos, type OpcionProductoPromocion } from "../grupos";

const t = textos.promociones;

export const MAXIMO_POR_PACK = 20;

/** Cuántas unidades lleva el pack de cada producto elegido (id -> cantidad). En "llevá y pagá" siempre es 1. */
export type Elegidos = Record<string, number>;

function Foto({ foto, tamano = "size-12" }: { foto: string | null; tamano?: string }) {
  return (
    <div className={`relative ${tamano} shrink-0 overflow-hidden rounded-xl border border-linea bg-teal-fondo`}>
      {foto ? (
        <Image src={urlFoto(foto)} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-teal">
          <Icon nombre="productos" className="size-5" />
        </div>
      )}
    </div>
  );
}

/** Lo que se sabe de una opción además de su precio: si está agotada y si ya está en otra promoción. Va en su propia línea. */
function Notas({ p }: { p: OpcionProductoPromocion }) {
  if (p.disponibles !== 0 && !p.enPromocion) return null;
  return (
    <p className="line-clamp-2 text-xs">
      {p.disponibles === 0 && <span className="font-bold text-error">{t.agotado}</span>}
      {p.disponibles === 0 && p.enPromocion && " · "}
      {p.enPromocion && <span className="font-medium text-teal">{t.yaEn(p.enPromocion)}</span>}
    </p>
  );
}

const boton = "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-[14px] border border-linea px-3 text-sm font-bold sm:px-4";

/** El control de cantidad de un producto del pack: − 1 +. */
export function Cantidad({ p, n, cambiar }: { p: OpcionProductoPromocion; n: number; cambiar: (id: string, diferencia: number) => void }) {
  const nombre = nombreDeOpcion(p);
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={n === 1 ? t.quitar(nombre) : t.menosDe(nombre)}
        onClick={() => cambiar(p.id, -1)}
        className="grid size-11 place-items-center rounded-[14px] border border-linea bg-superficie text-lg font-bold"
      >
        <span aria-hidden="true">−</span>
      </button>
      <span aria-live="polite" className="w-7 text-center font-bold tabular-nums">
        {n}
      </span>
      <button
        type="button"
        aria-label={t.masDe(nombre)}
        disabled={n >= MAXIMO_POR_PACK}
        onClick={() => cambiar(p.id, 1)}
        className="grid size-11 place-items-center rounded-[14px] border border-linea bg-ficha-verde text-lg font-bold disabled:opacity-40"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

/**
 * Para elegir qué entra en la promoción: una lista con buscador donde cada producto aparece una sola vez y sus variantes
 * se despliegan debajo. En un pack cada producto se agrega con su cantidad; en "llevá y pagá" se elige un producto
 * entero (con todas sus variantes).
 */
export function SelectorProductos({
  grupos,
  modo,
  elegidos,
  cambiar,
  elegirGrupo,
}: {
  grupos: GrupoDeProductos[];
  modo: "pack" | "llevas_pagas";
  elegidos: Elegidos;
  /** Pack: suma o resta unidades de un producto */
  cambiar: (id: string, diferencia: number) => void;
  /** Llevá y pagá: elige un producto con todas sus variantes */
  elegirGrupo: (grupo: GrupoDeProductos) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const visibles = useMemo(() => filtrarGrupos(grupos, busqueda), [grupos, busqueda]);
  const buscando = busqueda.trim() !== "";

  function alternar(clave: string) {
    setAbiertos((actual) => {
      const nuevo = new Set(actual);
      if (!nuevo.delete(clave)) nuevo.add(clave);
      return nuevo;
    });
  }

  function agregar(p: OpcionProductoPromocion) {
    return (
      <button type="button" onClick={() => cambiar(p.id, 1)} aria-label={`${t.agregar} ${nombreDeOpcion(p)}`} className={`${boton} bg-superficie hover:bg-gris-100`}>
        <Icon nombre="mas" className="size-4" />
        <span className="max-sm:sr-only">{t.agregar}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CampoBusqueda value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={t.buscar} aria-label={t.buscar} />
      {visibles.length === 0 ? (
        <p className="py-6 text-center text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="max-h-[26rem] overflow-y-auto overscroll-contain rounded-2xl border border-borde bg-superficie">
          {visibles.map((g) => {
            const unico = g.miembros.length === 1 ? g.miembros[0] : null;
            const abierto = buscando || abiertos.has(g.clave);
            const elegido = g.miembros.some((m) => elegidos[m.id] > 0);
            return (
              <li key={g.clave} className="border-t border-borde first:border-t-0">
                <div className={`flex items-center gap-3 px-3 py-2 ${elegido ? "bg-gris-50" : ""}`}>
                  <Foto foto={g.foto} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{unico ? nombreDeOpcion(unico) : g.nombre}</p>
                    <p className="text-sm text-texto-2">
                      <span className="font-bold tabular-nums text-texto">{t.rangoPrecio(formatearDolares(g.precioMin), formatearDolares(g.precioMax))}</span>
                      {unico ? ` · #${unico.codigo}` : ` · ${t.variantes(g.miembros.length)}`}
                    </p>
                    {unico && <Notas p={unico} />}
                  </div>
                  {modo === "llevas_pagas" ? (
                    <button
                      type="button"
                      aria-pressed={elegido}
                      aria-label={unico ? t.elegirEtiqueta(nombreDeOpcion(unico)) : t.elegirTodasEtiqueta(g.nombre)}
                      onClick={() => elegirGrupo(g)}
                      className={`${boton} ${elegido ? "bg-ficha-amarillo" : "bg-superficie hover:bg-gris-100"}`}
                    >
                      {elegido && <Icon nombre="check" className="size-4" />}
                      {unico ? (
                        t.elegirProducto
                      ) : (
                        <>
                          <span className="sm:hidden">{t.elegirProducto}</span>
                          <span className="max-sm:hidden">{t.elegirTodas}</span>
                        </>
                      )}
                    </button>
                  ) : unico ? (
                    elegidos[unico.id] > 0 ? (
                      <Cantidad p={unico} n={elegidos[unico.id]} cambiar={cambiar} />
                    ) : (
                      agregar(unico)
                    )
                  ) : (
                    <button
                      type="button"
                      aria-expanded={abierto}
                      aria-label={abierto ? t.ocultarVariantes(g.nombre) : t.verVariantes(g.nombre)}
                      onClick={() => alternar(g.clave)}
                      className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-linea bg-teal-fondo"
                    >
                      <Icon nombre="flecha" className={`size-5 transition-transform ${abierto ? "rotate-180" : ""}`} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* En un pack se agrega cada variante; en "llevá y pagá" el producto entra completo */}
                {!unico && modo === "pack" && abierto && (
                  <ul className="border-t border-borde bg-fondo/60">
                    {g.miembros.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 border-t border-borde py-2 pl-6 pr-3 first:border-t-0 sm:pl-[4.5rem]">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">{m.variante ?? nombreDeOpcion(m)}</p>
                          <p className="text-sm text-texto-2">
                            <span className="font-bold tabular-nums text-texto">{formatearDolares(m.precio)}</span> · #{m.codigo}
                          </p>
                          <Notas p={m} />
                        </div>
                        {elegidos[m.id] > 0 ? <Cantidad p={m} n={elegidos[m.id]} cambiar={cambiar} /> : agregar(m)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** "En tu pack": lo que ya se eligió, arriba del buscador, con su cantidad. */
export function EnTuPack({ productos, elegidos, cambiar }: { productos: OpcionProductoPromocion[]; elegidos: Elegidos; cambiar: (id: string, diferencia: number) => void }) {
  return (
    <section aria-labelledby="en-tu-pack" className="flex flex-col gap-2 rounded-[20px] border border-linea bg-gris-50 p-3">
      <h3 id="en-tu-pack" className="text-sm font-bold">
        {t.enTuPack}
      </h3>
      {productos.length === 0 ? (
        <p className="text-sm text-texto-2">{t.enTuPackVacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {productos.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Foto foto={p.foto} tamano="size-10" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{nombreDeOpcion(p)}</p>
                <p className="text-sm tabular-nums text-texto-2">{formatearDolares(p.precio)}</p>
              </div>
              <Cantidad p={p} n={elegidos[p.id]} cambiar={cambiar} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** El producto de un "llevá y pagá": su nombre, qué variantes entran (se pueden quitar) y cómo cambiarlo. */
export function ProductoElegido({
  grupo,
  elegidos,
  quitar,
  cambiarProducto,
}: {
  grupo: GrupoDeProductos;
  elegidos: Elegidos;
  quitar: (id: string) => void;
  cambiarProducto: () => void;
}) {
  const incluidos = grupo.miembros.filter((m) => elegidos[m.id] > 0);
  return (
    <section aria-labelledby="producto-elegido" className="flex flex-col gap-3 rounded-[20px] border border-linea bg-gris-50 p-3">
      <div className="flex items-center gap-3">
        <Foto foto={grupo.foto} />
        <div className="min-w-0 flex-1">
          <h3 id="producto-elegido" className="text-sm font-bold">
            {t.productoElegido}
          </h3>
          <p className="line-clamp-2 text-sm">{grupo.nombre}</p>
        </div>
        <button type="button" onClick={cambiarProducto} className="min-h-11 shrink-0 px-2 text-sm font-medium text-teal underline underline-offset-2">
          {t.cambiarProducto}
        </button>
      </div>
      {grupo.miembros.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-texto-2">{t.incluye}</p>
          <ul className="flex flex-wrap gap-2">
            {incluidos.map((m) => (
              <li key={m.id} className="inline-flex items-center gap-1 rounded-full border border-linea bg-superficie py-1 pl-3 pr-1 text-sm font-medium">
                {m.variante ?? nombreDeOpcion(m)}
                {incluidos.length > 1 && (
                  <button
                    type="button"
                    aria-label={t.quitarVariante(m.variante ?? nombreDeOpcion(m))}
                    onClick={() => quitar(m.id)}
                    className="grid size-8 place-items-center rounded-full hover:bg-gris-100"
                  >
                    <Icon nombre="x" className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
