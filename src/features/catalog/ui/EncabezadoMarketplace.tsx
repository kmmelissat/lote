"use client";

import Link from "next/link";
import { BotonCuenta } from "@/components/nav/BotonCuenta";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { useCarritosTotal } from "../carrito";
import { RUTA_TIENDAS } from "../explorar";
import { BuscadorAutocompletar } from "./BuscadorAutocompletar";
import { MenuCategorias } from "./MenuCategorias";

const t = textos.explorar;
const e = t.encabezado;

const accesoBase = "relative inline-flex size-11 items-center justify-center rounded-xl text-teal-oscuro transition-colors";

/**
 * El encabezado del Marketplace: una barra flotante, con vidrio y sombra, que se queda fija al bajar. Logo, botón de categorías,
 * buscador, favoritos, cuenta y carrito.
 */
export function EncabezadoMarketplace() {
  return <Encabezado />;
}

function Encabezado() {
  const carrito = useCarritosTotal();
  return (
    <header className="sticky top-2 z-40 px-2 pt-2 max-md:top-0 max-md:bg-fondo max-md:px-4 max-md:pb-1 max-md:pt-1 md:px-6 xl:px-10">
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[22px] border border-teal-oscuro bg-crema px-3 py-2.5 shadow-dura-chica max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none md:flex-nowrap md:gap-x-4 md:px-4">
        <Link href="/" aria-label={textos.nombre} className="inline-flex min-h-11 shrink-0 items-center pl-1 max-md:order-1 max-md:pl-0">
          <Logo />
        </Link>

        <MenuCategorias />

        <BuscadorAutocompletar />

        <nav aria-label={e.cuenta} className="flex items-center gap-0.5 max-md:order-2 max-md:ml-auto">
          <span role="img" aria-label={`${e.favoritos}, ${e.pronto}`} title={`${e.favoritos} · ${e.pronto}`} className={`${accesoBase} cursor-not-allowed opacity-40 max-md:opacity-100`}>
            <Icon nombre="corazon" className="size-6" />
          </span>
          <BotonCuenta className={`${accesoBase} inline-flex hover:bg-teal-fondo max-md:hidden`} />
          <Link
            href={carrito.slug ? ruta(`/c/${carrito.slug}/carrito`) : "/marketplace"}
            aria-label={carrito.unidades ? e.carritoCon(carrito.unidades) : e.carrito}
            className="relative ml-1 inline-flex size-11 items-center justify-center gap-2 rounded-full border border-teal-oscuro bg-accion text-sm font-bold text-accion-texto transition-transform hover:-translate-y-0.5 md:w-auto md:px-4"
          >
            <Icon nombre="carrito" className="size-5" />
            <span className="hidden lg:inline">{e.carrito}</span>
            {carrito.unidades > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border border-teal-oscuro bg-white px-1 text-[11px] font-extrabold tabular-nums text-teal-oscuro">
                {carrito.unidades}
              </span>
            )}
          </Link>
        </nav>

        {/* Celular, fila 3: "Categorías" (a la izquierda, en MenuCategorias) y el acceso a todas las tiendas */}
        <Link href={RUTA_TIENDAS} className="ml-auto inline-flex h-11 items-center text-sm font-semibold text-teal-oscuro underline-offset-4 hover:underline max-md:order-5 md:hidden">
          {t.barraCategorias.todasLasTiendas}
        </Link>
      </div>
    </header>
  );
}
