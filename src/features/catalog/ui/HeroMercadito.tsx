"use client";

import { useEffect, useState, type ReactNode } from "react";
import { textos } from "@/lib/textos";

const t = textos.explorar;

/** Cuenta de 0 al número al cargar. Con movimiento reducido, muestra el número de una vez. */
function Contador({ hasta }: { hasta: number }) {
  const [n, setN] = useState(hasta);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inicio = performance.now();
    let id = 0;
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / 1100);
      setN(Math.round(hasta * (1 - (1 - avance) ** 3)));
      if (avance < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [hasta]);
  return <span className="tabular-nums">{n}</span>;
}

/**
 * El comienzo de la portada: el titular en una línea (28px) con las cifras a la derecha, y debajo el mosaico de promos si lo hay.
 * Los números salen de los mismos datos que la grilla.
 */
export function HeroMercadito({
  tiendas,
  totalProductos,
  titulo,
  extra,
  mosaico,
}: {
  tiendas: number;
  totalProductos: number;
  /** El comienzo del titular en un rubro ("Comida y postres de"); si no, "Comprale directo a" */
  titulo?: string;
  /** Algo más debajo (por ejemplo, rubros sugeridos) */
  extra?: ReactNode;
  /** El mosaico de promos (solo en la portada) */
  mosaico?: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-texto md:text-[28px] md:whitespace-nowrap">
          {titulo ?? t.encabezadoInicio} <span className="text-accion">{t.encabezadoDestacado}</span>
        </h1>
        <p className="whitespace-nowrap text-sm font-semibold text-texto-2">
          <Contador hasta={tiendas} /> {t.mercadito.tiendas(tiendas)} · <Contador hasta={totalProductos} /> {t.mercadito.productos(totalProductos)}
        </p>
      </div>
      {mosaico}
      {extra && <div>{extra}</div>}
      {/* Celular: los motivos para comprar, en una línea de texto que se desliza, sin cajas */}
      <ul
        aria-label={t.mercadito.motivos}
        className="-mx-4 flex gap-1 overflow-x-auto whitespace-nowrap px-4 text-xs font-medium text-texto-2 [scrollbar-width:none] md:hidden"
      >
        {t.mercadito.chips.map((chip, i) => (
          <li key={chip} className="shrink-0">
            {i > 0 && (
              <span aria-hidden="true" className="pr-1">
                ·
              </span>
            )}
            {chip}
          </li>
        ))}
      </ul>
    </>
  );
}
