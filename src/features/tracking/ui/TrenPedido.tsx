import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";
import { paradaActual, pasosDeSeguimiento } from "../pasos";
import type { Seguimiento } from "../repositorio";

const t = textos.seguimiento;

// Ilustraciones de `pnpm imagenes-tren`
const LOCOMOTORA = { src: "/seguimiento/locomotora.webp", w: 480, h: 391 };
const CARGADO = { src: "/seguimiento/vagon-actual.webp", w: 480, h: 370 };
const VACIO = { src: "/seguimiento/vagon-falta.webp", w: 480, h: 326 };

/** El tren ocupa casi la mitad del ancho y se para con la locomotora en la estación actual, sin salirse de la escena */
const ANCHO_TREN = 46;
const izquierdaDelTren = (parada: number, paradas: number) => Math.min(100 - ANCHO_TREN, Math.max(0, ((parada + 0.5) / paradas) * 100 - ANCHO_TREN * 0.8));

const CONFETI = [
  { izq: "58%", c: "bg-rosa", retraso: "0s" },
  { izq: "68%", c: "bg-limon", retraso: "0.5s" },
  { izq: "78%", c: "bg-celeste", retraso: "1s" },
  { izq: "88%", c: "bg-mango", retraso: "1.5s" },
];

/**
 * El pedido de estación en estación: un cartel por parada sobre los rieles y un trencito (locomotora y un vagón con los
 * paquetes) parado en la actual. Las estaciones por las que ya pasó llevan check. Al entregar el vagón va vacío y Lotito
 * celebra. Con retiro en tienda las dos últimas estaciones cambian de nombre. El tren entra rodando al abrir la página.
 */
export function TrenPedido({ estado, modo }: { estado: EstadoPedido; modo: Seguimiento["modo"] }) {
  const pasos = pasosDeSeguimiento(modo);
  const actual = paradaActual(estado);
  const llego = estado === "entregado";
  const vagon = llego ? VACIO : CARGADO;

  return (
    <div className="relative aspect-[2/1] overflow-hidden sm:aspect-[5/2]">
      <i aria-hidden="true" className="absolute left-[4%] top-[6%] h-3 w-14 animate-flotar rounded-full bg-white shadow-[10px_-5px_0_3px_white]" />
      <i aria-hidden="true" className="absolute right-[10%] top-[14%] h-2.5 w-10 animate-flotar rounded-full bg-white shadow-[8px_-4px_0_2px_white] [animation-delay:-2s]" />

      {/* Los carteles de las estaciones, con su poste hasta los rieles */}
      <ol aria-label={t.paradas} className="absolute inset-x-0 bottom-1.5 top-[8%] flex">
        {pasos.map((paso, i) => {
          const hecho = i < actual || llego;
          const enCurso = i === actual && !llego;
          return (
            <li key={paso} aria-current={enCurso ? "step" : undefined} className="flex min-w-0 flex-1 flex-col items-center">
              <span
                className={`flex items-center gap-1 whitespace-nowrap rounded-xl border-2 border-teal-oscuro px-1.5 py-0.5 font-logo text-[11px] font-semibold leading-tight sm:px-3 sm:py-1 sm:text-base ${
                  hecho ? "bg-teal-fondo" : enCurso ? "bg-limon shadow-dura-chica" : "border-dashed bg-white/60 text-texto-2"
                }`}
              >
                {hecho && <Icon nombre="check" aria-hidden="true" className="size-3 text-teal sm:size-4" strokeWidth={3.5} />}
                {t.cortos[paso]}
                {enCurso && <span className="sr-only"> ({t.ahora})</span>}
              </span>
              <i aria-hidden="true" className="w-1 flex-1 bg-teal-oscuro" />
            </li>
          );
        })}
      </ol>

      {/* El trencito: la locomotora adelante y el vagón detrás */}
      <div aria-hidden="true" className="absolute bottom-2 animate-tren" style={{ left: `${izquierdaDelTren(actual, pasos.length)}%`, width: `${ANCHO_TREN}%` }}>
        <div className="flex items-end">
          <div className="relative w-[44%]">
            {/* Lotito se asoma sobre el vagón; al llegar, celebrando */}
            <LotitoMas nombre={llego ? "thumbsup" : "saluda"} className="absolute -top-[88%] left-1/2 w-[58%] -translate-x-1/2 animate-bote" />
            <Image src={vagon.src} width={vagon.w} height={vagon.h} alt="" className="h-auto w-full" />
          </div>
          <div className="relative -ml-[1%] w-[56%]">
            <i className="absolute -top-[22%] left-[14%] size-3 animate-humo rounded-full border-2 border-teal-oscuro bg-white" />
            <i className="absolute -top-[40%] left-[24%] size-2 animate-humo rounded-full border-2 border-teal-oscuro bg-white [animation-delay:0.8s]" />
            <Image src={LOCOMOTORA.src} width={LOCOMOTORA.w} height={LOCOMOTORA.h} alt="" className="h-auto w-full" priority />
          </div>
        </div>
      </div>

      {/* Los rieles */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 border-t-[3px] border-teal-oscuro bg-[repeating-linear-gradient(90deg,var(--color-teal-oscuro)_0_4px,transparent_4px_12px)]" />

      {llego &&
        CONFETI.map((c) => (
          <i key={c.izq} aria-hidden="true" style={{ left: c.izq, animationDelay: c.retraso }} className={`absolute top-[34%] h-3 w-2 animate-confeti rounded-[2px] border-[1.5px] border-teal-oscuro ${c.c}`} />
        ))}
    </div>
  );
}
