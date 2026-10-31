import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

type Props = { titulo: string; icono?: NombreIcono } & Omit<ComponentProps<"input">, "type" | "className" | "children" | "title">;

/**
 * Una etiqueta que se prende y se apaga ("Aceptás transferencia"). Es un checkbox de verdad (teclado y lectores de pantalla
 * lo entienden). Prendida se levanta, se tiñe de teal suave y su círculo se llena con un check, como `OpcionRadio`.
 */
export function OpcionCheck({ titulo, icono, ...input }: Props) {
  return (
    <label className="group inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-borde-control bg-superficie py-1.5 pl-4 pr-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out hover:bg-fondo has-[:checked]:-translate-y-0.5 has-[:checked]:border-teal-oscuro has-[:checked]:bg-teal-fondo has-[:checked]:shadow-dura-chica has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input type="checkbox" className="sr-only" {...input} />
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      <span className="font-bold">{titulo}</span>
      <span
        aria-hidden="true"
        className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-has-[:checked]:scale-110 group-has-[:checked]:bg-teal"
      >
        <Icon nombre="check" className="size-3.5 scale-50 text-white opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-has-[:checked]:scale-100 group-has-[:checked]:opacity-100" />
      </span>
    </label>
  );
}
