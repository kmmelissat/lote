"use client";

import { estiloBoton } from "@/components/ui/Button";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { cerrarSesion } from "../actions/sesion";

function Boton({ clase, soloIcono }: { clase: string; soloIcono: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} title={textos.nav.cerrarSesion} className={clase}>
      <Icon nombre="salir" className="size-5 shrink-0" />
      <span className={soloIcono ? "group-data-[cerrado]:hidden" : undefined}>
        {pending ? textos.nav.cerrandoSesion : textos.nav.cerrarSesion}
      </span>
    </button>
  );
}

/**
 * Botón de cerrar sesión. `lateral` es el del menú (se queda en el ícono cuando el menú se cierra);
 * `completo` es el de Ajustes, a todo el ancho.
 */
export function CerrarSesion({ variante }: { variante: "lateral" | "completo" | "menu" }) {
  const lateral = variante === "lateral";
  return (
    <form action={cerrarSesion}>
      <Boton
        soloIcono={lateral}
        clase={
          variante === "menu"
            ? "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-medium text-error hover:bg-error-fondo"
            : lateral
            ? "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-texto-2 hover:bg-superficie hover:text-error group-data-[cerrado]:justify-center"
            : `${estiloBoton("secundario")} text-error!`
        }
      />
    </form>
  );
}
