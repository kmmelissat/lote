"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { textos } from "@/lib/textos";
import { activaEn, type DatosMenu, type Pestana } from "./menu";
import { useCerrarAfuera } from "./useCerrarAfuera";
import { itemMenu } from "./versiones";

const t = textos.nav;

export function Insignia({ n, urgente }: { n: number; urgente: boolean }) {
  if (n === 0) return null;
  return (
    <span className="relative flex shrink-0 group-data-[cerrado]:absolute group-data-[cerrado]:right-1 group-data-[cerrado]:top-0.5">
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-oscuro px-1.5 text-xs font-bold text-white">
        <span className="sr-only">{textos.nav.porAtender(n)}: </span>
        {n}
      </span>
      {urgente && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-crema bg-mango group-data-[vista=pildoras]:bg-rosa group-data-[vista=faja]:bg-rosa group-data-[vista=lista]:bg-rosa" />
      )}
    </span>
  );
}

export function EnlaceLateral({
  pestana,
  pathname,
  insignia,
}: {
  pestana: Pestana;
  pathname: string | null;
  insignia?: ReactNode;
}) {
  const activa = pathname !== null && activaEn(pathname, pestana.href);
  return (
    <Link
      href={pestana.href}
      aria-current={activa ? "page" : undefined}
      title={pestana.etiqueta}
      className={`${itemMenu.base} ${activa ? itemMenu.activa : itemMenu.inactiva}`}
    >
      {activa && (
        <span
          aria-hidden="true"
          className="absolute -left-3.5 top-2 h-7 w-1.5 rounded-r-full bg-mango group-data-[vista=pildoras]:hidden group-data-[vista=faja]:hidden group-data-[vista=lista]:hidden"
        />
      )}
      <Icon nombre={pestana.icono} className="size-6 shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5" />
      <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">{pestana.etiqueta}</span>
      {insignia}
    </Link>
  );
}

export function Vitrina({ slug }: { slug: string }) {
  const { avisar } = useToast();
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`);
      avisar(t.enlaceCopiado, { tipo: "exito" });
    } catch {
      avisar(t.enlaceNoCopiado, { tipo: "error" });
    }
  };
  return (
    <div className="flex items-center gap-1 group-data-[cerrado]:flex-col">
      <Link
        href={`/c/${slug}`}
        target="_blank"
        title={t.verVitrina}
        className={`${itemMenu.base} ${itemMenu.inactiva} min-w-0 flex-1 group-data-[cerrado]:flex-none`}
      >
        <Icon nombre="tienda" className="size-6 shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5" />
        <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">{t.vitrina}</span>
        <Icon nombre="enlace" className="size-4 shrink-0 group-data-[cerrado]:hidden" />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </Link>
      <button
        type="button"
        onClick={copiar}
        aria-label={t.copiarEnlace}
        title={t.copiarEnlace}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-white/70 hover:text-teal-oscuro group-data-[vista=pildoras]:rounded-full group-data-[vista=lista]:rounded-none"
      >
        <Icon nombre="copiar" className="size-4" />
      </button>
    </div>
  );
}

export function Buscar({ abrir }: { abrir: () => void }) {
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={t.paleta.abrir}
      title={`${t.paleta.abrir} (${t.paleta.atajo})`}
      className="flex min-h-11 items-center gap-3 px-3 text-texto-2 group-data-[cerrado]:justify-center group-data-[vista=isla]:rounded-xl group-data-[vista=isla]:border group-data-[vista=isla]:border-borde group-data-[vista=isla]:bg-superficie group-data-[vista=isla]:hover:border-borde-control group-data-[vista=pildoras]:rounded-full group-data-[vista=pildoras]:border-2 group-data-[vista=pildoras]:border-teal-oscuro group-data-[vista=pildoras]:bg-fondo group-data-[vista=faja]:rounded-lg group-data-[vista=faja]:bg-white/70 group-data-[vista=lista]:rounded-none group-data-[vista=lista]:border-b-2 group-data-[vista=lista]:border-teal-oscuro/25 group-data-[vista=lista]:px-1"
    >
      <Icon nombre="buscar" className="size-5 shrink-0" />
      <span className="flex-1 text-left group-data-[cerrado]:hidden">{t.buscarCorto}</span>
      <kbd className="rounded-md border border-borde px-1.5 py-0.5 text-xs group-data-[cerrado]:hidden group-data-[vista=pildoras]:hidden group-data-[vista=lista]:border-0">{t.paleta.atajo}</kbd>
    </button>
  );
}

export function PrimerosPasos({ pasos }: { pasos: NonNullable<DatosMenu["pasos"]> }) {
  return (
    <Link
      href={pasos.siguiente.href}
      className="relative mt-auto flex flex-col gap-2 overflow-hidden p-3 text-teal-oscuro group-data-[cerrado]:hidden group-data-[vista=isla]:rounded-2xl group-data-[vista=isla]:border-2 group-data-[vista=isla]:border-teal-oscuro group-data-[vista=isla]:bg-limon group-data-[vista=isla]:transition-[transform,box-shadow] group-data-[vista=isla]:duration-150 group-data-[vista=isla]:hover:-translate-y-0.5 group-data-[vista=isla]:hover:shadow-dura-chica group-data-[vista=pildoras]:rounded-[1.75rem] group-data-[vista=pildoras]:border-2 group-data-[vista=pildoras]:border-teal-oscuro group-data-[vista=pildoras]:bg-rosa-palido group-data-[vista=faja]:rounded-lg group-data-[vista=faja]:bg-white/60 group-data-[vista=lista]:rounded-none group-data-[vista=lista]:border-0 group-data-[vista=lista]:bg-transparent group-data-[vista=lista]:px-1"
    >
      <Gorila className="absolute -right-1 -top-1 size-12 rotate-6 text-rosa group-data-[vista=lista]:hidden" />
      <span className="text-sm font-bold">
        {t.pasos.titulo} · {t.pasos.avance(pasos.hechos, pasos.total)}
      </span>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={pasos.total}
        aria-valuenow={pasos.hechos}
        aria-label={t.pasos.titulo}
        className="h-2.5 w-3/4 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white group-data-[vista=lista]:hidden"
      >
        <span className="block h-full bg-mango group-data-[vista=pildoras]:bg-rosa group-data-[vista=faja]:bg-teal group-data-[vista=lista]:bg-rosa" style={{ width: `${(pasos.hechos / pasos.total) * 100}%` }} />
      </span>
      <span className="text-sm">
        {t.pasos.siguiente}: {pasos.siguiente.titulo} →
      </span>
    </Link>
  );
}

/** La tarjeta de quien está: al tocarla se abre un menú con Ajustes y Cerrar sesión, así salir nunca es un toque accidental. */
export function TarjetaPerfil({ perfil }: { perfil: DatosMenu["perfil"] }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useCerrarAfuera(abierto, () => setAbierto(false), ref);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={t.menuPerfil}
        className="flex min-h-12 w-full items-center gap-3 p-1.5 text-left group-data-[cerrado]:justify-center group-data-[vista=isla]:rounded-xl group-data-[vista=isla]:border-2 group-data-[vista=isla]:border-teal-oscuro/15 group-data-[vista=isla]:bg-superficie group-data-[vista=isla]:hover:border-teal-oscuro group-data-[vista=pildoras]:rounded-full group-data-[vista=pildoras]:border-2 group-data-[vista=pildoras]:border-teal-oscuro/20 group-data-[vista=pildoras]:bg-fondo group-data-[vista=faja]:rounded-lg group-data-[vista=faja]:bg-white/50 group-data-[vista=lista]:rounded-none group-data-[vista=lista]:px-1"
      >
        {perfil.logo ? (
          <Image src={perfil.logo} alt="" width={80} height={80} className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rosa text-teal-oscuro">
            <Icon nombre="usuario" className="size-5" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[cerrado]:hidden">
          <span className="truncate text-sm font-bold">{perfil.nombre}</span>
          <span className="text-xs text-texto-2">{perfil.detalle}</span>
        </span>
        <Icon nombre="flecha" className="size-4 shrink-0 text-texto-2 group-data-[cerrado]:hidden" />
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-60 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura"
        >
          <Link
            href={textos.ayuda.ruta}
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium hover:bg-teal-fondo"
          >
            <Icon nombre="info" className="size-5 shrink-0" />
            {t.ayuda}
          </Link>
          <Link
            href="/ajustes"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium hover:bg-teal-fondo"
          >
            <Icon nombre="ajustes" className="size-5 shrink-0" />
            {t.ajustes}
          </Link>
          <CerrarSesion variante="menu" />
        </div>
      )}
    </div>
  );
}
