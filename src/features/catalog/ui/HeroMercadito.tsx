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

/** La banda del Marketplace: el titular, cuántas tiendas y productos hay, y tres motivos para comprar acá. */
export function HeroMercadito({
  tiendas,
  totalProductos,
  titulo,
  extra,
  compacto = false,
}: {
  tiendas: number;
  totalProductos: number;
  /** El comienzo del titular en un rubro ("Comida y postres de"); si no, "Comprale directo a" */
  titulo?: string;
  /** Algo más debajo (por ejemplo, rubros sugeridos) */
  extra?: ReactNode;
  /** Más bajito, para las vistas de categoría y búsqueda */
  compacto?: boolean;
}) {
  return (
    <>
      <section
        className={`relative overflow-hidden rounded-3xl max-md:rounded-[20px] border border-teal-oscuro bg-teal-oscuro text-white ${compacto ? "p-4 md:px-8 md:py-5" : "p-4 md:p-8"}`}
      >
        {/* Una sola bolita rosa, arriba a la izquierda del título: entera dentro de la banda y sin tocar chips ni texto */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-4 size-3 rounded-full bg-rosa motion-safe:animate-flotar max-md:hidden"
        />
        <div
          className={`relative flex flex-col md:flex-row md:items-center md:justify-between md:gap-8 ${compacto ? "gap-3" : "gap-3 md:gap-5"}`}
        >
          <div className="flex flex-col gap-1.5 md:pl-6">
            <h1
              className={`font-bold leading-tight tracking-tight max-md:text-[18px] max-md:font-extrabold ${compacto ? "text-xl md:text-[26px]" : "text-[22px] md:text-[32px]"}`}
            >
              {titulo ?? t.encabezadoInicio}{" "}
              <span className="text-limon">{t.encabezadoDestacado}</span>
            </h1>
            <p className="truncate text-sm font-bold text-celeste max-md:text-[13px]">
              <Contador hasta={tiendas} /> {t.mercadito.tiendas(tiendas)} ·{" "}
              <Contador hasta={totalProductos} />{" "}
              {t.mercadito.productos(totalProductos)}
            </p>
          </div>
          <ul className="-mx-5 flex gap-2 max-md:hidden overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:justify-end md:overflow-visible md:px-0 md:pr-12">
            {t.mercadito.chips.map((chip) => (
              <li
                key={chip}
                className="shrink-0 whitespace-nowrap rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
        {extra && <div className="relative">{extra}</div>}
      </section>
      {/* Celular: los motivos para comprar, en una línea de texto que se desliza, sin cajas */}
      <ul
        aria-label={t.mercadito.motivos}
        className="-mx-4 -mt-3 flex gap-1 overflow-x-auto whitespace-nowrap px-4 text-xs font-medium text-texto-2 [scrollbar-width:none] md:hidden"
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
