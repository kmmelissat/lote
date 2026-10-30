"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

const t = textos.explorar;

export type ProductoMesa = { foto: string; nombre: string; precio: string; tienda: string };

const CADA_MS = 2600;
// Cada producto con su tamaño, altura y giro, para que se vean regados y no en fila
const DISPERSOS = [
  "w-24 -rotate-6 -translate-y-1 sm:w-24 sm:-translate-y-4",
  "w-20 rotate-3 -translate-y-3 sm:w-[4.5rem] sm:-translate-x-8 sm:-translate-y-6",
  "w-20 -rotate-2 translate-y-2 sm:w-20 sm:-translate-x-40 sm:-translate-y-3 sm:ml-4",
  "w-20 rotate-6 -translate-y-1 sm:w-24 sm:-ml-6",
  "w-24 -rotate-3 translate-y-3 sm:w-24",
] as const;
// Las que andan regadas por el fondo, a los lados del titular y del buscador (solo en pantallas grandes):
// posición en % de la sección, ancho en px y giro
const ESPARCIDOS = [
  { izq: 2, arr: 20, ancho: 84, giro: -8 },
  { izq: 11, arr: 38, ancho: 72, giro: 7 },
  { izq: 84, arr: 38, ancho: 72, giro: 9 },
  { izq: 87, arr: 68, ancho: 76, giro: -7 },
  { izq: 72, arr: 71, ancho: 60, giro: 6 },
] as const;
const COLGAR = ["-3deg", "2deg", "-1deg", "3deg", "-2deg"] as const;
const RAYAS = 12;

/** El toldo de feria: rayas verde y crema, con el borde de abajo en ondas. Se estira al ancho de la sección. */
function Toldo() {
  const ancho = 100;
  return (
    <svg viewBox={`0 0 ${RAYAS * ancho} 64`} preserveAspectRatio="none" aria-hidden="true" className="relative z-10 -mb-px block h-9 w-full md:h-11">
      {Array.from({ length: RAYAS }, (_, i) => (
        <path
          key={i}
          d={`M${i * ancho} 0H${(i + 1) * ancho}V34A${ancho / 2} 28 0 0 1 ${i * ancho} 34Z`}
          fill={i % 2 ? "var(--color-crema)" : "var(--color-teal)"}
          stroke="var(--color-teal-oscuro)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

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

/** El cartoncito de precio, colgado de un hilo, que se balancea solito. */
function Cartoncito({ precio, giro }: { precio: string; giro: string }) {
  // Chiquito y en la esquina de arriba, medio afuera de la ilustración, para no taparla
  return (
    <div
      className="absolute -right-3 -top-1 z-10 flex origin-top flex-col items-center motion-safe:animate-balancea"
      style={{ "--giro": giro } as CSSProperties}
    >
      <span className="h-2.5 w-px bg-teal-oscuro" />
      <span className="relative rounded-[4px] border-[1.5px] border-teal-oscuro bg-perla px-1.5 pb-0.5 pt-1.5 text-[10px] font-extrabold leading-none text-teal-oscuro shadow-[1px_1px_0_0_var(--color-teal-oscuro)]">
        <span className="absolute left-1/2 top-[3px] size-1 -translate-x-1/2 rounded-full border border-teal-oscuro bg-crema" />
        {precio}
      </span>
    </div>
  );
}

/**
 * El encabezado del Marketplace como un puesto de mercado: toldo, productos en la mesa con su precio colgando,
 * y Lotito asomado detrás del buscador. `ocultos` lleva los filtros que el buscador tiene que conservar.
 */
export function HeroMercadito({
  productos,
  aire = [],
  tiendas,
  totalProductos,
  ejemplos,
  busqueda = "",
  titulo,
  ocultos,
  extra,
}: {
  productos: ProductoMesa[];
  /** Las que andan regadas por el fondo (solo en pantallas grandes) */
  aire?: ProductoMesa[];
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
  const [enfocado, setEnfocado] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = setInterval(() => setI((n) => (n + 1) % frases.length), CADA_MS);
    return () => clearInterval(reloj);
  }, [frases.length]);

  return (
    <section className="relative overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-celeste-palido shadow-[6px_6px_0_0_var(--color-rosa)]">
      <Toldo />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] hidden lg:block">
        {ESPARCIDOS.map((e, k) => {
          const p = aire[k];
          if (!p) return null;
          return (
            <div
              key={k}
              className="absolute"
              style={{ left: `${e.izq}%`, top: `${e.arr}%`, width: e.ancho, transform: `rotate(${e.giro}deg)` }}
            >
              <div className="relative aspect-square drop-shadow-[0_4px_0_rgba(0,56,68,0.3)]">
                <Image src={p.foto} alt="" fill sizes="100px" className="object-contain" />
              </div>
              <Cartoncito precio={p.precio} giro={COLGAR[k % COLGAR.length]} />
            </div>
          );
        })}
      </div>

      {/* El fondo del puesto, todo al centro: titular, y el buscador con Lotito asomado por encima */}
      <div className="relative flex flex-col items-center gap-2 px-5 pb-[2.5rem] pt-3 text-center text-teal-oscuro md:px-8 md:pt-5">
        <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-[30px]">
          {titulo ?? t.encabezadoInicio}{" "}
          <span className="whitespace-nowrap bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)] pb-1 [box-decoration-break:clone]">
            {t.encabezadoDestacado}
          </span>
        </h1>
        <p className="text-sm font-bold text-teal">
          <Contador hasta={totalProductos} /> {t.mercadito.productos(totalProductos)} · <Contador hasta={tiendas} /> {t.mercadito.tiendas(tiendas)}
        </p>

        <div className="relative mt-[4.3rem] w-full max-w-3xl">
          {/* Lotito se asoma por detrás del buscador, con su globo */}
          <div className="absolute -top-[4.6rem] right-6 z-0 flex items-end gap-1 md:right-12">
            <p
              aria-live="polite"
              className="relative mb-6 rounded-2xl border-2 border-teal-oscuro bg-white px-3 py-1.5 text-left text-sm font-bold leading-tight text-teal-oscuro after:absolute after:-right-[7px] after:top-1/2 after:size-3 after:-translate-y-1/2 after:rotate-45 after:border-r-2 after:border-t-2 after:border-teal-oscuro after:bg-white"
            >
              {enfocado ? t.mercadito.dale : t.mercadito.pregunta}
            </p>
            {/* Lotito con una lupa en la mano: al enfocar el buscador la levanta, como si mirara de cerca */}
            <div className="relative">
              <Monito nombre="asoma" className={`w-24 text-teal transition-transform duration-300 md:w-28 ${enfocado ? "translate-y-0" : "translate-y-2"}`} />
              <svg
                viewBox="0 0 100 130"
                aria-hidden="true"
                className={`absolute -right-5 bottom-0 w-[46%] origin-bottom-left transition-transform duration-300 ${enfocado ? "-translate-y-1 rotate-12" : "translate-y-1"}`}
              >
                <line x1="38" y1="66" x2="14" y2="124" stroke="var(--color-teal-oscuro)" strokeWidth="13" strokeLinecap="round" />
                <line x1="38" y1="66" x2="14" y2="124" stroke="var(--color-mango)" strokeWidth="6" strokeLinecap="round" />
                <circle cx="58" cy="38" r="31" fill="var(--color-celeste-palido)" stroke="var(--color-teal-oscuro)" strokeWidth="7" />
                <circle cx="58" cy="38" r="31" fill="white" fillOpacity="0.35" />
                <path d="M41 30A19 19 0 0 1 56 19" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <form
            action="/marketplace"
            role="search"
            className="relative z-10 flex h-14 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white py-1 pl-4 pr-1 text-left text-teal-oscuro shadow-dura focus-within:ring-4 focus-within:ring-rosa/60"
          >
            {ocultos}
            <Icon nombre="buscar" className="size-5 shrink-0 text-texto-2" />
            <input
              type="search"
              name="q"
              defaultValue={busqueda}
              aria-label={t.buscar}
              placeholder={t.mercadito.probaCon(frases[i])}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2/70 md:text-lg"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center rounded-full border-2 border-teal-oscuro bg-mango px-6 text-sm font-bold transition-transform duration-150 hover:-translate-y-0.5"
            >
              {t.buscarBoton}
            </button>
          </form>
        </div>
        {extra}

        {/* Sello de feria, girando despacito */}
        <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute right-10 top-5 hidden size-20 lg:block">
          <g className="motion-safe:animate-girar-lento" style={{ transformOrigin: "60px 60px" }}>
            <circle cx="60" cy="60" r="58" fill="var(--color-rosa)" stroke="var(--color-teal-oscuro)" strokeWidth="2" />
            <path id="sello" d="M60 60m-40 0a40 40 0 1 1 80 0a40 40 0 1 1 -80 0" fill="none" />
            <text fontSize="11.5" fontWeight="800" fill="var(--color-teal-oscuro)" letterSpacing="1.5">
              <textPath href="#sello">{t.mercadito.sello}</textPath>
            </text>
          </g>
          <text x="60" y="72" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--color-teal-oscuro)">SV</text>
        </svg>
      </div>

      {/* La mesa: los productos se apoyan en su borde, centrados, cada uno con su precio colgando */}
      <div className="relative border-t-2 border-teal-oscuro bg-limon px-5 pb-2 md:px-8">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-mango" />
        {productos.length > 0 && (
          <ul className="-mt-[2.5rem] flex flex-wrap items-end justify-center gap-x-6 gap-y-6 sm:flex-nowrap sm:justify-between sm:gap-x-0 lg:pl-6 lg:pr-72">
            {productos.slice(0, 5).map((p, k) => (
              <li
                key={p.foto}
                className={`relative shrink-0 pt-3 transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:rotate-0 ${DISPERSOS[k]}`}
              >
                <div className="relative aspect-square drop-shadow-[0_4px_0_rgba(0,56,68,0.35)]">
                  <Image src={p.foto} alt={p.nombre} fill sizes="160px" className="object-contain" />
                </div>
                <Cartoncito precio={p.precio} giro={COLGAR[k]} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
