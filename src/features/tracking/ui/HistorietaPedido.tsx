import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";
import { paradaActual, pasosDeSeguimiento } from "../pasos";
import type { Seguimiento } from "../repositorio";

const t = textos.seguimiento;

const PUNTITOS = "[background-image:radial-gradient(circle,rgb(255_255_255/0.65)_2px,transparent_2.5px)] [background-size:10px_10px]";
const ESTRELLA = "[clip-path:polygon(50%_0,61%_12%,78%_6%,80%_24%,96%_30%,88%_46%,100%_60%,84%_68%,88%_86%,70%_84%,60%_100%,48%_88%,32%_98%,28%_80%,10%_80%,16%_62%,0_50%,14%_38%,6%_20%,24%_18%,32%_2%)]";

const CONFETI = [
  { izq: "14%", c: "bg-rosa", retraso: "0s" },
  { izq: "34%", c: "bg-limon", retraso: "0.5s" },
  { izq: "58%", c: "bg-celeste", retraso: "1s" },
  { izq: "80%", c: "bg-mango", retraso: "1.5s" },
];

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
            className={`relative flex items-end justify-center overflow-hidden rounded-lg ${suelta ? "col-span-2 aspect-[2/1] sm:col-span-1 sm:aspect-square" : "aspect-square"} border-[3px] border-teal-oscuro ${
              destacada ? `z-10 scale-[1.04] -rotate-1 shadow-dura ${PUNTITOS} ${ultima ? "bg-rosa-palido" : "bg-celeste"}` : hecho ? `${PUNTITOS} bg-teal-fondo` : "bg-perla/60"
            }`}
          >
            {/* Lotito haciendo lo de ese paso (`pnpm imagenes-pasos`); si falta, solo su silueta */}
            <span className={`relative mb-1 h-[84%] w-[84%] ${destacada ? "animate-bote" : ""}`}>
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
              className={`absolute left-0 top-0 rounded-br-lg border-b-[3px] border-r-[3px] border-teal-oscuro px-2 py-0.5 font-logo text-xs font-semibold sm:text-sm ${
                hecho || destacada ? "bg-limon" : "bg-borde text-texto-2"
              }`}
            >
              {i + 1} · {t.cortos[paso]}
              {enCurso && <span className="sr-only"> ({t.ahora})</span>}
            </span>

            {!hecho && !destacada && (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-logo text-6xl font-semibold text-texto-2/40">
                ?
              </span>
            )}
            {hecho && !ultima && (
              <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal text-white">
                <Icon nombre="check" className="size-3.5" strokeWidth={3} />
              </span>
            )}
            {destacada && (
              <span aria-hidden="true" className={`absolute bottom-1 right-1 flex size-14 rotate-12 items-center justify-center bg-mango text-center font-logo text-xs font-semibold leading-none sm:size-16 sm:text-sm ${ESTRELLA}`}>
                {ultima ? t.sello.listo : t.sello.ahora}
              </span>
            )}
            {ultima &&
              CONFETI.map((c) => (
                <i key={c.izq} aria-hidden="true" style={{ left: c.izq, animationDelay: c.retraso }} className={`absolute top-4 h-3 w-2 animate-confeti rounded-[2px] border-[1.5px] border-teal-oscuro ${c.c}`} />
              ))}
          </li>
        );
      })}
    </ol>
  );
}
