import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-tarjeta border border-borde bg-superficie p-4 ${className}`}
      {...props}
    />
  );
}
