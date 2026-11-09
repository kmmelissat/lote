"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { BOTON_PERFIL, CascaronMenu } from "./CascaronMenu";
import { ListaMenuVertical } from "./ListaMenuVertical";
import { ajustesEscritorio, pestanas, type DatosMenu } from "./menu";
import { Buscar, TarjetaPerfil } from "./PiezasMenu";

const t = textos.nav;

/** El iso con "punch." (el mismo del menú de escritorio). */
function LogoPunch() {
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/punch.svg" alt="" className="size-11 shrink-0" />
      <span className="font-logo text-[32px] font-bold lowercase leading-none text-teal-oscuro">
        punch<span className="text-ficha-celeste brightness-90">.</span>
      </span>
    </span>
  );
}

function Punto({ datos }: { datos: DatosMenu }) {
  if (datos.porAtender === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-oscuro px-1 text-[10px] font-bold text-white">
      <span className="sr-only">{t.porAtender(datos.porAtender)}: </span>
      {datos.porAtender}
      {datos.urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border border-white bg-rosa" />}
    </span>
  );
}

/**
 * El encabezado del celular: arriba, junto al contenido, y no una barra de pestañas abajo. Es un sitio y no una app,
 * y abajo ahora van los botones de guardar. Lleva el botón del menú lateral, el logo y el acceso al asistente.
 */
export function EncabezadoMovil({
  datos,
  masAbierto,
  abrirMas,
}: {
  datos: DatosMenu;
  masAbierto: boolean;
  abrirMas: () => void;
}) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sticky top-0 z-30 bg-[#eef7fb] px-3 py-2 md:hidden">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={abrirMas}
          aria-label={t.menuAbrir}
          aria-expanded={masAbierto}
          aria-haspopup="dialog"
          className="relative flex size-11 items-center justify-center text-teal-oscuro"
        >
          <Icon nombre="menu" className="size-6" />
          <Punto datos={datos} />
        </button>
      </div>
      <Link href="/inicio" aria-label={t.inicio} className="group">
        <LogoPunch />
      </Link>
      <Link
        href="/asistente"
        aria-label={t.asistente}
        className="justify-self-end flex size-11 items-center justify-center text-teal-oscuro"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/punch-ai-icon.svg" alt="" className="size-8" />
      </Link>
    </header>
  );
}

/** El menú del celular: el mismo menú del escritorio, con el tema elegido, que entra desde la izquierda y tapa el resto con un velo. */
export function BarraLateral({
  datos,
  ruta,
  abrirPaleta,
  cerrar,
}: {
  datos: DatosMenu;
  ruta: string;
  abrirPaleta: () => void;
  cerrar: () => void;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    // Con el menú abierto, la página de atrás no se desplaza
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [cerrar]);

  const buscar = (
    <Buscar
      abrir={() => {
        cerrar();
        abrirPaleta();
      }}
      soloIcono
      className="flex size-11 items-center justify-center text-texto-2 hover:text-teal-oscuro"
    />
  );
  const cerrarBoton = (
    <button
      type="button"
      onClick={cerrar}
      aria-label={t.cerrar}
      className="flex size-11 items-center justify-center text-texto-2 hover:text-teal-oscuro"
    >
      <Icon nombre="x" className="size-5" />
    </button>
  );
  return (
    <div className="fixed inset-0 z-40 bg-teal-oscuro/30 md:hidden" onClick={cerrar}>
      <CascaronMenu
        plataforma="movil"
        desplazable
        role="dialog"
        aria-modal="true"
        aria-label={t.masTitulo}
        onClick={(e) => e.stopPropagation()}
        cabecera={
          <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
            <Link href="/inicio" aria-label={textos.nombre} className="px-1">
              <LogoPunch />
            </Link>
            <div className="flex items-center group-data-[cerrado]:flex-col">
              {buscar}
              {cerrarBoton}
            </div>
          </div>
        }
        cuerpo={
          <>
            <div className="-m-1 p-1">
            <nav aria-label="Principal">
              <ListaMenuVertical
                items={datos.esDuena ? [...pestanas, ...ajustesEscritorio] : pestanas}
                ruta={ruta}
                porAtender={datos.porAtender}
                urgente={datos.urgente}
                enCamino={datos.enCamino}
                slug={datos.slug}
                esDuena={datos.esDuena}
                grande
              />
            </nav>
            </div>
            </>
        }
        pie={<TarjetaPerfil perfil={datos.perfil} botonClass={BOTON_PERFIL} />}
      />
    </div>
  );
}
