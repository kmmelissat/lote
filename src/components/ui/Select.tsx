import type { ComponentProps } from "react";
import { Icon } from "./Icon";

/** Un <select> sin la flecha del sistema: la flecha es la de la marca, y el campo se ve igual en todos los navegadores. */
export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block w-full">
      <select
        className={`h-12 w-full cursor-pointer appearance-none rounded-xl border border-borde-control bg-superficie pl-3 pr-10 text-base ${className}`}
        {...props}
      >
        {children}
      </select>
      <Icon nombre="flecha" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-teal-oscuro" />
    </span>
  );
}
