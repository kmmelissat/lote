import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Una línea que explica o advierte dentro de un formulario. `info` es gris con su ícono: dice cómo quedó algo, no pide
 * nada. `alerta` es limón: solo para lo que de verdad hay que mirar (algo que se rompe o que no va a funcionar).
 */
export function Aviso({ tipo = "info", children }: { tipo?: "info" | "alerta"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
        tipo === "alerta" ? "bg-limon font-medium" : "border border-borde bg-superficie text-texto-2"
      }`}
    >
      <Icon nombre={tipo === "alerta" ? "alerta" : "info"} className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
