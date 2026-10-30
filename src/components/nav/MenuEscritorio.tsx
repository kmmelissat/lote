"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { AccionRapida } from "./AccionRapida";
import { activaEn, pestanas, type DatosMenu } from "./menu";
import { Buscar, Insignia, PrimerosPasos, TarjetaPerfil } from "./PiezasMenu";
import { ConRuta } from "./RutaActiva";

const t = textos.nav;

export type PropsEscritorio = {
  datos: DatosMenu;
  cerrado: boolean;
  alternarMenu: () => void;
  abrirPaleta: () => void;
  rapida: boolean;
  setRapida: (v: boolean | ((r: boolean) => boolean)) => void;
};

/** Escritorio: ticket de mercado, flotando a la izquierda. */
export function MenuEscritorio({ datos, cerrado, alternarMenu, abrirPaleta, rapida, setRapida }: PropsEscritorio) {
  return (
    <aside
      data-cerrado={cerrado ? "" : undefined}
      className={`group sticky top-3 my-3 ml-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col border-2 border-teal-oscuro bg-crema shadow-dura-chica md:flex ${
        cerrado ? "w-[4.75rem]" : "w-64"
      }`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex flex-col justify-around">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="size-3 -translate-x-1.5 rounded-full bg-superficie shadow-[inset_0_0_0_2px_var(--color-teal-oscuro)]" />
          ))}
        </div>
        <div className="flex flex-col gap-2 bg-celeste-palido py-4 pl-6 pr-5">
          <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
            <Link href="/inicio" aria-label={textos.nombre} className="px-1">
              <Logo />
            </Link>
            <div className="flex items-center gap-0.5">
              <Buscar
                abrir={abrirPaleta}
                soloIcono
                className="flex size-9 items-center justify-center text-texto-2 hover:text-teal-oscuro"
              />
              <button
                type="button"
                onClick={alternarMenu}
                aria-expanded={!cerrado}
                aria-label={cerrado ? t.abrirMenu : t.cerrarMenu}
                title={cerrado ? t.abrirMenu : t.cerrarMenu}
                className="flex size-9 shrink-0 items-center justify-center text-texto-2 hover:text-teal-oscuro"
              >
                <Icon nombre="panel" className="size-5" />
              </button>
            </div>
          </div>
          <p className="-rotate-1 self-start rounded-sm border-2 border-teal-oscuro bg-rosa px-2 py-0.5 font-logo text-xs tracking-widest text-teal-oscuro uppercase shadow-dura-chica group-data-[cerrado]:hidden">
            {t.turno}
          </p>
        </div>
        <div className="border-b-2 border-dashed border-teal-oscuro" />
        <div className="flex min-h-0 flex-1 flex-col gap-3 py-4 pl-6 pr-5">
          <AccionRapida abierta={rapida} alternar={(abrir) => setRapida((r) => abrir ?? !r)} tieneLocal={datos.tieneLocal} />
          <nav aria-label="Principal" className="min-h-0 flex-1 overflow-y-auto">
            <ConRuta
              hijos={(ruta) => (
                <ul className="flex flex-col">
                  {pestanas.map((p) => {
                    const activa = ruta !== null && activaEn(ruta, p.href);
                    return (
                      <li key={p.href} className="border-b border-dashed border-teal-oscuro/30">
                        <Link
                          href={p.href}
                          aria-current={activa ? "page" : undefined}
                          title={p.etiqueta}
                          className={`flex min-h-12 items-center gap-3 px-1 text-sm group-data-[cerrado]:justify-center ${
                            activa ? "font-bold text-teal-oscuro" : "font-medium text-texto-2 hover:text-teal"
                          }`}
                        >
                          <Icon nombre={p.icono} className="size-5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">
                            <span className={activa ? "underline decoration-rosa decoration-2 underline-offset-2" : undefined}>{p.etiqueta}</span>
                          </span>
                          {p.href === "/pedidos" && <Insignia n={datos.porAtender} urgente={datos.urgente} />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            />
          </nav>
          {datos.pasos ? <PrimerosPasos pasos={datos.pasos} /> : null}
        </div>
        <div className="border-t-2 border-dashed border-teal-oscuro bg-rosa-palido py-2 pl-6 pr-5">
          <TarjetaPerfil
            perfil={datos.perfil}
            botonClass="flex min-h-12 w-full items-center gap-3 bg-transparent p-1 text-left group-data-[cerrado]:justify-center"
          />
        </div>
      </div>
    </aside>
  );
}
