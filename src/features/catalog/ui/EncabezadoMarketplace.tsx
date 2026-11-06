"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useRef, useState } from "react";
import { BotonCuenta } from "@/components/nav/BotonCuenta";
import { useCerrarAfuera } from "@/components/nav/useCerrarAfuera";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { conBusqueda, ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { useCarritosTotal } from "../carrito";
import { RUBROS } from "../rubros";

const t = textos.explorar;
const e = t.encabezado;

const accesoBase = "relative inline-flex size-11 items-center justify-center rounded-xl text-teal-oscuro transition-colors";

/**
 * El encabezado del Marketplace: una barra flotante, con vidrio y sombra, que se queda fija al bajar. Logo, buscador con
 * el menú de categorías adentro, y los accesos (cuenta, pedidos, ayuda, favoritos) y el carrito.
 */
export function EncabezadoMarketplace() {
  return <Encabezado />;
}

const claseCampo = "h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-texto-2/70";

/** El campo de búsqueda, con lo que se buscó. Es lo único que lee la dirección, por eso va aparte: así el resto del encabezado sale con la página. */
function CampoBusqueda() {
  const q = useSearchParams().get("q") ?? "";
  return <input key={q} type="search" name="q" defaultValue={q} aria-label={t.buscar} placeholder={t.buscar} className={claseCampo} />;
}

function Encabezado() {
  const carrito = useCarritosTotal();
  const [abierto, setAbierto] = useState(false);
  const [rubro, setRubro] = useState<string>(RUBROS[0].id);
  const caja = useRef<HTMLDivElement>(null);
  const cerrar = useCallback(() => setAbierto(false), []);
  useCerrarAfuera(abierto, cerrar, caja);
  const activo = RUBROS.find((r) => r.id === rubro) ?? RUBROS[0];

  return (
    <header className="sticky top-2 z-40 px-2 pt-2 md:px-6 xl:px-10">
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[22px] border-2 border-teal-oscuro bg-crema px-3 py-2.5 shadow-dura-chica md:flex-nowrap md:gap-x-4 md:px-4">
        <Link href="/" aria-label={textos.nombre} className="shrink-0 pl-1">
          <Logo />
        </Link>

        <div ref={caja} className="order-last w-full md:relative md:order-none md:w-auto md:flex-1">
          <form
            action="/marketplace"
            role="search"
            className="flex h-11 items-center overflow-hidden rounded-full border-2 border-teal-oscuro bg-white focus-within:ring-2 focus-within:ring-accion"
          >
            <button
              type="button"
              aria-expanded={abierto}
              aria-controls="menu-categorias"
              onClick={() => setAbierto((a) => !a)}
              className="inline-flex h-full shrink-0 items-center gap-1.5 border-r-2 border-teal-oscuro px-3 text-sm font-bold text-teal-oscuro transition-colors hover:bg-teal-fondo/50 aria-expanded:bg-teal-fondo/60 md:px-4"
            >
              <Icon nombre="menu" className="size-4 md:hidden" />
              <span className="hidden md:inline">{e.categorias}</span>
              <span className="sr-only md:hidden">{e.categorias}</span>
              <Icon nombre="flecha" className={`size-4 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
            </button>
            <Suspense fallback={<input type="search" name="q" aria-label={t.buscar} placeholder={t.buscar} className={claseCampo} />}>
              <CampoBusqueda />
            </Suspense>
            <button type="submit" aria-label={t.buscarBoton} className="mr-1 inline-flex h-8 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion text-accion-texto transition-transform hover:-translate-y-0.5">
              <Icon nombre="buscar" className="size-5" />
            </button>
          </form>

          {abierto && (
            <div
              id="menu-categorias"
              onClick={(ev) => (ev.target as HTMLElement).closest("a") && cerrar()}
              className="absolute inset-x-0 top-full z-50 mt-3 flex max-h-[70dvh] overflow-hidden rounded-[22px] border-2 border-teal-oscuro bg-white shadow-dura md:inset-x-auto md:left-0 md:w-[44rem]"
            >
              {/* Los rubros a la izquierda; al pasar por uno, a la derecha aparecen sus categorías */}
              <ul className="flex w-full shrink-0 flex-col overflow-y-auto bg-teal-fondo/40 p-2 md:w-60">
                {RUBROS.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={ruta(`/marketplace/categoria/${r.id}`)}
                      onMouseEnter={() => setRubro(r.id)}
                      onFocus={() => setRubro(r.id)}
                      className={`flex min-h-10 items-center justify-between gap-2 rounded-[10px] px-3 text-sm font-semibold ${r.id === activo.id ? "md:bg-white md:shadow-[0_1px_3px_rgba(0,56,68,0.12)]" : "hover:bg-white/70"}`}
                    >
                      {r.nombre}
                      <Icon nombre="flecha" className="hidden size-4 -rotate-90 text-texto-2 md:block" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="hidden min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-5 md:flex">
                <Link href={ruta(`/marketplace/categoria/${activo.id}`)} className="font-logo text-lg font-semibold text-teal-oscuro hover:text-teal">
                  {e.verTodo(activo.nombre)}
                </Link>
                <ul className="grid grid-cols-2 gap-x-4">
                  {activo.categorias.map(([nombre]) => (
                    <li key={nombre}>
                      <Link
                        href={conBusqueda(ruta(`/marketplace/categoria/${activo.id}`), new URLSearchParams({ sub: nombre }))}
                        rel="nofollow"
                        className="block rounded-lg px-2 py-1.5 text-sm text-texto-2 transition-colors hover:bg-crema hover:text-texto"
                      >
                        {nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <nav aria-label={e.cuenta} className="ml-auto flex items-center gap-0.5 md:ml-0">
          <BotonCuenta className={`${accesoBase} inline-flex`} />
          <Link href="/marketplace/pedidos" aria-label={e.pedidos} title={e.pedidos} className={`${accesoBase} hover:bg-teal-fondo`}>
            <Icon nombre="pedidos" className="size-6" />
          </Link>
          <Link href="/ayuda" aria-label={e.ayuda} title={e.ayuda} className={`${accesoBase} hidden hover:bg-teal-fondo sm:inline-flex`}>
            <Icon nombre="ayuda" className="size-6" />
          </Link>
          <span role="img" aria-label={`${e.favoritos}, ${e.pronto}`} title={`${e.favoritos} · ${e.pronto}`} className={`${accesoBase} hidden cursor-not-allowed opacity-40 sm:inline-flex`}>
            <Icon nombre="corazon" className="size-6" />
          </span>
          <Link
            href={carrito.slug ? ruta(`/c/${carrito.slug}/carrito`) : "/marketplace"}
            aria-label={carrito.unidades ? e.carritoCon(carrito.unidades) : e.carrito}
            className="relative ml-1 inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-accion px-3 text-sm font-bold text-accion-texto transition-transform hover:-translate-y-0.5 md:px-4"
          >
            <Icon nombre="carrito" className="size-5" />
            <span className="hidden lg:inline">{e.carrito}</span>
            {carrito.unidades > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-1 text-[11px] font-extrabold tabular-nums text-teal-oscuro">
                {carrito.unidades}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
