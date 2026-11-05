import type { ReactNode } from "react";
import { Pestanas } from "@/components/nav/Pestanas";
import { textos } from "@/lib/textos";

const t = textos.gestion;

/** Las pantallas de Gestión como pestañas. */
export function SeccionesGestion({ activa, filtro }: { activa: "resumen" | "cuadre"; filtro?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Pestanas
      etiqueta={t.secciones}
      activa={activa}
      pestanas={[
        { valor: "resumen", etiqueta: t.resumen, href: "/balance/resumen" },
        { valor: "cuadre", etiqueta: t.cuadre.etiqueta, href: "/balance/detalle" },
      ]}
      />
      {filtro}
    </div>
  );
}
