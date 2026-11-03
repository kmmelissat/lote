import type { Route } from "next";
import Link from "next/link";

export type DatoCompacto = {
  etiqueta: string;
  valor: string | number;
  /** El color del estado que cuenta, como puntito junto a la etiqueta */
  banda: string;
  /** Sin enlace ni acción, la celda solo se lee */
  href?: Route;
  /** Para listas que filtran sin recargar: se hace esto en vez de navegar */
  alTocar?: () => void;
};

/**
 * Las cifras de una pantalla en una sola tarjeta de 2 columnas, para el celular: cuatro tarjetas sueltas con borde y
 * sombra empujaban la lista fuera de la pantalla. En pantallas anchas se usan las tarjetas de siempre (`md:hidden`).
 */
export function ResumenCompacto({ titulo, datos }: { titulo: string; datos: DatoCompacto[] }) {
  return (
    <section aria-label={titulo} className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-borde md:hidden">
      {datos.map((d, i) => {
        // Con un número impar, la última celda ocupa todo el ancho
        const clase = `flex min-h-16 flex-col items-start justify-center gap-0.5 bg-superficie px-4 py-2 text-left active:bg-teal-fondo/50 ${
          datos.length % 2 === 1 && i === datos.length - 1 ? "col-span-2" : ""
        }`;
        const contenido = (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-texto-2">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${d.banda}`} />
              {d.etiqueta}
            </span>
            <span className="font-logo text-xl font-bold tabular-nums">{d.valor}</span>
          </>
        );
        if (d.alTocar) {
          return (
            <button key={d.etiqueta} type="button" onClick={d.alTocar} className={clase}>
              {contenido}
            </button>
          );
        }
        return d.href ? (
          <Link key={d.etiqueta} href={d.href} className={clase}>
            {contenido}
          </Link>
        ) : (
          <div key={d.etiqueta} className={clase}>
            {contenido}
          </div>
        );
      })}
    </section>
  );
}
