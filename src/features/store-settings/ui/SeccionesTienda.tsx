import Link from "next/link";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda.indice;

const SECCIONES = [
  { id: "tienda", etiqueta: t.tienda },
  { id: "vitrina", etiqueta: t.vitrina },
  { id: "apariencia", etiqueta: t.apariencia },
  { id: "ventas", etiqueta: t.ventas },
  { id: "pagos", etiqueta: t.pagos },
  { id: "envios", etiqueta: t.envios },
] as const;

export type IdSeccion = (typeof SECCIONES)[number]["id"];

/** `/ajustes/tienda` o `/ajustes/tienda?seccion=pagos`. Si el valor no cuadra, cae en tu tienda. */
export function idSeccion(valor: unknown): IdSeccion {
  // «lotito» era la pestaña de Punch; ahora vive en Ventas
  if (valor === "lotito") return "ventas";
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
      className="-mx-4 flex gap-6 overflow-x-auto border-b border-linea px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap -mb-px border-b-[3px] border-transparent px-0.5 text-base font-medium text-texto-2 transition-colors hover:text-teal-oscuro aria-selected:border-teal aria-selected:font-bold aria-selected:text-teal-oscuro"
        >
          {s.etiqueta}
        </Link>
      ))}
    </div>
  );
}
