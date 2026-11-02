"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { ajustesEscritorio, pestanas, type DatosMenu } from "./menu";
import { ListaPestanas } from "./MenuEscritorio";
import { Buscar, PrimerosPasos, TarjetaPerfil } from "./PiezasMenu";

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
 * y abajo ahora van los botones de guardar. Lleva el botón del menú lateral, el logo y la acción rápida (+).
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={abrirMas}
          aria-label={t.menuAbrir}
          aria-expanded={masAbierto}
          aria-haspopup="dialog"
          className="relative flex size-11 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro shadow-dura-chica"
        >
          <Icon nombre="menu" className="size-6" />
          <Punto datos={datos} />
        </button>
        <Link href="/inicio" aria-label={t.inicio} className="group">
          <Logo />
        </Link>
      </div>
      <button
        type="button"
        onClick={abrirRapida}
        aria-label={t.rapida.titulo}
        aria-expanded={rapida}
        className="-rotate-2 flex size-11 items-center justify-center rounded-sm border-2 border-teal-oscuro bg-celeste text-teal-oscuro shadow-dura-chica"
      >
        <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
      </button>
    </header>
  );
}

/** El menú del celular: el mismo ticket del escritorio, que entra desde la izquierda y tapa el resto con un velo. */
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

  const enlace = "flex min-h-14 min-w-0 flex-1 items-center gap-3 pl-1 text-base font-medium text-texto-2 hover:text-teal";
  return (
    <div className="fixed inset-0 z-40 bg-teal-oscuro/40 md:hidden" onClick={cerrar}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.masTitulo}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(20rem,85vw)] flex-col border-r-2 border-teal-oscuro bg-crema motion-safe:animate-lateral"
      >
        <div className="flex shrink-0 flex-col gap-2 bg-celeste-palido py-4 pl-6 pr-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/inicio" aria-label={textos.nombre} className="px-1">
              <Logo />
            </Link>
            <div className="flex items-center">
              <Buscar
                abrir={() => {
                  cerrar();
                  abrirPaleta();
                }}
                soloIcono
                className="flex size-11 items-center justify-center text-texto-2 hover:text-teal-oscuro"
              />
              <button type="button" onClick={cerrar} aria-label={t.cerrar} className="flex size-11 items-center justify-center text-texto-2 hover:text-teal-oscuro">
                <Icon nombre="x" className="size-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="shrink-0 border-b-2 border-dashed border-teal-oscuro" />
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 pl-6 pr-5">
          {/* Las secciones y los enlaces a la vitrina y al Marketplace son una sola lista: sin espacio entre una y otra */}
          <div>
            <nav aria-label="Principal">
              <ListaPestanas
                items={datos.esDuena ? [...pestanas, ...ajustesEscritorio] : pestanas}
                ruta={ruta}
                porAtender={datos.porAtender}
                urgente={datos.urgente}
                slug={datos.slug}
                grande
              />
            </nav>
            <ul className="flex flex-col">
              {datos.slug && !datos.esDuena && (
                <li className="flex items-center border-b border-dashed border-teal-oscuro/30">
                  <Link href={`/c/${datos.slug}`} target="_blank" rel="noreferrer" className={enlace}>
                    <Icon nombre="tienda" className="size-6 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{t.vitrina}</span>
                    <span className="flex size-11 shrink-0 items-center justify-center">
                      <Icon nombre="enlace" className="size-5" />
                    </span>
                  </Link>
                </li>
              )}
              <li className="flex items-center border-b border-dashed border-teal-oscuro/30">
                <Link href="/marketplace" target="_blank" rel="noreferrer" className={enlace}>
                  <Icon nombre="explorar" className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t.explorar}</span>
                  <span className="flex size-11 shrink-0 items-center justify-center">
                    <Icon nombre="enlace" className="size-5" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          {datos.pasos ? <PrimerosPasos pasos={datos.pasos} /> : null}
        </div>
        <div className="shrink-0 border-t-2 border-dashed border-teal-oscuro bg-rosa-palido py-2 pl-6 pr-5">
          <TarjetaPerfil perfil={datos.perfil} botonClass="flex min-h-12 w-full items-center gap-3 bg-transparent p-1 text-left" />
        </div>
      </aside>
    </div>
  );
}
