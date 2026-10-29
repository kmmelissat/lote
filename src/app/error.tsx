"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

const t = textos.errores;

// Si algo falla al armar una pantalla, la persona ve esto en vez de la pantalla genérica de Next.js.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-crema px-4 py-10">
      <EmptyState
        monito="asoma"
        titulo={t.titulo}
        texto={t.texto}
        accion={
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variante="mango" onClick={() => retry()}>
              {t.reintentar}
            </Button>
            <ButtonLink href="/" variante="secundario">
              {t.inicio}
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
