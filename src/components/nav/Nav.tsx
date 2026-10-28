"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { textos } from "@/lib/textos";
import { ACCIONES, escribiendoEnCampo } from "./acciones";
import { Paleta } from "./Paleta";

const t = textos.nav;

/** Lo que el servidor le cuenta al menú: el contador de Pedidos, el avance de los primeros pasos y quién está. */
export type DatosMenu = {
  porAtender: number;
  urgente: boolean;
  /** Cuántos primeros pasos hay hechos y cuántos son; null si ya terminó todo o no le toca configurar */
  pasos: { hechos: number; total: number; siguiente: { titulo: string; href: string } } | null;
  slug: string;
  perfil: { nombre: string; detalle: string; logo: string | null };
};

type Pestana = { href: string; etiqueta: string; icono: NombreIcono };

const pestanas: Pestana[] = [
  { href: "/inicio", etiqueta: t.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: t.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: t.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: t.clientes, icono: "clientes" },
  { href: "/ganancia", etiqueta: t.ganancia, icono: "ganancia" },
  { href: "/asistente", etiqueta: t.asistente, icono: "chat" },
];

const CLAVE_CERRADO = "lote_menu_cerrado";
const EVENTO_MENU = "lote-menu";

const suscribirMenu = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO_MENU, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO_MENU, aviso);
  };
};
const menuCerrado = () => {
  try {
    return localStorage.getItem(CLAVE_CERRADO) === "1";
  } catch {
    return false;
  }
};

const activaEn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

// En rutas dinámicas el pathname solo se conoce en la petición: mientras llega, el enlace se ve igual pero sin marcar.
function ConRuta({ hijos }: { hijos: (pathname: string | null) => ReactNode }) {
  return (
    <Suspense fallback={hijos(null)}>
      <ConRutaActiva hijos={hijos} />
    </Suspense>
  );
}
function ConRutaActiva({ hijos }: { hijos: (pathname: string | null) => ReactNode }) {
  return <>{hijos(usePathname())}</>;
}

/** Cierra lo que esté abierto al tocar afuera o apretar Escape. */
function useCerrarAfuera(abierto: boolean, cerrar: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      // Si el elemento no se ve (el menú de escritorio en el celular), no es de él cerrar.
      if (ref.current && ref.current.offsetParent !== null && !ref.current.contains(e.target as Node)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", afuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", afuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto, cerrar, ref]);
}

function Insignia({ n, urgente }: { n: number; urgente: boolean }) {
  if (n === 0) return null;
  return (
    <span className="relative flex shrink-0 group-data-[cerrado]:absolute group-data-[cerrado]:right-1 group-data-[cerrado]:top-0.5">
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-oscuro px-1.5 text-xs font-bold text-white">
        <span className="sr-only">{textos.nav.porAtender(n)}: </span>
        {n}
      </span>
      {urgente && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-crema bg-mango" />
      )}
    </span>
  );
}

function EnlaceLateral({
  pestana,
  pathname,
  insignia,
}: {
  pestana: Pestana;
  pathname: string | null;
  insignia?: ReactNode;
}) {
  const activa = pathname !== null && activaEn(pathname, pestana.href);
  return (
    <Link
      href={pestana.href}
      aria-current={activa ? "page" : undefined}
      title={pestana.etiqueta}
      className={`group/item relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-base transition-colors duration-150 group-data-[cerrado]:justify-center ${
        activa ? "bg-teal-fondo font-bold text-teal-oscuro" : "font-medium text-texto-2 hover:bg-white/70 hover:text-teal-oscuro"
      }`}
    >
      {activa && <span aria-hidden="true" className="absolute -left-3.5 top-2 h-7 w-1.5 rounded-r-full bg-mango" />}
      <Icon nombre={pestana.icono} className="size-6 shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5" />
      <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">{pestana.etiqueta}</span>
      {insignia}
    </Link>
  );
}

function Vitrina({ slug }: { slug: string }) {
  const { avisar } = useToast();
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`);
      avisar(t.enlaceCopiado, { tipo: "exito" });
    } catch {
      avisar(t.enlaceNoCopiado, { tipo: "error" });
    }
  };
  return (
    <div className="flex items-center gap-1 group-data-[cerrado]:flex-col">
      <Link
        href={`/c/${slug}`}
        target="_blank"
        title={t.verVitrina}
        className="group/item flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 font-medium text-texto-2 transition-colors duration-150 hover:bg-white/70 hover:text-teal-oscuro group-data-[cerrado]:flex-none group-data-[cerrado]:justify-center"
      >
        <Icon nombre="tienda" className="size-6 shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5" />
        <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">{t.vitrina}</span>
        <Icon nombre="enlace" className="size-4 shrink-0 group-data-[cerrado]:hidden" />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </Link>
      <button
        type="button"
        onClick={copiar}
        aria-label={t.copiarEnlace}
        title={t.copiarEnlace}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-white/70 hover:text-teal-oscuro"
      >
        <Icon nombre="copiar" className="size-4" />
      </button>
    </div>
  );
}

function ListaAcciones({ alElegir }: { alElegir: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {ACCIONES.map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            onClick={alElegir}
            className="flex min-h-11 items-center gap-3 rounded-xl px-2 font-medium hover:bg-teal-fondo"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-teal-oscuro text-teal-oscuro ${a.tono}`}>
              <Icon nombre={a.icono} className="size-4" />
            </span>
            {a.etiqueta}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** El botón principal del menú: abre las cosas que se hacen más seguido. Atajo: la tecla N. */
function AccionRapida({ abierta, alternar }: { abierta: boolean; alternar: (abrir?: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useCerrarAfuera(abierta, () => alternar(false), ref);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => alternar()}
        aria-expanded={abierta}
        aria-haspopup="menu"
        title={`${t.rapida.titulo} (${t.rapida.atajo})`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-teal-oscuro bg-mango text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
        <span className="group-data-[cerrado]:hidden">{t.rapida.titulo}</span>
        <kbd className="rounded-md border border-teal-oscuro/40 bg-white/50 px-1.5 text-xs group-data-[cerrado]:hidden">{t.rapida.atajo}</kbd>
      </button>
      {abierta && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura">
          <ListaAcciones alElegir={() => alternar(false)} />
        </div>
      )}
    </div>
  );
}

function Buscar({ abrir }: { abrir: () => void }) {
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={t.paleta.abrir}
      title={`${t.paleta.abrir} (${t.paleta.atajo})`}
      className="flex min-h-11 items-center gap-3 rounded-xl border border-borde bg-superficie px-3 text-texto-2 hover:border-borde-control group-data-[cerrado]:justify-center"
    >
      <Icon nombre="buscar" className="size-5 shrink-0" />
      <span className="flex-1 text-left group-data-[cerrado]:hidden">{t.buscarCorto}</span>
      <kbd className="rounded-md border border-borde px-1.5 py-0.5 text-xs group-data-[cerrado]:hidden">{t.paleta.atajo}</kbd>
    </button>
  );
}

function PrimerosPasos({ pasos }: { pasos: NonNullable<DatosMenu["pasos"]> }) {
  return (
    <Link
      href={pasos.siguiente.href}
      className="relative mt-auto flex flex-col gap-2 overflow-hidden rounded-2xl border-2 border-teal-oscuro bg-limon p-3 text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica group-data-[cerrado]:hidden"
    >
      <Gorila className="absolute -right-1 -top-1 size-12 rotate-6 text-rosa" />
      <span className="text-sm font-bold">
        {t.pasos.titulo} · {t.pasos.avance(pasos.hechos, pasos.total)}
      </span>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={pasos.total}
        aria-valuenow={pasos.hechos}
        aria-label={t.pasos.titulo}
        className="h-2.5 w-3/4 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
      >
        <span className="block h-full bg-mango" style={{ width: `${(pasos.hechos / pasos.total) * 100}%` }} />
      </span>
      <span className="text-sm">
        {t.pasos.siguiente}: {pasos.siguiente.titulo} →
      </span>
    </Link>
  );
}

/** La tarjeta de quien está: al tocarla se abre un menú con Ajustes y Cerrar sesión, así salir nunca es un toque accidental. */
function TarjetaPerfil({ perfil }: { perfil: DatosMenu["perfil"] }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useCerrarAfuera(abierto, () => setAbierto(false), ref);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={t.menuPerfil}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border-2 border-teal-oscuro/15 bg-superficie p-1.5 text-left hover:border-teal-oscuro group-data-[cerrado]:justify-center group-data-[cerrado]:border-transparent"
      >
        {perfil.logo ? (
          <Image src={perfil.logo} alt="" width={80} height={80} className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rosa text-teal-oscuro">
            <Icon nombre="usuario" className="size-5" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[cerrado]:hidden">
          <span className="truncate text-sm font-bold">{perfil.nombre}</span>
          <span className="text-xs text-texto-2">{perfil.detalle}</span>
        </span>
        <Icon nombre="flecha" className="size-4 shrink-0 text-texto-2 group-data-[cerrado]:hidden" />
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-60 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura"
        >
          <Link
            href="/ajustes"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium hover:bg-teal-fondo"
          >
            <Icon nombre="ajustes" className="size-5 shrink-0" />
            {t.ajustes}
          </Link>
          <CerrarSesion variante="menu" />
        </div>
      )}
    </div>
  );
}

// Hoja desde abajo (móvil): sirve para la acción rápida y para "Más".
function Hoja({ titulo, cerrar, children }: { titulo: string; cerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [cerrar]);
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-teal-oscuro/40 md:hidden" onClick={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] border-2 border-b-0 border-teal-oscuro bg-crema p-4 pb-8"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label={t.cerrar}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/70"
          >
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BarraMovil({ datos, rapida, abrirRapida, masAbierto, abrirMas }: {
  datos: DatosMenu;
  rapida: boolean;
  abrirRapida: () => void;
  masAbierto: boolean;
  abrirMas: () => void;
}) {
  const enlace = (p: Pestana, pathname: string | null) => {
    const activa = pathname !== null && activaEn(pathname, p.href);
    return (
      <Link
        href={p.href}
        aria-current={activa ? "page" : undefined}
        aria-label={p.etiqueta}
        className={`relative flex size-11 items-center justify-center rounded-full transition-colors duration-150 ${
          activa ? "bg-teal-fondo text-teal-oscuro ring-2 ring-teal-oscuro" : "text-texto-2 hover:bg-teal-fondo"
        }`}
      >
        <Icon nombre={p.icono} className="size-5" />
        {p.href === "/pedidos" && datos.porAtender > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-oscuro px-1 text-[10px] font-bold text-white">
            <span className="sr-only">{t.porAtender(datos.porAtender)}: </span>
            {datos.porAtender}
            {datos.urgente && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-superficie bg-mango" />}
          </span>
        )}
      </Link>
    );
  };
  return (
    <nav aria-label="Principal" className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 md:hidden">
      <ConRuta
        hijos={(pathname) => (
          <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border-2 border-teal-oscuro bg-superficie p-2 shadow-dura-chica">
            <li>{enlace(pestanas[0], pathname)}</li>
            <li>{enlace(pestanas[1], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirRapida}
                aria-label={t.rapida.titulo}
                aria-expanded={rapida}
                className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango text-teal-oscuro shadow-dura-chica transition-transform duration-150 active:scale-95"
              >
                <Icon nombre="mas" className="size-7" strokeWidth={2.25} />
              </button>
            </li>
            <li>{enlace(pestanas[2], pathname)}</li>
            <li>
              <button
                type="button"
                onClick={abrirMas}
                aria-label={t.mas}
                aria-expanded={masAbierto}
                className="flex size-11 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo"
              >
                <Icon nombre="mas_opciones" className="size-5" />
              </button>
            </li>
          </ul>
        )}
      />
    </nav>
  );
}

export function Nav({ datos }: { datos: DatosMenu }) {
  const pathname = usePathname();
  const [paleta, setPaleta] = useState(false);
  const [rapida, setRapida] = useState(false);
  const [mas, setMas] = useState(false);

  // El menú recuerda si lo dejaste cerrado. El servidor lo dibuja abierto y el navegador lo ajusta al hidratar.
  const cerrado = useSyncExternalStore(suscribirMenu, menuCerrado, () => false);
  const alternarMenu = () => {
    try {
      localStorage.setItem(CLAVE_CERRADO, cerrado ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(EVENTO_MENU));
  };

  // Al cambiar de pantalla se cierra lo que haya quedado abierto.
  const [rutaVista, setRutaVista] = useState(pathname);
  if (rutaVista !== pathname) {
    setRutaVista(pathname);
    setMas(false);
    setRapida(false);
  }

  // Atajos: ⌘K / Ctrl+K abre el buscador y N la acción rápida (salvo que estés escribiendo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta((p) => !p);
      } else if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !escribiendoEnCampo(e.target)) {
        e.preventDefault();
        setRapida((r) => !r);
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  const insignia = <Insignia n={datos.porAtender} urgente={datos.urgente} />;

  return (
    <>
      <BarraMovil
        datos={datos}
        rapida={rapida}
        abrirRapida={() => setRapida(true)}
        masAbierto={mas}
        abrirMas={() => setMas(true)}
      />
      {rapida && (
        <Hoja titulo={t.rapida.titulo} cerrar={() => setRapida(false)}>
          <ListaAcciones alElegir={() => setRapida(false)} />
        </Hoja>
      )}
      {mas && (
        <Hoja titulo={t.masTitulo} cerrar={() => setMas(false)}>
          <ul className="flex flex-col gap-1">
            {[pestanas[3], pestanas[4], pestanas[5], { href: "/ajustes", etiqueta: t.ajustes, icono: "ajustes" as const }].map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="flex min-h-12 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70">
                  <Icon nombre={p.icono} className="size-6 shrink-0 text-teal" />
                  {p.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/c/${datos.slug}`} target="_blank" className="flex min-h-12 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70">
                <Icon nombre="tienda" className="size-6 shrink-0 text-teal" />
                {t.vitrina}
                <Icon nombre="enlace" className="size-4 text-texto-2" />
              </Link>
            </li>
            <li>
              <CerrarSesion variante="menu" />
            </li>
          </ul>
        </Hoja>
      )}

      {paleta && <Paleta cerrar={() => setPaleta(false)} />}

      {/* Escritorio: menú flotante color crema, con borde y sombra dura, que se cierra a una tira de íconos */}
      <aside
        data-cerrado={cerrado ? "" : undefined}
        className={`group sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-crema p-3 shadow-dura-chica transition-[width] duration-200 md:flex ${
          cerrado ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
          <Link href="/inicio" aria-label={textos.nombre} className="px-1">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={alternarMenu}
            aria-expanded={!cerrado}
            aria-label={cerrado ? t.abrirMenu : t.cerrarMenu}
            title={cerrado ? t.abrirMenu : t.cerrarMenu}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-white/70 hover:text-teal-oscuro"
          >
            <Icon nombre="panel" className="size-5" />
          </button>
        </div>
        <Buscar abrir={() => setPaleta(true)} />
        <AccionRapida abierta={rapida} alternar={(abrir) => setRapida((r) => abrir ?? !r)} />
        <nav aria-label="Principal">
          <ConRuta
            hijos={(ruta) => (
              <ul className="flex flex-col gap-1">
                {pestanas.map((p) => (
                  <li key={p.href}>
                    <EnlaceLateral pestana={p} pathname={ruta} insignia={p.href === "/pedidos" ? insignia : undefined} />
                  </li>
                ))}
                <li>
                  <Vitrina slug={datos.slug} />
                </li>
              </ul>
            )}
          />
        </nav>
        {datos.pasos ? <PrimerosPasos pasos={datos.pasos} /> : <div className="mt-auto" />}
        <div className="flex flex-col gap-1 border-t-2 border-teal-oscuro/15 pt-3">
          <ConRuta
            hijos={(ruta) => (
              <EnlaceLateral pestana={{ href: "/ajustes", etiqueta: t.ajustes, icono: "ajustes" }} pathname={ruta} />
            )}
          />
          <TarjetaPerfil perfil={datos.perfil} />
        </div>
      </aside>
    </>
  );
}
