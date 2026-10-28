"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function etiquetaDe(tramo: string) {
  const conocido = textos.migas[tramo];
  if (conocido) return conocido;
  // Un id largo (uuid) no le dice nada a nadie; un código corto como "12" se muestra tal cual.
  return ID.test(tramo) ? textos.nav.detalle : decodeURIComponent(tramo);
}

function Ruta() {
  const pathname = usePathname();
  // En Inicio el ícono de la casa ya es la ruta: no se repite "Inicio / Inicio".
  const tramos = pathname.split("/").filter(Boolean);
  // En las pantallas de primer nivel el menú ya dice dónde estás: las migas empiezan en el segundo nivel.
  if (tramos.length < 2) return null;
  return (
    <ol className="flex min-w-0 items-center gap-2 text-sm">
      <li className="flex">
        <Link href="/inicio" aria-label={textos.nav.inicio} className="flex size-6 items-center justify-center rounded-md text-texto-2 hover:text-teal">
          <Icon nombre="inicio" className="size-5" />
        </Link>
      </li>
      {tramos.map((tramo, i) => {
        const ultimo = i === tramos.length - 1;
        const href = `/${tramos.slice(0, i + 1).join("/")}`;
        return (
          <Fragment key={href}>
            <li aria-hidden="true" className="text-texto-2">/</li>
            <li className="min-w-0 truncate">
              {ultimo ? (
                <span aria-current="page" className="font-medium text-teal">{etiquetaDe(tramo)}</span>
              ) : (
                <Link href={href} className="text-texto-2 hover:text-teal">{etiquetaDe(tramo)}</Link>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export function Migas() {
  return (
    <nav aria-label={textos.nav.migas} className="min-w-0 empty:hidden [&:has(ol)]:mb-4">
      <Suspense fallback={null}>
        <Ruta />
      </Suspense>
    </nav>
  );
}
