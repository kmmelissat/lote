"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarAlCarrito } from "../carrito";
import { AvisameCuandoHaya } from "./AvisameCuandoHaya";
import { tituloDe } from "../opciones";

const t = textos.vitrina.compra;

export type VarianteCompra = {
  codigo: number;
  /** Las partes de la etiqueta: ["iPhone 17", "Rosa"]; vacío si el producto no tiene variantes */
  partes: string[];
  disponibles: number;
  precio: number;
  /** El precio de antes (centavos), para mostrar la oferta; null si no hay */
  precioAnterior: number | null;
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
  plazoHoras,
  apartarActivo,
}: {
  slug: string;
  nombresOpciones: string[];
  variantes: VarianteCompra[];
  /** Cuánto tiempo se guarda un apartado sin pagar */
  plazoHoras: number;
  apartarActivo: boolean;
}) {
  const dims = variantes[0]?.partes.length ?? 0;
  const [elegido, setElegido] = useState<(string | null)[]>(() => Array(dims).fill(null));
  const [cantidad, setCantidad] = useState(1);
  // Lo que pasó al agregar al carrito; el aviso se esconde solo cuando cambia lo elegido (otra variante u otra cantidad)
  const [resultado, setResultado] = useState<{ clave: string; valor: "agregado" | "tope" | "lleno" } | null>(null);

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
  // El precio de antes solo se muestra si de verdad era más alto
  const anterior = seleccionada ? seleccionada.precioAnterior : dims === 0 ? (variantes[0]?.precioAnterior ?? null) : null;
  const oferta = anterior && anterior > precio ? { antes: anterior, porcentaje: Math.round(((anterior - precio) / anterior) * 100) } : null;
  const faltan = filas.filter((_, i) => elegido[i] === null).map((f) => f.titulo.toLowerCase());

  // Las dos pantallas llevan el código de la variante elegida y la cantidad
  const listo = apartarActivo && !!seleccionada && hayStock;
  const clave = `${seleccionada?.codigo ?? 0}-${unidades}`;
  const aviso = resultado?.clave === clave ? resultado.valor : null;
  const pista = faltan.length ? t.elegirPrimero(faltan.join(" y ")) : t.stockElegi;
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
                        activo ? "border-teal-oscuro bg-accion text-accion-texto" : "border-teal-oscuro bg-white hover:bg-limon"
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
            {oferta && (
              <p className="flex items-center gap-2 text-sm">
                <span className="text-texto-2 line-through tabular-nums">{formatearDolares(oferta.antes)}</span>
                <span className="rounded-full border-2 border-teal-oscuro bg-limon px-2.5 py-0.5 text-xs font-bold">{textos.vitrina.etiquetas.oferta(oferta.porcentaje)}</span>
              </p>
            )}
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

        {/* Apartar ya no es un botón más: es la salida tranquila para quien todavía no se decide */}
        {apartarActivo && (
          <p className="text-sm text-texto-2">
            {t.dudas}{" "}
            {listo ? (
              <Link href={`${base}/apartar?n=${unidades}`} className="font-bold text-teal underline">
                {t.apartarEnlace(plazoHoras)}
              </Link>
            ) : (
              <span className="font-bold">{t.apartarEnlace(plazoHoras)}</span>
            )}
          </p>
        )}

        {!apartarActivo ? (
          <p className="text-texto-2">{textos.vitrina.apartarApagado}</p>
        ) : seleccionada && !hayStock ? (
          <>
            <p role="status" className="rounded-2xl bg-limon px-4 py-3 font-medium">
              {textos.vitrina.noDisponible}
            </p>
            {/* Se perdía la venta: ahora se deja el WhatsApp y la tienda avisa cuando vuelva */}
            <AvisameCuandoHaya key={seleccionada.codigo} slug={slug} codigo={seleccionada.codigo} />
          </>
        ) : null}
      </div>

      {/* Siempre a mano abajo: comprar es lo principal, y el carrito acompaña para seguir mirando. Apartar vive en la tarjeta. */}
      {apartarActivo && (
        <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-xl">
          {aviso && (
            <p
              role="status"
              className="pointer-events-auto mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-2.5 font-medium shadow-dura-chica"
            >
              <span className="inline-flex items-center gap-2">
                <Icon nombre="check" className="size-5" strokeWidth={2.5} />
                {aviso === "agregado" ? textos.vitrina.carrito.agregado : aviso === "tope" ? textos.vitrina.carrito.tope : textos.vitrina.carrito.lleno}
              </span>
              {aviso !== "lleno" && (
                <Link href={`/c/${slug}/carrito`} className="font-bold underline">
                  {textos.vitrina.carrito.verCarrito}
                </Link>
              )}
            </p>
          )}
          <div className="pointer-events-auto flex flex-col gap-1 rounded-[28px] border-2 border-teal-oscuro bg-crema p-2 shadow-dura">
            {!listo && <p className="px-3 pt-1 text-center text-xs text-texto-2">{pista}</p>}
            <div className="flex items-center gap-2">
              {/* En pantallas anchas el precio y lo que queda van a la izquierda; en el celular no entran */}
              <div className="ml-3 mr-auto hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="truncate text-xs text-texto-2">{seleccionada ? textos.productos.quedan(seleccionada.disponibles) : t.stockElegi}</span>
                <span className="text-xl font-bold tabular-nums">{formatearDolares(precio * (seleccionada ? unidades : 1))}</span>
              </div>
              <button
                type="button"
                disabled={!listo}
                onClick={() => setResultado({ clave, valor: agregarAlCarrito(slug, seleccionada!.codigo, unidades, seleccionada!.disponibles) })}
                aria-label={textos.vitrina.carrito.agregar}
                title={textos.vitrina.carrito.agregar}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-sm font-bold transition-[transform,box-shadow] duration-150 enabled:hover:-translate-y-0.5 enabled:hover:bg-limon enabled:hover:shadow-dura-chica disabled:opacity-50 sm:w-auto sm:px-4"
              >
                <Icon nombre="carrito" className="size-5" />
                <span className="hidden sm:ml-2 sm:inline">{textos.vitrina.carrito.agregarCorto}</span>
              </button>
              {listo ? (
                <Link href={`${base}/comprar?n=${unidades}`} className={`${boton} flex-1 bg-accion text-accion-texto shadow-dura-chica hover:-translate-y-0.5 hover:shadow-dura sm:flex-none sm:px-8`}>
                  {t.modoComprar}
                </Link>
              ) : (
                <span aria-disabled="true" className={`${boton} flex-1 bg-accion text-accion-texto opacity-50 sm:flex-none sm:px-8`}>
                  {t.modoComprar}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
