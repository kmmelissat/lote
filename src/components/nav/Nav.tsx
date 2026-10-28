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
type Vista = (props: Pestana & { activa: boolean }) => ReactNode;

function Enlace({ vista: Vista, ...props }: Pestana & { vista: Vista }) {
  return (
    <Suspense fallback={<Vista {...props} activa={false} />}>
      <EnlaceActivo vista={Vista} {...props} />
    </Suspense>
  );
}

function EnlaceActivo({ vista: Vista, ...props }: Pestana & { vista: Vista }) {
  const pathname = usePathname();
  const activa = pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <Vista {...props} activa={activa} />;
}

// Menú lateral (escritorio)
function EnlaceLateral({ href, etiqueta, icono, activa }: Pestana & { activa: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      title={etiqueta}
      className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 text-base font-medium group-data-[cerrado]:justify-center ${
        activa
          ? "border-borde bg-superficie text-teal-oscuro shadow-sm"
          : "border-transparent text-texto-2 hover:bg-superficie"
      }`}
    >
      <Icon nombre={icono} className="size-6 shrink-0" />
      <span className="group-data-[cerrado]:hidden">{etiqueta}</span>
    </Link>
  );
}

// Barra flotante (móvil): solo íconos, todos del mismo tamaño; la pestaña activa va en círculo teal.
function EnlaceMovil({ href, etiqueta, icono, activa }: Pestana & { activa: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      aria-label={etiqueta}
      className={`flex size-11 items-center justify-center rounded-full transition-colors duration-150 ${
        activa ? "bg-teal text-white" : "text-texto-2 hover:bg-teal-fondo"
      }`}
    >
      <Icon nombre={icono} className="size-5" />
    </Link>
  );
}

function BotonMasMovil() {
  return (
    <Link
      href="/nuevo"
      aria-label={textos.nav.nuevo}
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ambar text-teal-oscuro shadow-md transition-transform duration-150 active:scale-95"
    >
      <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
    </Link>
  );
}

function BotonMasLateral() {
  return (
    <Link
      href="/nuevo"
      aria-label={textos.nav.nuevo}
      title={textos.nav.nuevo}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-base font-medium text-white hover:bg-teal-oscuro"
    >
      <Icon nombre="mas" className="size-6" />
      <span className="group-data-[cerrado]:hidden">{textos.nav.nuevo}</span>
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
      {/* Móvil: barra flotante en píldora, con el botón "+" al centro */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-10 md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border border-borde bg-superficie p-2 shadow-lg">
          {enMovil.slice(0, 2).map((p) => (
            <li key={p.href}><Enlace vista={EnlaceMovil} {...p} /></li>
          ))}
          <li><BotonMasMovil /></li>
          {enMovil.slice(2).map((p) => (
            <li key={p.href}><Enlace vista={EnlaceMovil} {...p} /></li>
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
        <BotonMasLateral />
        <nav aria-label="Principal">
          <ul className="flex flex-col gap-1">
            {pestanas.map((p) => (
              <li key={p.href}><Enlace vista={EnlaceLateral} {...p} /></li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-borde pt-3">
          <Enlace vista={EnlaceLateral} href="/ajustes" etiqueta={textos.nav.ajustes} icono="ajustes" />
          <Suspense fallback={null}>{perfil}</Suspense>
        </div>
      </aside>
    </>
  );
}
