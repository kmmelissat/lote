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
  return id === "tienda" ? "/ajustes/tienda" : (`/ajustes/tienda?seccion=${id}` as const);
}

export function SeccionesTienda({ activa }: { activa: IdSeccion }) {
  return (
    <div
      role="tablist"
      aria-label={t.etiqueta}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-1.5 lg:overflow-visible lg:rounded-[20px] lg:border-2 lg:border-teal-oscuro lg:bg-white lg:p-1.5 lg:pb-1.5 [&::-webkit-scrollbar]:hidden"
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
          className="flex shrink-0 flex-col items-start whitespace-nowrap rounded-full border-2 border-teal-oscuro bg-white px-4 py-2 text-left text-sm transition-colors hover:bg-crema aria-selected:bg-teal-oscuro aria-selected:text-white aria-selected:hover:bg-teal-oscuro lg:rounded-2xl lg:border-0 lg:px-3 lg:py-2.5 lg:text-base"
        >
          <span className="font-bold">{s.etiqueta}</span>
          <span className="hidden text-xs opacity-70 lg:block">{s.ayuda}</span>
        </Link>
      ))}
    </div>
  );
}
