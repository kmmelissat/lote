import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

type Props = { titulo: string; icono?: NombreIcono } & Omit<ComponentProps<"input">, "type" | "className" | "children" | "title">;

/**
 * Una etiqueta que se prende y se apaga ("Aceptás transferencia"). Es un checkbox de verdad (teclado y lectores de pantalla
 * lo entienden). Prendida se levanta, se tiñe de teal suave y su círculo se llena con un check, como `OpcionRadio`.
 */
export function OpcionCheck({ titulo, icono, ...input }: Props) {
  return (
    <label className="group inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-[14px] border border-linea bg-superficie py-1.5 pl-4 pr-2 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 hover:bg-gris-50 has-[:checked]:border-teal has-[:checked]:bg-teal-fondo has-[:checked]:ring-[3px] has-[:checked]:ring-teal/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input type="checkbox" className="sr-only" {...input} />
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      <span className="font-medium">{titulo}</span>
      <span
        aria-hidden="true"
        className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-borde-control bg-white transition-colors duration-150 group-has-[:checked]:border-teal group-has-[:checked]:bg-teal"
      >
        <Icon nombre="check" className="size-3.5 scale-50 text-white opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-has-[:checked]:scale-100 group-has-[:checked]:opacity-100" />
      </span>
    </label>
  );
}
