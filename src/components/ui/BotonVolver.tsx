"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Vuelve a la página anterior; si se entró directo (sin historial), lleva a `respaldo`. */
export function BotonVolver({ respaldo = "/", className = "", children }: { respaldo?: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(respaldo))} className={className}>
      {children}
    </button>
  );
}
