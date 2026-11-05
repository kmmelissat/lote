"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { CANALES, COBROS, cuantosFiltros, FECHAS, type FiltrosElegidos } from "../filtros";

const t = textos.pedidos.filtros;

/**
 * El botón Filtros y su menú: canal, fecha y cobro. El menú flota sobre la lista y se queda abierto mientras se eligen
 * varios; se cierra tocando afuera o con Escape. Cada cambio va a la URL (y vuelve a la primera página), así la lista
 * filtrada se puede recargar o compartir. La pestaña de estado y la búsqueda se conservan.
 */
export function FiltrosPedidos({ elegidos, estado, q }: { elegidos: FiltrosElegidos; estado: string; q: string }) {
  const router = useRouter();
  const activos = cuantosFiltros(elegidos);
  const [abierto, setAbierto] = useState(false);
  const [cargando, empezar] = useTransition();
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    // Escape cierra primero la lista que esté abierta adentro; si ya no hay ninguna, cierra el menú
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && !raiz.current?.querySelector('[aria-expanded="true"][role="combobox"]')) setAbierto(false);
    };
    document.addEventListener("pointerdown", afuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", afuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  function ir(nuevos: FiltrosElegidos) {
    const partes = new URLSearchParams({ estado });
    if (q) partes.set("q", q);
    for (const [clave, valor] of Object.entries(nuevos)) if (valor) partes.set(clave, valor);
    empezar(() => router.push(conBusqueda("/pedidos", partes), { scroll: false }));
  }

  const cambiar = <K extends keyof FiltrosElegidos>(clave: K, valor: string) =>
    ir({ ...elegidos, [clave]: (valor || undefined) as FiltrosElegidos[K] });

  const listas = [
    {
      clave: "canal" as const,
      etiqueta: t.canal,
      opciones: [{ valor: "", etiqueta: t.todosCanales }, ...CANALES.map((c) => ({ valor: c, etiqueta: textos.pedidos.canales[c] }))],
    },
    {
      clave: "fecha" as const,
      etiqueta: t.fecha,
      opciones: [{ valor: "", etiqueta: t.todasFechas }, ...FECHAS.map((f) => ({ valor: f, etiqueta: t.fechas[f] }))],
    },
    {
      clave: "cobro" as const,
      etiqueta: t.cobro,
      opciones: [{ valor: "", etiqueta: t.todosCobros }, ...COBROS.map((c) => ({ valor: c, etiqueta: t.cobros[c] }))],
    },
  ];

  return (
    <div ref={raiz} className="relative">
      <Button
        type="button"
        variante="suave"
        icono="filtros"
        aria-expanded={abierto}
        aria-controls="filtros-pedidos"
        onClick={() => setAbierto((a) => !a)}
      >
        {t.boton}
        {activos > 0 && <span className="rounded-full bg-teal-oscuro px-2 text-xs tabular-nums text-white">{activos}</span>}
      </Button>

      <div
        id="filtros-pedidos"
        role="group"
        aria-label={t.boton}
        hidden={!abierto}
        aria-busy={cargando}
        className="absolute right-0 top-full z-30 mt-2 flex w-[min(20rem,calc(100vw-2rem))] animate-entra flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 shadow-dura aria-busy:opacity-80"
      >
        {listas.map((l) => (
          <div key={l.clave} className="flex flex-col gap-1.5">
            <label htmlFor={`filtro-${l.clave}`} className="text-sm font-medium">
              {l.etiqueta}
            </label>
            <ListaDesplegable
              id={`filtro-${l.clave}`}
              variante="pildora"
              valor={elegidos[l.clave] ?? ""}
              alCambiar={(v) => cambiar(l.clave, v)}
              opciones={l.opciones}
              placeholder={l.opciones[0].etiqueta}
            />
          </div>
        ))}
        {activos > 0 && (
          <Button type="button" variante="suave" tamano="chico" icono="x" className="self-start" onClick={() => ir({})}>
            {t.quitar}
          </Button>
        )}
      </div>
    </div>
  );
}
