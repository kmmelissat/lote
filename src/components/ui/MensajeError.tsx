"use client";

import { useEffect, type ReactNode } from "react";
import { useToastOpcional } from "./Toast";

/**
 * Un error de formulario. Además de quedar escrito al lado, sale como aviso abajo de la pantalla: si la persona
 * está lejos del botón (o en el celular), igual se entera. No dibuja nada si no hay mensaje.
 */
export function MensajeError({ children }: { children?: ReactNode }) {
  const toast = useToastOpcional();
  const mensaje = typeof children === "string" ? children : null;
  useEffect(() => {
    if (mensaje) toast?.avisar(mensaje, { tipo: "error" });
  }, [mensaje, toast]);

  if (!children) return null;
  // Sin role="alert": el aviso ya lo anuncia y así no se lee dos veces
  return <p className="text-sm text-error">{children}</p>;
}
