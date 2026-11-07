"use client";

import { conBusqueda, ruta } from "@/lib/ruta";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarAlCarrito } from "../carrito";
import { AvisameCuandoHaya } from "./AvisameCuandoHaya";
import { etiquetaDeOpcion, tituloDe } from "../opciones";
import { enlaceFacebook, enlaceInstagram, enlaceTiktok, enlaceWhatsApp, mensajePedirProducto } from "../enlaces";
import { useFotosElegidas } from "./FotosPorVariante";

const t = textos.vitrina.compra;

export type VarianteCompra = {
  codigo: number;
  /** Las partes de la etiqueta: ["iPhone 17", "Rosa"]; vacío si el producto no tiene variantes */
  partes: string[];
  disponibles: number;
  precio: number;
  /** El precio de antes (centavos), para mostrar la oferta; null si no hay */
  precioAnterior: number | null;
  /** Las fotos propias de la variante; vacío si usa las del producto */
  fotos: string[];
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
  permiteComprar,
  permiteApartar,
  umbralPocoStock,
  contacto,
}: {
  slug: string;
  nombresOpciones: string[];
  variantes: VarianteCompra[];
  /** Cuánto tiempo se guarda un apartado sin pagar */
  plazoHoras: number;
  permiteComprar: boolean;
  permiteApartar: boolean;
  /** Hasta cuántas unidades se avisa «Quedan N»; con más, solo «Disponible» */
  umbralPocoStock: number;
  /** Para el modo catálogo: a quién se le escribe y qué producto se nombra en el mensaje */
  contacto: { tienda: string; producto: string; whatsapp: string | null; instagram: string | null; facebook?: string | null; tiktok?: string | null };
}) {
  const { avisar } = useToast();
  const router = useRouter();
  const dims = variantes[0]?.partes.length ?? 0;
  const [elegido, setElegido] = useState<(string | null)[]>(() => Array(dims).fill(null));
  const [cantidad, setCantidad] = useState(1);
  // Si tocan "Comprar" sin haber elegido, se resalta lo que falta
  const [tocado, setTocado] = useState(false);

  const seleccionada =
    dims === 0
      ? variantes[0]
      : elegido.every((e) => e !== null)
        ? variantes.find((v) => v.partes.every((x, i) => x === elegido[i]))
        : undefined;
  const { poner: ponerFotos } = useFotosElegidas();
  const fotosElegidas = seleccionada && dims > 0 ? seleccionada.fotos : null;
  useEffect(() => ponerFotos(fotosElegidas), [fotosElegidas, ponerFotos]);
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
  // Con las dos cosas apagadas la tienda es un catálogo: no se pide nada acá, se le escribe
  const pedidos = permiteComprar || permiteApartar;
  const listo = pedidos && !!seleccionada && hayStock;
  const elegida = seleccionada ?? variantes[0];
  const mensaje = mensajePedirProducto(
    contacto.tienda,
    [contacto.producto, ...(seleccionada?.partes ?? [])].join(" · "),
    elegida?.codigo ?? 0,
    formatearDolares(precio),
  );
  const meInteresa = enlaceWhatsApp(contacto.whatsapp, mensaje) ?? enlaceInstagram(contacto.instagram) ?? enlaceFacebook(contacto.facebook ?? null) ?? enlaceTiktok(contacto.tiktok ?? null);
  // Tocar comprar sin haber elegido lleva a las opciones y marca las que faltan
  function pedirElegir() {
    setTocado(true);
    document.getElementById("opciones-compra")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  // Lo que pasó al agregar se dice con un aviso (toast), con atajo al carrito
  function agregar() {
    const r = agregarAlCarrito(slug, seleccionada!.codigo, unidades, seleccionada!.disponibles);
    const c = textos.vitrina.carrito;
    avisar(r === "agregado" ? c.agregado : r === "tope" ? c.tope : c.lleno, {
      tipo: r === "agregado" ? "exito" : "info",
      accion: r === "lleno" ? undefined : { etiqueta: c.verCarrito, alTocar: () => router.push(ruta(`/c/${slug}/carrito`)) },
    });
  }
  const pista = faltan.length ? t.elegirPrimero(faltan.join(" y ")) : t.stockElegi;
  const enlaceA = (accion: "apartar" | "comprar") =>
    conBusqueda(ruta(`/c/${slug}/${seleccionada?.codigo ?? 0}/${accion}`), `n=${unidades}`);
  const boton = "inline-flex h-11 items-center justify-center rounded-full border border-teal-oscuro/30 px-5 text-sm font-bold transition-[transform,box-shadow] duration-150";

  return (
    <>
      <div id="comprar" className="flex scroll-mt-4 flex-col gap-5">
        {/* Lo primero que se mira: el precio grande, el de antes tachado, cuánto se ahorra y cuántos quedan */}
        <div className="flex flex-col items-start gap-2">
          <p className="font-logo text-4xl font-bold tabular-nums leading-none tracking-tight text-(--store-accent) md:text-[2.6rem]">
            {!seleccionada && dims > 0 && Math.max(...precios) !== desde ? textos.vitrina.desde(formatearDolares(desde)) : formatearDolares(precio)}
          </p>
          {oferta && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-texto-2 line-through tabular-nums">
                <span className="sr-only">{textos.explorar.antes} </span>
                {formatearDolares(oferta.antes)}
              </span>
              <span className="rounded-full border border-teal-oscuro/30 bg-(--store-soft) text-(--store-on-soft) px-2.5 py-0.5 text-xs font-extrabold">
                {textos.promociones.ahorras(formatearDolares(oferta.antes - precio))}
              </span>
            </p>
          )}
          {seleccionada ? (
            hayStock ? (
              seleccionada.disponibles <= umbralPocoStock ? (
              <StatusChip publico estado="poco_stock" texto={textos.productos.quedan(seleccionada.disponibles)} />
            ) : null
            ) : (
              <StatusChip publico estado="apartado" />
            )
          ) : (
            null
          )}
        </div>

        {filas.length > 0 && <div id="opciones-compra" className="flex scroll-mt-24 flex-col gap-5">{filas.map((fila, d) => (
          <div key={fila.titulo} className={`flex flex-col gap-2 ${tocado && elegido[d] === null ? "rounded-2xl p-2 ring-2 ring-error" : ""}`}>
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
                      className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold transition-colors ${
                        activo ? "border-teal-oscuro bg-(--store-button) text-(--store-on-button)" : "border-teal-oscuro/30 bg-superficie hover:bg-teal-fondo"
                      } ${disponible || activo ? "" : "border-teal-oscuro/30 text-texto-2 line-through opacity-60"}`}
                    >
                      {etiquetaDeOpcion(valor)}
                      {!disponible && !activo && <span className="sr-only"> ({textos.vitrina.noDisponibleCorto})</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}</div>}

        {hayStock && tope > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">{t.cantidad}</span>
            <div className="flex h-11 items-center rounded-full border border-teal-oscuro/30 bg-white">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, unidades - 1))}
                disabled={unidades <= 1}
                aria-label={t.cantidadMenos}
                className="flex h-full w-11 items-center justify-center rounded-l-full text-xl font-bold hover:bg-accion/20 disabled:opacity-30"
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
                className="flex h-full w-11 items-center justify-center rounded-r-full text-xl font-bold hover:bg-accion/20 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* En pantalla grande los botones van en la caja, grandes y a la vista; en el móvil los lleva la barra fija de abajo */}
        {pedidos && (
          <div className="hidden flex-col gap-2 md:flex">
            {listo ? (
              <Link href={enlaceA(permiteComprar ? "comprar" : "apartar")} className={`${boton} h-12 w-full bg-(--store-button) text-(--store-on-button) text-base`}>
                {permiteComprar ? t.modoComprar : t.modoApartar}
              </Link>
            ) : (
              <button type="button" onClick={() => pedirElegir()} className={`${boton} h-12 w-full bg-(--store-button) text-(--store-on-button) text-base`}>
                {permiteComprar ? t.modoComprar : t.modoApartar}
              </button>
            )}
            {permiteComprar && (
              <button
                type="button"
                onClick={() => (listo ? agregar() : pedirElegir())}
                className={`${boton} h-12 w-full gap-2 bg-white hover:bg-teal-fondo`}
              >
                <Icon nombre="carrito" className="size-5" />
                {textos.vitrina.carrito.agregar}
              </button>
            )}
            {!listo && (
              <p role="status" className={`text-center text-xs ${tocado ? "font-bold text-error" : "text-texto-2"}`}>
                {pista}
              </p>
            )}
          </div>
        )}

        {/* Catálogo en pantalla grande: el botón va en la caja */}
        {!pedidos && meInteresa && (
          <a href={meInteresa} target="_blank" rel="noreferrer" className={`${boton} hidden h-12 w-full gap-2 bg-(--store-button) text-(--store-on-button) text-base md:inline-flex`}>
            <Icon nombre="chat" className="size-5" />
            {t.meInteresa}
          </a>
        )}

        {/* Apartar ya no es un botón más: es la salida tranquila para quien todavía no se decide */}
        {permiteComprar && permiteApartar && (
          <p className="text-sm text-texto-2">
            {t.dudas}{" "}
            {listo ? (
              <Link href={enlaceA("apartar")} className="font-bold text-(--store-accent) underline">
                {t.apartarEnlace(plazoHoras)}
              </Link>
            ) : (
              <span className="font-bold">{t.apartarEnlace(plazoHoras)}</span>
            )}
          </p>
        )}

        {!pedidos && <p className="text-texto-2">{t.catalogoAviso}</p>}
        {seleccionada && !hayStock ? (
          <>
            <p role="status" className="rounded-2xl bg-accion/20 px-4 py-3 font-medium">
              {textos.vitrina.noDisponible}
            </p>
            {/* Se perdía la venta: ahora se deja el WhatsApp y la tienda avisa cuando vuelva */}
            <AvisameCuandoHaya key={seleccionada.codigo} slug={slug} codigo={seleccionada.codigo} />
          </>
        ) : null}
      </div>

      {/* Siempre a mano abajo: comprar es lo principal, y el carrito acompaña para seguir mirando. Apartar vive en la tarjeta. */}
      {/* Catálogo: la barra solo lleva "Me interesa", que abre el chat con el producto ya escrito */}
      {!pedidos && meInteresa && (
        <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-xl md:hidden">
          <div className="pointer-events-auto flex items-center gap-2 rounded-[28px] border border-teal-oscuro/30 bg-crema p-2">
            <div className="ml-3 mr-auto hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-xs text-texto-2">{contacto.tienda}</span>
              <span className="text-xl font-bold tabular-nums">{formatearDolares(precio)}</span>
            </div>
            <a
              href={meInteresa}
              target="_blank"
              rel="noreferrer"
              className={`${boton} flex-1 gap-2 bg-(--store-button) text-(--store-on-button) sm:flex-none sm:px-8`}
            >
              <Icon nombre="chat" className="size-5" />
              {t.meInteresa}
            </a>
          </div>
        </div>
      )}

      {pedidos && (
        <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-xl md:hidden">
          <div className="pointer-events-auto flex flex-col gap-1 rounded-[28px] border border-teal-oscuro/30 bg-crema p-2">
            {!listo && (
              <p role="status" className={`px-3 pt-1 text-center text-xs ${tocado ? "font-bold text-error" : "text-texto-2"}`}>
                {pista}
              </p>
            )}
            <div className="flex items-center gap-2">
              {/* El precio siempre a la vista; lo que queda solo donde hay lugar */}
              <div className="ml-3 mr-auto flex min-w-0 flex-col leading-tight">
                <span className="hidden truncate text-xs text-texto-2 sm:block">{seleccionada && seleccionada.disponibles <= umbralPocoStock ? textos.productos.quedan(seleccionada.disponibles) : ""}</span>
                {oferta && <span className="text-xs tabular-nums text-texto-2 line-through sm:hidden">{formatearDolares(oferta.antes * (seleccionada ? unidades : 1))}</span>}
                <span className="text-xl font-bold tabular-nums">{!seleccionada && dims > 0 && Math.max(...precios) !== desde ? textos.vitrina.desde(formatearDolares(desde)) : formatearDolares(precio * (seleccionada ? unidades : 1))}</span>
              </div>
              {permiteComprar && (
              <button
                type="button"
                onClick={() => (listo ? agregar() : pedirElegir())}
                aria-label={textos.vitrina.carrito.agregar}
                title={textos.vitrina.carrito.agregar}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-teal-oscuro/30 bg-white px-3 text-sm font-bold transition-[transform,box-shadow] duration-150 enabled:hover:bg-accion/20 disabled:opacity-50 sm:px-4"
              >
                <Icon nombre="carrito" className="size-5" />
                <span className="ml-1.5">{textos.vitrina.carrito.agregarCorto}</span>
              </button>
              )}
              {/* Sin comprar, el botón principal es apartar */}
              {listo ? (
                <Link href={enlaceA(permiteComprar ? "comprar" : "apartar")} className={`${boton} flex-1 bg-(--store-button) text-(--store-on-button) sm:flex-none sm:px-8`}>
                  {permiteComprar ? t.modoComprar : t.modoApartar}
                </Link>
              ) : (
                <button type="button" onClick={() => pedirElegir()} className={`${boton} flex-1 bg-(--store-button) text-(--store-on-button) sm:flex-none sm:px-8`}>
                  {permiteComprar ? t.modoComprar : t.modoApartar}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
