import type { ComponentProps } from "react";

/** El campo de texto largo de la marca: mismo borde y radio que `Field`. */
export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`rounded-[14px] border-2 border-borde-control bg-superficie px-4 py-3 text-base placeholder:text-texto-2/60 focus:border-teal ${className}`}
      {...props}
    />
  );
}
