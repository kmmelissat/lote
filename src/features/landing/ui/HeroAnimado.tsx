"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { Globo, Miniatura } from "./comun";

const m = textos.landing.hero.mock;

const GANANCIA_ANTES = 117.5;
const GANANCIA_DESPUES = 142.5;
const TONOS = ["rosa", "limon", "teal"] as const;

// La secuencia: 1 llega el mensaje, 2 responde Lote, 3 la chaqueta pasa a Apartada (y el monito se entera),
// 4 sube la ganancia. Después de unos segundos vuelve a empezar.
const TIEMPOS = [700, 1700, 2600, 3500];
const REINICIO = 8500;

const CONSULTA = "(prefers-reduced-motion: reduce)";
const suscribir = (aviso: () => void) => {
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", aviso);
  return () => lista.removeEventListener("change", aviso);
};

/** El mockup del hero, animado. Con "reducir movimiento" se queda en el estado final, quieto. */
export function HeroAnimado() {
  const [pasoAnimado, setPaso] = useState(0);
  const [gananciaAnimada, setGanancia] = useState(GANANCIA_ANTES);
  const reducido = useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches, () => false);
  // Con "reducir movimiento" no hay secuencia: se ve el estado final, quieto.
  const paso = reducido ? 4 : pasoAnimado;
  const ganancia = reducido ? GANANCIA_DESPUES : gananciaAnimada;

  useEffect(() => {
    if (reducido) return;
    const pendientes: number[] = [];
    let cuadro = 0;

    const ciclo = () => {
      setPaso(0);
      setGanancia(GANANCIA_ANTES);
      TIEMPOS.forEach((t, i) => {
        pendientes.push(
          window.setTimeout(() => {
            setPaso(i + 1);
            if (i + 1 === 4) {
              // El contador sube con una curva que frena al final
              const inicio = performance.now();
              const paso = (ahora: number) => {
                const avance = Math.min(1, (ahora - inicio) / 1000);
                setGanancia(GANANCIA_ANTES + (GANANCIA_DESPUES - GANANCIA_ANTES) * (1 - (1 - avance) ** 3));
                if (avance < 1) cuadro = requestAnimationFrame(paso);
              };
              cuadro = requestAnimationFrame(paso);
            }
          }, t),
        );
      });
      pendientes.push(window.setTimeout(ciclo, REINICIO));
    };
    ciclo();

    return () => {
      pendientes.forEach(clearTimeout);
      cancelAnimationFrame(cuadro);
    };
  }, [reducido]);

  const apartada = paso >= 3;

  return (
    <div aria-hidden="true" className="relative mx-auto flex w-full max-w-lg flex-col gap-4 pt-16 md:pt-20">
      {/* El monito asoma por detrás de la lista y se entera cuando se aparta algo */}
      <div className="absolute right-4 top-0 z-0 flex items-end gap-2 md:right-8">
        {apartada && <Globo key="globo" className="mb-8 animate-entra">{m.gorila}</Globo>}
        <Gorila className="size-24 animate-asomar text-rosa md:size-28" />
      </div>

      <div className="relative z-10 -rotate-2 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 shadow-dura md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-lg font-bold">{m.productos}</p>
          {apartada && (
            <span className="animate-entra rounded-full border-2 border-teal-oscuro bg-rosa px-3 py-1 text-sm font-bold text-teal-oscuro">
              {m.stickerApartado}
            </span>
          )}
        </div>
        <ul className="flex flex-col">
          {m.filas.map((f, i) => (
            <li key={f.nombre} className="flex items-center gap-3 border-t border-borde py-3 first:border-t-0">
              <Miniatura icono={f.icono} tono={TONOS[i]} className="size-12" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.nombre}</span>
                <span className="text-sm text-texto-2">
                  {f.precio}
                  {i === 0 && <span> · {m.disponibles(apartada ? 0 : 1)}</span>}
                </span>
              </span>
              {i === 0 ? (
                <StatusChip estado={apartada ? "apartado" : "disponible"} texto={apartada ? undefined : f.texto} />
              ) : (
                <StatusChip estado={i === 1 ? "disponible" : "poco_stock"} texto={f.texto} />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex min-h-36 rotate-2 flex-col justify-end gap-2 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 shadow-dura md:ml-12 md:p-5">
        {paso >= 1 && (
          <p className="max-w-[85%] animate-entra self-end rounded-2xl rounded-br-md bg-teal px-4 py-2 text-white">{m.tu}</p>
        )}
        {paso >= 2 && (
          <p className="max-w-[90%] animate-entra rounded-2xl rounded-bl-md bg-fondo px-4 py-2">{m.lote}</p>
        )}
        {paso >= 3 && (
          <span className="animate-entra self-start rounded-full border-2 border-teal-oscuro px-3 py-0.5 text-sm font-bold text-teal">
            {m.deshacer}
          </span>
        )}
      </div>

      <div className="relative z-10 -rotate-1 flex items-center justify-between gap-3 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro px-5 py-4 text-white shadow-[4px_4px_0_0_var(--color-mango)] md:mr-10">
        <span>{m.gananciaEtiqueta}</span>
        <span className="text-[32px] font-bold leading-none tabular-nums text-limon">+${ganancia.toFixed(2)}</span>
      </div>
    </div>
  );
}
