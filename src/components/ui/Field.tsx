import { useId, type ComponentProps } from "react";
import { limpiarSiNumero } from "@/lib/entrada";
import { Sugerido } from "./Sugerido";

type Props = { etiqueta: string; error?: string; sugerido?: boolean } & ComponentProps<"input">;

export function Field({ etiqueta, error, sugerido, className = "", onChange, ...props }: Props) {
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
        className={`h-11 rounded-[14px] border border-linea bg-superficie px-3.5 text-sm outline-none focus:border-teal ${className}`}
        {...props}
        onChange={(e) => {
          e.target.value = limpiarSiNumero(e.target.value, props.inputMode, props.type);
          onChange?.(e);
        }}
      />
      {error && (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
