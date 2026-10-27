import type { ComponentProps } from "react";

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      className={`h-12 w-full rounded-xl border border-borde bg-superficie px-3 text-base ${className}`}
      {...props}
    />
  );
}
