"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

// En móvil caben cuatro pestañas y el "+": las `soloEscritorio` se alcanzan desde otra pantalla (Pedidos e Inicio).
const pestanas: { href: string; etiqueta: string; icono: NombreIcono; soloEscritorio?: boolean }[] = [
  { href: "/inicio", etiqueta: textos.nav.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: textos.nav.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: textos.nav.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: textos.nav.clientes, icono: "clientes", soloEscritorio: true },
  { href: "/ganancia", etiqueta: textos.nav.ganancia, icono: "ganancia" },
];

type Pestana = (typeof pestanas)[number];

const enMovil = pestanas.filter((p) => !p.soloEscritorio);

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
      title={etiqueta}
      className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-xs font-medium md:flex-row md:justify-start md:gap-3 md:px-3 md:text-base md:group-data-[cerrado]:justify-center ${
        activa
          ? "bg-teal-fondo text-teal md:border md:border-borde md:bg-superficie md:text-teal-oscuro md:shadow-sm"
          : "text-texto-2 hover:bg-teal-fondo md:border md:border-transparent md:hover:bg-superficie"
      }`}
    >
      <Icon nombre={icono} className="size-6 shrink-0" />
      <span className="md:group-data-[cerrado]:hidden">{etiqueta}</span>
    </Link>
  );
}

function BotonMas() {
  return (
    <Link
      href="/nuevo"
      aria-label={textos.nav.nuevo}
      title={textos.nav.nuevo}
      className="-mt-6 flex size-14 items-center justify-center rounded-full bg-teal text-white shadow-md hover:bg-teal-oscuro md:mt-0 md:h-12 md:w-full md:gap-2 md:rounded-xl md:text-base md:font-medium md:shadow-none"
    >
      <Icon nombre="mas" className="size-7" />
      <span className="hidden md:inline md:group-data-[cerrado]:hidden">{textos.nav.nuevo}</span>
    </Link>
  );
}

function Buscar() {
  return (
    <Link
      href="/productos"
      aria-label={textos.nav.buscar}
      title={textos.nav.buscar}
      className="flex min-h-11 items-center gap-3 rounded-xl border border-borde bg-superficie px-3 text-texto-2 hover:border-borde-control group-data-[cerrado]:justify-center"
    >
      <Icon nombre="buscar" className="size-5 shrink-0" />
      <span className="group-data-[cerrado]:hidden">{textos.nav.buscarCorto}</span>
    </Link>
  );
}

export function Nav({ perfil }: { perfil: ReactNode }) {
  const [cerrado, setCerrado] = useState(false);
  return (
    <>
      {/* Móvil: barra inferior con el botón "+" al centro */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
          {enMovil.slice(0, 2).map((p) => (
            <li key={p.href}><Enlace {...p} /></li>
          ))}
          <li className="flex justify-center"><BotonMas /></li>
          {enMovil.slice(2).map((p) => (
            <li key={p.href}><Enlace {...p} /></li>
          ))}
        </ul>
      </nav>

      {/* Escritorio: menú flotante que se cierra a una tira de íconos */}
      <aside
        data-cerrado={cerrado ? "" : undefined}
        className={`group sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col gap-3 rounded-2xl border border-borde bg-fondo p-3 shadow-sm transition-[width] duration-200 md:flex ${
          cerrado ? "w-[4.5rem]" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
          <Link href="/inicio" aria-label={textos.nombre} className="px-1">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setCerrado((c) => !c)}
            aria-expanded={!cerrado}
            aria-label={cerrado ? textos.nav.abrirMenu : textos.nav.cerrarMenu}
            title={cerrado ? textos.nav.abrirMenu : textos.nav.cerrarMenu}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-superficie hover:text-teal-oscuro"
          >
            <Icon nombre="panel" className="size-5" />
          </button>
        </div>
        <Buscar />
        <BotonMas />
        <nav aria-label="Principal">
          <ul className="flex flex-col gap-1">
            {pestanas.map((p) => (
              <li key={p.href}><Enlace {...p} /></li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-borde pt-3">
          <Enlace href="/ajustes" etiqueta={textos.nav.ajustes} icono="ajustes" />
          <Suspense fallback={null}>{perfil}</Suspense>
        </div>
      </aside>
    </>
  );
}
