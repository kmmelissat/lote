"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Una fila del menú con hijos: la flechita de la derecha los abre o los cierra aunque no se esté en esa sección.
 * Al entrar a la sección se abre sola.
 */
export function ItemConArbol({
  fila,
  hijos,
  activa,
  etiqueta,
  alto,
}: {
  fila: ReactNode;
  hijos: ReactNode;
  activa: boolean;
  /** Para lectores de pantalla: «Mostrar opciones de Productos» */
  etiqueta: string;
  /** Alto de la fila, para centrar la flechita */
  alto: string;
}) {
  const [abierto, setAbierto] = useState(activa);
  // Al entrar a la sección se abre (se ajusta en el render, sin efecto)
  const [eraActiva, setEraActiva] = useState(activa);
  if (activa !== eraActiva) {
    setEraActiva(activa);
    if (activa) setAbierto(true);
  }

  return (
    <>
      <div className="relative">
        {fila}
        <button
          type="button"
          aria-expanded={abierto}
          aria-label={etiqueta}
          onClick={() => setAbierto((a) => !a)}
          className={`absolute right-1 top-0 flex ${alto} w-9 items-center justify-center rounded-xl text-texto-2 hover:text-teal-oscuro group-data-[cerrado]:hidden`}
        >
          <Icon nombre="flecha" className={`size-4 transition-transform duration-150 ${abierto ? "rotate-180" : ""}`} />
        </button>
      </div>
      {abierto ? hijos : null}
    </>
  );
}
