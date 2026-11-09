"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agruparEnTarjetas, nombreCompleto, porcentajeDeRebaja, type Linea, type PromocionMostrador } from "../mostrador";
import type { ProductoMostrador } from "../repositorio";

const t = textos.mostrador;

const chip = "inline-flex h-6 items-center rounded-lg px-2 text-xs font-medium";
/** El color de fondo de la foto cuando el producto no tiene: uno por nombre, estable entre ventas. */
const FONDOS = ["bg-ficha-rosa", "bg-ficha-celeste", "bg-ficha-amarillo", "bg-ficha-lila", "bg-ficha-verde"];
const fondoDe = (nombre: string) => FONDOS[[...nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % FONDOS.length];

export function ProductosDelMostrador({
  todos,
  visibles,
  lineas,
  umbral,
  agregar,
}: {
  todos: ProductoMostrador[];
  visibles: ProductoMostrador[];
  lineas: Linea[];
  /** Con cuántas unidades se avisa que quedan pocas */
  umbral: number;
  agregar: (p: ProductoMostrador) => void;
}) {
  const tarjetas = useMemo(() => agruparEnTarjetas(visibles), [visibles]);
  const [claveAbierta, setClaveAbierta] = useState<string | null>(null);
  const abierta = tarjetas.find((g) => g.clave === claveAbierta && g.miembros.length > 1);
  // Si la búsqueda deja afuera el producto abierto, se vuelve a la grilla y no se reabre al borrar la búsqueda
  if (claveAbierta && !abierta) setClaveAbierta(null);
  const enVenta = (id: string) => lineas.find((l) => l.productoId === id)?.cantidad ?? 0;

  const cabecera = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (claveAbierta) cabecera.current?.scrollIntoView({ block: "nearest" });
  }, [claveAbierta]);

  if (!todos.length) return <p className="text-texto-2">{t.sinProductos}</p>;
  if (!tarjetas.length) return <p className="text-texto-2">{t.sinResultados}</p>;

  if (abierta)
    return (
      <div className="flex flex-col gap-3">
        <div ref={cabecera} className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setClaveAbierta(null)}
            className="flex min-h-11 w-fit items-center gap-1.5 rounded-[14px] pr-3 text-sm font-medium text-teal"
          >
            <Icon nombre="atras" className="size-5" />
            {t.volverAProductos}
          </button>
          <h2 className="text-lg font-semibold">{abierta.nombre}</h2>
        </div>
        <Grilla>
          {abierta.miembros.map((m) => (
            <Tarjeta
              key={m.id}
              nombre={m.variante ?? nombreCompleto(m)}
              etiqueta={nombreCompleto(m)}
              foto={m.fotoPropia ?? m.foto}
              precio={formatearDolares(m.precio)}
              precioAnterior={m.precioAnterior}
              descuento={porcentajeDeRebaja(m)}
              promocion={m.promocion}
              disponibles={m.disponibles}
              umbral={umbral}
              cantidad={enVenta(m.id)}
              tocar={() => agregar(m)}
            />
          ))}
        </Grilla>
      </div>
    );

  return (
    <Grilla>
      {tarjetas.map((g) => {
        const varias = g.miembros.length > 1;
        return (
          <Tarjeta
            key={g.clave}
            nombre={g.nombre}
            foto={g.foto}
            precio={
              g.precioMin === g.precioMax
                ? formatearDolares(g.precioMin)
                : t.desde(formatearDolares(g.precioMin))
            }
            precioAnterior={g.precioAnterior}
            descuento={g.descuento}
            promocion={g.promocion}
            disponibles={g.disponibles}
            umbral={umbral}
            cantidad={g.miembros.reduce((s, m) => s + enVenta(m.id), 0)}
            opciones={varias ? g.miembros.length : undefined}
            tocar={() => (varias ? setClaveAbierta(g.clave) : agregar(g.miembros[0]))}
          />
        );
      })}
    </Grilla>
  );
}

function Grilla({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 2xl:grid-cols-4">{children}</ul>;
}

function Tarjeta({
  nombre,
  etiqueta,
  foto,
  precio,
  precioAnterior,
  descuento,
  promocion,
  disponibles,
  umbral,
  cantidad,
  opciones,
  tocar,
}: {
  nombre: string;
  /** Para lectores de pantalla, si el nombre visible no alcanza */
  etiqueta?: string;
  foto: string | undefined;
  precio: string;
  precioAnterior: number | null;
  /** Porcentaje de rebaja de la oferta; 0 si no está en oferta */
  descuento: number;
  promocion: PromocionMostrador | null;
  disponibles: number;
  umbral: number;
  /** Unidades que ya están en la venta */
  cantidad: number;
  /** Cuántas variantes tiene, si al tocarla se entra a elegir */
  opciones?: number;
  tocar: () => void;
}) {
  const pocas = disponibles <= umbral;
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={tocar}
        aria-label={etiqueta}
        className="relative flex h-full w-full flex-col gap-2.5 rounded-3xl border border-linea bg-superficie p-2.5 text-left shadow-xs transition-shadow hover:shadow-md active:shadow-xs"
      >
        <div className={`relative aspect-[5/4] w-full overflow-hidden rounded-2xl ${fondoDe(nombre)}`}>
          {foto ? (
            <Image
              src={urlFoto(foto)}
              alt=""
              fill
              sizes="(min-width: 1280px) 15vw, (min-width: 640px) 25vw, 45vw"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-teal-oscuro/50">
              <Icon nombre="productos" className="size-8" />
            </div>
          )}
          {(descuento > 0 || promocion) && (
            <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {descuento > 0 && <span className={`${chip} bg-chip-amarillo text-chip-texto-amarillo`}>{t.oferta(descuento)}</span>}
              {promocion && <span className={`${chip} bg-chip-lila text-chip-texto-lila`}>{promocion.etiqueta}</span>}
            </span>
          )}
          {cantidad > 0 && (
            <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-lg bg-teal-oscuro px-1.5 text-xs font-semibold tabular-nums text-white">
              {cantidad}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col items-start gap-0.5 px-1">
          <p className="line-clamp-2 text-sm font-semibold">{nombre}</p>
          {promocion?.detalle && <p className="line-clamp-2 text-xs font-medium text-teal">{promocion.detalle}</p>}
          <p className="text-xs text-texto-2">
            {opciones !== undefined ? `${t.opciones(opciones)} · ` : ""}
            {pocas ? <span className="font-medium text-chip-texto-rojo">{t.quedan(disponibles)}</span> : t.quedan(disponibles)}
          </p>
        </div>
        <div className="flex items-center justify-between px-1 pb-0.5">
          <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
            <span className="text-base font-bold">{precio}</span>
            {descuento > 0 && precioAnterior !== null && (
              <span className="text-xs text-texto-2 line-through">
                <span className="sr-only">{t.antes} </span>
                {formatearDolares(precioAnterior)}
              </span>
            )}
          </p>
          <span aria-hidden className="grid size-8 place-items-center rounded-[10px] border border-linea bg-superficie">
            <Icon nombre={opciones !== undefined ? "adelante" : "mas"} className="size-4" />
          </span>
        </div>
      </button>
    </li>
  );
}
