"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { Filtros } from "./enlacesExplorar";

const t = textos.explorar;

const campo = "h-10 w-full rounded-[12px] border border-borde-control bg-white px-3 text-sm focus:border-teal";
const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";


/**
 * La única fila encima de la grilla del home: el botón "Filtros" (abre un popover; en el celular, una hoja desde abajo) con precio y
 * departamento en un formulario de siempre (GET), los accesos rápidos, "Limpiar filtros" y, a la derecha, lo que pasa el servidor
 * (cuántos hay y el orden). En el celular la fila se desliza y "Filtros" se queda fijo a la izquierda.
 */
export function BarraFiltros({
  f,
  rapidos,
  limpiar,
  derecha,
}: {
  f: Filtros;
  /** Los accesos rápidos (los arma el servidor) */
  rapidos: ReactNode;
  limpiar: Route | null;
  derecha: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();

  // Se cierra con Escape y al tocar fuera
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alTocar);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alTocar);
    };
  }, [abierto]);

  // Lo que no se edita en el popover viaja escondido, para que aplicar no pierda los demás filtros
  const ocultos = (...omitir: string[]) => {
    const todos: [string, string][] = [
      ["q", f.busqueda],
      ["categoria", f.categoria],
      ["sub", f.sub],
      ["orden", f.orden === "recientes" ? "" : f.orden],
      ["min", f.min],
      ["max", f.max],
      ["depto", f.depto],
      ["gratis", f.gratis ? "1" : ""],
      ["oferta", f.oferta ? "1" : ""],
    ];
    return todos.filter(([k, v]) => v && !omitir.includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);
  };

  const hoja =
    "z-30 flex flex-col gap-4 border border-teal-oscuro bg-white p-4 shadow-dura max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-[24px] max-md:pb-6 md:absolute md:left-0 md:top-full md:mt-2 md:w-72 md:rounded-[20px]";
  const conFiltro = !!(f.min || f.max || f.depto);

  return (
    <div ref={raiz} className="relative flex min-h-11 items-center gap-2 max-md:-mx-4 max-md:overflow-x-auto max-md:px-4 [scrollbar-width:none] md:flex-wrap">
      <div className="sticky left-0 z-10 shrink-0 bg-fondo max-md:-ml-4 max-md:pl-4 max-md:pr-1 md:static md:bg-transparent">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={`${id}-filtros`}
          onClick={() => setAbierto(!abierto)}
          className={`inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro transition-colors md:h-10 ${foco} ${conFiltro ? "bg-limon" : "bg-white hover:bg-crema"}`}
        >
          <Icon nombre="filtros" className="size-4" />
          {t.barra.filtros}
        </button>
        {abierto && (
          <form id={`${id}-filtros`} action="/marketplace" className={hoja}>
            {ocultos("min", "max", "depto")}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-logo text-base">{t.rangoPrecio}</legend>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-texto-2">
                  {t.precioMin}
                  <input name="min" inputMode="decimal" pattern="\d*([.,]\d{0,2})?" defaultValue={f.min} placeholder="$0" className={campo} />
                </label>
                <span aria-hidden="true" className="flex h-10 items-center text-sm text-texto-2">–</span>
                <label className="flex flex-col gap-1 text-xs text-texto-2">
                  {t.precioMax}
                  <input name="max" inputMode="decimal" pattern="\d*([.,]\d{0,2})?" defaultValue={f.max} placeholder="$100" className={campo} />
                </label>
              </div>
            </fieldset>
            <label className="flex flex-col gap-1 text-xs text-texto-2">
              <span className="font-logo text-base text-texto">{t.panel.entrega}</span>
              {t.panel.departamento}
              <select name="depto" defaultValue={f.depto} className={campo}>
                <option value="">{t.panel.todoElPais}</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={`inline-flex h-11 w-full items-center justify-center rounded-full border border-teal-oscuro bg-mango px-6 text-sm font-bold ${foco}`}>
              {t.aplicar}
            </button>
          </form>
        )}
      </div>

      {rapidos}

      {limpiar && (
        <Link href={limpiar} rel="nofollow" scroll={false} className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded px-1 text-sm font-bold text-teal underline ${foco}`}>
          {t.barra.limpiar}
        </Link>
      )}

      <div className="flex shrink-0 items-center gap-3 md:ml-auto">{derecha}</div>
    </div>
  );
}
