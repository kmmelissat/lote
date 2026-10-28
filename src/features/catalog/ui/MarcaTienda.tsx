import Image from "next/image";
import type { ReactNode } from "react";
import { urlFoto } from "@/lib/fotos";
import { estiloDeMarca } from "../marca";

/** Repinta lo que es teal con el color de la tienda, solo dentro de este contenedor. */
export function MarcaTienda({ color, children }: { color: string | null; children: ReactNode }) {
  return <div style={estiloDeMarca(color)}>{children}</div>;
}

/** El logo de la tienda, o la inicial del nombre sobre el color de marca si no subió uno. */
export function LogoTienda({ logo, nombre, className = "size-14" }: { logo: string | null; nombre: string; className?: string }) {
  return logo ? (
    <Image src={urlFoto(logo)} alt="" width={112} height={112} className={`${className} shrink-0 rounded-2xl object-cover`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-teal text-2xl font-bold text-white`}
    >
      {nombre.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}
