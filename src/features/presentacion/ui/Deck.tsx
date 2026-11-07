"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import type { Lamina as DatosLamina } from "../laminas";
import { cambioDeLamina } from "../animacion";
import { usePresentacion } from "../usePresentacion";
import { Lamina } from "./Lamina";

const t = textos.presentacion;

/** La presentación: escenario 16:9 (en móvil ocupa toda la pantalla), progreso, controles y notas. */
export function Deck({ laminas, inicial }: { laminas: readonly DatosLamina[]; inicial: number }) {
  const total = laminas.length;
  const { actual, direccion, siguiente, anterior, notas, setNotas, completa, alternarCompleta, gestos } = usePresentacion(total, inicial);
  const lamina = laminas[actual];
  const cambio = cambioDeLamina(!!useReducedMotion());

  return (
    <div className="flex h-dvh flex-col bg-fondo text-texto">
      <header className="flex items-center justify-between gap-4 px-4 py-2">
        <Logo liviano />
        <div
          role="progressbar"
          aria-label={t.progreso}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={actual + 1}
          aria-valuetext={t.lamina(actual + 1, total)}
          className="h-2 flex-1 overflow-hidden rounded-full bg-gris-fondo"
        >
          <div className="h-full rounded-full bg-mango motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${((actual + 1) / total) * 100}%` }} />
        </div>
        <p className="text-sm font-bold tabular-nums" aria-hidden="true">
          {actual + 1} / {total}
        </p>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center md:px-4">
        <div
          {...gestos}
          aria-live="polite"
          className="@container relative size-full touch-pan-y select-none overflow-hidden border-teal-oscuro md:aspect-video md:size-auto md:max-h-full md:w-[min(100%,calc((100dvh-8rem)*16/9))] md:rounded-3xl md:border md:shadow-dura"
        >
          <AnimatePresence custom={direccion} mode="popLayout">
            <motion.div key={lamina.id} custom={direccion} variants={cambio} initial="entra" animate="centro" exit="sale" className="size-full">
              <Lamina lamina={lamina} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {notas && (
        <aside aria-label={t.notasTitulo} className="max-h-[30dvh] overflow-y-auto border-t border-borde bg-superficie px-4 py-3 md:px-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-texto-2">{t.notasTitulo}</h2>
          <p className="mt-1 whitespace-pre-line text-base">{lamina.notas || t.sinNotas}</p>
        </aside>
      )}

      <footer className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="hidden text-sm text-texto-2 md:block">{t.atajos}</p>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <Button variante="secundario" tamano="chico" aria-pressed={notas} onClick={() => setNotas((v) => !v)}>
            {t.notasTitulo}
          </Button>
          <BotonIcono icono="ampliar" etiqueta={completa ? t.salirPantallaCompleta : t.pantallaCompleta} onClick={alternarCompleta} />
          <BotonIcono icono="atras" etiqueta={t.anterior} onClick={anterior} disabled={actual === 0} />
          <BotonIcono icono="adelante" etiqueta={t.siguiente} onClick={siguiente} disabled={actual === total - 1} />
        </div>
      </footer>
    </div>
  );
}
