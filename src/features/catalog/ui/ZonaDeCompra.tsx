"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { tituloDe } from "../opciones";
import type { OpcionesDeCompra } from "../repositorio";
import { ApartarForm } from "./ApartarForm";
import { CompraForm } from "./CompraForm";

const t = textos.vitrina.compra;

export type VarianteCompra = {
  codigo: number;
  /** Las partes de la etiqueta: ["iPhone 17", "Rosa"]; vacío si el producto no tiene variantes */
  partes: string[];
  disponibles: number;
  precio: number;
};

const SEPARADOR = " · ";
export const partesDe = (variante: string | null) => (variante ? variante.split(SEPARADOR) : []);

/**
 * Elegir, y recién ahí comprar: no hay nada preseleccionado, el stock y el precio son los de la variante elegida,
 * las que no hay se ven tachadas, y la cantidad no pasa de lo que queda. Abajo, la compra (o solo apartar).
 */
export function ZonaDeCompra({
  slug,
  nombresOpciones,
  variantes,
  opciones,
  plazoHoras,
  apartarActivo,
}: {
  slug: string;
  nombresOpciones: string[];
  variantes: VarianteCompra[];
  opciones: OpcionesDeCompra;
  plazoHoras: number;
  apartarActivo: boolean;
}) {
  const dims = variantes[0]?.partes.length ?? 0;
  const [elegido, setElegido] = useState<(string | null)[]>(() => Array(dims).fill(null));
  const [cantidad, setCantidad] = useState(1);
  const [modo, setModo] = useState<"comprar" | "apartar">("comprar");

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

  return (
    <div id="comprar" className="flex scroll-mt-4 flex-col gap-4">
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
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border-2 border-teal-oscuro bg-white p-4">
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
      ) : !seleccionada ? (
        <p role="status" className="rounded-2xl border-2 border-dashed border-teal-oscuro/40 px-4 py-3 text-center font-medium text-texto-2">
          {t.elegirPrimero(faltan.join(" y "))}
        </p>
      ) : !hayStock ? (
        <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 font-medium">
          {textos.vitrina.noDisponible}
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
          <div role="group" className="grid grid-cols-2 gap-2 rounded-full border-2 border-teal-oscuro bg-white p-1">
            {(["comprar", "apartar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => setModo(m)}
                className={`h-10 rounded-full text-sm font-bold transition-colors ${modo === m ? "bg-mango" : "hover:bg-limon/40"}`}
              >
                {m === "comprar" ? t.modoComprar : t.modoApartar}
              </button>
            ))}
          </div>
          {modo === "apartar" ? (
            <ApartarForm slug={slug} codigo={seleccionada.codigo} unidades={unidades} plazoHoras={plazoHoras} />
          ) : (
            <CompraForm slug={slug} codigo={seleccionada.codigo} precio={seleccionada.precio} unidades={unidades} opciones={opciones} />
          )}
        </div>
      )}

      {/* En el celular, el precio y el botón para comprar siempre a mano */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t-2 border-teal-oscuro bg-crema px-4 py-3 md:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-texto-2">{seleccionada ? textos.productos.quedan(seleccionada.disponibles) : t.stockElegi}</span>
          <span className="text-xl font-bold tabular-nums">{formatearDolares(precio * (seleccionada ? unidades : 1))}</span>
        </div>
        <Link
          href="#comprar"
          className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro bg-mango px-6 font-bold shadow-dura-chica"
        >
          {t.comprar}
        </Link>
      </div>
    </div>
  );
}
