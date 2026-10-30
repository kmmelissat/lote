"use client";

import { useEffect } from "react";
import { PantallaCaida } from "@/components/ui/PantallaCaida";
import { textos } from "@/lib/textos";

const t = textos.errores;

// Si algo falla al armar una pantalla, la persona ve esto en vez de la pantalla genérica de Next.js.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>{`${t.titulo} · ${textos.nombre}`}</title>
      <PantallaCaida error={error} retry={retry} />
    </>
  );
}
