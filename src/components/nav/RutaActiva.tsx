"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

// En rutas dinámicas el pathname solo se conoce en la petición: mientras llega, el enlace se ve igual pero sin marcar.
export function ConRuta({ hijos }: { hijos: (pathname: string | null) => ReactNode }) {
  return (
    <Suspense fallback={hijos(null)}>
      <ConRutaActiva hijos={hijos} />
    </Suspense>
  );
}
function ConRutaActiva({ hijos }: { hijos: (pathname: string | null) => ReactNode }) {
  return <>{hijos(usePathname())}</>;
}
