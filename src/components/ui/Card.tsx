import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`min-w-0 rounded-tarjeta border border-borde bg-superficie p-4 ${className}`}
      {...props}
    />
  );
}
