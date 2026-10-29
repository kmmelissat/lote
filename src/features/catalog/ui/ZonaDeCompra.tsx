"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { tituloDe } from "../opciones";

const t = textos.vitrina.compra;

export type VarianteCompra = {
  codigo: number;
  /** Las partes de la etiqueta: ["iPhone 17", "Rosa"]; vacío si el producto no tiene variantes */
  partes: string[];
  disponibles: number;
  precio: number;
};

/**
 * Elegir: no hay nada preseleccionado, el stock y el precio son los de la variante elegida, las que no hay se ven
 * tachadas y la cantidad no pasa de lo que queda. Comprar y apartar son otras pantallas: acá solo están los dos
 * botones, fijos abajo.
 */
export function ZonaDeCompra({
  slug,
  nombresOpciones,
  variantes,
  apartarActivo,
}: {
  slug: string;
  nombresOpciones: string[];
  variantes: VarianteCompra[];
  apartarActivo: boolean;
}) {
  const dims = variantes[0]?.partes.length ?? 0;
  const [elegido, setElegido] = useState<(string | null)[]>(() => Array(dims).fill(null));
  const [cantidad, setCantidad] = useState(1);

  const seleccionada =
    dims === 0
      ? variantes[0]
      : elegido.every((e) => e !== null)
        ? variantes.find((v) => v.partes.every((x, i) => x === elegido[i]))
        : undefined;
  const hayStock = (seleccionada?.disponibles ?? 0) > 0;
  const tope = seleccionada?.disponibles ?? 0;
  const unidades = Math.min(Math.max(cantidad, 1), Math.max(tope, 1));

  // Las filas de fichas, una por opción, con sus valores en el orden en que aparecen
  const filas = Array.from({ length: dims }, (_, d) => {
    const valores = [...new Set(variantes.map((v) => v.partes[d]))];
    return {
      titulo: nombresOpciones.length === dims && nombresOpciones[d]?.trim() ? nombresOpciones[d].trim() : tituloDe(valores, d),
      valores,
    };
  });

  // Un valor se puede elegir si existe alguna variante con unidades que lo tenga y que combine con lo ya elegido en las demás filas
  const hay = (d: number, valor: string) =>
    variantes.some((v) => v.partes[d] === valor && v.disponibles > 0 && elegido.every((e, i) => i === d || e === null || v.partes[i] === e));

  function elegir(d: number, valor: string) {
    const nuevo = elegido.map((e, i) => (i === d ? (e === valor ? null : valor) : e));
    // Si lo nuevo no combina con lo que ya estaba elegido en otra fila, esa fila se vacía en vez de dejar algo imposible
    for (let i = 0; i < nuevo.length; i++) {
      if (i !== d && nuevo[i] !== null && !variantes.some((v) => v.partes.every((x, j) => nuevo[j] === null || j === i || x === nuevo[j]) && v.partes[i] === nuevo[i])) {
        nuevo[i] = null;
      }
    }
    setElegido(nuevo);
    setCantidad(1);
  }

  const precios = variantes.map((v) => v.precio);
  const desde = Math.min(...precios);
  const precio = seleccionada ? seleccionada.precio : desde;
  const faltan = filas.filter((_, i) => elegido[i] === null).map((f) => f.titulo.toLowerCase());

  // Las dos pantallas llevan el código de la variante elegida y la cantidad
  const listo = apartarActivo && !!seleccionada && hayStock;
  const base = seleccionada ? `/c/${slug}/${seleccionada.codigo}` : "";
  const boton = "inline-flex h-11 items-center justify-center rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold transition-[transform,box-shadow] duration-150";

  return (
    <>
      <div id="comprar" className="flex scroll-mt-4 flex-col gap-5">
        {filas.map((fila, d) => (
          <div key={fila.titulo} className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">{fila.titulo}</h2>
            <ul className="flex flex-wrap gap-2">
              {fila.valores.map((valor) => {
                const activo = elegido[d] === valor;
                const disponible = hay(d, valor);
                return (
                  <li key={valor}>
                    <button
                      type="button"
                      aria-pressed={activo}
                      disabled={!disponible && !activo}
                      onClick={() => elegir(d, valor)}
                      className={`inline-flex min-h-11 items-center rounded-full border-2 px-5 text-sm font-bold transition-colors ${
                        activo ? "border-teal-oscuro bg-mango" : "border-teal-oscuro bg-white hover:bg-limon"
                      } ${disponible || activo ? "" : "border-teal-oscuro/30 text-texto-2 line-through opacity-60"}`}
                    >
                      {valor}
                      {!disponible && !activo && <span className="sr-only"> ({textos.vitrina.noDisponibleCorto})</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Precio, cuántos quedan y la cantidad: lo primero que se mira al comprar */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-teal-oscuro/20 pt-4">
          <div className="flex flex-col gap-1">
            <p className="text-4xl font-bold tabular-nums">
              {!seleccionada && dims > 0 && Math.max(...precios) !== desde ? textos.vitrina.desde(formatearDolares(desde)) : formatearDolares(precio)}
            </p>
            {seleccionada ? (
              hayStock ? (
                <StatusChip estado="disponible" texto={textos.productos.quedan(seleccionada.disponibles)} />
              ) : (
                <StatusChip estado="apartado" />
              )
            ) : (
              <p className="text-sm text-texto-2">{t.stockElegi}</p>
            )}
          </div>
          {hayStock && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">{t.cantidad}</span>
              <div className="flex h-11 items-center rounded-full border-2 border-teal-oscuro bg-white">
                <button
                  type="button"
                  onClick={() => setCantidad(Math.max(1, unidades - 1))}
                  disabled={unidades <= 1}
                  aria-label={t.cantidadMenos}
                  className="flex h-full w-11 items-center justify-center rounded-l-full text-xl font-bold hover:bg-limon/50 disabled:opacity-30"
                >
                  −
                </button>
                <span aria-live="polite" className="w-8 text-center font-bold tabular-nums">
                  {unidades}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad(Math.min(tope, unidades + 1))}
                  disabled={unidades >= tope}
                  aria-label={t.cantidadMas}
                  className="flex h-full w-11 items-center justify-center rounded-r-full text-xl font-bold hover:bg-limon/50 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {!apartarActivo ? (
          <p className="text-texto-2">{textos.vitrina.apartarApagado}</p>
        ) : seleccionada && !hayStock ? (
          <p role="status" className="rounded-2xl bg-limon px-4 py-3 font-medium">
            {textos.vitrina.noDisponible}
          </p>
        ) : null}
      </div>

      {/* Los dos botones, siempre a mano abajo. Cada uno abre su propia pantalla. */}
      {apartarActivo && (
        <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-xl">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border-2 border-teal-oscuro bg-crema py-2 pl-5 pr-2 shadow-dura">
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-xs text-texto-2">
                {seleccionada ? textos.productos.quedan(seleccionada.disponibles) : faltan.length ? t.elegirPrimero(faltan.join(" y ")) : t.stockElegi}
              </span>
              <span className="text-xl font-bold tabular-nums">{formatearDolares(precio * (seleccionada ? unidades : 1))}</span>
            </div>
            <div className="flex shrink-0 gap-2">
              {listo ? (
                <>
                  <Link href={`${base}/apartar?n=${unidades}`} className={`${boton} bg-white hover:-translate-y-0.5 hover:shadow-dura-chica`}>
                    {t.modoApartar}
                  </Link>
                  <Link href={`${base}/comprar?n=${unidades}`} className={`${boton} bg-mango shadow-dura-chica hover:-translate-y-0.5 hover:shadow-dura`}>
                    {t.modoComprar}
                  </Link>
                </>
              ) : (
                <>
                  <span aria-disabled="true" className={`${boton} bg-white opacity-50`}>
                    {t.modoApartar}
                  </span>
                  <span aria-disabled="true" className={`${boton} bg-mango opacity-50`}>
                    {t.modoComprar}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
