import Link from "next/link";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda.indice;

const SECCIONES = [
  { id: "tienda", etiqueta: t.tienda, ayuda: t.tiendaAyuda },
  { id: "ventas", etiqueta: t.ventas, ayuda: t.ventasAyuda },
  { id: "pagos", etiqueta: t.pagos, ayuda: t.pagosAyuda },
  { id: "envios", etiqueta: t.envios, ayuda: t.enviosAyuda },
  { id: "lotito", etiqueta: t.lotito, ayuda: t.lotitoAyuda },
] as const;

export type IdSeccion = (typeof SECCIONES)[number]["id"];

/** `/ajustes/tienda` o `/ajustes/tienda?seccion=pagos`. Si el valor no cuadra, cae en tu tienda. */
export function idSeccion(valor: unknown): IdSeccion {
  return SECCIONES.some((s) => s.id === valor) ? (valor as IdSeccion) : "tienda";
}

function hrefSeccion(id: IdSeccion) {
  return id === "tienda" ? "/ajustes/tienda" : `/ajustes/tienda?seccion=${id}`;
}

export function SeccionesTienda({ activa }: { activa: IdSeccion }) {
  return (
    <div
      role="tablist"
      aria-label={t.etiqueta}
      className="grid grid-cols-2 gap-1.5 rounded-[20px] border-2 border-teal-oscuro bg-white p-1.5 lg:grid-cols-5"
    >
      {SECCIONES.map((s) => (
        <Link
          key={s.id}
          href={hrefSeccion(s.id)}
          scroll={false}
          role="tab"
          id={`tab-${s.id}`}
          aria-selected={activa === s.id}
          aria-controls={`panel-${s.id}`}
          className="flex flex-col items-start rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-crema aria-selected:bg-teal-oscuro aria-selected:text-white aria-selected:hover:bg-teal-oscuro"
        >
          <span className="font-bold">{s.etiqueta}</span>
          <span className="text-xs opacity-70">{s.ayuda}</span>
        </Link>
      ))}
    </div>
  );
}
