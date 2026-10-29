"use client";

/** Interruptor con título: es un checkbox de verdad (teclado y lectores de pantalla lo entienden). */
export function Interruptor({
  titulo,
  ayuda,
  activo,
  onCambio,
  name,
}: {
  titulo: string;
  ayuda?: string;
  activo: boolean;
  onCambio: (v: boolean) => void;
  /** Si va dentro de un formulario, el nombre con el que viaja ("on" cuando está prendido) */
  name?: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{titulo}</span>
        {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
      </span>
      <input type="checkbox" role="switch" name={name} checked={activo} onChange={(e) => onCambio(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-8 w-14 shrink-0 rounded-full border-2 border-teal-oscuro bg-white transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:border-2 after:border-teal-oscuro after:bg-limon after:transition-transform after:duration-150 peer-checked:bg-teal peer-checked:after:translate-x-6 peer-checked:after:bg-mango peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal"
      />
    </label>
  );
}
