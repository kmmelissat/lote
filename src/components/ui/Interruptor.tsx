"use client";

import { Icon } from "./Icon";

/** Interruptor con título: es un checkbox de verdad (teclado y lectores de pantalla lo entienden). */
export function Interruptor({
  titulo,
  ayuda,
  activo,
  onCambio,
  name,
  etiqueta,
  disabled,
}: {
  titulo: string;
  ayuda?: string;
  activo: boolean;
  onCambio: (v: boolean) => void;
  /** Si va dentro de un formulario, el nombre con el que viaja ("on" cuando está prendido) */
  name?: string;
  /** Para lectores de pantalla, cuando hay varios en la pantalla y el título solo no dice de qué es */
  etiqueta?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{titulo}</span>
        {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        aria-label={etiqueta}
        checked={activo}
        disabled={disabled}
        onChange={(e) => onCambio(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-8 w-14 shrink-0 rounded-full border border-teal-oscuro bg-limon/50 shadow-dura-chica transition-colors duration-150 peer-checked:bg-mango peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal peer-checked:[&>span]:translate-x-6 peer-checked:[&>span>svg]:opacity-100"
      >
        <span className="absolute left-0.5 top-0.5 flex size-6 items-center justify-center rounded-full border border-teal-oscuro bg-white text-teal-oscuro transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
          <Icon nombre="check" className="size-3.5 opacity-0 transition-opacity duration-150" />
        </span>
      </span>
    </label>
  );
}
