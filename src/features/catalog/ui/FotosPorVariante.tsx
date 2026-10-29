"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Valor = { fotos: string[] | null; poner: (fotos: string[] | null) => void };

const Contexto = createContext<Valor>({ fotos: null, poner: () => {} });

/** Junta la galería y la zona de compra: al elegir una variante con fotos propias, la galería muestra esas. */
export function ProveedorFotos({ children }: { children: ReactNode }) {
  const [fotos, poner] = useState<string[] | null>(null);
  return <Contexto value={{ fotos, poner }}>{children}</Contexto>;
}

export const useFotosElegidas = () => useContext(Contexto);
