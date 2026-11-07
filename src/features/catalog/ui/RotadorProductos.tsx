"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { urlFoto } from "@/lib/fotos";

export type ItemRotador = { foto: string; nombre: string; precio: string; anterior?: string | null; descuento?: number };

const MS = 3800;

/** Cuál de los productos toca mostrar: avanza sola, salvo que la persona pida menos movimiento. */
function useIndiceQueRota(total: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (total < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % total), MS);
    return () => clearInterval(id);
  }, [total]);
  return i;
}

/** Un producto a la vez, con la foto grande y una etiqueta con nombre y precio. Decorativo: el clic lo recibe la tarjeta de afuera. */
export function RotadorGrande({ items }: { items: ItemRotador[] }) {
  const i = useIndiceQueRota(items.length);
  return (
    <div aria-hidden="true" className="absolute inset-y-4 right-4 w-[44%] md:inset-y-5 md:right-5 md:w-[42%]">
      {items.map((p, k) => (
        <div key={p.foto} className={`absolute inset-0 transition-all duration-700 ${k === i ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="relative h-full overflow-hidden rounded-3xl bg-white shadow-[0_14px_30px_-12px_rgba(0,56,68,0.45)]">
            <Image src={urlFoto(p.foto)} alt="" fill sizes="320px" className="object-cover" priority={k === 0} />
            {p.descuento ? (
              <span className="absolute left-3 top-3 rounded-full bg-rosa px-3 py-1 font-logo text-sm font-extrabold text-teal-oscuro">−{p.descuento}%</span>
            ) : null}
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 rounded-2xl bg-white/90 px-3 py-2 text-teal-oscuro backdrop-blur">
              <span className="line-clamp-1 min-w-0 text-sm font-semibold">{p.nombre}</span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                {p.anterior && <s className="text-xs opacity-60">{p.anterior}</s>}
                <span className="font-logo text-base font-extrabold">{p.precio}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
      {items.length > 1 && (
        <div className="absolute -bottom-0 left-1/2 flex -translate-x-1/2 translate-y-3 gap-1.5">
          {items.map((p, k) => (
            <span key={p.foto} className={`h-1.5 rounded-full bg-teal-oscuro transition-all duration-500 ${k === i ? "w-5" : "w-1.5 opacity-30"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Fotos redondas en fila: la que toca crece y se levanta, y debajo dice qué es y cuánto cuesta. */
export function RotadorMini({ items }: { items: ItemRotador[] }) {
  const lista = items.slice(0, 4);
  const i = useIndiceQueRota(lista.length);
  return (
    <div aria-hidden="true" className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="flex items-end -space-x-2">
        {lista.map((p, k) => (
          <span
            key={p.foto}
            className={`relative size-[52px] overflow-hidden rounded-full bg-white ring-2 ring-rosa-palido transition-all duration-500 ${k === i ? "z-10 size-[68px] -translate-y-1 shadow-[0_8px_16px_-6px_rgba(0,56,68,0.45)]" : "opacity-80"}`}
          >
            <Image src={urlFoto(p.foto)} alt="" fill sizes="68px" className="object-cover" />
          </span>
        ))}
      </div>
      <div className="relative h-4 w-[170px] text-center text-xs leading-4">
        {lista.map((p, k) => (
          <span key={p.foto} className={`absolute inset-0 truncate transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0"}`}>
            <span className="font-semibold">{p.nombre}</span> · <span className="font-logo font-extrabold">{p.precio}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
