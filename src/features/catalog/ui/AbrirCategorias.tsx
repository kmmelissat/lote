"use client";

import type { ReactNode } from "react";

/** Abre el menú de categorías del encabezado (a pantalla completa en el celular). Lo escucha `MenuCategorias`. */
export function AbrirCategorias({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-haspopup="true" onClick={() => window.dispatchEvent(new Event("lote:abrir-categorias"))} className={className}>
      {children}
    </button>
  );
}
