import type { ReactNode } from "react";
import { Pestanas } from "@/components/nav/Pestanas";
import { textos } from "@/lib/textos";

const t = textos.dinero;

/**
 * Las pantallas de Dinero como pestañas, con el filtro de periodo (un selector) a la derecha en la misma fila.
 * El periodo viaja de una pantalla a otra para no perder lo que se estaba mirando.
 */
export function SeccionesDinero({ activa, periodo, filtro }: { activa: "resumen" | "movimientos" | "cuadre"; periodo: string; filtro?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Pestanas
        etiqueta={t.secciones}
        activa={activa}
        pestanas={[
          { valor: "resumen", etiqueta: t.resumen, href: `/dinero?periodo=${periodo}` },
          { valor: "movimientos", etiqueta: t.movimientos, href: `/dinero/movimientos?periodo=${periodo}` },
          // El cuadre es de hoy, no de un periodo
          { valor: "cuadre", etiqueta: t.cuadre.etiqueta, href: "/dinero/cuadre" },
        ]}
      />
      {filtro}
    </div>
  );
}
