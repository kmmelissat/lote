import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";

const FICHAS = { verde: "bg-ficha-verde", celeste: "bg-ficha-celeste", rosa: "bg-ficha-rosa", amarillo: "bg-ficha-amarillo", lila: "bg-ficha-lila" } as const;

/**
 * Una de las tres cifras de arriba del detalle (lo que queda, lo que se gana, lo que se vendió): etiqueta con su ficha,
 * el número grande, una nota y, abajo, lo que se puede hacer. `aviso` pinta el borde en ámbar cuando hay algo que atender.
 */
export function TarjetaResumen({
  etiqueta,
  icono,
  color,
  numero,
  detalle,
  aviso = false,
  children,
  accion,
}: {
  etiqueta: string;
  icono: NombreIcono;
  color: keyof typeof FICHAS;
  numero: ReactNode;
  /** Lo que acompaña al número: "de 14", "por unidad" */
  detalle?: string;
  aviso?: boolean;
  /** Líneas de apoyo debajo del número */
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <section
      aria-label={etiqueta}
      className={`flex min-w-0 flex-col gap-3 rounded-3xl border bg-superficie p-5 shadow-xs ${aviso ? "border-ambar" : "border-linea"}`}
    >
      <p className="flex items-center gap-2 text-sm font-medium text-texto-2">
        <span aria-hidden="true" className={`grid size-7 place-items-center rounded-[9px] text-teal-oscuro ${FICHAS[color]}`}>
          <Icon nombre={icono} className="size-4" />
        </span>
        {etiqueta}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
        <span className="text-4xl font-semibold leading-none tracking-tight">{numero}</span>
        {detalle && <span className="text-sm text-texto-2">{detalle}</span>}
      </p>
      {children && <div className="flex flex-col gap-1 text-sm text-texto-2">{children}</div>}
      {accion && <div className="mt-auto pt-1">{accion}</div>}
    </section>
  );
}
