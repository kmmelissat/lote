import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

type Props = {
  titulo: string;
  ayuda?: string;
  icono?: NombreIcono;
  /** Píldora: una palabra o dos en una fila. Tarjeta: con ícono y una línea de ayuda. */
  forma?: "pildora" | "tarjeta";
} & Omit<ComponentProps<"input">, "type" | "className" | "children" | "title">;

const comun =
  "group cursor-pointer border border-linea bg-superficie shadow-xs transition-[background-color,border-color,box-shadow] duration-150 hover:bg-gris-50 has-[:checked]:border-teal has-[:checked]:bg-teal-fondo has-[:checked]:ring-[3px] has-[:checked]:ring-teal/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

/**
 * Una opción de "elegí una". Es un radio de verdad (teclado y lectores de pantalla lo entienden); se dibuja al estilo Punch:
 * borde fino y esquina suave; al elegirla el borde pasa a teal con un halo, se tiñe de teal suave y el círculo se llena con un check.
 */
export function OpcionRadio({ titulo, ayuda, icono, forma = "pildora", ...input }: Props) {
  const marca = (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-borde-control bg-white transition-colors duration-150 group-has-[:checked]:border-teal group-has-[:checked]:bg-teal"
    >
      <Icon nombre="check" className="size-3.5 text-white opacity-0 transition-opacity duration-150 group-has-[:checked]:opacity-100" />
    </span>
  );

  if (forma === "tarjeta") {
    return (
      <label className={`${comun} flex items-start gap-3 rounded-3xl p-4`}>
        <input type="radio" className="sr-only" {...input} />
        {icono && (
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ficha-celeste text-teal-oscuro">
            <Icon nombre={icono} className="size-5" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{titulo}</span>
          {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
        </span>
        {marca}
      </label>
    );
  }

  return (
    <label className={`${comun} inline-flex min-h-11 items-center gap-2 rounded-[14px] py-1.5 pl-2 pr-4`}>
      <input type="radio" className="sr-only" {...input} />
      {marca}
      {icono && <Icon nombre={icono} className="size-4" />}
      <span className="font-medium">{titulo}</span>
    </label>
  );
}
