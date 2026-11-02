"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { AccionRapida } from "./AccionRapida";
import { BOTON_PERFIL, CascaronMenu } from "./CascaronMenu";
import { ListaMenuVertical } from "./ListaMenuVertical";
import { ajustesEscritorio, pestanas, type DatosMenu } from "./menu";
import { Buscar, PrimerosPasos, TarjetaPerfil } from "./PiezasMenu";
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
export function MenuEscritorio({ datos, cerrado, alternarMenu, abrirPaleta, rapida, setRapida }: PropsEscritorio) {
  return (
    <CascaronMenu
      plataforma="escritorio"
      cerrado={cerrado}
      cabecera={
        <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
          <Link href="/inicio" aria-label={textos.nombre} className="px-1">
            <Logo />
          </Link>
          <div className="flex items-center gap-0.5">
            <Buscar abrir={abrirPaleta} soloIcono className="flex size-9 items-center justify-center text-texto-2 hover:text-teal-oscuro" />
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
      }
      cuerpo={
        <>
          <AccionRapida abierta={rapida} alternar={() => setRapida((r) => !r)} />
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
                    slug={datos.slug}
                    esDuena={datos.esDuena}
                  />
                </nav>
              )}
            />
          </div>
          {datos.pasos ? <PrimerosPasos pasos={datos.pasos} /> : null}
        </>
      }
      pie={<TarjetaPerfil perfil={datos.perfil} botonClass={BOTON_PERFIL} />}
    />
  );
}
