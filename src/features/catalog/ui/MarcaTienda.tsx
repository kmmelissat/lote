import Image from "next/image";
import type { ReactNode } from "react";
import { urlFoto } from "@/lib/fotos";
import { storeThemeVars } from "@/lib/temaTienda";
import { textos } from "@/lib/textos";
import { estiloDeMarca } from "../marca";

/** Repinta lo que es teal con el color de la tienda, solo dentro de este contenedor. */
export function MarcaTienda({ color, children, ancha = false }: { color: string | null; children: ReactNode; ancha?: boolean }) {
  // ancha: se sale del ancho del layout (max-w-5xl) hasta 80rem, para que la vitrina no deje tanto espacio a los lados
  return (
    <div
      style={{ ...estiloDeMarca(color), ...storeThemeVars(color) }}
      className={ancha ? "relative left-1/2 w-[min(calc(100vw-2rem),80rem)] -translate-x-1/2" : undefined}
    >
      {children}
    </div>
  );
}

/** El logo de la tienda, o la inicial del nombre sobre el color de marca si no subió uno. */
export function LogoTienda({ logo, nombre, className = "size-14" }: { logo: string | null; nombre: string; className?: string }) {
  return logo ? (
    <span className={`${className} relative block aspect-square shrink-0 overflow-hidden rounded-2xl`}>
      <Image src={urlFoto(logo)} alt={textos.vitrina.logoDe(nombre)} fill sizes="96px" className="object-cover" />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-accion text-2xl font-bold text-accion-texto`}
    >
      {nombre.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}
