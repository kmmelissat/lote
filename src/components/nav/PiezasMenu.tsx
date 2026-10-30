"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { textos } from "@/lib/textos";
import { type DatosMenu } from "./menu";
import { useCerrarAfuera } from "./useCerrarAfuera";

const t = textos.nav;

/** Abre la vitrina pública en otra pestaña. Va al lado de Mi tienda. */
export function AbrirVitrina({ slug, className }: { slug: string; className?: string }) {
  return (
    <Link
      href={`/c/${slug}`}
      target="_blank"
      rel="noreferrer"
      aria-label={t.verVitrina}
      title={t.verVitrina}
      className={className ?? "flex size-11 shrink-0 items-center justify-center text-texto-2 hover:text-teal"}
    >
      <Icon nombre="enlace" className="size-4" />
      <span className="sr-only">{textos.explorar.sobre.nuevaPestana}</span>
    </Link>
  );
}

export function Insignia({ n, urgente }: { n: number; urgente: boolean }) {
  if (n === 0) return null;
  return (
    <span className="relative flex shrink-0 group-data-[cerrado]:absolute group-data-[cerrado]:right-1 group-data-[cerrado]:top-0.5">
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-oscuro px-1.5 text-xs font-bold text-white">
        <span className="sr-only">{textos.nav.porAtender(n)}: </span>
        {n}
      </span>
      {urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-crema bg-rosa" />}
    </span>
  );
}

export function Buscar({
  abrir,
  className,
  soloIcono = false,
}: {
  abrir: () => void;
  className?: string;
  soloIcono?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={t.paleta.abrir}
      title={`${t.paleta.abrir} (${t.paleta.atajo})`}
      className={
        className ??
        "flex min-h-11 items-center gap-3 rounded-xl border border-borde bg-superficie px-3 text-texto-2 hover:border-borde-control group-data-[cerrado]:justify-center"
      }
    >
      <Icon nombre="buscar" className="size-5 shrink-0" />
      <span className={`flex-1 text-left group-data-[cerrado]:hidden ${soloIcono ? "hidden" : ""}`}>{t.buscarCorto}</span>
      <kbd className={`rounded-md border border-borde px-1.5 py-0.5 text-xs group-data-[cerrado]:hidden ${soloIcono ? "hidden" : ""}`}>
        {t.paleta.atajo}
      </kbd>
    </button>
  );
}

export function PrimerosPasos({ pasos }: { pasos: NonNullable<DatosMenu["pasos"]> }) {
  return (
    <Link href={pasos.siguiente.href} className="mt-auto flex flex-col gap-2 pt-1 text-teal-oscuro group-data-[cerrado]:hidden">
      <span className="flex items-center justify-between gap-2">
        <span className="-rotate-1 rounded-sm border-2 border-teal-oscuro bg-celeste px-1.5 py-0.5 font-logo text-[10px] tracking-widest uppercase shadow-dura-chica">
          {t.pasos.siguiente}
        </span>
        <span className="font-logo text-sm tabular-nums">{t.pasos.avance(pasos.hechos, pasos.total)}</span>
      </span>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={pasos.total}
        aria-valuenow={pasos.hechos}
        aria-label={t.pasos.titulo}
        className="flex gap-1"
      >
        {Array.from({ length: pasos.total }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full border-2 border-teal-oscuro ${i < pasos.hechos ? "bg-rosa" : "bg-superficie"}`}
          />
        ))}
      </span>
      <span className="text-sm font-bold leading-snug">{pasos.siguiente.titulo} →</span>
    </Link>
  );
}

/** La tarjeta de quien está: al tocarla se abre un menú con Ajustes y Cerrar sesión, así salir nunca es un toque accidental. */
export function TarjetaPerfil({
  perfil,
  soloAvatar = false,
  claro = false,
  botonClass,
  menuClass = "bottom-full left-0 mb-2",
}: {
  perfil: DatosMenu["perfil"];
  soloAvatar?: boolean;
  claro?: boolean;
  botonClass?: string;
  menuClass?: string;
}) {
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
        className={
          botonClass ??
          "flex min-h-12 w-full items-center gap-3 rounded-xl border-2 border-teal-oscuro/15 bg-superficie p-1.5 text-left hover:border-teal-oscuro group-data-[cerrado]:justify-center group-data-[cerrado]:border-transparent"
        }
      >
        {perfil.logo ? (
          <Image src={perfil.logo} alt="" width={80} height={80} className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rosa text-teal-oscuro">
            <Icon nombre="usuario" className="size-5" />
          </span>
        )}
        <span className={`flex min-w-0 flex-1 flex-col leading-tight group-data-[cerrado]:hidden ${soloAvatar ? "hidden" : ""}`}>
          <span className="truncate text-sm font-bold">{perfil.nombre}</span>
          <span className={`text-xs ${claro ? "text-white/70" : "text-texto-2"}`}>{perfil.detalle}</span>
        </span>
        <Icon
          nombre="flecha"
          className={`size-4 shrink-0 group-data-[cerrado]:hidden ${soloAvatar ? "hidden" : ""} ${claro ? "text-white/70" : "text-texto-2"}`}
        />
      </button>
      {abierto && (
        <div role="menu" className={`absolute z-30 w-60 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura ${menuClass}`}>
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
