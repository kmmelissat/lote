"use client";

import { useEffect, type RefObject } from "react";

/** Cierra lo que esté abierto al tocar afuera o apretar Escape. */
export function useCerrarAfuera(abierto: boolean, cerrar: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      // Si el elemento no se ve (el menú de escritorio en el celular), no es de él cerrar.
      if (ref.current && ref.current.offsetParent !== null && !ref.current.contains(e.target as Node)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", afuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", afuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto, cerrar, ref]);
}
