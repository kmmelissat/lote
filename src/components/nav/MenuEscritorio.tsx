"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { BOTON_PERFIL, CascaronMenu } from "./CascaronMenu";
import { ListaMenuVertical } from "./ListaMenuVertical";
import { ajustesEscritorio, pestanas, type DatosMenu } from "./menu";
import { Buscar, TarjetaPerfil } from "./PiezasMenu";
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

/** Escritorio: el menú lateral, flotando a la izquierda; se puede recoger a solo íconos. */
export function MenuEscritorio({ datos, cerrado, alternarMenu, abrirPaleta }: PropsEscritorio) {
  return (
    <CascaronMenu
      plataforma="escritorio"
      cerrado={cerrado}
      cabecera={
        <div className="relative flex items-center justify-center gap-2 group-data-[cerrado]:flex-col">
          <Link href="/inicio" aria-label={textos.nombre} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-superficie/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/punch.svg" alt="" className="size-11 shrink-0" />
            <span className="font-logo text-[30px] font-bold lowercase leading-none text-teal-oscuro group-data-[cerrado]:hidden">
              punch<span className="text-ficha-celeste brightness-90">.</span>
            </span>
          </Link>
          <div className="absolute right-0 top-1/2 mt-2 flex -translate-y-1/2 items-center gap-0.5 group-data-[cerrado]:static group-data-[cerrado]:translate-y-0">
            <button
              type="button"
              onClick={alternarMenu}
              aria-expanded={!cerrado}
              aria-label={cerrado ? t.abrirMenu : t.cerrarMenu}
              title={cerrado ? t.abrirMenu : t.cerrarMenu}
              className="flex size-9 shrink-0 items-center justify-center text-texto-2 hover:text-teal-oscuro"
            >
              <Icon nombre={cerrado ? "panelAbrir" : "panelCerrar"} className="size-5" />
            </button>
          </div>
        </div>
      }
      cuerpo={
        <>
          <Buscar
            abrir={abrirPaleta}
            className="flex h-11 items-center gap-2.5 rounded-[14px] border border-linea bg-superficie px-3 text-sm text-texto-2 shadow-xs hover:border-teal-oscuro/40 group-data-[cerrado]:mx-auto group-data-[cerrado]:size-12 group-data-[cerrado]:justify-center group-data-[cerrado]:border-transparent group-data-[cerrado]:bg-transparent group-data-[cerrado]:px-0 group-data-[cerrado]:shadow-none group-data-[cerrado]:hover:bg-superficie/60 group-data-[cerrado]:hover:text-teal-oscuro"
          />
          {/* El margen negativo con relleno deja lugar para la sombra y el levantarse del cuadro activo, que si no el scroll los recorta */}
          <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1 mt-2">
            <ConRuta
              hijos={(ruta) => (
                <nav aria-label="Principal">
                  <ListaMenuVertical
                    items={datos.esDuena ? [...pestanas, ...ajustesEscritorio] : pestanas}
                    ruta={ruta}
                    porAtender={datos.porAtender}
                    urgente={datos.urgente}
                    enCamino={datos.enCamino}
                    slug={datos.slug}
                    esDuena={datos.esDuena}
                  />
                </nav>
              )}
            />
          </div>
        </>
      }
      pie={<TarjetaPerfil perfil={datos.perfil} botonClass={BOTON_PERFIL} />}
    />
  );
}
