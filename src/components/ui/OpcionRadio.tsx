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
  "group cursor-pointer border-2 border-borde-control bg-superficie transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out hover:bg-fondo has-[:checked]:-translate-y-0.5 has-[:checked]:border-teal-oscuro has-[:checked]:bg-teal-fondo has-[:checked]:shadow-dura-chica has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

/**
 * Una opción de "elegí una". Es un radio de verdad (teclado y lectores de pantalla lo entienden); se dibuja con el marco de la
 * marca: al elegirla se levanta, se tiñe de teal suave y el círculo se llena con un check que rebota.
 */
export function OpcionRadio({ titulo, ayuda, icono, forma = "pildora", ...input }: Props) {
  const marca = (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-has-[:checked]:scale-110 group-has-[:checked]:bg-teal"
    >
      <Icon nombre="check" className="size-3.5 scale-50 text-white opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-has-[:checked]:scale-100 group-has-[:checked]:opacity-100" />
    </span>
  );

  if (forma === "tarjeta") {
    return (
      <label className={`${comun} flex items-start gap-3 rounded-[24px] p-4`}>
        <input type="radio" className="sr-only" {...input} />
        {icono && (
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white">
            <Icon nombre={icono} className="size-5" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold">{titulo}</span>
          {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
        </span>
        {marca}
      </label>
    );
  }

  return (
    <label className={`${comun} inline-flex min-h-11 items-center gap-2 rounded-full py-1.5 pl-2 pr-4`}>
      <input type="radio" className="sr-only" {...input} />
      {marca}
      {icono && <Icon nombre={icono} className="size-4" />}
      <span className="font-bold">{titulo}</span>
    </label>
  );
}
