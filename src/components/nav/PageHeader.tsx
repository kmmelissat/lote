import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * El encabezado de cada pantalla. `volver` pone una flecha al lado del título (su texto queda para lectores de
 * pantalla y como globito al pasar el mouse) en vez de un botón más.
 */
export function PageHeader({
  titulo,
  descripcion,
  accion,
  volver,
  ilustracion,
}: {
  titulo: ReactNode;
  descripcion: string;
  accion?: ReactNode;
  volver?: { href: string; etiqueta: string };
  /** Un dibujo (Lotito) al lado de la acción; solo en pantallas anchas */
  ilustracion?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {volver && (
          <Link
            href={volver.href}
            aria-label={volver.etiqueta}
            title={volver.etiqueta}
            className="mt-0.5 flex size-10 max-md:size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Icon nombre="flecha" className="size-5 rotate-90" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-texto-2">{descripcion}</p>
        </div>
      </div>
      {(accion || ilustracion) && (
        <div className="flex w-full shrink-0 items-end justify-end gap-4 md:w-auto">
          {ilustracion && <div className="hidden md:block">{ilustracion}</div>}
          {accion}
        </div>
      )}
    </header>
  );
}
