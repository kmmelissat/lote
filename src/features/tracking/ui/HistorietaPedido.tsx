import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";
import { paradaActual, pasosDeSeguimiento } from "../pasos";
import type { Seguimiento } from "../repositorio";

const t = textos.seguimiento;


/**
 * El pedido como historieta: una viñeta por parada con Lotito haciendo lo de ese paso (recibe, empaca, espera a la paquetera, va en camino, entrega). Las que ya pasaron llevan check, la actual
 * se agranda, se inclina y lleva un sello, y las que faltan son su silueta con un "?". Al entregar, la última viñeta
 * celebra con confeti. Con paquetera hay una más (por recoger); con retiro en tienda las dos últimas viñetas cambian de nombre.
 */
export function HistorietaPedido({ estado, modo, listo }: { estado: EstadoPedido; modo: Seguimiento["modo"]; listo: boolean }) {
  const pasos = pasosDeSeguimiento(modo);
  const actual = paradaActual(estado, modo, listo);
  const llego = estado === "entregado";

  return (
    <ol aria-label={t.paradas} className={`grid grid-cols-2 gap-3 ${pasos.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
      {pasos.map((paso, i) => {
        const hecho = i < actual || llego;
        const enCurso = i === actual && !llego;
        const ultima = llego && i === pasos.length - 1;
        const destacada = enCurso || ultima;
        // Con cinco viñetas, en el celular la última ocupa todo el ancho para que no quede una sola, a medias
        const suelta = pasos.length % 2 === 1 && i === pasos.length - 1;
        return (
          <li
            key={paso}
            aria-current={enCurso ? "step" : undefined}
            className={`relative flex items-end justify-center overflow-hidden rounded-2xl ${suelta ? "col-span-2 aspect-[2/1] sm:col-span-1 sm:aspect-square" : "aspect-[4/3] sm:aspect-square"} border ${
              destacada ? "border-teal bg-teal-fondo ring-2 ring-teal" : hecho ? "border-teal-oscuro/20 bg-teal-fondo" : "border-teal-oscuro/15 bg-perla/60"
            }`}
          >
            {/* Lotito haciendo lo de ese paso (`pnpm imagenes-pasos`); si falta, solo su silueta */}
            <span className={`relative mb-1 h-[84%] w-[84%] `}>
              <Image
                src={`/seguimiento/paso-${paso}.webp`}
                alt=""
                fill
                sizes="(min-width: 640px) 160px, 45vw"
                className={`object-contain object-bottom ${hecho || destacada ? "" : "brightness-0 opacity-15"}`}
              />
            </span>

            {/* El pie de la viñeta, como en un cómic */}
            <span
              className={`absolute left-0 top-0 rounded-br-xl px-2 py-0.5 text-xs font-bold sm:text-sm ${
                hecho || destacada ? "bg-teal text-white" : "bg-borde text-texto-2"
              }`}
            >
              {i + 1} · {t.cortos[paso]}
              {enCurso && <span className="sr-only"> ({t.ahora})</span>}
            </span>

            {!hecho && !destacada && (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-texto-2/30">
                ?
              </span>
            )}
            {hecho && !ultima && (
              <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-teal text-white">
                <Icon nombre="check" className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
