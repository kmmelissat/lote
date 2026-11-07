"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CintaFrases } from "@/components/ui/CintaFrases";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.explorar;

const CADA_MS = 2600;

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
 * El encabezado del Marketplace como un puesto de mercado: toldo, mesa y Lotito asomado detrás del buscador. `ocultos` lleva los filtros que el buscador tiene que conservar.
 */
export function HeroMercadito({
  tiendas,
  totalProductos,
  ejemplos,
  busqueda = "",
  titulo,
  ocultos,
  extra,
}: {
  tiendas: number;
  totalProductos: number;
  ejemplos: string[];
  busqueda?: string;
  /** El comienzo del titular en un rubro ("Comida y postres de"); si no, "Comprale directo a" */
  titulo?: string;
  ocultos?: ReactNode;
  /** Algo más debajo del buscador (por ejemplo, rubros sugeridos) */
  extra?: ReactNode;
}) {
  const frases = [...ejemplos.map((e) => `“${e}”`), ...t.mercadito.frases];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = setInterval(() => setI((n) => (n + 1) % frases.length), CADA_MS);
    return () => clearInterval(reloj);
  }, [frases.length]);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-teal-oscuro bg-teal-oscuro text-white shadow-dura">
      {/* Formas que flotan, pocas y lejos del texto */}
      <span aria-hidden="true" className="pointer-events-none absolute left-[6%] top-[18%] hidden size-16 rounded-full border border-teal-oscuro bg-rosa motion-safe:animate-flotar md:block" />
      <span aria-hidden="true" className="pointer-events-none absolute right-[8%] top-[20%] hidden size-11 rounded-full border border-teal-oscuro bg-limon [animation-delay:-2s] motion-safe:animate-flotar md:block" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[26%] right-[20%] hidden size-7 rounded-full border border-teal-oscuro bg-celeste [animation-delay:-4s] motion-safe:animate-flotar md:block" />
      <div className="relative flex flex-col items-center gap-2 px-4 py-7 text-center md:px-8 md:py-9">
        <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-[32px]">
          {titulo ?? t.encabezadoInicio}{" "}
          <span className="whitespace-nowrap text-limon">{t.encabezadoDestacado}</span>
        </h1>
        <p className="text-sm font-bold text-celeste">
          <Contador hasta={totalProductos} /> {t.mercadito.productos(totalProductos)} · <Contador hasta={tiendas} /> {t.mercadito.tiendas(tiendas)}
        </p>

        <form
          action="/marketplace"
          role="search"
          className="mt-3 flex h-14 w-full max-w-3xl items-center gap-2 overflow-hidden rounded-full border border-teal-oscuro bg-white py-1 pl-4 pr-1 text-left text-teal-oscuro shadow-dura focus-within:ring-4 focus-within:ring-accion/60"
        >
          {ocultos}
          <Icon nombre="buscar" className="size-5 shrink-0 text-texto-2" />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            aria-label={t.buscar}
            placeholder={t.mercadito.probaCon(frases[i])}
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2/70 md:text-lg"
          />
          <button type="submit" className="inline-flex h-11 shrink-0 items-center rounded-full border border-teal-oscuro bg-accion px-6 text-sm font-extrabold text-accion-texto transition-transform duration-150 hover:-translate-y-0.5">
            {t.buscarBoton}
          </button>
        </form>
        {extra}
      </div>
      {/* Frases y confianza, en una cinta que corre despacio */}
      <CintaFrases frases={t.mercadito.beneficios} className="relative border-t border-teal-oscuro bg-black/20 py-2" />
    </section>
  );
}
