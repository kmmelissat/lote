"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const PANEL = new Set(["inicio", "productos", "pedidos", "clientes", "ganancia", "ajustes", "asistente", "pegar-chat", "mostrador"]);
const SALTAR = new Set(["c", "p"]);
const SIN_MIGAS = new Set(["login", "crear-negocio", "auth", "landing-mas"]);

type Casa = { href: string; etiqueta: string; icono: "inicio" | "tienda" };
type Miga = { href: string; etiqueta: string };

function etiquetaDe(tramo: string) {
  const conocido = textos.migas[tramo];
  if (conocido) return conocido;
  if (ID.test(tramo)) return textos.nav.detalle;
  if (/^\d+$/.test(tramo)) return `#${tramo}`;
  try {
    return decodeURIComponent(tramo);
  } catch {
    return tramo;
  }
}

function armar(pathname: string): { casa: Casa; items: Miga[] } | null {
  if (!pathname || pathname === "/") return null;
  const partes = pathname.split("/").filter(Boolean);
  if (!partes.length || SIN_MIGAS.has(partes[0])) return null;

  const cabeza = partes[0];
  const casa: Casa = PANEL.has(cabeza)
    ? { href: "/inicio", etiqueta: textos.nav.inicio, icono: "inicio" }
    : cabeza === "marketplace" || cabeza === "c"
      ? { href: "/marketplace", etiqueta: textos.nav.explorar, icono: "tienda" }
      : { href: "/", etiqueta: textos.nombre, icono: "inicio" };

  const items: Miga[] = [];
  const acumulado: string[] = [];
  for (const parte of partes) {
    acumulado.push(parte);
    if (SALTAR.has(parte)) continue;
    const href = `/${acumulado.join("/")}`;
    if (href === casa.href) continue;
    items.push({ href, etiqueta: etiquetaDe(parte) });
  }
  return { casa, items };
}

function Pastilla({ children, actual, href }: { children: ReactNode; actual: boolean; href?: string }) {
  const clase = actual
    ? "inline-flex max-w-full items-center gap-1 truncate rounded-full bg-limon px-2.5 py-0.5 text-xs font-extrabold text-teal-oscuro"
    : "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-0.5 text-xs font-bold text-texto-2 hover:bg-crema hover:text-teal-oscuro";
  if (actual || !href) {
    return (
      <span aria-current={actual ? "page" : undefined} className={clase}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={clase}>
      {children}
    </Link>
  );
}

export function Migas({ className = "mb-3" }: { className?: string }) {
  const pathname = usePathname();
  const ruta = armar(pathname);
  if (!ruta) return null;
  const { casa, items } = ruta;
  const casaActual = items.length === 0;

  return (
    <nav aria-label={textos.nav.migas} className={className}>
      <ol className="flex flex-wrap items-center gap-0.5">
        <li>
          <Pastilla actual={casaActual} href={casa.href}>
            <Icon nombre={casa.icono} className="size-3.5 shrink-0" />
            {casa.etiqueta}
          </Pastilla>
        </li>
        {items.map((miga, i) => {
          const actual = i === items.length - 1;
          return (
            <Fragment key={miga.href}>
              <li aria-hidden="true" className="px-0.5 text-xs text-teal-oscuro/30">
                /
              </li>
              <li className="min-w-0">
                <Pastilla actual={actual} href={miga.href}>
                  {miga.etiqueta}
                </Pastilla>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
