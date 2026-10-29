"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, pestanas, type DatosMenu, type Pestana } from "./menu";
import { ConRuta } from "./RutaActiva";

const t = textos.nav;

// Hoja desde abajo (móvil): sirve para la acción rápida y para "Más".
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
        className="w-full rounded-t-[28px] border-2 border-b-0 border-teal-oscuro bg-crema p-4 pb-8"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label={t.cerrar}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/70"
          >
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BarraMovil({ datos, rapida, abrirRapida, masAbierto, abrirMas }: {
  datos: DatosMenu;
  rapida: boolean;
  abrirRapida: () => void;
  masAbierto: boolean;
  abrirMas: () => void;
}) {
  const enlace = (p: Pestana, pathname: string | null) => {
    const activa = pathname !== null && activaEn(pathname, p.href);
    return (
      <Link
        href={p.href}
        aria-current={activa ? "page" : undefined}
        aria-label={p.etiqueta}
        className={`relative flex size-11 items-center justify-center rounded-full transition-colors duration-150 ${
          activa ? "bg-teal-fondo text-teal-oscuro ring-2 ring-teal-oscuro" : "text-texto-2 hover:bg-teal-fondo"
        }`}
      >
        <Icon nombre={p.icono} className="size-5" />
        {p.href === "/pedidos" && datos.porAtender > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-oscuro px-1 text-[10px] font-bold text-white">
            <span className="sr-only">{t.porAtender(datos.porAtender)}: </span>
            {datos.porAtender}
            {datos.urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-superficie bg-mango" />}
          </span>
        )}
      </Link>
    );
  };
  return (
    <nav aria-label="Principal" className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 md:hidden">
      <ConRuta
        hijos={(pathname) => (
          <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border-2 border-teal-oscuro bg-superficie p-2 shadow-dura-chica">
            <li>{enlace(pestanas[0], pathname)}</li>
            <li>{enlace(pestanas[1], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirRapida}
                aria-label={t.rapida.titulo}
                aria-expanded={rapida}
                className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango text-teal-oscuro shadow-dura-chica transition-transform duration-150 active:scale-95"
              >
                <Icon nombre="mas" className="size-7" strokeWidth={2.25} />
              </button>
            </li>
            <li>{enlace(pestanas[2], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirMas}
                aria-label={t.mas}
                aria-expanded={masAbierto}
                className="flex size-11 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo"
              >
                <Icon nombre="mas_opciones" className="size-5" />
              </button>
            </li>
          </ul>
        )}
      />
    </nav>
  );
}
