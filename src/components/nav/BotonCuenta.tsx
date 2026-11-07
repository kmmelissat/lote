"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cerrarSesionDelMarketplace } from "@/features/catalog/actions/cuenta";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { Ventana } from "@/components/ui/Ventana";
import { PanelAcceso } from "@/features/auth/ui/PanelAcceso";
import { rutaSegura } from "@/features/auth/rutaSegura";
import { useCerrarAfuera } from "./useCerrarAfuera";
import { createClient } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const e = textos.explorar.encabezado;

const itemMenu = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-teal-oscuro hover:bg-teal-fondo";

/**
 * "Mi cuenta" del Marketplace. Con sesión lleva a la cuenta; sin sesión abre una ventana para entrar con Google o con
 * el correo y, al terminar, vuelve a la misma página del Marketplace (no a Inicio).
 */
export function BotonCuenta({ className }: { className: string }) {
  const ventana = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const menu = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  useCerrarAfuera(abierto, cerrar, menu);
  // null mientras se averigua: el botón ya se ve y, si se toca, se trata como sin sesión
  const [haySesion, setHaySesion] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHaySesion(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => setHaySesion(!!sesion));
    return () => data.subscription.unsubscribe();
  }, []);

  if (haySesion) {
    return (
      <div ref={menu} className="relative">
        <button type="button" aria-label={e.cuenta} title={e.cuenta} aria-expanded={abierto} aria-haspopup="menu" onClick={() => setAbierto((a) => !a)} className={`${className} hover:bg-teal-fondo`}>
          <Icon nombre="usuario" className="size-6" />
        </button>
        {abierto && (
          <div role="menu" className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col gap-0.5 rounded-2xl border border-teal-oscuro bg-crema p-2 shadow-dura-chica">
            <Link role="menuitem" href="/marketplace/cuenta" onClick={cerrar} className={itemMenu}>
              <Icon nombre="usuario" className="size-5" />
              {e.cuenta}
            </Link>
            <Link role="menuitem" href="/marketplace/pedidos" onClick={cerrar} className={itemMenu}>
              <Icon nombre="pedidos" className="size-5" />
              {e.pedidos}
            </Link>
            <form action={cerrarSesionDelMarketplace}>
              <button type="submit" role="menuitem" className={`${itemMenu} w-full`}>
                <Icon nombre="salir" className="size-5" />
                {textos.nav.cerrarSesion}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button type="button" aria-label={e.cuenta} title={e.cuenta} onClick={() => ventana.current?.showModal()} className={`${className} hover:bg-teal-fondo`}>
        <Icon nombre="usuario" className="size-6" />
      </button>
      <Ventana ref={ventana} titulo={e.entrarTitulo} ayuda={e.entrarAyuda}>
        <div className="relative flex items-center gap-3 rounded-[18px] border border-teal-oscuro bg-limon p-4 pr-24">
          <ul className="flex flex-col gap-1.5 text-sm font-bold text-teal-oscuro">
            {e.entrarBeneficios.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Icon nombre="check" className="mt-0.5 size-4 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <LotitoMas nombre="saluda" className="absolute -top-2 right-3 w-20" />
        </div>
        <PanelAcceso destino={rutaSegura(pathname) ?? "/marketplace"} />
        <p className="text-center text-sm text-texto-2">{e.entrarSinCuenta}</p>
        <p className="text-center text-xs text-texto-2">
          {e.entrarLegal}{" "}
          <Link href="/terminos" className="font-bold underline">
            {e.terminos}
          </Link>{" "}
          {e.y}{" "}
          <Link href="/privacidad" className="font-bold underline">
            {e.privacidad}
          </Link>
          .
        </p>
      </Ventana>
    </>
  );
}
