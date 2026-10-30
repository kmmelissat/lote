"use client";

import Link from "next/link";
import { Button, estiloBoton } from "@/components/ui/Button";
import { Gorila } from "@/components/ui/Gorila";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

const t = textos.errores;

function codigoDe(error: unknown) {
  if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string") {
    return error.digest;
  }
  return null;
}

/** La pantalla de “algo se nos cayó”: misma familia que el 404, con reintentar. */
export function PantallaCaida({ error, retry }: { error?: unknown; retry: () => void }) {
  const codigo = codigoDe(error);

  return (
    <main className="flex min-h-dvh flex-col items-center bg-crema px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 self-start font-bold text-teal-oscuro sm:self-center">
        <Gorila className="size-9" />
        {textos.nombre}
      </Link>

      <div className="flex w-full max-w-lg flex-1 flex-col justify-center py-10">
        {/* El monito se asoma por el borde de arriba de la tarjeta */}
        <div className="relative mx-auto -mb-2 h-24 w-40 overflow-hidden" aria-hidden="true">
          <Monito nombre="asoma" className="absolute bottom-0 w-40 text-rosa motion-safe:animate-asomar" />
        </div>

        <section className="relative motion-safe:animate-entra rounded-[28px] border-2 border-teal-oscuro bg-white px-6 pb-8 pt-10 text-center shadow-dura">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 rounded-full border-2 border-teal-oscuro bg-mango px-4 py-1 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {t.etiqueta}
          </span>

          <h1 className="text-3xl font-bold leading-tight text-teal-oscuro">{t.titulo}</h1>
          <p className="mt-2 text-lg text-texto-2">{t.texto}</p>

          <div className="mx-auto mt-6 max-w-sm -rotate-1 rounded-2xl bg-limon p-4 text-left">
            <p className="text-sm font-bold text-teal-oscuro">{t.pistasTitulo}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-teal-oscuro">
              {t.pistas.map((pista) => (
                <li key={pista} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mango" />
                  {pista}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" variante="mango" onClick={() => retry()}>
              {t.reintentar}
            </Button>
            {/* Recarga completa: si el cliente quedó a medias, un Link de Next no alcanza */}
            <a href="/" className={estiloBoton("secundario")}>
              {t.inicio}
            </a>
          </div>

          {codigo && (
            <p className="mt-6 text-xs text-texto-2">
              {t.codigo}: {codigo}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
