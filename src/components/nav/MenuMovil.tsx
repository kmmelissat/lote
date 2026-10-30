"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, pestanas, type DatosMenu, type Pestana } from "./menu";
import { ConRuta } from "./RutaActiva";

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

function Huecos({ lado }: { lado: "left" | "right" }) {
  return (
    <span aria-hidden="true" className={`absolute top-1/2 flex -translate-y-1/2 flex-col gap-1.5 ${lado === "left" ? "-left-1.5" : "-right-1.5"}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2.5 rounded-full border-2 border-teal-oscuro bg-superficie" />
      ))}
    </span>
  );
}

function Celda({ p, pathname, datos }: { p: Pestana; pathname: string | null; datos: DatosMenu }) {
  const activa = pathname !== null && activaEn(pathname, p.href);
  return (
    <Link
      href={p.href}
      aria-current={activa ? "page" : undefined}
      aria-label={p.etiqueta}
      className={`relative flex h-12 flex-1 items-center justify-center ${activa ? "text-teal-oscuro" : "text-texto-2"}`}
    >
      <Icon nombre={p.icono} className="size-6" />
      {activa && <span aria-hidden="true" className="absolute bottom-1 h-0.5 w-5 rounded-full bg-rosa" />}
      {p.href === "/pedidos" && <Punto datos={datos} />}
    </Link>
  );
}

export function BarraMovil({
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
    <nav aria-label="Principal" className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 md:hidden">
      <ConRuta
        hijos={(pathname) => (
          <div className="relative mx-auto max-w-md">
            <Huecos lado="left" />
            <Huecos lado="right" />
            <ul className="grid grid-cols-5 items-stretch overflow-visible rounded-sm border-2 border-teal-oscuro bg-crema py-1 shadow-dura-chica">
            <li className="flex border-r-2 border-dashed border-teal-oscuro">
              <Celda p={pestanas[0]} pathname={pathname} datos={datos} />
            </li>
            <li className="flex border-r-2 border-dashed border-teal-oscuro">
              <Celda p={pestanas[1]} pathname={pathname} datos={datos} />
            </li>
            <li className="flex items-center justify-center border-r-2 border-dashed border-teal-oscuro">
              <button
                type="button"
                onClick={abrirRapida}
                aria-label={t.rapida.titulo}
                aria-expanded={rapida}
                className="-rotate-2 flex size-10 items-center justify-center rounded-sm border-2 border-teal-oscuro bg-celeste text-teal-oscuro shadow-dura-chica"
              >
                <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
              </button>
            </li>
            <li className="flex border-r-2 border-dashed border-teal-oscuro">
              <Celda p={pestanas[2]} pathname={pathname} datos={datos} />
            </li>
            <li className="flex">
              <button type="button" onClick={abrirMas} aria-label={t.mas} aria-expanded={masAbierto} className="flex h-12 w-full items-center justify-center text-texto-2">
                <Icon nombre="mas_opciones" className="size-6" />
              </button>
            </li>
            </ul>
          </div>
        )}
      />
    </nav>
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
        className="w-full overflow-hidden rounded-t-[28px] border-2 border-b-0 border-teal-oscuro bg-crema"
      >
        <div className="flex items-start justify-between gap-3 bg-celeste-palido px-5 pt-5 pb-4">
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
        <div className="border-b-2 border-dashed border-teal-oscuro" />
        <div className="p-5 pb-10">{children}</div>
      </div>
    </div>
  );
}
