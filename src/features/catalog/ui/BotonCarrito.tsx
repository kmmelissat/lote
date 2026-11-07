"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { useCarrito } from "../carrito";

const t = textos.vitrina.carrito;

// En desarrollo, Next pone su insignia redonda arriba a la derecha: el carrito se corre para no quedar tapado.
const EN_DESARROLLO = process.env.NODE_ENV === "development";

/** El carrito de la tienda, siempre a mano arriba a la derecha. Aparece solo cuando hay algo adentro. */
export function BotonCarrito({ slug, enLinea = false }: { slug: string; enLinea?: boolean }) {
  return (
    <Suspense fallback={null}>
      <Boton slug={slug} enLinea={enLinea} />
    </Suspense>
  );
}

function Boton({ slug, enLinea }: { slug: string; enLinea: boolean }) {
  const pathname = usePathname();
  const lineas = useCarrito(slug);
  const unidades = lineas.reduce((n, l) => n + l.cantidad, 0);
  // En la compra del carrito ya está a la vista; en el carrito mismo, la barra de la tienda lo muestra con su contador
  if (pathname?.startsWith(`/c/${slug}/carrito`) && !enLinea) return null;
  // En la portada el carrito va dentro de la barra de arriba, no flotando
  if (!enLinea && (pathname === `/c/${slug}` || new RegExp(`^/c/${slug}/\\d+$`).test(pathname ?? ""))) return null;
  // En la confirmación de un pedido el carrito ya se usó y está vacío
  if (!enLinea && (pathname?.startsWith(`/c/${slug}/apartado`) || pathname?.startsWith(`/c/${slug}/pedido`))) return null;
  return (
    <Link
      href={`/c/${slug}/carrito`}
      aria-label={lineas.length ? t.abrir(lineas.length) : t.abrirVacio}
      className={`${enLinea ? "" : `fixed ${EN_DESARROLLO ? "right-[max(4rem,calc((100vw-80rem)/2+4rem))]" : "right-[max(1rem,calc((100vw-80rem)/2+1rem))]"} top-4 z-30 shadow-dura-chica`} flex h-12 items-center gap-2 rounded-full ${enLinea ? "border border-teal-oscuro/40 bg-superficie" : "border border-teal-oscuro bg-crema"} font-bold ${unidades > 0 ? "pl-4 pr-3" : "px-4"} transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura`}
    >
      <Icon nombre="carrito" className="size-5" />
      {unidades > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-accion text-sm text-accion-texto tabular-nums">{unidades}</span>
      )}
    </Link>
  );
}
