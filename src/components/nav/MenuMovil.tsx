"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import type { DatosMenu } from "./menu";

const t = textos.nav;

function Punto({ datos }: { datos: DatosMenu }) {
  if (datos.porAtender === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-oscuro px-1 text-[10px] font-bold text-white">
      <span className="sr-only">{t.porAtender(datos.porAtender)}: </span>
      {datos.porAtender}
      {datos.urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-crema bg-rosa" />}
    </span>
  );
}

/**
 * El encabezado del celular: arriba, junto al contenido, y no una barra de pestañas abajo. Es un sitio y no una app,
 * y abajo ahora van los botones de guardar. Lleva el logo, la acción rápida (+) y el menú con todas las pantallas.
 */
export function EncabezadoMovil({
  datos,
  rapida,
  abrirRapida,
  masAbierto,
  abrirMas,
}: {
  datos: DatosMenu;
  rapida: boolean;
  abrirRapida: () => void;
  masAbierto: boolean;
  abrirMas: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b-2 border-teal-oscuro bg-crema px-4 py-2 md:hidden">
      <Link href="/inicio" aria-label={t.inicio} className="group">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={abrirRapida}
          aria-label={t.rapida.titulo}
          aria-expanded={rapida}
          className="-rotate-2 flex size-11 items-center justify-center rounded-sm border-2 border-teal-oscuro bg-celeste text-teal-oscuro shadow-dura-chica"
        >
          <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={abrirMas}
          aria-label={t.menuAbrir}
          aria-expanded={masAbierto}
          className="relative flex size-11 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro shadow-dura-chica"
        >
          <Icon nombre="mas_opciones" className="size-6" />
          <Punto datos={datos} />
        </button>
      </div>
    </header>
  );
}

export function Hoja({ titulo, cerrar, children }: { titulo: string; cerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [cerrar]);
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-teal-oscuro/40 md:hidden" onClick={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(85dvh,100dvh-2rem)] w-full flex-col overflow-hidden rounded-t-[28px] border-2 border-b-0 border-teal-oscuro bg-crema"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-celeste-palido px-5 pt-5 pb-4">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="-rotate-1 self-start rounded-sm border-2 border-teal-oscuro bg-rosa px-2 py-0.5 font-logo text-[10px] tracking-widest text-teal-oscuro uppercase shadow-dura-chica">
              {t.turno}
            </span>
            <h2 className="text-lg font-bold">{titulo}</h2>
          </div>
          <button type="button" onClick={cerrar} aria-label={t.cerrar} className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-white/70">
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        <div className="shrink-0 border-b-2 border-dashed border-teal-oscuro" />
        <div className="min-h-0 overflow-y-auto p-5 pb-10">{children}</div>
      </div>
    </div>
  );
}
