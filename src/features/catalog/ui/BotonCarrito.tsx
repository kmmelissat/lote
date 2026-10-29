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
export function BotonCarrito({ slug }: { slug: string }) {
  return (
    <Suspense fallback={null}>
      <Boton slug={slug} />
    </Suspense>
  );
}

function Boton({ slug }: { slug: string }) {
  const pathname = usePathname();
  const lineas = useCarrito(slug);
  const unidades = lineas.reduce((n, l) => n + l.cantidad, 0);
  // En el carrito y en su compra ya está a la vista
  if (pathname?.startsWith(`/c/${slug}/carrito`)) return null;
  // En la confirmación de un pedido el carrito ya se usó y está vacío
  if (pathname?.startsWith(`/c/${slug}/apartado`)) return null;
  return (
    <Link
      href={`/c/${slug}/carrito`}
      aria-label={lineas.length ? t.abrir(lineas.length) : t.abrirVacio}
      className={`fixed ${EN_DESARROLLO ? "right-16" : "right-4"} top-4 z-30 flex h-12 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-crema font-bold ${unidades > 0 ? "pl-4 pr-3" : "px-4"} shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura`}
    >
      <Icon nombre="carrito" className="size-5" />
      {unidades > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-accion text-sm text-accion-texto tabular-nums">{unidades}</span>
      )}
    </Link>
  );
}
