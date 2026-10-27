"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

const pestanas: { href: string; etiqueta: string; icono: NombreIcono }[] = [
  { href: "/inicio", etiqueta: textos.nav.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: textos.nav.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: textos.nav.pedidos, icono: "pedidos" },
  { href: "/ganancia", etiqueta: textos.nav.ganancia, icono: "ganancia" },
];

type Pestana = (typeof pestanas)[number];

// En rutas dinámicas (/productos/[codigo]) el pathname solo se conoce en la petición:
// mientras llega, el enlace se ve igual pero sin marcar como activo.
function Enlace(props: Pestana) {
  return (
    <Suspense fallback={<EnlaceVista {...props} activa={false} />}>
      <EnlaceActivo {...props} />
    </Suspense>
  );
}

function EnlaceActivo(props: Pestana) {
  const pathname = usePathname();
  const activa = pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <EnlaceVista {...props} activa={activa} />;
}

function EnlaceVista({ href, etiqueta, icono, activa }: Pestana & { activa: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-xs font-medium md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base ${
        activa
          ? "bg-teal-fondo text-teal md:bg-superficie md:text-teal-oscuro md:shadow-sm"
          : "text-texto-2 hover:bg-teal-fondo md:hover:bg-superficie"
      }`}
    >
      <Icon nombre={icono} className="size-6" />
      {etiqueta}
    </Link>
  );
}

function BotonMas() {
  return (
    <Link
      href="/nuevo"
      aria-label={textos.nav.nuevo}
      className="-mt-6 flex size-14 items-center justify-center rounded-full bg-teal text-white shadow-md hover:bg-teal-oscuro md:mt-0 md:h-12 md:w-full md:gap-2 md:text-base md:font-medium"
    >
      <Icon nombre="mas" className="size-7" />
      <span className="hidden md:inline">{textos.nav.nuevo}</span>
    </Link>
  );
}

export function Nav() {
  return (
    <>
      {/* Móvil: barra inferior con el botón "+" al centro */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
          <li><Enlace {...pestanas[0]} /></li>
          <li><Enlace {...pestanas[1]} /></li>
          <li className="flex justify-center"><BotonMas /></li>
          <li><Enlace {...pestanas[2]} /></li>
          <li><Enlace {...pestanas[3]} /></li>
        </ul>
      </nav>

      {/* Escritorio: menú lateral */}
      <nav
        aria-label="Principal"
        className="hidden w-60 shrink-0 flex-col gap-2 p-4 md:flex"
      >
        <Logo className="px-4 pb-4" />
        <BotonMas />
        <ul className="mt-2 flex flex-col gap-1">
          {pestanas.map((p) => (
            <li key={p.href}><Enlace {...p} /></li>
          ))}
        </ul>
        <div className="mt-auto">
          <Enlace href="/ajustes" etiqueta={textos.nav.ajustes} icono="ajustes" />
        </div>
      </nav>
    </>
  );
}
