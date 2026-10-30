"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, pestanas, type DatosMenu, type Pestana } from "./menu";
import { ConRuta } from "./RutaActiva";

const t = textos.nav;

// Hoja desde abajo (móvil): el resto del ticket, para la acción rápida y para "Más".
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
        <div className="flex items-start justify-between gap-3 bg-celeste-palido px-4 pb-3 pt-4">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="-rotate-1 self-start rounded-sm border-2 border-teal-oscuro bg-rosa px-2 py-0.5 font-logo text-[10px] tracking-widest text-teal-oscuro uppercase shadow-dura-chica">
              {t.turno}
            </span>
            <h2 className="text-lg font-bold">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label={t.cerrar}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-white/70"
          >
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        <div className="border-b-2 border-dashed border-teal-oscuro" />
        <div className="p-4 pb-8">{children}</div>
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
        className={`relative flex size-12 items-center justify-center rounded-full transition-colors duration-150 ${
          activa ? "text-teal-oscuro" : "text-texto-2 hover:text-teal-oscuro"
        }`}
      >
        <Icon nombre={p.icono} className="size-6" />
        {activa && <span aria-hidden="true" className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-rosa" />}
        {p.href === "/pedidos" && datos.porAtender > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-oscuro px-1 text-[10px] font-bold text-white">
            <span className="sr-only">{t.porAtender(datos.porAtender)}: </span>
            {datos.porAtender}
            {datos.urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-crema bg-rosa" />}
          </span>
        )}
      </Link>
    );
  };
  return (
    <nav aria-label="Principal" className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 md:hidden">
      <ConRuta
        hijos={(pathname) => (
          <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border-2 border-teal-oscuro bg-crema p-2 shadow-dura-chica">
            <li>{enlace(pestanas[0], pathname)}</li>
            <li>{enlace(pestanas[1], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirRapida}
                aria-label={t.rapida.titulo}
                aria-expanded={rapida}
                className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-celeste text-teal-oscuro shadow-dura-chica transition-transform duration-150 active:scale-95"
              >
                <Icon nombre="mas" className="size-8" strokeWidth={2.25} />
              </button>
            </li>
            <li>{enlace(pestanas[2], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirMas}
                aria-label={t.mas}
                aria-expanded={masAbierto}
                className="flex size-12 items-center justify-center rounded-full text-texto-2 hover:text-teal-oscuro"
              >
                <Icon nombre="mas_opciones" className="size-6" />
              </button>
            </li>
          </ul>
        )}
      />
    </nav>
  );
}
