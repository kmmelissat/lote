"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { textos } from "@/lib/textos";
import { Icon } from "./Icon";

const t = textos.comun;

/**
 * Una fila que se desliza de lado si lo que tiene no cabe (las miniaturas de una galería). Las flechas aparecen
 * solo cuando hay más para ver de ese lado; `activo` mantiene a la vista el elemento elegido.
 */
export function Tira({ children, etiqueta, activo }: { children: ReactNode; etiqueta: string; activo?: number }) {
  const lista = useRef<HTMLUListElement>(null);
  const [hay, setHay] = useState({ antes: false, despues: false });

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const medir = () => setHay({ antes: el.scrollLeft > 2, despues: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    // El observador mide apenas empieza y cada vez que cambia el ancho
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, []);

  useEffect(() => {
    const el = lista.current;
    const item = activo === undefined ? null : (el?.children[activo] as HTMLElement | undefined);
    if (!el || !item) return;
    if (item.offsetLeft < el.scrollLeft) el.scrollTo({ left: item.offsetLeft - 4, behavior: "smooth" });
    else if (item.offsetLeft + item.offsetWidth > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: item.offsetLeft + item.offsetWidth - el.clientWidth + 4, behavior: "smooth" });
  }, [activo]);

  const mover = (lado: 1 | -1) => lista.current?.scrollBy({ left: lado * lista.current.clientWidth * 0.8, behavior: "smooth" });
  const flecha =
    "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro shadow-dura-chica hover:bg-teal-fondo";

  return (
    <div className="relative">
      <ul
        ref={lista}
        aria-label={etiqueta}
        className="relative flex snap-x scroll-px-1 gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (hijo) => (
          <li className="shrink-0 snap-start">{hijo}</li>
        ))}
      </ul>
      {hay.antes && (
        <button type="button" aria-label={t.verAnteriores} onClick={() => mover(-1)} className={`${flecha} -left-3`}>
          <Icon nombre="flecha" className="size-4 rotate-90" />
        </button>
      )}
      {hay.despues && (
        <button type="button" aria-label={t.verSiguientes} onClick={() => mover(1)} className={`${flecha} -right-3`}>
          <Icon nombre="flecha" className="size-4 -rotate-90" />
        </button>
      )}
    </div>
  );
}
