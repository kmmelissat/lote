import { useId, type ComponentProps } from "react";
import { Sugerido } from "./Sugerido";

type Props = { etiqueta: string; error?: string; sugerido?: boolean } & ComponentProps<"input">;

export function Field({ etiqueta, error, sugerido, className = "", ...props }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
        {sugerido && <Sugerido />}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-12 rounded-xl border border-borde bg-superficie px-4 text-base ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
