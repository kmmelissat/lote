import Link from "next/link";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";
import { colorDeMarca } from "../marca";
import { LotitoCamina } from "./LotitoCamina";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar.calle;

// Las paredes de colores de un pueblito (Suchitoto, Ataco): se van turnando de casa en casa
const PAREDES = ["#ffe27a", "#fdeaf1", "#e2f4fc", "#ffebc6", "#ddefee", "#fff7e8"] as const;
const TEJA = "#c8553d";
const TRAZO = "#003844";
const VIDRIO = "#e2f4fc";

/** Una casita: la fachada cambia de forma (tejas, cornisa, dos pisos, arco colonial) y lleva el color de su tienda. */
function Casita({ pared, color, forma }: { pared: string; color: string; forma: number }) {
  const linea = { stroke: TRAZO, strokeWidth: 3, strokeLinejoin: "round" as const };
  const techo = forma === 0 || forma === 3 ? TEJA : color;
  return (
    <svg viewBox="0 0 200 240" className="absolute inset-0 size-full" aria-hidden="true">
      {forma === 0 && (
        <>
          <rect x="12" y="72" width="176" height="168" fill={pared} {...linea} />
          <polygon points="2,76 100,14 198,76" fill={techo} {...linea} />
        </>
      )}
      {forma === 1 && (
        <>
          <rect x="70" y="38" width="60" height="20" rx="3" fill={pared} {...linea} />
          <rect x="12" y="60" width="176" height="180" fill={pared} {...linea} />
          <rect x="4" y="52" width="192" height="14" rx="3" fill={techo} {...linea} />
        </>
      )}
      {forma === 2 && (
        <>
          <rect x="20" y="26" width="160" height="214" fill={pared} {...linea} />
          <rect x="12" y="16" width="176" height="14" rx="3" fill={techo} {...linea} />
          <rect x="44" y="116" width="112" height="7" fill={techo} {...linea} />
          {[56, 78, 100, 122, 144].map((x) => (
            <line key={x} x1={x} y1="123" x2={x} y2="138" {...linea} />
          ))}
          <line x1="44" y1="138" x2="156" y2="138" {...linea} />
        </>
      )}
      {forma === 3 && (
        <>
          <path d="M40 74 A60 60 0 0 1 160 74 Z" fill={pared} {...linea} />
          <rect x="12" y="72" width="176" height="168" fill={pared} {...linea} />
          <rect x="4" y="68" width="192" height="10" rx="3" fill={techo} {...linea} />
        </>
      )}
      {/* Ventanas a los lados y la puerta con su toldo, en el color de la tienda */}
      <rect x="26" y="192" width="36" height="28" rx="5" fill={VIDRIO} {...linea} />
      <rect x="138" y="192" width="36" height="28" rx="5" fill={VIDRIO} {...linea} />
      <path d="M80 240 V200 a20 20 0 0 1 40 0 V240 Z" fill={color} {...linea} />
      <path d="M62 178 h76 l-8 14 h-60 Z" fill={color} {...linea} />
      <path d="M77 178 l-3 14 M92 178 l-1 14 M108 178 l1 14 M123 178 l3 14" stroke="#ffffff" strokeWidth="4" />
      {/* Una maceta con una plantita junto a la puerta */}
      <path d="M30 240 l4 -14 h16 l4 14 Z" fill={TEJA} {...linea} />
      <path d="M42 226 c-6 -10 -2 -16 0 -20 c2 4 6 10 0 20" fill="#3c8d5a" stroke={TRAZO} strokeWidth="2" />
    </svg>
  );
}

/**
 * El Marketplace como una calle de El Salvador: cada tienda es una casita con su letrero y su logo en la ventana,
 * y al tocarla se entra a su vitrina. Lotito camina por la acera (quieto si se pidió menos movimiento).
 */
export function CalleTiendas({ tiendas }: { tiendas: TiendaExplorar[] }) {
  return (
    <div className="overflow-x-auto rounded-[28px] border-2 border-teal-oscuro shadow-dura [scrollbar-width:thin]">
      <div className="relative w-max min-w-full bg-[linear-gradient(var(--color-celeste-palido),var(--color-crema)_70%)]">
        {/* El fondo: sol, volcán y banderines de fiesta patronal */}
        <span aria-hidden="true" className="absolute left-[46rem] top-12 size-16 rounded-full border-2 border-teal-oscuro bg-limon" />
        <svg aria-hidden="true" viewBox="0 0 700 220" className="absolute bottom-24 left-[18rem] w-[62rem]">
          <path d="M0 220 L290 52 Q330 34 370 52 L700 220 Z" fill="#ddefee" stroke={TRAZO} strokeWidth="3" strokeLinejoin="round" />
          <path d="M290 52 Q330 34 370 52 L352 70 Q330 62 308 70 Z" fill="#ffffff" />
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-8 items-start overflow-hidden border-t-2 border-teal-oscuro">
          {Array.from({ length: 80 }, (_, i) => (
            <span
              key={i}
              className="h-6 w-7 shrink-0 [clip-path:polygon(0_0,100%_0,50%_100%)]"
              style={{ backgroundColor: ["var(--color-rosa)", "var(--color-limon)", "var(--color-celeste)", "var(--color-mango)"][i % 4] }}
            />
          ))}
        </div>

        {/* Las casitas, una por tienda */}
        <ul className="relative z-10 flex items-end gap-5 px-10 pt-28">
          {tiendas.map((tienda, i) => {
            const color = colorDeMarca(tienda.color).hex;
            return (
              <li key={tienda.slug} className="shrink-0">
                <Link
                  href={`/c/${tienda.slug}`}
                  aria-label={t.entrar(tienda.nombre)}
                  className="group relative block aspect-[200/240] w-44 transition-transform duration-200 ease-out hover:-translate-y-2 focus-visible:-translate-y-2"
                >
                  <Casita pared={PAREDES[i % PAREDES.length]} color={color} forma={i % 4} />
                  {/* El letrero con el nombre y el logo en la ventana de arriba */}
                  <span className="absolute left-1/2 top-[37%] w-[84%] -translate-x-1/2 -rotate-1 truncate rounded-md border-2 border-teal-oscuro bg-white px-2 py-0.5 text-center text-[11px] font-extrabold uppercase tracking-wide text-teal-oscuro shadow-dura-chica">
                    {tienda.nombre}
                  </span>
                  <span className="absolute left-1/2 top-[50%] -translate-x-1/2 rounded-full border-2 border-teal-oscuro bg-white p-0.5">
                    <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-11 !rounded-full !text-base" />
                  </span>
                  <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-teal-oscuro bg-mango px-3 py-1 text-xs font-bold opacity-0 shadow-dura-chica transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {t.pasar}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Acera y calle; Lotito camina por la acera, delante de las casas */}
        <div aria-hidden="true" className="relative h-8 border-t-2 border-teal-oscuro bg-perla" />
        <div aria-hidden="true" className="relative h-16 border-t-2 border-teal-oscuro bg-teal-oscuro">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--color-limon)_0_32px,transparent_32px_64px)]" />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[4.4rem] left-0 z-20 [--ancho-lotito:5.5rem] motion-safe:animate-pasear"
        >
          <LotitoCamina className="w-[5.5rem]" />
        </span>
      </div>
    </div>
  );
}

/** La calle con su título y, si se pasa `verTodas`, el enlace a la lista de tiendas. */
export function SeccionCalle({ tiendas, verTodas }: { tiendas: TiendaExplorar[]; verTodas?: { href: string; rel?: string } }) {
  return (
    <section aria-labelledby="calle-de-lote" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="calle-de-lote" className="text-xl font-bold md:text-2xl">
            {t.tituloInicio}{" "}
            <span className="whitespace-nowrap bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)] pb-1">
              {t.tituloDestacado}
            </span>
          </h2>
          <p className="mt-1 text-sm text-texto-2">{t.ayuda(tiendas.length)}</p>
        </div>
        {verTodas && (
          <Link {...verTodas} className="text-sm font-bold text-teal underline underline-offset-4">
            {textos.explorar.verTodasTiendas}
          </Link>
        )}
      </div>
      <CalleTiendas tiendas={tiendas} />
      {tiendas.length > 6 && <p className="-mt-1 text-right text-sm font-bold text-texto-2">{t.deslizar}</p>}
    </section>
  );
}
