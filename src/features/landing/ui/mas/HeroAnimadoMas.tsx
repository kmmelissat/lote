"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { Globo } from "../comun";
import { LotitoMas } from "./LotitoMas";

const m = textos.landing.hero.mock;

const GANANCIA_ANTES = 117.5;
const GANANCIA_DESPUES = 142.5;

const FOTOS = {
  camisa: { src: "/landing/chaqueta.webp", alt: "Chaqueta" },
  disco: { src: "/landing/disco.webp", alt: "Disco" },
  llave: { src: "/landing/llaveros.webp", alt: "Llaveros" },
} as const;

const TIEMPOS = [700, 1700, 2600, 3500];
const REINICIO = 8500;
const CONSULTA = "(prefers-reduced-motion: reduce)";
const suscribir = (aviso: () => void) => {
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", aviso);
  return () => lista.removeEventListener("change", aviso);
};

/** Miniatura ilustrada, del mismo estilo sticker que el mercadito. */
function Foto({ de }: { de: keyof typeof FOTOS }) {
  const f = FOTOS[de];
  return (
    <span className="relative size-11 shrink-0 overflow-hidden">
      <Image src={f.src} alt="" fill sizes="44px" className="object-contain" />
    </span>
  );
}

/** El mockup del hero de la versión más: mismos tres bloques (productos, chat, ganancia), con ilustraciones nuevas. */
export function HeroAnimadoMas() {
  const [pasoAnimado, setPaso] = useState(0);
  const [gananciaAnimada, setGanancia] = useState(GANANCIA_ANTES);
  const reducido = useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches, () => false);
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
              const inicio = performance.now();
              const avanzar = (ahora: number) => {
                const avance = Math.min(1, (ahora - inicio) / 1000);
                setGanancia(GANANCIA_ANTES + (GANANCIA_DESPUES - GANANCIA_ANTES) * (1 - (1 - avance) ** 3));
                if (avance < 1) cuadro = requestAnimationFrame(avanzar);
              };
              cuadro = requestAnimationFrame(avanzar);
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
    <div aria-hidden="true" className="relative mx-auto flex w-full max-w-md flex-col gap-3 pt-16 md:pt-20">
      <div className="absolute right-3 top-0 z-0 flex items-end gap-2 md:right-6">
        {apartada && (
          <Globo key="globo" className="mb-7 animate-entra">
            {m.gorila}
          </Globo>
        )}
        <LotitoMas nombre="asoma" className="w-36 animate-asomar md:w-44" />
      </div>

      <div className="relative z-10 -rotate-2 rounded-[24px] border-[3px] border-teal-oscuro bg-superficie p-4 shadow-dura">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-extrabold">{m.productos}</p>
          <span className={`rounded-full border-2 border-teal-oscuro bg-rosa px-3 py-0.5 text-sm font-bold text-teal-oscuro ${apartada ? "animate-entra" : "invisible"}`}>
            {m.stickerApartado}
          </span>
        </div>
        <ul className="flex flex-col">
          {m.filas.map((f, i) => (
            <li key={f.nombre} className="flex items-center gap-3 border-t-2 border-borde py-2.5 first:border-t-0">
              <Foto de={f.icono} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{f.nombre}</span>
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

      <div className="relative z-10 ml-auto flex w-[90%] rotate-2 flex-col gap-2 rounded-[24px] border-[3px] border-teal-oscuro bg-celeste-palido p-4 shadow-dura">
        <p className={`max-w-[85%] self-end rounded-2xl rounded-br-md bg-teal px-3.5 py-2 text-sm text-white ${paso >= 1 ? "animate-entra" : "invisible"}`}>{m.tu}</p>
        <p className={`max-w-[90%] rounded-2xl rounded-bl-md bg-fondo px-3.5 py-2 text-sm ${paso >= 2 ? "animate-entra" : "invisible"}`}>{m.lote}</p>
        <span className={`self-start rounded-full border-2 border-teal-oscuro px-3 py-0.5 text-sm font-bold text-teal ${paso >= 3 ? "animate-entra" : "invisible"}`}>
          {m.deshacer}
        </span>
        <p className="mt-0.5 rounded-full border-2 border-borde px-3.5 py-2 text-sm text-texto-2">{m.escribile}</p>
      </div>

      <div className="relative z-10 flex -rotate-1 items-center justify-between gap-3 rounded-[24px] border-[3px] border-teal-oscuro bg-teal-oscuro px-5 py-3.5 text-white shadow-[4px_4px_0_0_var(--color-rosa)] md:mr-8">
        <span className="font-bold">{m.gananciaEtiqueta}</span>
        <span className="text-[28px] font-extrabold leading-none tabular-nums text-limon">+${ganancia.toFixed(2)}</span>
      </div>
    </div>
  );
}
